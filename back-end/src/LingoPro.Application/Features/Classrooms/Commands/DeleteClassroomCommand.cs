using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command to delete a classroom owned by the requesting teacher (or an administrator).
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record DeleteClassroomCommand(Guid ClassroomId) : IRequest<ApiResponse<bool>>;
