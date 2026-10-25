/**
 * Official ETS 990 Barem Conversion Tables for TOEIC Listening and Reading.
 *
 * References:
 * - ETS Official TOEIC Test-Preparation Guide & IIG Vietnam Standard Conversion.
 * - Listening: Raw 0-100 -> Scaled 5-495
 * - Reading: Raw 0-100 -> Scaled 5-495
 * - Total: Scaled 10-990
 *
 * Each array is indexed 0 through 100 (exactly 101 elements).
 */

export const ETS_LISTENING_BAREM: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
  75, 80, 85, 90, 95, 100, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160,
  165, 170, 175, 180, 185, 190, 195, 200, 210, 215, 220, 230, 240, 245, 250,
  255, 260, 270, 275, 280, 290, 295, 300, 310, 315, 320, 325, 330, 335, 340,
  345, 350, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420,
  425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495,
  495, 495, 495, 495, 495,
] as const;

export const ETS_READING_BAREM: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135,
  140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 210, 215,
  220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290,
  295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365,
  370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 445,
  455, 465, 475, 485, 495,
] as const;

/**
 * Clamp raw score to [0, 100] and return rounded integer.
 */
function clampScore(raw: number): number {
  if (typeof raw !== 'number' || isNaN(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Look up Listening scaled score from raw score (0-100).
 */
export function lookupListeningScore(raw: number): number {
  return ETS_LISTENING_BAREM[clampScore(raw)];
}

/**
 * Look up Reading scaled score from raw score (0-100).
 */
export function lookupReadingScore(raw: number): number {
  return ETS_READING_BAREM[clampScore(raw)];
}

/**
 * Convert raw Listening and Reading scores to scaled scores.
 */
export function convertRawToScaled(rawListening: number, rawReading: number) {
  const scaledListening = lookupListeningScore(rawListening);
  const scaledReading = lookupReadingScore(rawReading);
  const scaledTotal = scaledListening + scaledReading;
  return {
    scaledListening,
    scaledReading,
    scaledTotal,
  };
}
