namespace LingoPro.Application.Features.Toeic.Queries;

/// <summary>
/// Represents a single TOEIC practice question history record for cross-device synchronization.
/// </summary>
public record ToeicQuestionHistoryItemDto(
    string QuestionId,
    int Part,
    DateTime LastAnsweredAt,
    bool IsCorrect,
    int AttemptCount,
    string SelectedOption
);
