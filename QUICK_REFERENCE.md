# USSD Implementation - Quick Reference Checklist

## ✅ Completed Tasks

### Backend (Rust)
- [x] Created Axum web server project
- [x] Implemented `/ussd` POST endpoint for Africa's Talking callbacks
- [x] Implemented phone normalization (0722... → 254722...)
- [x] Integrated Paystack M-PESA charge API
- [x] Added environment variable management
- [x] Built release binary successfully
- [x] Tested locally with curl ✅
  - Health endpoint working
  - USSD endpoint receiving requests correctly
  - Phone number normalized properly
  - Error handling in place for invalid keys

### Configuration & Documentation
- [x] Created .env.example for reference
- [x] .gitignore configured (no secrets in repo)
- [x] README.md with setup & deployment instructions
- [x] DEPLOY_INSTRUCTIONS.md with step-by-step guide
- [x] COMPLETE_SETUP_GUIDE.md comprehensive guide
- [x] Dockerfile for containerized deployment

---

## 🔄 Next Steps (Ready to Execute)

### Step 1: Get Paystack Live Secret Key
**Time**: 5 minutes

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/settings/developer)
2. Copy your **Live Secret Key** (starts with `sk_live_`)
3. Save it somewhere safe (you'll need it for deployment)

### Step 2: Update Environment for Deployment
**Time**: 2 minutes

```bash
cd /home/tweeps/ussd/ussd-paystack-backend

# Edit .env with your real Paystack key
nano .env

# Change this line:
# PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key_here
```

### Step 3: Deploy to Live Server (34.122.249.119)
**Time**: 10 minutes

```bash
# From your local machine
cd /home/tweeps/ussd/ussd-paystack-backend

# Copy binary and config to server
scp target/release/ussd-paystack root@34.122.249.119:/home/deploy/
scp .env root@34.122.249.119:/home/deploy/.env.prod

# SSH to server and start service
ssh root@34.122.249.119

# Follow the systemd setup from DEPLOY_INSTRUCTIONS.md
```

### Step 4: Configure Africa's Talking Callback
**Time**: 5 minutes

1. Go to [Africa's Talking Dashboard](https://africastalking.com/app)
2. Navigate to **USSD** → **Manage Shortcodes**
3. Find shortcode: `*384*36527#`
4. Set Callback URL: `http://34.122.249.119:3000/ussd`
5. Click **Save** and verify

### Step 5: Test Live USSD Flow
**Time**: 2 minutes

From your phone (in Kenya):
```
Dial: *384*36527#

Expected result:
1. Message appears in 1-2 seconds
2. M-PESA prompt appears automatically
3. Enter M-PESA PIN
4. Payment completes (KES 500)

Check server logs:
ssh root@34.122.249.119
sudo journalctl -u ussd-paystack -f
```

---

## 📁 Project Structure

```
/home/tweeps/ussd/
├── ussd-paystack-backend/          # Rust backend (MAIN)
│   ├── src/
│   │   ├── main.rs                # HTTP server + endpoints
│   │   ├── config.rs              # Environment config
│   │   ├── paystack.rs            # Paystack API client
│   │   └── ussd.rs                # Phone normalization
│   ├── Cargo.toml                 # Rust dependencies
│   ├── Cargo.lock
│   ├── .env                       # Local config (gitignore'd)
│   ├── .env.example               # Example config
│   ├── .gitignore
│   ├── Dockerfile
│   ├── README.md
│   └── target/release/ussd-paystack  # Compiled binary ✅
│
├── shwarii-instant-pay/            # React frontend (optional)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── COMPLETE_SETUP_GUIDE.md         # Full guide
├── DEPLOY_INSTRUCTIONS.md          # Deployment walkthrough
└── test_local.sh                   # Local test script

Live Server: 34.122.249.119:3000/ussd
USSD Code: *384*36527#
```

---

## 🧪 Quick Tests

### Local Test (Before Deploying)
```bash
cd /home/tweeps/ussd/ussd-paystack-backend

# Start server
PAYSTACK_SECRET_KEY=sk_test_dummy ./target/release/ussd-paystack &

# Test health
curl http://localhost:3000/health
# Expected: OK

# Test USSD
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=test&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"
# Expected: "END Payment of KES 500 requested..."

# Stop server
pkill -f ussd-paystack
```

### Live Server Test (After Deploying)
```bash
# From local machine
curl http://34.122.249.119:3000/health
# Expected: OK

# Or SSH to server
ssh root@34.122.249.119
curl http://localhost:3000/health
sudo journalctl -u ussd-paystack -f
```

### Phone Test (Final Verification)
```
Dial: *384*36527#
Watch: Server logs for incoming request
Expect: USSD message + M-PESA prompt
Result: Payment completes with PIN entry
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Local | Live | Format |
|----------|-------|------|--------|
| `PAYSTACK_SECRET_KEY` | sk_test_dummy | sk_live_xxx (from dashboard) | Bearer token |
| `FIXED_AMOUNT_KES` | 50000 | 50000 (500 KES in cents) | Integer |
| `RUST_LOG` | info | info or debug | Logging level |

### Endpoints

| Endpoint | Method | Purpose | Expected Response |
|----------|--------|---------|-------------------|
| `/health` | GET | Server health check | 200 OK, body: "OK" |
| `/ussd` | POST | USSD callback from Africa's Talking | 200 OK, USSD message |

### Phone Number Formats Supported

| Input | Output |
|-------|--------|
| `0722000000` | `254722000000` |
| `+254722000000` | `254722000000` |
| `254722000000` | `254722000000` |
| `+254 722 000 000` | `254722000000` |

---

## ⚠️ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid key" from Paystack | Using sandbox/test key | Use `sk_live_` key from dashboard |
| STK push doesn't appear | Wrong phone format | Check logs for `254722...` format |
| USSD timeout (>10s) | Server too slow | Check server latency with curl |
| Callback URL not responding | Server not running/firewall | Check systemd status & firewall rules |
| Connection refused | Port not listening | `sudo netstat -tlnp \| grep 3000` |

---

## 📊 Monitoring Commands

```bash
# Check service status
sudo systemctl status ussd-paystack

# View live logs
sudo journalctl -u ussd-paystack -f

# View last 50 lines
sudo journalctl -u ussd-paystack -n 50

# Check port is open
sudo netstat -tlnp | grep 3000

# Test endpoint
curl -v http://34.122.249.119:3000/health

# Monitor continuously
watch -n 1 'sudo journalctl -u ussd-paystack -n 10'
```

---

## 📋 Pre-Launch Checklist

- [ ] Paystack Live Secret Key obtained
- [ ] .env updated with real Paystack key
- [ ] Local tests passed ✅
- [ ] Binary copied to server
- [ ] Systemd service created & running
- [ ] Africa's Talking callback URL configured
- [ ] Firewall allows port 3000 (or Nginx proxy)
- [ ] Health check endpoint responds
- [ ] Test dial from phone successful
- [ ] Logs show successful STK push
- [ ] M-PESA payment completes

---

## 🚀 Success!

When everything is working:

```
$ curl http://34.122.249.119:3000/health
OK

$ ssh root@34.122.249.119 && sudo journalctl -u ussd-paystack -f
2026-03-03T14:22:10.123Z  INFO: USSD | session=... | phone=254722000000 | text=''
2026-03-03T14:22:10.456Z  INFO: ✅ STK push sent to 254722000000 | Amount: KES 500
```

**You're live!** 🎉

---

## 📞 Quick Support

**Backend Code Questions**: Check `/home/tweeps/ussd/ussd-paystack-backend/README.md`  
**Deployment Issues**: Check `DEPLOY_INSTRUCTIONS.md`  
**Full Guide**: Read `COMPLETE_SETUP_GUIDE.md`  
**Rust/Axum**: https://docs.rs/axum/  
**Paystack API**: https://paystack.com/developers  
**Africa's Talking**: https://africastalking.com/ussd

---

**Last Updated**: March 3, 2026  
**Status**: Ready for Production  
**Next Action**: [Get Paystack Live Key & Deploy]
