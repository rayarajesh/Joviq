# Razorpay Integration Setup Checklist

Use this checklist to ensure complete integration setup.

## Phase 1: Configuration (Do First)

### 1.1 Get Razorpay Account
- [ ] Create account at https://dashboard.razorpay.com
- [ ] Verify email
- [ ] Complete profile information
- [ ] Navigate to Settings → API Keys

### 1.2 Get Test Credentials
- [ ] Switch to **Test** mode (if not already)
- [ ] Copy **Key ID** (looks like `rzp_test_...`)
- [ ] Copy **Key Secret** (long string of characters)
- [ ] Save in secure location (password manager)

### 1.3 Configure Backend

#### Using User Secrets (Recommended)
```bash
cd api
dotnet user-secrets set "RazorpaySettings:KeyId" "YOUR_KEY_ID"
dotnet user-secrets set "RazorpaySettings:KeySecret" "YOUR_KEY_SECRET"
dotnet user-secrets set "RazorpaySettings:WebhookSecret" "webhook_secret"
```
- [ ] Run all three commands
- [ ] Verify with: `dotnet user-secrets list`

#### OR Using appsettings.Development.json
- [ ] Edit `api/src/Joviq.Lms.Api/appsettings.Development.json`
- [ ] Update RazorpaySettings section with credentials
- [ ] **WARNING:** Don't commit to git!

### 1.4 Verify Configuration
```bash
cd api
dotnet run --project src/Joviq.Lms.Api
# Should start without configuration errors
```
- [ ] API starts successfully
- [ ] No "KeyId not configured" errors

---

## Phase 2: Backend Setup

### 2.1 Register Services
Edit `api/src/Joviq.Lms.Api/Program.cs`:

Add after `var builder = WebApplicationBuilder.CreateBuilder(args);`:
```csharp
builder.Services.AddHttpClient<IRazorpayService, RazorpayService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
```

- [ ] Added HttpClient registration
- [ ] Added IPaymentService registration
- [ ] File saved

### 2.2 Build & Verify
```bash
cd api
dotnet build
```
- [ ] Build succeeds (0 errors)
- [ ] All projects compile
- [ ] No warnings about missing services

### 2.3 Test API Endpoints
Start the API:
```bash
cd api
dotnet run --project src/Joviq.Lms.Api
```

Test endpoint in another terminal:
```bash
curl -X GET "https://localhost:7001/api/payment/config"
```
- [ ] Returns JSON with keyId
- [ ] No 500 errors
- [ ] No SSL warnings (or trust certificate)

---

## Phase 3: Frontend Setup

### 3.1 Verify Files
- [ ] `web/src/services/paymentService.ts` exists
- [ ] `web/src/components/PaymentCheckout.tsx` exists
- [ ] Both files have no syntax errors

