#!/bin/bash

cd /home/tweeps/ussd/ussd-paystack-backend

# Start server in background
PAYSTACK_SECRET_KEY=sk_test_dummy_key_for_local_testing ./target/release/ussd-paystack > server.log 2>&1 &
SERVER_PID=$!

echo "Starting USSD server (PID: $SERVER_PID)..."
sleep 3

# Test health check
echo "Testing health check..."
curl -s http://localhost:3000/health
echo -e "\n"

# Test USSD callback
echo "Testing USSD callback with Africa's Talking format..."
curl -X POST "http://localhost:3000/ussd" \
  --data "sessionId=test123&serviceCode=384*36527&phoneNumber=0722000000&text=&networkCode=63902"
echo -e "\n"

# Show logs
echo -e "\nServer logs:"
cat server.log

# Clean up
kill $SERVER_PID 2>/dev/null
