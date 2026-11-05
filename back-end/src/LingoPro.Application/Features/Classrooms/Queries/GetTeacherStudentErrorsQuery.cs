using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve the top 10 most difficult or unstable vocabulary words for a student in a classroom.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GetTeacherStudentErrorsQuery(Guid StudentId, Guid? ClassroomId = null)
    : IRequest<ApiResponse<IReadOnlyList<TeacherStudentErrorWordDto>>>;
