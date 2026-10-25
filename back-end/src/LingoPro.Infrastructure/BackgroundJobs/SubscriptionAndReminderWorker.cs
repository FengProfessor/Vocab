using LingoPro.Domain.Enums;
using LingoPro.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LingoPro.Infrastructure.BackgroundJobs;

/// <summary>
/// Background periodic worker that executes bulk SQL updates via EF Core 10 <c>ExecuteUpdateAsync</c>.
/// Downgrades expired subscriptions and closes expired study groups in two atomic SQL statements.
/// </summary>
public sealed class SubscriptionAndReminderWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SubscriptionAndReminderWorker> _logger;

    public SubscriptionAndReminderWorker(
        IServiceProvider serviceProvider,
        ILogger<SubscriptionAndReminderWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(30));

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessExpiredSubscriptionsAndGroupsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while executing background subscription expiration check.");
            }
        }
    }

    public async Task<(int ExpiredProfilesCount, int ExpiredGroupsCount)> ProcessExpiredSubscriptionsAndGroupsAsync(
        CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<LingoProDbContext>();
        var nowUtc = DateTime.UtcNow;

        var expiredProfiles = await dbContext.Profiles
            .Where(p => p.IsDeleted != true && p.Plan != SubscriptionPlanType.Free && p.PlanExpiresAt != null && p.PlanExpiresAt <= nowUtc)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Plan, SubscriptionPlanType.Free), ct);

        var expiredGroups = await dbContext.StudyGroups
            .Where(g => g.IsDeleted != true && g.Status == "active" && g.ExpiresAt <= nowUtc)
            .ExecuteUpdateAsync(s => s
                .SetProperty(g => g.Status, "expired"), ct);

        if (expiredProfiles > 0 || expiredGroups > 0)
        {
            _logger.LogInformation(
                "Expired subscriptions cleanup completed: {ExpiredProfiles} profiles downgraded, {ExpiredGroups} groups closed.",
                expiredProfiles,
                expiredGroups);
        }

        return (expiredProfiles, expiredGroups);
    }
}
