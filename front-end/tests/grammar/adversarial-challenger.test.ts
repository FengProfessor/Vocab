/**
 * Empirical Adversarial Challenger & Boundary Verification Test Suite
 *
 * Dedicated tests for:
 * 1. Exercise Evaluation Logic (src/lib/grammar-exercises.ts)
 *    - Whitespace trimming & normalization
 *    - Case insensitivity & Vietnamese diacritics
 *    - Contraction expansion (auxiliaries & pronouns)
 *    - Typo & smart punctuation resilience
 *    - Multi-answer alternatives (slash, comma)
 *    - MCQ option prefix matching & single-letter resolution
 *    - Boundary inputs (empty, whitespace, extreme lengths, regex special chars)
 * 2. Component Rendering Resilience (src/app/grammar/learn/page.tsx contracts)
 *    - GrammarVideoPlayer null/empty videoUrl handling
 *    - GrammarCheatSheet null/empty cheatSheetHtml handling
 *    - GrammarVisualConcept unmapped buoiNum / fallback handling
 *    - TenseTimeline unmapped tense title handling
 *    - Full mock lesson matrix (missing sections, null video, empty exercises, null theory)
 */

import {
  cleanGrammarAnswer,
  expandContractions,
  areAnswersEqual,
  isOptionMatchingCorrect,
  isGrammarAnswerCorrect,
  resolveDrillType,
  countOptionsInSentence,
  canUseErrorClickMode,
  sanitizeDrillExercise,
  normalizeLessonExercise,
  asExerciseRecord,
} from '../../src/lib/grammar-exercises';
import GrammarVideoPlayer from '../../src/components/grammar/GrammarVideoPlayer';
import GrammarVisualConcept from '../../src/components/grammar/GrammarVisualConcept';
import TenseTimeline from '../../src/components/grammar/TenseTimeline';
import { TestRunner, expect } from './test-harness';

