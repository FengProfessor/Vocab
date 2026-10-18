import { SrsAlgorithmVersion } from '@/types/enums/SrsAlgorithmVersion';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { SrsCardScheduleDto } from '@/types/vocab/SrsCardScheduleDto';
import { SrsReviewResultDto } from '@/types/vocab/SrsReviewResultDto';

/**
 * Default FSRS v5 19-parameter weight vector calibrated on 700M+ flashcard reviews.
 */
const FSRS_V5_WEIGHTS: readonly number[] = [
  0.40255, // w0: initial stability for Again (grade 1)
  1.18385, // w1: initial stability for Hard (grade 2)
  3.173,   // w2: initial stability for Good (grade 3)
  15.69105, // w3: initial stability for Easy (grade 4)
  7.1949,  // w4: initial difficulty base
  0.5345,  // w5: initial difficulty grade slope
  1.4604,  // w6: difficulty update delta
  0.0046,  // w7: difficulty mean reversion weight
  1.54575, // w8: stability recall growth factor
  0.1192,  // w9: stability saturation decay exponent
  1.01925, // w10: retrievability boost coefficient
  1.9395,  // w11: post-lapse stability base
  0.11,    // w12: post-lapse difficulty penalty exponent
  0.29605, // w13: post-lapse stability retention exponent
  2.2698,  // w14: post-lapse retrievability exponent
  0.2315,  // w15: Hard interval penalty multiplier
  2.9898,  // w16: Easy interval bonus multiplier
  0.51655, // w17: short-term stability growth slope
  0.6621,  // w18: short-term stability grade offset
];

/** Target recall probability (90% retention). */
const REQUESTED_RETENTION = 0.9;

/** FSRS v5 power-law forgetting curve decay constant. */
const FSRS_DECAY = -0.5;

/** FSRS v5 power-law factor: 0.9^(1 / -0.5) - 1 = 19 / 81. */
const FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1;

/** Maximum interval cap in days (1 year). */
const MAX_INTERVAL_DAYS = 365;

/**
 * Pure domain service implementing the FSRS v5 (Free Spaced Repetition Scheduler) engine.
 * Migrated from the legacy LingoPro SRS library with strict TypeScript types and Business Enums.
 */
