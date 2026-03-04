# USSD-Paystack M-PESA Integration Backend

Production-ready Rust backend for instant M-PESA STK push via USSD in Kenya.

## Quick Start

### Prerequisites
- Rust 1.70+ ([install](https://rustup.rs/))
- Paystack live account with M-PESA enabled
- Africa's Talking account with USSD shortcode approved

### Local Development

1. **Clone and setup:**
```bash
cd ussd-paystack-backend
cp .env.example .env
```

2. **Add your Paystack secret key to `.env`:**
```bash
# Edit .env and add:
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
```

3. **Run locally:**
```bash
cargo run
```

Server starts on `http://0.0.0.0:3000`

### Local Testing

Test the USSD endpoint with curl:

```bash
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=test123&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"
```

Expected response:
```
END Payment of KES 500 requested.
Check your phone now and enter your MPESA PIN.
```

## Deployment

### Deploy to Your Server (34.122.249.119)

1. **Build release binary:**
```bash
cargo build --release
```

Binary location: `target/release/ussd-paystack`

2. **Transfer to server:**
```bash
scp target/release/ussd-paystack user@34.122.249.119:/home/deploy/
scp .env user@34.122.249.119:/home/deploy/
```

3. **On the server, run with systemd or tmux:**
```bash
# Using tmux (quick)
tmux new-session -d -s ussd "./ussd-paystack"

# Or with systemd (recommended for production)
sudo cp ussd-paystack.service /etc/systemd/system/
sudo systemctl start ussd-paystack
sudo systemctl enable ussd-paystack
```

4. **Verify it's running:**
```bash
curl http://localhost:3000/health
# Should return: OK
```

### Configure Africa's Talking

1. Go to [Africa's Talking Dashboard](https://africastalking.com/app)
2. Navigate to **USSD** → **Manage Webhooks**
3. Set Callback URL to: `https://34.122.249.119/ussd`
4. Save and verify

### Live Testing

**Dial from your phone:**
```
*384*36527#
```

Expected flow:
1. USSD response appears in 1-2 seconds
2. M-PESA prompt appears automatically
3. Enter M-PESA PIN to complete payment

**Check server logs** (if using systemd):
```bash
sudo journalctl -u ussd-paystack -f
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYSTACK_SECRET_KEY` | Yes | - | Live secret key from Paystack dashboard |
| `FIXED_AMOUNT_KES` | No | 50000 | Amount in cents (e.g., 50000 = 500 KES) |
| `RUST_LOG` | No | info | Logging level: debug, info, warn, error |

## Architecture

### Request Flow

```
Phone Dial (*384*36527#)
    ↓
Africa's Talking Gateway
    ↓
POST /ussd (your server)
    ↓
Normalize Phone Number
    ↓
Paystack Charge API (M-PESA provider)
    ↓
STK Push to M-PESA
    ↓
User enters PIN → Payment completes
```

### Key Components

- **`main.rs`**: HTTP server (Axum) and request routing
- **`ussd.rs`**: Phone number normalization (0722... → 254722...)
- **`paystack.rs`**: Paystack API client for M-PESA charges
- **`config.rs`**: Environment variable management

## Troubleshooting

### STK Push Not Appearing

**Check 1:** Verify phone normalization in logs
```
Log should show: "STK push sent to 254722000000"
If showing: "25407220000000" (extra zeros) → fix normalize_phone()
```

**Check 2:** Verify Paystack account
- Go to Dashboard → Settings → Payment Channels
- Ensure "Mobile Money" is enabled
- Verify account is "Live" (not Sandbox)
- Check live secret key is correct in `.env`

### Slow Response (>10 seconds)

**Cause:** Paystack API timeout or network issue

**Fix:**
1. Test Paystack directly: `curl -H "Authorization: Bearer sk_live_xxx" https://api.paystack.co/banks`
2. Check server logs: `RUST_LOG=debug cargo run`
3. Increase timeouts if needed (edit `paystack.rs`)

### USSD Response Timeout

**Cause:** Africa's Talking has 10-second timeout

**Check:**
- Server is responding in <1 second (check logs with timestamps)
- No network latency (test with `curl`)
- Firewall allows incoming traffic on port 3000

## Monitoring

### Health Check
```bash
curl http://34.122.249.119:3000/health
# Should return: OK
```

### Live Logs (systemd)
```bash
sudo journalctl -u ussd-paystack -f
```

### Manual Log Check (if using tmux)
```bash
tmux capture-pane -p -t ussd
```

## Development

### Run Tests
```bash
cargo test
```

### Check Code
```bash
cargo clippy
```

### View Generated Docs
```bash
cargo doc --open
```

## Security Notes

- ✅ Never commit `.env` with real secrets (use `.env.example`)
- ✅ Paystack secret key should be rotated every 90 days
- ✅ HTTPS enforced by firewall/reverse proxy (configure separately)
- ✅ Rate limiting recommended for production (add later with `tower` crate)

## Support

For issues:
1. Check logs: `RUST_LOG=debug cargo run`
2. Test manually: `curl -X POST http://localhost:3000/ussd --data "..."`
3. Verify Paystack credentials in Paystack dashboard
4. Check Africa's Talking documentation: https://africastalking.com/ussd

---

**Deployed**: March 2026  
**Status**: Production Ready
