using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Retrieves published reading library articles filtered by certification level from the database.
/// </summary>
public class GetReadingArticlesQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetReadingArticlesQuery, ApiResponse<IReadOnlyList<ReadingArticleDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ReadingArticleDto>>> Handle(
        GetReadingArticlesQuery request,
        CancellationToken ct)
    {
        var query = dbContext.ReadingArticles
            .AsNoTracking()
            .Where(a => a.Status == "published");

        if (request.CertLevel.HasValue)
        {
            string cert = request.CertLevel.Value.ToString();
            query = query.Where(a => a.CefrLevel == cert);
        }

        var articles = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ReadingArticleDto(
                a.Id,
                a.Slug,
                a.Title,
                a.ThemeId,
                a.CefrLevel,
                a.SourceType,
                a.WordCount,
                a.Passage,
                a.Questions))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<ReadingArticleDto>>.Ok(articles, "Reading library articles retrieved successfully.");
    }
}
