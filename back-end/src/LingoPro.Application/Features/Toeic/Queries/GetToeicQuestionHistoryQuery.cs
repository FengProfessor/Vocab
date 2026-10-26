using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Queries;

/// <summary>
/// Query to retrieve the authenticated user's TOEIC question attempt history.
/// </summary>
[Authorize]
public record GetToeicQuestionHistoryQuery(int? PartNumber = null)
    : IRequest<ApiResponse<IReadOnlyList<ToeicQuestionHistoryItemDto>>>;
