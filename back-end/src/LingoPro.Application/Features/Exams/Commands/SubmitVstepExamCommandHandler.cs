using System.Text.Json;
using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Entities.Exam;
using MediatR;

namespace LingoPro.Application.Features.Exams.Commands;

/// <summary>
/// Grades a submitted VSTEP / VNU exam on a 10-point scale, maps it to <see cref="LingoPro.Domain.Enums.CertLevel"/>, and persists the submission.
/// </summary>
public class SubmitVstepExamCommandHandler(
    ICurrentUserService currentUser,
    IExamRepository examRepository) : IRequestHandler<SubmitVstepExamCommand, ApiResponse<VstepScoreResult>>
{
    public async Task<ApiResponse<VstepScoreResult>> Handle(SubmitVstepExamCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User must be authenticated to submit standardized exams.");

        var result = ExamScoringEngine.CalculateVstepScore(
            request.ListeningScore,
            request.ReadingScore,
            request.WritingScore,
            request.SpeakingScore
        );

        var resultEntity = new ToeicTestResult
        {
            UserId = userId,
            TestId = request.TestId,
            ExamType = request.ExamType,
            ListeningScaledScore = (int)Math.Round(request.ListeningScore * 10),
            ReadingScaledScore = (int)Math.Round(request.ReadingScore * 10),
            TotalScore = (int)Math.Round(result.OverallScore * 10),
            AnswersJson = JsonSerializer.Serialize(new
            {
                request.ListeningScore,
                request.ReadingScore,
                request.WritingScore,
                request.SpeakingScore,
                result.OverallScore,
                result.CertLevel,
                result.BandDescription
            })
        };

        examRepository.AddToeicTestResult(resultEntity);

        const int xpAwarded = 50;
        await examRepository.AwardXpAsync(userId, xpAwarded, DateOnly.FromDateTime(DateTime.UtcNow), ct);

        await examRepository.SaveChangesAsync(ct);

        return ApiResponse<VstepScoreResult>.Ok(result, "Standardized exam graded and recorded successfully.");
    }
}
