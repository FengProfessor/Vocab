using LingoPro.Application.Features.Social.Queries;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Social;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Handles joining a collaborative study group by invite code and enforcing seat capacity limits.
/// </summary>
public sealed class JoinStudyGroupCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<JoinStudyGroupCommand, ApiResponse<StudyGroupDto>>
{
    public async Task<ApiResponse<StudyGroupDto>> Handle(JoinStudyGroupCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var normalizedCode = request.InviteCode.Trim().ToUpperInvariant();
        var group = await dbContext.StudyGroups
            .FirstOrDefaultAsync(x => x.InviteCode == normalizedCode, ct)
            ?? throw new NotFoundException(nameof(StudyGroup), normalizedCode);

        if (group.Status != "active" || group.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ConflictException("This study group is no longer active.");
        }

        var memberCount = await dbContext.GroupMembers.CountAsync(x => x.GroupId == group.Id, ct);
        if (memberCount >= group.SeatLimit)
        {
            throw new ConflictException("This study group has reached its maximum seat capacity.");
        }

        var exists = await dbContext.GroupMembers
            .AnyAsync(x => x.GroupId == group.Id && x.UserId == userId, ct);

        if (!exists)
        {
            dbContext.GroupMembers.Add(new GroupMember
            {
                GroupId = group.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync(ct);
        }

        var dto = new StudyGroupDto(
            group.Id,
            // SQL groups has no name column: derive a display name from the invite code.
            $"Study group {group.InviteCode}",
            group.InviteCode,
            group.SeatLimit,
            StudyGroupDtoMapper.ParseStatus(group.Status),
            group.ExpiresAt);

        return ApiResponse<StudyGroupDto>.Ok(dto, "Joined study group successfully.");
    }
}
