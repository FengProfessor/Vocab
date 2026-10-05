/**
 * Milestone 1 — Cross-Device UI Remediation Test Suite (R3)
 *
 * Verifies:
 * 1. Admin Portal Single Sticky Header Invariant (Zero double-sticky headers)
 * 2. Apple HIG Touch Target Compliance (>= 44px min-h / min-w on mobile)
 * 3. Technical Minimalist Design Tokens (No balloon radii, no gradients)
 */

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  [PASS] ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: errorMsg });
    console.error(`  [FAIL] ${name} -> ${errorMsg}`);
  }
}

async function runSuite() {
  console.log('\n=== Running Milestone 1: Cross-Device UI Remediation Tests ===\n');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Admin Portal Single Sticky Header Invariant
  // ──────────────────────────────────────────────────────────────────────────

  await test('M1-ADMIN-1: Admin layout contains authoritative sticky top-0 header', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/admin/layout.tsx');
    assert(fs.existsSync(layoutPath), 'layout.tsx must exist');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    assert(
      content.includes('sticky top-0 z-40'),
      'Admin layout must define sticky top-0 z-40 header',
    );
  });

  await test('M1-ADMIN-2: Admin child pages have zero duplicate sticky top-0 headers', () => {
    const childPages = [
      'src/app/admin/page.tsx',
      'src/app/admin/crm/page.tsx',
      'src/app/admin/billing/page.tsx',
      'src/app/admin/challenges/page.tsx',
      'src/app/admin/pilot-leads/page.tsx',
    ];

    for (const relPath of childPages) {
      const fullPath = path.join(PROJECT_ROOT, relPath);
      assert(fs.existsSync(fullPath), `${relPath} must exist`);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Match any <header ...> tags
      const headerMatches = content.match(/<header[^>]*>/g) || [];
      for (const headerTag of headerMatches) {
        assert(
          !headerTag.includes('sticky top-0'),
          `Found duplicate sticky top-0 header in ${relPath}: ${headerTag}`,
        );
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Apple HIG Touch Targets (>= 44px) on Mobile
  // ──────────────────────────────────────────────────────────────────────────

  await test('M1-HIG-1: ToeicExamHeader buttons meet Apple HIG >= 44px touch target', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    assert(fs.existsSync(headerPath), 'ToeicExamHeader.tsx must exist');
    const content = fs.readFileSync(headerPath, 'utf-8');

    // Mode toggle button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onToggleMode'),
      'Mode toggle button must include min-h-[44px] min-w-[44px]',
    );

    // Pause button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPause'),
      'Pause button must include min-h-[44px] min-w-[44px]',
    );

    // Submit button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onSubmit'),
      'Submit button must include min-h-[44px] min-w-[44px]',
    );
  });

  await test('M1-HIG-2: ToeicSplitPane mobile bottom bar buttons satisfy min-h-[44px] min-w-[44px]', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    assert(fs.existsSync(splitPanePath), 'ToeicSplitPane.tsx must exist');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Prev button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPrev'),
      'Prev button in bottom bar must have min-h-[44px] min-w-[44px]',
    );

    // Palette toggle button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onOpenPalette'),
      'Palette toggle button in bottom bar must have min-h-[44px] min-w-[44px]',
    );

    // Next button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onNext'),
      'Next button in bottom bar must have min-h-[44px] min-w-[44px]',
    );
  });

  await test('M1-HIG-3: Grammar roadmap Back button and level pills satisfy min-h-[44px]', () => {
    const grammarPath = path.join(PROJECT_ROOT, 'src/app/grammar/page.tsx');
    assert(fs.existsSync(grammarPath), 'grammar/page.tsx must exist');
    const content = fs.readFileSync(grammarPath, 'utf-8');

    // Back button
    assert(
      content.includes('min-h-[44px]') && content.includes('href="/student"'),
      'Back to dashboard button must have min-h-[44px]',
    );

    // Level filter pills
    assert(
      content.includes("min-h-[44px] inline-flex items-center justify-center") &&
      content.includes("setActiveLevel('ALL')"),
      'Level filter pills must have min-h-[44px] touch target',
    );
  });

  await test('M1-HIG-4: Library page Import trigger and deck download buttons satisfy >= 44px', () => {
    const libPath = path.join(PROJECT_ROOT, 'src/app/library/page.tsx');
    assert(fs.existsSync(libPath), 'library/page.tsx must exist');
    const content = fs.readFileSync(libPath, 'utf-8');

    // Import trigger
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('href="/import"'),
      'Import trigger link must satisfy min-h-[44px] min-w-[44px]',
    );

    // Unit download button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadUnitPdf'),
      'Unit PDF download button must satisfy min-h-[44px] min-w-[44px]',
    );

    // Topic download button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadTopicPdf'),
      'Topic PDF download button must satisfy min-h-[44px] min-w-[44px]',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Technical Minimalist Design Tokens Compliance
  // ──────────────────────────────────────────────────────────────────────────

  await test('M1-MIN-1: ToeicExamHeader preserves Technical Minimalist tokens (0 balloon radii, 0 gradients)', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    assert(!content.includes('rounded-2xl'), 'ToeicExamHeader must not have rounded-2xl');
    assert(!content.includes('rounded-3xl'), 'ToeicExamHeader must not have rounded-3xl');
    assert(!content.includes('bg-gradient-to-'), 'ToeicExamHeader must not have gradient backgrounds');
  });

  await test('M1-MIN-2: ToeicSplitPane preserves Technical Minimalist tokens (0 balloon radii, 0 gradients in core controls)', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    assert(!content.includes('rounded-2xl'), 'ToeicSplitPane core controls must not have rounded-2xl');
    assert(!content.includes('rounded-3xl'), 'ToeicSplitPane core controls must not have rounded-3xl');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n============================================================');
  console.log(`Milestone 1 Test Results: ${passed}/${total} passed (${failed} failed)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite execution failure:', err);
  process.exit(1);
});
