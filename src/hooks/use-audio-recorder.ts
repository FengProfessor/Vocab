'use client';

/**
 * Client-Side Audio Recorder Hook
 * File: src/hooks/use-audio-recorder.ts
 *
 * Provides a production-grade React hook for capturing voice audio via MediaRecorder:
 * 1. Dynamic MIME negotiation (tests MediaRecorder.isTypeSupported for WebM, MP4, AAC, WAV, OGG)
 * 2. Real-time audio volume analysis (Web Audio API AnalyserNode computing normalized 0.0 - 1.0 volume)
 * 3. Recording duration counter in seconds with optional auto-stop ceiling
 * 4. Clean start, stop, and cancel lifecycle returning the recorded audio Blob and URL
 * 5. Robust microphone track cleanup and AudioContext teardown on stop, cancel, or unmount
 * 6. SSR-safe guards for Node.js / Next.js server-side rendering environments
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioRecordingResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mimeType: string;
  fileSizeBytes: number;
}

export interface UseAudioRecorderOptions {
  /** Maximum recording duration in seconds before auto-stopping (e.g. 120) */
  maxDurationSeconds?: number;
  /** Optional callback fired when maxDurationSeconds ceiling is reached */
  onMaxDurationReached?: () => void;
  /** Preferred MIME type hint (e.g. 'audio/webm;codecs=opus') */
  preferredMimeType?: string;
  /** Audio bits per second for MediaRecorder compression */
  audioBitsPerSecond?: number;
}

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  durationSeconds: number;
  audioLevel: number; // 0.0 to 1.0 for visual pulse animation
  audioBlob: Blob | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioRecordingResult | null>;
  cancelRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  reset: () => void;
}

/**
 * Candidate MIME types in order of preference.
 * - audio/webm;codecs=opus: Optimal for modern Chrome, Firefox, Edge, Android
 * - audio/webm: Broad desktop Chromium
 * - audio/mp4: Modern Safari (macOS & iOS 14.1+)
 * - audio/aac: Safari iOS fallback
 * - audio/ogg;codecs=opus: Linux / Firefox
 * - audio/wav: Universal uncompressed fallback
 */
export const CANDIDATE_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
];

/**
 * Dynamically queries the client browser for the first supported audio recording MIME format.
 * SSR-safe: returns 'audio/webm' when executing on the server.
 */
export function getSupportedAudioMimeType(preferred?: string): string {
  if (
    typeof window === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof MediaRecorder.isTypeSupported !== 'function'
  ) {
    return 'audio/webm';
  }

  if (preferred) {
    try {
      if (MediaRecorder.isTypeSupported(preferred)) {
        return preferred;
      }
    } catch {
      // Continue to candidates if preferred fails check
    }
  }

  for (const mime of CANDIDATE_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Some mobile webviews throw on certain unsupported formats
    }
  }

  return ''; // Browser will pick native default
}

/**
 * Inspects browser environment to determine if MediaRecorder and mediaDevices are available.
 */
export function isAudioRecordingSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

