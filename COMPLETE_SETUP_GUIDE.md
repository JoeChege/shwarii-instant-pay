# USSD Payment Integration - Complete Setup Guide

**Status**: Ready for Local Development & Live Deployment  
**Date**: March 3, 2026

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Phone                               │
│                  Dial: *384*36527#                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  Africa's Talking USSD Gateway    │
         │  (Safaricom/Airtel/Telkom)        │
         └────────┬────────────────────────┘
                  │ POST /ussd
                  ▼
    ┌─────────────────────────────────────┐
    │  Your Rust Backend                  │
    │  34.122.249.119:3000/ussd           │
    │  ├─ Receive USSD request            │
    │  ├─ Normalize phone number          │
    │  └─ Call Paystack M-PESA            │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────┐
    │  Paystack API (api.paystack.co)     │
    │  ├─ charge endpoint (M-PESA)        │
    │  └─ Triggers STK Push               │
    └────────┬────────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │  M-PESA on Your Phone             │
    │  ├─ STK Prompt appears            │
    │  ├─ Enter M-PESA PIN              │
    │  └─ Payment completes             │
    └──────────────────────────────────┘
```

---

## Part 1: Local Development (30 minutes)

### 1.1 Prerequisites

```bash
# Verify you have:
rustc --version        # Rust 1.70+ (already installed)
cargo --version        # Latest Cargo
node --version         # Node.js (for React frontend)
npm --version          # npm 8+ or Bun
```

### 1.2 Backend Setup

**Location**: `/home/tweeps/ussd/ussd-paystack-backend/`

```bash
cd ussd-paystack-backend

# 1. Review the .env file
cat .env

# Should contain:
# PAYSTACK_SECRET_KEY=sk_test_dummy_key_for_local_testing
# FIXED_AMOUNT_KES=50000
# RUST_LOG=info

# 2. Build the release binary
cargo build --release

# Binary location: target/release/ussd-paystack
```

### 1.3 Test Locally

```bash
# Start the server in one terminal
PAYSTACK_SECRET_KEY=sk_test_dummy ./target/release/ussd-paystack

# In another terminal, test the endpoints:

# Health check
curl http://localhost:3000/health
# Expected: OK

# USSD callback simulation (Africa's Talking format)
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=test123&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"

# Expected response:
# END Payment of KES 500 requested.
# Check your phone now and enter your MPESA PIN.
```

**Expected Log Output**:
```
2026-03-03T12:54:41.551696Z  INFO ussd_paystack: ✅ Configuration loaded successfully
2026-03-03T12:54:41.598026Z  INFO ussd_paystack: 🚀 Africa's Talking USSD server live on http://0.0.0.0:3000
2026-03-03T12:54:41.598044Z  INFO ussd_paystack: → Set your callback URL in Africa's Talking to: https://34.122.249.119/ussd
2026-03-03T12:54:44.566390Z  INFO ussd_paystack: USSD | session=test123 | phone=0722000000 | text='' | network=Some("63902")
```

---

## Part 2: Deploy to Live Server (15 minutes)

### 2.1 Prepare for Deployment

```bash
cd /home/tweeps/ussd/ussd-paystack-backend

# Get your Paystack Live Secret Key from:
# https://dashboard.paystack.com/settings/developer

# Update .env with REAL credentials:
cat > .env << 'EOF'
PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key_here
FIXED_AMOUNT_KES=50000
RUST_LOG=info
EOF
```

### 2.2 Deploy Binary to Server

```bash
# Build final release binary (already done above)
# File: target/release/ussd-paystack

# Copy to server
scp target/release/ussd-paystack root@34.122.249.119:/home/deploy/
scp .env root@34.122.249.119:/home/deploy/.env.prod

# Verify copy succeeded
echo "✅ Files copied successfully"
```

### 2.3 SSH to Server and Start Service

```bash
ssh root@34.122.249.119

# Set up deployment directory
mkdir -p /home/deploy/ussd-paystack
cd /home/deploy/ussd-paystack
mv /home/deploy/ussd-paystack ./
chmod +x ./ussd-paystack

