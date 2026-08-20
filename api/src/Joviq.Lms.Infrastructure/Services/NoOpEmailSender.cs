using Joviq.Lms.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class NoOpEmailSender(ILogger<NoOpEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        logger.LogInformation("Email queued to {To}. Subject: {Subject}. Body: {Body}", to, subject, htmlBody);
        return Task.CompletedTask;
    }
}
