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

    public int CheckoutExpiryMinutes { get; init; } = 15;

    public int AccessDurationMonths { get; init; } = 2;
}
