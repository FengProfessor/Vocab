using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Retrieves the user's due vocabulary review queue directly from the database without caching.
/// </summary>
public class GetDueWordsQueryHandler(
    ICurrentUserService currentUser,
    IApplicationDbContext dbContext) : IRequestHandler<GetDueWordsQuery, ApiResponse<IReadOnlyList<WordWithSrsDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<WordWithSrsDto>>> Handle(GetDueWordsQuery request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        int limit = Math.Clamp(request.Limit, 1, 200);

        var dueItems = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == userId && s.NextReviewDate <= today)
            .OrderBy(s => s.NextReviewDate)
            .Take(limit)
            .Select(s => new WordWithSrsDto(
                s.Word.Id,
                s.Word.Term,
                s.Word.Ipa,
                s.Word.Translation,
                s.Word.PartOfSpeech,
                s.Word.ImageUrl,
                s.Word.ExampleSentence,
                s.Word.ExampleTranslation,
                s.Word.Topic,
                s.Word.Level,
                s.State,
                s.Stability,
                s.Difficulty,
                s.IntervalDays,
                s.NextReviewDate
            ))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<WordWithSrsDto>>.Ok(dueItems, "Due vocabulary queue retrieved successfully.");
    }
}
