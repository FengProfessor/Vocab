/**
 * TOEIC module types — Reading (Part 5, 6, 7) & Listening (Part 1-4 — Phase 2).
 * Dùng chung cho player, roadmap, và scoring.
 */

export type ToeicLevel = 'toeic-450' | 'toeic-650' | 'toeic-800';

// ── Part 5: Incomplete Sentences ──
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

// ── Part 6: Text Completion ──
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
  text: string;          // Passage with __(1)__ blanks
  blanks: ToeicPart6Blank[];
  topic: string;
}

// ── Part 7: Reading Comprehension ──
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

// ── Mini Test / Full Test ──
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

// ── Content artifact ──
export interface ToeicReadingContent {
  version: string;
  source: string;
  part5: ToeicPart5Item[];
  part6: ToeicPart6Item[];
  part7_single: ToeicPart7Item[];
  part7_double: ToeicPart7Item[];
  mini_test: ToeicMiniTest[];
}

// ── Flatten question (cho chấm điểm chung) ──
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
