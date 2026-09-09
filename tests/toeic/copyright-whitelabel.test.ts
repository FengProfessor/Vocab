/**
 * Copyright & White-Labeling Compliance Test Suite for Project TOEIC.
 *
 * Verifies:
 * - Zero third-party crawler branding (Study4, Estudyme, kslearning, kstoeic) in catalog badges.
 * - Zero " - STUDY4" title suffixes in listening content.
 * - Zero "đối soát theo Study4" or "đối soát chính xác từ đề thi" in reading explanations.
 * - Robust runtime sanitization via sanitizeToeicExplanationText().
 * - UI filter tabs and optgroups present clean ETS-standard titles.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import {
  getToeicCatalogIndex,
  sanitizeToeicExplanationText,
  loadAnyToeicTest,
} from '../../src/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '../..');
const CATALOG_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/toeic-catalog-index.json');
const LISTENING_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
const READING_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-reading-v1.json');
const TOEIC_PAGE_PATH = path.resolve(ROOT_DIR, 'src/app/toeic/page.tsx');

export async function runCopyrightWhitelabelTests(runner: TestRunner): Promise<void> {
  runner.describe('Copyright & White-Labeling Compliance Suite', () => {
    // CW-1: Catalog Index Badges have zero STUDY4 references
    runner.it('CW-1: Catalog Index badges have zero STUDY4 references', () => {
      const catalog = getToeicCatalogIndex();
      const badges = catalog.fullTests.map((t) => t.badge || '');
      const study4Badges = badges.filter((b) => b.toUpperCase().includes('STUDY4'));
      expect(study4Badges.length).toBe(0);

      const non200Tests = catalog.fullTests.filter((t) => t.questionCount < 200);
      expect(non200Tests.length).toBe(13);
      for (const t of non200Tests) {
        expect(t.badge?.startsWith('ETS ')).toBe(true);
      }
    });

    // CW-2: Listening dataset titles have zero ' - STUDY4' suffixes
    runner.it('CW-2: Listening dataset has zero " - STUDY4" title suffixes and source is white-labeled', () => {
      const rawListening = fs.readFileSync(LISTENING_PATH, 'utf-8');
      const data = JSON.parse(rawListening);

      expect(data.source).toContain('LingoPro');
      expect(data.source.includes('Study4')).toBe(false);

      const matches = rawListening.match(/ - STUDY4/g);
      expect(matches).toBe(null);
    });

    // CW-3: Reading dataset Part 5 questions have zero "Study4" in explanations
    runner.it('CW-3: Reading dataset has zero "Study4" in answer explanations', () => {
      const rawReading = fs.readFileSync(READING_PATH, 'utf-8');
      const matches = rawReading.match(/Study4/gi);
      expect(matches).toBe(null);
    });

    // CW-4: Reading dataset has zero crude "Đối soát chính xác từ đề thi" placeholders
    runner.it('CW-4: Reading dataset has zero raw "Đối soát chính xác từ đề thi" placeholders', () => {
      const rawReading = fs.readFileSync(READING_PATH, 'utf-8');
      const matches = rawReading.match(/Đối soát chính xác từ đề thi/gi);
      expect(matches).toBe(null);
    });

    // CW-5: 30 Part 5 questions (Q101-Q130 test 6852) have high-quality pedagogical explanations
    runner.it('CW-5: Part 5 questions (Q101-Q130) have high-quality pedagogical explanations', () => {
      const rawReading = JSON.parse(fs.readFileSync(READING_PATH, 'utf-8'));
      const p5Questions = rawReading.part5.filter((q: any) => q.setId === 'set-p5-s4-6852');
      expect(p5Questions.length).toBe(30);

      for (const q of p5Questions) {
        expect(typeof q.explain).toBe('string');
        expect(q.explain.length).toBeGreaterThan(40);
        expect(q.explain).toContain('Dịch nghĩa');
        expect(q.explain.toLowerCase().includes('study4')).toBe(false);
      }
    });

    // CW-6: sanitizeToeicExplanationText replaces brand text and handles edge cases
    runner.it('CW-6: sanitizeToeicExplanationText replaces brand text and handles null/empty gracefully', () => {
      const sample1 = 'Đáp án đúng là A. Câu hỏi được đối soát chuẩn xác theo đề thi Study4.';
      const sanitized1 = sanitizeToeicExplanationText(sample1, 'A');
      expect(sanitized1.includes('Study4')).toBe(false);
      expect(sanitized1).toContain('chuẩn khảo thí ETS');

      const sample2 = 'Đáp án đúng là (B). Đối soát chính xác từ đề thi.';
      const sanitized2 = sanitizeToeicExplanationText(sample2, 'B');
      expect(sanitized2.includes('Đối soát chính xác')).toBe(false);
      expect(sanitized2).toContain('chuẩn khảo thí ETS');

      const sanitizedEmpty = sanitizeToeicExplanationText(undefined, 'C');
      expect(sanitizedEmpty).toContain('(C)');
      expect(sanitizedEmpty).toContain('chuẩn khảo thí ETS');
    });

    // CW-7: loadAnyToeicTest returns sanitized questions for both full and part practice
    runner.it('CW-7: loadAnyToeicTest returns sanitized questions with zero Study4 or crude traces', () => {
      const questions = loadAnyToeicTest('6852');
      expect(questions.length).toBe(200);

      for (const q of questions) {
        if (q.explanationVi) {
          expect(q.explanationVi.toLowerCase().includes('study4')).toBe(false);
          expect(q.explanationVi.toLowerCase().includes('đối soát chuẩn xác theo đề thi')).toBe(false);
        }
      }
    });

    // CW-8: UI Filter buttons in page.tsx use professional white-labeled Vietnamese text
    runner.it('CW-8: UI Filter buttons in page.tsx use professional white-labeled Vietnamese text', () => {
      const pageContent = fs.readFileSync(TOEIC_PAGE_PATH, 'utf-8');

      expect(pageContent).toContain('Khảo Thí Chuẩn ETS (21 Đề)');
      expect(pageContent).toContain('Luyện Đề Tinh Hoa ETS (7 Đề 200Q)');
      expect(pageContent).toContain('Series Khảo Thí Chuẩn ETS Format (21 Đề)');
      expect(pageContent).toContain('Series Luyện Đề Tinh Hoa ETS (20 Đề)');

      // Ensure raw strings are not displayed on buttons
      expect(pageContent.includes('>Estudyme ETS Simulation')).toBe(false);
      expect(pageContent.includes('>Study4 ETS Authentic')).toBe(false);
    });
  });
}
