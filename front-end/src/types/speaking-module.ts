/**
 * LingoPro Speaking Module Type System
 * File: src/types/speaking-module.ts
 *
 * Core architectural contracts for the LingoPro Speaking Subsystem:
 * 1. Progressive 3-Stage Learning Path (aligned with 229 topics in topic-library)
 * 2. Visual & Audio Stimulus Contracts (Left Pane)
 * 3. Speaking Prompt & Evaluation Criteria Contracts (Right Pane)
 * 4. Audio Upload Payload & API Response Contracts
 * 5. Minimalist Split-Pane UI Component Prop Contracts
 */

import type { ReactNode } from 'react';
import type {
  TopicLibraryCategory,
  TopicLibraryCefrLevel,
  TopicVocabItem,
} from './speaking-topic-library';

// ============================================================================
// 1. PROGRESSIVE 3-STAGE LEARNING PATH CONTRACTS
// ============================================================================

/**
 * 3-Stage Progressive Learning Path Identifiers:
 * - stage-1-survival: IELTS 0-3.0 (CEFR A1) Foundation — Survival frames, naming, simple visual description
 * - stage-2-conversational: IELTS 3.0-5.0 (CEFR A2-B1) Expansion — Multi-beat sentences, PREP framework, daily & social dialogues
 * - stage-3-debate: IELTS 5.0-6.5 (CEFR B1-B2) Mastery — 2-minute monologue, abstract debate, workplace reasoning & concession
 */
export type SpeakingStageId =
  | 'stage-1-survival'
  | 'stage-2-conversational'
  | 'stage-3-debate';

/** Shorthand alias for convenience */
export type SpeakingStageShortId = 'stage-1' | 'stage-2' | 'stage-3';

export type SpeakingIeltsBand = '0-3.0' | '3.0-5.0' | '5.0-6.5';

export interface SpeakingStageMetadata {
  id: SpeakingStageId;
  shortId: SpeakingStageShortId;
  band: SpeakingIeltsBand;
  cefrLevel: TopicLibraryCefrLevel;
  titleEn: string;
  titleVi: string;
  descriptionVi: string;
  pedagogicalObjectivesVi: string[];
  recommendedLatencyMs: number;
  passingScoreThreshold: number;
  topicCategories: TopicLibraryCategory[];
  alignedTopicsCount: number;
  keyTechniquesVi: string[];
}

/**
 * Master registry mapping all 3 speaking stages to their curriculum metadata,
 * aligned with the 229 topics in the Topic Library:
 * - Stage 1 (0-3.0): 10 describing topics + basic daily situations (A1)
 * - Stage 2 (3.0-5.0): 103 daily situation topics + 68 social communication topics (A2-B1)
 * - Stage 3 (5.0-6.5): 48 workplace extended topics + advanced social debate topics (B1-B2)
 */
