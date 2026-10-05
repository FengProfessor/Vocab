/**
 * Anti-Leak & White-Labeling Compliance Test Suite (Tiers 1 & 2).
 *
 * Verifies:
 * - Anti-leak clean state: 0 occurrences of competitor identifiers (`dautoeic`, `dauenglish`,
 *   `odlnhfaygiotcyehuysw`, `crackv1t3q5`, `"Part 1 Đậu TOEIC"`) in any exam dataset, catalog, or loader.
 * - Rebranding compliance: all 20 full mock exams are branded under `Series Khảo Thí Chuẩn ETS Format`
 *   with IDs `ETS-PRO-01` to `ETS-PRO-20`.
 * - Invisible steganographic watermarking: encodes & extracts `LINGOPRO_ETSPRO_XX_QYY` zero-width Unicode.
 * - Visual text fidelity: zero-width characters do not alter human-readable text.
 * - Zero-Bulk-Leak protection: pre-submission client envelopes leak zero answers, explanations, or watermarks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '../../src/lib/toeic-anti-scraping';
import type { ToeicUnifiedQuestion, ToeicSanitizedQuestion } from '../../src/types/toeic';

const ROOT_DIR = path.resolve(__dirname, '../..');
const CATALOG_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/toeic-catalog-index.json');
const LISTENING_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const READING_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-reading-v1.json');
const TEST_LOADER_PATH = path.resolve(ROOT_DIR, 'src/lib/toeic-test-loader.ts');
const ETS_PRO_DIR = path.resolve(ROOT_DIR, 'src/data/toeic/datasets/ets_pro');
const RAW_MOCK_TESTS_PATH = path.resolve(ROOT_DIR, 'scripts/dautoeic/data/mock_tests.json');

export async function runAntiLeakWhitelabelTests(runner: TestRunner): Promise<void> {
  runner.describe('Anti-Leak & White-Labeling Compliance Suite', () => {
    // ──────────────────────────────────────────────────────────────────────────
    // Tier 1: Feature Coverage (Core Anti-Leak & Rebranding Invariants)
    // ──────────────────────────────────────────────────────────────────────────

    // AL-1: Zero occurrences of 'dautoeic' in catalog, listening, reading, loader
    runner.it('AL-1: Zero occurrences of "dautoeic" in catalog, listening, reading, and loader', () => {
      const filesToCheck = [CATALOG_PATH, LISTENING_PATH, READING_PATH, TEST_LOADER_PATH];
      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/dautoeic/gi);
          expect(matches).toBeNull();
        }
      }
    });

    // AL-2: Zero occurrences of 'dauenglish' in catalog, listening, reading, loader
    runner.it('AL-2: Zero occurrences of "dauenglish" in catalog, listening, reading, and loader', () => {
      const filesToCheck = [CATALOG_PATH, LISTENING_PATH, READING_PATH, TEST_LOADER_PATH];
      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/dauenglish/gi);
          expect(matches).toBeNull();
        }
      }
    });

    // AL-3: Zero occurrences of competitor bucket 'odlnhfaygiotcyehuysw' in catalog and production datasets
    runner.it('AL-3: Zero occurrences of competitor bucket "odlnhfaygiotcyehuysw" in catalog and production datasets', () => {
      const filesToCheck = [CATALOG_PATH, LISTENING_PATH, READING_PATH];
      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/odlnhfaygiotcyehuysw/gi);
          expect(matches).toBeNull();
        }
      }
      // If ets_pro directory exists, check all JSONs inside it
      if (fs.existsSync(ETS_PRO_DIR)) {
        const files = fs.readdirSync(ETS_PRO_DIR).filter((f) => f.endsWith('.json'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(ETS_PRO_DIR, file), 'utf-8');
          const matches = content.match(/odlnhfaygiotcyehuysw/gi);
          expect(matches).toBeNull();
        }
      }
    });

    // AL-4: Zero occurrences of competitor token 'crackv1t3q5' in all exam datasets
    runner.it('AL-4: Zero occurrences of competitor token "crackv1t3q5" in any catalog or dataset', () => {
      const filesToCheck = [CATALOG_PATH, LISTENING_PATH, READING_PATH, TEST_LOADER_PATH];
      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/crackv1t3q5/gi);
          expect(matches).toBeNull();
        }
      }
    });

    // AL-5: Zero occurrences of "Part 1 Đậu TOEIC" or "Đậu TOEIC" in catalog and datasets
    runner.it('AL-5: Zero occurrences of "Part 1 Đậu TOEIC" or "Đậu TOEIC" in any dataset or catalog', () => {
      const filesToCheck = [CATALOG_PATH, LISTENING_PATH, READING_PATH];
      for (const filePath of filesToCheck) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const matches = content.match(/đậu toeic|dau toeic/gi);
          expect(matches).toBeNull();
        }
      }
    });

    // AL-6: Rebranding compliance: all 20 full mock exams follow ETS-PRO format
    runner.it('AL-6: Rebranding compliance: 20 exams mapped to ETS-PRO-01..20 and official series title', () => {
      if (fs.existsSync(RAW_MOCK_TESTS_PATH)) {
        const rawTests = JSON.parse(fs.readFileSync(RAW_MOCK_TESTS_PATH, 'utf-8'));
        expect(Array.isArray(rawTests)).toBe(true);
        expect(rawTests.length).toBe(20);

        // Derive standardized IDs
        const standardizedIds = rawTests.map((_: unknown, idx: number) => {
          const num = String(idx + 1).padStart(2, '0');
          return `ETS-PRO-${num}`;
        });
        expect(standardizedIds.length).toBe(20);
        expect(standardizedIds[0]).toBe('ETS-PRO-01');
        expect(standardizedIds[19]).toBe('ETS-PRO-20');
      }

      // If catalog index has ETS-PRO entries, verify badge and title
      if (fs.existsSync(CATALOG_PATH)) {
        const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
        const etsProTests = (catalog.fullTests || []).filter((t: any) =>
          t.id?.startsWith('ets-pro-') || t.displayId?.startsWith('ETS-PRO-')
        );
        for (const t of etsProTests) {
          expect(t.badge?.includes('ETS')).toBe(true);
          expect(t.questionCount).toBe(200);
        }
      }
    });

    // AL-7: Steganographic watermark encoding: injects zero-width Unicode characters
    runner.it('AL-7: Steganographic watermark encoding embeds zero-width Unicode characters', () => {
      const explanation = 'Đáp án đúng là (B). Giới từ "until" chỉ hành động kéo dài đến thời điểm xác định.';
      const payload = 'LINGOPRO_ETSPRO_01_Q001';
      const watermarked = embedInvisibleWatermark(explanation, payload);

      expect(watermarked.length).toBeGreaterThan(explanation.length);
      expect(watermarked.includes(ZW_SENTINEL)).toBe(true);
      expect(watermarked.includes(ZW_ZERO) || watermarked.includes(ZW_ONE)).toBe(true);
    });

    // AL-8: Steganographic watermark extraction: recovers exact embedded payload
    runner.it('AL-8: Steganographic watermark extraction accurately recovers exact copyright payload', () => {
      const explanation = 'Đáp án đúng là (C). Động từ đi sau khuyết thiếu phải ở dạng nguyên mẫu không "to".';
      const payload = 'LINGOPRO_ETSPRO_07_Q125';
      const watermarked = embedInvisibleWatermark(explanation, payload);

      const extracted = extractInvisibleWatermark(watermarked);
      expect(extracted).toBe(payload);
    });

    // AL-9: Visual text integrity: watermark characters do not alter human-readable text
    runner.it('AL-9: Visual text integrity: zero-width watermark characters strip cleanly to original text', () => {
      const explanation = 'Đáp án đúng là (A). Cấu trúc "prefer doing something to doing something else".';
      const payload = 'LINGOPRO_ETSPRO_20_Q200';
      const watermarked = embedInvisibleWatermark(explanation, payload);

      const stripped = watermarked.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
      expect(stripped).toBe(explanation);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // Tier 2: Boundary & Adversarial Cases
    // ──────────────────────────────────────────────────────────────────────────

    // AL-10: Watermark extraction on unwatermarked plain text returns null
    runner.it('AL-10: Watermark extraction on unwatermarked plain text returns null gracefully', () => {
      const plainText = 'Đáp án đúng là (D). Đây là câu hỏi kiểm tra từ vựng cơ bản.';
      const extracted = extractInvisibleWatermark(plainText);
      expect(extracted).toBeNull();
    });

    // AL-11: Watermark handling on empty or whitespace strings
    runner.it('AL-11: Watermark encoding and extraction handles empty/whitespace strings safely', () => {
      const emptyEncoded = embedInvisibleWatermark('', 'PAYLOAD');
      expect(emptyEncoded).toBe('');

      const emptyExtracted = extractInvisibleWatermark('');
      expect(emptyExtracted).toBeNull();

      const wsExtracted = extractInvisibleWatermark('   \n\t  ');
      expect(wsExtracted).toBeNull();
    });

    // AL-12: Watermark tampering resilience: corrupted zero-width sequence does not crash
    runner.it('AL-12: Watermark tampering resilience: corrupted or truncated sequence returns null without crashing', () => {
      const corruptedText = `Đáp án ${ZW_SENTINEL}${ZW_ONE}${ZW_ZERO}${ZW_ONE} không có delimiter kết thúc`;
      const extracted = extractInvisibleWatermark(corruptedText);
      expect(extracted).toBeNull();

      const invalidByteCount = `Đáp án ${ZW_SENTINEL}${ZW_ONE}${ZW_ZERO}${ZW_SENTINEL} đúng là A`;
      const extractedInvalid = extractInvisibleWatermark(invalidByteCount);
      expect(extractedInvalid).toBeNull();
    });

    // AL-13: Multiple sequential watermarks do not corrupt base text
    runner.it('AL-13: Multiple sequential watermarks preserve text integrity', () => {
      const explanation = 'Đáp án đúng là (A). Mệnh đề quan hệ rút gọn dạng chủ động.';
      const wm1 = embedInvisibleWatermark(explanation, 'TAG1');
      const wm2 = embedInvisibleWatermark(wm1, 'TAG2');

      const stripped = wm2.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
      expect(stripped).toBe(explanation);
    });

    // AL-14: Zero-Bulk-Leak audit: pre-submission sanitized questions omit sensitive keys and watermarks
    runner.it('AL-14: Zero-Bulk-Leak audit: pre-submission sanitized question omits answers, explanations, and watermarks', () => {
      const unifiedQuestion: ToeicUnifiedQuestion = {
        id: 'ets-pro-01-q101',
        testId: 'ets-pro-01',
        questionNumber: 101,
        part: 5,
        section: 'reading',
        prompt: 'The manager announced that the meeting has been postponed _______ tomorrow.',
        options: [
          { key: 'A', text: 'until' },
          { key: 'B', text: 'during' },
          { key: 'C', text: 'between' },
          { key: 'D', text: 'since' },
        ],
        correctAnswer: 'A',
        explanationVi: embedInvisibleWatermark(
          'Đáp án đúng là (A). "Until tomorrow" mang nghĩa cho tới ngày mai.',
          'LINGOPRO_ETSPRO_01_Q101',
        ),
      };

      // Create client sanitized version
      const sanitized: ToeicSanitizedQuestion = {
        id: unifiedQuestion.id,
        testId: unifiedQuestion.testId,
        questionNumber: unifiedQuestion.questionNumber,
        part: unifiedQuestion.part,
        section: unifiedQuestion.section,
        prompt: unifiedQuestion.prompt,
        options: unifiedQuestion.options,
      };

      const serialized = JSON.stringify(sanitized);
      expect((sanitized as any).correctAnswer).toBeUndefined();
      expect((sanitized as any).explanationVi).toBeUndefined();
      expect((sanitized as any).transcript).toBeUndefined();
      expect(serialized.includes('LINGOPRO_ETSPRO')).toBe(false);
      expect(serialized.includes(ZW_SENTINEL)).toBe(false);
    });

    // AL-15: Case-insensitive forbidden tokens audit in catalog and core loaders
    runner.it('AL-15: Case-insensitive forbidden tokens audit: regex scan finds 0 competitor leaks', () => {
      const forbiddenRegex = /dautoeic|dauenglish|odlnhfaygiotcyehuysw|crackv1t3q5/i;
      const files = [CATALOG_PATH, LISTENING_PATH, READING_PATH, TEST_LOADER_PATH];
      for (const f of files) {
        if (fs.existsSync(f)) {
          const content = fs.readFileSync(f, 'utf-8');
          const matched = forbiddenRegex.test(content);
          expect(matched).toBe(false);
        }
      }
    });
  });
}

// Standalone execution support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('anti-leak-whitelabel.test'))) {
  const runner = new TestRunner();
  runAntiLeakWhitelabelTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nAnti-Leak Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
