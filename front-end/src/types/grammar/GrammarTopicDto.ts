import { GrammarDifficultyLevel } from '@/types/enums/GrammarDifficultyLevel';
import { GrammarLevel } from '@/types/enums/GrammarLevel';
import { GrammarMicroStage } from '@/types/enums/GrammarMicroStage';

/**
 * Represents an interactive grammar module and its micro-learning stage progression.
 */
export interface GrammarTopicDto {
  /** Unique grammar topic identifier. */
  id: string;

  /** Title of the grammar structure. */
  title: string;

  /** Core grammatical formula or pattern. */
  formula: string;

  /** Concise Vietnamese explanation of usage and common traps. */
  explanationVi: string;

  /** Target proficiency level. */
  level: GrammarLevel;

  /** Relative exercise difficulty. */
  difficulty: GrammarDifficultyLevel;

  /** Current micro-learning stage for the user. */
  currentStage: GrammarMicroStage;

  /** Mastery percentage (0..100). */
  masteryPercent: number;
}
