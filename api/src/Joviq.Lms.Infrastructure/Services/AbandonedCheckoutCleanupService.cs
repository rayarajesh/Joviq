using Joviq.Lms.Application.Lms;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Joviq.Lms.Infrastructure.Services;

/// <summary>
/// Removes checkout-only data after the payment gateway's checkout window has elapsed.
/// The portal service performs one final gateway verification before deleting anything.
/// </summary>
public sealed class AbandonedCheckoutCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<AbandonedCheckoutCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await CleanupAsync(stoppingToken);

        using var timer = new PeriodicTimer(CleanupInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await CleanupAsync(stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var portal = scope.ServiceProvider.GetRequiredService<ILmsPortalService>();
            var cleaned = await portal.CleanupExpiredCheckoutsAsync(cancellationToken);

            if (cleaned > 0)
            {
                logger.LogInformation("Removed {CleanedCount} expired unpaid checkout attempt(s).", cleaned);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Abandoned checkout cleanup failed.");
        }
    }
}
