using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Performs deep syntactic kernel analysis on an English sentence for Pro/Premium subscribers.
/// </summary>
public class AnalyzeSentenceCommandHandler(
    ICurrentUserService currentUser,
    IAiRouterService aiRouter) : IRequestHandler<AnalyzeSentenceCommand, ApiResponse<AiSentenceAnalysisDto>>
{
    public async Task<ApiResponse<AiSentenceAnalysisDto>> Handle(AnalyzeSentenceCommand request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            throw new UnauthorizedAccessException("User must be authenticated.");
        }

        if (!currentUser.IsPro)
        {
            throw new ForbiddenAccessException(
                "AI Deep Sentence Analysis requires an active Pro or Premium subscription.",
                "PRO_REQUIRED");
        }

        var analysis = await aiRouter.AnalyzeSentenceStructureAsync(request.Sentence, request.Context, ct);
        return ApiResponse<AiSentenceAnalysisDto>.Ok(analysis, "Sentence grammatical structure analyzed successfully.");
    }
}
