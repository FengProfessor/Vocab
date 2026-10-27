using LingoPro.Application.Common.Models;
using LingoPro.Application.Common.Security;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Commands;

/// <summary>
/// Command to clear the authenticated user's TOEIC question attempt history, optionally scoped by part number or question IDs.
/// </summary>
[Authorize]
public record ClearToeicQuestionHistoryCommand(
    int? PartNumber = null,
    IReadOnlyList<string>? QuestionIds = null) : IRequest<ApiResponse<int>>;
