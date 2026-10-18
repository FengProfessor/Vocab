/**
 * Represents the raw component scores across the four VSTEP skills before 0.5-increment rounding.
 */
export interface VstepRawSkillScoresDto {
  /** Raw Listening score on a 0..10 scale. */
  listening: number;

  /** Raw Reading score on a 0..10 scale. */
  reading: number;

  /** Raw Writing score on a 0..10 scale. */
  writing: number;

  /** Raw Speaking score on a 0..10 scale. */
  speaking: number;
}
