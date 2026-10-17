using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar;

/// <summary>
/// Command to record a learner's grammar topic practice score and update its FSRS schedule.
/// </summary>
public record SubmitGrammarProgressCommand(
    string TopicSlug,
    double AccuracyPercent) : IRequest<ApiResponse<GrammarProgressDto>>;