export const SPEAKING_STAGE_REGISTRY: Record<SpeakingStageId, SpeakingStageMetadata> = {
  'stage-1-survival': {
    id: 'stage-1-survival',
    shortId: 'stage-1',
    band: '0-3.0',
    cefrLevel: 'A1',
    titleEn: 'Stage 1: Survival & Naming (0 - 3.0)',
    titleVi: 'Chặng 1: Nền tảng Phản xạ Sinh tồn & Miêu tả',
    descriptionVi:
      'Làm quen với phát âm phụ âm cuối, miêu tả đồ vật, tranh ảnh đơn giản và bật ra khung câu sinh tồn bất biến dưới 1.5 giây.',
    pedagogicalObjectivesVi: [
      'Phát âm chuẩn xác phụ âm cuối (/s, z/, /ed/, /m, n, ŋ/) và nguyên âm ngắn/dài',
      'Bật phản xạ miêu tả tranh ảnh và vật thể thường nhật với cấu trúc "There is/are", "I can see"',
      'Phản xạ câu đơn không ngập ngừng quá 1.5 giây',
    ],
    recommendedLatencyMs: 1500,
    passingScoreThreshold: 70,
    topicCategories: ['describing'],
    alignedTopicsCount: 10,
    keyTechniquesVi: [
      'Lego Slot Substitution (thay thế từ khóa trong khung mẫu)',
      'Phát âm tương phản Minimal Pairs',
      'Khung câu sinh tồn SafeHarbor',
    ],
  },
  'stage-2-conversational': {
    id: 'stage-2-conversational',
    shortId: 'stage-2',
    band: '3.0-5.0',
    cefrLevel: 'A2',
    titleEn: 'Stage 2: Conversational Expansion (3.0 - 5.0)',
    titleVi: 'Chặng 2: Mở rộng Hội thoại Đa nhịp',
    descriptionVi:
      'Kéo dài câu trả lời từ 1-2 phút theo mô hình PREP, tự tin làm chủ các tình huống giao tiếp đời sống hàng ngày tại ngân hàng, nhà thuốc, siêu thị.',
    pedagogicalObjectivesVi: [
      'Kéo dài câu nói bằng liên từ nối ý tự nhiên (because, although, furthermore, however)',
      'Áp dụng linh hoạt cấu trúc PREP (Point - Reason - Example - Point) và 5W1H',
      'Duy trì độ trôi chảy trong đoạn hội thoại 4-6 lượt nói',
    ],
    recommendedLatencyMs: 2500,
    passingScoreThreshold: 75,
    topicCategories: ['daily_situations', 'social'],
    alignedTopicsCount: 171, // 103 daily + 68 social
    keyTechniquesVi: [
      'Mô hình PREP & PEEL trả lời mở rộng',
      'Kỹ thuật mua thêm thời gian suy nghĩ (Filler phrases: Well, frankly speaking...)',
      'Hội thoại hai chiều tự nhiên',
    ],
  },
  'stage-3-debate': {
    id: 'stage-3-debate',
    shortId: 'stage-3',
    band: '5.0-6.5',
    cefrLevel: 'B1',
    titleEn: 'Stage 3: Debate & Academic Monologue (5.0 - 6.5)',
    titleVi: 'Chặng 3: Độc thoại IELTS & Tranh biện Công sở',
    descriptionVi:
      'Làm chủ độc thoại 2 phút bám sát IELTS Part 2 (Cue Card Mindmap) và tranh biện trừu tượng, nhượng bộ phản biện IELTS Part 3 và công sở mở rộng.',
    pedagogicalObjectivesVi: [
      'Thực hiện bài nói độc thoại liền mạch 2-3 phút theo sơ đồ tư duy thời gian',
      'Bảo vệ quan điểm, lập luận đa chiều và đưa ra lý lẽ nhượng bộ (concession and counter-argument)',
      'Sử dụng ngôn từ học thuật và diễn đạt tự nhiên trong môi trường làm việc quốc tế',
    ],
    recommendedLatencyMs: 3500,
    passingScoreThreshold: 80,
    topicCategories: ['workplace_extended', 'social'],
    alignedTopicsCount: 48,
    keyTechniquesVi: [
      'IELTS Part 2 Cue Card Mindmap (Past - Present - Future)',
      'IELTS Part 3 Cấu trúc Nhượng bộ & Phản biện (Even though... I firmly believe...)',
      'Ngôn ngữ công sở & đàm phán chuyên nghiệp',
    ],
  },
};

/**
 * Resolve stage metadata by ID with fallback to Stage 1.
 */
export function getSpeakingStageMetadata(stageId: SpeakingStageId | string): SpeakingStageMetadata {
  if (stageId in SPEAKING_STAGE_REGISTRY) {
    return SPEAKING_STAGE_REGISTRY[stageId as SpeakingStageId];
  }
  // Fallback check for short identifiers
  if (stageId === 'stage-1') return SPEAKING_STAGE_REGISTRY['stage-1-survival'];
  if (stageId === 'stage-2') return SPEAKING_STAGE_REGISTRY['stage-2-conversational'];
  if (stageId === 'stage-3') return SPEAKING_STAGE_REGISTRY['stage-3-debate'];
  return SPEAKING_STAGE_REGISTRY['stage-1-survival'];
}

/**
 * Map a topic category from the 229 topic library to the recommended speaking stage.
 */
export function mapTopicCategoryToStage(category: TopicLibraryCategory): SpeakingStageId {
  switch (category) {
    case 'describing':
      return 'stage-1-survival';
    case 'daily_situations':
      return 'stage-2-conversational';
    case 'social':
      return 'stage-2-conversational';
    case 'workplace_extended':
      return 'stage-3-debate';
    default:
      return 'stage-1-survival';
  }
}

// ============================================================================
// 2. VISUAL & AUDIO STIMULUS CONTRACTS (LEFT PANE)
// ============================================================================

export type StimulusMediaType = 'image' | 'audio_only' | 'cue_card' | 'dialogue_turn';

export interface VisualStimulus {
  /** Responsive image URL for describing pictures or visual scenes */
  imageUrl: string;
  /** Accessible image description */
  imageAlt: string;
  /** Optional caption rendered beneath the image */
  caption?: string;
  /** Photo credit / attribution */
  sourceAttribution?: string;
  /** English headline */
  titleEn?: string;
  /** Vietnamese headline */
  titleVi?: string;
  /** Detailed situation prompt in Vietnamese */
  situationVi?: string;
  /** IELTS Cue Card bullet points for Stage 3 monologues */
  cueCardBullets?: string[];
  /** Optional emoji or icon identifier */
  icon?: string;
  /** Media type tag */
  type?: StimulusMediaType;
}

