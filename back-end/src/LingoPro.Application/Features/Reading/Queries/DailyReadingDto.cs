using LingoPro.Domain.Enums;

namespace LingoPro.Application.Features.Reading.Queries;

/// <summary>
/// Represents a daily reading exercise passage and quiz items.
/// </summary>
public record DailyReadingDto(
    Guid Id,
    DateOnly ExerciseDate,
    string Title,
    string PassageContent,
    CertLevel CertLevel,
    string UsedWordsJson,
    string McqQuestionsJson,
    string ClozeItemsJson,
    bool IsCompletedToday
);
