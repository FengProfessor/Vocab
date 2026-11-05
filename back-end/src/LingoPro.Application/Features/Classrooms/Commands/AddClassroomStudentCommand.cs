using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Commands;

/// <summary>
/// Command allowing a classroom teacher (or administrator) to enroll a student by email address.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record AddClassroomStudentCommand(Guid ClassroomId, string Email)
    : IRequest<ApiResponse<TeacherAddedStudentDto>>;
