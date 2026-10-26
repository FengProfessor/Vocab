using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Handles <see cref="GetVocabAnalyticsQuery"/> by aggregating FSRS L1-L6 level counts,
/// learning analytics metrics, and paginated vocabulary items from the repository.
/// </summary>
public sealed class GetVocabAnalyticsQueryHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository) : IRequestHandler<GetVocabAnalyticsQuery, ApiResponse<VocabAnalyticsDto>>
{
    public async Task<ApiResponse<VocabAnalyticsDto>> Handle(GetVocabAnalyticsQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        int limit = Math.Clamp(request.Limit, 0, 2000);
        int offset = Math.Max(0, request.Offset);

        var analytics = await vocabRepository.GetVocabAnalyticsAsync(
            userId,
            request.ClassroomId,
            limit,
            offset,
            ct);

        return ApiResponse<VocabAnalyticsDto>.Ok(
            analytics,
            "Vocabulary FSRS L1-L6 breakdown and learning analytics retrieved successfully.");
    }
}
