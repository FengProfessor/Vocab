/**
 * Empirical Adversarial Stress Test Suite — Milestone M1: VSTEP Data Ingestion & Dynamic Loader
 * Challenger: Challenger M1 1 (critic, specialist)
 * Target: All 23 Full Mock exams, all 56 Listening practice tests, 20 Reading practice tests,
 *         VSTEP Catalog Index, Active Cyber Defense (Zero Bulk Leaks), and Dynamic Loader Resilience.
 *
 * Execution:
 *   npx tsx tests/vstep/challenger-m1-empirical-stress.test.ts
 */

import https from 'node:https';
import {
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepExamForClient,
  getVstepCatalogIndex,
  getVstepCatalog,
  clearVstepExamCache,
  getVstepQuestionExplanation,
  resolveExamFilePath,
} from '../../src/lib/vstep-test-loader';
import { VstepExam, VstepTask, VstepQuestion } from '../../src/lib/vstep-types';

interface StressStats {
  suite: string;
  assertions: number;
  passed: number;
  failed: number;
  errors: string[];
}

const stats: StressStats[] = [];
let currentSuite: StressStats = {
  suite: 'Default',
  assertions: 0,
  passed: 0,
  failed: 0,
  errors: [],
};

function beginSuite(name: string) {
  currentSuite = {
    suite: name,
    assertions: 0,
    passed: 0,
    failed: 0,
    errors: [],
  };
  stats.push(currentSuite);
  console.log(`\n================================================================================`);
  console.log(`▶ SUITE: ${name}`);
  console.log(`================================================================================`);
}

function assert(condition: boolean, message: string, detail?: unknown) {
  currentSuite.assertions++;
  if (condition) {
    currentSuite.passed++;
  } else {
    currentSuite.failed++;
    const err = `[FAIL] ${message}${detail ? ' -> ' + JSON.stringify(detail) : ''}`;
    currentSuite.errors.push(err);
    console.error(`  ❌ ${err}`);
  }
}

/**
 * Probe an audio URL via HTTPS HEAD request to verify reachability and content type.
 */
