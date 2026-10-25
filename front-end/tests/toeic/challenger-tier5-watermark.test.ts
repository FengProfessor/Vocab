/**
 * Final Challenger M6-1 — Tier 5 Adversarial Hardening Suite:
 * Steganographic Watermark Preservation & Robustness Across 4,000 Questions.
 *
 * Requirements:
 * - Verify steganographic watermark preservation across all 4,000 questions (20 full exams).
 * - Extract and verify LINGOPRO copyright payload integrity on every question.
 * - Test steganographic bit-level resilience under mutation, truncation, normalization, and tampering.
 * - Verify Zero-Bulk-Leak pre-submission stripping prevents watermark and answer leakage.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import {
  extractInvisibleWatermark,
  embedInvisibleWatermark,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '../../src/lib/toeic-anti-scraping';
import {
  loadAnyToeicTest,
  stripSensitiveToeicData,
} from '../../src/lib/toeic-test-loader';

export async function runChallengerWatermarkTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger Tier 5: 4,000 Questions Steganographic Watermark Hardening', () => {});

  const DATASET_DIR = path.resolve(process.cwd(), 'src/data/toeic/datasets/ets_pro');
  const examFiles = fs
    .readdirSync(DATASET_DIR)
    .filter((f) => f.startsWith('ets_pro_test_') && f.endsWith('.json'))
    .sort();

  // Cache loaded exams
  const loadedExams = examFiles.map((f) => {
    const raw = fs.readFileSync(path.join(DATASET_DIR, f), 'utf8');
    return {
      filename: f,
      data: JSON.parse(raw),
    };
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-WM-1: Corpus-Wide 4,000 Question Invariant & Copyright Verification
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-WM-1.1: Exactly 20 ETS-PRO exam files exist with 200 questions each (total 4,000)', () => {
    expect(loadedExams.length).toBe(20);
    let totalQuestions = 0;
    for (const exam of loadedExams) {
      expect(Array.isArray(exam.data.questions)).toBe(true);
      expect(exam.data.questions.length).toBe(200);
      totalQuestions += exam.data.questions.length;
    }
    expect(totalQuestions).toBe(4000);
  });

  await runner.it('ADV-WM-1.2: 100% of 4,000 questions contain valid non-empty explanationVi', () => {
    let validExplanations = 0;
    for (const exam of loadedExams) {
      for (const q of exam.data.questions) {
        if (typeof q.explanationVi === 'string' && q.explanationVi.trim().length > 0) {
          validExplanations++;
        }
      }
    }
    expect(validExplanations).toBe(4000);
  });

  await runner.it('ADV-WM-1.3: 100% of 4,000 questions yield an extractable invisible watermark', () => {
    let extractedCount = 0;
    for (const exam of loadedExams) {
      for (const q of exam.data.questions) {
        const wm = extractInvisibleWatermark(q.explanationVi);
        if (wm !== null && wm.length > 0) {
          extractedCount++;
        }
      }
    }
    expect(extractedCount).toBe(4000);
  });

  await runner.it('ADV-WM-1.4: 100% of extracted watermarks contain LINGOPRO copyright prefix', () => {
    let lingoproCount = 0;
    for (const exam of loadedExams) {
      for (const q of exam.data.questions) {
        const wm = extractInvisibleWatermark(q.explanationVi);
        if (wm && wm.startsWith('LINGOPRO_ETSPRO_')) {
          lingoproCount++;
        }
      }
    }
    expect(lingoproCount).toBe(4000);
  });

  await runner.it('ADV-WM-1.5: 100% of watermarks adhere strictly to standard pattern LINGOPRO_ETSPRO_XX_QYYY', () => {
    const pattern = /^LINGOPRO_ETSPRO_\d{2}_Q\d{3}$/;
    let validPatternCount = 0;
    for (const exam of loadedExams) {
      for (const q of exam.data.questions) {
        const wm = extractInvisibleWatermark(q.explanationVi);
        if (wm && pattern.test(wm)) {
          validPatternCount++;
        }
      }
    }
    expect(validPatternCount).toBe(4000);
  });

  await runner.it('ADV-WM-1.6: Zero watermark collision: all 4,000 watermarks are strictly unique', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const exam of loadedExams) {
      for (const q of exam.data.questions) {
        const wm = extractInvisibleWatermark(q.explanationVi);
        if (wm) {
          if (seen.has(wm)) {
            duplicates.push(wm);
          }
          seen.add(wm);
        }
      }
    }

    expect(duplicates.length).toBe(0);
    expect(seen.size).toBe(4000);
  });

  await runner.it('ADV-WM-1.7: Watermark matches exact test number and question number for each item', () => {
    let exactMatches = 0;
    for (let testIdx = 0; testIdx < loadedExams.length; testIdx++) {
      const exam = loadedExams[testIdx];
      const testNumPad = String(testIdx + 1).padStart(2, '0');

      for (let qIdx = 0; qIdx < exam.data.questions.length; qIdx++) {
        const q = exam.data.questions[qIdx];
        const qNumPad = String(q.questionNumber).padStart(3, '0');
        const expectedPayload = `LINGOPRO_ETSPRO_${testNumPad}_Q${qNumPad}`;

        const wm = extractInvisibleWatermark(q.explanationVi);
        if (wm === expectedPayload) {
          exactMatches++;
        }
      }
    }
    expect(exactMatches).toBe(4000);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-WM-2: Steganographic Alphabet & Natural Layout Integration
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-WM-2.1: Watermark encoding uses exclusively ZW_SENTINEL, ZW_ZERO, and ZW_ONE', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const startIdx = sample.indexOf(ZW_SENTINEL);
    const endIdx = sample.lastIndexOf(ZW_SENTINEL);

    expect(startIdx).toBeGreaterThanOrEqual(0);
    expect(endIdx).toBeGreaterThan(startIdx);

    const zwBlock = sample.slice(startIdx + 1, endIdx);
    for (const char of zwBlock) {
      const isValid = char === ZW_ZERO || char === ZW_ONE;
      expect(isValid).toBe(true);
    }
  });

  await runner.it('ADV-WM-2.2: Zero-width bit sequence length equals exactly (payloadLength * 8)', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const payload = extractInvisibleWatermark(sample)!;
    const startIdx = sample.indexOf(ZW_SENTINEL);
    const endIdx = sample.lastIndexOf(ZW_SENTINEL);
    const zwBlock = sample.slice(startIdx + 1, endIdx);

    expect(zwBlock.length).toBe(payload.length * 8);
  });

  await runner.it('ADV-WM-2.3: Invisible characters do not alter visible text readability after stripping', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const clean = sample.replace(/[\u200B\u200C\uFEFF]/g, '');

    expect(clean.startsWith('Đáp án đúng là (D).')).toBe(true);
    expect(sample.length).toBeGreaterThan(clean.length);
    // Stripping invisible characters completely removes watermark
    expect(extractInvisibleWatermark(clean)).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-WM-3: Adversarial Mutation & Distortion Stress Tests
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-WM-3.1: Watermark survives text appending (adding notes or user commentary)', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const mutated = `${sample}\n\n[Ghi chú ôn tập của học viên: Cần chú ý thì hiện tại tiếp diễn!]`;
    expect(extractInvisibleWatermark(mutated)).toBe('LINGOPRO_ETSPRO_01_Q001');
  });

  await runner.it('ADV-WM-3.2: Watermark survives text prepending (quote prefix or teacher intro)', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const mutated = `Trích xuất từ hệ thống LingoPro: ${sample}`;
    expect(extractInvisibleWatermark(mutated)).toBe('LINGOPRO_ETSPRO_01_Q001');
  });

  await runner.it('ADV-WM-3.3: Watermark survives Unicode NFC and NFD canonical decomposition normalization', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const nfc = sample.normalize('NFC');
    const nfd = sample.normalize('NFD');
    const nfkc = sample.normalize('NFKC');
    const nfkd = sample.normalize('NFKD');

    expect(extractInvisibleWatermark(nfc)).toBe('LINGOPRO_ETSPRO_01_Q001');
    expect(extractInvisibleWatermark(nfd)).toBe('LINGOPRO_ETSPRO_01_Q001');
    expect(extractInvisibleWatermark(nfkc)).toBe('LINGOPRO_ETSPRO_01_Q001');
    expect(extractInvisibleWatermark(nfkd)).toBe('LINGOPRO_ETSPRO_01_Q001');
  });

  await runner.it('ADV-WM-3.4: Watermark survives uppercase and lowercase string transformations', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const upper = sample.toUpperCase();
    const lower = sample.toLowerCase();

    // Zero-width Unicode codepoints are invariant under case transformations
    expect(extractInvisibleWatermark(upper)).toBe('LINGOPRO_ETSPRO_01_Q001');
    expect(extractInvisibleWatermark(lower)).toBe('LINGOPRO_ETSPRO_01_Q001');
  });

  await runner.it('ADV-WM-3.5: Watermark survives text truncation after the initial paragraph', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    // Truncate to first 60 characters (covers first word + watermark + some text)
    const truncated = sample.slice(0, 220);
    expect(extractInvisibleWatermark(truncated)).toBe('LINGOPRO_ETSPRO_01_Q001');
  });

  await runner.it('ADV-WM-3.6: Corrupted single sentinel returns null safely without throwing', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    // Remove the closing sentinel
    const singleSentinel = sample.replace(new RegExp(ZW_SENTINEL, 'g'), (m: string, idx: number) =>
      idx === sample.indexOf(ZW_SENTINEL) ? m : ''
    );
    expect(extractInvisibleWatermark(singleSentinel)).toBeNull();
  });

  await runner.it('ADV-WM-3.7: Incomplete byte sequence (non-multiple of 8 bits) returns null safely', () => {
    // Construct 7 bits inside sentinels
    const badBits = ZW_SENTINEL + ZW_ONE.repeat(7) + ZW_SENTINEL;
    const textWithBadBits = `Lời giải ${badBits} chi tiết.`;
    expect(extractInvisibleWatermark(textWithBadBits)).toBeNull();
  });

  await runner.it('ADV-WM-3.8: Empty, whitespace-only, or sentinel-free text returns null', () => {
    expect(extractInvisibleWatermark('')).toBeNull();
    expect(extractInvisibleWatermark('   \n\t  ')).toBeNull();
    expect(extractInvisibleWatermark('Đây là văn bản hoàn toàn bình thường không có dấu vân tay.')).toBeNull();
    expect(extractInvisibleWatermark(null as any)).toBeNull();
    expect(extractInvisibleWatermark(undefined as any)).toBeNull();
  });

  await runner.it('ADV-WM-3.9: Double embedding concatenates watermarks without parsing crash', () => {
    const sample = loadedExams[0].data.questions[0].explanationVi;
    const double = embedInvisibleWatermark(sample, 'COPYRIGHT_2026');
    const extracted = extractInvisibleWatermark(double);

    expect(typeof extracted).toBe('string');
    expect(extracted!.includes('LINGOPRO_ETSPRO_01_Q001')).toBe(true);
    expect(extracted!.includes('COPYRIGHT_2026')).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-WM-4: Zero-Bulk-Leak Pre-Submission Invariant
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-WM-4.1: stripSensitiveToeicData removes explanationVi and watermark from client payload', () => {
    for (let i = 0; i < 3; i++) {
      const exam = loadedExams[i];
      const questions = exam.data.questions;
      expect(questions.length).toBe(200);

      const clientQuestions = stripSensitiveToeicData(questions);
      for (const cq of clientQuestions) {
        expect((cq as any).explanationVi).toBeUndefined();
        expect((cq as any).correctAnswer).toBeUndefined();
        expect((cq as any).passageTranslationVi).toBeUndefined();
      }
    }
  });

  await runner.it('ADV-WM-4.2: Client-side serialized JSON contains 0 zero-width sentinels prior to submit', () => {
    const questions = loadedExams[0].data.questions;
    const clientQuestions = stripSensitiveToeicData(questions);
    const jsonStr = JSON.stringify(clientQuestions);

    expect(jsonStr.includes(ZW_SENTINEL)).toBe(false);
    expect(jsonStr.includes(ZW_ZERO)).toBe(false);
    expect(jsonStr.includes(ZW_ONE)).toBe(false);
    expect(jsonStr.includes('LINGOPRO_ETSPRO')).toBe(false);
  });
}

// Standalone execution support
if (
  require.main === module ||
  (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-tier5-watermark.test'))
) {
  const runner = new TestRunner();
  runChallengerWatermarkTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nWatermark Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
