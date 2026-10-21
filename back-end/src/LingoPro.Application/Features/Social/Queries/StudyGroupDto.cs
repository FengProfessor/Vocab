using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Social.Queries;

/// <summary>
/// Data transfer object representing a multi-seat shared Pro study group.
/// </summary>
public sealed record StudyGroupDto(
    Guid Id,
    string Name,
    string InviteCode,
    int SeatLimit,
    StudyGroupStatus Status,
    DateTime? ExpiresAt);


/// <summary>
/// Maps the SQL text status of public.groups ('active', 'expired', 'cancelled') to <see cref="StudyGroupStatus"/>.
/// </summary>
public static class StudyGroupDtoMapper
{
    public static StudyGroupStatus ParseStatus(string? status) =>
        Enum.TryParse<StudyGroupStatus>(status, ignoreCase: true, out var parsed) ? parsed : StudyGroupStatus.Active;
}