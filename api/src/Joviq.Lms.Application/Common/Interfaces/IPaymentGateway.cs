namespace Joviq.Lms.Application.Common.Interfaces;

public interface IPaymentGateway
{
    Task<PaymentGatewayOrder> CreateOrderAsync(
        Guid transactionId,
        decimal amount,
        string currency,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken);

    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);

    bool VerifyWebhookSignature(string payload, string signature);
}

public sealed record PaymentGatewayOrder(
    string Provider,
    string PublicKey,
    string OrderId,
    long AmountInMinorUnits,
    string Currency,
    DateTimeOffset ExpiresAt);
