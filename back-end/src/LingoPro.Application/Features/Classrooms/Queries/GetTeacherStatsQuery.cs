using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve owned classrooms and TESOL student progress metrics for the teacher dashboard.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GetTeacherStatsQuery(Guid? ClassroomId = null) : IRequest<ApiResponse<TeacherStatsDto>>;
