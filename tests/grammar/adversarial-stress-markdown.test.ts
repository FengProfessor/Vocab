/**
 * Adversarial Stress Tests for ensureMarkdownTableFormat & LazyMarkdown Preprocessing.
 *
 * Attacks targeted:
 * 1. Empty table cells (| |, |   |, consecutive empty cells, all-empty rows)
 * 2. Non-table lines containing random pipes (sentences, lists, math expressions)
 * 3. Escaped pipes (\|) in headers, body cells, and non-table prose
 * 4. Raw textbook || note delimiters (various prefixes, bullet lists, uppercase headers)
 * 5. Multi-pass idempotency across 10 successive passes on complex documents
 * 6. Edge cases (fenced code blocks with pipes, mixed line endings, LaTeX + tables)
 */

import { ensureMarkdownTableFormat, normalizeLatexTokens, isTableDelimiter } from '../../src/components/perf/LazyMarkdown';
import { parseMarkdownTable, expect, TestRunner } from './test-harness';

export async function runAdversarialMarkdownTests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Group 1: Empty Table Cells (| |)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 1: Empty Table Cells (| |)', () => {
    runner.it('Preserves empty cells in 2-column, 3-column, and 4-column tables', () => {
      const input = [
        '| Header 1 | Header 2 | Header 3 |',
        '|:---|:---:|---:|',
        '| | Val 2 | Val 3 |',
        '| Val 1 | | Val 3 |',
        '| Val 1 | Val 2 | |',
        '| | | |',
      ].join('\n');

      const formatted = ensureMarkdownTableFormat(input);
      const parsed = parseMarkdownTable(formatted);
      expect(parsed).toBeDefined();
      expect(parsed?.headers.length).toBe(3);
      expect(parsed?.rows.length).toBe(4);

      // Row 0: empty first cell
      expect(parsed?.rows[0][0]).toBe('');
      expect(parsed?.rows[0][1]).toBe('Val 2');
      expect(parsed?.rows[0][2]).toBe('Val 3');

      // Row 1: empty middle cell
      expect(parsed?.rows[1][0]).toBe('Val 1');
      expect(parsed?.rows[1][1]).toBe('');
      expect(parsed?.rows[1][2]).toBe('Val 3');

      // Row 2: empty trailing cell
      expect(parsed?.rows[2][0]).toBe('Val 1');
      expect(parsed?.rows[2][1]).toBe('Val 2');
      expect(parsed?.rows[2][2]).toBe('');

      // Row 3: all empty cells
      expect(parsed?.rows[3][0]).toBe('');
      expect(parsed?.rows[3][1]).toBe('');
      expect(parsed?.rows[3][2]).toBe('');
    });

    runner.it('Preserves empty cells with irregular whitespace (|   |)', () => {
      const input = [
        '| Col A | Col B |',
        '|---|---|',
        '|        | data B1 |',
        '| data A2 |   \t   |',
      ].join('\n');

      const formatted = ensureMarkdownTableFormat(input);
      const parsed = parseMarkdownTable(formatted);
      expect(parsed).toBeDefined();
      expect(parsed?.rows.length).toBe(2);
      expect(parsed?.rows[0][0].trim()).toBe('');
      expect(parsed?.rows[0][1].trim()).toBe('data B1');
      expect(parsed?.rows[1][0].trim()).toBe('data A2');
      expect(parsed?.rows[1][1].trim()).toBe('');
    });

    runner.it('Table with adjacent pipes representing empty cells (|val||val|)', () => {
      const input = [
        '| A | B | C |',
        '|---|---|---|',
        '| 1 || 3 |',
      ].join('\n');

      const formatted = ensureMarkdownTableFormat(input);
      // Ensure row is not destroyed or split onto multiple lines
      const lines = formatted.split('\n').filter((l) => l.trim().length > 0);
      expect(lines.length).toBe(3);
      expect(lines[2]).toContain('1');
      expect(lines[2]).toContain('3');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 2: Non-table Lines with Random Pipes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 2: Non-table Lines with Random Pipes', () => {
    runner.it('Preserves single pipe in prose sentences without turning into table', () => {
      const input = 'Choose option A | or option B depending on the context.';
      const output = ensureMarkdownTableFormat(input);
      expect(output).toBe(input);
      expect(parseMarkdownTable(output)).toBeNull();
    });

    runner.it('Preserves multiple pipes in prose when no delimiter row exists', () => {
      const input = [
        'Here are the options available:',
        'Option 1 | Option 2 | Option 3 | Option 4',
        'Please select one from above.',
      ].join('\n');

      const output = ensureMarkdownTableFormat(input);
      expect(output).toContain('Option 1 | Option 2 | Option 3 | Option 4');
      // Must NOT be treated as a table because there is no |---| delimiter
      expect(parseMarkdownTable(output)).toBeNull();
    });

    runner.it('Preserves pipes in mathematical/logical expressions', () => {
      const input = [
        'Definition of absolute value: |x| = x if x >= 0, or -x if x < 0.',
        'Set notation: { x | x > 5 } represents all numbers greater than 5.',
      ].join('\n');

      const output = ensureMarkdownTableFormat(input);
      expect(output).toContain('|x| = x');
      expect(output).toContain('{ x | x > 5 }');
    });

    runner.it('Handles pipe at start and end of non-table line without delimiter', () => {
      const input = '| This is just a decorated quote box |';
      const output = ensureMarkdownTableFormat(input);
      expect(output.trim()).toBe(input.trim());
      expect(parseMarkdownTable(output)).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 3: Escaped Pipes (\\|)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 3: Escaped Pipes (\\|)', () => {
    runner.it('Preserves escaped pipes inside table header and cells', () => {
      const input = [
        '| Operator | Meaning \\| Usage | Example |',
        '|:---|:---|:---|',
        '| \\|\\| | Logical OR \\| Pipe | `a \\|\\| b` |',
        '| \\| | Bitwise OR \\| Single | `a \\| b` |',
      ].join('\n');

      const formatted = ensureMarkdownTableFormat(input);
      const lines = formatted.split('\n').filter((l) => l.trim().length > 0);
      expect(lines.length).toBe(4);
      expect(formatted).toContain('Meaning \\| Usage');
      expect(formatted).toContain('`a \\|\\| b`');
    });

    runner.it('Preserves escaped pipes in non-table prose', () => {
      const input = 'Use the pipe character \\| to separate items in regex: (cat\\|dog).';
      const output = ensureMarkdownTableFormat(input);
      expect(output).toBe(input);
    });

    runner.it('Table delimiter detection ignores escaped pipes', () => {
      // Line with escaped pipe should not be mistakenly parsed as a valid delimiter
      const line = '---|\\|---';
      expect(isTableDelimiter(line)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 4: Raw Textbook || Notes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 4: Raw Textbook || Notes', () => {
    runner.it('Converts raw || notes into bullet points outside table blocks', () => {
      const input = 'GHI CHÚ: Always check Subject || Always check Verb tense || Watch for irregulars';
      const output = ensureMarkdownTableFormat(input);

      expect(output).toContain('- GHI CHÚ: Always check Subject');
      expect(output).toContain('- Always check Verb tense');
      expect(output).toContain('- Watch for irregulars');
      expect(output).not.toContain('||');
    });

    runner.it('Converts || inside existing bullet lists without redundant dashes', () => {
      const input = '- Rule 1: S (singular) takes V(s/es) || Rule 2: S (plural) takes base V';
      const output = ensureMarkdownTableFormat(input);

      expect(output).toContain('- Rule 1: S (singular) takes V(s/es)');
      expect(output).toContain('- Rule 2: S (plural) takes base V');
      expect(output).not.toContain('||');
    });

    runner.it('Converts general paragraph || notes into spaced bullet items', () => {
      const input = 'Lưu ý quan trọng: Thì hiện tại hoàn thành || Diễn tả hành động bắt đầu ở quá khứ || Kéo dài đến hiện tại';
      const output = ensureMarkdownTableFormat(input);

      expect(output).toContain('- Lưu ý quan trọng: Thì hiện tại hoàn thành');
      expect(output).toContain('- Diễn tả hành động bắt đầu ở quá khứ');
      expect(output).toContain('- Kéo dài đến hiện tại');
      expect(output).not.toContain('||');

      // Also test non-prefixed plain text branch (branch 3)
      const inputNoPrefix = 'Chủ ngữ và động từ cần hòa hợp || Số ít đi với số ít || Số nhiều đi với số nhiều';
      const outputNoPrefix = ensureMarkdownTableFormat(inputNoPrefix);
      expect(outputNoPrefix).toContain('Chủ ngữ và động từ cần hòa hợp\n\n- Số ít đi với số ít\n\n- Số nhiều đi với số nhiều');
      expect(outputNoPrefix).not.toContain('||');
    });

    runner.it('Does NOT convert || inside table rows (preserves table structure)', () => {
      const input = [
        '| Cấu trúc | Ghi chú |',
        '|---|---|',
        '| S + V || Nhớ chia thì |',
      ].join('\n');

      const output = ensureMarkdownTableFormat(input);
      const lines = output.split('\n').filter((l) => l.trim().length > 0);
      expect(lines.length).toBe(3);
      // Inside table line, it is preserved verbatim
      expect(lines[2]).toContain('S + V || Nhớ chia thì');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 5: 10-Pass Idempotency Stress Testing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 5: 10-Pass Idempotency Stress Testing', () => {
    const testCases: { name: string; content: string }[] = [
      {
        name: 'Empty string',
        content: '',
      },
      {
        name: 'Whitespace only',
        content: '   \n\n\t   \n   ',
      },
      {
        name: 'Single paragraph without tables',
        content: 'This is a simple grammar explanation without any special characters.',
      },
      {
        name: 'LaTeX formula tokens',
        content: 'Công thức: $S_{ít}$ + $V_{s/es}$ và $S_{nhiều}$ + V. Chiều biến thiên: $\\nearrow$ rồi $\\searrow$ hay $\\rightarrow$.',
      },
      {
        name: 'Standard 3-column table',
        content: [
          '| Đại từ | Dạng số ít | Dạng số nhiều |',
          '|:---|:---:|---:|',
          '| Ngôi 1 | I | We |',
          '| Ngôi 2 | You | You |',
          '| Ngôi 3 | He / She / It | They |',
        ].join('\n'),
      },
      {
        name: 'Table with empty cells',
        content: [
          '| Cột 1 | Cột 2 | Cột 3 |',
          '|---|---|---|',
          '| Có | | Không |',
          '| | Có | |',
        ].join('\n'),
      },
      {
        name: 'Table stuck to preceding paragraph without blank line',
        content: [
          'Bảng tóm tắt các thì sau đây:| Thì | Công thức |',
          '|---|---|',
          '| HTĐ | S + V(s/es) |',
        ].join('\n'),
      },
      {
        name: 'Raw || textbook notes with uppercase header',
        content: 'CHÚ Ý: Không dùng thì tiếp diễn với động từ trạng thái || Cần ghi nhớ danh sách stative verbs || Ví dụ: know, love, hate',
      },
      {
        name: 'Mixed document: text + formula + table + notes',
        content: [
          '# Bài học Ngữ pháp',
          '',
          'Quy tắc chia động từ: $S_{ít}$ đi với $V_{s/es}$, suy ra $\\rightarrow$ cần thêm s/es.',
          '',
          'Bảng so sánh:',
          '| Dạng câu | Khẳng định | Phủ định |',
          '|---|---|---|',
          '| Đơn giản | S + V | S + don\'t/doesn\'t + V |',
          '| Tiếp diễn | S + is/are + V-ing | S + isn\'t/aren\'t + V-ing |',
          '',
          'GHI CHÚ: Lưu ý trạng từ tần suất || Luôn đứng trước động từ thường || Đứng sau to be',
        ].join('\n'),
      },
      {
        name: 'Multiple tables in single document',
        content: [
          '| Bảng 1 | Giá trị |',
          '|---|---|',
          '| A | 1 |',
          '',
          'Đoạn văn giữa 2 bảng.',
          '',
          '| Bảng 2 | Thuộc tính | Đơn vị |',
          '|:---|:---:|---:|',
          '| Chiều dài | 100 | cm |',
          '| Khối lượng | 50 | kg |',
        ].join('\n'),
      },
    ];

    for (const tc of testCases) {
      runner.it(`Idempotence across 10 passes: ${tc.name}`, () => {
        let current = tc.content;
        const passes: string[] = [];

        for (let pass = 1; pass <= 10; pass++) {
          current = ensureMarkdownTableFormat(current);
          passes.push(current);
        }

        // Pass 1 produces a stable representation
        // For all p from 1 to 9: passes[p] must be strictly identical to passes[0]
        for (let p = 1; p < 10; p++) {
          if (passes[p] !== passes[0]) {
            throw new Error(
              `Idempotency violation on "${tc.name}" at pass ${p + 1}:\n` +
              `--- Pass 1 (length ${passes[0].length}) ---\n${passes[0]}\n` +
              `--- Pass ${p + 1} (length ${passes[p].length}) ---\n${passes[p]}`
            );
          }
          expect(passes[p]).toBe(passes[0]);
        }
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Group 6: Corner Cases & Robustness
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Group 6: Corner Cases & Robustness', () => {
    runner.it('Handles Windows CRLF (\\r\\n) and normalizes safely', () => {
      const input = '| H1 | H2 |\r\n|---|---|\r\n| D1 | D2 |\r\n';
      const output = ensureMarkdownTableFormat(input);
      expect(output).not.toContain('\r');
      const parsed = parseMarkdownTable(output);
      expect(parsed?.rows.length).toBe(1);
    });

    runner.it('Normalizes all LaTeX tokens correctly in single pass', () => {
      const input = '$S_{ít}$ $S_{it}$ $S_{nhiều}$ $S_{nhieu}$ $S_{sing}$ $S_{pl}$ $\\rightarrow$ $\\nearrow$ $\\searrow$ $\\Rightarrow$ $\\Leftarrow$ $\\leftrightarrow$ $\\times$';
      const output = normalizeLatexTokens(input);

      expect(output).toContain('S(ít)');
      expect(output).toContain('S(nhiều)');
      expect(output).toContain('→');
      expect(output).toContain('↗');
      expect(output).toContain('↘');
      expect(output).toContain('⇒');
      expect(output).toContain('⇐');
      expect(output).toContain('↔');
      expect(output).toContain('×');
      expect(output).not.toContain('$');
      expect(output).not.toContain('\\rightarrow');
    });

    runner.it('Preserves table when preceded and followed by markdown headings', () => {
      const input = [
        '## Phần 1: Bảng tổng hợp',
        '| Cột A | Cột B |',
        '|---|---|',
        '| Dòng 1 | Dòng 2 |',
        '## Phần 2: Giải thích chi tiết',
      ].join('\n');

      const output = ensureMarkdownTableFormat(input);
      expect(output).toContain('## Phần 1: Bảng tổng hợp');
      expect(output).toContain('## Phần 2: Giải thích chi tiết');
      const parsed = parseMarkdownTable(output);
      expect(parsed?.rows.length).toBe(1);
    });
  });
}

// Standalone runner execution
if (process.argv[1]?.endsWith('adversarial-stress-markdown.test.ts')) {
  (async () => {
    console.log('================================================================');
    console.log('  ADVERSARIAL STRESS TEST: ensureMarkdownTableFormat');
    console.log('================================================================\n');

    const runner = new TestRunner();
    await runAdversarialMarkdownTests(runner);
    const stats = await runner.run();

    console.log('\n================================================================');
    console.log(`  RESULT: ${stats.passed}/${stats.total} passed in ${stats.durationMs}ms`);
    console.log('================================================================');

    if (stats.failed > 0) {
      process.exit(1);
    }
  })().catch((err) => {
    console.error('Fatal error in adversarial test runner:', err);
    process.exit(1);
  });
}
