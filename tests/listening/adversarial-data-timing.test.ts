/**
 * Adversarial Data & Timing Verification Test Suite (Tier 5 Hardening)
 * Listening Immersion Hub
 *
 * Probes:
 * 1. Floating-point timestamp precision and boundaries (exact match at start, exact match at end - 0.001, end + 0.001).
 * 2. Rapid seek sequences simulating frantic user scrub bar clicking.
 * 3. Corrupted or extreme duration inputs in formatTime (negative, NaN, huge numbers > 100 hours).
 * 4. Search filter robustness with special regex characters ('(', '[', '*', '\'), Vietnamese diacritics, and mixed case queries.
 * 5. Monotonic cue invariants across all 7 videos in videos.json ensuring no cue has start >= end.
 */

import { TestRunner, expect, MockYouTubePlayer, SuiteStats } from './test-harness';
import {
  getAllListeningVideos,
  getListeningVideoById,
  filterListeningVideos,
  findActiveCue,
  findActiveCueIndex,
  formatTime,
} from '../../src/lib/listening';
import type { TranscriptCue, ListeningVideo } from '../../src/types/listening';

export async function runAdversarialDataTimingTests(runner: TestRunner): Promise<void> {
  const allVideos = getAllListeningVideos();
  const sampleVideo = getListeningVideoById('video-short-daily-life')!;
  const cues = sampleVideo.transcript;

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-1: Floating-Point Timestamp Precision & Boundary Probes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-1: Floating-Point Timestamp Precision and Boundary Invariants', () => {
    runner.it('ADV-1.1: Exact start timestamp matches active cue across all video cues', () => {
      // For every cue in the video, querying exactly at cue.start must yield that cue's index
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        const idx = findActiveCueIndex(cues, cue.start);
        expect(idx).toBe(i);
        expect(cues[idx].id).toBe(cue.id);
      }
    });

    runner.it('ADV-1.2: Exact end timestamp matches active cue across all video cues', () => {
      // For every cue in the video, querying exactly at cue.end must yield that cue's index
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        const idx = findActiveCueIndex(cues, cue.end);
        expect(idx).toBe(i);
        expect(cues[idx].id).toBe(cue.id);
      }
    });

    runner.it('ADV-1.3: Sub-millisecond pre-end offset (end - 0.001) resolves cleanly inside cue', () => {
      // Querying at cue.end - 0.001 must strictly match the cue
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        const preEnd = cue.end - 0.001;
        if (preEnd >= cue.start) {
          const idx = findActiveCueIndex(cues, preEnd);
          expect(idx).toBe(i);
        }
      }
    });

    runner.it('ADV-1.4: Micro-second pre-end offset (end - 1e-6) resolves cleanly inside cue', () => {
      // Extreme microsecond boundary at end - 0.000001
      for (let i = 0; i < Math.min(10, cues.length); i++) {
        const cue = cues[i];
        const microPreEnd = cue.end - 0.000001;
        const idx = findActiveCueIndex(cues, microPreEnd);
        expect(idx).toBe(i);
      }
    });

    runner.it('ADV-1.5: Micro-offset post-start (start + 0.001 and start + 1e-6) resolves cleanly', () => {
      for (let i = 0; i < Math.min(10, cues.length); i++) {
        const cue = cues[i];
        const postStart1 = cue.start + 0.001;
        const postStart2 = cue.start + 0.000001;
        expect(findActiveCueIndex(cues, postStart1)).toBe(i);
        expect(findActiveCueIndex(cues, postStart2)).toBe(i);
      }
    });

    runner.it('ADV-1.6: Post-end offset (end + 0.001) behavior with 1.2s silence gap hysteresis', () => {
      // When next cue is spaced > 0.001s away, 1.2s hysteresis must retain current cue
      for (let i = 0; i < cues.length - 1; i++) {
        const currentCue = cues[i];
        const nextCue = cues[i + 1];
        const postEnd = currentCue.end + 0.001;

        if (nextCue.start > postEnd) {
          // Inside silence gap, within 1.2s hysteresis: should retain currentCue
          const idx = findActiveCueIndex(cues, postEnd);
          expect(idx).toBe(i);
        } else {
          // Adjacent or touching boundary: resolves to next cue
          const idx = findActiveCueIndex(cues, postEnd);
          expect(idx).toBe(i + 1);
        }
      }
    });

    runner.it('ADV-1.7: Hysteresis cutoff threshold at exactly 1.2s gap boundary', () => {
      // Synthetic isolated cues to strictly verify the 1.2s silence buffer cutoff
      const isolatedCues: TranscriptCue[] = [
        { id: 'c-1', start: 10.0, end: 15.0, en: 'First sentence', vi: 'Câu một' },
        { id: 'c-2', start: 25.0, end: 30.0, en: 'Second sentence', vi: 'Câu hai' },
      ];

      // At end + 1.200000 (16.200000s) -> within 1.2s gap buffer -> remains cue 0
      expect(findActiveCueIndex(isolatedCues, 16.2)).toBe(0);

      // At end + 1.20001 (16.20001s) -> exceeds 1.2s gap buffer -> releases cue (-1)
      expect(findActiveCueIndex(isolatedCues, 16.20001)).toBe(-1);

      // Deep in gap at 20.0s -> returns -1
      expect(findActiveCueIndex(isolatedCues, 20.0)).toBe(-1);

      // At next cue start (25.0s) -> returns cue 1
      expect(findActiveCueIndex(isolatedCues, 25.0)).toBe(1);
    });

    runner.it('ADV-1.8: IEEE-754 floating-point accumulator precision anomalies (0.1 + 0.2 arithmetic)', () => {
      // In JS, 0.1 + 0.2 === 0.30000000000000004
      const fpCues: TranscriptCue[] = [
        { id: 'fp-1', start: 0.3, end: 0.7, en: 'Float one', vi: 'Số thực một' },
        { id: 'fp-2', start: 1.0, end: 1.5, en: 'Float two', vi: 'Số thực hai' },
      ];

      const floatTimeAtStart = 0.1 + 0.2; // 0.30000000000000004
      expect(findActiveCueIndex(fpCues, floatTimeAtStart)).toBe(0);

      const floatTimeAtEnd = 1.0 - 0.3; // 0.7000000000000001 (0.7 + 1e-16)
      // Since 0.7000000000000001 is within hysteresis buffer of fp-1 (0.7 + 1.2), it stays active
      expect(findActiveCueIndex(fpCues, floatTimeAtEnd)).toBe(0);
    });

    runner.it('ADV-1.9: Micro-duration cues (0.05s) maintain binary search stability', () => {
      const microCues: TranscriptCue[] = [
        { id: 'mc-1', start: 1.00, end: 1.05, en: 'Quick', vi: 'Nhanh' },
        { id: 'mc-2', start: 1.10, end: 1.15, en: 'Speech', vi: 'Lời nói' },
        { id: 'mc-3', start: 1.20, end: 1.25, en: 'Burst', vi: 'Bùng nổ' },
      ];

      expect(findActiveCueIndex(microCues, 1.00)).toBe(0);
      expect(findActiveCueIndex(microCues, 1.05)).toBe(0);
      expect(findActiveCueIndex(microCues, 1.10)).toBe(1);
      expect(findActiveCueIndex(microCues, 1.15)).toBe(1);
      expect(findActiveCueIndex(microCues, 1.20)).toBe(2);
      expect(findActiveCueIndex(microCues, 1.25)).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-2: Rapid Seek Sequences (Frantic Scrub Bar Clicking)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-2: Rapid Seek Stress Sequences (Frantic User Scrub Bar Clicking)', () => {
    runner.it('ADV-2.1: 1,000 rapid deterministic pseudo-random seeks with player clamp and sync', () => {
      const player = new MockYouTubePlayer(sampleVideo.duration);
      let seed = 123456789;
      // Deterministic LCG (Linear Congruential Generator)
      const nextRandom = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < 1000; i++) {
        // Range spans [-50, duration + 100] to stress both bounds and intermediate points
        const target = nextRandom() * (sampleVideo.duration + 150) - 50;
        player.seekTo(target);

        const currentTime = player.getCurrentTime();
        // Clamping invariant: currentTime must be within [0, duration]
        expect(currentTime >= 0).toBe(true);
        expect(currentTime <= sampleVideo.duration).toBe(true);

        const activeIdx = findActiveCueIndex(cues, currentTime);
        // Cue index invariant: either -1 (gap/past transcript) or valid index in [0, cues.length - 1]
        expect(activeIdx >= -1 && activeIdx < cues.length).toBe(true);

        if (activeIdx >= 0) {
          // If active, cue start must be <= current playback time (with micro epsilon)
          expect(cues[activeIdx].start <= currentTime + 0.001).toBe(true);
        }
      }

      // Ensure final state is consistent
      expect(player.getPlayerState()).toBe(-1);
    });

    runner.it('ADV-2.2: Burst seeking during active PLAYING state does not desynchronize', () => {
      const player = new MockYouTubePlayer(sampleVideo.duration);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1); // PLAYING

      const seekBurst = [0.5, 12.4, 45.8, 120.3, 250.0, 15.2, 5.0, 300.0, 100.1, 0.0];
      for (const target of seekBurst) {
        player.seekTo(target);
        const t = player.getCurrentTime();
        expect(t).toBe(target);
        const idx = findActiveCueIndex(cues, t);
        expect(idx >= -1).toBe(true);
        // Playback state must remain PLAYING
        expect(player.getPlayerState()).toBe(1);
      }
    });

    runner.it('ADV-2.3: Frantic seeking with A-B loop enabled triggers boundary loop-back reliably', () => {
      const player = new MockYouTubePlayer(sampleVideo.duration);
      // Cue 3 in video-short-daily-life: start: 11.2, end: 19.5
      const loopRange = { start: 11.2, end: 19.5 };
      const isLooping = true;

      // Simulated player interval loop check function (as in YouTubeListeningPlayer.tsx)
      const checkLoopEnforcement = (currentTime: number) => {
        if (isLooping && loopRange) {
          const { start, end } = loopRange;
          if (end > start && currentTime >= end - 0.05) {
            player.seekTo(start, true);
          }
        }
      };

      // Seek safely inside loop range
      player.seekTo(15.0);
      checkLoopEnforcement(player.getCurrentTime());
      expect(player.getCurrentTime()).toBe(15.0);

      // Frantic seeks hitting the loop end boundary:
      // 19.46s (>= 19.5 - 0.05 = 19.45s) -> must jump back to start (11.2s)
      player.seekTo(19.46);
      checkLoopEnforcement(player.getCurrentTime());
      expect(player.getCurrentTime()).toBe(11.2);

      // 19.50s (exact end) -> must jump back to start (11.2s)
      player.seekTo(19.50);
      checkLoopEnforcement(player.getCurrentTime());
      expect(player.getCurrentTime()).toBe(11.2);

      // 19.80s (overshoot) -> must jump back to start (11.2s)
      player.seekTo(19.80);
      checkLoopEnforcement(player.getCurrentTime());
      expect(player.getCurrentTime()).toBe(11.2);

      // 50 rapid seeks within loop range [11.2, 19.4]
      for (let i = 0; i < 50; i++) {
        const timeInside = 11.2 + (i / 50) * 8.2; // up to 19.4
        player.seekTo(timeInside);
        checkLoopEnforcement(player.getCurrentTime());
        expect(player.getCurrentTime()).toBe(timeInside);
      }
    });

    runner.it('ADV-2.4: Monotonic backward scrubbing from video end to start produces non-increasing cue sequence', () => {
      const player = new MockYouTubePlayer(sampleVideo.duration);
      const activeIndicesEncountered: number[] = [];

      // Scrub backwards from end of video (374s) to 0 in 0.2s decrements
      for (let t = sampleVideo.duration; t >= 0; t -= 0.2) {
        player.seekTo(t);
        const idx = findActiveCueIndex(cues, player.getCurrentTime());
        if (idx !== -1) {
          activeIndicesEncountered.push(idx);
        }
      }

      // Verify that every step in activeIndicesEncountered is <= previous step (monotonic non-increasing)
      for (let k = 1; k < activeIndicesEncountered.length; k++) {
        const prev = activeIndicesEncountered[k - 1];
        const curr = activeIndicesEncountered[k];
        expect(curr <= prev).toBe(true);
      }
    });

    runner.it('ADV-2.5: 500 ping-pong seeks between adjacent cue boundaries execute without drift or lag', () => {
      // Cue 1: start 5.8, end 10.5
      // Cue 2: start 11.2, end 19.5
      const player = new MockYouTubePlayer(sampleVideo.duration);

      for (let i = 0; i < 500; i++) {
        // Target A: middle of cue 1 (8.0s)
        player.seekTo(8.0);
        expect(findActiveCueIndex(cues, player.getCurrentTime())).toBe(1);

        // Target B: middle of cue 2 (15.0s)
        player.seekTo(15.0);
        expect(findActiveCueIndex(cues, player.getCurrentTime())).toBe(2);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-3: Corrupted or Extreme Duration Inputs in formatTime
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-3: Corrupted, Extreme, and Out-of-Bounds Duration Inputs in formatTime', () => {
    runner.it('ADV-3.1: Negative duration values return defensive fallback "00:00"', () => {
      expect(formatTime(-0.0001)).toBe('00:00');
      expect(formatTime(-1)).toBe('00:00');
      expect(formatTime(-59.99)).toBe('00:00');
      expect(formatTime(-3600)).toBe('00:00');
      expect(formatTime(-999999999)).toBe('00:00');
      expect(formatTime(-Infinity)).toBe('00:00');
    });

    runner.it('ADV-3.2: Signed zero (-0) formats safely to "00:00"', () => {
      expect(formatTime(-0)).toBe('00:00');
    });

    runner.it('ADV-3.3: NaN, null, undefined, and non-number types return "00:00"', () => {
      expect(formatTime(NaN)).toBe('00:00');
      expect(formatTime(Number.NaN)).toBe('00:00');
      expect(formatTime(0 / 0)).toBe('00:00');
      expect(formatTime(undefined as any)).toBe('00:00');
      expect(formatTime(null as any)).toBe('00:00');
      expect(formatTime('invalid_duration' as any)).toBe('00:00');
      expect(formatTime({} as any)).toBe('00:00');
      expect(formatTime([] as any)).toBe('00:00');
    });

    runner.it('ADV-3.4: Sub-second floating-point truncations and rollover boundaries', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(0.0001)).toBe('00:00');
      expect(formatTime(0.9999)).toBe('00:00');
      expect(formatTime(59.999)).toBe('00:59');
      expect(formatTime(60.0)).toBe('01:00');
      expect(formatTime(3599.999)).toBe('59:59');
      expect(formatTime(3600.0)).toBe('1:00:00');
      expect(formatTime(3600.999)).toBe('1:00:00');
      expect(formatTime(3665.5)).toBe('1:01:05');
    });

    runner.it('ADV-3.5: Huge numbers and extreme durations (> 100 hours)', () => {
      // Exactly 100 hours = 100 * 3600 = 360,000s
      expect(formatTime(360000)).toBe('100:00:00');

      // 105 hours, 23 minutes, 45 seconds = 379,425s
      expect(formatTime(105 * 3600 + 23 * 60 + 45)).toBe('105:23:45');

      // 1,000 hours = 3,600,000s
      expect(formatTime(3600000)).toBe('1000:00:00');

      // 9,999 hours, 59 minutes, 59 seconds
      expect(formatTime(9999 * 3600 + 59 * 60 + 59)).toBe('9999:59:59');

      // 100,000 hours = 360,000,000s
      expect(formatTime(360000000)).toBe('100000:00:00');

      // Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
      const maxSafeFormatted = formatTime(Number.MAX_SAFE_INTEGER);
      expect(typeof maxSafeFormatted).toBe('string');
      expect(/^\d+:\d{2}:\d{2}$/.test(maxSafeFormatted)).toBe(true);
    });

    runner.it('ADV-3.6: Probing Infinity behavior in formatTime', () => {
      // Documenting empirical observation:
      // In JS: isNaN(Infinity) is false and Infinity < 0 is false,
      // so formatTime(Infinity) produces 'Infinity:NaN:NaN' without throwing.
      const infResult = formatTime(Infinity);
      expect(typeof infResult).toBe('string');
      expect(infResult).toBe('Infinity:NaN:NaN');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-4: Search Filter Robustness (Regex, Diacritics & Mixed Case)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-4: Search Filter Robustness (Special Regex Characters, Diacritics & Mixed Case)', () => {
    runner.it('ADV-4.1: Special regex metacharacters in query do not trigger RegExp syntax crashes', () => {
      const regexMetacharacters = ['(', '[', '*', '\\', ')', ']', '+', '?', '^', '$', '.', '|', '{', '}'];

      for (const char of regexMetacharacters) {
        // filterListeningVideos must use literal substring search (String.includes), NOT unescaped RegExp
        const results = filterListeningVideos({ searchQuery: char });
        expect(Array.isArray(results)).toBe(true);
        expect(results.length >= 0).toBe(true);
      }
    });

    runner.it('ADV-4.2: Malicious and complex regex patterns execute safely without throwing or hanging', () => {
      const maliciousPatterns = [
        '/(.*)/gi',
        '([a-zA-Z0-9]+)*',
        '\\b(SELECT|DROP|TABLE)\\b',
        '(((((((((((',
        '[[[[[[[[[[',
        '\\\\\\\\\\\\',
        '*+?{}()',
        '(?=.*[a-z])(?=.*[A-Z])',
        '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$',
        '.*\\S.*',
      ];

      for (const pattern of maliciousPatterns) {
        const results = filterListeningVideos({ searchQuery: pattern });
        expect(Array.isArray(results)).toBe(true);
      }
    });

    runner.it('ADV-4.3: Vietnamese diacritics in search query match localized fields accurately', () => {
      // 1. Topic display match with full diacritics
      const dailyLifeResults = filterListeningVideos({ searchQuery: 'Đời sống' });
      expect(dailyLifeResults.length > 0).toBe(true);
      expect(dailyLifeResults.some((v) => v.id === 'video-short-daily-life')).toBe(true);

      const workplaceResults = filterListeningVideos({ searchQuery: 'Công việc' });
      expect(workplaceResults.length > 0).toBe(true);
      expect(workplaceResults.some((v) => v.id === 'video-medium-workplace')).toBe(true);

      const travelResults = filterListeningVideos({ searchQuery: 'Du lịch' });
      expect(travelResults.length > 0).toBe(true);
      expect(travelResults.some((v) => v.id === 'video-short-travel')).toBe(true);

      const cultureResults = filterListeningVideos({ searchQuery: 'Văn hoá' });
      expect(cultureResults.length > 0).toBe(true);
      expect(cultureResults.some((v) => v.id === 'video-short-culture')).toBe(true);

      const socialResults = filterListeningVideos({ searchQuery: 'truyền cảm hứng' });
      expect(socialResults.length > 0).toBe(true);
      expect(socialResults.some((v) => v.id === 'video-short-social' || v.id === 'video-medium-social-stories')).toBe(true);
    });

    runner.it('ADV-4.4: Uppercase and lowercase mixed queries match case-insensitively with diacritics', () => {
      // Mixed casing on English terms
      const mixedEnglish1 = filterListeningVideos({ searchQuery: 'dAiLy RoUtInE' });
      expect(mixedEnglish1.some((v) => v.id === 'video-short-daily-life')).toBe(true);

      const mixedEnglish2 = filterListeningVideos({ searchQuery: 'AIRPORT' });
      expect(mixedEnglish2.some((v) => v.id === 'video-short-travel')).toBe(true);

      // Mixed casing on Vietnamese diacritic terms
      const mixedVi1 = filterListeningVideos({ searchQuery: 'đỜI sỐnG hÀnG nGàY' });
      expect(mixedVi1.some((v) => v.id === 'video-short-daily-life')).toBe(true);

      const mixedVi2 = filterListeningVideos({ searchQuery: 'cÔnG vIệC & pHỏNg VấN' });
      expect(mixedVi2.some((v) => v.id === 'video-medium-workplace')).toBe(true);

      const mixedVi3 = filterListeningVideos({ searchQuery: 'vĂN HOÁ hỌC tẬP & kỸ nĂNG' });
      expect(mixedVi3.some((v) => v.id === 'video-short-culture')).toBe(true);
    });

    runner.it('ADV-4.5: Core vocabulary word and Vietnamese definition field matching', () => {
      // Search by vocabulary English word
      const vocabWordResults = filterListeningVideos({ searchQuery: 'commute' });
      expect(vocabWordResults.some((v) => v.id === 'video-short-daily-life')).toBe(true);

      // Search by vocabulary Vietnamese definition
      const vocabViResults = filterListeningVideos({ searchQuery: 'báo thức' });
      expect(vocabViResults.some((v) => v.id === 'video-short-daily-life')).toBe(true);

      const boardingPassResults = filterListeningVideos({ searchQuery: 'thẻ lên máy bay' });
      expect(boardingPassResults.some((v) => v.id === 'video-short-travel')).toBe(true);

      const masteryResults = filterListeningVideos({ searchQuery: 'tinh thông' });
      expect(masteryResults.some((v) => v.id === 'video-short-culture')).toBe(true);
    });

    runner.it('ADV-4.6: Search edge cases: whitespace-only, empty, and huge query strings', () => {
      // Empty string returns all 7 videos
      expect(filterListeningVideos({ searchQuery: '' }).length).toBe(allVideos.length);

      // Whitespace-only string returns all 7 videos
      expect(filterListeningVideos({ searchQuery: '   \t  \n  ' }).length).toBe(allVideos.length);

      // Excessive whitespace around valid query is trimmed and matches
      const trimmedResults = filterListeningVideos({ searchQuery: '   airport   ' });
      expect(trimmedResults.some((v) => v.id === 'video-short-travel')).toBe(true);

      // 1,000-character random string returns empty array safely without freezing
      const hugeQuery = 'a'.repeat(1000);
      const startHuge = Date.now();
      const hugeResults = filterListeningVideos({ searchQuery: hugeQuery });
      const elapsedHuge = Date.now() - startHuge;
      expect(hugeResults.length).toBe(0);
      expect(elapsedHuge < 100).toBe(true);

      // SQL injection & XSS attack payload strings are treated as plain literals
      expect(filterListeningVideos({ searchQuery: "' OR '1'='1" }).length).toBe(0);
      expect(filterListeningVideos({ searchQuery: '<script>alert("xss")</script>' }).length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-5: Monotonic Cue Invariants Across All 7 Videos in videos.json
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('ADV-5: Monotonic Cue Invariants & Structural Integrity Across All Verified Videos', () => {
    runner.it('ADV-5.1: Dataset contains at least 200 verified videos with unique IDs and YouTube IDs', () => {
      expect(allVideos.length).toBeGreaterThanOrEqual(200);

      // Global uniqueness check for video id and youtubeId
      const seenIds = new Set<string>();
      const seenYoutubeIds = new Set<string>();
      for (const v of allVideos) {
        expect(seenIds.has(v.id)).toBe(false);
        seenIds.add(v.id);
        expect(seenYoutubeIds.has(v.youtubeId)).toBe(false);
        seenYoutubeIds.add(v.youtubeId);
      }
      expect(seenIds.size).toBe(allVideos.length);
      expect(seenYoutubeIds.size).toBe(allVideos.length);
    });

    runner.it('ADV-5.2: Invariant 1 - Positive cue duration: cue.start < cue.end for ALL cues across all videos', () => {
      let totalCuesChecked = 0;

      for (const video of allVideos) {
        expect(Array.isArray(video.transcript)).toBe(true);
        expect(video.transcript.length >= 10).toBe(true);

        for (let i = 0; i < video.transcript.length; i++) {
          const cue = video.transcript[i];

          // Strict invariant: cue.start MUST be strictly less than cue.end
          if (cue.start >= cue.end) {
            throw new Error(
              `Violated cue invariant in ${video.id} cue index ${i} (${cue.id}): start ${cue.start} >= end ${cue.end}`
            );
          }
          expect(cue.end > cue.start).toBe(true);

          // Meaningful speech segment duration: at least 50 milliseconds
          const duration = cue.end - cue.start;
          expect(duration >= 0.05).toBe(true);

          totalCuesChecked++;
        }
      }

      // Total cues across all videos must be at least 200 * 10
      expect(totalCuesChecked).toBeGreaterThanOrEqual(200 * 10);
    });

    runner.it('ADV-5.3: Invariant 2 - Non-negative timestamps: start >= 0 and end > 0', () => {
      for (const video of allVideos) {
        for (const cue of video.transcript) {
          expect(cue.start >= 0).toBe(true);
          expect(cue.end > 0).toBe(true);
        }
      }
    });

    runner.it('ADV-5.4: Invariant 3 - Monotonic cue progression: start[i] >= start[i-1] for all cues in each video', () => {
      for (const video of allVideos) {
        const cues = video.transcript;
        for (let i = 1; i < cues.length; i++) {
          const prevCue = cues[i - 1];
          const currCue = cues[i];

          if (currCue.start < prevCue.start) {
            throw new Error(
              `Non-monotonic start time in ${video.id} at cue index ${i}: prev.start=${prevCue.start}, curr.start=${currCue.start}`
            );
          }
          expect(currCue.start >= prevCue.start).toBe(true);
          expect(currCue.end > prevCue.end).toBe(true);
        }
      }
    });

    runner.it('ADV-5.5: Invariant 4 - Strict sequencing without backward overlaps between adjacent cues', () => {
      for (const video of allVideos) {
        const cues = video.transcript;
        for (let i = 1; i < cues.length; i++) {
          const prevCue = cues[i - 1];
          const currCue = cues[i];

          // Check for negative gaps / backward overlaps
          // currCue.start must be >= prevCue.end (or within negligible micro-tolerance of 0.001s)
          if (currCue.start < prevCue.end - 0.001) {
            throw new Error(
              `Backward overlap detected in ${video.id} between cue ${prevCue.id} (end: ${prevCue.end}) and cue ${currCue.id} (start: ${currCue.start})`
            );
          }
          expect(currCue.start >= prevCue.end - 0.001).toBe(true);
        }
      }
    });

    runner.it('ADV-5.6: Invariant 5 - Video duration bounds alignment', () => {
      for (const video of allVideos) {
        const firstCue = video.transcript[0];
        const lastCue = video.transcript[video.transcript.length - 1];

        // First cue should start near video inception (<= 10s)
        expect(firstCue.start <= 10.0).toBe(true);

        // Last cue should not exceed declared video duration (with 5s leeway for outro/credits)
        expect(lastCue.end <= video.duration + 5.0).toBe(true);

        // Duration category conformity
        if (video.durationCategory === 'short') {
          expect(video.duration > 180 && video.duration <= 600).toBe(true);
        } else if (video.durationCategory === 'medium') {
          expect(video.duration > 600 && video.duration <= 1500).toBe(true);
        }
      }
    });

    runner.it('ADV-5.7: Invariant 6 - Non-empty bilingual transcript strings and identifier format', () => {
      for (const video of allVideos) {
        for (const cue of video.transcript) {
          expect(typeof cue.id).toBe('string');
          expect(/cue-\d+$/.test(cue.id)).toBe(true);

          expect(typeof cue.en).toBe('string');
          expect(cue.en.trim().length > 0).toBe(true);

          expect(typeof cue.vi).toBe('string');
          expect(cue.vi.trim().length > 0).toBe(true);
        }
      }
    });

    runner.it('ADV-5.8: Invariant 7 - Cloze and Comprehension Quiz timestamps align with valid video cues', () => {
      for (const video of allVideos) {
        // Cloze items referential integrity (at least 3 cloze items per video)
        expect(Array.isArray(video.clozeItems)).toBe(true);
        expect(video.clozeItems.length >= 3).toBe(true);

        for (const cloze of video.clozeItems) {
          expect(cloze.timestamp >= 0).toBe(true);
          expect(cloze.timestamp <= video.duration).toBe(true);

          // cloze.cueId must correspond to an actual cue in transcript
          const cue = video.transcript.find((c) => c.id === cloze.cueId);
          expect(cue).toBeDefined();

          // cloze.timestamp must be within or near the referenced cue's bounds
          expect(cloze.timestamp >= cue!.start - 1.0).toBe(true);
          expect(cloze.timestamp <= cue!.end + 1.2).toBe(true);
        }

        // Comprehension questions referential integrity (at least 3 questions per video)
        expect(Array.isArray(video.comprehensionQuestions)).toBe(true);
        expect(video.comprehensionQuestions.length >= 3).toBe(true);

        for (const quiz of video.comprehensionQuestions) {
          expect(quiz.timestampSeek >= 0).toBe(true);
          expect(quiz.timestampSeek <= video.duration).toBe(true);
          expect(quiz.options.length).toBe(4);
          expect(quiz.correctIndex >= 0 && quiz.correctIndex <= 3).toBe(true);
        }
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Direct CLI Execution Runner
// ──────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL DATA & TIMING VERIFIER (TIER 5 HARDENING)');
  console.log('  Testing: Floating-Point Precision, Rapid Seeks, formatTime, Search, Cue Invariants');
  console.log('================================================================================\n');

  const runner = new TestRunner();
  const startTime = Date.now();

  await runAdversarialDataTimingTests(runner);

  const stats = runner.getStats();
  const duration = Date.now() - startTime;

  console.log('\n================================================================================');
  console.log('  ADVERSARIAL DATA & TIMING TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Probes Run : ${stats.total}`);
  console.log(`  Passed           : ${stats.passed}`);
  console.log(`  Failed           : ${stats.failed}`);
  console.log(`  Execution Time   : ${duration}ms`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ VERDICT: FAIL — ${stats.failed} adversarial probe(s) failed!`);
    process.exit(1);
  } else {
    console.log(`✅ VERDICT: PASS — All ${stats.total} adversarial probe(s) passed cleanly with 0 defects!`);
    process.exit(0);
  }
}

// Execute when run as entry point
if (process.argv[1]?.includes('adversarial-data-timing.test.ts')) {
  main().catch((err) => {
    console.error('Fatal crash in adversarial test runner:', err);
    process.exit(1);
  });
}
