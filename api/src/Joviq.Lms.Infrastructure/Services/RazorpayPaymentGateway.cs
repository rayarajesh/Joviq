using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Razorpay payment gateway implementation
/// Handles order creation, verification, and webhook validation
/// </summary>
public sealed class RazorpayPaymentGateway : IPaymentGateway
{
    private readonly HttpClient _httpClient;
    private readonly IOptions<PaymentOptions> _options;
    private readonly ILogger<RazorpayPaymentGateway> _logger;
    private const string RazorpayApiBase = "https://api.razorpay.com/v1";

    public RazorpayPaymentGateway(
        HttpClient httpClient,
        IOptions<PaymentOptions> options,
        ILogger<RazorpayPaymentGateway> logger)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
    }

    /// <summary>
    /// Creates a payment order on Razorpay
    /// </summary>
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

        try
        {
            var amountInPaisa = (long)(amount * 100);
            var options = _options.Value;

            var requestBody = new
            {
                amount = amountInPaisa,
                currency = currency,
                receipt = $"txn_{transactionId:N}",
                notes = new
                {
                    transaction_id = transactionId.ToString(),
                    customer_name = customerName ?? "",
                    customer_email = customerEmail ?? "",
                    customer_phone = customerPhone ?? "",
                    customer_college = customerCollege ?? ""
                },
                expire_by = (long)expiresAt.ToUnixTimeSeconds()
            };

            using var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, $"{RazorpayApiBase}/orders")
            {
                Content = content
            };

            AddBasicAuthHeader(request);

            _logger.LogInformation(
                "Creating Razorpay order for transaction {TransactionId}, amount: {Amount} {Currency}",
                transactionId, amount, currency);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Razorpay order creation failed with status {StatusCode}: {Response}",
                    response.StatusCode, responseContent);

                throw new AppException(
                    "Failed to create payment order. Please try again later.",
                    503,
                    "razorpay_order_creation_failed");
            }

            var orderResponse = JsonSerializer.Deserialize<RazorpayOrderResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (orderResponse?.Id == null)
            {
                throw new AppException(
                    "Invalid response from payment gateway.",
                    503,
                    "razorpay_invalid_response");
            }

            _logger.LogInformation(
                "Razorpay order created successfully: {OrderId}",
                orderResponse.Id);

            return new PaymentGatewayOrder(
                Provider: "Razorpay",
                PublicKey: options.KeyId,
                OrderId: orderResponse.Id,
                AmountInMinorUnits: amountInPaisa,
                Currency: currency,
                ExpiresAt: expiresAt,
                Environment: options.Environment);
        }
        catch (AppException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating Razorpay order");
            throw new AppException(
                "Payment service temporarily unavailable.",
                503,
                "razorpay_service_error");
        }
    }

    /// <summary>
    /// Verifies payment after Razorpay checkout
    /// </summary>
    public async Task<PaymentGatewayVerification> VerifyPaymentAsync(
        string orderId,
        string? paymentId,
        string? signature,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        if (string.IsNullOrWhiteSpace(orderId) ||
            string.IsNullOrWhiteSpace(paymentId) ||
            string.IsNullOrWhiteSpace(signature))
        {
            _logger.LogWarning("Payment verification called with missing parameters");
            return new PaymentGatewayVerification(IsValid: false);
        }

        try
        {
            // Verify signature
            if (!VerifySignature(orderId, paymentId, signature))
            {
                _logger.LogWarning(
                    "Payment signature verification failed for order {OrderId}",
                    orderId);
                return new PaymentGatewayVerification(IsValid: false);
            }

            // Get payment details from Razorpay
            var paymentDetails = await GetPaymentDetailsAsync(paymentId, cancellationToken);

            if (paymentDetails?.Id == null)
            {
                _logger.LogWarning(
                    "Could not retrieve payment details for {PaymentId}",
                    paymentId);
                return new PaymentGatewayVerification(IsValid: false);
            }

            var isValid = paymentDetails.Status == "captured" || paymentDetails.Status == "authorized";

            if (isValid)
            {
                _logger.LogInformation(
                    "Payment verified successfully: {PaymentId}, Status: {Status}",
                    paymentId, paymentDetails.Status);
            }
            else
            {
                _logger.LogWarning(
                    "Payment status is not valid: {PaymentId}, Status: {Status}",
                    paymentId, paymentDetails.Status);
            }

            return new PaymentGatewayVerification(IsValid: isValid, PaymentId: paymentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment {PaymentId}", paymentId);
            return new PaymentGatewayVerification(IsValid: false);
        }
    }

    /// <summary>
    /// Verifies webhook signature from Razorpay
    /// </summary>
    public bool VerifyWebhookSignature(string payload, string signature, string? timestamp = null)
    {
        if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(signature))
        {
            _logger.LogWarning("Webhook verification called with missing payload or signature");
            return false;
        }

        try
        {
            var webhookSecret = _options.Value.WebhookSecret;
            if (string.IsNullOrWhiteSpace(webhookSecret))
            {
                _logger.LogError("Webhook secret not configured");
                return false;
            }

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var computedSignature = BitConverter.ToString(computedHash).Replace("-", "").ToLower();

            var isValid = computedSignature == signature.ToLower();

            if (!isValid)
            {
                _logger.LogWarning("Invalid webhook signature");
            }

            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying webhook signature");
            return false;
        }
    }

    /// <summary>
    /// Verifies payment signature using HMAC-SHA256
    /// </summary>
    private bool VerifySignature(string orderId, string paymentId, string signature)
    {
        try
        {
            var keySecret = _options.Value.KeySecret;
            var data = $"{orderId}|{paymentId}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(keySecret));
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            var computedSignature = BitConverter.ToString(computedHash).Replace("-", "").ToLower();

            return computedSignature == signature.ToLower();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment signature");
            return false;
        }
    }

    /// <summary>
    /// Retrieves payment details from Razorpay API
    /// </summary>
    private async Task<RazorpayPaymentResponse?> GetPaymentDetailsAsync(
        string paymentId,
        CancellationToken cancellationToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{RazorpayApiBase}/payments/{paymentId}");
            AddBasicAuthHeader(request);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Failed to retrieve payment details {PaymentId}: {StatusCode}",
                    paymentId, response.StatusCode);
                return null;
            }

            return JsonSerializer.Deserialize<RazorpayPaymentResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payment details for {PaymentId}", paymentId);
            return null;
        }
    }

    /// <summary>
    /// Adds Basic Authentication header for Razorpay API requests
    /// </summary>
    private void AddBasicAuthHeader(HttpRequestMessage request)
    {
        var credentials = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{_options.Value.KeyId}:{_options.Value.KeySecret}"));
        request.Headers.Add("Authorization", $"Basic {credentials}");
    }

    /// <summary>
    /// Ensures Razorpay is properly configured
    /// </summary>
    private void EnsureConfigured()
    {
        var options = _options.Value;

        if (string.IsNullOrWhiteSpace(options.KeyId) ||
            string.IsNullOrWhiteSpace(options.KeySecret))
        {
            throw new AppException(
                "Payment gateway is not configured. Please contact administrator.",
                503,
                "payment_gateway_not_configured");
        }
    }
}

/// <summary>
/// Razorpay API Response Models
/// </summary>

public sealed class RazorpayOrderResponse
{
    public string? Id { get; set; }
    public long Amount { get; set; }
    public string? Currency { get; set; }
    public string? Receipt { get; set; }
    public string? Status { get; set; }
    public long CreatedAt { get; set; }
}

public sealed class RazorpayPaymentResponse
{
    public string? Id { get; set; }
    public string? Entity { get; set; }
    public long Amount { get; set; }
    public string? Currency { get; set; }
    public string? Status { get; set; }
    public string? Method { get; set; }
    public string? Description { get; set; }
    public long CreatedAt { get; set; }
    public string? OrderId { get; set; }
    public Dictionary<string, object>? Notes { get; set; }
}
