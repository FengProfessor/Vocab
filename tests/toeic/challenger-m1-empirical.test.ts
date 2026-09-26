/**
 * tests/toeic/challenger-m1-empirical.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 1
 * TOEIC Part 3 & Part 4 Audio & Graphic Data Alignment & Crawlers
 *
 * Mandate:
 * 1. 100% scan of all questions in content-toeic-listening-v1.json (all 20 tests).
 * 2. Verify Q32-Q70 and Q71-Q100 have strictly non-empty audioUrl.
 * 3. Verify strict 1:3 cluster grouping (e.g. Q32, Q33, Q34 share the exact same audioUrl).
 * 4. Sample 20 random audio URLs across different tests and verify they return HTTP 200 via network/HEAD requests.
 * 5. Verify that Q45..Q70 and Q81..Q100 do NOT have empty string audios.
 * 6. Adversarial verification: Test 7005 Part 3 recovery, ETS 2024/2026 sibling inheritance, crawler logic.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { loadFullToeicTest, loadEtsTest, groupQuestionsIntoStimulusGroups } from '../../src/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '../..');
const LISTENING_V1_PATH = path.join(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const STUDY4_DATA_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/study4_data');
const ETS_2024_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2024');
const ETS_2026_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2026');

interface Failure {
  suite: string;
  testName: string;
  detail: string;
}

const results = {
  passed: 0,
  failed: 0,
  failures: [] as Failure[],
};

function assert(condition: boolean, suite: string, testName: string, detail?: string) {
  if (condition) {
    results.passed++;
    console.log(`  ✅ [PASS] ${suite} > ${testName}`);
  } else {
    results.failed++;
    const failureMsg = detail || 'Assertion failed';
    results.failures.push({ suite, testName, detail: failureMsg });
    console.error(`  ❌ [FAIL] ${suite} > ${testName} — ${failureMsg}`);
  }
}

/**
 * Robust HEAD request helper supporting redirects up to maxRedirects=3
 */
async function fetchHeadStatusCode(rawUrl: string, maxRedirects = 3): Promise<{ status: number; contentType?: string }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(rawUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.request(
        parsed,
        {
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        (res) => {
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirects > 0) {
            const redirectUrl = new URL(res.headers.location, parsed).toString();
            resolve(fetchHeadStatusCode(redirectUrl, maxRedirects - 1));
          } else {
            resolve({ status: code, contentType: res.headers['content-type'] });
          }
        }
      );

      req.on('error', (err) => {
        resolve({ status: 0 });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 408 });
      });

      req.end();
    } catch {
      resolve({ status: 0 });
    }
  });
}

