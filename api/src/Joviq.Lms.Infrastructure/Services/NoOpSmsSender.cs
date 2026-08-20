using Joviq.Lms.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class NoOpSmsSender(ILogger<NoOpSmsSender> logger) : ISmsSender
{
    public Task SendAsync(string phoneNumber, string message, CancellationToken cancellationToken)
    {
        logger.LogInformation("SMS queued to {PhoneNumber}. Message: {Message}", phoneNumber, message);
        return Task.CompletedTask;
    }
}
