using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Vocab;

/// <summary>
/// Query to fetch the current user's due vocabulary cards.
/// Note: Intentionally does NOT implement ICacheableQuery because SRS due queues mutate on every card review.
/// </summary>
public record GetDueWordsQuery(int Limit = 50) : IRequest<ApiResponse<IReadOnlyList<WordWithSrsDto>>>;
