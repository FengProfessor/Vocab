import { FoundationClarityRating } from '@/types/enums/FoundationClarityRating';

/**
 * Props for the AudioRecorder speaking practice component.
 */
export interface AudioRecorderProps {
  /** Target English sentence or speaking prompt to record. */
  promptText: string;

  /** Invoked when the learner confirms how clearly they spoke after listening to their recording. */
  onRecordingComplete?: (clarity: FoundationClarityRating) => void;
}
