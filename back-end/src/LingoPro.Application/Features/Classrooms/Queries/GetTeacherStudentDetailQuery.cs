using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve comprehensive learning history, quizzes, saved words, and universal timeline for a classroom student.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GetTeacherStudentDetailQuery(Guid StudentId, Guid? ClassroomId = null) : IRequest<ApiResponse<TeacherStudentDetailDto>>;
