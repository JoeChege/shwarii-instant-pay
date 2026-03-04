/// Normalize phone number to E.164 format: 254XXXXXXXXX
/// Handles formats like:
/// - 0722000000 → 254722000000
/// - +254722000000 → 254722000000
/// - 254722000000 → 254722000000
/// - +254 722 000 000 → 254722000000
pub fn normalize_phone(phone: &str) -> String {
    let cleaned = phone
        .trim()
        .replace(" ", "")  // Remove spaces
        .trim_start_matches('+')
        .trim_start_matches('0')
        .to_string();

    if cleaned.starts_with("254") {
        cleaned
    } else {
        format!("254{}", cleaned)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_phone() {
        assert_eq!(normalize_phone("0722000000"), "254722000000");
        assert_eq!(normalize_phone("+254722000000"), "254722000000");
        assert_eq!(normalize_phone("254722000000"), "254722000000");
        assert_eq!(normalize_phone("+254 722 000 000"), "254722000000");
    }
}
