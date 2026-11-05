using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Application.Features.Grammar.Queries;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Generates structured classroom grammar exercises for the requested topic and level and persists them if requested.
/// </summary>
public sealed class GenerateGrammarExercisesCommandHandler(
    ICurrentUserService currentUser,
    IGrammarRepository grammarRepository)
    : IRequestHandler<GenerateGrammarExercisesCommand, ApiResponse<IReadOnlyList<GrammarExerciseDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<GrammarExerciseDto>>> Handle(
        GenerateGrammarExercisesCommand request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var created = await grammarRepository.GenerateAndSaveClassroomExercisesAsync(
            userId,
            request,
            currentUser.IsAdmin,
            ct);

        return ApiResponse<IReadOnlyList<GrammarExerciseDto>>.Created(created, "Grammar exercises generated successfully.");
    }
}
