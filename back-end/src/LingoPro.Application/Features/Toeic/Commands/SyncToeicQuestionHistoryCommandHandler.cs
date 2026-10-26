using LingoPro.Application.Common.Interfaces;
using LingoPro.Application.Common.Interfaces.Repositories;
using LingoPro.Application.Common.Models;
using LingoPro.Domain.Entities.Exam;
using MediatR;

namespace LingoPro.Application.Features.Toeic.Commands;

/// <summary>
/// Upserts a batch of TOEIC practice question history items for the authenticated user.
/// </summary>
public class SyncToeicQuestionHistoryCommandHandler(
    ICurrentUserService currentUser,
    IExamRepository examRepository) : IRequestHandler<SyncToeicQuestionHistoryCommand, ApiResponse<int>>
{
    public async Task<ApiResponse<int>> Handle(SyncToeicQuestionHistoryCommand request, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (request.Entries is null || request.Entries.Count == 0)
        {
            return ApiResponse<int>.Ok(0, "No TOEIC question history entries to synchronize.");
        }

        var entities = request.Entries
            .Where(e => !string.IsNullOrWhiteSpace(e.QuestionId))
            .Select(e => new UserToeicQuestionHistory
            {
                UserId = userId,
                QuestionId = e.QuestionId,
                Part = Math.Clamp(e.Part, 1, 7),
                LastAnsweredAt = e.LastAnsweredAt,
                IsCorrect = e.IsCorrect,
                AttemptCount = Math.Max(1, e.AttemptCount),
                SelectedOption = e.SelectedOption ?? string.Empty
            })
            .ToList();

        int count = await examRepository.UpsertToeicQuestionHistoryAsync(userId, entities, ct);
        if (count > 0)
        {
            await examRepository.SaveChangesAsync(ct);
        }

        return ApiResponse<int>.Ok(count, "TOEIC question history synchronized successfully.");
    }
}
