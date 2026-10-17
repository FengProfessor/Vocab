using LingoPro.Application.Common.Models;
using LingoPro.Domain.Algorithms;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Exams;

/// <summary>
/// Command to submit a standardized VSTEP / VNU / THPT exam and compute a 10-point scale score.
/// </summary>
public record SubmitVstepExamCommand(
    ExamType ExamType,
    string TestId,
    double ListeningScore,
    double ReadingScore,
    double WritingScore,
    double SpeakingScore) : IRequest<ApiResponse<VstepScoreResult>>;
