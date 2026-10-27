using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Vocab.Queries;

/// <summary>
/// Query to retrieve real-time FSRS L1-L6 level counts, learning analytics KPIs, skill radar scores,
/// quiz accuracy history, weak word diagnostics, and filtered/paginated vocabulary items for the current user.
/// </summary>
[Authorize]
public sealed record GetVocabAnalyticsQuery(
    string? ClassroomId = null,
    int Limit = 500,
    int Offset = 0,
    string? Filter = null,
    string? SearchQuery = null,
    string? Sort = null,
    string? Ids = null
) : IRequest<ApiResponse<VocabAnalyticsDto>>;
