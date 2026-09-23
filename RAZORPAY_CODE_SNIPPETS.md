# Razorpay Integration - Code Snippets & Examples

Quick copy-paste code snippets for common tasks.

## Backend Setup

### Register Services in Program.cs

Add this after `var builder = WebApplicationBuilder.CreateBuilder(args);`:

```csharp
// Add HTTP client for Razorpay
builder.Services.AddHttpClient<IRazorpayService, RazorpayService>();

// Add Payment Service
builder.Services.AddScoped<IPaymentService, PaymentService>();
```

## Frontend Usage

### Basic Payment Checkout

```tsx
import { PaymentCheckout } from '@/components/PaymentCheckout';

export function CoursePayment() {
  return (
    <PaymentCheckout
      studentId="student-id-123"
      programId="program-id-456"
      amount={999.99}
      originalAmount={1299.99}
      discountAmount={300.00}
      onSuccess={(response) => {
        console.log('Payment successful!', response);
        // Redirect to course
      }}
      onError={(error) => {
        console.error('Payment failed:', error.message);
        // Show error
      }}
    />
  );
}
```

### With All Optional Props

```tsx
<PaymentCheckout
  studentId="student-id-123"
  programId="program-id-456"
  programPlanId="plan-id-789"
  enrollmentId="enrollment-id-000"
  amount={999.99}
  originalAmount={1299.99}
  discountAmount={300.00}
  couponCode="SAVE20"
  studentEmail="student@example.com"
  onSuccess={(response) => {
    console.log('Success:', response.isSuccessful);
    // Update UI
  }}
  onError={(error) => {
    console.error('Error:', error.message);
    // Show error toast
  }}
  onClose={() => {
    console.log('Modal closed');
    // Navigate back
  }}
/>
```

## API Integration

### Create Payment Order (Frontend)

```tsx
import { paymentService } from '@/services/paymentService';

async function createOrder() {
  try {
    const response = await paymentService.createPaymentOrder({
      studentId: 'student-123',
      programId: 'program-456',
      amount: 999.99,
      originalAmount: 1299.99,
      discountAmount: 300.00,
      couponCode: 'SAVE20'
    });

    console.log('Order created:', response.orderId);
    return response;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}
```

### Verify Payment (Frontend)

```tsx
async function verifyPayment(orderId, paymentId, signature) {
  try {
    const response = await paymentService.verifyPayment({
      orderId,
      paymentId,
      signature
    });

    if (response.isSuccessful) {
      console.log('Payment verified!');
      // Update enrollment
    } else {
      console.error('Verification failed:', response.message);
    }

    return response;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}
```

## Configuration

### Using User Secrets

```bash
# Set credentials
dotnet user-secrets set "RazorpaySettings:KeyId" "rzp_test_YOUR_KEY_ID"
dotnet user-secrets set "RazorpaySettings:KeySecret" "YOUR_KEY_SECRET"
dotnet user-secrets set "RazorpaySettings:WebhookSecret" "webhook_secret"

# Verify
dotnet user-secrets list

# Remove if needed
dotnet user-secrets remove "RazorpaySettings:KeyId"
```

### appsettings.Development.json

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

### appsettings.Production.json

```json
{
  "RazorpaySettings": {
    "KeyId": "rzp_live_YOUR_LIVE_KEY_ID",
    "KeySecret": "YOUR_LIVE_KEY_SECRET",
    "WebhookSecret": "your_live_webhook_secret",
    "Environment": "live",
    "Currency": "INR",
    "CheckoutExpiryMinutes": 10
  }
}
```

## Testing

### Test Payment with Test Card

```typescript
// In your test component
const testPaymentData = {
  studentId: 'test-student-123',
  programId: 'test-program-456',
  amount: 999.99,
  originalAmount: 1299.99,
  discountAmount: 300.00
};

// Use test card: 4111 1111 1111 1111
// Expiry: Any future date
// CVV: Any 3 digits
```

### Curl Request to Create Order

```bash
curl -X POST "https://localhost:7001/api/payment/create-order" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "11111111-1111-1111-1111-111111111111",
    "programId": "22222222-2222-2222-2222-222222222222",
    "amount": 999.99,
    "originalAmount": 1299.99,
    "discountAmount": 300.00,
    "couponCode": "SAVE20"
  }'
```

### Curl Request to Verify Payment

```bash
curl -X POST "https://localhost:7001/api/payment/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_LrsSiAubEzDdaq",
    "paymentId": "pay_LrsS1xLrsSiAubE",
    "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
  }'
```

## Error Handling

### Handle Payment Errors in React

```tsx
const [error, setError] = useState<string | null>(null);

const handlePaymentError = (err: Error) => {
  const errorMessage = err.message || 'Payment failed. Please try again.';
  setError(errorMessage);

  // Log error
  console.error('Payment error:', {
    message: err.message,
    timestamp: new Date().toISOString()
  });

  // Show toast notification
  toast.error(errorMessage);

  // Optional: Send to error tracking service
  // sendToErrorTracking(err);
};

return (
  <>
    {error && (
      <div className="alert alert-error">
        {error}
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    )}

    <PaymentCheckout
      {...props}
      onError={handlePaymentError}
    />
  </>
);
```

### Handle Backend Errors

