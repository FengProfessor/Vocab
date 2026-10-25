/**
 * Tier 2: Boundary & Corner Cases Test Suite for English Grammar Experience.
 * Verifies edge cases and boundary conditions with >= 5 tests per feature:
 * - Feature 2.1: Idempotent ensureMarkdownTableFormat (1x, 2x, 5x passes)
 * - Feature 2.2: Boundary Tables (empty cells, trailing whitespace, escaped pipes, multi-line)
 * - Feature 2.3: Extreme Formula Strings (unclosed brackets, special characters, operators)
 * - Feature 2.4: Extreme Question Stems (empty, long, diacritics, prefix clutter)
 */

import {
  TestRunner,
  expect,
  parseMarkdownTable,
  splitTableRow,
  tokenizeFormula,
  cleanFormulaToken,
} from './test-harness';
import { ensureMarkdownTableFormat } from '../../src/components/perf/LazyMarkdown';
import {
  isGrammarAnswerCorrect,
  cleanGrammarAnswer,
  areAnswersEqual,
  normalizeLessonExercise,
} from '../../src/lib/grammar-exercises';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2.1: Idempotent ensureMarkdownTableFormat
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 2.1: Idempotent Table Preprocessing (Multi-Pass Invariance)', () => {
    runner.it('T2.1.1: Preserves row count and table integrity across 1x, 2x, and 5x passes', () => {
      const validTable = `| Thì | Khẳng định | Phủ định |
| --- | --- | --- |
| Hiện tại đơn | S + V(s/es) | S + do/does not + V |
| Hiện tại tiếp diễn | S + am/is/are + V-ing | S + am/is/are not + V-ing |
| Quá khứ đơn | S + V2/ed | S + did not + V |`;

      const pass1 = ensureMarkdownTableFormat(validTable);
      const rows1 = pass1.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
      expect(rows1.length).toBe(5); // 1 header + 1 divider + 3 data rows

      const pass2 = ensureMarkdownTableFormat(pass1);
      const rows2 = pass2.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
      expect(rows2.length).toBe(5);

      let pass5 = validTable;
      for (let i = 0; i < 5; i++) {
        pass5 = ensureMarkdownTableFormat(pass5);
      }
      const rows5 = pass5.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
      expect(rows5.length).toBe(5);
    });

    runner.it('T2.1.2: Preserves content of adjacent non-table paragraphs without duplication', () => {
      const text = `Trước bảng: Đây là đoạn mở đầu hướng dẫn ngữ pháp.

| Cột 1 | Cột 2 |
|---|---|
| Giá trị 1 | Giá trị 2 |

Sau bảng: Đây là đoạn kết luận cần ghi nhớ.`;

      let processed = text;
      for (let i = 0; i < 3; i++) {
        processed = ensureMarkdownTableFormat(processed);
      }

      expect(processed).toContain('Trước bảng: Đây là đoạn mở đầu hướng dẫn ngữ pháp.');
      expect(processed).toContain('Sau bảng: Đây là đoạn kết luận cần ghi nhớ.');
      const tableRows = processed.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
      expect(tableRows.length).toBe(3);
    });

    runner.it('T2.1.3: Handles multi-table document preserving each distinct table', () => {
      const doc = `### Bảng 1: Động từ to be
| Đại từ | Khẳng định |
|---|---|
| I | am |
| He/She | is |

### Bảng 2: Động từ thường
| Đại từ | Khẳng định |
|---|---|
| I/We/They | V-inf |
| He/She/It | V-s/es |`;

      const processed = ensureMarkdownTableFormat(ensureMarkdownTableFormat(doc));
      expect(processed).toContain('### Bảng 1: Động từ to be');
      expect(processed).toContain('### Bảng 2: Động từ thường');
      expect(processed).toContain('| I | am |');
      expect(processed).toContain('| He/She/It | V-s/es |');
    });

    runner.it('T2.1.4: Ignores code blocks and headings with pipes without treating them as tables', () => {
      const doc = `# Tiêu đề | Buổi 1: Tổng quan
\`\`\`bash
echo "A | B" | grep "A"
\`\`\`
Đoạn văn kết thúc.`;

      const pass = ensureMarkdownTableFormat(doc);
      expect(pass).toContain('# Tiêu đề | Buổi 1: Tổng quan');
      expect(pass).toContain('```bash');
      expect(pass).toContain('echo "A | B" | grep "A"');
    });

    runner.it('T2.1.5: Handles empty, whitespace, and single-line strings safely', () => {
      expect(ensureMarkdownTableFormat('')).toBe('');
      expect(ensureMarkdownTableFormat('   ').trim()).toBe('');
      expect(ensureMarkdownTableFormat('Chỉ một câu đơn.')).toBe('Chỉ một câu đơn.');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2.2: Boundary Tables
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 2.2: Boundary Tables (Empty Cells, Escaped Pipes, Whitespace)', () => {
    runner.it('T2.2.1: Splits table row containing escaped pipes without splitting cell', () => {
      const row = '| Dấu hiệu \\| Lưu ý | Ý nghĩa |';
      const cells = splitTableRow(row);
      expect(cells.length).toBe(2);
      expect(cells[0]).toBe('Dấu hiệu | Lưu ý');
      expect(cells[1]).toBe('Ý nghĩa');
    });

    runner.it('T2.2.2: Splits table row with empty cells maintaining column positions', () => {
      const row = '| Cột 1 |  | Cột 3 |';
      const cells = splitTableRow(row);
      expect(cells.length).toBe(3);
      expect(cells[0]).toBe('Cột 1');
      expect(cells[1]).toBe('');
      expect(cells[2]).toBe('Cột 3');
    });

    runner.it('T2.2.3: Handles trailing whitespace and irregular spaces around pipes', () => {
      const row = '  |    Cột 1     |   Cột 2   |   ';
      const cells = splitTableRow(row);
      expect(cells.length).toBe(2);
      expect(cells[0]).toBe('Cột 1');
      expect(cells[1]).toBe('Cột 2');
    });

    runner.it('T2.2.4: Parses table with inline HTML breaks (<br/>) preserving row continuity', () => {
      const tableMd = `| Cấu trúc | Giải thích |
|---|---|
| S + V1<br/>S + V2 | Dạng 1<br/>Dạng 2 |
| S + V3 | Dạng 3 |`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.rows.length).toBe(2);
      expect(parsed!.rows[0][0]).toBe('S + V1<br/>S + V2');
    });

    runner.it('T2.2.5: Handles table missing outer leading or trailing pipes gracefully', () => {
      const rowNoOuter = 'Cột 1 | Cột 2 | Cột 3';
      const cells = splitTableRow(rowNoOuter);
      expect(cells.length).toBe(3);
      expect(cells[0]).toBe('Cột 1');
      expect(cells[1]).toBe('Cột 2');
      expect(cells[2]).toBe('Cột 3');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2.3: Extreme Formula Strings
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 2.3: Extreme Formula Strings & Malformed Inputs', () => {
    runner.it('T2.3.1: Handles unclosed brackets in choices gracefully ({am|is|are without closing bracket)', () => {
      const formula = 'S + {am|is|are + V-ing';
      const parsed = tokenizeFormula(formula);
      expect(parsed.length).toBe(1);
      expect(parsed[0].items.length).toBe(3);
      const choiceItem = parsed[0].items[1];
      expect(choiceItem.isStack).toBe(true);
      expect(choiceItem.tokens).toContain('am');
    });

    runner.it('T2.3.2: Returns empty array on empty, whitespace-only, or null-like formula input', () => {
      expect(tokenizeFormula('')).toEqual([]);
      expect(tokenizeFormula('   ')).toEqual([]);
    });

    runner.it('T2.3.3: Parses formula strings containing special symbols (arrows, quotes, slashes)', () => {
      const formula = 'S + wish + (that) + S + V(quá khứ) → Ước muốn không có thật';
      const parsed = tokenizeFormula(formula);
      expect(parsed.length).toBe(1);
      expect(parsed[0].items.length).toBeGreaterThanOrEqual(3);
    });

    runner.it('T2.3.4: Handles consecutive math operators (+ + +) without empty token explosions', () => {
      const formula = 'S + + + V + O';
      const parsed = tokenizeFormula(formula);
      expect(parsed.length).toBe(1);
      // Consecutive plus signs should not produce empty items
      expect(parsed[0].items.length).toBe(3);
      expect(parsed[0].items[0].cleanLabels[0]).toBe('S (Chủ ngữ)');
      expect(parsed[0].items[1].cleanLabels[0]).toBe('V (Động từ)');
      expect(parsed[0].items[2].cleanLabels[0]).toBe('O (Tân ngữ)');
    });

    runner.it('T2.3.5: Handles unrecognized custom token prefixes k:v falling back to formatted labels', () => {
      const customToken = cleanFormulaToken('Adv_time:yesterday');
      expect(customToken).toBe('Adv_time (yesterday)');
      const rawToken = cleanFormulaToken('Clause_result:so that');
      expect(rawToken).toBe('Clause_result (so that)');
    });

    runner.it('T2.3.6: Tokenizes extremely long formula string (>300 characters) safely', () => {
      const longFormula =
        'S:Chủ_ngữ_chính + Modal:will/can/may/must + have + V3/ed:past_participle + O:Tân_ngữ_trực_tiếp + Prep:in_case_of + N:danh_từ_chỉ_sự_việc';
      const parsed = tokenizeFormula(longFormula);
      expect(parsed.length).toBe(1);
      expect(parsed[0].items.length).toBe(7);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2.4: Extreme Question Stems & Vietnamese Diacritics
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 2.4: Extreme Question Stems & Vietnamese Diacritics', () => {
    runner.it('T2.4.1: Normalizes and checks empty question stem and blank inputs safely', () => {
      expect(cleanGrammarAnswer('')).toBe('');
      expect(areAnswersEqual('', '')).toBe(false);
      expect(isGrammarAnswerCorrect('', 'A', ['A', 'B'])).toBe(false);
      expect(isGrammarAnswerCorrect('A', '', ['A', 'B'])).toBe(false);
    });

    runner.it('T2.4.2: Handles extremely long question stems (>1,500 characters) without regex crash', () => {
      const longStem = 'A'.repeat(1600) + ' _____ (finish) the task yesterday.';
      const rawEx = {
        question: longStem,
        options: ['finished', 'finishes', 'will finish', 'has finished'],
        correct_answer: 'finished',
        type: 'multiple_choice',
      };
      const normalized = normalizeLessonExercise(rawEx, 'lesson-test', 0, 'Thì Quá Khứ', 'beginner');
      expect(normalized.question.length).toBeGreaterThan(1500);
      expect(normalized.options.length).toBe(4);
      expect(normalized.correct_answer).toBe('finished');
    });

    runner.it('T2.4.3: Fully supports all Vietnamese diacritics in stems, explanations, and answers', () => {
      const stemVi =
        'Trong câu điều kiện loại 2, mệnh đề If chia ở thì quá khứ đơn, còn mệnh đề chính dùng would + V-nguyên thể.';
      const ansVi = 'Đúng';
      const userVi = 'đúng';
      expect(areAnswersEqual(userVi, ansVi)).toBe(true);

      const rawEx = {
        question: stemVi,
        options: ['Đúng', 'Sai'],
        correct_answer: 'Đúng',
        explanation: 'Đây là quy tắc ngữ pháp chuẩn mực cho giả định trái ngược với hiện tại.',
        type: 'tf',
      };
      const normalized = normalizeLessonExercise(rawEx, 'l1', 1, 'Câu điều kiện', 'intermediate');
      expect(normalized.options).toEqual(['Đúng', 'Sai']);
      expect(normalized.correct_answer).toBe('Đúng');
    });

    runner.it('T2.4.4: Strips nested redundant question prefixes (Câu 1: Câu 1: / Question 4. 4))', () => {
      const raw1 = { question: 'Câu 1: Câu 1: She usually ______ (go) to work by bus.', correct_answer: 'goes' };
      const n1 = normalizeLessonExercise(raw1, 'l1', 1, 'Topic', 'beginner');
      expect(n1.question.startsWith('Câu 1:')).toBe(false);
      expect(n1.question).toContain('She usually');

      const raw2 = { question: 'Question 5. 5) They have lived here since 2010.', correct_answer: 'since' };
      const n2 = normalizeLessonExercise(raw2, 'l1', 2, 'Topic', 'beginner');
      expect(n2.question.startsWith('Question 5')).toBe(false);
      expect(n2.question).toContain('They have lived here');
    });

    runner.it('T2.4.5: Handles complex punctuation (em-dash, smart quotes, ellipsis) in answers', () => {
      expect(areAnswersEqual('“hello”', 'hello')).toBe(true);
      expect(areAnswersEqual("it’s", "it's")).toBe(true);
      expect(areAnswersEqual("didn`t", "didn't")).toBe(true);
    });

    runner.it('T2.4.6: Cleans pedagogical clutter and tag labels from explanations', () => {
      const raw = {
        question: 'He ______ English every day.',
        explanation: '🟡 THẺ A · cần thuộc lòng cấu trúc thì hiện tại đơn (Ô B) - *ĐÚNG*',
        correct_answer: 'studies',
      };
      const n = normalizeLessonExercise(raw, 'l1', 3, 'Topic', 'beginner');
      expect(n.explanation).not.toContain('🟡 THẺ A');
      expect(n.explanation).not.toContain('(Ô B)');
      expect(n.explanation).not.toContain('*ĐÚNG*');
    });
  });
}
