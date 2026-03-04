use tracing::error;

#[derive(Clone, Debug)]
pub struct Config {
    pub paystack_secret_key: String,
    pub fixed_amount_kes: u32,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();

        let paystack_secret_key =
            std::env::var("PAYSTACK_SECRET_KEY").unwrap_or_else(|_| {
                error!("❌ PAYSTACK_SECRET_KEY environment variable not set");
                panic!("PAYSTACK_SECRET_KEY must be set");
            });

        let fixed_amount_kes = std::env::var("FIXED_AMOUNT_KES")
            .unwrap_or_else(|_| "50000".to_string())
            .parse::<u32>()
            .unwrap_or(50000);

        Config {
            paystack_secret_key,
            fixed_amount_kes,
        }
    }
}
