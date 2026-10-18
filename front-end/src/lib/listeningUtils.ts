import { TranscriptCueDto } from '@/types/exam/TranscriptCueDto';

/**
 * Pure utility class for interactive listening exercises, O(log N) audio cue synchronization,
 * and Levenshtein dictation accuracy scoring.
 * Migrated from legacy src/lib/listening-utils.ts.
 */
export class ListeningUtils {
  /**
   * Formats a duration in seconds into a concise Vietnamese label (e.g., "4p 30s").
   */
  public static formatDurationLabel(seconds: number): string {
    if (!seconds || seconds <= 0) {
      return '—';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) {
      return `${secs}s`;
    }
    return secs > 0 ? `${mins}p ${secs}s` : `${mins} phút`;
  }

  /**
   * Formats a timestamp in seconds into digital MM:SS notation (e.g., "04:05").
   */
  public static formatTimeMmSs(seconds: number): string {
    if (!seconds || Number.isNaN(seconds) || seconds < 0) {
      return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Finds the active transcript cue index at currentTime using O(log N) binary search.
   * Returns -1 if no cue spans the current playback position.
   */
  public static findActiveCueIndex(
    cues: readonly TranscriptCueDto[],
    currentTime: number
  ): number {
    if (!cues.length) {
      return -1;
    }

    let low = 0;
    let high = cues.length - 1;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const cue = cues[mid];

      if (currentTime >= cue.startTime && currentTime < cue.endTime) {
        return mid;
      }
      if (currentTime < cue.startTime) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (low > 0 && low - 1 < cues.length) {
      const prev = cues[low - 1];
      if (currentTime >= prev.startTime && currentTime <= prev.endTime + 0.3) {
        return low - 1;
      }
    }

    return -1;
  }

  /**
   * Computes the character-level Levenshtein edit distance between two strings
   * using O(min(M, N)) memory. Used for dictation and shadowing word tolerance.
   */
  public static levenshteinDistance(source: string, target: string): number {
    if (source === target) {
      return 0;
    }
    if (source.length === 0) {
      return target.length;
    }
    if (target.length === 0) {
      return source.length;
    }

    const row: number[] = Array.from({ length: target.length + 1 }, (_, idx) => idx);

    for (let i = 1; i <= source.length; i++) {
      let prev = i;
      for (let j = 1; j <= target.length; j++) {
        const val =
          source[i - 1] === target[j - 1]
            ? row[j - 1]
            : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
        row[j - 1] = prev;
        prev = val;
      }
      row[target.length] = prev;
    }

    return row[target.length];
  }

  /**
   * Computes a normalized dictation accuracy percentage (0..100%) comparing learner input to reference text.
   */
  public static calculateDictationAccuracy(expectedText: string, userAttempt: string): number {
    const cleanExpected = expectedText
      .toLowerCase()
      .replace(/[^\w\s']/g, '')
      .trim();
    const cleanAttempt = userAttempt
      .toLowerCase()
      .replace(/[^\w\s']/g, '')
      .trim();

    if (!cleanExpected) {
      return 100;
    }
    if (!cleanAttempt) {
      return 0;
    }

    const distance = ListeningUtils.levenshteinDistance(cleanExpected, cleanAttempt);
    const maxLen = Math.max(cleanExpected.length, cleanAttempt.length);
    return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
  }
}
