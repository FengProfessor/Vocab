using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using LingoPro.Application.Features.Toeic.Queries;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Commands;

/// <summary>
/// Command to synchronize a batch of TOEIC practice question history items for the authenticated user.
/// </summary>
[Authorize]
public record SyncToeicQuestionHistoryCommand(
    IReadOnlyList<ToeicQuestionHistoryItemDto> Entries) : IRequest<ApiResponse<int>>;
