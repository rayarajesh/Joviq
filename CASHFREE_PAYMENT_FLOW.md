# Cashfree Payment Flow - Complete Transaction Guide

## Overview
This document describes the complete payment flow from enrollment initiation through student access activation.

---

## 🔄 Payment Transaction Flow

### Phase 1: Payment Checkout Creation

```
Student → Frontend → API
  ↓
POST /api/v1/student/lms/payments/checkout
  {
    "studentId": "uuid",
    "programId": "uuid",
    "programPlanId": "uuid",
    "enrollmentId": "uuid",
    "amount": 999.00,
    "originalAmount": 999.00,
    "discountAmount": 0.00,
    "couponCode": null
  }
```

**API Processing:**
1. Validate student and program exist
2. Create `PaymentTransaction` record
   - Status: `Pending`
   - Amount: 999.00
   - Currency: INR
3. Call `CashfreePaymentGateway.CreateOrderAsync()`
4. Cashfree creates order via API
   - OrderId: `joviq_{transactionId}`
   - Amount: 999.00
   - Customer details included
   - Expiry: Based on CheckoutExpiryMinutes (default 10 mins)

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentSessionId": "session_abc123...",
    "orderId": "joviq_abc123...",
    "amount": 999.00,
    "currency": "INR",
    "keyId": "cashfree_client_id",
    "provider": "Cashfree",
    "environment": "sandbox",
    "notes": {
      "transaction_id": "uuid",
      "student_id": "uuid",
      "program_id": "uuid"
    }
  }
}
```

**Database State After Phase 1:**
```
PaymentTransactions
├─ Id: uuid
├─ StudentId: student-uuid
├─ EnrollmentId: enrollment-uuid
├─ Amount: 999.00
├─ Currency: INR
├─ Status: Pending ✓
├─ GatewayOrderId: joviq_abc123...
├─ CreatedAt: now
└─ ExpiresAt: now + 10 minutes
```

---

### Phase 2: Frontend Checkout Display

```
API → Frontend
  ↓
Frontend receives paymentSessionId
  ↓
Initialize Cashfree SDK
  ↓
cashfree.checkout({
  paymentSessionId: "session_abc123...",
  orderId: "joviq_abc123...",
  redirectTarget: "_self"
})
```

**User Actions:**
1. Frontend displays Cashfree payment form
2. Student enters card details
3. Student completes 3D Secure/OTP (if required)
4. Cashfree processes payment

**Cashfree Processing:**
1. Validates card
2. Authenticates transaction
3. Processes payment
4. Updates order status: `PAID`
5. Sends webhook to your server

---

### Phase 3: Webhook Reception & Processing

```
Cashfree → Your Server
  ↓
POST /api/v1/payments/webhooks/cashfree
Headers:
  X-Cashfree-Signature: signature_value
  X-Cashfree-Timestamp: timestamp

Body:
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "joviq_abc123...",
      "order_amount": 999.00,
      "order_currency": "INR",
      "order_status": "PAID"
    },
    "payment": {
      "cf_payment_id": "cf_12345678",
      "payment_status": "SUCCESS",
      "payment_method": "card"
    }
  }
}
```

**API Webhook Handler Processing:**
1. Verify Provider is set to "Cashfree"
2. Extract X-Cashfree-Signature header
3. Extract X-Cashfree-Timestamp header
4. Call `CashfreePaymentGateway.VerifyWebhookSignature()`
   - Recreate HMAC-SHA256 with timestamp + payload + secret
   - Compare with provided signature
   - Verify signature matches ✓
5. Parse webhook payload
6. Extract order_id and payment_id
7. Find PaymentTransaction by order_id
8. Call `LmsPortalService.ProcessCashfreePaymentWebhookAsync()`

**Payment Verification Process:**
```csharp
1. Find transaction: x.GatewayOrderId == "joviq_abc123..."
2. Check status: NOT already Verified
3. Check duplicate: No other transaction with same cf_payment_id
4. Update transaction:
   ├─ Status: Verified ✓
   ├─ GatewayPaymentId: cf_12345678
   └─ VerifiedAt: now
5. Find coupon redemption:
   └─ If exists: Status: Redeemed
6. Apply verified payment:
   ├─ Create enrollment with Active status
   ├─ Set access expiry: now + AccessDurationMonths (default 6)
   └─ Record enrollment start time
7. Activate checkout account:
   ├─ Enable student dashboard
   ├─ Grant course access
   └─ Grant submission rights
