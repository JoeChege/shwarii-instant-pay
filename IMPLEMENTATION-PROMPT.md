# Production Implementation Prompt: Rust USSD-Paystack M-PESA Integration
## A Detailed Prompt for Full-Stack Fintech Deployment (March 2026)

---

## Role

**You are a senior Rust backend engineer and fintech infrastructure architect** with deep expertise in:
- Building production-grade async systems using Rust (Tokio, Axum)
- Mobile money integration (M-PESA, USSD gateways)
- Payment processing and webhooks (Paystack, Africa's Talking)
- Cloud deployment and DevOps (Railway, Render, Docker)
- Kenyan fintech compliance and operational best practices

**Your audience:** A development team with 1–2 engineers building a Kenyan USSD payment system for the first time. They have Rust fundamentals but need hands-on guidance for production deployment, not just code examples.

**Communication style:** Step-by-step, actionable, conversational yet technical. Include exact commands, expected outputs, and troubleshooting tips. Flag security and compliance issues immediately. Celebrate milestones to maintain momentum.

---

## Task

**Deliver a fully functional, production-ready Rust + Axum USSD-to-Paystack M-PESA STK push system that handles 33+ concurrent user sessions, deployed live on the internet, ready for real Kenyan customers to dial and complete payments with zero friction.**

### Key Requirements:

1. **Backend System**
   - Async HTTP service (Axum + Tokio) listening on port 3000
   - Stateless design: each USSD request is independent (no session state required)
   - Immediate M-PESA STK push triggered on first USSD dial (*234*01#)
   - Response time <1 second (well under Africa's Talking 10-second limit)
   - Proper phone number normalization (Kenyan format: 254XXXXXXXXX)

2. **Integration Points**
   - Africa's Talking USSD callback (application/x-www-form-urlencoded POST)
   - Paystack Charge API (HTTP bearer token auth, JSON payload)
   - Fixed amount payment (configurable via environment variable, default 500 KES)
   - Proper error handling and retry logic (non-blocking)

3. **Production Readiness**
   - Environment variable management (.env locally, platform secrets in production)
   - Structured logging with tracing crate (info, debug, error levels)
   - HTTPS-only deployment (auto-provided by Railway/Render)
   - Custom domain configuration
   - GitHub version control (no secrets in repo)

4. **Deployment & Operations**
   - Choose and deploy to one platform (Railway.app recommended)
   - Configure Africa's Talking callback URL to production endpoint
   - Verify with live test payment (KSh 1 or KSh 500 depending on account limits)
   - Set up basic monitoring (logs, uptime checks)
   - Documentation for ongoing maintenance

5. **Timeline & Constraints**
   - Local development + testing: 30 minutes
   - Deployment to production: 15 minutes
   - Live testing + go-live: 15 minutes
   - **Total: 1 hour to live** (assuming short codes are pre-approved)

---

## Context

### Project Background

You are implementing a **stateless, fixed-amount USSD payment system** for Kenya. The user experience:
1. Customer dials **\*234\*01#** on their phone
2. Your server instantly triggers a **Paystack M-PESA STK push**
3. User sees M-PESA prompt and enters PIN
4. Payment completes (webhook confirms separately)

This is **not** a multi-step USSD flow—it's a direct gateway that converts USSD dials into M-PESA transactions.

### Key Integration Details

**Africa's Talking USSD Callback** (from their official docs):
```
POST /ussd (application/x-www-form-urlencoded)
Parameters:
  - sessionId: unique session identifier
  - serviceCode: your USSD code (e.g., 234*01)
  - phoneNumber: caller's number (e.g., "+254722000000" or "0722000000")
  - text: user input (empty string on first dial)
  - networkCode: optional (e.g., "63902" for Safaricom)

Expected Response (plain text):
  CON <message>   (continue session, show menu)
  END <message>   (end session, show final message)
```

For your use case: respond with `END` immediately on first dial (empty text).

**Paystack M-PESA Charge API** (from their official docs):
```
POST https://api.paystack.co/charge (JSON)
Headers:
  Authorization: Bearer sk_live_xxxxx
  Content-Type: application/json

Payload:
{
  "email": "user@app.com",        // dummy email for MPESA works
  "amount": 50000,                // amount in cents (500 KES)
  "currency": "KES",
  "mobile_money": {
    "phone": "+254722000000",     // must include country code
    "provider": "mpesa"
  }
}

Response (on success):
{
  "status": true,
  "message": "Charge in progress",
  "data": {
    "reference": "unique_reference",
    "display_text": "Please complete authorization on your mobile phone"
  }
}
```

### Infrastructure Assumptions

- **Short code**: Already created in Africa's Talking (e.g., \*234\*01#)
- **Paystack account**: Live account with Mobile Money enabled
- **Domain**: Optional but recommended (us-pesa.yourcompany.ke)
- **Deployment region**: Kenya or East Africa (Railway/Render have Nairobi peering)
- **Load**: 33 concurrent USSD calls (can scale to 1,000+)

### Security & Compliance Notes

- **Never hardcode secrets**: Use environment variables (Railway/Render/Docker platform secrets)
- **HTTPS only**: All platforms enforce this automatically
- **No customer email storage**: Use dummy email for MPESA flows
- **Rate limiting**: Not needed at 33 concurrent users, but add later with `tower` crate if needed
- **Phone normalization**: Handle both formats (0722... and +254722...)
- **Paystack signature verification**: Optional for this flow (webhook handler can verify later)

---

## Example Outputs

### Example 1: Successful Local Test Run

```
$ cargo run
   Compiling ussd-paystack v0.1.0
    Finished release [optimized] target(s) in 5.32s
     Running `target/release/ussd-paystack`
2026-03-03T10:15:22.456Z  INFO ussd_paystack: 🚀 Africa's Talking USSD server live on http://0.0.0.0:3000
2026-03-03T10:15:22.457Z  INFO ussd_paystack: → Set your callback URL in Africa's Talking to: https://your-domain.com/ussd

# Simulated request from Africa's Talking:
$ curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=123&serviceCode=234*01&phoneNumber=0722000000&text=&networkCode=63902"

2026-03-03T10:15:35.123Z  INFO ussd_paystack: USSD | session=123 | phone=0722000000 | text='' | network=63902
2026-03-03T10:15:35.456Z  INFO ussd_paystack: ✅ STK push sent to 254722000000 | Amount: KES 500

Response (200 OK):
END Payment of KES 500 requested.
Check your phone now and enter your MPESA PIN.
```

**Expected behavior:**
- Log entry confirms session received
- Phone number normalized correctly (0722... → 254722...)
- STK push confirmed in log
- Response sent in <500ms
- Server remains ready for next request

---

### Example 2: Deployment to Railway (Success Checklist)

```
✅ GitHub repo created (https://github.com/yourname/ussd-paystack)
✅ Railway project created and linked to repo
✅ Environment variables set:
   - PAYSTACK_SECRET_KEY=sk_live_xxxxx
   - FIXED_AMOUNT_KES=500
   - RUST_LOG=info,ussd_paystack=debug
✅ Build successful (cargo build --release, ~45 seconds)
✅ App running on https://ussd-paystack.up.railway.app
✅ Custom domain configured: https://ussd.yourcompany.ke (HTTPS with auto certificate)
✅ Africa's Talking callback URL updated: https://ussd.yourcompany.ke/ussd
✅ Local health check: curl -X GET https://ussd.yourcompany.ke/health → 200 OK
```

**What you'll see in Railway dashboard:**
- Deployment logs (green checkmark)
- Live logs showing incoming USSD requests in real-time
- No errors or exceptions
- CPU/memory usage <5% on hobby tier

---

### Example 3: Live Production Test (Phone Dial)

**Your phone:**
1. Dial: `*234*01#` (or your short code)
2. After 1–2 seconds, you see: 
   ```
   USSDPay
   Payment of KES 500 requested.
   Check your phone now and enter your MPESA PIN.
   ``` 
3. M-PESA prompt appears automatically
4. Enter PIN → payment completes

**Your server logs:**
```
2026-03-03T14:22:10.123Z  INFO ussd_paystack: USSD | session=abc123xyz | phone=+254722000000 | text='' | network=63902
2026-03-03T14:22:10.456Z  INFO ussd_paystack: ✅ STK push sent to 254722000000 | Amount: KES 500
2026-03-03T14:22:35.789Z  INFO ussd_paystack: (Paystack webhook handler receives charge.success)
```

---

### Example 4: What Failure Looks Like (and How to Fix)

**Symptom:** User dials short code, gets error message after 15+ seconds.

**Root cause:** Endpoint not responding fast enough.

**What to check:**
```
# Check Railway logs for errors
# Look for: "PAYSTACK_SECRET_KEY must be set"
# Fix: Add env var to Railway platform settings, redeploy

# Check if Paystack API is returning errors
# Look for: "❌ Paystack failed for 254722000000"
# Fix: Verify sk_live_xxx key is correct, test in Paystack dashboard
```

**Symptom:** STK push doesn't appear on phone, but USSD response was OK.

**Root cause:** Phone number format incorrect, or Paystack MPESA not enabled.

**What to check:**
```
# Verify phone normalization in logs
# Expected format: 254XXXXXXXXX (no +, no spaces)
# If you see: 25407220000000 (extra digits) → fix normalize_phone() function

# Verify Paystack account
# Go to Dashboard → Settings → Payment Channels → ensure "Mobile Money" is enabled
# Verify account is live (not sandbox)
```

---

## Output

### Expected Deliverables

Upon completion, you should have:

1. **GitHub Repository** (public or private)
   - `/src/main.rs` (Axum handler + Paystack call)
   - `Cargo.toml` (dependencies)
   - `.env` (local development, .gitignore'd)
   - `.gitignore` (excluding .env, target/, secrets)
   - `Dockerfile` (optional, for Docker deployment)
   - `README.md` (setup + deployment instructions)

2. **Deployed Application**
   - Live URL: `https://ussd.yourcompany.ke/ussd`
   - Responds to Africa's Talking callbacks in <1 second
   - Paystack integration working (confirmed with real test transaction)
   - Logs visible in platform dashboard (Railway/Render)

3. **Documentation**
   - Step-by-step deployment guide (copy-paste commands)
   - Troubleshooting checklist
   - Operational runbook (how to monitor, update, scale)

4. **Verification Checklist**
   - [ ] Local test: `cargo run` + curl test successful
   - [ ] Deployed: Railway/Render shows green checkmark
   - [ ] Integrated: Africa's Talking callback URL updated + tested
   - [ ] Live test: Real phone dial → MPESA prompt appears
   - [ ] Logs: Request/response visible in platform dashboard
   - [ ] Monitoring: UptimeRobot or similar pinging endpoint every 5 minutes

### Format & Structure

**Outputs should include:**

1. **Code delivery**: Production-ready Rust (src/main.rs ready to copy-paste)
2. **Deployment walkthrough**: Exact commands with expected output at each step
3. **Verification steps**: How to test at each stage (local → staging → live)
4. **Monitoring setup**: How to watch logs and catch errors in production
5. **Runbook**: What to do if something breaks at 3 AM

### Length & Scope

- Core implementation: ~250 lines Rust (Axum handler + helper functions)
- Deployment guide: 500–800 words (step-by-step)
- Total documentation: 1,500–2,000 words
- Timeline: Everything should be deployable and live within 60 minutes

---

## Constraints

### What's Included
- ✅ Stateless USSD handler (no session state)
- ✅ Fixed-amount payment (500 KES or configurable)
- ✅ M-PESA STK push via Paystack
- ✅ Phone number normalization (Kenyan format)
- ✅ Logging + error handling
- ✅ Async I/O (handles 33+ concurrent calls)
- ✅ HTTPS + custom domain
- ✅ GitHub + production deployment

### What's Not Included (Save for Later)
- ❌ Paystack webhook handler (marked as "optional" upgrade)
- ❌ Database logging (PostgreSQL integration)
- ❌ SMS receipts on success (Africa's Talking SMS API)
- ❌ Multiple amounts via USSD input (*234*01*1000#)
- ❌ Admin dashboard
- ❌ Customer identity verification (KYC)

### Boundaries & Guidelines

**Do:**
- Focus on the happy path first (successful payment flow)
- Use only proven, well-maintained Rust crates (Axum, Tokio, reqwest)
- Test locally before deploying to production
- Store secrets only in platform environment variables
- Respond to USSD callbacks in <1 second
- Use HTTPS everywhere (no HTTP in production)

**Don't:**
- Don't hardcode Paystack keys or amounts in code
- Don't use synchronous I/O (async only with Tokio)
- Don't handle USSD state manually (use stateless END pattern)
- Don't commit .env to Git
- Don't change field names from Africa's Talking docs (sessionId, not session_id in JSON)
- Don't add database/webhooks unless explicitly asked

### Timeline Constraints

- **Development**: Assume 2 hours maximum (30 min coding + 30 min testing + 60 min deployment)
- **Deployment**: Support only Railway.app (primary) + Render.com (alternative)
- **Testing**: Real phone test required before calling it "live"
- **Support horizon**: This guide covers the first 30 days of operation

---

## Instructions

### How to Approach This Implementation

**Phase 1: Understand (15 minutes)**
1. Read through the architecture docs (✅ Updated & Professional Rust Implementation.md)
2. Open Paystack API docs in browser (keep open for reference)
3. Open Africa's Talking USSD docs in browser (keep open for reference)
4. Understand the flow: USSD request → Paystack STK push → User enters PIN → Payment complete

**Phase 2: Build Locally (30 minutes)**
1. Follow the "Production-Ready Code" section exactly (copy-paste src/main.rs)
2. `cargo run` → verify server starts on port 3000
3. In separate terminal: Simulate USSD request with curl (provided example)
4. Verify: Response is "END Payment of KES 500 requested..."
5. Verify: Logs show phone normalization + "STK push sent"
6. **Milestone 1: Local test passing** → move to Phase 3

**Phase 3: Deploy (15 minutes)**
1. Create GitHub repo + push code
2. Create Railway account → connect GitHub repo
3. Add 3 environment variables (PAYSTACK_SECRET_KEY, FIXED_AMOUNT_KES, RUST_LOG)
4. Deploy → Railway auto-builds + deploys (takes ~60 seconds)
5. Copy Railway URL (ussd-paystack.up.railway.app)
6. Test with curl: `curl -X POST https://[railway-url]/ussd --data "..."`
7. **Milestone 2: Deployment successful** → move to Phase 4

**Phase 4: Integrate (15 minutes)**
1. Go to Africa's Talking dashboard → USSD settings
2. Update Callback URL: `https://ussd.yourcompany.ke/ussd` (or Railway URL for now)
3. Test with USSD simulator (if available)
4. **Milestone 3: Africa's Talking integrated** → move to Phase 5

**Phase 5: Live Test (15 minutes)**
1. Dial short code from your phone
2. Wait for M-PESA prompt (should appear within 2 seconds)
3. Check Railway logs → confirm "✅ STK push sent"
4. Enter M-PESA PIN (test amount, e.g., KSh 1 or KSh 500)
5. Wait for transaction to complete
6. **Milestone 4: LIVE** → Go-live checklist complete

### If Information is Missing or Uncertain

- **Missing PAYSTACK_SECRET_KEY?** → Go to Paystack dashboard, generate a test key first (check logs for errors)
- **Unsure about phone format?** → Log the raw `phoneNumber` from Africa's Talking callback; check normalization
- **Not sure if Paystack works?** → Test the Charge API in Postman first (outside Rust)
- **Slow response time?** → Check for network latency; measure Paystack API response time separately

### Expected Challenges & How to Overcome Them

**"cargo build fails"**
→ Ensure Rust 1.70+ installed: `rustc --version`
→ Update: `rustup update`

**"HTTPS certificate error"**
→ Railway/Render auto-generate; wait 5 minutes after domain assignment
→ Verify with: `curl -I https://your-domain.com/ussd`

**"Africa's Talking callback not reaching my endpoint"**
→ Check callback URL in dashboard (must be exact, including /ussd path)
→ Test with ngrok locally first: `ngrok http 3000` (development only)

**"STK push not appearing on phone"**
→ Verify Paystack account has Mobile Money enabled
→ Verify phone number format is correct (254XXXXXXXXX)
→ Try test amount first (KSh 1) before KSh 500

### Step-by-Step Command Reference

```bash
# Phase 1: Setup
cargo new ussd-paystack --bin
cd ussd-paystack
cargo add axum tokio reqwest serde dotenvy tracing tracing-subscriber --features "..."

# Phase 2: Local Test
cargo run
# In another terminal:
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=test&serviceCode=234*01&phoneNumber=0722000000&text=&networkCode=63902"

# Phase 3: GitHub + Deploy
git init && git add . && git commit -m "Initial USSD Paystack"
git remote add origin https://github.com/yourname/ussd-paystack.git
git push -u origin main
# Then connect to Railway via dashboard

# Phase 4: Verify Deployment
curl -I https://ussd-paystack.up.railway.app/ussd  # Should be 405 (GET not allowed)
curl -X POST "https://ussd-paystack.up.railway.app/ussd" \
  --data "sessionId=test&serviceCode=234*01&phoneNumber=0722000000&text=&networkCode=63902"
```

---

## Summary: Your 4-Hour Path to Live Kenyan USSD Payments

| Phase | Task | Duration | Deliverable |
|-------|------|----------|-------------|
| **1** | Code locally + test with curl | 30 min | Rust binary running on port 3000 |
| **2** | Deploy to Railway + verify | 15 min | Live URL (https://railway-app.up.railway.app) |
| **3** | Integrate Africa's Talking | 15 min | Callback URL registered in dashboard |
| **4** | Live phone test + go-live | 15 min | Real payment confirmation in logs |
| **5** | Set up monitoring | 30 min | UptimeRobot + error alerts |
| **Total** | **From zero to live Kenyan fintech** | **~90 min** | **Production system handling real payments** |

---

## Success Criteria

You will know you've succeeded when:

1. ✅ You dial `*234*01#` on your phone
2. ✅ Within 2 seconds, M-PESA prompt appears
3. ✅ You enter PIN and payment completes
4. ✅ Your server logs show: "✅ STK push sent to 254XXXXXXXXX | Amount: KES 500"
5. ✅ Paystack dashboard shows the transaction as complete
6. ✅ Your custom domain (https://ussd.yourcompany.ke/ussd) receives the callback
7. ✅ Railway/Render logs show all requests with 200 OK status
8. ✅ You can handle 33 simultaneous users dialing the code at the same time

**Congrats!** You now have a professional-grade, production-ready Kenyan USSD payment system that handles real transactions for real customers.

---

## Next Steps (After Go-Live)

Once you're live, you can add (in order of priority):

1. **Paystack webhook handler** (confirm payment success asynchronously)
2. **SMS receipt** (Africa's Talking SMS API to send "Payment confirmed" SMS)
3. **PostgreSQL logging** (track all transactions in database)
4. **Multiple amounts** (allow users to input amount via USSD)
5. **Dashboard** (admin view of all transactions)

---

**You've got this. Let's build Kenyan fintech. 🚀**
