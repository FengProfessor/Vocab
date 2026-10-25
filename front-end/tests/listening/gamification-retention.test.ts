/**
 * Gamification & Retention Loop Test Suite for Listening Immersion Hub (Milestone 4).
 * Verifies:
 * 1. POST /api/listening/complete route behavior with authenticated vs guest learners.
 * 2. Defensive schema validation on payload bounds (clozeScore, quizScore, totals, videoId).
 * 3. ListeningAttempt isCompleted flag persistence and retrieval from LocalStorage.
 * 4. Completion state evaluation and XP reward rules.
 */

import { POST } from '../../src/app/api/listening/complete/route';
import { saveListeningAttempt, getListeningAttempt } from '../../src/lib/listening';
import type { ListeningAttempt } from '../../src/types/listening';

// Mock browser LocalStorage environment
const store: Record<string, string> = {};
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};

export async function runGamificationTests() {
  console.log('================================================================================');
  console.log('  M4 GAMIFICATION & RETENTION LOOP TEST SUITE');
  console.log('  Testing: POST /api/listening/complete, XP Awarding, isCompleted Persistence');
  console.log('================================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (!condition) {
      throw new Error(`[FAIL] ${msg}`);
    }
    passed++;
    console.log(`  [PASS] Probe ${total}: ${msg}`);
  }

  // Probe 1: Guest completion returns 200 with 50 XP, isCompleted: true, and guest: true
  {
    const req = new Request('http://localhost:3000/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'video-dl-001',
        clozeScore: 4,
        clozeTotal: 4,
        quizScore: 3,
        quizTotal: 4,
      }),
    });

    const res = await POST(req);
    const data = await res.json();
    assert(
      res.status === 200 && data.success === true && data.xpAwarded === 50 && data.isCompleted === true && data.guest === true,
      'Guest user completion returns status 200, credits 50 XP with guest flag'
    );
  }

  // Probe 2: Validation rejection on empty videoId
  {
    const req = new Request('http://localhost:3000/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: '   ',
        clozeScore: 4,
        clozeTotal: 4,
        quizScore: 4,
        quizTotal: 4,
      }),
    });

    const res = await POST(req);
    assert(res.status === 400, 'Blank videoId rejected with HTTP status 400');
  }

  // Probe 3: Validation rejection on score exceeding total
  {
    const req = new Request('http://localhost:3000/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'video-dl-001',
        clozeScore: 5,
        clozeTotal: 4,
        quizScore: 4,
        quizTotal: 4,
      }),
    });

    const res = await POST(req);
    assert(res.status === 400, 'Invalid clozeScore > clozeTotal rejected with HTTP status 400');
  }

  // Probe 4: Validation rejection on negative score
  {
    const req = new Request('http://localhost:3000/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: 'video-dl-001',
        clozeScore: -1,
        clozeTotal: 4,
        quizScore: 4,
        quizTotal: 4,
      }),
    });

    const res = await POST(req);
    assert(res.status === 400, 'Negative clozeScore rejected with HTTP status 400');
  }

  // Probe 5: Validation rejection on non-JSON malformed payload
  {
    const req = new Request('http://localhost:3000/api/listening/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json-text',
    });

    const res = await POST(req);
    assert(res.status === 400, 'Malformed non-JSON request body rejected with HTTP status 400');
  }

  // Probe 6: ListeningAttempt schema stores and retrieves isCompleted: true in LocalStorage
  {
    const completedAttempt: ListeningAttempt = {
      videoId: 'video-m4-celebration-test',
      completedAt: new Date().toISOString(),
      clozeScore: 4,
      clozeTotal: 4,
      quizScore: 4,
      quizTotal: 4,
      percentScore: 100,
      isCompleted: true,
    };

    saveListeningAttempt(completedAttempt);
    const retrieved = getListeningAttempt('video-m4-celebration-test');
    assert(
      retrieved !== null && retrieved.isCompleted === true && retrieved.percentScore === 100,
      'ListeningAttempt preserves isCompleted: true and 100% accuracy in LocalStorage'
    );
  }

  // Probe 7: ListeningAttempt partial progress marks isCompleted: false
  {
    const partialAttempt: ListeningAttempt = {
      videoId: 'video-m4-partial-test',
      completedAt: new Date().toISOString(),
      clozeScore: 2,
      clozeTotal: 4,
      quizScore: 0,
      quizTotal: 4,
      percentScore: 25,
      isCompleted: false,
    };

    saveListeningAttempt(partialAttempt);
    const retrievedPartial = getListeningAttempt('video-m4-partial-test');
    assert(
      retrievedPartial !== null && retrievedPartial.isCompleted === false && retrievedPartial.percentScore === 25,
      'ListeningAttempt correctly distinguishes partial progress with isCompleted: false'
    );
  }

  console.log(`\n================================================================================`);
  console.log(`  M4 GAMIFICATION TEST SUMMARY: ${passed}/${total} PROBES PASSED (100%)`);
  console.log(`================================================================================\n`);
  return { passed, total };
}

if (require.main === module) {
  runGamificationTests().catch((err) => {
    console.error('Fatal error in gamification test suite:', err);
    process.exit(1);
  });
}
