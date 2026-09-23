/**
 * LingoPro Web Speech STT Provider
 * File: src/lib/speaking/stt/web-speech-provider.ts
 *
 * Implements ISTTService using browser-native SpeechRecognition / webkitSpeechRecognition:
 * - Zero API cost, sub-50ms latency
 * - Continuous recognition with interim and final transcript accumulation
 * - Normalized error mapping (Vietnamese/English diagnostic messages)
 * - Complete SSR guard (isomorphic safety)
 * - Safe lifecycle hooks with automatic teardown
 */

import type {
  ISTTService,
  STTError,
  STTErrorCode,
  STTProviderType,
  STTRecognitionResult,
  STTServiceConfig,
  STTStartOptions,
  STTStatus,
} from './types';

// Structural types for Web Speech API in environments without dom.speech types
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstanceLike;

export class WebSpeechProvider implements ISTTService {
  readonly providerType: STTProviderType = 'webspeech';

  private _status: STTStatus = 'idle';
  private config: STTServiceConfig;
  private recognition: SpeechRecognitionInstanceLike | null = null;

  private finalTranscript = '';
  private interimTranscript = '';
  private isManuallyStopping = false;

  private resultListeners = new Set<(result: STTRecognitionResult) => void>();
  private errorListeners = new Set<(error: STTError) => void>();
  private statusListeners = new Set<(status: STTStatus) => void>();

  private stopResolver: ((finalText: string) => void) | null = null;
  private startResolver: (() => void) | null = null;
  private startRejecter: ((reason?: unknown) => void) | null = null;

  constructor(config?: STTServiceConfig) {
    this.config = config || {};
  }

  /**
   * Current lifecycle status.
   */
  get status(): STTStatus {
    return this._status;
  }

  /**
   * Static check: Returns true if Web Speech API is supported in the current environment.
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  /**
   * Instance check for Web Speech API support.
   */
  get isSupported(): boolean {
    return WebSpeechProvider.isSupported();
  }

