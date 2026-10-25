using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Retrieves published reading library articles filtered by certification level from the database.
/// </summary>
public class GetReadingArticlesQueryHandler(IReadingRepository readingRepository)
    : IRequestHandler<GetReadingArticlesQuery, ApiResponse<IReadOnlyList<ReadingArticleDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ReadingArticleDto>>> Handle(
        GetReadingArticlesQuery request,
        CancellationToken ct)
    {
        var articles = await readingRepository.GetPublishedArticlesAsync(request.CertLevel, ct);

        return ApiResponse<IReadOnlyList<ReadingArticleDto>>.Ok(articles, "Reading library articles retrieved successfully.");
    }
}
