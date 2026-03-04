#!/bin/bash

# USSD-Paystack Quick Deployment Playbook
# This file documents the exact commands to deploy from start to finish
# Copy-paste ready!

# ============================================================================
# PHASE 1: PREPARATION (5 minutes)
# ============================================================================

echo "📋 PHASE 1: PREPARATION"
echo "========================"
echo ""
echo "Action 1: Get Paystack Live Secret Key"
echo "  1. Go to: https://dashboard.paystack.com/settings/developer"
echo "  2. Copy your Live Secret Key (starts with sk_live_)"
echo "  3. Save it to clipboard or a safe text file"
echo ""
echo "Action 2: Update local .env file"
echo "  1. Open: /home/tweeps/ussd/ussd-paystack-backend/.env"
echo "  2. Find line: PAYSTACK_SECRET_KEY=sk_live_..."
echo "  3. Replace with YOUR actual key"
echo "  4. Save file"
echo ""
echo "Action 3: Verify binary is built"
ls -lh /home/tweeps/ussd/ussd-paystack-backend/target/release/ussd-paystack
echo ""
echo "✅ PHASE 1 Complete - Press Enter to continue"
read

# ============================================================================
# PHASE 2: DEPLOY TO SERVER (10 minutes)
# ============================================================================

echo ""
echo "🚀 PHASE 2: DEPLOY TO SERVER"
echo "============================="
echo ""
echo "Step 1: Copy binary to server"
echo "Command:"
echo "  scp /home/tweeps/ussd/ussd-paystack-backend/target/release/ussd-paystack root@34.122.249.119:/home/deploy/"
echo ""
read -p "Ready? Press Enter to execute..."
scp /home/tweeps/ussd/ussd-paystack-backend/target/release/ussd-paystack root@34.122.249.119:/home/deploy/
echo "✅ Binary copied"
echo ""

echo "Step 2: Copy .env file to server"
echo "Command:"
echo "  scp /home/tweeps/ussd/ussd-paystack-backend/.env root@34.122.249.119:/home/deploy/.env.prod"
echo ""
read -p "Ready? Press Enter to execute..."
scp /home/tweeps/ussd/ussd-paystack-backend/.env root@34.122.249.119:/home/deploy/.env.prod
echo "✅ Config file copied"
echo ""

echo "Step 3: SSH to server and set up systemd service"
echo ""
echo "Commands to run on the server:"
cat << 'EOF'

# Create deployment directory
mkdir -p /home/deploy/ussd-paystack
cd /home/deploy/ussd-paystack
mv /home/deploy/ussd-paystack ./
chmod +x ./ussd-paystack

# Copy environment config
mv /home/deploy/.env.prod ./.env
chmod 600 .env

# Create systemd service
sudo tee /etc/systemd/system/ussd-paystack.service > /dev/null << 'SERVICE_EOF'
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
EnvironmentFile=/home/deploy/ussd-paystack/.env

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl start ussd-paystack
sudo systemctl enable ussd-paystack
sudo systemctl status ussd-paystack

EOF

echo ""
echo "⚠️  You need to SSH to server and run the commands above"
echo "   Command: ssh root@34.122.249.119"
echo ""
read -p "Ready to continue after SSH setup? Press Enter..."

# ============================================================================
# PHASE 3: VERIFY DEPLOYMENT (5 minutes)
# ============================================================================

echo ""
echo "✅ PHASE 3: VERIFY DEPLOYMENT"
echo "=============================="
echo ""

echo "Test 1: Health Check"
echo "  Command: curl http://34.122.249.119:3000/health"
curl -v http://34.122.249.119:3000/health 2>&1 | head -20
echo ""

echo "Test 2: USSD Endpoint"
echo "  Command: curl -X POST http://34.122.249.119:3000/ussd \\
  --data 'sessionId=test&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902'"
echo ""
curl -X POST "http://34.122.249.119:3000/ussd" \
  --data "sessionId=test&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"
echo ""
echo ""

# ============================================================================
# PHASE 4: CONFIGURE AFRICA'S TALKING (5 minutes)
# ============================================================================