```csharp
[HttpPost("create-order")]
[Authorize]
public async Task<IActionResult> CreatePaymentOrder([FromBody] CreatePaymentOrderRequest request)
{
    try
    {
        // Validate input
        if (request.Amount <= 0)
        {
            return BadRequest(new { 
                message = "Amount must be greater than 0" 
            });
        }

        if (request.StudentId == Guid.Empty)
        {
            return BadRequest(new { 
                message = "StudentId is required" 
            });
        }

        // Create order
        var response = await _paymentService.CreatePaymentOrderAsync(request);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating payment order");
        return StatusCode(StatusCodes.Status500InternalServerError, new
        {
            message = "Failed to create payment order",
            error = ex.Message // Remove in production
        });
    }
}
```

## Database Integration

### Save Payment to Database

```csharp
// In PaymentService.cs
var paymentTransaction = new PaymentTransaction
{
    Id = Guid.NewGuid(),
    StudentId = request.StudentId,
    ProgramId = request.ProgramId,
    ProgramPlanId = request.ProgramPlanId,
    EnrollmentId = request.EnrollmentId,
    Gateway = "Razorpay",
    GatewayOrderId = razorpayOrder.Id,
    Amount = request.Amount,
    OriginalAmount = request.OriginalAmount,
    DiscountAmount = request.DiscountAmount,
    CouponCode = request.CouponCode,
    Mode = PaymentMode.PayInFull,
    Status = PaymentStatus.Pending,
    Currency = razorpayOrder.Currency,
    CheckoutExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
    CreatedAt = DateTimeOffset.UtcNow,
    UpdatedAt = DateTimeOffset.UtcNow
};

// TODO: Save to database
// await _paymentRepository.AddAsync(paymentTransaction);
```

### Update Payment Status

```csharp
public async Task UpdatePaymentStatusAsync(
    string orderId, 
    PaymentStatus status, 
    string? paymentId = null)
{
    var payment = await _paymentRepository.GetByGatewayOrderIdAsync(orderId);
    
    if (payment != null)
    {
        payment.Status = status;
        payment.GatewayPaymentId = paymentId;
        payment.VerifiedAt = DateTimeOffset.UtcNow;
        payment.UpdatedAt = DateTimeOffset.UtcNow;
        
        await _paymentRepository.UpdateAsync(payment);
    }
}
```

### Update Enrollment After Payment

```csharp
public async Task ActivateEnrollmentAsync(Guid enrollmentId, decimal paidAmount)
{
    var enrollment = await _enrollmentRepository.GetAsync(enrollmentId);
    
    if (enrollment != null)
    {
        enrollment.Status = EnrollmentStatus.Active;
        enrollment.PaidAmount = paidAmount;
        enrollment.FullAccessUnlockedAt = DateTimeOffset.UtcNow;
        enrollment.AccessExpiresAt = DateTimeOffset.UtcNow.AddMonths(6);
        enrollment.UpdatedAt = DateTimeOffset.UtcNow;
        
        await _enrollmentRepository.UpdateAsync(enrollment);
    }
}
```

## Production Checklist

### Pre-Deployment

```csharp
// 1. Verify configuration
if (string.IsNullOrEmpty(_configuration["RazorpaySettings:KeyId"]))
    throw new InvalidOperationException("Razorpay configuration missing");

// 2. Check HTTPS
if (!context.Request.IsHttps)
    throw new InvalidOperationException("HTTPS required for payments");

// 3. Verify webhook secret
if (string.IsNullOrEmpty(_configuration["RazorpaySettings:WebhookSecret"]))
    _logger.LogWarning("Webhook secret not configured");
```

### Environment-Specific Configuration

```csharp
if (app.Environment.IsDevelopment())
{
    builder.Services.AddHttpClient<IRazorpayService, RazorpayService>()
        .ConfigureHttpClient(client =>
        {
            // Disable SSL verification only in dev
            // NOTE: Never do this in production!
        });
}
else if (app.Environment.IsProduction())
{
    // Production settings
    builder.Services.AddHttpClient<IRazorpayService, RazorpayService>()
        .ConfigureHttpClient(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
}
```

## Logging

### Enable Debug Logging

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Joviq.Lms.Infrastructure.ExternalServices.RazorpayService": "Debug",
      "Joviq.Lms.Application.Services.PaymentService": "Debug",
      "Joviq.Lms.Api.Controllers.PaymentController": "Debug"
    }
  }
}
```

### Log Payment Events

```csharp
_logger.LogInformation(
    "Payment created: OrderId={OrderId}, Amount={Amount}, StudentId={StudentId}",
    orderId,
    amount,
    studentId);

_logger.LogInformation(
    "Payment verified: OrderId={OrderId}, PaymentId={PaymentId}, Status={Status}",
    orderId,
    paymentId,
    status);
```

## Common Issues & Solutions

### Issue: "Razorpay script failed to load"

```typescript
// Solution: Retry loading script
async function loadRazorpayScriptWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const loaded = await paymentService.loadRazorpayScript();
            if (loaded) return true;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
        }
    }
    return false;
}
```

### Issue: "CORS errors when calling API"

```csharp
// Solution: Configure CORS properly
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPaymentUI", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "https://yourdomain.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowPaymentUI");
```

### Issue: "Signature verification fails"

```typescript
// Debug signature verification
async function debugSignatureVerification(orderId, paymentId, signature) {
    console.log('Order ID:', orderId);
    console.log('Payment ID:', paymentId);
    console.log('Signature:', signature);

    // Verify on backend
    const result = await fetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify({ orderId, paymentId, signature })
    });

    console.log('Verification result:', await result.json());
}
```

---

Feel free to copy and modify these snippets for your needs!
