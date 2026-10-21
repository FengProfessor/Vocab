import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';

/**
 * Display definition of one VSTEP skill row.
 */
export interface VstepSkillDefinition {
  /** Key of the skill in the raw score object. */
  key: keyof VstepRawSkillScoresDto;
  /** Vietnamese label. */
  label: string;
}
