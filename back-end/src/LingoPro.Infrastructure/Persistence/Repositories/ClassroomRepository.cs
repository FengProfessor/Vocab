using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Features.Classrooms.Commands;
using LingoPro.Application.Features.Classrooms.Queries;
using LingoPro.Domain.Entities.Auth;
using LingoPro.Domain.Entities.Classroom;
using LingoPro.Domain.Entities.Vocab;
using LingoPro.Domain.Enums;
using LingoPro.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Infrastructure.Persistence.Repositories;

/// <summary>
/// EF Core repository executing classroom creation, student enrollment, teacher analytics, and targeted FSRS drill queries.
/// </summary>
public sealed class ClassroomRepository(IApplicationDbContext dbContext) : IClassroomRepository
{
    public void AddClassroom(ClassroomEntity classroom)
        => dbContext.Classrooms.Add(classroom);

    public void RemoveClassroom(ClassroomEntity classroom)
        => dbContext.Classrooms.Remove(classroom);

    public Task<ClassroomEntity?> GetClassroomByIdAsync(Guid classroomId, CancellationToken ct = default)
        => dbContext.Classrooms
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct);

    public Task<ClassroomEntity?> GetPublicClassroomWithEnrollmentsByInviteCodeAsync(string normalizedCode, CancellationToken ct = default)
        => dbContext.Classrooms
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(
                c => c.IsDeleted != true && c.InviteCode == normalizedCode && c.Name != "__personal__",
                ct);

    public void AddEnrollment(Enrollment enrollment)
        => dbContext.Enrollments.Add(enrollment);

    public Task<ClassroomEntity?> GetClassroomByIdAsNoTrackingAsync(Guid classroomId, CancellationToken ct = default)
        => dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct);

    public Task<bool> IsStudentEnrolledAsync(Guid classroomId, Guid studentId, CancellationToken ct = default)
        => dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(
                e => e.ClassroomId == classroomId &&
                     e.StudentId == studentId &&
                     (e.Classroom == null || e.Classroom.IsDeleted != true),
                ct);

    public async Task<List<SrsProgress>> GetStudentSrsProgressesForDrillAsync(
        Guid studentId,
        IReadOnlyList<Guid>? wordIds,
        Guid? classroomId = null,
        CancellationToken ct = default)
    {
        var query = dbContext.SrsProgresses
            .Include(s => s.Word)
            .Where(s => s.UserId == studentId && (s.Word == null || s.Word.IsDeleted != true));

        if (classroomId.HasValue)
        {
            var cid = classroomId.Value;
            query = query.Where(s => s.Word != null && s.Word.ClassroomId == cid);
        }

        if (wordIds is { Count: > 0 })
        {
            return await query
                .Where(s => wordIds.Contains(s.WordId))
                .ToListAsync(ct);
        }

        return await query
            .OrderByDescending(s => s.Difficulty)
            .ThenBy(s => s.Stability)
            .Take(5)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ClassroomDto>> GetUserClassroomsAsync(Guid userId, CancellationToken ct = default)
    {
        return await dbContext.Classrooms
            .AsNoTracking()
            .Where(c => c.IsDeleted != true &&
                        c.Name != "__personal__" &&
                        (c.TeacherId == userId || c.Enrollments.Any(e => e.StudentId == userId)))
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ClassroomDto(
                c.Id,
                c.Name,
                c.Description,
                c.InviteCode,
                c.TeacherId,
                c.Enrollments.Count,
                c.CreatedAt ?? DateTime.UtcNow))
            .ToListAsync(ct);
    }

    public async Task<TeacherStatsDto> GetTeacherStatsAsync(
        Guid userId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classrooms = await dbContext.Classrooms
            .AsNoTracking()
            .Where(c => c.TeacherId == userId && c.Name != "__personal__" && c.IsDeleted != true)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new TeacherClassroomSummaryDto(
                c.Id,
                c.Name,
                c.Description,
                c.InviteCode,
                c.TeacherId,
                c.CreatedAt ?? DateTime.UtcNow,
                c.Enrollments.Count))
            .ToListAsync(ct);

        if (!classroomId.HasValue)
        {
            return new TeacherStatsDto(classrooms, []);
        }

        var cid = classroomId.Value;
        var targetClassroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == cid && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", cid);

        if (targetClassroom.IsPersonal || (targetClassroom.TeacherId != userId && !isAdmin))
        {
            throw new ForbiddenAccessException("You do not have access to this classroom.");
        }

        var students = await BuildClassroomStudentProgressListAsync(targetClassroom, ct);
        return new TeacherStatsDto(classrooms, students);
    }

    public async Task<TeacherAnalyticsDto> GetTeacherAnalyticsAsync(
        Guid userId,
        Guid classroomId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", classroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != userId && !isAdmin))
        {
            throw new ForbiddenAccessException("You do not have access to this classroom.");
        }

        var nowUtc = DateTime.UtcNow;
        var enrollments = await dbContext.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Where(e => e.ClassroomId == classroomId)
            .ToListAsync(ct);

        var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

        var classWords = await dbContext.Words
            .AsNoTracking()
            .Where(w => w.ClassroomId == classroomId && w.IsDeleted != true)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new { w.Id, w.Term, w.Translation, w.Pos, w.Ipa })
            .ToListAsync(ct);

        var classWordIds = classWords.Select(w => w.Id).ToHashSet();

        var srsRows = studentIds.Count > 0 && classWordIds.Count > 0
            ? await dbContext.SrsProgresses
                .AsNoTracking()
                .Where(s => studentIds.Contains(s.UserId) && classWordIds.Contains(s.WordId))
                .ToListAsync(ct)
            : [];

        int totalStudents = enrollments.Count;
        int totalWords = classWords.Count;

        var studentSummaries = new List<TeacherStudentSummaryDto>(totalStudents);
        int active7d = 0;
        int totalReviewsAll = 0;
        int totalWordsLearnedSum = 0;
        int totalMasteryPctSum = 0;

        foreach (var enrollment in enrollments)
        {
            var profile = enrollment.Student;
            var studentSrs = srsRows.Where(s => s.UserId == enrollment.StudentId).ToList();
            int wordsLearned = studentSrs.Count;
            int wordsDue = studentSrs.Count(s => s.NextReviewDate != null && s.NextReviewDate <= nowUtc);
            int totalReviews = studentSrs.Sum(s => s.ReviewCount ?? 0);
            DateTime? lastStudyAt = studentSrs.Count > 0 ? studentSrs.Max(s => s.LastReviewedAt) : null;
            double avgEase = studentSrs.Count > 0 ? studentSrs.Average(s => s.EaseFactor ?? 2.5) : 2.5;
            int masteryPct = totalWords > 0 ? (int)Math.Round((double)wordsLearned / totalWords * 100.0) : 0;
            int easePct = (int)Math.Clamp(Math.Round((avgEase - 1.3) / (3.0 - 1.3) * 100.0), 0, 100);
            int? daysSinceActive = lastStudyAt.HasValue
                ? (int)Math.Max(0, Math.Floor((nowUtc - lastStudyAt.Value).TotalDays))
                : null;
            bool isActive7d = daysSinceActive.HasValue && daysSinceActive.Value <= 7;

            if (isActive7d) active7d++;
            totalReviewsAll += totalReviews;
            totalWordsLearnedSum += wordsLearned;
            totalMasteryPctSum += masteryPct;

            studentSummaries.Add(new TeacherStudentSummaryDto(
                enrollment.StudentId,
                profile?.FullName,
                profile?.Email ?? string.Empty,
                profile?.AvatarUrl,
                wordsLearned,
                wordsDue,
                totalReviews,
                masteryPct,
                easePct,
                lastStudyAt,
                daysSinceActive,
                isActive7d));
        }

        int inactive7d = Math.Max(0, totalStudents - active7d);
        int avgWordsLearned = totalStudents > 0 ? (int)Math.Round((double)totalWordsLearnedSum / totalStudents) : 0;
        int avgMasteryPct = totalStudents > 0 ? (int)Math.Round((double)totalMasteryPctSum / totalStudents) : 0;
        int engagementRate = totalStudents > 0 ? (int)Math.Round((double)active7d / totalStudents * 100.0) : 0;

        var classStats = new TeacherClassStatsDto(
            totalStudents,
            active7d,
            inactive7d,
            totalWords,
            avgWordsLearned,
            totalReviewsAll,
            avgMasteryPct,
            engagementRate);

        var topStudents = studentSummaries
            .OrderByDescending(s => s.WordsLearned)
            .ThenByDescending(s => s.TotalReviews)
            .Take(5)
            .ToList();

        var strugglingStudents = studentSummaries
            .Where(s => !s.IsActive7d || (totalWords > 0 && s.WordsLearned < totalWords * 0.2) || s.WordsDue > 10)
            .OrderBy(s => s.IsActive7d)
            .ThenBy(s => s.WordsLearned)
            .Take(10)
            .ToList();

        var srsByWordId = srsRows
            .GroupBy(s => s.WordId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var wordCoverage = classWords
            .Select(w =>
            {
                int learnedCount = srsByWordId.TryGetValue(w.Id, out var list) ? list.Count : 0;
                int covPct = totalStudents > 0 ? (int)Math.Round((double)learnedCount / totalStudents * 100.0) : 0;
                return new TeacherWordCoverageItemDto(
                    w.Id,
                    w.Term,
                    w.Translation ?? string.Empty,
                    w.Pos,
                    learnedCount,
                    totalStudents,
                    covPct);
            })
            .OrderBy(w => w.StudentsLearned)
            .ThenBy(w => w.Word)
            .Take(15)
            .ToList();

        var wordMap = classWords.ToDictionary(w => w.Id);
        var wordDifficulty = srsByWordId
            .Where(kv => kv.Value.Count > 0 && wordMap.ContainsKey(kv.Key))
            .Select(kv =>
            {
                var w = wordMap[kv.Key];
                var list = kv.Value;
                return new TeacherWordDifficultyItemDto(
                    w.Id,
                    w.Term,
                    w.Translation ?? string.Empty,
                    w.Pos,
                    w.Ipa,
                    list.Count,
                    Math.Round(list.Average(x => x.Stability ?? 0.0), 1),
                    Math.Round(list.Average(x => x.Difficulty ?? 5.0), 1),
                    list.Sum(x => x.ReviewCount ?? 0));
            })
            .OrderBy(w => w.AvgStability)
            .ThenByDescending(w => w.AvgDifficulty)
            .Take(10)
            .ToList();

        var studentMap = enrollments
            .GroupBy(e => e.StudentId)
            .ToDictionary(g => g.Key, g => g.First().Student);

        var activityFeed = srsRows
            .Where(s => s.LastReviewedAt != null && wordMap.ContainsKey(s.WordId))
            .OrderByDescending(s => s.LastReviewedAt)
            .Take(20)
            .Select(s =>
            {
                studentMap.TryGetValue(s.UserId, out var st);
                var w = wordMap[s.WordId];
                string stName = !string.IsNullOrWhiteSpace(st?.FullName)
                    ? st.FullName
                    : (st?.Email.Split('@')[0] ?? "Học viên");
                return new TeacherActivityFeedItemDto(
                    stName,
                    st?.AvatarUrl,
                    w.Term,
                    w.Translation ?? string.Empty,
                    s.IntervalDays ?? 0,
                    s.ReviewCount ?? 0,
                    s.LastReviewedAt);
            })
            .ToList();

        return new TeacherAnalyticsDto(
            classStats,
            topStudents,
            strugglingStudents,
            wordCoverage,
            wordDifficulty,
            activityFeed);
    }

    public async Task<TeacherStudentDetailDto> GetTeacherStudentDetailAsync(
        Guid userId,
        Guid studentId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await ResolveAuthorizedClassroomForStudentAsync(userId, studentId, classroomId, isAdmin, ct);
        var cid = classroom.Id;

        var progressList = await BuildClassroomStudentProgressListAsync(classroom, ct, studentId);
        var current = progressList.FirstOrDefault();

        var historyRows = await dbContext.StudentDailyStats
            .AsNoTracking()
            .Where(h => h.StudentId == studentId && h.ClassroomId == cid)
            .OrderBy(h => h.RecordedAt)
            .Take(30)
            .Select(h => new TeacherStudentHistoryPointDto(
                h.Vms,
                h.Lcs,
                h.TotalWords,
                h.RecordedAt.ToString("yyyy-MM-dd")))
            .ToListAsync(ct);

        if (historyRows.Count == 0 && current != null)
        {
            historyRows.Add(new TeacherStudentHistoryPointDto(
                current.Vms,
                current.Lcs,
                current.TotalWordsLearned,
                DateTime.UtcNow.ToString("yyyy-MM-dd")));
        }

        var quizzes = await dbContext.QuizResults
            .AsNoTracking()
            .Where(q => q.UserId == studentId)
            .OrderByDescending(q => q.CompletedAt)
            .Take(20)
            .Select(q => new TeacherStudentQuizDto(
                q.Id,
                q.QuizType ?? "multiple_choice",
                q.Score,
                q.TotalQuestions,
                null,
                null,
                q.CompletedAt))
            .ToListAsync(ct);

        var srsWithWords = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == studentId && s.Word != null && s.Word.IsDeleted != true)
            .OrderByDescending(s => s.LastReviewedAt)
            .Take(50)
            .ToListAsync(ct);

        var studentAddedWords = await dbContext.Words
            .AsNoTracking()
            .Where(w => (w.AddedBy == studentId || w.ClassroomId == cid) && w.IsDeleted != true)
            .OrderByDescending(w => w.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        var savedWords = studentAddedWords
            .Select(w => new TeacherStudentSavedWordDto(
                w.Id,
                w.Term,
                w.Translation ?? string.Empty,
                w.Pos,
                w.Ipa,
                w.Example,
                w.CreatedAt))
            .ToList();

        var assessments = await dbContext.UserRoadmapAssessments
            .AsNoTracking()
            .Where(a => a.UserId == studentId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(15)
            .Select(a => new TeacherStudentAssessmentDto(
                a.Id,
                a.Tier.ToString().ToLowerInvariant(),
                a.TargetId,
                a.Score,
                a.Passed,
                a.Details,
                a.CreatedAt))
            .ToListAsync(ct);

        var grammarResults = await dbContext.GrammarResults
            .AsNoTracking()
            .Include(r => r.Exercise)
            .Where(r => r.UserId == studentId)
            .OrderByDescending(r => r.CompletedAt)
            .Take(15)
            .ToListAsync(ct);

        var dailyReadings = await dbContext.DailyReadingCompletions
            .AsNoTracking()
            .Where(r => r.UserId == studentId)
            .OrderByDescending(r => r.CompletedAt)
            .Take(10)
            .ToListAsync(ct);

        var toeicResults = await dbContext.ToeicTestResults
            .AsNoTracking()
            .Where(t => t.UserId == studentId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        var vocabPacks = await dbContext.UserVocabPacks
            .AsNoTracking()
            .Where(p => p.UserId == studentId)
            .OrderByDescending(p => p.LastStudiedAt)
            .Take(10)
            .ToListAsync(ct);

        // Build Universal Learning Timeline
        var timeline = new List<TeacherTimelineEventDto>();

        foreach (var s in srsWithWords.Where(s => s.LastReviewedAt.HasValue && s.Word != null).Take(20))
        {
            double stab = s.Stability ?? 0.0;
            timeline.Add(new TeacherTimelineEventDto(
                $"srs-{s.Id}",
                "srs_review",
                s.LastReviewedAt!.Value,
                $"Ôn tập từ vựng: {s.Word!.Term}",
                $"{s.Word.Translation ?? string.Empty} • Chu kỳ {s.IntervalDays ?? 0} ngày (Lần ôn #{s.ReviewCount ?? 0})",
                null,
                null,
                stab >= 3.0,
                $"S={Math.Round(stab, 1)}d",
                null));
        }

        foreach (var q in quizzes.Where(q => q.CompletedAt.HasValue))
        {
            bool passed = q.TotalQuestions > 0 && ((double)q.Score / q.TotalQuestions) >= 0.7;
            timeline.Add(new TeacherTimelineEventDto(
                $"quiz-{q.Id}",
                "quiz",
                q.CompletedAt!.Value,
                $"Hoàn thành bài kiểm tra ({q.QuizType})",
                $"Đạt {q.Score}/{q.TotalQuestions} câu đúng",
                q.Score,
                q.TotalQuestions,
                passed,
                q.QuizType,
                q.DetailsJson));
        }

        foreach (var w in studentAddedWords.Where(w => w.AddedBy == studentId && w.CreatedAt.HasValue).Take(15))
        {
            timeline.Add(new TeacherTimelineEventDto(
                $"word-{w.Id}",
                "word_saved",
                w.CreatedAt!.Value,
                $"Đã lưu từ mới: {w.Term}",
                w.Translation ?? string.Empty,
                null,
                null,
                null,
                w.Pos,
                null));
        }

        foreach (var gr in grammarResults.Where(r => r.CompletedAt.HasValue))
        {
            timeline.Add(new TeacherTimelineEventDto(
                $"grammar-{gr.Id}",
                "grammar",
                gr.CompletedAt!.Value,
                $"Bài tập ngữ pháp: {gr.Exercise?.Topic ?? "Grammar Drill"}",
                gr.Exercise?.Question ?? string.Empty,
                gr.IsCorrect == true ? 1 : 0,
                1,
                gr.IsCorrect,
                gr.Exercise?.Level,
                null));
        }

        foreach (var dr in dailyReadings.Where(r => r.CompletedAt.HasValue))
        {
            int score = (dr.McqScore ?? 0) + (dr.ClozeScore ?? 0);
            int total = (dr.McqTotal ?? 0) + (dr.ClozeTotal ?? 0);
            timeline.Add(new TeacherTimelineEventDto(
                $"reading-{dr.Id}",
                "daily_reading",
                dr.CompletedAt!.Value,
                "Hoàn thành bài đọc hàng ngày",
                $"Đúng {score}/{total} câu hỏi đọc hiểu",
                score,
                total,
                total > 0 && (double)score / total >= 0.6,
                "Daily Reading",
                null));
        }

        foreach (var tr in toeicResults)
        {
            int totalScore = tr.ListeningScaledScore + tr.ReadingScaledScore;
            timeline.Add(new TeacherTimelineEventDto(
                $"toeic-{tr.Id}",
                "toeic",
                tr.CreatedAt,
                $"Thi thử {tr.ExamType.ToString().ToUpperInvariant()}",
                $"Tổng điểm: {totalScore} (Listening {tr.ListeningScaledScore} • Reading {tr.ReadingScaledScore})",
                totalScore,
                990,
                totalScore >= 450,
                $"{totalScore} pts",
                null));
        }

        foreach (var a in assessments)
        {
            timeline.Add(new TeacherTimelineEventDto(
                $"assess-{a.Id}",
                "assessment",
                a.CreatedAt,
                $"Đánh giá năng lực ({a.Tier})",
                $"Mục tiêu: {a.TargetId} • Điểm số: {a.Score}%",
                a.Score,
                100,
                a.Passed,
                a.Passed ? "ĐẠT" : "CHƯA ĐẠT",
                a.DetailsJson));
        }

        foreach (var vp in vocabPacks.Where(p => p.LastStudiedAt.HasValue))
        {
            timeline.Add(new TeacherTimelineEventDto(
                $"pack-{vp.PackId}",
                "vocab_pack",
                vp.LastStudiedAt!.Value,
                $"Học gói từ vựng: {vp.TopicTitle}",
                $"Tiến độ: {vp.ReviewedCount}/{vp.WordCount} từ ({vp.Status})",
                vp.ReviewedCount,
                vp.WordCount,
                vp.Status == "completed",
                vp.Status,
                null));
        }

        var sortedTimeline = timeline
            .OrderByDescending(e => e.Timestamp)
            .Take(50)
            .ToList();

        return new TeacherStudentDetailDto(
            current,
            historyRows,
            quizzes,
            savedWords,
            assessments,
            sortedTimeline);
    }

    public async Task<IReadOnlyList<TeacherStudentErrorWordDto>> GetTeacherStudentErrorsAsync(
        Guid userId,
        Guid studentId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await ResolveAuthorizedClassroomForStudentAsync(userId, studentId, classroomId, isAdmin, ct);
        var cid = classroom.Id;

        var errors = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == studentId &&
                        s.Word != null &&
                        s.Word.ClassroomId == cid &&
                        s.Word.IsDeleted != true)
            .OrderByDescending(s => s.Difficulty)
            .ThenBy(s => s.Stability)
            .Take(10)
            .Select(s => new TeacherStudentErrorWordDto(
                s.WordId,
                s.Word!.Term,
                s.Word.Translation ?? string.Empty,
                s.Word.Pos,
                s.Word.Ipa,
                s.Word.Example,
                Math.Round(s.Difficulty ?? 5.0, 2),
                Math.Round(s.Stability ?? 0.0, 2),
                s.ReviewCount ?? 0,
                s.NextReviewDate,
                s.LastReviewedAt))
            .ToListAsync(ct);

        return errors;
    }

    public async Task<TeacherAddedStudentDto> AddStudentByEmailAsync(
        Guid teacherId,
        Guid classroomId,
        string email,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", classroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !isAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to add students to this classroom.");
        }

        string normalizedEmail = email.Trim().ToLowerInvariant();
        var profile = await dbContext.Profiles
            .FirstOrDefaultAsync(p => p.Email.ToLower() == normalizedEmail && p.IsDeleted != true, ct);

        if (profile == null)
        {
            string fallbackName = normalizedEmail.Contains('@')
                ? normalizedEmail.Split('@')[0]
                : normalizedEmail;

            profile = new Profile
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                FullName = fallbackName,
                Role = UserRole.Student,
                Plan = SubscriptionPlanType.Free,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Profiles.Add(profile);
        }

        bool alreadyEnrolled = await dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(e => e.ClassroomId == classroomId && e.StudentId == profile.Id, ct);

        if (alreadyEnrolled)
        {
            throw new ConflictException("Học viên này đã có trong danh sách lớp học.");
        }

        dbContext.Enrollments.Add(new Enrollment
        {
            Id = Guid.NewGuid(),
            ClassroomId = classroomId,
            StudentId = profile.Id,
            JoinedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(ct);

        return new TeacherAddedStudentDto(
            profile.Id,
            profile.Email,
            profile.FullName,
            profile.AvatarUrl);
    }

    public async Task RemoveStudentFromClassroomAsync(
        Guid teacherId,
        Guid classroomId,
        Guid studentId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", classroomId);

        if (classroom.IsPersonal || (classroom.TeacherId != teacherId && !isAdmin))
        {
            throw new ForbiddenAccessException("You are not authorized to remove students from this classroom.");
        }

        var enrollment = await dbContext.Enrollments
            .FirstOrDefaultAsync(e => e.ClassroomId == classroomId && e.StudentId == studentId, ct)
            ?? throw new NotFoundException("Enrollment", studentId);

        dbContext.Enrollments.Remove(enrollment);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task<ClassroomLeaderboardDto> GetClassroomLeaderboardAsync(
        Guid userId,
        Guid classroomId,
        string period,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var classroom = await dbContext.Classrooms
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classroomId && c.IsDeleted != true, ct)
            ?? throw new NotFoundException("Classroom", classroomId);

        bool isEnrolled = await dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(e => e.ClassroomId == classroomId && e.StudentId == userId, ct);

        if (classroom.TeacherId != userId && !isEnrolled && !isAdmin)
        {
            throw new ForbiddenAccessException("You do not have access to this classroom leaderboard.");
        }

        string normalizedPeriod = (period ?? "all").Trim().ToLowerInvariant();
        if (normalizedPeriod is not ("week" or "month" or "all"))
        {
            normalizedPeriod = "all";
        }

        DateTime? cutoffUtc = normalizedPeriod switch
        {
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddDays(-30),
            _ => null
        };

        var enrollments = await dbContext.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Where(e => e.ClassroomId == classroomId)
            .ToListAsync(ct);

        var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

        var gamifications = studentIds.Count > 0
            ? await dbContext.UserGamifications
                .AsNoTracking()
                .Where(g => studentIds.Contains(g.UserId))
                .ToDictionaryAsync(g => g.UserId, ct)
            : new Dictionary<Guid, UserGamification>();

        var srsQuery = dbContext.SrsProgresses
            .AsNoTracking()
            .Where(s => studentIds.Contains(s.UserId) && (s.Word == null || s.Word.IsDeleted != true));

        if (cutoffUtc.HasValue)
        {
            var cutoff = cutoffUtc.Value;
            srsQuery = srsQuery.Where(s => s.LastReviewedAt != null && s.LastReviewedAt >= cutoff);
        }

        var srsList = studentIds.Count > 0
            ? await srsQuery.ToListAsync(ct)
            : [];

        var srsByStudent = srsList
            .GroupBy(s => s.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var unranked = enrollments
            .Select(e =>
            {
                var st = e.Student;
                gamifications.TryGetValue(e.StudentId, out var gam);
                srsByStudent.TryGetValue(e.StudentId, out var stSrs);

                int wordsLearned = stSrs?.Count ?? 0;
                int reviewsCount = stSrs?.Sum(x => x.ReviewCount ?? 0) ?? 0;
                int xp = cutoffUtc.HasValue
                    ? (wordsLearned * 15 + reviewsCount * 5)
                    : Math.Max(gam?.TotalXp ?? 0, wordsLearned * 15 + reviewsCount * 5);
                int streak = gam?.CurrentStreak ?? 0;
                string displayName = !string.IsNullOrWhiteSpace(st?.FullName)
                    ? st.FullName
                    : (st?.Email.Split('@')[0] ?? "Học viên");

                return new
                {
                    e.StudentId,
                    Name = displayName,
                    st?.AvatarUrl,
                    Xp = xp,
                    WordsLearned = wordsLearned,
                    Streak = streak,
                    IsCurrentUser = e.StudentId == userId
                };
            })
            .OrderByDescending(x => x.Xp)
            .ThenByDescending(x => x.WordsLearned)
            .Take(20)
            .ToList();

        var ranked = unranked
            .Select((x, idx) => new ClassroomLeaderboardEntryDto(
                idx + 1,
                x.StudentId,
                x.Name,
                x.AvatarUrl,
                x.Xp,
                x.WordsLearned,
                x.Streak,
                x.IsCurrentUser))
            .ToList();

        return new ClassroomLeaderboardDto(ranked, normalizedPeriod, classroom.Name);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => dbContext.SaveChangesAsync(ct);

    private async Task<ClassroomEntity> ResolveAuthorizedClassroomForStudentAsync(
        Guid userId,
        Guid studentId,
        Guid? classroomId,
        bool isAdmin,
        CancellationToken ct)
    {
        if (classroomId.HasValue)
        {
            var cid = classroomId.Value;
            var classroom = await dbContext.Classrooms
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == cid && c.IsDeleted != true, ct)
                ?? throw new NotFoundException("Classroom", cid);

            if (classroom.IsPersonal || (classroom.TeacherId != userId && !isAdmin))
            {
                throw new ForbiddenAccessException("You do not own this classroom.");
            }

            bool enrolled = await dbContext.Enrollments
                .AsNoTracking()
                .AnyAsync(e => e.ClassroomId == cid && e.StudentId == studentId, ct);

            if (!enrolled)
            {
                throw new ForbiddenAccessException("The student is not enrolled in this classroom.");
            }

            return classroom;
        }

        var sharedClassroom = await dbContext.Enrollments
            .AsNoTracking()
            .Include(e => e.Classroom)
            .Where(e => e.StudentId == studentId &&
                        e.Classroom.Name != "__personal__" &&
                        e.Classroom.IsDeleted != true &&
                        (isAdmin || e.Classroom.TeacherId == userId))
            .Select(e => e.Classroom)
            .FirstOrDefaultAsync(ct);

        if (sharedClassroom == null)
        {
            throw new ForbiddenAccessException("The student is not enrolled in any classroom you manage.");
        }

        return sharedClassroom;
    }

    private async Task<IReadOnlyList<TeacherStudentProgressDto>> BuildClassroomStudentProgressListAsync(
        ClassroomEntity classroom,
        CancellationToken ct,
        Guid? singleStudentId = null)
    {
        var nowUtc = DateTime.UtcNow;
        var cid = classroom.Id;

        var enrollmentsQuery = dbContext.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Where(e => e.ClassroomId == cid);

        if (singleStudentId.HasValue)
        {
            var sid = singleStudentId.Value;
            enrollmentsQuery = enrollmentsQuery.Where(e => e.StudentId == sid);
        }

        var enrollments = await enrollmentsQuery
            .OrderByDescending(e => e.JoinedAt)
            .ToListAsync(ct);

        if (enrollments.Count == 0)
        {
            return [];
        }

        var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

        var classWordIds = await dbContext.Words
            .AsNoTracking()
            .Where(w => w.ClassroomId == cid && w.IsDeleted != true)
            .Select(w => w.Id)
            .ToListAsync(ct);

        var srsRows = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => studentIds.Contains(s.UserId) && (s.Word == null || s.Word.IsDeleted != true))
            .ToListAsync(ct);

        var quizzes = await dbContext.QuizResults
            .AsNoTracking()
            .Where(q => studentIds.Contains(q.UserId))
            .OrderByDescending(q => q.CompletedAt)
            .ToListAsync(ct);

        var savedWordCounts = await dbContext.Words
            .AsNoTracking()
            .Where(w => w.AddedBy != null && studentIds.Contains(w.AddedBy.Value) && w.IsDeleted != true)
            .GroupBy(w => w.AddedBy!.Value)
            .Select(g => new { StudentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StudentId, x => x.Count, ct);

        var classWordSet = classWordIds.ToHashSet();
        var results = new List<TeacherStudentProgressDto>(enrollments.Count);

        foreach (var enrollment in enrollments)
        {
            var studentId = enrollment.StudentId;
            var profile = enrollment.Student;

            var studentAllSrs = srsRows.Where(s => s.UserId == studentId).ToList();
            var classSrs = classWordSet.Count > 0
                ? studentAllSrs.Where(s => classWordSet.Contains(s.WordId)).ToList()
                : studentAllSrs;

            var effectiveSrs = classSrs.Count > 0 ? classSrs : studentAllSrs;

            int totalWordsLearned = effectiveSrs.Count;
            int wordsDue = effectiveSrs.Count(s => s.NextReviewDate != null && s.NextReviewDate <= nowUtc);
            double avgEase = effectiveSrs.Count > 0 ? Math.Round(effectiveSrs.Average(s => s.EaseFactor ?? 2.5), 2) : 2.5;
            double avgStability = effectiveSrs.Count > 0 ? effectiveSrs.Average(s => s.Stability ?? 0.0) : 0;
            int totalReviews = effectiveSrs.Sum(s => s.ReviewCount ?? 0);
            DateTime? lastStudyAt = effectiveSrs.Count > 0 ? effectiveSrs.Max(s => s.LastReviewedAt) : null;

            var studentQuizzes = quizzes.Where(q => q.UserId == studentId).ToList();
            var latestQuizRow = studentQuizzes.FirstOrDefault();
            var latestQuiz = latestQuizRow != null
                ? new TeacherStudentLatestQuizDto(
                    latestQuizRow.Score,
                    latestQuizRow.TotalQuestions,
                    latestQuizRow.QuizType,
                    latestQuizRow.CompletedAt)
                : null;

            int savedWordsCount = savedWordCounts.TryGetValue(studentId, out var swCount)
                ? Math.Max(swCount, totalWordsLearned)
                : totalWordsLearned;

            DateTime? trueLastActive = MaxDateTime(lastStudyAt, latestQuizRow?.CompletedAt, enrollment.JoinedAt);

            int activeVms = totalWordsLearned > 0
                ? Math.Clamp((int)Math.Round(Math.Min(60.0, avgStability * 6.0) + Math.Min(40.0, totalWordsLearned * 2.5)), 10, 100)
                : 0;

            double daysSinceActive = trueLastActive.HasValue
                ? Math.Max(0, (nowUtc - trueLastActive.Value).TotalDays)
                : 30.0;

            double decayFactor = daysSinceActive <= 2.0
                ? 1.0
                : Math.Max(0.25, Math.Pow(0.94, daysSinceActive - 2.0));

            int vms = (int)Math.Clamp(Math.Round(activeVms * decayFactor), 0, 100);

            int lcs = totalReviews == 0 && studentQuizzes.Count == 0
                ? 0
                : (int)Math.Clamp(
                    Math.Round(Math.Max(10.0, 85.0 - daysSinceActive * 7.0) * 0.6 + Math.Min(40.0, totalReviews * 1.5)),
                    0,
                    100);

            double quizAccPct = latestQuizRow is { TotalQuestions: > 0 }
                ? (double)latestQuizRow.Score / latestQuizRow.TotalQuestions * 100.0
                : vms * 0.7;

            int communicativeDepth = totalWordsLearned == 0 && latestQuizRow == null
                ? 0
                : (int)Math.Clamp(Math.Round(vms * 0.5 + quizAccPct * 0.5), 0, 100);

            int composite = (vms + communicativeDepth) / 2;
            string cefrLevel = composite switch
            {
                >= 85 when totalWordsLearned >= 50 => "C1",
                >= 70 when totalWordsLearned >= 30 => "B2",
                >= 50 when totalWordsLearned >= 15 => "B1",
                >= 30 when totalWordsLearned >= 5 => "A2",
                _ => "A1"
            };

            string planStr = (profile?.Plan ?? SubscriptionPlanType.Free).ToString().ToLowerInvariant();

            results.Add(new TeacherStudentProgressDto(
                studentId,
                profile?.Email ?? string.Empty,
                profile?.FullName,
                profile?.AvatarUrl,
                cid,
                classroom.Name,
                totalWordsLearned,
                wordsDue,
                avgEase,
                totalReviews,
                lastStudyAt,
                vms,
                activeVms,
                lcs,
                communicativeDepth,
                cefrLevel,
                trueLastActive,
                latestQuiz,
                savedWordsCount,
                planStr,
                profile?.PlanExpiresAt,
                enrollment.JoinedAt));
        }

        return results;
    }

    private static DateTime? MaxDateTime(params DateTime?[] values)
    {
        DateTime? max = null;
        foreach (var v in values)
        {
            if (v.HasValue && (!max.HasValue || v.Value > max.Value))
            {
                max = v.Value;
            }
        }

        return max;
    }
}
