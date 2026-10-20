using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Generates conversational reply and corrective feedback for the AI Speaking Tutor.
/// </summary>
public class EvaluateSpeakingDialogueCommandHandler(
    IAiRouterService aiRouter) : IRequestHandler<EvaluateSpeakingDialogueCommand, ApiResponse<AiSpeakingFeedbackDto>>
{
    public async Task<ApiResponse<AiSpeakingFeedbackDto>> Handle(EvaluateSpeakingDialogueCommand request, CancellationToken ct)
    {
        var feedback = await aiRouter.EvaluateSpeakingDialogueAsync(request.Topic, request.LastTranscript, request.History, ct);
        return ApiResponse<AiSpeakingFeedbackDto>.Ok(feedback, "AI speaking feedback generated successfully.");
    }
}