// ============================================================================
// SUITE 1: 100% SCAN OF content-toeic-listening-v1.json (20 TESTS)
// ============================================================================
async function runSuite1_ListeningV1Integrity() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 1: Empirical Scan of content-toeic-listening-v1.json (All 20 Tests)`);
  console.log(`====================================================================`);

  assert(fs.existsSync(LISTENING_V1_PATH), 'Suite 1', 'Listening v1 file exists on disk');
  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));

  assert(Array.isArray(raw.part3) && raw.part3.length === 20, 'Suite 1', 'Part 3 contains exactly 20 tests');
  assert(Array.isArray(raw.part4) && raw.part4.length === 20, 'Suite 1', 'Part 4 contains exactly 20 tests');

  let totalP3Questions = 0;
  let totalP3NonEmptyAudio = 0;
  let totalP3Q45to70Count = 0;
  let totalP3Q45to70WithAudio = 0;

  let totalP4Questions = 0;
  let totalP4NonEmptyAudio = 0;
  let totalP4Q81to100Count = 0;
  let totalP4Q81to100WithAudio = 0;

  // Track all valid audio URLs for random sampling
  const allAudioUrls: { testId: string; part: number; qNum: number; url: string }[] = [];

  // --- PART 3 SCAN ---
  for (const test of raw.part3) {
    const tid = test.testId;
    const questions = test.questions || [];
    totalP3Questions += questions.length;

    assert(questions.length === 39, 'Suite 1 (Part 3)', `Test ${tid} has exactly 39 questions (Q32-Q70)`);

    // Verify each question
    let testAudioCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = parseInt(q.qnum, 10);
      const audioUrl = (q.audio_url || '').trim();

      const hasAudio = audioUrl.length > 0 && audioUrl !== 'undefined' && audioUrl !== 'null';
      if (hasAudio) {
        testAudioCount++;
        totalP3NonEmptyAudio++;
        allAudioUrls.push({ testId: tid, part: 3, qNum, url: audioUrl });
      }

      // Check specifically Q45..Q70 (former empty zone)
      if (qNum >= 45 && qNum <= 70) {
        totalP3Q45to70Count++;
        if (hasAudio) {
          totalP3Q45to70WithAudio++;
        }
      }
    }

    assert(testAudioCount === 39, 'Suite 1 (Part 3)', `Test ${tid}: 100% questions have valid audio (39/39)`);

    // Verify 1:3 Cluster Grouping (13 clusters)
    let p3ClustersValid = true;
    let p3ZeroPhaseShift = true;
    const clusterAudios: string[] = [];

    for (let c = 0; c < 13; c++) {
      const q1 = questions[c * 3];
      const q2 = questions[c * 3 + 1];
      const q3 = questions[c * 3 + 2];

      const startQ = 32 + c * 3;
      const endQ = startQ + 2;

      const a1 = (q1?.audio_url || '').trim();
      const a2 = (q2?.audio_url || '').trim();
      const a3 = (q3?.audio_url || '').trim();

      if (!a1 || a1 !== a2 || a2 !== a3) {
        p3ClustersValid = false;
        console.error(`Discrepancy in Test ${tid} Part 3 Cluster ${c + 1} (Q${startQ}-Q${endQ}): a1='${a1}', a2='${a2}', a3='${a3}'`);
      }

      clusterAudios.push(a1);

      // Phase Shift Invariant: Study4 audio filenames contain e.g. "32-34_audio"
      if (a1.includes('study4.com')) {
        const expectedClusterPattern = `${startQ}-${endQ}`;
        if (!a1.includes(expectedClusterPattern)) {
          p3ZeroPhaseShift = false;
          console.error(`Phase shift detected in Test ${tid} Part 3 Cluster ${c + 1}: Expected '${expectedClusterPattern}' in URL '${a1}'`);
        }
      }
    }

    const uniqueAudios = new Set(clusterAudios);
    assert(p3ClustersValid, 'Suite 1 (Part 3)', `Test ${tid}: All 13 clusters share identical sibling audioUrl (1:3 cluster match)`);
    assert(uniqueAudios.size === 13, 'Suite 1 (Part 3)', `Test ${tid}: Exactly 13 unique dialogue audio files`);
    assert(p3ZeroPhaseShift, 'Suite 1 (Part 3)', `Test ${tid}: Zero audio phase shift (32-34, 35-37, ..., 68-70 aligned)`);

    // Groups check
    const groups = test.groups || [];
    assert(groups.length === 13, 'Suite 1 (Part 3)', `Test ${tid}: groups array has exactly 13 entries`);
    if (groups.length === 13) {
      const allGroupsValid = groups.every(
        (g: any, idx: number) =>
          g.group_index === idx + 1 &&
          Boolean(g.audio_url && g.audio_url.trim()) &&
          Array.isArray(g.questions) &&
          g.questions.length === 3
      );
      assert(allGroupsValid, 'Suite 1 (Part 3)', `Test ${tid}: All 13 groups have valid metadata and 3 child questions`);
    }
  }

  // --- PART 4 SCAN ---
  for (const test of raw.part4) {
    const tid = test.testId;
    const questions = test.questions || [];
    totalP4Questions += questions.length;

    assert(questions.length === 30, 'Suite 1 (Part 4)', `Test ${tid} has exactly 30 questions (Q71-Q100)`);

    let testAudioCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = parseInt(q.qnum, 10);
      const audioUrl = (q.audio_url || '').trim();

      const hasAudio = audioUrl.length > 0 && audioUrl !== 'undefined' && audioUrl !== 'null';
      if (hasAudio) {
        testAudioCount++;
        totalP4NonEmptyAudio++;
        allAudioUrls.push({ testId: tid, part: 4, qNum, url: audioUrl });
      }

      // Check specifically Q81..Q100 (former empty zone)
      if (qNum >= 81 && qNum <= 100) {
        totalP4Q81to100Count++;
        if (hasAudio) {
          totalP4Q81to100WithAudio++;
        }
      }
    }

    assert(testAudioCount === 30, 'Suite 1 (Part 4)', `Test ${tid}: 100% questions have valid audio (30/30)`);

    // Verify 1:3 Cluster Grouping (10 clusters)
    let p4ClustersValid = true;
    let p4ZeroPhaseShift = true;
    const clusterAudios: string[] = [];

    for (let c = 0; c < 10; c++) {
      const q1 = questions[c * 3];
      const q2 = questions[c * 3 + 1];
      const q3 = questions[c * 3 + 2];

      const startQ = 71 + c * 3;
      const endQ = startQ + 2;

      const a1 = (q1?.audio_url || '').trim();
      const a2 = (q2?.audio_url || '').trim();
      const a3 = (q3?.audio_url || '').trim();

      if (!a1 || a1 !== a2 || a2 !== a3) {
        p4ClustersValid = false;
        console.error(`Discrepancy in Test ${tid} Part 4 Cluster ${c + 1} (Q${startQ}-Q${endQ}): a1='${a1}', a2='${a2}', a3='${a3}'`);
      }

      clusterAudios.push(a1);

      if (a1.includes('study4.com')) {
        const expectedClusterPattern = `${startQ}-${endQ}`;
        if (!a1.includes(expectedClusterPattern)) {
          p4ZeroPhaseShift = false;
          console.error(`Phase shift detected in Test ${tid} Part 4 Cluster ${c + 1}: Expected '${expectedClusterPattern}' in URL '${a1}'`);
        }
      }
    }

    const uniqueAudios = new Set(clusterAudios);
    assert(p4ClustersValid, 'Suite 1 (Part 4)', `Test ${tid}: All 10 clusters share identical sibling audioUrl (1:3 cluster match)`);
    assert(uniqueAudios.size === 10, 'Suite 1 (Part 4)', `Test ${tid}: Exactly 10 unique talk audio files`);
    assert(p4ZeroPhaseShift, 'Suite 1 (Part 4)', `Test ${tid}: Zero audio phase shift (71-73, 74-76, ..., 98-100 aligned)`);

    const groups = test.groups || [];
    assert(groups.length === 10, 'Suite 1 (Part 4)', `Test ${tid}: groups array has exactly 10 entries`);
    if (groups.length === 10) {
      const allGroupsValid = groups.every(
        (g: any, idx: number) =>
          g.group_index === idx + 1 &&
          Boolean(g.audio_url && g.audio_url.trim()) &&
          Array.isArray(g.questions) &&
          g.questions.length === 3
      );
      assert(allGroupsValid, 'Suite 1 (Part 4)', `Test ${tid}: All 10 groups have valid metadata and 3 child questions`);
    }
  }

  // --- MACRO AGGREGATES ---
  assert(totalP3Questions === 780, 'Suite 1 Aggregate', `Part 3 total questions = 780 (20 * 39)`);
  assert(totalP3NonEmptyAudio === 780, 'Suite 1 Aggregate', `Part 3 non-empty audio questions = 780/780 (100.0%)`);
  assert(totalP3Q45to70Count === 20 * 26, 'Suite 1 Aggregate', `Part 3 Q45-Q70 questions scanned = 520 (20 * 26)`);
  assert(totalP3Q45to70WithAudio === 520, 'Suite 1 Aggregate', `Part 3 Q45-Q70 with non-empty audio = 520/520 (100.0%)`);

  assert(totalP4Questions === 600, 'Suite 1 Aggregate', `Part 4 total questions = 600 (20 * 30)`);
  assert(totalP4NonEmptyAudio === 600, 'Suite 1 Aggregate', `Part 4 non-empty audio questions = 600/600 (100.0%)`);
  assert(totalP4Q81to100Count === 20 * 20, 'Suite 1 Aggregate', `Part 4 Q81-Q100 questions scanned = 400 (20 * 20)`);
  assert(totalP4Q81to100WithAudio === 400, 'Suite 1 Aggregate', `Part 4 Q81-Q100 with non-empty audio = 400/400 (100.0%)`);

  return allAudioUrls;
}

// ============================================================================
// SUITE 2: TEST 7005 EDGE CASE DEEP AUDIT
// ============================================================================
function runSuite2_Test7005EdgeCase() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 2: Deep Verification of Test 7005 Part 3 Fallback & Restoration`);
  console.log(`====================================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));
  const test7005 = raw.part3.find((t: any) => t.testId === '7005');

  assert(Boolean(test7005), 'Suite 2', 'Test 7005 exists in Part 3');
  assert(test7005.questions.length === 39, 'Suite 2', `Test 7005 Part 3 has exactly 39 questions restored (was 0)`);
  assert(test7005.groups.length === 13, 'Suite 2', `Test 7005 Part 3 has exactly 13 groups restored (was 0)`);

  const q32 = test7005.questions.find((q: any) => q.qnum === '32');
  const q70 = test7005.questions.find((q: any) => q.qnum === '70');

  assert(Boolean(q32 && q32.audio_url), 'Suite 2', 'Test 7005 Q32 has valid audioUrl');
  assert(Boolean(q70 && q70.audio_url), 'Suite 2', 'Test 7005 Q70 has valid audioUrl');

  // Verify Estudyme GCS audio pattern used for fallback
  assert(q32.audio_url.includes('storage.googleapis.com/estudyme'), 'Suite 2', 'Test 7005 Q32 audio sourced from Estudyme GCS repository');

  // Verify study4_test_7005.json in study4_data
  const study4_7005_path = path.join(STUDY4_DATA_DIR, 'study4_test_7005.json');
  assert(fs.existsSync(study4_7005_path), 'Suite 2', 'study4_test_7005.json exists in study4_data');
  const s4_7005 = JSON.parse(fs.readFileSync(study4_7005_path, 'utf8'));
  assert(s4_7005.parts?.part_3?.questions?.length === 39, 'Suite 2', 'study4_test_7005.json part_3 has 39 questions');
  assert(s4_7005.parts?.part_3?.groups?.length === 13, 'Suite 2', 'study4_test_7005.json part_3 has 13 groups');
}

// ============================================================================
// SUITE 3: ETS 2024 & ETS 2026 SIBLING INHERITANCE VERIFICATION
// ============================================================================
function runSuite3_EtsSiblingInheritance() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 3: Verification of ETS 2024 & ETS 2026 Sibling Inheritance`);
  console.log(`====================================================================`);

  const tests = [
    { year: 2024, dir: ETS_2024_DIR },
    { year: 2026, dir: ETS_2026_DIR },
  ];

  let totalEtsP3Questions = 0;
  let totalEtsP3Audio = 0;
  let totalEtsP4Questions = 0;
  let totalEtsP4Audio = 0;

  for (const { year, dir } of tests) {
    for (let i = 1; i <= 10; i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      const f = path.join(dir, `ets_${year}_test_${num}.json`);
      assert(fs.existsSync(f), 'Suite 3', `File exists: ets_${year}_test_${num}.json`);

      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      const p3 = data.questions.filter((q: any) => q.part === 3);
      const p4 = data.questions.filter((q: any) => q.part === 4);

      assert(p3.length === 39, 'Suite 3', `[ETS ${year}-${num}] Part 3 has 39 questions`);
      assert(p4.length === 30, 'Suite 3', `[ETS ${year}-${num}] Part 4 has 30 questions`);

      const p3Audio = p3.filter((q: any) => Boolean(q.audioUrl && q.audioUrl.trim())).length;
      const p4Audio = p4.filter((q: any) => Boolean(q.audioUrl && q.audioUrl.trim())).length;

      totalEtsP3Questions += p3.length;
      totalEtsP3Audio += p3Audio;
      totalEtsP4Questions += p4.length;
      totalEtsP4Audio += p4Audio;

      assert(p3Audio === 39, 'Suite 3', `[ETS ${year}-${num}] Part 3 has 100% audio coverage (39/39)`);
      assert(p4Audio === 30, 'Suite 3', `[ETS ${year}-${num}] Part 4 has 100% audio coverage (30/30)`);
    }
  }

  assert(totalEtsP3Audio === 780, 'Suite 3', `Total ETS Part 3 audio coverage: 780 / 780 (100.0%)`);
  assert(totalEtsP4Audio === 600, 'Suite 3', `Total ETS Part 4 audio coverage: 600 / 600 (100.0%)`);

  // Specific sibling repairs
  const t2024_09 = JSON.parse(fs.readFileSync(path.join(ETS_2024_DIR, 'ets_2024_test_09.json'), 'utf8'));
  const q2024_09_46 = t2024_09.questions.find((q: any) => q.questionNumber === 46);
  assert(Boolean(q2024_09_46?.audioUrl), 'Suite 3 (Targeted)', '2024-09 Q46 has inherited audioUrl');
  assert(Boolean(q2024_09_46?.imageUrl), 'Suite 3 (Targeted)', '2024-09 Q46 has inherited imageUrl');

  const t2026_06 = JSON.parse(fs.readFileSync(path.join(ETS_2026_DIR, 'ets_2026_test_06.json'), 'utf8'));
  const q2026_06_69 = t2026_06.questions.find((q: any) => q.questionNumber === 69);
  assert(Boolean(q2026_06_69?.audioUrl), 'Suite 3 (Targeted)', '2026-06 Q69 has inherited audioUrl');
  assert(Boolean(q2026_06_69?.imageUrl), 'Suite 3 (Targeted)', '2026-06 Q69 has inherited imageUrl');

  const t2026_07 = JSON.parse(fs.readFileSync(path.join(ETS_2026_DIR, 'ets_2026_test_07.json'), 'utf8'));
  const q2026_07_70 = t2026_07.questions.find((q: any) => q.questionNumber === 70);
  const q2026_07_73 = t2026_07.questions.find((q: any) => q.questionNumber === 73);
  assert(Boolean(q2026_07_70?.audioUrl), 'Suite 3 (Targeted)', '2026-07 Q70 has inherited audioUrl');
  assert(Boolean(q2026_07_70?.imageUrl), 'Suite 3 (Targeted)', '2026-07 Q70 has inherited imageUrl');
  assert(Boolean(q2026_07_73?.audioUrl), 'Suite 3 (Targeted)', '2026-07 Q73 has inherited audioUrl');
  assert(Boolean(q2026_07_73?.imageUrl), 'Suite 3 (Targeted)', '2026-07 Q73 has inherited imageUrl');

  const t2024_10 = JSON.parse(fs.readFileSync(path.join(ETS_2024_DIR, 'ets_2024_test_10.json'), 'utf8'));
  const q2024_10_58 = t2024_10.questions.find((q: any) => q.questionNumber === 58);
  assert(Boolean(q2024_10_58?.imageUrl), 'Suite 3 (Targeted)', '2024-10 Q58 has inherited imageUrl');

  // Orphaned cluster fallbacks from Estudyme
  const q2024_09_92 = t2024_09.questions.find((q: any) => q.questionNumber === 92);
  assert(Boolean(q2024_09_92?.audioUrl), 'Suite 3 (Orphan)', '2024-09 Q92-94 has fallback audioUrl');

  const q2024_10_56 = t2024_10.questions.find((q: any) => q.questionNumber === 56);
  assert(Boolean(q2024_10_56?.audioUrl), 'Suite 3 (Orphan)', '2024-10 Q56-58 has fallback audioUrl');

  const t2026_04 = JSON.parse(fs.readFileSync(path.join(ETS_2026_DIR, 'ets_2026_test_04.json'), 'utf8'));
  const q2026_04_92 = t2026_04.questions.find((q: any) => q.questionNumber === 92);
  assert(Boolean(q2026_04_92?.audioUrl), 'Suite 3 (Orphan)', '2026-04 Q92-94 has fallback audioUrl');
}

