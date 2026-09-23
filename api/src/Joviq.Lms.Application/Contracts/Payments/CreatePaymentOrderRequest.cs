namespace Joviq.Lms.Application.Contracts.Payments;

public sealed class CreatePaymentOrderRequest
{
    public Guid StudentId { get; set; }
    public Guid ProgramId { get; set; }
    public Guid? ProgramPlanId { get; set; }
    public Guid? EnrollmentId { get; set; }
    public decimal Amount { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? CouponCode { get; set; }
}

public sealed class VerifyPaymentRequest
{
    public Guid? PaymentTransactionId { get; set; }
    public string? OrderId { get; set; }
    public string? PaymentId { get; set; }
    public string? Signature { get; set; }
}

public sealed class PaymentResponseDto
{
    public Guid PaymentTransactionId { get; set; }
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string KeyId { get; set; } = string.Empty;
    public Dictionary<string, object> Notes { get; set; } = new();
}

public sealed class PaymentVerificationResponseDto
{
    public bool IsSuccessful { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? PaymentTransactionId { get; set; }
    public string? EnrollmentStatus { get; set; }
}
