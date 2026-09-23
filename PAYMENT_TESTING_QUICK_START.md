# 🚀 Payment Testing - Quick Start Guide

**Current Status**: ✅ All bugs fixed, system ready for testing  
**API**: Running on `https://localhost:7001`  
**Web**: Running on `http://localhost:5173`  
**Date**: September 23, 2026

---

## What Was Fixed

8 critical bugs are now resolved:

1. ✅ Controller now maps `paymentTransactionId` (was being dropped)
2. ✅ Backend contract now accepts `paymentTransactionId` 
3. ✅ Verify endpoint works with transaction ID when order ID missing
4. ✅ Frontend sends transaction ID correctly
5. ✅ Cashfree modal waits for payment result before verifying
6. ✅ Gateway errors are logged (was silent failures)
7. ✅ Webhook signature verification confirmed safe
8. ✅ Return URL redirects to frontend (was redirecting to API)

---

## Testing the Payment Flow

### Step 1: Prepare Your Test Data

Get a valid student ID and program ID from your database:

```sql
-- Get a student ID
SELECT "Id", "Email" FROM "Users" WHERE "UserType" = 'Student' LIMIT 1;

-- Get a program ID
SELECT "Id", "Title" FROM "Programs" LIMIT 1;

-- Get a program plan ID
SELECT "Id", "Name", "Price" FROM "ProgramPlans" LIMIT 1;
```

### Step 2: Create Payment Checkout

Open a terminal and run:

```bash
# Replace with your actual values
STUDENT_ID="00000000-0000-0000-0000-000000000001"
PROGRAM_ID="00000000-0000-0000-0000-000000000002"
PROGRAM_PLAN_ID="00000000-0000-0000-0000-000000000003"
TOKEN="your-jwt-token-here"

curl -X POST https://localhost:7001/api/v1/student/lms/payments/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"programId\": \"$PROGRAM_ID\",
    \"programPlanId\": \"$PROGRAM_PLAN_ID\",
    \"paymentMode\": 0,
    \"couponCode\": null
  }"
```

**What to look for**:
- ✅ `"success": true`
- ✅ `"paymentSessionId"` - copy this value
- ✅ `"gatewayOrderId"` - copy this value (should start with `joviq_`)
- ✅ `"transaction.id"` - copy this value (the paymentTransactionId)

Save these values:
```
PAYMENT_SESSION_ID = (from response)
GATEWAY_ORDER_ID = (from response)
PAYMENT_TRANSACTION_ID = (from response.transaction.id)
```

### Step 3: Open Cashfree Checkout Modal

In your web browser (or using the UI):

1. Go to `http://localhost:5173/checkout`
2. The checkout page should show your selected program
3. Click "Proceed to Payment"
4. Cashfree modal should open

### Step 4: Complete Test Payment

In the Cashfree modal:

1. **Select Payment Method**: Card
2. **Enter Test Card**:
   - Card Number: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - OTP: `123456`
3. **Click Pay**
4. Modal should close automatically

**The app should**:
- ✅ Show "Payment verified" message
- ✅ Redirect to dashboard with `?payment=success`
- ✅ Show success banner

### Step 5: Verify Payment in Database

```sql
-- Check payment transaction
SELECT 
    "Id",
    "StudentId", 
    "Status",
    "GatewayOrderId",
    "GatewayPaymentId",
    "Amount",
    "CreatedAt",
    "VerifiedAt"
FROM "PaymentTransactions" 
WHERE "GatewayOrderId" LIKE 'joviq_%'
ORDER BY "CreatedAt" DESC 
LIMIT 1;

-- Expected: Status = 'Verified', VerifiedAt is not null
```

```sql
-- Check enrollment was created
SELECT 
    "Id",
    "StudentId",
    "ProgramId", 
    "Status",
    "CreatedAt"
FROM "Enrollments"
WHERE "StudentId" = 'YOUR_STUDENT_ID'
ORDER BY "CreatedAt" DESC 
LIMIT 1;

-- Expected: Status = 'Active'
```

```sql
-- Check audit log
SELECT 
    "Id",
    "StudentId",
    "Event",
    "Details",
    "CreatedAt"
FROM "AuditLogs"
WHERE "Event" LIKE '%Payment%'
ORDER BY "CreatedAt" DESC 
LIMIT 5;

-- Expected: Event = 'Student.PaymentVerified'
```

---

## Testing Edge Cases

### Test Case 1: Verify by Transaction ID Only (Cashfree Path)

```bash
curl -X POST https://localhost:7001/api/v1/student/lms/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentTransactionId\": \"$PAYMENT_TRANSACTION_ID\",
    \"gatewayOrderId\": null,
    \"gatewayPaymentId\": \"cf_12345\",
    \"gatewaySignature\": null
  }"
```