export interface AudioStimulus {
  /** Reference model audio URL (native speaker rate: 1.0x) */
  audioUrl: string;
  /** Estimated audio duration in seconds */
  durationSeconds?: number;
  /** Slow reference audio URL (articulatory rate: 0.8x) */
  slowAudioUrl?: string;
  /** Audio transcript */
  transcript?: string;
  /** English transcript */
  transcriptEn?: string;
  /** Vietnamese translated transcript */
  transcriptVi?: string;
  /** Speaker identifier or role */
  speakerName?: string;
}

export interface SpeakingStimulusPair {
  visual?: VisualStimulus;
  audio?: AudioStimulus;
  keyVocabulary?: TopicVocabItem[];
  suggestedStartersVi?: string[];
}

// ============================================================================
// 3. SPEAKING PROMPT & EVALUATION CONTRACTS (RIGHT PANE)
// ============================================================================

export interface SpeakingPromptStimulus {
  visual?: VisualStimulus;
  audio?: AudioStimulus;
}

export interface SpeakingPrompt {
  id: string;
  stageId: SpeakingStageId;
  topicId: string;
  title: string;
  contextVietnamese: string;
  instructionsEnglish: string;
  stimulus: SpeakingPromptStimulus;
  sampleAnswer?: string;
  targetKeywords?: string[];
  targetSentence?: string;
  acceptableVariations?: string[];
  hintsVi?: string[];
  preparationSeconds?: number;
  recordingTimeLimitSeconds?: number;
  promptQuestionEn?: string;
  promptQuestionVi?: string;
}

export interface SpeakingEvaluationCriteria {
  minimumPassingScore: number;
  targetReflexLatencyMs?: number;
  contentKeywordWeight?: number; // Default 0.6
  fluencyWeight?: number;        // Default 0.4
  pronunciationWeight?: number;  // Optional
  grammarWeight?: number;        // Optional
}

export interface SpeakingEvaluationResult {
  score: number; // 0 - 100
  passed: boolean;
  rawTranscript: string;
  finalTranscript: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  latencyMs: number;
  feedbackVi: string;
  suggestedCorrectionEn?: string;
  evaluatedAt: string;
}

// ============================================================================
// 4. AUDIO UPLOAD & STORAGE ARCHITECTURE CONTRACTS
// ============================================================================

export interface AudioUploadPayload {
  /** Raw audio binary data */
  audioBlob: Blob;
  /** Associated prompt identifier */
  promptId?: string;
  /** Associated stage identifier */
  stageId?: SpeakingStageId | string;
  /** Associated lesson or topic identifier */
  lessonId?: string;
  topicId?: string;
  /** Duration of recording in milliseconds */
  durationMs?: number;
  /** MIME type of the recorded audio (e.g. 'audio/webm', 'audio/mp4') */
  mimeType?: string;
  /** Recognized transcript text from STT */
  transcript?: string;
  /** User identifier */
  userId?: string;
}

export interface AudioUploadApiResponseData {
  recordingId?: string;
  audioUrl: string;
  storagePath: string;
  fileSize: number;
  fileSizeBytes?: number;
  mimeType: string;
  durationSeconds?: number;
  durationMs?: number;
  savedAt?: string;
  isMock?: boolean;
  storageProvider?: 'local' | 'supabase_storage' | 'r2';
}

export interface AudioUploadApiResponse {
  success: boolean;
  data?: AudioUploadApiResponseData;
  error?: string;
}

// ============================================================================
// 5. SPLIT-PANE UI SCAFFOLDING PROPS
// ============================================================================

export interface SplitPaneLayoutProps {
  /** Left pane content: Visual stimulus & reference audio player */
  leftPane: ReactNode;
  /** Right pane content: Task instructions, real-time transcript & recording button */
  rightPane: ReactNode;
  /** Width ratio for two-column desktop layout */
  ratio?: '50/50' | '60/40' | '40/60';
  /** Alternative alias for ratio */
  splitRatio?: '50/50' | '60/40' | '40/60';
  /** Additional container CSS class */
  className?: string;
  /** Mobile active tab ('stimulus' vs 'interaction') */
  mobileActiveTab?: 'stimulus' | 'interaction';
  /** Mobile tab toggle handler */
  onMobileTabChange?: (tab: 'stimulus' | 'interaction') => void;
  /** Breakpoint for switching from mobile stacked to split layout */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

export type RecordingButtonState =
  | 'idle'
  | 'preparing'
  | 'recording'
  | 'processing'
  | 'disabled'
  | 'error';

export interface RecordingButtonProps {
  /** True when active audio recording is underway */
  isRecording: boolean;
  /** True when audio is processing or uploading */
  isProcessing?: boolean;
  /** Disables click interaction */
  disabled?: boolean;
  /** Click callback to start recording */
  onStartRecording: () => void | Promise<void>;
  /** Click callback to stop recording */
  onStopRecording: () => void | Promise<void>;
  /** Current audio input volume level (0.0 - 1.0) for visual ripple animation */
  audioLevel?: number;
  /** Additional button CSS class */
  className?: string;
  /** Granular status descriptor */
  status?: RecordingButtonState | string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}
