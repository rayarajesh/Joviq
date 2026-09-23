# Cashfree Quick Reference

## 🚀 TL;DR - Get Started in 5 Minutes

### 1. Get Credentials
Sign up at: https://sandbox.cashfree.com/
Credentials: Dashboard → API Keys

### 2. Update Config
Edit: `api/src/Joviq.Lms.Api/appsettings.json`
```json
{
  "Payments": {
    "Provider": "Cashfree",
    "KeyId": "YOUR_CLIENT_ID",
    "KeySecret": "YOUR_CLIENT_SECRET",
    "CashfreeEnvironment": "sandbox"
  }
}
```

### 3. Add Webhook
Cashfree Dashboard → Webhooks:
```
URL: https://localhost:7001/api/v1/payments/webhooks/cashfree
Events: PAYMENT_SUCCESS_WEBHOOK
```

### 4. Run & Test
```bash
cd api
dotnet run --project src/Joviq.Lms.Api/Joviq.Lms.Api.csproj
```

### 5. Test Payment
- Use test card: 4111111111111111
- Expiry: 12/25
- CVV: 123
- OTP: 123456

---

## 📚 API Endpoints

### Payment Checkout
```
POST /api/v1/student/lms/payments/checkout
Authorization: Bearer {token}

Request:
{
  "studentId": "uuid",
  "programId": "uuid",
  "amount": 999.00
}

Response:
{
  "paymentSessionId": "session_...",
  "orderId": "joviq_...",
  "keyId": "client_id"
}
```

### Verify Payment (Optional)
```
POST /api/v1/student/lms/payments/verify
Authorization: Bearer {token}

Request:
{
  "orderId": "joviq_...",
  "paymentId": "cf_...",
  "signature": "sig..."
}
```

### Webhook Endpoint
```
POST /api/v1/payments/webhooks/cashfree
X-Cashfree-Signature: {signature}
X-Cashfree-Timestamp: {timestamp}

Auto-called by Cashfree after payment
No auth required
```

---

## 🔧 Configuration Files

### appsettings.json
```json
{
  "Payments": {
    "Provider": "Cashfree",
    "Currency": "INR",
    "KeyId": "",
    "KeySecret": "",
    "WebhookSecret": "",
    "Environment": "test",
    "PublicBaseUrl": "https://localhost:7001",
    "CheckoutExpiryMinutes": 10,
    "AccessDurationMonths": 6,
    "CashfreeEnvironment": "sandbox",
    "CashfreeApiVersion": "2024-09-30"
  }
}
```

### Environment Variables
```bash
# Override config values
PAYMENTS__PROVIDER=Cashfree
PAYMENTS__KEYID=your_client_id
PAYMENTS__KEYSECRET=your_client_secret
PAYMENTS__CASHFREEENVIRO NMENT=production
```

---

## 🎯 Common Setups

### Development
```json
{
  "Provider": "Cashfree",
  "KeyId": "sandbox_client_id",
  "KeySecret": "sandbox_client_secret",
  "CashfreeEnvironment": "sandbox",
  "PublicBaseUrl": "https://localhost:7001"
}
```

### Staging
```json
{
  "Provider": "Cashfree",
  "KeyId": "sandbox_client_id",
  "KeySecret": "sandbox_client_secret",
  "CashfreeEnvironment": "sandbox",
  "PublicBaseUrl": "https://staging.yourdomain.com"
}
```

### Production
```json
{
  "Provider": "Cashfree",
  "KeyId": "prod_client_id",
  "KeySecret": "prod_client_secret",
  "CashfreeEnvironment": "production",
  "PublicBaseUrl": "https://yourdomain.com"
}
```

---

## 🧪 Test Cards

| Type | Card Number | Expiry | CVV | OTP |
|------|------------|--------|-----|-----|
| Success | 4111111111111111 | 12/25 | 123 | 123456 |
| Decline | 4000000000000002 | 12/25 | 123 | 123456 |
| 3D Secure | 4111111111111111 | 12/25 | 123 | 123456 |

Use any future expiry date and any 3-digit CVV

---

## 📊 Database Queries

### Check Payment Status
```sql
SELECT * FROM "PaymentTransactions"
WHERE "GatewayOrderId" = 'joviq_abc123...'
```

### Check Enrollments
```sql
SELECT * FROM "Enrollments"
WHERE "StudentId" = 'student-uuid'
```

### View Audit Log
```sql
SELECT * FROM "AuditLogs"
WHERE "Event" LIKE '%Payment%'
ORDER BY "CreatedAt" DESC
```

