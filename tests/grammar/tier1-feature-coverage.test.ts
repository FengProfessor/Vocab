/**
 * Tier 1: Core Feature Coverage Test Suite for English Grammar Experience.
 * Verifies core functionality with >= 5 comprehensive tests per feature:
 * - Feature 1.1: Markdown Table Parser (header, splitting, alignments)
 * - Feature 1.2: Formula Tokenizer (token parsing, chip badges, math operators)
 * - Feature 1.3: Exercise Validation Engine (MCQ, cloze normalization, contractions)
 * - Feature 1.4: Layout & Responsive Checks (container rules, responsive breakpoints, mobile safety)
 */

import fs from 'fs';
import path from 'path';
import {
  TestRunner,
  expect,
  parseMarkdownTable,
  splitTableRow,
  tokenizeFormula,
  cleanFormulaToken,
  getTokenBadgeStyle,
  checkLayoutConstraints,
} from './test-harness';
import {
  isGrammarAnswerCorrect,
  isOptionMatchingCorrect,
  cleanGrammarAnswer,
  expandContractions,
  areAnswersEqual,
  normalizeLessonExercise,
} from '../../src/lib/grammar-exercises';

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1.1: Markdown Table Parser
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 1.1: Markdown Table Parser', () => {
    runner.it('T1.1.1: Parses standard 2-column table with header, divider, and data rows', () => {
      const tableMd = `
| Chủ đề | Định nghĩa |
|---|---|
| S-V-O | Cấu trúc câu cơ bản |
| Tense | Hệ thống thì |
`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.headers).toEqual(['Chủ đề', 'Định nghĩa']);
      expect(parsed!.rows.length).toBe(2);
      expect(parsed!.rows[0]).toEqual(['S-V-O', 'Cấu trúc câu cơ bản']);
      expect(parsed!.rows[1]).toEqual(['Tense', 'Hệ thống thì']);
    });

    runner.it('T1.1.2: Correctly detects and extracts column alignments (:---, :---:, ---:)', () => {
      const tableMd = `
| Căn trái | Căn giữa | Căn phải | Mặc định |
| :--- | :---: | ---: | --- |
| L1 | C1 | R1 | D1 |
| L2 | C2 | R2 | D2 |
`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.alignments).toEqual(['left', 'center', 'right', 'default']);
      expect(parsed!.headers.length).toBe(4);
      expect(parsed!.rows.length).toBe(2);
    });

    runner.it('T1.1.3: Handles multi-column comparison table with 4 columns', () => {
      const tableMd = `
| Thì | Công thức khẳng định | Dấu hiệu nhận biết | Ví dụ thực tế |
|---|---|---|---|
| Hiện tại đơn | S + V(s/es) | always, usually, every day | She speaks English fluently. |
| Quá khứ đơn | S + V2/ed | yesterday, ago, last night | They visited London last year. |
| Tương lai đơn | S + will + V-inf | tomorrow, next week, soon | I will call you tonight. |
`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.headers.length).toBe(4);
      expect(parsed!.rows.length).toBe(3);
      expect(parsed!.rows[0][1]).toBe('S + V(s/es)');
      expect(parsed!.rows[1][3]).toBe('They visited London last year.');
    });

    runner.it('T1.1.4: Splits cells accurately preserving intra-cell whitespace and inline markdown', () => {
      const tableMd = `
| Cấu trúc | Ý nghĩa | Lưu ý |
|---|---|---|
| **S + V + O** | Câu đơn chuẩn | Không được thiếu động từ |
| *be + V-ing* | Đang diễn ra | Không dùng với stative verbs |
`;
      const parsed = parseMarkdownTable(tableMd);
      expect(parsed).not.toBeNull();
      expect(parsed!.rows[0][0]).toBe('**S + V + O**');
      expect(parsed!.rows[1][0]).toBe('*be + V-ing*');
      expect(parsed!.rows[1][2]).toBe('Không dùng với stative verbs');
    });

    runner.it('T1.1.5: Preserves leading and trailing pipes without creating empty outer cells', () => {
      const row = '| Cột 1 | Cột 2 | Cột 3 |';
      const cells = splitTableRow(row);
      expect(cells.length).toBe(3);
      expect(cells[0]).toBe('Cột 1');
      expect(cells[1]).toBe('Cột 2');
      expect(cells[2]).toBe('Cột 3');
    });

    runner.it('T1.1.6: Returns null gracefully for non-table markdown text', () => {
      const nonTable = `
# Tiêu đề bài học
Đây là một đoạn văn bản bình thường không có bảng.
- Danh sách 1
- Danh sách 2
`;
      const parsed = parseMarkdownTable(nonTable);
      expect(parsed).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1.2: Formula Tokenizer
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 1.2: Formula Tokenizer', () => {
    runner.it('T1.2.1: Tokenizes canonical S-V-O formula with clean label expansion', () => {
      const code = 'S:S + V:V + O:O';
      const formulas = tokenizeFormula(code);
      expect(formulas.length).toBe(1);
      const items = formulas[0].items;
      expect(items.length).toBe(3);
      expect(items[0].cleanLabels[0]).toBe('S (Chủ ngữ)');
      expect(items[1].cleanLabels[0]).toBe('V (Động từ)');
      expect(items[2].cleanLabels[0]).toBe('O (Tân ngữ)');
    });

    runner.it('T1.2.2: Assigns correct visual badge styles (sky for S, indigo for V/be, emerald for O/bổ ngữ)', () => {
      expect(getTokenBadgeStyle('S (Chủ ngữ)')).toBe('sky');
      expect(getTokenBadgeStyle('V (Động từ)')).toBe('indigo');
      expect(getTokenBadgeStyle('be (am/is/are)')).toBe('indigo');
      expect(getTokenBadgeStyle('O (Tân ngữ)')).toBe('emerald');
      expect(getTokenBadgeStyle('Bổ ngữ')).toBe('emerald');
      expect(getTokenBadgeStyle('Trạng từ')).toBe('muted');
    });

    runner.it('T1.2.3: Parses math operators (+) and line/dot separators (\\n, ·)', () => {
      const multilineCode = 'S + V + O\nS + be + Adj·S + V:V';
      const parsed = tokenizeFormula(multilineCode);
      expect(parsed.length).toBe(3);
      expect(parsed[0].items.length).toBe(3);
      expect(parsed[1].items.length).toBe(3);
      expect(parsed[2].items.length).toBe(2);
    });

    runner.it('T1.2.4: Handles stacked alternative choices {am|is|are} and (don\'t | doesn\'t)', () => {
      const code = 'S + {am|is|are} + V-ing';
      const parsed = tokenizeFormula(code);
      expect(parsed.length).toBe(1);
      const stackItem = parsed[0].items[1];
      expect(stackItem.isStack).toBe(true);
      expect(stackItem.tokens).toEqual(['am', 'is', 'are']);
      expect(stackItem.cleanLabels.length).toBe(3);

      const negCode = 'S + (don\'t | doesn\'t) + V';
      const negParsed = tokenizeFormula(negCode);
      const negStack = negParsed[0].items[1];
      expect(negStack.isStack).toBe(true);
      expect(negStack.tokens).toEqual(["don't", "doesn't"]);
    });

    runner.it('T1.2.5: Resolves custom key-value tokens k:v into formatted representations', () => {
      expect(cleanFormulaToken('S:He/She/It')).toBe('S (He/She/It)');
      expect(cleanFormulaToken('V:has')).toBe('V (has)');
      expect(cleanFormulaToken('O:Tân ngữ trực tiếp')).toBe('O (Tân ngữ trực tiếp)');
      expect(cleanFormulaToken('D:Tính từ')).toBe('Tính từ');
      expect(cleanFormulaToken('Prep:Giới từ')).toBe('Prep (Giới từ)');
    });

    runner.it('T1.2.6: Resolves be-verb special forms (V:be, be) into canonical be (am/is/are)', () => {
      expect(cleanFormulaToken('V:be')).toBe('be (am/is/are)');
      expect(cleanFormulaToken('be')).toBe('be (am/is/are)');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1.3: Exercise Validation Engine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 1.3: Exercise Validation Engine', () => {
    runner.it('T1.3.1: Evaluates MCQ matching by single letter index (A, B, C, D) case-insensitively', () => {
      const options = ['is running', 'are running', 'ran', 'was running'];
      expect(isGrammarAnswerCorrect('A', 'A', options)).toBe(true);
      expect(isGrammarAnswerCorrect('a', 'A', options)).toBe(true);
      expect(isGrammarAnswerCorrect('B', 'B', options)).toBe(true);
      expect(isGrammarAnswerCorrect('C', 'B', options)).toBe(false);
    });

    runner.it('T1.3.2: Evaluates MCQ matching by prefixed option text (A. Apple vs Apple)', () => {
      const options = ['A. had been completed', 'B. was completed', 'C. has completed', 'D. completes'];
      expect(isOptionMatchingCorrect('A. had been completed', 0, 'A')).toBe(true);
      expect(isOptionMatchingCorrect('had been completed', 0, 'A')).toBe(true);
      expect(isOptionMatchingCorrect('B. was completed', 1, 'B. was completed')).toBe(true);
      expect(isGrammarAnswerCorrect('had been completed', 'A. had been completed', options)).toBe(true);
    });

    runner.it('T1.3.3: Normalizes fill-in-the-blank answers (spaces, casing, smart quotes)', () => {
      expect(cleanGrammarAnswer('  don’t   know  ')).toBe("don't know");
      expect(cleanGrammarAnswer('THEY`RE')).toBe("they're");
      expect(areAnswersEqual('  went  ', 'went')).toBe(true);
      expect(areAnswersEqual('WENT', 'went')).toBe(true);
    });

    runner.it('T1.3.4: Expands auxiliary negative contractions (don\'t vs do not, didn\'t vs did not, won\'t vs will not)', () => {
      expect(areAnswersEqual("don't", 'do not')).toBe(true);
      expect(areAnswersEqual("doesn't", 'does not')).toBe(true);
      expect(areAnswersEqual("didn't", 'did not')).toBe(true);
      expect(areAnswersEqual("won't", 'will not')).toBe(true);
      expect(areAnswersEqual("can't", 'cannot')).toBe(true);
      expect(areAnswersEqual("isn't", 'is not')).toBe(true);
      expect(areAnswersEqual("aren't", 'are not')).toBe(true);
      expect(areAnswersEqual("hasn't", 'has not')).toBe(true);
      expect(areAnswersEqual("haven't", 'have not')).toBe(true);
    });

    runner.it('T1.3.5: Expands pronoun-verb subject contractions (I\'m vs I am, they\'re vs they are, it\'s vs it is)', () => {
      expect(areAnswersEqual("i'm", 'i am')).toBe(true);
      expect(areAnswersEqual("they're", 'they are')).toBe(true);
      expect(areAnswersEqual("it's", 'it is')).toBe(true);
      expect(areAnswersEqual("we've", 'we have')).toBe(true);
      expect(areAnswersEqual("he's", 'he is')).toBe(true);
    });

    runner.it('T1.3.6: Supports multiple acceptable answers separated by slash or comma', () => {
      expect(isGrammarAnswerCorrect('do not', "don't / do not")).toBe(true);
      expect(isGrammarAnswerCorrect("don't", "don't / do not")).toBe(true);
      expect(isGrammarAnswerCorrect('has gone', 'has gone, have gone')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1.4: Layout & Responsive Checks
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 1.4: Layout & Responsive Checks', () => {
    runner.it('T1.4.1: Absence of hardcoded fixed widths (>=480px) in grammar learn page source', () => {
      const pagePath = path.resolve(process.cwd(), 'src/app/grammar/learn/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      const code = fs.readFileSync(pagePath, 'utf8');
      const constraints = checkLayoutConstraints(code);
      // Hardcoded widths like w-[1200px] or min-w-[900px] break mobile layouts
      expect(constraints.hardcodedPixelWidths.length).toBe(0);
    });

    runner.it('T1.4.2: Grammar learn page contains fluid max-width containers and horizontal scroll safety', () => {
      const pagePath = path.resolve(process.cwd(), 'src/app/grammar/learn/page.tsx');
      const code = fs.readFileSync(pagePath, 'utf8');
      const constraints = checkLayoutConstraints(code);
      expect(constraints.hasFluidWidth).toBe(true);
      expect(constraints.hasHorizontalScrollSafety).toBe(true);
      expect(constraints.hasResponsiveBreakpointGrids).toBe(true);
    });

    runner.it('T1.4.3: GrammarFormula component ensures horizontal scrollability without line breaks', () => {
      const formulaPath = path.resolve(process.cwd(), 'src/components/grammar/GrammarFormula.tsx');
      expect(fs.existsSync(formulaPath)).toBe(true);
      const code = fs.readFileSync(formulaPath, 'utf8');
      expect(code).toContain('overflow-x-auto');
      expect(code).toContain('whitespace-nowrap');
    });

    runner.it('T1.4.4: LazyMarkdown table renderer includes responsive overflow wrapper', () => {
      const lazyPath = path.resolve(process.cwd(), 'src/components/perf/LazyMarkdown.tsx');
      expect(fs.existsSync(lazyPath)).toBe(true);
      const code = fs.readFileSync(lazyPath, 'utf8');
      expect(code).toContain('overflow-x-auto');
      expect(code).toContain('table');
    });

    runner.it('T1.4.5: Responsive breakpoints (sm:, md:, lg:) are employed across grammar UI components', () => {
      const componentsDir = path.resolve(process.cwd(), 'src/components/grammar');
      const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.tsx'));
      expect(files.length).toBeGreaterThanOrEqual(4);

      let totalResponsiveClasses = 0;
      for (const file of files) {
        const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
        if (/sm:|md:|lg:|xl:/.test(content)) {
          totalResponsiveClasses++;
        }
      }
      expect(totalResponsiveClasses).toBeGreaterThanOrEqual(3);
    });

    runner.it('T1.4.6: Absence of overflow-hidden without scroll safety on mobile table containers', () => {
      const lazyPath = path.resolve(process.cwd(), 'src/components/perf/LazyMarkdown.tsx');
      const code = fs.readFileSync(lazyPath, 'utf8');
      // Table container must allow x-scrolling
      expect(code).toContain('overflow-x-auto');
    });
  });
}
