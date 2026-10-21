/**
 * State and controls of a microphone recording session.
 */
export interface MediaRecorderControls {
  /** Whether the microphone is currently recording. */
  isRecording: boolean;
  /** Seconds elapsed in the current recording. */
  elapsedSeconds: number;
  /** Object URL of the last finished recording, or null. */
  audioUrl: string | null;
  /** Human-readable error when the microphone is unavailable or denied. */
  errorMessage: string | null;
  /** Starts a new recording (asks for microphone permission on first use). */
  start: () => Promise<void>;
  /** Stops the current recording and exposes the audio URL. */
  stop: () => void;
  /** Discards the last recording. */
  reset: () => void;
}
