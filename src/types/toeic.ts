/**
 * TOEIC module types — Reading (Part 5, 6, 7) & Listening (Part 1-4).
 * Dùng chung cho exam simulation, player, roadmap, scoring, và test loader.
 */

// ── Legacy Types (Preserved for backwards compatibility with roadmap & mini-test) ──

export type ToeicLevel = 'toeic-450' | 'toeic-650' | 'toeic-800';

// Part 5: Incomplete Sentences
export interface ToeicPart5Item {
  id: string;
  setId: string;
  level: ToeicLevel;
  question: string;
  options: string[];    // ["(A) by", "(B) until", "(C) from", "(D) since"]
  answer: string;       // "A"
  explain: string;      // Giải thích tiếng Việt
  skill: string;        // "grammar" | "vocabulary" | "prepositions" | ...
  topic: string;        // "workplace" | "travel" | "finance" | ...
}

// Part 6: Text Completion
export interface ToeicPart6Blank {
  index: number;
  options: string[];
  answer: string;
  explain: string;
}

export interface ToeicPart6Item {
  id: string;
  setId: string;
  level: ToeicLevel;
  title: string;        // "Company Memo" | "Email" | "Notice" | ...
  text: string;         // Passage with __(1)__ blanks
  blanks: ToeicPart6Blank[];
  topic: string;
}

// Part 7: Reading Comprehension
export interface ToeicPart7Question {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

export interface ToeicPart7Item {
  id: string;
  setId: string;
  level: ToeicLevel;
  title: string;
  passageType: string;   // "email" | "advertisement" | "article" | "notice" | "text_chain"
  passage: string;       // Single passage (hoặc multi-passage dùng passages[])
  passages?: string[];   // Double/triple passage
  questions: ToeicPart7Question[];
  topic: string;
}

// Mini Test / Section
export interface ToeicMiniTestSection {
  part: 'part5' | 'part6' | 'part7_single' | 'part7_double';
  ids: string[];
}

export interface ToeicMiniTest {
  id: string;
  level: ToeicLevel;
  title: string;
  timeMinutes: number;
  sections: ToeicMiniTestSection[];
}

// Content artifact
export interface ToeicReadingContent {
  version: string;
  source: string;
  part5: ToeicPart5Item[];
  part6: ToeicPart6Item[];
  part7_single: ToeicPart7Item[];
  part7_double: ToeicPart7Item[];
  mini_test: ToeicMiniTest[];
}

// Flatten question (cho chấm điểm legacy)
export interface ToeicFlatQ {
  id: string;
  part: 'part5' | 'part6' | 'part7';
  /** Ngữ cảnh / passage (nếu có) */
  context?: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

// ── Authentic TOEIC Exam Architecture Types (Parts 1-7, 200 Questions) ──

export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ToeicPartId =
  | 'part1'
  | 'part2'
  | 'part3'
  | 'part4'
  | 'part5'
  | 'part6'
  | 'part7';

export type ToeicSection = 'listening' | 'reading';

export type ToeicOptionKey = 'A' | 'B' | 'C' | 'D';

export interface ToeicQuestionOption {
  key: ToeicOptionKey;
  text: string;
}

/**
 * Normalized 200-question item format.
 * Unified envelope for Split-Pane rendering and Question Palette.
 */
export interface ToeicUnifiedQuestion {
  id: string;
  testId: string;
  questionNumber: number; // 1 to 200 (or part practice question number)
  part: ToeicPart;
  section: ToeicSection;
  prompt?: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  explanationVi?: string;
  transcript?: string;
}

/**
 * Sanitized question delivered to client before submission.
 * Completely stripped of sensitive keys (correctAnswer, explanationVi, transcript).
 */
export type ToeicSanitizedQuestion = Omit<
  ToeicUnifiedQuestion,
  'correctAnswer' | 'explanationVi' | 'transcript'
>;

/**
 * Client question envelope: sanitized before submit, enriched with master key on submit.
 */
export type ToeicClientQuestion = ToeicSanitizedQuestion & {
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanationVi?: string;
  transcript?: string;
};

export interface ToeicTestApiResponse {
  success: boolean;
  testId: string;
  title: string;
  durationSeconds: number;
  totalQuestions: number;
  questions: ToeicSanitizedQuestion[];
  sessionToken?: string;
  error?: string;
}

export interface ToeicSubmitApiRequest {
  testId: string;
  examMode: ToeicExamMode;
  part?: ToeicPart;
  limit?: number;
  answers: Record<number, ToeicOptionKey>;
  timeSpentSeconds: number;
  honeypot?: string;
  _hp_trap?: string;
  _hp_author_code?: string;
}

export interface ToeicSubmitApiResponse {
  success: boolean;
  scoreResult?: ToeicScoreResult;
  reviewQuestions?: ToeicUnifiedQuestion[];
  savedToHistory?: boolean;
  isGuest?: boolean;
  error?: string;
}

export type ToeicCefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ToeicAccuracyRating = 'high' | 'medium' | 'low';

export interface ToeicPartStat {
  part: ToeicPart;
  total: number;
  correct: number;
  percentage: number;
  accuracyRating?: ToeicAccuracyRating;
}

/**
 * Score Result containing official scaled score (10-990), raw counts,
 * Part 1-7 accuracy metrics, and CEFR alignment.
 */
export interface ToeicScoreResult {
  rawListening: number; // 0 to 100
  rawReading: number;    // 0 to 100
  rawTotal: number;      // 0 to 200
  scaledListening: number; // 5 to 495
  scaledReading: number;   // 5 to 495
  scaledTotal: number;     // 10 to 990
  cefrLevel: ToeicCefrLevel;
  partStats: Record<ToeicPart, ToeicPartStat>;
  timeSpentSeconds: number;
}

export type ToeicExamMode =
  | 'real'
  | 'practice'
  | 'full_simulation'
  | 'practice_part';

export type ToeicQuestionVisualState =
  | 'unanswered' // Not answered yet
  | 'answered'   // Answered
  | 'current'    // Currently active/viewing
  | 'flagged';   // Flagged for review

/**
 * Real-time session state for TOEIC exam simulation.
 * Supports localStorage autosave and disaster recovery.
 */
export interface ToeicExamSessionState {
  testId: string;
  title?: string;
  mode: ToeicExamMode;
  totalQuestions: number;
  timeRemainingSeconds: number;
  isPaused: boolean;
  isSubmitted: boolean;
  currentQuestionIndex: number; // 0 to totalQuestions - 1
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>; // Key: questionNumber (1..200)
  flaggedQuestions: Record<number, boolean>;      // Key: questionNumber
  scoreResult?: ToeicScoreResult;
  startedAt?: string;
  submittedAt?: string;
}

export interface ToeicTestMetadata {
  testId: string;
  title: string;
  questionCount: number;
  timeLimitMinutes?: number;
}
