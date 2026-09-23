namespace Joviq.Lms.Application.Common.Options;

public sealed class PaymentOptions
{
    public const string SectionName = "Payments";

    public string Provider { get; init; } = "Razorpay";

    // This must remain false outside the local Development environment.
    public bool AllowTestPayments { get; init; } = false;

    public string Currency { get; init; } = "INR";

    public string KeyId { get; init; } = string.Empty;

    public string KeySecret { get; init; } = string.Empty;

    public string WebhookSecret { get; init; } = string.Empty;

    public string Environment { get; init; } = "test";

    public string PublicBaseUrl { get; init; } = string.Empty;

    public int CheckoutExpiryMinutes { get; init; } = 10;

    public int AccessDurationMonths { get; init; } = 6;

    public string CashfreeEnvironment { get; init; } = "sandbox";

    public string CashfreeApiVersion { get; init; } = "2024-09-30";

    public string FrontendBaseUrl { get; init; } = string.Empty;
}
