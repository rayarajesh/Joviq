# Razorpay Integration - Quick Start (5 Minutes)

## Step 1: Get Razorpay Credentials (2 min)

1. Go to https://dashboard.razorpay.com
2. Sign up / Login
3. Navigate to **Settings → API Keys**
4. Copy your **Test Mode** credentials:
   - `Key ID` (Public)
   - `Key Secret` (Private)

## Step 2: Configure Backend (1 min)

### Option A: Using User Secrets (Recommended for Dev)

```bash
cd api
dotnet user-secrets set "RazorpaySettings:KeyId" "rzp_test_YOUR_KEY_ID"
dotnet user-secrets set "RazorpaySettings:KeySecret" "YOUR_KEY_SECRET"
dotnet user-secrets set "RazorpaySettings:WebhookSecret" "webhook_secret"
```

### Option B: Using appsettings.Development.json

```json
{
  "RazorpaySettings": {
    "KeyId": "rzp_test_YOUR_KEY_ID",
    "KeySecret": "YOUR_KEY_SECRET",
    "WebhookSecret": "webhook_secret",
    "Environment": "test",
    "Currency": "INR",
    "CheckoutExpiryMinutes": 10
  }
}
```

## Step 3: Register Services (1 min)

Add to `api/src/Joviq.Lms.Api/Program.cs`:

```csharp
// After builder = WebApplicationBuilder.CreateBuilder(args);

builder.Services.AddHttpClient<IRazorpayService, RazorpayService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
```

## Step 4: Use Payment Component in React (1 min)

```tsx
import { PaymentCheckout } from '@/components/PaymentCheckout';

export function YourComponent() {
  return (
    <PaymentCheckout
      studentId="your-student-id"
      programId="your-program-id"
      amount={999.99}
      originalAmount={1299.99}
      discountAmount={300.00}
      onSuccess={(response) => console.log('Success!', response)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

## Step 5: Test Payment (1 min)

1. Click "Pay ₹999.99" button
2. Use test card: `4111 1111 1111 1111`
3. Any future date for expiry
4. Any 3 digits for CVV
5. Click Pay

✅ Payment should succeed!

---

## API Reference

### Create Payment Order
```bash
POST /api/payment/create-order
Authorization: Bearer {token}

{
  "studentId": "guid",
  "programId": "guid",
  "amount": 999.99,
  "originalAmount": 1299.99,
  "discountAmount": 300.00,
  "couponCode": "optional"
}
```

### Verify Payment
```bash
POST /api/payment/verify

{
  "orderId": "order_...",
  "paymentId": "pay_...",
  "signature": "..."
}
```

### Get Config
```bash
GET /api/payment/config
```

---

## What's Included?

### Backend Files
- ✅ `RazorpayService.cs` - API integration
- ✅ `PaymentService.cs` - Business logic
- ✅ `PaymentController.cs` - REST endpoints
- ✅ DTOs for requests/responses

### Frontend Files
- ✅ `paymentService.ts` - API client
- ✅ `PaymentCheckout.tsx` - UI component
- ✅ Razorpay script loading
- ✅ Error handling

---

## Common Test Cards

| Type | Number | Exp | CVV |
|------|--------|-----|-----|
| Visa (Success) | 4111111111111111 | 12/25 | 123 |
| Mastercard (Success) | 5555555555554444 | 12/25 | 123 |
| Visa (Fail) | 4000000000000002 | 12/25 | 123 |
| 3D Secure | 4111111111111111 | 12/25 | 123 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "KeyId not configured" | Run dotnet user-secrets commands |
| Checkout modal doesn't appear | Check browser console for errors |
| Signature verification fails | Verify KeySecret is correct |
| CORS error | Add frontend URL to CORS policy |

---

## Next: Production

When ready to go live:

1. **Get Live Credentials:**
   - Switch to Live mode in Razorpay dashboard
   - Complete KYC verification
   - Generate live keys

2. **Update Configuration:**
   ```json
   {
     "RazorpaySettings": {
       "KeyId": "rzp_live_YOUR_LIVE_KEY",
       "KeySecret": "YOUR_LIVE_SECRET",
       "Environment": "live"
     }
   }
   ```

3. **Security Checklist:**
   - Use environment variables/secrets manager
   - Enable HTTPS
   - Configure webhooks
   - Test end-to-end

---

## Full Documentation

See `RAZORPAY_INTEGRATION_GUIDE.md` for:
- Complete setup instructions
- Database integration
- Webhook configuration
- Advanced features
- Troubleshooting guide