function probeAudioUrl(url: string): Promise<{ statusCode: number; contentType: string; contentLength: number }> {
  return new Promise((resolve, reject) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve({
          statusCode: res.statusCode || 0,
          contentType: (res.headers['content-type'] as string) || '',
          contentLength: parseInt((res.headers['content-length'] as string) || '0', 10),
        });
      });
      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HEAD request timed out'));
      });
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function runStressTest() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  CHALLENGER M1: EMPIRICAL STRESS TEST & ADVERSARIAL AUDIT FOR VSTEP DATA    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: 23 Full Mock Exams Empirical Invariants
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 1: 23 Full Mock Exams Empirical Structure & Question Count Invariants');

  let totalMockListeningQuestions = 0;
  let totalMockReadingQuestions = 0;
  let totalMockWritingTasks = 0;
  let totalMockSpeakingTasks = 0;
  let totalMockMCQs = 0;

  for (let i = 1; i <= 23; i++) {
    const numStr = String(i).padStart(2, '0');
    const examId = `vstep-exam-${numStr}`;
    const mockId = `vstep-mock-${numStr}`;

    // Test loadRawVstepExam with canonical and alias IDs
    const exam = loadRawVstepExam(examId);
    assert(exam !== null, `Exam ${examId} loads successfully from filesystem`);
    if (!exam) continue;

    const mockExam = loadRawVstepExam(mockId);
    assert(mockExam !== null, `Exam alias ${mockId} loads successfully via normalizer`);

    // Invariant: Duration is 172 minutes (40 + 60 + 60 + 12)
    assert(exam.duration === 172, `Exam ${examId} duration must be 172 min`, { duration: exam.duration });

    // Invariant: Exactly 4 sections
    assert(
      Array.isArray(exam.sections) && exam.sections.length === 4,
      `Exam ${examId} must have exactly 4 sections`,
      { sectionCount: exam.sections?.length }
    );

    const sectionTypes = exam.sections.map((s) => s.type);
    assert(
      sectionTypes.includes('listening') &&
        sectionTypes.includes('reading') &&
        sectionTypes.includes('writing') &&
        sectionTypes.includes('speaking'),
      `Exam ${examId} must contain all 4 skill sections (listening, reading, writing, speaking)`,
      { sectionTypes }
    );

    // Section 1: Listening
    const listeningSec = exam.sections.find((s) => s.type === 'listening');
    assert(listeningSec !== undefined, `Exam ${examId} has listening section`);
    if (listeningSec) {
      assert(listeningSec.timeLimit === 40, `Exam ${examId} listening timeLimit is 40 min`);
      assert(listeningSec.tasks.length === 3, `Exam ${examId} listening has exactly 3 parts/tasks`);

      let listeningQs = 0;
      for (const [tIdx, task] of listeningSec.tasks.entries()) {
        const qCount = task.questions?.length || 0;
        listeningQs += qCount;

        // Part 1 = 8 questions, Part 2 = 12 questions, Part 3 = 15 questions
        const expectedQs = tIdx === 0 ? 8 : tIdx === 1 ? 12 : 15;
        assert(
          qCount === expectedQs,
          `Exam ${examId} listening task ${tIdx + 1} has ${expectedQs} questions (found ${qCount})`
        );

        // Audio URL verification
        assert(
          typeof task.media?.audio === 'string' &&
            task.media.audio.startsWith('https://r2tadr.oucommunity.dev/') &&
            task.media.audio.endsWith('.mp3'),
          `Exam ${examId} listening task ${tIdx + 1} has valid Cloudflare R2 audio URL`,
          { audio: task.media?.audio }
        );

        // Tapescript verification
        assert(
          typeof task.tapescript === 'string' && task.tapescript.length > 50,
          `Exam ${examId} listening task ${tIdx + 1} has rich HTML tapescript`
        );

        // Individual question validation
        if (task.questions) {
          for (const q of task.questions) {
            assert(
              typeof q.id === 'string' && q.id.length > 0,
              `Question ${q.id} in ${examId} listening has valid ID`
            );
            assert(q.type === 'mcq', `Question ${q.id} in ${examId} has type 'mcq'`);
            assert(
              typeof q.question === 'string' && q.question.trim().length > 0,
              `Question ${q.id} in ${examId} has non-empty question prompt`
            );
            assert(
              Array.isArray(q.options) &&
                q.options.length === 4 &&
                q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0),
              `Question ${q.id} in ${examId} has exactly 4 non-empty options`,
              { options: q.options }
            );
            assert(
              typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3,
              `Question ${q.id} in ${examId} has answer index between 0 and 3`,
              { answer: q.answer }
            );
          }
        }
      }

      assert(listeningQs === 35, `Exam ${examId} listening has exactly 35 questions total`, { listeningQs });
      totalMockListeningQuestions += listeningQs;
    }

    // Section 2: Reading
    const readingSec = exam.sections.find((s) => s.type === 'reading');
    assert(readingSec !== undefined, `Exam ${examId} has reading section`);
    if (readingSec) {
      assert(readingSec.timeLimit === 60, `Exam ${examId} reading timeLimit is 60 min`);
      assert(readingSec.tasks.length === 4, `Exam ${examId} reading has exactly 4 passages`);

      let readingQs = 0;
      for (const [pIdx, task] of readingSec.tasks.entries()) {
        const qCount = task.questions?.length || 0;
        readingQs += qCount;

        assert(qCount === 10, `Exam ${examId} passage ${pIdx + 1} has exactly 10 questions (found ${qCount})`);
        const passageText = typeof task.passage === 'string' ? task.passage : task.passage?.text;
        assert(
          typeof passageText === 'string' && passageText.length > 200,
          `Exam ${examId} passage ${pIdx + 1} has non-empty text passage (>200 chars)`
        );
        assert(
          typeof task.suggestion === 'string' && task.suggestion.length > 50,
          `Exam ${examId} passage ${pIdx + 1} has tactical suggestion`
        );

        if (task.questions) {
          for (const q of task.questions) {
            assert(
              typeof q.id === 'string' && q.id.length > 0,
              `Question ${q.id} in ${examId} reading has valid ID`
            );
            assert(q.type === 'mcq', `Question ${q.id} in ${examId} reading has type 'mcq'`);
            assert(
              typeof q.question === 'string' && q.question.trim().length > 0,
              `Question ${q.id} in ${examId} reading has non-empty question prompt`
            );
            assert(
              Array.isArray(q.options) &&
                q.options.length === 4 &&
                q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0),
              `Question ${q.id} in ${examId} reading has exactly 4 non-empty options`,
              { options: q.options }
            );
            assert(
              typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3,
              `Question ${q.id} in ${examId} reading has answer index between 0 and 3`,
              { answer: q.answer }
            );
          }
        }
      }

      assert(readingQs === 40, `Exam ${examId} reading has exactly 40 questions total`, { readingQs });
      totalMockReadingQuestions += readingQs;
    }

    // Section 3: Writing
    const writingSec = exam.sections.find((s) => s.type === 'writing');
    assert(writingSec !== undefined, `Exam ${examId} has writing section`);
    if (writingSec) {
      assert(writingSec.timeLimit === 60, `Exam ${examId} writing timeLimit is 60 min`);
      assert(writingSec.tasks.length === 2, `Exam ${examId} writing has exactly 2 tasks`);
      for (const [wIdx, task] of writingSec.tasks.entries()) {
        assert(
          typeof task.instructions === 'string' && task.instructions.length > 20,
          `Exam ${examId} writing task ${wIdx + 1} has instructions`
        );
      }
      totalMockWritingTasks += writingSec.tasks.length;
    }

    // Section 4: Speaking
    const speakingSec = exam.sections.find((s) => s.type === 'speaking');
    assert(speakingSec !== undefined, `Exam ${examId} has speaking section`);
    if (speakingSec) {
      assert(speakingSec.timeLimit === 12, `Exam ${examId} speaking timeLimit is 12 min`);
      assert(speakingSec.tasks.length === 3, `Exam ${examId} speaking has exactly 3 tasks`);
      for (const [sIdx, task] of speakingSec.tasks.entries()) {
        assert(
          typeof task.instructions === 'string' && task.instructions.length > 10,
          `Exam ${examId} speaking task ${sIdx + 1} has instructions`
        );
      }
      totalMockSpeakingTasks += speakingSec.tasks.length;
    }

    totalMockMCQs += (listeningSec?.totalQuestions || 0) + (readingSec?.totalQuestions || 0);
  }

  assert(totalMockListeningQuestions === 23 * 35, 'Total mock listening questions is exactly 805 (23 * 35)', {
    totalMockListeningQuestions,
  });
  assert(totalMockReadingQuestions === 23 * 40, 'Total mock reading questions is exactly 920 (23 * 40)', {
    totalMockReadingQuestions,
  });
  assert(totalMockWritingTasks === 23 * 2, 'Total mock writing tasks is exactly 46 (23 * 2)', {
    totalMockWritingTasks,
  });
  assert(totalMockSpeakingTasks === 23 * 3, 'Total mock speaking tasks is exactly 69 (23 * 3)', {
    totalMockSpeakingTasks,
  });
  assert(totalMockMCQs === 23 * 75, 'Total mock MCQ questions is exactly 1,725 (23 * 75)', { totalMockMCQs });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: 56 Listening Practice Tests Empirical Invariants
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 2: 56 Listening Practice Tests Question Count & Audio URL Invariants');

  let totalPracticeListeningQuestions = 0;
  let totalPracticeListeningAudioUrls = 0;
  const audioUrlSet = new Set<string>();

  for (let j = 1; j <= 56; j++) {
    const numStr = String(j).padStart(2, '0');
    const testId = `vstep-listening-${numStr}`;

    const test = loadRawVstepExam(testId);
    assert(test !== null, `Listening test ${testId} loads successfully from filesystem`);
    if (!test) continue;

    assert(test.sections.length === 1, `Listening test ${testId} has exactly 1 section`);
    const sec = test.sections[0];
    assert(sec.type === 'listening', `Listening test ${testId} section type is 'listening'`);
    assert(sec.tasks.length === 3, `Listening test ${testId} has exactly 3 parts`);

    let testQCount = 0;
    for (const [tIdx, task] of sec.tasks.entries()) {
      const qCount = task.questions?.length || 0;
      testQCount += qCount;

      const expectedQs = tIdx === 0 ? 8 : tIdx === 1 ? 12 : 15;
      assert(
        qCount === expectedQs,
        `Listening test ${testId} part ${tIdx + 1} has ${expectedQs} questions (found ${qCount})`
      );

      // Verify Cloudflare R2 audio URL
      const audioUrl = task.media?.audio;
      assert(
        typeof audioUrl === 'string' &&
          audioUrl.startsWith('https://r2tadr.oucommunity.dev/') &&
          audioUrl.endsWith('.mp3'),
        `Listening test ${testId} part ${tIdx + 1} has valid Cloudflare R2 audio URL`,
        { audioUrl }
      );

      if (audioUrl) {
        totalPracticeListeningAudioUrls++;
        audioUrlSet.add(audioUrl);
      }

      // Verify Tapescript
      assert(
        typeof task.tapescript === 'string' && task.tapescript.length > 50,
        `Listening test ${testId} part ${tIdx + 1} has complete HTML tapescript`
      );

      // Verify each question
      if (task.questions) {
        for (const q of task.questions) {
          assert(
            typeof q.id === 'string' && q.id.length > 0,
            `Question ${q.id} in ${testId} has non-empty ID`
          );
          assert(q.type === 'mcq', `Question ${q.id} in ${testId} has type 'mcq'`);
          assert(
            typeof q.question === 'string' && q.question.trim().length > 0,
            `Question ${q.id} in ${testId} has non-empty question prompt`
          );
          assert(
            Array.isArray(q.options) &&
              q.options.length === 4 &&
              q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0),
            `Question ${q.id} in ${testId} has exactly 4 non-empty options`,
            { options: q.options }
          );
          assert(
            typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3,
            `Question ${q.id} in ${testId} has answer index between 0 and 3`,
            { answer: q.answer }
          );
        }
      }
    }

    assert(testQCount === 35, `Listening test ${testId} has exactly 35 questions total`, { testQCount });
    totalPracticeListeningQuestions += testQCount;
  }

  assert(
    totalPracticeListeningQuestions === 56 * 35,
    'Total practice listening questions is exactly 1,960 (56 * 35)',
    { totalPracticeListeningQuestions }
  );
  assert(
    totalPracticeListeningAudioUrls === 56 * 3,
    'Total audio URLs across 56 practice tests is exactly 168 (56 * 3)',
    { totalPracticeListeningAudioUrls }
  );
  assert(
    audioUrlSet.size === 56 * 3,
    'All 168 audio URLs across 56 practice tests are distinct and unique',
    { uniqueUrls: audioUrlSet.size }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: 20 Reading Practice Tests Empirical Invariants
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 3: 20 Reading Practice Tests Question Count & Passage Invariants');

  let totalPracticeReadingQuestions = 0;

  for (let k = 1; k <= 20; k++) {
    const numStr = String(k).padStart(2, '0');
    const testId = `vstep-reading-${numStr}`;

    const test = loadRawVstepExam(testId);
    assert(test !== null, `Reading test ${testId} loads successfully from filesystem`);
    if (!test) continue;

    assert(test.sections.length === 1, `Reading test ${testId} has exactly 1 section`);
    const sec = test.sections[0];
    assert(sec.type === 'reading', `Reading test ${testId} section type is 'reading'`);
    assert(sec.tasks.length === 4, `Reading test ${testId} has exactly 4 passages`);

    let testQCount = 0;
    for (const [pIdx, task] of sec.tasks.entries()) {
      const qCount = task.questions?.length || 0;
      testQCount += qCount;

      assert(
        qCount === 10,
        `Reading test ${testId} passage ${pIdx + 1} has exactly 10 questions (found ${qCount})`
      );
      const passageText = typeof task.passage === 'string' ? task.passage : task.passage?.text;
      assert(
        typeof passageText === 'string' && passageText.length > 200,
        `Reading test ${testId} passage ${pIdx + 1} has substantial passage text (>200 chars)`
      );
      assert(
        typeof task.suggestion === 'string' && task.suggestion.length > 50,
        `Reading test ${testId} passage ${pIdx + 1} has Vietnamese tactical suggestions`
      );

      if (task.questions) {
        for (const q of task.questions) {
          assert(
            Array.isArray(q.options) &&
              q.options.length === 4 &&
              q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0),
            `Question ${q.id} in ${testId} has 4 valid options`
          );
          assert(
            typeof q.answer === 'number' && q.answer >= 0 && q.answer <= 3,
            `Question ${q.id} in ${testId} has valid answer index`
          );
        }
      }
    }

    assert(testQCount === 40, `Reading test ${testId} has exactly 40 questions total`, { testQCount });
    totalPracticeReadingQuestions += testQCount;
  }

  assert(
    totalPracticeReadingQuestions === 20 * 40,
    'Total practice reading questions is exactly 800 (20 * 40)',
    { totalPracticeReadingQuestions }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: Catalog Index Integrity & Referential Integrity (99 Items)
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 4: VSTEP Catalog Index & Referential Integrity (99 Items)');

  const catalog = getVstepCatalog();
  const catalogIndex = getVstepCatalogIndex();

  assert(catalog.totalExams === 23, 'Catalog totalExams is 23', { totalExams: catalog.totalExams });
  assert(catalog.totalPracticeSets === 76, 'Catalog totalPracticeSets is 76 (56 + 20)', {
    totalPracticeSets: catalog.totalPracticeSets,
  });
  assert(
    Array.isArray(catalog.items) && catalog.items.length === 99,
    'Catalog items array contains exactly 99 items (23 + 56 + 20)',
    { itemCount: catalog.items?.length }
  );
  assert(
    catalog.items.length === catalogIndex.items.length,
    'getVstepCatalogIndex() and getVstepCatalog() return identical item counts'
  );

  const fullMockItems = catalog.items.filter((i) => i.category === 'full_mock');
  const listeningItems = catalog.items.filter((i) => i.category === 'listening');
  const readingItems = catalog.items.filter((i) => i.category === 'reading');

  assert(fullMockItems.length === 23, 'Catalog has exactly 23 full_mock items', {
    count: fullMockItems.length,
  });
  assert(listeningItems.length === 56, 'Catalog has exactly 56 listening items', {
    count: listeningItems.length,
  });
  assert(readingItems.length === 20, 'Catalog has exactly 20 reading items', {
    count: readingItems.length,
  });

  // Referential integrity: every catalog item must load from disk
  for (const item of catalog.items) {
    const rawExam = loadRawVstepExam(item.id);
    assert(rawExam !== null, `Catalog item ${item.id} resolves and loads non-null exam from disk`);
    if (rawExam) {
      if (item.category === 'full_mock') {
        assert(item.totalQuestions === 75, `Item ${item.id} catalog totalQuestions is 75`);
        assert(item.duration === 172, `Item ${item.id} duration is 172`);
      } else if (item.category === 'listening') {
        assert(item.totalQuestions === 35, `Item ${item.id} catalog totalQuestions is 35`);
        assert(item.duration === 40, `Item ${item.id} duration is 40`);
      } else if (item.category === 'reading') {
        assert(item.totalQuestions === 40, `Item ${item.id} catalog totalQuestions is 40`);
        assert(item.duration === 60, `Item ${item.id} duration is 60`);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: Active Cyber Defense & Zero-Bulk-Leak Verification
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 5: Active Cyber Defense & Zero-Bulk-Leak Verification');

  // Verify across all 23 mock exams that client-facing load strips sensitive data
  for (let i = 1; i <= 23; i++) {
    const numStr = String(i).padStart(2, '0');
    const examId = `vstep-exam-${numStr}`;

    const safeExam = loadVstepExamSafe(examId);
    assert(safeExam !== null, `Safe exam ${examId} loads non-null`);
    if (!safeExam) continue;

    for (const sec of safeExam.sections) {
      for (const task of sec.tasks) {
        assert(task.tapescript === undefined, `Safe exam ${examId} stripped task tapescript`);
        assert(task.suggestion === undefined, `Safe exam ${examId} stripped task suggestion`);

        if (task.questions) {
          for (const q of task.questions) {
            assert(
              (q as any).answer === undefined,
              `Zero-Bulk-Leak: Question ${q.id} in ${examId} has no 'answer' property`
            );
            assert(
              (q as any).explanationVi === undefined,
              `Zero-Bulk-Leak: Question ${q.id} in ${examId} has no 'explanationVi' property`
            );
          }
        }
      }
    }
  }

  // Test loadVstepExamForClient session token & defense
  const clientPayload = loadVstepExamForClient('vstep-mock-01', '192.168.1.100');
  assert(clientPayload !== null, 'loadVstepExamForClient returns non-null payload');
  if (clientPayload) {
    assert(typeof clientPayload.sessionToken === 'string', 'Session token is a string');
    assert(clientPayload.sessionToken.length > 20, 'Session token is non-empty');
    assert(
      (clientPayload.exam.sections[0].tasks[0].questions![0] as any).answer === undefined,
      'Client exam has zero leaked answers'
    );
  }

  // Test on-demand single question explanation
  const explainL1Q1 = getVstepQuestionExplanation('vstep-mock-01', 'L1Q1');
  assert(explainL1Q1 !== null, 'On-demand explain returns non-null for valid question L1Q1');
  if (explainL1Q1) {
    assert(typeof explainL1Q1.answer === 'number', 'On-demand explain contains correct answer');
    assert(typeof explainL1Q1.tapescript === 'string', 'On-demand explain contains tapescript');
  }

  // Test on-demand explain for non-existent question
  const explainInvalid = getVstepQuestionExplanation('vstep-mock-01', 'NON_EXISTENT_Q');
  assert(explainInvalid === null, 'On-demand explain returns null for non-existent question');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 6: Dynamic Loader Resilience, Cache Invariants & Edge Cases
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 6: Dynamic Loader Resilience, Cache Invariants & Edge Cases');

  // Cache test
  clearVstepExamCache();
  const coldStart = Date.now();
  const examCold = loadRawVstepExam('vstep-mock-02');
  const coldDuration = Date.now() - coldStart;

  const hotStart = Date.now();
  const examHot = loadRawVstepExam('vstep-mock-02');
  const hotDuration = Date.now() - hotStart;

  assert(examCold !== null && examHot !== null, 'Both cold and hot loads return valid exam');
  assert(hotDuration <= coldDuration + 5, 'Cached hot load is fast (<= coldDuration + 5ms)', {
    coldDuration,
    hotDuration,
  });

  // Immutability: Mutating loaded object must NOT corrupt cache
  if (examHot) {
    const originalTitle = examHot.title;
    examHot.title = 'CORRUPTED_TITLE_BY_CHALLENGER';
    const examReloaded = loadRawVstepExam('vstep-mock-02');
    assert(
      examReloaded?.title === originalTitle,
      'Cache immutability: mutating loaded exam object does not corrupt cached exam',
      { originalTitle, reloadedTitle: examReloaded?.title }
    );
  }

  // Case-insensitivity & normalization
  const caseTest1 = loadRawVstepExam('VSTEP-EXAM-03');
  const caseTest2 = loadRawVstepExam('vstep-MOCK-03');
  const caseTest3 = loadRawVstepExam('vstep-exam-3');
  assert(caseTest1 !== null, 'Uppercase VSTEP-EXAM-03 resolves successfully');
  assert(caseTest2 !== null, 'Mixed case vstep-MOCK-03 resolves successfully');
  assert(caseTest3 !== null, 'Single digit vstep-exam-3 resolves successfully to vstep-exam-03');

  // Invalid IDs and path traversal protection
  const invalid1 = loadRawVstepExam('../../package.json');
  const invalid2 = loadRawVstepExam('vstep-mock-999');
  const invalid3 = loadRawVstepExam('"><script>alert(1)</script>');
  const invalid4 = loadRawVstepExam('');
  const invalid5 = loadRawVstepExam('   ');
  assert(invalid1 === null, 'Path traversal attempt returns null safely');
  assert(invalid2 === null, 'Out of bounds exam ID returns null safely');
  assert(invalid3 === null, 'XSS attempt returns null safely');
  assert(invalid4 === null, 'Empty string returns null safely');
  assert(invalid5 === null, 'Whitespace string returns null safely');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 7: Live Cloudflare R2 Audio Reachability Empirical Probes
  // ──────────────────────────────────────────────────────────────────────────
  beginSuite('Suite 7: Live Cloudflare R2 Audio Reachability Empirical Probes');

  // Sample probe 5 audio URLs across different tests
  const urlsToProbe = [
    'https://r2tadr.oucommunity.dev/exam-emulator/listening-01/part1-1.mp3',
    'https://r2tadr.oucommunity.dev/exam-emulator/listening-01/part2-1.mp3',
    'https://r2tadr.oucommunity.dev/exam-emulator/listening-01/part3-1.mp3',
    'https://r2tadr.oucommunity.dev/exam-emulator/listening-10/part1-10.mp3',
    'https://r2tadr.oucommunity.dev/exam-emulator/listening-56/part3-56.mp3',
  ];

  for (const url of urlsToProbe) {
    try {
      console.log(`  Probing Cloudflare R2 audio URL: ${url}`);
      const probeRes = await probeAudioUrl(url);
      assert(
        probeRes.statusCode === 200,
        `Cloudflare R2 audio HTTP status is 200 OK for ${url}`,
        { status: probeRes.statusCode }
      );
      assert(
        probeRes.contentType.includes('audio') || probeRes.contentType.includes('mpeg'),
        `Cloudflare R2 audio Content-Type is audio/mpeg for ${url}`,
        { contentType: probeRes.contentType }
      );
      assert(
        probeRes.contentLength > 1000000,
        `Cloudflare R2 audio Content-Length > 1MB for ${url}`,
        { contentLength: probeRes.contentLength }
      );
    } catch (e: any) {
      assert(false, `Cloudflare R2 audio probe threw error for ${url}: ${e.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ──────────────────────────────────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;
  const grandTotal = stats.reduce((acc, s) => acc + s.assertions, 0);
  const grandPassed = stats.reduce((acc, s) => acc + s.passed, 0);
  const grandFailed = stats.reduce((acc, s) => acc + s.failed, 0);

  console.log('\n================================================================================');
  console.log('  EMPIRICAL STRESS TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Suite                                                       | Assertions | Passed | Failed | Status |');
  console.log('|-------------------------------------------------------------|:----------:|:------:|:------:|:------:|');
  for (const s of stats) {
    const padSuite = s.suite.padEnd(59, ' ').substring(0, 59);
    const padTotal = String(s.assertions).padStart(10, ' ');
    const padPassed = String(s.passed).padStart(6, ' ');
    const padFailed = String(s.failed).padStart(6, ' ');
    const status = s.failed === 0 ? 'PASS' : 'FAIL';
    const padStatus = status.padStart(6, ' ');
    console.log(`| ${padSuite} | ${padTotal} | ${padPassed} | ${padFailed} | ${padStatus} |`);
  }
  console.log('|-------------------------------------------------------------|:----------:|:------:|:------:|:------:|');
  const grandName = 'TOTAL ACROSS ALL EMPIRICAL SUITES'.padEnd(59, ' ');
  const gTotal = String(grandTotal).padStart(10, ' ');
  const gPassed = String(grandPassed).padStart(6, ' ');
  const gFailed = String(grandFailed).padStart(6, ' ');
  const gStatus = grandFailed === 0 ? 'PASS' : 'FAIL';
  const padGStatus = gStatus.padStart(6, ' ');
  console.log(`| ${grandName} | ${gTotal} | ${gPassed} | ${gFailed} | ${padGStatus} |`);
  console.log('================================================================================');
  console.log(`Total execution time: ${totalDuration}ms\n`);

  if (grandFailed > 0) {
    console.error(`❌ EMPIRICAL VERDICT: REQUEST_CHANGES (${grandFailed} failures detected)`);
    process.exit(1);
  } else {
    console.log(`🎉 EMPIRICAL VERDICT: APPROVE (All ${grandPassed} assertions passed with 0 defects)`);
    process.exit(0);
  }
}

runStressTest().catch((err) => {
  console.error('Fatal crash during stress test execution:', err);
  process.exit(1);
});
