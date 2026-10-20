using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command for a teacher to assign an immediate vocabulary review drill to an enrolled student.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record AssignDrillCommand(
    Guid ClassroomId,
    Guid StudentId,
    IReadOnlyList<Guid>? WordIds) : IRequest<ApiResponse<int>>;
