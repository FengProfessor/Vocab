using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Grammar.Queries;

/// <summary>
/// Retrieves the canonical CEFR grammar topics ordered by curriculum sequence from the database.
/// </summary>
public class GetCanonicalGrammarTopicsQueryHandler(IGrammarRepository grammarRepository)
    : IRequestHandler<GetCanonicalGrammarTopicsQuery, ApiResponse<IReadOnlyList<GrammarTopicDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<GrammarTopicDto>>> Handle(
        GetCanonicalGrammarTopicsQuery request,
        CancellationToken ct)
    {
        var topics = await grammarRepository.GetCanonicalTopicsAsync(ct);
        return ApiResponse<IReadOnlyList<GrammarTopicDto>>.Ok(topics, "Canonical grammar topics retrieved successfully.");
    }
}
