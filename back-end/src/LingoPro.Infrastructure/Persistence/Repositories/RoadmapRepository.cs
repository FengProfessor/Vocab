using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing roadmap enrollment, placement, and station step completion operations.
/// </summary>
public sealed class RoadmapRepository(IApplicationDbContext dbContext) : IRoadmapRepository
{
    public Task<UserRoadmap?> GetUserRoadmapAsync(Guid userId, RoadmapTrackType track, CancellationToken ct = default)
        => dbContext.UserRoadmaps.FirstOrDefaultAsync(r => r.UserId == userId && r.Track == track, ct);

    public Task<UserRoadmap?> GetUserRoadmapAsNoTrackingAsync(Guid userId, RoadmapTrackType track, CancellationToken ct = default)
        => dbContext.UserRoadmaps.AsNoTracking().FirstOrDefaultAsync(r => r.UserId == userId && r.Track == track, ct);

    public void AddUserRoadmap(UserRoadmap roadmap)
        => dbContext.UserRoadmaps.Add(roadmap);

    public Task<UserRoadmapStep?> GetUserRoadmapStepAsync(Guid userId, string stepId, CancellationToken ct = default)
        => dbContext.UserRoadmapSteps.FirstOrDefaultAsync(s => s.UserId == userId && s.StepId == stepId, ct);

    public void AddUserRoadmapStep(UserRoadmapStep step)
        => dbContext.UserRoadmapSteps.Add(step);

    public Task<List<UserRoadmapStep>> GetUserRoadmapStepsAsNoTrackingAsync(Guid userId, CancellationToken ct = default)
        => dbContext.UserRoadmapSteps.AsNoTracking().Where(s => s.UserId == userId).ToListAsync(ct);

    public async Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, todayLocal);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
