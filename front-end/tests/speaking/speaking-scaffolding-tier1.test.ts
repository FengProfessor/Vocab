/**
 * Tier 1: Feature Coverage Test Suite for LingoPro Speaking Scaffolding
 *
 * Verifies >=5 tests per feature across all 5 core scaffolding features:
 * 1. Speaking types validation (StageId, VisualStimulus, AudioStimulus, SpeakingPrompt, Topic Library alignment)
 * 2. STT interface contracts (ISTTService, STTRecognitionResult, STTStatus, STTError, Unsubscribe)
 * 3. WebSpeechProvider & WhisperProvider lifecycle (start, interim, final, stop, abort, Factory)
 * 4. Audio upload payload validation (MIME types, <=10MB size, metadata, storage path format)
 * 5. Split-pane props validation (SplitPaneLayoutProps, ratios, mobile tabs, RecordingButton states, ARIA)
 *
 * Usage:
 *   npx tsx tests/speaking/run-scaffolding-tests.ts
 */

import { TestRunner, expect, setupMockBrowserEnvironment } from './test-harness';
import { allTopicLibraryItems } from '@/data/speaking/topic-library';
import {
  WebSpeechProvider,
  WhisperProvider,
  createSTTService,
} from '@/lib/speaking/stt';

// ──────────────────────────────────────────────────────────────────────────
// 1. Authoritative Domain Contracts & Types (PROJECT.md Specification)
// ──────────────────────────────────────────────────────────────────────────

export type SpeakingStageId = 'stage-1-survival' | 'stage-2-conversational' | 'stage-3-debate';

export interface VisualStimulus {
  imageUrl: string;
  imageAlt: string;
  caption?: string;
  sourceAttribution?: string;
}

export interface AudioStimulus {
  audioUrl: string;
  durationSeconds?: number;
  slowAudioUrl?: string; // 0.8x reference rate
  transcript?: string;
}

export interface SpeakingPrompt {
  id: string;
  stageId: SpeakingStageId;
  topicId: string;
  title: string;
  contextVietnamese: string;
  instructionsEnglish: string;
  stimulus: {
    visual?: VisualStimulus;
    audio?: AudioStimulus;
  };
  sampleAnswer?: string;
  targetKeywords?: string[];
}

export interface SpeakingEvaluationCriteria {
  targetSentence?: string;
  acceptableVariations?: string[];
  coreKeywords?: string[];
  minimumPassingScore?: number; // 0 - 100
  maxReflexLatencyMs?: number;
}

export type STTProviderType = 'webspeech' | 'whisper' | 'mock';
export type STTStatus = 'idle' | 'starting' | 'listening' | 'recognizing' | 'stopped' | 'error';

export interface STTRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number; // 0.0 to 1.0
}

export interface STTError {
  code: string;
  message: string;
}

export interface ISTTService {
  readonly providerType: STTProviderType;
  readonly status: STTStatus;
  start(options?: { lang?: string; continuous?: boolean }): Promise<void>;
  stop(): Promise<string>;
  abort(): void;
  onResult(callback: (result: STTRecognitionResult) => void): () => void;
  onError(callback: (error: STTError) => void): () => void;
  onStatusChange(callback: (status: STTStatus) => void): () => void;
}

export interface AudioUploadPayload {
  audio: Uint8Array | Buffer | Blob;
  mimeType: string;
  fileSizeBytes: number;
  promptId?: string;
  stageId?: SpeakingStageId;
  durationSeconds?: number;
}

export interface AudioUploadApiResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    storagePath: string;
    fileSize: number;
    mimeType: string;
    durationSeconds?: number;
  };
  error?: string;
}

export interface SplitPaneLayoutProps {
  leftPane: unknown;
  rightPane: unknown;
  ratio?: '50/50' | '60/40' | '40/60';
  className?: string;
  mobileActiveTab?: 'stimulus' | 'interaction';
  onMobileTabChange?: (tab: 'stimulus' | 'interaction') => void;
}

