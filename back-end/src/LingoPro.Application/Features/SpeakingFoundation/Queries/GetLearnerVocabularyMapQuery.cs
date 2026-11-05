using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Query to retrieve the 6-dimension lexical gap map and prioritized remediation queue for a learner.
/// </summary>
public sealed record GetLearnerVocabularyMapQuery(Guid? LearnerId = null)
    : IRequest<ApiResponse<LearnerVocabularyMapDto>>;
