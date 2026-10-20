using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Classrooms.Commands;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Query to retrieve classrooms that the authenticated user teaches or is enrolled in.
/// </summary>
[Authorize]
public sealed record GetClassroomsQuery : IRequest<ApiResponse<IReadOnlyList<ClassroomDto>>>;
