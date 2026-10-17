namespace LingoPro.Application.Common.Models;

/// <summary>
/// Represents conversational feedback and suggested response from the AI speaking coach.
/// </summary>
public record AiSpeakingFeedbackDto(
    string Response,
    string Feedback,
    string SuggestedResponse
);
