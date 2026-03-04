# USSD Implementation Compliance Checklist

Based on Africa's Talking USSD API documentation, here's what we need and what we have:

## ✅ Things We're Doing Correctly

### 1. **Request Handling**
- ✅ Accepting HTTP POST requests
- ✅ Reading all required fields (sessionId, phoneNumber, networkCode, serviceCode, text)
- ✅ Using proper form-data deserialization
- ✅ Accessing all fields from `req.body`

### 2. **Session Management**
- ✅ Reading sessionId for session tracking
- ✅ Handling empty text (first request)
- ✅ Handling concatenated text (subsequent requests with *)

### 3. **Response Format**
- ✅ Starting responses with CON or END
- ✅ Returning plain text responses
- ✅ Ending sessions with END

### 4. **Performance**
- ✅ Async implementation (won't block)
- ✅ Should respond within 10 seconds

---

## 🔴 Critical Issues to Fix

### Issue 1: Wrong Content-Type Header
**Requirement**: Response must have `Content-Type: text/plain`  
**Current**: Axum returns default content-type (might be application/octet-stream or text/html)  
**Impact**: Africa's Talking might not recognize response properly  
**Fix Required**: Explicitly set response header to `text/plain`

### Issue 2: Error Status Codes
**Requirement**: Africa's Talking expects 200 OK for valid responses  
**Current**: We return 400 BAD_REQUEST for validation errors  
**Problem**: According to docs: "If we get a HTTP error response (Code 40X) from your script... we will terminate the USSD session gracefully"  
**Fix Required**: Return 200 OK with "END Invalid..." message instead of 400

### Issue 3: Invalid Response Format on Errors
**Current** (BAD): 
```
HTTP 400
END Invalid request: missing sessionId
```

**Should Be**:
```
HTTP 200
END Invalid request: missing sessionId
```

---

## ⚠️ Potential Issues to Monitor

### Issue 4: Response Content Characters
**Requirement**: "Your USSD Menu should not contain special characters"  
**Current**: We use emoji (📨 📤 ✅ ❌) - but only in logs, not in user responses  
**Status**: ✅ Safe - emojis only in server logs, not in USSD responses

### Issue 5: Line Breaks in Responses
**Current**: We use `\n` for line breaks  
**Status**: ⚠️ Works but some telcos have issues. Test needed.

### Issue 6: Response Length
**Current**: Responses are short (~80 chars)  
**Status**: ✅ Safe - USSD max is usually 182 characters

---

## 📋 Documentation Says:

### What Africa's Talking Sends:
```
POST /ussd
Content-Type: application/x-www-form-urlencoded

sessionId=abc123
phoneNumber=254722000000
networkCode=63902
serviceCode=*384*69220#
text=          // empty on first request
```

**Our Implementation**: ✅ Handles correctly

---

### What We Should Send Back:
```
HTTP 200
Content-Type: text/plain

CON What would you like to do?
1. Check balance
2. Make payment

OR

END Thank you for using our service
```

**Our Implementation**: ⚠️ Missing explicit Content-Type header

---

## 🔧 Required Code Changes

### Change 1: Set Response Content-Type to text/plain
**File**: [ussd-paystack-backend/src/main.rs](ussd-paystack-backend/src/main.rs)  
**Current**: Returns `(StatusCode::OK, response_text)`  
**Should Be**: 
```rust
(
    StatusCode::OK, 
    [(axum::http::header::CONTENT_TYPE, "text/plain")],
    response_text
)
```

### Change 2: Return 200 OK for All Responses
**File**: [ussd-paystack-backend/src/main.rs](ussd-paystack-backend/src/main.rs)  
**Current**: Returns `StatusCode::BAD_REQUEST` for invalid requests  
**Should Be**: Always return `StatusCode::OK` with END prefix

### Change 3: Remove JSON Response Structure (Optional)
**File**: [ussd-paystack-backend/src/main.rs](ussd-paystack-backend/src/main.rs)  
**Current**: Has `UssdResponse` struct (not used)  
**Should Be**: Delete it, return plain String

---

## 🚀 Session Flow Example

### Session 1: First Request (text = "")
```
Request:
  sessionId: 123abc
  phoneNumber: 0722000000
  text: ""

Our Response:
  HTTP 200
  Content-Type: text/plain
  
  END Payment of KES 500 requested.
  Check your phone now and enter your MPESA PIN.

Result: Session ends immediately ✅
```

### Session 2: Multi-step Menu (Hypothetical)
```
Request 1 (text = ""):
Response: CON What would you like to do?\n1. Check balance\n2. Pay

Request 2 (text = "1"):
Response: CON Your balance is KES 5,000

Request 3 (text = "1*1"):
Response: END Balance inquiry complete

Session flow: CON → CON → END ✅
```

---

## 📊 Compliance Matrix

| Requirement | Status | Issue | Priority |
|-------------|--------|-------|----------|
| Accept POST requests | ✅ OK | None | N/A |
| Read form data (urlencoded) | ✅ OK | None | N/A |
| Parse sessionId | ✅ OK | None | N/A |
| Parse phoneNumber | ✅ OK | None | N/A |
| Parse text | ✅ OK | None | N/A |
| Response starts with CON/END | ✅ OK | None | N/A |
| Response Content-Type: text/plain | ❌ MISSING | Wrong header | 🔴 CRITICAL |
| Return 200 OK on validation error | ❌ WRONG | Returns 400 | 🔴 CRITICAL |
| No special chars in response | ✅ OK | None | N/A |
| Response time < 10 seconds | ✅ OK | Async | N/A |
| Handle empty text (first request) | ✅ OK | None | N/A |
| Handle concatenated text | ✅ OK | None | N/A |

---

## 🛠️ Testing Against Spec

### Test 1: Health Check
```bash
curl http://localhost:3000/health
# Expected: HTTP 200, body: "OK"
```

### Test 2: Valid USSD Request
```bash
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&phoneNumber=254722000000&text=&networkCode=63902"

# Expected:
# HTTP 200
# Content-Type: text/plain
# Body: "END Payment of KES 500 requested.\nCheck your phone now and enter your MPESA PIN."
```

### Test 3: Missing Field
```bash
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=384*69220&text="

# Current (WRONG):
# HTTP 400
# END Invalid request: missing phone number

# Expected (CORRECT):
# HTTP 200
# Content-Type: text/plain
# END Invalid request: missing phone number
```

---

## 🎯 Action Items

### Priority 1: Fix Response Headers
- [ ] Add explicit `Content-Type: text/plain` header to all USSD responses
- [ ] Ensure Axum returns correct header in HTTP response

### Priority 2: Fix Status Codes
- [ ] Change validation errors from 400 to 200 OK
- [ ] All USSD responses should return 200 OK

### Priority 3: Test Against Spec
- [ ] Test with actual USSD request format
- [ ] Verify response headers in curl output
- [ ] Check if Africa's Talking accepts the response

### Priority 4: Cleanup
- [ ] Remove unused `UssdResponse` struct if not needed
- [ ] Update documentation in code

---

## 📌 Key Points from Africa's Talking Docs

1. **Session Management**: Maintain sessionId throughout session - we do this ✅
2. **CON vs END**: CON = continue, END = terminate - we use END ✅  
3. **First Request**: text="" - we handle this ✅
4. **Subsequent Requests**: text="1*1*2" (concatenated with *) - we handle this ✅
5. **Response Time**: Max 10 seconds - we're async so this is fine ✅
6. **Content-Type Response**: MUST be text/plain - **WE'RE NOT DOING THIS** ❌
7. **HTTP Status**: 200 OK (or 40X terminates) - **WE RETURN 400 ON ERROR** ❌
8. **Special Characters**: No emojis/symbols in response text - **WE'RE SAFE** ✅
9. **Notification Callback**: Separate URL for session end events - **NOT IMPLEMENTED** ⚠️

---

## 💡 Why These Fixes Matter

1. **Content-Type Header**: Africa's Talking gateway might validate response headers. Wrong Content-Type could cause it to reject or misinterpret the response.

2. **HTTP 400 Errors**: According to spec: "If we get a HTTP error response (Code 40X)... we will terminate the USSD session gracefully." This means our validation errors actually terminate the session instead of sending a user-friendly message.

3. **Session Notifications**: We're not handling the "End of Interaction" notifications that Africa's Talking wants to send us. This is less critical for basic payment flow but important for logging.

