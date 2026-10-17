using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Exam;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Toeic;

/// <summary>
/// Grades a submitted TOEIC exam using the ETS barem engine and records the attempt in PostgreSQL.
/// </summary>
public class SubmitToeicExamCommandHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<SubmitToeicExamCommand, ApiResponse<ToeicSubmissionResponseDto>>
{
    public async Task<ApiResponse<ToeicSubmissionResponseDto>> Handle(SubmitToeicExamCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var score = ExamScoringEngine.CalculateToeicScore(
            request.ListeningCorrectCount,
            request.ReadingCorrectCount
        );

        var resultEntity = new ToeicTestResult
        {
            UserId = userId,
            TestId = request.TestId,
            ExamType = ExamType.Toeic,
            ListeningCorrect = score.ListeningCorrect,
            ReadingCorrect = score.ReadingCorrect,
            ListeningScaledScore = score.ListeningScaledScore,
            ReadingScaledScore = score.ReadingScaledScore,
            TotalScore = score.TotalScaledScore,
            DurationSeconds = request.DurationSeconds,
            AnswersJson = JsonSerializer.Serialize(request.UserAnswers)
        };

        dbContext.ToeicTestResults.Add(resultEntity);

        const int xpAwarded = 50;
        var profile = await dbContext.Profiles.FirstOrDefaultAsync(p => p.Id == userId, ct);
        profile?.AwardXpAndUpdateStreak(xpAwarded, DateOnly.FromDateTime(DateTime.UtcNow));

        await dbContext.SaveChangesAsync(ct);

        var dto = new ToeicSubmissionResponseDto(
            resultEntity.Id,
            resultEntity.TestId,
            score.ListeningCorrect,
            score.ReadingCorrect,
            score.ListeningScaledScore,
            score.ReadingScaledScore,
            score.TotalScaledScore,
            score.CertLevel,
            score.ProficiencyBand,
            xpAwarded
        );

        return ApiResponse<ToeicSubmissionResponseDto>.Ok(
            dto,
            "TOEIC exam submitted and graded according to ETS barem successfully.");
    }
}
