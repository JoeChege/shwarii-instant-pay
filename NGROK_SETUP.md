# NGrok Setup Guide for Africa's Talking USSD Callback

This guide helps you set up a secure tunnel for local USSD development with Africa's Talking.

## Why NGrok?

- Expose your local USSD server to the internet securely
- Test Africa's Talking callbacks without deploying to production
- Create a stable HTTPS URL for your callback endpoint

## Installation

```bash
cd /home/tweeps/ussd
chmod +x setup_ngrok.sh
./setup_ngrok.sh
```

This will:
1. ✅ Add ngrok's GPG key
2. ✅ Add ngrok's package repository
3. ✅ Install ngrok

## Configuration

1. **Get your authtoken:**
   - Visit https://dashboard.ngrok.com/auth
   - Copy your authtoken

2. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

   This creates `~/.ngrok2/ngrok.yml` with your credentials.

## Starting the Tunnel

### Step 1: Start your USSD backend

```bash
cd /home/tweeps/ussd/ussd-paystack-backend
cargo run  # or cargo run --release
```

Expected output:
```
🚀 Africa's Talking USSD server live on http://0.0.0.0:3000
```

### Step 2: Start the ngrok tunnel (in another terminal)

```bash
cd /home/tweeps/ussd
chmod +x start_ngrok_tunnel.sh
./start_ngrok_tunnel.sh
```

Expected output:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://YOUR-SUBDOMAIN.ngrok.io -> http://localhost:3000
```

### Step 3: Get your HTTPS URL

The `https://YOUR-SUBDOMAIN.ngrok.io` URL is your **public callback URL**.

## Setting the Callback in Africa's Talking

1. Log in to [Africa's Talking Dashboard](https://africastalking.com/)
2. Go to **USSD > Settings > Callback URL**
3. Set it to: `https://YOUR-SUBDOMAIN.ngrok.io/ussd`
4. Save and test with a USSD code

### Example

If ngrok shows:
```
Forwarding    https://abc123def456.ngrok.io -> http://localhost:3000
```

Set your Africa's Talking callback URL to:
```
https://abc123def456.ngrok.io/ussd
```

## Monitoring Requests

While the tunnel is running:
- **ngrok Web Interface:** http://127.0.0.1:4040
- View all incoming USSD requests in real-time
- Inspect request/response headers and bodies
- Replay requests for testing

## Regions Available

```
us     - United States
eu     - Europe
au     - Australia
ap     - Asia-Pacific
in     - India
jp     - Japan
sa     - South Africa (closest for Africa's Talking)
br     - Brazil
```

To use a specific region, edit `start_ngrok_tunnel.sh` and change:
```bash
REGION=${NGROK_REGION:-us}  # Change 'us' to your region
```

### Recommended for Africa's Talking
```bash
# In start_ngrok_tunnel.sh
REGION=${NGROK_REGION:-sa}  # South Africa region (lowest latency)
```

## Troubleshooting

### "Error: failed to reconnect session"
- Your authtoken is invalid or expired
- Run: `ngrok config add-authtoken YOUR_AUTH_TOKEN` again

### "Error: Address already in use"
- Port 3000 is already in use
- Check: `lsof -i :3000`
- Kill the process: `kill -9 <PID>`

### No requests reaching your server
- Ensure your backend is running on port 3000
- Check ngrok Web Interface (http://127.0.0.1:4040) for incoming requests
- Verify Africa's Talking has the correct callback URL

### Africa's Talking not sending requests
- Test manually: `curl -X POST https://YOUR-NGROK-URL/ussd -d "sessionId=test&phoneNumber=254712345678&text=&serviceCode=*123#&networkCode=AT"`
- Check ngrok logs: http://127.0.0.1:4040/inspect/http
- Verify the callback URL matches exactly (including trailing slash)

## Advanced Usage

### Using ngrok with Custom Domain

If you have a paid ngrok plan:
```bash
ngrok http 3000 --domain your-custom-domain.ngrok.io
```

### Using ngrok Configuration File

Create `~/.ngrok2/ngrok.yml`:
```yaml
version: "3"
authtoken: YOUR_AUTH_TOKEN
region: sa
tunnels:
  ussd:
    proto: http
    addr: 3000
```

Then start with:
```bash
ngrok start ussd
```

### Running ngrok in Background

```bash
nohup ngrok http 3000 --region=sa > ngrok.log 2>&1 &
tail -f ngrok.log
```

## Quick Reference

| Task | Command |
|------|---------|
| Install ngrok | `./setup_ngrok.sh` |
| Add authtoken | `ngrok config add-authtoken TOKEN` |
| Start tunnel | `./start_ngrok_tunnel.sh` |
| Change region | Edit `start_ngrok_tunnel.sh`, set `REGION=sa` |
| View requests | http://127.0.0.1:4040 |
| Kill tunnel | `Ctrl+C` in the tunnel terminal |

## Security Notes

⚠️ **Never commit your authtoken to version control!**

- Your ngrok.yml file is in `~/.ngrok2/` (not in the project)
- Treat your authtoken like a password
- Regenerate if accidentally exposed

---

**Happy testing! 🚀**

For more help: https://ngrok.com/docs