echo ""
echo "📱 PHASE 4: CONFIGURE AFRICA'S TALKING"
echo "======================================"
echo ""
echo "Action 1: Update Callback URL"
echo "  1. Go to: https://africastalking.com/app"
echo "  2. Navigate to: USSD → Manage Shortcodes"
echo "  3. Find shortcode: *384*36527#"
echo "  4. Set Callback URL to: http://34.122.249.119:3000/ussd"
echo "  5. Click SAVE"
echo ""
echo "Action 2: Verify Callback"
echo "  Africa's Talking should ping your endpoint to verify"
echo "  Check logs: ssh root@34.122.249.119"
echo "             sudo journalctl -u ussd-paystack -f"
echo ""
read -p "Done configuring Africa's Talking? Press Enter to continue..."

# ============================================================================
# PHASE 5: LIVE TEST (2 minutes)
# ============================================================================

echo ""
echo "📞 PHASE 5: LIVE TEST"
echo "===================="
echo ""
echo "Final Test: Dial from your phone"
echo ""
echo "  1. Make sure you have a Kenyan phone number"
echo "  2. Dial: *384*36527#"
echo "  3. Wait 1-2 seconds for USSD message"
echo "  4. M-PESA prompt should appear"
echo "  5. Enter your M-PESA PIN"
echo "  6. Payment completes (KES 500)"
echo ""
echo "While testing, watch the server logs:"
echo "  Command: ssh root@34.122.249.119 && sudo journalctl -u ussd-paystack -f"
echo ""
echo "Expected log entry:"
echo '  2026-03-03T14:22:10.123Z  INFO ussd_paystack: USSD | session=... | phone=254722000000'
echo '  2026-03-03T14:22:10.456Z  INFO ussd_paystack: ✅ STK push sent to 254722000000'
echo ""
read -p "Perform live test now, then press Enter when done..."

# ============================================================================
# PHASE 6: MONITORING SETUP (optional)
# ============================================================================

echo ""
echo "📊 PHASE 6: MONITORING SETUP (Optional)"
echo "======================================"
echo ""
echo "Option A: Manual Monitoring (Free)"
echo "  Watch logs in real-time:"
echo "  ssh root@34.122.249.119"
echo "  sudo journalctl -u ussd-paystack -f"
echo ""
echo "Option B: UptimeRobot (Free)"
echo "  1. Go to: https://uptimerobot.com"
echo "  2. Create new monitor:"
echo "     - Type: HTTP(s)"
echo "     - URL: http://34.122.249.119:3000/health"
echo "     - Interval: 5 minutes"
echo "  3. Get alerts if server goes down"
echo ""
echo "Option C: CloudFlare Pages (Advanced)"
echo "  Provides automatic HTTPS, DDoS protection, caching"
echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo ""
echo "✅ ✅ ✅ DEPLOYMENT COMPLETE! ✅ ✅ ✅"
echo "=========================================="
echo ""
echo "Your USSD Payment Gateway is LIVE! 🎉"
echo ""
echo "Summary:"
echo "  Live URL:      http://34.122.249.119:3000/ussd"
echo "  Health Check:  http://34.122.249.119:3000/health"
echo "  USSD Code:     *384*36527#"
echo "  Amount:        KES 500"
echo "  Provider:      M-PESA (Paystack)"
echo ""
echo "Next Steps:"
echo "  1. Monitor logs: ssh root@34.122.249.119 && sudo journalctl -u ussd-paystack -f"
echo "  2. Share USSD code with customers"
echo "  3. Track transactions in Paystack dashboard"
echo "  4. Set up monitoring (UptimeRobot recommended)"
echo ""
echo "Support Resources:"
echo "  - Full Guide:   /home/tweeps/ussd/COMPLETE_SETUP_GUIDE.md"
echo "  - Quick Ref:    /home/tweeps/ussd/QUICK_REFERENCE.md"
echo "  - Troubleshoot: See COMPLETE_SETUP_GUIDE.md#troubleshooting"
echo ""
echo "Questions or issues?"
echo "  1. Check server logs"
echo "  2. Verify Paystack credentials"
echo "  3. Verify Africa's Talking callback URL"
echo "  4. Check firewall rules"
echo ""
echo "🚀 You're live! Congratulations!"
echo ""

