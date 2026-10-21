import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';
import { VstepScoreResultDto } from '@/types/exam/VstepScoreResultDto';

/**
 * Props for the VstepScoreSliders component.
 */
export interface VstepScoreSlidersProps {
  /** The four raw skill scores (0..10). */
  scores: VstepRawSkillScoresDto;
  /** Official breakdown derived from the scores (rounded score, CEFR band, summary). */
  result: VstepScoreResultDto;
  /** Updates one skill score. */
  onChangeScore: (skill: keyof VstepRawSkillScoresDto, value: number) => void;
}
