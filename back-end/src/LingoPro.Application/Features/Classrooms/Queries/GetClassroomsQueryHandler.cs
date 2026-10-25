using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Classrooms.Commands;
using MediatR;

namespace LingoPro.Application.Features.Classrooms.Queries;

/// <summary>
/// Retrieves classrooms owned by or joined by the authenticated user directly from the database.
/// </summary>
public sealed class GetClassroomsQueryHandler(
    ICurrentUserService currentUser,
    IClassroomRepository classroomRepository) : IRequestHandler<GetClassroomsQuery, ApiResponse<IReadOnlyList<ClassroomDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ClassroomDto>>> Handle(
        GetClassroomsQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var classrooms = await classroomRepository.GetUserClassroomsAsync(userId, ct);

        return ApiResponse<IReadOnlyList<ClassroomDto>>.Ok(classrooms, "Classrooms retrieved successfully.");
    }
}
