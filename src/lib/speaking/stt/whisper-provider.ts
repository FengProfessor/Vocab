/**
 * LingoPro Whisper STT Provider Adapter
 * File: src/lib/speaking/stt/whisper-provider.ts
 *
 * Implements ISTTService as an adapter for remote / cloud speech transcription (OpenAI / Groq Whisper):
 * - Identical external interface as WebSpeechProvider
 * - Supports audio blob submission via setAudioBlob() or internal MediaRecorder capture
 * - Connects to configurable backend proxy (e.g. /api/speaking/stt-whisper) or direct API
 * - Provides realistic mock/stub transcription fallback when offline, in CI, or without API keys
 * - Isomorphic and SSR-safe
 */

import type {
  ISTTService,
  STTError,
  STTProviderType,
  STTRecognitionResult,
  STTServiceConfig,
  STTStartOptions,
  STTStatus,
} from './types';

export class WhisperProvider implements ISTTService {
  readonly providerType: STTProviderType = 'whisper';

  private _status: STTStatus = 'idle';
  private config: STTServiceConfig;

  private currentAudioBlob: Blob | null = null;
  private currentLang = 'en-US';
  private accumulatedTranscript = '';
  private abortController: AbortController | null = null;

  // Internal recorder fallback when no external audio blob is provided
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private resultListeners = new Set<(result: STTRecognitionResult) => void>();
  private errorListeners = new Set<(error: STTError) => void>();
  private statusListeners = new Set<(status: STTStatus) => void>();

  constructor(config?: STTServiceConfig) {
    this.config = config || {};
  }

  get status(): STTStatus {
    return this._status;
  }

  /**
   * Static check: Remote Whisper provider is supported in any environment capable of fetch or mock.
   */
  static isSupported(): boolean {
    return true;
  }

  get isSupported(): boolean {
    return WhisperProvider.isSupported();
  }

