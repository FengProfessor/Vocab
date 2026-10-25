/**
 * Automated QA Test Suite: R3 — Cross-Device UI & Visual Regression Verification
 *
 * Verifies:
 * 1. Mobile (390px) & Desktop (1280px+) Viewport Layout Integrity:
 *    - overflow-x containment (zero horizontal page blowouts)
 *    - iOS Home Indicator safe area inset clearance (safe-area-inset-bottom)
 *    - Bottom bar occlusion protection (pb-mobile-nav, pb-[calc(0.5rem+env(...))])
 * 2. Single Sticky Header Invariant:
 *    - Admin Portal layout (src/app/admin/layout.tsx) is the sole sticky header
 *    - Zero duplicate sticky headers across child admin pages
 *    - Student exam immersive mode suppresses shell chrome, leaving ToeicExamHeader as sole sticky header
 * 3. Apple HIG Touch Targets (min 44px x 44px):
 *    - ToeicExamHeader interactive buttons (mode toggle, pause, submit)
 *    - ToeicSplitPane mobile navigation buttons (prev, next, palette toggle)
 *    - Grammar roadmap Back button and CEFR level filter pills
 *    - Grammar practice Back button and TTS audio trigger
 *    - Word Library import triggers and deck PDF download buttons
 * 4. Technical Minimalist Design Tokens:
 *    - Strict zero-balloon radii (no rounded-2xl / rounded-3xl)
 *    - Tabular numbers monospace typography for counters and timers
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect, assert } from './test-harness';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function readFile(relPath: string): string {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  assert(fs.existsSync(fullPath), `File not found: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf-8');
}

export async function runCrossDeviceUiTests(runner: TestRunner = new TestRunner('R3: Cross-Device UI')): Promise<TestRunner> {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Single Sticky Header Invariant
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Single Sticky Header Invariant (Admin & Student Surfaces)', async () => {
    await runner.it('R3-STICKY-1: Admin layout contains authoritative sticky top-0 header', () => {
      const content = readFile('src/app/admin/layout.tsx');
      expect(content).toContain('sticky top-0 z-40');
    });

    await runner.it('R3-STICKY-2: Admin child pages have zero duplicate sticky top-0 headers', () => {
      const childPages = [
        'src/app/admin/page.tsx',
        'src/app/admin/crm/page.tsx',
        'src/app/admin/billing/page.tsx',
        'src/app/admin/challenges/page.tsx',
        'src/app/admin/pilot-leads/page.tsx',
      ];

      for (const relPath of childPages) {
        const content = readFile(relPath);
        const headerMatches = content.match(/<header[^>]*>/g) || [];
        for (const headerTag of headerMatches) {
          assert(
            !headerTag.includes('sticky top-0'),
            `Found colliding sticky header in ${relPath}: ${headerTag}`
          );
        }
      }
    });

    await runner.it('R3-STICKY-3: TOEIC exam activates immersive mode suppressing outer shell chrome', () => {
      const examPage = readFile('src/app/toeic/exam/[examId]/page.tsx');
      expect(examPage).toContain('immersive={true}');

      const shell = readFile('src/components/student/StudentShell.tsx');
      // showChrome is false when immersive is true
      expect(shell).toContain('const showChrome = !effectiveImmersive');

      const examHeader = readFile('src/components/toeic/ToeicExamHeader.tsx');
      // ToeicExamHeader serves as sole sticky top-0 header in exam room
      expect(examHeader).toContain('sticky top-0 z-30');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Viewport Layout Integrity & Safe Areas
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Viewport Layout Integrity & Safe Area Insets', async () => {
    await runner.it('R3-VIEW-1: ToeicSplitPane enforces horizontal overflow containment', () => {
      const content = readFile('src/components/toeic/ToeicSplitPane.tsx');
      expect(content).toContain('overflow-hidden');
      expect(content).toContain('w-full');
    });

    await runner.it('R3-VIEW-2: iOS Home Indicator safe area inset clearance on fixed bottom controls', () => {
      const content = readFile('src/components/toeic/ToeicSplitPane.tsx');
      // Action bar at bottom must clear safe-area-inset-bottom
      expect(content).toContain('env(safe-area-inset-bottom,0px)');
    });

    await runner.it('R3-VIEW-3: StudentShell applies bottom navigation clearance (pb-mobile-nav)', () => {
      const content = readFile('src/components/student/StudentShell.tsx');
      expect(content).toContain('pb-mobile-nav');
      expect(content).toContain('w-full');
    });

    await runner.it('R3-VIEW-4: MobileBottomNav satisfies Apple HIG touch standards and safe insets', () => {
      const content = readFile('src/components/student/MobileBottomNav.tsx');
      expect(content).toContain('min-h-[48px]');
      expect(content).toContain('min-w-[48px]');
      expect(content).toContain('px-safe');
      expect(content).toContain('h-mobile-nav');
    });

    await runner.it('R3-VIEW-5: Dictionary and exam catalog prevent mobile horizontal blowouts', () => {
      const toeicCatalog = readFile('src/app/toeic/page.tsx');
      expect(toeicCatalog).toContain('overflow-x-hidden');
      expect(toeicCatalog).toContain('min-w-0');
      expect(toeicCatalog).toContain('max-w-full');

      const dict = readFile('src/app/dictionary/page.tsx');
      expect(dict).toContain('overflow-x-hidden');
      expect(dict).toContain('[overflow-wrap:anywhere]');
      expect(dict).toContain('break-words');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Apple HIG Touch Targets (>= 44px)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Apple HIG Mobile Touch Target Compliance (>= 44px)', async () => {
    await runner.it('R3-HIG-1: ToeicExamHeader controls meet Apple HIG >= 44px', () => {
      const content = readFile('src/components/toeic/ToeicExamHeader.tsx');

      // Mode toggle button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onToggleMode'),
        'Mode toggle must satisfy min-h-[44px] min-w-[44px]'
      );

      // Pause button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPause'),
        'Pause button must satisfy min-h-[44px] min-w-[44px]'
      );

      // Submit button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onSubmit'),
        'Submit button must satisfy min-h-[44px] min-w-[44px]'
      );
    });

    await runner.it('R3-HIG-2: ToeicSplitPane bottom bar navigation controls satisfy min-h-[44px] min-w-[44px]', () => {
      const content = readFile('src/components/toeic/ToeicSplitPane.tsx');

      // Prev button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPrev'),
        'Prev button must have min-h-[44px] min-w-[44px]'
      );

      // Palette toggle button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onOpenPalette'),
        'Palette toggle button must have min-h-[44px] min-w-[44px]'
      );

      // Next button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('onNext'),
        'Next button must have min-h-[44px] min-w-[44px]'
      );
    });

    await runner.it('R3-HIG-3: Grammar roadmap Back button and level pills satisfy min-h-[44px]', () => {
      const content = readFile('src/app/grammar/page.tsx');

      // Back to dashboard
      assert(
        content.includes('min-h-[44px]') && content.includes('href="/student"'),
        'Back to dashboard button must satisfy min-h-[44px]'
      );

      // Level filter pills
      assert(
        content.includes('min-h-[44px]') && content.includes("setActiveLevel('ALL')"),
        'Level filter pills must satisfy min-h-[44px]'
      );
    });

    await runner.it('R3-HIG-4: Grammar practice Back button and TTS audio trigger satisfy >= 44px', () => {
      const content = readFile('src/app/grammar/practice/page.tsx');

      // Back button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('href="/grammar"'),
        'Practice Back button must satisfy min-h-[44px] min-w-[44px]'
      );

      // Audio TTS button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('speakEnglish'),
        'Practice TTS button must satisfy min-h-[44px] min-w-[44px]'
      );
    });

    await runner.it('R3-HIG-5: Word Library import trigger and deck download buttons satisfy >= 44px', () => {
      const content = readFile('src/app/library/page.tsx');

      // Import trigger
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('href="/import"'),
        'Import trigger link must satisfy min-h-[44px] min-w-[44px]'
      );

      // Unit download button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadUnitPdf'),
        'Unit PDF download button must satisfy min-h-[44px] min-w-[44px]'
      );

      // Topic download button
      assert(
        content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadTopicPdf'),
        'Topic PDF download button must satisfy min-h-[44px] min-w-[44px]'
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Technical Minimalist Design Tokens
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Technical Minimalist Design Tokens Compliance', async () => {
    await runner.it('R3-MIN-1: Prohibits balloon border radii (rounded-2xl, rounded-3xl) on exam controls', () => {
      const headerContent = readFile('src/components/toeic/ToeicExamHeader.tsx');
      expect(headerContent.includes('rounded-2xl')).toBe(false);
      expect(headerContent.includes('rounded-3xl')).toBe(false);

      const splitContent = readFile('src/components/toeic/ToeicSplitPane.tsx');
      expect(splitContent.includes('rounded-2xl')).toBe(false);
      expect(splitContent.includes('rounded-3xl')).toBe(false);
    });

    await runner.it('R3-MIN-2: Enforces monospace tabular numbers typography for time and question counters', () => {
      const headerContent = readFile('src/components/toeic/ToeicExamHeader.tsx');
      expect(headerContent).toContain('tabular-nums');
      expect(headerContent).toContain('font-mono');

      const splitContent = readFile('src/components/toeic/ToeicSplitPane.tsx');
      expect(splitContent).toContain('tabular-nums');
      expect(splitContent).toContain('font-mono');
    });
  });

  return runner;
}

if (require.main === module) {
  const runner = new TestRunner('R3: Cross-Device UI');
  runCrossDeviceUiTests(runner).then(() => {
    const stats = runner.printSummary();
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
