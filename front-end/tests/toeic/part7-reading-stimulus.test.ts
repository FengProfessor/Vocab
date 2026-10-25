import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import { loadAnyToeicTest, loadToeicPartPractice } from '@/lib/toeic-test-loader';

const ROOT_DIR = path.resolve(__dirname, '../..');
const SPLIT_PANE_PATH = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicSplitPane.tsx');
const SCORE_REPORT_PATH = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicScoreReportView.tsx');

export async function runPart7ReadingStimulusTests(runner: TestRunner) {
  runner.describe('TOEIC Part 7 & Part 6 Reading Stimulus Verification Suite', () => {

    // ── 1. Authentic Dataset Verification (ETS 2024 & 2026) ──
    runner.it('P7-1: ETS 2024 Full Test 01 has valid imageUrl for all Part 7 questions (147-200)', () => {
      const test = loadAnyToeicTest('ets-2024-01');
      const p7 = test.filter((q) => q.part === 7);
      expect(p7.length).toBe(54);

      for (const q of p7) {
        expect(Boolean(q.imageUrl)).toBe(true);
        expect(q.imageUrl?.startsWith('http')).toBe(true);
      }
    });

    runner.it('P7-2: ETS 2026 Full Test 01 has valid imageUrl for all Part 7 questions (147-200)', () => {
      const test = loadAnyToeicTest('ets-2026-01');
      const p7 = test.filter((q) => q.part === 7);
      expect(p7.length).toBe(54);

      for (const q of p7) {
        expect(Boolean(q.imageUrl)).toBe(true);
        expect(q.imageUrl?.startsWith('http')).toBe(true);
      }
    });

    runner.it('P7-3: ETS 2024 & 2026 Full Tests have valid imageUrl for Part 6 questions (131-146)', () => {
      const test24 = loadAnyToeicTest('ets-2024-01');
      const p6_24 = test24.filter((q) => q.part === 6);
      expect(p6_24.length).toBe(16);
      for (const q of p6_24) {
        expect(Boolean(q.imageUrl)).toBe(true);
      }

      const test26 = loadAnyToeicTest('ets-2026-01');
      const p6_26 = test26.filter((q) => q.part === 6);
      expect(p6_26.length).toBe(16);
      for (const q of p6_26) {
        expect(Boolean(q.imageUrl)).toBe(true);
      }
    });

    // ── 2. Stimulus Grouping Integrity ──
    runner.it('P7-4: Questions sharing the same imageUrl in Part 7 stay grouped together in practice mode', () => {
      const p7Practice = loadToeicPartPractice(7, 'ets-2024-01', 10, false);
      expect(p7Practice.length).toBeGreaterThan(0);

      // Questions 147 and 148 should have the exact same imageUrl
      const q147 = p7Practice.find((q) => q.questionNumber === 147);
      const q148 = p7Practice.find((q) => q.questionNumber === 148);
      if (q147 && q148) {
        expect(q147.imageUrl).toBe(q148.imageUrl);
      }
    });

    runner.it('P7-5: Part 6 questions sharing the same imageUrl stay grouped together (4 questions per passage)', () => {
      const p6Practice = loadToeicPartPractice(6, 'ets-2024-01', 8, false);
      expect(p6Practice.length).toBeGreaterThan(0);

      const q131 = p6Practice.find((q) => q.questionNumber === 131);
      const q132 = p6Practice.find((q) => q.questionNumber === 132);
      if (q131 && q132) {
        expect(q131.imageUrl).toBe(q132.imageUrl);
      }
    });

    // ── 3. Split-Pane Source Code Verification (ToeicSplitPane.tsx) ──
    runner.it('P7-6: ToeicSplitPane identifies reading parts and activates isReadingWithPassage for imageUrl', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      expect(splitCode.includes('question.part === 6 || question.part === 7')).toBe(true);
      expect(splitCode.includes('hasReadingPassageImage = Boolean(isReadingPart && question.imageUrl)')).toBe(true);
      expect(splitCode.includes('isReadingWithPassage = hasReadingPassageText || hasReadingPassageImage')).toBe(true);
    });

    runner.it('P7-7: ToeicSplitPane renders Part 6 & 7 image stimulus block with zoom button and responsive img', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      expect(splitCode.includes('Part 6 & Part 7 Reading Image Stimulus')).toBe(true);
      expect(splitCode.includes('setIsImageZoomed(true)')).toBe(true);
      expect(splitCode.includes('cursor-zoom-in')).toBe(true);
      expect(splitCode.includes('Part 7 — Đoạn văn đọc hiểu')).toBe(true);
      expect(splitCode.includes('Part 6 — Văn bản đọc điền')).toBe(true);
      expect(splitCode.includes('Phóng to')).toBe(true);
    });

    runner.it('P7-8: ToeicSplitPane preserves mobile tab across questions within the same reading passage', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      expect(splitCode.includes('prevPassageRef')).toBe(true);
      expect(splitCode.includes('question.passage !== prevPassageRef.current')).toBe(true);
      expect(splitCode.includes('stimulusKey !== prevPassageRef.current')).toBe(true);
    });

    // ── 4. Review Mode Verification (ToeicScoreReportView.tsx) ──
    runner.it('P7-9: ToeicScoreReportView renders Part 6 & 7 reading documents in high-resolution wide view', () => {
      const reportCode = fs.readFileSync(SCORE_REPORT_PATH, 'utf8');

      expect(reportCode.includes('q.part === 6 || q.part === 7')).toBe(true);
      expect(reportCode.includes('max-w-2xl flex justify-center')).toBe(true);
    });
  });
}
