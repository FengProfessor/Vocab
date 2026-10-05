/**
 * tests/toeic/challenger-m1-2-deep-audit.test.ts
 *
 * Empirical Deep Adversarial Audit for Milestone 1 Iteration 2
 * Verification of Zero-Bulk-Leak Sanitization and Media Proxy Hardening
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  stripSensitiveToeicData,
  stripSensitiveClusterData,
  loadAnyToeicTest,
  clusterToeicQuestions,
} from '../../src/lib/toeic-test-loader';
import { GET as testRouteGet } from '../../src/app/api/toeic/test/route';
import { GET as mediaProxyGet } from '../../src/app/api/toeic/media/proxy/route';
import { generateMediaProxyToken } from '../../src/lib/toeic-media-proxy';
import type {
  ToeicUnifiedQuestion,
  ToeicQuestionCluster,
  ToeicSanitizedQuestion,
  ToeicSanitizedQuestionCluster,
} from '../../src/types/toeic';

const SENSITIVE_KEYS = [
  'correctAnswer',
  'explanationVi',
  'transcript',
  'passageTranslationVi',
  'dichNghia',
] as const;

export async function runDeepAuditTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger M1-2 Deep Audit: Zero-Bulk-Leak Runtime Integrity', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Exhaustive Key Excision on Synthetic Dirty Objects
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-ZBL-1: stripSensitiveToeicData purges all 5 sensitive keys under extreme payload injection', () => {
    const dirtyQuestion: ToeicUnifiedQuestion = {
      id: 'adv-q-999',
      testId: 'adv-test-01',
      questionNumber: 153,
      part: 7,
      section: 'reading',
      prompt: 'What is mentioned in the adversarial payload?',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
      correctAnswer: 'B',
      explanationVi: 'EXPLANATION_LEAK_SECRET_12345',
      transcript: 'TRANSCRIPT_LEAK_SECRET_67890',
      passageTranslationVi: 'PASSAGE_TRANSLATION_SECRET_ABCDE',
      dichNghia: 'DICH_NGHIA_SECRET_FGHIJ',
      passage: 'Normal passage text',
      imageUrl: '/api/toeic/media/proxy?t=safe-token',
    };

    const [clean] = stripSensitiveToeicData([dirtyQuestion]);
    const cleanKeys = Object.keys(clean);
    const serialized = JSON.stringify(clean);

    for (const key of SENSITIVE_KEYS) {
      expect(cleanKeys.includes(key)).toBe(false);
      expect((clean as any)[key]).toBeUndefined();
    }

    expect(serialized.includes('EXPLANATION_LEAK_SECRET')).toBe(false);
    expect(serialized.includes('TRANSCRIPT_LEAK_SECRET')).toBe(false);
    expect(serialized.includes('PASSAGE_TRANSLATION_SECRET')).toBe(false);
    expect(serialized.includes('DICH_NGHIA_SECRET')).toBe(false);
    expect(serialized.includes('B')).toBe(true); // Normal options still preserved
    expect(clean.prompt).toBe('What is mentioned in the adversarial payload?');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Cluster Data Scrubbing at Both Cluster Root and Question Level
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-ZBL-2: stripSensitiveClusterData purges root transcript/explanationVi AND question sensitive keys', () => {
    const dirtyCluster: ToeicQuestionCluster = {
      clusterId: 'cluster-adv-77',
      part: 3,
      clusterType: 'text_dialogue',
      startQuestionNumber: 41,
      endQuestionNumber: 43,
      audioUrl: '/api/toeic/media/proxy?t=audio-token',
      imageUrl: null,
      transcript: 'ROOT_CLUSTER_TRANSCRIPT_LEAK',
      explanationVi: 'ROOT_CLUSTER_EXPLANATION_LEAK',
      questions: [
        {
          id: 'adv-q-41',
          testId: 'adv-test-01',
          questionNumber: 41,
          part: 3,
          section: 'listening',
          options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
          correctAnswer: 'A',
          explanationVi: 'QUESTION_EXPLANATION_LEAK_41',
          transcript: 'QUESTION_TRANSCRIPT_LEAK_41',
          passageTranslationVi: 'QUESTION_TRANSLATION_LEAK_41',
          dichNghia: 'QUESTION_DICH_NGHIA_LEAK_41',
        },
        {
          id: 'adv-q-42',
          testId: 'adv-test-01',
          questionNumber: 42,
          part: 3,
          section: 'listening',
          options: [{ key: 'C', text: 'C' }, { key: 'D', text: 'D' }],
          correctAnswer: 'D',
          explanationVi: 'QUESTION_EXPLANATION_LEAK_42',
          transcript: 'QUESTION_TRANSCRIPT_LEAK_42',
          passageTranslationVi: 'QUESTION_TRANSLATION_LEAK_42',
          dichNghia: 'QUESTION_DICH_NGHIA_LEAK_42',
        },
      ],
    };

    const cleanCluster: ToeicSanitizedQuestionCluster = stripSensitiveClusterData(dirtyCluster);
    const rootKeys = Object.keys(cleanCluster);
    const serialized = JSON.stringify(cleanCluster);

    // Assert root keys do not contain sensitive data
    expect(rootKeys.includes('transcript')).toBe(false);
    expect(rootKeys.includes('explanationVi')).toBe(false);
    expect((cleanCluster as any).transcript).toBeUndefined();
    expect((cleanCluster as any).explanationVi).toBeUndefined();

    // Assert all questions are cleaned
    for (const q of cleanCluster.questions) {
      const qKeys = Object.keys(q);
      for (const key of SENSITIVE_KEYS) {
        expect(qKeys.includes(key)).toBe(false);
        expect((q as any)[key]).toBeUndefined();
      }
    }

    expect(serialized.includes('ROOT_CLUSTER_TRANSCRIPT_LEAK')).toBe(false);
    expect(serialized.includes('ROOT_CLUSTER_EXPLANATION_LEAK')).toBe(false);
    expect(serialized.includes('QUESTION_EXPLANATION_LEAK')).toBe(false);
    expect(serialized.includes('QUESTION_TRANSCRIPT_LEAK')).toBe(false);
    expect(serialized.includes('QUESTION_TRANSLATION_LEAK')).toBe(false);
    expect(serialized.includes('QUESTION_DICH_NGHIA_LEAK')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Original Input Immutability / Non-Mutation Invariant
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-ZBL-3: stripSensitiveToeicData and stripSensitiveClusterData NEVER mutate source objects', () => {
    const originalQuestion: ToeicUnifiedQuestion = {
      id: 'adv-immutable-1',
      testId: 'test-imm',
      questionNumber: 1,
      part: 1,
      section: 'listening',
      options: [{ key: 'A', text: 'Opt A' }],
      correctAnswer: 'A',
      explanationVi: 'Original Explanation',
      transcript: 'Original Transcript',
      passageTranslationVi: 'Original Translation',
      dichNghia: 'Original Dich Nghia',
    };

    const [cleaned] = stripSensitiveToeicData([originalQuestion]);

    // Source object must retain its values intact
    expect(originalQuestion.correctAnswer).toBe('A');
    expect(originalQuestion.explanationVi).toBe('Original Explanation');
    expect(originalQuestion.transcript).toBe('Original Transcript');
    expect(originalQuestion.passageTranslationVi).toBe('Original Translation');
    expect(originalQuestion.dichNghia).toBe('Original Dich Nghia');

    // Cleaned object must not have them
    expect((cleaned as any).correctAnswer).toBeUndefined();
    expect((cleaned as any).passageTranslationVi).toBeUndefined();

    // Now test cluster immutability
    const originalClusterQuestion = { ...originalQuestion };
    const originalCluster: ToeicQuestionCluster = {
      clusterId: 'c-imm-1',
      part: 3,
      clusterType: 'text_dialogue',
      startQuestionNumber: 32,
      endQuestionNumber: 34,
      audioUrl: 'https://example.com/audio.mp3',
      transcript: 'Cluster Master Transcript',
      explanationVi: 'Cluster Master Explanation',
      questions: [originalClusterQuestion],
    };

    const cleanedCluster = stripSensitiveClusterData(originalCluster);
    expect(originalCluster.transcript).toBe('Cluster Master Transcript');
    expect(originalCluster.explanationVi).toBe('Cluster Master Explanation');
    expect(originalClusterQuestion.correctAnswer).toBe('A');
    expect(originalClusterQuestion.passageTranslationVi).toBe('Original Translation');

    expect((cleanedCluster as any).transcript).toBeUndefined();
    expect((cleanedCluster.questions[0] as any).correctAnswer).toBeUndefined();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Real Dataset Sanitization Integrity Scan
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-ZBL-4: Real dataset loading (ets-2024-01) sanitized output contains ZERO sensitive keys', () => {
    const rawQuestions = loadAnyToeicTest('ets-2024-01');
    expect(rawQuestions.length).toBeGreaterThan(0);

    const sanitizedQuestions = stripSensitiveToeicData(rawQuestions);
    expect(sanitizedQuestions.length).toBe(rawQuestions.length);

    let totalInspected = 0;
    for (const q of sanitizedQuestions) {
      totalInspected++;
      for (const key of SENSITIVE_KEYS) {
        if ((q as any)[key] !== undefined) {
          throw new Error(
            `ZERO-BULK-LEAK FAILURE: Real question ${q.id} (Q${q.questionNumber}) leaked field ${key}="${(q as any)[key]}"`
          );
        }
      }
    }
    expect(totalInspected).toBe(rawQuestions.length);

    // Also verify cluster generation and sanitization on real questions
    const rawClusters = clusterToeicQuestions(rawQuestions) as ToeicQuestionCluster[];
    const sanitizedClusters = rawClusters.map(stripSensitiveClusterData);

    for (const cluster of sanitizedClusters) {
      expect((cluster as any).transcript).toBeUndefined();
      expect((cluster as any).explanationVi).toBeUndefined();
      for (const cq of cluster.questions) {
        for (const key of SENSITIVE_KEYS) {
          if ((cq as any)[key] !== undefined) {
            throw new Error(
              `ZERO-BULK-LEAK FAILURE: Cluster ${cluster.clusterId} question ${cq.id} leaked field ${key}`
            );
          }
        }
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Public Route Simulation (/api/toeic/test) Payload Inspection
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-ZBL-5: Public Route GET /api/toeic/test?testId=ets-2024-01 leaks ZERO sensitive keys', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/test?testId=ets-2024-01');
    const res = await testRouteGet(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBeGreaterThan(0);

    const serializedPayload = JSON.stringify(data);

    for (const q of data.questions) {
      for (const key of SENSITIVE_KEYS) {
        if (q[key] !== undefined) {
          throw new Error(`CRITICAL API LEAK: Question ${q.id} in API response contains key "${key}"`);
        }
      }
    }

    if (data.clusters) {
      for (const cluster of data.clusters) {
        expect(cluster.transcript).toBeUndefined();
        expect(cluster.explanationVi).toBeUndefined();
        for (const cq of cluster.questions) {
          for (const key of SENSITIVE_KEYS) {
            if (cq[key] !== undefined) {
              throw new Error(`CRITICAL API CLUSTER LEAK: Question ${cq.id} in cluster contains key "${key}"`);
            }
          }
        }
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Media Proxy Operational Security (User-Agent & Header Leakage)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('ADV-OPSEC-1: Upstream fetch uses standard browser User-Agent with zero LingoPro branding', async () => {
    const ALLOWED_AUDIO_URL =
      'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      let sentUserAgent = '';
      globalThis.fetch = async (url: any, init: any) => {
        sentUserAgent = init?.headers?.['User-Agent'] || '';
        return new Response(Buffer.alloc(100), {
          status: 200,
          headers: { 'content-type': 'audio/mpeg' },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`);
      const res = await mediaProxyGet(req);

      expect(res.status).toBe(200);
      expect(sentUserAgent.includes('LingoPro')).toBe(false);
      expect(sentUserAgent.includes('Mozilla/5.0')).toBe(true);
      expect(sentUserAgent.includes('Chrome')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

// Standalone execution support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-m1-2-deep-audit'))) {
  const runner = new TestRunner();
  runDeepAuditTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n============================================================`);
    console.log(`Challenger M1-2 Deep Audit Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    console.log(`============================================================\n`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
