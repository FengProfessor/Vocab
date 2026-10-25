/**
 * LingoPro 3-Tier Speaking Curriculum & Ingestion Type System
 * File: src/types/speaking-curriculum.ts
 *
 * Provides complete TypeScript contracts for:
 * 1. 3-Tier Structured Curriculum (Phase 1 Beginner, Phase 2 Elementary, Phase 3 Intermediate)
 * 2. 4-Stage Pedagogical Flow (Phonetics -> Core Patterns -> Guided Dialogue -> SafeHarbor Evaluation)
 * 3. Standardized Multi-Source Ingestion (ELLLO, TalkEnglish, YouTube)
 * 4. Helper Type Guards and Phase Catalog Metadata
 */

// ── Common Identifier Types ──────────────────────────────────────────────────

/**
 * Valid Phase identifiers for the 3-Tier Curriculum.
 */
export type SpeakingPhaseId =
  | 'phase-1-beginner'
  | 'phase-2-elementary'
  | 'phase-3-intermediate';

/**
 * CEFR proficiency levels supported by the speaking engine.
 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

/**
 * Speaking Tier classification.
 */
export type SpeakingTier = 'beginner' | 'elementary' | 'intermediate';

/**
 * IELTS band target classifications for speaking modules.
 */
export type IeltsBandTarget = '0-3.0' | '3.0-5.0' | '5.0-6.5' | string;

/**
 * 4 Sequential Pedagogical Stages within each curriculum lesson.
 */
export type PedagogicalStageId =
  | 'stage-1-phonetics'
  | 'stage-2-core-patterns'
  | 'stage-3-dialogue'
  | 'stage-4-safeharbor';

// ── Stage 1: Phonetics Drill Contracts ────────────────────────────────────────

/**
 * Minimal pair item contrasting two easily confused English sounds for Vietnamese learners.
 */
export interface MinimalPairItem {
  wordA: string;
  wordB: string;
  ipaA: string;
  ipaB: string;
  meaningA: string;
  meaningB: string;
  distinctionVi?: string;
  audioUrlA?: string;
  audioUrlB?: string;
}

export type MinimalPairDrill = MinimalPairItem;

/**
 * Sentence-level phonetic practice item targeting specific mouth movements.
 */
export interface PhoneticPracticeSentence {
  sentence: string;
  phoneticTarget: string;
  vietnameseTranslation: string;
  audioUrl?: string;
}

/**
 * Video demonstration metadata (e.g. Rachel's English, Oxford Pronunciation).
 */
export interface VideoDemonstrationMeta {
  youtubeVideoId: string;
  channelName?: string;
  startSeconds: number;
  endSeconds: number;
  title?: string;
  mouthTipSummaryVi?: string;
}

/**
 * Stage 1: Warm-up & Phonetics Drill section contract.
 */
export interface PhoneticDrillSection {
  titleVi: string;
  focusSound: string;
  vietnameseContrastiveTip: string;
  minimalPairs: MinimalPairItem[];
  practiceSentences: PhoneticPracticeSentence[];
  phonemes?: string[];
  category?:
    | 'ending-consonants'
    | 'vowel-contrast'
    | 'consonant-clusters'
    | 'stress-linking'
    | string;
  descriptionVi?: string;
  mouthTipVi?: string;
  video?: VideoDemonstrationMeta;
  targetPracticeWords?: Array<{
    word: string;
    ipa: string;
    meaningVi: string;
    audioUrl?: string;
  }>;
}

// ── Stage 2: Core Patterns & Lexical Chunks Contracts ─────────────────────────

/**
 * Example substitution sentence for a Lego frame.
 */
export interface LegoSlotExample {
  en: string;
  vi: string;
  audioUrl?: string;
}

/**
 * Modular Lego slot configuration for rapid substitution reflexes (<1000ms).
 */
export interface LegoSlotItem {
  template: string;
  slots: Record<string, string[]>;
  examples: LegoSlotExample[];
}

/**
 * High-frequency contextual vocabulary item with part of speech and collocation tip.
 */