8. Create notification:
   ├─ Title: "Payment verified"
   ├─ Body: "INR 999 payment for Program Title verified."
   └─ ActionUrl: "/dashboard"
9. Audit log:
   └─ Event: "Student.PaymentVerifiedByCashfreeWebhook"
   └─ Details: transactionId, studentId, paymentId
10. Save all changes
```

---

## 📊 Database State Changes Through Flow

### Before Payment Initiation
```
Students: studentId exists ✓

Enrollments: (NONE - not created yet)

PaymentTransactions: (NONE)

CouponRedemptions: (if coupon applied)
  └─ Status: Pending
```

### After Checkout Creation (Phase 1)
```
PaymentTransactions (NEW)
├─ Status: Pending
├─ Amount: 999.00
├─ GatewayOrderId: joviq_abc123...
├─ CreatedAt: now
└─ ExpiresAt: now + 10 mins

Enrollments: (NONE - not created yet)
```

### After Payment Success Webhook (Phase 3)
```
PaymentTransactions (UPDATED)
├─ Status: Verified ✓
├─ GatewayPaymentId: cf_12345678
├─ VerifiedAt: now
└─ Amount: 999.00

Enrollments (NEW)
├─ StudentId: student-uuid
├─ ProgramId: program-uuid
├─ Status: Active ✓
├─ StartDate: now
├─ ExpiryDate: now + 6 months
└─ PaymentTransactionId: uuid

CouponRedemptions (UPDATED if applicable)
└─ Status: Redeemed ✓

Notifications (NEW)
├─ UserId: student-uuid
├─ Title: "Payment verified"
├─ Body: "INR 999 payment verified"
└─ ActionUrl: "/dashboard"

AuditLogs (NEW)
├─ Event: "Student.PaymentVerifiedByCashfreeWebhook"
├─ Details: { transactionId, studentId, paymentId }
└─ Timestamp: now
```

---

## 🔐 Signature Verification Details

### Cashfree Webhook Signature Calculation

**What Cashfree Sends:**
```
X-Cashfree-Timestamp: 1632844823
X-Cashfree-Signature: a7b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
Body: {...json payload...}
```

**Your Server Verification:**
```csharp
// Step 1: Combine timestamp + payload
string data = timestamp + payload;
// = "1632844823{...json payload...}"

// Step 2: Create HMAC-SHA256 with your secret
string secret = paymentOptions.Value.KeySecret;
using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));

// Step 3: Convert to hex string
string computedSignature = BitConverter.ToString(hash)
  .Replace("-", "")
  .ToLower();

// Step 4: Compare with received signature
bool isValid = computedSignature == receivedSignature;
```

**Security Points:**
- ✓ Timestamp prevents replay attacks
- ✓ HMAC-SHA256 prevents tampering
- ✓ Uses your secret key (stored securely)
- ✓ Fresh timestamp validation (within reasonable window)

---

## ⏱️ Timeline & State Transitions

```
T+0s    : Student initiates payment
T+1s    : Checkout created → Status: Pending
T+2s    : Frontend loads Cashfree checkout
T+5s    : Student enters payment details
T+30s   : Cashfree processes payment → Status: PAID
T+31s   : Webhook sent to your server
T+32s   : Signature verified ✓
T+33s   : Transaction updated → Status: Verified
T+34s   : Enrollment created → Status: Active
T+35s   : Student gains course access ✓
T+36s   : Notification sent to student
T+37s   : Audit log recorded

T+100ms : Frontend receives confirmation (redirect)
T+0.5s  : Student sees access granted
T+1s    : Student can access dashboard
T+5s    : Student can access course materials
```

---

## 🚨 Error Scenarios

### Scenario 1: Webhook Signature Fails
```
Event: Webhook received with invalid signature
Action: PaymentsController returns 401 Unauthorized
Status: NO payment processed
Result: Payment NOT verified, student does NOT get access
Recovery: Student can retry payment
Audit: Error logged
```

### Scenario 2: Transaction Not Found
```
Event: Webhook received for unknown order_id
Action: ProcessCashfreePaymentWebhookAsync returns early
Status: NO database changes
Result: Payment NOT recorded
Recovery: Manual intervention needed (admin)
Audit: Error logged with order_id
```

### Scenario 3: Duplicate Payment ID
```
Event: Same payment_id used for different order
Action: ProcessCashfreePaymentWebhookAsync returns early
Status: NO payment update
Result: Fraud protection activated
Recovery: Manual review required
Audit: Security incident logged
```

### Scenario 4: Already Verified
```
Event: Webhook retry for already-verified payment
Action: ProcessCashfreePaymentWebhookAsync returns early
Status: NO changes made
Result: Idempotent - safe to retry
Recovery: Automatic (no action needed)
Audit: Duplicate webhook noted
```

---

## 🔌 API Integration Points

### Payment Service Methods
```csharp
// Create payment checkout
Task<PaymentCheckoutResponse> CreatePaymentCheckoutAsync(
  Guid studentId,
  CreatePaymentCheckoutRequest request,
  CancellationToken cancellationToken)

