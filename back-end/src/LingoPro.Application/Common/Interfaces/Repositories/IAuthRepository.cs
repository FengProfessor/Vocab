using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for user profile synchronization, onboarding, and gamification state.
/// </summary>
public interface IAuthRepository
{
    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken ct = default);

    Task<Profile?> GetProfileByIdOrEmailAsync(Guid userId, string normalizedEmail, CancellationToken ct = default);

    Task<Profile?> GetProfileByIdOrEmailAsNoTrackingAsync(Guid userId, string? normalizedEmail, CancellationToken ct = default);

    Task<Profile?> GetProfileByIdAsync(Guid userId, CancellationToken ct = default);

    void AddProfileWithPersonalClassroom(Profile profile, ClassroomEntity personalClassroom);

    Task<UserGamification?> GetUserGamificationAsync(Guid userId, CancellationToken ct = default);

    Task<UserGamification?> GetUserGamificationAsNoTrackingAsync(Guid userId, CancellationToken ct = default);

    void AddUserGamification(UserGamification gamification);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
