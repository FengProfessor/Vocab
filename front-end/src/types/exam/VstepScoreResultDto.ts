import { CertLevel } from '@/types/enums/CertLevel';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';

/**
 * Represents the official VSTEP 4-skill score breakdown and CEFR certification mapping.
 */
export interface VstepScoreResultDto {
  /** Individual skill scores rounded to 1 decimal place. */
  skillScores: VstepRawSkillScoresDto;

  /** Raw arithmetic mean of the 4 skills before 0.5-step rounding. */
  rawAverage: number;

  /** Final official VSTEP overall score rounded to the nearest 0.5 increment (0.0..10.0). */
  overallScore: number;

  /** Mapped VSTEP certification level (Below B1, B1, B2, or C1). */
  achievedLevel: CertLevel | 'BELOW_B1';

  /** Vietnamese summary feedback of the exam performance. */
  summaryVi: string;
}
