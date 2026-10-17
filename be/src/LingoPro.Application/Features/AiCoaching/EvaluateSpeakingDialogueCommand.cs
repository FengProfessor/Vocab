using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching;

/// <summary>
/// Command to evaluate a learner's spoken response in an AI conversation scenario.
/// </summary>
public record EvaluateSpeakingDialogueCommand(
    string Topic,
    string LastTranscript,
    IReadOnlyList<string> History) : IRequest<ApiResponse<AiSpeakingFeedbackDto>>;
