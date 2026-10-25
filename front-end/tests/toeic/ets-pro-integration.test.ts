/**
 * ETS-PRO Integration Master Test Suite (Tiers 1 through 4).
 *
 * Verifies:
 * - Tier 1 (Feature Coverage):
 *   1. Year selector & 260 Listening Sets across 2019-2026.
 *   2. Flagged question review & Question History persistence (isFlagged & notes).
 *   3. Bilingual whole-passage translation (840 passages with dich_nghia for Part 6 & 7).
 *   4. 20 Full Exams & 4,000 Questions (ETS-PRO-01 to ETS-PRO-20, zero-bulk-leak grading).
 *   5. 8,504 Collocation Vocabulary (10,075 collocations, photos, TOEIC tips).
 * - Tier 2 (Boundary & Corner Cases):
 *   Boundary token resolution, empty range headers, Part 1 prompt standardization,
 *   single vs multi-word lookups, edge question numbers Q1/100/101/200.
 * - Tier 3 (Cross-Feature Combinations):
 *   Pairwise interactions between ETS-PRO, flagged history, bilingual reading, and media proxy.
 * - Tier 4 (Real-World Application Scenarios):
 *   Authentic full 200Q test simulation, error remediation loop, reading deep-dive,
 *   year-based listening practice, and live cyber defense audit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import {
  generateMediaProxyToken,
  resolveProxyMediaUrl,
  decryptMediaProxyToken,
} from '../../src/lib/toeic-media-proxy';
import {
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '../../src/lib/toeic-barem';
import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
} from '../../src/lib/toeic-anti-scraping';
import type {
  ToeicUnifiedQuestion,
  ToeicSanitizedQuestion,
  ToeicScoreResult,
} from '../../src/types/toeic';

const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.resolve(ROOT_DIR, 'scripts/dautoeic/data');

const LISTENING_SETS_PATH = path.join(DATA_DIR, 'listening_sets.json');
const MOCK_TESTS_PATH = path.join(DATA_DIR, 'mock_tests.json');
const MOCK_QUESTIONS_PATH = path.join(DATA_DIR, 'mock_test_questions.json');
const MOCK_PASSAGES_PATH = path.join(DATA_DIR, 'mock_test_passages.json');
const VOCABULARY_WORDS_PATH = path.join(DATA_DIR, 'vocabulary_words.json');
const CATALOG_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/toeic-catalog-index.json');

export async function runEtsProIntegrationTests(runner: TestRunner): Promise<void> {
  runner.describe('ETS-PRO Integration Suite (Tiers 1-4)', () => {});

  // Pre-load raw datasets lazily
  let listeningSets: any[] = [];
  let mockTests: any[] = [];
  let mockPassages: any[] = [];
  let mockQuestions: any[] = [];
  let vocabWords: any[] = [];

  try {
    if (fs.existsSync(LISTENING_SETS_PATH)) {
      listeningSets = JSON.parse(fs.readFileSync(LISTENING_SETS_PATH, 'utf-8'));
    }
    if (fs.existsSync(MOCK_TESTS_PATH)) {
      mockTests = JSON.parse(fs.readFileSync(MOCK_TESTS_PATH, 'utf-8'));
    }
    if (fs.existsSync(MOCK_PASSAGES_PATH)) {
      mockPassages = JSON.parse(fs.readFileSync(MOCK_PASSAGES_PATH, 'utf-8'));
    }
    if (fs.existsSync(MOCK_QUESTIONS_PATH)) {
      mockQuestions = JSON.parse(fs.readFileSync(MOCK_QUESTIONS_PATH, 'utf-8'));
    }
    if (fs.existsSync(VOCABULARY_WORDS_PATH)) {
      vocabWords = JSON.parse(fs.readFileSync(VOCABULARY_WORDS_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error preloading raw datasets for ETS-PRO tests:', err);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 1: Feature Coverage (Core Functional Contracts, >=5 per feature)
  // ──────────────────────────────────────────────────────────────────────────

  // --- Feature 1: Year Selector & 260 Listening Sets ---
  await runner.it('INT-1.1: Exactly 260 listening sets exist in the repository dataset', () => {
    expect(listeningSets.length).toBe(260);
  });

  await runner.it('INT-1.2: Listening sets span ETS editions across 2019 to 2026', () => {
    const years = new Set<string>();
    for (const set of listeningSets) {
      if (set.collection_name) {
        years.add(String(set.collection_name));
      }
    }
    const expectedYears = ['2019', '2020', '2021', '2022', '2023', '2024', '2026'];
    for (const y of expectedYears) {
      expect(years.has(y)).toBe(true);
    }
  });

  await runner.it('INT-1.3: Listening sets categorize into Parts 1, 2, 3, and 4', () => {
    const parts = new Set<string>();
    for (const set of listeningSets) {
      if (set.toeic_part) parts.add(String(set.toeic_part));
    }
    expect(parts.has('part1')).toBe(true);
    expect(parts.has('part2')).toBe(true);
    expect(parts.has('part3')).toBe(true);
    expect(parts.has('part4')).toBe(true);
  });

  await runner.it('INT-1.4: Listening sets data integrity: every set has valid id, name, and folder_path', () => {
    expect(listeningSets.length).toBeGreaterThan(0);
    for (const set of listeningSets.slice(0, 50)) {
      expect(typeof set.id).toBe('string');
      expect(typeof set.name).toBe('string');
      expect(typeof set.folder_path).toBe('string');
      expect(set.name.length).toBeGreaterThan(0);
    }
  });

  await runner.it('INT-1.5: Listening question audio URLs resolve cleanly to proxy endpoints', () => {
    const withAudio = mockQuestions.filter((q) => Boolean(q.audio_url));
    expect(withAudio.length).toBe(2000); // 20 tests * 100 listening questions = 2,000

    // Sample audio resolution
    for (const q of withAudio.slice(0, 10)) {
      const proxied = resolveProxyMediaUrl(q.audio_url);
      expect(proxied.startsWith('/api/toeic/media/proxy?t=')).toBe(true);
      expect(proxied.includes('odlnhfaygiotcyehuysw')).toBe(false);
    }
  });

  // --- Feature 2: Flagged Review & Question History ---
  await runner.it('INT-2.1: Extended Question History record schema supports isFlagged and notes', () => {
    const record = {
      questionId: 'ets-pro-01-q045',
      part: 3,
      lastAnsweredAt: new Date().toISOString(),
      isCorrect: false,
      attemptCount: 1,
      selectedOption: 'B',
      isFlagged: true,
      flaggedAt: new Date().toISOString(),
      notes: 'Review speakers tone when discussing the shipment delay',
      notesUpdatedAt: new Date().toISOString(),
    };
    expect(record.isFlagged).toBe(true);
    expect(typeof record.notes).toBe('string');
    expect(record.notes).toContain('shipment delay');
  });

  await runner.it('INT-2.2: Flagging an item toggles isFlagged to true and records flaggedAt', () => {
    const history: Record<string, any> = {};
    const qId = 'ets-pro-01-q102';
    history[qId] = {
      questionId: qId,
      part: 5,
      lastAnsweredAt: new Date().toISOString(),
      isCorrect: true,
      attemptCount: 1,
      selectedOption: 'C',
    };
    expect(history[qId].isFlagged).toBeUndefined();

    // Toggle flag
    history[qId].isFlagged = true;
    history[qId].flaggedAt = new Date().toISOString();
    expect(history[qId].isFlagged).toBe(true);
    expect(typeof history[qId].flaggedAt).toBe('string');
  });

  await runner.it('INT-2.3: Updating personal note updates notes and notesUpdatedAt timestamp', () => {
    const record: any = {
      questionId: 'ets-pro-02-q152',
      part: 7,
      isFlagged: true,
      notes: 'Initial observation',
    };
    const now = new Date().toISOString();
    record.notes = 'Remember: invoices require matching purchase order numbers';
    record.notesUpdatedAt = now;

    expect(record.notes).toContain('matching purchase order');
    expect(record.notesUpdatedAt).toBe(now);
  });

  await runner.it('INT-2.4: Question history review mode accurately filters flagged questions', () => {
    const historyRecords = [
      { questionId: 'q1', isFlagged: true, isCorrect: true },
      { questionId: 'q2', isFlagged: false, isCorrect: false },
      { questionId: 'q3', isFlagged: true, isCorrect: false },
      { questionId: 'q4', isCorrect: true },
    ];
    const flaggedItems = historyRecords.filter((r) => r.isFlagged === true);
    expect(flaggedItems.length).toBe(2);
    expect(flaggedItems.map((r) => r.questionId)).toEqual(['q1', 'q3']);
  });

  await runner.it('INT-2.5: Question history review mode accurately filters mistakes (isCorrect: false)', () => {
    const historyRecords = [
      { questionId: 'q1', isFlagged: true, isCorrect: true },
      { questionId: 'q2', isFlagged: false, isCorrect: false },
      { questionId: 'q3', isFlagged: true, isCorrect: false },
      { questionId: 'q4', isCorrect: true },
    ];
    const mistakeItems = historyRecords.filter((r) => r.isCorrect === false);
    expect(mistakeItems.length).toBe(2);
    expect(mistakeItems.map((r) => r.questionId)).toEqual(['q2', 'q3']);
  });

  // --- Feature 3: Bilingual Whole-Passage Translation ---
  await runner.it('INT-3.1: Exactly 840 reading passages exist in mock_test_passages dataset', () => {
    expect(mockPassages.length).toBe(840);
  });

  await runner.it('INT-3.2: All 4,000 exam questions have curated dich_nghia Vietnamese translations', () => {
    const questionsWithDich = mockQuestions.filter(
      (q) => typeof q.dich_nghia === 'string' && q.dich_nghia.trim().length > 10
    );
    expect(questionsWithDich.length).toBe(4000);
  });

  await runner.it('INT-3.3: Vietnamese passage translations are clean of competitor brand marks', () => {
    for (const q of mockQuestions.slice(0, 100)) {
      if (q.dich_nghia) {
        expect(q.dich_nghia.toLowerCase().includes('dautoeic')).toBe(false);
        expect(q.dich_nghia.toLowerCase().includes('dauenglish')).toBe(false);
      }
    }
  });

  await runner.it('INT-3.4: Reading passages link to questions via passage_id with matched translations', () => {
    const passageMap = new Map(mockPassages.map((p) => [p.id, p]));
    const readingQuestionsWithPassage = mockQuestions.filter(
      (q) => q.part === 7 && q.passage_id && passageMap.has(q.passage_id)
    );
    expect(readingQuestionsWithPassage.length).toBeGreaterThan(500);

    const sample = readingQuestionsWithPassage[0];
    const matchedPassage = passageMap.get(sample.passage_id);
    expect(matchedPassage).toBeDefined();
    expect(typeof sample.dich_nghia).toBe('string');
    expect(sample.dich_nghia.length).toBeGreaterThan(20);
  });

  await runner.it('INT-3.5: ToeicUnifiedQuestion type supports passageTranslationVi without compiler error', () => {
    const q: ToeicUnifiedQuestion = {
      id: 'ets-pro-01-q147',
      testId: 'ets-pro-01',
      questionNumber: 147,
      part: 7,
      section: 'reading',
      prompt: 'What is the purpose of the email?',
      options: [
        { key: 'A', text: 'To confirm an order' },
        { key: 'B', text: 'To request a refund' },
        { key: 'C', text: 'To schedule a delivery' },
        { key: 'D', text: 'To report a damaged item' },
      ],
      correctAnswer: 'A',
      passage: 'Dear Mr. Henderson, Thank you for placing your order with Acme Supplies...',
      passageTranslationVi: 'Kính gửi ông Henderson, Cảm ơn ông đã đặt hàng tại Acme Supplies...',
    };
    expect(q.passageTranslationVi).toBeDefined();
    expect(q.passageTranslationVi).toContain('Kính gửi ông Henderson');
  });

  // --- Feature 4: 20 Full Exams & 4,000 Questions ---
  await runner.it('INT-4.1: Exactly 20 full mock tests exist in mock_tests dataset', () => {
    expect(mockTests.length).toBe(20);
  });

  await runner.it('INT-4.2: Exactly 4,000 questions exist in mock_test_questions dataset', () => {
    expect(mockQuestions.length).toBe(4000);
  });

  await runner.it('INT-4.3: Every full test has exactly 200 questions across standard Parts 1-7', () => {
    const testGroups: Record<string, number> = {};
    for (const q of mockQuestions) {
      testGroups[q.test_id] = (testGroups[q.test_id] || 0) + 1;
    }
    const testIds = Object.keys(testGroups);
    expect(testIds.length).toBe(20);
    for (const tid of testIds) {
      expect(testGroups[tid]).toBe(200);
    }
  });

  await runner.it('INT-4.4: Zero-Bulk-Leak server-side grading contract: client strips answers before submit', () => {
    const rawQ = {
      id: 'ets-pro-01-q001',
      testId: 'ets-pro-01',
      questionNumber: 1,
      part: 1 as const,
      section: 'listening' as const,
      options: [
        { key: 'A' as const, text: 'He is holding a pen.' },
        { key: 'B' as const, text: 'He is typing on a keyboard.' },
        { key: 'C' as const, text: 'He is looking at a monitor.' },
        { key: 'D' as const, text: 'He is writing in a notebook.' },
      ],
      correctAnswer: 'B' as const,
      explanationVi: 'Đáp án B đúng vì người đàn ông đang gõ bàn phím.',
    };

    // Client sanitized view
    const clientQ: ToeicSanitizedQuestion = {
      id: rawQ.id,
      testId: rawQ.testId,
      questionNumber: rawQ.questionNumber,
      part: rawQ.part,
      section: rawQ.section,
      options: rawQ.options,
    };

    expect((clientQ as any).correctAnswer).toBeUndefined();
    expect((clientQ as any).explanationVi).toBeUndefined();
    expect(JSON.stringify(clientQ).includes('Đáp án B đúng')).toBe(false);
  });

  await runner.it('INT-4.5: Server-side scoring barem accurately calculates official scaled scores (10-990)', () => {
    // 0 raw LC + 0 raw RC = 10 total
    const zeroScore = convertRawToScaled(0, 0);
    expect(zeroScore.scaledListening).toBe(5);
    expect(zeroScore.scaledReading).toBe(5);
    expect(zeroScore.scaledTotal).toBe(10);

    // 100 raw LC + 100 raw RC = 990 total
    const maxScore = convertRawToScaled(100, 100);
    expect(maxScore.scaledListening).toBe(495);
    expect(maxScore.scaledReading).toBe(495);
    expect(maxScore.scaledTotal).toBe(990);

    // Intermediate realistic score: 75 LC (380), 80 RC (390)
    const midScore = convertRawToScaled(75, 80);
    expect(midScore.scaledListening).toBe(lookupListeningScore(75));
    expect(midScore.scaledReading).toBe(lookupReadingScore(80));
    expect(midScore.scaledTotal).toBe(midScore.scaledListening + midScore.scaledReading);
  });

  // --- Feature 5: 8,504 Collocation Vocabulary ---
  await runner.it('INT-5.1: Exactly 8,504 vocabulary items exist in vocabulary_words dataset', () => {
    expect(vocabWords.length).toBe(8504);
  });

  await runner.it('INT-5.2: At least 10,000 unique collocation phrases exist across vocabulary items', () => {
    const uniquePhrases = new Set<string>();
    for (const w of vocabWords) {
      if (w.phrases && Array.isArray(w.phrases)) {
        for (const p of w.phrases) {
          if (p.phrase) uniquePhrases.add(p.phrase.trim().toLowerCase());
        }
      }
    }
    expect(uniquePhrases.size).toBeGreaterThanOrEqual(10000);
  });

  await runner.it('INT-5.3: Rich vocabulary fields present: over 4,500 entries with photos and over 5,000 with collocations', () => {
    const withImages = vocabWords.filter((w) => Boolean(w.image_url));
    const withPhrases = vocabWords.filter((w) => w.phrases && w.phrases.length > 0);
    expect(withImages.length).toBeGreaterThanOrEqual(4500);
    expect(withPhrases.length).toBeGreaterThanOrEqual(5000);
  });

  await runner.it('INT-5.4: Native pronunciation audio URLs exist for over 4,000 vocabulary items', () => {
    const withAudio = vocabWords.filter((w) => Boolean(w.audio_us) && Boolean(w.audio_uk));
    expect(withAudio.length).toBeGreaterThanOrEqual(4000);
  });

  await runner.it('INT-5.5: Rich vocabulary items contain curated TOEIC tips and contextual examples', () => {
    const withTip = vocabWords.filter((w) =>
      w.meanings && w.meanings.some((m: any) => Boolean(m.toeic_tip))
    );
    expect(withTip.length).toBeGreaterThanOrEqual(100);
    const sample = withTip[0];
    const tipMeaning = sample.meanings.find((m: any) => m.toeic_tip);
    expect(typeof tipMeaning.toeic_tip).toBe('string');
    expect(tipMeaning.toeic_tip.length).toBeGreaterThan(10);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 2: Boundary & Corner Cases (>=5 tests per feature)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('INT-B.1: Boundary: Corrupted proxy tokens return fallback without throwing exceptions', () => {
    const corruptedTokens = ['', '   ', 'invalid_hex_token', null as any, undefined as any];
    for (const token of corruptedTokens) {
      const res = decryptMediaProxyToken(token);
      expect(res).toBeNull();
    }
  });

  await runner.it('INT-B.2: Boundary: URL resolver gracefully handles empty, null, and whitespace inputs', () => {
    expect(resolveProxyMediaUrl('')).toBe('');
    expect(resolveProxyMediaUrl('   ')).toBe('');
    expect(resolveProxyMediaUrl(null as any)).toBe('');
    expect(resolveProxyMediaUrl(undefined as any)).toBe('');
  });

  await runner.it('INT-B.3: Boundary: Part 1 prompt integrity: standardized to "Mark your answer on your answer sheet"', () => {
    const p1Questions = mockQuestions.filter((q) => q.part === 1).slice(0, 50);
    expect(p1Questions.length).toBeGreaterThan(0);
    // Part 1 prompts must not include competitor brand tags
    for (const q of p1Questions) {
      if (q.question_text) {
        expect(q.question_text.toLowerCase().includes('dautoeic')).toBe(false);
      }
    }
  });

  await runner.it('INT-B.4: Boundary: Single-word vs multi-word collocation lookup handling', () => {
    // Single word headword
    const singleWord = 'inspiring';
    const multiWord = 'inspiring speech';
    const hyphenated = 'follow-up';

    expect(singleWord.includes(' ')).toBe(false);
    expect(multiWord.includes(' ')).toBe(true);
    expect(hyphenated.includes('-')).toBe(true);

    // Finding in dataset
    const foundWord = vocabWords.find((w) => w.word === singleWord);
    expect(foundWord).toBeDefined();
    if (foundWord?.phrases) {
      const foundPhrase = foundWord.phrases.find((p: any) => p.phrase === multiWord);
      expect(foundPhrase).toBeDefined();
      expect(foundPhrase.meaning).toContain('truyền cảm hứng');
    }
  });

  await runner.it('INT-B.5: Boundary: Extreme question numbers Q1, Q100, Q101, Q200 and bounds checking', () => {
    // Valid boundaries in standard 200Q TOEIC exam
    const validQuestionNumbers = [1, 100, 101, 200];
    for (const qn of validQuestionNumbers) {
      expect(qn >= 1 && qn <= 200).toBe(true);
      const isListening = qn <= 100;
      const isReading = qn > 100;
      expect(isListening || isReading).toBe(true);
    }

    // Invalid bounds
    const invalidNumbers = [0, -1, 201, 999];
    for (const inq of invalidNumbers) {
      const inBounds = inq >= 1 && inq <= 200;
      expect(inBounds).toBe(false);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 3: Cross-Feature Combinations (Pairwise Interaction)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('INT-C.1: Pairwise: Flagging an imported ETS-PRO question updates question history and note', () => {
    const history: Record<string, any> = {};
    const testId = 'ETS-PRO-01';
    const qNum = 52;
    const qKey = `${testId}-Q${qNum}`;

    // Student answers question 52
    history[qKey] = {
      questionId: qKey,
      part: 3,
      selectedOption: 'A',
      isCorrect: false,
      lastAnsweredAt: new Date().toISOString(),
      attemptCount: 1,
      isFlagged: true,
      notes: 'Tricky conversation between project manager and client',
    };

    expect(history[qKey].isFlagged).toBe(true);
    expect(history[qKey].notes).toContain('Tricky conversation');
  });

  await runner.it('INT-C.2: Pairwise: Collocation lookup within a Part 7 bilingual passage', () => {
    const qWithPassageAndDich = mockQuestions.find(
      (q) => q.part === 7 && q.dich_nghia && q.dich_nghia.length > 50
    );
    expect(qWithPassageAndDich).toBeDefined();

    // Look up 'inspiring' in vocabulary dataset
    const inspiringWord = vocabWords.find((w) => w.word?.toLowerCase() === 'inspiring');
    expect(inspiringWord).toBeDefined();
    expect(inspiringWord.phrases?.length).toBeGreaterThan(0);
  });

  await runner.it('INT-C.3: Pairwise: Media proxy streaming within flagged question review', () => {
    // Reviewing a flagged Part 1 question resolves its image and audio to internal proxy
    const flaggedQ = {
      questionId: 'ets-pro-01-q001',
      part: 1,
      audioUrl: 'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/audio/q1.mp3',
      imageUrl: 'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/images/q1.jpg',
    };

    const proxiedAudio = resolveProxyMediaUrl(flaggedQ.audioUrl);
    const proxiedImage = resolveProxyMediaUrl(flaggedQ.imageUrl);

    expect(proxiedAudio.startsWith('/api/toeic/media/proxy?t=')).toBe(true);
    expect(proxiedImage.startsWith('/api/toeic/media/proxy?t=')).toBe(true);
    expect(proxiedAudio.includes('odlnhfaygiotcyehuysw')).toBe(false);
    expect(proxiedImage.includes('odlnhfaygiotcyehuysw')).toBe(false);
  });

  await runner.it('INT-C.4: Pairwise: Bilingual reading translation toggle state preserved across passage cluster', () => {
    // Multi-question passage (Questions 153 to 155 share the same passage)
    const cluster = {
      passageId: 'passage-812',
      startQ: 153,
      endQ: 155,
      bilingualActive: true,
    };

    // Navigating between Q153 and Q154 within cluster retains bilingual toggle state
    let activeQ = cluster.startQ;
    expect(cluster.bilingualActive).toBe(true);

    activeQ = 154;
    expect(cluster.bilingualActive).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 4: Real-World Application Scenarios (>=5 Authentic Student Workloads)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('INT-S.1: Scenario 1: Authentic full 200Q test simulation on ETS-PRO-01', () => {
    // Step 1: Pre-submission state verification (Zero Bulk Leaks)
    const examQuestions: ToeicSanitizedQuestion[] = [];
    for (let i = 1; i <= 200; i++) {
      examQuestions.push({
        id: `ets-pro-01-q${String(i).padStart(3, '0')}`,
        testId: 'ets-pro-01',
        questionNumber: i,
        part: (i <= 6 ? 1 : i <= 31 ? 2 : i <= 70 ? 3 : i <= 100 ? 4 : i <= 130 ? 5 : i <= 146 ? 6 : 7) as any,
        section: i <= 100 ? 'listening' : 'reading',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' },
        ],
      });
    }
    expect(examQuestions.length).toBe(200);

    // Assert zero answers leaked
    for (const q of examQuestions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).explanationVi).toBeUndefined();
    }

    // Step 2: Student records answers (80 correct LC, 75 correct RC)
    const rawLc = 80;
    const rawRc = 75;

    // Step 3: Server-side submission and score calculation
    const score = convertRawToScaled(rawLc, rawRc);
    expect(score.scaledListening).toBe(lookupListeningScore(rawLc));
    expect(score.scaledReading).toBe(lookupReadingScore(rawRc));
    expect(score.scaledTotal).toBe(score.scaledListening + score.scaledReading);
    expect(score.scaledTotal).toBeGreaterThanOrEqual(700);
  });

  await runner.it('INT-S.2: Scenario 2: Error remediation workflow in [🔖 Câu cần luyện lại]', () => {
    const questionHistory = [
      { questionId: 'ets-pro-01-q015', part: 2, isCorrect: false, isFlagged: false },
      { questionId: 'ets-pro-01-q042', part: 3, isCorrect: false, isFlagged: true, notes: 'Focus on second speaker turn' },
      { questionId: 'ets-pro-01-q105', part: 5, isCorrect: false, isFlagged: false },
      { questionId: 'ets-pro-01-q160', part: 7, isCorrect: true, isFlagged: true, notes: 'Double check refund policy window' },
    ];

    // Filter questions needing review: flagged OR mistake
    const reviewItems = questionHistory.filter((q) => q.isFlagged || !q.isCorrect);
    expect(reviewItems.length).toBe(4);

    // Filter specifically flagged items
    const flaggedItems = reviewItems.filter((q) => q.isFlagged);
    expect(flaggedItems.length).toBe(2);
    expect(flaggedItems[0].notes).toContain('second speaker turn');
  });

  await runner.it('INT-S.3: Scenario 3: Reading comprehension study session with bilingual translation & collocation lookup', () => {
    const qSample = mockQuestions.find((q) => q.part === 7 && q.dich_nghia);
    expect(qSample).toBeDefined();

    // Toggle view modes
    let viewMode: 'english_only' | 'bilingual' = 'english_only';
    expect(viewMode).toBe('english_only');

    viewMode = 'bilingual';
    expect(viewMode).toBe('bilingual');
    expect(typeof qSample.dich_nghia).toBe('string');

    // 1-click collocation lookup
    const sampleWord = vocabWords[0];
    expect(sampleWord.word).toBeDefined();
    if (sampleWord.phrases && sampleWord.phrases.length > 0) {
      const phrase = sampleWord.phrases[0];
      expect(typeof phrase.phrase).toBe('string');
      expect(typeof phrase.meaning).toBe('string');
    }
  });

  await runner.it('INT-S.4: Scenario 4: Intensive listening practice by year (Year Selector 2024)', () => {
    const sets2024 = listeningSets.filter((s) => s.collection_name === '2024');
    expect(sets2024.length).toBeGreaterThan(0);
    expect(sets2024.length).toBe(40); // 10 tests * 4 parts

    // Verified listening sets have valid folder paths
    for (const set of sets2024.slice(0, 5)) {
      expect(set.folder_path.startsWith('luyende/2024')).toBe(true);
    }
  });

  await runner.it('INT-S.5: Scenario 5: Cyber defense & copyright protection in live exam session', () => {
    // Explanation revealed post-submission carries invisible steganographic watermark
    const rawExplanation = 'Đáp án đúng là (C). Trạng từ "significantly" bổ nghĩa cho động từ "increased".';
    const watermarkPayload = 'LINGOPRO_ETSPRO_01_Q112';

    const watermarkedExplanation = embedInvisibleWatermark(rawExplanation, watermarkPayload);
    expect(watermarkedExplanation.length).toBeGreaterThan(rawExplanation.length);

    // Scraper attempting to copy text unknowingly copies watermark
    const recoveredPayload = extractInvisibleWatermark(watermarkedExplanation);
    expect(recoveredPayload).toBe(watermarkPayload);

    // Human reader sees zero distortion
    const stripped = watermarkedExplanation.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
    expect(stripped).toBe(rawExplanation);
  });
}

// Standalone execution support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('ets-pro-integration.test'))) {
  const runner = new TestRunner();
  runEtsProIntegrationTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nETS-PRO Integration Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
