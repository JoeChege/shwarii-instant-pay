# USSD Callback Troubleshooting Checklist

## 🔴 Most Likely Issue: Callback URL Configuration

Your callback is returning "Events: N/A" because **the callback URL path might be incorrect**.

### Immediate Action:
```
1. Go to Africa's Talking dashboard
2. Find USSD settings/configuration
3. Look for "Callback URL" field
4. Change from: https://d1ad-105-165-175-169.ngrok-free.app/
   To: https://d1ad-105-165-175-169.ngrok-free.app/ussd
5. Save changes
6. Test dialing *384*69220# again
```

---

## Testing Steps (in order)

### Step 1: Verify Server is Running
```bash
# Check if backend is listening on port 3000
lsof -i :3000

# Or try to access it
curl -v http://localhost:3000/health
# Should return: 200 OK
```

### Step 2: Test Health Endpoint Through ngrok
```bash
# With your ngrok tunnel running, test:
curl -v https://d1ad-105-165-175-169.ngrok-free.app/health
# Should return: 200 OK
```

### Step 3: Test USSD Endpoint Locally
```bash
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=KEN"
```

**Expected Response:**
```
END Payment of KES 500 requested.
Check your phone now and enter your MPESA PIN.
```

### Step 4: Check Logs
```bash
# Watch ngrok logs
# ngrok web interface at http://localhost:4040

# Or check backend logs
# Look for: "📨 [INCOMING USSD]" messages
# If you see these, the callback is reaching your server
```

### Step 5: Verify Environment Variables
```bash
# Check if Paystack key is set
echo $PAYSTACK_SECRET_KEY

# Check if .env file exists
cat ussd-paystack-backend/.env

# Verify it has:
# PAYSTACK_SECRET_KEY=sk_live_xxx...
# FIXED_AMOUNT_KES=50000
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "Service temporarily unavailable"
**Cause**: Paystack API call failed  
**Fix**:
```bash
# Check Paystack secret key
grep PAYSTACK_SECRET_KEY .env
# Make sure it starts with: sk_live_

# Test Paystack connectivity (requires curl)
curl -X POST https://api.paystack.co/charge \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","amount":50000,"currency":"KES"}'
```

### Issue 2: No logs appearing
**Cause**: Backend not receiving requests  
**Fix**:
```bash
# Check if ngrok is forwarding correctly
# Visit: http://localhost:4040

# Verify backend is listening
netstat -tlnp | grep 3000

# Check firewall isn't blocking
sudo ufw status
```

### Issue 3: "Invalid request" errors
**Cause**: Africa's Talking sending wrong format  
**Fix**:
```bash
# Check what's actually being sent:
# Enable request body logging in backend

# Monitor with tcpdump (if available):
sudo tcpdump -A 'tcp port 3000'
```

### Issue 4: Phone number format errors
**Cause**: Invalid normalization  
**Fix**:
```bash
# Test with different formats:
0722000000
+254722000000
254722000000
+254 722 000 000

# All should normalize to: 254722000000
```

---

## 📋 Verification Checklist

Before testing with real USSD dial:

- [ ] Backend running: `ps aux | grep ussd`
- [ ] Port 3000 listening: `lsof -i :3000`
- [ ] ngrok tunnel active: `ps aux | grep ngrok`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Callback URL updated in Africa's Talking
- [ ] PAYSTACK_SECRET_KEY set and valid
- [ ] Logs showing incoming requests
- [ ] Paystack API responding correctly

---

## 🚀 Quick Rebuild & Restart

```bash
cd ussd-paystack-backend

# Rebuild with new logging
cargo build --release

# Start server with debug logging
RUST_LOG=debug ./target/release/ussd-paystack

# In another terminal, start ngrok
ngrok http 3000

# Then test
curl http://localhost:3000/health
```

---

## 📊 Understanding the Response

When working correctly, you should see:
1. Incoming request logged: `📨 [INCOMING USSD]`
2. Phone normalization logged: `📱 Normalized phone:`
3. Paystack call logged: `🔗 Paystack charge request`
4. Success or error logged: `✅ [SUCCESS]` or `❌ [FAILED]`
5. Response sent: `📤 Sending response:`

If you see all these in order, the flow is working.

---

## 🆘 If Still Not Working

1. **Enable full debug logging**:
   ```bash
   RUST_LOG=debug cargo run --release
   ```

2. **Check ngrok request inspector**:
   - Go to http://localhost:4040
   - Look at raw request and response
   - Check headers and body

3. **Verify Africa's Talking settings**:
   - Correct callback URL format
   - Correct USSD code
   - Not using test credentials

4. **Test from Africa's Talking simulator** (if available):
   - Use their testing console
   - See if callback is triggered

5. **Contact support with**:
   - Full backend logs
   - ngrok request/response from inspector
   - Africa's Talking configuration screenshot
   - Exact error messages

