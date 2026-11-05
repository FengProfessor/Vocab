using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Domain.Entities.Grammar;

namespace LingoPro.Application.Common.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for canonical CEFR grammar topics, lessons, classroom exercises, and learner FSRS grammar progress.
/// </summary>
public interface IGrammarRepository
{
    Task<Guid?> GetFirstLessonIdByTopicSlugAsync(string slug, CancellationToken ct = default);

    Task<GrammarProgress?> GetGrammarProgressAsync(Guid userId, Guid lessonId, CancellationToken ct = default);

    void AddGrammarProgress(GrammarProgress progress);

    Task<GrammarExercise?> GetGrammarExerciseWithClassroomByIdAsync(Guid exerciseId, CancellationToken ct = default);

    void RemoveGrammarExercise(GrammarExercise exercise);

    Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default);

    Task<IReadOnlyList<GrammarTopicDto>> GetCanonicalTopicsAsync(CancellationToken ct = default);

    Task<IReadOnlyList<GrammarExerciseDto>> GetClassroomExercisesAsync(
        Guid userId,
        Guid classroomId,
        string? topic,
        string? level,
        bool isAdmin,
        CancellationToken ct = default);

    Task<IReadOnlyList<GrammarExerciseDto>> GenerateAndSaveClassroomExercisesAsync(
        Guid userId,
        GenerateGrammarExercisesCommand command,
        bool isAdmin,
        CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
