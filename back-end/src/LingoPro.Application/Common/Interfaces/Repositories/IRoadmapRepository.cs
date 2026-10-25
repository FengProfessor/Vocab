using LingoPro.Domain.Entities.Roadmap;
using LingoPro.Domain.Enums;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for learner roadmap tracks, placement states, and station step completions.
/// </summary>
public interface IRoadmapRepository
{
    Task<UserRoadmap?> GetUserRoadmapAsync(Guid userId, RoadmapTrackType track, CancellationToken ct = default);

    Task<UserRoadmap?> GetUserRoadmapAsNoTrackingAsync(Guid userId, RoadmapTrackType track, CancellationToken ct = default);

    void AddUserRoadmap(UserRoadmap roadmap);

    Task<UserRoadmapStep?> GetUserRoadmapStepAsync(Guid userId, string stepId, CancellationToken ct = default);

    void AddUserRoadmapStep(UserRoadmapStep step);

    Task<List<UserRoadmapStep>> GetUserRoadmapStepsAsNoTrackingAsync(Guid userId, CancellationToken ct = default);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
