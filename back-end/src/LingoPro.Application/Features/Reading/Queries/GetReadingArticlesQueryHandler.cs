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
            .Where(a => a.Status == ReadingArticleStatus.Published);

        if (request.CertLevel.HasValue)
        {
            query = query.Where(a => a.CertLevel == request.CertLevel.Value);
        }

        var articles = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ReadingArticleDto(
                a.Id,
                a.Slug,
                a.Title,
                a.Topic,
                a.CertLevel,
                a.SourceType,
                a.WordCount,
                a.ContentText,
                a.QuestionsJson))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<ReadingArticleDto>>.Ok(articles, "Reading library articles retrieved successfully.");
    }
}
