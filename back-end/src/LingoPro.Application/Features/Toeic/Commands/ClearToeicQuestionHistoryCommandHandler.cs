using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Commands;

/// <summary>
/// Deletes the authenticated user's TOEIC question attempt history rows matching the optional part or question ID filters.
/// </summary>
public class ClearToeicQuestionHistoryCommandHandler(
    ICurrentUserService currentUser,
    IExamRepository examRepository) : IRequestHandler<ClearToeicQuestionHistoryCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(ClearToeicQuestionHistoryCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        int deletedCount = await examRepository.DeleteToeicQuestionHistoryAsync(
            userId,
            request.PartNumber,
            request.QuestionIds,
            ct);

        if (deletedCount > 0)
        {
            await examRepository.SaveChangesAsync(ct);
        }

        return ApiResponse<int>.Ok(deletedCount, "TOEIC question history cleared successfully.");
    }
}
