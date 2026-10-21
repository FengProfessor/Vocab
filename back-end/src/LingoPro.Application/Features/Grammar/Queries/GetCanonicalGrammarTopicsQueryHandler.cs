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
        // public.grammar_topics has no cert_level, category or sort_order columns: the CertLevel filter is
        // not applicable (all topics are returned), CertLevel/Category are null/empty and SortOrder maps to order_index.
        var topics = await dbContext.GrammarTopics
            .AsNoTracking()
            .OrderBy(t => t.OrderIndex)
            .Select(t => new GrammarTopicDto(
                t.Id,
                t.Slug,
                t.Title,
                t.TitleVi,
                t.Level,
                null,
                string.Empty,
                t.OrderIndex ?? 0))
            .ToListAsync(ct);
        return ApiResponse<IReadOnlyList<GrammarTopicDto>>.Ok(topics, "Canonical grammar topics retrieved successfully.");
    }
}
