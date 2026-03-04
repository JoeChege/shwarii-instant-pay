# USSD Implementation Verification Guide

After the code fixes, here's how to verify our implementation matches Africa's Talking specs exactly.

## ✅ Fixed Issues

### 1. Content-Type Header
**Before**: Default Axum response (not text/plain)  
**After**: Explicitly set `Content-Type: text/plain` on all responses  
**Code**:
```rust
[(CONTENT_TYPE, "text/plain")]
```

### 2. HTTP Status Codes
**Before**: Returned 400 BAD_REQUEST on validation errors  
**After**: Always return 200 OK with END prefix message  
**Why**: Africa's Talking terminates session on 40X errors per spec

### 3. Removed Unused Code
**Before**: Had `UssdResponse` struct (unused JSON serialization)  
**After**: Removed - we return plain String with headers

---

## 🔍 Verification Tests

### Test 1: Check Content-Type Header

```bash
# Start server
RUST_LOG=info ./target/release/ussd-paystack &

# Test with curl to see headers
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=63902" \
  -i

# Expected output:
# HTTP/1.1 200 OK
# content-type: text/plain
# content-length: XXX
#
# END Payment of KES 500 requested.
# Check your phone now and enter your MPESA PIN.
```

**Verify**: 
- ✅ Status code is `200 OK` (not 400)
- ✅ Header includes `content-type: text/plain`
- ✅ Body starts with `END`

---

### Test 2: Validation Error Response

```bash
# Send request with missing phoneNumber
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&text=" \
  -i

# Expected output:
# HTTP/1.1 200 OK
# content-type: text/plain
#
# END Invalid request: missing phone number
```

**Verify**:
- ✅ Status code is `200 OK` (NOT 400)
- ✅ Content-Type is `text/plain`
- ✅ Message starts with `END`

---

### Test 3: Complete Request Handling

```bash
# This tests the full Africa's Talking request format
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=ABC123-XYZ789&phoneNumber=0722000000&networkCode=63902&serviceCode=*384*69220#&text=" \
  -v

# Check for:
# 1. Status 200
# 2. Content-Type: text/plain
# 3. Body starts with CON or END
# 4. No JSON in response body
```

---

## 📊 Compliance Checklist (Updated)

| Requirement | Status | Test Command |
|-------------|--------|--------------|
| Accept POST to /ussd | ✅ | `curl -X POST http://localhost:3000/ussd` |
| Parse form-urlencoded | ✅ | Check if phone parsed correctly |
| Read all fields | ✅ | Logs show all fields |
| Return 200 OK | ✅ NEW | `curl -i` shows `200 OK` |
| Response Content-Type: text/plain | ✅ NEW | `curl -i` shows `content-type: text/plain` |
| Response starts with CON or END | ✅ | Response body inspection |
| Validation error = 200 OK | ✅ NEW | Test with missing field |
| Handle empty text (first request) | ✅ | `text=` parameter |
| Handle subsequent requests | ✅ | `text=1*2` parameter |
| Response time < 10 seconds | ✅ | Async implementation |

---

## 🧪 Integration Test Script

Create a file called `test_ussd.sh`:

```bash
#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 USSD Implementation Tests"
echo "=============================="
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Health check returned 200"
else
    echo -e "${RED}❌ FAIL${NC}: Health check returned $HEALTH (expected 200)"
fi
echo ""

# Test 2: Valid USSD Request
echo -e "${YELLOW}Test 2: Valid USSD Request${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=63902")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Status code is 200"
else
    echo -e "${RED}❌ FAIL${NC}: Status code is $HTTP_CODE (expected 200)"
fi

if [[ $BODY == END* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Response starts with END"
else
    echo -e "${RED}❌ FAIL${NC}: Response doesn't start with END: $BODY"
fi
echo ""

# Test 3: Missing Phone Number
echo -e "${YELLOW}Test 3: Missing Phone Number (Validation)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&text=&networkCode=63902")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Error returned 200 OK (not 400)"
else
    echo -e "${RED}❌ FAIL${NC}: Error returned $HTTP_CODE (expected 200)"
fi

if [[ $BODY == END* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Error response starts with END"
else
    echo -e "${RED}❌ FAIL${NC}: Error response doesn't start with END: $BODY"
fi
echo ""

# Test 4: Content-Type Header
echo -e "${YELLOW}Test 4: Content-Type Header${NC}"
HEADERS=$(curl -s -i -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=63902" | grep -i "content-type")

if [[ $HEADERS == *"text/plain"* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Content-Type is text/plain"
else
    echo -e "${RED}❌ FAIL${NC}: Content-Type not text/plain: $HEADERS"
fi
echo ""

# Test 5: Subsequent Request (non-empty text)
echo -e "${YELLOW}Test 5: Subsequent Request (Non-empty text)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=1&networkCode=63902")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Status code is 200"
else
    echo -e "${RED}❌ FAIL${NC}: Status code is $HTTP_CODE"
fi

if [[ $BODY == END* ]]; then
    echo -e "${GREEN}✅ PASS${NC}: Response starts with END"
else
    echo -e "${RED}❌ FAIL${NC}: Response doesn't start with END: $BODY"
fi
echo ""

echo "=============================="
echo "🎯 All tests completed!"
```

**Run it**:
```bash
chmod +x test_ussd.sh
./test_ussd.sh
```

---

## 🚀 Deployment Checklist

Before deploying to production (34.122.249.119):

- [ ] Run test script locally - all tests pass
- [ ] Rebuild: `cargo build --release`
- [ ] Test content-type header: `curl -i`
- [ ] Verify status codes are 200 OK
- [ ] Check logs show proper request/response flow
- [ ] Update Africa's Talking callback URL to `/ussd` endpoint
- [ ] Test with real USSD dial
- [ ] Monitor logs for errors

---

## 📝 Updated Implementation Details

### Request Handler Signature
```rust
async fn ussd_handler(
    State(state): State<Arc<AppState>>,
    Form(req): Form<UssdRequest>,
) -> impl IntoResponse
```

### Response Format
```rust
(
    StatusCode::OK,                        // Always 200 OK
    [(CONTENT_TYPE, "text/plain")],       // Always text/plain
    response_message,                      // "END ..." or "CON ..."
)
```

### Error Handling
- ❌ No 400/500 errors returned to Africa's Talking
- ✅ All errors return 200 OK with "END Invalid..." message
- ✅ Detailed error logging for debugging

---

## 💡 Key Differences from Original

| Aspect | Before | After |
|--------|--------|-------|
| Status on Validation Error | 400 BAD_REQUEST | 200 OK |
| Content-Type Header | Default (unset) | Explicit text/plain |
| Error Response | Could terminate session | User-friendly message |
| JSON Serialization | Used (unused) | Removed |
| Axum Response | Simple tuple | Tuple with headers |

---

## 🔗 Reference

- **Africa's Talking USSD Spec**: Response must have `Content-Type: text/plain`
- **Africa's Talking Session Handling**: "If we get a HTTP error response (Code 40X)... we will terminate the USSD session"
- **Our Implementation**: Now fully compliant with both requirements

