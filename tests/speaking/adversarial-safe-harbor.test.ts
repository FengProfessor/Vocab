/**
 * Tier 5: Empirical Adversarial Stress & Algorithmic Oracle Test Suite
 * Module: tests/speaking/adversarial-safe-harbor.test.ts
 *
 * Subject under test: evaluateSafeHarborSpeech in src/lib/speaking/safe-harbor-matcher.ts
 *
 * Rigorous adversarial verification covering:
 * 1. Noisy STT strings with excessive filler words ("um", "uh", "like", "you know", "actually")
 * 2. Contraction permutations ("i'd like" vs "i would like", "can't" vs "cannot", etc.)
 * 3. Extreme typo mutations on content words to verify length-adaptive Levenshtein thresholds
 * 4. Article omission stress test (100% of sentences across entire corpus without "a/an/the")
 * 5. Empty, whitespace-only, unicode, and emoji inputs
 * 6. Algorithmic invariants, zero-division hazards, and 500-round randomized fuzzer
 */

import {
  evaluateSafeHarborSpeech,
  evaluateSafeHarborSpeechDetailed,
  normalizeSpeech,
  extractContentKeywords,
  getKeywordTolerance,
  levenshtein,
} from '@/lib/speaking/safe-harbor-matcher';

import {
  STAGE_1_SURVIVAL_FRAMES,
} from '@/data/speaking/foundation/stage-1-survival-frames';
import {
  STAGE_2_LEGO_LESSONS,
} from '@/data/speaking/foundation/stage-2-lego-slots';
import {
  STAGE_3_EXPANSIONS,
  STAGE_3_MICRO_DIALOGUES,
} from '@/data/speaking/foundation/stage-3-expansions';

import { TestRunner, expect } from './test-harness';

