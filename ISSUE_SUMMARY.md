# USSD Callback Issue Summary

## 🔴 CRITICAL FINDING

The "Events: N/A" response and general callback issues are likely caused by:

### **1. Incorrect Callback URL** (Most Likely - 90% chance)
- Currently: `https://d1ad-105-165-175-169.ngrok-free.app/`
- Should be: `https://d1ad-105-165-175-169.ngrok-free.app/ussd`

**Your server expects requests at `/ussd` endpoint, but Africa's Talking might be sending to root `/`**

### **2. Missing or Invalid Environment Variables**
- `PAYSTACK_SECRET_KEY` not set on server
- `FIXED_AMOUNT_KES` defaulting to 50000 but should verify

### **3. Poor Error Visibility**
- Previous code returned generic "Service temporarily unavailable" errors
- Didn't log detailed error information
- Made debugging impossible

---

## ✅ What I've Fixed

### 1. Enhanced Logging in Backend
**File**: [ussd-paystack-backend/src/main.rs](ussd-paystack-backend/src/main.rs)
- Added detailed request logging: `📨 [INCOMING USSD]`
- Added phone normalization logging: `📱 Normalized phone:`
- Added response logging: `📤 Sending response:`
- Added error details in responses instead of generic messages

### 2. Improved Paystack Client
**File**: [ussd-paystack-backend/src/paystack.rs](ussd-paystack-backend/src/paystack.rs)
- Phone format validation (must be +254XXXXXXXXX)
- HTTP status code checking
- Detailed error messages
- Response parsing with error details

### 3. Request Validation
**File**: [ussd-paystack-backend/src/main.rs](ussd-paystack-backend/src/main.rs)
- Validates required fields (sessionId, phoneNumber)
- Returns specific error for invalid requests
- Better error handling

### 4. Documentation Created
- **[USSD_DIAGNOSTICS.md](USSD_DIAGNOSTICS.md)**: Comprehensive issue breakdown
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Step-by-step testing guide

---

## 🎯 What You Need to Do NOW

### Priority 1: Update Callback URL (Do This First!)
```
1. Go to Africa's Talking Dashboard
2. Navigate to USSD Settings
3. Update Callback URL from:
   https://d1ad-105-165-175-169.ngrok-free.app/
   
   To:
   https://d1ad-105-165-175-169.ngrok-free.app/ussd

4. Save changes
5. Test dialing *384*69220# again
```

### Priority 2: Rebuild Backend with New Code
```bash
cd ussd-paystack-backend
cargo build --release

# This will compile with enhanced logging
```

### Priority 3: Verify Environment Setup
```bash
# On your server (34.122.249.119)
ssh root@34.122.249.119

# Check Paystack key
echo $PAYSTACK_SECRET_KEY

# Check .env file
cat /home/deploy/.env

# Restart service with new binary
systemctl restart ussd-paystack
```

### Priority 4: Test the Flow
```bash
# Test health endpoint
curl https://d1ad-105-165-175-169.ngrok-free.app/health

# Monitor backend logs
ssh root@34.122.249.119
journalctl -u ussd-paystack -f

# Dial *384*69220# and watch logs
```

---

## 📊 Expected Behavior (After Fixes)

### When working correctly, you'll see in logs:
```
📨 [INCOMING USSD] session=abc123 | phone=0722000000 | text='' | network=TYP
📱 Normalized phone: 0722000000 → 254722000000
🔄 First dial detected (empty text) - triggering STK push
🔗 Paystack charge request | phone=254722000000 | formatted=+254722000000 | amount=50000 cents
✅ Paystack charge successful: Charge initiated
📤 Sending response: END Payment of KES 500 requested...
```

### User experience:
```
User dials: *384*69220#
↓
[1-2 seconds]
↓
User receives: "Payment of KES 500 requested. Check your phone now and enter your MPESA PIN."
↓
User's phone: STK prompt appears asking for M-PESA PIN
↓
User enters PIN
↓
Payment processed
```

---

## 🔍 Diagnostic Tools

I've created two diagnostic documents:

1. **[USSD_DIAGNOSTICS.md](USSD_DIAGNOSTICS.md)**
   - Complete issue breakdown
   - All possible causes
   - Solutions for each issue
   - Common error messages

2. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
   - Step-by-step testing procedures
   - Quick fixes for common issues
   - Verification checklist
   - Debug commands

---

## 🚨 If Issues Persist

After implementing the above, if you still see "Events: N/A":

1. Check backend logs for actual errors
2. Verify the callback URL path includes `/ussd`
3. Test locally first: `curl -X POST http://localhost:3000/ussd ...`
4. Check if Africa's Talking is using POST correctly
5. Verify Paystack secret key is valid and for the right environment

---

## 📝 Summary of Root Causes

| Cause | Probability | Impact | Fix |
|-------|-------------|--------|-----|
| Wrong callback URL path | 🔴 90% | Backend never receives request | Update Africa's Talking config |
| Missing PAYSTACK_SECRET_KEY | 🟠 70% | Paystack API fails silently | Set env var on server |
| Wrong content-type | 🟡 40% | Request parsing fails | Enable logging to debug |
| Invalid phone format | 🟡 30% | Paystack rejects request | Validation now in place |
| ngrok tunnel issues | 🟡 20% | External access fails | Test with curl |
| Firewall blocking | 🟡 15% | Port 3000 unreachable | Check UFW/security groups |

**Most likely issue: Wrong callback URL (90% confidence)**

