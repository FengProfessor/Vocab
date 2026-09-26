/**
 * scripts/realign-listening-audio.ts
 *
 * Milestone 1 (M1: Audio & Graphic Data Alignment & Crawlers)
 *
 * Core Objectives:
 * 1. Realign 1:3 cluster audio for Part 3 (Q32-Q70) and Part 4 (Q71-Q100) across all 20 tests
 *    in `src/data/toeic/content-toeic-listening-v1.json`, `src/data/toeic/datasets/study4_data/`,
 *    and `crawlers/toeic/toeic_data/`.
 *    - Part 3: 13 dialogues mapped 1:3 to questions: 32-34 -> audio[0], ..., 68-70 -> audio[12].
 *    - Part 4: 10 talks mapped 1:3 to questions: 71-73 -> audio[0], ..., 98-100 -> audio[9].
 * 2. Resolve Test 7005 edge case: fallback to Estudyme `full_tests/test-6.json` for Part 3,
 *    populating 39 questions (Q32-Q70) and 13 groups in `content-toeic-listening-v1.json`,
 *    `study4_test_7005.json`, and `crawlers/toeic/toeic_data/study4_test_7005.json`.
 * 3. Resolve sibling audio/image gaps in ETS 2024 and ETS 2026:
 *    - Sibling inheritance within each 3-question cluster (2024-09 Q46, 2026-06 Q69, 2026-07 Q70/73, 2024-10 Q58).
 *    - Fallback audio for orphaned clusters (2024-09 Q92-94, 2024-10 Q56-58, 2026-04 Q92-94) from Estudyme.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const LISTENING_V1_PATH = path.join(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const STUDY4_DATA_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/study4_data');
const CRAWLERS_TOEIC_DIR = path.join(ROOT_DIR, 'crawlers/toeic/toeic_data');
const ESTUDYME_FULL_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/estudyme_data/full_tests');
const ETS_2024_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2024');
const ETS_2026_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2026');

interface QuestionItem {
  qid: string;
  qnum: string;
  text: string;
  options: string[];
  audio_url: string;
  image_url: string;
  correct_answer: string;
  explanation?: string;
  explanationVi?: string;
  transcript?: string;
}

interface GroupItem {
  group_index: number;
  passage: string;
  audio_url: string;
  images: string[];
  questions: QuestionItem[];
}

interface PartTestEntry {
  testId: string;
  title: string;
  label: string;
  groups: GroupItem[];
  questions: QuestionItem[];
}

interface ListeningV1Data {
  version: string;
  source: string;
  updatedAt: string;
  part1: PartTestEntry[];
  part2: PartTestEntry[];
  part3: PartTestEntry[];
  part4: PartTestEntry[];
}

interface EstudymeChildQuestion {
  id?: string;
  questionText?: string;
  options?: string[];
  correctOptions?: string[];
  image?: string;
}

interface EstudymeCard {
  id?: string;
  part?: number;
  questionText?: string;
  sound?: string;
  image?: string;
  options?: string[];
  correctOptions?: string[];
  transcript?: string;
  explanationVi?: string;
  childQuestions?: EstudymeChildQuestion[];
}

interface EstudymeFullTest {
  testId?: string;
  name?: string;
  slug?: string;
  cards: EstudymeCard[];
}

interface EtsUnifiedQuestion {
  id: string;
  testId: string;
  questionNumber: number;
  part: number;
  section: string;
  prompt: string | null;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  audioUrl: string | null;
  imageUrl: string | null;
  explanationVi?: string;
  transcript?: string | null;
}

interface EtsTestFile {
  testId: string;
  displayId?: string;
  title: string;
  year: number;
  testNumber: number;
  questionCount: number;
  durationMinutes: number;
  source: string;
  badge?: string;
  questions: EtsUnifiedQuestion[];
}

/**
 * Build 39 Part 3 questions and 13 groups from Estudyme full test 6.
 */
