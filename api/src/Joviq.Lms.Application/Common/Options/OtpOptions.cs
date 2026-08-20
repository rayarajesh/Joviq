namespace Joviq.Lms.Application.Common.Options;

public sealed class OtpOptions
{
    public const string SectionName = "Otp";

    public int Length { get; init; } = 6;

    public int ExpiryMinutes { get; init; } = 10;

    public int MaxAttempts { get; init; } = 5;

    public int MaxResendsPerHour { get; init; } = 5;
}
