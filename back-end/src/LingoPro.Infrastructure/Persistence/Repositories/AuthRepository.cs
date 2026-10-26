using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing user profile, personal classroom, and gamification queries and mutations.
/// </summary>
public sealed class AuthRepository(IApplicationDbContext dbContext) : IAuthRepository
{
    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken ct = default)
        => dbContext.Profiles
            .AsNoTracking()
            .AnyAsync(p => p.IsDeleted != true && p.Email.ToLower() == normalizedEmail, ct);

    public Task<Profile?> GetProfileByIdOrEmailAsync(Guid userId, string normalizedEmail, CancellationToken ct = default)
        => dbContext.Profiles.FirstOrDefaultAsync(
            p => p.IsDeleted != true && (p.Id == userId || p.Email.ToLower() == normalizedEmail),
            ct);

    public Task<Profile?> GetProfileByIdOrEmailAsNoTrackingAsync(Guid userId, string? normalizedEmail, CancellationToken ct = default)
        => dbContext.Profiles
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.IsDeleted != true && (p.Id == userId || (normalizedEmail != null && p.Email.ToLower() == normalizedEmail)),
                ct);

    public Task<Profile?> GetProfileByIdAsync(Guid userId, CancellationToken ct = default)
        => dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId && p.IsDeleted != true, ct);

    public void AddProfileWithPersonalClassroom(Profile profile, ClassroomEntity personalClassroom)
    {
        dbContext.Profiles.Add(profile);
        dbContext.Classrooms.Add(personalClassroom);
    }

    public Task<UserGamification?> GetUserGamificationAsync(Guid userId, CancellationToken ct = default)
        => dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);

    public Task<UserGamification?> GetUserGamificationAsNoTrackingAsync(Guid userId, CancellationToken ct = default)
        => dbContext.UserGamifications.AsNoTracking().FirstOrDefaultAsync(g => g.UserId == userId, ct);

    public void AddUserGamification(UserGamification gamification)
        => dbContext.UserGamifications.Add(gamification);

    public Task<bool> HasXpAwardEventAsync(Guid userId, string eventKey, CancellationToken ct = default)
        => dbContext.XpAwardEvents
            .AsNoTracking()
            .AnyAsync(
                e => e.UserId == userId
                     && (e.EventKey == eventKey
                         || ((eventKey == "onboarding_complete" || eventKey == "onboarding_completed")
                             && (e.EventKey == "onboarding_complete" || e.EventKey == "onboarding_completed"))),
                ct);

    public void AddXpAwardEvent(XpAwardEvent awardEvent)
        => dbContext.XpAwardEvents.Add(awardEvent);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
