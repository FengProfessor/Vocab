using LingoPro.Domain.Enums;

namespace LingoPro.Domain.Algorithms;

/// <summary>
/// Pure domain FSRS v5 Spaced Repetition Scheduling Engine (UC-VOCAB-02 and UC-GRAM-09).
/// </summary>
public static class FsrsEngine
{
    private static readonly double[] DefaultWeights =
    [
        0.40255, 1.18385, 3.173, 15.69105,
        7.1949, 0.5345, 1.4604, 0.0046,
        1.54575, 0.1192, 1.01925, 1.9395,
        0.11, 0.29605, 2.2698, 0.2315,
        2.9898, 0.51655, 0.6621
    ];

    /// <summary>
    /// Maps a numeric recall quality score (0-5) to a strongly typed <see cref="SrsReviewQuality"/> enum.
    /// </summary>
    public static SrsReviewQuality MapQualityToRating(int quality) => quality switch
    {
        <= 1 => SrsReviewQuality.Again,
        2 or 3 => SrsReviewQuality.Hard,
        4 => SrsReviewQuality.Good,
        _ => SrsReviewQuality.Easy
    };

    /// <summary>
    /// Maps an exercise accuracy percentage (0-100) to a strongly typed <see cref="SrsReviewQuality"/> enum.
    /// </summary>
    public static SrsReviewQuality MapAccuracyToRating(double accuracyPercent) => accuracyPercent switch
    {
        >= 90.0 => SrsReviewQuality.Easy,
        >= 70.0 => SrsReviewQuality.Good,
        >= 50.0 => SrsReviewQuality.Hard,
        _ => SrsReviewQuality.Again
    };

    /// <summary>
    /// Calculates the next stability, difficulty, interval, and review date according to FSRS v5 formulas.
    /// </summary>
    public static FsrsCalculationResult ScheduleNext(
        FsrsCalculationInput current,
        SrsReviewQuality rating,
        DateTime nowUtc)
    {
        int ratingVal = rating switch
        {
            SrsReviewQuality.Again => 1,
            SrsReviewQuality.Hard => 2,
            SrsReviewQuality.Good => 3,
            SrsReviewQuality.Easy => 4,
            _ => 3
        };
        double stability = current.Stability;
        double difficulty = current.Difficulty;
        int reps = current.Reps;
        int lapses = current.Lapses;
        SrsCardState nextState;

        if (current.Reps == 0 || current.State == SrsCardState.New || stability <= 0)
        {
            stability = DefaultWeights[ratingVal - 1];
            difficulty = Math.Clamp(DefaultWeights[4] - Math.Exp(DefaultWeights[5] * (ratingVal - 1)) + 1.0, 1.0, 10.0);
            reps = 1;
            if (rating == SrsReviewQuality.Again)
            {
                lapses++;
                nextState = SrsCardState.Learning;
            }
            else
            {
                nextState = rating == SrsReviewQuality.Hard ? SrsCardState.Learning : SrsCardState.Review;
            }
        }
        else
        {
            reps++;
            double elapsedDays = current.LastReviewedAt.HasValue
                ? Math.Max(0.5, (nowUtc - current.LastReviewedAt.Value).TotalDays)
                : Math.Max(1.0, current.IntervalDays);

            double retrievability = Math.Pow(1.0 + elapsedDays / (9.0 * stability), -1.0);

            double deltaD = -DefaultWeights[6] * (ratingVal - 3.0);
            difficulty = Math.Clamp(difficulty + deltaD * ((10.0 - difficulty) / 9.0), 1.0, 10.0);

            if (rating == SrsReviewQuality.Again)
            {
                lapses++;
                nextState = SrsCardState.Relearning;
                stability = Math.Max(
                    0.2,
                    DefaultWeights[11]
                    * Math.Pow(difficulty, -DefaultWeights[12])
                    * (Math.Pow(stability + 1.0, DefaultWeights[13]) - 1.0)
                    * Math.Exp(DefaultWeights[14] * (1.0 - retrievability))
                );
            }
            else
            {
                nextState = SrsCardState.Review;
                double hardPenalty = rating == SrsReviewQuality.Hard ? DefaultWeights[15] : 1.0;
                double easyBonus = rating == SrsReviewQuality.Easy ? DefaultWeights[16] : 1.0;

                double factor = 1.0 + Math.Exp(DefaultWeights[8])
                    * (11.0 - difficulty)
                    * Math.Pow(stability, -DefaultWeights[9])
                    * (Math.Exp((1.0 - retrievability) * DefaultWeights[10]) - 1.0)
                    * hardPenalty
                    * easyBonus;

                stability = Math.Clamp(stability * factor, 0.5, 3650.0);
            }
        }

        int intervalDays = rating == SrsReviewQuality.Again
            ? 1
            : Math.Clamp((int)Math.Round(stability), 1, 365);

        int xpAwarded = rating switch
        {
            SrsReviewQuality.Again => 2,
            SrsReviewQuality.Hard => 5,
            SrsReviewQuality.Good => 10,
            SrsReviewQuality.Easy => 15,
            _ => 5
        };

        DateOnly today = DateOnly.FromDateTime(nowUtc);
        DateOnly nextReviewDate = rating == SrsReviewQuality.Again
            ? today
            : today.AddDays(intervalDays);

        return new FsrsCalculationResult(
            Math.Round(stability, 4),
            Math.Round(difficulty, 4),
            intervalDays,
            nextReviewDate,
            reps,
            lapses,
            nextState,
            xpAwarded
        );
    }
}
