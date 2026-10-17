using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social;

/// <summary>
/// Command to join a collaborative study group using an invite code.
/// </summary>
public sealed record JoinStudyGroupCommand(string InviteCode) : IRequest<ApiResponse<StudyGroupDto>>;
