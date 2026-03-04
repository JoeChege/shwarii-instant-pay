#!/bin/bash

# Setup ngrok for USSD local development with Africa's Talking callback
# This script installs ngrok and creates a tunnel for your local USSD server

set -e

echo "📦 Installing ngrok..."

# Add ngrok GPG key and repository
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update \
  && sudo apt install -y ngrok

echo "✅ ngrok installed successfully"
echo ""
echo "🔐 Next steps:"
echo "1. Get your ngrok authtoken from: https://dashboard.ngrok.com/auth"
echo "2. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN"
echo "3. Start your Rust backend: cd ussd-paystack-backend && cargo run"
echo "4. In another terminal, run: ./start_ngrok_tunnel.sh"
echo "5. Copy the HTTPS URL from ngrok and set it in Africa's Talking dashboard"
echo ""
