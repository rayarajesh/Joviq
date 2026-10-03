using System.Security.Cryptography;
using System.Text;
using Joviq.Lms.Api.Controllers;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Application.Lms;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class CashfreeWebhookTests
{
    private const string Secret = "test-only-cashfree-secret";
    private const string Payload = "{\"type\":\"PAYMENT_SUCCESS_WEBHOOK\",\"amount\":100.00}";
    private const string Timestamp = "1790964000000";

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public async Task UsesCashfreeHeadersAndRejectsInvalidNotifications(bool tampered, bool unsigned)
    {
        var options = Options.Create(new PaymentOptions { Provider = "Cashfree", KeySecret = Secret });
        using var client = new HttpClient();
        var gateway = new CashfreePaymentGateway(client, options, NullLogger<CashfreePaymentGateway>.Instance);
        var portal = new Mock<ILmsPortalService>(MockBehavior.Strict);
        if (!tampered && !unsigned)
            portal.Setup(service => service.ProcessCashfreePaymentWebhookAsync(Payload, It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

        var context = new DefaultHttpContext();
        var receivedPayload = tampered ? Payload.Replace("100.00", "1.00") : Payload;
        context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(receivedPayload));
        if (!unsigned)
        {
            context.Request.Headers["x-webhook-timestamp"] = Timestamp;
            context.Request.Headers["x-webhook-signature"] = Convert.ToBase64String(
                HMACSHA256.HashData(Encoding.UTF8.GetBytes(Secret), Encoding.UTF8.GetBytes(Timestamp + Payload)));
        }
        var controller = new PaymentsController(portal.Object, gateway, options)
        {
            ControllerContext = new ControllerContext { HttpContext = context }
        };

        var result = await controller.CashfreeWebhook(CancellationToken.None);
        if (tampered || unsigned)
        {
            Assert.IsType<UnauthorizedObjectResult>(result);
            portal.Verify(service => service.ProcessCashfreePaymentWebhookAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        }
        else
        {
            Assert.IsType<OkObjectResult>(result);
            portal.Verify(service => service.ProcessCashfreePaymentWebhookAsync(Payload, It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
