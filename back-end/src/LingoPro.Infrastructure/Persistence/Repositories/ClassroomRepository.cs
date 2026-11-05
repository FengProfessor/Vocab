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
        var progressList = await BuildClassroomStudentProgressListAsync(classroom, ct);
        var studentIds = progressList.Select(p => p.StudentId).Distinct().ToList();

        var classWords = await dbContext.Words
            .AsNoTracking()
            .Where(w => w.ClassroomId == classroomId && w.IsDeleted != true)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new { w.Id, w.Term, w.Translation, w.Pos, w.Ipa, w.CreatedAt })
            .ToListAsync(ct);

        var classWordIds = classWords.Select(w => w.Id).ToHashSet();

        var allSrsRows = studentIds.Count > 0
            ? await dbContext.SrsProgresses
                .AsNoTracking()
                .Include(s => s.Word)
                .Where(s => studentIds.Contains(s.UserId) && s.Word != null && s.Word.IsDeleted != true)
                .ToListAsync(ct)
            : [];

        var classSrsRows = classWordIds.Count > 0
            ? allSrsRows.Where(s => classWordIds.Contains(s.WordId)).ToList()
            : [];

        var effectiveSrsRows = classSrsRows.Count > 0 ? classSrsRows : allSrsRows;

        var fallbackWords = classWords.Count < 15
            ? await dbContext.Words
                .AsNoTracking()
                .Where(w => w.IsDeleted != true &&
                            (w.AddedBy == classroom.TeacherId ||
                             (w.AddedBy != null && studentIds.Contains(w.AddedBy.Value))))
                .OrderByDescending(w => w.CreatedAt)
                .Take(30)
                .Select(w => new { w.Id, w.Term, w.Translation, w.Pos, w.Ipa, w.CreatedAt })
                .ToListAsync(ct)
            : [];

        int totalStudents = progressList.Count;
        int totalWords = classWords.Count > 0
            ? classWords.Count
            : Math.Max(
                effectiveSrsRows.Select(s => s.WordId).Distinct().Count(),
                fallbackWords.Count);

        var studentSummaries = new List<TeacherStudentSummaryDto>(totalStudents);
        int active7d = 0;
        int totalReviewsAll = 0;
        int totalWordsLearnedSum = 0;
        int totalMasteryPctSum = 0;
        int totalWordsDueToday = 0;

        foreach (var p in progressList)
        {
            var effectiveLastActive = p.TrueLastActive ?? p.LastStudyAt;
            int? daysSinceActive = effectiveLastActive.HasValue
                ? (int)Math.Max(0, Math.Floor((nowUtc - effectiveLastActive.Value).TotalDays))
                : null;
            bool isActive7d = daysSinceActive.HasValue && daysSinceActive.Value <= 7;

            int masteryPct = p.Vms;
            int accuracyPct = p.LatestQuiz is { TotalQuestions: > 0 }
                ? (int)Math.Clamp(Math.Round((double)p.LatestQuiz.Score / p.LatestQuiz.TotalQuestions * 100.0), 0, 100)
                : masteryPct;

            if (isActive7d) active7d++;
            totalReviewsAll += p.TotalReviews;
            totalWordsLearnedSum += p.TotalWordsLearned;
            totalMasteryPctSum += masteryPct;
            totalWordsDueToday += p.WordsDue;

            studentSummaries.Add(new TeacherStudentSummaryDto(
                p.StudentId,
                p.FullName,
                p.Email,
                p.AvatarUrl,
                p.TotalWordsLearned,
                p.WordsDue,
                p.TotalReviews,
                masteryPct,
                accuracyPct,
                effectiveLastActive,
                daysSinceActive,
                isActive7d,
                p.Lcs));
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
            engagementRate,
            totalWordsDueToday);

        var topStudents = studentSummaries
            .OrderByDescending(s => s.MasteryPct)
            .ThenByDescending(s => s.WordsLearned)
            .ThenByDescending(s => s.TotalReviews)
            .Take(5)
            .ToList();

        var strugglingStudents = studentSummaries
            .Where(s => s.EasePct < 60 || s.MasteryPct < 60 || !s.IsActive7d || s.WordsDue > 5)
            .OrderBy(s => s.EasePct)
            .ThenBy(s => s.MasteryPct)
            .ThenBy(s => s.WordsLearned)
            .Take(5)
            .ToList();

        var srsByWordId = effectiveSrsRows
            .GroupBy(s => s.WordId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var candidateWords = classWords
            .Concat(effectiveSrsRows
                .Where(s => s.Word != null)
                .Select(s => new
                {
                    s.Word!.Id,
                    s.Word.Term,
                    s.Word.Translation,
                    s.Word.Pos,
                    s.Word.Ipa,
                    s.Word.CreatedAt
                }))
            .Concat(fallbackWords)
            .GroupBy(w => w.Id)
            .Select(g => g.First())
            .Take(30)
            .ToList();

        var wordCoverage = candidateWords
            .Select(w =>
            {
                int learnedCount = srsByWordId.TryGetValue(w.Id, out var list)
                    ? list.Select(x => x.UserId).Distinct().Count()
                    : 0;
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
            .OrderByDescending(w => w.CoveragePct)
            .ThenBy(w => w.Word)
            .Take(15)
            .ToList();

        var wordMap = candidateWords.ToDictionary(w => w.Id);

        var wordDifficultyFromSrs = srsByWordId
            .Where(kv => kv.Value.Count > 0 && wordMap.ContainsKey(kv.Key))
            .Select(kv =>
            {
                var w = wordMap[kv.Key];
                var list = kv.Value;
                int stCount = Math.Max(1, list.Select(x => x.UserId).Distinct().Count());
                double avgStab = Math.Round(list.Average(x => x.Stability ?? 0.0), 1);
                double avgDiff = Math.Round(list.Average(x => x.Difficulty ?? 5.0), 1);
                int totalRev = list.Sum(x => x.ReviewCount ?? 0);
                double avgRevPerStudent = Math.Max(1.0, (double)totalRev / stCount);
                double failRate = avgStab > 0
                    ? Math.Round(avgRevPerStudent / avgStab, 1)
                    : Math.Round(avgDiff / 2.0, 1);
                return new TeacherWordDifficultyItemDto(
                    w.Id,
                    w.Term,
                    w.Translation ?? string.Empty,
                    w.Pos,
                    w.Ipa,
                    stCount,
                    avgStab,
                    avgDiff,
                    totalRev,
                    Math.Max(0.1, failRate));
            })
            .OrderByDescending(w => w.FailRate)
            .ThenBy(w => w.AvgStability)
            .Take(10)
            .ToList();

        var includedDiffWordIds = wordDifficultyFromSrs.Select(w => w.WordId).ToHashSet();
        var fallbackDifficultyWords = wordDifficultyFromSrs.Count == 0
            ? candidateWords
                .Where(w => !includedDiffWordIds.Contains(w.Id))
                .Take(10)
                .Select((w, idx) => new TeacherWordDifficultyItemDto(
                    w.Id,
                    w.Term,
                    w.Translation ?? string.Empty,
                    w.Pos,
                    w.Ipa,
                    0,
                    0.0,
                    5.0,
                    0,
                    Math.Round(Math.Max(1.0, 2.5 - idx * 0.15), 1)))
                .ToList()
            : [];

        var wordDifficulty = wordDifficultyFromSrs
            .Concat(fallbackDifficultyWords)
            .Take(10)
            .ToList();

        var studentNameMap = progressList
            .GroupBy(p => p.StudentId)
            .ToDictionary(g => g.Key, g => g.First());

        string ResolveStudentName(Guid sid)
        {
            if (studentNameMap.TryGetValue(sid, out var st))
            {
                return !string.IsNullOrWhiteSpace(st.FullName)
                    ? st.FullName
                    : (!string.IsNullOrWhiteSpace(st.Email) ? st.Email.Split('@')[0] : "Học viên");
            }
            return "Học viên";
        }

        string? ResolveStudentAvatar(Guid sid)
            => studentNameMap.TryGetValue(sid, out var st) ? st.AvatarUrl : null;

        var combinedActivities = new List<TeacherActivityFeedItemDto>();

        // 1. SRS Reviews
        foreach (var s in effectiveSrsRows.Where(s => s.LastReviewedAt != null && wordMap.ContainsKey(s.WordId)).OrderByDescending(s => s.LastReviewedAt).Take(15))
        {
            var w = wordMap[s.WordId];
            int revCount = Math.Max(1, s.ReviewCount ?? 1);
            int intDays = s.IntervalDays ?? 0;
            string detail = $"Đã ôn từ \"{w.Term}\"{(!string.IsNullOrWhiteSpace(w.Translation) ? $" ({w.Translation})" : string.Empty)} — lần #{revCount}{(intDays > 0 ? $", chu kỳ {intDays} ngày" : string.Empty)}";
            combinedActivities.Add(new TeacherActivityFeedItemDto(
                ResolveStudentName(s.UserId),
                ResolveStudentAvatar(s.UserId),
                w.Term,
                w.Translation ?? string.Empty,
                intDays,
                revCount,
                s.LastReviewedAt,
                "review",
                s.UserId,
                detail,
                s.LastReviewedAt));
        }

        if (studentIds.Count > 0)
        {
            // 2. Quizzes
            var recentQuizzes = await dbContext.QuizResults
                .AsNoTracking()
                .Where(q => studentIds.Contains(q.UserId) && q.CompletedAt != null)
                .OrderByDescending(q => q.CompletedAt)
                .Take(15)
                .ToListAsync(ct);

            foreach (var q in recentQuizzes)
            {
                int acc = q.TotalQuestions > 0 ? (int)Math.Round((double)q.Score / q.TotalQuestions * 100.0) : 0;
                string detail = $"Hoàn thành bài kiểm tra ({q.QuizType ?? "từ vựng"}) — {q.Score}/{q.TotalQuestions} ({acc}%)";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(q.UserId),
                    ResolveStudentAvatar(q.UserId),
                    q.QuizType ?? "quiz",
                    detail,
                    0,
                    1,
                    q.CompletedAt,
                    "quiz",
                    q.UserId,
                    detail,
                    q.CompletedAt));
            }

            // 3. Grammar Progress & Results
            var recentGrammar = await dbContext.GrammarProgresses
                .AsNoTracking()
                .Where(g => studentIds.Contains(g.UserId) && g.LastReviewedAt != null)
                .OrderByDescending(g => g.LastReviewedAt)
                .Take(10)
                .ToListAsync(ct);

            foreach (var g in recentGrammar)
            {
                string detail = $"Luyện chuyên đề ngữ pháp — Độ thành thạo {g.MasteryScore ?? 0}%";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(g.UserId),
                    ResolveStudentAvatar(g.UserId),
                    g.LessonId.ToString(),
                    detail,
                    0,
                    g.ReviewCount ?? 1,
                    g.LastReviewedAt,
                    "grammar",
                    g.UserId,
                    detail,
                    g.LastReviewedAt));
            }

            // 4. Daily Reading Completions
            var recentReadings = await dbContext.DailyReadingCompletions
                .AsNoTracking()
                .Where(r => studentIds.Contains(r.UserId) && r.CompletedAt != null)
                .OrderByDescending(r => r.CompletedAt)
                .Take(10)
                .ToListAsync(ct);

            foreach (var r in recentReadings)
            {
                int score = (r.McqScore ?? 0) + (r.ClozeScore ?? 0);
                int total = (r.McqTotal ?? 0) + (r.ClozeTotal ?? 0);
                string detail = $"Hoàn thành bài đọc hiểu hàng ngày — Đúng {score}/{total} câu";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(r.UserId),
                    ResolveStudentAvatar(r.UserId),
                    "reading",
                    detail,
                    0,
                    1,
                    r.CompletedAt,
                    "reading",
                    r.UserId,
                    detail,
                    r.CompletedAt));
            }

            // 5. TOEIC Practice & Exams
            var recentToeic = await dbContext.ToeicTestResults
                .AsNoTracking()
                .Where(t => studentIds.Contains(t.UserId))
                .OrderByDescending(t => t.CreatedAt)
                .Take(10)
                .ToListAsync(ct);

            foreach (var t in recentToeic)
            {
                int totalScore = t.ListeningScaledScore + t.ReadingScaledScore;
                string detail = $"Hoàn thành bài thi TOEIC — Tổng điểm {totalScore}/990 (L:{t.ListeningScaledScore} • R:{t.ReadingScaledScore})";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(t.UserId),
                    ResolveStudentAvatar(t.UserId),
                    "toeic",
                    detail,
                    0,
                    1,
                    t.CreatedAt,
                    "toeic",
                    t.UserId,
                    detail,
                    t.CreatedAt));
            }

            // 6. Roadmap Assessments
            var recentAssessments = await dbContext.UserRoadmapAssessments
                .AsNoTracking()
                .Where(a => studentIds.Contains(a.UserId))
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .ToListAsync(ct);

            foreach (var a in recentAssessments)
            {
                string detail = $"Hoàn thành bài đánh giá năng lực ({a.Tier}) — Đạt {a.Score}%";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(a.UserId),
                    ResolveStudentAvatar(a.UserId),
                    a.TargetId,
                    detail,
                    0,
                    1,
                    a.CreatedAt,
                    "assessment",
                    a.UserId,
                    detail,
                    a.CreatedAt));
            }

            // 7. Vocab Packs Studied
            var recentPacks = await dbContext.UserVocabPacks
                .AsNoTracking()
                .Where(vp => studentIds.Contains(vp.UserId) && vp.LastStudiedAt != null)
                .OrderByDescending(vp => vp.LastStudiedAt)
                .Take(10)
                .ToListAsync(ct);

            foreach (var vp in recentPacks)
            {
                string detail = $"Học gói từ vựng \"{vp.TopicTitle}\" — Đã ôn {vp.ReviewedCount}/{vp.WordCount} từ";
                combinedActivities.Add(new TeacherActivityFeedItemDto(
                    ResolveStudentName(vp.UserId),
                    ResolveStudentAvatar(vp.UserId),
                    vp.TopicTitle,
                    detail,
                    0,
                    vp.ReviewedCount,
                    vp.LastStudiedAt,
                    "review",
                    vp.UserId,
                    detail,
                    vp.LastStudiedAt));
            }

            // 8. Enrollment fallback if no learning events exist yet
            if (combinedActivities.Count == 0)
            {
                foreach (var p in progressList.OrderByDescending(x => x.JoinedAt).Take(10))
                {
                    var joinedTs = p.JoinedAt ?? nowUtc;
                    string detail = $"Đã tham gia lớp học \"{classroom.Name}\" ({p.TotalWordsLearned} từ vựng đã lưu)";
                    combinedActivities.Add(new TeacherActivityFeedItemDto(
                        ResolveStudentName(p.StudentId),
                        p.AvatarUrl,
                        classroom.Name,
                        detail,
                        0,
                        1,
                        joinedTs,
                        "review",
                        p.StudentId,
                        detail,
                        joinedTs));
                }
            }
        }

        var activityFeed = combinedActivities
            .OrderByDescending(a => a.Timestamp ?? a.ReviewedAt ?? DateTime.MinValue)
            .Take(15)
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

        var savedWordStats = await dbContext.Words
            .AsNoTracking()
            .Where(w => w.AddedBy != null && studentIds.Contains(w.AddedBy.Value) && w.IsDeleted != true)
            .GroupBy(w => w.AddedBy!.Value)
            .Select(g => new { StudentId = g.Key, Count = g.Count(), LatestAt = g.Max(x => x.CreatedAt) })
            .ToDictionaryAsync(x => x.StudentId, ct);

        var dailyStats = await dbContext.StudentDailyStats
            .AsNoTracking()
            .Where(d => studentIds.Contains(d.StudentId))
            .OrderByDescending(d => d.RecordedAt)
            .ToListAsync(ct);

        var vocabPacks = await dbContext.UserVocabPacks
            .AsNoTracking()
            .Where(vp => studentIds.Contains(vp.UserId))
            .ToListAsync(ct);

        var gamifications = await dbContext.UserGamifications
            .AsNoTracking()
            .Where(ug => studentIds.Contains(ug.UserId))
            .ToDictionaryAsync(ug => ug.UserId, ct);

        var grammarProgresses = await dbContext.GrammarProgresses
            .AsNoTracking()
            .Where(gp => studentIds.Contains(gp.UserId))
            .ToListAsync(ct);

        var dailyReadings = await dbContext.DailyReadingCompletions
            .AsNoTracking()
            .Where(dr => studentIds.Contains(dr.UserId))
            .ToListAsync(ct);

        var toeicTests = await dbContext.ToeicTestResults
            .AsNoTracking()
            .Where(tr => studentIds.Contains(tr.UserId))
            .ToListAsync(ct);

        var assessments = await dbContext.UserRoadmapAssessments
            .AsNoTracking()
            .Where(a => studentIds.Contains(a.UserId))
            .ToListAsync(ct);

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

            savedWordStats.TryGetValue(studentId, out var swStat);
            gamifications.TryGetValue(studentId, out var gam);
            var latestDailyStat = dailyStats.FirstOrDefault(d => d.StudentId == studentId);
            var studentPacks = vocabPacks.Where(vp => vp.UserId == studentId).ToList();
            var studentGrammar = grammarProgresses.Where(gp => gp.UserId == studentId).ToList();
            var studentReadings = dailyReadings.Where(dr => dr.UserId == studentId).ToList();
            var studentToeic = toeicTests.Where(tr => tr.UserId == studentId).ToList();
            var studentAssessments = assessments.Where(a => a.UserId == studentId).ToList();

            int packWordsReviewed = studentPacks.Sum(vp => vp.ReviewedCount);
            int packTotalWords = studentPacks.Sum(vp => vp.WordCount);

            int totalWordsLearned = Math.Max(
                effectiveSrs.Count,
                Math.Max(packWordsReviewed, Math.Max(latestDailyStat?.TotalWords ?? 0, swStat?.Count ?? 0)));

            int wordsDue = effectiveSrs.Count(s => s.NextReviewDate != null && s.NextReviewDate <= nowUtc);
            if (wordsDue == 0 && packTotalWords > packWordsReviewed)
            {
                wordsDue = Math.Min(20, packTotalWords - packWordsReviewed);
            }

            double avgEase = effectiveSrs.Count > 0 ? Math.Round(effectiveSrs.Average(s => s.EaseFactor ?? 2.5), 2) : 2.5;
            double avgStability = effectiveSrs.Count > 0 ? effectiveSrs.Average(s => s.Stability ?? 0.0) : 2.0;

            var studentQuizzes = quizzes.Where(q => q.UserId == studentId).ToList();
            int totalReviews = effectiveSrs.Sum(s => s.ReviewCount ?? 0)
                + packWordsReviewed
                + studentQuizzes.Count
                + studentGrammar.Sum(g => g.ReviewCount ?? 1)
                + studentReadings.Count
                + studentToeic.Count
                + studentAssessments.Count;

            DateTime? lastStudyAt = MaxDateTime(
                effectiveSrs.Count > 0 ? effectiveSrs.Max(s => s.LastReviewedAt) : null,
                studentPacks.Count > 0 ? studentPacks.Max(vp => vp.LastStudiedAt) : null,
                studentGrammar.Count > 0 ? studentGrammar.Max(g => g.LastReviewedAt) : null,
                studentReadings.Count > 0 ? studentReadings.Max(r => r.CompletedAt) : null);

            var latestQuizRow = studentQuizzes.FirstOrDefault();
            var latestQuiz = latestQuizRow != null
                ? new TeacherStudentLatestQuizDto(
                    latestQuizRow.Score,
                    latestQuizRow.TotalQuestions,
                    latestQuizRow.QuizType,
                    latestQuizRow.CompletedAt)
                : null;

            int savedWordsCount = Math.Max(swStat?.Count ?? 0, Math.Max(totalWordsLearned, packTotalWords));

            DateTime? gamTodayUtc = gam?.TodayDate.HasValue == true
                ? gam.TodayDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
                : null;

            DateTime? trueLastActive = MaxDateTime(
                lastStudyAt,
                latestQuizRow?.CompletedAt,
                swStat?.LatestAt,
                studentToeic.Count > 0 ? studentToeic.Max(t => (DateTime?)t.CreatedAt) : null,
                studentAssessments.Count > 0 ? studentAssessments.Max(a => (DateTime?)a.CreatedAt) : null,
                gamTodayUtc,
                enrollment.JoinedAt);

            int computedActiveVms = totalWordsLearned > 0
                ? Math.Clamp((int)Math.Round(Math.Min(60.0, avgStability * 6.0) + Math.Min(40.0, totalWordsLearned * 2.5)), 15, 100)
                : (totalReviews > 0 ? 35 : 0);

            int activeVms = Math.Max(computedActiveVms, latestDailyStat?.Vms ?? 0);

            double daysSinceActive = trueLastActive.HasValue
                ? Math.Max(0, (nowUtc - trueLastActive.Value).TotalDays)
                : 30.0;

            double decayFactor = daysSinceActive <= 2.0
                ? 1.0
                : Math.Max(0.25, Math.Pow(0.94, daysSinceActive - 2.0));

            int vms = Math.Max(
                latestDailyStat?.Vms ?? 0,
                (int)Math.Clamp(Math.Round(activeVms * decayFactor), 0, 100));

            int streakBonusLcs = Math.Min(95, (gam?.CurrentStreak ?? 0) * 18);
            int computedLcs = totalReviews == 0 && studentQuizzes.Count == 0 && (gam?.TotalXp ?? 0) == 0
                ? 0
                : (int)Math.Clamp(
                    Math.Round(Math.Max(15.0, 85.0 - daysSinceActive * 7.0) * 0.6 + Math.Min(40.0, Math.Max(totalReviews, 1) * 2.0)),
                    10,
                    100);

            int lcs = Math.Max(computedLcs, Math.Max(latestDailyStat?.Lcs ?? 0, streakBonusLcs));

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