// Verify payment after redirect
Task<PaymentVerificationResponseDto> VerifyPaymentAsync(
  VerifyPaymentRequest request)

// Webhook handler
Task ProcessCashfreePaymentWebhookAsync(
  string payload,
  CancellationToken cancellationToken)
```

### Gateway Methods
```csharp
// Create order on Cashfree
Task<PaymentGatewayOrder> CreateOrderAsync(...)

// Verify payment status
Task<PaymentGatewayVerification> VerifyPaymentAsync(
  string orderId,
  string? paymentId,
  string? signature,
  CancellationToken cancellationToken)

// Verify webhook signature
bool VerifyWebhookSignature(
  string payload,
  string signature,
  string? timestamp = null)
```

---

## 📈 Monitoring & Observability

### Key Metrics to Track
- Payment creation rate
- Webhook delivery rate
- Signature verification success rate
- Payment verification rate
- Student activation rate
- Average payment processing time
- Payment failure rate
- Webhook retry rate

### Audit Trail
Every transaction is logged with:
- Event type
- Student ID
- Payment ID
- Timestamp
- Gateway response
- Status changes
- Errors (if any)

**Query audit logs:**
```sql
SELECT * FROM "AuditLogs"
WHERE "Event" LIKE '%Payment%'
AND "CreatedAt" >= NOW() - INTERVAL '7 days'
ORDER BY "CreatedAt" DESC;
```

---

## 🔄 Webhook Retry Logic

**Cashfree Webhook Behavior:**
1. Sends webhook immediately after payment
2. If no 200 response: retries exponentially
3. Retry windows: 1m, 5m, 15m, 30m, 1h, 2h, 4h, etc.
4. Continues for ~24 hours
5. Marks as failed after max retries

**Your Server Should:**
1. Always respond with 200 OK
2. Process webhook asynchronously (if needed)
3. Handle duplicate webhooks gracefully
4. Log all webhook activity
5. Alert on repeated failures

---

## 🎯 Success Criteria

Payment flow is successful when:
- ✅ Webhook signature verified
- ✅ Payment status is SUCCESS
- ✅ Transaction updated to Verified
- ✅ Enrollment created with Active status
- ✅ Access expiry set correctly
- ✅ Student notified
- ✅ Audit log recorded
- ✅ All data consistent across tables

---

## 📝 Example Audit Log Entry

```json
{
  "id": "audit-uuid",
  "event": "Student.PaymentVerifiedByCashfreeWebhook",
  "userId": "student-uuid",
  "details": {
    "transactionId": "payment-uuid",
    "studentId": "student-uuid",
    "enrollmentId": "enrollment-uuid",
    "paymentId": "cf_12345678",
    "amount": 999.00,
    "orderId": "joviq_abc123..."
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Cashfree-Webhook",
  "timestamp": "2026-09-22T10:30:45Z",
  "status": "Success"
}
```

---

## 🚀 Testing the Full Flow

### Manual Testing Steps:
1. Create student account
2. Browse program
3. Click "Enroll"
4. Enter payment amount
5. Click "Checkout"
6. Use Cashfree test card
7. Complete 3D Secure/OTP
8. Verify webhook delivery
9. Check student has access
10. Verify audit log entry

### Automated Testing:
```bash
# 1. Create checkout
curl -X POST https://localhost:7001/api/v1/student/lms/payments/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"programId": "uuid", ...}'

# 2. Simulate webhook
curl -X POST https://localhost:7001/api/v1/payments/webhooks/cashfree \
  -H "X-Cashfree-Signature: signature" \
  -H "X-Cashfree-Timestamp: timestamp" \
  -d '{"type": "PAYMENT_SUCCESS_WEBHOOK", ...}'

# 3. Verify student has access
curl -X GET https://localhost:7001/api/v1/student/lms/my-programs \
  -H "Authorization: Bearer $TOKEN"
```

---

**This completes the entire payment journey from checkout to student access!** 🎉