### 3.2 Configure API Base URL
Check `web/.env` file (create if doesn't exist):
```
VITE_API_BASE_URL=https://localhost:7001
```
- [ ] File created or updated
- [ ] Correct backend URL

### 3.3 Test Frontend
```bash
cd web
npm install
npm run dev
```
- [ ] Frontend starts at http://localhost:5173
- [ ] No console errors
- [ ] Can access application

---

## Phase 4: Integration Testing

### 4.1 Test Payment Order Creation

1. Create a test user account in your app
2. Make API call to create order:
```bash
curl -X POST "https://localhost:7001/api/payment/create-order" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "11111111-1111-1111-1111-111111111111",
    "programId": "22222222-2222-2222-2222-222222222222",
    "amount": 999.99,
    "originalAmount": 1299.99,
    "discountAmount": 300.00
  }'
```
- [ ] Returns 200 OK status
- [ ] Response includes orderId
- [ ] Response includes keyId
- [ ] No error messages

### 4.2 Test Razorpay Modal
1. Import PaymentCheckout component in test page
2. Use mock student/program IDs
3. Click "Pay" button

```tsx
<PaymentCheckout
  studentId="11111111-1111-1111-1111-111111111111"
  programId="22222222-2222-2222-2222-222222222222"
  amount={999.99}
  originalAmount={1299.99}
  discountAmount={300.00}
  onSuccess={(resp) => console.log('Success!', resp)}
  onError={(err) => console.error('Error!', err)}
/>
```

- [ ] Button appears with correct amount
- [ ] Clicking button opens Razorpay modal
- [ ] Modal shows payment methods
- [ ] Can enter card details

### 4.3 Test Payment with Test Card
1. In Razorpay modal, enter test card:
   - Card: `4111 1111 1111 1111`
   - Exp: Any future date
   - CVV: Any 3 digits

2. Complete payment

- [ ] Payment processes
- [ ] Modal closes after payment
- [ ] Success callback fires
- [ ] Console shows success message

### 4.4 Verify Payment in Razorpay Dashboard
1. Go to Razorpay Dashboard
2. Navigate to Payments section
3. Look for recent transaction

- [ ] Payment appears in dashboard
- [ ] Amount matches what was paid
- [ ] Status shows "Captured"
- [ ] Timestamp is recent

---

## Phase 5: Database Integration (Optional)

If you want to persist payment data:

### 5.1 Create Payment Repository
Create file: `api/src/Joviq.Lms.Infrastructure/Repositories/PaymentRepository.cs`
- [ ] Implement IPaymentRepository interface
- [ ] Add CRUD methods for PaymentTransaction

### 5.2 Register Repository
In `Program.cs`:
```csharp
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
```
- [ ] Added registration
- [ ] Build succeeds

### 5.3 Update PaymentService
Inject IPaymentRepository into PaymentService
- [ ] Constructor updated
- [ ] Payment data saved to database
- [ ] Payment status updates work

---

## Phase 6: Error Handling (Troubleshooting)

### 6.1 Backend Configuration Errors

**Error: "KeyId not configured"**
- [ ] Verify user secrets are set: `dotnet user-secrets list`
- [ ] Or check appsettings.Development.json
- [ ] Restart API after setting secrets

**Error: "Failed to load Razorpay script"**
- [ ] Check internet connectivity
- [ ] Verify CDN is accessible: https://checkout.razorpay.com/v1/checkout.js
- [ ] Check browser console for CORS errors

### 6.2 Payment Flow Errors

**Checkout modal doesn't open:**
- [ ] Check browser console for JavaScript errors
- [ ] Verify KeyId is valid (starts with rzp_test_)
- [ ] Check that order was created successfully

**Signature verification fails:**
- [ ] Verify KeySecret is correct
- [ ] Check that order ID matches
- [ ] Ensure timestamps are synchronized

### 6.3 CORS Errors

If you see CORS errors in browser console:

Check `Program.cs` has CORS policy configured:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```
- [ ] CORS policy added
- [ ] Frontend URL in AllowedOrigins
- [ ] app.UseCors() called in middleware

---

## Phase 7: Production Preparation

### 7.1 Get Live Credentials
When ready for production:
- [ ] Go to Razorpay dashboard
- [ ] Switch to **Live** mode
- [ ] Complete KYC verification if needed
- [ ] Generate live API keys
- [ ] Copy live Key ID and Key Secret

### 7.2 Update Configuration
- [ ] Create production appsettings.json
- [ ] Update with live credentials
- [ ] Use environment variables/secrets manager
- [ ] **Never commit live keys to git**

### 7.3 Security Review
- [ ] HTTPS enabled on all endpoints
- [ ] Webhook secret configured
- [ ] Rate limiting in place
- [ ] Input validation enabled
- [ ] Signature verification enabled

### 7.4 Test with Live Credentials
- [ ] Set live credentials
- [ ] Create test order
- [ ] Verify payment with test card
- [ ] Check payment in Razorpay dashboard

---

## Phase 8: Deployment

### 8.1 Pre-deployment Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Backup created

### 8.2 Deploy Backend
```bash
cd api
dotnet publish -c Release
# Deploy to production server
```
- [ ] Published successfully
- [ ] Live configuration set
- [ ] Environment variables configured
- [ ] Database migrated

### 8.3 Deploy Frontend
```bash
cd web
npm run build
# Deploy dist/ to hosting
```
- [ ] Build succeeds
- [ ] No build errors
- [ ] Environment variables set
- [ ] VITE_API_BASE_URL points to live API

### 8.4 Verify Production
- [ ] API is accessible
- [ ] Frontend loads
- [ ] Payment flow works
- [ ] Payments appear in dashboard
- [ ] Webhooks working (if configured)

---

## Final Verification

### Manual Tests
- [ ] Can create payment order ✓
- [ ] Razorpay modal opens ✓
- [ ] Can pay with test card ✓
- [ ] Payment verification works ✓
- [ ] Success callback fires ✓

### API Tests
- [ ] GET /api/payment/config returns 200 ✓
- [ ] POST /api/payment/create-order returns 200 ✓
- [ ] POST /api/payment/verify returns 200 ✓
- [ ] Authorization working ✓

### Browser Tests
- [ ] No console errors ✓
- [ ] No network errors ✓
- [ ] Responsive design ✓
- [ ] All browsers working ✓

---

## Success Criteria

✅ All items checked above
✅ No errors in console
✅ Payments processing successfully
✅ Tests passing
✅ Ready for production

---

**Date Completed:** _______________
**Tested By:** _______________
**Notes:** _______________________________________________________________

---

**Next Step:** Review `RAZORPAY_INTEGRATION_GUIDE.md` for advanced features like webhooks, refunds, and production setup.
