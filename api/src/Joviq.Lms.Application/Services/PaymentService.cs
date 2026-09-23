using Joviq.Lms.Application.Contracts.Payments;
using Joviq.Lms.Domain.Entities;
using Joviq.Lms.Domain.Enums;

namespace Joviq.Lms.Application.Services;

public interface IRazorpayService
{
    Task<RazorpayOrderResponse> CreateOrderAsync(decimal amount, string customerId, Dictionary<string, string>? metadata = null);
    Task<RazorpayPaymentResponse> GetPaymentAsync(string paymentId);
    Task<bool> VerifyPaymentSignatureAsync(string orderId, string paymentId, string signature);
    Task<RazorpayRefundResponse> RefundPaymentAsync(string paymentId, decimal amount);
    string GenerateSignature(string orderId, string paymentId);
}

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

public interface IPaymentService
{
    Task<PaymentResponseDto> CreatePaymentOrderAsync(CreatePaymentOrderRequest request, string? studentEmail = null);
    Task<PaymentVerificationResponseDto> VerifyPaymentAsync(VerifyPaymentRequest request);
    Task<PaymentTransaction?> GetPaymentTransactionAsync(Guid transactionId);
}

public class PaymentService : IPaymentService
{
    private readonly IRazorpayService _razorpayService;

    public PaymentService(IRazorpayService razorpayService)
    {
        _razorpayService = razorpayService;
    }

    public async Task<PaymentResponseDto> CreatePaymentOrderAsync(CreatePaymentOrderRequest request, string? studentEmail = null)
    {
        try
        {
            // Create metadata for Razorpay
            var metadata = new Dictionary<string, string>
            {
                { "student_id", request.StudentId.ToString() },
                { "program_id", request.ProgramId.ToString() },
                { "enrollment_id", request.EnrollmentId?.ToString() ?? "null" }
            };

            if (!string.IsNullOrEmpty(studentEmail))
            {
                metadata["student_email"] = studentEmail;
            }

            if (!string.IsNullOrEmpty(request.CouponCode))
            {
                metadata["coupon_code"] = request.CouponCode;
            }

            // Call Razorpay to create order
            var razorpayOrder = await _razorpayService.CreateOrderAsync(
                request.Amount,
                request.StudentId.ToString(),
                metadata);

            // Create PaymentTransaction record
            var paymentTransaction = new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                StudentId = request.StudentId,
                ProgramId = request.ProgramId,
                ProgramPlanId = request.ProgramPlanId,
                EnrollmentId = request.EnrollmentId,
                Gateway = "Razorpay",
                GatewayOrderId = razorpayOrder.Id,
                Amount = request.Amount,
                OriginalAmount = request.OriginalAmount,
                DiscountAmount = request.DiscountAmount,
                CouponCode = request.CouponCode,
                Mode = PaymentMode.PayInFull,
                Status = PaymentStatus.Pending,
                Currency = razorpayOrder.Currency,
                CheckoutExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            // TODO: Save paymentTransaction to database using your DbContext
            // await _paymentRepository.AddAsync(paymentTransaction);

            return new PaymentResponseDto
            {
                PaymentTransactionId = paymentTransaction.Id,
                OrderId = razorpayOrder.Id,
                Amount = request.Amount,
                Currency = razorpayOrder.Currency,
                KeyId = "YOUR_RAZORPAY_KEY_ID",
                Notes = new Dictionary<string, object>
                {
                    { "student_id", request.StudentId },
                    { "program_id", request.ProgramId },
                    { "amount", request.Amount }
                }
            };
        }
        catch (Exception)
        {
            throw;
        }
    }

    public async Task<PaymentVerificationResponseDto> VerifyPaymentAsync(VerifyPaymentRequest request)
    {
        try
        {
            // Verify the signature
            var isSignatureValid = await _razorpayService.VerifyPaymentSignatureAsync(
                request.OrderId,
                request.PaymentId,
                request.Signature);

            if (!isSignatureValid)
            {
                return new PaymentVerificationResponseDto
                {
                    IsSuccessful = false,
                    Message = "Payment verification failed: Invalid signature"
                };
            }

            // Get payment details from Razorpay
            var paymentDetails = await _razorpayService.GetPaymentAsync(request.PaymentId);

            // TODO: Fetch PaymentTransaction from database using request.OrderId
            // TODO: Update payment status and enrollment if payment is successful

            return new PaymentVerificationResponseDto
            {
                IsSuccessful = true,
                Message = "Payment verified successfully",
                PaymentTransactionId = Guid.Empty,
                EnrollmentStatus = "Active"
            };
        }
        catch
        {
            return new PaymentVerificationResponseDto
            {
                IsSuccessful = false,
                Message = "Payment verification error"
            };
        }
    }

    public Task<PaymentTransaction?> GetPaymentTransactionAsync(Guid transactionId)
    {
        // TODO: Implement database query
        throw new NotImplementedException();
    }
}
