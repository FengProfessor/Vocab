using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Exceptions;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Retrieves a single vocabulary word by ID and enriches it with the current user's FSRS progress if available.
/// </summary>
public class GetVocabWordByIdQueryHandler(
    ICurrentUserService currentUser,
    IVocabRepository vocabRepository) : IRequestHandler<GetVocabWordByIdQuery, ApiResponse<VocabWordDetailDto>>
{
    public async Task<ApiResponse<VocabWordDetailDto>> Handle(GetVocabWordByIdQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var word = await vocabRepository.GetWordByIdAsNoTrackingAsync(request.WordId, ct)
            ?? throw new NotFoundException("Word", request.WordId);

        var srs = await vocabRepository.GetSrsProgressAsync(userId, request.WordId, ct);

        var dto = new VocabWordDetailDto(
            word.Id,
            word.ClassroomId,
            word.AddedBy,
            word.Term,
            word.Translation ?? string.Empty,
            word.Ipa,
            word.Pos,
            word.Example,
            word.ExampleVi,
            word.SourceUrl,
            word.ImageUrl,
            word.DictionaryData,
            word.Synonyms ?? [],
            word.Antonyms ?? [],
            word.CreatedAt,
            srs?.State,
            srs?.Stability ?? 0.0,
            srs?.Difficulty ?? 5.0,
            srs?.IntervalDays ?? 0,
            srs?.ReviewCount ?? 0,
            srs?.EaseFactor ?? 2.5,
            srs?.NextReviewDate,
            srs?.LastReviewedAt);

        return ApiResponse<VocabWordDetailDto>.Ok(dto, "Vocabulary word retrieved successfully.");
    }
}
