using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command for a student to join an existing classroom using a 6-character invite code.
/// </summary>
[Authorize]
public record JoinClassroomCommand(string InviteCode) : IRequest<ApiResponse<ClassroomDto>>;
