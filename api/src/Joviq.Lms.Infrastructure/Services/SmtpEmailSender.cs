using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using System.Text.RegularExpressions;
using Joviq.Lms.Application.Common.Exceptions;
using Joviq.Lms.Application.Common.Interfaces;
using Joviq.Lms.Application.Common.Options;
using Microsoft.Extensions.Options;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class SmtpEmailSender(IOptions<EmailSettingsOptions> options) : IEmailSender
{
    private readonly EmailSettingsOptions _options = options.Value;

    public async Task SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken,
        IReadOnlyCollection<EmailAttachment>? attachments = null)
    {
        if (string.IsNullOrWhiteSpace(_options.SmtpServer) ||
            string.IsNullOrWhiteSpace(_options.SenderEmail) ||
            string.IsNullOrWhiteSpace(_options.Username) ||
            string.IsNullOrWhiteSpace(_options.Password))
        {
            throw new AppException("Email settings are not configured.", 500, "email_not_configured");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.SenderEmail, _options.SenderName),
            Subject = subject,
            Body = ToPlainText(htmlBody),
            IsBodyHtml = false,
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8,
            HeadersEncoding = Encoding.UTF8
        };
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, MediaTypeNames.Text.Html));
        message.To.Add(to);
        if (!string.IsNullOrWhiteSpace(_options.ReplyToEmail))
        {
            message.ReplyToList.Add(new MailAddress(_options.ReplyToEmail, _options.SenderName));
        }
        if (attachments is not null)
        {
            foreach (var attachment in attachments.Where(x => x.Content.Length > 0))
            {
                var stream = new MemoryStream(attachment.Content, writable: false);
                message.Attachments.Add(new Attachment(stream, attachment.FileName, attachment.ContentType));
            }
        }

        using var client = new SmtpClient(_options.SmtpServer, _options.Port)
        {
            EnableSsl = true,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_options.Username, _options.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (SmtpException ex)
        {
            throw new AppException($"Could not send email: {ex.Message}", 502, "email_send_failed");
        }
    }

    private static string ToPlainText(string html)
    {
        var withoutTags = Regex.Replace(html, "<[^>]+>", " ");
        return Regex.Replace(WebUtility.HtmlDecode(withoutTags), @"\s+", " ").Trim();
    }
}
