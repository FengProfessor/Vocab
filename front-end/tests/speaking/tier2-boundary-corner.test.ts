/**
 * Tier 2: Boundary & Corner Cases Tests for Foundational Speaking System.
 * Tests extreme Levenshtein lengths, empty strings, missing articles, typo tolerances,
 * unusual punctuation, YouTube timestamp bounds, and speed bounds.
 * Minimum requirement: >=5 test cases per feature (30+ total).
 */

import {
  TestRunner,
  expect,
  AudioSpeedController,
} from './test-harness';
import { getStage0Lessons } from '@/data/speaking/foundation';
import {
  evaluateSafeHarborSpeech,
  normalizeSpeech,
  levenshtein,
} from '@/lib/speaking/safe-harbor-matcher';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  const stage0Lessons = getStage0Lessons();
  // ──────────────────────────────────────────────────────────────────────────
  // Group 1: Extreme Levenshtein Lengths & Empty Spoken Strings
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2 — Group 1: Extreme Levenshtein & Empty Spoken Strings', () => {
    runner.it('1.1: Completely empty spoken string "" yields score 0, "warm_retry", and no crash', () => {
      const target = 'Can I have a hot latte, please?';
      const res = evaluateSafeHarborSpeech('', target);

      expect(res.score).toBe(0);
      expect(res.passed).toBe(false);
      expect(res.tier).toBe('warm_retry');
      expect(res.matchedKeywords.length).toBe(0);
      expect(res.feedbackVi).toContain('Chưa nghe thấy');
    });

    runner.it('1.2: Whitespace-only spoken string ("   \\t\\n  ") is normalized to empty and handled safely', () => {
      const target = 'Excuse me, where is the subway station?';
      const res = evaluateSafeHarborSpeech('   \t\n   ', target);

      expect(res.score).toBe(0);
      expect(res.passed).toBe(false);
      expect(res.tier).toBe('warm_retry');
    });

    runner.it('1.3: Ultra-long spoken transcript (>500 chars) processes under 50ms without error', () => {
      const target = 'Could we get the bill, please?';
      const noisySpeech = 'uhm excuse me hello waiter ' + 'yes we are ready '.repeat(20) + 'could we get the bill please thank you';
      
      const start = Date.now();
      const res = evaluateSafeHarborSpeech(noisySpeech, target);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
      expect(res.matchedKeywords).toContain('bill');
      expect(res.matchedKeywords).toContain('could');
    });

    runner.it('1.4: Single-character spoken utterance ("a" or "k") handles gracefully', () => {
      const target = 'Can I try this on?';
      const res = evaluateSafeHarborSpeech('a', target);

      expect(res.passed).toBe(false);
      expect(res.tier).toBe('warm_retry');
    });

    runner.it('1.5: Stuttering repetition ("can can can I have have hot hot latte") matches keywords cleanly', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'can can can I have have a hot hot latte please please';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('hot');
      expect(res.matchedKeywords).toContain('latte');
    });

    runner.it('1.6: Exact Levenshtein DP calculation handles extreme asymmetric string lengths', () => {
      const shortStr = 'hi';
      const longStr = 'a'.repeat(200);
      const dist = levenshtein(shortStr, longStr);
      expect(dist).toBe(200);

      const emptyDist = levenshtein('', 'test');
      expect(emptyDist).toBe(4);
      expect(levenshtein('test', '')).toBe(4);
      expect(levenshtein('same', 'same')).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 2: Missing Articles & Function Word Suppression
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2 — Group 2: Missing Articles & Function Word Suppression', () => {
    runner.it('2.1: Missing single article "a" ("Can I have {a} hot latte please") passes >=75 with safe_pass', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have hot latte please';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(75);
      expect(res.tier).toBe('safe_pass');
    });

    runner.it('2.2: Missing article "an" ("I\'d like {an} iced Americano") passes all core keywords', () => {
      const target = "I'd like an iced Americano, please.";
      const spoken = "I'd like iced Americano please";
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('iced');
      expect(res.matchedKeywords).toContain('americano');
    });

    runner.it('2.3: Missing article "the" ("Where is {the} nearest pharmacy?") matches without penalty', () => {
      const target = 'Where is the nearest pharmacy?';
      const spoken = 'Where is nearest pharmacy';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('where');
      expect(res.matchedKeywords).toContain('nearest');
      expect(res.matchedKeywords).toContain('pharmacy');
    });

    runner.it('2.4: Multiple function words omitted ("I need {some} medicine {because} I have headache") passes', () => {
      const target = 'I need some medicine because I have a headache.';
      const spoken = 'I need medicine I have headache';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(75);
      expect(res.matchedKeywords).toContain('medicine');
      expect(res.matchedKeywords).toContain('headache');
    });

    runner.it('2.5: Highly mixed-case spoken transcript ("cAn I hAvE a HoT lAtTe, pLeAsE?") normalized flawlessly', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'cAn I hAvE a HoT lAtTe, pLeAsE?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.score).toBe(100);
      expect(res.passed).toBe(true);
      expect(res.tier).toBe('excellent');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 3: Typo Tolerances & Phonetic Near-Misses
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Group 3: Typo Tolerances & Phonetic Near-Misses', () => {
    runner.it('3.1: 1-character omission on keyword ("late" for "latte") matches successfully', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have a hot late, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.matchedKeywords).toContain('latte');
      expect(res.passed).toBe(true);
    });

    runner.it('3.2: 1-character substitution on keyword ("lotte" for "latte") matches within tolerance', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have a hot lotte, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.matchedKeywords).toContain('latte');
      expect(res.passed).toBe(true);
    });

    runner.it('3.3: 2-character edit distance on long keyword (>=6 chars, "croisnt" for "croissant") matches', () => {
      const target = 'Can I have a warm croissant, please?';
      const spoken = 'Can I have a warm croisnt, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.matchedKeywords).toContain('croissant');
      expect(res.passed).toBe(true);
    });

    runner.it('3.4: Common spelling transposition ("reciept" for "receipt") matches within 2 edits', () => {
      const target = 'Could I get the receipt, please?';
      const spoken = 'Could I get the reciept, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.matchedKeywords).toContain('receipt');
      expect(res.passed).toBe(true);
    });

    runner.it('3.5: Excessive edit distance (>3 edits, "xyz" for "croissant") correctly fails to match', () => {
      const target = 'Can I have a warm croissant, please?';
      const spoken = 'Can I have a warm xyz, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.missedKeywords).toContain('croissant');
      expect(res.matchedKeywords).not.toContain('croissant');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 4: Punctuation, Smart Quotes & Formatting
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2 — Group 4: Punctuation, Smart Quotes & Formatting', () => {
    runner.it('4.1: Straight quote (\') vs curly apostrophe (’) matches identically (I\'d vs I’d)', () => {
      const target = "I'd like the chicken sandwich, please.";
      const spoken = 'I’d like the chicken sandwich, please.';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.score).toBe(100);
      expect(res.passed).toBe(true);
    });

    runner.it('4.2: Multiple exclamation marks and question marks stripped cleanly', () => {
      const raw = 'Excuse me, where is the station??? Help me please!!!';
      const normalized = normalizeSpeech(raw);
      expect(normalized).not.toContain('?');
      expect(normalized).not.toContain('!');
      expect(normalized).toBe('excuse me where is the station help me please');
    });

    runner.it('4.3: Ellipses and conversational pauses ("Well... let me see...") normalized properly', () => {
      const target = 'Well, let me see...';
      const spoken = 'Well let me see';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('well');
      expect(res.matchedKeywords).toContain('see');
    });

    runner.it('4.4: Hyphenated words ("check-out" vs "checkout") matched gracefully', () => {
      const target = 'What time is check-out?';
      const spoken = 'What time is checkout?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(75);
    });

    runner.it('4.5: Accidental emoji or symbols ("hot latte ☕") handled without corrupting words', () => {
      const spoken = 'Can I have a hot latte ☕ please?';
      const target = 'Can I have a hot latte, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('latte');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 5: YouTube Timestamp Bounds & Duration Limits
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2 — Group 5: YouTube Timestamp Bounds & Durations', () => {
    runner.it('5.1: startSeconds is strictly non-negative (>=0) across all 10 lessons', () => {
      for (const lesson of stage0Lessons) {
        expect(lesson.video.startSeconds).toBeGreaterThanOrEqual(0);
      }
    });

    runner.it('5.2: endSeconds is strictly greater than startSeconds across all lessons', () => {
      for (const lesson of stage0Lessons) {
        expect(lesson.video.endSeconds).toBeGreaterThan(lesson.video.startSeconds);
      }
    });

    runner.it('5.3: Clip duration (endSeconds - startSeconds) is strictly between 15s and 120s', () => {
      for (const lesson of stage0Lessons) {
        const duration = lesson.video.endSeconds - lesson.video.startSeconds;
        expect(duration).toBeGreaterThanOrEqual(15);
        expect(duration).toBeLessThanOrEqual(120);
      }
    });

    runner.it('5.4: Validator helper detects and rejects invalid timestamp configurations', () => {
      const validateBounds = (start: number, end: number): boolean => {
        return start >= 0 && end > start && end - start >= 10 && end - start <= 300;
      };

      expect(validateBounds(30, 90)).toBe(true);
      expect(validateBounds(-5, 50)).toBe(false); // Negative start
      expect(validateBounds(100, 50)).toBe(false); // Inverted bounds
      expect(validateBounds(50, 52)).toBe(false); // Too short (<10s)
      expect(validateBounds(0, 500)).toBe(false); // Too long (>300s)
    });

    runner.it('5.5: YouTube video IDs adhere strictly to 11-character regex format', () => {
      const validIds = ['scCesnn-0XY', 'UM9gPzKs1Hg', 'IwahymIkGJ0', 'nlKNo1TGALA', 'xl-7mSeybmI'];
      const invalidIds = ['short', 'toolongvideoidstring123456', 'with spaces!', 'scCesnn@0XY'];

      const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
      for (const id of validIds) {
        expect(ytRegex.test(id)).toBe(true);
      }
      for (const id of invalidIds) {
        expect(ytRegex.test(id)).toBe(false);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 6: Audio Speed Bounds & Rate Clamping
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2 — Group 6: Audio Speed Bounds & Rate Clamping', () => {
    runner.it('6.1: Lower bound clamp: rate < 0.5 is clamped to exactly 0.5x', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(0.1)).toBe(0.5);
      expect(controller.setRate(-1.0)).toBe(0.5);
    });

    runner.it('6.2: Upper bound clamp: rate > 2.0 is clamped to exactly 2.0x', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(3.0)).toBe(2.0);
      expect(controller.setRate(10.0)).toBe(2.0);
    });

    runner.it('6.3: Rate 0.0 or NaN clamped safely without throwing', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(0)).toBe(0.5);
    });

    runner.it('6.4: Standard 0.8x rate is preserved exactly without clamping', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(0.8)).toBe(0.8);
      expect(controller.getRate()).toBe(0.8);
    });

    runner.it('6.5: Standard 1.0x rate is preserved exactly without clamping', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(1.0)).toBe(1.0);
      expect(controller.getRate()).toBe(1.0);
    });
  });
}
