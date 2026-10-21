using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
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

        var dueUntil = today.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var rows = await dbContext.SrsProgresses
            .AsNoTracking()
            .Include(s => s.Word)
            .Where(s => s.UserId == userId && s.NextReviewDate != null && s.NextReviewDate < dueUntil)
            .OrderBy(s => s.NextReviewDate)
            .Take(limit)
            .ToListAsync(ct);

        // public.words has no topic or CEFR level columns, so Topic/Level are returned as null.
        IReadOnlyList<WordWithSrsDto> dueItems = rows.Select(s => new WordWithSrsDto(
                s.Word.Id,
                s.Word.Term,
                s.Word.Ipa,
                s.Word.Translation,
                s.Word.Pos,
                s.Word.ImageUrl,
                s.Word.Example,
                s.Word.ExampleVi,
                null,
                null,
                s.State ?? SrsCardState.New,
                s.Stability ?? 0,
                s.Difficulty ?? 0,
                s.IntervalDays ?? 0,
                s.NextReviewDate.HasValue ? DateOnly.FromDateTime(s.NextReviewDate.Value) : null
            ))
            .ToList();
        return ApiResponse<IReadOnlyList<WordWithSrsDto>>.Ok(dueItems, "Due vocabulary queue retrieved successfully.");
    }
}