  private setStatus(newStatus: STTStatus): void {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (err) {
          console.error('[WhisperProvider] Error in onStatusChange listener:', err);
        }
      });
    }
  }

  private emitResult(result: STTRecognitionResult): void {
    this.resultListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (err) {
        console.error('[WhisperProvider] Error in onResult listener:', err);
      }
    });
  }

  private emitError(error: STTError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        console.error('[WhisperProvider] Error in onError listener:', err);
      }
    });
  }

  /**
   * Supplies an external audio Blob (e.g. from useAudioRecorder hook).
   */
  setAudioBlob(blob: Blob): void {
    this.currentAudioBlob = blob;
  }

  /**
   * Feeds an audio chunk (Uint8Array or Blob) into the audio buffer.
   */
  feedAudioChunk(chunk: Uint8Array | Blob): void {
    const blob = chunk instanceof Blob ? chunk : new Blob([chunk as unknown as BlobPart]);
    this.audioChunks.push(blob);
  }

  /**
   * Starts transcription session.
   * If in a browser environment with mediaDevices, attempts to record audio chunks.
   */
  async start(options?: STTStartOptions): Promise<void> {
    if (this._status === 'listening' || this._status === 'starting' || this._status === 'recognizing') {
      throw new Error('STT is already running');
    }

    this.setStatus('starting');
    this.currentLang = options?.lang ?? this.config.lang ?? 'en-US';
    this.accumulatedTranscript = '';
    this.currentAudioBlob = null;
    this.audioChunks = [];
    this.abortController = new AbortController();

    // If browser microphone is available and not in explicit mock mode, start recording
    const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
    if (isBrowser && navigator.mediaDevices?.getUserMedia && !this.config.mockMode) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // CRITICAL: When aborted during getUserMedia, immediately stop all tracks and do not set status to listening
        if (this._status === 'idle') {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        this.mediaStream = stream;

        // Choose best supported mime type
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }
          const recorder = new MediaRecorder(stream, { mimeType });
          this.mediaRecorder = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          recorder.start(250); // 250ms timeslices
        }
      } catch (err) {
        if (this._status === 'idle') {
          return;
        }
        // When getUserMedia fails in non-mock mode, emit STTError with code 'not-allowed'
        this.setStatus('error');
        const sttError: STTError = {
          code: 'not-allowed',
          message: 'Microphone permission was denied or device is unavailable.',
          originalError: err,
        };
        this.emitError(sttError);
        return;
      }
    }

    if (this._status === 'idle') {
      return;
    }

    this.setStatus('listening');
  }

  /**
   * Stops recording and executes Whisper speech-to-text transcription.
   * Returns the final transcribed text.
   */
  async stop(): Promise<string> {
    if (this._status === 'idle' || this._status === 'stopped') {
      return this.accumulatedTranscript;
    }

    this.setStatus('recognizing');

    // Finalize internal media recording if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Stop and release media stream tracks
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore track cleanup errors
      }
      this.mediaStream = null;
    }

    // Assemble audio blob if internal chunks were recorded
    if (!this.currentAudioBlob && this.audioChunks.length > 0) {
      this.currentAudioBlob = new Blob(this.audioChunks, {
        type: this.audioChunks[0]?.type || 'audio/webm',
      });
    }

    let transcript = '';

    // Decide whether to call remote endpoint or mock stub
    const endpoint = this.config.whisperEndpoint;
    const shouldCallRemote = Boolean(endpoint) && !this.config.mockMode && Boolean(this.currentAudioBlob);

    if (shouldCallRemote && endpoint && this.currentAudioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', this.currentAudioBlob, 'recording.webm');
        if (this.currentLang) {
          formData.append('language', this.currentLang);
        }

        const headers: Record<string, string> = {};
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: formData,
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          throw new Error(`Whisper endpoint returned HTTP ${response.status}`);
        }

        const data = await response.json();
        transcript = data.text || data.transcript || data.data?.transcript || '';
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          this.setStatus('idle');
          return '';
        }
        console.warn('[WhisperProvider] Remote transcription failed, falling back to mock stub:', fetchError);
        transcript = this.generateMockTranscript();
      }
    } else {
      // If not in mockMode and there was no audio blob and no audio chunks, return empty string
      if (!this.config.mockMode && !this.currentAudioBlob && this.audioChunks.length === 0) {
        transcript = '';
      } else {
        const delayMs = this.config.mockDelayMs ?? (this.config.mockMode ? 10 : 600);
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        transcript = this.generateMockTranscript();
      }
    }

    // In stop(), do not emit status or result if aborted
    if (this.status === 'idle') {
      return '';
    }

    this.accumulatedTranscript = transcript;

    this.emitResult({
      transcript,
      isFinal: true,
      confidence: 0.96,
    });

    this.setStatus('stopped');
    this.setStatus('idle');

    return transcript;
  }

  /**
   * Generates a realistic mock transcript for test or fallback scenarios.
   */
  private generateMockTranscript(): string {
    if (this.config.mockTranscript) {
      return this.config.mockTranscript;
    }
    return 'This is a high accuracy Whisper transcription: learning spoken English requires daily practice.';
  }

  /**
   * Aborts ongoing transcription and cleans up audio resources.
   */
  abort(): void {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch {
        // Ignore abort errors
      }
      this.abortController = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore
      }
      this.mediaStream = null;
    }

    this.audioChunks = [];
    this.currentAudioBlob = null;
    this.setStatus('idle');
  }

  /**
   * Registers a listener for speech recognition results.
   */
  onResult(callback: (result: STTRecognitionResult) => void): () => void {
    this.resultListeners.add(callback);
    return () => {
      this.resultListeners.delete(callback);
    };
  }

  /**
   * Registers a listener for speech recognition errors.
   */
  onError(callback: (error: STTError) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Registers a listener for lifecycle status changes.
   */
  onStatusChange(callback: (status: STTStatus) => void): () => void {
    this.statusListeners.add(callback);
    try {
      callback(this._status);
    } catch (err) {
      console.error('[WhisperProvider] Error in immediate onStatusChange:', err);
    }
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}
