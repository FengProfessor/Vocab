using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using MediatR;

namespace LingoPro.Application.Features.Exams;

/// <summary>
/// Grades a submitted VSTEP / VNU exam on a 10-point scale and maps it to <see cref="LingoPro.Domain.Enums.CertLevel"/>.
/// </summary>
public class SubmitVstepExamCommandHandler(ICurrentUserService currentUser)
    : IRequestHandler<SubmitVstepExamCommand, ApiResponse<VstepScoreResult>>
{
    public Task<ApiResponse<VstepScoreResult>> Handle(SubmitVstepExamCommand request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            throw new UnauthorizedAccessException("User must be authenticated to submit standardized exams.");
        }

        var result = ExamScoringEngine.CalculateVstepScore(
            request.ListeningScore,
            request.ReadingScore,
            request.WritingScore,
            request.SpeakingScore
        );

        return Task.FromResult(ApiResponse<VstepScoreResult>.Ok(result, "Standardized exam graded successfully."));
    }
}
