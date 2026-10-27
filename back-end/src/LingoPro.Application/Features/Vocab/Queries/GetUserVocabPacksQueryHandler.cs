using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Handles <see cref="GetUserVocabPacksQuery"/> by querying the user's imported vocabulary packs and live FSRS progress.
/// </summary>
public sealed class GetUserVocabPacksQueryHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository) : IRequestHandler<GetUserVocabPacksQuery, ApiResponse<IReadOnlyList<UserVocabPackDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<UserVocabPackDto>>> Handle(GetUserVocabPacksQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var packs = await vocabRepository.GetUserVocabPacksAsync(userId, ct);

        return ApiResponse<IReadOnlyList<UserVocabPackDto>>.Ok(
            packs,
            "User vocabulary packs retrieved successfully.");
    }
}