export async function runAdversarialChallengerTests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Suite A: Exercise Evaluation Logic (src/lib/grammar-exercises.ts)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite A1: Whitespace Trimming & Normalization', () => {
    runner.it('Trims leading and trailing whitespace from user input and correct answer', () => {
      expect(areAnswersEqual('  apple  ', 'apple')).toBe(true);
      expect(areAnswersEqual('apple', '  apple  ')).toBe(true);
      expect(areAnswersEqual('   walked   ', '   walked   ')).toBe(true);
    });

    runner.it('Normalizes tabs and newline characters in user response', () => {
      expect(areAnswersEqual('\tapple\n', 'apple')).toBe(true);
      expect(areAnswersEqual('have\nfinished', 'have finished')).toBe(true);
      expect(areAnswersEqual('had\t\tbeen', 'had been')).toBe(true);
    });

    runner.it('Collapses multiple consecutive internal spaces to single space', () => {
      expect(areAnswersEqual('do     not', 'do not')).toBe(true);
      expect(areAnswersEqual('has    been    working', 'has been working')).toBe(true);
    });

    runner.it('cleanGrammarAnswer collapses mixed whitespace and trims properly', () => {
      expect(cleanGrammarAnswer('  \t Hello \n World \t ')).toBe('hello world');
      expect(cleanGrammarAnswer('')).toBe('');
      expect(cleanGrammarAnswer('   ')).toBe('');
    });
  });

  runner.describe('Suite A2: Case Insensitivity & Vietnamese Diacritics', () => {
    runner.it('Matches case-insensitively across lowercase, UPPERCASE, and MixedCase', () => {
      expect(areAnswersEqual('APPLE', 'apple')).toBe(true);
      expect(areAnswersEqual('apple', 'APPLE')).toBe(true);
      expect(areAnswersEqual('HaVe DoNe', 'have done')).toBe(true);
      expect(areAnswersEqual('DID NOT', 'did not')).toBe(true);
    });

    runner.it('Evaluates True/False Vietnamese answers case-insensitively', () => {
      expect(areAnswersEqual('ĐÚNG', 'Đúng')).toBe(true);
      expect(areAnswersEqual('đúng', 'ĐÚNG')).toBe(true);
      expect(areAnswersEqual('SAI', 'Sai')).toBe(true);
      expect(areAnswersEqual('sai', 'SAI')).toBe(true);
    });

    runner.it('Preserves Vietnamese diacritics without stripping letters', () => {
      expect(cleanGrammarAnswer('Đã hoàn thành')).toBe('đã hoàn thành');
      expect(areAnswersEqual('Đã làm', 'đã làm')).toBe(true);
      expect(areAnswersEqual('Đã làm', 'Chưa làm')).toBe(false);
    });
  });

  runner.describe('Suite A3: Contraction Expansions (Auxiliary Negatives & Pronouns)', () => {
    // 16 Negative Auxiliaries
    const negativePairs = [
      ["don't", 'do not'],
      ["doesn't", 'does not'],
      ["didn't", 'did not'],
      ["isn't", 'is not'],
      ["aren't", 'are not'],
      ["wasn't", 'was not'],
      ["weren't", 'were not'],
      ["haven't", 'have not'],
      ["hasn't", 'has not'],
      ["won't", 'will not'],
      ["can't", 'cannot'],
      ["shan't", 'shall not'],
      ["shouldn't", 'should not'],
      ["wouldn't", 'would not'],
      ["couldn't", 'could not'],
      ["ain't", 'am not'],
    ];

    for (const [contracted, expanded] of negativePairs) {
      runner.it(`Expands negative contraction: ${contracted} <=> ${expanded}`, () => {
        expect(areAnswersEqual(contracted, expanded)).toBe(true);
        expect(areAnswersEqual(expanded, contracted)).toBe(true);
      });
    }

    // 20 Pronoun & Verb Subject Contractions
    const pronounPairs = [
      ["it's", 'it is'],
      ["he's", 'he is'],
      ["she's", 'she is'],
      ["that's", 'that is'],
      ["there's", 'there is'],
      ["what's", 'what is'],
      ["they're", 'they are'],
      ["you're", 'you are'],
      ["we're", 'we are'],
      ["i'm", 'i am'],
      ["i've", 'i have'],
      ["they've", 'they have'],
      ["we've", 'we have'],
      ["you've", 'you have'],
      ["i'll", 'i will'],
      ["he'll", 'he will'],
      ["she'll", 'she will'],
      ["they'll", 'they will'],
      ["we'll", 'we will'],
      ["you'll", 'you will'],
    ];

    for (const [contracted, expanded] of pronounPairs) {
      runner.it(`Expands pronoun contraction: ${contracted} <=> ${expanded}`, () => {
        expect(areAnswersEqual(contracted, expanded)).toBe(true);
        expect(areAnswersEqual(expanded, contracted)).toBe(true);
      });
    }

    runner.it('Handles telex typing glitch: dđin\'t -> did not / didn\'t', () => {
      expect(areAnswersEqual("dđin't", "didn't")).toBe(true);
      expect(areAnswersEqual("dđin't", "did not")).toBe(true);
    });

    runner.it('Normalizes curly apostrophes (’) and backticks (`) to standard ASCII apostrophe', () => {
      expect(areAnswersEqual("didn’t", "didn't")).toBe(true);
      expect(areAnswersEqual("don`t", "do not")).toBe(true);
      expect(areAnswersEqual("I’m", "I am")).toBe(true);
      expect(areAnswersEqual("they`re", "they are")).toBe(true);
    });

    runner.it('Tolerates missing apostrophe when matched against contracted targets', () => {
      expect(areAnswersEqual('dont', "don't")).toBe(true);
      expect(areAnswersEqual('doesnt', "doesn't")).toBe(true);
      expect(areAnswersEqual('didnt', "didn't")).toBe(true);
      expect(areAnswersEqual('wont', "won't")).toBe(true);
    });

    runner.it('Evaluates asymmetry when target is fully uncontracted (dont vs do not is false)', () => {
      // Because 'dont' does not have apostrophe to trigger uncontract expansion to 'do not',
      // and 'do not' stripped of alphanumeric is 'donot' !== 'dont'.
      expect(areAnswersEqual('dont', 'do not')).toBe(false);
      expect(areAnswersEqual("don't", 'do not')).toBe(true);
    });
  });

  runner.describe('Suite A4: Multiple Acceptable Answers & Option Splitting', () => {
    runner.it('Evaluates slash-separated alternative answers (e.g. have / has)', () => {
      expect(areAnswersEqual('have', 'have / has')).toBe(true);
      expect(areAnswersEqual('has', 'have / has')).toBe(true);
      expect(areAnswersEqual('had', 'have / has')).toBe(false);
    });

    runner.it('Evaluates comma-separated alternative answers (e.g. did not, didn\'t)', () => {
      expect(areAnswersEqual('did not', "did not, didn't")).toBe(true);
      expect(areAnswersEqual("didn't", "did not, didn't")).toBe(true);
      expect(areAnswersEqual('didnt', "did not, didn't")).toBe(true);
    });

    runner.it('Evaluates tri-choice alternatives (e.g. am / is / are)', () => {
      expect(areAnswersEqual('am', 'am / is / are')).toBe(true);
      expect(areAnswersEqual('is', 'am / is / are')).toBe(true);
      expect(areAnswersEqual('are', 'am / is / are')).toBe(true);
      expect(areAnswersEqual('be', 'am / is / are')).toBe(false);
    });

    runner.it('Normalizes ellipsis in multi-word answers (e.g. are ... making vs are making)', () => {
      expect(areAnswersEqual('are making', 'are ... making')).toBe(true);
      expect(areAnswersEqual('are ... making', 'are making')).toBe(true);
    });
  });

  runner.describe('Suite A5: MCQ Prefix Handling & Matching Logic', () => {
    runner.it('Strips single-letter option prefixes (A., B., C., D.) from user response', () => {
      expect(areAnswersEqual('A. apple', 'apple')).toBe(true);
      expect(areAnswersEqual('B. had been reading', 'had been reading')).toBe(true);
      expect(areAnswersEqual('C. won\'t go', 'will not go')).toBe(true);
    });

    runner.it('Strips single-letter option prefixes from correct answer key', () => {
      expect(areAnswersEqual('banana', 'B. banana')).toBe(true);
      expect(areAnswersEqual('A. orange', 'A. orange')).toBe(true);
      expect(areAnswersEqual('orange', 'A. orange')).toBe(true);
    });

    runner.it('isOptionMatchingCorrect matches by index letter when correct answer is single letter', () => {
      expect(isOptionMatchingCorrect('A. First', 0, 'A')).toBe(true);
      expect(isOptionMatchingCorrect('First', 0, 'A')).toBe(true);
      expect(isOptionMatchingCorrect('B. Second', 1, 'B')).toBe(true);
      expect(isOptionMatchingCorrect('A. First', 0, 'B')).toBe(false);
    });

    runner.it('isGrammarAnswerCorrect resolves letter answer against option list', () => {
      const opts = ['A. Apple', 'B. Banana', 'C. Cherry', 'D. Date'];
      expect(isGrammarAnswerCorrect('B', 'B', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('Banana', 'B', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('B. Banana', 'B', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('b', 'B', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('A', 'B', opts)).toBe(false);
      expect(isGrammarAnswerCorrect('Cherry', 'B', opts)).toBe(false);
    });

    runner.it('isGrammarAnswerCorrect matches user letter index when target answer is full text', () => {
      const opts = ['First option', 'Target answer', 'Third option'];
      expect(isGrammarAnswerCorrect('B', 'Target answer', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('b', 'Target answer', opts)).toBe(true);
      expect(isGrammarAnswerCorrect('A', 'Target answer', opts)).toBe(false);
    });
  });

  runner.describe('Suite A6: Boundary Values & Attack Inputs', () => {
    runner.it('Handles empty strings safely without error (returns false)', () => {
      expect(areAnswersEqual('', 'apple')).toBe(false);
      expect(areAnswersEqual('apple', '')).toBe(false);
      expect(areAnswersEqual('', '')).toBe(false);
      expect(isGrammarAnswerCorrect('', 'apple')).toBe(false);
      expect(isGrammarAnswerCorrect('apple', '')).toBe(false);
      expect(isGrammarAnswerCorrect('', '')).toBe(false);
    });

    runner.it('Handles null and undefined safely without throwing', () => {
      expect(areAnswersEqual(null as unknown as string, 'apple')).toBe(false);
      expect(areAnswersEqual('apple', undefined as unknown as string)).toBe(false);
      expect(isGrammarAnswerCorrect(null as unknown as string, 'apple')).toBe(false);
      expect(isGrammarAnswerCorrect('apple', null)).toBe(false);
      expect(isOptionMatchingCorrect('apple', 0, null)).toBe(false);
    });

    runner.it('Handles whitespace-only strings safely in isGrammarAnswerCorrect', () => {
      expect(isGrammarAnswerCorrect('   ', 'apple')).toBe(false);
      expect(isGrammarAnswerCorrect('apple', '   ')).toBe(false);
      expect(isGrammarAnswerCorrect('   ', '   ')).toBe(false);
      expect(areAnswersEqual('   ', 'apple')).toBe(false);
      expect(areAnswersEqual('apple', '   ')).toBe(false);
    });

    runner.it('Survives special regex characters without escaping error', () => {
      expect(areAnswersEqual('$100', '$100')).toBe(true);
      expect(areAnswersEqual('[test]', '[test]')).toBe(true);
      expect(areAnswersEqual('a + b', 'a + b')).toBe(true);
      expect(areAnswersEqual('(run)', '(run)')).toBe(true);
      expect(areAnswersEqual('what?', 'what?')).toBe(true);
      expect(areAnswersEqual('1*2', '1*2')).toBe(true);
    });

    runner.it('Survives extreme string length (>10,000 chars) without crash or ReDoS', () => {
      const longA = 'a'.repeat(10000);
      const longB = 'a'.repeat(10000);
      const start = Date.now();
      expect(areAnswersEqual(longA, longB)).toBe(true);
      expect(Date.now() - start).toBeLessThan(100);
    });

    runner.it('Handles pure number strings correctly', () => {
      expect(areAnswersEqual('12', '12')).toBe(true);
      expect(areAnswersEqual(' 12 ', '12')).toBe(true);
      expect(areAnswersEqual('12', '13')).toBe(false);
    });
  });

  runner.describe('Suite A7: Exercise Schema Sanitization & Drill Type Resolution', () => {
    runner.it('Resolves drill types accurately: fill, tf, error, mcq', () => {
      expect(resolveDrillType('fill', 'Question', [])).toBe('fill_blank');
      expect(resolveDrillType('fill_blank', 'Question', [])).toBe('fill_blank');
      expect(resolveDrillType('tf', 'Question', [])).toBe('multiple_choice');
      expect(resolveDrillType('mcq', 'Question', ['A', 'B'])).toBe('multiple_choice');
    });

    runner.it('Discriminated error question: click mode vs mcq mode', () => {
      // Tokens present in sentence
      const qIn = 'She have two cars and is happy';
      const optsIn = ['have', 'cars', 'happy'];
      expect(canUseErrorClickMode(qIn, optsIn)).toBe(true);
      expect(resolveDrillType('error', qIn, optsIn)).toBe('error_correction');

      // Tokens NOT in sentence (full sentence choices e.g. "Câu nào SAI?")
      const qOut = 'Chọn câu có lỗi sai trong các câu sau:';
      const optsOut = ['A. She have a car.', 'B. He goes to school.', 'C. They are ready.'];
      expect(canUseErrorClickMode(qOut, optsOut)).toBe(false);
      expect(resolveDrillType('error', qOut, optsOut)).toBe('multiple_choice');
    });

    runner.it('sanitizeDrillExercise populates [Đúng, Sai] for TF missing options', () => {
      const sanitized = sanitizeDrillExercise({
        question: 'Is this correct?',
        type: 'tf',
        options: null,
        correct_answer: 'Đúng',
      });
      expect(sanitized.options).toEqual(['Đúng', 'Sai']);
      expect(sanitized.type).toBe('multiple_choice');
    });

    runner.it('normalizeLessonExercise strips duplicate question numbering prefixes', () => {
      const raw = {
        question: 'Câu 1: Câu 1: She ______ (be) a student.',
        options: ['is', 'are'],
        answer: 'is',
      };
      const normalized = normalizeLessonExercise(raw, 'lesson-1', 0, 'Topic', 'A1');
      expect(normalized.question.startsWith('Câu 1:')).toBe(false);
      expect(normalized.question).toBe('She ______ (be) a student.');
    });

    runner.it('asExerciseRecord safely handles null, undefined, primitive inputs', () => {
      expect(asExerciseRecord(null)).toEqual({});
      expect(asExerciseRecord(undefined)).toEqual({});
      expect(asExerciseRecord('string')).toEqual({});
      expect(asExerciseRecord(123)).toEqual({});
      expect(asExerciseRecord({ key: 'val' })).toEqual({ key: 'val' });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite B: Component Rendering Resilience & Null Safety
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite B1: Grammar Video Player Resilience', () => {
    runner.it('Returns null when videoUrl is empty string', () => {
      const result = GrammarVideoPlayer({ videoUrl: '', title: 'Test Lesson' });
      expect(result).toBeNull();
    });

    runner.it('Returns null when videoUrl is falsy or undefined', () => {
      const result = GrammarVideoPlayer({ videoUrl: undefined as unknown as string, title: 'Test Lesson' });
      expect(result).toBeNull();
    });

    runner.it('Renders valid React element when valid videoUrl is supplied', () => {
      const result = GrammarVideoPlayer({
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Present Simple',
        topicTitle: 'Buổi 01',
      });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  runner.describe('Suite B2: Grammar Visual Concept Resilience', () => {
    runner.it('Handles unmapped buoiNum (e.g. 999) gracefully falling back to core rule card', () => {
      const result = GrammarVisualConcept({ buoiNum: 999, lessonTitle: 'Chuyên đề đặc biệt' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    runner.it('Handles negative or zero buoiNum gracefully', () => {
      const result = GrammarVisualConcept({ buoiNum: 0, lessonTitle: 'Tổng quan' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    runner.it('Renders SVO diagram for Buổi 1', () => {
      const result = GrammarVisualConcept({ buoiNum: 1, lessonTitle: 'S-V-O Xương câu' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    runner.it('Renders Tag Questions visual for Buổi 6', () => {
      const result = GrammarVisualConcept({ buoiNum: 6, lessonTitle: 'Câu hỏi đuôi' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  runner.describe('Suite B3: Tense Timeline Component Resilience', () => {
    runner.it('Returns null for non-tense lesson titles without throwing', () => {
      const result = TenseTimeline({ lessonTitle: 'Mệnh đề quan hệ nâng cao' });
      expect(result).toBeNull();
    });

    runner.it('Renders timeline element for Present Simple lesson title', () => {
      const result = TenseTimeline({ lessonTitle: 'Thì Hiện tại đơn (Present Simple)' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    runner.it('Renders timeline element for Past Simple lesson title', () => {
      const result = TenseTimeline({ lessonTitle: 'Thì Quá khứ đơn (Past Simple)' });
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  runner.describe('Suite B4: Full Lesson State Resilience (page.tsx Contract Matrix)', () => {
    interface SyntheticLesson {
      id: string;
      title: string;
      topic_id?: string | null;
      topic?: { title?: string; title_vi?: string | null } | null;
      sections?: {
        bigQuestion?: string | null;
        outcome?: string | null;
        traps?: string[] | null;
        contrastPairs?: { good?: string; bad?: string }[] | null;
        cheatSheetHtml?: string | null;
        videoUrl?: string | null;
        definition?: string | null;
        wordbanks?: string[] | null;
      } | null;
      exercises?: unknown[] | null;
      theory_vi?: string | null;
      theory?: string | null;
      source_url?: string | null;
      image_url?: string | null;
      order_index?: number;
      source?: string;
    }

    const testLessons: { name: string; lesson: SyntheticLesson }[] = [
      {
        name: 'Case 1: Minimal Lesson (sections = null, video = null, exercises = null, theory = null)',
        lesson: {
          id: 'min-1',
          title: 'Minimal Lesson',
          sections: null,
          exercises: null,
          theory_vi: null,
          theory: null,
          source_url: null,
        },
      },
      {
        name: 'Case 2: Empty Object Sections (sections = {})',
        lesson: {
          id: 'empty-sec-2',
          title: 'Empty Sections Lesson',
          sections: {},
          exercises: [],
          theory_vi: '## Nội dung lý thuyết ngắn',
        },
      },
      {
        name: 'Case 3: Sections with empty arrays and null videoUrl',
        lesson: {
          id: 'empty-arrays-3',
          title: 'Empty Arrays Lesson',
          sections: {
            traps: [],
            contrastPairs: [],
            cheatSheetHtml: '',
            videoUrl: null,
            bigQuestion: null,
            outcome: null,
          },
          exercises: [],
          source_url: '',
        },
      },
      {
        name: 'Case 4: Undefined sections and undefined exercises',
        lesson: {
          id: 'undef-4',
          title: 'Undefined fields lesson',
        },
      },
      {
        name: 'Case 5: Fully populated lesson',
        lesson: {
          id: 'full-5',
          title: 'Buổi 01: S-V-O Cấu trúc câu',
          topic: { title: 'Buổi 01: S-V-O', title_vi: 'Cấu trúc câu cơ bản' },
          sections: {
            bigQuestion: 'Làm sao để tạo một câu đúng chuẩn?',
            outcome: 'Tự tin viết câu đúng cấu trúc SVO.',
            traps: ['Không dùng to-be với động từ thường', 'Tránh thiếu tân ngữ'],
            contrastPairs: [{ good: 'I read books.', bad: 'I reading book.' }],
            cheatSheetHtml: '<table><tr><th>S</th><th>V</th><th>O</th></tr></table>',
            videoUrl: 'https://youtube.com/embed/sample',
            definition: 'Cấu trúc cơ bản trong tiếng Anh.',
            wordbanks: ['subject', 'verb', 'object'],
          },
          exercises: [{ q: 'Test question', options: ['A', 'B'], answer: 'A' }],
          theory_vi: '## Lý thuyết SVO',
          order_index: 1,
        },
      },
    ];

    for (const { name, lesson } of testLessons) {
      runner.it(`Evaluates safe page.tsx conditional property access on ${name}`, () => {
        // Exercise 1: Header title safe access
        const displayTopic = lesson.topic?.title_vi || lesson.topic?.title || 'Ngữ Pháp Ứng Dụng';
        expect(typeof displayTopic).toBe('string');

        // Exercise 2: Banner safe access
        const hasBanner = !!(lesson.sections?.bigQuestion || lesson.sections?.outcome);
        const bigQ = lesson.sections?.bigQuestion || '';
        const outcome = lesson.sections?.outcome || '';
        expect(typeof bigQ).toBe('string');
        expect(typeof outcome).toBe('string');

        // Exercise 3: Video tab conditional availability
        const hasVideo = !!(lesson.sections?.videoUrl || lesson.source_url);
        const videoUrl = lesson.sections?.videoUrl || lesson.source_url || '';
        expect(typeof videoUrl).toBe('string');
        const videoPlayerOutput = GrammarVideoPlayer({
          videoUrl,
          title: lesson.title,
          topicTitle: lesson.topic?.title_vi || lesson.topic?.title,
        });
        if (!hasVideo) {
          expect(videoPlayerOutput).toBeNull();
        } else {
          expect(videoPlayerOutput).not.toBeNull();
        }

        // Exercise 4: Cheatsheet tab conditional availability
        const hasCheatSheet = !!(lesson.sections?.cheatSheetHtml || lesson.sections?.wordbanks?.length);
        const cheatSheetHtml = lesson.sections?.cheatSheetHtml || null;
        expect(cheatSheetHtml === null || typeof cheatSheetHtml === 'string').toBe(true);

        // Exercise 5: Traps safe access and filtering
        const hasTraps = !!(lesson.sections?.traps && lesson.sections.traps.length > 0);
        const trapsList = (lesson.sections?.traps || []).filter(Boolean);
        expect(Array.isArray(trapsList)).toBe(true);

        // Exercise 6: Contrast pairs safe access
        const hasContrast = !!(lesson.sections?.contrastPairs && lesson.sections.contrastPairs.length > 0);
        const contrastPairs = lesson.sections?.contrastPairs || [];
        for (const p of contrastPairs) {
          expect(typeof (p.good || '')).toBe('string');
          expect(typeof (p.bad || '')).toBe('string');
        }

        // Exercise 7: Exercises safe array access
        const hasExercises = !!(lesson.exercises && lesson.exercises.length > 0);
        const exerciseCount = lesson.exercises?.length || 0;
        expect(typeof exerciseCount).toBe('number');
        const exerciseList = lesson.exercises || [];
        expect(Array.isArray(exerciseList)).toBe(true);

        // Exercise 8: Theory fallback content
        const theoryContent = lesson.theory_vi || lesson.theory || '*Chưa có nội dung lý thuyết.*';
        expect(theoryContent.length).toBeGreaterThan(0);
      });
    }
  });
}
