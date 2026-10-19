using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Command for a student to join an existing classroom using a 6-character invite code.
/// </summary>
public record JoinClassroomCommand(string InviteCode) : IRequest<ApiResponse<ClassroomDto>>;
