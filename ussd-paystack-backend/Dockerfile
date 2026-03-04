# Build stage
FROM rust:1.75 as builder

WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.toml
COPY Cargo.lock Cargo.lock

# Copy source code
COPY src/ src/

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/ussd-paystack /app/ussd-paystack

# Expose port
EXPOSE 3000

# Run the application
CMD ["./ussd-paystack"]
