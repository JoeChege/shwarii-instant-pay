use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{debug, error, info};

#[derive(Clone)]
pub struct PaystackClient {
    client: Client,
    secret_key: String,
}

#[derive(Serialize)]
struct ChargeRequest {
    email: String,
    amount: u32,
    currency: String,
    mobile_money: MobileMoneyPayload,
}

#[derive(Serialize)]
struct MobileMoneyPayload {
    phone: String,
    provider: String,
}

#[derive(Deserialize)]
struct ChargeResponse {
    status: bool,
    message: String,
    #[serde(default)]
    data: Option<serde_json::Value>,
}

impl PaystackClient {
    pub fn new(secret_key: String) -> Self {
        if secret_key.is_empty() {
            error!("⚠️  WARNING: Paystack secret key is empty!");
        }
        PaystackClient {
            client: Client::new(),
            secret_key,
        }
    }

    pub async fn charge_mpesa(
        &self,
        phone_number: &str,
        amount_kes: u32,
    ) -> Result<String, String> {
        // Convert KES to cents (e.g., 500 KES = 50000 cents)
        let amount_cents = amount_kes;

        // Paystack requires phone in E.164 format with + prefix
        // Convert 254722000000 → +254722000000
        let formatted_phone = if phone_number.starts_with('+') {
            phone_number.to_string()
        } else {
            format!("+{}", phone_number)
        };

        // Validate phone format
        if !formatted_phone.starts_with("+254") || formatted_phone.len() != 13 {
            error!(
                "❌ Invalid phone format: {} (should be +254XXXXXXXXX)",
                formatted_phone
            );
            return Err(format!("Invalid phone format: {}", formatted_phone));
        }

        let payload = ChargeRequest {
            email: "noreply@ussdpay.io".to_string(),
            amount: amount_cents,
            currency: "KES".to_string(),
            mobile_money: MobileMoneyPayload {
                phone: formatted_phone.clone(),
                provider: "mpesa".to_string(),
            },
        };

        info!(
            "🔗 [PAYSTACK REQUEST] phone={} | formatted={} | amount={} KES ({} cents) | provider=mpesa | currency=KES",
            phone_number, formatted_phone, amount_kes, amount_cents
        );
        
        debug!(
            "📦 Request JSON: {:?}",
            serde_json::to_string(&payload).unwrap_or_default()
        );

        let response = self
            .client
            .post("https://api.paystack.co/charge")
            .header(
                "Authorization",
                format!("Bearer {}", self.secret_key),
            )
            .json(&payload)
            .send()
            .await
            .map_err(|e| {
                error!("❌ Network error calling Paystack: {}", e);
                format!("Network error: {}", e)
            })?;

        let status = response.status();
        
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            error!("❌ Paystack HTTP Error: {} | Full Response: {}", status, error_text);
            return Err(format!("HTTP {}: {}", status, error_text));
        }

        let body = response
            .json::<ChargeResponse>()
            .await
            .map_err(|e| {
                error!("❌ Failed to parse Paystack response: {}", e);
                format!("Failed to parse response: {}", e)
            })?;

        info!(
            "📊 [PAYSTACK RESPONSE] status={} | message={} | data={:?}",
            body.status, body.message, body.data
        );

        if body.status {
            info!("✅ [SUCCESS] Paystack charge successful: {}", body.message);
            Ok(body.message)
        } else {
            error!(
                "❌ [FAILED] Paystack declined: message={} | code={:?}",
                body.message,
                body.data.as_ref().and_then(|d| d.get("code"))
            );
            Err(format!("Paystack error: {}", body.message))
        }
    }
}
