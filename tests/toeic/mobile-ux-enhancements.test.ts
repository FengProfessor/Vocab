import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';
import catalogIndexRaw from '@/data/toeic/toeic-catalog-index.json';

const ROOT_DIR = path.resolve(__dirname, '../..');
const TOEIC_PAGE_PATH = path.resolve(ROOT_DIR, 'src/app/toeic/page.tsx');
const TOEIC_EXAM_PATH = path.resolve(ROOT_DIR, 'src/app/toeic/exam/[examId]/page.tsx');
const SPLIT_PANE_PATH = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicSplitPane.tsx');

export async function runMobileUxEnhancementTests(runner: TestRunner) {
  runner.describe('Mobile UX & Dynamic Statistics Verification Suite', () => {

    // ── 1. Dynamic Numbers & Catalog Integrity ──
    runner.it('MUX-1: Catalog index reflects exact authentic question count (19,175) and full tests count (61)', () => {
      const catalog = catalogIndexRaw as any;
      expect(catalog.totalQuestions).toBe(19175);
      expect(catalog.totalFullTests).toBe(61);
      expect(catalog.fullTests.length).toBe(61);

      const count200q = catalog.fullTests.filter((t: any) => t.questionCount === 200).length;
      expect(count200q).toBe(48);
    });

    runner.it('MUX-2: Hub page (page.tsx) dynamically computes Part 1-7 stats and total question count without hardcoding', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      // Check dynamic function presence
      expect(pageCode.includes('getCatalogPartStats')).toBe(true);
      expect(pageCode.includes('PART_DEFINITIONS_RAW')).toBe(true);

      // Check total questions uses dynamic formatting
      expect(pageCode.includes('totalQuestionsFormatted')).toBe(true);
      expect(pageCode.includes('totalFullTestsCount')).toBe(true);
      expect(pageCode.includes('totalPracticeQuestionsFormatted')).toBe(true);
      expect(pageCode.includes('totalPracticeSetsCount')).toBe(true);

      // Verify no legacy hardcoded 15.175 in hero cards or Part bar
      expect(pageCode.includes('>15.175<')).toBe(false);
      expect(pageCode.includes('15.175 Câu Hỏi')).toBe(false);
      expect(pageCode.includes('{totalQuestionsFormatted} Câu Hỏi')).toBe(true);
    });

    // ── 2. Exam Room Layout & Navigation Fixes (ToeicSplitPane) ──
    runner.it('MUX-3: Options layout enforces horizontal row for Part 1/2 and 1-column for Part 3-7', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      // Part 1 & 2 branch
      expect(splitCode.includes('question.part === 1 || question.part === 2')).toBe(true);
      expect(splitCode.includes('grid-cols-4')).toBe(true);
      expect(splitCode.includes('grid-cols-3')).toBe(true);
      expect(splitCode.includes('[ {opt.key} ]')).toBe(true);
      expect(splitCode.includes('whitespace-nowrap')).toBe(true);
      expect(splitCode.includes('px-2 py-3 sm:p-4')).toBe(true);

      // Part 3-7 branch: strictly grid-cols-1
      expect(splitCode.includes('grid-cols-1 gap-2 sm:gap-2.5')).toBe(true);
      // Ensure the old 2x2 grid (grid-cols-2) on mobile for all options is eliminated
      expect(splitCode.includes('grid grid-cols-2 gap-2 lg:grid-cols-1')).toBe(false);
    });

    runner.it('MUX-4: Floating Next button overlay (top-[35%]) and image overlay buttons are completely removed', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      // Ensure no floating right button overlay
      expect(splitCode.includes('top-[35%]')).toBe(false);
      expect(splitCode.includes('fixed right-2.5')).toBe(false);

      // Ensure no overlay next buttons inside photo/graphic
      expect(splitCode.includes('Next Question Overlay Button')).toBe(false);
    });

    runner.it('MUX-5: Navigation footer protects iOS Home Bar with safe-area-inset-bottom padding', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');
      expect(splitCode.includes('pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]')).toBe(true);
    });

    runner.it('MUX-6: Exam Room containers use 100dvh instead of 100vh to avoid iOS Safari layout jumps', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');
      const examCode = fs.readFileSync(TOEIC_EXAM_PATH, 'utf8');

      expect(splitCode.includes('100dvh-48px')).toBe(true);
      expect(splitCode.includes('100vh-48px')).toBe(false);

      expect(examCode.includes('100dvh-48px')).toBe(true);
      expect(examCode.includes('100vh-48px')).toBe(false);
    });

    runner.it('MUX-7: Mobile tab does not reset to "question" within the same reading passage in Part 6 & 7', () => {
      const splitCode = fs.readFileSync(SPLIT_PANE_PATH, 'utf8');

      expect(splitCode.includes('prevPassageRef')).toBe(true);
      expect(splitCode.includes('question.passage !== prevPassageRef.current')).toBe(true);
    });

    // ── 3. Hub TOEIC Layout Improvements (page.tsx) ──
    runner.it('MUX-8: Hub page features compact 1-row Metrics Strip on mobile (sm:hidden)', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      expect(pageCode.includes('sm:hidden mt-4 flex items-center justify-between')).toBe(true);
      expect(pageCode.includes('Kho câu')).toBe(true);
      expect(pageCode.includes('Đề thi')).toBe(true);
      expect(pageCode.includes('hidden sm:grid sm:grid-cols-4')).toBe(true);
    });

    runner.it('MUX-9: Full Test / Practice Switcher is styled as a sleek Segmented Pill Control', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      expect(pageCode.includes('role="tablist"')).toBe(true);
      expect(pageCode.includes('bg-slate-200/80 dark:bg-slate-800/80')).toBe(true);
      expect(pageCode.includes('flex p-1 rounded-sm')).toBe(true);
    });

    runner.it('MUX-10: Part Switcher employs horizontal snap Part Rail on mobile (sm:hidden) and grid on desktop', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      // Mobile rail
      expect(pageCode.includes('sm:hidden flex overflow-x-auto gap-2 pb-1.5 scrollbar-none snap-x snap-mandatory')).toBe(true);
      // Desktop grid
      expect(pageCode.includes('hidden sm:grid sm:grid-cols-4 lg:grid-cols-7')).toBe(true);
    });

    runner.it('MUX-11: Tab 1 Full Test list prevents horizontal overflow on small viewports', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      expect(pageCode.includes('overflow-x-hidden')).toBe(true);
      expect(pageCode.includes('min-w-0 max-w-full')).toBe(true);
      expect(pageCode.includes('grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center')).toBe(true);
    });

    runner.it('MUX-12: Full test question count subline avoids hardcoded (100 LC + 100 RC) on partial tests', () => {
      const pageCode = fs.readFileSync(TOEIC_PAGE_PATH, 'utf8');

      // Ensure 100 LC + 100 RC is conditioned on 200Q, not unconditionally hardcoded
      expect(pageCode.includes("test.questionCount === 200 ? '200 câu (100 LC + 100 RC)' : `${test.questionCount} câu`")).toBe(true);
      expect(pageCode.includes("test.questionCount === 200 ? `${test.questionCount} câu (100 LC + 100 RC)` : `${test.questionCount} câu`")).toBe(true);
    });

  });
}

if (process.argv[1]?.includes('mobile-ux-enhancements.test')) {
  const runner = new TestRunner();
  runMobileUxEnhancementTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nMobile UX Enhancements Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
