# Cashfree Payment Gateway Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Cashfree Credentials
1. Sign up at [Cashfree Sandbox](https://sandbox.cashfree.com/) or [Production](https://www.cashfree.com/)
2. Go to Dashboard → API Keys
3. Copy your:
   - **Client ID** (KeyId)
   - **Client Secret** (KeySecret)

### Step 2: Configure API Settings
Edit `api/src/Joviq.Lms.Api/appsettings.json`:

```json
{
  "Payments": {
    "Provider": "Cashfree",
    "Currency": "INR",
    "KeyId": "YOUR_CASHFREE_CLIENT_ID",
    "KeySecret": "YOUR_CASHFREE_CLIENT_SECRET",
    "WebhookSecret": "",
    "Environment": "sandbox",
    "PublicBaseUrl": "https://localhost:7001",
    "CheckoutExpiryMinutes": 10,
    "AccessDurationMonths": 6,
    "CashfreeEnvironment": "sandbox",
    "CashfreeApiVersion": "2024-09-30"
  }
}
```

### Step 3: Verify Configuration
Run the application:
```bash
cd api
dotnet run --project src/Joviq.Lms.Api/Joviq.Lms.Api.csproj
```

Check API is running:
- ✅ HTTPS: https://localhost:7001
- ✅ Swagger: https://localhost:7001/swagger

### Step 4: Configure Webhook in Cashfree Dashboard

#### For Sandbox Development:
1. Go to Cashfree Dashboard → API Keys → Webhooks
2. Add New Webhook:
   - **Webhook URL**: `https://localhost:7001/api/v1/payments/webhooks/cashfree`
   - **Select Events**:
     - ✓ PAYMENT_SUCCESS_WEBHOOK
     - ✓ PAYMENT_FAILURE_WEBHOOK (optional)
     - ✓ PAYMENT_CANCELLED_WEBHOOK (optional)
   - **Active**: Yes

#### For Production:
1. Change domain: `https://yourdomain.com/api/v1/payments/webhooks/cashfree`
2. Change credentials to production credentials
3. Set `CashfreeEnvironment`: `"production"`
4. Configure in Production Cashfree dashboard

### Step 5: Test Payment Flow

#### Create a Test Payment Checkout:
```bash
curl -X POST https://localhost:7001/api/v1/student/lms/payments/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "your-student-uuid",
    "programId": "your-program-uuid",
    "amount": 100.00,
    "originalAmount": 100.00,
    "discountAmount": 0,
    "couponCode": null
  }'
```

Response will include Cashfree order details.

#### Using Cashfree Checkout SDK (Frontend):
```javascript
// Your web app will receive these from the payment checkout endpoint
const { paymentSessionId, orderId, keyId } = paymentCheckoutResponse;

// Initialize Cashfree
const cashfree = new Cashfree({
  mode: "sandbox" // or "production"
});

// Open checkout
cashfree.checkout({
  paymentSessionId: paymentSessionId,
  orderId: orderId,
  redirectTarget: "_self"
});
```

### Step 6: Handle Payment Success
When payment is completed, Cashfree will:
1. Send webhook to your endpoint
2. Your API validates signature and updates payment status
3. Student gets access to the program
4. Notification is sent to student

---

## Environment-Specific Configuration

### Local Development
```json
"Payments": {
  "Provider": "Cashfree",
  "KeyId": "SANDBOX_CLIENT_ID",
  "KeySecret": "SANDBOX_CLIENT_SECRET",
  "Environment": "sandbox",
  "CashfreeEnvironment": "sandbox",
  "PublicBaseUrl": "https://localhost:7001"
}
```

### Staging
```json
"Payments": {
  "Provider": "Cashfree",
  "KeyId": "STAGING_CLIENT_ID",
  "KeySecret": "STAGING_CLIENT_SECRET",
  "Environment": "staging",
  "CashfreeEnvironment": "sandbox",
  "PublicBaseUrl": "https://staging.yourdomain.com"
}
```

### Production
```json
"Payments": {
  "Provider": "Cashfree",
  "KeyId": "PRODUCTION_CLIENT_ID",
  "KeySecret": "PRODUCTION_CLIENT_SECRET",
  "Environment": "production",
  "CashfreeEnvironment": "production",
  "PublicBaseUrl": "https://yourdomain.com"
}
```

---

## Testing with Sandbox

### Test Cards (Cashfree Sandbox)

**Successful Payment:**
- Card Number: `4111111111111111`
- Expiry: `12/25`
- CVV: `123`
- OTP: `123456`

**Failed Payment:**
- Card Number: `4000000000000002`
- Expiry: `12/25`
- CVV: `123`
- OTP: `123456`

### Webhook Testing
After payment, webhook will be delivered within 1-2 minutes in sandbox.

To test webhook delivery:
1. Go to Cashfree Dashboard → Webhooks → Event Logs
2. View delivery status and logs
3. Manually retry if needed

---

## Monitoring & Debugging

### Check Webhook Delivery
1. Cashfree Dashboard → Webhooks → Event Logs
2. Find your webhook event
3. View delivery timestamp and payload
4. Check response code

### View Application Logs
```bash
# In your API terminal
# Look for these audit entries:
# - "Student.PaymentVerifiedByCashfreeWebhook"
# - "Cashfree payment verified for student X"
```

### Database Checks
```sql
-- Check payment transaction
SELECT * FROM "PaymentTransactions" 
WHERE "Id" = 'transaction-uuid';

-- Check payment status
SELECT "Status", "VerifiedAt", "GatewayPaymentId" 
FROM "PaymentTransactions" 
WHERE "Id" = 'transaction-uuid';
```

---

## Common Issues & Solutions

### Issue: "Webhook signature verification failed"
**Solution:**
- Verify `X-Cashfree-Signature` header is present
- Verify `X-Cashfree-Timestamp` header is present
- Check webhook secret is configured correctly
- Ensure timestamp is fresh (within reasonable window)

### Issue: "KeyId or KeySecret not configured"
**Solution:**
- Check `appsettings.json` has credentials filled
- Verify credentials match Cashfree dashboard
- Restart API application
- Check environment-specific config file

### Issue: "Wrong provider configured"
**Solution:**
- Ensure `Provider: "Cashfree"` in config
- Webhook endpoint expects correct provider
- Check environment variables override settings

### Issue: "Order creation failed"
**Solution:**
- Check CashfreeEnvironment matches actual environment
- Verify API version is supported
- Check timeout (default 20 seconds)
- Review error logs for API response

### Issue: "Payment not verified after webhook"
**Solution:**
- Check webhook was delivered (Cashfree dashboard)
- Verify payment status is "SUCCESS" in webhook payload
- Check database for payment transaction
- Review audit logs for processing

---

## API Reference

### Payment Gateway Interface
```csharp
public interface IPaymentGateway
{
    Task<PaymentGatewayOrder> CreateOrderAsync(
        Guid transactionId,
        decimal amount,
        string currency,
        DateTimeOffset expiresAt,
        string? customerName,
        string? customerEmail,
        string? customerPhone,
        string? customerCollege,
        CancellationToken cancellationToken);

    Task<PaymentGatewayVerification> VerifyPaymentAsync(
        string orderId,
        string? paymentId,
        string? signature,
        CancellationToken cancellationToken);

    bool VerifyWebhookSignature(
        string payload,
        string signature,
        string? timestamp = null);
}
```

### Webhook Payload Structure (Cashfree)
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "joviq_abc123...",
      "order_amount": 100.00,
      "order_currency": "INR",
      "order_status": "PAID"
    },
    "payment": {
      "cf_payment_id": "123456789",
      "payment_status": "SUCCESS",
      "payment_method": "card"
    }
  }
}
```

---

## Security Best Practices

1. **Never commit credentials to git**
   - Use environment variables
   - Use secrets management
   - Use `.env` files (gitignored)

2. **Webhook Signature Verification**
   - Always verify before processing
   - Check timestamp freshness
   - Log verification failures

3. **HTTPS Only**
   - Production must use HTTPS
   - Webhook URLs must be HTTPS
   - Never expose keys in logs

4. **Data Protection**
   - Don't log full credit card numbers
   - Encrypt sensitive data at rest
   - Use secure connections

---

## Need Help?

**Cashfree Support:**
- Documentation: https://developer.cashfree.com/
- API Reference: https://developer.cashfree.com/api-reference/
- Support Portal: https://www.cashfree.com/contact

**Your LMS Support:**
- Check error logs in application
- Review webhook delivery in Cashfree dashboard
- Check audit logs for transaction processing
