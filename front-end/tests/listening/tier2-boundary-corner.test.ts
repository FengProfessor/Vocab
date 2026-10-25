/**
 * Tier 2: Boundary & Corner Cases Test Suite for Listening Immersion Hub.
 * Verifies extreme boundaries, mathematical limits, silence hysteresis buffers,
 * string normalization edge cases, and corrupted data handling.
 */

import { TestRunner, expect, setupMockBrowserEnvironment, teardownMockBrowserEnvironment } from './test-harness';
import {
  getAllListeningVideos,
  getListeningVideoById,
  filterListeningVideos,
  findActiveCue,
  findActiveCueIndex,
  formatTime,
  tokenizeSentence,
  validateClozeAnswer,
  saveListeningAttempt,
  getListeningAttempt,
} from '../../src/lib/listening';
import type { TranscriptCue, ListeningAttempt } from '../../src/types/listening';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  const videos = getAllListeningVideos();
  const sampleVideo = getListeningVideoById('video-short-daily-life')!;
  const cues = sampleVideo.transcript;

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B1: Sub-Second Cue Boundaries & Micro-Offsets
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B1: Sub-Second Cue Boundaries & Precision Seeks', () => {
    runner.it('B1.1: Exact start timestamp matches active cue', () => {
      // cue-1: start 0.0, end 5.2
      const firstCue = cues[0];
      const idx = findActiveCueIndex(cues, firstCue.start);
      expect(idx).toBe(0);
      expect(cues[idx].id).toBe(firstCue.id);
    });

    runner.it('B1.2: Exact end timestamp matches active cue', () => {
      const firstCue = cues[0];
      const idx = findActiveCueIndex(cues, firstCue.end);
      expect(idx).toBe(0);
      expect(cues[idx].id).toBe(firstCue.id);
    });

    runner.it('B1.3: Micro-offset inside cue bounds resolves correctly', () => {
      const firstCue = cues[0];
      const idxStartPlus = findActiveCueIndex(cues, firstCue.start + 0.001);
      const idxEndMinus = findActiveCueIndex(cues, firstCue.end - 0.001);
      expect(idxStartPlus).toBe(0);
      expect(idxEndMinus).toBe(0);
    });

    runner.it('B1.4: Intermediate cue transition boundary resolves precisely without flashing', () => {
      // cue-2: start 5.8, end 10.5
      // cue-3: start 11.2, end 19.5
      const cue2 = cues[1];
      const cue3 = cues[2];

      const idxCue2Inside = findActiveCueIndex(cues, cue2.end);
      expect(idxCue2Inside).toBe(1);

      const idxCue3Start = findActiveCueIndex(cues, cue3.start);
      expect(idxCue3Start).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B2: Temporal Extremes (Zero, Negative, Past Duration)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B2: Temporal Extremes (Zero, Negative, Past Duration)', () => {
    runner.it('B2.1: Zero timestamp 0.0s resolves first cue if cue starts at 0', () => {
      const idx = findActiveCueIndex(cues, 0.0);
      expect(idx).toBe(0);
    });

    runner.it('B2.2: Negative timestamps return -1 and do not throw', () => {
      expect(findActiveCueIndex(cues, -0.0001)).toBe(-1);
      expect(findActiveCueIndex(cues, -1.0)).toBe(-1);
      expect(findActiveCueIndex(cues, -100.0)).toBe(-1);
      expect(findActiveCue(cues, -5.0)).toBeUndefined();
    });

    runner.it('B2.3: Timestamp far beyond video duration returns -1 gracefully', () => {
      const beyondDuration = sampleVideo.duration + 500;
      const idx = findActiveCueIndex(cues, beyondDuration);
      expect(idx).toBe(-1);
      expect(findActiveCue(cues, beyondDuration)).toBeUndefined();
    });

    runner.it('B2.4: Infinity and NaN timestamps do not crash binary search', () => {
      expect(findActiveCueIndex(cues, Infinity)).toBe(-1);
      expect(findActiveCueIndex(cues, -Infinity)).toBe(-1);
      expect(findActiveCueIndex(cues, NaN)).toBe(-1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B3: Silence Gap Hysteresis (1.2s Tolerance)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B3: Inter-Sentence Silence Gap Hysteresis (1.2s Tolerance)', () => {
    // Construct synthetic cues with known silence gap:
    // Cue A: 10.0 to 15.0 (gap to Cue B: 15.0 to 17.5 = 2.5s gap)
    // Cue B: 17.5 to 20.0
    const syntheticCues: TranscriptCue[] = [
      { id: 'cue-a', start: 10.0, end: 15.0, en: 'Sentence A', vi: 'Câu A' },
      { id: 'cue-b', start: 17.5, end: 20.0, en: 'Sentence B', vi: 'Câu B' },
    ];

    runner.it('B3.1: Inside 1.2s hysteresis buffer (end + 0.5s) retains active cue', () => {
      // 15.0 + 0.5 = 15.5s <= 15.0 + 1.2s (16.2s)
      const idx = findActiveCueIndex(syntheticCues, 15.5);
      expect(idx).toBe(0);
      expect(syntheticCues[idx].id).toBe('cue-a');
    });

    runner.it('B3.2: Exactly at 1.2s hysteresis boundary (end + 1.2s) retains active cue', () => {
      const idx = findActiveCueIndex(syntheticCues, 16.2);
      expect(idx).toBe(0);
      expect(syntheticCues[idx].id).toBe('cue-a');
    });

    runner.it('B3.3: Exceeding 1.2s hysteresis boundary (end + 1.21s) releases active cue (-1)', () => {
      const idx = findActiveCueIndex(syntheticCues, 16.21);
      expect(idx).toBe(-1);
    });

    runner.it('B3.4: Halfway through large gap (> 1.2s) returns -1', () => {
      const idx = findActiveCueIndex(syntheticCues, 17.0);
      expect(idx).toBe(-1);
    });

    runner.it('B3.5: If next cue begins sooner than 1.2s, maxGap caps at nextCue.start', () => {
      // Cue C: 30.0 to 32.0. Cue D: 32.5 to 35.0 (gap is only 0.5s)
      const smallGapCues: TranscriptCue[] = [
        { id: 'c1', start: 30.0, end: 32.0, en: 'One', vi: 'Một' },
        { id: 'c2', start: 32.5, end: 35.0, en: 'Two', vi: 'Hai' },
      ];
      // At 32.3s -> should be c1 (gap <= 32.5)
      expect(findActiveCueIndex(smallGapCues, 32.3)).toBe(0);
      // At 32.5s -> should immediately transition to c2
      expect(findActiveCueIndex(smallGapCues, 32.5)).toBe(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B4: Search Query Extremes & Regex Metacharacters
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B4: Search Query Extremes & Regex Metacharacters', () => {
    runner.it('B4.1: Empty search query returns all videos unfiltered', () => {
      const all = filterListeningVideos({ searchQuery: '' });
      expect(all.length).toBe(videos.length);
    });

    runner.it('B4.2: Whitespace-only search query returns all videos', () => {
      const all = filterListeningVideos({ searchQuery: '     ' });
      expect(all.length).toBe(videos.length);
    });

    runner.it('B4.3: Regex metacharacters in search query do not throw syntax errors', () => {
      const regexTrickyQuery = '.*+?^${}()|[]\\';
      expect(() => {
        const res = filterListeningVideos({ searchQuery: regexTrickyQuery });
        expect(Array.isArray(res)).toBe(true);
      }).not.toThrow();
    });

    runner.it('B4.4: Extremely long search string (1000 chars) handles smoothly without freezing', () => {
      const longQuery = 'english'.repeat(150);
      const res = filterListeningVideos({ searchQuery: longQuery });
      expect(res.length).toBe(0);
    });

    runner.it('B4.5: Unicode Vietnamese diacritics in search query match localized fields', () => {
      const resDaily = filterListeningVideos({ searchQuery: 'Đời sống' });
      expect(resDaily.length).toBeGreaterThan(0);
      expect(resDaily.some((v) => v.topic === 'daily_life')).toBe(true);

      const resCulture = filterListeningVideos({ searchQuery: 'Văn hoá' });
      expect(resCulture.length).toBeGreaterThan(0);
      expect(resCulture.some((v) => v.topic === 'culture')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B5: Filter Parameter Extremes & Invalid State Combinations
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B5: Filter Parameter Extremes', () => {
    runner.it('B5.1: All filter dimensions set to "all" returns entire dataset', () => {
      const res = filterListeningVideos({
        duration: 'all',
        topic: 'all',
        level: 'all',
        searchQuery: '',
      });
      expect(res.length).toBe(videos.length);
    });

    runner.it('B5.2: Multi-attribute filter matches accurate subset and non-matching returns empty array', () => {
      // In 200-video dataset, there are 5 short B2 workplace videos
      const res = filterListeningVideos({
        duration: 'short',
        topic: 'workplace',
        level: 'B2',
      });
      expect(res.length).toBeGreaterThanOrEqual(1);
      for (const v of res) {
        expect(v.durationCategory).toBe('short');
        expect(v.topic).toBe('workplace');
        expect(v.cefrLevel).toBe('B2');
      }

      // Non-matching search query with topic returns empty array gracefully
      const nonMatching = filterListeningVideos({
        topic: 'workplace',
        searchQuery: '__non_existent_search_term_xyz_123__',
      });
      expect(nonMatching.length).toBe(0);
    });

    runner.it('B5.3: Filtering against an empty source array returns empty array', () => {
      const res = filterListeningVideos([], { duration: 'short' });
      expect(res).toEqual([]);
    });

    runner.it('B5.4: Filtering with undefined arguments defaults to all videos', () => {
      const res = filterListeningVideos();
      expect(res.length).toBe(videos.length);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B6: Cloze Normalization Corner Cases & Typo Tolerance
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B6: Cloze Normalization Corner Cases & Typo Tolerance', () => {
    runner.it('B6.1: Case variations match successfully', () => {
      expect(validateClozeAnswer('alarm', 'ALARM')).toBe(true);
      expect(validateClozeAnswer('ALARM', 'alarm')).toBe(true);
      expect(validateClozeAnswer('aLaRm', 'AlArM')).toBe(true);
    });

    runner.it('B6.2: Heavy leading and trailing whitespace is stripped', () => {
      expect(validateClozeAnswer('   routine   ', 'routine')).toBe(true);
      expect(validateClozeAnswer('\tbreakfast\n', 'breakfast')).toBe(true);
    });

    runner.it('B6.3: Strips all standard punctuation marks', () => {
      expect(validateClozeAnswer('routine.', 'routine')).toBe(true);
      expect(validateClozeAnswer(',routine,', 'routine')).toBe(true);
      expect(validateClozeAnswer('?routine!', 'routine')).toBe(true);
      expect(validateClozeAnswer('"commencement"', 'commencement')).toBe(true);
      expect(validateClozeAnswer("(qualification)", 'qualification')).toBe(true);
      expect(validateClozeAnswer('experience;', 'experience')).toBe(true);
    });

    runner.it('B6.4: Empty user input or empty target returns false', () => {
      expect(validateClozeAnswer('', 'alarm')).toBe(false);
      expect(validateClozeAnswer('   ', 'alarm')).toBe(false);
      expect(validateClozeAnswer('alarm', '')).toBe(false);
      expect(validateClozeAnswer('', '')).toBe(false);
    });

    runner.it('B6.5: Distinguishes near-misses correctly', () => {
      // 1-typo tolerance
      expect(validateClozeAnswer('alarms', 'alarm')).toBe(true);
      expect(validateClozeAnswer('alrm', 'alarm')).toBe(true);
      // 2+ typos rejected
      expect(validateClozeAnswer('alrrrm', 'alarm')).toBe(false);
      expect(validateClozeAnswer('totallywrong', 'alarm')).toBe(false);
      expect(validateClozeAnswer('practice', 'practical')).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B7: formatTime Boundary Values
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B7: formatTime Boundary Values', () => {
    runner.it('B7.1: Zero and sub-minute boundaries', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(1)).toBe('00:01');
      expect(formatTime(59)).toBe('00:59');
    });

    runner.it('B7.2: Minute rollover boundaries', () => {
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(61)).toBe('01:01');
      expect(formatTime(599)).toBe('09:59');
      expect(formatTime(600)).toBe('10:00');
    });

    runner.it('B7.3: Hour rollover boundaries', () => {
      expect(formatTime(3599)).toBe('59:59');
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3601)).toBe('1:00:01');
      expect(formatTime(7325)).toBe('2:02:05');
    });

    runner.it('B7.4: Non-integer and floating point seconds truncate correctly', () => {
      expect(formatTime(12.85)).toBe('00:12');
      expect(formatTime(745.99)).toBe('12:25');
    });

    runner.it('B7.5: Negative and NaN numbers return safe fallback "00:00"', () => {
      expect(formatTime(-1)).toBe('00:00');
      expect(formatTime(-9999)).toBe('00:00');
      expect(formatTime(NaN)).toBe('00:00');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B8: Empty and Corrupted Transcript Array Handling
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B8: Empty & Single-Cue Transcripts', () => {
    runner.it('B8.1: Empty cues array returns -1 for any timestamp', () => {
      expect(findActiveCueIndex([], 10.0)).toBe(-1);
      expect(findActiveCue([], 10.0)).toBeUndefined();
    });

    runner.it('B8.2: Single cue transcript operates accurately on edges', () => {
      const singleCue: TranscriptCue[] = [
        { id: 'solo', start: 5.0, end: 10.0, en: 'Solo sentence', vi: 'Câu đơn' },
      ];

      expect(findActiveCueIndex(singleCue, 4.9)).toBe(-1);
      expect(findActiveCueIndex(singleCue, 5.0)).toBe(0);
      expect(findActiveCueIndex(singleCue, 7.5)).toBe(0);
      expect(findActiveCueIndex(singleCue, 10.0)).toBe(0);
      expect(findActiveCueIndex(singleCue, 11.0)).toBe(0); // within 1.2s gap
      expect(findActiveCueIndex(singleCue, 11.3)).toBe(-1); // beyond 1.2s gap
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary B9: Attempt Storage Edge Conditions
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B9: Attempt Storage Edge Conditions', () => {
    runner.it('B9.1: Zero score attempt persists and retrieves correctly', () => {
      setupMockBrowserEnvironment();
      try {
        const zeroAttempt: ListeningAttempt = {
          videoId: 'zero-test',
          completedAt: new Date().toISOString(),
          clozeScore: 0,
          clozeTotal: 4,
          quizScore: 0,
          quizTotal: 4,
          percentScore: 0,
        };

        saveListeningAttempt(zeroAttempt);
        const loaded = getListeningAttempt('zero-test');
        expect(loaded).toBeDefined();
        expect(loaded?.percentScore).toBe(0);
        expect(loaded?.quizScore).toBe(0);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('B9.2: Corrupted JSON in localStorage returns null safely without throwing', () => {
      const storage = setupMockBrowserEnvironment();
      try {
        storage.setItem('lingo_listening_attempt_corrupted-vid', '{ invalid JSON string ...');
        const loaded = getListeningAttempt('corrupted-vid');
        expect(loaded).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}
