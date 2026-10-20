using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Retrieves the canonical CEFR grammar topics ordered by curriculum sequence from the database.
/// </summary>
public class GetCanonicalGrammarTopicsQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetCanonicalGrammarTopicsQuery, ApiResponse<IReadOnlyList<GrammarTopicDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<GrammarTopicDto>>> Handle(
        GetCanonicalGrammarTopicsQuery request,
        CancellationToken ct)
    {
        var query = dbContext.GrammarTopics.AsNoTracking();
        if (request.CertLevel.HasValue)
        {
            query = query.Where(t => t.CertLevel == request.CertLevel.Value);
        }

        var topics = await query
            .OrderBy(t => t.SortOrder)
            .Select(t => new GrammarTopicDto(
                t.Id,
                t.Slug,
                t.Title,
                t.TitleVi,
                t.Level,
                t.CertLevel,
                t.Category,
                t.SortOrder))
            .ToListAsync(ct);

        return ApiResponse<IReadOnlyList<GrammarTopicDto>>.Ok(topics, "Canonical grammar topics retrieved successfully.");
    }
}
