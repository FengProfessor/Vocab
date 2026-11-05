using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve detailed learning analytics, word difficulty rankings, and live activity for a classroom.
/// </summary>
[Authorize(UserRole.Teacher, UserRole.Admin)]
public record GetTeacherAnalyticsQuery(Guid ClassroomId) : IRequest<ApiResponse<TeacherAnalyticsDto>>;
