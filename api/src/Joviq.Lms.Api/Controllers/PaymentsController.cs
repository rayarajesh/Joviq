using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/v1/payments")]
public sealed class PaymentsController(
    ILmsPortalService lmsPortalService,
    IPaymentGateway paymentGateway,
    IOptions<PaymentOptions> paymentOptions) : ControllerBase
{
    private readonly PaymentOptions _options = paymentOptions.Value;

    [HttpPost("webhooks/razorpay")]
    public async Task<IActionResult> RazorpayWebhook(CancellationToken cancellationToken)
    {
        // Only accept Razorpay webhooks if provider is configured as Razorpay
        if (!_options.Provider.Equals("Razorpay", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = "Razorpay webhooks are not configured for this instance.", errorCode = "wrong_provider" });
        }

        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["X-Razorpay-Signature"].ToString();

        if (!paymentGateway.VerifyWebhookSignature(payload, signature))
        {
            return Unauthorized(new { success = false, message = "Invalid payment webhook signature.", errorCode = "payment_webhook_invalid" });
        }

        await lmsPortalService.ProcessPaymentWebhookAsync(payload, signature, cancellationToken);
        return Ok(new { success = true, message = "Payment webhook received." });
    }

    [HttpPost("webhooks/cashfree")]
    public async Task<IActionResult> CashfreeWebhook(CancellationToken cancellationToken)
    {
        // Only accept Cashfree webhooks if provider is configured as Cashfree
        if (!_options.Provider.Equals("Cashfree", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = "Cashfree webhooks are not configured for this instance.", errorCode = "wrong_provider" });
        }

        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["X-Cashfree-Signature"].ToString();
        var timestamp = Request.Headers["X-Cashfree-Timestamp"].ToString();

        if (!paymentGateway.VerifyWebhookSignature(payload, signature, timestamp))
        {
            return Unauthorized(new { success = false, message = "Invalid payment webhook signature.", errorCode = "payment_webhook_invalid" });
        }

        await lmsPortalService.ProcessCashfreePaymentWebhookAsync(payload, cancellationToken);
        return Ok(new { success = true, message = "Payment webhook received." });
    }
}
