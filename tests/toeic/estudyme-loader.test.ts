/**
 * Estudyme Loader & Card Normalizer Test Suite.
 *
 * Verifies:
 * - Parent card unpacking for grouped items (Parts 3, 4, 6, 7).
 * - Inheritance of stimulus audio, transcripts, and reading passages from parent cards to child questions.
 * - Option consistency: Part 2 has exactly 3 options (A, B, C); other parts have 4 options (A, B, C, D).
 * - Option letter normalization and clean text extraction.
 * - Media URL validity against Google Cloud Storage CDN and Study4 CDN.
 * - Reference normalizer adapter converting Estudyme cards to ToeicUnifiedQuestion[].
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect, ToeicUnifiedQuestion } from './test-harness';

const ROOT_DIR = path.resolve(__dirname, '../..');
const PRACTICE_PARTS_DIR = path.resolve(ROOT_DIR, 'crawlers/toeic/estudyme_data/practice_parts');
const ESTUDYME_FULL_DIR = path.resolve(ROOT_DIR, 'crawlers/toeic/estudyme_data/full_tests');

export interface EstudymeRawCard {
  id: string;
  questionText?: string | null;
  image?: string | null;
  sound?: string | null;
  options?: string[];
  correctOptions?: string[];
  transcript?: string | null;
  explanationVi?: string | null;
  childQuestions?: EstudymeRawCard[];
}

export interface EstudymeRawFile {
  topicId?: string;
  name: string;
  slug: string;
  part: string;
  totalQuestions?: number;
  totalCards?: number;
  cards: EstudymeRawCard[];
}

/**
 * Clean option letter from strings like "(A) option text" or "A. option text" or "(A)"
 */
