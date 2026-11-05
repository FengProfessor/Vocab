using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Handles <see cref="GetClassroomGrammarExercisesQuery"/> by returning grammar exercises for the classroom.
/// </summary>
public sealed class GetClassroomGrammarExercisesQueryHandler(
    ICurrentUserService currentUser,
    IGrammarRepository grammarRepository)
    : IRequestHandler<GetClassroomGrammarExercisesQuery, ApiResponse<IReadOnlyList<GrammarExerciseDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<GrammarExerciseDto>>> Handle(
        GetClassroomGrammarExercisesQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var exercises = await grammarRepository.GetClassroomExercisesAsync(
            userId,
            request.ClassroomId,
            request.Topic,
            request.Level,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<IReadOnlyList<GrammarExerciseDto>>.Ok(exercises, "Classroom grammar exercises retrieved successfully.");
    }
}
