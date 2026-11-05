using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Query to retrieve grammar exercises assigned to a specific classroom, optionally filtered by topic and level.
/// </summary>
public record GetClassroomGrammarExercisesQuery(
    Guid ClassroomId,
    string? Topic = null,
    string? Level = null) : IRequest<ApiResponse<IReadOnlyList<GrammarExerciseDto>>>;
