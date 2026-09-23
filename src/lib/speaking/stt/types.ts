/**
 * LingoPro Hybrid STT Service Type Definitions
 * File: src/lib/speaking/stt/types.ts
 *
 * Core contracts for the hybrid Speech-to-Text (STT) architecture:
 * - Decoupled event-driven interface (ISTTService)
 * - Provider type discriminators ('webspeech' | 'whisper' | 'mock')
 * - Granular lifecycle states and standardized error codes
 * - Unsubscribe-pattern listener registrations for React and service usage
 */

export type STTProviderType = 'webspeech' | 'whisper' | 'mock';

export type STTStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'recognizing'
  | 'stopped'
  | 'error';

export interface STTRecognitionResult {
  /** Cumulative text transcribed so far (final + interim) */
  transcript: string;
  /** Whether the current recognized segment is final */
  isFinal: boolean;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
}

export type STTErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'aborted'
  | 'unsupported'
  | 'service-error'
  | 'timeout'
  | 'unknown';

export interface STTError {
  code: STTErrorCode | string;
  message: string;
  originalError?: unknown;
}

export interface STTStartOptions {
  /** BCP 47 language code (default: 'en-US') */
  lang?: string;
  /** Whether continuous listening is enabled (default: true) */
  continuous?: boolean;
  /** Whether interim results should be emitted (default: true) */
  interimResults?: boolean;
  /** Maximum alternative matches (default: 1) */
  maxAlternatives?: number;
}

export interface STTServiceConfig extends STTStartOptions {
  /** Endpoint for remote Whisper transcription (e.g. '/api/speaking/stt-whisper') */
  whisperEndpoint?: string;
  /** Optional API Key for external speech providers */
  apiKey?: string;
  /** Force mock transcription mode (useful for testing or headless environments) */
  mockMode?: boolean;
  /** Simulated recognition delay in milliseconds when in mock mode (default: 600ms) */
  mockDelayMs?: number;
  /** Custom canned transcript for testing in mock mode */
  mockTranscript?: string;
  /** Optional override to simulate presence/absence of browser speech capability */
  hasBrowserSpeech?: boolean;
}

/**
 * Universal Speech-to-Text service interface.
 * Implemented identically by WebSpeechProvider and WhisperProvider.
 */
export interface ISTTService {
  /** The concrete provider type */
  readonly providerType: STTProviderType;

  /** Current lifecycle status */
  readonly status: STTStatus;

  /** Whether the underlying speech recognition capability is available in the current environment */
  readonly isSupported: boolean;

  /**
   * Starts speech recognition session.
   * Resolves when the engine enters active 'listening' state.
   */
  start(options?: STTStartOptions): Promise<void>;

  /**
   * Gracefully stops speech recognition.
   * Resolves with the final accumulated transcript text.
   */
  stop(): Promise<string>;

  /**
   * Immediately aborts any ongoing recognition or audio stream without waiting.
   */
  abort(): void;

  /**
   * Registers a listener for speech recognition results (interim and final).
   * @returns Unsubscribe function.
   */
  onResult(callback: (result: STTRecognitionResult) => void): () => void;

  /**
   * Registers a listener for recognition errors.
   * @returns Unsubscribe function.
   */
  onError(callback: (error: STTError) => void): () => void;

  /**
   * Registers a listener for lifecycle status changes.
   * @returns Unsubscribe function.
   */
  onStatusChange(callback: (status: STTStatus) => void): () => void;

  /**
   * Optional hook for passing external recorded audio Blob to the provider (used by WhisperProvider).
   */
  setAudioBlob?(blob: Blob): void;

  /**
   * Optional hook for feeding raw audio chunks to the provider.
   */
  feedAudioChunk?(chunk: Uint8Array | Blob): void;
}