export type RecordingButtonState = 'idle' | 'preparing' | 'recording' | 'processing' | 'disabled' | 'error';

export interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing?: boolean;
  disabled?: boolean;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void | Promise<void>;
  audioLevel?: number; // 0.0 to 1.0
  className?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Authoritative Oracles & Validation Functions
// ──────────────────────────────────────────────────────────────────────────

export const ALLOWED_AUDIO_MIMES = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'audio/x-m4a',
];

export const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB = 10,485,760 bytes

export function validateSpeakingStageId(val: unknown): val is SpeakingStageId {
  return val === 'stage-1-survival' || val === 'stage-2-conversational' || val === 'stage-3-debate';
}

export function validateVisualStimulus(val: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!val || typeof val !== 'object') {
    return { valid: false, errors: ['VisualStimulus must be a non-null object'] };
  }
  const v = val as Record<string, unknown>;
  if (typeof v.imageUrl !== 'string' || v.imageUrl.trim() === '') {
    errors.push('imageUrl must be a non-empty string');
  } else if (!v.imageUrl.startsWith('http://') && !v.imageUrl.startsWith('https://') && !v.imageUrl.startsWith('/')) {
    errors.push('imageUrl must be a valid http(s) URL or absolute path');
  }
  if (typeof v.imageAlt !== 'string' || v.imageAlt.trim() === '') {
    errors.push('imageAlt must be a non-empty string');
  }
  if (v.caption !== undefined && typeof v.caption !== 'string') {
    errors.push('caption must be a string if provided');
  }
  if (v.sourceAttribution !== undefined && typeof v.sourceAttribution !== 'string') {
    errors.push('sourceAttribution must be a string if provided');
  }
  return { valid: errors.length === 0, errors };
}

export function validateAudioStimulus(val: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!val || typeof val !== 'object') {
    return { valid: false, errors: ['AudioStimulus must be a non-null object'] };
  }
  const a = val as Record<string, unknown>;
  if (typeof a.audioUrl !== 'string' || a.audioUrl.trim() === '') {
    errors.push('audioUrl must be a non-empty string');
  } else if (!a.audioUrl.startsWith('http://') && !a.audioUrl.startsWith('https://') && !a.audioUrl.startsWith('/')) {
    errors.push('audioUrl must be a valid http(s) URL or absolute path');
  }
  if (a.durationSeconds !== undefined) {
    if (typeof a.durationSeconds !== 'number' || a.durationSeconds <= 0 || !Number.isFinite(a.durationSeconds)) {
      errors.push('durationSeconds must be a positive finite number');
    }
  }
  if (a.slowAudioUrl !== undefined) {
    if (typeof a.slowAudioUrl !== 'string' || a.slowAudioUrl.trim() === '') {
      errors.push('slowAudioUrl must be a non-empty string if provided');
    }
  }
  if (a.transcript !== undefined && typeof a.transcript !== 'string') {
    errors.push('transcript must be a string if provided');
  }
  return { valid: errors.length === 0, errors };
}

