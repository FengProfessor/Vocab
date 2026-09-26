/**
 * scripts/remediate-m1-audio.ts
 *
 * Remediation Worker for Milestone 1 Iteration 2:
 * 1. Replace 17 broken HTTP 404 audio URLs in Study4 Collection 2 (tests 7000–7009)
 *    with valid, playable audio clips from Estudyme GCS (`src/data/toeic/datasets/estudyme_data/full_tests/`).
 * 2. Populate Part 6 (16 questions, Q131-Q146) in Test 7005 from Estudyme full test 6,
 *    restoring Test 7005 to a 100% complete 200-question exam.
 * 3. Update target files:
 *    - `src/data/toeic/content-toeic-listening-v1.json`
 *    - `src/data/toeic/datasets/study4_data/*.json`
 *    - `crawlers/toeic/toeic_data/*.json`
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const LISTENING_V1_PATH = path.join(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const STUDY4_DATA_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/study4_data');
const CRAWLERS_TOEIC_DIR = path.join(ROOT_DIR, 'crawlers/toeic/toeic_data');
const ESTUDYME_FULL_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/estudyme_data/full_tests');

export const BROKEN_AUDIO_REPLACEMENTS: Record<string, string> = {
  // Test 7000 (Collection 2 Test 1)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-1/audios/41-43_audio.612729e1.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/93860120.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-1/audios/83-85_audio.58130a2b.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/32703867.mp3',

  // Test 7001 (Collection 2 Test 2)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-2/audios/44-46_audio.81dfd3e6.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/48601325.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/48601325.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/48601325.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-2/audios/98-100_audio.b6299f57.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/91801891.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/91801891.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/91801891.mp3',

  // Test 7002 (Collection 2 Test 3)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-3/audios/62-64_audio.bdaf0100.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/23822168.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/23822168.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/27/23822168.mp3',

  // Test 7004 (Collection 2 Test 5)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-5/audios/50-52_audio.cd538a44.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/07/05/52925580.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/52925580.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/07/05/52925580.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-5/audios/56-58_audio.3cd577fd.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/07/05/29848087.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/29848087.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/07/05/29848087.mp3',

  // Test 7005 (Collection 2 Test 6)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-6/audios/92-94_audio.dfa2db7c.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/81508908.mp3',

  // Test 7006 (Collection 2 Test 7)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-7/audios/41-43_audio.69713484.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/84943248.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-7/audios/80-82_audio.84515049.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/37529431.mp3',

  // Test 7007 (Collection 2 Test 8)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-8/audios/56-58_audio.28444018.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/68092315.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-8/audios/62-64_audio.4eacd2ce.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/62327689.mp3',

  // Test 7008 (Collection 2 Test 9)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-9/audios/50-52_audio.63ad9229.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/80424829.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-9/audios/56-58_audio.1dd729e7.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/60170848.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-9/audios/80-82_audio.8b234362.mp3':
    'https://storage.googleapis.com/estudyme/prod/2022/09/16/13846725.mp3',
  'https://storage.googleapis.com/estudyme/dev/2022/06/28/13846725.mp3':
    'https://storage.googleapis.com/estudyme/prod/2022/09/16/13846725.mp3',
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-9/audios/92-94_audio.bcb6161a.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/99693596.mp3',

  // Test 7009 (Collection 2 Test 10)
  'https://s4-media1.study4.com/media/new_toeic_tests/new_toeic_updated_2/toeic-lr-collection-2-test-10/audios/53-55_audio.af5c4ea0.mp3':
    'https://storage.googleapis.com/estudyme/dev/2022/06/28/90188046.mp3',
};

function stripHtml(str?: string): string {
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
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;/gi, '"')
    .replace(/&rdquo;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build 16 Part 6 questions (Q131-Q146) and 4 groups from Estudyme full test 6.
 */
