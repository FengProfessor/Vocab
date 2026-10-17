using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Data transfer object representing a multi-seat shared Pro study group.
/// </summary>
public sealed record StudyGroupDto(
    Guid Id,
    string Name,
    string InviteCode,
    int SeatLimit,
    StudyGroupStatus Status,
    DateTime ExpiresAt);
