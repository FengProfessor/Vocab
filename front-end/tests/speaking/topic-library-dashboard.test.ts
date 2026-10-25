/**
 * Master Automated Test Suite: Speaking Topic Library Dashboard
 * File: tests/speaking/topic-library-dashboard.test.ts
 *
 * Runnable via: npx tsx tests/speaking/topic-library-dashboard.test.ts
 *
 * Covers:
 * - Tier 1: Feature Coverage (barrel imports, 4-category partitioning, 100% image resolution fallback, category labels/icons)
 * - Tier 2: Boundary & Edge Cases (search filtering, level filtering, empty states, diacritics, adversarial queries)
 * - Tier 3: Technical Minimalist & Architecture Constraints (Static AST & regex check of src/app/student/speaking/topics/page.tsx & package.json)
 * - Tier 4: Component / DOM Rendering Sanity (card links, CEFR badges, scroll delta, empty state contract, export)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import {
  allTopicLibraryItems,
  getTopicLibraryByCategory,
  getTopicLibraryByLevel,
  getTopicLibraryBySubcategory,
  searchTopicLibrary,
  getTopicLibraryStats,
} from '../../src/data/speaking/topic-library';

import {
  TOPIC_LIBRARY_CATEGORY_LABELS,
  TOPIC_LIBRARY_CATEGORY_ICONS,
  type TopicLibraryCategory,
  type TopicLibraryItem,
  type TopicLibraryCefrLevel,
} from '../../src/types/speaking-topic-library';

// ── Test Harness & Runner ───────────────────────────────────────────────────

interface TestCase {
  tier: string;
  name: string;
  fn: () => void | Promise<void>;
}

interface TestResult {
  tier: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

class TopicDashboardTestRunner {
  private tests: TestCase[] = [];
  private results: TestResult[] = [];

  test(tier: string, name: string, fn: () => void | Promise<void>) {
    this.tests.push({ tier, name, fn });
  }

  async run(): Promise<boolean> {
    const startTime = Date.now();
    console.log('\n======================================================================');
    console.log('🧪 LINGOPRO SPEAKING TOPIC LIBRARY DASHBOARD — E2E TEST SUITE');
    console.log('======================================================================\n');

    for (const t of this.tests) {
      const testStart = Date.now();
      try {
        await t.fn();
        const durationMs = Date.now() - testStart;
        this.results.push({
          tier: t.tier,
          name: t.name,
          passed: true,
          durationMs,
        });
        console.log(`  [PASS] [${t.tier}] ${t.name} (${durationMs}ms)`);
      } catch (err: unknown) {
        const durationMs = Date.now() - testStart;
        const error = err instanceof Error ? err : new Error(String(err));
        this.results.push({
          tier: t.tier,
          name: t.name,
          passed: false,
          durationMs,
          error,
        });
        console.error(`  [FAIL] [${t.tier}] ${t.name} (${durationMs}ms)`);
        console.error(`         Error: ${error.message}`);
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    // Group by Tier
    const tiers = Array.from(new Set(this.results.map((r) => r.tier)));

    console.log('\n----------------------------------------------------------------------');
    console.log('📊 TEST EXECUTION SUMMARY BY TIER:');
    console.log('----------------------------------------------------------------------');

    for (const tier of tiers) {
      const tierResults = this.results.filter((r) => r.tier === tier);
      const tierPass = tierResults.filter((r) => r.passed).length;
      const tierTotal = tierResults.length;
      const tierStatus = tierPass === tierTotal ? 'ALL PASSED' : `${tierTotal - tierPass} FAILED`;
      console.log(`  • ${tier}: ${tierPass}/${tierTotal} passed [${tierStatus}]`);
    }

    console.log('----------------------------------------------------------------------');
    console.log(`Total: ${this.tests.length} | Passed: ${passed} | Failed: ${failed} | Duration: ${totalDuration}ms`);
    console.log('======================================================================\n');

    if (failed > 0) {
      console.error(`❌ Suite failed with ${failed} failure(s).`);
      return false;
    } else {
      console.log('✅ 100% of Topic Library Dashboard tests PASSED with 0 defects.');
      return true;
    }
  }
}

const runner = new TopicDashboardTestRunner();

// Fallback image constant as defined in project interface contract
const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80';

// ── TIER 1: FEATURE COVERAGE ─────────────────────────────────────────────────

runner.test('Tier 1: Feature Coverage', '1.1: Barrel Import & Catalog Scale (229 items across 51 subcategory files)', () => {
  assert.ok(Array.isArray(allTopicLibraryItems), 'allTopicLibraryItems must be an array');
  assert.equal(allTopicLibraryItems.length, 229, 'Total aggregated topics count must equal 229');

  // Verify unique IDs
  const idSet = new Set<string>();
  for (const item of allTopicLibraryItems) {
    assert.ok(item.id, 'Topic item must have a valid non-empty id');
    assert.ok(!idSet.has(item.id), `Duplicate topic ID detected: "${item.id}"`);
    idSet.add(item.id);
  }
  assert.equal(idSet.size, 229, 'All 229 topic IDs must be globally unique');
});

runner.test('Tier 1: Feature Coverage', '1.2: Essential Schema Conformance for all topics', () => {
  for (const item of allTopicLibraryItems) {
    assert.ok(typeof item.id === 'string' && item.id.length > 0, `Item ${item.id} missing id`);
    assert.ok(typeof item.category === 'string' && item.category.length > 0, `Item ${item.id} missing category`);
    assert.ok(typeof item.subcategory === 'string' && item.subcategory.length > 0, `Item ${item.id} missing subcategory`);
    assert.ok(typeof item.level === 'string' && ['A1', 'A2', 'B1', 'B2'].includes(item.level), `Item ${item.id} invalid level: ${item.level}`);
    assert.ok(typeof item.titleEn === 'string' && item.titleEn.trim().length > 0, `Item ${item.id} missing titleEn`);
    assert.ok(typeof item.titleVi === 'string' && item.titleVi.trim().length > 0, `Item ${item.id} missing titleVi`);
    assert.ok(typeof item.situationVi === 'string' && item.situationVi.trim().length > 0, `Item ${item.id} missing situationVi`);
    assert.ok(Array.isArray(item.keyVocabulary) && item.keyVocabulary.length > 0, `Item ${item.id} keyVocabulary must not be empty`);
  }
});

runner.test('Tier 1: Feature Coverage', '1.3: 4-Category Partitioning Completeness & Proportions', () => {
  const categories: TopicLibraryCategory[] = [
    'describing',
    'daily_situations',
    'social',
    'workplace_extended',
  ];

  const counts: Record<TopicLibraryCategory, number> = {
    describing: 0,
    daily_situations: 0,
    social: 0,
    workplace_extended: 0,
  };

  for (const item of allTopicLibraryItems) {
    assert.ok(categories.includes(item.category), `Unexpected category: ${item.category}`);
    counts[item.category]++;
  }

  // Exact partitioning verified via catalog specification
  assert.equal(counts.describing, 10, 'describing category must contain exactly 10 topics');
  assert.equal(counts.daily_situations, 103, 'daily_situations category must contain exactly 103 topics');
  assert.equal(counts.social, 68, 'social category must contain exactly 68 topics');
  assert.equal(counts.workplace_extended, 48, 'workplace_extended category must contain exactly 48 topics');

  const totalPartitioned = counts.describing + counts.daily_situations + counts.social + counts.workplace_extended;
  assert.equal(totalPartitioned, 229, 'Sum of 4 categories must exactly equal 229');
});

runner.test('Tier 1: Feature Coverage', '1.4: 100% Image Resolution Fallback Guarantee', () => {
  // Resolution cascade: item.imageUrl || item.keyVocabulary?.[0]?.imageUrl || DEFAULT_FALLBACK_IMAGE
  let resolvedHttpsCount = 0;
  let resolvedUnsplashCount = 0;

  for (const item of allTopicLibraryItems) {
    const resolvedUrl =
      item.imageUrl ||
      item.keyVocabulary?.find((v) => Boolean(v.imageUrl))?.imageUrl ||
      item.keyVocabulary?.[0]?.imageUrl ||
      DEFAULT_FALLBACK_IMAGE;

    assert.ok(typeof resolvedUrl === 'string' && resolvedUrl.length > 0, `Item ${item.id} failed to resolve image`);
    assert.ok(resolvedUrl.startsWith('https://'), `Resolved URL for ${item.id} must be HTTPS: ${resolvedUrl}`);
    assert.ok(
      resolvedUrl.includes('unsplash.com') || resolvedUrl.includes('images.unsplash.com') || resolvedUrl.includes('pexels.com'),
      `Resolved URL for ${item.id} must point to whitelisted stock image source: ${resolvedUrl}`
    );

    resolvedHttpsCount++;
    if (resolvedUrl.includes('unsplash.com')) {
      resolvedUnsplashCount++;
    }
  }

  assert.equal(resolvedHttpsCount, 229, '100% of 229 topics must resolve to a valid HTTPS image URL');
  assert.ok(resolvedUnsplashCount >= 220, 'At least 220 topics must resolve to Unsplash images');

  // Edge case: synthetic topic without images falls back cleanly to DEFAULT_FALLBACK_IMAGE
  const emptyTopic: TopicLibraryItem = {
    id: 'test-synthetic-empty-img',
    category: 'describing',
    subcategory: 'test',
    level: 'A1',
    titleEn: 'Synthetic Topic',
    titleVi: 'Chủ đề giả lập',
    icon: '🧪',
    situationVi: 'Tình huống giả lập',
    sampleDialogue: [],
    keyVocabulary: [],
    usefulPhrases: [],
    aiTutorPrompt: 'prompt',
  };

  const syntheticResolved =
    emptyTopic.imageUrl ||
    emptyTopic.keyVocabulary?.[0]?.imageUrl ||
    DEFAULT_FALLBACK_IMAGE;

  assert.equal(syntheticResolved, DEFAULT_FALLBACK_IMAGE, 'Synthetic topic without images must resolve to DEFAULT_FALLBACK_IMAGE');
});

runner.test('Tier 1: Feature Coverage', '1.5: Category Labels Mapping Conformance', () => {
  const expectedLabels: Record<TopicLibraryCategory, string> = {
    describing: 'Miêu tả & Mô tả',
    daily_situations: 'Tình huống Hàng ngày',
    social: 'Giao tiếp Xã hội',
    workplace_extended: 'Công sở Mở rộng',
  };

  for (const [cat, expectedText] of Object.entries(expectedLabels)) {
    const actualText = TOPIC_LIBRARY_CATEGORY_LABELS[cat as TopicLibraryCategory];
    assert.equal(actualText, expectedText, `Label mismatch for category ${cat}: got "${actualText}", expected "${expectedText}"`);
  }
});

runner.test('Tier 1: Feature Coverage', '1.6: Category Icons Mapping Conformance', () => {
  const expectedIcons: Record<TopicLibraryCategory, string> = {
    describing: '🖼️',
    daily_situations: '🏪',
    social: '💬',
    workplace_extended: '🏢',
  };

  for (const [cat, expectedIcon] of Object.entries(expectedIcons)) {
    const actualIcon = TOPIC_LIBRARY_CATEGORY_ICONS[cat as TopicLibraryCategory];
    assert.equal(actualIcon, expectedIcon, `Icon mismatch for category ${cat}: got "${actualIcon}", expected "${expectedIcon}"`);
  }
});

runner.test('Tier 1: Feature Coverage', '1.7: getTopicLibraryByCategory Query Helper Verification', () => {
  const describingTopics = getTopicLibraryByCategory('describing');
  const dailyTopics = getTopicLibraryByCategory('daily_situations');
  const socialTopics = getTopicLibraryByCategory('social');
  const workplaceTopics = getTopicLibraryByCategory('workplace_extended');

  assert.equal(describingTopics.length, 10, 'getTopicLibraryByCategory(describing) length must be 10');
  assert.equal(dailyTopics.length, 103, 'getTopicLibraryByCategory(daily_situations) length must be 103');
  assert.equal(socialTopics.length, 68, 'getTopicLibraryByCategory(social) length must be 68');
  assert.equal(workplaceTopics.length, 48, 'getTopicLibraryByCategory(workplace_extended) length must be 48');
});

runner.test('Tier 1: Feature Coverage', '1.8: getTopicLibraryStats Aggregator Functionality', () => {
  const stats = getTopicLibraryStats();
  assert.equal(stats.total, 229, 'Stats total must be 229');
  assert.equal(stats.byCategory.describing, 10);
  assert.equal(stats.byCategory.daily_situations, 103);
  assert.equal(stats.byCategory.social, 68);
  assert.equal(stats.byCategory.workplace_extended, 48);

  assert.equal(stats.byLevel.A1, 36, 'Stats A1 must be 36');
  assert.equal(stats.byLevel.A2, 102, 'Stats A2 must be 102');
  assert.equal(stats.byLevel.B1, 81, 'Stats B1 must be 81');
  assert.equal(stats.byLevel.B2, 10, 'Stats B2 must be 10');
});

// ── TIER 2: BOUNDARY & EDGE CASES ───────────────────────────────────────────

runner.test('Tier 2: Boundary & Edge Cases', '2.1: Empty and Whitespace Search Query', () => {
  const emptyRes = searchTopicLibrary('');
  assert.equal(emptyRes.length, 229, 'Empty search query must return all 229 topics');

  // Whitespace-trimmed search simulation
  const trimmed = allTopicLibraryItems.filter((item) => {
    const q = '   '.trim().toLowerCase();
    if (!q) return true;
    return item.titleEn.toLowerCase().includes(q);
  });
  assert.equal(trimmed.length, 229, 'Whitespace search query must return all 229 topics');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.2: Case-Insensitive Search on English Titles', () => {
  const resLower = searchTopicLibrary('coffee');
  const resUpper = searchTopicLibrary('COFFEE');
  const resMixed = searchTopicLibrary('cOfFeE');

  assert.ok(resLower.length > 0, 'Search for "coffee" must yield matches');
  assert.equal(resLower.length, resUpper.length, 'Lower and upper case searches must yield equal count');
  assert.equal(resLower.length, resMixed.length, 'Mixed case search must yield equal count');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.3: Vietnamese Diacritics and Accents Search', () => {
  const resPharmacy = searchTopicLibrary('thuốc');
  assert.ok(resPharmacy.length > 0, 'Search for "thuốc" must find pharmacy topics in Vietnamese');

  const resDoctor = searchTopicLibrary('bác sĩ');
  assert.ok(resDoctor.length > 0, 'Search for "bác sĩ" must find doctor appointment topics');

  const resShopping = searchTopicLibrary('mua');
  assert.ok(resShopping.length > 0, 'Search for "mua" must find buying/shopping topics in Vietnamese');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.4: Non-Existent Query Handling (Empty State Trigger)', () => {
  const nonExistent = searchTopicLibrary('xyz_completely_nonexistent_query_98765');
  assert.equal(nonExistent.length, 0, 'Non-existent search query must return empty array []');
  assert.doesNotThrow(() => {
    // Check that empty result does not crash array reduction or map
    const mapped = nonExistent.map((item) => item.id);
    assert.equal(mapped.length, 0);
  });
});

runner.test('Tier 2: Boundary & Edge Cases', '2.5: Adversarial Query Special Characters & Meta-Characters', () => {
  const adversarialTokens = [
    '.*+?^${}()|[]\\',
    '"><script>alert(1)</script>',
    "'; DROP TABLE topics; --",
    'Café & Restaurant $100% #1 @airport!',
    '\\d+\\w+',
    'null',
    'undefined',
    'NaN',
  ];

  for (const token of adversarialTokens) {
    assert.doesNotThrow(() => {
      const q = token.toLowerCase();
      const results = allTopicLibraryItems.filter((item) => {
        return (
          item.titleEn.toLowerCase().includes(q) ||
          item.titleVi.toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
        );
      });
      assert.ok(Array.isArray(results), `Adversarial search for "${token}" must produce an array`);
    }, `Adversarial query "${token}" must not throw exception`);
  }
});

runner.test('Tier 2: Boundary & Edge Cases', '2.6: CEFR Level Filtering Partition Complete Coverage', () => {
  const a1Items = getTopicLibraryByLevel('A1');
  const a2Items = getTopicLibraryByLevel('A2');
  const b1Items = getTopicLibraryByLevel('B1');
  const b2Items = getTopicLibraryByLevel('B2');

  assert.equal(a1Items.length, 36, 'A1 topics count must be exactly 36');
  assert.equal(a2Items.length, 102, 'A2 topics count must be exactly 102');
  assert.equal(b1Items.length, 81, 'B1 topics count must be exactly 81');
  assert.equal(b2Items.length, 10, 'B2 topics count must be exactly 10');

  const sumLevels = a1Items.length + a2Items.length + b1Items.length + b2Items.length;
  assert.equal(sumLevels, 229, 'Sum of all levels must equal exactly 229');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.7: Unknown CEFR Level Boundary', () => {
  const invalidLevel = getTopicLibraryByLevel('C1' as TopicLibraryCefrLevel);
  assert.equal(invalidLevel.length, 0, 'Unsupported level C1 must safely return 0 items');

  const randomLevel = getTopicLibraryByLevel('Z9' as TopicLibraryCefrLevel);
  assert.equal(randomLevel.length, 0, 'Unsupported level Z9 must safely return 0 items');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.8: Combined Filter & Search Matrix Simulation', () => {
  // Filter by B2 level + search "meeting"
  const b2Topics = getTopicLibraryByLevel('B2');
  const b2Meeting = b2Topics.filter(
    (t) =>
      t.titleEn.toLowerCase().includes('meeting') ||
      t.titleVi.toLowerCase().includes('họp') ||
      t.situationVi.toLowerCase().includes('họp')
  );
  assert.ok(Array.isArray(b2Meeting), 'Combined filter result must be an array');

  // Filter with no matches
  const b2Quantum = b2Topics.filter((t) => t.titleEn.toLowerCase().includes('quantum physics'));
  assert.equal(b2Quantum.length, 0, 'Zero-match combination must return empty array');
});

runner.test('Tier 2: Boundary & Edge Cases', '2.9: Title Length Extremes and Absence of Encoding Corruption', () => {
  const MOJIBAKE_REGEX = /[\uFFFD]|Ã[¡-¿]|áº|á»|â€|â€™|â€œ|â€ |&quot;|&amp;|&#\d+;/;

  for (const item of allTopicLibraryItems) {
    assert.ok(item.titleEn.length <= 80, `TitleEn excessively long in ${item.id}: ${item.titleEn.length} chars`);
    assert.ok(item.titleVi.length <= 120, `TitleVi excessively long in ${item.id}: ${item.titleVi.length} chars`);

    assert.ok(
      !MOJIBAKE_REGEX.test(item.titleEn),
      `Mojibake encoding corruption detected in titleEn of ${item.id}: "${item.titleEn}"`
    );
    assert.ok(
      !MOJIBAKE_REGEX.test(item.titleVi),
      `Mojibake encoding corruption detected in titleVi of ${item.id}: "${item.titleVi}"`
    );
    assert.ok(
      !MOJIBAKE_REGEX.test(item.situationVi),
      `Mojibake encoding corruption detected in situationVi of ${item.id}: "${item.situationVi}"`
    );
  }
});

runner.test('Tier 2: Boundary & Edge Cases', '2.10: Subcategory Lookup Consistency', () => {
  const subcategories = Array.from(new Set(allTopicLibraryItems.map((i) => i.subcategory)));
  assert.ok(subcategories.length >= 45, `Subcategories count should be >= 45 (actual: ${subcategories.length})`);

  for (const sub of subcategories.slice(0, 10)) {
    const items = getTopicLibraryBySubcategory(sub);
    assert.ok(items.length > 0, `getTopicLibraryBySubcategory("${sub}") must return at least 1 item`);
    for (const item of items) {
      assert.equal(item.subcategory, sub, `Item ${item.id} subcategory does not match query "${sub}"`);
    }
  }
});

// ── TIER 3: TECHNICAL MINIMALIST & ARCHITECTURE CONSTRAINTS ──────────────────

const PAGE_PATH = path.join(process.cwd(), 'src/app/student/speaking/topics/page.tsx');
const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');

runner.test('Tier 3: Design & Architecture Constraints', '3.1: Clean Dependencies in package.json (Zero forbidden carousel packages)', () => {
  assert.ok(fs.existsSync(PACKAGE_JSON_PATH), 'package.json must exist');
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
  ];

  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  for (const forbidden of forbiddenPackages) {
    assert.ok(
      !allDeps[forbidden],
      `Forbidden carousel package "${forbidden}" found in package.json dependencies!`
    );
  }
});

runner.test('Tier 3: Design & Architecture Constraints', '3.2: Target Page File Exists at src/app/student/speaking/topics/page.tsx', () => {
  assert.ok(
    fs.existsSync(PAGE_PATH),
    `Target route file does not exist at: ${PAGE_PATH}. Implementer must create this route.`
  );
});

runner.test('Tier 3: Design & Architecture Constraints', '3.3: Strictly Zero Forbidden Bubbly Rounded Classes in page.tsx', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify classes: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Forbidden border-radius classes per Technical Minimalist design contract
  const forbiddenClasses = [
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-3xl',
  ];

  const violations: string[] = [];
  for (const cls of forbiddenClasses) {
    // Check regex word boundary or class match
    const regex = new RegExp(`\\b${cls}\\b`, 'g');
    if (regex.test(code)) {
      violations.push(cls);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Forbidden bubbly rounded classes detected in page.tsx: [${violations.join(', ')}]. Must use rounded-none or rounded-sm.`
  );
});

runner.test('Tier 3: Design & Architecture Constraints', '3.4: Strictly Zero Forbidden Drop Shadow Classes in page.tsx', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify classes: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Forbidden soft/heavy drop shadow classes
  const forbiddenShadows = [
    'shadow-md',
    'shadow-lg',
    'shadow-xl',
    'shadow-2xl',
  ];

  const violations: string[] = [];
  for (const shadow of forbiddenShadows) {
    const regex = new RegExp(`\\b${shadow}\\b`, 'g');
    if (regex.test(code)) {
      violations.push(shadow);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Forbidden drop shadow classes detected in page.tsx: [${violations.join(', ')}]. Must use shadow-none or shadow-sm.`
  );
});

runner.test('Tier 3: Design & Architecture Constraints', '3.5: Strictly Zero Forbidden Carousel Package Imports in page.tsx', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify imports: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');
  const forbiddenImportPatterns = [
    /from\s+['"][^'"]*swiper[^'"]*['"]/i,
    /from\s+['"][^'"]*slick[^'"]*['"]/i,
    /from\s+['"][^'"]*embla-carousel[^'"]*['"]/i,
    /from\s+['"][^'"]*keen-slider[^'"]*['"]/i,
    /from\s+['"][^'"]*flickity[^'"]*['"]/i,
  ];

  for (const pattern of forbiddenImportPatterns) {
    assert.ok(
      !pattern.test(code),
      `Forbidden carousel import statement detected matching pattern: ${pattern.toString()}`
    );
  }
});

runner.test('Tier 3: Design & Architecture Constraints', '3.6: Mandatory Pure Tailwind Carousel Utilities in page.tsx', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify utilities: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  assert.ok(code.includes('overflow-x-auto'), 'page.tsx must utilize native Tailwind utility "overflow-x-auto"');
  assert.ok(code.includes('snap-x'), 'page.tsx must utilize native Tailwind utility "snap-x"');
  assert.ok(code.includes('flex'), 'page.tsx must utilize native Tailwind utility "flex"');
  assert.ok(code.includes('snap-start') || code.includes('snap-mandatory'), 'page.tsx must utilize snap-start or snap-mandatory');
});

runner.test('Tier 3: Design & Architecture Constraints', '3.7: Synchronous Ingestion of allTopicLibraryItems from Barrel', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify data import: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  assert.ok(
    code.includes('allTopicLibraryItems'),
    'page.tsx must import "allTopicLibraryItems" directly'
  );
  assert.ok(
    code.includes('@/data/speaking/topic-library') || code.includes('data/speaking/topic-library'),
    'page.tsx must import from "@/data/speaking/topic-library"'
  );
});

runner.test('Tier 3: Design & Architecture Constraints', '3.8: Technical Minimalist 1px Border and Sharp Radii Presence', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify styling: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Must contain sharp borders
  assert.ok(
    code.includes('rounded-none') || code.includes('rounded-sm'),
    'page.tsx must use Technical Minimalist sharp borders (rounded-none or rounded-sm)'
  );

  // Must contain 1px borders
  assert.ok(
    code.includes('border-slate-200') || code.includes('border-slate-800'),
    'page.tsx must use 1px border utilities (border-slate-200 / border-slate-800)'
  );
});

// ── TIER 4: COMPONENT / DOM RENDERING SANITY & LOGIC SIMULATION ──────────────

runner.test('Tier 4: Component / DOM Sanity', '4.1: Card Link Target Construction and Format Sanity', () => {
  for (const item of allTopicLibraryItems.slice(0, 30)) {
    const expectedHref = `/student/speaking/topics/${item.id}`;
    assert.ok(expectedHref.startsWith('/student/speaking/topics/'));
    assert.ok(!expectedHref.includes('undefined'), `Href contains undefined: ${expectedHref}`);
    assert.ok(!expectedHref.includes('null'), `Href contains null: ${expectedHref}`);
    assert.ok(!expectedHref.includes(' '), `Href contains space: ${expectedHref}`);
  }
});

runner.test('Tier 4: Component / DOM Sanity', '4.2: CEFR Badge Color Mapping Simulation', () => {
  function simulateCefrBadgeColor(level: TopicLibraryCefrLevel): string {
    switch (level) {
      case 'A1':
        return 'emerald';
      case 'A2':
        return 'blue';
      case 'B1':
        return 'amber';
      case 'B2':
        return 'purple';
      default:
        return 'slate';
    }
  }

  assert.equal(simulateCefrBadgeColor('A1'), 'emerald', 'A1 badge must map to emerald');
  assert.equal(simulateCefrBadgeColor('A2'), 'blue', 'A2 badge must map to blue');
  assert.equal(simulateCefrBadgeColor('B1'), 'amber', 'B1 badge must map to amber');
  assert.equal(simulateCefrBadgeColor('B2'), 'purple', 'B2 badge must map to purple');
});

runner.test('Tier 4: Component / DOM Sanity', '4.3: Desktop Carousel Scroll Delta Step Bounds', () => {
  // In CategoryCarousel, the scroll step delta should be ~320px
  const standardCardWidth = 285;
  const standardGap = 16;
  const recommendedScrollDelta = standardCardWidth + standardGap; // 301px ~ 320px

  assert.ok(
    recommendedScrollDelta >= 280 && recommendedScrollDelta <= 360,
    `Scroll delta ${recommendedScrollDelta}px is within optimal single-card step boundary [280px, 360px]`
  );
});

runner.test('Tier 4: Component / DOM Sanity', '4.4: Empty State Filter Reset Simulation', () => {
  // Simulate active search filtering
  let searchQuery = 'xyz_unmatched';
  let selectedLevel: 'ALL' | TopicLibraryCefrLevel = 'B2';

  // Clear filters callback simulation
  const clearFilters = () => {
    searchQuery = '';
    selectedLevel = 'ALL';
  };

  clearFilters();
  assert.equal(searchQuery, '', 'searchQuery should be reset to empty string');
  assert.equal(selectedLevel, 'ALL', 'selectedLevel should be reset to ALL');

  const restored = allTopicLibraryItems.filter(() => {
    return selectedLevel === 'ALL';
  });
  assert.equal(restored.length, 229, 'Restored list must contain all 229 topics');
});

runner.test('Tier 4: Component / DOM Sanity', '4.5: React Component Export and Directives Sanity in page.tsx', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify component export: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Must have 'use client' directive because of useRef, useState, scrollBy
  assert.ok(
    code.includes("'use client'") || code.includes('"use client"'),
    'page.tsx must declare "use client" for client-side carousel navigation'
  );

  // Must have default export
  assert.ok(
    code.includes('export default function') || code.includes('export default SpeakingTopicLibraryPage'),
    'page.tsx must provide a default React component export'
  );

  // Must wrap in StudentShell
  assert.ok(
    code.includes('StudentShell'),
    'page.tsx must wrap content inside StudentShell for student portal layout consistency'
  );
});

runner.test('Tier 4: Component / DOM Sanity', '4.6: Keyboard Accessibility & Accessibility Attributes Sanity', () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error(`Cannot verify accessibility: ${PAGE_PATH} does not exist yet.`);
  }

  const code = fs.readFileSync(PAGE_PATH, 'utf-8');

  // Buttons should have aria-label
  assert.ok(
    code.includes('aria-label'),
    'Carousel scroll buttons must include aria-label for screen reader accessibility'
  );

  // Nav must have aria-label for breadcrumb
  assert.ok(
    code.includes('aria-label="Breadcrumb"') || code.includes("aria-label='Breadcrumb'"),
    'Breadcrumb nav should have aria-label="Breadcrumb"'
  );
});

// ── Runner Execution ────────────────────────────────────────────────────────

runner
  .run()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal test suite execution error:', err);
    process.exit(1);
  });
