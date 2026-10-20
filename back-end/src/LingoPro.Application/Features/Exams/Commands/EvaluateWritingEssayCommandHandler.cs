using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Exams.Commands;

/// <summary>
/// Evaluates a standardized writing essay using the AI router's 4-criteria rubric.
/// </summary>
public class EvaluateWritingEssayCommandHandler(
    IAiRouterService aiRouter) : IRequestHandler<EvaluateWritingEssayCommand, ApiResponse<AiWritingEvaluationDto>>
{
    public async Task<ApiResponse<AiWritingEvaluationDto>> Handle(EvaluateWritingEssayCommand request, CancellationToken ct)
    {
        var evaluation = await aiRouter.EvaluateEssayAsync(request.ExamType, request.PromptText, request.EssayText, ct);
        return ApiResponse<AiWritingEvaluationDto>.Ok(
            evaluation,
            "Writing essay evaluated against standardized 4-criteria rubric successfully.");
    }
}