**Expected**:
- ✅ Returns payment details
- ✅ Status: Verified
- ✅ No errors

### Test Case 2: Verify by Order ID Only (Razorpay Path)

```bash
curl -X POST https://localhost:7001/api/v1/student/lms/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentTransactionId\": null,
    \"gatewayOrderId\": \"$GATEWAY_ORDER_ID\",
    \"gatewayPaymentId\": \"razorpay_payment_123\",
    \"gatewaySignature\": \"valid_signature\"
  }"
```

**Expected**:
- ✅ Returns payment details (same transaction)
- ✅ Status: Verified
- ✅ No errors

### Test Case 3: Payment Not Found (Wrong Transaction ID)

```bash
curl -X POST https://localhost:7001/api/v1/student/lms/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentTransactionId\": \"00000000-0000-0000-0000-000000000099\",
    \"gatewayOrderId\": null,
    \"gatewayPaymentId\": \"cf_99999\",
    \"gatewaySignature\": null
  }"
```

**Expected**:
- ✅ Returns 404 error
- ✅ Message: "Payment transaction was not found."

### Test Case 4: Checkout Expires

Try to verify a payment more than 10 minutes after checkout creation:

```bash
curl -X POST https://localhost:7001/api/v1/student/lms/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"paymentTransactionId\": \"$PAYMENT_TRANSACTION_ID\",
    \"gatewayOrderId\": \"$GATEWAY_ORDER_ID\",
    \"gatewayPaymentId\": \"cf_payment_id\",
    \"gatewaySignature\": null
  }"
```

**Expected** (if >10 minutes):
- ✅ Returns 400 error
- ✅ Message: "This payment session expired. Start a new payment attempt."

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Modal doesn't open** | Cashfree script not loaded | Check browser console for errors |
| **Payment returns 404** | Transaction not found | Verify PAYMENT_TRANSACTION_ID is correct |
| **Modal closes, no redirect** | Payment not verified | Check Cashfree sandbox logs |
| **Database has no enrollment** | Webhook didn't fire | Check webhook configuration in Cashfree |
| **500 error from API** | Check server logs | See "Check API Logs" section below |

---

## Check API Logs

If you see errors, check the API server logs:

```bash
# View last 50 lines of API output
# Terminal ID: 28 (shown in process list)

# Look for entries with:
# - "error:" - error messages
# - "Cashfree" - payment gateway issues  
# - "Payment" - payment-related logs
# - "verification" - verification issues
```

Key error patterns to look for:
- `Cashfree order fetch failed during verify` - Gateway communication issue
- `Payment transaction was not found` - Lookup failed
- `Payment verification failed` - Signature mismatch
- `Application started` - Server healthy

---

## Success Criteria

You'll know everything works when:

- [ ] Payment checkout creates successfully
- [ ] Cashfree modal opens without errors
- [ ] Test payment completes with test card
- [ ] Modal closes automatically
- [ ] App shows success message
- [ ] Dashboard is shown
- [ ] Database payment status = "Verified"
- [ ] Database enrollment status = "Active"
- [ ] Audit log shows payment verification event
- [ ] No errors in API logs

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Test with another student/program combo
2. Test Razorpay path (if using that provider)
3. Verify webhook receives events
4. Get production Cashfree credentials
5. Update production configuration
6. Deploy to staging

### If Tests Fail ❌
1. Check the API server logs (terminal 28)
2. Verify database connectivity
3. Confirm Cashfree sandbox credentials
4. Check webhook configuration
5. Review the PAYMENT_BUG_FIXES_COMPLETE.md for what was fixed

---

## Quick Reference

### Current Servers
```
API: https://localhost:7001
Web: http://localhost:5173
DB:  PostgreSQL localhost:5432
```

### Test Credentials
```
Card:   4111111111111111
Expiry: 12/25
CVV:    123
OTP:    123456
```

### Important Files
```
API Logs:        Terminal 28
Web Logs:        Terminal 16
Cashfree Dash:   https://sandbox.cashfree.com/
DB Queries:      Use your SQL client on localhost:5432
```

---

## Support

### Quick Help
1. **API not responding** → Check terminal 28 for errors
2. **Modal won't open** → Check browser DevTools console
3. **Payment not verified** → Check that gatewayOrderId starts with "joviq_"
4. **Database empty** → Verify student/program IDs are valid UUIDs
5. **Still stuck** → Check PAYMENT_BUG_FIXES_COMPLETE.md for detailed fix info

---

**You're all set! Start testing the payment flow now! 🚀**

