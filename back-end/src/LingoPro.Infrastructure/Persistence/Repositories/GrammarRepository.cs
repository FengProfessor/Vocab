using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Grammar;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing canonical grammar topic queries, exercise management, and FSRS grammar progress persistence.
/// </summary>
public sealed class GrammarRepository(IApplicationDbContext dbContext) : IGrammarRepository
{
    public Task<Guid?> GetFirstLessonIdByTopicSlugAsync(string slug, CancellationToken ct = default)
        => dbContext.GrammarLessons
            .AsNoTracking()
            .Where(l => l.IsDeleted != true && l.Topic.Slug == slug)
            .OrderBy(l => l.OrderIndex)
            .Select(l => (Guid?)l.Id)
            .FirstOrDefaultAsync(ct);

    public Task<GrammarProgress?> GetGrammarProgressAsync(Guid userId, Guid lessonId, CancellationToken ct = default)
        => dbContext.GrammarProgresses.FirstOrDefaultAsync(
            g => g.UserId == userId && g.LessonId == lessonId,
            ct);

    public void AddGrammarProgress(GrammarProgress progress)
        => dbContext.GrammarProgresses.Add(progress);

    public async Task<GrammarExercise?> GetGrammarExerciseWithClassroomByIdAsync(Guid exerciseId, CancellationToken ct = default)
    {
        var exercise = await dbContext.GrammarExercises
            .FirstOrDefaultAsync(e => e.Id == exerciseId, ct);

        if (exercise is { ClassroomId: { } classroomId } && exercise.Classroom == null)
        {
            var classroom = await dbContext.Classrooms
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct);
            if (classroom != null)
            {
                exercise.Classroom = classroom;
            }
        }

        return exercise;
    }

    public void RemoveGrammarExercise(GrammarExercise exercise)
        => dbContext.GrammarExercises.Remove(exercise);

    public async Task AwardXpAsync(Guid userId, int xp, DateOnly todayLocal, CancellationToken ct = default)
    {
        var gamification = await dbContext.UserGamifications.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (gamification == null)
        {
            gamification = new UserGamification { UserId = userId };
            dbContext.UserGamifications.Add(gamification);
        }

        gamification.AwardXpAndUpdateStreak(xp, todayLocal);
    }

    public async Task<IReadOnlyList<GrammarTopicDto>> GetCanonicalTopicsAsync(CancellationToken ct = default)
    {
        return await dbContext.GrammarTopics
            .AsNoTracking()
            .OrderBy(t => t.OrderIndex)
            .Select(t => new GrammarTopicDto(
                t.Id,
                t.Slug,
                t.Title,
                t.TitleVi,
                t.Level,
                null,
                string.Empty,
                t.OrderIndex ?? 0))
            .ToListAsync(ct);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);
}
