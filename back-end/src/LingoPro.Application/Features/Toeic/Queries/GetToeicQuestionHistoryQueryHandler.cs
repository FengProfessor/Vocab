using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Queries;

/// <summary>
/// Retrieves the authenticated user's TOEIC question attempt history optionally filtered by part number.
/// </summary>
public class GetToeicQuestionHistoryQueryHandler(
    ICurrentUserService currentUser,
    IExamRepository examRepository)
    : IRequestHandler<GetToeicQuestionHistoryQuery, ApiResponse<IReadOnlyList<ToeicQuestionHistoryItemDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<ToeicQuestionHistoryItemDto>>> Handle(
        GetToeicQuestionHistoryQuery request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var rows = await examRepository.GetToeicQuestionHistoryAsNoTrackingAsync(userId, request.PartNumber, ct);

        IReadOnlyList<ToeicQuestionHistoryItemDto> items = rows
            .Select(r => new ToeicQuestionHistoryItemDto(
                r.QuestionId,
                r.Part,
                r.LastAnsweredAt,
                r.IsCorrect,
                r.AttemptCount,
                r.SelectedOption))
            .ToList();

        return ApiResponse<IReadOnlyList<ToeicQuestionHistoryItemDto>>.Ok(
            items,
            "TOEIC question history retrieved successfully.");
    }
}
