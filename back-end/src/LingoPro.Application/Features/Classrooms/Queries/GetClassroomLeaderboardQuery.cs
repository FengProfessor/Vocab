using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve the XP and vocabulary leaderboard for a classroom over the specified time period ('week', 'month', or 'all').
/// </summary>
public record GetClassroomLeaderboardQuery(Guid ClassroomId, string Period = "all")
    : IRequest<ApiResponse<ClassroomLeaderboardDto>>;