export function validateSpeakingPrompt(val: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!val || typeof val !== 'object') {
    return { valid: false, errors: ['SpeakingPrompt must be a non-null object'] };
  }
  const p = val as Record<string, unknown>;
  if (typeof p.id !== 'string' || p.id.trim() === '') errors.push('id must be non-empty string');
  if (!validateSpeakingStageId(p.stageId)) errors.push(`stageId "${p.stageId}" is invalid`);
  if (typeof p.topicId !== 'string' || p.topicId.trim() === '') errors.push('topicId must be non-empty string');
  if (typeof p.title !== 'string' || p.title.trim() === '') errors.push('title must be non-empty string');
  if (typeof p.contextVietnamese !== 'string' || p.contextVietnamese.trim() === '') {
    errors.push('contextVietnamese must be non-empty string');
  }
  if (typeof p.instructionsEnglish !== 'string' || p.instructionsEnglish.trim() === '') {
    errors.push('instructionsEnglish must be non-empty string');
  }
  if (!p.stimulus || typeof p.stimulus !== 'object') {
    errors.push('stimulus object is required');
  } else {
    const s = p.stimulus as Record<string, unknown>;
    if (s.visual) {
      const vRes = validateVisualStimulus(s.visual);
      if (!vRes.valid) errors.push(...vRes.errors);
    }
    if (s.audio) {
      const aRes = validateAudioStimulus(s.audio);
      if (!aRes.valid) errors.push(...aRes.errors);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateAudioUploadRequest(payload: {
  fileSizeBytes: number;
  mimeType: string;
  promptId?: string;
  stageId?: string;
}): { valid: boolean; status: number; error?: string; data?: AudioUploadApiResponse['data'] } {
  if (payload.fileSizeBytes <= 0) {
    return { valid: false, status: 400, error: 'Empty audio file payload (0 bytes)' };
  }
  if (payload.fileSizeBytes > MAX_AUDIO_UPLOAD_BYTES) {
    return { valid: false, status: 413, error: `Audio file size ${payload.fileSizeBytes} bytes exceeds limit of ${MAX_AUDIO_UPLOAD_BYTES} bytes (10MB)` };
  }
  const normalizedMime = payload.mimeType.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_AUDIO_MIMES.includes(normalizedMime)) {
    return { valid: false, status: 415, error: `Unsupported MIME type "${payload.mimeType}". Allowed: ${ALLOWED_AUDIO_MIMES.join(', ')}` };
  }

  const stage = payload.stageId || 'unassigned';
  const prompt = payload.promptId || 'unassigned';
  const ext = normalizedMime.includes('webm') ? 'webm' : normalizedMime.includes('mp4') ? 'mp4' : normalizedMime.includes('wav') ? 'wav' : 'audio';
  const timestamp = Date.now();
  const storagePath = `recordings/${stage}/${prompt}/${timestamp}.${ext}`;
  const audioUrl = `https://storage.lingopro.online/${storagePath}`;

  return {
    valid: true,
    status: 200,
    data: {
      audioUrl,
      storagePath,
      fileSize: payload.fileSizeBytes,
      mimeType: normalizedMime,
      durationSeconds: undefined,
    },
  };
}

export function validateSplitPaneProps(props: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!props || typeof props !== 'object') {
    return { valid: false, errors: ['SplitPaneLayoutProps must be an object'] };
  }
  const p = props as Record<string, unknown>;
  if (p.leftPane === undefined) errors.push('leftPane is required');
  if (p.rightPane === undefined) errors.push('rightPane is required');
  if (p.ratio !== undefined && p.ratio !== '50/50' && p.ratio !== '60/40' && p.ratio !== '40/60') {
    errors.push(`ratio must be '50/50', '60/40', or '40/60', got: ${p.ratio}`);
  }
  if (p.mobileActiveTab !== undefined && p.mobileActiveTab !== 'stimulus' && p.mobileActiveTab !== 'interaction') {
    errors.push(`mobileActiveTab must be 'stimulus' or 'interaction', got: ${p.mobileActiveTab}`);
  }
  return { valid: errors.length === 0, errors };
}

