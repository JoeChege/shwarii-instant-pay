#!/bin/bash

# Start ngrok tunnel for USSD callback
# This exposes your local port 3000 to the internet via ngrok

set -e

PORT=3000
REGION=${NGROK_REGION:-us}  # Change to your region (us, eu, au, ap, in, jp, sa, etc.)

echo "🌐 Starting ngrok tunnel..."
echo "   Local port: $PORT"
echo "   Region: $REGION"
echo ""
echo "⏳ Waiting for tunnel to start..."
echo ""

# Start ngrok and capture the output
ngrok http $PORT --region=$REGION

echo ""
echo "❌ Tunnel closed"
