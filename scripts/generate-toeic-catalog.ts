/**
 * Pre-compiles the TOEIC Catalog Index (~75 KB) from crawler datasets.
 *
 * Indexed Datasets:
 * 1. crawlers/toeic/estudyme_data/full_tests/ (21 tests, 4,200 questions)
 * 2. crawlers/toeic/toeic_data/ (20 Study4 tests, 3,426 questions)
 * 3. crawlers/toeic/estudyme_data/practice_parts/ (231 sets across 9 folders, 7,549 questions)
 *
 * Grand Total: 15,175 authentic TOEIC questions.
 */

import fs from 'fs';
import path from 'path';

export interface ToeicCatalogTestItem {
  id: string;
  displayId: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  source: 'estudyme' | 'study4';
  badge: string;
}

export interface ToeicCatalogPracticeItem {
  id: string;
  part: number;
  setNumber: number;
  title: string;
  questionCount: number;
  durationMinutes: number;
  source: 'estudyme';
  file?: string;
}

export interface ToeicCatalogIndex {
  version: string;
  totalQuestions: number;
  totalFullTests: number;
  totalPracticeSets: number;
  fullTests: ToeicCatalogTestItem[];
  practiceParts: Record<string, ToeicCatalogPracticeItem[]>;
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function countEstudymeQuestions(cards: any[]): number {
  let count = 0;
  for (const c of cards) {
    if (c.childQuestions && c.childQuestions.length > 0) {
      count += c.childQuestions.length;
    } else {
      count += 1;
    }
  }
  return count;
}

function countStudy4Questions(parts: any): number {
  let count = 0;
  for (let p = 1; p <= 7; p++) {
    const part = parts['part_' + p] || parts['part' + p];
    if (part && part.questions) count += part.questions.length;
  }
  return count;
}

const RECOMMENDED_MINS_PER_Q: Record<number, number> = {
  1: 4 / 6,
  2: 10 / 25,
  3: 17 / 39,
  4: 15 / 30,
  5: 12 / 30,
  6: 10 / 16,
  7: 55 / 54,
};

export function generateToeicCatalogIndex(rootDir: string = process.cwd()): ToeicCatalogIndex {
  const fullTests: ToeicCatalogTestItem[] = [];

  // ── 1. Estudyme Full Tests (21 tests x 200Q = 4,200 questions) ──
  const ftDir = path.join(rootDir, 'crawlers/toeic/estudyme_data/full_tests');
  for (let i = 1; i <= 21; i++) {
    let fname = `test-${i}.json`;
    if (i === 11) fname = 'test-11-new.json';
    if (i === 12) fname = 'test-12-new.json';
    const filePath = path.join(ftDir, fname);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Estudyme full test file not found: ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const qCount = countEstudymeQuestions(data.cards);
    const numStr = i < 10 ? `0${i}` : String(i);
    fullTests.push({
      id: `estudyme-test-${i}`,
      displayId: `ETS-${numStr}`,
      title: `TOEIC ETS Simulation Test ${numStr}`,
      questionCount: qCount,
      durationMinutes: 120,
      source: 'estudyme',
      badge: 'ETS 200Q',
    });
  }

  // ── 2. Study4 Tests (20 tests = 3,426 questions) ──
  const s4Dir = path.join(rootDir, 'crawlers/toeic/toeic_data');
  const s4Files = fs.readdirSync(s4Dir).filter((f) => f.startsWith('study4_test_')).sort(naturalSort);

  const s4_200q = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'];
  const s4Tests200: ToeicCatalogTestItem[] = [];
  const s4TestsOther: ToeicCatalogTestItem[] = [];

  for (const f of s4Files) {
    const data = JSON.parse(fs.readFileSync(path.join(s4Dir, f), 'utf8'));
    const tid = String(data.test_id);
    const qCount = countStudy4Questions(data.parts);
    const cleanTitle = (data.title || `TOEIC Test ${tid}`).replace(/\s*-\s*STUDY4.*$/i, '').trim();
    const is200 = s4_200q.includes(tid);
    const item: ToeicCatalogTestItem = {
      id: tid,
      displayId: `TEST ${tid}`,
      title: cleanTitle,
      questionCount: qCount,
      durationMinutes: is200 ? 120 : Math.round((qCount / 200) * 120),
      source: 'study4',
      badge: is200 ? 'ETS 200Q' : qCount >= 140 ? `ETS Intensive ${qCount}Q` : `ETS Mini ${qCount}Q`,
    };
    if (is200) {
      s4Tests200.push(item);
    } else {
      s4TestsOther.push(item);
    }
  }

  // First 28 tests in fullTests are the 28 authentic 200-question tests (21 Estudyme + 7 Study4)
  fullTests.push(...s4Tests200);
  // Then the remaining 13 partial Study4 tests
  fullTests.push(...s4TestsOther);

  // ── 3. Estudyme Practice Parts (231 sets across 9 folders = 7,549 questions) ──
  const ppDir = path.join(rootDir, 'crawlers/toeic/estudyme_data/practice_parts');
  const practiceParts: Record<string, ToeicCatalogPracticeItem[]> = {
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
  };

  const dirToPart = [
    { dir: 'part_1_photos', part: 1, label: 'Photos' },
    { dir: 'part_2_question_response', part: 2, label: 'Question - Response' },
    { dir: 'part_3_conversations', part: 3, label: 'Conversations' },
    { dir: 'part_4_short_talks', part: 4, label: 'Short Talks' },
    { dir: 'part_5_incomplete_sentences', part: 5, label: 'Incomplete Sentences' },
    { dir: 'part_6_text_completion', part: 6, label: 'Text Completion' },
    { dir: 'part_7_single_passages', part: 7, label: 'Single Passage' },
    { dir: 'part_7_double_passages', part: 7, label: 'Double Passages' },
    { dir: 'part_7_triple_passages', part: 7, label: 'Triple Passages' },
  ];

  let part7SetNum = 1;

  for (const { dir: sd, part, label } of dirToPart) {
    const sdp = path.join(ppDir, sd);
    const files = fs.readdirSync(sdp).sort(naturalSort);
    for (const f of files) {
      const data = JSON.parse(fs.readFileSync(path.join(sdp, f), 'utf8'));
      const qCount = countEstudymeQuestions(data.cards);
      const slug = f.replace('.json', '');

      let setNumber = practiceParts[String(part)].length + 1;
      if (part === 7) {
        setNumber = part7SetNum++;
      }

      const minsRate = RECOMMENDED_MINS_PER_Q[part] || 1;
      const durationMinutes = Math.max(3, Math.round(qCount * minsRate));
      const title = data.name
        ? `Part ${part} - Set ${setNumber} (${data.name})`
        : `Part ${part} - Set ${setNumber} (${label})`;

      practiceParts[String(part)].push({
        id: `estudyme-${sd}-${slug}`,
        part,
        setNumber,
        title,
        questionCount: qCount,
        durationMinutes,
        source: 'estudyme',
        file: `${sd}/${f}`,
      });
    }
  }

  let totalPracticeQuestions = 0;
  let totalPracticeSets = 0;
  for (let p = 1; p <= 7; p++) {
    const list = practiceParts[String(p)];
    totalPracticeSets += list.length;
    totalPracticeQuestions += list.reduce((s, x) => s + x.questionCount, 0);
  }

  const totalFullQuestions = fullTests.reduce((s, x) => s + x.questionCount, 0);
  const totalQuestions = totalFullQuestions + totalPracticeQuestions;

  return {
    version: '1.0.0',
    totalQuestions,
    totalFullTests: fullTests.length,
    totalPracticeSets,
    fullTests,
    practiceParts,
  };
}

// CLI Execution
if (process.argv[1]?.endsWith('generate-toeic-catalog.ts') || process.argv[1]?.endsWith('generate-toeic-catalog.mjs')) {
  const catalog = generateToeicCatalogIndex();
  const outputPath = path.resolve(process.cwd(), 'src/data/toeic/toeic-catalog-index.json');

  const jsonStr = JSON.stringify(catalog, null, 2);
  fs.writeFileSync(outputPath, jsonStr, 'utf8');

  const kbSize = (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(2);
  console.log(`Successfully generated TOEIC Catalog Index at: ${outputPath}`);
  console.log(`- File Size: ${kbSize} KB`);
  console.log(`- Total Questions: ${catalog.totalQuestions.toLocaleString()}`);
  console.log(`- Total Full Tests: ${catalog.totalFullTests} (First 28 tests are 200Q)`);
  console.log(`- Total Practice Sets: ${catalog.totalPracticeSets} across Parts 1-7`);
}
