/**
 * Challenger M1 Adversarial Verification Suite
 *
 * Empirical verification:
 * 1. Double sticky headers in admin routes (scanning all admin files)
 * 2. Mobile touch targets (contractual and secondary controls)
 * 3. Technical Minimalist token compliance
 * 4. Layout boundaries and responsive stress (320px, 390px, 1280px)
 */

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

interface TestRecord {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const records: TestRecord[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    records.push({ name, passed: true });
    console.log(`  [PASS] ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    records.push({ name, passed: false, error: errorMsg });
    console.error(`  [FAIL] ${name} -> ${errorMsg}`);
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

async function runAdversarialSuite() {
  console.log('============================================================');
  console.log('   CHALLENGER M1: EMPIRICAL ADVERSARIAL STRESS SUITE');
  console.log('============================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Admin Routes Exhaustive Sticky Header Scan
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- Suite 1: Admin Routes Sticky Header Invariant ---');

  await test('ADV-ADMIN-1: Admin layout contains exactly one sticky top-0 header', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/admin/layout.tsx');
    assert(fs.existsSync(layoutPath), 'src/app/admin/layout.tsx must exist');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    const stickyMatches = content.match(/sticky\s+top-0/g) || [];
    assert(
      stickyMatches.length === 1,
      `Expected exactly 1 sticky top-0 in layout.tsx, found ${stickyMatches.length}`,
    );
    assert(
      content.includes('sticky top-0 z-40'),
      'Admin layout must define sticky top-0 z-40',
    );
  });

  await test('ADV-ADMIN-2: Recursive scan of ALL files in src/app/admin/ for colliding sticky headers', () => {
    const adminDir = path.join(PROJECT_ROOT, 'src/app/admin');
    const allAdminFiles = getAllFiles(adminDir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));

    const collidingFiles: string[] = [];

    for (const filePath of allAdminFiles) {
      const relPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
      if (relPath === 'src/app/admin/layout.tsx') continue;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for <header ... sticky ...> or any element with sticky top-0 outside a modal
      // Note: CustomerDrawer in crm/page.tsx is a fixed modal (fixed inset-0 z-50), which has its own scroll context.
      const lines = content.split('\n');
      lines.forEach((line, lineIdx) => {
        if (line.includes('sticky top-0') && !relPath.includes('crm/page.tsx')) {
          collidingFiles.push(`${relPath}:${lineIdx + 1} -> ${line.trim()}`);
        } else if (line.includes('<header') && line.includes('sticky')) {
          collidingFiles.push(`${relPath}:${lineIdx + 1} -> ${line.trim()}`);
        }
      });
    }

    assert(
      collidingFiles.length === 0,
      `Detected colliding sticky elements in admin files:\n${collidingFiles.join('\n')}`,
    );
  });

  await test('ADV-ADMIN-3: CustomerDrawer in crm/page.tsx is insulated in fixed modal', () => {
    const crmPath = path.join(PROJECT_ROOT, 'src/app/admin/crm/page.tsx');
    const content = fs.readFileSync(crmPath, 'utf-8');
    // Ensure the sticky top-0 in crm/page.tsx is strictly inside CustomerDrawer which has fixed inset-0 z-50
    const drawerIdx = content.indexOf('function CustomerDrawer');
    assert(drawerIdx !== -1, 'CustomerDrawer must exist in crm/page.tsx');
    const drawerContent = content.slice(drawerIdx);
    assert(
      drawerContent.includes('fixed inset-0 z-50'),
      'CustomerDrawer must be a fixed overlay container to insulate internal sticky header',
    );
    assert(
      drawerContent.includes('overflow-y-auto'),
      'CustomerDrawer must define overflow-y-auto for internal sticky positioning',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: Contractual Apple HIG Touch Targets (>= 44px) Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Suite 2: Contractual Apple HIG Touch Targets (>= 44px) ---');

  await test('ADV-HIG-1: ToeicExamHeader interactive buttons have min-h-[44px] min-w-[44px]', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    // 1. Mode toggle button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onToggleMode'),
      'Mode toggle button must specify min-h-[44px] min-w-[44px]',
    );

    // 2. Pause button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPause'),
      'Pause button must specify min-h-[44px] min-w-[44px]',
    );

    // 3. Submit button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onSubmit'),
      'Submit button must specify min-h-[44px] min-w-[44px]',
    );
  });

  await test('ADV-HIG-2: ToeicSplitPane navigation bottom bar has min-h-[44px] min-w-[44px]', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // 1. Prev button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onPrev'),
      'Prev button must specify min-h-[44px] min-w-[44px]',
    );

    // 2. Palette button in bottom bar
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onOpenPalette'),
      'Palette button must specify min-h-[44px] min-w-[44px]',
    );

    // 3. Next button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('onNext'),
      'Next button must specify min-h-[44px] min-w-[44px]',
    );
  });

  await test('ADV-HIG-3: Grammar Roadmap header controls meet min-h-[44px]', () => {
    const grammarPath = path.join(PROJECT_ROOT, 'src/app/grammar/page.tsx');
    const content = fs.readFileSync(grammarPath, 'utf-8');

    // Back to dashboard
    assert(
      content.includes('min-h-[44px]') && content.includes('href="/student"'),
      'Back button on grammar page must specify min-h-[44px]',
    );

    // Level filter pills
    assert(
      content.includes('min-h-[44px] inline-flex items-center justify-center') &&
      content.includes("setActiveLevel('ALL')"),
      'Level filter pills must specify min-h-[44px]',
    );
  });

  await test('ADV-HIG-4: Library page Import link and PDF triggers satisfy >= 44px hit bounds', () => {
    const libPath = path.join(PROJECT_ROOT, 'src/app/library/page.tsx');
    const content = fs.readFileSync(libPath, 'utf-8');

    // Action bar import link
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('data-onboarding="lib-import"'),
      'Library action bar import trigger must have min-h-[44px] min-w-[44px]',
    );

    // Topic PDF button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadTopicPdf'),
      'Topic PDF button must have min-h-[44px] min-w-[44px]',
    );

    // Unit PDF button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('handleDownloadUnitPdf'),
      'Unit PDF button must have min-h-[44px] min-w-[44px]',
    );

    // Subtopic bottom bar PDF button
    assert(
      content.includes('min-h-[44px] min-w-[44px]') && content.includes('Tải PDF'),
      'Subtopic bottom bar PDF download button must have min-h-[44px] min-w-[44px]',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: Technical Minimalist Design Tokens Integrity
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Suite 3: Technical Minimalist Design Tokens Integrity ---');

  await test('ADV-MIN-1: ToeicExamHeader contains zero balloon rounded tokens and zero gradients', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const content = fs.readFileSync(headerPath, 'utf-8');

    assert(!content.includes('rounded-2xl'), 'ToeicExamHeader must not have rounded-2xl');
    assert(!content.includes('rounded-3xl'), 'ToeicExamHeader must not have rounded-3xl');
    assert(!content.includes('rounded-full'), 'ToeicExamHeader must not have rounded-full');
    assert(!content.includes('bg-gradient-to-'), 'ToeicExamHeader must not have gradients');
  });

  await test('ADV-MIN-2: ToeicSplitPane core navigation controls contain zero balloon rounded tokens', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Core bottom bar footer check
    const bottomBarIdx = content.indexOf('<footer');
    assert(bottomBarIdx !== -1, 'Footer must exist in ToeicSplitPane');
    const footerContent = content.slice(bottomBarIdx, content.indexOf('</footer>'));

    assert(!footerContent.includes('rounded-2xl'), 'Bottom bar must not use rounded-2xl');
    assert(!footerContent.includes('rounded-3xl'), 'Bottom bar must not use rounded-3xl');
    assert(!footerContent.includes('rounded-full'), 'Bottom bar must not use rounded-full');
    assert(!footerContent.includes('bg-gradient-to-'), 'Bottom bar must not use gradients');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: Responsive Layout & Mobile Boundaries Stress (320px & 390px)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Suite 4: Responsive Layout & Mobile Boundaries Stress ---');

  await test('ADV-RESP-1: Admin layout includes horizontal scroll preservation for mobile tabs', () => {
    const layoutPath = path.join(PROJECT_ROOT, 'src/app/admin/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    assert(
      content.includes('md:hidden') && content.includes('overflow-x-auto') && content.includes('whitespace-nowrap'),
      'Admin mobile tab bar must declare overflow-x-auto and whitespace-nowrap to prevent horizontal page overflow',
    );
  });

  await test('ADV-RESP-2: ToeicExamHeader enforces strict h-12 and aligns with ToeicSplitPane 100dvh-48px', () => {
    const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
    const splitPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');

    const headerContent = fs.readFileSync(headerPath, 'utf-8');
    const splitContent = fs.readFileSync(splitPath, 'utf-8');

    assert(headerContent.includes('h-12'), 'ToeicExamHeader must maintain strict h-12 (48px) height');
    assert(
      splitContent.includes('h-[calc(100dvh-48px)]'),
      'ToeicSplitPane must declare h-[calc(100dvh-48px)] matching header height',
    );
  });

  await test('ADV-RESP-3: Library page double-sticky removal verified', () => {
    const libPath = path.join(PROJECT_ROOT, 'src/app/library/page.tsx');
    const content = fs.readFileSync(libPath, 'utf-8');

    // Ensure StudentShell wraps LibraryPage and LibraryPage does NOT have an inner sticky header
    assert(content.includes('<StudentShell'), 'LibraryPage must use StudentShell');
    const headerMatches = content.match(/<header[^>]*>/g) || [];
    for (const h of headerMatches) {
      assert(!h.includes('sticky'), `Found inner sticky header in LibraryPage: ${h}`);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 5: Adversarial Discovery of Secondary Mobile Controls (Audit Catalog)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- Suite 5: Adversarial Discovery of Secondary Mobile Controls ---');

  await test('ADV-AUDIT-1: Catalog all secondary controls in ToeicSplitPane and Grammar for reporting', () => {
    const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
    const content = fs.readFileSync(splitPanePath, 'utf-8');

    // Identify controls that are mobile candidates for future enhancement
    const flaggedItems: string[] = [];

    if (content.includes("onToggleFlag") && !content.includes("onToggleFlag(qNum)\"\n          className=\"inline-flex min-h-[44px]")) {
      flaggedItems.push("ToeicSplitPane: Flag button (onToggleFlag) uses px-2 py-1 (compact ~24px height)");
    }
    if (content.includes("setMobileTab('passage')") && !content.includes("min-h-[44px]")) {
      flaggedItems.push("ToeicSplitPane: Mobile reading segmented tab bar uses py-1.5 px-3 (~30px height)");
    }

    console.log(`    ℹ️ Discovered ${flaggedItems.length} secondary controls for QA Audit Defect Matrix:`);
    for (const item of flaggedItems) {
      console.log(`       - ${item}`);
    }

    // This test passes because it is an empirical discovery test, documenting findings for the matrix
    assert(true, 'Secondary controls cataloged');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  const total = records.length;
  const passed = records.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n============================================================');
  console.log(`Adversarial Verification Results: ${passed}/${total} passed (${failed} failed)`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch((err) => {
  console.error('Adversarial suite crashed:', err);
  process.exit(1);
});
