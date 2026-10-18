import { ToeicScoreReportDto } from '@/types/exam/ToeicScoreReportDto';

/**
 * Official ETS TOEIC Listening raw-to-scaled conversion table (0..100 correct -> 5..495 points).
 */
const LISTENING_BAREM_TABLE: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 10, 15, 20,          // 0-9
  25, 30, 35, 40, 45, 50, 55, 60, 65, 70,    // 10-19
  75, 80, 85, 90, 95, 100, 110, 115, 120, 125, // 20-29
  130, 135, 140, 145, 150, 160, 165, 170, 175, 180, // 30-39
  185, 190, 195, 200, 210, 215, 220, 230, 240, 245, // 40-49
  250, 255, 260, 270, 275, 280, 290, 295, 300, 310, // 50-59
  315, 320, 325, 330, 340, 345, 350, 360, 365, 370, // 60-69
  380, 385, 390, 395, 400, 405, 410, 420, 425, 430, // 70-79
  440, 445, 450, 455, 460, 465, 470, 475, 480, 485, // 80-89
  490, 495, 495, 495, 495, 495, 495, 495, 495, 495, // 90-99
  495,                                              // 100
];

/**
 * Official ETS TOEIC Reading raw-to-scaled conversion table (0..100 correct -> 5..495 points).
 */
const READING_BAREM_TABLE: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5,             // 0-9
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55,    // 10-19
  60, 65, 70, 75, 80, 90, 95, 100, 110, 115, // 20-29
  120, 125, 130, 140, 145, 150, 160, 165, 170, 175, // 30-39
  180, 190, 195, 200, 210, 215, 220, 225, 230, 240, // 40-49
  245, 250, 260, 265, 270, 275, 280, 290, 295, 300, // 50-59
  310, 315, 320, 325, 330, 335, 340, 350, 355, 360, // 60-69
  365, 370, 380, 385, 390, 395, 400, 405, 410, 415, // 70-79
  420, 425, 430, 435, 440, 450, 455, 460, 465, 470, // 80-89
  475, 480, 485, 490, 490, 495, 495, 495, 495, 495, // 90-99
  495,                                              // 100
];

/**
 * Pure domain calculator for ETS TOEIC 2-Skill (Listening & Reading) 990-scale scoring.
 * Migrated from legacy src/lib/toeic-barem.ts.
 */
export class ToeicBaremCalculator {
  /**
   * Converts raw Listening correct answers (out of totalQuestions) to the 5..495 scaled score.
   */
  public static rawToScaledListening(correct: number, totalQuestions: number = 100): number {
    if (totalQuestions <= 0) {
      return 5;
    }
    const normalized = Math.round((correct / totalQuestions) * 100);
    const index = Math.max(0, Math.min(100, normalized));
    return LISTENING_BAREM_TABLE[index];
  }

  /**
   * Converts raw Reading correct answers (out of totalQuestions) to the 5..495 scaled score.
   */
  public static rawToScaledReading(correct: number, totalQuestions: number = 100): number {
    if (totalQuestions <= 0) {
      return 5;
    }
    const normalized = Math.round((correct / totalQuestions) * 100);
    const index = Math.max(0, Math.min(100, normalized));
    return READING_BAREM_TABLE[index];
  }

  /**
   * Maps a total TOEIC scaled score (10..990) to its equivalent CEFR band descriptor.
   */
  public static mapTotalScoreToCefrBand(totalScaled: number): string {
    if (totalScaled >= 945) {
      return 'C1 (Proficiency)';
    }
    if (totalScaled >= 785) {
      return 'B2 (Upper-Intermediate)';
    }
    if (totalScaled >= 550) {
      return 'B1 (Intermediate)';
    }
    if (totalScaled >= 225) {
      return 'A2 (Elementary)';
    }
    return 'A1 (Beginner)';
  }

  /**
   * Generates a complete TOEIC score report from Listening and Reading raw counts.
   */
  public static calculateReport(
    listeningRaw: number,
    readingRaw: number,
    listeningTotal: number = 100,
    readingTotal: number = 100
  ): ToeicScoreReportDto {
    const listeningScaled = ToeicBaremCalculator.rawToScaledListening(
      listeningRaw,
      listeningTotal
    );
    const readingScaled = ToeicBaremCalculator.rawToScaledReading(readingRaw, readingTotal);
    const totalScaled = listeningScaled + readingScaled;

    return {
      listeningRaw,
      readingRaw,
      listeningScaled,
      readingScaled,
      totalScaled,
      cefrBand: ToeicBaremCalculator.mapTotalScoreToCefrBand(totalScaled),
    };
  }
}
