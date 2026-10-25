/**
 * Types for Reading Library & Article Ingestion Engine
 * CEFR A1-C2, 15 themes according to src/lib/pack-themes.ts
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ArticleSourceType =
  | 'vstep'
  | 'toeic'
  | 'voa'
  | 'race'
  | 'openstax'
  | 'custom';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ReadingClozeBlank {
  id: string;
  index: number;
  word: string;
  answer: string;
  options: string[];
  explain?: string;
}

export interface ReadingClozeData {
  text?: string;
  blanks: ReadingClozeBlank[];
}

export interface ReadingQuestion {
  id: string;
  type?: 'mcq' | 'detail' | 'main_idea' | 'vocab' | 'not_mentioned' | 'inference';
  question: string;
  options: string[];
  answer: number | string; // index 0-3 or 'A'|'B'|'C'|'D'
  explain?: string;
}

export interface ReadingVocabularyItem {
  word: string;
  pos?: string;
  meaning_vi: string;
  phonetic?: string;
  context_sentence?: string;
}

export interface ReadingPodcastMeta {
  duration_seconds?: number;
  format?: 'deep_dive' | 'brief' | 'critique' | 'debate';
  speakers?: string[];
  nlm_notebook_id?: string;
  nlm_audio_id?: string;
  audio_status?: 'ready' | 'generating' | 'failed';
  notes?: string;
}

export interface ReadingMindmapNode {
  id: string;
  label: string;
  details?: string;
  children?: ReadingMindmapNode[];
}

export interface ReadingMindmapData {
  title?: string;
  root?: ReadingMindmapNode;
  nodes?: Array<{ id: string; label: string; group?: string }>;
  edges?: Array<{ source: string; target: string; label?: string }>;
}

export interface ReadingArticle {
  id: string;
  slug: string;
  title: string;
  cefr_level: CEFRLevel;
  theme_id: string;
  passage: string;
  passage_plain: string;
  word_count: number;
  estimated_read_minutes: number;
  translation?: string | null;
  summary?: string | null;
  cloze: ReadingClozeData;
  questions: ReadingQuestion[];
  vocabulary_highlights: ReadingVocabularyItem[];
  audio_url?: string | null;
  podcast_meta?: ReadingPodcastMeta;
  mindmap_data?: ReadingMindmapData;
  source_type: ArticleSourceType;
  source_id?: string | null;
  source_metadata?: Record<string, unknown>;
  status: ArticleStatus;
  difficulty_score: number;
  created_at: string;
  updated_at: string;
}

export interface UserReadingLibraryProgress {
  id: string;
  user_id: string;
  article_id: string;
  status: 'in_progress' | 'completed' | 'bookmarked';
  is_bookmarked: boolean;
  read_count: number;
  last_read_at: string;
  reading_time_seconds: number;
  mcq_score: number;
  mcq_total: number;
  cloze_score: number;
  cloze_total: number;
  user_notes?: string | null;
  created_at: string;
  updated_at: string;
}