function buildPart3FromEstudymeTest6(): { questions: QuestionItem[]; groups: GroupItem[] } {
  const file = path.join(ESTUDYME_FULL_DIR, 'test-6.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Estudyme full test 6 not found at: ${file}`);
  }
  const full6: EstudymeFullTest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const p3Cards = full6.cards
    .filter((c) => Array.isArray(c.childQuestions) && c.childQuestions.length > 0)
    .slice(0, 13);

  if (p3Cards.length !== 13) {
    throw new Error(`Expected 13 Part 3 cards in test-6.json, found ${p3Cards.length}`);
  }

  const questions: QuestionItem[] = [];
  const groups: GroupItem[] = [];

  p3Cards.forEach((c, cIdx) => {
    const audioUrl = c.sound || '';
    const imageUrl = c.image || '';
    const passage = c.transcript || '';
    const gQuestions: QuestionItem[] = [];

    (c.childQuestions || []).forEach((cq, qIdx) => {
      const qnum = 32 + cIdx * 3 + qIdx;
      const opts = (cq.options || []).map((o, oIdx) => {
        const letter = ['A', 'B', 'C', 'D'][oIdx] || 'A';
        const clean = o.replace(/^\([A-D]\)\s*/, '').trim();
        return `${letter}. ${clean}`;
      });

      let ans = 'A';
      if (cq.correctOptions && cq.correctOptions[0]) {
        const m = cq.correctOptions[0].match(/\(?([A-D])\)?/);
        if (m) ans = m[1].toUpperCase();
      }

      const qItem: QuestionItem = {
        qid: `p3-7005-${qnum}`,
        qnum: String(qnum),
        text: cq.questionText || '',
        options: opts,
        audio_url: audioUrl,
        image_url: imageUrl,
        correct_answer: ans,
        explanationVi: c.explanationVi,
        transcript: c.transcript,
      };

      gQuestions.push(qItem);
      questions.push(qItem);
    });

    groups.push({
      group_index: cIdx + 1,
      passage,
      audio_url: audioUrl,
      images: imageUrl ? [imageUrl] : [],
      questions: gQuestions,
    });
  });

  return { questions, groups };
}

function stripHtmlText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build 16 Part 6 questions and 4 groups from Estudyme full test 6.
 */
function buildPart6FromEstudymeTest6(): { questions: QuestionItem[]; groups: GroupItem[] } {
  const file = path.join(ESTUDYME_FULL_DIR, 'test-6.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Estudyme full test 6 not found at: ${file}`);
  }
  const full6 = JSON.parse(fs.readFileSync(file, 'utf8'));
  const childCards = (full6.cards || []).filter(
    (c: any) => Array.isArray(c.childQuestions) && c.childQuestions.length > 0
  );
  const p6Cards = childCards.slice(23, 27);

  const questions: QuestionItem[] = [];
  const groups: GroupItem[] = [];

  p6Cards.forEach((c: any, gIdx: number) => {
    const passage = stripHtmlText(c.questionText);
    const gQuestions: QuestionItem[] = [];

    (c.childQuestions || []).forEach((cq: any, qIdx: number) => {
      const qnum = 131 + gIdx * 4 + qIdx;
      const opts = (cq.options || []).map((o: string, oIdx: number) => {
        const letter = ['A', 'B', 'C', 'D'][oIdx] || 'A';
        const clean = o.replace(/^\([A-D]\)\s*/, '').trim();
        return `${letter}. ${clean}`;
      });

      let ans = 'A';
      if (cq.correctOptions && cq.correctOptions[0]) {
        const m = cq.correctOptions[0].match(/\(?([A-D])\)?/);
        if (m) ans = m[1].toUpperCase();
      }

      const qItem: QuestionItem = {
        qid: `p6-7005-${qnum}`,
        qnum: String(qnum),
        text: cq.questionText || `Chỗ trống (${qnum})`,
        options: opts,
        audio_url: '',
        image_url: '',
        correct_answer: ans,
        explanationVi: cq.explanationVi || c.explanationVi,
        transcript: cq.transcript || c.transcript,
      };

      gQuestions.push(qItem);
      questions.push(qItem);
    });

    groups.push({
      group_index: gIdx + 1,
      passage,
      audio_url: '',
      images: [],
      questions: gQuestions,
    });
  });

  return { questions, groups };
}

/**
 * Realign questions for Part 3 or Part 4 according to 1:3 cluster mapping.
 */
