using System.Net;
using System.Text.RegularExpressions;
using Joviq.Lms.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Development-only email sender used when no SMTP settings are configured. It does not send
/// any real email; it writes the full message (including OTP codes) to the application log so
/// local flows such as password setup can be tested without an SMTP account. It is never
/// registered when email settings are present, so production always uses the real SMTP sender.
/// </summary>
public sealed class DevConsoleEmailSender(ILogger<DevConsoleEmailSender> logger) : IEmailSender
{
    public Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken,
        IReadOnlyCollection<EmailAttachment>? attachments = null)
    {
        logger.LogWarning(
            "[DEV EMAIL — not actually sent] To: {To} | Subject: {Subject} | Attachments: {AttachmentCount}\n{Body}",
            to,
            subject,
            attachments?.Count ?? 0,
            ToPlainText(htmlBody));
        return Task.CompletedTask;
    }

    private static string ToPlainText(string html)
    {
        var withoutTags = Regex.Replace(html, "<[^>]+>", " ");
        return Regex.Replace(WebUtility.HtmlDecode(withoutTags), @"\s+", " ").Trim();
    }
}