### Get Webhook History
```sql
SELECT "EventName", "Timestamp", "Details"
FROM "AuditLogs"
WHERE "Event" = 'Student.PaymentVerifiedByCashfreeWebhook'
ORDER BY "Timestamp" DESC
```

---

## 🔒 Security Checklist

- [ ] Credentials not in code (use environment variables)
- [ ] HTTPS only for production webhooks
- [ ] Webhook signature verified always
- [ ] Duplicate payment IDs handled
- [ ] Idempotent webhook processing
- [ ] Error logging but no credential leakage
- [ ] Rate limiting on payment endpoints
- [ ] SQL injection prevention (ORM used)
- [ ] CSRF protection on payment forms
- [ ] Audit trail maintained

---

## 🐛 Troubleshooting

### Payment Won't Create
**Check:**
1. Credentials in appsettings.json
2. Environment variable overrides
3. API logs for error details
4. Network connectivity

### Webhook Not Received
**Check:**
1. URL is publicly accessible (not localhost)
2. Webhook configured in Cashfree dashboard
3. Firewall/NAT rules allow inbound
4. Event type is PAYMENT_SUCCESS_WEBHOOK
5. Check Cashfree event logs

### Signature Verification Fails
**Check:**
1. X-Cashfree-Signature header present
2. X-Cashfree-Timestamp header present
3. Secret key matches Cashfree dashboard
4. Timestamp is fresh (not old)

### Student No Access After Payment
**Check:**
1. Webhook was received (check logs)
2. Signature verified successfully
3. Payment transaction updated to "Verified"
4. Enrollment record created
5. Audit log shows successful processing

### "Wrong Provider Configured"
**Solution:**
1. Ensure "Provider": "Cashfree" in appsettings
2. Restart application
3. Check for environment variable overrides

---

## 📞 Getting Help

### Within Your Team
- Config Issues: Check `appsettings.json` and environment variables
- API Issues: Check logs in application console
- Webhook Issues: Check Cashfree event logs
- DB Issues: Query tables to verify state

### With Cashfree
- **Docs**: https://developer.cashfree.com/
- **API Ref**: https://developer.cashfree.com/api-reference/
- **Support**: https://www.cashfree.com/contact
- **Sandbox Dashboard**: https://sandbox.cashfree.com/

### Your LMS Implementation
- Payment Gateway: `CashfreePaymentGateway.cs`
- Webhook Handler: `LmsPortalService.cs`
- Controller: `PaymentsController.cs`
- Config: `appsettings.json`

---

## 📝 Important Notes

1. **Never commit secrets** - Use environment variables
2. **Always verify signatures** - Non-negotiable security
3. **Handle duplicates** - Webhooks can retry
4. **Log everything** - Audit trail is critical
5. **Test in sandbox first** - Always
6. **Monitor in production** - Set up alerts

---

## 🚀 Production Deployment

### Pre-Deployment
- [ ] Get production credentials from Cashfree
- [ ] Update config with prod credentials
- [ ] Set CashfreeEnvironment to "production"
- [ ] Configure webhook URL to production domain
- [ ] Test webhook delivery in staging
- [ ] Verify HTTPS certificate is valid
- [ ] Set up monitoring and alerts

### Deployment
- [ ] Deploy updated application
- [ ] Verify application started
- [ ] Test payment flow end-to-end
- [ ] Monitor logs for errors
- [ ] Check webhook delivery
- [ ] Verify student gets access

### Post-Deployment
- [ ] Monitor for issues
- [ ] Check webhook delivery rate
- [ ] Verify payment completion rates
- [ ] Monitor error logs
- [ ] Respond to alerts

---

## 📋 Maintenance Tasks

### Daily
- Check webhook delivery logs
- Monitor error rates
- Review audit logs for issues

### Weekly
- Verify all payments processed correctly
- Check enrollment activation rates
- Review any failed transactions

### Monthly
- Analyze payment trends
- Review security logs
- Update documentation

---

## 🎓 Learning Resources

- **Complete Migration Guide**: `CASHFREE_MIGRATION_COMPLETE.md`
- **Setup & Configuration**: `CASHFREE_SETUP_GUIDE.md`
- **Payment Flow Details**: `CASHFREE_PAYMENT_FLOW.md`
- **Implementation Examples**: Source code comments
- **API Documentation**: Cashfree developer portal

---

**Last Updated**: September 22, 2026
**Status**: ✅ Operational