// ============================================================================
// SUITE 4: CRAWLER SCRIPT ADVERSARIAL AUDIT
// ============================================================================
function runSuite4_CrawlerScriptAudit() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 4: Adversarial Audit of Crawler Source Code Invariants`);
  console.log(`====================================================================`);

  const crawlStudy4Path = path.join(ROOT_DIR, 'crawlers/toeic/crawl_study4.py');
  const crawlEtsPath = path.join(ROOT_DIR, 'crawlers/toeic/crawl_all_ets.py');

  assert(fs.existsSync(crawlStudy4Path), 'Suite 4', 'crawl_study4.py exists');
  assert(fs.existsSync(crawlEtsPath), 'Suite 4', 'crawl_all_ets.py exists');

  const study4PyContent = fs.readFileSync(crawlStudy4Path, 'utf8');
  const etsPyContent = fs.readFileSync(crawlEtsPath, 'utf8');

  // Verify that crawl_study4.py has 1:3 mapping
  assert(
    study4PyContent.includes('audio_idx = q_idx // 3'),
    'Suite 4',
    'crawl_study4.py implements integer division audio_idx = q_idx // 3 for Parts 3 & 4'
  );

  assert(
    study4PyContent.includes('part_data["groups"].append'),
    'Suite 4',
    'crawl_study4.py appends 3-question clusters into part_data["groups"]'
  );

  // Verify that crawl_all_ets.py has sibling inheritance pass
  assert(
    etsPyContent.includes('Sibling inheritance pass for Part 3'),
    'Suite 4',
    'crawl_all_ets.py documents and implements sibling inheritance pass'
  );

  assert(
    etsPyContent.includes('shared_audio = next((q[\'audioUrl\'] for q in cluster if q.get(\'audioUrl\')), None)'),
    'Suite 4',
    'crawl_all_ets.py inherits audioUrl across cluster siblings'
  );

  assert(
    etsPyContent.includes('shared_image = next((q[\'imageUrl\'] for q in cluster if q.get(\'imageUrl\')), None)'),
    'Suite 4',
    'crawl_all_ets.py inherits imageUrl across cluster siblings'
  );
}

// ============================================================================
// SUITE 5: EMPIRICAL NETWORK HEAD VERIFICATION (20 RANDOM AUDIO URLS)
// ============================================================================
async function runSuite5_NetworkHeadVerification(allAudioUrls: { testId: string; part: number; qNum: number; url: string }[]) {
  console.log(`\n====================================================================`);
  console.log(`SUITE 5: Empirical Network Verification (20 Random Audio URLs via HTTP HEAD)`);
  console.log(`====================================================================`);

  assert(allAudioUrls.length >= 20, 'Suite 5', `Available audio URLs pool is large enough (${allAudioUrls.length} >= 20)`);

  // Deterministic seed / pseudo-random sampling across diverse tests
  const sampledUrls: { testId: string; part: number; qNum: number; url: string }[] = [];
  const testIds = Array.from(new Set(allAudioUrls.map((a) => a.testId)));

  // Pick 1 from each test to get 20 diverse samples across all 20 tests
  for (let i = 0; i < testIds.length && sampledUrls.length < 20; i++) {
    const tid = testIds[i];
    const forThisTest = allAudioUrls.filter((a) => a.testId === tid);
    // Pick varying positions (alternating Part 3 and Part 4)
    const pickPart = i % 2 === 0 ? 3 : 4;
    const candidates = forThisTest.filter((a) => a.part === pickPart);
    const chosen = candidates.length > 0 ? candidates[i % candidates.length] : forThisTest[0];
    if (chosen && !sampledUrls.some((s) => s.url === chosen.url)) {
      sampledUrls.push(chosen);
    }
  }

  // If still under 20, fill with unique URLs
  let idx = 0;
  while (sampledUrls.length < 20 && idx < allAudioUrls.length) {
    if (!sampledUrls.some((s) => s.url === allAudioUrls[idx].url)) {
      sampledUrls.push(allAudioUrls[idx]);
    }
    idx++;
  }

  console.log(`Sampled ${sampledUrls.length} unique audio URLs across ${testIds.length} tests for network probe:`);

  for (let i = 0; i < sampledUrls.length; i++) {
    const item = sampledUrls[i];
    const { status, contentType } = await fetchHeadStatusCode(item.url);
    const pass = status === 200;
    assert(
      pass,
      'Suite 5',
      `Sample #${i + 1} [Test ${item.testId} P${item.part} Q${item.qNum}]: HTTP ${status} (type: ${contentType || 'unknown'})`,
      `URL: ${item.url}`
    );
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runChallengerM1Suite() {
  console.log(`\n********************************************************************`);
  console.log(`*  CHALLENGER 1: EMPIRICAL ADVERSARIAL VERIFICATION SUITE         *`);
  console.log(`*  Target: TOEIC Part 3 & 4 Audio & Graphic Alignment (Milestone 1) *`);
  console.log(`********************************************************************`);

  const startTime = Date.now();

  const allAudioUrls = await runSuite1_ListeningV1Integrity();
  runSuite2_Test7005EdgeCase();
  runSuite3_EtsSiblingInheritance();
  runSuite4_CrawlerScriptAudit();
  await runSuite5_NetworkHeadVerification(allAudioUrls);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n====================================================================`);
  console.log(`CHALLENGER EMPIRICAL VERIFICATION RESULTS:`);
  console.log(`  Passed Checks : ${results.passed}`);
  console.log(`  Failed Checks : ${results.failed}`);
  console.log(`  Execution Time: ${durationSec}s`);
  console.log(`====================================================================`);

  if (results.failed > 0) {
    console.error(`\n❌ VERDICT: REQUEST_CHANGES — Found ${results.failed} failing checks:`);
    results.failures.forEach((f) => console.error(`  - [${f.suite}] ${f.testName}: ${f.detail}`));
    process.exit(1);
  } else {
    console.log(`\n🎉 VERDICT: APPROVE — 100% of empirical checks passed with 0 defects.`);
    process.exit(0);
  }
}

runChallengerM1Suite().catch((err) => {
  console.error('Fatal crash during challenger suite execution:', err);
  process.exit(1);
});
