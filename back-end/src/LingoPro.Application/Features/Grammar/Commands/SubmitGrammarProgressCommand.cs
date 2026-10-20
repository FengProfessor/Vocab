using LingoPro.Application.Common.Security;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Commands;

/// <summary>
/// Command to record a learner's grammar topic practice score and update its FSRS schedule.
/// </summary>
[Authorize]
public record SubmitGrammarProgressCommand(
    string TopicSlug,
    double AccuracyPercent) : IRequest<ApiResponse<GrammarProgressDto>>;
