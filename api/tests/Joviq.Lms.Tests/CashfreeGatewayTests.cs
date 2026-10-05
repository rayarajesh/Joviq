using System.Net;
using System.Text;
using Joviq.Lms.Application.Common.Options;
using Joviq.Lms.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Tests;

public sealed class CashfreeGatewayTests
{
    [Theory]
    [InlineData("12345", null, true)]
    [InlineData("\"12345\"", "12345", true)]
    [InlineData("12345", "wrong-payment", false)]
    public async Task VerifiesPaymentIdsAgainstCashfree(string jsonId, string? submittedId, bool expected)
    {
        using var client = new HttpClient(new ResponseHandler(path => path.EndsWith("/payments")
            ? $"[{{\"payment_status\":\"SUCCESS\",\"cf_payment_id\":{jsonId}}}]"
            : "{\"order_status\":\"PAID\"}")) { BaseAddress = new Uri("https://sandbox.cashfree.com/pg/") };
        var gateway = Gateway(client);
        var result = await gateway.VerifyPaymentAsync("order-test", submittedId, null, CancellationToken.None);
        Assert.Equal(expected, result.IsValid);
    }

    [Fact]
    public async Task DoesNotVerifyAnUnpaidOrder()
    {
        using var client = new HttpClient(new ResponseHandler(_ => "{\"order_status\":\"ACTIVE\"}"))
            { BaseAddress = new Uri("https://sandbox.cashfree.com/pg/") };
        Assert.False((await Gateway(client).VerifyPaymentAsync("order-test", null, null, CancellationToken.None)).IsValid);
    }

    private static CashfreePaymentGateway Gateway(HttpClient client) => new(client,
        Options.Create(new PaymentOptions { Provider = "Cashfree", KeyId = "test-id", KeySecret = "test-secret" }),
        NullLogger<CashfreePaymentGateway>.Instance);

    [Theory]
    [InlineData("order-test", true)]
    [InlineData("other-order", false)]
    public async Task ExternalPaymentMustBelongToSubmittedLink(string linkedOrder, bool valid)
    {
        using var client = new HttpClient(new ResponseHandler(path =>
            path.Contains("/links/") ? $"[{{\"order_id\":\"{linkedOrder}\"}}]" :
            path.EndsWith("/payments") ? "[{\"payment_status\":\"SUCCESS\",\"cf_payment_id\":12345}]" :
            "{\"order_status\":\"PAID\",\"order_amount\":7999,\"order_currency\":\"INR\",\"customer_details\":{\"customer_email\":\"student@example.test\",\"customer_phone\":\"9876543210\"}}"))
            { BaseAddress = new Uri("https://sandbox.cashfree.com/pg/") };
        var result = await Gateway(client).VerifyExternalPaymentAsync("order-test", "12345", "link-test", CancellationToken.None);
        Assert.Equal(valid, result is not null);
        if (result is not null)
        {
            Assert.Equal(7999m, result.Amount);
            Assert.Equal("INR", result.Currency);
            Assert.Equal("student@example.test", result.CustomerEmail);
            Assert.Equal("12345", result.PaymentId);
        }
    }

    [Theory]
    [InlineData("ACTIVE", "12345", "7999")]
    [InlineData("PAID", "wrong-id", "7999")]
    [InlineData("PAID", "12345", "0")]
    public async Task ExternalPaymentRejectsUnpaidMismatchedOrInvalidOrders(string status, string paymentId, string amount)
    {
        using var client = new HttpClient(new ResponseHandler(path => path.EndsWith("/payments")
            ? "[{\"payment_status\":\"SUCCESS\",\"cf_payment_id\":12345}]"
            : $"{{\"order_status\":\"{status}\",\"order_amount\":{amount},\"order_currency\":\"INR\",\"customer_details\":{{}}}}"))
            { BaseAddress = new Uri("https://sandbox.cashfree.com/pg/") };
        Assert.Null(await Gateway(client).VerifyExternalPaymentAsync("order-test", paymentId, null, CancellationToken.None));
    }

    private sealed class ResponseHandler(Func<string, string> response) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Assert.Equal("2025-01-01", request.Headers.GetValues("x-api-version").Single());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(response(request.RequestUri!.AbsolutePath), Encoding.UTF8, "application/json")
            });
        }
    }
}