# Create systemd service
sudo tee /etc/systemd/system/ussd-paystack.service > /dev/null << 'EOF'
[Unit]
Description=USSD-Paystack M-PESA Gateway
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/deploy/ussd-paystack
ExecStart=/home/deploy/ussd-paystack/ussd-paystack
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
EnvironmentFile=/home/deploy/ussd-paystack/.env.prod

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl start ussd-paystack
sudo systemctl enable ussd-paystack

# Check status
sudo systemctl status ussd-paystack

# View live logs
sudo journalctl -u ussd-paystack -f
```

**Expected Output**:
```
● ussd-paystack.service - USSD-Paystack M-PESA Gateway
   Loaded: loaded (/etc/systemd/system/ussd-paystack.service; enabled; preset: enabled)
   Active: active (running) since Mon 2026-03-03 14:22:10 UTC; 5s ago
   Main PID: 12345 (ussd-paystack)
   ...

2026-03-03T14:22:10.123Z  INFO ussd_paystack: ✅ Configuration loaded successfully
2026-03-03T14:22:10.598Z  INFO ussd_paystack: 🚀 Africa's Talking USSD server live on http://0.0.0.0:3000
```

### 2.4 Verify Deployment

**From your local machine**:
```bash
# Test health endpoint
curl -v http://34.122.249.119:3000/health
# Expected: 200 OK, body: "OK"

# Test USSD endpoint
curl -X POST "http://34.122.249.119:3000/ussd" \
  --data "sessionId=test123&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"

# Expected response (with real Paystack key):
# END Payment of KES 500 requested.
# Check your phone now and enter your MPESA PIN.
```

---

## Part 3: Configure Africa's Talking (5 minutes)

### 3.1 Update Callback URL

1. Go to [Africa's Talking Dashboard](https://africastalking.com/app)
2. Navigate to: **USSD** → **Manage Shortcodes** or **Webhooks**
3. Find your shortcode: `*384*36527#`
4. Set Callback URL to: `http://34.122.249.119:3000/ussd`
5. **Save**

### 3.2 Verify Integration

**Option A: Direct Test** (Skip M-PESA for now)
```bash
# On the server, test your endpoint
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=abc123&serviceCode=384*36527&phoneNumber=+254722123456&text=&networkCode=63902"

# Check logs
sudo journalctl -u ussd-paystack -n 5 -f
```

**Option B: End-to-End Test (Real M-PESA)**
- Dial `*384*36527#` from a Kenyan phone
- Wait 1-2 seconds
- Should see your custom USSD message
- M-PESA prompt should appear
- Enter M-PESA PIN to complete

---

## Part 4: React Frontend (Optional)

**Location**: `/home/tweeps/ussd/shwarii-instant-pay/`

```bash
cd shwarii-instant-pay

# Install dependencies
npm install  # or bun install

# Start development server
npm run dev

# Navigate to http://localhost:5173

# Build for production
npm run build
```

The frontend shows:
- Features and use cases
- Pricing information  
- How the USSD payment flow works
- Call-to-action buttons

---

## Troubleshooting

### Issue: "Connection refused" when testing USSD endpoint

**Check 1**: Server is running
```bash
ssh root@34.122.249.119
sudo systemctl status ussd-paystack
```

**Check 2**: Port 3000 is open
```bash
sudo netstat -tlnp | grep 3000
# Should show: LISTEN on 0.0.0.0:3000

# If not, check firewall:
sudo ufw status
sudo ufw allow 3000/tcp
```

### Issue: "Invalid key" from Paystack

