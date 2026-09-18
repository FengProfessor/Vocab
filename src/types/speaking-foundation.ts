/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * File: src/types/speaking-foundation.ts
 *
 * Comprehensive TypeScript contracts for all 4 learning stages:
 * - Stage 0: Articulation & Reflex Phonetics (Minimal Pairs, Ending Sounds, Rhythm & Linking)
 * - Stage 1: Invariant Survival Sentence Frames (Zero-conjugation formulas)
 * - Stage 2: Modular Lego Slot Substitution (<1s reflex automation)
 * - Stage 3: 3-Beat Breath Expansion & Authentic Micro-Dialogues
 * - Engine Evaluation: SafeHarbor non-punitive scoring contracts
 */

import type { RachelVideoMeta } from '@/types/pronunciation';

// ── Common Stage Identifiers ──────────────────────────────────────────────────
export type SpeakingStageId = 'stage-0' | 'stage-1' | 'stage-2' | 'stage-3';

// ── Stage 0: Phonetics & Mouth Articulation ───────────────────────────────────
export interface Stage0VideoMeta {
  youtubeVideoId: string;
  channelName: string; // Typically "Rachel's English"
  startSeconds: number;
  endSeconds: number;
  title: string;
  videoTip?: string;
  mouthTipSummary?: string;
}

export interface PracticeWord {
  word: string;
  ipa: string;
  meaningVi: string;
  audioUrl?: string;
}

export interface MinimalPair {
  wordA: string;
  ipaA: string;
  wordB: string;
  ipaB: string;
  distinctionVi: string;
}

export interface Stage0PhoneticLesson {
  id: string;
  title: string;
  phonemes: string[];
  category: 'vowel-pairs' | 'consonant-pairs' | 'ending-sounds' | 'stress-linking';
  descriptionVi: string;
  mouthTipVi: string;
  video: Stage0VideoMeta;
  practiceWords: PracticeWord[];
  minimalPairs?: MinimalPair[];
}

// ── Stage 1: Invariant Survival Frames ────────────────────────────────────────
export type SurvivalDomainId =
  | 'fnb'
  | 'shopping'
  | 'directions'
  | 'hotel'
  | 'workplace'
  | 'emergency'
  | 'fillers';

export interface SurvivalFrameSlot {
  key: string;
  labelVi: string;
  options: string[];
}

export interface SurvivalFrameExemplar {
  sentence: string;
  meaningVi: string;
  coreKeywords: string[];
  ipa?: string;
  audioUrl?: string;
}

export interface SurvivalFrame {
  id: string;
  domain: SurvivalDomainId;
  domainNameVi: string;
  template: string; // e.g. "Can I have a {item}, please?"
  meaningVi: string;
  phoneticTipVi: string;
  slots: SurvivalFrameSlot[];
  exemplars: SurvivalFrameExemplar[];
}

// Backward-compatible alias for explorer sketches
export interface Stage1SentenceFrame extends SurvivalFrame {
  category?: 'dining' | 'shopping' | 'directions' | 'hotel' | 'workplace' | 'emergency' | 'fillers';
  titleVi?: string;
  targetSentence?: string;
  vietnameseMeaning?: string;
  invariantFrame?: string;
  pronunciationNotesVi?: string;
}

// ── Stage 2: Lego Slot Substitution ───────────────────────────────────────────
export interface LegoBrick {
  value: string;
  meaningVi: string;
  ipa?: string;
  icon?: string;
}

export interface LegoSlot {
  slotKey: string;
  slotLabelVi: string;
  bricks: LegoBrick[];
}

export interface LegoSlotLesson {
  id: string;
  title: string;
  baseFrame: string; // e.g. "I need {item} for {reason}"
  meaningVi: string;
  slots: LegoSlot[];
  targetReflexMs: number; // e.g. 1000ms
  phoneticTipVi?: string;
}

// Backward-compatible alias for explorer sketches
export interface Stage2LegoDrill {
  id: string;
  titleVi: string;
  baseSentenceTemplate: string;
  category: string;
  slots: Array<{
    slotKey: string;
    labelVi: string;
    options: Array<{
      valueEn: string;
      meaningVi: string;
      keywords: string[];
    }>;
  }>;
}

// ── Stage 3: 3-Beat Breath Expansion ──────────────────────────────────────────
export interface BeatUnit {
  en: string;
  vi: string;
  ipa?: string;
}

export interface ThreeBeatExpansionItem {
  id: string;
  topic: string;
  topicVi: string;
  beat1Core: BeatUnit;
  beat2Context: BeatUnit;
  beat3EmotionReason: BeatUnit;
  fullSentence: string;
  fullMeaningVi: string;
  coreKeywords: string[];
  phoneticTipVi?: string;
}

// ── Stage 3: Micro-Dialogues ──────────────────────────────────────────────────
export interface DialogueTurn {
  speaker: 'Partner' | 'Learner';
  textEn: string;
  textVi: string;
  ipa?: string;
  coreKeywords?: string[];
}

export interface MicroDialogue {
  id: string;
  scenario: string;
  scenarioVi: string;
  contextVi?: string;
  turns: DialogueTurn[];
}

// Backward-compatible alias
export interface Stage3ThreeBeatDialogue {
  id: string;
  scenarioTitleVi: string;
  contextDescriptionVi: string;
  partnerPromptEn: string;
  partnerPromptVi: string;
  partnerAudioUrl?: string;
  studentResponse: {
    fullSentenceEn: string;
    beat1Core: { en: string; vi: string; keywords: string[] };
    beat2Context: { en: string; vi: string; keywords: string[] };
    beat3EmotionReason: { en: string; vi: string; keywords: string[] };
  };
}

// ── Safe Harbor Evaluation Contracts ─────────────────────────────────────────
export interface SafeHarborResult {
  score: number; // 0 to 100
  passed: boolean; // score >= 75
  tier: 'excellent' | 'safe_pass' | 'getting_closer' | 'warm_retry';
  feedbackVi: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  normalizedSpoken: string;
  normalizedTarget: string;
}

export interface SafeHarborEvaluationResult {
  rawTranscript: string;
  cleanedTranscript: string;
  targetSentence: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  ignoredWords: string[];
  keywordRecall: number; // 0.0 - 1.0
  sequenceSimilarity: number; // 0.0 - 1.0
  finalScore: number; // 0 - 100
  passed: boolean;
  status: 'excellent' | 'safe_pass' | 'encouragement' | 'retry';
  feedbackTitleVi: string;
  feedbackMessageVi: string;
  tokenFeedback: Array<{
    word: string;
    isKeyword: boolean;
    isIgnored: boolean;
    status: 'matched' | 'fuzzy' | 'missed' | 'function_word';
  }>;
}

// ── Aggregated Dataset Statistics ─────────────────────────────────────────────
export interface SpeakingStats {
  totalPhoneticLessons: number;
  totalSurvivalFrames: number;
  totalDomains: number;
  totalLegoLessons: number;
  totalExpansions: number;
  totalMicroDialogues: number;
  totalPracticeWords: number;
  totalMinimalPairs: number;
}
