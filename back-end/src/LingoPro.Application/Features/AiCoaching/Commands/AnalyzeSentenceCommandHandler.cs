using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Performs deep syntactic kernel analysis on an English sentence for Pro/Premium subscribers.
/// </summary>
public class AnalyzeSentenceCommandHandler(
    IAiRouterService aiRouter) : IRequestHandler<AnalyzeSentenceCommand, ApiResponse<AiSentenceAnalysisDto>>
{
    public async Task<ApiResponse<AiSentenceAnalysisDto>> Handle(AnalyzeSentenceCommand request, CancellationToken ct)
    {
        var analysis = await aiRouter.AnalyzeSentenceStructureAsync(request.Sentence, request.Context, ct);
        return ApiResponse<AiSentenceAnalysisDto>.Ok(analysis, "Sentence grammatical structure analyzed successfully.");
    }
}