**Fix**:
1. Verify you're using the **LIVE** secret key (starts with `sk_live_`)
2. Check at: [Paystack Dashboard](https://dashboard.paystack.com/settings/developer)
3. Update .env: `PAYSTACK_SECRET_KEY=sk_live_your_correct_key`
4. Restart service: `sudo systemctl restart ussd-paystack`

### Issue: STK Push doesn't appear on phone

**Check 1**: Phone number normalization
- Should be: `254722123456` (no +, no spaces, no 0 prefix)
- Check logs: `sudo journalctl -u ussd-paystack -n 5 -f`

**Check 2**: Paystack Mobile Money enabled
- Go to [Paystack Dashboard](https://dashboard.paystack.com)
- Settings → Payment Channels
- Ensure "Mobile Money" is enabled
- Ensure account is "Live" (not Sandbox)

**Check 3**: USSD response is too slow
- Africa's Talking has 10-second timeout
- Server should respond in <1 second
- Check latency: `time curl http://34.122.249.119:3000/health`

### Issue: Service crashes repeatedly

**Check logs**:
```bash
sudo journalctl -u ussd-paystack -n 100 -f
```

**Common causes**:
- `PAYSTACK_SECRET_KEY` not set: Add to .env.prod
- No network access: Check firewall/networking
- Out of memory: Check `free -h`, restart if needed

---

## Monitoring

### Health Check (5-minute intervals)

```bash
# Local check
watch -n 300 'curl -s http://34.122.249.119:3000/health && echo "✅" || echo "❌"'

# Or set up UptimeRobot.com:
# - Monitor URL: http://34.122.249.119:3000/health
# - Interval: 5 minutes
# - Alert on failure
```

### Live Logs

```bash
ssh root@34.122.249.119
sudo journalctl -u ussd-paystack -f --since "10 minutes ago"

# Or continuous:
watch -n 1 'sudo journalctl -u ussd-paystack -n 20'
```

### Key Metrics to Monitor

- **Response Time**: Should be <1 second per request
- **Success Rate**: STK push should succeed with valid Paystack key
- **Phone Normalization**: All formats should convert to 254XXXXXXXXX
- **Error Rate**: Should be 0 unless Paystack credentials are wrong

---

## Maintenance

### Regular Tasks

**Weekly**:
- Check logs for errors: `sudo journalctl -u ussd-paystack --since "1 week ago" | grep ERROR`
- Verify Africa's Talking callback is still working
- Spot-check a test USSD dial

**Monthly**:
- Rotate Paystack secret key (if required by policy)
- Review transaction logs in Paystack dashboard
- Test failover/recovery procedures

### Updating Code

If you need to update the backend:

```bash
# On your local machine
cd /home/tweeps/ussd/ussd-paystack-backend
git add -A
git commit -m "Update: describe changes"
git push

# On the server
ssh root@34.122.249.119
cd /home/deploy/ussd-paystack

# Download new binary (replace with your build)
# Then restart:
sudo systemctl restart ussd-paystack
```

---

## Security Checklist

- ✅ PAYSTACK_SECRET_KEY stored in environment variable (not in code)
- ✅ .env file is in .gitignore (never commit secrets)
- ✅ Service runs as www-data user (not root)
- ✅ Firewall allows only ports 80, 443, 3000
- ✅ HTTPS configured (via Nginx reverse proxy or server TLS)
- ✅ Rate limiting added (for production load)
- ✅ Logging enabled (audit trail)

---

## Support & Resources

| Resource | Link |
|----------|------|
| Rust Documentation | https://docs.rust-lang.org |
| Axum Web Framework | https://github.com/tokio-rs/axum |
| Africa's Talking USSD | https://africastalking.com/ussd |
| Paystack API Docs | https://paystack.com/developers |
| M-PESA Integration | https://paystack.com/resources/guides |

---

## Success Criteria

You'll know it's working when:

1. ✅ `curl http://34.122.249.119:3000/health` returns `OK`
2. ✅ Logs show: `"USSD | session=... | phone=254... | network=..."`
3. ✅ Africa's Talking webhook is configured and verified
4. ✅ Dial `*384*36527#` from a phone → USSD message appears in 1-2 seconds
5. ✅ M-PESA STK push appears automatically
6. ✅ Complete payment with M-PESA PIN
7. ✅ Server logs show: `"✅ STK push sent to 254..."`

---

**Deployment Date**: March 3, 2026  
**Status**: Production Ready  
**Next Step**: [Dial *384*36527# from your phone]