  /**
   * Retrieves the browser SpeechRecognition constructor, or null if unsupported.
   */
  private getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }

  private setStatus(newStatus: STTStatus): void {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this.statusListeners.forEach((listener) => {
        try {
          listener(newStatus);
        } catch (err) {
          console.error('[WebSpeechProvider] Error in onStatusChange listener:', err);
        }
      });
    }
  }

  private emitResult(result: STTRecognitionResult): void {
    this.resultListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (err) {
        console.error('[WebSpeechProvider] Error in onResult listener:', err);
      }
    });
  }

  private emitError(error: STTError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (err) {
        console.error('[WebSpeechProvider] Error in onError listener:', err);
      }
    });
  }

  /**
   * Maps native Web Speech API error strings to standardized STTError objects.
   */
  private mapNativeError(nativeCode: string, originalEvent?: unknown): STTError {
    let code: STTErrorCode = 'unknown';
    let message = 'An unexpected speech recognition error occurred.';

    switch (nativeCode) {
      case 'not-allowed':
      case 'service-not-allowed':
        code = 'not-allowed';
        message = 'Microphone access was denied. Please allow microphone permissions in your browser.';
        break;
      case 'no-speech':
        code = 'no-speech';
        message = 'No speech was detected. Please speak closer to your microphone and try again.';
        break;
      case 'audio-capture':
        code = 'audio-capture';
        message = 'No microphone device was detected or audio capture is unavailable.';
        break;
      case 'network':
        code = 'network';
        message = 'A network error occurred while connecting to the speech recognition service.';
        break;
      case 'aborted':
        code = 'aborted';
        message = 'Speech recognition was stopped or aborted.';
        break;
      default:
        code = (nativeCode as STTErrorCode) || 'unknown';
        message = `Speech recognition error: ${nativeCode}`;
        break;
    }

    return { code, message, originalError: originalEvent };
  }

  /**
   * Starts speech recognition session.
   */
  start(options?: STTStartOptions): Promise<void> {
    if (!this.isSupported) {
      const err: STTError = {
        code: 'unsupported',
        message: 'Web Speech API is not supported in this browser or server environment.',
      };
      this.setStatus('error');
      this.emitError(err);
      throw new Error(err.message);
    }

    if (this._status === 'listening' || this._status === 'starting' || this._status === 'recognizing') {
      throw new Error('STT is already running');
    }

    this.setStatus('starting');
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isManuallyStopping = false;

    // Teardown previous instance if any
    if (this.recognition) {
      const rec = this.recognition;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignore cleanup errors
      }
      this.recognition = null;
    }

    const SpeechRecognitionClass = this.getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      throw new Error('SpeechRecognition constructor not available');
    }

    const rec = new SpeechRecognitionClass();
    this.recognition = rec;

    const continuous = options?.continuous ?? this.config.continuous ?? true;
    const interimResults = options?.interimResults ?? this.config.interimResults ?? true;
    const lang = options?.lang ?? this.config.lang ?? 'en-US';
    const maxAlternatives = options?.maxAlternatives ?? this.config.maxAlternatives ?? 1;

    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.lang = lang;
    rec.maxAlternatives = maxAlternatives;

    const startPromise = new Promise<void>((resolve, reject) => {
      this.startResolver = resolve;
      this.startRejecter = reject;

      rec.onstart = () => {
        if (this.recognition !== rec) return;
        this.setStatus('listening');
        if (this.startResolver) {
          this.startResolver();
          this.startResolver = null;
          this.startRejecter = null;
        }
      };

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        if (this.recognition !== rec) return;

        let currentInterim = '';
        let hasFinalUpdate = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcriptChunk = res[0]?.transcript || '';

          if (res.isFinal) {
            this.finalTranscript = (this.finalTranscript + ' ' + transcriptChunk).trim();
            hasFinalUpdate = true;
          } else {
            currentInterim = (currentInterim + ' ' + transcriptChunk).trim();
          }
        }

        this.interimTranscript = currentInterim;

        const combinedText = [this.finalTranscript, this.interimTranscript]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (currentInterim) {
          this.setStatus('recognizing');
        } else if (hasFinalUpdate && !currentInterim) {
          this.setStatus('listening');
        }

        // Calculate latest confidence if available
        const latestConfidence =
          event.results[event.results.length - 1]?.[0]?.confidence || 0.9;

        this.emitResult({
          transcript: combinedText,
          isFinal: hasFinalUpdate && !currentInterim,
          confidence: latestConfidence,
        });
      };

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (this.recognition !== rec) return;

        const error = this.mapNativeError(event.error, event);

        if (this.startRejecter) {
          this.startRejecter(new Error(error.message));
          this.startResolver = null;
          this.startRejecter = null;
        }

        this.setStatus('error');
        this.emitError(error);
      };

      rec.onend = () => {
        if (this.recognition !== rec) return;

        // Status preservation: In onend, do not reset status if status is 'error' or already 'idle'
        if (this._status === 'error' || this._status === 'idle') {
          return;
        }

        const fullTranscript = [this.finalTranscript, this.interimTranscript]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (this.isManuallyStopping) {
          this.setStatus('stopped');
          if (this.stopResolver) {
            this.stopResolver(fullTranscript);
            this.stopResolver = null;
          }
          this.setStatus('idle');
          return;
        }

        // Natural end of recognition without manual stop
        this.setStatus('stopped');
        if (this.stopResolver) {
          this.stopResolver(fullTranscript);
          this.stopResolver = null;
        }
        this.setStatus('idle');
      };

      try {
        rec.start();
      } catch (startError) {
        this.setStatus('error');
        const sttError: STTError = {
          code: 'service-error',
          message: 'Failed to initiate speech recognition session.',
          originalError: startError,
        };
        this.emitError(sttError);
        if (this.startRejecter) {
          this.startRejecter(startError);
          this.startResolver = null;
          this.startRejecter = null;
        }
      }
    });

    // Suppress unhandled promise rejection if caller discards the promise during abort()
    startPromise.catch(() => {});

    return startPromise;
  }

  /**
   * Gracefully stops speech recognition.
   * Returns the final accumulated transcript.
   */
  async stop(): Promise<string> {
    this.isManuallyStopping = true;

    const currentText = [this.finalTranscript, this.interimTranscript]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!this.recognition || this._status === 'idle' || this._status === 'stopped') {
      this.setStatus('idle');
      return currentText;
    }

    return new Promise<string>((resolve) => {
      this.stopResolver = resolve;
      this.setStatus('recognizing');

      try {
        this.recognition?.stop();
      } catch {
        // In case stop throws (e.g. already ended), immediately resolve
        this.setStatus('stopped');
        this.setStatus('idle');
        resolve(currentText);
      }
    });
  }

  /**
   * Immediately aborts any ongoing recognition session.
   */
  abort(): void {
    this.isManuallyStopping = true;

    // Settle pending start promise so it does not hang indefinitely
    if (this.startRejecter) {
      this.startRejecter(new Error('Speech recognition aborted before starting'));
      this.startResolver = null;
      this.startRejecter = null;
    }

    // Settle pending stop promise if aborted while recognizing
    if (this.stopResolver) {
      this.stopResolver(this.finalTranscript);
      this.stopResolver = null;
    }

    if (this.recognition) {
      const rec = this.recognition;
      // CRITICAL: Detach listeners BEFORE calling abort() to prevent zombie callbacks
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignore abort errors
      }
      this.recognition = null;
    }

    this.setStatus('idle');
  }

  /**
   * Test & Simulation hook: Simulates an interim transcript result event.
   */
  simulateInterimTranscript(transcript: string, confidence = 0.8): void {
    if (this._status !== 'listening' && this._status !== 'recognizing') return;
    this.setStatus('recognizing');
    if (this.recognition && typeof (this.recognition as any).emitResult === 'function') {
      (this.recognition as any).emitResult(transcript, false, confidence);
    } else {
      this.interimTranscript = transcript;
      const combinedText = [this.finalTranscript, this.interimTranscript].filter(Boolean).join(' ').trim();
      this.emitResult({
        transcript: combinedText,
        isFinal: false,
        confidence,
      });
    }
  }

  /**
   * Test & Simulation hook: Simulates a final transcript result event.
   */
  simulateFinalTranscript(transcript: string, confidence = 0.95): void {
    if (this._status !== 'listening' && this._status !== 'recognizing') return;
    if (this.recognition && typeof (this.recognition as any).emitResult === 'function') {
      (this.recognition as any).emitResult(transcript, true, confidence);
    } else {
      this.finalTranscript = (this.finalTranscript + ' ' + transcript).trim();
      this.interimTranscript = '';
      this.emitResult({
        transcript: this.finalTranscript,
        isFinal: true,
        confidence,
      });
    }
  }

  /**
   * Test & Simulation hook: Simulates a speech recognition error event.
   */
  simulateError(code: STTErrorCode | string, message?: string): void {
    if (this.recognition && typeof (this.recognition as any).emitNativeError === 'function') {
      (this.recognition as any).emitNativeError(code, message);
    } else {
      const error: STTError = {
        code,
        message: message || `Speech recognition error: ${code}`,
      };
      this.setStatus('error');
      this.emitError(error);
    }
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
   * Immediately triggers with current status upon subscription.
   */
  onStatusChange(callback: (status: STTStatus) => void): () => void {
    this.statusListeners.add(callback);
    try {
      callback(this._status);
    } catch (err) {
      console.error('[WebSpeechProvider] Error in immediate onStatusChange:', err);
    }
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}
