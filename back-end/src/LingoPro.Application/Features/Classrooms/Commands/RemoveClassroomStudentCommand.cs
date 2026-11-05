using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command allowing a classroom teacher (or administrator) to remove a student from a classroom.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record RemoveClassroomStudentCommand(Guid ClassroomId, Guid StudentId)
    : IRequest<ApiResponse<bool>>;
