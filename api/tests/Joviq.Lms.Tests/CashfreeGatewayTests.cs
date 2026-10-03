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
