/**
 * Pre-compiles the TOEIC Catalog Index (~85 KB) from crawler and authentic exam datasets.
 *
 * Indexed Datasets:
 * 1. Estudyme full tests: 21 tests x 200Q = 4,200 questions
 * 2. Study4 full tests: 20 tests (7 of 200Q, 13 partial) = 3,426 questions
 * 3. ETS 2024 full tests: 10 tests x 200Q = 2,000 questions
 * 4. ETS 2026 full tests: 10 tests x 200Q = 2,000 questions
 * 5. Estudyme practice parts: 231 sets across 9 folders = 7,549 questions
 *
 * Grand Total: 19,175 authentic TOEIC questions across 61 full tests + 231 practice sets.
 */

import fs from 'fs';
import path from 'path';

export interface ToeicCatalogTestItem {
  id: string;
  displayId: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  source: 'estudyme' | 'study4' | 'ets2024' | 'ets2026';
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

function resolveDatasetDir(rootDir: string, primaryRel: string, fallbackRel: string): string {
  const primary = path.join(rootDir, primaryRel);
  if (fs.existsSync(primary)) return primary;
  const fallback = path.join(rootDir, fallbackRel);
  if (fs.existsSync(fallback)) return fallback;
  return primary;
}

export function generateToeicCatalogIndex(rootDir: string = process.cwd()): ToeicCatalogIndex {
  const fullTests: ToeicCatalogTestItem[] = [];

  // ── 1. Estudyme Full Tests (21 tests x 200Q = 4,200 questions) ──
  const ftDir = resolveDatasetDir(
    rootDir,
    'src/data/toeic/datasets/estudyme_data/full_tests',
    'crawlers/toeic/estudyme_data/full_tests'
  );
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
      title: `Đề mô phỏng ${numStr}`,
      questionCount: qCount,
      durationMinutes: 120,
      source: 'estudyme',
      badge: '200 câu',
    });
  }

  // ── 2. Study4 Tests (20 tests = 3,426 questions) ──
  const s4Dir = resolveDatasetDir(
    rootDir,
    'src/data/toeic/datasets/study4_data',
    'crawlers/toeic/toeic_data'
  );
  const s4Files = fs.readdirSync(s4Dir).filter((f) => f.startsWith('study4_test_')).sort(naturalSort);

  const s4_200q = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'];
  const s4Tests200: ToeicCatalogTestItem[] = [];
  const s4TestsOther: ToeicCatalogTestItem[] = [];

  const STUDY4_WHITELABEL_TITLES: Record<string, string> = {
    '6852': 'Bộ đề tuyển chọn 1 Test 1',
    '6853': 'Bộ đề tuyển chọn 1 Test 2',
    '6854': 'Bộ đề tuyển chọn 1 Test 3',
    '6855': 'Bộ đề tuyển chọn 1 Test 4',
    '6856': 'Bộ đề tuyển chọn 1 Test 5',
    '6857': 'Bộ đề tuyển chọn 1 Test 6',
    '6858': 'Bộ đề tuyển chọn 1 Test 7',
    '6859': 'Bộ đề tuyển chọn 1 Test 8',
    '6860': 'Bộ đề tuyển chọn 1 Test 9',
    '6861': 'Bộ đề tuyển chọn 1 Test 10',
    '7000': 'Bộ đề tuyển chọn 2 Test 1',
    '7001': 'Bộ đề tuyển chọn 2 Test 2',
    '7002': 'Bộ đề tuyển chọn 2 Test 3',
    '7003': 'Bộ đề tuyển chọn 2 Test 4',
    '7004': 'Bộ đề tuyển chọn 2 Test 5',
    '7005': 'Bộ đề tuyển chọn 2 Test 6',
    '7006': 'Bộ đề tuyển chọn 2 Test 7',
    '7007': 'Bộ đề tuyển chọn 2 Test 8',
    '7008': 'Bộ đề tuyển chọn 2 Test 9',
    '7009': 'Bộ đề tuyển chọn 2 Test 10',
  };

  for (const f of s4Files) {
    const data = JSON.parse(fs.readFileSync(path.join(s4Dir, f), 'utf8'));
    const tid = String(data.test_id);
    const qCount = countStudy4Questions(data.parts);
    const cleanTitle = STUDY4_WHITELABEL_TITLES[tid] || (data.title || `TOEIC Test ${tid}`).replace(/\s*-\s*STUDY4.*$/i, '').trim();
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

  fullTests.push(...s4Tests200);
  fullTests.push(...s4TestsOther);

  // ── 3. ETS 2024 Full Tests (10 tests x 200Q = 2,000 questions) ──
  const ets2024Dir = path.join(rootDir, 'src/data/toeic/datasets/ets_2024');
  if (fs.existsSync(ets2024Dir)) {
    for (let i = 1; i <= 10; i++) {
      const numStr = i < 10 ? `0${i}` : String(i);
      const filePath = path.join(ets2024Dir, `ets_2024_test_${numStr}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        fullTests.push({
          id: `ets-2024-${numStr}`,
          displayId: `ETS-2024-${numStr}`,
          title: `Đề thi 2024 — Test ${numStr}`,
          questionCount: data.questionCount || (data.questions ? data.questions.length : 200),
          durationMinutes: data.durationMinutes || 120,
          source: 'ets2024',
          badge: 'Năm 2024',
        });
      }
    }
  }

  // ── 4. ETS 2026 Full Tests (10 tests x 200Q = 2,000 questions) ──
  const ets2026Dir = path.join(rootDir, 'src/data/toeic/datasets/ets_2026');
  if (fs.existsSync(ets2026Dir)) {
    for (let i = 1; i <= 10; i++) {
      const numStr = i < 10 ? `0${i}` : String(i);
      const filePath = path.join(ets2026Dir, `ets_2026_test_${numStr}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        fullTests.push({
          id: `ets-2026-${numStr}`,
          displayId: `ETS-2026-${numStr}`,
          title: `Đề thi 2026 — Test ${numStr}`,
          questionCount: data.questionCount || (data.questions ? data.questions.length : 200),
          durationMinutes: data.durationMinutes || 120,
          source: 'ets2026',
          badge: 'Năm 2026',
        });
      }
    }
  }

  // ── 5. Estudyme Practice Parts (231 sets across 9 folders = 7,549 questions) ──
  const ppDir = resolveDatasetDir(
    rootDir,
    'src/data/toeic/datasets/estudyme_data/practice_parts',
    'crawlers/toeic/estudyme_data/practice_parts'
  );
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
  console.log(`- Total Full Tests: ${catalog.totalFullTests} (First 48 tests are 200Q)`);
  console.log(`- Total Practice Sets: ${catalog.totalPracticeSets} across Parts 1-7`);
}
