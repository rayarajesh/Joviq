using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class CashfreePaymentGateway(
    HttpClient httpClient,
    IOptions<PaymentOptions> paymentOptions,
    ILogger<CashfreePaymentGateway> logger) : IPaymentGateway
{
    private readonly PaymentOptions options = paymentOptions.Value;

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
        EnsureConfigured();

        var orderId = $"joviq_{transactionId:N}";
        var body = new Dictionary<string, object?>
        {
            ["order_id"] = orderId,
            ["order_amount"] = Math.Round(amount, 2, MidpointRounding.AwayFromZero),
            ["order_currency"] = currency,
            ["customer_details"] = new
            {
                customer_id = $"student_{transactionId:N}",
                customer_name = string.IsNullOrWhiteSpace(customerName) ? "Joviq Student" : customerName.Trim(),
                customer_email = string.IsNullOrWhiteSpace(customerEmail) ? $"student+{transactionId:N}@joviq.com" : customerEmail.Trim(),
                customer_phone = NormalizePhone(customerPhone)
            },
            ["order_expiry_time"] = expiresAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"),
            ["order_note"] = "Joviq LMS enrollment payment"
        };

        if (!string.IsNullOrWhiteSpace(options.PublicBaseUrl))
        {
            var frontendBase = string.IsNullOrWhiteSpace(options.FrontendBaseUrl)
                ? options.PublicBaseUrl
                : options.FrontendBaseUrl;
            body["order_meta"] = new
            {
                return_url = $"{frontendBase.TrimEnd('/')}/checkout?cashfree=return&order_id={orderId}"
            };
        }

        using var request = CreateAuthorizedRequest(HttpMethod.Post, "orders");
        request.Headers.TryAddWithoutValidation("x-idempotency-key", transactionId.ToString());
        request.Content = JsonContent.Create(body);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError(
                "Cashfree order creation failed. Status: {StatusCode}, KeyId: {KeyId}, ApiVersion: {ApiVersion}, Environment: {Env}, Response: {Body}",
                response.StatusCode,
                string.IsNullOrWhiteSpace(options.KeyId) ? "(empty)" : options.KeyId[..Math.Min(options.KeyId.Length, 12)] + "...",
                options.CashfreeApiVersion,
                options.CashfreeEnvironment,
                responseBody);
            throw new AppException("Cashfree could not create the payment session. Please try again.", 503, "payment_gateway_unavailable");
        }

        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;
        var paymentSessionId = root.TryGetProperty("payment_session_id", out var sessionElement)
            ? sessionElement.GetString()
            : null;
        var gatewayOrderId = root.TryGetProperty("order_id", out var orderElement)
            ? orderElement.GetString()
            : null;
        if (string.IsNullOrWhiteSpace(paymentSessionId) || string.IsNullOrWhiteSpace(gatewayOrderId))
        {
            throw new AppException("Cashfree returned an invalid payment session.", 503, "payment_gateway_invalid_response");
        }

        return new PaymentGatewayOrder(
            "Cashfree",
            options.KeyId,
            gatewayOrderId,
            checked((long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero)),
            currency,
            expiresAt,
            paymentSessionId,
            options.CashfreeEnvironment);
    }

    public async Task<PaymentGatewayVerification> VerifyPaymentAsync(
        string orderId,
        string? paymentId,
        string? signature,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return new PaymentGatewayVerification(false);
        }

        using var orderRequest = CreateAuthorizedRequest(HttpMethod.Get, $"orders/{Uri.EscapeDataString(orderId)}");
        using var orderResponse = await httpClient.SendAsync(orderRequest, cancellationToken);
        if (!orderResponse.IsSuccessStatusCode)
        {
            var errorBody = await orderResponse.Content.ReadAsStringAsync(cancellationToken);
            logger.LogError(
                "Cashfree order fetch failed during verify. OrderId: {OrderId}, Status: {StatusCode}, Response: {Body}",
                orderId, orderResponse.StatusCode, errorBody);
            return new PaymentGatewayVerification(false);
        }

        using var orderDocument = JsonDocument.Parse(await orderResponse.Content.ReadAsStringAsync(cancellationToken));
        var orderRoot = orderDocument.RootElement;
        var isPaid = orderRoot.TryGetProperty("order_status", out var statusElement) &&
            string.Equals(statusElement.GetString(), "PAID", StringComparison.OrdinalIgnoreCase);
        if (!isPaid)
        {
            return new PaymentGatewayVerification(false);
        }

        var resolvedPaymentId = string.IsNullOrWhiteSpace(paymentId)
            ? await GetSuccessfulPaymentIdAsync(orderId, cancellationToken)
            : paymentId.Trim();
        return new PaymentGatewayVerification(!string.IsNullOrWhiteSpace(resolvedPaymentId), resolvedPaymentId);
    }

    public bool VerifyWebhookSignature(string payload, string signature, string? timestamp = null)
    {
        var secret = string.IsNullOrWhiteSpace(options.WebhookSecret) ? options.KeySecret : options.WebhookSecret;
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(timestamp))
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var expected = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(timestamp + payload)));
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature.Trim()));
    }

    private async Task<string?> GetSuccessfulPaymentIdAsync(string orderId, CancellationToken cancellationToken)
    {
        using var request = CreateAuthorizedRequest(HttpMethod.Get, $"orders/{Uri.EscapeDataString(orderId)}/payments");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        if (document.RootElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var payment in document.RootElement.EnumerateArray())
        {
            var isSuccessful = payment.TryGetProperty("payment_status", out var paymentStatus) &&
                string.Equals(paymentStatus.GetString(), "SUCCESS", StringComparison.OrdinalIgnoreCase);
            if (isSuccessful && payment.TryGetProperty("cf_payment_id", out var paymentId))
            {
                return paymentId.GetString();
            }
        }

        return null;
    }

    private HttpRequestMessage CreateAuthorizedRequest(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.TryAddWithoutValidation("x-api-version", options.CashfreeApiVersion);
        request.Headers.TryAddWithoutValidation("x-client-id", options.KeyId);
        request.Headers.TryAddWithoutValidation("x-client-secret", options.KeySecret);
        request.Headers.TryAddWithoutValidation("x-request-id", Guid.NewGuid().ToString());
        return request;
    }

    private void EnsureConfigured()
    {
        if (!options.Provider.Equals("Cashfree", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(options.KeyId) ||
            string.IsNullOrWhiteSpace(options.KeySecret))
        {
            throw new AppException("Online payments are not configured yet. Add the Cashfree client ID and client secret in the API environment.", 503, "payment_gateway_not_configured");
        }
    }

    private static string NormalizePhone(string? phone)
    {
        var digits = new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
        if (digits.Length > 10)
        {
            digits = digits[^10..];
        }

        return digits.Length == 10 ? digits : "9999999999";
    }
}
