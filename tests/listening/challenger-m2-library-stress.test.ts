/**
 * Challenger 1 Milestone 2: Independent Empirical Stress Test & Oracle Harness
 * Focus: Library Pagination, 7-Topic Taxonomy, Multi-dimensional Filtering, and Reset Semantics.
 */

import { getListeningVideosIndex, getListeningAttempt, getTopicIconName, getTopicDisplayName, getTopicBadgeColor } from '../../src/lib/listening';
import { TOPIC_CHIP_CONFIGS } from '../../src/components/listening/TopicFilterChips';
import type { ListeningVideoIndexItem, TopicFilter, DurationFilter, LevelFilter } from '../../src/types/listening';

interface TestSummary {
  name: string;
  assertions: number;
  passed: boolean;
  error?: string;
}

const summaries: TestSummary[] = [];
let currentSuite = '';
let currentSuiteAssertions = 0;

function startSuite(name: string) {
  currentSuite = name;
  currentSuiteAssertions = 0;
  console.log(`\n================================================================`);
  console.log(`SUITE: ${name}`);
  console.log(`================================================================`);
}

function endSuite() {
  summaries.push({
    name: currentSuite,
    assertions: currentSuiteAssertions,
    passed: true,
  });
}

function assert(condition: boolean, testName: string, detail?: string) {
  currentSuiteAssertions++;
  if (!condition) {
    const msg = `FAILED: [${currentSuite}] ${testName}${detail ? ` -> ${detail}` : ''}`;
    console.error(`❌ ${msg}`);
    summaries.push({
      name: `${currentSuite}: ${testName}`,
      assertions: currentSuiteAssertions,
      passed: false,
      error: msg,
    });
    throw new Error(msg);
  }
  console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: replicate exact filter logic from src/app/practice/listening/page.tsx
// ──────────────────────────────────────────────────────────────────────────
function filterVideos(
  items: ListeningVideoIndexItem[],
  duration: DurationFilter,
  topic: TopicFilter,
  level: LevelFilter,
  query: string
): ListeningVideoIndexItem[] {
  return items.filter((item) => {
    // Duration filter
    if (duration !== 'all' && item.durationCategory !== duration) {
      return false;
    }

    // Topic filter (7 categories + alias mapping)
    if (topic !== 'all') {
      if (topic === 'culture') {
        if (item.topic !== 'culture' && item.topic !== 'social_stories') return false;
      } else if (item.topic !== topic) {
        return false;
      }
    }

    // CEFR Level filter
    if (level !== 'all' && item.cefrLevel !== level) {
      return false;
    }

    // Instant search query
    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchChannel = item.channel.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTopic = item.topicDisplay.toLowerCase().includes(q);
      const matchVocab = item.coreVocabularyPreview.some((w) => w.toLowerCase().includes(q));

      if (!matchTitle && !matchChannel && !matchDesc && !matchTopic && !matchVocab) {
        return false;
      }
    }

    return true;
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: simulate React render-time filter state adjustment
// ──────────────────────────────────────────────────────────────────────────
class LibraryFilterStateSimulator {
  duration: DurationFilter = 'all';
  topic: TopicFilter = 'all';
  level: LevelFilter = 'all';
  query: string = '';
  currentPage: number = 1;

  private snapshot = {
    duration: 'all' as DurationFilter,
    topic: 'all' as TopicFilter,
    level: 'all' as LevelFilter,
    query: '',
  };

  setFilters(updates: {
    duration?: DurationFilter;
    topic?: TopicFilter;
    level?: LevelFilter;
    query?: string;
  }) {
    if (updates.duration !== undefined) this.duration = updates.duration;
    if (updates.topic !== undefined) this.topic = updates.topic;
    if (updates.level !== undefined) this.level = updates.level;
    if (updates.query !== undefined) this.query = updates.query;
    this.render();
  }

  setPage(page: number) {
    this.currentPage = page;
  }

  render() {
    if (
      this.snapshot.duration !== this.duration ||
      this.snapshot.topic !== this.topic ||
      this.snapshot.level !== this.level ||
      this.snapshot.query !== this.query
    ) {
      this.snapshot = {
        duration: this.duration,
        topic: this.topic,
        level: this.level,
        query: this.query,
      };
      this.currentPage = 1;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: getPageNumbers from LibraryPagination.tsx
// ──────────────────────────────────────────────────────────────────────────
function getPaginationPageNumbers(totalPages: number, currentPage: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

// ──────────────────────────────────────────────────────────────────────────
// Helper: Watch progress parser from page.tsx
// ──────────────────────────────────────────────────────────────────────────
function parseWatchProgressPercent(rawWatch: string | null): number {
  if (!rawWatch) return 0;
  try {
    const num = Number(rawWatch);
    if (!isNaN(num)) {
      return Math.min(100, Math.max(0, num));
    }
    const parsed = JSON.parse(rawWatch);
    if (typeof parsed === 'number') {
      return Math.min(100, Math.max(0, parsed));
    }
    if (parsed && typeof parsed.percent === 'number') {
      return Math.min(100, Math.max(0, parsed.percent));
    }
    if (parsed && typeof parsed.percentWatched === 'number') {
      return Math.min(100, Math.max(0, parsed.percentWatched));
    }
    if (parsed && typeof parsed.progress === 'number') {
      return Math.min(100, Math.max(0, parsed.progress));
    }
    if (
      parsed &&
      typeof parsed.currentTime === 'number' &&
      typeof parsed.duration === 'number' &&
      parsed.duration > 0
    ) {
      return Math.min(100, Math.max(0, Math.round((parsed.currentTime / parsed.duration) * 100)));
    }
  } catch {
    // Ignore
  }
  return 0;
}

// ==========================================================================
// TEST EXECUTION
// ==========================================================================
async function runAllChallengerTests() {
  const allVideos = getListeningVideosIndex();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 1: 7-Topic Taxonomy Partition & Chip Count Oracle
  // ────────────────────────────────────────────────────────────────────────
  startSuite('1. 7-Topic Taxonomy Partition & Chip Count Oracle');

  assert(allVideos.length === 200, 'Total Catalog Size', `Found ${allVideos.length} items`);

  // Map each topic count
  const topicCounts: Record<string, number> = { all: allVideos.length };
  for (const v of allVideos) {
    const topicKey = v.topic === 'social_stories' ? 'culture' : v.topic;
    topicCounts[topicKey] = (topicCounts[topicKey] || 0) + 1;
  }

  assert(topicCounts.daily_life === 29, 'Topic Count: daily_life', `Got ${topicCounts.daily_life}`);
  assert(topicCounts.social_conversations === 29, 'Topic Count: social_conversations', `Got ${topicCounts.social_conversations}`);
  assert(topicCounts.workplace === 29, 'Topic Count: workplace', `Got ${topicCounts.workplace}`);
  assert(topicCounts.travel === 29, 'Topic Count: travel', `Got ${topicCounts.travel}`);
  assert(topicCounts.food_shopping === 28, 'Topic Count: food_shopping', `Got ${topicCounts.food_shopping}`);
  assert(topicCounts.science_tech_health === 28, 'Topic Count: science_tech_health', `Got ${topicCounts.science_tech_health}`);
  assert(topicCounts.culture === 28, 'Topic Count: culture', `Got ${topicCounts.culture}`);

  const chipSum =
    topicCounts.daily_life +
    topicCounts.social_conversations +
    topicCounts.workplace +
    topicCounts.travel +
    topicCounts.food_shopping +
    topicCounts.science_tech_health +
    topicCounts.culture;

  assert(
    chipSum === 200,
    'Topic Chip Sum Exactly 200',
    `29 + 29 + 29 + 29 + 28 + 28 + 28 = ${chipSum}`
  );

  // Pairwise Disjointness (Mutual Exclusivity)
  const topicCategories: TopicFilter[] = [
    'daily_life',
    'social_conversations',
    'workplace',
    'travel',
    'food_shopping',
    'science_tech_health',
    'culture',
  ];

  const topicItemSets = new Map<TopicFilter, Set<string>>();
  for (const cat of topicCategories) {
    const filtered = filterVideos(allVideos, 'all', cat, 'all', '');
    topicItemSets.set(cat, new Set(filtered.map((v) => v.id)));
  }

  // Check no overlap between any pair
  for (let i = 0; i < topicCategories.length; i++) {
    for (let j = i + 1; j < topicCategories.length; j++) {
      const catA = topicCategories[i];
      const catB = topicCategories[j];
      const setA = topicItemSets.get(catA)!;
      const setB = topicItemSets.get(catB)!;
      const intersection = [...setA].filter((id) => setB.has(id));
      assert(
        intersection.length === 0,
        `Topic Disjointness: ${catA} ∩ ${catB} = ∅`,
        `Overlap: ${intersection.length} items`
      );
    }
  }

  // Collective Exhaustiveness
  const allTopicIds = new Set<string>();
  for (const set of topicItemSets.values()) {
    for (const id of set) allTopicIds.add(id);
  }
  assert(
    allTopicIds.size === 200,
    'Topic Collective Exhaustiveness',
    `Union contains ${allTopicIds.size} unique IDs`
  );

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 2: Duration and CEFR Partition Oracles
  // ────────────────────────────────────────────────────────────────────────
  startSuite('2. Duration and CEFR Partition Oracles');

  // Duration
  const shortVideos = filterVideos(allVideos, 'short', 'all', 'all', '');
  const mediumVideos = filterVideos(allVideos, 'medium', 'all', 'all', '');

  assert(shortVideos.length === 130, 'Duration Short Count', `Got ${shortVideos.length} (expected 130)`);
  assert(mediumVideos.length === 70, 'Duration Medium Count', `Got ${mediumVideos.length} (expected 70)`);
  assert(
    shortVideos.length + mediumVideos.length === 200,
    'Duration Disjoint Union',
    `130 + 70 = ${shortVideos.length + mediumVideos.length}`
  );

  // Duration bounds verification
  for (const v of shortVideos) {
    assert(
      v.duration > 180 && v.duration <= 600,
      `Duration Short Bounds: ${v.id}`,
      `${v.duration}s in (180, 600]`
    );
  }
  for (const v of mediumVideos) {
    assert(
      v.duration > 600 && v.duration <= 1500,
      `Duration Medium Bounds: ${v.id}`,
      `${v.duration}s in (600, 1500]`
    );
  }

  // CEFR Levels
  const a2Videos = filterVideos(allVideos, 'all', 'all', 'A2', '');
  const b1Videos = filterVideos(allVideos, 'all', 'all', 'B1', '');
  const b2Videos = filterVideos(allVideos, 'all', 'all', 'B2', '');

  assert(a2Videos.length === 60, 'CEFR A2 Count', `Got ${a2Videos.length} (expected 60)`);
  assert(b1Videos.length === 85, 'CEFR B1 Count', `Got ${b1Videos.length} (expected 85)`);
  assert(b2Videos.length === 55, 'CEFR B2 Count', `Got ${b2Videos.length} (expected 55)`);
  assert(
    a2Videos.length + b1Videos.length + b2Videos.length === 200,
    'CEFR Disjoint Union',
    `60 + 85 + 55 = ${a2Videos.length + b1Videos.length + b2Videos.length}`
  );

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 3: 42-Cell Cartesian Product Partition (7 Topics x 2 Durations x 3 Levels)
  // ────────────────────────────────────────────────────────────────────────
  startSuite('3. 42-Cell Cartesian Product Partition');

  const durations: DurationFilter[] = ['short', 'medium'];
  const levels: LevelFilter[] = ['A2', 'B1', 'B2'];

  let totalCartesianSum = 0;
  const cartesianSeenIds = new Set<string>();

  for (const topic of topicCategories) {
    for (const duration of durations) {
      for (const level of levels) {
        const cellVideos = filterVideos(allVideos, duration, topic, level, '');
        totalCartesianSum += cellVideos.length;

        for (const v of cellVideos) {
          assert(
            !cartesianSeenIds.has(v.id),
            `Cartesian Uniqueness for ${v.id}`,
            `Cell [${topic}, ${duration}, ${level}] duplicates item`
          );
          cartesianSeenIds.add(v.id);
        }
      }
    }
  }

  assert(
    totalCartesianSum === 200,
    '42-Cell Cartesian Sum = 200',
    `Sum across all 42 cells is exactly ${totalCartesianSum}`
  );
  assert(
    cartesianSeenIds.size === 200,
    '42-Cell Unique Coverage',
    `Covered all 200 unique IDs`
  );

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 4: Text Search & Conjunction Filter Oracle
  // ────────────────────────────────────────────────────────────────────────
  startSuite('4. Text Search & Conjunction Filter Oracle');

  // Search by exact title token
  const searchCoffee = filterVideos(allVideos, 'all', 'all', 'all', 'coffee');
  assert(searchCoffee.length > 0, 'Search "coffee" Non-empty', `Found ${searchCoffee.length} matches`);

  // Case insensitivity: 'coffee' vs 'COFFEE' vs 'CoFfEe'
  const searchCoffeeUpper = filterVideos(allVideos, 'all', 'all', 'all', 'COFFEE');
  const searchCoffeeMixed = filterVideos(allVideos, 'all', 'all', 'all', 'CoFfEe');
  assert(
    searchCoffee.length === searchCoffeeUpper.length &&
      searchCoffee.length === searchCoffeeMixed.length,
    'Search Case-Insensitivity',
    `Lower: ${searchCoffee.length}, Upper: ${searchCoffeeUpper.length}, Mixed: ${searchCoffeeMixed.length}`
  );

  // Whitespace trimming
  const searchCoffeePadded = filterVideos(allVideos, 'all', 'all', 'all', '   coffee   ');
  assert(
    searchCoffeePadded.length === searchCoffee.length,
    'Search Whitespace Trimming',
    `Padded matches exact: ${searchCoffeePadded.length} == ${searchCoffee.length}`
  );

  // Whitespace-only search returns all 200 items
  const searchWhitespaceOnly = filterVideos(allVideos, 'all', 'all', 'all', '     ');
  assert(
    searchWhitespaceOnly.length === 200,
    'Whitespace-only Search',
    `Returns all ${searchWhitespaceOnly.length} items`
  );

  // Regex special character stress-test: must NOT throw syntax error
  const regexSpecials = ['(', ')', '[', ']', '*', '+', '?', '\\', '.', '$', '^', '{', '}'];
  for (const char of regexSpecials) {
    try {
      const res = filterVideos(allVideos, 'all', 'all', 'all', char);
      assert(Array.isArray(res), `Regex Char "${char}" Safe Execution`, `Matched ${res.length} items without crash`);
    } catch (e: any) {
      assert(false, `Regex Char "${char}" Threw Exception`, e.message);
    }
  }

  // Non-existent search query returns 0
  const searchNone = filterVideos(allVideos, 'all', 'all', 'all', 'xyznonexistentterm99999');
  assert(searchNone.length === 0, 'Non-existent Search Returns 0', `Got ${searchNone.length}`);

  // Conjunction test: Search + Topic + Duration + Level
  const combined = filterVideos(allVideos, 'short', 'daily_life', 'A2', 'morning');
  for (const v of combined) {
    assert(v.durationCategory === 'short', `Combined item ${v.id} is short`, `${v.durationCategory}`);
    assert(v.topic === 'daily_life', `Combined item ${v.id} is daily_life`, `${v.topic}`);
    assert(v.cefrLevel === 'A2', `Combined item ${v.id} is A2`, `${v.cefrLevel}`);
  }

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 5: Pagination Mathematics & Slice Bounds Oracle
  // ────────────────────────────────────────────────────────────────────────
  startSuite('5. Pagination Mathematics & Slice Bounds Oracle');

  const PAGE_SIZE = 12;
  const totalPages = Math.ceil(allVideos.length / PAGE_SIZE);

  assert(totalPages === 17, 'Total Pages for 200 items @ 12/page', `Expected 17, got ${totalPages}`);

  // Validate all 17 page slices
  let totalSlicedItems = 0;
  const paginatedSeenIds = new Set<string>();

  for (let page = 1; page <= totalPages; page++) {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, allVideos.length);
    const slice = allVideos.slice(startIndex, endIndex);

    totalSlicedItems += slice.length;

    if (page < 17) {
      assert(slice.length === 12, `Page ${page} Item Count`, `Page ${page} has exactly 12 items`);
    } else {
      assert(slice.length === 8, 'Page 17 Item Count', `Page 17 has exactly 8 items (16*12 + 8 = 200)`);
    }

    for (const item of slice) {
      assert(!paginatedSeenIds.has(item.id), `Uniqueness in Page ${page}`, `Duplicate ID ${item.id}`);
      paginatedSeenIds.add(item.id);
    }
  }

  assert(totalSlicedItems === 200, 'Sum of Slices', `Sliced exactly ${totalSlicedItems} items`);
  assert(paginatedSeenIds.size === 200, 'All Videos Paginated', `All 200 unique IDs accounted for`);

  // Slice Boundaries Out-of-Range Stress
  // 1. Page Underflow (page = 0, page = -1)
  const page0Start = (0 - 1) * PAGE_SIZE; // -12
  const page0End = Math.min(page0Start + PAGE_SIZE, allVideos.length); // 0
  const page0Slice = allVideos.slice(page0Start, page0End);
  assert(page0Slice.length === 0, 'Page 0 Slice Underflow', 'slice(-12, 0) safely returns []');

  // 2. Page Overflow (page = 18, page = 100)
  const page18Start = (18 - 1) * PAGE_SIZE; // 204
  const page18End = Math.min(page18Start + PAGE_SIZE, allVideos.length); // 200
  const page18Slice = allVideos.slice(page18Start, page18End);
  assert(page18Slice.length === 0, 'Page 18 Slice Overflow', 'slice(204, 200) safely returns []');

  const page100Start = (100 - 1) * PAGE_SIZE; // 1188
  const page100End = Math.min(page100Start + PAGE_SIZE, allVideos.length); // 200
  const page100Slice = allVideos.slice(page100Start, page100End);
  assert(page100Slice.length === 0, 'Page 100 Slice Overflow', 'slice(1188, 200) safely returns []');

  // Arbitrary Collection Scales
  const scalesToTest = [
    { count: 0, expectedPages: 0 },
    { count: 1, expectedPages: 1 },
    { count: 11, expectedPages: 1 },
    { count: 12, expectedPages: 1 },
    { count: 13, expectedPages: 2 },
    { count: 24, expectedPages: 2 },
    { count: 25, expectedPages: 3 },
    { count: 199, expectedPages: 17 },
    { count: 200, expectedPages: 17 },
    { count: 201, expectedPages: 17 },
    { count: 204, expectedPages: 17 },
    { count: 205, expectedPages: 18 },
  ];

  for (const { count, expectedPages } of scalesToTest) {
    const calc = Math.ceil(count / PAGE_SIZE);
    assert(calc === expectedPages, `Scale Math: ${count} items`, `Math.ceil(${count}/12) = ${calc} (expected ${expectedPages})`);
  }

  // Ellipsis Generator Stress across all 17 pages
  for (let p = 1; p <= 17; p++) {
    const numbers = getPaginationPageNumbers(17, p);
    assert(numbers[0] === 1, `Page ${p} Pagination Starts with 1`, `${numbers.join(' ')}`);
    assert(numbers[numbers.length - 1] === 17, `Page ${p} Pagination Ends with 17`, `${numbers.join(' ')}`);
    assert(numbers.includes(p), `Page ${p} Pagination Contains Current Page`, `Contains ${p}`);

    // No adjacent duplicate numbers
    for (let idx = 0; idx < numbers.length - 1; idx++) {
      if (typeof numbers[idx] === 'number' && typeof numbers[idx + 1] === 'number') {
        assert(
          numbers[idx] !== numbers[idx + 1],
          `No adjacent duplicates at page ${p}`,
          `${numbers[idx]} !== ${numbers[idx + 1]}`
        );
      }
    }
  }

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 6: Filter Change Reset Semantics Simulator
  // ────────────────────────────────────────────────────────────────────────
  startSuite('6. Filter Change Reset Semantics Simulator');

  const sim = new LibraryFilterStateSimulator();
  assert(sim.currentPage === 1, 'Initial Page is 1');

  // 1. User navigates to page 17
  sim.setPage(17);
  assert(sim.currentPage === 17, 'Navigate to Page 17');

  // 2. User switches Topic -> must reset to page 1
  sim.setFilters({ topic: 'daily_life' });
  assert(sim.currentPage === 1, 'Topic Switch Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 3. User navigates to page 3
  sim.setPage(3);
  assert(sim.currentPage === 3, 'Navigate to Page 3');

  // 4. User switches Duration -> must reset to page 1
  sim.setFilters({ duration: 'short' });
  assert(sim.currentPage === 1, 'Duration Switch Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 5. User navigates to page 2
  sim.setPage(2);
  assert(sim.currentPage === 2, 'Navigate to Page 2');

  // 6. User switches CEFR Level -> must reset to page 1
  sim.setFilters({ level: 'B1' });
  assert(sim.currentPage === 1, 'CEFR Switch Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 7. User navigates to page 2
  sim.setPage(2);
  assert(sim.currentPage === 2, 'Navigate to Page 2');

  // 8. User types search query -> must reset to page 1
  sim.setFilters({ query: 'interview' });
  assert(sim.currentPage === 1, 'Search Query Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 9. User clears search query -> must reset to page 1
  sim.setPage(4);
  sim.setFilters({ query: '' });
  assert(sim.currentPage === 1, 'Clear Query Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 10. User resets all filters -> must reset to page 1
  sim.setPage(5);
  sim.setFilters({ duration: 'all', topic: 'all', level: 'all', query: '' });
  assert(sim.currentPage === 1, 'Reset All Filters Resets Page to 1', `Current page is ${sim.currentPage}`);

  // 11. Changing page without filter change preserves page
  sim.setPage(8);
  sim.render(); // Re-render without filter changes
  assert(sim.currentPage === 8, 'Page Change without Filter Change Preserved', `Current page is ${sim.currentPage}`);

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 7: Watch Progress Parsing Oracle
  // ────────────────────────────────────────────────────────────────────────
  startSuite('7. Watch Progress Parsing Oracle');

  assert(parseWatchProgressPercent('0') === 0, 'Watch Progress 0%');
  assert(parseWatchProgressPercent('50') === 50, 'Watch Progress 50%');
  assert(parseWatchProgressPercent('100') === 100, 'Watch Progress 100%');
  assert(parseWatchProgressPercent('120') === 100, 'Watch Progress Clamped Max 100%', 'Clamped to 100');
  assert(parseWatchProgressPercent('-10') === 0, 'Watch Progress Clamped Min 0%', 'Clamped to 0');
  assert(parseWatchProgressPercent('{"percent": 75}') === 75, 'Watch Progress JSON percent');
  assert(parseWatchProgressPercent('{"percentWatched": 62}') === 62, 'Watch Progress JSON percentWatched');
  assert(parseWatchProgressPercent('{"progress": 90}') === 90, 'Watch Progress JSON progress');
  assert(parseWatchProgressPercent('{"currentTime": 180, "duration": 360}') === 50, 'Watch Progress JSON currentTime/duration');
  assert(parseWatchProgressPercent('{"currentTime": 180, "duration": 0}') === 0, 'Watch Progress Zero Duration', 'Returns 0 without division-by-zero crash');
  assert(parseWatchProgressPercent('invalid json {') === 0, 'Watch Progress Corrupted JSON', 'Returns 0 gracefully');
  assert(parseWatchProgressPercent(null) === 0, 'Watch Progress Null', 'Returns 0');

  endSuite();

  // ────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('CHALLENGER 1 MILESTONE 2: FINAL TEST SUMMARY');
  console.log('================================================================');
  let totalPassed = 0;
  for (const s of summaries) {
    if (s.passed) {
      console.log(`✅ ${s.name}: ${s.assertions} assertions PASSED`);
      totalPassed += s.assertions;
    } else {
      console.error(`❌ ${s.name}: FAILED - ${s.error}`);
    }
  }
  console.log(`\nTOTAL VERIFIED ASSERTIONS: ${totalPassed}`);
  console.log('================================================================\n');
}

runAllChallengerTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
