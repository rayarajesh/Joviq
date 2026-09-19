namespace Joviq.Lms.Application.Common.Interfaces;

public interface IPaymentGateway
{
    Task<PaymentGatewayOrder> CreateOrderAsync(
        Guid transactionId,
        decimal amount,
        string currency,
        DateTimeOffset expiresAt,
        string? customerName,
        string? customerEmail,
        string? customerPhone,
        string? customerCollege,
        CancellationToken cancellationToken);

    Task<PaymentGatewayVerification> VerifyPaymentAsync(
        string orderId,
        string? paymentId,
        string? signature,
        CancellationToken cancellationToken);

    bool VerifyWebhookSignature(string payload, string signature, string? timestamp = null);
}

public sealed record PaymentGatewayOrder(
    string Provider,
    string PublicKey,
    string OrderId,
    long AmountInMinorUnits,
    string Currency,
    DateTimeOffset ExpiresAt,
    string? PaymentSessionId = null,
    string? Environment = null);

public sealed record PaymentGatewayVerification(bool IsValid, string? PaymentId = null);
