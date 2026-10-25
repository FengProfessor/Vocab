/**
 * Ingestion & Rebranding Pipeline for DauTOEIC 20 Full Exams (4,000 Questions).
 *
 * Responsibilities:
 * 1. Reads raw datasets from `scripts/dautoeic/data/`:
 *    - `mock_tests.json` (20 exams)
 *    - `mock_test_sets.json` (2 sets: Vol 1 and Vol 2)
 *    - `mock_test_passages.json` (840 passages)
 *    - `mock_test_questions.json` (4,000 questions)
 * 2. Rebrands 100% of exams to official LingoPro exam series:
 *    - Tests 1-10: 'Series Khảo Thí Chuẩn ETS Format - Bộ Đề Thực Chiến Tinh Hoa Vol 1' (Codes ETS-PRO-01 to ETS-PRO-10)
 *    - Tests 11-20: 'Series Khảo Thí Chuẩn ETS Format - Bộ Đề Thực Chiến Tinh Hoa Vol 2' (Codes ETS-PRO-11 to ETS-PRO-20)
 * 3. Cleans 100% of competitor traces:
 *    - Standardizes Part 1 prompts: 'Part 1 Đậu TOEIC #X' -> 'Look at the photograph and choose the best statement.'
 *    - Zero competitor tokens: 'dautoeic', 'dauenglish', 'crackv1t3q5', 'odlnhfaygiotcyehuysw', 'đậu toeic'.
 *    - Rewrites 100% of media URLs through `resolveProxyMediaUrl` (/api/toeic/media/proxy?t=...).
 *    - Embeds invisible zero-width Unicode watermark `LINGOPRO_ETSPRO_XX_QYYY` into 4,000 `explanationVi` strings.
 * 4. Outputs 20 standardized JSON datasets: `src/data/toeic/datasets/ets_pro/ets_pro_test_01.json` .. `20.json`.
 * 5. Updates `src/data/toeic/toeic-catalog-index.json`:
 *    - Registers 20 ETS-PRO tests in `fullTests` array
 *    - Updates `totalFullTests` to 81
 *    - Updates `totalQuestions` to 23,175
 * 6. Verifies data integrity and zero leaks with post-ingestion assertion checks.
 *
 * Usage:
 *   npx tsx scripts/toeic/ingest-ets-pro-exams.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveProxyMediaUrl } from '../../src/lib/toeic-media-proxy';
import { embedInvisibleWatermark, extractInvisibleWatermark } from '../../src/lib/toeic-anti-scraping';
import type {
  ToeicPart,
  ToeicSection,
  ToeicUnifiedQuestion,
} from '../../src/types/toeic';

const ROOT_DIR = path.resolve(__dirname, '../..');
const DATA_DIR = path.resolve(ROOT_DIR, 'scripts/dautoeic/data');

const RAW_MOCK_TESTS_PATH = path.join(DATA_DIR, 'mock_tests.json');
const RAW_MOCK_SETS_PATH = path.join(DATA_DIR, 'mock_test_sets.json');
const RAW_PASSAGES_PATH = path.join(DATA_DIR, 'mock_test_passages.json');
const RAW_QUESTIONS_PATH = path.join(DATA_DIR, 'mock_test_questions.json');

const ETS_PRO_DIR = path.resolve(ROOT_DIR, 'src/data/toeic/datasets/ets_pro');
const CATALOG_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/toeic-catalog-index.json');

interface RawMockTest {
  id: string;
  name: string;
  source: string;
  year?: number;
  difficulty_level?: number;
  total_questions: number;
  listening_duration_seconds: number;
  reading_duration_seconds: number;
  order_index: number;
  set_id: string;
}

interface RawMockSet {
  id: string;
  name: string;
  order_index: number;
}

interface RawMockPassage {
  id: string;
  test_id: string;
  part: number;
  passage_type?: string;
  audio_url?: string | null;
  image_url?: string | null;
  passage_text?: string | null;
  passage_text_2?: string | null;
  passage_text_3?: string | null;
  transcript?: string | null;
  order_index?: number;
  title?: string | null;
}

interface RawMockQuestion {
  id: string;
  test_id: string;
  passage_id?: string | null;
  part: number;
  section: string;
  question_number: number;
  audio_url?: string | null;
  image_url?: string | null;
  passage_text?: string | null;
  question_text?: string | null;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer: string;
  explanation_vi?: string | null;
  explanation_en?: string | null;
  dich_nghia?: string | null;
  source?: string;
}

interface StandardizedTestItem {
  targetIndex: number; // 1 to 20
  code: string; // ETS-PRO-01 to ETS-PRO-20
  testId: string; // ets-pro-01 to ets-pro-20
  seriesTitle: string;
  seriesVol: number; // 1 or 2
  rawTest: RawMockTest;
}

/**
 * Sanitizes competitor brand tokens from pedagogical strings while preserving natural Vietnamese vocabulary.
 */
