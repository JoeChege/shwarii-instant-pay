# USSD Callback Issues - Diagnostics & Solutions

## Issues Identified

Based on the callback showing **"Events: N/A"** and receiving requests at the ngrok URL, here are the issues:

### 1. **❌ CRITICAL: Backend Endpoint Mismatch**
- **Current Setup**: Server listens on `/ussd` (POST)
- **Problem**: The callback URL shows root path `/` (https://d1ad-105-165-175-169.ngrok-free.app/)
- **Expected**: Callback URL should be `https://d1ad-105-165-175-169.ngrok-free.app/ussd`

**Fix**: Update your Africa's Talking configuration to use the correct callback URL with `/ussd` endpoint.

---

### 2. **❌ Insufficient Error Handling & Logging**
The USSD handler has generic error responses that don't provide visibility:
```rust
// Current: Returns generic message
"END Service temporarily unavailable. Please try again."

// Problem: No detailed logging of what went wrong
```

**Why this is an issue**:
- Silent failures in Paystack integration
- No visibility into request parsing issues
- Can't diagnose network/auth problems

---

### 3. **⚠️ Missing Content-Type Validation**
The handler expects form data:
```rust
Form(req): Form<UssdRequest>
```

**Potential Issues**:
- Africa's Talking might not be sending `Content-Type: application/x-www-form-urlencoded`
- POST body might be JSON instead of form data
- Missing or extra fields could cause deserialization failures

---

### 4. **⚠️ Environment Variable Loading**
```rust
// In main.rs
let config = Config::from_env();
```

**Potential Issues**:
- `.env` file might not be loaded when deployed
- `PAYSTACK_SECRET_KEY` might not be set in production
- Falls back to hardcoded defaults without clear error messages

**Check on Server**:
```bash
# SSH to server and verify
ssh root@34.122.249.119
env | grep PAYSTACK
echo $PAYSTACK_SECRET_KEY
```

---

### 5. **⚠️ No Request/Response Logging**
The handler logs incoming requests but:
- No logging of response sent back
- No logging of errors from Paystack
- Difficult to trace complete flow

---

### 6. **⚠️ Phone Number Normalization Issue**
```rust
pub fn normalize_phone(phone: &str) -> String {
    // Removes leading 0 or +254
    // But doesn't validate format
}
```

**Potential Issue**: Invalid phone numbers might still pass through silently.

---

## Recommended Fixes (Priority Order)

### Priority 1: Fix Callback URL
- [ ] In Africa's Talking Dashboard: Set callback URL to `https://d1ad-105-165-175-169.ngrok-free.app/ussd`
- [ ] Verify exact field name (might be "Callback URL", "Webhook URL", or similar)

### Priority 2: Add Detailed Logging
Add request/response logging to diagnose what's happening:
```rust
// In ussd_handler
info!("📨 Received USSD request: {:?}", req);
let response = "...";
info!("📤 Sending response: {}", response);
```

### Priority 3: Add Content-Type Logging
Log the actual content being received:
```rust
// Add to main.rs dependencies
// Then log request body before parsing
```

### Priority 4: Verify Server Environment
```bash
# Check Paystack key is set
ssh root@34.122.249.119
systemctl status ussd-paystack
journalctl -u ussd-paystack -n 50 -f  # Follow logs
```

### Priority 5: Add Request Validation
```rust
// Add validation for required fields
// Return specific error for missing fields
```

---

## Quick Diagnostic Steps

### Step 1: Test Health Endpoint
```bash
curl -v https://d1ad-105-165-175-169.ngrok-free.app/health
# Should return: 200 OK
```

### Step 2: Test USSD Endpoint Locally
```bash
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=TYP"
```

### Step 3: Check ngrok Logs
```bash
# Monitor ngrok tunnel in real-time
# Watch for requests and errors
```

### Step 4: Enable Debug Logging
```bash
# In .env
RUST_LOG=debug

# Then restart server
```

---

## Expected Flow

```
User dials: *384*69220#
    ↓
Africa's Talking USSD Gateway
    ↓
POST to: https://d1ad-105-165-175-169.ngrok-free.app/ussd
    ↓
Your Backend (localhost:3000/ussd)
    ↓
Parse form data
    ↓
Normalize phone number
    ↓
Call Paystack API (charge_mpesa)
    ↓
Send STK push to user
    ↓
Return USSD response
    ↓
User sees: "Payment of KES 500 requested..."
```

---

## Africa's Talking Configuration Check

Make sure your Africa's Talking dashboard has:
1. ✅ Callback URL set to: `https://d1ad-105-165-175-169.ngrok-free.app/ussd`
2. ✅ Content-Type: `application/x-www-form-urlencoded`
3. ✅ Correct USSD code: `384*69220`
4. ✅ Shortcode activated on test network

---

## Common Error Messages to Look For

| Error | Cause | Solution |
|-------|-------|----------|
| `Service temporarily unavailable` | Paystack API error | Check PAYSTACK_SECRET_KEY |
| `Failed to bind to port 3000` | Port already in use | Kill process on port 3000 |
| `PAYSTACK_SECRET_KEY not set` | Missing env var | Set in .env or systemd service |
| `Network error: connection refused` | Paystack API unreachable | Check internet connection |
| `Failed to parse response` | Invalid response format | Check Paystack API response |

---

## Next Steps

1. **Verify callback URL** in Africa's Talking dashboard (this is most likely the issue)
2. **Test health endpoint** to confirm server is accessible
3. **Enable debug logging** to see full request/response
4. **Check Paystack secret key** on server
5. **Test locally first** before using ngrok tunnel

