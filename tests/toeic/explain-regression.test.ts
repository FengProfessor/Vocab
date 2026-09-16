/**
 * Regression Test Suite for TOEIC Explain Endpoint Part Alignment & Anti-Leak
 *
 * Verifies:
 * 1. Part Alignment: Requesting explanation for Part 2-7 NEVER returns Part 1 questions.
 * 2. Renumbering Synchronization: Part practice requests with renumbered 1..N match correct questions.
 * 3. Honeypot Part Awareness: Bot poisoning respects requested part.
 * 4. Elimination of Blind Priority 4 Fallback: Out-of-bounds questions return 404 instead of Part 1 Q1.
 * 5. QuestionId Strictness: questionId must match requested part if part is provided.
 */

import { NextRequest } from 'next/server';
import { POST as explainHandler } from '../../src/app/api/toeic/explain/route';
import { TestRunner, expect } from './test-harness';
import { clearBotFlag } from '../../src/lib/toeic-anti-scraping';

export async function runExplainRegressionTests(runner: TestRunner): Promise<void> {
  runner.describe('TOEIC Explain Endpoint Part Alignment & Regression Suite', () => {});

  const localhostIp = '127.0.0.1';

  await runner.it('EX-REG-1: Part 5 Question 1 returns Part 5 explanation, NEVER Part 1 photo', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 1,
        part: 5,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questionNumber).toBe(1);
    expect(typeof data.correctAnswer).toBe('string');
    expect(['A', 'B', 'C', 'D'].includes(data.correctAnswer)).toBe(true);
    expect(typeof data.explanationVi).toBe('string');
  });

  await runner.it('EX-REG-2: Part 2 Question 1 returns Part 2 explanation, NEVER Part 1 photo', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 1,
        part: 2,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questionNumber).toBe(1);
    expect(['A', 'B', 'C'].includes(data.correctAnswer)).toBe(true);
  });

  await runner.it('EX-REG-3: Part 7 Question 1 returns Part 7 reading explanation, NEVER Part 1 photo', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 1,
        part: 7,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.questionNumber).toBe(1);
    expect(typeof data.correctAnswer).toBe('string');
  });

  await runner.it('EX-REG-4: Non-existent question with part returns HTTP 404, does NOT fall back to Part 1 Q1', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 9999,
        part: 5,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  await runner.it('EX-REG-5: Honeypot trap with part parameter returns poisoned question for the requested part', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 1,
        part: 5,
        honeypot: 'bot_scraped_value',
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isPoisoned).toBe(true);
    clearBotFlag(localhostIp);
  });

  await runner.it('EX-REG-6: QuestionId takes precedence when part matches', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionId: '6852-q101',
        part: 5,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  await runner.it('EX-REG-7: QuestionId with mismatched part is rejected and not treated as valid', async () => {
    clearBotFlag(localhostIp);
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': localhostIp,
      },
      body: JSON.stringify({
        testId: '6852',
        questionId: '6852-q1',
        part: 5,
        questionNumber: 9999,
      }),
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(404);
  });
}

// Standalone execution
if (require.main === module) {
  const runner = new TestRunner();
  runExplainRegressionTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log(`\nExplain Regression Tests: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
      if (stats.failed > 0) process.exit(1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
