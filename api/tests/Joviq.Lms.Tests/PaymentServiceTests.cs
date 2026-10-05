using Joviq.Lms.Application.Contracts.Payments;
using Joviq.Lms.Application.Services;
using Moq;

namespace Joviq.Lms.Tests;

public sealed class PaymentServiceTests
{
    [Theory]
    [InlineData(null, "payment", "signature")]
    [InlineData("", "payment", "signature")]
    [InlineData(" ", "payment", "signature")]
    [InlineData("order", null, "signature")]
    [InlineData("order", "", "signature")]
    [InlineData("order", " ", "signature")]
    [InlineData("order", "payment", null)]
    [InlineData("order", "payment", "")]
    [InlineData("order", "payment", " ")]
    public async Task RejectsMissingVerificationFieldsWithoutCallingGateway(
        string? orderId, string? paymentId, string? signature)
    {
        var gateway = new Mock<IRazorpayService>(MockBehavior.Strict);
        var result = await new PaymentService(gateway.Object).VerifyPaymentAsync(new VerifyPaymentRequest
        {
            OrderId = orderId,
            PaymentId = paymentId,
            Signature = signature
        });

        Assert.False(result.IsSuccessful);
        Assert.Contains("requires", result.Message);
        gateway.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PassesCompleteVerificationFieldsToGateway()
    {
        var gateway = new Mock<IRazorpayService>(MockBehavior.Strict);
        gateway.Setup(service => service.VerifyPaymentSignatureAsync("order", "payment", "signature"))
            .ReturnsAsync(false);

        var result = await new PaymentService(gateway.Object).VerifyPaymentAsync(new VerifyPaymentRequest
        {
            OrderId = "order",
            PaymentId = "payment",
            Signature = "signature"
        });

        Assert.False(result.IsSuccessful);
        Assert.Contains("Invalid signature", result.Message);
        gateway.Verify(service => service.VerifyPaymentSignatureAsync("order", "payment", "signature"), Times.Once);
        gateway.VerifyNoOtherCalls();
    }
}
