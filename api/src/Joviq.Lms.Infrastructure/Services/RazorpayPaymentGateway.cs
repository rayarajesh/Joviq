using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class RazorpayPaymentGateway(
    HttpClient httpClient,
    IOptions<PaymentOptions> paymentOptions,
    IHostEnvironment hostEnvironment) : IPaymentGateway
{
    private readonly PaymentOptions options = paymentOptions.Value;

    private bool IsDevelopmentTestMode =>
        hostEnvironment.IsDevelopment() &&
        options.AllowTestPayments &&
        options.Provider.Equals("Development", StringComparison.OrdinalIgnoreCase);

    public async Task<PaymentGatewayOrder> CreateOrderAsync(
        Guid transactionId,
        decimal amount,
        string currency,
        DateTimeOffset expiresAt,
        string? customerName,
        string? customerEmail,
        string? customerPhone,
        string? customerCollege,
        CancellationToken cancellationToken)
    {
        if (IsDevelopmentTestMode)
        {
            var testAmountInMinorUnits = checked((long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero));
            return new PaymentGatewayOrder(
                "Development",
                "development_test_key",
                $"test_order_{transactionId:N}",
                testAmountInMinorUnits,
                currency,
                expiresAt);
        }

        EnsureConfigured();

        var amountInMinorUnits = checked((long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero));
        var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{options.KeyId}:{options.KeySecret}"));
        using var request = new HttpRequestMessage(HttpMethod.Post, "orders")
        {
            Content = JsonContent.Create(new
            {
                amount = amountInMinorUnits,
                currency,
                receipt = $"JOVIQ-{transactionId:N}",
                expire_by = expiresAt.ToUnixTimeSeconds(),
                notes = new { transaction_id = transactionId.ToString("N") }
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authValue);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new AppException("The payment gateway could not create an order. Please try again.", 503, "payment_gateway_unavailable");
        }

        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;
        var orderId = root.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(orderId))
        {
            throw new AppException("The payment gateway returned an invalid order.", 503, "payment_gateway_invalid_response");
        }

        return new PaymentGatewayOrder(
            options.Provider,
            options.KeyId,
            orderId,
            amountInMinorUnits,
            currency,
            expiresAt);
    }

    public Task<PaymentGatewayVerification> VerifyPaymentAsync(
        string orderId,
        string? paymentId,
        string? signature,
        CancellationToken cancellationToken)
        => Task.FromResult(new PaymentGatewayVerification(
            VerifyPaymentSignature(orderId, paymentId ?? string.Empty, signature ?? string.Empty),
            paymentId));

    private bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        if (IsDevelopmentTestMode)
        {
            return !string.IsNullOrWhiteSpace(orderId) &&
                !string.IsNullOrWhiteSpace(paymentId) &&
                !string.IsNullOrWhiteSpace(signature) &&
                orderId.StartsWith("test_order_", StringComparison.OrdinalIgnoreCase) &&
                paymentId.StartsWith("test_payment_", StringComparison.OrdinalIgnoreCase) &&
                signature.Trim().Equals("development-test-signature", StringComparison.Ordinal);
        }

        if (string.IsNullOrWhiteSpace(options.KeySecret) ||
            string.IsNullOrWhiteSpace(orderId) ||
            string.IsNullOrWhiteSpace(paymentId) ||
            string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(options.KeySecret));
        var expected = hmac.ComputeHash(Encoding.UTF8.GetBytes($"{orderId}|{paymentId}"));
        var provided = Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant());
        var expectedHex = Convert.ToHexString(expected).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedHex),
            provided);
    }

    public bool VerifyWebhookSignature(string payload, string signature, string? timestamp = null)
    {
        if (IsDevelopmentTestMode)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(options.WebhookSecret) || string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(options.WebhookSecret));
        var expected = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant()));
    }

    private void EnsureConfigured()
    {
        if (!options.Provider.Equals("Razorpay", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(options.KeyId) ||
            string.IsNullOrWhiteSpace(options.KeySecret))
        {
            throw new AppException("Online payments are not configured yet. Add the Razorpay keys in the API environment.", 503, "payment_gateway_not_configured");
        }
    }
}
