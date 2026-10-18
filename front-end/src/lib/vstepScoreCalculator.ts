import { CertLevel } from '@/types/enums/CertLevel';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';
import { VstepScoreResultDto } from '@/types/exam/VstepScoreResultDto';

/**
 * Pure domain calculator for the Vietnamese Standardized Test of English Proficiency (VSTEP.3-5).
 * Implements the official Ministry of Education and Training 10-point scale with 0.5-increment rounding:
 * - Decimal < 0.25 -> rounds down to .0
 * - Decimal in [0.25, 0.75) -> rounds to .5
 * - Decimal >= 0.75 -> rounds up to next integer .0
 * Migrated from legacy src/lib/vstep-scoring.ts.
 */
export class VstepScoreCalculator {
  /**
   * Rounds a raw average score to the nearest 0.5 increment per official VSTEP grading rules.
   */
  public static roundToHalfIncrement(score: number): number {
    const clamped = Math.max(0, Math.min(10, score));
    const integerPart = Math.floor(clamped);
    const decimalPart = clamped - integerPart;

    if (decimalPart < 0.25) {
      return integerPart;
    }
    if (decimalPart < 0.75) {
      return integerPart + 0.5;
    }
    return Math.min(10, integerPart + 1.0);
  }

  /**
   * Maps a rounded VSTEP 10-point overall score to the official B1 / B2 / C1 certification band.
   * - < 4.0: BELOW_B1
   * - 4.0 - 5.5: B1
   * - 6.0 - 8.0: B2
   * - 8.5 - 10.0: C1
   */
  public static mapScoreToCertLevel(roundedScore: number): CertLevel | 'BELOW_B1' {
    if (roundedScore >= 8.5) {
      return CertLevel.C1;
    }
    if (roundedScore >= 6.0) {
      return CertLevel.B2;
    }
    if (roundedScore >= 4.0) {
      return CertLevel.B1;
    }
    return 'BELOW_B1';
  }

  /**
   * Calculates the complete VSTEP 4-skill score breakdown and certification level.
   */
  public static calculateResult(rawScores: VstepRawSkillScoresDto): VstepScoreResultDto {
    const listening = Number(Math.max(0, Math.min(10, rawScores.listening)).toFixed(1));
    const reading = Number(Math.max(0, Math.min(10, rawScores.reading)).toFixed(1));
    const writing = Number(Math.max(0, Math.min(10, rawScores.writing)).toFixed(1));
    const speaking = Number(Math.max(0, Math.min(10, rawScores.speaking)).toFixed(1));

    const rawAverage = Number(((listening + reading + writing + speaking) / 4).toFixed(2));
    const overallScore = VstepScoreCalculator.roundToHalfIncrement(rawAverage);
    const achievedLevel = VstepScoreCalculator.mapScoreToCertLevel(overallScore);

    let summaryVi = 'Chưa đạt ngưỡng B1 (4.0). Cần củng cố thêm nền tảng từ vựng và nghe hiểu.';
    if (achievedLevel === CertLevel.C1) {
      summaryVi = 'Xuất sắc! Bạn đạt chuẩn VSTEP Bậc 5 (C1) theo khung năng lực ngoại ngữ 6 bậc.';
    } else if (achievedLevel === CertLevel.B2) {
      summaryVi = 'Rất tốt! Bạn đạt chuẩn VSTEP Bậc 4 (B2) đủ điều kiện đầu ra chuẩn cao học & doanh nghiệp.';
    } else if (achievedLevel === CertLevel.B1) {
      summaryVi = 'Đạt chuẩn VSTEP Bậc 3 (B1) — hoàn thành yêu cầu chuẩn đầu ra đại học.';
    }

    return {
      skillScores: { listening, reading, writing, speaking },
      rawAverage,
      overallScore,
      achievedLevel,
      summaryVi,
    };
  }
}
