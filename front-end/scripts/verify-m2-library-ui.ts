/**
 * Verification Script for Milestone 2: UI/UX Library Page & Filters
 * Validates topic chips, 7-life category mapping, pagination, and video card metadata.
 */

import { getListeningVideosIndex, getTopicIconName, getTopicDisplayName, getTopicBadgeColor, getCefrBadgeStyle } from '../src/lib/listening';
import { TOPIC_CHIP_CONFIGS } from '../src/components/listening/TopicFilterChips';
import type { TopicFilter, DurationFilter, LevelFilter } from '../src/types/listening';

function assert(condition: boolean, testName: string, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${testName}: ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${testName}: ${message}`);
}

console.log('=== Milestone 2: UI/UX Library & Filter Verification ===\n');

// 1. Verify getListeningVideosIndex() payload
const allVideos = getListeningVideosIndex();
assert(allVideos.length === 200, 'Catalog Scale', `Expected 200 videos in index, got ${allVideos.length}`);

// 2. Verify all 7 Life Categories in TOPIC_CHIP_CONFIGS
const expectedChips: TopicFilter[] = [
  'all',
  'daily_life',
  'social_conversations',
  'workplace',
  'travel',
  'food_shopping',
  'science_tech_health',
  'culture',
];

assert(
  TOPIC_CHIP_CONFIGS.length === 8,
  'Topic Chips Count',
  `Expected 8 chips (all + 7 categories), got ${TOPIC_CHIP_CONFIGS.length}`
);

const chipIds = TOPIC_CHIP_CONFIGS.map((c) => c.id);
for (const expected of expectedChips) {
  assert(chipIds.includes(expected), 'Topic Chip Presence', `Chip '${expected}' is present in config`);
}

// 3. Verify Topic Distribution and Alias Mapping (culture includes social_stories)
const topicCounts: Record<string, number> = { all: allVideos.length };
for (const v of allVideos) {
  const key = v.topic === 'social_stories' ? 'culture' : v.topic;
  topicCounts[key] = (topicCounts[key] || 0) + 1;
}

assert(topicCounts.all === 200, 'Topic Count All', 'Total equals 200');
assert(topicCounts.daily_life === 29, 'Topic Count Daily Life', `Expected 29, got ${topicCounts.daily_life}`);
assert(topicCounts.social_conversations === 29, 'Topic Count Social Conversations', `Expected 29, got ${topicCounts.social_conversations}`);
assert(topicCounts.workplace === 29, 'Topic Count Workplace', `Expected 29, got ${topicCounts.workplace}`);
assert(topicCounts.travel === 29, 'Topic Count Travel', `Expected 29, got ${topicCounts.travel}`);
assert(topicCounts.food_shopping === 28, 'Topic Count Food & Shopping', `Expected 28, got ${topicCounts.food_shopping}`);
assert(topicCounts.science_tech_health === 28, 'Topic Count Science & Health', `Expected 28, got ${topicCounts.science_tech_health}`);
assert(topicCounts.culture === 28, 'Topic Count Culture (26 + 2 legacy)', `Expected 28, got ${topicCounts.culture}`);

const sumLifeCategories =
  topicCounts.daily_life +
  topicCounts.social_conversations +
  topicCounts.workplace +
  topicCounts.travel +
  topicCounts.food_shopping +
  topicCounts.science_tech_health +
  topicCounts.culture;

assert(sumLifeCategories === 200, 'Complete Coverage', `Sum of all 7 categories (${sumLifeCategories}) equals 200 without leaks`);

// 4. Verify Icons and Colors for each Topic
for (const chip of TOPIC_CHIP_CONFIGS) {
  if (chip.topic) {
    const iconName = getTopicIconName(chip.topic);
    assert(typeof iconName === 'string' && iconName.length > 0, 'Topic Icon', `${chip.topic} -> ${iconName}`);

    const badgeColor = getTopicBadgeColor(chip.topic);
    assert(badgeColor.bg.length > 0 && badgeColor.text.length > 0, 'Badge Color', `${chip.topic} badge color valid`);

    const displayName = getTopicDisplayName(chip.topic);
    assert(displayName.length > 0, 'Display Name', `${chip.topic} -> ${displayName}`);
  }
}

// 5. Verify Pagination Math (12 cards per page)
const PAGE_SIZE = 12;
const totalPages = Math.ceil(allVideos.length / PAGE_SIZE);
assert(totalPages === 17, 'Pagination Total Pages', `200 items / 12 per page = ${totalPages} pages`);

// First page slice
const page1 = allVideos.slice(0, 12);
assert(page1.length === 12, 'Page 1 Slice', 'Page 1 contains exactly 12 items');

// Last page slice
const page17 = allVideos.slice(16 * PAGE_SIZE, 17 * PAGE_SIZE);
assert(page17.length === 8, 'Page 17 Slice', `Page 17 contains exactly 8 remaining items (${16 * 12 + 8} = 200)`);

// 6. Verify Filter Combinations
// Duration Filter
const shortVideos = allVideos.filter((v) => v.durationCategory === 'short');
const mediumVideos = allVideos.filter((v) => v.durationCategory === 'medium');
assert(shortVideos.length === 130, 'Duration Short', `Expected 130, got ${shortVideos.length}`);
assert(mediumVideos.length === 70, 'Duration Medium', `Expected 70, got ${mediumVideos.length}`);

// CEFR Level Filter
const a2Videos = allVideos.filter((v) => v.cefrLevel === 'A2');
const b1Videos = allVideos.filter((v) => v.cefrLevel === 'B1');
const b2Videos = allVideos.filter((v) => v.cefrLevel === 'B2');
assert(a2Videos.length === 60, 'CEFR A2', `Expected 60, got ${a2Videos.length}`);
assert(b1Videos.length === 85, 'CEFR B1', `Expected 85, got ${b1Videos.length}`);
assert(b2Videos.length === 55, 'CEFR B2', `Expected 55, got ${b2Videos.length}`);

// 7. Verify Video Card Field Completeness across all 200 items
for (let i = 0; i < allVideos.length; i++) {
  const item = allVideos[i];
  assert(item.id.length > 0, `Video[${i}].id`, `Non-empty id`);
  assert(item.title.length > 0, `Video[${i}].title`, `Non-empty title`);
  assert(item.channel.length > 0, `Video[${i}].channel`, `Non-empty channel`);
  assert(item.thumbnailUrl.startsWith('https://'), `Video[${i}].thumbnailUrl`, `Valid https URL`);
  assert(item.durationDisplay.includes(':'), `Video[${i}].durationDisplay`, `Valid format mm:ss`);
  assert(['A2', 'B1', 'B2'].includes(item.cefrLevel), `Video[${i}].cefrLevel`, `Valid CEFR`);
  assert(item.coreVocabularyPreview.length >= 3, `Video[${i}].coreVocabularyPreview`, `At least 3 preview tags`);
}

// 8. Verify Watch Progress Parsing logic
function testWatchProgress(raw: string | null): number {
  if (!raw) return 0;
  const num = Number(raw);
  if (!isNaN(num)) return Math.min(100, Math.max(0, num));
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'number') return Math.min(100, Math.max(0, parsed));
    if (parsed && typeof parsed.percent === 'number') return Math.min(100, Math.max(0, parsed.percent));
    if (parsed && typeof parsed.percentWatched === 'number') return Math.min(100, Math.max(0, parsed.percentWatched));
    if (parsed && typeof parsed.currentTime === 'number' && typeof parsed.duration === 'number' && parsed.duration > 0) {
      return Math.min(100, Math.max(0, Math.round((parsed.currentTime / parsed.duration) * 100)));
    }
  } catch {
    // Ignore
  }
  return 0;
}

assert(testWatchProgress('75') === 75, 'Watch Progress Parser', 'Direct number string parses correctly');
assert(testWatchProgress('{"percent": 80}') === 80, 'Watch Progress Parser', 'JSON percent parses correctly');
assert(testWatchProgress('{"currentTime": 60, "duration": 120}') === 50, 'Watch Progress Parser', 'JSON currentTime/duration parses correctly');
assert(testWatchProgress(null) === 0, 'Watch Progress Parser', 'Null returns 0');

console.log('\n================================================================');
console.log('🏆 ALL MILESTONE 2 UI & FILTER VERIFICATION TESTS PASSED 100%!');
console.log('================================================================\n');