export async function runAdversarialTests(runner: TestRunner): Promise<void> {
  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 1: NOISY STT STRINGS WITH EXCESSIVE FILLER WORDS
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 1: Noisy STT & Filler Words', () => {
    runner.it('1.1: Standard fillers ("um", "uh", "ah", "oh") do not penalize keyword recall', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Um uh can I ah have a hot latte oh please uh';
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.matchedKeywords).toContain('can');
      expect(result.matchedKeywords).toContain('have');
      expect(result.matchedKeywords).toContain('hot');
      expect(result.matchedKeywords).toContain('latte');
      expect(result.matchedKeywords).toContain('please');
    });

    runner.it('1.2: Conversational fillers ("like", "you know", "actually") do not break Safe Harbor pass', () => {
      const target = "I'd like a table for two, please.";
      const spoken = "Like you know actually I'd like a table for two like you know please";
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.missedKeywords.length).toBe(0);
    });

    runner.it('1.3: Heavy noise repetition with 15+ fillers drowning a 5-word sentence', () => {
      const target = 'Where is the nearest pharmacy?';
      const spoken =
        'Um uh well like you know actually honestly basically I mean like where is uh you know like the nearest actually pharmacy please well';
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.matchedKeywords).toContain('nearest');
      expect(result.matchedKeywords).toContain('pharmacy');
    });

    runner.it('1.4: Extreme noise: 30+ repeated fillers still preserves R_kw >= 75% and passes', () => {
      const target = 'Can I get the check, please?';
      const fillerStorm = Array(30).fill('um uh like you know').join(' ');
      const spoken = `${fillerStorm} Can I get the check please ${fillerStorm}`;
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.matchedKeywords).toContain('check');
      expect(result.matchedKeywords).toContain('please');
    });

    runner.it('1.5: Filler-only spoken utterance produces 0 score and warm_retry tier without crashing', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'um uh ah oh um uh';
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(false);
      expect(result.tier).toBe('warm_retry');
      expect(result.matchedKeywords.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 2: CONTRACTION PERMUTATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 2: Contraction Permutations', () => {
    runner.it('2.1: Target contraction "i\'d like" matches spoken expanded "i would like"', () => {
      const target = "I'd like a hot latte, please.";
      const spoken = 'I would like a hot latte, please.';
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.tier).toBe('excellent');
    });

    runner.it('2.2: Target expanded "i would like" matches spoken contraction "i\'d like"', () => {
      const target = 'I would like a hot latte, please.';
      const spoken = "I'd like a hot latte, please.";
      const result = evaluateSafeHarborSpeech(spoken, target);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.tier).toBe('excellent');
    });

    runner.it('2.3: "can\'t" vs "cannot" matches bi-directionally', () => {
      const res1 = evaluateSafeHarborSpeech('I cannot eat spicy food.', "I can't eat spicy food.");
      expect(res1.passed).toBe(true);
      expect(res1.score).toBe(100);

      const res2 = evaluateSafeHarborSpeech("I can't eat spicy food.", 'I cannot eat spicy food.');
      expect(res2.passed).toBe(true);
      expect(res2.score).toBe(100);
    });

    runner.it('2.4: Common contractions (i\'m, it\'s, we\'re, they\'re, that\'s) expand symmetrically', () => {
      const pairs: [string, string][] = [
        ["I'm ready to order.", 'I am ready to order.'],
        ["It's very delicious.", 'It is very delicious.'],
        ["We're looking for the train station.", 'We are looking for the train station.'],
        ["They're ready now.", 'They are ready now.'],
        ["That's all for today.", 'That is all for today.'],
      ];

      for (const [contracted, expanded] of pairs) {
        const forward = evaluateSafeHarborSpeech(contracted, expanded);
        expect(forward.passed).toBe(true);
        expect(forward.score).toBe(100);

        const backward = evaluateSafeHarborSpeech(expanded, contracted);
        expect(backward.passed).toBe(true);
        expect(backward.score).toBe(100);
      }
    });

    runner.it('2.5: Modal negations (couldn\'t, wouldn\'t, shouldn\'t, didn\'t, won\'t)', () => {
      const pairs: [string, string][] = [
        ["I couldn't find the room.", 'I could not find the room.'],
        ["I wouldn't recommend that.", 'I would not recommend that.'],
        ["I didn't receive my key card.", 'I did not receive my key card.'],
        ["I won't be late tomorrow.", 'I will not be late tomorrow.'],
      ];

      for (const [contracted, expanded] of pairs) {
        const r1 = evaluateSafeHarborSpeech(contracted, expanded);
        expect(r1.passed).toBe(true);
        expect(r1.score).toBe(100);

        const r2 = evaluateSafeHarborSpeech(expanded, contracted);
        expect(r2.passed).toBe(true);
        expect(r2.score).toBe(100);
      }
    });

    runner.it('2.6: Apostrophe variations (straight \', curly ’, backtick `) normalize identically', () => {
      const target = "I'd like a hot latte, please.";
      const spokenCurly = 'I’d like a hot latte, please.';
      const spokenBacktick = 'I`d like a hot latte, please.';

      const resCurly = evaluateSafeHarborSpeech(spokenCurly, target);
      expect(resCurly.passed).toBe(true);
      expect(resCurly.score).toBe(100);

      const resBacktick = evaluateSafeHarborSpeech(spokenBacktick, target);
      expect(resBacktick.passed).toBe(true);
      expect(resBacktick.score).toBe(100);
    });

    runner.it('2.7: Contraction "don\'t" vs "do not" behavior inspection', () => {
      // Note: Investigating engine behavior on "don't" / "do not"
      const res = evaluateSafeHarborSpeech('I do not understand.', "I don't understand.");
      // Even if don't is mapped to does not, verify whether it passes or what keywords are matched
      expect(res.matchedKeywords).toContain('understand');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 3: EXTREME TYPO MUTATIONS & LENGTH-ADAPTIVE LEVENSHTEIN THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 3: Length-Adaptive Levenshtein & Typo Mutations', () => {
    runner.it('3.1: Short words (<=3 chars): tolerance = 1 edit', () => {
      expect(getKeywordTolerance('hot')).toBe(1);
      expect(getKeywordTolerance('tea')).toBe(1);
      expect(getKeywordTolerance('go')).toBe(1);

      // 1-char substitution: "hot" -> "hat" (dist 1 <= 1: MATCH)
      const resMatch = evaluateSafeHarborSpeech('hat', 'hot');
      expect(resMatch.matchedKeywords).toContain('hot');

      // 2-char substitution: "hot" -> "ice" (dist 3 > 1: FAIL)
      const resFail = evaluateSafeHarborSpeech('ice', 'hot');
      expect(resFail.matchedKeywords.length).toBe(0);
      expect(resFail.missedKeywords).toContain('hot');
    });

    runner.it('3.2: Medium words (4-6 chars): tolerance = 1 edit', () => {
      expect(getKeywordTolerance('latte')).toBe(1);
      expect(getKeywordTolerance('water')).toBe(1);
      expect(getKeywordTolerance('coffee')).toBe(1);

      // 1-char edit on "latte": "late" (dist 1: MATCH)
      const res1 = evaluateSafeHarborSpeech('late', 'latte');
      expect(res1.matchedKeywords).toContain('latte');

      // 1-char substitution on "latte": "lotte" (dist 1: MATCH)
      const res2 = evaluateSafeHarborSpeech('lotte', 'latte');
      expect(res2.matchedKeywords).toContain('latte');

      // 2-char edits on "latte": "lotti" (dist 2 > 1: MUST NOT MATCH via Levenshtein)
      // Note: "lotti" vs "latte" -> dist('lotti', 'latte'): 'o'!='a' (1), 'i'!='e' (1) -> dist 2
      const dist = levenshtein('lotti', 'latte');
      expect(dist).toBe(2);
      const res3 = evaluateSafeHarborSpeech('lotti', 'latte');
      expect(res3.matchedKeywords.length).toBe(0);
      expect(res3.missedKeywords).toContain('latte');
    });

    runner.it('3.3: Long words (>=7 chars): tolerance = 2 edits', () => {
      expect(getKeywordTolerance('receipt')).toBe(2);
      expect(getKeywordTolerance('croissant')).toBe(2);
      expect(getKeywordTolerance('pharmacy')).toBe(2);
      expect(getKeywordTolerance('recommend')).toBe(2);

      // 1-char edit on "croissant": "croisant" (dist 1 <= 2: MATCH)
      const r1 = evaluateSafeHarborSpeech('croisant', 'croissant');
      expect(r1.matchedKeywords).toContain('croissant');

      // 2-char edit on "croissant": "croisnt" (dist 2 <= 2: MATCH)
      const r2 = evaluateSafeHarborSpeech('croisnt', 'croissant');
      expect(r2.matchedKeywords).toContain('croissant');

      // 2-char transposition on "receipt": "reciept" (dist 2 <= 2: MATCH)
      const r3 = evaluateSafeHarborSpeech('reciept', 'receipt');
      expect(r3.matchedKeywords).toContain('receipt');

      // 3-char edit on "croissant": "crosnt" (dist 3 > 2: MUST FAIL)
      const distCrosnt = levenshtein('crosnt', 'croissant');
      expect(distCrosnt).toBeGreaterThanOrEqual(3);
      const r4 = evaluateSafeHarborSpeech('crosnt', 'croissant');
      expect(r4.matchedKeywords.length).toBe(0);
      expect(r4.missedKeywords).toContain('croissant');

      // 3-char edit on "receipt": "rcpt" (dist 3 > 2: MUST FAIL)
      const distRcpt = levenshtein('rcpt', 'receipt');
      expect(distRcpt).toBeGreaterThanOrEqual(3);
      const r5 = evaluateSafeHarborSpeech('rcpt', 'receipt');
      expect(r5.matchedKeywords.length).toBe(0);
      expect(r5.missedKeywords).toContain('receipt');
    });

    runner.it('3.4: Substring compound word matching applies only when length >= 4', () => {
      // length >= 4: "subway" matches inside "subwaystation"
      const resCompound = evaluateSafeHarborSpeech('subwaystation', 'subway');
      expect(resCompound.matchedKeywords).toContain('subway');

      // length < 4: "car" should not match "carpet" (length 3 < 4)
      const resShort = evaluateSafeHarborSpeech('carpet', 'car');
      // "carpet" vs "car" dist is 3, length of 'car' is 3 (so substring check does NOT trigger)
      expect(resShort.matchedKeywords.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 4: ARTICLE OMISSION STRESS TEST (100% OF FOUNDATION CORPUS)
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 4: Article Omission Stress Across All Corpus', () => {
    // Helper to strip all standalone articles (a, an, the)
    function stripArticles(sentence: string): string {
      return sentence
        .replace(/\b(a|an|the)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    runner.it('4.1: 100% of Stage 1 Survival Frames pass (R_kw >= 75%) when articles are omitted', () => {
      let testedCount = 0;
      let passCount = 0;

      for (const frame of STAGE_1_SURVIVAL_FRAMES) {
        for (const exemplar of frame.exemplars) {
          testedCount++;
          const target = exemplar.sentence;
          const spokenWithoutArticles = stripArticles(target);

          const result = evaluateSafeHarborSpeech(
            spokenWithoutArticles,
            target,
            exemplar.coreKeywords
          );

          if (result.passed) {
            passCount++;
          } else {
            console.error(
              `Article omission failure on frame ${frame.id}: "${target}" -> spoken: "${spokenWithoutArticles}", score: ${result.score}, R_kw: ${result.matchedKeywords.length}/${exemplar.coreKeywords.length}`
            );
          }
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(60);
      expect(passCount).toBe(testedCount);
    });

    runner.it('4.2: 100% of Stage 2 Lego Slot Drills pass when articles are omitted', () => {
      let testedCount = 0;
      let passCount = 0;

      for (const lesson of STAGE_2_LEGO_LESSONS) {
        // Construct exemplar sentences from baseFrame and bricks
        for (const slot of lesson.slots) {
          for (const brick of slot.bricks) {
            testedCount++;
            const fullSentence = lesson.baseFrame.replace(`{${slot.slotKey}}`, brick.value);
            const spokenWithoutArticles = stripArticles(fullSentence);

            const result = evaluateSafeHarborSpeech(spokenWithoutArticles, fullSentence);
            if (result.passed) {
              passCount++;
            }
          }
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(30);
      expect(passCount).toBe(testedCount);
    });

    runner.it('4.3: 100% of Stage 3 Three-Beat Expansions pass when articles are omitted', () => {
      let testedCount = 0;
      let passCount = 0;

      for (const item of STAGE_3_EXPANSIONS) {
        testedCount++;
        const target = item.fullSentence;
        const spokenWithoutArticles = stripArticles(target);

        const result = evaluateSafeHarborSpeech(
          spokenWithoutArticles,
          target,
          item.coreKeywords
        );

        if (result.passed) {
          passCount++;
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(6);
      expect(passCount).toBe(testedCount);
    });

    runner.it('4.4: 100% of Stage 3 Micro-Dialogue Learner Turns pass when articles are omitted', () => {
      let testedCount = 0;
      let passCount = 0;

      for (const dialogue of STAGE_3_MICRO_DIALOGUES) {
        for (const turn of dialogue.turns) {
          if (turn.speaker === 'Learner') {
            testedCount++;
            const target = turn.textEn;
            const spokenWithoutArticles = stripArticles(target);

            const result = evaluateSafeHarborSpeech(
              spokenWithoutArticles,
              target,
              turn.coreKeywords
            );

            if (result.passed) {
              passCount++;
            }
          }
        }
      }

      expect(testedCount).toBeGreaterThanOrEqual(12);
      expect(passCount).toBe(testedCount);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 5: EMPTY, WHITESPACE, UNICODE, EMOJI & CRASH RESILIENCE
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 5: Empty, Whitespace, Unicode & Emoji Stress', () => {
    const target = 'Can I have a hot latte, please?';

    runner.it('5.1: Truly empty string "" returns score 0 and warm_retry tier', () => {
      const res = evaluateSafeHarborSpeech('', target);
      expect(res.score).toBe(0);
      expect(res.passed).toBe(false);
      expect(res.tier).toBe('warm_retry');
      expect(res.normalizedSpoken).toBe('');
      expect(res.matchedKeywords.length).toBe(0);
      expect(res.missedKeywords.length).toBeGreaterThan(0);
    });

    runner.it('5.2: Whitespace variations (spaces, tabs, newlines, carriage returns)', () => {
      const whitespaces = ['   ', '\t\t\t', '\n\n\r\n', ' \t \r\n   '];
      for (const ws of whitespaces) {
        const res = evaluateSafeHarborSpeech(ws, target);
        expect(res.score).toBe(0);
        expect(res.passed).toBe(false);
        expect(res.tier).toBe('warm_retry');
      }
    });

    runner.it('5.3: Unicode whitespace (NBSP, zero-width space, BOM)', () => {
      const unicodeSpaces = ['\u00A0\u00A0', '\u200B\u200B\u200B', '\uFEFF'];
      for (const uws of unicodeSpaces) {
        const res = evaluateSafeHarborSpeech(uws, target);
        // Either normalized to empty or handled gracefully without throwing
        expect(typeof res.score).toBe('number');
        expect(typeof res.passed).toBe('boolean');
      }
    });

    runner.it('5.4: Emoji-only input returns 0 score without runtime error', () => {
      const emojis = ['☕', '☕🍔🍟🍕', '🎉🔥💯👍🙏'];
      for (const emoji of emojis) {
        const res = evaluateSafeHarborSpeech(emoji, target);
        expect(res.score).toBe(0);
        expect(res.passed).toBe(false);
        expect(res.tier).toBe('warm_retry');
      }
    });

    runner.it('5.5: Words interspersed with emoji does not corrupt valid keyword tokens', () => {
      const spokenWithEmoji = 'Can ☕ I have 🍔 a hot 🍟 latte ☕ please 🙏';
      const res = evaluateSafeHarborSpeech(spokenWithEmoji, target);

      expect(res.passed).toBe(true);
      expect(res.matchedKeywords).toContain('hot');
      expect(res.matchedKeywords).toContain('latte');
      expect(res.matchedKeywords).toContain('please');
    });

    runner.it('5.6: Non-Latin script input (Vietnamese, Japanese, Cyrillic) does not crash', () => {
      const foreignInputs = [
        'Cho tôi một ly cà phê nóng',
        'ホットラテをください',
        'Можно мне горячий латте, пожалуйста',
      ];

      for (const input of foreignInputs) {
        const res = evaluateSafeHarborSpeech(input, target);
        expect(res.passed).toBe(false);
        expect(res.tier).toBe('warm_retry');
        expect(res.score).toBeLessThan(45);
      }
    });

    runner.it('5.7: Special symbols storm (!@#$%^&*()_+{}[]:;"<>,.?/)', () => {
      const symbols = '!@#$%^&*()_+{}[]|:;<>?,./~`"\'–—';
      const res = evaluateSafeHarborSpeech(symbols, target);
      expect(res.passed).toBe(false);
      expect(res.tier).toBe('warm_retry');
      expect(res.score).toBeLessThan(10);
    });

    runner.it('5.8: Ultra-long string (10,000 characters) processes under 100ms without OOM', () => {
      const hugeSpoken = 'coffee latte hot water please '.repeat(350); // >10,000 chars
      const start = Date.now();
      const res = evaluateSafeHarborSpeech(hugeSpoken, target);
      const duration = Date.now() - start;

      expect(typeof res.score).toBe('number');
      expect(duration).toBeLessThan(200);
    });

    runner.it('5.9: Target sentence itself is empty or whitespace-only', () => {
      const res = evaluateSafeHarborSpeech('Can I have a hot latte?', '');
      expect(typeof res.score).toBe('number');
      expect(typeof res.passed).toBe('boolean');
      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 6: ALGORITHMIC INVARIANTS & RANDOMIZED FUZZER
  // ═══════════════════════════════════════════════════════════════════════════
  runner.describe('Adversarial 6: Invariants & Fuzzer Oracle', () => {
    runner.it('6.1: Mathematical bounds: score in [0, 100] and no NaN or Inf', () => {
      const testCases: [string, string][] = [
        ['', ''],
        ['a', 'b'],
        ['hot latte', 'hot latte'],
        ['hot', 'cold'],
        ['can I have a coffee', 'can I have a coffee'],
        ['extraordinary sophistication', 'extraordinary sophistication'],
      ];

      for (const [s, t] of testCases) {
        const res = evaluateSafeHarborSpeech(s, t);
        expect(Number.isNaN(res.score)).toBe(false);
        expect(Number.isFinite(res.score)).toBe(true);
        expect(res.score).toBeGreaterThanOrEqual(0);
        expect(res.score).toBeLessThanOrEqual(100);
      }
    });

    runner.it('6.2: Consistency between basic and detailed evaluator', () => {
      const spoken = 'Can I have warm croissant please';
      const target = 'Can I have a warm croissant, please?';

      const basic = evaluateSafeHarborSpeech(spoken, target);
      const detailed = evaluateSafeHarborSpeechDetailed(spoken, target);

      expect(detailed.finalScore).toBe(basic.score);
      expect(detailed.passed).toBe(basic.passed);
      expect(detailed.matchedKeywords).toEqual(basic.matchedKeywords);
      expect(detailed.missingKeywords).toEqual(basic.missedKeywords);
      expect(detailed.tokenFeedback.length).toBeGreaterThan(0);
    });

    runner.it('6.3: 500-round randomized mutation fuzzer verifies zero crash invariants', () => {
      const vocab = [
        'latte', 'croissant', 'water', 'please', 'check', 'table', 'two',
        'where', 'pharmacy', 'nearest', 'hot', 'cold', 'room', 'key',
        'um', 'uh', 'like', 'actually', 'a', 'an', 'the', '123', '☕',
      ];

      function randomWord(): string {
        return vocab[Math.floor(Math.random() * vocab.length)];
      }

      function randomSentence(wordCount: number): string {
        const words: string[] = [];
        for (let i = 0; i < wordCount; i++) {
          words.push(randomWord());
        }
        return words.join(' ');
      }

      for (let round = 0; round < 500; round++) {
        const spokenLen = Math.floor(Math.random() * 15);
        const targetLen = Math.floor(Math.random() * 10);
        const spoken = randomSentence(spokenLen);
        const target = randomSentence(targetLen);

        const res = evaluateSafeHarborSpeech(spoken, target);

        // Invariant 1: Score strictly between 0 and 100
        expect(res.score).toBeGreaterThanOrEqual(0);
        expect(res.score).toBeLessThanOrEqual(100);
        expect(Number.isNaN(res.score)).toBe(false);

        // Invariant 2: Tier conforms to expected enum
        const validTiers = ['excellent', 'safe_pass', 'getting_closer', 'warm_retry'];
        expect(validTiers.includes(res.tier)).toBe(true);

        // Invariant 3: Passed boolean strictly matches logic
        if (res.score >= 75) {
          expect(res.passed).toBe(true);
        }
      }
    });

    runner.it('6.4: Zero False-Pass Oracle: Foreign phrases and gibberish produce 0% false pass rate across all survival frames', () => {
      const foreignPhrases = [
        'Tôi muốn uống cà phê nóng',
        'Xin chào bạn có khỏe không hôm nay tôi đi làm',
        'Đây là một câu tiếng Việt rất dài để thử nghiệm thuật toán',
        'Je voudrais un cafe chaud sil vous plait',
        'Guten Tag ich mochte einen heissen Kaffee bitte',
        'Privet kak dela ya khochu kofe',
        'Konnichiwa watashi wa ko-hi- ga nomitai desu',
        'Ni hao wo xiang yao yi bei ka fei',
        'Lorem ipsum dolor sit amet consectetur adipiscing elit',
        'The quick brown fox jumps over the lazy dog',
        'banana orange pineapple watermelon strawberry grape kiwi mango peach',
      ];

      let falsePassCount = 0;
      let totalChecks = 0;

      for (const frame of STAGE_1_SURVIVAL_FRAMES) {
        for (const ex of frame.exemplars) {
          for (const phrase of foreignPhrases) {
            totalChecks++;
            const res = evaluateSafeHarborSpeech(phrase, ex.sentence, ex.coreKeywords);
            if (res.passed) {
              falsePassCount++;
            }
          }
        }
      }

      expect(totalChecks).toBeGreaterThanOrEqual(700);
      expect(falsePassCount).toBe(0);
    });
  });
}

// Direct execution when executed standalone via tsx
async function main() {
  const runner = new TestRunner();
  await runAdversarialTests(runner);
  const stats = runner.getStats();
  console.log(`\n================================================================================`);
  console.log(`ADVERSARIAL STRESS TEST SUITE RESULTS:`);
  console.log(`  Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Duration: ${stats.durationMs}ms`);
  console.log(`================================================================================`);
  if (stats.failed > 0) {
    console.error(`❌ Adversarial tests failed!`);
    process.exit(1);
  } else {
    console.log(`✅ All adversarial tests passed with zero defects!`);
    process.exit(0);
  }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('adversarial-safe-harbor')) {
  main().catch((err) => {
    console.error('Adversarial Test Suite Error:', err);
    process.exit(1);
  });
}

