/**
 * Automated QA Test Suite: R1 — End-to-End Learner Journey Testing
 *
 * Verifies:
 * 1. TOEIC: 200 questions loading, timer, answer selection, autosave,
 *    server scoring via calculateToeicScore, 101-element ETS Barem arrays,
 *    scaled scores 10-990, CEFR levels A1-C1, on-demand explanation & steganography.
 * 2. Grammar: Canonical /grammar, 308 redirects from /grammar/foundation and /grammar/learn,
 *    4 interactive exercise types, FSRS scheduling in grammar_progress.
 * 3. Word Library: Virtual classroom __personal__, free 200 words/month quota enforcement,
 *    multi-tier dictionary lookup fallback.
 * 4. Spaced Repetition: FSRS algorithm (ts-fsrs), 92% retention, short-term learning steps,
 *    relearning steps, legacy repair clamping [1, 10], cross-classroom due queue aggregation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { TestRunner, expect, assert } from './test-harness';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// TOEIC Scoring & Barem Imports
import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '@/lib/toeic-barem';

import {
  calculateToeicScore,
  getCefrLevel,
  getCefrDescriptor,
  getPartAccuracyRating,
  getScaledListeningScore,
  getScaledReadingScore,
} from '@/lib/toeic-scoring';

import {
  loadFullToeicTest,
  stripSensitiveToeicData,
} from '@/lib/toeic-test-loader';

import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '@/lib/toeic-anti-scraping';

// Grammar Imports
import { GET as handleGrammarFoundationRedirect } from '@/app/grammar/foundation/route';
import { GET as handleGrammarLearnRedirect } from '@/app/grammar/learn/route';
import {
  resolveDrillType,
  canUseErrorClickMode,
  sanitizeDrillExercise,
} from '@/lib/grammar-exercises';

// Dictionary & IPA Imports
import { extractIpaFromDictionaryData } from '@/lib/ipa-resolve';

// Review Queue Imports
import { isWordValidForReview, deduplicateReviewWords } from '@/lib/review-queue';

// FSRS Spaced Repetition Imports
import {
  scheduleNext,
  stateToText,
  textToState,
  State,
  Rating,
  type SrsRowLike,
} from '@/lib/fsrs';

// Entitlement & Quota Imports
import { FREE_WORD_SAVE_MONTHLY_LIMIT } from '@/lib/entitlement';
import { checkWordSaveQuota } from '@/lib/entitlement-server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ToeicUnifiedQuestion } from '@/types/toeic';

export async function runLearnerJourneyTests(runner: TestRunner = new TestRunner('R1: Learner Journey')): Promise<TestRunner> {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. TOEIC Simulation & ETS Barem Engine
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('TOEIC 200Q Loading & Layout Invariants', async () => {
    await runner.it('R1-TOEIC-1: Loads complete 200-question test with correct part segmentation', () => {
      const questions = loadFullToeicTest('6852');
      expect(questions.length).toBe(200);

      // Verify questionNumber continuity from 1 to 200
      for (let i = 0; i < 200; i++) {
        expect(questions[i].questionNumber).toBe(i + 1);
      }

      // Verify sections
      const listeningQuestions = questions.filter((q) => q.section === 'listening');
      const readingQuestions = questions.filter((q) => q.section === 'reading');
      expect(listeningQuestions.length).toBe(100);
      expect(readingQuestions.length).toBe(100);

      // Verify Part breakdowns
      const p1 = questions.filter((q) => q.part === 1);
      const p2 = questions.filter((q) => q.part === 2);
      const p3 = questions.filter((q) => q.part === 3);
      const p4 = questions.filter((q) => q.part === 4);
      const p5 = questions.filter((q) => q.part === 5);
      const p6 = questions.filter((q) => q.part === 6);
      const p7 = questions.filter((q) => q.part === 7);

      expect(p1.length).toBe(6);   // Q1-Q6
      expect(p2.length).toBe(25);  // Q7-Q31
      expect(p3.length).toBe(39);  // Q32-Q70
      expect(p4.length).toBe(30);  // Q71-Q100
      expect(p5.length).toBe(30);  // Q101-Q130
      expect(p6.length).toBe(16);  // Q131-Q146
      expect(p7.length).toBe(54);  // Q147-Q200

      // Part 2 has 3 options (A, B, C); other parts have 4 options (A, B, C, D)
      expect(p2[0].options.length).toBe(3);
      expect(p1[0].options.length).toBe(4);
      expect(p5[0].options.length).toBe(4);
    });

    await runner.it('R1-TOEIC-2: Exam timer and local storage autosave session contract', () => {
      const hookContent = fs.readFileSync(
        path.resolve(PROJECT_ROOT, 'src/hooks/useToeicExamSession.ts'),
        'utf-8'
      );

      // 1. Verify storage key formatting contract
      expect(hookContent).toContain('`lingo_toeic_session_${testId}`');

      // 2. Verify default 120-minute (7200s) exam duration
      expect(hookContent).toContain('initialTimeSeconds = 120 * 60');

      // 3. Verify throttled autosave debounce timing (2000ms)
      expect(hookContent).toContain('Throttled Autosave (every 2s max)');

      // 4. Verify SavedSessionDraft data structure fields
      expect(hookContent).toContain('interface SavedSessionDraft');
      expect(hookContent).toContain('answers: Record<number, ToeicOptionKey>');
      expect(hookContent).toContain('timeRemainingSeconds: number');
      expect(hookContent).toContain('updatedAt: number');
    });
  });

  await runner.describe('Official ETS Barem & Scoring Engine', async () => {
    await runner.it('R1-BAREM-1: 101-element ETS barem arrays are properly indexed 0..100', () => {
      expect(ETS_LISTENING_BAREM.length).toBe(101);
      expect(ETS_READING_BAREM.length).toBe(101);

      // Listening floors and ceilings
      expect(ETS_LISTENING_BAREM[0]).toBe(5);
      expect(ETS_LISTENING_BAREM[100]).toBe(495);

      // Reading floors and ceilings
      expect(ETS_READING_BAREM[0]).toBe(5);
      expect(ETS_READING_BAREM[100]).toBe(495);

      // Monotonic non-decreasing check across all 100 transitions
      for (let i = 0; i < 100; i++) {
        expect(ETS_LISTENING_BAREM[i] <= ETS_LISTENING_BAREM[i + 1]).toBe(true);
        expect(ETS_READING_BAREM[i] <= ETS_READING_BAREM[i + 1]).toBe(true);
      }
    });

    await runner.it('R1-BAREM-2: convertRawToScaled converts raw scores to scaled 10-990', () => {
      // 0 raw score -> 10 scaled
      const minScore = convertRawToScaled(0, 0);
      expect(minScore.scaledListening).toBe(5);
      expect(minScore.scaledReading).toBe(5);
      expect(minScore.scaledTotal).toBe(10);

      // 100 raw score -> 990 scaled
      const maxScore = convertRawToScaled(100, 100);
      expect(maxScore.scaledListening).toBe(495);
      expect(maxScore.scaledReading).toBe(495);
      expect(maxScore.scaledTotal).toBe(990);

      // Benchmark middle raw scores
      const midScore = convertRawToScaled(75, 70);
      expect(midScore.scaledListening).toBe(395);
      expect(midScore.scaledReading).toBe(315);
      expect(midScore.scaledTotal).toBe(710);

      // Clamping of invalid inputs
      expect(lookupListeningScore(-5)).toBe(5);
      expect(lookupListeningScore(150)).toBe(495);
      expect(lookupReadingScore(-10)).toBe(5);
      expect(lookupReadingScore(200)).toBe(495);
    });

    await runner.it('R1-SCORING-1: calculateToeicScore computes exact part accuracy and CEFR rating', () => {
      const questions = loadFullToeicTest('6852');

      // Build answers where all listening are correct, reading are wrong
      const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
      for (const q of questions) {
        if (q.section === 'listening') {
          answers[q.questionNumber] = q.correctAnswer;
        } else {
          // Intentionally wrong option
          answers[q.questionNumber] = q.correctAnswer === 'A' ? 'B' : 'A';
        }
      }

      const result = calculateToeicScore(answers, questions, 3600);

      expect(result.rawListening).toBe(100);
      expect(result.rawReading).toBe(0);
      expect(result.scaledListening).toBe(495);
      expect(result.scaledReading).toBe(5);
      expect(result.scaledTotal).toBe(500);

      // Accuracy stats
      expect(result.partStats[1].correct).toBe(6);
      expect(result.partStats[1].percentage).toBe(100);
      expect(result.partStats[1].accuracyRating).toBe('high');

      expect(result.partStats[5].correct).toBe(0);
      expect(result.partStats[5].percentage).toBe(0);
      expect(result.partStats[5].accuracyRating).toBe('low');
    });

    await runner.it('R1-CEFR-1: Validates CEFR classification boundaries (A1 to C1)', () => {
      expect(getCefrLevel(990)).toBe('C1');
      expect(getCefrLevel(905)).toBe('C1');
      expect(getCefrLevel(900)).toBe('B2');
      expect(getCefrLevel(785)).toBe('B2');
      expect(getCefrLevel(605)).toBe('B2');
      expect(getCefrLevel(600)).toBe('B1');
      expect(getCefrLevel(405)).toBe('B1');
      expect(getCefrLevel(400)).toBe('A2');
      expect(getCefrLevel(255)).toBe('A2');
      expect(getCefrLevel(250)).toBe('A1');
      expect(getCefrLevel(10)).toBe('A1');

      const c1Desc = getCefrDescriptor('C1');
      expect(c1Desc.title).toContain('Thành thạo chuyên nghiệp');

      const b2Desc = getCefrDescriptor('B2');
      expect(b2Desc.title).toContain('Giao tiếp & Làm việc vững vàng');
    });

    await runner.it('R1-STEGANO-1: On-demand explanation embeds & extracts zero-width watermarks', () => {
      const originalText = 'Đáp án C đúng vì động từ chia theo thì hiện tại hoàn thành.';
      const fingerprint = 'USER_10482_IP_118.69.182.90_TIMESTAMP_1775308800';

      const watermarked = embedInvisibleWatermark(originalText, fingerprint);

      // Verify that words are intact and zero-width characters are present
      expect(watermarked).toContain('Đáp');
      expect(watermarked).toContain('án C đúng vì động từ chia theo thì hiện tại hoàn thành.');
      expect(watermarked.includes(ZW_SENTINEL)).toBe(true);
      expect(watermarked.includes(ZW_ZERO) || watermarked.includes(ZW_ONE)).toBe(true);

      // Extract and verify exact match
      const extracted = extractInvisibleWatermark(watermarked);
      expect(extracted).toBe(fingerprint);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Grammar Learning Subsystem
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Unified Grammar Roadmap & Redirects', async () => {
    await runner.it('R1-GRAMMAR-1: /grammar/foundation issues 308 permanent redirect to /grammar?level=A0', async () => {
      const req = new NextRequest('http://localhost:3000/grammar/foundation?topic=present-simple');
      const res = await handleGrammarFoundationRedirect(req);

      expect(res.status).toBe(308);
      const location = res.headers.get('location');
      assert(location !== null, 'Redirect must set Location header');
      expect(location).toContain('/grammar');
      expect(location).toContain('level=A0');
      expect(location).toContain('topic=present-simple');
    });

    await runner.it('R1-GRAMMAR-2: /grammar/learn issues 308 permanent redirect preserving query params', async () => {
      const req = new NextRequest('http://localhost:3000/grammar/learn?unit=2&step=practice');
      const res = await handleGrammarLearnRedirect(req);

      expect(res.status).toBe(308);
      const location = res.headers.get('location');
      assert(location !== null, 'Redirect must set Location header');
      expect(location).toContain('/grammar');
      expect(location).toContain('unit=2');
      expect(location).toContain('step=practice');
    });

    await runner.it('R1-GRAMMAR-3: resolveDrillType resolves 4 interactive drill types and handles MCQ error fallbacks', () => {
      // Import real production exercise resolution functions
      // from '@/lib/grammar-exercises'
      const sampleQuestion = 'She go to school by bus every day.';
      const sampleOptions = ['She', 'go', 'school', 'bus'];

      // 1. Categorization exercise resolution
      const typeCat = resolveDrillType('categorization', 'Group nouns and verbs', ['noun', 'verb']);
      expect(typeCat).toBe('categorization');

      // 2. Fill blank exercise resolution (supports both 'fill' and 'fill_blank')
      const typeFill1 = resolveDrillType('fill_blank', 'I ___ reading books.', ['enjoy']);
      const typeFill2 = resolveDrillType('fill', 'I ___ reading books.', ['enjoy']);
      expect(typeFill1).toBe('fill_blank');
      expect(typeFill2).toBe('fill_blank');

      // 3. Error correction with tokens appearing in sentence (>= 2 hits triggers interactive click mode)
      const typeErrorClick = resolveDrillType('error_correction', sampleQuestion, sampleOptions);
      expect(typeErrorClick).toBe('error_correction');
      expect(canUseErrorClickMode(sampleQuestion, sampleOptions)).toBe(true);

      // 4. Error correction fallback: full-sentence options (not in-sentence tokens) fall back to multiple_choice
      const fullSentenceOpts = ['She go to school.', 'He walks home.', 'They plays football.'];
      const typeErrorMcq = resolveDrillType('error', 'Which sentence contains an error?', fullSentenceOpts);
      expect(typeErrorMcq).toBe('multiple_choice');
      expect(canUseErrorClickMode('Which sentence contains an error?', fullSentenceOpts)).toBe(false);

      // 5. Standard Multiple Choice (mcq / unknown defaults to multiple_choice)
      const typeMcq = resolveDrillType('mcq', 'Choose the correct answer', ['A', 'B', 'C', 'D']);
      expect(typeMcq).toBe('multiple_choice');

      // 6. sanitizeDrillExercise handles True/False ('tf') missing options by injecting ['Đúng', 'Sai']
      const sanitizedTf = sanitizeDrillExercise({
        question: 'Is this statement true?',
        type: 'tf',
        correct_answer: 'Đúng',
        options: [] as string[],
      });
      expect(sanitizedTf.type).toBe('multiple_choice');
      expect(sanitizedTf.options).toContain('Đúng');
      expect(sanitizedTf.options).toContain('Sai');
    });

    await runner.it('R1-GRAMMAR-4: Grammar progress maps states between text and FSRS number', () => {
      expect(stateToText(State.New)).toBe('new');
      expect(stateToText(State.Learning)).toBe('learning');
      expect(stateToText(State.Review)).toBe('review');
      expect(stateToText(State.Relearning)).toBe('relearning');

      expect(textToState('learning')).toBe(State.Learning);
      expect(textToState('review')).toBe(State.Review);
      expect(textToState('mastered')).toBe(State.Review);
      expect(textToState('relearning')).toBe(State.Relearning);
      expect(textToState('new')).toBe(State.New);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Word Library & Quota Enforcement
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Word Library Virtualization & Quota', async () => {
    await runner.it('R1-LIB-1: Free tier 200 words/month quota enforcement contract', async () => {
      expect(FREE_WORD_SAVE_MONTHLY_LIMIT).toBe(200);

      // Mock Supabase client returning specific counts and profile created_at
      const createMockSupabase = (wordCount: number): SupabaseClient => {
        return {
          from: (table: string) => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { created_at: new Date('2026-01-01T00:00:00Z').toISOString() },
                  error: null,
                }),
                gte: () => ({
                  limit: () => Promise.resolve({
                    data: Array.from({ length: wordCount }, (_, i) => ({ id: `word-${i}` })),
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        } as unknown as SupabaseClient;
      };

      const fixedCreatedAt = new Date('2026-01-01T00:00:00Z');

      // 1. Below quota (used 50): allowed
      const mockBelow = createMockSupabase(50);
      const resultBelow = await checkWordSaveQuota(mockBelow, 'user-below-50', 'free', 1, fixedCreatedAt);
      expect(resultBelow.allowed).toBe(true);
      expect(resultBelow.used).toBe(50);
      expect(resultBelow.limit).toBe(200);

      // 2. Exactly at limit (used 200, trying to add 1): blocked
      const mockAtLimit = createMockSupabase(200);
      const resultAtLimit = await checkWordSaveQuota(mockAtLimit, 'user-at-limit-200', 'free', 1, fixedCreatedAt);
      expect(resultAtLimit.allowed).toBe(false);
      expect(resultAtLimit.upgradeTo).toBe('pro');
      expect(resultAtLimit.used).toBe(200);

      // 3. Pro user: always allowed without limit
      const resultPro = await checkWordSaveQuota(mockAtLimit, 'user-pro-unlimited', 'pro', 1, fixedCreatedAt);
      expect(resultPro.allowed).toBe(true);
      expect(resultPro.limit).toBeNull();
    });

    await runner.it('R1-LIB-2: Multi-tier dictionary lookup and IPA resolution cascade', () => {
      // 1. Test authentic IPA extraction across dictionary formats and region preferences
      const multiRegionDictData = {
        pronunciations: [
          { region: 'US', ipa: '/ˈwɔːtər/' },
          { region: 'UK', ipa: '/ˈwɒt.ər/' },
        ],
        results: [{ meanings: [{ definition: 'nước', pos: 'noun' }] }],
      };

      // US preference (default)
      const usIpa = extractIpaFromDictionaryData(multiRegionDictData, 'US', 'water');
      expect(usIpa).toBe('ˈwɔːtər');

      // UK preference
      const ukIpa = extractIpaFromDictionaryData(multiRegionDictData, 'UK', 'water');
      expect(ukIpa).toBe('ˈwɒt.ər');

      // Fallback phonetic string parsing
      const flatDictData = { phonetic: '/həˈloʊ/' };
      const flatIpa = extractIpaFromDictionaryData(flatDictData, 'US', 'hello');
      expect(flatIpa).toBe('həˈloʊ');

      // Rejection of invalid non-IPA strings (garbage / URLs)
      const invalidDictData = { phonetic: 'https://example.com/audio.mp3' };
      const rejectedIpa = extractIpaFromDictionaryData(invalidDictData, 'US', 'test');
      expect(rejectedIpa).toBeUndefined();

      // 2. Verify static contract in src/app/api/words/route.ts for the 3-tier cascade
      const wordsRouteContent = fs.readFileSync(
        path.resolve(PROJECT_ROOT, 'src/app/api/words/route.ts'),
        'utf-8'
      );

      // Verify Tier 1: global_dictionary query
      expect(wordsRouteContent).toContain(".from('global_dictionary')");
      // Verify Tier 2: peer user word query
      expect(wordsRouteContent).toContain(".from('words')");
      expect(wordsRouteContent).toContain("source = 'peer_word'");
      // Verify Tier 3: AI background enrichment
      expect(wordsRouteContent).toContain('Tier 3: AI');
      expect(wordsRouteContent).toContain('enrichWord(');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Spaced Repetition (FSRS Algorithm & Due Queue)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('FSRS Spaced Repetition (ts-fsrs v5.4.1)', async () => {
    await runner.it('R1-FSRS-1: New card initial scheduling with short-term learning steps', () => {
      const now = new Date('2026-10-04T12:00:00Z');

      // Schedule brand new card with Good (3)
      const newCard: SrsRowLike = {
        stability: 0,
        difficulty: 0,
        review_count: 0,
        state: State.New,
      };

      const scheduledGood = scheduleNext(newCard, Rating.Good, now);

      expect(scheduledGood.review_count).toBe(1);
      expect(scheduledGood.state).toBe(State.Learning);
      expect(scheduledGood.stability).toBeGreaterThan(0);
      expect(scheduledGood.difficulty).toBeGreaterThanOrEqual(1);
      expect(scheduledGood.difficulty).toBeLessThanOrEqual(10);

      // Next review date must be in the future
      const due = new Date(scheduledGood.next_review_date);
      expect(due.getTime()).toBeGreaterThan(now.getTime());
    });

    await runner.it('R1-FSRS-2: Relearning steps upon lapses (Rating.Again)', () => {
      const now = new Date('2026-10-04T12:00:00Z');

      const matureCard: SrsRowLike = {
        stability: 15.5,
        difficulty: 4.2,
        interval_days: 14,
        review_count: 5,
        state: State.Review,
        lapses: 0,
        last_reviewed_at: new Date('2026-09-20T12:00:00Z').toISOString(),
        next_review_date: now.toISOString(),
      };

      // Student forgets card (Rating.Again = 1)
      const afterLapse = scheduleNext(matureCard, Rating.Again, now);

      expect(afterLapse.lapses).toBe(1);
      expect(afterLapse.state).toBe(State.Relearning);
      // Stability decreases on lapse
      expect(afterLapse.stability).toBeLessThan(15.5);

      // Due date should be near-term (relearning step ~10m)
      const due = new Date(afterLapse.next_review_date);
      const diffMinutes = (due.getTime() - now.getTime()) / (60 * 1000);
      expect(diffMinutes).toBeGreaterThan(0);
      expect(diffMinutes).toBeLessThanOrEqual(60);
    });

    await runner.it('R1-FSRS-3: Self-healing legacy repair clamps difficulty to [1, 10]', () => {
      const now = new Date('2026-10-04T12:00:00Z');

      // Broken legacy row with difficulty = 0, stability = 0, state = 0 but review_count = 3
      const corruptedLegacyRow: SrsRowLike = {
        stability: 0,
        difficulty: 0,
        review_count: 3,
        state: 0,
        last_reviewed_at: new Date('2026-10-01T12:00:00Z').toISOString(),
      };

      // Without crashing, scheduleNext must repair state and clamp difficulty
      const repaired = scheduleNext(corruptedLegacyRow, Rating.Good, now);

      expect(repaired.difficulty).toBeGreaterThanOrEqual(1);
      expect(repaired.difficulty).toBeLessThanOrEqual(10);
      expect(repaired.stability).toBeGreaterThan(0);
      expect(repaired.review_count).toBe(4);
    });

    await runner.it('R1-FSRS-4: Cross-classroom due queue filtering and deduplication logic', () => {
      // 1. Test isWordValidForReview: filters out corrupted, failed, or analyzing translations
      expect(isWordValidForReview({ word: 'apple', translation: 'quả táo' })).toBe(true);
      expect(isWordValidForReview({ word: 'banana', translation: 'failed to translate' })).toBe(false);
      expect(isWordValidForReview({ word: 'cherry', translation: '⏳ Analyzing...' })).toBe(false);
      expect(isWordValidForReview({ word: 'date', translation: '' })).toBe(false);
      expect(isWordValidForReview({ word: '', translation: 'quả chà là' })).toBe(false);

      // 2. Test deduplicateReviewWords across multiple classrooms
      // When a student has the same word across different classrooms (e.g. personal & TOEIC),
      // the system aggregates them and retains the one with higher reviewCount or earlier due date.
      const crossClassroomWords = [
        {
          id: 'w1',
          word: 'persistent',
          classroom_id: '__personal__',
          reviewCount: 1,
          next_review_date: '2026-10-04T10:00:00Z',
          example: 'Be persistent in your goals.',
        },
        {
          id: 'w2',
          word: 'persistent', // same word in another classroom with higher reps
          classroom_id: 'class_toeic_990',
          reviewCount: 5,
          next_review_date: '2026-10-04T08:00:00Z',
          example: 'He is persistent.',
        },
        {
          id: 'w3',
          word: 'meticulous',
          classroom_id: 'class_ielts_8',
          reviewCount: 3,
          next_review_date: '2026-10-04T09:00:00Z',
          example: 'A meticulous researcher.',
        },
      ];

      const deduplicated = deduplicateReviewWords(crossClassroomWords);
      expect(deduplicated.length).toBe(2);

      const persistentWord = deduplicated.find((w) => w.word === 'persistent');
      assert(persistentWord !== undefined, 'persistent must exist in deduplicated list');
      // Must pick the higher reviewCount item (5 reps from class_toeic_990)
      expect(persistentWord.reviewCount).toBe(5);
      expect(persistentWord.classroom_id).toBe('class_toeic_990');

      // 3. Verify that src/app/api/words/route.ts queries across ALL classrooms when classroomId is omitted
      const wordsRouteContent = fs.readFileSync(
        path.resolve(PROJECT_ROOT, 'src/app/api/words/route.ts'),
        'utf-8'
      );
      // RPC passes classroomId || null (null triggers cross-classroom retrieval in DB)
      expect(wordsRouteContent).toContain("p_classroom_id: classroomId || null");
      // Personal classroom fallback is bypassed in review mode
      expect(wordsRouteContent).toContain("!summary && filter !== 'review'");
    });
  });

  return runner;
}

if (require.main === module) {
  const runner = new TestRunner('R1: Learner Journey');
  runLearnerJourneyTests(runner).then(() => {
    const stats = runner.printSummary();
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
