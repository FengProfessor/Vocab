using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Exams.Commands;

/// <summary>
/// Command to submit a standardized VSTEP / VNU / THPT exam and compute a 10-point scale score.
/// </summary>
[Authorize]
public record SubmitVstepExamCommand(
    ExamType ExamType,
    string TestId,
    double ListeningScore,
    double ReadingScore,
    double WritingScore,
    double SpeakingScore) : IRequest<ApiResponse<VstepScoreResult>>;
