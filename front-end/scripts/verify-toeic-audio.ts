/**
 * scripts/verify-toeic-audio.ts
 *
 * Milestone 1 Verification Suite:
 * Ensures 100% of questions Q32-Q70 (Part 3) and Q71-Q100 (Part 4)
 * have non-empty, playable audioUrls with zero phase shift across
 * all 20 tests in content-toeic-listening-v1.json, study4_data,
 * and ETS 2024 / 2026 datasets.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { loadFullToeicTest, loadEtsTest, groupQuestionsIntoStimulusGroups } from '../src/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '..');
const LISTENING_V1_PATH = path.join(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const STUDY4_DATA_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/study4_data');
const ETS_2024_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2024');
const ETS_2026_DIR = path.join(ROOT_DIR, 'src/data/toeic/datasets/ets_2026');

interface TestStats {
  passed: number;
  failed: number;
  failures: string[];
}

const stats: TestStats = {
  passed: 0,
  failed: 0,
  failures: [],
};

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    stats.passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    stats.failed++;
    const msg = `❌ [FAIL] ${testName}${failureDetail ? ` — ${failureDetail}` : ''}`;
    stats.failures.push(msg);
    console.error(`  ${msg}`);
  }
}

async function checkUrlReachable(rawUrl: string, maxRedirects = 3, retries = 2): Promise<number> {
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
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        (res) => {
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirects > 0) {
            const redirectUrl = new URL(res.headers.location, parsed).toString();
            resolve(checkUrlReachable(redirectUrl, maxRedirects - 1, retries));
          } else {
            resolve(code);
          }
        }
      );
      req.on('error', () => {
        if (retries > 0) {
          setTimeout(() => resolve(checkUrlReachable(rawUrl, maxRedirects, retries - 1)), 500);
        } else {
          resolve(0);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (retries > 0) {
          setTimeout(() => resolve(checkUrlReachable(rawUrl, maxRedirects, retries - 1)), 500);
        } else {
          resolve(408);
        }
      });
      req.end();
    } catch {
      resolve(0);
    }
  });
}

async function verifyListeningV1() {
  console.log(`\n================================================================`);
  console.log(`SUITE 1: Verifying content-toeic-listening-v1.json (20 Tests)`);
  console.log(`================================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));

  assert(raw.part3 && raw.part3.length === 20, 'Part 3 contains exactly 20 tests');
  assert(raw.part4 && raw.part4.length === 20, 'Part 4 contains exactly 20 tests');

  let totalP3Questions = 0;
  let totalP3WithAudio = 0;
  let totalP4Questions = 0;
  let totalP4WithAudio = 0;

  for (const t of raw.part3) {
    const tid = t.testId;
    const qs = t.questions || [];
    totalP3Questions += qs.length;

    assert(qs.length === 39, `[Test ${tid}] Part 3 has exactly 39 questions (Q32-Q70)`);

    // Verify each question has audio
    let p3AudioCount = 0;
    for (const q of qs) {
      if (q.audio_url && q.audio_url.trim().length > 0) {
        p3AudioCount++;
      }
    }
    totalP3WithAudio += p3AudioCount;
    assert(p3AudioCount === 39, `[Test ${tid}] Part 3 has 100% audio coverage (39/39 questions with audio)`);

    // Verify 1:3 cluster consistency & zero phase shift
    const clusterAudios: string[] = [];
    let clusterConsistency = true;
    let zeroPhaseShift = true;

    for (let cIdx = 0; cIdx < 13; cIdx++) {
      const q1 = qs[cIdx * 3];
      const q2 = qs[cIdx * 3 + 1];
      const q3 = qs[cIdx * 3 + 2];

      const startQ = 32 + cIdx * 3;
      const endQ = startQ + 2;

      if (!q1.audio_url || q1.audio_url !== q2.audio_url || q2.audio_url !== q3.audio_url) {
        clusterConsistency = false;
      }

      clusterAudios.push(q1.audio_url);

      // If Study4 CDN url, check filename contains expected question range
      if (q1.audio_url.includes('study4.com')) {
        const expectedPattern = `${startQ}-${endQ}`;
        if (!q1.audio_url.includes(expectedPattern)) {
          zeroPhaseShift = false;
        }
      }
    }

    const uniqueAudios = new Set(clusterAudios);
    assert(clusterConsistency, `[Test ${tid}] Part 3: All 13 clusters have identical audio for all 3 sibling questions`);
    assert(uniqueAudios.size === 13, `[Test ${tid}] Part 3: Exactly 13 unique audios for 13 dialogue clusters`);
    assert(zeroPhaseShift, `[Test ${tid}] Part 3: Zero phase shift (audios align with 32-34, 35-37, ..., 68-70)`);

    // Verify groups structure
    const groups = t.groups || [];
    assert(groups.length === 13, `[Test ${tid}] Part 3: Contains 13 groups`);
    if (groups.length === 13) {
      const allGroupsValid = groups.every(
        (g: any, idx: number) =>
          g.group_index === idx + 1 &&
          Boolean(g.audio_url) &&
          Array.isArray(g.questions) &&
          g.questions.length === 3
      );
      assert(allGroupsValid, `[Test ${tid}] Part 3: All 13 groups have valid index, audio_url, and 3 questions`);
    }
  }

  for (const t of raw.part4) {
    const tid = t.testId;
    const qs = t.questions || [];
    totalP4Questions += qs.length;

    assert(qs.length === 30, `[Test ${tid}] Part 4 has exactly 30 questions (Q71-Q100)`);

    let p4AudioCount = 0;
    for (const q of qs) {
      if (q.audio_url && q.audio_url.trim().length > 0) {
        p4AudioCount++;
      }
    }
    totalP4WithAudio += p4AudioCount;
    assert(p4AudioCount === 30, `[Test ${tid}] Part 4 has 100% audio coverage (30/30 questions with audio)`);

    // Verify 1:3 cluster consistency & zero phase shift
    const clusterAudios: string[] = [];
    let clusterConsistency = true;
    let zeroPhaseShift = true;

    for (let cIdx = 0; cIdx < 10; cIdx++) {
      const q1 = qs[cIdx * 3];
      const q2 = qs[cIdx * 3 + 1];
      const q3 = qs[cIdx * 3 + 2];

      const startQ = 71 + cIdx * 3;
      const endQ = startQ + 2;

      if (!q1.audio_url || q1.audio_url !== q2.audio_url || q2.audio_url !== q3.audio_url) {
        clusterConsistency = false;
      }

      clusterAudios.push(q1.audio_url);

      if (q1.audio_url.includes('study4.com')) {
        const expectedPattern = `${startQ}-${endQ}`;
        if (!q1.audio_url.includes(expectedPattern)) {
          zeroPhaseShift = false;
        }
      }
    }

    const uniqueAudios = new Set(clusterAudios);
    assert(clusterConsistency, `[Test ${tid}] Part 4: All 10 clusters have identical audio for all 3 sibling questions`);
    assert(uniqueAudios.size === 10, `[Test ${tid}] Part 4: Exactly 10 unique audios for 10 talk clusters`);
    assert(zeroPhaseShift, `[Test ${tid}] Part 4: Zero phase shift (audios align with 71-73, 74-76, ..., 98-100)`);

    const groups = t.groups || [];
    assert(groups.length === 10, `[Test ${tid}] Part 4: Contains 10 groups`);
    if (groups.length === 10) {
      const allGroupsValid = groups.every(
        (g: any, idx: number) =>
          g.group_index === idx + 1 &&
          Boolean(g.audio_url) &&
          Array.isArray(g.questions) &&
          g.questions.length === 3
      );
      assert(allGroupsValid, `[Test ${tid}] Part 4: All 10 groups have valid index, audio_url, and 3 questions`);
    }
  }

  assert(totalP3Questions === 780, `Total Part 3 questions across 20 tests = 780 (20 * 39)`);
  assert(totalP3WithAudio === 780, `Total Part 3 questions with audio across 20 tests = 780 / 780 (100.0%)`);
  assert(totalP4Questions === 600, `Total Part 4 questions across 20 tests = 600 (20 * 30)`);
  assert(totalP4WithAudio === 600, `Total Part 4 questions with audio across 20 tests = 600 / 600 (100.0%)`);
}

function verifyStudy4Data() {
  console.log(`\n================================================================`);
  console.log(`SUITE 2: Verifying study4_data Dataset Files (20 Tests)`);
  console.log(`================================================================`);

  const files = fs.readdirSync(STUDY4_DATA_DIR).filter((f) => f.startsWith('study4_test_') && f.endsWith('.json'));
  assert(files.length === 20, `study4_data contains exactly 20 test files`);

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(STUDY4_DATA_DIR, f), 'utf8'));
    const tid = data.test_id;
    const p3 = data.parts?.part_3;
    const p4 = data.parts?.part_4;

    assert(Boolean(p3 && p3.questions && p3.questions.length === 39), `[Study4 ${tid}] Part 3 has 39 questions`);
    assert(Boolean(p3 && p3.groups && p3.groups.length === 13), `[Study4 ${tid}] Part 3 has 13 groups`);

    const p3AllHaveAudio = p3?.questions?.every((q: any) => Boolean(q.audio_url && q.audio_url.trim()));
    assert(p3AllHaveAudio, `[Study4 ${tid}] Part 3 has 100% audio coverage`);

    assert(Boolean(p4 && p4.questions && p4.questions.length === 30), `[Study4 ${tid}] Part 4 has 30 questions`);
    assert(Boolean(p4 && p4.groups && p4.groups.length === 10), `[Study4 ${tid}] Part 4 has 10 groups`);

    const p4AllHaveAudio = p4?.questions?.every((q: any) => Boolean(q.audio_url && q.audio_url.trim()));
    assert(p4AllHaveAudio, `[Study4 ${tid}] Part 4 has 100% audio coverage`);
  }
}

function verifyEtsScannedDatasets() {
  console.log(`\n================================================================`);
  console.log(`SUITE 3: Verifying ETS 2024 & ETS 2026 Sibling Inheritance (20 Tests)`);
  console.log(`================================================================`);

  const tests = [
    { year: 2024, dir: ETS_2024_DIR },
    { year: 2026, dir: ETS_2026_DIR },
  ];

  let totalEtsP3Audio = 0;
  let totalEtsP4Audio = 0;

  for (const { year, dir } of tests) {
    for (let i = 1; i <= 10; i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      const f = path.join(dir, `ets_${year}_test_${num}.json`);
      assert(fs.existsSync(f), `File exists: ets_${year}_test_${num}.json`);

      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      const p3 = data.questions.filter((q: any) => q.part === 3);
      const p4 = data.questions.filter((q: any) => q.part === 4);

      assert(p3.length === 39, `[ETS ${year}-${num}] Part 3 has 39 questions`);
      assert(p4.length === 30, `[ETS ${year}-${num}] Part 4 has 30 questions`);

      const p3WithAudio = p3.filter((q: any) => Boolean(q.audioUrl && q.audioUrl.trim())).length;
      const p4WithAudio = p4.filter((q: any) => Boolean(q.audioUrl && q.audioUrl.trim())).length;

      totalEtsP3Audio += p3WithAudio;
      totalEtsP4Audio += p4WithAudio;

      assert(p3WithAudio === 39, `[ETS ${year}-${num}] Part 3 has 100% audio coverage (39/39)`);
      assert(p4WithAudio === 30, `[ETS ${year}-${num}] Part 4 has 100% audio coverage (30/30)`);
    }
  }

  assert(totalEtsP3Audio === 20 * 39, `All 20 ETS tests have 100% Part 3 audio (780 / 780)`);
  assert(totalEtsP4Audio === 20 * 30, `All 20 ETS tests have 100% Part 4 audio (600 / 600)`);

  // Explicit checks on previously broken questions
  console.log(`\nVerifying targeted sibling gap repairs:`);
  const t2024_09 = JSON.parse(fs.readFileSync(path.join(ETS_2024_DIR, 'ets_2024_test_09.json'), 'utf8'));
  const q2024_09_46 = t2024_09.questions.find((q: any) => q.questionNumber === 46);
  assert(Boolean(q2024_09_46?.audioUrl), `[Target Fix] 2024-09 Q46 has inherited audioUrl`);
  assert(Boolean(q2024_09_46?.imageUrl), `[Target Fix] 2024-09 Q46 has inherited imageUrl`);

  const t2026_06 = JSON.parse(fs.readFileSync(path.join(ETS_2026_DIR, 'ets_2026_test_06.json'), 'utf8'));
  const q2026_06_69 = t2026_06.questions.find((q: any) => q.questionNumber === 69);
  assert(Boolean(q2026_06_69?.audioUrl), `[Target Fix] 2026-06 Q69 has inherited audioUrl`);
  assert(Boolean(q2026_06_69?.imageUrl), `[Target Fix] 2026-06 Q69 has inherited imageUrl`);

  const t2026_07 = JSON.parse(fs.readFileSync(path.join(ETS_2026_DIR, 'ets_2026_test_07.json'), 'utf8'));
  const q2026_07_70 = t2026_07.questions.find((q: any) => q.questionNumber === 70);
  const q2026_07_73 = t2026_07.questions.find((q: any) => q.questionNumber === 73);
  assert(Boolean(q2026_07_70?.audioUrl), `[Target Fix] 2026-07 Q70 has inherited audioUrl`);
  assert(Boolean(q2026_07_70?.imageUrl), `[Target Fix] 2026-07 Q70 has inherited imageUrl`);
  assert(Boolean(q2026_07_73?.audioUrl), `[Target Fix] 2026-07 Q73 has inherited audioUrl`);
  assert(Boolean(q2026_07_73?.imageUrl), `[Target Fix] 2026-07 Q73 has inherited imageUrl`);

  const t2024_10 = JSON.parse(fs.readFileSync(path.join(ETS_2024_DIR, 'ets_2024_test_10.json'), 'utf8'));
  const q2024_10_58 = t2024_10.questions.find((q: any) => q.questionNumber === 58);
  assert(Boolean(q2024_10_58?.imageUrl), `[Target Fix] 2024-10 Q58 has inherited imageUrl`);
}

function verifyLoaderIntegration() {
  console.log(`\n================================================================`);
  console.log(`SUITE 4: Verifying Loader Integration via loadFullToeicTest & loadEtsTest`);
  console.log(`================================================================`);

  const study4TestIds = ['6852', '7000', '7005'];
  for (const tid of study4TestIds) {
    const questions = loadFullToeicTest(tid);
    assert(questions.length > 0, `[Loader] Study4 Test ${tid} loaded ${questions.length} questions`);

    const p3 = questions.filter((q) => q.part === 3);
    const p4 = questions.filter((q) => q.part === 4);

    assert(p3.length === 39, `[Loader ${tid}] Part 3 loaded 39 questions`);
    assert(p4.length === 30, `[Loader ${tid}] Part 4 loaded 30 questions`);

    const p3WithAudio = p3.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim())).length;
    const p4WithAudio = p4.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim())).length;

    assert(p3WithAudio === 39, `[Loader ${tid}] Part 3 has 100% audio coverage (39/39)`);
    assert(p4WithAudio === 30, `[Loader ${tid}] Part 4 has 100% audio coverage (30/30)`);

    const p3Unique = new Set(p3.map((q) => q.audioUrl).filter(Boolean));
    const p4Unique = new Set(p4.map((q) => q.audioUrl).filter(Boolean));
    assert(p3Unique.size === 13, `[Loader ${tid}] Part 3 has exactly 13 unique audios (no collapse)`);
    assert(p4Unique.size === 10, `[Loader ${tid}] Part 4 has exactly 10 unique audios (no collapse)`);

    const groups = groupQuestionsIntoStimulusGroups(questions);
    const p3Groups = groups.filter((g) => g.part === 3);
    const p4Groups = groups.filter((g) => g.part === 4);

    assert(p3Groups.length === 13, `[Loader ${tid}] Part 3 groups into exactly 13 clusters of 3`);
    assert(p4Groups.length === 10, `[Loader ${tid}] Part 4 groups into exactly 10 clusters of 3`);

    const p3All3 = p3Groups.every((g) => g.questions.length === 3);
    const p4All3 = p4Groups.every((g) => g.questions.length === 3);
    assert(p3All3, `[Loader ${tid}] Part 3: All 13 clusters have exactly 3 questions`);
    assert(p4All3, `[Loader ${tid}] Part 4: All 10 clusters have exactly 3 questions`);
  }

  const etsConfigs = [
    { year: '2024' as const, num: 1 },
    { year: '2024' as const, num: 9 },
    { year: '2026' as const, num: 6 },
    { year: '2026' as const, num: 7 },
  ];

  for (const { year, num } of etsConfigs) {
    const tid = `ets-${year}-${num < 10 ? '0' + num : num}`;
    const questions = loadEtsTest(year, num);
    assert(questions.length > 0, `[Loader] ETS Test ${tid} loaded ${questions.length} questions`);

    const p3 = questions.filter((q) => q.part === 3);
    const p4 = questions.filter((q) => q.part === 4);

    assert(p3.length === 39, `[Loader ${tid}] Part 3 loaded 39 questions`);
    assert(p4.length === 30, `[Loader ${tid}] Part 4 loaded 30 questions`);

    const p3WithAudio = p3.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim())).length;
    const p4WithAudio = p4.filter((q) => Boolean(q.audioUrl && q.audioUrl.trim())).length;

    assert(p3WithAudio === 39, `[Loader ${tid}] Part 3 has 100% audio coverage (39/39)`);
    assert(p4WithAudio === 30, `[Loader ${tid}] Part 4 has 100% audio coverage (30/30)`);

    const groups = groupQuestionsIntoStimulusGroups(questions);
    const p3Groups = groups.filter((g) => g.part === 3);
    const p4Groups = groups.filter((g) => g.part === 4);

    assert(p3Groups.length === 13, `[Loader ${tid}] Part 3 groups into exactly 13 clusters of 3`);
    assert(p4Groups.length === 10, `[Loader ${tid}] Part 4 groups into exactly 10 clusters of 3`);

    const p3All3 = p3Groups.every((g) => g.questions.length === 3);
    const p4All3 = p4Groups.every((g) => g.questions.length === 3);
    assert(p3All3, `[Loader ${tid}] Part 3: All 13 clusters have exactly 3 questions`);
    assert(p4All3, `[Loader ${tid}] Part 4: All 10 clusters have exactly 3 questions`);
  }
}

async function verifyAudioUrlsReachability() {
  console.log(`\n================================================================`);
  console.log(`SUITE 5: Full Audio Reachability Probe (All 460 Unique URLs via HTTP HEAD)`);
  console.log(`================================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));
  const uniqueUrlsSet = new Set<string>();

  for (const t of raw.part3) {
    for (const q of t.questions || []) {
      if (q.audio_url && q.audio_url.trim()) {
        uniqueUrlsSet.add(q.audio_url.trim());
      }
    }
  }

  for (const t of raw.part4) {
    for (const q of t.questions || []) {
      if (q.audio_url && q.audio_url.trim()) {
        uniqueUrlsSet.add(q.audio_url.trim());
      }
    }
  }

  const allUrls = Array.from(uniqueUrlsSet);
  console.log(`Found ${allUrls.length} unique audio URLs across all 20 tests to probe.`);
  assert(allUrls.length === 460, `Exactly 460 unique audio URLs across all 20 tests (260 Part 3 + 200 Part 4)`);

  const batchSize = 25;
  let brokenCount = 0;
  const brokenUrls: { url: string; status: number }[] = [];

  for (let i = 0; i < allUrls.length; i += batchSize) {
    const chunk = allUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      chunk.map(async (u) => ({ url: u, status: await checkUrlReachable(u) }))
    );

    for (const r of results) {
      if (r.status !== 200) {
        brokenCount++;
        brokenUrls.push(r);
      }
    }
  }

  assert(
    brokenCount === 0,
    `All 460 audio URLs return HTTP 200 (0 broken 404s)`,
    `Found ${brokenCount} broken URLs: ${JSON.stringify(brokenUrls.slice(0, 5))}`
  );
}

async function runAllVerification() {
  console.log(`Starting TOEIC Part 3 & Part 4 Audio Alignment Verification Suite...`);
  const startTime = Date.now();

  await verifyListeningV1();
  verifyStudy4Data();
  verifyEtsScannedDatasets();
  verifyLoaderIntegration();
  await verifyAudioUrlsReachability();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n================================================================`);
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`  Total Passed: ${stats.passed}`);
  console.log(`  Total Failed: ${stats.failed}`);
  console.log(`  Time Elapsed: ${elapsed}s`);
  console.log(`================================================================`);

  if (stats.failed > 0) {
    console.error(`\n❌ Verification completed with ${stats.failed} failures:`);
    stats.failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  } else {
    console.log(`\n✨ ALL ${stats.passed} VERIFICATION CHECKS PASSED WITH 0 DEFECTS!`);
    process.exit(0);
  }
}

if (require.main === module) {
  runAllVerification().catch((err) => {
    console.error('Unhandled verification error:', err);
    process.exit(1);
  });
}