export interface HighFrequencyVocabItem {
  term: string;
  ipa?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | string;
  meaningVi: string;
  collocationHintVi?: string;
  exampleSentenceEn?: string;
  exampleSentenceVi?: string;
}

/**
 * Stage 2: Core Patterns & Lexical Chunks section contract.
 */
export interface CorePatternsSection {
  titleVi: string;
  vietnameseGrammarRule: string;
  formula: string;
  legoSlots: LegoSlotItem[];
  overviewVi?: string;
  highFrequencyVocab?: HighFrequencyVocabItem[];
}

// ── Stage 3: Guided Dialogue Contracts ────────────────────────────────────────

/**
 * Interactive dialogue turn between conversation partners.
 */
export interface GuidedDialogueTurn {
  speaker: 'A' | 'B' | 'Partner' | 'Learner' | string;
  en: string;
  vi: string;
  coreKeywords: string[];
  audioUrl?: string;
  ipa?: string;
  suggestedStartersVi?: string[];
}

/**
 * Stage 3: Guided Dialogue section contract.
 */
export interface GuidedDialogueSection {
  titleVi: string;
  contextVi: string;
  turns: GuidedDialogueTurn[];
  frameworkType?:
    | '3-beat'
    | 'prep'
    | 'peel'
    | '5w1h'
    | 'cue-card'
    | 'concession-debate'
    | string;
  frameworkData?: Record<string, unknown>;
}

// ── Stage 4: SafeHarbor Evaluation Contracts ──────────────────────────────────

/**
 * Stage 4: Non-punitive SafeHarbor evaluation section contract.
 */
export interface SafeHarborEvaluationSection {
  titleVi: string;
  promptVi: string;
  targetSentence: string;
  acceptableVariations: string[];
  coreKeywords: string[];
  minimumPassingScore: number;
  promptQuestionEn?: string;
  targetMeaningVi?: string;
  instructionsVi?: string;
  targetReflexLatencyMs?: number;
  audioModelUrl?: string;
}

// ── Master Speaking Curriculum Lesson Contract ────────────────────────────────

/**
 * Full Structured 4-Stage Speaking Curriculum Lesson.
 */
export interface SpeakingCurriculumLesson {
  id: string;
  phaseId: SpeakingPhaseId;
  order: number;
  titleEn: string;
  titleVi: string;
  cefrLevel: CefrLevel;
  targetBandIelts: string;
  estimatedMinutes: number;
  summaryVi: string;
  stage1Phonetics: PhoneticDrillSection;
  stage2CorePatterns: CorePatternsSection;
  stage3GuidedDialogue: GuidedDialogueSection;
  stage4SafeHarborEvaluation: SafeHarborEvaluationSection;
  slug?: string;
  category?:
    | 'daily_life'
    | 'social_chat'
    | 'workplace'
    | 'travel_culinary'
    | 'academic_debate'
    | string;
  learningObjectivesVi?: string[];
}

// ── Multi-Source Standardized Ingestion Contracts ─────────────────────────────

/**
 * Source platform for crawled/ingested lessons.
 */
export type IngestionSource = 'elllo' | 'talkenglish' | 'youtube' | 'curriculum';

/**
 * Standardized dialogue turn for ingested conversation audio.
 */
export interface StandardizedDialogueTurn {
  speaker: string;
  textEn: string;
  textVi?: string;
  audioUrl?: string;
  coreKeywords?: string[];
  startTime?: number;
  endTime?: number;
}

/**
 * Standardized vocabulary item extracted from external sources.
 */
export interface StandardizedVocabularyItem {
  term: string;
  ipa?: string;
  meaningVi: string;
  exampleEn?: string;
  exampleVi?: string;
}

/**
 * Standardized prompt-response reflex pair extracted from external sources.
 */
export interface StandardizedReflexPair {
  promptEn: string;
  promptVi?: string;
  responseEn: string;
  responseVi?: string;
  coreKeywords: string[];
  audioUrl?: string;
}

/**
 * Uniform schema for all ingested speaking lessons across ELLLO, TalkEnglish, and YouTube.
 */
