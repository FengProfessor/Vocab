using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Toeic;

/// <summary>
/// Command to submit a completed TOEIC exam attempt and compute ETS scaled scores.
/// </summary>
public record SubmitToeicExamCommand(
    string TestId,
    int ListeningCorrectCount,
    int ReadingCorrectCount,
    int DurationSeconds,
    Dictionary<string, string> UserAnswers) : IRequest<ApiResponse<ToeicSubmissionResponseDto>>;
