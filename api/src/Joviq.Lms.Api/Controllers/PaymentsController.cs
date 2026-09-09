using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Lms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/v1/payments")]
public sealed class PaymentsController(
    ILmsPortalService lmsPortalService,
    IPaymentGateway paymentGateway) : ControllerBase
{
    [HttpPost("webhooks/razorpay")]
    public async Task<IActionResult> RazorpayWebhook(CancellationToken cancellationToken)
    {
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
}