export interface StandardizedSpeakingLesson {
  id: string;
  source: IngestionSource;
  title: string;
  cefrLevel: CefrLevel;
  topic: string;
  audioUrl?: string;
  slowAudioUrl?: string;
  turns: StandardizedDialogueTurn[];
  vocabulary: StandardizedVocabularyItem[];
  reflexPairs: StandardizedReflexPair[];
  qualityScore: number;
  crawledAt?: string;
  sourceUrl?: string;
  rawMetadata?: Record<string, unknown>;
}

// ── Curriculum Phase Catalog Metadata ────────────────────────────────────────

/**
 * Metadata configuration for UI phase navigation and badges.
 */
export interface PhaseMetadata {
  phaseId: SpeakingPhaseId;
  tier: SpeakingTier;
  cefrLevel: CefrLevel;
  ieltsRange: string;
  titleEn: string;
  titleVi: string;
  descriptionVi: string;
  totalLessons: number;
  badge: string;
  iconName: string;
  lessonIds?: string[];
}

/**
 * Production Phase Catalog configuration for the 3-Tier Roadmap.
 */
export const SPEAKING_PHASE_CONFIGS: Record<SpeakingPhaseId, PhaseMetadata> = {
  'phase-1-beginner': {
    phaseId: 'phase-1-beginner',
    tier: 'beginner',
    cefrLevel: 'A1',
    ieltsRange: '0-3.0',
    titleEn: 'Phase 1: Beginner Foundation',
    titleVi: 'Chặng 1: Nền tảng Cho Người Mất Gốc',
    descriptionVi:
      'Làm chủ phụ âm đuôi, cấu trúc câu sống còn và phản xạ khối Lego dưới 1 giây.',
    totalLessons: 12,
    badge: 'CEFR A1 / IELTS 0-3.0',
    iconName: 'Zap',
    lessonIds: [
      'p1-l01-self-introduction',
      'p1-l02-daily-routine',
      'p1-l03-ordering-food',
      'p1-l04-asking-directions',
      'p1-l05-shopping-prices',
      'p1-l06-family-friends',
      'p1-l07-hobbies-free-time',
      'p1-l08-weather-seasons',
      'p1-l09-telling-time-dates',
      'p1-l10-transport-travel',
      'p1-l11-health-feelings',
      'p1-l12-final-review-checkpoint',
    ],
  },
  'phase-2-elementary': {
    phaseId: 'phase-2-elementary',
    tier: 'elementary',
    cefrLevel: 'A2',
    ieltsRange: '3.0-5.0',
    titleEn: 'Phase 2: Elementary Expansion',
    titleVi: 'Chặng 2: Mở Rộng Diễn Đạt Đa Nhịp',
    descriptionVi:
      'Kéo dài câu nói 1-2 phút với PREP, PEEL, 5W1H và chuyên đề ẩm thực nấu ăn đời sống.',
    totalLessons: 10,
    badge: 'CEFR A2-B1 / IELTS 3.0-5.0',
    iconName: 'Flame',
    lessonIds: [
      'p2-l01-prep-structure-opinion',
      'p2-l02-peel-paragraph-argument',
      'p2-l03-5w1h-storytelling',
      'p2-l04-food-cooking-methods',
      'p2-l05-restaurant-critique',
      'p2-l06-discourse-connectors-addition',
      'p2-l07-contrast-concession-markers',
      'p2-l08-cause-effect-relationships',
      'p2-l09-workplace-meeting-updates',
      'p2-l10-intermediate-checkpoint',
    ],
  },
  'phase-3-intermediate': {
    phaseId: 'phase-3-intermediate',
    tier: 'intermediate',
    cefrLevel: 'B1',
    ieltsRange: '5.0-6.5',
    titleEn: 'Phase 3: Intermediate Mastery',
    titleVi: 'Chặng 3: Độc Thoại & Tranh Biện Học Thuật',
    descriptionVi:
      'Làm chủ IELTS Speaking Part 2 (độc thoại 2-3 phút) và Part 3 (tranh biện trừu tượng, nhượng bộ).',
    totalLessons: 10,
    badge: 'CEFR B1-B2 / IELTS 5.0-6.5',
    iconName: 'Award',
    lessonIds: [
      'p3-l01-ielts-part2-event-experience',
      'p3-l02-ielts-part2-person-influence',
      'p3-l03-ielts-part2-place-travel',
      'p3-l04-ielts-part2-object-possession',
      'p3-l05-ielts-part3-categorization',
      'p3-l06-ielts-part3-hypothetical-future',
      'p3-l07-ielts-part3-comparing-generations',
      'p3-l08-ielts-part3-abstract-evaluation',
      'p3-l09-ielts-part3-concession-counter',
      'p3-l10-advanced-mastery-checkpoint',
    ],
  },
};

