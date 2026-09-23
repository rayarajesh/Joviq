using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.ExternalServices;

public interface IRazorpayService
{
    Task<RazorpayOrderResponse> CreateOrderAsync(decimal amount, string customerId, Dictionary<string, string>? metadata = null);
    Task<RazorpayPaymentResponse> GetPaymentAsync(string paymentId);
    Task<bool> VerifyPaymentSignatureAsync(string orderId, string paymentId, string signature);
    Task<RazorpayRefundResponse> RefundPaymentAsync(string paymentId, decimal amount);
    string GenerateSignature(string orderId, string paymentId);
}

public class RazorpayService : IRazorpayService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RazorpayService> _logger;
    private readonly string _keyId;
    private readonly string _keySecret;

    public RazorpayService(HttpClient httpClient, IConfiguration configuration, ILogger<RazorpayService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _keyId = configuration["RazorpaySettings:KeyId"] ?? throw new InvalidOperationException("Razorpay KeyId not configured");
        _keySecret = configuration["RazorpaySettings:KeySecret"] ?? throw new InvalidOperationException("Razorpay KeySecret not configured");
    }

    public async Task<RazorpayOrderResponse> CreateOrderAsync(decimal amount, string customerId, Dictionary<string, string>? metadata = null)
    {
        try
        {
            var amountInPaisa = (long)(amount * 100); // Razorpay uses smallest currency unit
            var requestBody = new
            {
                amount = amountInPaisa,
                currency = "INR",
                receipt = $"receipt_{customerId}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                notes = metadata ?? new Dictionary<string, string>()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders")
            {
                Content = content
            };

            // Add Basic Authentication
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_keyId}:{_keySecret}"));
            request.Headers.Add("Authorization", $"Basic {credentials}");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Razorpay order creation failed: {response.StatusCode} - {responseContent}");
                throw new Exception($"Failed to create Razorpay order: {responseContent}");
            }

            var orderResponse = JsonSerializer.Deserialize<RazorpayOrderResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return orderResponse ?? throw new Exception("Failed to deserialize order response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Razorpay order");
            throw;
        }
    }

    public async Task<RazorpayPaymentResponse> GetPaymentAsync(string paymentId)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.razorpay.com/v1/payments/{paymentId}");

            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_keyId}:{_keySecret}"));
            request.Headers.Add("Authorization", $"Basic {credentials}");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Razorpay get payment failed: {response.StatusCode} - {responseContent}");
                throw new Exception($"Failed to get payment details: {responseContent}");
            }

            var paymentResponse = JsonSerializer.Deserialize<RazorpayPaymentResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return paymentResponse ?? throw new Exception("Failed to deserialize payment response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Razorpay payment");
            throw;
        }
    }

    public Task<bool> VerifyPaymentSignatureAsync(string orderId, string paymentId, string signature)
    {
        try
        {
            var generatedSignature = GenerateSignature(orderId, paymentId);
            var isValid = generatedSignature == signature;

            if (!isValid)
            {
                _logger.LogWarning($"Payment signature verification failed for order {orderId}");
            }

            return Task.FromResult(isValid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment signature");
            return Task.FromResult(false);
        }
    }

    public async Task<RazorpayRefundResponse> RefundPaymentAsync(string paymentId, decimal amount)
    {
        try
        {
            var amountInPaisa = (long)(amount * 100);
            var requestBody = new { amount = amountInPaisa };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.razorpay.com/v1/payments/{paymentId}/refund")
            {
                Content = content
            };

            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_keyId}:{_keySecret}"));
            request.Headers.Add("Authorization", $"Basic {credentials}");

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Razorpay refund failed: {response.StatusCode} - {responseContent}");
                throw new Exception($"Failed to refund payment: {responseContent}");
            }

            var refundResponse = JsonSerializer.Deserialize<RazorpayRefundResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return refundResponse ?? throw new Exception("Failed to deserialize refund response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refunding payment");
            throw;
        }
    }

    public string GenerateSignature(string orderId, string paymentId)
    {
        var data = $"{orderId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_keySecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}

// Response DTOs
public class RazorpayOrderResponse
{
    public string Id { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Receipt { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Dictionary<string, string> Notes { get; set; } = new();
    public long CreatedAt { get; set; }
}

public class RazorpayPaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Method { get; set; }
    public string? Description { get; set; }
    public long CreatedAt { get; set; }
    public string? OrderId { get; set; }
    public Dictionary<string, object> Notes { get; set; } = new();
}

public class RazorpayRefundResponse
{
    public string Id { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? PaymentId { get; set; }
    public long CreatedAt { get; set; }
}
