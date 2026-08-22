using Joviq.Lms.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

public sealed class AuditLogRetentionService(
    IServiceScopeFactory scopeFactory,
    ILogger<AuditLogRetentionService> logger) : BackgroundService
{
    private const int RetentionDays = 15;
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await PurgeExpiredLogsAsync(stoppingToken);

        using var timer = new PeriodicTimer(CleanupInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await PurgeExpiredLogsAsync(stoppingToken);
        }
    }

    private async Task PurgeExpiredLogsAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
            var deleted = await auditLogService.PurgeExpiredAsync(RetentionDays, cancellationToken);

            if (deleted > 0)
            {
                logger.LogInformation("Purged {DeletedCount} audit log entries older than {RetentionDays} days.", deleted, RetentionDays);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Audit log retention cleanup failed.");
        }
    }
}