export function extractOptionKey(raw: string, index: number): 'A' | 'B' | 'C' | 'D' {
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  if (!raw) return letters[index] || 'A';
  const match = raw.trim().match(/^\(?([A-Da-d])\)?/);
  if (match) {
    return match[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
  }
  return letters[index] || 'A';
}

/**
 * Clean option text by removing leading "(A) ", "A. ", etc.
 */
export function extractOptionText(raw: string): string {
  if (!raw) return '';
  return raw.replace(/^\s*\(?[A-Da-d]\)?[.:\-]?\s*/, '').trim();
}

/**
 * Determine correct answer key from correctOptions array
 */
export function extractCorrectAnswer(
  correctOptions?: string[] | null,
  options?: string[]
): 'A' | 'B' | 'C' | 'D' {
  if (!correctOptions || correctOptions.length === 0) return 'A';
  const target = correctOptions[0].trim();
  const directMatch = target.match(/^\(?([A-Da-d])\)?/);
  if (directMatch) {
    return directMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
  }
  // Try finding matching index in options
  if (options && options.length > 0) {
    const idx = options.findIndex((opt) => opt.trim() === target || extractOptionText(opt) === extractOptionText(target));
    if (idx >= 0 && idx < 4) {
      return (['A', 'B', 'C', 'D'] as const)[idx];
    }
  }
  return 'A';
}

/**
 * Canonical Reference Adapter: Unpacks Estudyme cards into unified questions.
 */
export function adaptEstudymeCardsToUnified(
  cards: EstudymeRawCard[],
  partNumber: number,
  testIdPrefix = 'estudyme'
): ToeicUnifiedQuestion[] {
  const questions: ToeicUnifiedQuestion[] = [];
  let currentQNum = 1;

  for (const card of cards) {
    const hasChildren = Array.isArray(card.childQuestions) && card.childQuestions.length > 0;

    if (hasChildren) {
      // Grouped stimulus (Part 3, 4, 6, 7)
      const stimulusAudio = card.sound || undefined;
      const stimulusImage = card.image || undefined;
      const stimulusPassage = card.questionText || undefined;
      const stimulusTranscript = card.transcript || undefined;

      const section: 'listening' | 'reading' = partNumber <= 4 ? 'listening' : 'reading';

      for (const child of card.childQuestions!) {
        const childOpts = child.options || [];
        const isPart2 = partNumber === 2;
        const expectedCount = isPart2 ? 3 : 4;
        const normalizedOptions = childOpts.slice(0, expectedCount).map((optStr, idx) => ({
          key: extractOptionKey(optStr, idx),
          text: extractOptionText(optStr),
        }));

        const unifiedQ: ToeicUnifiedQuestion = {
          id: child.id || `${testIdPrefix}-q${currentQNum}`,
          testId: testIdPrefix,
          questionNumber: currentQNum,
          part: partNumber as any,
          section,
          prompt: child.questionText || '',
          options: normalizedOptions,
          correctAnswer: extractCorrectAnswer(child.correctOptions, child.options),
          audioUrl: child.sound || stimulusAudio,
          imageUrl: child.image || stimulusImage,
          passage: stimulusPassage,
          transcript: child.transcript || stimulusTranscript,
          explanationVi: child.explanationVi || undefined,
        };

        questions.push(unifiedQ);
        currentQNum++;
      }
    } else {
      // Standalone card (Part 1, Part 2, Part 5)
      const section: 'listening' | 'reading' = partNumber <= 4 ? 'listening' : 'reading';
      const isPart2 = partNumber === 2;
      const expectedCount = isPart2 ? 3 : 4;
      const rawOpts = card.options || [];
      const normalizedOptions = rawOpts.slice(0, expectedCount).map((optStr, idx) => ({
        key: extractOptionKey(optStr, idx),
        text: extractOptionText(optStr),
      }));

      const unifiedQ: ToeicUnifiedQuestion = {
        id: card.id || `${testIdPrefix}-q${currentQNum}`,
        testId: testIdPrefix,
        questionNumber: currentQNum,
        part: partNumber as any,
        section,
        prompt: card.questionText || '',
        options: normalizedOptions,
        correctAnswer: extractCorrectAnswer(card.correctOptions, card.options),
        audioUrl: card.sound || undefined,
        imageUrl: card.image || undefined,
        transcript: card.transcript || undefined,
        explanationVi: card.explanationVi || undefined,
      };

      questions.push(unifiedQ);
      currentQNum++;
    }
  }

  return questions;
}

export async function runEstudymeLoaderTests(runner: TestRunner): Promise<void> {
  runner.describe('Estudyme Loader & Card Normalizer Suite', () => {
    runner.it('EST-1: Unpacking Part 3 parent card propagates audio stimulus & transcript to all 3 child questions', () => {
      const p3Path = path.join(PRACTICE_PARTS_DIR, 'part_3_conversations/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p3Path, 'utf-8'));

      const parentCard = rawData.cards[0];
      expect(parentCard.sound).toBeDefined();
      expect(parentCard.sound!.includes('.mp3')).toBe(true);
      expect(parentCard.childQuestions).toBeDefined();
      expect(parentCard.childQuestions!.length).toBe(3);

      const unpacked = adaptEstudymeCardsToUnified([parentCard], 3, 'test-p3');
      expect(unpacked.length).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(unpacked[i].part).toBe(3);
        expect(unpacked[i].questionNumber).toBe(i + 1);
        expect(unpacked[i].audioUrl).toBe(parentCard.sound);
        expect((unpacked[i].prompt || '').length).toBeGreaterThan(0);
        expect(unpacked[i].options.length).toBe(4);
      }
    });

    runner.it('EST-2: Unpacking Part 4 parent card propagates talk audio stimulus to child questions', () => {
      const p4Path = path.join(PRACTICE_PARTS_DIR, 'part_4_short_talks/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p4Path, 'utf-8'));

      const parentCard = rawData.cards[0];
      expect(parentCard.sound).toBeDefined();
      expect(parentCard.childQuestions!.length).toBeGreaterThan(0);

      const unpacked = adaptEstudymeCardsToUnified([parentCard], 4, 'test-p4');
      expect(unpacked.length).toBe(parentCard.childQuestions!.length);
      for (const q of unpacked) {
        expect(q.part).toBe(4);
        expect(q.audioUrl).toBe(parentCard.sound);
        expect(q.options.length).toBe(4);
      }
    });

    runner.it('EST-3: Unpacking Part 6 parent card propagates cloze text passage to blanks', () => {
      const p6Path = path.join(PRACTICE_PARTS_DIR, 'part_6_text_completion/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p6Path, 'utf-8'));

      const parentCard = rawData.cards[0];
      expect(parentCard.questionText).toBeDefined();
      expect(parentCard.questionText!.length).toBeGreaterThan(20);
      expect(parentCard.childQuestions!.length).toBe(4);

      const unpacked = adaptEstudymeCardsToUnified([parentCard], 6, 'test-p6');
      expect(unpacked.length).toBe(4);
      for (const q of unpacked) {
        expect(q.part).toBe(6);
        expect(q.passage).toBe(parentCard.questionText);
        expect(q.options.length).toBe(4);
      }
    });

    runner.it('EST-4: Unpacking Part 7 single passage propagates reading text to comprehension questions', () => {
      const p7Path = path.join(PRACTICE_PARTS_DIR, 'part_7_single_passages/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p7Path, 'utf-8'));

      const parentCard = rawData.cards[0];
      expect(parentCard.questionText).toBeDefined();
      const childCount = parentCard.childQuestions!.length;

      const unpacked = adaptEstudymeCardsToUnified([parentCard], 7, 'test-p7');
      expect(unpacked.length).toBe(childCount);
      for (const q of unpacked) {
        expect(q.part).toBe(7);
        expect(q.passage).toBe(parentCard.questionText);
        expect((q.prompt || '').length).toBeGreaterThan(0);
        expect(q.options.length).toBe(4);
      }
    });

    runner.it('EST-5: Unpacking Part 7 double and triple passages maintains multi-question context', () => {
      const p7DoublePath = path.join(PRACTICE_PARTS_DIR, 'part_7_double_passages/test-1.json');
      const p7TriplePath = path.join(PRACTICE_PARTS_DIR, 'part_7_triple_passages/test-1.json');

      const dData: EstudymeRawFile = JSON.parse(fs.readFileSync(p7DoublePath, 'utf-8'));
      const tData: EstudymeRawFile = JSON.parse(fs.readFileSync(p7TriplePath, 'utf-8'));

      const dUnpacked = adaptEstudymeCardsToUnified(dData.cards, 7, 'test-d');
      const tUnpacked = adaptEstudymeCardsToUnified(tData.cards, 7, 'test-t');

      expect(dUnpacked.length).toBeGreaterThan(0);
      expect(tUnpacked.length).toBeGreaterThan(0);
      expect(dUnpacked[0].options.length).toBe(4);
      expect(tUnpacked[0].options.length).toBe(4);
    });

    runner.it('EST-6: Option count consistency — Part 2 enforces exactly 3 options (A, B, C) and no option D', () => {
      const p2Path = path.join(PRACTICE_PARTS_DIR, 'part_2_question_response/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p2Path, 'utf-8'));

      for (const card of rawData.cards) {
        expect(card.options).toBeDefined();
        expect(card.options!.length).toBe(3);
        const ans = extractCorrectAnswer(card.correctOptions, card.options);
        expect(['A', 'B', 'C'].includes(ans)).toBe(true);
        expect(ans === 'D').toBe(false);
      }

      const unpacked = adaptEstudymeCardsToUnified(rawData.cards, 2, 'p2-test');
      for (const q of unpacked) {
        expect(q.options.length).toBe(3);
        expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C']);
        expect(['A', 'B', 'C'].includes(q.correctAnswer)).toBe(true);
      }
    });

    runner.it('EST-7: Option count consistency — Parts 1, 3, 4, 5, 6, 7 enforce exactly 4 options (A, B, C, D)', () => {
      const sampleFiles = [
        { path: path.join(PRACTICE_PARTS_DIR, 'part_1_photos/test-1.json'), part: 1 },
        { path: path.join(PRACTICE_PARTS_DIR, 'part_5_incomplete_sentences/test-1.json'), part: 5 },
      ];

      for (const { path: fPath, part } of sampleFiles) {
        const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(fPath, 'utf-8'));
        const unpacked = adaptEstudymeCardsToUnified(rawData.cards, part, `p${part}`);
        for (const q of unpacked) {
          expect(q.options.length).toBe(4);
          expect(q.options.map((o) => o.key)).toEqual(['A', 'B', 'C', 'D']);
          expect(['A', 'B', 'C', 'D'].includes(q.correctAnswer)).toBe(true);
        }
      }
    });

    runner.it('EST-8: Option letter extraction cleanly normalizes bracketed and prefixed raw choices', () => {
      expect(extractOptionKey('(A) Highly capable', 0)).toBe('A');
      expect(extractOptionKey('B. Satisfactory', 1)).toBe('B');
      expect(extractOptionKey('(c) lowercase', 2)).toBe('C');
      expect(extractOptionKey('D - Final choice', 3)).toBe('D');
      expect(extractOptionKey('Plain choice without key', 0)).toBe('A');

      expect(extractOptionText('(A) Highly capable')).toBe('Highly capable');
      expect(extractOptionText('B. Satisfactory')).toBe('Satisfactory');
      expect(extractOptionText('(C)')).toBe('');
    });

    runner.it('EST-9: Media URL validity — Google Cloud Storage CDN URLs for Estudyme audio and images', () => {
      const p1Path = path.join(PRACTICE_PARTS_DIR, 'part_1_photos/test-1.json');
      const p1Data: EstudymeRawFile = JSON.parse(fs.readFileSync(p1Path, 'utf-8'));

      for (const card of p1Data.cards) {
        expect(card.sound).toBeDefined();
        expect(card.sound!.startsWith('https://storage.googleapis.com/')).toBe(true);
        expect(card.sound!.endsWith('.mp3')).toBe(true);

        expect(card.image).toBeDefined();
        expect(card.image!.startsWith('https://storage.googleapis.com/')).toBe(true);
        const hasValidImgExt = ['.png', '.jpg', '.jpeg'].some((ext) => card.image!.toLowerCase().includes(ext));
        expect(hasValidImgExt).toBe(true);
      }
    });

    runner.it('EST-10: Media URL validity — Audio URLs parse cleanly with WHATWG URL API', () => {
      const p3Path = path.join(PRACTICE_PARTS_DIR, 'part_3_conversations/test-1.json');
      const p3Data: EstudymeRawFile = JSON.parse(fs.readFileSync(p3Path, 'utf-8'));

      for (const card of p3Data.cards) {
        if (card.sound) {
          const parsed = new URL(card.sound);
          expect(parsed.protocol).toBe('https:');
          expect(parsed.hostname).toBe('storage.googleapis.com');
          expect(parsed.pathname.endsWith('.mp3')).toBe(true);
        }
      }
    });

    runner.it('EST-11: HTML formatting in passages and Vietnamese explanations is preserved for rich rendering', () => {
      const p7Path = path.join(PRACTICE_PARTS_DIR, 'part_7_single_passages/test-1.json');
      const rawData: EstudymeRawFile = JSON.parse(fs.readFileSync(p7Path, 'utf-8'));
      const parentCard = rawData.cards[0];

      expect(parentCard.questionText).toBeDefined();
      expect(parentCard.questionText!.includes('<p>') || parentCard.questionText!.includes('<br')).toBe(true);

      const child = parentCard.childQuestions![0];
      if (child.explanationVi) {
        expect(child.explanationVi.length).toBeGreaterThan(0);
      }
    });

    runner.it('EST-12: Full 200-question Estudyme test adapts to continuous 1-based sequential questions', () => {
      const fullTestPath = path.join(ESTUDYME_FULL_DIR, 'test-1.json');
      const fullData: EstudymeRawFile = JSON.parse(fs.readFileSync(fullTestPath, 'utf-8'));

      // Test 1 contains 200 cards or questions
      const adapted = adaptEstudymeCardsToUnified(fullData.cards, 1, 'full-test-1');
      expect(adapted.length).toBe(200);

      // Verify continuous 1..200 numbering
      for (let i = 0; i < 200; i++) {
        expect(adapted[i].questionNumber).toBe(i + 1);
      }
    });
  });
}

// Standalone runner
if (process.argv[1]?.includes('estudyme-loader.test')) {
  const runner = new TestRunner();
  runEstudymeLoaderTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nEstudyme Loader Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