function cleanCompetitorText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/Part 1 Đậu TOEIC #\d+/gi, 'Look at the photograph and choose the best statement.')
    .replace(/đậu toeic|dau toeic/gi, 'LingoPro ETS')
    .replace(/dautoeic|dauenglish/gi, 'lingopro')
    .replace(/crackv1t3q5|crackv1/gi, '')
    .trim();
}

/**
 * Main ingestion routine.
 */
export async function runIngestion(): Promise<void> {
  console.log('================================================================================');
  console.log('  LINGOPRO TOEIC: 20 FULL EXAMS INGESTION & ANTI-LEAK PIPELINE');
  console.log('  Scope: 4,000 Questions, 840 Passages, 20 ETS-PRO Datasets, Zero Competitor Traces');
  console.log('================================================================================\n');

  // 1. Verify existence of source files
  const requiredFiles = [
    RAW_MOCK_TESTS_PATH,
    RAW_MOCK_SETS_PATH,
    RAW_PASSAGES_PATH,
    RAW_QUESTIONS_PATH,
    CATALOG_PATH,
  ];
  for (const f of requiredFiles) {
    if (!fs.existsSync(f)) {
      throw new Error(`Required file not found: ${f}`);
    }
  }

  // 2. Read raw datasets
  console.log('▶ [1/6] Loading raw DauTOEIC datasets...');
  const rawTests: RawMockTest[] = JSON.parse(fs.readFileSync(RAW_MOCK_TESTS_PATH, 'utf-8'));
  const rawSets: RawMockSet[] = JSON.parse(fs.readFileSync(RAW_MOCK_SETS_PATH, 'utf-8'));
  const rawPassages: RawMockPassage[] = JSON.parse(fs.readFileSync(RAW_PASSAGES_PATH, 'utf-8'));
  const rawQuestions: RawMockQuestion[] = JSON.parse(fs.readFileSync(RAW_QUESTIONS_PATH, 'utf-8'));

  console.log(`  - Raw mock tests: ${rawTests.length} (expected 20)`);
  console.log(`  - Raw mock sets: ${rawSets.length} (expected 2)`);
  console.log(`  - Raw passages: ${rawPassages.length} (expected 840)`);
  console.log(`  - Raw questions: ${rawQuestions.length} (expected 4,000)`);

  if (rawTests.length !== 20 || rawPassages.length !== 840 || rawQuestions.length !== 4000) {
    throw new Error('Raw dataset counts do not match expected 20 tests / 840 passages / 4,000 questions.');
  }

  // 3. Build lookup maps
  const passageMap = new Map<string, RawMockPassage>();
  for (const p of rawPassages) {
    passageMap.set(p.id, p);
  }

  // Group tests into Vol 1 and Vol 2 by set_id and order_index
  const set1Id = '40b95c1f-68b2-4c1b-a45a-1c13935dc0b8'; // Vol 1
  const set2Id = 'ee48fed8-f948-4042-ac9d-be2681e36050'; // Vol 2

  const vol1Tests = rawTests
    .filter((t) => t.set_id === set1Id)
    .sort((a, b) => a.order_index - b.order_index);

  const vol2Tests = rawTests
    .filter((t) => t.set_id === set2Id)
    .sort((a, b) => a.order_index - b.order_index);

  if (vol1Tests.length !== 10 || vol2Tests.length !== 10) {
    throw new Error(`Vol 1 has ${vol1Tests.length} tests, Vol 2 has ${vol2Tests.length} tests (expected 10 each).`);
  }

  const standardizedTests: StandardizedTestItem[] = [];

  // Vol 1: ETS-PRO-01 to ETS-PRO-10
  vol1Tests.forEach((rawTest, idx) => {
    const targetIndex = idx + 1; // 1 to 10
    const pad = String(targetIndex).padStart(2, '0');
    standardizedTests.push({
      targetIndex,
      code: `ETS-PRO-${pad}`,
      testId: `ets-pro-${pad}`,
      seriesTitle: 'Series Khảo Thí Chuẩn ETS Format - Bộ Đề Thực Chiến Tinh Hoa Vol 1',
      seriesVol: 1,
      rawTest,
    });
  });

  // Vol 2: ETS-PRO-11 to ETS-PRO-20
  vol2Tests.forEach((rawTest, idx) => {
    const targetIndex = idx + 11; // 11 to 20
    const pad = String(targetIndex).padStart(2, '0');
    standardizedTests.push({
      targetIndex,
      code: `ETS-PRO-${pad}`,
      testId: `ets-pro-${pad}`,
      seriesTitle: 'Series Khảo Thí Chuẩn ETS Format - Bộ Đề Thực Chiến Tinh Hoa Vol 2',
      seriesVol: 2,
      rawTest,
    });
  });

  console.log('✓ [1/6] Raw datasets validated and mapped to 20 ETS-PRO test definitions.\n');

  // 4. Ensure output directory exists
  console.log('▶ [2/6] Preparing destination directory...');
  if (!fs.existsSync(ETS_PRO_DIR)) {
    fs.mkdirSync(ETS_PRO_DIR, { recursive: true });
  }
  console.log(`✓ Destination directory: ${ETS_PRO_DIR}\n`);

  // 5. Transform and export each test
  console.log('▶ [3/6] Transforming 20 tests (rebranding, proxy media resolution, watermark injection)...');
  let totalTransformedQuestions = 0;

  for (const std of standardizedTests) {
    const testNumPad = String(std.targetIndex).padStart(2, '0');
    const outFilename = `ets_pro_test_${testNumPad}.json`;
    const outPath = path.join(ETS_PRO_DIR, outFilename);

    // Fetch and sort questions for this test
    const testQuestions = rawQuestions
      .filter((q) => q.test_id === std.rawTest.id)
      .sort((a, b) => a.question_number - b.question_number);

    if (testQuestions.length !== 200) {
      throw new Error(`Test ${std.code} has ${testQuestions.length} questions (expected exactly 200).`);
    }

    const unifiedQuestions: ToeicUnifiedQuestion[] = [];

    for (const q of testQuestions) {
      const qNum = q.question_number;
      const qNumPad = String(qNum).padStart(3, '0');
      const questionId = `${std.testId}-q${qNumPad}`;
      const part = q.part as ToeicPart;
      const section: ToeicSection = part <= 4 ? 'listening' : 'reading';

      // Standardize prompt
      let prompt: string | undefined;
      if (part === 1) {
        prompt = 'Look at the photograph and choose the best statement.';
      } else {
        prompt = cleanCompetitorText(q.question_text) || undefined;
      }

      // Build options array (Part 2 has 3 options A..C; all other parts have 4 A..D)
      const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
        { key: 'A', text: cleanCompetitorText(q.option_a) },
        { key: 'B', text: cleanCompetitorText(q.option_b) },
        { key: 'C', text: cleanCompetitorText(q.option_c) },
      ];
      if (part !== 2) {
        options.push({ key: 'D', text: cleanCompetitorText(q.option_d) });
      }

      // Linked passage
      const passage = q.passage_id ? passageMap.get(q.passage_id) : undefined;

      // Audio & Image URLs: rewrite through proxy
      let rawAudio = q.audio_url || passage?.audio_url || undefined;
      let rawImage = q.image_url || passage?.image_url || undefined;

      const audioUrl = rawAudio ? resolveProxyMediaUrl(rawAudio) : undefined;
      const imageUrl = rawImage ? resolveProxyMediaUrl(rawImage) : undefined;

      // Passages & translations
      const passageText = q.passage_text || passage?.passage_text || undefined;
      const dichNghia = cleanCompetitorText(q.dich_nghia) || undefined;

      // In Part 6 & 7, dich_nghia carries the curated passage translation
      const passageTranslationVi =
        part >= 6
          ? dichNghia || cleanCompetitorText(passage?.passage_text_2) || undefined
          : cleanCompetitorText(passage?.passage_text_2) || undefined;

      const transcript = cleanCompetitorText(passage?.transcript) || undefined;
      const clusterId = q.passage_id ? `cluster-${q.passage_id}` : undefined;

      // Pedagogical explanation Vi with zero-width invisible watermark
      let baseExplanation = cleanCompetitorText(q.explanation_vi);
      if (!baseExplanation || baseExplanation.length === 0) {
        if (part === 1) {
          baseExplanation = `Đáp án đúng là (${q.correct_answer}). Quan sát bức ảnh và nghe kỹ 4 nhận định.\n\n${dichNghia || ''}`.trim();
        } else if (part === 2) {
          baseExplanation = `Đáp án đúng là (${q.correct_answer}). Lắng nghe câu hỏi và chọn câu phản hồi phù hợp nhất.\n\n${dichNghia || ''}`.trim();
        } else {
          baseExplanation = `Đáp án đúng là (${q.correct_answer}). Căn cứ theo nội dung câu hỏi và ngữ cảnh chuẩn khảo thí ETS.\n\n${dichNghia || ''}`.trim();
        }
      }

      // Embed watermark: LINGOPRO_ETSPRO_XX_QYYY
      const watermarkPayload = `LINGOPRO_ETSPRO_${testNumPad}_Q${qNumPad}`;
      const watermarkedExplanation = embedInvisibleWatermark(baseExplanation, watermarkPayload);

      unifiedQuestions.push({
        id: questionId,
        testId: std.testId,
        questionNumber: qNum,
        part,
        section,
        prompt,
        options,
        correctAnswer: q.correct_answer as 'A' | 'B' | 'C' | 'D',
        audioUrl,
        imageUrl,
        passage: passageText,
        passageTranslationVi,
        dichNghia,
        explanationVi: watermarkedExplanation,
        transcript,
        clusterId,
      });
    }

    totalTransformedQuestions += unifiedQuestions.length;

    // Build complete exam payload
    const examPayload = {
      testId: std.testId,
      displayId: std.code,
      title: `${std.seriesTitle} — Test ${testNumPad}`,
      series: std.seriesTitle,
      testNumber: std.targetIndex,
      questionCount: 200,
      durationMinutes: 120,
      listeningDurationMinutes: 45,
      readingDurationMinutes: 75,
      source: 'ets_pro',
      badge: 'ETS PRO',
      questions: unifiedQuestions,
    };

    fs.writeFileSync(outPath, JSON.stringify(examPayload, null, 2), 'utf-8');
    console.log(`  ✓ Generated ${outFilename}: ${unifiedQuestions.length} questions [${std.code}]`);
  }

  console.log(`\n✓ [3/6] All 20 tests generated (${totalTransformedQuestions} questions total).\n`);

  // 6. Update toeic-catalog-index.json
  console.log('▶ [4/6] Updating toeic-catalog-index.json...');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

  // Ensure fullTests exists
  if (!Array.isArray(catalog.fullTests)) {
    catalog.fullTests = [];
  }

  // Remove any stale ets-pro entries before cleanly adding the 20 official ones
  catalog.fullTests = catalog.fullTests.filter((t: any) => !t.id?.startsWith('ets-pro-'));

  // Append 20 standardized tests
  for (const std of standardizedTests) {
    const testNumPad = String(std.targetIndex).padStart(2, '0');
    catalog.fullTests.push({
      id: std.testId,
      displayId: std.code,
      title: `${std.seriesTitle} — Test ${testNumPad}`,
      questionCount: 200,
      durationMinutes: 120,
      source: 'ets_pro',
      badge: 'ETS PRO',
    });
  }

  catalog.totalFullTests = catalog.fullTests.length; // 61 + 20 = 81
  catalog.totalQuestions = 19175 + 4000; // 23,175

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`  ✓ Catalog updated: totalFullTests = ${catalog.totalFullTests}, totalQuestions = ${catalog.totalQuestions}\n`);

  // 7. Rigorous Anti-Leak & Watermark Integrity Post-Validation
  console.log('▶ [5/6] Performing post-ingestion security & integrity audit...');
  const forbiddenPatterns = [
    /dautoeic/i,
    /dauenglish/i,
    /odlnhfaygiotcyehuysw/i,
    /crackv1t3q5/i,
    /đậu toeic/i,
    /dau toeic/i,
  ];

  let totalLeaks = 0;
  const files = fs.readdirSync(ETS_PRO_DIR).filter((f) => f.endsWith('.json'));

  if (files.length !== 20) {
    throw new Error(`Expected exactly 20 test files in ${ETS_PRO_DIR}, found ${files.length}.`);
  }

  for (const f of files) {
    const fullPath = path.join(ETS_PRO_DIR, f);
    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const pat of forbiddenPatterns) {
      if (pat.test(content)) {
        console.error(`  ❌ SECURITY LEAK in ${f}: matches pattern ${pat}`);
        totalLeaks++;
      }
    }

    // Spot-check watermarks on Q1, Q50, Q125, Q200
    const parsed = JSON.parse(content);
    const checkIndices = [0, 49, 124, 199];
    for (const idx of checkIndices) {
      const q = parsed.questions[idx];
      if (!q || !q.explanationVi) {
        throw new Error(`Missing question or explanationVi at index ${idx} in ${f}`);
      }
      const extracted = extractInvisibleWatermark(q.explanationVi);
      const expectedWatermark = `LINGOPRO_ETSPRO_${String(parsed.testNumber).padStart(2, '0')}_Q${String(q.questionNumber).padStart(3, '0')}`;
      if (extracted !== expectedWatermark) {
        throw new Error(
          `Watermark mismatch in ${f} Q${q.questionNumber}: expected "${expectedWatermark}", got "${extracted}"`
        );
      }
    }
  }

  if (totalLeaks > 0) {
    throw new Error(`Anti-leak verification failed: found ${totalLeaks} competitor token occurrences.`);
  }

  console.log('  ✓ 100% of 20 files are clean of competitor tokens.');
  console.log('  ✓ 100% of tested questions contain valid recoverable copyright watermarks.\n');

  console.log('================================================================================');
  console.log('  INGESTION & ANTI-LEAK PIPELINE COMPLETE: 20/20 EXAMS INGESTED SUCCESSFULLY');
  console.log('================================================================================');
}

// Standalone execution
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('ingest-ets-pro-exams'))) {
  runIngestion()
    .then(() => {
      console.log('Ingestion script finished with exit code 0.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during ingestion:', err);
      process.exit(1);
    });
}
