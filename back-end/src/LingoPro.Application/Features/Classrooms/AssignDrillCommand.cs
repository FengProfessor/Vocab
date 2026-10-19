using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Classrooms;

/// <summary>
/// Command for a teacher to assign an immediate vocabulary review drill to an enrolled student.
/// </summary>
public record AssignDrillCommand(
    Guid ClassroomId,
    Guid StudentId,
    IReadOnlyList<Guid>? WordIds) : IRequest<ApiResponse<int>>;