function realignPartQuestions(
  partNum: 3 | 4,
  questions: QuestionItem[],
  testId: string
): { questions: QuestionItem[]; groups: GroupItem[]; alignedAudioCount: number } {
  const startQ = partNum === 3 ? 32 : 71;
  const expectedQCount = partNum === 3 ? 39 : 30;
  const clusterCount = partNum === 3 ? 13 : 10;

  if (questions.length !== expectedQCount) {
    throw new Error(`Test ${testId} Part ${partNum} expected ${expectedQCount} questions, got ${questions.length}`);
  }

  // Collect the unique audios in chronological first appearance order
  const uniqueAudios: string[] = [];
  for (const q of questions) {
    if (q.audio_url && q.audio_url.trim()) {
      const url = q.audio_url.trim();
      if (!uniqueAudios.includes(url)) {
        uniqueAudios.push(url);
      }
    }
  }

  if (uniqueAudios.length !== clusterCount) {
    throw new Error(
      `Test ${testId} Part ${partNum} expected ${clusterCount} unique audio files, but found ${uniqueAudios.length}`
    );
  }

  const realignedQuestions: QuestionItem[] = [];
  const groups: GroupItem[] = [];

  for (let cIdx = 0; cIdx < clusterCount; cIdx++) {
    const clusterAudio = uniqueAudios[cIdx];
    const gQuestions: QuestionItem[] = [];

    for (let qOffset = 0; qOffset < 3; qOffset++) {
      const idx = cIdx * 3 + qOffset;
      const originalQ = questions[idx];
      const qnum = startQ + idx;

      const updatedQ: QuestionItem = {
        ...originalQ,
        qnum: String(qnum),
        audio_url: clusterAudio,
      };

      gQuestions.push(updatedQ);
      realignedQuestions.push(updatedQ);
    }

    groups.push({
      group_index: cIdx + 1,
      passage: '',
      audio_url: clusterAudio,
      images: [],
      questions: gQuestions,
    });
  }

  return { questions: realignedQuestions, groups, alignedAudioCount: uniqueAudios.length };
}

/**
 * Apply 1:3 realignment to `content-toeic-listening-v1.json`
 */
function realignListeningV1() {
  console.log(`\n======================================================`);
  console.log(`1. REALIGNING: ${LISTENING_V1_PATH}`);
  console.log(`======================================================`);

  const rawData: ListeningV1Data = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));

  // 1. Check if Test 7005 Part 3 needs fallback
  const t7005_p3 = rawData.part3.find((t) => t.testId === '7005');
  if (t7005_p3 && (!t7005_p3.questions || t7005_p3.questions.length === 0)) {
    console.log(`⚡ Resolving Test 7005 Part 3: loading from Estudyme test-6 fallback...`);
    const { questions, groups } = buildPart3FromEstudymeTest6();
    t7005_p3.questions = questions;
    t7005_p3.groups = groups;
    console.log(`   -> Test 7005 Part 3 populated: ${questions.length} questions, ${groups.length} groups.`);
  }

  // 2. Realign Part 3 for all 20 tests
  console.log(`\nRealigning Part 3 (Q32-Q70) across all ${rawData.part3.length} tests...`);
  rawData.part3.forEach((testEntry) => {
    const { questions, groups, alignedAudioCount } = realignPartQuestions(3, testEntry.questions, testEntry.testId);
    testEntry.questions = questions;
    testEntry.groups = groups;
    console.log(
      `   [Test ${testEntry.testId}] Part 3: ${questions.length} Qs, 13 clusters mapped to ${alignedAudioCount} audios.`
    );
  });

  // 3. Realign Part 4 for all 20 tests
  console.log(`\nRealigning Part 4 (Q71-Q100) across all ${rawData.part4.length} tests...`);
  rawData.part4.forEach((testEntry) => {
    const { questions, groups, alignedAudioCount } = realignPartQuestions(4, testEntry.questions, testEntry.testId);
    testEntry.questions = questions;
    testEntry.groups = groups;
    console.log(
      `   [Test ${testEntry.testId}] Part 4: ${questions.length} Qs, 10 clusters mapped to ${alignedAudioCount} audios.`
    );
  });

  rawData.updatedAt = new Date().toISOString();
  fs.writeFileSync(LISTENING_V1_PATH, JSON.stringify(rawData, null, 2), 'utf8');
  console.log(`💾 Saved realigned ${LISTENING_V1_PATH} successfully!`);
}