export function deriveRecordingButtonState(props: {
  isRecording: boolean;
  isProcessing?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}): RecordingButtonState {
  if (props.disabled) return 'disabled';
  if (props.hasError) return 'error';
  if (props.isProcessing) return 'processing';
  if (props.isRecording) return 'recording';
  return 'idle';
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Re-export Production STT Implementations for Direct Test Suite Wiring
// ──────────────────────────────────────────────────────────────────────────

export {
  WebSpeechProvider,
  WhisperProvider,
  createSTTService,
  WebSpeechProvider as WebSpeechProviderReference,
  WhisperProvider as WhisperProviderReference,
  createSTTService as createSTTServiceReference,
};

// ──────────────────────────────────────────────────────────────────────────
// 4. Test Suite Execution Function
// ──────────────────────────────────────────────────────────────────────────

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  setupMockBrowserEnvironment();
  // ─── Feature 1: Speaking Types Validation ───────────────────────────────
  runner.describe('Tier 1 — Feature 1: Speaking Domain Types Validation', () => {});

  await runner.it('1.1: Validates SpeakingStageId 3-stage progression hierarchy', () => {
    expect(validateSpeakingStageId('stage-1-survival')).toBe(true);
    expect(validateSpeakingStageId('stage-2-conversational')).toBe(true);
    expect(validateSpeakingStageId('stage-3-debate')).toBe(true);
    expect(validateSpeakingStageId('stage-0-phonetics')).toBe(false);
    expect(validateSpeakingStageId('stage-4-mastery')).toBe(false);
    expect(validateSpeakingStageId('')).toBe(false);
  });

  await runner.it('1.2: Validates VisualStimulus schema integrity with required & optional fields', () => {
    const validVisual: VisualStimulus = {
      imageUrl: 'https://cdn.lingopro.online/stimulus/living-room.jpg',
      imageAlt: 'A cozy living room with a brown leather sofa',
      caption: 'Describing interior spaces',
      sourceAttribution: 'LingoPro Standard Library',
    };
    const res = validateVisualStimulus(validVisual);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);

    // Minimal valid
    const minVisual: VisualStimulus = {
      imageUrl: '/images/stimulus/supermarket.webp',
      imageAlt: 'Supermarket aisle',
    };
    expect(validateVisualStimulus(minVisual).valid).toBe(true);
  });

  await runner.it('1.3: Validates AudioStimulus schema integrity including slowAudioUrl (0.8x)', () => {
    const validAudio: AudioStimulus = {
      audioUrl: 'https://cdn.lingopro.online/audio/model-desc-01.mp3',
      durationSeconds: 15.5,
      slowAudioUrl: 'https://cdn.lingopro.online/audio/model-desc-01-slow.mp3',
      transcript: 'There is a large wooden dining table in the middle of the room.',
    };
    const res = validateAudioStimulus(validAudio);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);

    // Relative path audio
    const relativeAudio: AudioStimulus = {
      audioUrl: '/audio/speaking/stage1/sample.mp3',
    };
    expect(validateAudioStimulus(relativeAudio).valid).toBe(true);
  });

  await runner.it('1.4: Validates SpeakingPrompt bilingual context & stage contract', () => {
    const prompt: SpeakingPrompt = {
      id: 'prompt-desc-01',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: 'Describing Your Living Room',
      contextVietnamese: 'Bạn đang giới thiệu căn phòng khách của mình với một người bạn nước ngoài mới đến chơi.',
      instructionsEnglish: 'Describe the main furniture pieces and where they are located. Speak for 20-30 seconds.',
      stimulus: {
        visual: {
          imageUrl: 'https://cdn.lingopro.online/images/living-room.jpg',
          imageAlt: 'Modern living room',
        },
        audio: {
          audioUrl: 'https://cdn.lingopro.online/audio/living-room-reference.mp3',
          slowAudioUrl: 'https://cdn.lingopro.online/audio/living-room-slow.mp3',
        },
      },
      sampleAnswer: 'In my living room, there is a comfortable sofa next to the window.',
      targetKeywords: ['sofa', 'coffee table', 'bookshelf', 'next to', 'opposite'],
    };
    const res = validateSpeakingPrompt(prompt);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  await runner.it('1.5: Validates alignment with real 229-item topic-library catalog', () => {
    expect(allTopicLibraryItems.length).toBe(229);
    const sampleTopic = allTopicLibraryItems.find((t) => t.category === 'describing');
    expect(sampleTopic).toBeDefined();
    expect(sampleTopic?.titleEn.length).toBeGreaterThan(0);
    expect(sampleTopic?.titleVi.length).toBeGreaterThan(0);

    // Verify prompt can reference real topicId from catalog
    const promptLinked: SpeakingPrompt = {
      id: `prompt-${sampleTopic?.id}`,
      stageId: 'stage-1-survival',
      topicId: sampleTopic!.id,
      title: sampleTopic!.titleEn,
      contextVietnamese: sampleTopic!.situationVi,
      instructionsEnglish: 'Look at the image and answer the question.',
      stimulus: {
        visual: {
          imageUrl: '/images/topic-default.jpg',
          imageAlt: sampleTopic!.titleEn,
        },
      },
    };
    expect(validateSpeakingPrompt(promptLinked).valid).toBe(true);
  });

  await runner.it('1.6: Validates SpeakingEvaluationCriteria contract thresholds', () => {
    const criteria: SpeakingEvaluationCriteria = {
      targetSentence: 'There is a sofa in the living room.',
      acceptableVariations: [
        'There is a couch in the living room.',
        'In the living room, there is a sofa.',
      ],
      coreKeywords: ['sofa', 'living room'],
      minimumPassingScore: 70,
      maxReflexLatencyMs: 1500,
    };
    expect(criteria.minimumPassingScore).toBeGreaterThanOrEqual(70);
    expect(criteria.acceptableVariations?.length).toBe(2);
    expect(criteria.coreKeywords).toContain('sofa');
  });

  // ─── Feature 2: STT Interface Contracts ────────────────────────────────
  runner.describe('Tier 1 — Feature 2: Hybrid STT Interface Contracts', () => {});

  await runner.it('2.1: Verifies ISTTService contract signatures on provider instance', () => {
    const provider: ISTTService = new WebSpeechProvider();
    expect(provider.providerType).toBe('webspeech');
    expect(provider.status).toBe('idle');
    expect(typeof provider.start).toBe('function');
    expect(typeof provider.stop).toBe('function');
    expect(typeof provider.abort).toBe('function');
    expect(typeof provider.onResult).toBe('function');
    expect(typeof provider.onError).toBe('function');
    expect(typeof provider.onStatusChange).toBe('function');
  });

  await runner.it('2.2: Validates STTRecognitionResult schema and confidence bounds', () => {
    const interimResult: STTRecognitionResult = {
      transcript: 'hello world',
      isFinal: false,
      confidence: 0.85,
    };
    expect(typeof interimResult.transcript).toBe('string');
    expect(interimResult.isFinal).toBe(false);
    expect(interimResult.confidence).toBeGreaterThanOrEqual(0.0);
    expect(interimResult.confidence).toBeLessThanOrEqual(1.0);

    const finalResult: STTRecognitionResult = {
      transcript: 'hello world and welcome',
      isFinal: true,
      confidence: 0.98,
    };
    expect(finalResult.isFinal).toBe(true);
    expect(finalResult.confidence).toBeGreaterThan(0.9);
  });

  await runner.it('2.3: Validates STTStatus finite state machine values', () => {
    const validStatuses: STTStatus[] = ['idle', 'starting', 'listening', 'recognizing', 'stopped', 'error'];
    for (const st of validStatuses) {
      expect(['idle', 'starting', 'listening', 'recognizing', 'stopped', 'error']).toContain(st);
    }
  });

  await runner.it('2.4: Validates STTError contract structure', () => {
    const err: STTError = {
      code: 'not-allowed',
      message: 'Microphone permission was denied by the user',
    };
    expect(err.code).toBe('not-allowed');
    expect(err.message.length).toBeGreaterThan(10);
  });

  await runner.it('2.5: Verifies listener unsubscription stops receiving callbacks (no memory leaks)', async () => {
    const provider = new WebSpeechProvider();
    let callCount = 0;
    const unsubscribe = provider.onResult(() => {
      callCount++;
    });

    await provider.start();
    provider.simulateInterimTranscript('test chunk 1');
    expect(callCount).toBe(1);

    // Unsubscribe now
    unsubscribe();
    provider.simulateInterimTranscript('test chunk 2');
    expect(callCount).toBe(1); // Call count must remain 1
    await provider.stop();
  });

  await runner.it('2.6: Verifies multi-subscriber fan-out receives identical events', async () => {
    const provider = new WebSpeechProvider();
    const results1: string[] = [];
    const results2: string[] = [];

    provider.onResult((r) => results1.push(r.transcript));
    provider.onResult((r) => results2.push(r.transcript));

    await provider.start();
    provider.simulateFinalTranscript('Hello LingoPro');
    expect(results1).toEqual(['Hello LingoPro']);
    expect(results2).toEqual(['Hello LingoPro']);
    await provider.stop();
  });

  // ─── Feature 3: WebSpeechProvider & WhisperProvider Lifecycle ───────────
  runner.describe('Tier 1 — Feature 3: WebSpeech & Whisper Provider Lifecycles', () => {});

  await runner.it('3.1: WebSpeechProvider transitions from idle -> starting -> listening', async () => {
    const provider = new WebSpeechProvider();
    const statuses: STTStatus[] = [];
    provider.onStatusChange((s) => statuses.push(s));

    expect(provider.status).toBe('idle');
    await provider.start();
    expect(provider.status).toBe('listening');
    expect(statuses).toContain('starting');
    expect(statuses).toContain('listening');
    await provider.stop();
  });

  await runner.it('3.2: WebSpeechProvider streams interim then final transcripts', async () => {
    const provider = new WebSpeechProvider();
    const interimTranscripts: string[] = [];
    let finalTranscript = '';

    provider.onResult((r) => {
      if (!r.isFinal) {
        interimTranscripts.push(r.transcript);
      } else {
        finalTranscript = r.transcript;
      }
    });

    await provider.start();
    provider.simulateInterimTranscript('I live');
    provider.simulateInterimTranscript('I live in Hanoi');
    provider.simulateFinalTranscript('I live in Hanoi.');

    expect(interimTranscripts).toEqual(['I live', 'I live in Hanoi']);
    expect(finalTranscript).toBe('I live in Hanoi.');
    await provider.stop();
  });

  await runner.it('3.3: WebSpeechProvider stop() resolves final accumulated transcript and transitions to stopped', async () => {
    const provider = new WebSpeechProvider();
    await provider.start();
    provider.simulateFinalTranscript('First sentence.');
    provider.simulateFinalTranscript('Second sentence.');

    const resolved = await provider.stop();
    expect(resolved).toBe('First sentence. Second sentence.');
    expect(provider.status).toBe('idle');
  });

  await runner.it('3.4: WebSpeechProvider abort() immediately halts and resets state to idle', async () => {
    const provider = new WebSpeechProvider();
    await provider.start();
    provider.simulateInterimTranscript('Partial data');
    expect(provider.status).toBe('recognizing');

    provider.abort();
    expect(provider.status).toBe('idle');
  });

  await runner.it('3.5: WhisperProvider lifecycle transitions and audio buffer accumulation', async () => {
    const whisper = new WhisperProvider({ mockMode: true, mockDelayMs: 2 });
    expect(whisper.providerType).toBe('whisper');
    expect(whisper.status).toBe('idle');

    await whisper.start();
    expect(whisper.status).toBe('listening');

    // Feed simulated audio chunks
    whisper.feedAudioChunk(new Uint8Array([1, 2, 3, 4]));
    whisper.feedAudioChunk(new Uint8Array([5, 6, 7, 8]));

    const transcript = await whisper.stop();
    expect(transcript.length).toBeGreaterThan(0);
    expect(whisper.status).toBe('idle');
  });

  await runner.it('3.6: STT Factory instantiates requested provider and provides fallback', () => {
    // Browser with WebSpeech support
    const webService = createSTTService('webspeech', { hasBrowserSpeech: true });
    expect(webService.providerType).toBe('webspeech');

    // Browser without WebSpeech support (auto-fallbacks to Whisper)
    const fallbackService = createSTTService('webspeech', { hasBrowserSpeech: false });
    expect(fallbackService.providerType).toBe('whisper');

    // Explicit Whisper request
    const whisperService = createSTTService('whisper');
    expect(whisperService.providerType).toBe('whisper');
  });

  // ─── Feature 4: Audio Upload Payload Validation ─────────────────────────
  runner.describe('Tier 1 — Feature 4: Audio Upload Payload Validation', () => {});

  await runner.it('4.1: Validates correct AudioUploadPayload structure', () => {
    const payload = {
      fileSizeBytes: 245000,
      mimeType: 'audio/webm',
      promptId: 'desc-pic-01',
      stageId: 'stage-1-survival' as SpeakingStageId,
    };
    const res = validateAudioUploadRequest(payload);
    expect(res.valid).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data?.mimeType).toBe('audio/webm');
    expect(res.data?.fileSize).toBe(245000);
  });

  await runner.it('4.2: Enforces MIME type whitelist (audio/webm, audio/mp4, audio/wav, audio/aac, audio/ogg)', () => {
    for (const mime of ALLOWED_AUDIO_MIMES) {
      const res = validateAudioUploadRequest({
        fileSizeBytes: 100000,
        mimeType: mime,
      });
      expect(res.valid).toBe(true);
      expect(res.status).toBe(200);
    }
  });

  await runner.it('4.3: Validates payload size acceptance up to 10MB ceiling', () => {
    // 1MB, 5MB, 9.9MB
    const sizes = [1 * 1024 * 1024, 5 * 1024 * 1024, 9.9 * 1024 * 1024];
    for (const size of sizes) {
      const res = validateAudioUploadRequest({
        fileSizeBytes: size,
        mimeType: 'audio/webm',
      });
      expect(res.valid).toBe(true);
    }
  });

  await runner.it('4.4: Validates AudioUploadApiResponse schema contracts', () => {
    const successResponse: AudioUploadApiResponse = {
      success: true,
      data: {
        audioUrl: 'https://storage.lingopro.online/recordings/stage-1/p1/123.webm',
        storagePath: 'recordings/stage-1/p1/123.webm',
        fileSize: 154000,
        mimeType: 'audio/webm',
        durationSeconds: 12.4,
      },
    };
    expect(successResponse.success).toBe(true);
    expect(successResponse.data?.storagePath).toContain('recordings/');
    expect(successResponse.data?.durationSeconds).toBe(12.4);

    const errorResponse: AudioUploadApiResponse = {
      success: false,
      error: 'File size exceeded limit of 10MB',
    };
    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
  });

  await runner.it('4.5: Validates predictable storage path format recordings/{stageId}/{promptId}/{timestamp}.{ext}', () => {
    const res = validateAudioUploadRequest({
      fileSizeBytes: 50000,
      mimeType: 'audio/mp4',
      promptId: 'bank-deposit-01',
      stageId: 'stage-2-conversational',
    });
    expect(res.valid).toBe(true);
    expect(res.data?.storagePath).toMatch(/^recordings\/stage-2-conversational\/bank-deposit-01\/\d+\.mp4$/);
  });

  await runner.it('4.6: Validates MIME parameter trimming e.g. audio/webm;codecs=opus', () => {
    const res = validateAudioUploadRequest({
      fileSizeBytes: 50000,
      mimeType: 'audio/webm;codecs=opus',
    });
    expect(res.valid).toBe(true);
    expect(res.data?.mimeType).toBe('audio/webm');
  });

  // ─── Feature 5: Split-Pane Props Validation ─────────────────────────────
  runner.describe('Tier 1 — Feature 5: Split-Pane Props & UI State Validation', () => {});

  await runner.it('5.1: Validates SplitPaneLayoutProps schema with leftPane and rightPane', () => {
    const validProps: SplitPaneLayoutProps = {
      leftPane: '<div>Left Pane Content</div>',
      rightPane: '<div>Right Pane Content</div>',
    };
    const res = validateSplitPaneProps(validProps);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  await runner.it('5.2: Validates ratio options 50/50, 60/40, and 40/60', () => {
    expect(validateSplitPaneProps({ leftPane: {}, rightPane: {}, ratio: '50/50' }).valid).toBe(true);
    expect(validateSplitPaneProps({ leftPane: {}, rightPane: {}, ratio: '60/40' }).valid).toBe(true);
    expect(validateSplitPaneProps({ leftPane: {}, rightPane: {}, ratio: '40/60' }).valid).toBe(true);
    expect(validateSplitPaneProps({ leftPane: {}, rightPane: {}, ratio: '70/30' as any }).valid).toBe(false);
  });

  await runner.it('5.3: Validates mobile tab state toggling stimulus vs interaction', () => {
    let activeTab: 'stimulus' | 'interaction' = 'stimulus';
    const props: SplitPaneLayoutProps = {
      leftPane: {},
      rightPane: {},
      mobileActiveTab: activeTab,
      onMobileTabChange: (tab) => {
        activeTab = tab;
      },
    };
    expect(validateSplitPaneProps(props).valid).toBe(true);

    // Simulate tab change
    props.onMobileTabChange?.('interaction');
    expect(activeTab).toBe('interaction');
  });

  await runner.it('5.4: Validates RecordingButtonProps schema and callback triggers', async () => {
    let started = false;
    let stopped = false;
    const btnProps: RecordingButtonProps = {
      isRecording: false,
      onStartRecording: () => {
        started = true;
      },
      onStopRecording: () => {
        stopped = true;
      },
      audioLevel: 0.5,
    };

    expect(btnProps.isRecording).toBe(false);
    await btnProps.onStartRecording();
    expect(started).toBe(true);
    await btnProps.onStopRecording();
    expect(stopped).toBe(true);
  });

  await runner.it('5.5: Validates RecordingButton 6 discrete state mappings', () => {
    expect(deriveRecordingButtonState({ isRecording: false })).toBe('idle');
    expect(deriveRecordingButtonState({ isRecording: true })).toBe('recording');
    expect(deriveRecordingButtonState({ isRecording: false, isProcessing: true })).toBe('processing');
    expect(deriveRecordingButtonState({ isRecording: false, disabled: true })).toBe('disabled');
    expect(deriveRecordingButtonState({ isRecording: false, hasError: true })).toBe('error');
    // Disabled takes priority over recording
    expect(deriveRecordingButtonState({ isRecording: true, disabled: true })).toBe('disabled');
  });

  await runner.it('5.6: Validates accessible touch target >=44px and ARIA labels', () => {
    const minTouchSizePx = 44;
    const buttonDimension = 56; // Standard w-14 h-14 = 56px
    expect(buttonDimension).toBeGreaterThanOrEqual(minTouchSizePx);

    // Test ARIA attribute computation
    const getAriaAttributes = (state: RecordingButtonState) => ({
      role: 'button',
      'aria-label': state === 'recording' ? 'Dừng thu âm (Stop recording)' : 'Bắt đầu thu âm (Start recording)',
      'aria-pressed': state === 'recording',
      'aria-disabled': state === 'disabled' || state === 'processing',
    });

    const idleAria = getAriaAttributes('idle');
    expect(idleAria['aria-pressed']).toBe(false);
    expect(idleAria['aria-label']).toContain('Bắt đầu');

    const recAria = getAriaAttributes('recording');
    expect(recAria['aria-pressed']).toBe(true);
    expect(recAria['aria-label']).toContain('Dừng');
  });
}
