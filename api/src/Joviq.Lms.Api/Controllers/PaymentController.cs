using Joviq.Lms.Application.Contracts.Payments;
using Joviq.Lms.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Joviq.Lms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;
    private readonly IConfiguration _configuration;

    public PaymentController(
        IPaymentService paymentService,
        ILogger<PaymentController> logger,
        IConfiguration configuration)
    {
        _paymentService = paymentService;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Create a payment order for program enrollment
    /// </summary>
    [HttpPost("create-order")]
    [Authorize]
    [ProducesResponseType(typeof(PaymentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreatePaymentOrder([FromBody] CreatePaymentOrderRequest request)
    {
        try
        {
            if (request.Amount <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than 0" });
            }

            // Get student email from claims if available
            var studentEmail = User.FindFirst("email")?.Value;

            var response = await _paymentService.CreatePaymentOrderAsync(request, studentEmail);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment order");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Failed to create payment order", error = ex.Message });
        }
    }

    /// <summary>
    /// Verify payment after successful checkout
    /// </summary>
    [HttpPost("verify")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaymentVerificationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.OrderId) || 
                string.IsNullOrEmpty(request.PaymentId) || 
                string.IsNullOrEmpty(request.Signature))
            {
                return BadRequest(new { message = "OrderId, PaymentId, and Signature are required" });
            }

            var response = await _paymentService.VerifyPaymentAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying payment");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Failed to verify payment", error = ex.Message });
        }
    }

    /// <summary>
    /// Get Razorpay key ID for frontend
    /// </summary>
    [HttpGet("config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetPaymentConfig()
    {
        try
        {
            var keyId = _configuration["RazorpaySettings:KeyId"];
            if (string.IsNullOrEmpty(keyId))
            {
                return BadRequest(new { message = "Razorpay configuration not found" });
            }

            return Ok(new { keyId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment config");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Failed to get payment config" });
        }
    }

    /// <summary>
    /// Get payment transaction details (for authenticated users only)
    /// </summary>
    [HttpGet("{transactionId}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPaymentTransaction(Guid transactionId)
    {
        try
        {
            var transaction = await _paymentService.GetPaymentTransactionAsync(transactionId);
            if (transaction == null)
            {
                return NotFound(new { message = "Payment transaction not found" });
            }

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment transaction");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "Failed to get payment transaction" });
        }
    }
}