/**
 * Apply 1:3 realignment to study4_data directories
 */
function realignStudy4Directory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist, skipping: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.startsWith('study4_test_') && f.endsWith('.json'));
  console.log(`\n======================================================`);
  console.log(`2. REALIGNING STUDY4 FILES in: ${dirPath} (${files.length} files)`);
  console.log(`======================================================`);

  // Ensure 7005 has Part 3 fallback
  const test7005Path = path.join(dirPath, 'study4_test_7005.json');
  if (fs.existsSync(test7005Path)) {
    const s7005 = JSON.parse(fs.readFileSync(test7005Path, 'utf8'));
    if (!s7005.parts) s7005.parts = {};
    if (!s7005.parts.part_3 || !s7005.parts.part_3.questions || s7005.parts.part_3.questions.length === 0) {
      console.log(`⚡ Populating study4_test_7005.json Part 3 with Estudyme fallback...`);
      const { questions, groups } = buildPart3FromEstudymeTest6();
      s7005.parts.part_3 = {
        part_num: 3,
        part_id: '19759',
        label: 'Part 3 (39 câu hỏi)',
        groups,
        questions,
      };
      fs.writeFileSync(test7005Path, JSON.stringify(s7005, null, 2), 'utf8');
      console.log(`   -> Populated study4_test_7005.json Part 3 (${questions.length} Qs)`);
    }

    if (!s7005.parts.part_6 || !s7005.parts.part_6.questions || s7005.parts.part_6.questions.length === 0) {
      console.log(`⚡ Populating study4_test_7005.json Part 6 with Estudyme fallback...`);
      const { questions, groups } = buildPart6FromEstudymeTest6();
      s7005.parts.part_6 = {
        part_num: 6,
        part_id: '19762',
        label: 'Part 6 (16 câu hỏi)',
        groups,
        questions,
      };
      fs.writeFileSync(test7005Path, JSON.stringify(s7005, null, 2), 'utf8');
      console.log(`   -> Populated study4_test_7005.json Part 6 (${questions.length} Qs)`);
    }
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const testId = data.test_id || file.replace('study4_test_', '').replace('.json', '');
    const parts = data.parts || {};

    let modified = false;

    // Part 3
    if (parts.part_3 && Array.isArray(parts.part_3.questions) && parts.part_3.questions.length === 39) {
      const { questions, groups } = realignPartQuestions(3, parts.part_3.questions, testId);
      parts.part_3.questions = questions;
      parts.part_3.groups = groups;
      modified = true;
    }

    // Part 4
    if (parts.part_4 && Array.isArray(parts.part_4.questions) && parts.part_4.questions.length === 30) {
      const { questions, groups } = realignPartQuestions(4, parts.part_4.questions, testId);
      parts.part_4.questions = questions;
      parts.part_4.groups = groups;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`   [Study4 ${testId}] Realigned Part 3 and Part 4.`);
    }
  }
}

/**
 * Resolve minor sibling audio/image gaps identified in ETS 2024 and ETS 2026.
 */
