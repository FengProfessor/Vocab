using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.SpeakingFoundation.Queries;

/// <summary>
/// Handles <see cref="GetLearnerVocabularyMapQuery"/> by aggregating concept states and gap breakdowns for the target learner.
/// </summary>
public sealed class GetLearnerVocabularyMapQueryHandler(
    ICurrentUserService currentUser,
    ISpeakingFoundationRepository speakingFoundationRepository)
    : IRequestHandler<GetLearnerVocabularyMapQuery, ApiResponse<LearnerVocabularyMapDto>>
{
    public async Task<ApiResponse<LearnerVocabularyMapDto>> Handle(
        GetLearnerVocabularyMapQuery request,
        CancellationToken ct)
    {
        var callerId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var targetLearnerId = request.LearnerId ?? callerId;
        var map = await speakingFoundationRepository.GetLearnerVocabularyMapAsync(targetLearnerId, ct);
        return ApiResponse<LearnerVocabularyMapDto>.Ok(map, "Learner vocabulary gap map retrieved successfully.");
    }
}
