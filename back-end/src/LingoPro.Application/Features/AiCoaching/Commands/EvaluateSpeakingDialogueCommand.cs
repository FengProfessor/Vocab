using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.AiCoaching.Commands;

/// <summary>
/// Command to evaluate a learner's spoken response in an AI conversation scenario.
/// </summary>
[Authorize]
public record EvaluateSpeakingDialogueCommand(
    string Topic,
    string LastTranscript,
    IReadOnlyList<string> History) : IRequest<ApiResponse<AiSpeakingFeedbackDto>>;
