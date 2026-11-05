using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Grammar.Commands;
using LingoPro.Application.Features.Grammar.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Grammar;
using LingoPro.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing canonical grammar topic queries, classroom exercise generation/management, and FSRS grammar progress persistence.
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

    public async Task<IReadOnlyList<GrammarExerciseDto>> GetClassroomExercisesAsync(
        Guid userId,
        Guid classroomId,
        string? topic,
        string? level,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", classroomId);

        if (classroom.TeacherId != userId && !isAdmin)
        {
            bool enrolled = await dbContext.Enrollments
                .AsNoTracking()
                .AnyAsync(e => e.ClassroomId == classroomId && e.StudentId == userId, ct);

            if (!enrolled)
            {
                throw new ForbiddenAccessException("You do not have access to this classroom's grammar exercises.");
            }
        }

        var query = dbContext.GrammarExercises
            .AsNoTracking()
            .Where(e => e.ClassroomId == classroomId);

        if (!string.IsNullOrWhiteSpace(topic))
        {
            string normalizedTopic = topic.Trim().ToLowerInvariant();
            query = query.Where(e => e.Topic.ToLower() == normalizedTopic);
        }

        if (!string.IsNullOrWhiteSpace(level))
        {
            string normalizedLevel = level.Trim().ToLowerInvariant();
            query = query.Where(e => e.Level != null && e.Level.ToLower() == normalizedLevel);
        }

        var rows = await query
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

        return rows
            .Select(e => new GrammarExerciseDto(
                e.Id,
                e.ClassroomId,
                e.Topic,
                e.Level ?? "beginner",
                e.Question,
                e.Options ?? [],
                e.CorrectAnswer,
                e.Explanation,
                e.Type ?? "multiple_choice",
                e.Difficulty ?? 2,
                e.LessonId,
                e.CreatedAt))
            .ToList();
    }

    public async Task<IReadOnlyList<GrammarExerciseDto>> GenerateAndSaveClassroomExercisesAsync(
        Guid userId,
        GenerateGrammarExercisesCommand command,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == command.ClassroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", command.ClassroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != userId && !isAdmin))
        {
            throw new ForbiddenAccessException("Only the classroom teacher can generate grammar exercises for this classroom.");
        }

        string topic = command.Topic.Trim();
        string level = string.IsNullOrWhiteSpace(command.Level) ? "beginner" : command.Level.Trim().ToLowerInvariant();
        int count = Math.Clamp(command.Count, 1, 15);
        short difficulty = level switch
        {
            "advanced" => 3,
            "intermediate" => 2,
            _ => 1
        };

        var templates = BuildExerciseTemplates(topic, level);
        var nowUtc = DateTime.UtcNow;
        var results = new List<GrammarExerciseDto>(count);

        for (int i = 0; i < count; i++)
        {
            var tpl = templates[i % templates.Count];
            var entity = new GrammarExercise
            {
                Id = Guid.NewGuid(),
                ClassroomId = command.ClassroomId,
                Topic = topic,
                Level = level,
                Question = count > templates.Count ? $"{tpl.Question} (#{i + 1})" : tpl.Question,
                Options = tpl.Options,
                CorrectAnswer = tpl.CorrectAnswer,
                Explanation = tpl.Explanation,
                Type = tpl.Type,
                Difficulty = difficulty,
                CreatedBy = userId,
                CreatedAt = nowUtc.AddSeconds(i),
                LessonId = command.LessonId
            };

            if (command.SaveToDb)
            {
                dbContext.GrammarExercises.Add(entity);
            }

            results.Add(new GrammarExerciseDto(
                entity.Id,
                entity.ClassroomId,
                entity.Topic,
                entity.Level ?? level,
                entity.Question,
                entity.Options,
                entity.CorrectAnswer,
                entity.Explanation,
                entity.Type ?? "multiple_choice",
                entity.Difficulty ?? difficulty,
                entity.LessonId,
                entity.CreatedAt));
        }

        if (command.SaveToDb)
        {
            await dbContext.SaveChangesAsync(ct);
        }

        return results;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);

    private static List<(string Question, string[] Options, string CorrectAnswer, string Explanation, string Type)> BuildExerciseTemplates(
        string topic,
        string level)
    {
        return
        [
            (
                $"[{topic}] Choose the correct form to complete the sentence: \"The project manager _____ the quarterly report before the board meeting started.\"",
                ["had reviewed", "reviews", "is reviewing", "will review"],
                "had reviewed",
                $"Giải thích ({topic} - {level}): Hành động hoàn tất trước một thời điểm hoặc hành động khác trong quá khứ dùng cấu trúc phù hợp với ngữ cảnh thời gian.",
                "multiple_choice"
            ),
            (
                $"[{topic}] Fill in the blank: \"Every member of the marketing department _____ required to attend the training session tomorrow.\"",
                ["is", "are", "were", "have been"],
                "is",
                $"Giải thích ({topic}): Chủ ngữ bắt đầu bằng 'Every member' luôn đi với động từ chia ở ngôi thứ ba số ít ('is').",
                "fill_blank"
            ),
            (
                $"[{topic}] Select the most accurate option: \"If the shipment _____ on schedule, we will launch the campaign this Friday.\"",
                ["arrives", "arrived", "will arrive", "had arrived"],
                "arrives",
                $"Giải thích ({topic}): Trong mệnh đề điều kiện loại 1 diễn tả sự việc có thật ở tương lai, mệnh đề 'If' chia ở thì hiện tại đơn ('arrives').",
                "multiple_choice"
            ),
            (
                $"[{topic}] Identify the correct structure: \"Not only _____ the sales target, but the team also improved customer satisfaction.\"",
                ["did they exceed", "they exceeded", "exceeded they", "have they exceed"],
                "did they exceed",
                $"Giải thích ({topic}): Khi 'Not only' đứng đầu câu để nhấn mạnh, ta áp dụng cấu trúc đảo ngữ với trợ động từ ('did they exceed').",
                "error_correction"
            ),
            (
                $"[{topic}] Choose the best completion: \"The updated safety guidelines must _____ by all warehouse personnel immediately.\"",
                ["be followed", "follow", "following", "have followed"],
                "be followed",
                $"Giải thích ({topic}): Sau động từ khuyết thiếu 'must' kết hợp với tác nhân 'by all warehouse personnel', câu mang nghĩa bị động ('must be followed').",
                "multiple_choice"
            )
        ];
    }
}