// ── Type Guards & Validations ─────────────────────────────────────────────────

/**
 * Validates whether an unknown value is a valid SpeakingPhaseId.
 */
export function isSpeakingPhaseId(value: unknown): value is SpeakingPhaseId {
  return (
    typeof value === 'string' &&
    (value === 'phase-1-beginner' ||
      value === 'phase-2-elementary' ||
      value === 'phase-3-intermediate')
  );
}

/**
 * Validates whether an unknown value is a valid CefrLevel.
 */
export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === 'string' &&
    (value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2')
  );
}

/**
 * Type guard for SpeakingCurriculumLesson.
 */
export function isSpeakingCurriculumLesson(
  obj: unknown
): obj is SpeakingCurriculumLesson {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Partial<SpeakingCurriculumLesson>;
  return (
    typeof o.id === 'string' &&
    o.id.trim().length > 0 &&
    isSpeakingPhaseId(o.phaseId) &&
    typeof o.order === 'number' &&
    Number.isInteger(o.order) &&
    o.order > 0 &&
    typeof o.titleEn === 'string' &&
    o.titleEn.trim().length > 0 &&
    typeof o.titleVi === 'string' &&
    o.titleVi.trim().length > 0 &&
    isCefrLevel(o.cefrLevel) &&
    typeof o.targetBandIelts === 'string' &&
    typeof o.estimatedMinutes === 'number' &&
    o.estimatedMinutes > 0 &&
    typeof o.summaryVi === 'string' &&
    Boolean(
      o.stage1Phonetics &&
      typeof o.stage1Phonetics === 'object' &&
      typeof o.stage1Phonetics.focusSound === 'string' &&
      o.stage1Phonetics.focusSound.trim().length > 0
    ) &&
    Boolean(
      o.stage2CorePatterns &&
      typeof o.stage2CorePatterns === 'object' &&
      typeof o.stage2CorePatterns.formula === 'string' &&
      o.stage2CorePatterns.formula.trim().length > 0
    ) &&
    Boolean(
      o.stage3GuidedDialogue &&
      typeof o.stage3GuidedDialogue === 'object' &&
      Array.isArray(o.stage3GuidedDialogue.turns)
    ) &&
    Boolean(
      o.stage4SafeHarborEvaluation &&
      typeof o.stage4SafeHarborEvaluation === 'object' &&
      typeof o.stage4SafeHarborEvaluation.targetSentence === 'string' &&
      o.stage4SafeHarborEvaluation.targetSentence.trim().length > 0 &&
      typeof o.stage4SafeHarborEvaluation.minimumPassingScore === 'number' &&
      o.stage4SafeHarborEvaluation.minimumPassingScore >= 0 &&
      o.stage4SafeHarborEvaluation.minimumPassingScore <= 100
    )
  );
}

/**
 * Type guard for StandardizedSpeakingLesson.
 */
export function isStandardizedSpeakingLesson(
  obj: unknown
): obj is StandardizedSpeakingLesson {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Partial<StandardizedSpeakingLesson>;
  return (
    typeof o.id === 'string' &&
    typeof o.source === 'string' &&
    typeof o.title === 'string' &&
    isCefrLevel(o.cefrLevel) &&
    typeof o.topic === 'string' &&
    Array.isArray(o.turns) &&
    Array.isArray(o.vocabulary) &&
    Array.isArray(o.reflexPairs) &&
    typeof o.qualityScore === 'number'
  );
}
