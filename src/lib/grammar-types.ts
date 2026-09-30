/**
 * Unified Grammar Curriculum & Interactive Practice TypeScript Interfaces
 * Conforms strictly to PROJECT.md interface contracts and CEFR A0–B2 progression.
 */

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';

export interface VettedMediaAsset {
  imageUrl: string;
  imageAlt: string;
  caption: string;
  usageAnalysisVi: {
    rule: string;
    contextReason: string;
    commonMistake?: string;
  };
  videoEmbedUrl?: string;
  videoTitle?: string;
  videoVettedSource?: string;
}

export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction' | 'categorization';

export interface DistractorBreakdown {
  option: string;
  isCorrect: boolean;
  pedagogicalReason: string;
}

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard' | 1 | 2 | 3;

export interface UnifiedGrammarExercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[]; // for multiple_choice, error_correction & categorization
  categories?: { name: string; items: string[] }[]; // for categorization
  correct_answer: string | string[];
  explanation: string; // Master explanation
  distractor_breakdowns?: DistractorBreakdown[];
  difficulty: ExerciseDifficulty;
}

export interface UnifiedGrammarTopicMeta {
  slug: string;
  title: string;
  title_vi: string;
  level: CefrLevel;
  order: number;
}

export interface UnifiedGrammarLesson {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  order_index: number;
  stage: string;
  estimated_minutes: number;
  summary: string;
  core_theory: {
    definition: string;
    formula?: string;
    rules: { title: string; explanation: string; example: string }[];
    bilingual_examples: { en: string; vi: string; note?: string }[];
    comparison_table?: { headers: string[]; rows: string[][] };
  };
  media: VettedMediaAsset;
  exercises: UnifiedGrammarExercise[];
}