export function useAudioRecorder(options?: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // References for mutable hardware resources
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const audioUrlRef = useRef<string | null>(null);
  const stopResolverRef = useRef<((res: AudioRecordingResult | null) => void) | null>(null);

  // Web Audio API volume analysis references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synchronize audioUrlRef to avoid leaking previous URLs
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  /**
   * Cleans up all hardware, timers, animation loops, and audio contexts safely.
   */
  const cleanupMedia = useCallback(() => {
    isRecordingRef.current = false;

    // 1. Cancel animation frame for volume analysis
    if (animFrameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Clear duration timer
    if (durationTimerRef.current !== null) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // 3. Stop all audio tracks to turn off the hardware microphone light
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // Ignore track stop errors
          }
        });
      } catch {
        // Ignore stream errors
      }
      streamRef.current = null;
    }

    // 4. Close Web Audio API AudioContext
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch {
        // Ignore AudioContext close errors
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  /**
   * Resets recorder state and releases any active object URL.
   */
  const reset = useCallback(() => {
    cleanupMedia();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    if (audioUrlRef.current && typeof window !== 'undefined') {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {
        // Ignore revocation error
      }
      audioUrlRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setDurationSeconds(0);
    setAudioLevel(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  }, [cleanupMedia]);

  /**
   * Start recording audio.
   */
  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setError('Audio recording is only available in browser environments.');
      return;
    }

    if (!isAudioRecordingSupported()) {
      setError('Microphone recording is not supported in this browser.');
      return;
    }

    // If currently recording, abort previous session cleanly
    reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Dynamic MIME negotiation
      const selectedMime = getSupportedAudioMimeType(options?.preferredMimeType);
      setMimeType(selectedMime);

      const recorderOptions: MediaRecorderOptions = {};
      if (selectedMime) {
        recorderOptions.mimeType = selectedMime;
      }
      if (options?.audioBitsPerSecond) {
        recorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
      }

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch {
        // Fallback without options if browser rejects specified settings
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError('MediaRecorder encountered an unexpected error.');
        cleanupMedia();
        setIsRecording(false);
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || selectedMime || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: finalMime });
        const finalUrl = typeof window !== 'undefined' ? URL.createObjectURL(finalBlob) : '';

        const finalDuration = Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000)
        );

        setAudioBlob(finalBlob);
        setAudioUrl(finalUrl);
        setIsRecording(false);
        setIsPaused(false);
        cleanupMedia();

        const result: AudioRecordingResult = {
          blob: finalBlob,
          url: finalUrl,
          durationSeconds: finalDuration,
          mimeType: finalMime,
          fileSizeBytes: finalBlob.size,
        };

        if (stopResolverRef.current) {
          stopResolverRef.current(result);
          stopResolverRef.current = null;
        }
      };

      // Set up Web Audio API AnalyserNode for volume pulse
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        try {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!analyserRef.current || !isRecordingRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize average (0-255) to 0.0 - 1.0 clamped
            const normalized = Math.min(1.0, Math.max(0.0, average / 128));
            setAudioLevel(Number(normalized.toFixed(3)));

            animFrameRef.current = window.requestAnimationFrame(updateVolume);
          };

          animFrameRef.current = window.requestAnimationFrame(updateVolume);
        } catch {
          // Volume analysis non-fatal fallback
        }
      }

      // Start recorder with 100ms timeslices for progressive buffer collection
      recorder.start(100);
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setIsRecording(true);
      setIsPaused(false);
      setError(null);

      // Start duration ticker
      durationTimerRef.current = setInterval(() => {
        if (!isRecordingRef.current) return;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDurationSeconds(elapsed);

        if (options?.maxDurationSeconds && elapsed >= options.maxDurationSeconds) {
          if (options.onMaxDurationReached) {
            options.onMaxDurationReached();
          }
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
              mediaRecorderRef.current.stop();
            } catch {
              // Ignore
            }
          }
        }
      }, 250);
    } catch (err) {
      cleanupMedia();
      setIsRecording(false);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access in browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone hardware detected on this device.');
        } else {
          setError(err.message || 'Failed to start audio recording.');
        }
      } else {
        setError('An unexpected error occurred while starting audio recording.');
      }
    }
  }, [options, cleanupMedia, reset]);

  /**
   * Stop active recording and return the accumulated AudioRecordingResult.
   */
  const stopRecording = useCallback((): Promise<AudioRecordingResult | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      stopResolverRef.current = resolve;
      try {
        recorder.stop();
      } catch (err) {
        cleanupMedia();
        resolve(null);
      }
    });
  }, [cleanupMedia]);

  /**
   * Cancel recording without saving audio chunks.
   */
  const cancelRecording = useCallback(() => {
    if (stopResolverRef.current) {
      stopResolverRef.current(null);
      stopResolverRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Detach onstop handler to suppress artifact compilation
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];
    cleanupMedia();

    if (audioUrlRef.current && typeof window !== 'undefined') {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {
        // Ignore revocation error
      }
      audioUrlRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setDurationSeconds(0);
    setAudioLevel(0);
    setAudioBlob(null);
    setAudioUrl(null);
  }, [cleanupMedia]);

  /**
   * Pause active recording.
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      } catch {
        // Ignore
      }
    }
  }, []);

  /**
   * Resume paused recording.
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMedia();
      if (audioUrlRef.current && typeof window !== 'undefined') {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch {
          // Ignore
        }
      }
    };
  }, [cleanupMedia]);

  const isSupported = isAudioRecordingSupported();

  return {
    isRecording,
    isPaused,
    durationSeconds,
    audioLevel,
    audioBlob,
    audioUrl,
    mimeType,
    error,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
    reset,
  };
}
