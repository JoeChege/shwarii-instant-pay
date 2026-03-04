USSD-to-Paystack M-PESA Integration Overview
To let Kenyan users pay a fixed amount via USSD (23401#) with Paystack’s M-PESA, you need a USSD
gateway/service and a backend (in Rust) that handles USSD sessions and calls Paystack’s API. In practice you
would: (1) Acquire a USSD code (through Safaricom or an aggregator like Africa’s Talking) and register a
webhook (callback URL) for USSD requests. (2) Design the USSD flow so that when 23401# is dialed, your
server immediately initiates an M-PESA STK push of the fixed amount. (3) Implement a Rust HTTP service
(using an async framework like Actix or Warp) to handle the USSD request and call Paystack’s charge API. (4)
Call Paystack’s M-PESA API by sending the customer’s phone (with country code) and fixed amount;
Paystack then triggers the phone’s M-PESA PIN prompt 1 . (5) Handle Paystack webhooks (e.g.
charge.success ) to confirm payment after the user enters the PIN 2 . Rust’s async I/O (Tokio, reqwest,
etc.) can handle dozens of simultaneous USSD sessions with ease. For example, Africa’s Talking notes that
its USSD gateway “is built to handle thousands of concurrent API requests at any one time” 3 , so serving
~33 simultaneous users is straightforward.
1. Set Up a USSD Gateway and Short Code
• Choose a USSD provider: In Kenya, companies like Safaricom or Africa’s Talking provide USSD
shortcodes. Africa’s Talking offers shared codes (e.g. *483*X# ) or dedicated codes (X#) that work on
Safaricom, Airtel, Telkom, etc. Register 234*01# (or a similar code) through the provider.
• Register your callback URL: The USSD provider will send each session (dial) as an HTTP request to
your server’s callback URL. For example, Africa’s Talking sends GET with parameters like
phoneNumber , sessionId , text , etc. (consult your provider’s docs). Your Rust service must
have a publicly reachable endpoint to receive these.
• Handle USSD session format: The provider expects your endpoint to respond with a message
prefixed by CON (to continue the session) or END (to finish). For example:
CON Pay KES 500.00 – A prompt is being sent to your phone. (to keep the user in
USSD or inform them). In our case, because the amount is fixed and there’s no extra choice, you can
immediately end the session after initiating the payment. Ensure the response is sent back quickly.
2. Design the USSD Flow
• Initial USSD request: When the user dials 23401#, your server’s USSD callback receives a request
with empty text (since it’s the session start). In this handler, you should initiate the payment right
away.
• Initiate STK push via Paystack: Call the Paystack Charge API with the fixed amount, customer’s
phone (from the USSD request), currency KES, and a default email (Paystack requires an email). You
can hard-code the email (e.g. a generic payments@example.com ) since the payment is fixed and
you just need a valid email for the API 4 .
• Respond on USSD: After calling Paystack, immediately reply to the user. For example, respond with
CON Please check your phone for an M-PESA prompt to enter your PIN. or simply
END An M-PESA prompt has been sent to complete your payment. This ends the USSD
1session. Paystack will have initiated an STK push on the user’s phone
standard M-PESA PIN entry screen.
1
, so the user will see the
3. Calling Paystack’s M-PESA API (Rust Implementation)
Use Rust’s HTTP client (e.g. reqwest or the paystack-rs crate) to call the Paystack Charge endpoint.
For example, with reqwest your JSON payload will include the phone and provider “mpesa”, plus the fixed
amount. The Medium tutorial by Emmanuel Bett shows this approach in PHP; a similar payload in Rust
(pseudocode) is:
// Example using paystack-rs or reqwest (pseudo-code)
let email = "default@example.com"; // Paystack requires an email 4
let amount_cents = (FIXED_AMOUNT_KES * 100).to_string(); // Paystack uses
currency *100
let formatted_phone = format!("+254{}", &user_phone[1..]); // e.g.
"+254722000000" 5
let payload = json!({
"email": email,
"amount": amount_cents,
"currency": "KES",
"mobile_money": {
"phone": formatted_phone,
"provider": "mpesa"
},
"reference": unique_reference,
});
let client = reqwest::Client::new();
let resp = client.post("https://api.paystack.co/charge")
.bearer_auth(PAYSTACK_SECRET_KEY)
.json(&payload)
.send()
.await?;
This
matches
the
documented
Paystack
API:
include
"mobile_money": { "phone": "+2547XXXXXXXX", "provider": "mpesa" } in the charge request
4
6
.
(The
Rust
paystack-rs
TransactionRequestBuilder
crate
and specifying
preferred.) Paystack will reply with
can
buildandsend
Currency::KesandChannel::MobileMoney , if
status: true
also
and
this
request
using
"display_text": "Please complete
authorization on your mobile phone" , indicating the STK push has been sent
1
.
4. Handling Paystack’s Webhook
After the user enters their M-PESA PIN, Paystack processes the payment asynchronously. You must set up a
webhook endpoint on your Rust server to receive Paystack’s notifications. Paystack will send a
2charge.success event to your webhook URL when the payment completes successfully
2
. In your
webhook handler:
• Verify the Paystack signature (using your secret key) to ensure the request is legitimate.
• Check that event == "charge.success" .
• Verify the payment (you can also call Paystack’s Verify API on the reference) and then mark the
transaction as paid in your system.
From Paystack’s docs: “When the user completes payment, a response is sent to the merchant’s webhook…
The charge.success event is raised on successful payment”
2
. So your Rust server should parse this
webhook JSON and update the order status. This ensures the user’s payment is confirmed even though the
USSD session has ended.
5. Concurrency and Reliability
Rust’s async model (using Tokio or async-std) makes handling many simultaneous USSD calls trivial. Each
USSD callback and Paystack API call can be processed as an independent async task. Handling ~33
concurrent sessions is well within capability: for example, Africa’s Talking notes their USSD gateway can
serve thousands of concurrent requests 3 , so 33 at a time is easily managed. In Rust, use non-blocking I/
O (e.g. async fn handlers) and let the runtime manage multiple connections. For the Paystack call, use
an asynchronous HTTP client like reqwest::Client so that waiting on M-PESA (180-second window)
doesn’t block other sessions.
6. Fixed-Amount Configuration
Since the payment amount is fixed, you can store this value in a configuration file or environment variable.
When handling the USSD request, your code will use this fixed amount (e.g. 50000 for KES 500.00 in
Paystack’s cents unit) in the charge payload. Ensure your Paystack call converts the currency correctly (KES *
100) 5 . No user input for amount is needed.
Example Workflow Summary
1. User dials 23401# on their phone.
2. USSD gateway calls your Rust endpoint. Your code sees an empty USSD text and immediately
prepares the Paystack charge.
3. Rust code calls Paystack Charge API with fixed amount, user’s phone (+254 format), default email,
provider “mpesa” 4 6 .
4. USSD response to user: e.g. END KES 500 payment is being processed. Please enter
your M-PESA PIN on the M-PESA prompt. The session ends.
5. User sees M-PESA STK push on their phone and enters PIN.
6. Paystack webhook fires: Your Rust webhook handler receives charge.success and verifies it
. Mark payment complete.
7. (Optional) Notify user of success (e.g. via SMS or push notification from your system).
2
By following these steps and using Rust’s async features, you create a professional, scalable USSD payment
integration. Citations from Paystack’s docs and examples ensure you call the APIs correctly: Paystack
3confirms that STK pushes work via their Charge API when you send "provider": "mpesa"
1
, and their
docs emphasize using webhooks to complete the flow
. With the Rust backend handling calls
concurrently, dozens of clients can initiate 23401# at the same time without issue 3 .
2
Sources: Paystack M-PESA integration guide
PESA example code 4 6 .
1
2
1
2
; Africa’s Talking USSD documentation
3
; Paystack M-
Payment Channels | Paystack Developer Documentation
https://paystack.com/docs/payments/payment-channels/
3
USSD API - Mobile Apps Accessible Everywhere
https://africastalking.com/ussd
4
5
6
How to Integrate Paystack M-Pesa Payments in a Laravel + Vue.js Application | by Emmanuel Bett
| Medium
https://emmanuel-bett.medium.com/how-to-integrate-paystack-m-pesa-payments-in-a-laravel-vue-js-application-b1d25dcc52c9
4