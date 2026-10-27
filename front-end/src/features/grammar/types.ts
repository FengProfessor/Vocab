/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CertLevel,
  GrammarDifficultyLevel,
  GrammarLevel as DotNetGrammarLevel,
  GrammarMicroStage,
  SrsCardState,
} from '@/types/enums';

export type GrammarLevel = 'beginner' | 'intermediate' | 'advanced';
export type GrammarExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction' | 'categorization';

export interface GrammarExercise {
  id: string;
  classroom_id: string;
  topic: string;
  level: GrammarLevel;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  type?: GrammarExerciseType;
  difficulty?: number; // 1=easy, 2=medium, 3=hard
  lesson_id?: string | null;
  created_by?: string;
  created_at: string;
  distractor_breakdowns?: any[];
  categories?: { name: string; items: string[] }[];
}

export interface GrammarResult {
  id: string;
  user_id: string;
  exercise_id: string;
  chosen_answer: string;
  is_correct: boolean;
  time_taken_ms?: number;
  completed_at: string;
}

export interface GrammarTopic {
  id: string;
  slug: string;
  title: string;
  title_vi?: string;
  level: GrammarLevel;
  order_index: number;
  parent_id?: string | null;
  created_at: string;
  // joined
  lessons?: GrammarLesson[];
  lessonCount?: number;
}

export interface GrammarExample {
  en: string;
  vi?: string;
  note?: string;
  annotations?: import('@/components/grammar/GrammarHighlight').WordAnnotation[];
}

export interface GrammarLesson {
  id: string;
  topic_id: string;
  title: string;
  theory?: string;
  theory_vi?: string;
  examples: GrammarExample[];
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  source?: string;
  source_url?: string;
  order_index: number;
  created_by?: string;
  created_at: string;
  sections?: GrammarSections | null;
  exercises?: GrammarExerciseItem[] | null;
  // joined
  topic?: GrammarTopic;
}

/** Golden Lesson — nội dung có cấu trúc (render section-cards). */
export interface GrammarSections {
  definition?: string;
  usage?: { icon?: string; label?: string; en?: string; vi?: string }[];
  formula?: { rows?: Record<string, string>[]; note?: string };
  rules?: { case?: string; rule?: string; example?: string }[];
  signals?: string[];
  examples?: GrammarExample[];
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  tips?: string;
  comparison?: string;
  timeline?: { caption?: string; points?: { label?: string; note?: string }[] } | null;
  wordbanks?: {
    title: string;
    icon?: string;
    note?: string;
    rows: Record<string, string>[];
  }[];
  bigQuestion?: string;
  outcome?: string;
  cheatSheetHtml?: string;
  videoUrl?: string;
  contrastPairs?: { good?: string; bad?: string }[];
  traps?: string[];
  legoSlots?: { pattern: string; slots: Record<string, string[]> }[];
  dialogues?: { speaker: string; en: string; vi?: string }[][];
  safeHarbor?: { vi: string; en: string; hint?: string }[];
}

export interface GrammarExerciseItem {
  type: 'mcq' | 'fill' | 'tf' | 'error' | 'multiple_choice' | 'fill_blank' | 'error_correction';
  q?: string;
  opts?: string[];
  answer?: string | string[] | boolean;
  fb?: string;
  question?: string;
  options?: string[];
  correct_answer?: string | string[] | boolean;
  explanation?: string;
}

export interface GrammarProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  stability: number;
  difficulty: number;
  interval_days: number;
  review_count: number;
  next_review_date: string;
  last_reviewed_at?: string;
  state: string;
  mastery_score: number;
}

export interface GrammarProgressDto {
  topicSlug: string;
  masteryScore: number;
  state: SrsCardState | string;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string;
  xpAwarded: number;
}

export interface GrammarTopicDto {
  id: string;
  title: string;
  formula: string;
  explanationVi: string;
  level: DotNetGrammarLevel;
  difficulty: GrammarDifficultyLevel;
  currentStage: GrammarMicroStage;
  masteryPercent: number;
}

export interface ServerGrammarTopicDto {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  level: DotNetGrammarLevel | string;
  certLevel: CertLevel | string;
  category: string;
  sortOrder: number;
}

export interface SubmitGrammarProgressParams {
  topicSlug: string;
  accuracyPercent: number;
}
