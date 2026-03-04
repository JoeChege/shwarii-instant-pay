USSD-Payment Integration Overview
To implement a direct payment USSD flow in Kenya using Africa’s Talking and Paystack, you’ll set up a USSD
“channel” on Africa’s Talking and write a Rust HTTP server that: (1) handles incoming USSD requests, (2)
triggers a fixed-amount Paystack M-PESA STK push, and (3) listens for Paystack webhooks. In production
you register a shared or dedicated Kenyan USSD code with Africa’s Talking; in development you can use the
Africa’s Talking Sandbox and simulator. Africa’s Talking will forward each USSD dial to your callback URL via
an HTTP POST with form fields like sessionId , serviceCode , phoneNumber , and text 1 . Your
Rust handler parses these fields, then returns a plain-text response beginning with either CON (to
continue the session) or END (to terminate). For our flow – which immediately initiates payment – you’ll
send an END response such as “END A payment prompt has been sent to your phone.”. (Africa’s Talking
requires the content-type to be text/plain
2
.)
For example, using Actix-Web in Rust you might write:
#[derive(Deserialize)]
struct UssdRequest {
sessionId: String,
serviceCode: String,
phoneNumber: String,
text: String,
}
#[post("/ussd")]
async fn ussd_handler(form: web::Form<UssdRequest>) -> impl Responder {
let phone = form.phoneNumber.clone();
let text = form.text.clone();
if text.is_empty() {
// New session: trigger payment
let _ = charge_customer(&phone).await;
// Respond with END to indicate no further menu
let resp = HttpResponse::Ok()
.content_type("text/plain")
.body("END A payment prompt has been sent to your phone.");
return resp;
}
// (If needed, handle other menu logic here)
HttpResponse::Ok().body("END Unrecognized input.")
}
1Africa’s Talking Setup
• Register a USSD Channel: In the Africa’s Talking dashboard create a new USSD channel (shortcode).
In Kenya you can choose a shared code (usable on Safaricom, Airtel, Telkom) or a dedicated code
(covers Safaricom, Airtel, Telkom, Equitel) 3 . In the Sandbox environment, use the provided USSD
Code (e.g. *234*01# ) and define your callback URL under the USSD settings 4 .
• Configure Callback URL: Point the channel’s callback/webhook to your Rust service’s public
endpoint (e.g. https://yourserver.com/ussd ). The callback must be HTTP(S)-accessible. When
running locally, use a tunneling tool like ngrok to expose your server (see [25†L100-L107]).
• Testing with Simulator: In sandbox mode, use the Africa’s Talking USSD simulator (at https://
simulator.africastalking.com:1517 ) to dial your code. First register one or more test
numbers in the simulator (via the menu) so you can simulate sessions 5 . For each new “call” the
simulator will send a form POST to your callback with the USSD fields.
• Session Logs: Use the Africa’s Talking dashboard logs and your server logs to trace each request/
response. Africa’s Talking expects responses in plain text and will forward the CON / END back to
the user
6
2
.
USSD Flow and Handling
When the user dials the USSD code, Africa’s Talking sends your callback a POST with:
• sessionId : a unique session identifier for that USSD session
• serviceCode : the USSD string dialed (e.g. *234*01# )
• phoneNumber : the user’s MSISDN (e.g. +2547XXXXXXXX )
• text : the “stack” of user inputs so far (empty on first dial)
.
1
Your service should parse these (in Actix, web::Form<UssdRequest> can deserialize them). On the initial
request ( text == "" ), immediately initiate the fixed-charge M-PESA STK push via Paystack (see below).
Then return an END response with a message like “A payment prompt has been sent.” (Using CON here
would expect further input, but since we end the flow, we use END
7
). For example:
END A payment prompt has been sent to your phone.
Africa’s Talking will then display this message and close the session.
For clarity, here is a simplified Actix-Web setup including both endpoints (USSD callback and Paystack
webhook):
#[actix_web::main]
async fn main() -> std::io::Result<()> {
HttpServer::new(|| {
App::new()
.service(ussd_handler)
.service(paystack_webhook)
})
2.bind("0.0.0.0:8000")?
.run()
.await
}
This configures Actix to listen on port 8000 and route POST /ussd and /paystack/webhook to our
handlers. Actix-Web (powered by Tokio) is asynchronous and highly concurrent, easily supporting dozens of
concurrent sessions. You can adjust .workers(n) to tune thread count if needed.
Initiating Paystack STK Push
Inside the USSD handler, once you detect the start of session, call Paystack’s Charge API to initiate an M-
PESA STK push. According to Paystack’s documentation, charging a customer via M-PESA involves a POST to
https://api.paystack.co/charge with JSON including the phone number and provider “mpesa” 8
9
. For example (Rust using the reqwest crate):
async fn charge_customer(phone: &str) -> Result<(), reqwest::Error> {
let client = reqwest::Client::new();
// Paystack requires amount in the smallest currency unit; assume KES to
cents.
let charge_body = serde_json::json!({
"amount": 10000,
// e.g. 10000 kobo = KES 100.00
"currency": "KES",
"mobile_money": {
"phone": phone,
"provider": "mpesa"
},
// 'email' can be a dummy or real identifier for the customer
"email": "customer@example.com"
});
let res = client.post("https://api.paystack.co/charge")
.bearer_auth(std::env::var("PAYSTACK_SECRET").unwrap())
// your secret
key
.json(&charge_body)
.send()
.await?;
let resp_json: serde_json::Value = res.json().await?;
println!("Paystack charge response: {}", resp_json);
Ok(())
}
Notes: The amount should be your fixed amount in cents (kobo) (e.g. 10000 for KES 100.00). Include the
merchant’s
Paystack
secret
mobile_money.provider
key
in
the
Authorization:
code for Kenya’s M-PESA is
3
Bearer
"mpesa"
8
<secret>
header.
The
. Paystack will respond with"status":"pay_offline"
phone”
9
and a
"display_text"
like “Please complete authorization on your
. At this point, the customer will receive an STK push on their handset to approve the payment.
Your USSD handler can ignore this immediate response content (it is meant for logging or troubleshooting);
the user will act on their phone prompt. You should quickly return the USSD END message to Africa’s
Talking (see above) without waiting for the payment to complete.
Paystack Webhook Handling
Because M-PESA payments are completed asynchronously by the network, Paystack will later send a
webhook to notify your server of the result. In your Africa’s Talking app, you would configure your Paystack
webhook URL (e.g. https://yourserver.com/paystack/webhook ). Paystack will POST JSON events like
charge.success when payment succeeds, or charge.failed on error 10 .
In Rust/Actix, set up a handler for the webhook:
#[derive(Deserialize)]
struct PaystackEvent {
event: String,
data: serde_json::Value, // contains transaction details
}
#[post("/paystack/webhook")]
async fn paystack_webhook(req: HttpRequest, payload: web::Json<PaystackEvent>) -
> impl Responder {
// (Optional) Verify signature header x-paystack-signature using HMAC-SHA512
11 .
if let Some(sig) = req.headers().get("x-paystack-signature") {
// Compute HMAC-SHA512 of payload and compare to header (omitted for
brevity).
}
// Process the event
match payload.event.as_str() {
"charge.success" => {
// Payment succeeded: you can update records, send SMS, etc.
println!("Payment succeeded: {:?}", payload.data);
}
"charge.failed" => {
// Payment failed or timed out
println!("Payment failed: {:?}", payload.data);
}
_ => { /* ignore other events */ }
}
// Acknowledge receipt with 200 OK immediately
4HttpResponse::Ok().finish()
}
Key points: always respond 200 OK quickly to Paystack webhooks. You should verify that the request is
genuine by checking the x-paystack-signature header (Paystack signs the JSON payload with your
secret using HMAC SHA-512 11 ). Inside the charge.success event data you’ll see the transaction
reference, status, etc. (see example JSON in Paystack docs 10 ). Use this to confirm the charge succeeded
(and take any business action).
Concurrency and Performance
Rust’s async frameworks (Actix-Web, Warp, etc.) make it easy to handle multiple sessions concurrently. For
example, Actix-Web’s HttpServer by default spawns multiple worker threads (one per CPU core) on the
Tokio runtime. Even a modest configuration easily supports dozens of parallel USSD sessions (33 concurrent
users is trivial for Actix). Just ensure you don’t block threads (all I/O – HTTP calls to Paystack – should be
done async/await ). The example above uses async fn handlers and reqwest (which is async by
default), so each incoming USSD request and outgoing Paystack call will not block the server from handling
others.
In practice, you might set the server’s worker count explicitly, e.g.:
HttpServer::new(|| /* ... */)
.workers(8) // use 8 threads, adjust to your CPU
.run().await
This configuration, together with non-blocking I/O, will handle 33+ concurrent sessions and the associated
Paystack calls with ease.
Summary of Steps
1. Set up Africa’s Talking USSD: Register a USSD channel (short code) in your AT account. In sandbox,
use the simulator. Configure the callback URL to point to your server 4 .
2. Implement Rust HTTP Endpoints: Use an async framework (Actix-Web or Warp). Create a POST /
ussd endpoint that reads Africa’s Talking’s form data (sessionId, text, etc.)
1
.
3. USSD Flow Logic: On the first (empty-text) request, call Paystack’s /charge API for M-PESA with
fixed amount and the user’s phone number (in +2547XXXXXXXX format)
9
. Return a text
response END Payment prompt has been sent (with Content-Type text/plain)
2
6
.
4. Paystack Charge: Use an HTTP client (e.g. reqwest ) to POST https://api.paystack.co/
charge with JSON: {"amount": ..., "currency":"KES", "mobile_money":
{"phone":"+2547...", "provider":"mpesa"}, "email":"..."} , and include
Authorization: Bearer {secret_key} .
5. Handle Paystack Webhook: Expose a POST /paystack/webhook to receive Paystack events.
Verify x-paystack-signature if desired 11 , then check for "event":"charge.success" to
confirm payment 10 .
56. Testing: In sandbox, use the AT simulator (https://simulator.africastalking.com) to dial your USSD
code and ensure the flow works. Check your logs and Africa’s Talking session logs to trace the
interaction.
7. Production: Apply for a live USSD code via Africa’s Talking. Configure the callback URL to your
production server. Africa’s Talking will raise the code on Kenyan networks (shared codes on major
carriers immediately) 3 . Ensure your Paystack account is enabled for M-PESA and your webhook
URL is set in Paystack’s dashboard.
By following these steps – wiring Africa’s Talking’s USSD API to trigger Paystack’s M-PESA charge – you
create a seamless dial-to-pay service. Africa’s Talking handles the telecom session and menus (requiring
your code to prefix responses with CON / END ), while your Rust backend manages the payment logic and
concurrency. The result is an end-to-end USSD payment flow: a user dials 23401#, instantly receives an M-
PESA push for payment, and your server processes the transaction asynchronously 9 10 .
Sources: Africa’s Talking USSD API documentation and tutorials
charges and webhooks 9 10 11 .
1
6
1
4
3
; Paystack API docs on M-PESA
Building a Serverless USSD Application with AWS and Africa’s Talking | by Praneeth Shetty | Medium
https://medium.com/@praneethshettyy/building-a-serverless-ussd-application-with-aws-and-africas-talking-11f793d8d5e7
2
7
USSD · Mobile Communication Apis
https://africastalkingltd.gitbooks.io/mobile-communication-apis/content/python/programmer_level/ussd.html
3
USSD Kenya | Africa's Talking Help Center
http://help.africastalking.com/en/articles/8165894-ussd-kenya
4
5
How do I get started on the Africa's Talking Sandbox? | Africa's Talking Help Center
http://help.africastalking.com/en/articles/1170660-how-do-i-get-started-on-the-africa-s-talking-sandbox
8
9
10
Payment Channels | Paystack Developer Documentation
https://paystack.com/docs/payments/payment-channels/
11
Webhooks | Paystack Developer Documentation
https://paystack.com/docs/payments/webhooks/
6