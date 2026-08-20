namespace Joviq.Lms.Application.Common.Options;

public sealed class EmailSettingsOptions
{
    public const string SectionName = "EmailSettings";

    public string SmtpServer { get; init; } = string.Empty;

    public int Port { get; init; } = 587;

    public string SenderName { get; init; } = string.Empty;

    public string SenderEmail { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}
