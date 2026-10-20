using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Domain.Enums;
using MediatR;

namespace LingoPro.Application.Features.Exams.Commands;

/// <summary>
/// Command to evaluate a VSTEP or IELTS writing essay using multi-tier AI grading.
/// </summary>
[Authorize]
public record EvaluateWritingEssayCommand(
    ExamType ExamType,
    string PromptText,
    string EssayText) : IRequest<ApiResponse<AiWritingEvaluationDto>>;
