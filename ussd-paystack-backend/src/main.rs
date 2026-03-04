use axum::{
    extract::{Form, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use tower_http::trace::TraceLayer;
use tracing::{error, info};

mod config;
mod paystack;
mod ussd;

use config::Config;
use paystack::PaystackClient;
use ussd::normalize_phone;

#[derive(Clone)]
struct AppState {
    config: Config,
    paystack: PaystackClient,
}

#[derive(Deserialize)]
struct UssdRequest {
    #[serde(rename = "sessionId")]
    session_id: String,
    #[serde(rename = "serviceCode")]
    #[allow(dead_code)]
    service_code: String,
    #[serde(rename = "phoneNumber")]
    phone_number: String,
    text: String,
    #[serde(rename = "networkCode")]
    network_code: Option<String>,
}

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    // Load configuration
    let config = Config::from_env();
    info!("✅ Configuration loaded successfully");

    // Initialize Paystack client
    let paystack = PaystackClient::new(config.paystack_secret_key.clone());

    let state = AppState { config, paystack };

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ussd", post(ussd_handler))
        .route("/", post(ussd_handler))  // Also accept POST at root (in case Africa's Talking sends there)
        .layer(TraceLayer::new_for_http())
        .with_state(Arc::new(state));

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    info!("🚀 Africa's Talking USSD server live on http://0.0.0.0:3000");
    info!("→ Set your callback URL in Africa's Talking to: https://34.122.249.119/ussd");

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await
    .expect("Server failed");
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

async fn ussd_handler(
    State(state): State<Arc<AppState>>,
    Form(req): Form<UssdRequest>,
) -> Response {
    info!(
        "📨 [INCOMING USSD] session={} | phone={} | text='{}' | network={:?}",
        req.session_id, req.phone_number, req.text, req.network_code
    );

    // Validate required fields - return user-friendly END message instead of error status
    if req.session_id.is_empty() {
        error!("❌ Invalid request: missing sessionId");
        let response = "END Invalid request: missing session ID";
        info!("📤 Sending validation error: {}", response);
        return (StatusCode::OK, [(header::CONTENT_TYPE, "text/plain")], response).into_response();
    }

    if req.phone_number.is_empty() {
        error!("❌ Invalid request: missing phoneNumber");
        let response = "END Invalid request: missing phone number";
        info!("📤 Sending validation error: {}", response);
        return (StatusCode::OK, [(header::CONTENT_TYPE, "text/plain")], response).into_response();
    }

    // On first dial (empty text), trigger M-PESA STK push
    if req.text.is_empty() {
        info!("🔄 First dial detected (empty text) - triggering STK push");
        
        // Normalize phone number to 254XXXXXXXXX format
        let normalized_phone = normalize_phone(&req.phone_number);
        info!("📱 Normalized phone: {} → {}", req.phone_number, normalized_phone);

        // Trigger Paystack M-PESA charge
        match state
            .paystack
            .charge_mpesa(&normalized_phone, state.config.fixed_amount_kes)
            .await
        {
            Ok(response_msg) => {
                info!(
                    "✅ [SUCCESS] STK push initiated | phone={} | amount=KES {} | paystack_response={}",
                    normalized_phone, state.config.fixed_amount_kes, response_msg
                );
                let display_amount = state.config.fixed_amount_kes / 100;
                let response = format!(
                    "END Payment of KES {} requested.\nCheck your phone now and enter your MPESA PIN.",
                    display_amount
                );
                info!("📤 Sending USSD response: {}", response);
                (
                    StatusCode::OK,
                    [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
                    response,
                ).into_response()
            }
            Err(e) => {
                error!("❌ [FAILED] STK push error for {}: {}", normalized_phone, e);
                let response = format!("END Payment failed: {}. Please try again.", e);
                info!("📤 Sending error response: {}", response);
                (
                    StatusCode::OK,
                    [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
                    response,
                ).into_response()
            }
        }
    } else {
        // For subsequent inputs, end the session
        info!("🏁 Subsequent input detected - ending session | text='{}'", req.text);
        let response = "END Transaction completed.";
        info!("📤 Sending response: {}", response);
        (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
            response,
        ).into_response()
    }
}
