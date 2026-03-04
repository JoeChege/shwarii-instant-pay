#!/bin/bash

# USSD-Paystack Deployment Script for 34.122.249.119
# This script builds and deploys the Rust USSD server to your live server

set -e

DEPLOY_USER=${DEPLOY_USER:-root}
DEPLOY_HOST="34.122.249.119"
DEPLOY_PATH="/home/deploy/ussd-paystack"
SERVICE_NAME="ussd-paystack"

echo "🚀 Building USSD-Paystack for deployment..."

# Build release binary
cd /home/tweeps/ussd/ussd-paystack-backend
$HOME/.cargo/bin/cargo build --release

if [ ! -f "target/release/ussd-paystack" ]; then
    echo "❌ Build failed: binary not found"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "📦 Binary size: $(du -h target/release/ussd-paystack | cut -f1)"
echo ""

# Create deployment instructions
cat > DEPLOY_INSTRUCTIONS.md << 'DEPLOY_EOF'
# Deployment Steps for 34.122.249.119

## Prerequisites
- SSH access to 34.122.249.119
- Paystack Live Secret Key (from dashboard.paystack.com)
- Nginx or systemd setup on the server

## Step 1: Copy Binary to Server

```bash
# From your local machine:
scp target/release/ussd-paystack root@34.122.249.119:/home/deploy/
scp .env root@34.122.249.119:/home/deploy/.env.prod
```

## Step 2: SSH to Server and Setup

```bash
ssh root@34.122.249.119

# Create deployment directory if not exists
mkdir -p /home/deploy/ussd-paystack
cd /home/deploy/ussd-paystack

# Move binary
mv /home/deploy/ussd-paystack ./
chmod +x ./ussd-paystack

# Create production .env
cat > .env << 'EOF'
PAYSTACK_SECRET_KEY=sk_live_your_actual_secret_key_here
FIXED_AMOUNT_KES=50000
RUST_LOG=info
EOF

chmod 600 .env
```

## Step 3: Create Systemd Service (Recommended)

```bash
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

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start ussd-paystack
sudo systemctl enable ussd-paystack

# Check status
sudo systemctl status ussd-paystack
```

## Step 4: Configure Nginx Reverse Proxy (Optional)

```bash
sudo tee /etc/nginx/sites-available/ussd.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 34.122.249.119;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ussd.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Update Africa's Talking Callback

1. Go to [Africa's Talking Dashboard](https://africastalking.com/app)
2. Navigate to: **USSD** → **Manage Webhooks** or **Manage Shortcodes**
3. Set Callback URL to:
   - `http://34.122.249.119/ussd` (if using Nginx)
   - Or `http://34.122.249.119:3000/ussd` (direct)
4. Click Save

## Step 6: Test Live

```bash
# SSH to server and check logs
ssh root@34.122.249.119
sudo journalctl -u ussd-paystack -f

# From another terminal, dial the USSD code from your phone:
*384*36527#
```

Expected in logs:
```
2026-03-03T14:22:10.123Z  INFO ussd_paystack: USSD | session=abc123xyz | phone=+254722000000 | text='' | network=63902
2026-03-03T14:22:10.456Z  INFO ussd_paystack: ✅ STK push sent to 254722000000 | Amount: KES 500
```

## Troubleshooting

### Service won't start
```bash
sudo systemctl status ussd-paystack
sudo journalctl -u ussd-paystack -n 50
```

### Can't connect from Africa's Talking
```bash
# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp  # if needed
```

### Paystack returns "Invalid key"
- Verify `PAYSTACK_SECRET_KEY` in `/home/deploy/ussd-paystack/.env`
- Get correct key from dashboard.paystack.com
- Restart service: `sudo systemctl restart ussd-paystack`

## Monitoring

### View Live Logs
```bash
ssh root@34.122.249.119
sudo journalctl -u ussd-paystack -f
```

### Health Check
```bash
curl http://34.122.249.119:3000/health
# Should return: OK
```

### Manual Test
```bash
curl -X POST "http://34.122.249.119:3000/ussd" \
  --data "sessionId=test&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"
```

## Rollback

If something goes wrong:
```bash
sudo systemctl stop ussd-paystack
# Fix issue (check logs)
sudo systemctl start ussd-paystack
```

DEPLOY_EOF

echo "📄 Deployment instructions saved to DEPLOY_INSTRUCTIONS.md"
echo ""
echo "Next steps:"
echo "1. Edit PAYSTACK_SECRET_KEY in .env with your live key"
echo "2. Run: scp target/release/ussd-paystack root@34.122.249.119:/home/deploy/"
echo "3. SSH to 34.122.249.119 and follow DEPLOY_INSTRUCTIONS.md"
echo ""
echo "Or copy this command to deploy:"
echo "scp target/release/ussd-paystack root@34.122.249.119:/home/deploy/ && scp .env root@34.122.249.119:/home/deploy/.env.prod"
