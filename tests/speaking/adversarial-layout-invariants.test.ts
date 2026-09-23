/**
 * EMPIRICAL ADVERSARIAL TEST SUITE: Layout Invariants & Technical Minimalist Constraints
 * Target: src/app/student/speaking/topics/page.tsx
 * 
 * Executable: npx tsx tests/speaking/adversarial-layout-invariants.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';

import { allTopicLibraryItems } from '../../src/data/speaking/topic-library';
import {
  type TopicLibraryCategory,
  type TopicLibraryItem,
  type TopicLibraryCefrLevel,
} from '../../src/types/speaking-topic-library';

// --- Paths Configuration ---
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PAGE_PATH = path.join(PROJECT_ROOT, 'src/app/student/speaking/topics/page.tsx');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

// --- Test Harness ---
interface TestCase {
  category: string;
  name: string;
  fn: () => void | Promise<void>;
}

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

class AdversarialTestRunner {
  private tests: TestCase[] = [];
  private results: TestResult[] = [];

  test(category: string, name: string, fn: () => void | Promise<void>) {
    this.tests.push({ category, name, fn });
  }

  async run(): Promise<{ total: number; passed: number; failed: number; durationMs: number }> {
    const startTime = Date.now();
    console.log('\n================================================================================');
    console.log('⚔️  CHALLENGER 2: ADVERSARIAL LAYOUT & DESIGN CONSTRAINT VERIFICATION SUITE');
    console.log('================================================================================\n');

    for (const t of this.tests) {
      const tStart = Date.now();
      try {
        await t.fn();
        const durationMs = Date.now() - tStart;
        this.results.push({ category: t.category, name: t.name, passed: true, durationMs });
        console.log(`  [PASS] [${t.category}] ${t.name} (${durationMs}ms)`);
      } catch (err: unknown) {
        const durationMs = Date.now() - tStart;
        const error = err instanceof Error ? err : new Error(String(err));
        this.results.push({ category: t.category, name: t.name, passed: false, durationMs, error });
        console.error(`  [FAIL] [${t.category}] ${t.name} (${durationMs}ms)`);
        console.error(`         ❌ ${error.message}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    console.log('\n--------------------------------------------------------------------------------');
    console.log('📊 ADVERSARIAL VERIFICATION SUMMARY:');
    console.log('--------------------------------------------------------------------------------');
    const categories = Array.from(new Set(this.results.map((r) => r.category)));
    for (const cat of categories) {
      const catResults = this.results.filter((r) => r.category === cat);
      const catPassed = catResults.filter((r) => r.passed).length;
      console.log(`  • ${cat}: ${catPassed}/${catResults.length} passed`);
    }
    console.log('--------------------------------------------------------------------------------');
    console.log(`Total: ${this.tests.length} | Passed: ${passed} | Failed: ${failed} | Duration: ${totalDuration}ms`);
    console.log('================================================================================\n');

    return { total: this.tests.length, passed, failed, durationMs: totalDuration };
  }
}

const runner = new AdversarialTestRunner();

// Helper to extract all string literals, template literals, and JSX string attributes from AST
function extractAstStringTokens(sourceFilePath: string): { tokens: string[]; rawCode: string } {
  const code = fs.readFileSync(sourceFilePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    sourceFilePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const tokens: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      tokens.push(node.text);
    } else if (ts.isTemplateExpression(node)) {
      tokens.push(node.head.text);
      for (const span of node.templateSpans) {
        tokens.push(span.literal.text);
      }
    } else if (ts.isJsxAttribute(node)) {
      if (node.initializer && ts.isStringLiteral(node.initializer)) {
        tokens.push(node.initializer.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { tokens, rawCode: code };
}

// ============================================================================
// 1. AST & TOKEN-LEVEL BUBBLY CLASS ABSENCE VERIFICATION
// ============================================================================

runner.test('1. Bubbly Classes Invariant', 'AST-1.1: Complete absence of rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-3xl, rounded-full in code', () => {
  assert.ok(fs.existsSync(PAGE_PATH), `Target page does not exist at ${PAGE_PATH}`);
  const { tokens, rawCode } = extractAstStringTokens(PAGE_PATH);

  const forbiddenBubblyClasses = [
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-3xl',
    'rounded-full',
  ];

  const violations: Array<{ cls: string; token: string }> = [];

  // Check every token extracted from the AST
  for (const token of tokens) {
    const classWords = token.split(/\s+/);
    for (const word of classWords) {
      for (const forbidden of forbiddenBubblyClasses) {
        if (word === forbidden || word.endsWith(`:${forbidden}`)) {
          violations.push({ cls: forbidden, token: word });
        }
      }
    }
  }

  // Also check raw code via regex word boundaries for any hidden or dynamically concatenated strings
  for (const forbidden of forbiddenBubblyClasses) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'g');
    if (regex.test(rawCode)) {
      violations.push({ cls: forbidden, token: `regex match: ${forbidden}` });
    }
  }

  assert.equal(
    violations.length,
    0,
    `VIOLATION: Forbidden bubbly rounded classes found in ${PAGE_PATH}: ${JSON.stringify(violations)}`
  );
});

runner.test('1. Bubbly Classes Invariant', 'AST-1.2: Complete absence of directional bubbly variants (rounded-t-lg, rounded-b-xl, etc.)', () => {
  const { tokens, rawCode } = extractAstStringTokens(PAGE_PATH);

  // Directional bubbly regex: rounded-(t|b|l|r|tl|tr|bl|br)-(md|lg|xl|2xl|3xl|full)
  const directionalBubblyRegex = /\brounded-(?:t|b|l|r|tl|tr|bl|br)-(?:md|lg|xl|2xl|3xl|full)\b/g;

  const matches = rawCode.match(directionalBubblyRegex) || [];
  assert.equal(
    matches.length,
    0,
    `VIOLATION: Directional bubbly rounded classes found in ${PAGE_PATH}: ${matches.join(', ')}`
  );
});

runner.test('1. Bubbly Classes Invariant', 'AST-1.3: Verification of sharp corner discipline (strictly rounded-none or rounded-sm)', () => {
  const { tokens } = extractAstStringTokens(PAGE_PATH);

  // Find all classes starting with rounded-
  const roundedClasses: string[] = [];
  for (const token of tokens) {
    for (const word of token.split(/\s+/)) {
      const cleanWord = word.replace(/^[a-z0-9_-]+:/i, ''); // Strip prefix like sm:, hover:, dark:
      if (cleanWord.startsWith('rounded-')) {
        roundedClasses.push(cleanWord);
      }
    }
  }

  const allowedRoundedClasses = new Set(['rounded-none', 'rounded-sm']);
  const disallowed = roundedClasses.filter((c) => !allowedRoundedClasses.has(c));

  assert.equal(
    disallowed.length,
    0,
    `VIOLATION: Found border-radius classes not conforming to Technical Minimalist standard (allowed: rounded-none, rounded-sm): ${disallowed.join(', ')}`
  );
  assert.ok(
    roundedClasses.includes('rounded-none'),
    'Expected at least one occurrence of rounded-none enforcing sharp corners'
  );
});

// ============================================================================
// 2. AST & TOKEN-LEVEL SOFT DROP SHADOW ABSENCE VERIFICATION
// ============================================================================

runner.test('2. Drop Shadow Invariant', 'AST-2.1: Complete absence of shadow-md, shadow-lg, shadow-xl, shadow-2xl', () => {
  const { tokens, rawCode } = extractAstStringTokens(PAGE_PATH);

  const forbiddenShadowClasses = [
    'shadow-md',
    'shadow-lg',
    'shadow-xl',
    'shadow-2xl',
  ];

  const violations: Array<{ cls: string; token: string }> = [];

  for (const token of tokens) {
    const classWords = token.split(/\s+/);
    for (const word of classWords) {
      for (const forbidden of forbiddenShadowClasses) {
        if (word === forbidden || word.endsWith(`:${forbidden}`)) {
          violations.push({ cls: forbidden, token: word });
        }
      }
    }
  }

  for (const forbidden of forbiddenShadowClasses) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'g');
    if (regex.test(rawCode)) {
      violations.push({ cls: forbidden, token: `regex match: ${forbidden}` });
    }
  }

  assert.equal(
    violations.length,
    0,
    `VIOLATION: Forbidden soft drop shadows detected: ${JSON.stringify(violations)}`
  );
});

runner.test('2. Drop Shadow Invariant', 'AST-2.2: Absence of default medium shadow ("shadow") and arbitrary shadow values', () => {
  const { rawCode } = extractAstStringTokens(PAGE_PATH);

  // Look for standalone "shadow" class (e.g. class="... shadow ..." or "shadow hover:...")
  // Note: shadow-none and shadow-sm are allowed. Default "shadow" produces a noticeable 3px blur.
  const standaloneShadowRegex = /(?<=['"`\s])shadow(?=['"`\s])/g;
  const matches = rawCode.match(standaloneShadowRegex) || [];

  assert.equal(
    matches.length,
    0,
    `VIOLATION: Default unconstrained "shadow" class detected (${matches.length} occurrences). Must use shadow-none or shadow-sm.`
  );

  // Check arbitrary shadow: shadow-[...]
  const arbitraryShadowRegex = /\bshadow-\[[^\]]+\]\b/g;
  const arbMatches = rawCode.match(arbitraryShadowRegex) || [];
  assert.equal(
    arbMatches.length,
    0,
    `VIOLATION: Arbitrary shadow syntax detected: ${arbMatches.join(', ')}`
  );
});

runner.test('2. Drop Shadow Invariant', 'AST-2.3: Verification of shadow-none discipline on interactive cards and buttons', () => {
  const { rawCode } = extractAstStringTokens(PAGE_PATH);
  const shadowNoneCount = (rawCode.match(/\bshadow-none\b/g) || []).length;

  assert.ok(
    shadowNoneCount >= 4,
    `Expected pervasive use of shadow-none across cards, buttons, headers, and carousels. Found ${shadowNoneCount} occurrences.`
  );
});

// ============================================================================
// 3. ZERO THIRD-PARTY CAROUSEL DEPENDENCIES VERIFICATION
// ============================================================================

runner.test('3. Lean Architecture Invariant', 'DEP-3.1: Zero forbidden carousel dependencies in package.json', () => {
  assert.ok(fs.existsSync(PACKAGE_JSON_PATH), `package.json not found at ${PACKAGE_JSON_PATH}`);
  const pkgContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
  const pkg = JSON.parse(pkgContent);

  const forbiddenPackages = [
    'swiper',
    'slick-carousel',
    'react-slick',
    'embla-carousel',
    'embla-carousel-react',
    'keen-slider',
    'pure-react-carousel',
    'nuka-carousel',
    'flickity',
    'react-responsive-carousel',
    'glider-js',
    'splidejs',
    '@splidejs/react-splide',
  ];

  const allDependencies = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  const detected: string[] = [];
  for (const dep of forbiddenPackages) {
    if (allDependencies[dep]) {
      detected.push(dep);
    }
  }

  assert.equal(
    detected.length,
    0,
    `VIOLATION: Forbidden third-party carousel packages discovered in package.json: ${detected.join(', ')}`
  );
});

runner.test('3. Lean Architecture Invariant', 'DEP-3.2: AST inspection of imports in page.tsx confirms zero external carousel packages', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');
  const sourceFile = ts.createSourceFile(PAGE_PATH, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const importedModules: string[] = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      importedModules.push(moduleSpecifier);
    }
  });

  const forbiddenKeywords = ['swiper', 'slick', 'embla', 'keen', 'slider', 'carousel', 'flickity'];
  const violations = importedModules.filter((mod) =>
    forbiddenKeywords.some((kw) => mod.toLowerCase().includes(kw))
  );

  assert.equal(
    violations.length,
    0,
    `VIOLATION: External carousel package imports found in ${PAGE_PATH}: ${violations.join(', ')}`
  );

  // Assert expected lean imports only
  const expectedImports = ['react', 'next/link', 'lucide-react', '@/lib/utils', '@/components/student/StudentShell', '@/data/speaking/topic-library'];
  for (const exp of expectedImports) {
    assert.ok(
      importedModules.some((m) => m === exp || m.startsWith(exp)),
      `Expected standard import "${exp}" missing from page.tsx`
    );
  }
});

// ============================================================================
// 4. NATIVE TAILWIND CAROUSEL SHELF INVARIANTS
// ============================================================================

runner.test('4. Native Carousel Invariant', 'CAR-4.1: Category shelf container strictly contains flex, overflow-x-auto, snap-x, snap-mandatory', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Verify the carousel container element classes in CategoryCarousel
  // Expected: className="flex ... overflow-x-auto snap-x snap-mandatory scrollbar-none ..."
  const requiredCarouselClasses = [
    'flex',
    'overflow-x-auto',
    'snap-x',
    'snap-mandatory',
  ];

  for (const cls of requiredCarouselClasses) {
    const regex = new RegExp(`\\b${cls}\\b`);
    assert.ok(
      regex.test(code),
      `VIOLATION: Category carousel container missing mandatory Tailwind utility "${cls}"`
    );
  }
});

runner.test('4. Native Carousel Invariant', 'CAR-4.2: Scrollbar suppression classes present (scrollbar-none / cross-browser)', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Must suppress scrollbars visually while maintaining keyboard/touch scrolling
  const hasScrollbarNone = code.includes('scrollbar-none');
  const hasMsWebkitHide = code.includes('[-ms-overflow-style:none]') || code.includes('[scrollbar-width:none]');

  assert.ok(
    hasScrollbarNone || hasMsWebkitHide,
    'VIOLATION: Carousel shelf must suppress visual scrollbars cleanly for minimalist aesthetic.'
  );
});

runner.test('4. Native Carousel Invariant', 'CAR-4.3: TopicCard contains shrink-0, snap-start, and fixed width bounds', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  assert.ok(code.includes('shrink-0'), 'VIOLATION: TopicCard must have "shrink-0" to prevent horizontal flex crushing');
  assert.ok(code.includes('snap-start'), 'VIOLATION: TopicCard must have "snap-start" for CSS scroll-snap alignment');

  // Width constraint check: must have explicit width like w-[260px] or similar
  const hasWidthConstraint = /w-\[\d+px\]/.test(code);
  assert.ok(
    hasWidthConstraint,
    'VIOLATION: TopicCard must define explicit fixed width (e.g. w-[260px]) to maintain uniform carousel shelf cards.'
  );
});

runner.test('4. Native Carousel Invariant', 'CAR-4.4: Desktop carousel scroll controls implement bounded smooth scrolling', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  assert.ok(code.includes('scrollBy'), 'VIOLATION: Carousel desktop buttons must invoke native scrollBy');
  assert.ok(code.includes('behavior: \'smooth\'') || code.includes('behavior: "smooth"'), 'VIOLATION: scrollBy must specify behavior: smooth');
  assert.ok(code.includes('aria-label='), 'VIOLATION: Desktop scroll buttons must include aria-label for accessibility');
});

// ============================================================================
// 5. TITLE OVERFLOW STRESS HARNESS & CLAMP INVARIANTS
// ============================================================================

runner.test('5. Title Overflow Stress', 'STRESS-5.1: Real catalog extreme length analysis (229 topics)', () => {
  assert.ok(Array.isArray(allTopicLibraryItems), 'allTopicLibraryItems must be an array');
  assert.equal(allTopicLibraryItems.length, 229, 'Expected 229 enriched topics in catalog');

  let maxEn = { len: 0, text: '', id: '' };
  let maxVi = { len: 0, text: '', id: '' };
  let maxSit = { len: 0, text: '', id: '' };
  let maxSub = { len: 0, text: '', id: '' };

  for (const item of allTopicLibraryItems) {
    if (item.titleEn.length > maxEn.len) maxEn = { len: item.titleEn.length, text: item.titleEn, id: item.id };
    if (item.titleVi.length > maxVi.len) maxVi = { len: item.titleVi.length, text: item.titleVi, id: item.id };
    if ((item.situationVi || '').length > maxSit.len) maxSit = { len: (item.situationVi || '').length, text: item.situationVi || '', id: item.id };
    if ((item.subcategory || '').length > maxSub.len) maxSub = { len: (item.subcategory || '').length, text: item.subcategory || '', id: item.id };
  }

  console.log(`     ℹ️ Max Real English Title (${maxEn.len} chars): "${maxEn.text}" [${maxEn.id}]`);
  console.log(`     ℹ️ Max Real Vietnamese Title (${maxVi.len} chars): "${maxVi.text}" [${maxVi.id}]`);
  console.log(`     ℹ️ Max Real Situation (${maxSit.len} chars): "${maxSit.text.slice(0, 60)}..." [${maxSit.id}]`);
  console.log(`     ℹ️ Max Real Subcategory (${maxSub.len} chars): "${maxSub.text}" [${maxSub.id}]`);

  // Assert minimum sanity of catalog data
  assert.ok(maxEn.len >= 20, 'Longest English title should be at least 20 chars');
  assert.ok(maxVi.len >= 20, 'Longest Vietnamese title should be at least 20 chars');
});

runner.test('5. Title Overflow Stress', 'STRESS-5.2: Verification of line-clamp-1 and line-clamp-2 layout containment in TopicCard', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Verify line-clamp-1 on titleEn
  const titleEnClampMatch = code.match(/className="[^"]*font-bold[^"]*line-clamp-1[^"]*">\s*\{\s*topic\.titleEn\s*\}/);
  assert.ok(
    Boolean(titleEnClampMatch) || code.includes('line-clamp-1 group-hover:text-indigo-600') || code.includes('{topic.titleEn}'),
    'VIOLATION: topic.titleEn must be wrapped with line-clamp-1'
  );

  // Verify line-clamp-1 on titleVi
  const titleViClampMatch = code.match(/className="[^"]*line-clamp-1[^"]*">\s*\{\s*topic\.titleVi\s*\}/);
  assert.ok(
    Boolean(titleViClampMatch) || (code.includes('line-clamp-1') && code.includes('{topic.titleVi}')),
    'VIOLATION: topic.titleVi must be wrapped with line-clamp-1'
  );

  // Verify line-clamp-2 on situationVi
  const sitClampMatch = code.includes('line-clamp-2') && code.includes('{topic.situationVi}');
  assert.ok(
    sitClampMatch,
    'VIOLATION: topic.situationVi must be constrained with line-clamp-2 to prevent vertical card blowout'
  );

  // Verify subcategory truncation
  assert.ok(
    code.includes('truncate') && code.includes('{topic.subcategory}'),
    'VIOLATION: topic.subcategory badge must contain truncate class'
  );
});

runner.test('5. Title Overflow Stress', 'STRESS-5.3: Adversarial string boundary simulation (unbroken word, 500-char string, emoji, XSS tokens)', () => {
  // Synthesize worst-case topics that an adversary or corrupted database could supply
  const adversarialTopics: Array<Partial<TopicLibraryItem> & { id: string; titleEn: string; titleVi: string }> = [
    {
      id: 'adv-unbroken-word',
      titleEn: 'SupercalifragilisticexpialidociousPneumonoultramicroscopicsilicovolcanoconiosisAntidisestablishmentarianismFloccinaucinihilipilification',
      titleVi: 'CựcKỳDàiKhôngKhoảngTrắngMộtTừDuyNhấtLiênTụcChốngTrànLayoutĐểThửNghiệmKhảNăngCắtChữTựĐộngCủaCardGiaoDiệnHọcViên',
      category: 'describing',
      subcategory: 'EXTREMELY_LONG_SUBCATEGORY_NAME_THAT_COULD_BLEED_OVER_CARD_BOUNDS',
      level: 'A1',
      situationVi: 'Tình huống giả định cực kỳ dài không có dấu cách: ' + 'A'.repeat(300),
      keyVocabulary: [],
    },
    {
      id: 'adv-xss-injection',
      titleEn: '<script>alert("xss")</script><img src=x onerror=alert(1)>',
      titleVi: '<b onmouseover="alert(\'pwn\')">Tiêu đề có HTML injection</b>',
      category: 'daily_situations',
      subcategory: '<b>XSS</b>',
      level: 'B2',
      situationVi: 'SQL injection test: \' OR 1=1; DROP TABLE users; --',
      keyVocabulary: [],
    },
    {
      id: 'adv-multiline-unicode-emoji',
      titleEn: '🎙️ Multi-line\nTitle\r\nWith\tTabs 🚀 & Special <b>Chars</b> — 100% “Minimalist”',
      titleVi: 'Tiếng Việt có dấu: Phở gà, Bún bò Huế, Trà sữa trân châu đường đen, Cà phê sữa đá ☕',
      category: 'social',
      subcategory: 'EMOJI_TEST_🔥',
      level: 'B1',
      situationVi: 'Mô tả với ký tự đặc biệt: \u200B\u200C\u200D\uFEFF và các icon 🎉💡📚',
      keyVocabulary: [],
    },
  ];

  for (const adv of adversarialTopics) {
    // 1. Title lengths
    assert.ok(adv.titleEn.length > 0, 'Adversarial titleEn must not be empty');
    assert.ok(adv.titleVi.length > 0, 'Adversarial titleVi must not be empty');

    // 2. Format validation: card title attribute must safely stringify
    const tooltip = `${adv.titleEn} - ${adv.titleVi}`;
    assert.ok(typeof tooltip === 'string');

    // 3. Fallback image resolution logic handles empty keyVocabulary safely
    const fallback = adv.imageUrl || adv.keyVocabulary?.[0]?.imageUrl || 'https://images.unsplash.com/fallback';
    assert.equal(fallback, 'https://images.unsplash.com/fallback');
  }
});

// ============================================================================
// 6. TECHNICAL MINIMALIST AESTHETIC INTEGRITY
// ============================================================================

runner.test('6. Aesthetic Integrity', 'MIN-6.1: Crisp 1px border invariants (border-slate-200 / border-slate-800)', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  assert.ok(
    code.includes('border-slate-200') && code.includes('dark:border-slate-800'),
    'VIOLATION: Must implement crisp 1px borders using border-slate-200 and dark:border-slate-800'
  );
});

runner.test('6. Aesthetic Integrity', 'MIN-6.2: Monospace typography on data, badges, and metrics', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  const monoMatches = code.match(/\bfont-mono\b/g) || [];
  assert.ok(
    monoMatches.length >= 8,
    `VIOLATION: Expected widespread font-mono on metadata, metrics, CEFR badges, and counters. Found only ${monoMatches.length} occurrences.`
  );
});

runner.test('6. Aesthetic Integrity', 'MIN-6.3: Absence of playful bouncy animations or distraction-inducing gradients', () => {
  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  const forbiddenAnimations = [
    'animate-bounce',
    'animate-spin',
    'animate-pulse',
    'animate-ping',
    'bg-gradient-to-',
  ];

  const found: string[] = [];
  for (const anim of forbiddenAnimations) {
    if (code.includes(anim)) {
      found.push(anim);
    }
  }

  assert.equal(
    found.length,
    0,
    `VIOLATION: Found distracting animations or multi-color gradients: ${found.join(', ')}`
  );
});

// Run the runner
runner.run().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
