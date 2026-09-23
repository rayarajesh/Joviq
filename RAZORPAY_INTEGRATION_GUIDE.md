# Razorpay Integration Guide for Joviq LMS

This guide walks you through integrating Razorpay payment gateway into your Joviq LMS application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Integration](#database-integration)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Webhook Setup](#webhook-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Create a Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in
3. Complete your business verification
4. Navigate to **Settings → API Keys**
5. Generate **Test Mode** keys first
6. Copy your `Key ID` and `Key Secret`

### Get Your API Credentials

- **Key ID (Public)**: Used in frontend and API configuration
- **Key Secret (Private)**: Keep secure, never expose in frontend code
- **Webhook Secret**: For validating webhook requests

---

## Backend Setup

### 1. Install Dependencies

The Razorpay integration in the backend uses `HttpClient` - no additional NuGet package needed as the code makes direct REST API calls.

### 2. Configure Razorpay Settings

Update `appsettings.json` and `appsettings.Development.json`:

```json
{
  "RazorpaySettings": {
    "KeyId": "YOUR_RAZORPAY_KEY_ID",
    "KeySecret": "YOUR_RAZORPAY_KEY_SECRET",
    "WebhookSecret": "YOUR_WEBHOOK_SECRET",
    "Environment": "test",
    "Currency": "INR",
    "CheckoutExpiryMinutes": 10
  }
}
```

### 3. Set User Secrets (Recommended for Local Development)

```bash
cd api

# Set for test environment
dotnet user-secrets set "RazorpaySettings:KeyId" "rzp_test_YOUR_KEY_ID" --project src/Joviq.Lms.Api
dotnet user-secrets set "RazorpaySettings:KeySecret" "YOUR_KEY_SECRET" --project src/Joviq.Lms.Api
dotnet user-secrets set "RazorpaySettings:WebhookSecret" "YOUR_WEBHOOK_SECRET" --project src/Joviq.Lms.Api
```

### 4. Register Services in Program.cs

Add this to your `Program.cs` in `src/Joviq.Lms.Api/Program.cs`:

```csharp
// Add HTTP Client for Razorpay
builder.Services.AddHttpClient<IRazorpayService, RazorpayService>();

// Add Payment Service
builder.Services.AddScoped<IPaymentService, PaymentService>();
```

### 5. Files Created in Backend

- `api/src/Joviq.Lms.Infrastructure/ExternalServices/RazorpayService.cs`
  - Handles all Razorpay API interactions
  - Creates orders, verifies signatures, gets payment details, processes refunds

- `api/src/Joviq.Lms.Application/Services/PaymentService.cs`
  - Business logic for payment operations
  - Bridges between controller and Razorpay service

- `api/src/Joviq.Lms.Application/Contracts/Payments/CreatePaymentOrderRequest.cs`
  - Data transfer objects for payment operations

- `api/src/Joviq.Lms.Api/Controllers/PaymentController.cs`
  - REST API endpoints for payment operations

### 6. API Endpoints

#### Create Payment Order
```
POST /api/payment/create-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "studentId": "00000000-0000-0000-0000-000000000000",
  "programId": "00000000-0000-0000-0000-000000000000",
  "programPlanId": "00000000-0000-0000-0000-000000000000",
  "enrollmentId": null,
  "amount": 999.99,
  "originalAmount": 1299.99,
  "discountAmount": 300.00,
  "couponCode": "SAVE20"
}

Response:
{
  "paymentTransactionId": "00000000-0000-0000-0000-000000000000",
  "orderId": "order_ABCDEFGHIJKLMNop",
  "amount": 999.99,
  "currency": "INR",
  "keyId": "rzp_test_YOUR_KEY_ID",
  "notes": {
    "student_id": "00000000-0000-0000-0000-000000000000",
    "program_id": "00000000-0000-0000-0000-000000000000"
  }
}
```

#### Verify Payment
```
POST /api/payment/verify
Content-Type: application/json

{
  "orderId": "order_ABCDEFGHIJKLMNop",
  "paymentId": "pay_ABCDEFGHIJKLMNop",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}

Response:
{
  "isSuccessful": true,
  "message": "Payment verified successfully",
  "paymentTransactionId": "00000000-0000-0000-0000-000000000000",
  "enrollmentStatus": "Active"
}
```

#### Get Payment Config
```
GET /api/payment/config

Response:
{
  "keyId": "rzp_test_YOUR_KEY_ID"
}
```

---

## Frontend Setup

### 1. Install Dependencies

No additional packages needed - uses native `fetch` or `axios` (if already in your project).

### 2. Files Created in Frontend

- `web/src/services/paymentService.ts`
  - Service for handling all payment API calls
  - Loads Razorpay script dynamically
  - Manages checkout flow

- `web/src/components/PaymentCheckout.tsx`
  - React component for payment UI
  - Shows price summary
  - Handles payment flow

### 3. Usage Example

```tsx
import { PaymentCheckout } from '@/components/PaymentCheckout';

export function CourseEnrollment() {
  const handlePaymentSuccess = (response: any) => {
    console.log('Payment successful!', response);
    // Update enrollment status
    // Show success message
    // Redirect to course
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
    // Show error notification
  };

  return (
    <PaymentCheckout
      studentId={studentId}
      programId={programId}
      programPlanId={planId}
      amount={999.99}
      originalAmount={1299.99}
      discountAmount={300.00}
      couponCode="SAVE20"
      studentEmail={email}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  );
}
```

### 4. Environment Configuration

Create `.env` file in `web/` directory:

```
VITE_API_BASE_URL=https://localhost:7001
```

---

## Database Integration

### 1. Migration Steps

The `PaymentTransaction` entity already exists. You need to:

1. Add payment repositories to Infrastructure layer
2. Create EF Core migrations to track payment status
3. Update Enrollment entity to link payment transactions

### 2. Create Payment Repository

Create `api/src/Joviq.Lms.Infrastructure/Repositories/PaymentRepository.cs`:

```csharp
public interface IPaymentRepository
{
    Task AddAsync(PaymentTransaction transaction);
    Task UpdateAsync(PaymentTransaction transaction);
    Task<PaymentTransaction?> GetAsync(Guid id);
    Task<PaymentTransaction?> GetByGatewayOrderIdAsync(string orderId);
    Task<IEnumerable<PaymentTransaction>> GetByStudentIdAsync(Guid studentId);
}

public class PaymentRepository : IPaymentRepository
{
    private readonly LmsDbContext _context;

    public PaymentRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PaymentTransaction transaction)
    {
        await _context.PaymentTransactions.AddAsync(transaction);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(PaymentTransaction transaction)
    {
        _context.PaymentTransactions.Update(transaction);
        await _context.SaveChangesAsync();
    }

    public async Task<PaymentTransaction?> GetAsync(Guid id)
    {
        return await _context.PaymentTransactions.FindAsync(id);
    }

    public async Task<PaymentTransaction?> GetByGatewayOrderIdAsync(string orderId)
    {
        return await _context.PaymentTransactions
            .FirstOrDefaultAsync(p => p.GatewayOrderId == orderId);
    }

    public async Task<IEnumerable<PaymentTransaction>> GetByStudentIdAsync(Guid studentId)
    {
        return await _context.PaymentTransactions
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}
```

### 3. Register Repository

In `Program.cs`:

```csharp
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
```

---

## Testing

### 1. Test Mode vs Live Mode

**Test Mode:**
- Use test credentials from Razorpay dashboard
- Practice transactions don't charge real money
- Test all payment flows

**Live Mode:**
- Use live credentials
- Real payments will be processed
- Requires KYC verification

### 2. Test Payment Cards

In Razorpay test environment:

| Card Type | Number | Exp | CVV |
|-----------|--------|-----|-----|
| Visa | 4111 1111 1111 1111 | Any future date | Any 3 digits |
| Mastercard | 5555 5555 5555 4444 | Any future date | Any 3 digits |

### 3. Manual Testing Flow

1. **Create Order:**
   - Call `/api/payment/create-order` endpoint
   - Verify order is created in Razorpay dashboard

2. **Checkout:**
   - Click "Pay" button in frontend
   - Razorpay modal should open
   - Enter test card details
   - Complete payment

3. **Verify Payment:**
   - Check payment status in Razorpay dashboard
   - Verify `/api/payment/verify` returns success
   - Check database for updated payment status

### 4. Test Failure Scenarios

- **Failed Payment:** Use test card 4000 0000 0000 0002
- **Insufficient Funds:** Test card network will decline
- **Network Error:** Temporary network interruptions

---

## Production Deployment

### 1. Switch to Live Mode

1. **Razorpay Dashboard:**
   - Go to Settings → API Keys
   - Switch to "Live" mode
   - Generate Live mode keys
   - Note the environment is now live

2. **Update Configuration:**
   ```json
   {
     "RazorpaySettings": {
       "KeyId": "rzp_live_YOUR_LIVE_KEY_ID",
       "KeySecret": "YOUR_LIVE_KEY_SECRET",
       "Environment": "live",
       "WebhookSecret": "YOUR_LIVE_WEBHOOK_SECRET"
     }
   }
   ```

3. **Use Environment Secrets:**
   - Never commit live keys to version control
   - Use environment variables or secure vaults
   - Example: AWS Secrets Manager, Azure Key Vault

### 2. Security Checklist

- [ ] Key Secret is NOT in frontend code
- [ ] Signature verification is implemented on backend
- [ ] HTTPS is enforced for all payment endpoints
- [ ] CORS is properly configured
- [ ] Rate limiting is in place
- [ ] Payment data is encrypted in transit
- [ ] Webhooks validate secret correctly

### 3. SSL Certificate

Ensure your domain has valid SSL certificate:

```bash
# For local testing
dotnet dev-certs https --trust

# For production, use Let's Encrypt or similar
```

### 4. Domain Configuration in Razorpay

1. Go to Razorpay Settings
2. Add your production domain to allowed origins
3. Configure webhook endpoint
4. Test live payment flow

---

## Webhook Setup

### 1. What are Webhooks?

Webhooks notify your server when payment events occur without polling.

### 2. Create Webhook Endpoint

Create `api/src/Joviq.Lms.Api/Controllers/WebhookController.cs`:

```csharp
[ApiController]
[Route("api/[controller]")]
public class WebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookController> _logger;

    [HttpPost("razorpay")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleRazorpayWebhook()
    {
        try
        {
            var body = await new StreamReader(Request.Body).ReadToEndAsync();
            var signature = Request.Headers["X-Razorpay-Signature"].ToString();

            // Verify webhook signature
            var webhookSecret = _configuration["RazorpaySettings:WebhookSecret"];
            if (!VerifyWebhookSignature(body, signature, webhookSecret))
            {
                _logger.LogWarning("Invalid webhook signature");
                return Unauthorized();
            }

            // Parse webhook payload
            var payload = JsonSerializer.Deserialize<Dictionary<string, object>>(body);
            var eventType = payload?["event"]?.ToString();

            switch (eventType)
            {
                case "payment.authorized":
                    await HandlePaymentAuthorized(payload);
                    break;
                case "payment.captured":
                    await HandlePaymentCaptured(payload);
                    break;
                case "payment.failed":
                    await HandlePaymentFailed(payload);
                    break;
            }

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook");
            return StatusCode(500);
        }
    }

    private bool VerifyWebhookSignature(string body, string signature, string secret)
    {
        // Implement HMAC-SHA256 verification
        var hash = HmacSha256(body, secret);
        return hash == signature;
    }
}
```

### 3. Configure Webhook in Razorpay

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhook/razorpay`
3. Select events to subscribe:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
4. Copy webhook secret
5. Test webhook

### 4. Webhook Events to Handle

| Event | Action |
|-------|--------|
| `payment.authorized` | Payment is authorized, capture manually if needed |
| `payment.captured` | Payment successfully captured |
| `payment.failed` | Payment failed, update status |
| `refund.created` | Refund initiated |
| `refund.failed` | Refund failed |

---

## Troubleshooting

### Common Issues

#### 1. "Razorpay KeyId not configured"

**Solution:**
```bash
# Check if secrets are set
dotnet user-secrets list --project src/Joviq.Lms.Api

# Set if missing
dotnet user-secrets set "RazorpaySettings:KeyId" "rzp_test_..." --project src/Joviq.Lms.Api
```

#### 2. "Failed to load Razorpay script"

**Solution:**
- Check if CDN is accessible: `https://checkout.razorpay.com/v1/checkout.js`
- Check browser console for CORS errors
- Verify Content Security Policy (CSP) headers

#### 3. "Payment signature verification failed"

**Solution:**
- Ensure Key Secret is correct
- Check that order amount matches in verification
- Verify timestamp is within acceptable range
- Check logs for exact mismatch

#### 4. "CORS error when calling API"

**Solution:**
```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("https://localhost:5173", "https://yourdomain.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

#### 5. "Checkout modal doesn't open"

**Checklist:**
- [ ] Razorpay script loaded successfully
- [ ] KeyId is valid and matches environment
- [ ] Amount is in paise (multiply by 100)
- [ ] Order ID is not expired
- [ ] Browser allows popups

### Debug Mode

Enable detailed logging:

```json
{
  "Logging": {
    "LogLevel": {
      "Joviq.Lms.Infrastructure.ExternalServices.RazorpayService": "Debug"
    }
  }
}
```

### Getting Help

- **Razorpay Documentation:** https://razorpay.com/docs/
- **Support:** https://razorpay.com/support/
- **Status Page:** https://status.razorpay.com/

---

## Next Steps

1. ✅ Backend Setup - Follow Backend Setup section
2. ✅ Frontend Setup - Follow Frontend Setup section
3. ⏳ Database Integration - Link PaymentService with database
4. ⏳ Webhook Integration - Implement webhook handler
5. ⏳ Testing - Test payment flows
6. ⏳ Production - Deploy with live credentials

## Support

For issues or questions:
1. Check logs in `api/Logs/` directory
2. Verify configuration in appsettings.json
3. Test with Razorpay test credentials
4. Check Razorpay dashboard for payment status
