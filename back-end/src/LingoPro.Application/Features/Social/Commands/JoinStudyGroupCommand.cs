using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Social.Queries;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Social.Commands;

/// <summary>
/// Command to join a collaborative study group using an invite code.
/// </summary>
[Authorize]
public sealed record JoinStudyGroupCommand(string InviteCode) : IRequest<ApiResponse<StudyGroupDto>>;