export function buildPart6FromEstudymeTest6(): { questions: any[]; groups: any[] } {
  const file = path.join(ESTUDYME_FULL_DIR, 'test-6.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Estudyme full test 6 not found at: ${file}`);
  }
  const full6 = JSON.parse(fs.readFileSync(file, 'utf8'));
  const childCards = (full6.cards || []).filter(
    (c: any) => Array.isArray(c.childQuestions) && c.childQuestions.length > 0
  );

  // Cards 23 to 26 are the 4 Part 6 passages
  const p6Cards = childCards.slice(23, 27);
  if (p6Cards.length !== 4) {
    throw new Error(`Expected 4 Part 6 cards in test-6.json, found ${p6Cards.length}`);
  }

  const questions: any[] = [];
  const groups: any[] = [];

  p6Cards.forEach((c: any, gIdx: number) => {
    const passage = stripHtml(c.questionText);
    const gQuestions: any[] = [];

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

      const qItem = {
        qid: `p6-7005-${qnum}`,
        qnum: String(qnum),
        text: cq.questionText || `Chỗ trống (${qnum})`,
        options: opts,
        audio_url: '',
        image_url: '',
        correct_answer: ans,
        explanationVi: cq.explanationVi || c.explanationVi || '',
        transcript: cq.transcript || c.transcript || '',
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

function remediateListeningV1() {
  console.log(`\n======================================================`);
  console.log(`1. REMEDIATING content-toeic-listening-v1.json`);
  console.log(`======================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));
  let replacedCount = 0;

  for (const partKey of ['part3', 'part4'] as const) {
    for (const testEntry of raw[partKey]) {
      // Questions
      for (const q of testEntry.questions || []) {
        if (q.audio_url && BROKEN_AUDIO_REPLACEMENTS[q.audio_url]) {
          const oldUrl = q.audio_url;
          q.audio_url = BROKEN_AUDIO_REPLACEMENTS[oldUrl];
          replacedCount++;
          console.log(`   [ListeningV1 Test ${testEntry.testId} Q${q.qnum}] Replaced: ${oldUrl.split('/').pop()} -> ${q.audio_url.split('/').pop()}`);
        }
      }

      // Groups
      for (const g of testEntry.groups || []) {
        if (g.audio_url && BROKEN_AUDIO_REPLACEMENTS[g.audio_url]) {
          g.audio_url = BROKEN_AUDIO_REPLACEMENTS[g.audio_url];
        }
        for (const subQ of g.questions || []) {
          if (subQ.audio_url && BROKEN_AUDIO_REPLACEMENTS[subQ.audio_url]) {
            subQ.audio_url = BROKEN_AUDIO_REPLACEMENTS[subQ.audio_url];
          }
        }
      }
    }
  }

  raw.updatedAt = new Date().toISOString();
  fs.writeFileSync(LISTENING_V1_PATH, JSON.stringify(raw, null, 2), 'utf8');
  console.log(`💾 Saved ${LISTENING_V1_PATH} with ${replacedCount} question replacements.`);
}

function remediateDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist, skipping: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.startsWith('study4_test_') && f.endsWith('.json'));
  console.log(`\n======================================================`);
  console.log(`2. REMEDIATING DIRECTORY: ${dirPath} (${files.length} files)`);
  console.log(`======================================================`);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    let modified = false;

    // Check Part 6 restoration for Test 7005
    if (file === 'study4_test_7005.json') {
      if (!data.parts) data.parts = {};
      const p6 = data.parts.part_6;
      if (!p6 || !p6.questions || p6.questions.length === 0) {
        console.log(`   ⚡ Restoring Part 6 in ${file} from Estudyme full test 6...`);
        const { questions, groups } = buildPart6FromEstudymeTest6();
        data.parts.part_6 = {
          part_num: 6,
          part_id: '19762',
          label: 'Part 6 (16 câu hỏi)',
          groups,
          questions,
        };
        modified = true;
        console.log(`      -> Restored Part 6 (${questions.length} questions, ${groups.length} groups)`);
      }
    }

    // Check broken audio replacements across all parts and groups
    if (data.parts) {
      for (const pKey of Object.keys(data.parts)) {
        const part = data.parts[pKey];
        if (!part) continue;

        for (const q of part.questions || []) {
          if (q.audio_url && BROKEN_AUDIO_REPLACEMENTS[q.audio_url]) {
            const oldUrl = q.audio_url;
            q.audio_url = BROKEN_AUDIO_REPLACEMENTS[oldUrl];
            modified = true;
            console.log(`   [${file} Q${q.qnum}] Replaced: ${oldUrl.split('/').pop()} -> ${q.audio_url.split('/').pop()}`);
          }
        }

        for (const g of part.groups || []) {
          if (g.audio_url && BROKEN_AUDIO_REPLACEMENTS[g.audio_url]) {
            g.audio_url = BROKEN_AUDIO_REPLACEMENTS[g.audio_url];
            modified = true;
          }
          for (const subQ of g.questions || []) {
            if (subQ.audio_url && BROKEN_AUDIO_REPLACEMENTS[subQ.audio_url]) {
              subQ.audio_url = BROKEN_AUDIO_REPLACEMENTS[subQ.audio_url];
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`💾 Saved updated ${file}`);
    }
  }
}

export function runRemediation() {
  remediateListeningV1();
  remediateDirectory(STUDY4_DATA_DIR);
  remediateDirectory(CRAWLERS_TOEIC_DIR);
  console.log(`\n🎉 REMEDIATION COMPLETE!`);
}

if (require.main === module) {
  runRemediation();
}
