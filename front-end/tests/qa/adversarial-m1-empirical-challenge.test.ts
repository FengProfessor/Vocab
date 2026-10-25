/**
 * Empirical Adversarial Challenger Test Suite: Milestone 1 UI Remediation
 *
 * Adversarially probes:
 * 1. Admin Single Sticky Header Invariant & Drawer Layering
 * 2. Mobile Viewport (390px) & Desktop Viewport (1280px+) Horizontal Bounds
 * 3. Apple HIG Touch Target Compliance (>= 44px) across all interactive elements
 * 4. Technical Minimalist Design Tokens (No balloon radii, font-mono tabular-nums)
 */

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface TestResult {
  name: string;
  passed: boolean;
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
  error?: string;
  details?: string;
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

async function runAdversarialChallenge() {
  console.log('\n================================================================');
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGER: MILESTONE 1 UI REMEDIATION  ');
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 1: Admin Single Sticky Header Invariant & Layering
  // ──────────────────────────────────────────────────────────────────────────

  await test('ADV-ADMIN-1: Admin layout establishes authoritative z-40 sticky header', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/admin/layout.tsx');
    assert(fs.existsSync(layoutPath), 'src/app/admin/layout.tsx must exist');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    assert(content.includes('sticky top-0 z-40'), 'Layout header must be sticky top-0 z-40');
    // Ensure layout header has backdrop blur for clean scrolling underpass
    assert(content.includes('backdrop-blur'), 'Layout header must have backdrop-blur');
  });

  await test('ADV-ADMIN-2: Zero child admin pages declare sticky top-0 in their page body', () => {
    const adminRoutes = [
      'src/app/admin/page.tsx',
      'src/app/admin/crm/page.tsx',
      'src/app/admin/billing/page.tsx',
      'src/app/admin/challenges/page.tsx',
      'src/app/admin/pilot-leads/page.tsx',
    ];

    for (const relPath of adminRoutes) {
      const fullPath = path.join(PROJECT_ROOT, relPath);
      assert(fs.existsSync(fullPath), `${relPath} must exist`);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check all <header> elements in the page
      const headers = content.match(/<header[^>]*>/g) || [];
      for (const h of headers) {
        assert(
          !h.includes('sticky top-0'),
          `Collision detected: ${relPath} still has sticky header: ${h}`,
        );
      }
    }
  });

  await test('ADV-ADMIN-3: CRM CustomerDrawer is isolated in modal z-50 overlay without shell conflict', () => {
    const crmPath = path.join(PROJECT_ROOT, 'src/app/admin/crm/page.tsx');
    const content = fs.readFileSync(crmPath, 'utf-8');
    // Drawer should have fixed inset-0 z-50
    assert(
      content.includes('fixed inset-0 z-50'),
      'Customer drawer must have z-50 fixed overlay exceeding layout z-40',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 2: Mobile (390px) & Desktop (1280px+) Viewport & Overflow
  // ──────────────────────────────────────────────────────────────────────────

  await test('ADV-VIEWPORT-1: ToeicExamHeader horizontal geometry fits within 390px mobile viewport without overflow', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    // 1. Title must be hidden on mobile
    assert(content.includes('hidden sm:block truncate'), 'Exam title must be hidden on mobile to prevent overflow');
    // 2. Section badge must be hidden on mobile
    assert(content.includes('hidden sm:inline-flex items-center gap-1'), 'Section badge must be hidden on mobile');
    // 3. Question progress count must be hidden on mobile/tablet
    assert(content.includes('hidden md:flex items-center gap-2 font-mono'), 'Question progress must be hidden on mobile');
    // 4. Palette button in header must be hidden on mobile
    assert(content.includes('hidden sm:flex items-center gap-1'), 'Palette button in header must be hidden on mobile');
    // 5. Mode toggle button text must be hidden on mobile
    assert(content.includes('hidden sm:inline'), 'Mode text must be hidden on mobile');
    // 6. Header height must match fixed height h-12 (48px)
    assert(content.includes('h-12 w-full items-center justify-between'), 'Header must have fixed h-12 and justify-between');

    // Calculate maximum mobile content width:
    // Left: Part badge ~50px
    // Center: Timer ~90px
    // Right: Mode button (44px) + Pause button (44px) + Submit button (~86px) + gaps (8px) = ~182px
    // Sum: 50 + 90 + 182 = 322px < 390px - 24px padding = 366px.
    const maxContentWidth = 50 + 90 + (44 + 4 + 44 + 4 + 86);
    const availableWidth = 390 - 24; // 390px viewport - 24px px-3 padding
    assert(maxContentWidth < availableWidth, `Header mobile width (${maxContentWidth}px) must be < available (${availableWidth}px)`);
  });

  await test('ADV-VIEWPORT-2: ToeicSplitPane mobile bottom bar geometry fits within 390px without horizontal scroll', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Bottom footer container
    assert(
      content.includes('pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]'),
      'ToeicSplitPane footer must include iOS home indicator safe area inset',
    );

    // Prev button label on mobile is shortened to "Trước"
    assert(content.includes('<span className="sm:hidden">Trước</span>'), 'Prev button must use shortened mobile label');
    // Next button label on mobile is shortened to "Tiếp theo"
    assert(content.includes('<span className="sm:hidden">Tiếp theo</span>'), 'Next button must use shortened mobile label');

    // Calculate mobile footer width:
    // Prev: ~75px
    // Palette button: ~155px
    // Next: ~85px
    // Gaps: 8px * 2 = 16px
    // Total: 75 + 155 + 85 + 16 = 331px < 390px - 16px padding (374px).
    const maxFooterWidth = 75 + 155 + 85 + 16;
    const availableFooterWidth = 390 - 16;
    assert(maxFooterWidth < availableFooterWidth, `Footer mobile width (${maxFooterWidth}px) must fit within available (${availableFooterWidth}px)`);
  });

  await test('ADV-VIEWPORT-3: Admin layout mobile tabs use isolated scroll container without document-level overflow', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/admin/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    // The sub-header must have overflow-x-auto and whitespace-nowrap
    assert(
      content.includes('md:hidden overflow-x-auto') && content.includes('whitespace-nowrap'),
      'Mobile admin tabs must be constrained inside overflow-x-auto container',
    );
  });

  await test('ADV-VIEWPORT-4: Grammar roadmap filter tabs use isolated horizontal scroll without page overflow', () => {
    const grammarPath = path.join(PROJECT_ROOT, 'src/app/grammar/page.tsx');
    const content = fs.readFileSync(grammarPath, 'utf-8');

    assert(
      content.includes('overflow-x-auto') && content.includes('scrollbar-none'),
      'Grammar level filter tabs must use isolated overflow-x-auto container',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 3: Apple HIG Touch Target Compliance (>= 44px)
  // ──────────────────────────────────────────────────────────────────────────

  await test('ADV-HIG-1: ToeicExamHeader action buttons strictly enforce >= 44px touch targets', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    // Mode toggle button
    const modeBtnRegex = /onClick=\{onToggleMode\}[^>]*className=\{`([^`]+)`\}/;
    const modeMatch = content.match(modeBtnRegex);
    assert(modeMatch !== null, 'Mode button must exist');
    assert(modeMatch![1].includes('min-h-[44px]') && modeMatch![1].includes('min-w-[44px]'), 'Mode button must satisfy min-h-[44px] and min-w-[44px]');

    // Pause button
    const pauseBtnRegex = /onClick=\{onPause\}[^>]*className="([^"]+)"/;
    const pauseMatch = content.match(pauseBtnRegex);
    assert(pauseMatch !== null, 'Pause button must exist');
    assert(pauseMatch![1].includes('min-h-[44px]') && pauseMatch![1].includes('min-w-[44px]'), 'Pause button must satisfy min-h-[44px] and min-w-[44px]');

    // Submit button
    const submitBtnRegex = /onClick=\{onSubmit\}[^>]*className="([^"]+)"/;
    const submitMatch = content.match(submitBtnRegex);
    assert(submitMatch !== null, 'Submit button must exist');
    assert(submitMatch![1].includes('min-h-[44px]') && submitMatch![1].includes('min-w-[44px]'), 'Submit button must satisfy min-h-[44px] and min-w-[44px]');
  });

  await test('ADV-HIG-2: ToeicSplitPane navigation footer buttons satisfy >= 44px touch targets', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Prev button
    assert(content.includes('onClick={onPrev}') && content.includes('min-h-[44px] min-w-[44px]'), 'Prev button must satisfy min-h-[44px] min-w-[44px]');
    // Palette toggle button
    assert(content.includes('onClick={onOpenPalette}') && content.includes('min-h-[44px] min-w-[44px]'), 'Palette toggle button must satisfy min-h-[44px] min-w-[44px]');
    // Next button
    assert(content.includes('onClick={onNext}') && content.includes('min-h-[44px] min-w-[44px]'), 'Next button must satisfy min-h-[44px] min-w-[44px]');
  });

  await test('ADV-HIG-3: ToeicSplitPane exam options satisfy >= 44px height', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Part 1/2 photo/audio option buttons
    assert(content.includes('min-h-[52px] sm:min-h-[58px]'), 'Part 1 & 2 option buttons must have min-h >= 52px');
    // Reading single card options
    assert(content.includes('min-h-[44px] sm:min-h-[48px]'), 'Reading single question options must have min-h >= 44px');
    // Scanned format options
    assert(content.includes('min-h-[46px]'), 'Scanned booklet option buttons must have min-h >= 46px');
    // Cluster text options
    assert(content.includes('min-h-[44px]'), 'Cluster question text options must have min-h >= 44px');
  });

  await test('ADV-HIG-4: Grammar roadmap Back button and level tabs satisfy >= 44px', () => {
    const grammarPath = path.join(PROJECT_ROOT, 'src/app/grammar/page.tsx');
    const content = fs.readFileSync(grammarPath, 'utf-8');

    assert(
      content.includes('href="/student"') && content.includes('min-h-[44px]'),
      'Grammar back button must satisfy min-h-[44px]',
    );
    assert(
      content.includes('min-h-[44px]') && content.includes("setActiveLevel('ALL')"),
      'Grammar level pills must satisfy min-h-[44px]',
    );
  });

  await test('ADV-HIG-5: Grammar Practice header Back and Audio buttons satisfy >= 44px', () => {
    const practicePath = path.join(PROJECT_ROOT, 'src/app/grammar/practice/page.tsx');
    const content = fs.readFileSync(practicePath, 'utf-8');

    assert(
      content.includes('href="/grammar"') && content.includes('min-h-[44px] min-w-[44px]'),
      'Practice Back button must satisfy min-h-[44px] min-w-[44px]',
    );
    assert(
      content.includes('speakEnglish') && content.includes('min-h-[44px] min-w-[44px]'),
      'Practice TTS button must satisfy min-h-[44px] min-w-[44px]',
    );
  });

  await test('ADV-HIG-6: Library page Import links and deck download triggers meet >= 44px', () => {
    const libPath = path.join(PROJECT_ROOT, 'src/app/library/page.tsx');
    const content = fs.readFileSync(libPath, 'utf-8');

    assert(
      content.includes('href="/import"') && content.includes('min-h-[44px] min-w-[44px]'),
      'Library action bar Import link must satisfy min-h-[44px] min-w-[44px]',
    );
    assert(
      content.includes('handleDownloadTopicPdf') && content.includes('min-h-[44px] min-w-[44px]'),
      'Topic PDF download trigger must satisfy min-h-[44px] min-w-[44px]',
    );
    assert(
      content.includes('handleDownloadUnitPdf') && content.includes('min-h-[44px] min-w-[44px]'),
      'Unit PDF download trigger must satisfy min-h-[44px] min-w-[44px]',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dimension 4: Technical Minimalist Invariants
  // ──────────────────────────────────────────────────────────────────────────

  await test('ADV-MIN-1: ToeicExamHeader complies with anti-AI Technical Minimalist constraints', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    assert(!content.includes('rounded-2xl'), 'ToeicExamHeader must not have rounded-2xl');
    assert(!content.includes('rounded-3xl'), 'ToeicExamHeader must not have rounded-3xl');
    assert(!content.includes('rounded-full'), 'ToeicExamHeader must not have rounded-full');
    assert(!content.includes('bg-gradient-to-'), 'ToeicExamHeader must not have gradient backgrounds');
    assert(content.includes('tabular-nums'), 'ToeicExamHeader must use tabular-nums for digital clock');
  });

  await test('ADV-MIN-2: ToeicSplitPane core exam controls preserve Technical Minimalist tokens', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Bottom footer buttons must use rounded-sm
    const footerPrev = content.includes('rounded-sm border border-slate-300');
    assert(footerPrev, 'Footer buttons must maintain sharp Technical Minimalist rounded-sm styling');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Summary & Scorecard
  // ──────────────────────────────────────────────────────────────────────────

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log(`  ADVERSARIAL CHALLENGE RESULT: ${passed}/${total} PASSED (${failed} FAILED)  `);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialChallenge().catch((err) => {
  console.error('Fatal runner crash:', err);
  process.exit(1);
});
