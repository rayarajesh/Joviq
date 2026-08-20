namespace Joviq.Lms.Application.Common.Options;

public sealed class RefreshTokenOptions
{
    public const string SectionName = "RefreshTokens";

    public int DefaultDays { get; init; } = 7;

    public int RememberMeDays { get; init; } = 30;

    public string CookieName { get; init; } = "__Host-joviq-refresh";
}
