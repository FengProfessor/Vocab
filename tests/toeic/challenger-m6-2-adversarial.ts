/**
 * Challenger M6-2 Adversarial Verification Suite
 * 
 * Scrutinizes:
 * 1. Anti-Leak Cleanliness: Strict search for 'dautoeic', 'dauenglish', 'odlnhfaygiotcyehuysw', 'crackv1t3q5'
 *    across all 20 ETS-PRO datasets, catalog, dictionary index, and active codebase.
 * 2. Zero-Bulk-Leak Question Serving: Adversarial inspection of client payloads & Next.js API routes.
 * 3. Server-Side Scoring & Barem Integrity: Boundary inputs, tamper attacks, honeypot traps, scaled score mapping.
 * 4. Catalog & Dataset Integrity: 20 datasets schema validity, 200 questions/test, continuous numbering, proxied media.
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import { loadAnyToeicTest, loadEtsProTest, stripSensitiveToeicData, clusterToeicQuestions, stripSensitiveClusterData } from '@/lib/toeic-test-loader';
import { calculateToeicScore } from '@/lib/toeic-scoring';
import { decryptMediaProxyToken, isAllowedUpstreamUrl } from '@/lib/toeic-media-proxy';
import { extractInvisibleWatermark } from '@/lib/toeic-anti-scraping';
import { GET as getToeicTest } from '@/app/api/toeic/test/route';
import { POST as postToeicSubmit } from '@/app/api/toeic/submit/route';

const FORBIDDEN_TOKENS = ['dautoeic', 'dauenglish', 'odlnhfaygiotcyehuysw', 'crackv1t3q5'];

export async function runChallengerM62Tests(runner: TestRunner) {
  runner.describe('Challenger M6-2: Adversarial Anti-Leak Scanner', () => {});

  // 1. All 20 ETS-PRO datasets
  await runner.it('CHAL-1.1: 0 occurrences of all 4 forbidden tokens across all 20 ETS-PRO datasets', () => {
    const etsProDir = path.resolve(process.cwd(), 'src/data/toeic/datasets/ets_pro');
    expect(fs.existsSync(etsProDir)).toBe(true);

    const files = fs.readdirSync(etsProDir).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(20);

    const leaks: { file: string; token: string; count: number }[] = [];

    for (const file of files) {
      const filePath = path.join(etsProDir, file);
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      for (const token of FORBIDDEN_TOKENS) {
        if (content.includes(token)) {
          const occurrences = content.split(token).length - 1;
          leaks.push({ file, token, count: occurrences });
        }
      }
    }

    if (leaks.length > 0) {
      console.error('LEAKS FOUND IN ETS-PRO DATASETS:', leaks);
    }
    expect(leaks.length).toBe(0);
  });

  // 2. Catalog index
  await runner.it('CHAL-1.2: 0 occurrences of all 4 forbidden tokens in toeic-catalog-index.json', () => {
    const catalogPath = path.resolve(process.cwd(), 'src/data/toeic/toeic-catalog-index.json');
    expect(fs.existsSync(catalogPath)).toBe(true);
    const content = fs.readFileSync(catalogPath, 'utf8').toLowerCase();

    const leaks: string[] = [];
    for (const token of FORBIDDEN_TOKENS) {
      if (content.includes(token)) {
        leaks.push(token);
      }
    }
    expect(leaks.length).toBe(0);
  });

  // 3. Dictionary index & cache
  await runner.it('CHAL-1.3: 0 occurrences of all 4 forbidden tokens in dictionary index and cache', () => {
    const dictFiles = [
      path.resolve(process.cwd(), 'src/data/toeic/collocation-vocab-index.json'),
      path.resolve(process.cwd(), 'src/lib/toeic-collocation-index.ts'),
      path.resolve(process.cwd(), 'src/lib/exam-dict-cache.ts'),
    ];

    const leaks: { file: string; token: string }[] = [];
    for (const filePath of dictFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
        for (const token of FORBIDDEN_TOKENS) {
          if (content.includes(token)) {
            leaks.push({ file: path.basename(filePath), token });
          }
        }
      }
    }
    expect(leaks.length).toBe(0);
  });

  // 4. Codebase inspection for competitor brand tokens
  await runner.it('CHAL-1.4: Codebase scan for dautoeic, dauenglish, crackv1t3q5 in src/', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const criticalTokens = ['dautoeic', 'dauenglish', 'crackv1t3q5'];

    function scanRecursive(dir: string, results: { file: string; token: string }[]) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanRecursive(fullPath, results);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json') || entry.name.endsWith('.css'))) {
          const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
          for (const token of criticalTokens) {
            if (content.includes(token)) {
              results.push({ file: path.relative(process.cwd(), fullPath), token });
            }
          }
        }
      }
    }

    const leaks: { file: string; token: string }[] = [];
    scanRecursive(srcDir, leaks);
    if (leaks.length > 0) {
      console.error('LEAKS FOUND IN src/:', leaks);
    }
    expect(leaks.length).toBe(0);
  });

  // 5. Codebase scan for competitor bucket odlnhfaygiotcyehuysw outside media proxy whitelist
  await runner.it('CHAL-1.5: Competitor bucket odlnhfaygiotcyehuysw isolated strictly to proxy whitelist file', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const token = 'odlnhfaygiotcyehuysw';

    function scanRecursive(dir: string, results: string[]) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanRecursive(fullPath, results);
        } else if (entry.isFile()) {
          const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
          // Media proxy backend whitelist definition
          if (relPath === 'src/lib/toeic-media-proxy.ts') continue;
          
          const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
          if (content.includes(token)) {
            results.push(relPath);
          }
        }
      }
    }

    const unexpectedFiles: string[] = [];
    scanRecursive(srcDir, unexpectedFiles);
    if (unexpectedFiles.length > 0) {
      console.error('UNEXPECTED OCCURRENCES OF BUCKET ID in src/:', unexpectedFiles);
    }
    expect(unexpectedFiles.length).toBe(0);
  });

  runner.describe('Challenger M6-2: Zero-Bulk-Leak Question Serving', () => {});

  await runner.it('CHAL-2.1: stripSensitiveToeicData strips correctAnswer, explanationVi, transcript, passageTranslationVi, and dichNghia across all 20 ETS-PRO tests', () => {
    for (let testNum = 1; testNum <= 20; testNum++) {
      const fullQuestions = loadEtsProTest(testNum);
      expect(fullQuestions.length).toBe(200);

      const sanitized = stripSensitiveToeicData(fullQuestions);
      expect(sanitized.length).toBe(200);

      for (const q of sanitized as any[]) {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanationVi).toBeUndefined();
        expect(q.transcript).toBeUndefined();
        expect(q.passageTranslationVi).toBeUndefined();
        expect(q.dichNghia).toBeUndefined();

        // Must still retain public presentation fields
        expect(q.id).toBeDefined();
        expect(typeof q.questionNumber).toBe('number');
        expect(typeof q.part).toBe('number');
        expect(q.options).toBeDefined();
      }
    }
  });

  await runner.it('CHAL-2.2: clusterToeicQuestions and stripSensitiveClusterData strip transcript and explanation from Part 3 & 4 clusters', () => {
    for (let testNum = 1; testNum <= 5; testNum++) {
      const fullQuestions = loadEtsProTest(testNum);
      const clusters = clusterToeicQuestions(fullQuestions);
      expect(clusters.length).toBe(23); // 13 Part 3 clusters + 10 Part 4 clusters

      const sanitizedClusters = clusters.map(stripSensitiveClusterData);
      for (const sc of sanitizedClusters) {
        // Cluster level must not leak transcript or explanation
        expect((sc as any).transcript).toBeUndefined();
        expect((sc as any).explanationVi).toBeUndefined();

        // Child questions must be sanitized
        for (const cq of sc.questions as any[]) {
          expect(cq.correctAnswer).toBeUndefined();
          expect(cq.explanationVi).toBeUndefined();
          expect(cq.transcript).toBeUndefined();
          expect(cq.passageTranslationVi).toBeUndefined();
        }
      }
    }
  });

  await runner.it('CHAL-2.3: Zero-Bulk-Leak payload serialization: JSON.stringify contains zero secret keys', () => {
    const fullQuestions = loadEtsProTest(1);
    const sanitized = stripSensitiveToeicData(fullQuestions);
    const jsonStr = JSON.stringify(sanitized);

    expect(jsonStr.includes('"correctAnswer"')).toBe(false);
    expect(jsonStr.includes('"explanationVi"')).toBe(false);
    expect(jsonStr.includes('"passageTranslationVi"')).toBe(false);
    expect(jsonStr.includes('"dichNghia"')).toBe(false);
  });

  await runner.it('CHAL-2.4: Live Next.js /api/toeic/test strips 100% answers & transcripts for ETS-PRO', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=ets-pro-01');
    const res = await getToeicTest(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.testId).toBe('ets-pro-01');
    expect(data.questions.length).toBe(200);

    // Verify zero leak in questions payload
    for (const q of data.questions) {
      expect(q.correctAnswer).toBeUndefined();
      expect(q.explanationVi).toBeUndefined();
      expect(q.transcript).toBeUndefined();
      expect(q.passageTranslationVi).toBeUndefined();
      expect(q.dichNghia).toBeUndefined();
    }

    // Verify zero leak in clusters
    if (data.clusters) {
      for (const c of data.clusters) {
        expect(c.transcript).toBeUndefined();
        expect(c.explanationVi).toBeUndefined();
      }
    }
  });

  runner.describe('Challenger M6-2: Server-Side Scoring & Barem Integrity', () => {});

  await runner.it('CHAL-3.1: calculateToeicScore calculates accurate scaled scores across ETS barem limits', () => {
    const questions = loadEtsProTest(1);
    expect(questions.length).toBe(200);

    // All wrong (0 answers or wrong options) -> scaled score 10 (5 LC + 5 RC)
    const allWrongAnswers: Record<number, any> = {};
    const zeroResult = calculateToeicScore(allWrongAnswers, questions, 100);
    expect(zeroResult.rawTotal).toBe(0);
    expect(zeroResult.scaledListening).toBe(5);
    expect(zeroResult.scaledReading).toBe(5);
    expect(zeroResult.scaledTotal).toBe(10);

    // All correct (200 correct answers) -> scaled score 990 (495 LC + 495 RC)
    const allCorrectAnswers: Record<number, any> = {};
    for (const q of questions) {
      allCorrectAnswers[q.questionNumber] = q.correctAnswer;
    }
    const perfectResult = calculateToeicScore(allCorrectAnswers, questions, 7200);
    expect(perfectResult.rawTotal).toBe(200);
    expect(perfectResult.rawListening).toBe(100);
    expect(perfectResult.rawReading).toBe(100);
    expect(perfectResult.scaledListening).toBe(495);
    expect(perfectResult.scaledReading).toBe(495);
    expect(perfectResult.scaledTotal).toBe(990);
  });

  await runner.it('CHAL-3.2: Adversarial scoring: Out-of-bounds, invalid option keys, and negative indices handled safely', () => {
    const questions = loadEtsProTest(2);
    
    const maliciousAnswers: Record<number, any> = {
      [-1]: 'A',
      [0]: 'B',
      [999]: 'C',
      [1]: 'Z', // Invalid option
      [2]: null,
      [3]: undefined,
      [4]: '',
      [5]: 'A'  // May be right or wrong depending on key
    };

    const result = calculateToeicScore(maliciousAnswers, questions, 30);
    expect(typeof result.rawTotal).toBe('number');
    expect(result.rawTotal >= 0 && result.rawTotal <= 200).toBe(true);
    expect(result.scaledTotal >= 10 && result.scaledTotal <= 990).toBe(true);
  });

  await runner.it('CHAL-3.3: Steganographic watermarks embedded in explanationVi are detectable via extractor', () => {
    const questions = loadEtsProTest(1);
    const qWithExplanation = questions.find(q => q.explanationVi && q.explanationVi.length > 20);
    expect(qWithExplanation).toBeDefined();

    const extracted = extractInvisibleWatermark(qWithExplanation!.explanationVi!);
    expect(extracted).not.toBeNull();
    expect(extracted!.startsWith('LINGOPRO_ETSPRO_')).toBe(true);
  });

  await runner.it('CHAL-3.4: Live Next.js /api/toeic/submit calculates official ETS scaled score server-side', async () => {
    const masterQuestions = loadEtsProTest(1);

    // Submit all correct answers
    const perfectAnswers: Record<number, string> = {};
    for (const q of masterQuestions) {
      perfectAnswers[q.questionNumber] = q.correctAnswer;
    }

    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: 'ets-pro-01',
        examMode: 'real',
        answers: perfectAnswers,
        timeSpentSeconds: 3600,
      }),
    });

    const res = await postToeicSubmit(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawTotal).toBe(200);
    expect(data.scoreResult.scaledTotal).toBe(990);
    expect(data.scoreResult.scaledListening).toBe(495);
    expect(data.scoreResult.scaledReading).toBe(495);

    // Explanations are now safely revealed in reviewQuestions
    expect(data.reviewQuestions.length).toBe(200);
    expect(data.reviewQuestions[0].correctAnswer).toBeDefined();
    expect(data.reviewQuestions[0].explanationVi).toBeDefined();
  });

  runner.describe('Challenger M6-2: Catalog & Dataset Integrity', () => {});

  await runner.it('CHAL-4.1: toeic-catalog-index.json lists all 20 ETS-PRO tests with valid metadata', () => {
    const catalogPath = path.resolve(process.cwd(), 'src/data/toeic/toeic-catalog-index.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

    const etsProTests = catalog.fullTests.filter((t: any) => t.source === 'ets_pro');
    expect(etsProTests.length).toBe(20);
    expect(catalog.totalFullTests).toBe(81);
    expect(catalog.totalQuestions).toBe(23175);

    for (let i = 1; i <= 20; i++) {
      const pad = String(i).padStart(2, '0');
      const expectedId = `ets-pro-${pad}`;
      const item = etsProTests.find((t: any) => t.id === expectedId);
      expect(item).toBeDefined();
      expect(item.displayId).toBe(`ETS-PRO-${pad}`);
      expect(item.questionCount).toBe(200);
      expect(item.durationMinutes).toBe(120);
      expect(item.title.includes(`Test ${pad}`)).toBe(true);
      expect(item.title.includes('Series Khảo Thí Chuẩn ETS Format - Bộ Đề Thực Chiến Tinh Hoa')).toBe(true);
    }
  });

  await runner.it('CHAL-4.2: Every ETS-PRO test contains exactly 200 questions with standard TOEIC part breakdown', () => {
    for (let i = 1; i <= 20; i++) {
      const questions = loadEtsProTest(i);
      expect(questions.length).toBe(200);

      const p1 = questions.filter(q => q.part === 1);
      const p2 = questions.filter(q => q.part === 2);
      const p3 = questions.filter(q => q.part === 3);
      const p4 = questions.filter(q => q.part === 4);
      const p5 = questions.filter(q => q.part === 5);
      const p6 = questions.filter(q => q.part === 6);
      const p7 = questions.filter(q => q.part === 7);

      expect(p1.length).toBe(6);
      expect(p2.length).toBe(25);
      expect(p3.length).toBe(39);
      expect(p4.length).toBe(30);
      expect(p5.length).toBe(30);
      expect(p6.length).toBe(16);
      expect(p7.length).toBe(54);

      // Continuous numbering 1 to 200
      for (let qn = 1; qn <= 200; qn++) {
        expect(questions[qn - 1].questionNumber).toBe(qn);
      }
    }
  });

  await runner.it('CHAL-4.3: 100% of media URLs in ETS-PRO datasets are proxied through /api/toeic/media/proxy?t=', () => {
    for (let i = 1; i <= 20; i++) {
      const questions = loadEtsProTest(i);
      for (const q of questions) {
        if (q.audioUrl) {
          expect(q.audioUrl.startsWith('/api/toeic/media/proxy?t=')).toBe(true);
          const token = q.audioUrl.replace('/api/toeic/media/proxy?t=', '');
          const raw = decryptMediaProxyToken(token);
          expect(raw).not.toBeNull();
          expect(isAllowedUpstreamUrl(raw!)).toBe(true);
        }
        if (q.imageUrl) {
          expect(q.imageUrl.startsWith('/api/toeic/media/proxy?t=')).toBe(true);
          const token = q.imageUrl.replace('/api/toeic/media/proxy?t=', '');
          const raw = decryptMediaProxyToken(token);
          expect(raw).not.toBeNull();
          expect(isAllowedUpstreamUrl(raw!)).toBe(true);
        }
      }
    }
  });
}

// Standalone execution runner
if (process.argv[1]?.includes('challenger-m6-2-adversarial')) {
  (async () => {
    const runner = new TestRunner();
    await runChallengerM62Tests(runner);
    const stats = runner.getStats();
    console.log(`\n================================================================================`);
    console.log(`  CHALLENGER M6-2 ADVERSARIAL SUITE SUMMARY`);
    console.log(`================================================================================`);
    console.log(`Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Duration: ${stats.durationMs}ms`);
    if (stats.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })();
}