export class FsrsEngine {
  /**
   * Clamps a numeric value to the inclusive [min, max] range.
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Computes the probability of recall R(t, S) after elapsedDays given stability S.
   * Formula: R(t, S) = (1 + FACTOR * t / S)^DECAY
   */
  public static computeRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) {
      return 0;
    }
    if (elapsedDays <= 0) {
      return 1;
    }
    return Math.pow(1 + (FSRS_FACTOR * elapsedDays) / stability, FSRS_DECAY);
  }

  /**
   * Converts memory stability S into the next integer review interval (in days) for target retention R_req.
   */
  private static nextIntervalDays(stability: number): number {
    if (stability <= 0) {
      return 1;
    }
    const raw =
      (stability / FSRS_FACTOR) * (Math.pow(REQUESTED_RETENTION, 1 / FSRS_DECAY) - 1);
    return FsrsEngine.clamp(Math.round(raw), 1, MAX_INTERVAL_DAYS);
  }

  /**
   * Maps a 0-5 SM-2 review quality enum to the 4-point FSRS grade (1=Again, 2=Hard, 3=Good, 4=Easy).
   */
  private static mapQualityToFsrsGrade(quality: SrsReviewQuality): 1 | 2 | 3 | 4 {
    if (quality <= SrsReviewQuality.Again) {
      return 1;
    }
    if (quality === SrsReviewQuality.Hard) {
      return 2;
    }
    if (quality === SrsReviewQuality.Good) {
      return 3;
    }
    return 4;
  }

  /**
   * Computes initial stability S_0(G) for a first-time review of grade G in {1, 2, 3, 4}.
   */
  private static initStability(grade: 1 | 2 | 3 | 4): number {
    return Math.max(0.1, FSRS_V5_WEIGHTS[grade - 1]);
  }

  /**
   * Computes initial difficulty D_0(G) clamped to [1, 10].
   */
  private static initDifficulty(grade: 1 | 2 | 3 | 4): number {
    const raw = FSRS_V5_WEIGHTS[4] - Math.exp(FSRS_V5_WEIGHTS[5] * (grade - 1)) + 1;
    return FsrsEngine.clamp(raw, 1, 10);
  }

  /**
   * Updates difficulty D'(D, G) with mean reversion toward D_0(4).
   */
  private static nextDifficulty(difficulty: number, grade: 1 | 2 | 3 | 4): number {
    const deltaD = -FSRS_V5_WEIGHTS[6] * (grade - 3);
    const damped = difficulty + (deltaD * (10 - difficulty)) / 9;
    const d0Easy = FsrsEngine.initDifficulty(4);
    const reverted = FSRS_V5_WEIGHTS[7] * d0Easy + (1 - FSRS_V5_WEIGHTS[7]) * damped;
    return FsrsEngine.clamp(reverted, 1, 10);
  }

  /**
   * Updates stability during same-day or short-term learning steps.
   */
  private static shortTermStability(stability: number, grade: 1 | 2 | 3 | 4): number {
    const growth = Math.exp(
      FSRS_V5_WEIGHTS[17] * (grade - 3 + FSRS_V5_WEIGHTS[18])
    );
    return Math.max(0.1, stability * growth);
  }

  /**
   * Computes post-recall stability S'_r(D, S, R, G) for G in {2, 3, 4}.
   */
  private static nextRecallStability(
    difficulty: number,
    stability: number,
    retrievability: number,
    grade: 2 | 3 | 4
  ): number {
    const hardPenalty = grade === 2 ? FSRS_V5_WEIGHTS[15] : 1;
    const easyBonus = grade === 4 ? FSRS_V5_WEIGHTS[16] : 1;
    const growth =
      Math.exp(FSRS_V5_WEIGHTS[8]) *
      (11 - difficulty) *
      Math.pow(stability, -FSRS_V5_WEIGHTS[9]) *
      (Math.exp((1 - retrievability) * FSRS_V5_WEIGHTS[10]) - 1) *
      hardPenalty *
      easyBonus;

    return Math.max(0.1, stability * (1 + growth));
  }

  /**
   * Computes post-lapse stability S'_f(D, S, R) when a review card is forgotten (Again).
   */
  private static nextForgetStability(
    difficulty: number,
    stability: number,
    retrievability: number
  ): number {
    const raw =
      FSRS_V5_WEIGHTS[11] *
      Math.pow(difficulty, -FSRS_V5_WEIGHTS[12]) *
      (Math.pow(stability + 1, FSRS_V5_WEIGHTS[13]) - 1) *
      Math.exp((1 - retrievability) * FSRS_V5_WEIGHTS[14]);

    return FsrsEngine.clamp(raw, 0.1, stability);
  }

  /**
   * Calculates the next FSRS v5 schedule for a flashcard given the user's review quality.
   */
  public static calculateNextReview(
    quality: SrsReviewQuality,
    current: Partial<SrsCardScheduleDto> = {},
    nowMs: number = Date.now()
  ): SrsReviewResultDto {
    const grade = FsrsEngine.mapQualityToFsrsGrade(quality);
    const prevRepetitions = current.repetitions ?? 0;
    const prevInterval = current.intervalDays ?? 0;
    const prevLapses = current.lapses ?? 0;
    const prevState = current.state ?? (prevRepetitions === 0 ? SrsCardState.New : SrsCardState.Review);

    // Bootstrap FSRS v5 parameters from legacy SM-2 values when migrating existing cards
    const prevStability =
      current.stability && current.stability > 0
        ? current.stability
        : prevInterval > 0
          ? prevInterval
          : 0;

    const prevDifficulty =
      current.difficulty && current.difficulty > 0
        ? FsrsEngine.clamp(current.difficulty, 1, 10)
        : current.easeFactor
          ? FsrsEngine.clamp(11 - (current.easeFactor - 1.3) * 5, 1, 10)
          : 0;

    let elapsedDays = prevInterval;
    if (current.lastReviewedAt) {
      const lastMs = new Date(current.lastReviewedAt).getTime();
      if (!Number.isNaN(lastMs) && nowMs > lastMs) {
        elapsedDays = Math.max(0, (nowMs - lastMs) / (1000 * 60 * 60 * 24));
      }
    }

    let stability: number;
    let difficulty: number;
    let state: SrsCardState;
    let repetitions: number;
    let lapses = prevLapses;
    let intervalDays: number;
    let retrievability: number;

    if (prevState === SrsCardState.New || prevStability <= 0) {
      stability = FsrsEngine.initStability(grade);
      difficulty = FsrsEngine.initDifficulty(grade);
      retrievability = 1;

      if (grade === 1) {
        state = SrsCardState.Learning;
        repetitions = 0;
        intervalDays = 0;
      } else if (grade === 2) {
        state = SrsCardState.Learning;
        repetitions = 1;
        intervalDays = 1;
      } else {
        state = SrsCardState.Review;
        repetitions = 1;
        intervalDays = FsrsEngine.nextIntervalDays(stability);
      }
    } else if (prevState === SrsCardState.Learning || prevState === SrsCardState.Relearning) {
      difficulty = FsrsEngine.nextDifficulty(prevDifficulty || 5, grade);
      stability = FsrsEngine.shortTermStability(prevStability, grade);
      retrievability = FsrsEngine.computeRetrievability(Math.max(0.01, elapsedDays), prevStability);

      if (grade === 1) {
        state = prevState;
        repetitions = 0;
        intervalDays = 0;
      } else {
        state = SrsCardState.Review;
        repetitions = prevRepetitions + 1;
        intervalDays = FsrsEngine.nextIntervalDays(stability);
      }
    } else {
      retrievability = FsrsEngine.computeRetrievability(Math.max(0.1, elapsedDays), prevStability);
      difficulty = FsrsEngine.nextDifficulty(prevDifficulty || 5, grade);

      if (grade === 1) {
        stability = FsrsEngine.nextForgetStability(difficulty, prevStability, retrievability);
        state = SrsCardState.Relearning;
        repetitions = 0;
        lapses = prevLapses + 1;
        intervalDays = 1;
      } else {
        stability = FsrsEngine.nextRecallStability(
          difficulty,
          prevStability,
          retrievability,
          grade
        );
        state = SrsCardState.Review;
        repetitions = prevRepetitions + 1;
        intervalDays = Math.max(1, FsrsEngine.nextIntervalDays(stability));
      }
    }

    const nextDate = new Date(nowMs);
    if (intervalDays === 0) {
      // Learning step: schedule 10 minutes ahead for immediate in-session reinforcement
      nextDate.setMinutes(nextDate.getMinutes() + 10);
    } else {
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    // Derive legacy easeFactor in [1.3, 3.0] for backward compatibility
    const derivedEaseFactor = Number(
      FsrsEngine.clamp(3.0 - ((difficulty - 1) / 9) * 1.7, 1.3, 3.0).toFixed(2)
    );

    return {
      intervalDays,
      repetitions,
      easeFactor: derivedEaseFactor,
      stability: Number(stability.toFixed(4)),
      difficulty: Number(difficulty.toFixed(4)),
      lapses,
      state,
      retrievability: Number(retrievability.toFixed(4)),
      nextReviewAt: nextDate.toISOString(),
      lastReviewedAt: new Date(nowMs).toISOString(),
      algorithmVersion: SrsAlgorithmVersion.TsFsrs,
    };
  }

  /**
   * Returns a human-readable Vietnamese preview label for the next interval of a given quality rating.
   */
  public static getIntervalPreviewLabel(
    quality: SrsReviewQuality,
    current: Partial<SrsCardScheduleDto> = {}
  ): string {
    const result = FsrsEngine.calculateNextReview(quality, current);
    if (result.intervalDays === 0) {
      return '10 phút';
    }
    if (result.intervalDays === 1) {
      return '1 ngày';
    }
    if (result.intervalDays < 30) {
      return `${result.intervalDays} ngày`;
    }
    if (result.intervalDays < 365) {
      return `${Math.round(result.intervalDays / 30)} tháng`;
    }
    return '1 năm';
  }

  /**
   * Determines whether a card is currently due for review.
   */
  public static isDueForReview(nextReviewAt: string | null | undefined): boolean {
    if (!nextReviewAt) {
      return true;
    }
    return new Date(nextReviewAt).getTime() <= Date.now();
  }

  /**
   * Computes a normalized mastery percentage (0..100%) based on FSRS stability and repetitions.
   */
  public static getStrengthPercent(
    repetitions: number,
    easeFactor: number,
    stability?: number
  ): number {
    if (repetitions === 0) {
      return 0;
    }
    if (stability && stability > 0) {
      const score = (Math.log10(stability + 1) / Math.log10(91)) * 100;
      return Math.min(100, Math.round(score));
    }
    const repScore = Math.min(repetitions / 8, 1) * 70;
    const efScore = ((easeFactor - 1.3) / (2.5 - 1.3)) * 30;
    return Math.min(100, Math.round(repScore + efScore));
  }
}