function realignEtsScannedDatasets() {
  console.log(`\n======================================================`);
  console.log(`3. ETS 2024 & 2026 SIBLING INHERITANCE PASS`);
  console.log(`======================================================`);

  const fallbackSounds: Record<string, string> = {
    // 2024-09 Q92-94 (cluster 7 in Part 4)
    'ets-2024-09-cluster-92-94': 'https://storage.googleapis.com/estudyme/dev/2022/06/28/99693596.mp3',
    // 2024-10 Q56-58 (cluster 8 in Part 3)
    'ets-2024-10-cluster-56-58': 'https://storage.googleapis.com/estudyme/dev/2022/06/28/64707817.mp3',
    // 2026-04 Q92-94 (cluster 7 in Part 4)
    'ets-2026-04-cluster-92-94': 'https://storage.googleapis.com/estudyme/dev/2022/06/28/16815971.mp3',
  };

  const etsDirs = [
    { year: 2024, dir: ETS_2024_DIR },
    { year: 2026, dir: ETS_2026_DIR },
  ];

  for (const { year, dir } of etsDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const testData: EtsTestFile = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const testId = testData.testId;
      let fixCount = 0;

      // Part 3 clusters: Q32-Q70
      for (let clusterStart = 32; clusterStart <= 70; clusterStart += 3) {
        const clusterEnd = clusterStart + 2;
        const cluster = testData.questions.filter(
          (q) => q.part === 3 && q.questionNumber >= clusterStart && q.questionNumber <= clusterEnd
        );

        if (cluster.length !== 3) continue;

        // 1. Inherit audioUrl
        let sharedAudio = cluster.find((q) => Boolean(q.audioUrl))?.audioUrl || null;
        if (!sharedAudio) {
          const key = `${testId}-cluster-${clusterStart}-${clusterEnd}`;
          if (fallbackSounds[key]) {
            sharedAudio = fallbackSounds[key];
          }
        }

        if (sharedAudio) {
          cluster.forEach((q) => {
            if (!q.audioUrl) {
              q.audioUrl = sharedAudio;
              fixCount++;
              console.log(`   [${testId}] Q${q.questionNumber} inherited audioUrl: ${sharedAudio}`);
            }
          });
        }

        // 2. Inherit imageUrl
        const sharedImage = cluster.find((q) => Boolean(q.imageUrl))?.imageUrl || null;
        if (sharedImage) {
          cluster.forEach((q) => {
            if (!q.imageUrl) {
              q.imageUrl = sharedImage;
              fixCount++;
              console.log(`   [${testId}] Q${q.questionNumber} inherited imageUrl: ${sharedImage}`);
            }
          });
        }

        // 3. Inherit transcript
        const sharedTranscript = cluster.find((q) => Boolean(q.transcript))?.transcript || null;
        if (sharedTranscript) {
          cluster.forEach((q) => {
            if (!q.transcript) {
              q.transcript = sharedTranscript;
            }
          });
        }
      }

      // Part 4 clusters: Q71-Q100
      for (let clusterStart = 71; clusterStart <= 100; clusterStart += 3) {
        const clusterEnd = clusterStart + 2;
        const cluster = testData.questions.filter(
          (q) => q.part === 4 && q.questionNumber >= clusterStart && q.questionNumber <= clusterEnd
        );

        if (cluster.length !== 3) continue;

        // 1. Inherit audioUrl
        let sharedAudio = cluster.find((q) => Boolean(q.audioUrl))?.audioUrl || null;
        if (!sharedAudio) {
          const key = `${testId}-cluster-${clusterStart}-${clusterEnd}`;
          if (fallbackSounds[key]) {
            sharedAudio = fallbackSounds[key];
          }
        }

        if (sharedAudio) {
          cluster.forEach((q) => {
            if (!q.audioUrl) {
              q.audioUrl = sharedAudio;
              fixCount++;
              console.log(`   [${testId}] Q${q.questionNumber} inherited audioUrl: ${sharedAudio}`);
            }
          });
        }

        // 2. Inherit imageUrl
        const sharedImage = cluster.find((q) => Boolean(q.imageUrl))?.imageUrl || null;
        if (sharedImage) {
          cluster.forEach((q) => {
            if (!q.imageUrl) {
              q.imageUrl = sharedImage;
              fixCount++;
              console.log(`   [${testId}] Q${q.questionNumber} inherited imageUrl: ${sharedImage}`);
            }
          });
        }

        // 3. Inherit transcript
        const sharedTranscript = cluster.find((q) => Boolean(q.transcript))?.transcript || null;
        if (sharedTranscript) {
          cluster.forEach((q) => {
            if (!q.transcript) {
              q.transcript = sharedTranscript;
            }
          });
        }
      }

      if (fixCount > 0) {
        fs.writeFileSync(fullPath, JSON.stringify(testData, null, 2), 'utf8');
        console.log(`   -> [${testId}] Saved with ${fixCount} sibling fixes.`);
      }
    }
  }
}

export function runRealignListeningAudio() {
  console.log(`🚀 Starting Comprehensive Audio Realignment for TOEIC Part 3 & 4...`);
  realignListeningV1();
  realignStudy4Directory(STUDY4_DATA_DIR);
  realignStudy4Directory(CRAWLERS_TOEIC_DIR);
  realignEtsScannedDatasets();
  console.log(`\n🎉 Audio Realignment finished successfully!`);
}

if (require.main === module) {
  runRealignListeningAudio();
}
