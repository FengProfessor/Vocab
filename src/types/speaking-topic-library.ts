/**
 * LingoPro Speaking Topic Library Type System
 * File: src/types/speaking-topic-library.ts
 *
 * Lightweight contracts for the browse-by-topic speaking practice library.
 * Unlike the 4-stage curriculum lessons, topic library items are designed for:
 * - Horizontal browsing: users explore freely across topics at the same level
 * - AI Tutor integration: each item provides a system prompt for roleplay
 * - Real-life coverage: 300+ sub-topics across all daily life scenarios
 *
 * 4 major categories:
 * 1. describing — Miêu tả đồ vật, tranh ảnh, người, cảnh, thời tiết
 * 2. daily_situations — Tình huống hàng ngày: nhà thuốc, ngân hàng, siêu thị...
 * 3. social — Giao tiếp xã hội: small talk, xin lỗi, mời, kể chuyện...
 * 4. workplace_extended — Mở rộng công sở: onboarding, handover, networking...
 */

// ── Category & Level Types ───────────────────────────────────────────────────

/**
 * Top-level categories for the topic library.
 */
export type TopicLibraryCategory =
  | 'describing'
  | 'daily_situations'
  | 'social'
  | 'workplace_extended';

/**
 * Human-readable Vietnamese labels for each category.
 */
export const TOPIC_LIBRARY_CATEGORY_LABELS: Record<TopicLibraryCategory, string> = {
  describing: 'Miêu tả & Mô tả',
  daily_situations: 'Tình huống Hàng ngày',
  social: 'Giao tiếp Xã hội',
  workplace_extended: 'Công sở Mở rộng',
};

/**
 * Icons for each category.
 */
export const TOPIC_LIBRARY_CATEGORY_ICONS: Record<TopicLibraryCategory, string> = {
  describing: '🖼️',
  daily_situations: '🏪',
  social: '💬',
  workplace_extended: '🏢',
};

/**
 * CEFR proficiency levels for topic library items.
 */
export type TopicLibraryCefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

// ── Vocabulary & Dialogue Types ──────────────────────────────────────────────

/**
 * Bilingual action phrase / verb associated with a vocabulary item.
 * Supports visual scaffolding and communicative reflex practice (e.g., wallet -> take out money).
 */
export interface TopicAssociatedAction {
  /** English action phrase / verb (e.g. 'take out money', 'turn on the laptop') */
  en: string;
  /** Vietnamese translation of the action phrase (e.g. 'lấy tiền ra', 'bật máy tính xách tay') */
  vi: string;
}

/**
 * Ergonomic alias for TopicAssociatedAction.
 */
export type AssociatedAction = TopicAssociatedAction;

/**
 * Vocabulary item for a topic library sub-topic.
 */
export interface TopicVocabItem {
  /** English term or phrase */
  term: string;
  /** IPA pronunciation */
  ipa: string;
  /** Part of speech */
  partOfSpeech: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'idiom' | string;
  /** Vietnamese meaning */
  meaningVi: string;
  /** Example sentence in English */
  exampleEn: string;
  /** Example sentence in Vietnamese */
  exampleVi: string;
  /**
   * Common action phrases/verbs associated with this vocabulary item (EN-VI).
   * Used for action-based reflex drills and communicative speaking practice.
   * Example: For 'wallet' -> [{ en: 'take out money', vi: 'lấy tiền ra' }, { en: 'keep cards', vi: 'cất giữ thẻ' }]
   */
  associatedActions?: TopicAssociatedAction[];
  /**
   * High-quality stock photo URL (e.g., Unsplash) for visual scaffolding.
   */
  imageUrl?: string;
}

/**
 * A single dialogue turn in a sample conversation.
 */
export interface TopicDialogueTurn {
  /** Speaker identifier: 'A' (native/partner) or 'B' (learner) */
  speaker: 'A' | 'B' | string;
  [key: string]: string | undefined;
}

// ── Core Topic Library Item ──────────────────────────────────────────────────

/**
 * A single sub-topic in the speaking topic library.
 * Lightweight compared to SpeakingCurriculumLesson — no 4-stage pedagogy.
 * Designed for AI tutor roleplay and horizontal browsing.
 */
export interface TopicLibraryItem {
  /** Unique ID, e.g. 'desc-obj-01', 'daily-pharmacy-02' */
  id: string;

  /** Top-level category */
  category: TopicLibraryCategory;

  /** Subcategory slug, e.g. 'objects-around-me', 'at-the-pharmacy' */
  subcategory: string;

  /** CEFR difficulty level */
  level: TopicLibraryCefrLevel;

  /** English title */
  titleEn: string;

  /** Vietnamese title */
  titleVi: string;

  /** Emoji icon for UI display */
  icon: string;

  /** Vietnamese description of the situation/context (2-3 sentences) */
  situationVi: string;

  /** Sample dialogue (4-6 turns) showing natural conversation flow */
  sampleDialogue: TopicDialogueTurn[];

  /** Key vocabulary items (5-8 per sub-topic) */
  keyVocabulary: TopicVocabItem[];

  /** Useful phrases / sentence patterns the learner should practice */
  usefulPhrases: (string | { [key: string]: string | undefined })[];

  /** System prompt for AI tutor when this topic is selected */
  aiTutorPrompt: string;

  /** Optional tags for cross-referencing and search */
  tags?: string[];

  /**
   * Optional representative scene / cover image URL (e.g. Unsplash) for the overall topic scenario.
   * Feeds directly into VisualStimulus.imageUrl in SpeakingStimulusPane.
   */
  imageUrl?: string;
}

// ── Subcategory Metadata ─────────────────────────────────────────────────────

/**
 * Metadata for a subcategory group within a category.
 */
export interface TopicSubcategoryMeta {
  /** Subcategory slug, matches TopicLibraryItem.subcategory */
  slug: string;

  /** Vietnamese display name */
  labelVi: string;

  /** English display name */
  labelEn: string;

  /** Icon */
  icon: string;

  /** Brief description */
  descriptionVi: string;

  /** Number of items in this subcategory */
  itemCount: number;

  /** CEFR range covered */
  levelRange: [TopicLibraryCefrLevel, TopicLibraryCefrLevel];
}

// ── Aggregation & Query Helpers ──────────────────────────────────────────────

/**
 * Stats summary for the entire topic library or a category.
 */
export interface TopicLibraryStats {
  total: number;
  byCategory: Record<TopicLibraryCategory, number>;
  byLevel: Record<TopicLibraryCefrLevel, number>;
  subcategoryCount: number;
}

// ── Ergonomic Semantic Aliases ───────────────────────────────────────────────
export type VocabularyItem = TopicVocabItem;
export type Vocabulary = TopicVocabItem;
export type TopicVocabulary = TopicVocabItem;
export type Topic = TopicLibraryItem;
export type SubTopic = TopicLibraryItem;

