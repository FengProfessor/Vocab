/**
 * Listening Module Type Definitions
 * Supporting Interactive Video Listening (R2, R3, R4)
 */

export type DurationCategory = 'short' | 'medium';
export type DurationFilter = 'all' | DurationCategory;

export type CEFRLevel = 'A2' | 'B1' | 'B2';
export type LevelFilter = 'all' | CEFRLevel;

export type ListeningTopic =
  | 'daily_life'            // 1. Daily Life & Routine
  | 'social_conversations' // 2. Social Conversations & Small Talk
  | 'workplace'            // 3. Workplace & Career
  | 'travel'               // 4. Travel & Transit
  | 'food_shopping'        // 5. Food, Shopping & Services
  | 'science_tech_health'  // 6. Science, Tech & Health
  | 'culture'              // 7. Culture, TED Talks & Stories
  | 'social_stories';      // Legacy alias for culture

export type TopicFilter = 'all' | ListeningTopic;

export interface ListeningVideoIndexItem {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;
  durationDisplay: string;
  durationCategory: DurationCategory;
  cefrLevel: CEFRLevel;
  topic: ListeningTopic;
  topicDisplay: string;
  thumbnailUrl: string;
  description: string;
  coreVocabularyPreview: string[];
  coreVocabularyCount: number;
  transcriptCuesCount: number;
  clozeCount: number;
  quizCount: number;
}

export type SubtitleDisplayMode = 'bilingual' | 'en_only' | 'hidden';

export interface TranscriptCue {
  id: string;
  start: number; // in seconds (e.g. 12.45)
  end: number;   // in seconds (e.g. 16.80)
  en: string;    // English transcript text
  vi: string;    // Vietnamese translation text
}

export interface CoreVocabulary {
  word: string;
  phonetic: string;        // IPA notation (e.g. "/ˌkɒnvəˈseɪʃn/")
  viDefinition: string;   // Vietnamese meaning
  contextSentence: string;// Contextual example sentence
}

// Backwards-compatibility alias
export type CoreVocabularyItem = CoreVocabulary;

export interface ClozeItem {
  id: string;
  cueId: string;
  sentence: string;        // Sentence containing "{{blank}}" placeholder
  blankWord: string;       // Target word to fill in
  hintVi: string;          // Vietnamese meaning or grammar hint
  timestamp: number;       // Timestamp in seconds to replay audio snippet
  options?: string[];      // Multiple choice options for tap/select mode
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];       // 4 multiple choice options
  correctIndex: number;    // 0, 1, 2, or 3
  explanation: string;     // Bilingual explanation of why this is correct
  timestampSeek: number;   // In seconds, seeks to the evidence clue in the video
}

export interface ListeningVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;        // in seconds
  durationDisplay: string; // e.g. "06:14"
  durationCategory: DurationCategory; // 'short' (>180s & <=600s) | 'medium' (>600s & <=1500s)
  cefrLevel: CEFRLevel;    // 'A2' | 'B1' | 'B2'
  topic: ListeningTopic;
  topicDisplay: string;    // Localized display name (e.g. "Đời sống hàng ngày")
  thumbnailUrl: string;
  description: string;
  coreVocabulary: CoreVocabulary[];
  transcript: TranscriptCue[];
  clozeItems: ClozeItem[];
  comprehensionQuestions: ComprehensionQuestion[];
  // Optional convenience object matching component hierarchies
  exercises?: {
    clozeItems: ClozeItem[];
    comprehensionQuestions: ComprehensionQuestion[];
  };
}

export interface VideoFilterState {
  duration: DurationFilter;
  topic: TopicFilter;
  level: LevelFilter;
  searchQuery?: string;
}

export interface ListeningAttempt {
  videoId: string;
  completedAt: string;
  clozeScore: number;
  clozeTotal: number;
  quizScore: number;
  quizTotal: number;
  percentScore: number;
}
