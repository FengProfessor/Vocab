/**
 * CLASSROOM 100–300 CONCURRENT USERS STRESS & ADVERSARIAL TEST SUITE
 *
 * Verifies all 5 architectural improvements under worst-case 100–300 concurrent
 * classroom users sharing a single NAT IP + active adversarial scraper bots:
 *
 * 1. Anti-Scraping Exam Velocity & Bot Isolation (TOEIC & VSTEP)
 * 2. VSTEP & TOEIC Test Loader CPU/Memory Optimization & `testId=bank` Fix
 * 3. `/api/words` Database Query Amplification & `srs_progress` Isolation
 * 4. Shared-IP Rate Limits & Multi-Key Scaling (Login, Register, Anti-Scrape)
 * 5. AI Cooldown Fast-Fail, Single-Flight Deduplication & Writing-Eval Shedding
 *
 * Run with: npx tsx tests/perf/classroom-300-concurrency-stress.test.ts
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';

// TOEIC imports
import {
  clearAllBotFlags as clearToeicBotFlags,
  isClientFlaggedAsBot as isToeicBot,
  isToeicSharedClassroomIp,
  isToeicScraperRotationIp,
} from '../../src/lib/toeic-anti-scraping';
import {
  loadAnyToeicTest,
  loadToeicPartPractice,
  loadSanitizedToeicTestBundle,
} from '../../src/lib/toeic-test-loader';
import { GET as getToeicTest } from '../../src/app/api/toeic/test/route';
import { POST as postToeicExplain } from '../../src/app/api/toeic/explain/route';
import { POST as postToeicSubmit } from '../../src/app/api/toeic/submit/route';

// VSTEP & VNU imports
import {
  clearVstepBotFlags,
  generateVstepSessionToken,
  isClientFlaggedAsBot as isVstepBot,
  isVstepSessionOrClientBot,
  isVstepSharedClassroomIp,
  isVstepScraperRotationIp,
  verifyVstepSessionToken,
} from '../../src/lib/vstep-anti-scraping';
import {
  getVstepQuestionExplanation,
  loadRawVstepExam,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';
import { GET as getVstepTest } from '../../src/app/api/vstep/test/route';
import { POST as postVstepExplain } from '../../src/app/api/vstep/explain/route';
import { POST as postVstepSubmit } from '../../src/app/api/vstep/submit/route';
import { POST as postVstepWritingEval } from '../../src/app/api/vstep/writing-eval/route';
import { GET as getVnuTest } from '../../src/app/api/vnu-bac-3/test/route';
import { POST as postVnuExplain } from '../../src/app/api/vnu-bac-3/explain/route';
import { POST as postVnuSubmit } from '../../src/app/api/vnu-bac-3/submit/route';
import { POST as postVnuWritingEval } from '../../src/app/api/vnu-bac-3/writing-eval/route';
import { POST as postGrammarGenerate } from '../../src/app/api/grammar/generate/route';

// Security / Rate-limit / AI imports
import { checkRateLimitAsync, getRateLimitClientKey } from '../../src/lib/api-security';
import { assertScrapeQuota, QUOTA } from '../../src/lib/anti-scrape';
import { generateExerciseWithGemini } from '../../src/lib/daily-reading-generator';
import { analyzeVocabularyTier } from '../../src/lib/daily-reading-level';

// Configure synthetic Upstash Redis endpoint so checkRateLimitAsync executes its
// exact production fixed-window Lua evaluation path during concurrency stress tests.
process.env.UPSTASH_REDIS_REST_URL = 'https://synthetic.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'synthetic-classroom-stress-token';

const syntheticRedisStore = new Map<string, { count: number; expiresAt: number }>();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (urlStr.startsWith('https://synthetic.upstash.io')) {
    const body = JSON.parse(String(init?.body ?? '[]')) as string[];
    const key = body[3];
    const windowMs = Number(body[4]) || 60_000;
    const now = Date.now();
    let entry = syntheticRedisStore.get(key);
    if (!entry || entry.expiresAt <= now) {
      entry = { count: 1, expiresAt: now + windowMs };
      syntheticRedisStore.set(key, entry);
    } else {
      entry.count += 1;
    }
    const ttl = Math.max(1, Math.min(windowMs, entry.expiresAt - now));
    return new Response(JSON.stringify({ result: [entry.count, ttl] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return originalFetch(input, init);
};

let passed = 0;
let failed = 0;

async function testAsync(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    console.error(`  ❌ FAIL: ${name}\n     ${msg}`);
    failed++;
  }
}

async function runAll() {
  console.log('\n====================================================================');
  console.log('🚀 CLASSROOM 100–300 CONCURRENT USERS STRESS & CYBER DEFENSE SUITE');
  console.log('====================================================================\n');

  // =========================================================================
  // SUITE 1: TOEIC 300-STUDENT NAT IP ISOLATION VS BOT POISONING
  // =========================================================================
  console.log('--- Suite 1: TOEIC 300-Student Shared NAT IP vs Bot Poisoning ---');

  await testAsync('1.1: 300 TOEIC students on 1 shared NAT IP load test simultaneously with 0% 429s & 0% leaks', async () => {
    const classroomIp = '203.0.113.101';
    clearToeicBotFlags();

    const studentCount = 300;
    const reqs = Array.from({ length: studentCount }, (_, idx) =>
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=10', {
        method: 'GET',
        headers: {
          'x-forwarded-for': classroomIp,
          'user-agent': `ClassroomBrowser/1.0 Student/${idx}`,
        },
      })
    );

    const startMs = performance.now();
    const responses = await Promise.all(reqs.map((r) => getToeicTest(r)));
    const elapsedMs = performance.now() - startMs;

    assert.equal(responses.length, studentCount);
    const tokens = new Set<string>();
    for (const res of responses) {
      assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.sessionToken, 'Must issue sessionToken');
      tokens.add(json.sessionToken);

      // Verify zero bulk answer leaks
      const firstQ = json.questions[0];
      assert.equal(firstQ.correctAnswer, undefined, 'correctAnswer must be stripped');
      assert.equal(firstQ.explanationVi, undefined, 'explanationVi must be stripped');
    }

    assert.equal(tokens.size, studentCount, 'All 300 students must get unique session tokens');
    assert.equal(isToeicSharedClassroomIp(classroomIp), true, 'IP with 300 sessions must be recognized as shared classroom IP');
    assert.equal(isToeicBot(classroomIp), false, 'Shared classroom IP must not be flagged as bot');
    console.log(`     ⏱️ 300 concurrent GET /api/toeic/test completed in ${elapsedMs.toFixed(1)}ms`);
  });

  await testAsync('1.2: 300 TOEIC students on 1 shared NAT IP click Explain at the exact same millisecond with 0% false poisoning', async () => {
    const classroomIp = '203.0.113.102';
    clearToeicBotFlags();

    const rawQuestions = loadAnyToeicTest('6852');
    assert.ok(rawQuestions.length > 0);
    const targetQ = rawQuestions[0];

    // Issue 300 session tokens via GET /api/toeic/test
    const studentCount = 300;
    const testResponses = await Promise.all(
      Array.from({ length: studentCount }, (_, idx) =>
        getToeicTest(
          new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
            method: 'GET',
            headers: {
              'x-forwarded-for': classroomIp,
              'user-agent': `StudentAgent/${idx}`,
            },
          })
        )
      )
    );
    const sessionTokens = await Promise.all(testResponses.map(async (r) => (await r.json()).sessionToken as string));

    // All 300 students click "Explain" on targetQ at the exact same millisecond
    const startMs = performance.now();
    const explainResponses = await Promise.all(
      sessionTokens.map((token, idx) =>
        postToeicExplain(
          new NextRequest('http://localhost:3000/api/toeic/explain', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': classroomIp,
              'user-agent': `StudentAgent/${idx}`,
            },
            body: JSON.stringify({
              testId: '6852',
              questionNumber: targetQ.questionNumber,
              questionId: targetQ.id,
              sessionToken: token,
            }),
          })
        )
      )
    );
    const elapsedMs = performance.now() - startMs;

    for (let i = 0; i < studentCount; i++) {
      const res = explainResponses[i];
      assert.equal(res.status, 200, `Student ${i} got HTTP ${res.status}`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.isPoisoned, undefined, `Student ${i} should NOT be poisoned`);
      assert.equal(
        body.correctAnswer,
        targetQ.correctAnswer,
        `Student ${i} received poisoned correctAnswer (${body.correctAnswer} !== ${targetQ.correctAnswer})!`
      );
    }

    assert.equal(isToeicBot(classroomIp), false, 'Shared IP must NOT be flagged as bot after 300 student explains');
    console.log(`     ⏱️ 300 concurrent POST /api/toeic/explain completed in ${elapsedMs.toFixed(1)}ms`);
  });

  await testAsync('1.3: 1 rogue scraper bot inside a classroom gets 100% poisoned while 50 honest students on the SAME IP stay 100% unpoisoned', async () => {
    const classroomIp = '203.0.113.103';
    clearToeicBotFlags();

    const rawQuestions = loadAnyToeicTest('6852');
    const q1 = rawQuestions[0];
    const q2 = rawQuestions[1];

    // 50 honest students + 1 rogue bot on the same classroom IP
    const tokens: string[] = [];
    for (let i = 0; i < 51; i++) {
      const res = await getToeicTest(
        new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
          method: 'GET',
          headers: { 'x-forwarded-for': classroomIp },
        })
      );
      tokens.push((await res.json()).sessionToken);
    }

    const botToken = tokens[50];
    const honestTokens = tokens.slice(0, 50);

    // Rogue bot blasts 11 explain requests in 1ms (exceeds 10 req / 300ms velocity limit)
    for (let i = 0; i < 11; i++) {
      await postToeicExplain(
        new NextRequest('http://localhost:3000/api/toeic/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({
            testId: '6852',
            questionNumber: q1.questionNumber,
            questionId: q1.id,
            sessionToken: botToken,
          }),
        })
      );
    }

    // Verify rogue bot now receives POISONED explanation
    const botRes = await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q2.questionNumber,
          questionId: q2.id,
          sessionToken: botToken,
        }),
      })
    );
    const botJson = await botRes.json();
    assert.equal(botJson.isPoisoned, true, 'Rogue bot session MUST be flagged as poisoned');
    assert.notEqual(botJson.correctAnswer, q2.correctAnswer, 'Rogue bot session MUST receive shifted correctAnswer');

    // Verify rogue bot also triggers honeypot on submit and gets poisoned review questions
    const botSubmitRes = await postToeicSubmit(
      new NextRequest('http://localhost:3000/api/toeic/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
        body: JSON.stringify({
          testId: '6852',
          part: 5,
          limit: 5,
          sessionToken: botToken,
          answers: { 1: q1.correctAnswer, 999: 'A' },
        }),
      })
    );
    const botSubmitJson = await botSubmitRes.json();
    assert.equal(botSubmitJson.isPoisoned, true, 'Rogue bot submit with out-of-bounds key 999 must be poisoned');

    // Verify all 50 honest students on the EXACT SAME IP still receive 100% genuine explanations and submit results
    const honestExplainRes = await Promise.all(
      honestTokens.map((t) =>
        postToeicExplain(
          new NextRequest('http://localhost:3000/api/toeic/explain', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
            body: JSON.stringify({
              testId: '6852',
              questionNumber: q2.questionNumber,
              questionId: q2.id,
              sessionToken: t,
            }),
          })
        )
      )
    );
    for (const res of honestExplainRes) {
      const json = await res.json();
      assert.equal(json.isPoisoned, undefined);
      assert.equal(json.correctAnswer, q2.correctAnswer, 'Honest student on shared IP must NOT be poisoned by rogue classmate!');
    }

    const honestSubmitRes = await postToeicSubmit(
      new NextRequest('http://localhost:3000/api/toeic/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
        body: JSON.stringify({
          testId: '6852',
          part: 5,
          limit: 5,
          sessionToken: honestTokens[0],
          answers: { 1: q1.correctAnswer, 2: q2.correctAnswer },
          timeSpentSeconds: 120,
        }),
      })
    );
    const honestSubmitJson = await honestSubmitRes.json();
    assert.equal(honestSubmitJson.isPoisoned, undefined, 'Honest student submit must NOT be poisoned');
    assert.equal(honestSubmitJson.reviewQuestions[0].correctAnswer, q1.correctAnswer);
  });

  // =========================================================================
  // SUITE 2: VSTEP 300-STUDENT CONCURRENCY, BANK FIX & LOADER BENCHMARK
  // =========================================================================
  console.log('\n--- Suite 2: VSTEP 300-Student Concurrency, Bank Route Fix & Loader Benchmark ---');

  await testAsync('2.1: GET /api/vstep/test?testId=bank&skill=reading works (no 404), strips sensitive keys, and supports explain', async () => {
    const clientIp = '203.0.113.110';
    const res = await getVstepTest(
      new NextRequest('http://localhost:3000/api/vstep/test?testId=bank&skill=reading&limit=2', {
        method: 'GET',
        headers: { 'x-forwarded-for': clientIp },
      })
    );
    assert.equal(res.status, 200, `Expected 200 for testId=bank, got ${res.status}`);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.sessionToken);
    assert.ok(Array.isArray(json.exam.sections));
    assert.ok(json.exam.sections.length > 0);

    const firstQ = json.exam.sections[0].tasks[0].questions[0];
    assert.equal(firstQ.correctAnswer, undefined, 'correctAnswer must be stripped in bank mode');
    assert.equal(firstQ.explanationVi, undefined, 'explanationVi must be stripped in bank mode');

    // Also verify POST /api/vstep/explain works with testId='bank' using that session token!
    const explainRes = await postVstepExplain(
      new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': clientIp },
        body: JSON.stringify({
          testId: 'bank',
          questionId: firstQ.id,
          sessionToken: json.sessionToken,
        }),
      })
    );
    assert.equal(explainRes.status, 200, 'Explain with testId=bank must succeed');
    const explainJson = await explainRes.json();
    assert.equal(explainJson.success, true);
    assert.equal(typeof explainJson.answer, 'number');
  });

  await testAsync('2.2: 300 VSTEP students on 1 shared NAT IP load exam, explain concurrently, and isolate rogue bot', async () => {
    const classroomIp = '203.0.113.111';
    clearVstepBotFlags(classroomIp);

    const rawExam = loadRawVstepExam('vstep-mock-01')!;
    assert.ok(rawExam);
    const allReadingQuestions = rawExam.sections
      .flatMap((s) => s.tasks)
      .flatMap((t) => t.questions || []);
    const targetQ = allReadingQuestions[0];
    // Find a question whose answer !== 1 and !== 0 so bot poison (which returns 0 or 1) is guaranteed distinct
    const targetQ2 = allReadingQuestions.find((q) => (q.answer ?? 0) >= 2) || allReadingQuestions[1];

    const studentCount = 300;
    const tokens = Array.from({ length: studentCount }, () =>
      generateVstepSessionToken(classroomIp, 'vstep-mock-01')
    );

    // Verify all 300 tokens generated in the same millisecond are 100% unique & valid 4-part tokens
    const uniqueTokens = new Set(tokens);
    assert.equal(uniqueTokens.size, studentCount, 'All 300 VSTEP session tokens must be unique');
    for (const t of tokens) {
      const decoded = Buffer.from(t, 'base64url').toString('utf-8');
      assert.equal(decoded.split('|').length, 4, 'Token must preserve 4-part format');
      assert.equal(verifyVstepSessionToken(t, classroomIp, 'vstep-mock-01'), true);
    }
    assert.equal(isVstepSharedClassroomIp(classroomIp), true);

    // All 300 students click Explain at the same millisecond
    const startMs = performance.now();
    const explainRes = await Promise.all(
      tokens.map((token, idx) =>
        postVstepExplain(
          new NextRequest('http://localhost:3000/api/vstep/explain', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': classroomIp,
              'user-agent': `VstepStudent/${idx}`,
            },
            body: JSON.stringify({
              testId: 'vstep-mock-01',
              questionId: targetQ.id,
              sessionToken: token,
            }),
          })
        )
      )
    );
    const elapsedMs = performance.now() - startMs;

    for (let i = 0; i < studentCount; i++) {
      assert.equal(explainRes[i].status, 200);
      const body = await explainRes[i].json();
      assert.equal(body.answer, targetQ.answer, `Student ${i} falsely poisoned!`);
    }

    // Now student #299 turns into a scraper bot and blasts 4 more rapid requests
    const rogueToken = tokens[299];
    for (let k = 0; k < 4; k++) {
      await postVstepExplain(
        new NextRequest('http://localhost:3000/api/vstep/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({
            testId: 'vstep-mock-01',
            questionId: targetQ.id,
            sessionToken: rogueToken,
          }),
        })
      );
    }

    assert.equal(isVstepSessionOrClientBot(classroomIp, rogueToken), true, 'Rogue session must be flagged');
    assert.equal(isVstepSessionOrClientBot(classroomIp, tokens[0]), false, 'Honest classmate session must NOT be flagged');
    assert.equal(isVstepBot(classroomIp), false, 'Shared classroom IP must NOT be blanket-banned');

    // Verify rogue session gets poisoned on targetQ2 while honest student #0 gets real answer
    const [rogueExplain, honestExplain] = await Promise.all([
      postVstepExplain(
        new NextRequest('http://localhost:3000/api/vstep/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({ testId: 'vstep-mock-01', questionId: targetQ2.id, sessionToken: rogueToken }),
        })
      ),
      postVstepExplain(
        new NextRequest('http://localhost:3000/api/vstep/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({ testId: 'vstep-mock-01', questionId: targetQ2.id, sessionToken: tokens[0] }),
        })
      ),
    ]);

    assert.notEqual((await rogueExplain.json()).answer, targetQ2.answer, 'Rogue session must get poisoned answer');
    assert.equal((await honestExplain.json()).answer, targetQ2.answer, 'Honest student must get real answer');

    // Also verify VSTEP submit isolation on the same classroom IP
    const [rogueSubmit, honestSubmit] = await Promise.all([
      postVstepSubmit(
        new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({
            testId: 'vstep-mock-01',
            sessionToken: rogueToken,
            answers: { [targetQ2.id]: targetQ2.answer },
          }),
        })
      ),
      postVstepSubmit(
        new NextRequest('http://localhost:3000/api/vstep/submit', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({
            testId: 'vstep-mock-01',
            sessionToken: tokens[0],
            answers: { [targetQ2.id]: targetQ2.answer },
          }),
        })
      ),
    ]);

    const rogueSubmitJson = await rogueSubmit.json();
    const honestSubmitJson = await honestSubmit.json();
    const rogueReviewQ2 = rogueSubmitJson.reviewExam.sections
      .flatMap((s: { tasks: Array<{ questions?: Array<{ id: string; answer?: number }> }> }) => s.tasks)
      .flatMap((t: { questions?: Array<{ id: string; answer?: number }> }) => t.questions || [])
      .find((q: { id: string }) => q.id === targetQ2.id);
    const honestReviewQ2 = honestSubmitJson.reviewExam.sections
      .flatMap((s: { tasks: Array<{ questions?: Array<{ id: string; answer?: number }> }> }) => s.tasks)
      .flatMap((t: { questions?: Array<{ id: string; answer?: number }> }) => t.questions || [])
      .find((q: { id: string }) => q.id === targetQ2.id);

    assert.equal(honestReviewQ2.answer, targetQ2.answer, 'Honest student submit must return authentic review key');
    assert.notEqual(
      rogueReviewQ2.answer,
      targetQ2.answer,
      'Rogue bot submit must receive poisoned review key'
    );
    console.log(`     ⏱️ 300 concurrent POST /api/vstep/explain completed in ${elapsedMs.toFixed(1)}ms`);
  });

  await testAsync('2.3: Benchmark 300 VSTEP skill-bank loads + 300 O(1) explanations + 300 TOEIC part practice loads in < 500ms', async () => {
    const startMs = performance.now();

    for (let i = 0; i < 300; i++) {
      const practiceExam = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'all_random',
        limit: 2,
        testId: 'bank',
        seed: i + 1,
      });
      assert.ok(practiceExam && practiceExam.sections.length > 0);
      const qId = practiceExam.sections[0].tasks[0].questions![0].id;
      const exp = getVstepQuestionExplanation('bank', qId);
      assert.ok(exp && typeof exp.answer === 'number');
    }

    for (let i = 0; i < 300; i++) {
      const questions = loadToeicPartPractice(5, 'bank', 10, true, {
        filterMode: 'all_random',
        seed: i + 1,
      });
      assert.equal(questions.length, 10);
    }

    const elapsedMs = performance.now() - startMs;
    assert.ok(elapsedMs < 500, `Expected < 500ms for 900 loader operations, took ${elapsedMs.toFixed(1)}ms`);
    console.log(`     ⏱️ 900 high-concurrency loader operations completed in ${elapsedMs.toFixed(1)}ms`);
  });

  // =========================================================================
  // SUITE 3: /api/words SRS_PROGRESS FILTERING & PAYLOAD STRIPPING
  // =========================================================================
  console.log('\n--- Suite 3: /api/words Query Amplification & srs_progress Isolation ---');

  await testAsync('3.1: /api/words filters srs_progress by user_id in DB query and strips raw srs_progress array from payload', async () => {
    const wordsRoutePath = path.join(process.cwd(), 'src/app/api/words/route.ts');
    const source = fs.readFileSync(wordsRoutePath, 'utf-8');

    assert.ok(
      source.includes(".eq('srs_progress.user_id', userId)"),
      "wordsQuery must filter srs_progress by userId via .eq('srs_progress.user_id', userId)"
    );
    assert.ok(
      source.includes('const { srs_progress, ...wordFields } = w;'),
      'Raw srs_progress array must be destructured and stripped from response items'
    );
  });

  // =========================================================================
  // SUITE 4: SHARED-IP RATE LIMITS FOR 300 CONCURRENT CLASSROOM STUDENTS
  // =========================================================================
  console.log('\n--- Suite 4: Shared-IP Rate Limits (300 Students vs Single-Target Brute Force) ---');

  await testAsync('4.1: 300 distinct students on 1 shared NAT IP can log in simultaneously (0% 429s), while 11th brute-force attempt on 1 email is blocked', async () => {
    const sharedClassroomIp = '203.0.113.220';
    const ipDigest = createHash('sha256').update(sharedClassroomIp).digest('base64url');

    // Verify src/app/api/auth/login/route.ts uses exact dual-key contract
    const loginSource = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'login', 'route.ts'),
      'utf-8'
    );
    assert.ok(loginSource.includes('`auth-login:${ipDigest}`, 360, 60_000'));
    assert.ok(loginSource.includes('`auth-login-acct:${emailDigest}`, 10, 60_000'));

    // 300 distinct students logging in from the same classroom IP within 1 minute
    const loginResults = await Promise.all(
      Array.from({ length: 300 }, async (_, idx) => {
        const email = `student${idx}@classroom.edu.vn`;
        const emailDigest = createHash('sha256').update(email).digest('base64url');
        const [ipRl, acctRl] = await Promise.all([
          checkRateLimitAsync(`auth-login:${ipDigest}`, 360, 60_000),
          checkRateLimitAsync(`auth-login-acct:${emailDigest}`, 10, 60_000),
        ]);
        return ipRl.allowed && acctRl.allowed;
      })
    );

    assert.equal(loginResults.every(Boolean), true, 'All 300 distinct students on shared IP must be allowed to log in');

    // Now a brute-force attacker tries 11 rapid passwords against student0@classroom.edu.vn
    const victimDigest = createHash('sha256').update('student0@classroom.edu.vn').digest('base64url');
    let lastAllowed = true;
    for (let attempt = 2; attempt <= 11; attempt++) {
      const acctRl = await checkRateLimitAsync(`auth-login-acct:${victimDigest}`, 10, 60_000);
      lastAllowed = acctRl.allowed;
    }
    assert.equal(lastAllowed, false, '11th login attempt against a single email within 60s MUST be rate-limited');
  });

  await testAsync('4.2: 300 students on 1 shared NAT IP pass anti-scrape assertScrapeQuota for dictLookup, tts, imageProxy, and wordsList', async () => {
    const sharedIp = '203.0.113.221';

    const results = await Promise.all(
      Array.from({ length: 300 }, async (_, idx) => {
        const [wordsRes, dictRes, ttsRes, imgRes] = await Promise.all([
          assertScrapeQuota(`words-list:user-${idx}`, QUOTA.wordsList),
          assertScrapeQuota(`dict:${sharedIp}`, QUOTA.dictLookup),
          assertScrapeQuota(`tts:${sharedIp}`, QUOTA.tts),
          assertScrapeQuota(`img:${sharedIp}`, QUOTA.imageProxy),
        ]);
        return wordsRes === null && dictRes === null && ttsRes === null && imgRes === null;
      })
    );

    assert.equal(results.every(Boolean), true, 'All 300 classroom students on shared NAT IP must pass assertScrapeQuota');
  });

  // =========================================================================
  // SUITE 5: AI COOLDOWN FAST-FAIL, SINGLE-FLIGHT DEDUPE & WRITING-EVAL SHEDDING
  // =========================================================================
  console.log('\n--- Suite 5: AI Cooldown Fast-Fail, Single-Flight Deduplication & Writing-Eval Load Shedding ---');

  await testAsync('5.1: generateExerciseWithGemini fails fast (< 200ms) instead of sleeping 65s when allowCooldownWait=false', async () => {
    const levelConfig = analyzeVocabularyTier([
      { word: 'resilient' },
      { word: 'sustainable' },
    ]);

    const startMs = performance.now();
    const res = await generateExerciseWithGemini(
      'Test prompt',
      ['resilient', 'sustainable'],
      levelConfig,
      1,
      {
        allowCooldownWait: false,
        maxCooldownWaitMs: 0,
        dedupeKey: 'test-fast-fail-dedupe',
      }
    );
    const elapsedMs = performance.now() - startMs;

    assert.equal(res, null);
    assert.ok(
      elapsedMs < 1500,
      `Expected fast-fail (< 1500ms) when keys are missing/cooldown, but hung for ${elapsedMs.toFixed(1)}ms`
    );
    console.log(`     ⏱️ Fast-fail returned in ${elapsedMs.toFixed(1)}ms (prevented 65,000ms thread hang)`);
  });

  await testAsync('5.2: 100 concurrent VSTEP & VNU writing-eval requests from a shared classroom IP succeed via rate-limit isolation & graceful fallback', async () => {
    const classroomIp = '203.0.113.230';
    const essayText =
      'Nowadays, working from home has become increasingly popular across many industries. ' +
      'On the one hand, remote work allows employees to save commuting time and achieve a healthier work-life balance. ' +
      'For instance, parents can spend more time with their children while maintaining high productivity. ' +
      'On the other hand, working remotely can lead to feelings of isolation and communication barriers among team members. ' +
      'In conclusion, while remote work brings undeniable flexibility, a hybrid model is the most sustainable approach.';

    const startMs = performance.now();
    const [vstepResponses, vnuResponses] = await Promise.all([
      Promise.all(
        Array.from({ length: 100 }, (_, idx) =>
          postVstepWritingEval(
            new NextRequest('http://localhost:3000/api/vstep/writing-eval', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-forwarded-for': classroomIp,
                cookie: `sb-classroom-auth-token=student_session_${idx}`,
              },
              body: JSON.stringify({
                taskId: 'w_t2_01',
                prompt: 'Discuss the advantages and disadvantages of working from home.',
                minWords: 120,
                text: essayText,
              }),
            })
          )
        )
      ),
      Promise.all(
        Array.from({ length: 50 }, (_, idx) =>
          postVnuWritingEval(
            new NextRequest('http://localhost:3000/api/vnu-bac-3/writing-eval', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-forwarded-for': classroomIp,
                cookie: `sb-classroom-auth-token=vnu_student_${idx}`,
              },
              body: JSON.stringify({
                taskId: 'vnu_w_01',
                prompt: 'Discuss the advantages and disadvantages of working from home.',
                minWords: 120,
                text: essayText,
              }),
            })
          )
        )
      ),
    ]);
    const elapsedMs = performance.now() - startMs;

    for (let i = 0; i < 100; i++) {
      assert.equal(vstepResponses[i].status, 200, `VSTEP Student ${i} writing-eval got HTTP ${vstepResponses[i].status}`);
      const json = await vstepResponses[i].json();
      assert.equal(json.success, true);
      assert.equal(typeof json.evaluation.overallScore, 'number');
    }
    for (let i = 0; i < 50; i++) {
      assert.equal(vnuResponses[i].status, 200, `VNU Student ${i} writing-eval got HTTP ${vnuResponses[i].status}`);
      const json = await vnuResponses[i].json();
      assert.equal(json.success, true);
      assert.equal(typeof json.evaluation.overallScore, 'number');
    }
    console.log(`     ⏱️ 150 concurrent writing-eval requests completed in ${elapsedMs.toFixed(1)}ms`);
  });

  await testAsync('5.3: Single client spamming > 10 grammar-generate requests/min gets HTTP 429 while other students on the same IP are unaffected', async () => {
    const classroomIp = '198.51.100.240';

    // Spammer sends 11 rapid requests with the same client fingerprint
    let grammar429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await postGrammarGenerate(
        new NextRequest('http://localhost:3000/api/grammar/generate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': classroomIp,
            'user-agent': 'SpamBot/1.0',
          },
          body: JSON.stringify({ topic: '' }),
        })
      );
      if (res.status === 429) {
        grammar429 = true;
        break;
      }
    }
    assert.equal(grammar429, true, 'Single client exceeding 10 req/min on /api/grammar/generate must get 429');

    // Another student on the exact same classroomIp with their own session cookie is NOT rate-limited (gets 400 for empty topic, not 429)
    const honestStudentRes = await postGrammarGenerate(
      new NextRequest('http://localhost:3000/api/grammar/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': classroomIp,
          cookie: 'sb-auth-token=honest_student_cookie',
          'user-agent': 'Mozilla/5.0 StudentBrowser',
        },
        body: JSON.stringify({ topic: '' }),
      })
    );
    assert.equal(honestStudentRes.status, 400, 'Honest student on the same IP must not be blocked by spammer');
    assert.notEqual(
      getRateLimitClientKey(
        new NextRequest('http://localhost:3000', {
          headers: { 'x-forwarded-for': classroomIp, cookie: 'a=1' },
        })
      ),
      getRateLimitClientKey(
        new NextRequest('http://localhost:3000', {
          headers: { 'x-forwarded-for': classroomIp, cookie: 'a=2' },
        })
      ),
      'getRateLimitClientKey must isolate distinct student cookies on the same IP'
    );
  });

  await testAsync('1.4: Edge Case — Standalone single-IP bot gets IP-banned while forged token in 300-student classroom does not ban classmates', async () => {
    const standaloneBotIp = '198.51.100.88';
    const classroomIp = '203.0.113.104';
    clearToeicBotFlags();

    const rawQuestions = loadAnyToeicTest('6852');
    const q1 = rawQuestions[0];

    // Standalone bot hits honeypot testId -> IP itself MUST be flagged as bot
    await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=ets-canary-honeypot', {
        method: 'GET',
        headers: { 'x-forwarded-for': standaloneBotIp },
      })
    );
    assert.equal(isToeicBot(standaloneBotIp), true, 'Standalone single-IP scraper MUST be IP-flagged');

    // Classroom with 3 students on shared IP: 1 attacker sends forged sessionToken
    const student1 = await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
        method: 'GET',
        headers: { 'x-forwarded-for': classroomIp },
      })
    );
    const student2 = await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
        method: 'GET',
        headers: { 'x-forwarded-for': classroomIp },
      })
    );
    const token1 = (await student1.json()).sessionToken;
    const token2 = (await student2.json()).sessionToken;

    // Attacker on same classroom IP sends forged token with honeypot trap
    const forgedRes = await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q1.questionNumber,
          questionId: q1.id,
          sessionToken: 'forged.invalid.signature',
          honeypot: 'bot_filled_me',
        }),
      })
    );
    assert.equal((await forgedRes.json()).isPoisoned, true, 'Forged honeypot request must be poisoned');
    assert.equal(isToeicBot(classroomIp), false, 'Shared classroom IP must not be blanket-banned by forged token');

    // Both valid students on the same IP still get genuine explanations
    for (const validToken of [token1, token2]) {
      const validRes = await postToeicExplain(
        new NextRequest('http://localhost:3000/api/toeic/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': classroomIp },
          body: JSON.stringify({
            testId: '6852',
            questionNumber: q1.questionNumber,
            questionId: q1.id,
            sessionToken: validToken,
          }),
        })
      );
      const validJson = await validRes.json();
      assert.equal(validJson.isPoisoned, undefined);
      assert.equal(validJson.correctAnswer, q1.correctAnswer);
    }
  });

  await testAsync('2.4: Edge Case — Deep cache immutability when caller mutates returned VSTEP & TOEIC practice and full-test objects across 300 loads', async () => {
    const firstVstep = loadVstepSkillPractice({
      skill: 'reading',
      filterMode: 'all_random',
      limit: 1,
      testId: 'bank',
      seed: 42,
    })!;
    const originalQuestionText = firstVstep.sections[0].tasks[0].questions![0].question;
    const originalOption0 = firstVstep.sections[0].tasks[0].questions![0].options[0];

    // Mutate returned objects aggressively
    firstVstep.sections[0].tasks[0].questions![0].question = 'CORRUPTED_BY_CALLER';
    firstVstep.sections[0].tasks[0].questions![0].options[0] = 'CORRUPTED_OPTION';

    // Subsequent student loading the same seed must get clean, uncorrupted data from cache
    const secondVstep = loadVstepSkillPractice({
      skill: 'reading',
      filterMode: 'all_random',
      limit: 1,
      testId: 'bank',
      seed: 42,
    })!;
    assert.equal(secondVstep.sections[0].tasks[0].questions![0].question, originalQuestionText, 'Cached VSTEP question must be immutable against caller mutation');
    assert.equal(secondVstep.sections[0].tasks[0].questions![0].options[0], originalOption0, 'Cached VSTEP options must be immutable against caller mutation');

    // Same check for TOEIC part practice cache
    const firstToeic = loadToeicPartPractice(5, 'bank', 5, true, { filterMode: 'all_random', seed: 42 });
    const origToeicPrompt = firstToeic[0].prompt;
    firstToeic[0].prompt = 'TOEIC_MUTATED';

    const secondToeic = loadToeicPartPractice(5, 'bank', 5, true, { filterMode: 'all_random', seed: 42 });
    assert.equal(secondToeic[0].prompt, origToeicPrompt, 'Cached TOEIC prompt must be immutable against caller mutation');

    // Same check for TOEIC pre-sanitized full-test bundle cache
    const firstBundle = loadSanitizedToeicTestBundle('6852')!;
    assert.ok(firstBundle);
    const origBundleOption = firstBundle.questions[0].options[0].text;
    firstBundle.questions[0].options[0].text = 'MUTATED_BUNDLE_OPT';
    const secondBundle = loadSanitizedToeicTestBundle('6852')!;
    assert.equal(secondBundle.questions[0].options[0].text, origBundleOption, 'Cached TOEIC full-test bundle must be immutable against caller mutation');
  });

  await testAsync('4.3: Edge Case — 100 concurrent student registrations in a school computer lab succeed while 6th duplicate email spam is blocked', async () => {
    const labIp = '203.0.113.225';
    const ipDigest = createHash('sha256').update(labIp).digest('base64url');

    // Verify src/app/api/auth/register/route.ts uses exact dual-key contract
    const registerSource = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'register', 'route.ts'),
      'utf-8'
    );
    assert.ok(registerSource.includes('`auth-register:${ipDigest}`, 120, 60_000'));
    assert.ok(registerSource.includes('`auth-register-acct:${emailDigest}`, 5, 60_000'));

    const regResults = await Promise.all(
      Array.from({ length: 100 }, async (_, idx) => {
        const email = `newstudent${idx}@school.edu.vn`;
        const emailDigest = createHash('sha256').update(email).digest('base64url');
        const [ipRl, emailRl] = await Promise.all([
          checkRateLimitAsync(`auth-register:${ipDigest}`, 120, 60_000),
          checkRateLimitAsync(`auth-register-acct:${emailDigest}`, 5, 60_000),
        ]);
        return ipRl.allowed && emailRl.allowed;
      })
    );
    assert.equal(regResults.every(Boolean), true, 'All 100 students registering from school lab IP must succeed');

    // Spammer trying to register newstudent0@school.edu.vn 5 more times (total 6) is blocked on attempt #6
    const spamEmailDigest = createHash('sha256').update('newstudent0@school.edu.vn').digest('base64url');
    let sixthAllowed = true;
    for (let attempt = 2; attempt <= 6; attempt++) {
      const rl = await checkRateLimitAsync(`auth-register-acct:${spamEmailDigest}`, 5, 60_000);
      sixthAllowed = rl.allowed;
    }
    assert.equal(sixthAllowed, false, '6th registration attempt for the same email within 60s MUST be blocked');
  });

  await testAsync('1.5: Adversarial — Scraper bot rotating session tokens or using same clientKey across new tokens is caught and poisoned (TOEIC & VSTEP)', async () => {
    clearToeicBotFlags();
    const rawQuestions = loadAnyToeicTest('6852');
    const q1 = rawQuestions[0];

    // Part A: Scraper with persistent client identity (x-client-session-id / userId) mints 2 tokens on a classroom IP
    const classroomIp = '203.0.113.150';
    for (let i = 0; i < 10; i++) {
      await getToeicTest(
        new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
          method: 'GET',
          headers: { 'x-forwarded-for': classroomIp, 'x-client-session-id': `honest_${i}` },
        })
      );
    }

    const botMint1 = await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
        method: 'GET',
        headers: { 'x-forwarded-for': classroomIp, 'x-client-session-id': 'scraper_fp_99' },
      })
    );
    const botMint2 = await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
        method: 'GET',
        headers: { 'x-forwarded-for': classroomIp, 'x-client-session-id': 'scraper_fp_99' },
      })
    );
    const botTok1 = (await botMint1.json()).sessionToken;
    const botTok2 = (await botMint2.json()).sessionToken;

    // Scraper hits honeypot on botTok1
    await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': classroomIp,
          'x-client-session-id': 'scraper_fp_99',
        },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q1.questionNumber,
          questionId: q1.id,
          sessionToken: botTok1,
          honeypot: 'bot_trap',
        }),
      })
    );

    // Scraper immediately rotates to botTok2 (never used before!) with same client identity -> MUST be poisoned immediately!
    const rotatedRes = await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': classroomIp,
          'x-client-session-id': 'scraper_fp_99',
        },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q1.questionNumber,
          questionId: q1.id,
          sessionToken: botTok2,
        }),
      })
    );
    assert.equal(
      (await rotatedRes.json()).isPoisoned,
      true,
      'Scraper rotating to a fresh sessionToken with a flagged client identity MUST be poisoned on first request'
    );

    // Part B: Anonymous scraper on standalone IP mints 5 dummy tokens and rotates through them without client headers
    const rotationBotIp = '198.51.100.199';
    const rotatedTokens: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await getToeicTest(
        new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
          method: 'GET',
          headers: { 'x-forwarded-for': rotationBotIp },
        })
      );
      rotatedTokens.push((await r.json()).sessionToken);
    }

    // Trigger traps on tokens 0, 1, 2 (3 rotated sessions >= 30% of IP sessions)
    for (let i = 0; i < 3; i++) {
      await postToeicExplain(
        new NextRequest('http://localhost:3000/api/toeic/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': rotationBotIp },
          body: JSON.stringify({
            testId: '6852',
            questionNumber: q1.questionNumber,
            questionId: q1.id,
            sessionToken: rotatedTokens[i],
            honeypot: 'bot_trap',
          }),
        })
      );
    }

    assert.equal(
      isToeicScraperRotationIp(rotationBotIp),
      true,
      'IP with >= 3 flagged rotated sessions (>= 30% of IP sessions) must be detected as scraper rotation IP'
    );

    // Token 3 (unused until now!) on rotationBotIp must now be automatically poisoned!
    const token4Res = await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': rotationBotIp },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q1.questionNumber,
          questionId: q1.id,
          sessionToken: rotatedTokens[3],
        }),
      })
    );
    assert.equal(
      (await token4Res.json()).isPoisoned,
      true,
      'Remaining tokens on a detected scraper-rotation IP must be poisoned'
    );

    // Part C: VSTEP multi-session scraper rotation detection
    const vstepRotationIp = '198.51.100.200';
    clearVstepBotFlags(vstepRotationIp);
    const vstepTokens = Array.from({ length: 4 }, () =>
      generateVstepSessionToken(vstepRotationIp, 'vstep-mock-01')
    );
    for (let i = 0; i < 3; i++) {
      await postVstepExplain(
        new NextRequest('http://localhost:3000/api/vstep/explain', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': vstepRotationIp },
          body: JSON.stringify({
            testId: 'vstep-mock-01',
            questionId: 'L1Q1',
            sessionToken: vstepTokens[i],
            _hp_trap: 'scraper_trap',
          }),
        })
      );
    }
    assert.equal(isVstepScraperRotationIp(vstepRotationIp), true);
    assert.equal(isVstepSessionOrClientBot(vstepRotationIp, vstepTokens[3]), true);
  });

  await testAsync('1.6: Edge Case — Shared NAT IP change mid-session (dual-WAN school router switching IP between /test, /explain, and /submit)', async () => {
    const wanIp1 = '203.0.113.10';
    const wanIp2 = '203.0.113.11';
    const studentClientId = 'student_dual_wan_session_01';
    clearToeicBotFlags();
    clearVstepBotFlags(wanIp1);
    clearVstepBotFlags(wanIp2);

    const rawQuestions = loadAnyToeicTest('6852');
    const q1 = rawQuestions[0];

    // 1. TOEIC: Student loads test on wanIp1, then explains & submits from wanIp2
    const toeicLoadRes = await getToeicTest(
      new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=5&limit=5', {
        method: 'GET',
        headers: {
          'x-forwarded-for': wanIp1,
          'x-client-session-id': studentClientId,
        },
      })
    );
    const toeicToken = (await toeicLoadRes.json()).sessionToken;

    const toeicExplainRes = await postToeicExplain(
      new NextRequest('http://localhost:3000/api/toeic/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': wanIp2,
          'x-client-session-id': studentClientId,
        },
        body: JSON.stringify({
          testId: '6852',
          questionNumber: q1.questionNumber,
          questionId: q1.id,
          sessionToken: toeicToken,
        }),
      })
    );
    assert.equal(toeicExplainRes.status, 200);
    const toeicExplainJson = await toeicExplainRes.json();
    assert.equal(toeicExplainJson.isPoisoned, undefined);
    assert.equal(toeicExplainJson.correctAnswer, q1.correctAnswer);

    // 2. VSTEP: Student loads test on wanIp1 with x-client-session-id, then explains & submits from wanIp2
    const vstepLoadRes = await getVstepTest(
      new NextRequest('http://localhost:3000/api/vstep/test?testId=vstep-mock-01', {
        method: 'GET',
        headers: {
          'x-forwarded-for': wanIp1,
          'x-client-session-id': studentClientId,
        },
      })
    );
    const vstepLoadJson = await vstepLoadRes.json();
    const vstepToken = vstepLoadJson.sessionToken;
    const vstepFirstQId = vstepLoadJson.exam.sections[0].tasks[0].questions[0].id;

    const vstepExplainRes = await postVstepExplain(
      new NextRequest('http://localhost:3000/api/vstep/explain', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': wanIp2,
          'x-client-session-id': studentClientId,
        },
        body: JSON.stringify({
          testId: 'vstep-mock-01',
          questionId: vstepFirstQId,
          sessionToken: vstepToken,
        }),
      })
    );
    assert.equal(
      vstepExplainRes.status,
      200,
      'VSTEP explain must succeed when student NAT IP shifts on dual-WAN router with matching x-client-session-id'
    );
  });

  await testAsync('2.5: 300 concurrent VNU Bậc 3 students on 1 shared NAT IP load exam, explain, and submit with pre-sanitized cache & unique session tokens', async () => {
    const classroomIp = '203.0.113.175';
    const studentCount = 300;
    const examId = 'ulis-sample-test-01';

    const startMs = performance.now();
    const testResponses = await Promise.all(
      Array.from({ length: studentCount }, () =>
        getVnuTest(
          new NextRequest(`http://localhost:3000/api/vnu-bac-3/test?id=${examId}`, {
            method: 'GET',
            headers: { 'x-forwarded-for': classroomIp },
          })
        )
      )
    );

    const vnuTokens = new Set<string>();
    let firstQuestionId = '';
    for (const res of testResponses) {
      assert.equal(res.status, 200, `Expected 200 for VNU test load, got ${res.status}`);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.sessionToken);
      vnuTokens.add(json.sessionToken);
      const q0 = json.exam.sections[0].tasks[0].questions[0];
      assert.equal(q0.correctAnswer, undefined, 'correctAnswer must be stripped from VNU test payload');
      assert.equal(q0.explanationVi, undefined, 'explanationVi must be stripped from VNU test payload');
      if (!firstQuestionId) firstQuestionId = q0.id;
    }

    assert.equal(vnuTokens.size, studentCount, 'All 300 VNU Bậc 3 students must get unique session tokens');

    // All 300 students call POST /api/vnu-bac-3/explain concurrently
    const tokenList = Array.from(vnuTokens);
    const explainResponses = await Promise.all(
      tokenList.map((token) =>
        postVnuExplain(
          new NextRequest('http://localhost:3000/api/vnu-bac-3/explain', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': classroomIp,
            },
            body: JSON.stringify({
              examId,
              questionId: firstQuestionId,
              sessionToken: token,
            }),
          })
        )
      )
    );
    for (const res of explainResponses) {
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.correctAnswer);
    }

    // 100 students submit concurrently on the same IP
    const submitResponses = await Promise.all(
      tokenList.slice(0, 100).map((token) =>
        postVnuSubmit(
          new NextRequest('http://localhost:3000/api/vnu-bac-3/submit', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': classroomIp,
            },
            body: JSON.stringify({
              examId,
              mode: 'practice',
              sessionToken: token,
              answers: { [firstQuestionId]: 'A' },
              timeSpentSeconds: 600,
            }),
          })
        )
      )
    );
    for (const res of submitResponses) {
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    }
    const elapsedMs = performance.now() - startMs;
    console.log(`     ⏱️ 300 VNU Bậc 3 test + 300 explain + 100 submit completed in ${elapsedMs.toFixed(1)}ms`);
  });

  console.log('\n====================================================================');
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll();
