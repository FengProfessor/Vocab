/**
 * Tier 3: Cross-Feature Combinations Test Suite for English Grammar Experience.
 * Verifies multi-feature interactions, composite workflows, and responsive math:
 * - Feature 3.1: Markdown Tables Containing Formulas & Rich Formatting
 * - Feature 3.2: Heterogeneous Quiz Sessions (MCQ + Cloze + Error Correction)
 * - Feature 3.3: Split-View Layout Calculations & Responsive Pane Collapsing
 */

import {
  TestRunner,
  expect,
  parseMarkdownTable,
  tokenizeFormula,
} from './test-harness';
import {
  isGrammarAnswerCorrect,
  isOptionMatchingCorrect,
  normalizeLessonExercise,
  sanitizeDrillExercise,
  canUseErrorClickMode,
  resolveDrillType,
  countOptionsInSentence,
} from '../../src/lib/grammar-exercises';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3.1: Markdown Tables Containing Formulas & Rich Formatting
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 3.1: Markdown Tables Containing Formulas & Rich Formatting', () => {
    runner.it('T3.1.1: Parses table where cells contain inline formula expressions and bold text', () => {
      const complexTableMd = `
| Loại câu | Cấu trúc công thức | Lưu ý trọng tâm |
|---|---|---|
| Khẳng định | **S + V(s/es) + O** | Chủ ngữ số ít thêm -s/es |
| Phủ định | **S + do/does + not + V-inf** | Trợ động từ mượn do/does |
| Nghi vấn | **Do/Does + S + V-inf?** | Đảo trợ động từ lên trước chủ ngữ |
`;
      const parsed = parseMarkdownTable(complexTableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.rows.length).toBe(3);

      // Verify each cell contains both bold markdown and formula operators
      for (const row of parsed!.rows) {
        expect(row[1]).toContain('+');
        const formulaTokens = tokenizeFormula(row[1].replace(/\*\*/g, ''));
        expect(formulaTokens.length).toBe(1);
        expect(formulaTokens[0].items.length).toBeGreaterThanOrEqual(2);
      }
    });

    runner.it('T3.1.2: Parses table with choice stacks {was|were} in formula cells', () => {
      const tableWithChoices = `
| Thì | Công thức bị động | Ví dụ |
|---|---|---|
| Hiện tại tiếp diễn | S + {am|is|are} + being + V3/ed | The house is being painted. |
| Quá khứ tiếp diễn | S + {was|were} + being + V3/ed | The cars were being washed. |
`;
      const parsed = parseMarkdownTable(tableWithChoices);
      expect(parsed).not.toBeNull();
      expect(parsed!.rows.length).toBe(2);

      const row1Formula = parsed!.rows[0][1];
      const parsedFormula = tokenizeFormula(row1Formula);
      expect(parsedFormula[0].items[1].isStack).toBe(true);
      expect(parsedFormula[0].items[1].tokens).toEqual(['am', 'is', 'are']);
    });

    runner.it('T3.1.3: Handles cheatsheet comparison table with bilingual annotations', () => {
      const cheatsheetMd = `
| Đặc điểm | Thì Quá khứ đơn (Past Simple) | Thì Hiện tại hoàn thành (Present Perfect) |
|---|---|---|
| **Thời điểm** | Thời gian **xác định** trong quá khứ | Thời gian **không xác định** hoặc còn tiếp diễn |
| **Công thức** | \`S + V2/ed\` | \`S + have/has + V3/ed\` |
| **Từ nhận biết** | yesterday, ago, in 1999, last week | already, yet, just, ever, since, for |
`;
      const parsed = parseMarkdownTable(cheatsheetMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.headers).toEqual([
        'Đặc điểm',
        'Thì Quá khứ đơn (Past Simple)',
        'Thì Hiện tại hoàn thành (Present Perfect)',
      ]);
      expect(parsed!.rows[1][1]).toBe('`S + V2/ed`');
      expect(parsed!.rows[1][2]).toBe('`S + have/has + V3/ed`');
    });

    runner.it('T3.1.4: Extracts and tokenizes formulas embedded inside table rows safely', () => {
      const tableMd = `
| Mẫu câu | Công thức |
|---|---|
| Câu điều kiện loại 1 | If + S + V(hiện tại), S + will + V-inf |
| Câu điều kiện loại 2 | If + S + V2/were, S + would + V-inf |
`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      const type1 = parsed!.rows[0][1];
      expect(type1).toContain('If + S + V(hiện tại)');
      const parts = type1.split(',');
      expect(parts.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3.2: Heterogeneous Quiz Sessions (MCQ + Cloze + Error Correction)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 3.2: Heterogeneous Quiz Sessions (MCQ + Cloze + Error Correction)', () => {
    runner.it('T3.2.1: Resolves and discriminates drill exercise types (MCQ, Fill, Error click)', () => {
      // 1. MCQ
      const mcq = resolveDrillType('mcq', 'Choose the correct word: She _____ to school.', ['goes', 'go', 'going', 'gone']);
      expect(mcq).toBe('multiple_choice');

      // 2. Fill blank
      const fill = resolveDrillType('fill', 'I have lived here _____ (since/for) 2015.', []);
      expect(fill).toBe('fill_blank');

      // 3. Error correction - tokens in sentence -> error_correction
      const errorClick = resolveDrillType(
        'error',
        'She don\'t like eating fish because it smells bad.',
        ['don\'t', 'eating', 'because', 'smells'],
      );
      expect(errorClick).toBe('error_correction');

      // 4. Error correction - full sentence options -> multiple_choice
      const errorMcq = resolveDrillType(
        'error',
        'Which sentence contains a grammar error?',
        [
          'A. She plays the piano every Sunday.',
          'B. They was walking in the park yesterday.',
          'C. We have finished our homework.',
          'D. He will call you later.',
        ],
      );
      expect(errorMcq).toBe('multiple_choice');
    });

    runner.it('T3.2.2: True/False questions without options automatically normalize to [Đúng, Sai]', () => {
      const rawTf = {
        question: 'Thì hiện tại đơn diễn tả một chân lý hoặc sự thật hiển nhiên.',
        correct_answer: 'Đúng',
        type: 'tf',
        options: null,
      };
      const sanitized = sanitizeDrillExercise(rawTf);
      expect(sanitized.options).toEqual(['Đúng', 'Sai']);
      expect(sanitized.type).toBe('multiple_choice');
    });

    runner.it('T3.2.3: Detects token hit count accurately for error click mode', () => {
      const question = 'The students is studying hard for their upcoming examination.';
      const options1 = ['students', 'is', 'studying', 'upcoming'];
      expect(countOptionsInSentence(question, options1)).toBe(4);
      expect(canUseErrorClickMode(question, options1)).toBe(true);

      const options2 = ['Sentence A is wrong', 'Sentence B is wrong', 'Sentence C is wrong'];
      expect(countOptionsInSentence(question, options2)).toBe(0);
      expect(canUseErrorClickMode(question, options2)).toBe(false);
    });

    runner.it('T3.2.4: Simulates heterogeneous 5-question quiz session with end-to-end score tracking', () => {
      const sessionExercises = [
        {
          id: 'q1',
          type: 'multiple_choice' as const,
          question: 'She _____ (read) a book right now.',
          options: ['is reading', 'reads', 'read', 'was reading'],
          correct_answer: 'is reading',
          userResponse: 'is reading', // Correct
        },
        {
          id: 'q2',
          type: 'multiple_choice' as const,
          question: 'Did you _____ (see) that movie yesterday?',
          options: ['saw', 'see', 'seen', 'seeing'],
          correct_answer: 'B. see',
          userResponse: 'B', // Correct (Letter matching)
        },
        {
          id: 'q3',
          type: 'fill_blank' as const,
          question: 'They _____ (not / know) the answer.',
          options: [],
          correct_answer: "don't know",
          userResponse: 'do not know', // Correct (Contraction expansion)
        },
        {
          id: 'q4',
          type: 'fill_blank' as const,
          question: 'He has worked here _____ 5 years.',
          options: [],
          correct_answer: 'for',
          userResponse: 'since', // Incorrect
        },
        {
          id: 'q5',
          type: 'multiple_choice' as const,
          question: 'Water boils at 100 degrees Celsius.',
          options: ['Đúng', 'Sai'],
          correct_answer: 'Đúng',
          userResponse: 'đúng', // Correct (Vietnamese case insensitive)
        },
      ];

      let score = 0;
      for (const ex of sessionExercises) {
        const isCorrect = isGrammarAnswerCorrect(ex.userResponse, ex.correct_answer, ex.options);
        if (isCorrect) score++;
      }

      // Questions 1, 2, 3, 5 are correct -> 4/5
      expect(score).toBe(4);
      const percentage = Math.round((score / sessionExercises.length) * 100);
      expect(percentage).toBe(80);
    });

    runner.it('T3.2.5: Normalization pipeline handles raw Supabase exercise item cleanly', () => {
      const rawDbExercise = {
        q: 'I _____ (never / be) to London before.',
        opts: ['never be', 'have never been', 'was never', 'had never been'],
        answer: 'have never been',
        fb: 'Diễn tả trải nghiệm cho tới hiện tại dùng hiện tại hoàn thành.',
        type: 'multiple_choice',
      };
      const normalized = normalizeLessonExercise(rawDbExercise, 'lesson-123', 0, 'Thì HTHT', 'intermediate');
      expect(normalized.id).toBe('pre-lesson-123-0');
      expect(normalized.question).toBe('I _____ (never / be) to London before.');
      expect(normalized.options.length).toBe(4);
      expect(normalized.correct_answer).toBe('have never been');
      expect(normalized.explanation).toContain('hiện tại hoàn thành');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3.3: Split-View Layout Calculations & Responsive Pane Collapsing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 3.3: Split-View Layout Calculations & Responsive Pane Collapsing', () => {
    // Pure mathematical functions simulating responsive split-view layout logic
    function calculateSplitViewWidths(
      viewportWidth: number,
      ratio: number = 0.6,
    ): { readerWidthPx: number; quizWidthPx: number; isCollapsedSingleColumn: boolean } {
      if (viewportWidth < 1024) {
        // Under 1024px (tablet & mobile), split view collapses to 100% single column
        return {
          readerWidthPx: viewportWidth,
          quizWidthPx: viewportWidth,
          isCollapsedSingleColumn: true,
        };
      }
      // Desktop split-view (e.g. 60% reader, 40% quiz)
      const readerWidthPx = Math.round(viewportWidth * ratio);
      const quizWidthPx = viewportWidth - readerWidthPx;
      return {
        readerWidthPx,
        quizWidthPx,
        isCollapsedSingleColumn: false,
      };
    }

    runner.it('T3.3.1: Calculates 60/40 desktop split-view proportions on 1440px desktop display', () => {
      const layout = calculateSplitViewWidths(1440, 0.6);
      expect(layout.isCollapsedSingleColumn).toBe(false);
      expect(layout.readerWidthPx).toBe(864);
      expect(layout.quizWidthPx).toBe(576);
      expect(layout.readerWidthPx + layout.quizWidthPx).toBe(1440);
    });

    runner.it('T3.3.2: Collapses to single-column 100% reader mode on 768px tablet display', () => {
      const tabletLayout = calculateSplitViewWidths(768, 0.6);
      expect(tabletLayout.isCollapsedSingleColumn).toBe(true);
      expect(tabletLayout.readerWidthPx).toBe(768);
      expect(tabletLayout.quizWidthPx).toBe(768);
    });

    runner.it('T3.3.3: Collapses to single-column 100% mode on 375px mobile display', () => {
      const mobileLayout = calculateSplitViewWidths(375, 0.6);
      expect(mobileLayout.isCollapsedSingleColumn).toBe(true);
      expect(mobileLayout.readerWidthPx).toBe(375);
      expect(mobileLayout.quizWidthPx).toBe(375);
    });

    runner.it('T3.3.4: Reader pane width is never constrained below minimum readable width (320px)', () => {
      const viewports = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
      for (const vw of viewports) {
        const layout = calculateSplitViewWidths(vw, 0.6);
        expect(layout.readerWidthPx).toBeGreaterThanOrEqual(320);
      }
    });
  });
}
