/**
 * Represents a synchronized audio transcript sentence segment with start and end timestamps.
 */
export interface TranscriptCueDto {
  /** Zero-based index of the sentence cue in the transcript. */
  index: number;

  /** Start timestamp of the spoken sentence in seconds. */
  startTime: number;

  /** End timestamp of the spoken sentence in seconds. */
  endTime: number;

  /** English spoken text for this cue. */
  text: string;

  /** Optional Vietnamese translation of the sentence. */
  translation?: string;

  /** Optional speaker label (e.g., "Speaker M", "Woman"). */
  speaker?: string;
}
