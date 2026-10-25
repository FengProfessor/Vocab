/**
 * Independent Reviewer 2 Adversarial Stress Test & Verification Suite
 * Milestone 1: Data Architecture & 200 Video Dataset Expansion
 */

import * as fs from 'fs';
import * as path from 'path';
import * as LucideIcons from 'lucide-react';
import {
  getAllListeningVideos,
  getListeningVideosIndex,
  getListeningVideoById,
  loadListeningVideoById,
  getTopicIconName,
  getTopicDisplayName,
  getTopicBadgeColor,
  filterListeningVideos,
  filterListeningVideosIndex,
} from '../../src/lib/listening';
import type { ListeningTopic, ListeningVideo } from '../../src/types/listening';

async function main() {
  console.log('================================================================');
  console.log('REVIEWER 2: INDEPENDENT ADVERSARIAL VERIFICATION & INTEGRITY PROBE');
  console.log('================================================================\n');

  let failureCount = 0;
  function assert(condition: boolean, testName: string, detail: string) {
    if (!condition) {
      console.error(`❌ [FAIL] ${testName}: ${detail}`);
      failureCount++;
    } else {
      console.log(`✅ [PASS] ${testName}`);
    }
  }

  const ROOT_DIR = path.resolve(__dirname, '..', '..');
  const VIDEOS_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos.json');
  const INDEX_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');
  const DETAILS_DIR = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');

  // ============================================================================
  // SECTION 1: INTEGRITY AUDIT (Zero-cheating, No facades, No hardcoded mocks)
  // ============================================================================
  console.log('\n--- SECTION 1: Integrity & Source Code Audit ---');
  const libSource = fs.readFileSync(path.join(ROOT_DIR, 'src', 'lib', 'listening.ts'), 'utf-8');
  assert(!libSource.includes('mockPass') && !libSource.includes('// fake implementation'), 'Integrity: No fake/mock flags in src/lib/listening.ts', 'Clean implementation');
  assert(fs.existsSync(VIDEOS_PATH), 'Integrity: Canonical videos.json exists', VIDEOS_PATH);
  assert(fs.existsSync(INDEX_PATH), 'Integrity: videos-index.json exists', INDEX_PATH);
  assert(fs.existsSync(DETAILS_DIR), 'Integrity: details/ directory exists', DETAILS_DIR);

  // ============================================================================
  // SECTION 2: BACKWARDS COMPATIBILITY OF ORIGINAL 7 VIDEOS (INDICES 0-6)
  // ============================================================================
  console.log('\n--- SECTION 2: Original 7 Videos Preservation (Indices 0-6) ---');
  const allVideos = getAllListeningVideos();
  assert(allVideos.length === 200, 'Total Video Count', `Expected 200, got ${allVideos.length}`);

  const expectedOriginals = [
    { id: 'video-short-daily-life', validYouTubeIds: ['LhytOhr5ZMA', 'ecF1y2bI2T4'], durationCategory: 'short', validTopics: ['daily_life'] },
    { id: 'video-short-travel', validYouTubeIds: ['k-35z5Yq48Y', 'JgB6-RWnV9M'], durationCategory: 'short', validTopics: ['travel'] },
    { id: 'video-short-culture', validYouTubeIds: ['f2O6mQkFiiw'], durationCategory: 'short', validTopics: ['culture'] },
    { id: 'video-short-social', validYouTubeIds: ['CqgmozFr_GM'], durationCategory: 'short', validTopics: ['social_stories', 'social_conversations'] },
    { id: 'video-medium-workplace', validYouTubeIds: ['nhTcuUvLGOE'], durationCategory: 'medium', validTopics: ['workplace'] },
    { id: 'video-medium-culture', validYouTubeIds: ['x47LCM_qkPk'], durationCategory: 'medium', validTopics: ['culture'] },
    { id: 'video-medium-social-stories', validYouTubeIds: ['UF8uR6Z6KLc'], durationCategory: 'medium', validTopics: ['social_stories'] },
  ];

  for (let i = 0; i < 7; i++) {
    const v = allVideos[i];
    const exp = expectedOriginals[i];
    assert(v.id === exp.id, `Original [${i}] ID Match (${exp.id})`, `Expected ${exp.id}, got ${v.id}`);
    assert(exp.validYouTubeIds.includes(v.youtubeId), `Original [${i}] YouTube ID Match (${v.youtubeId})`, `Expected one of ${exp.validYouTubeIds.join(', ')}, got ${v.youtubeId}`);
    assert(v.durationCategory === exp.durationCategory, `Original [${i}] Duration Category`, `Expected ${exp.durationCategory}, got ${v.durationCategory}`);
    assert(exp.validTopics.includes(v.topic), `Original [${i}] Topic Match (${v.topic})`, `Expected one of ${exp.validTopics.join(', ')}, got ${v.topic}`);
    assert(Array.isArray(v.transcript) && v.transcript.length >= 10, `Original [${i}] Transcript Cues`, `Has ${v.transcript?.length} cues`);
    assert(Array.isArray(v.clozeItems) && v.clozeItems.length >= 3, `Original [${i}] Cloze Items`, `Has ${v.clozeItems?.length} items`);
    assert(Array.isArray(v.comprehensionQuestions) && v.comprehensionQuestions.length >= 3, `Original [${i}] Comprehension Questions`, `Has ${v.comprehensionQuestions?.length} questions`);
    assert(v.exercises !== undefined && v.exercises.clozeItems.length === v.clozeItems.length, `Original [${i}] exercises alias present`, 'exercises object synced');
  }

  // ============================================================================
  // SECTION 3: SYNCHRONOUS FUNCTIONS COMPATIBILITY
  // ============================================================================
  console.log('\n--- SECTION 3: Synchronous Function Contracts ---');
  // getAllListeningVideos
  const syncVideos = getAllListeningVideos();
  assert(Array.isArray(syncVideos), 'getAllListeningVideos returns Array', 'type is Array');
  assert(syncVideos.length === 200, 'getAllListeningVideos length', `200 videos`);

  // getListeningVideoById
  const videoById = getListeningVideoById('video-short-daily-life');
  assert(videoById !== undefined && videoById.id === 'video-short-daily-life', 'getListeningVideoById by ID', 'matched');

  const videoByYt = getListeningVideoById(videoById?.youtubeId || 'ecF1y2bI2T4');
  assert(videoByYt !== undefined && videoByYt.id === 'video-short-daily-life', 'getListeningVideoById by YouTube ID', 'matched');

  const videoCaseInsensitive = getListeningVideoById('VIDEO-SHORT-DAILY-LIFE');
  assert(videoCaseInsensitive !== undefined && videoCaseInsensitive.id === 'video-short-daily-life', 'getListeningVideoById case insensitive', 'matched');

  const videoWhitespace = getListeningVideoById('  video-short-daily-life  ');
  assert(videoWhitespace !== undefined && videoWhitespace.id === 'video-short-daily-life', 'getListeningVideoById whitespace trimmed', 'matched');

  const videoNonExistent = getListeningVideoById('non-existent-id-999');
  assert(videoNonExistent === undefined, 'getListeningVideoById non-existent returns undefined', 'returned undefined');

  const videoEmpty = getListeningVideoById('');
  assert(videoEmpty === undefined, 'getListeningVideoById empty string returns undefined', 'returned undefined');

  // ============================================================================
  // SECTION 4: ASYNC DYNAMIC LOADER & ERROR HANDLING (loadListeningVideoById)
  // ============================================================================
  console.log('\n--- SECTION 4: loadListeningVideoById Robustness & Fallback ---');

  // Normal lookup by ID
  const loadedById = await loadListeningVideoById('video-dl-01');
  assert(loadedById !== null && loadedById.id === 'video-dl-01', 'loadListeningVideoById by valid video ID', 'success');
  assert(loadedById !== null && Array.isArray(loadedById.exercises?.clozeItems), 'loadListeningVideoById guarantees exercises property', 'exercises populated');

  // Lookup by YouTube ID (must fall back cleanly to static catalog)
  if (loadedById) {
    const loadedByYt = await loadListeningVideoById(loadedById.youtubeId);
    assert(loadedByYt !== null && loadedByYt.id === loadedById.id, 'loadListeningVideoById fallback for YouTube ID', 'resolved via fallback');
  }

  // Edge Case: Non-existent ID
  const loadedUnknown = await loadListeningVideoById('completely_unknown_video_xyz_99999');
  assert(loadedUnknown === null, 'loadListeningVideoById unknown returns null', 'returned null safely');

  // Edge Case: Empty string
  const loadedEmpty = await loadListeningVideoById('');
  assert(loadedEmpty === null, 'loadListeningVideoById empty string returns null', 'returned null safely');

  // Edge Case: Whitespace only
  const loadedSpaces = await loadListeningVideoById('   \t\n   ');
  assert(loadedSpaces === null, 'loadListeningVideoById whitespace returns null', 'returned null safely');

  // Edge Case: Path traversal attempt
  const loadedTraversal = await loadListeningVideoById('../../package.json');
  assert(loadedTraversal === null, 'loadListeningVideoById path traversal handled safely', 'returned null safely without leaking or crashing');

  const loadedTraversal2 = await loadListeningVideoById('..\\..\\package.json');
  assert(loadedTraversal2 === null, 'loadListeningVideoById backslash traversal handled safely', 'returned null safely');

  // Edge Case: Prototype poisoning attempts
  const loadedProto = await loadListeningVideoById('__proto__');
  assert(loadedProto === null, 'loadListeningVideoById __proto__ handled safely', 'returned null safely');

  const loadedConstructor = await loadListeningVideoById('constructor');
  assert(loadedConstructor === null, 'loadListeningVideoById constructor handled safely', 'returned null safely');

  // Edge Case: Case variations and leading/trailing whitespace
  const loadedCasing = await loadListeningVideoById('  VIDEO-DL-01  ');
  assert(loadedCasing !== null && loadedCasing.id === 'video-dl-01', 'loadListeningVideoById trimmed and lowercase normalized', 'success');

  // Test all 200 videos loaded by ID and YouTube ID
  let all200LoadedCount = 0;
  for (const v of allVideos) {
    const loaded = await loadListeningVideoById(v.id);
    if (loaded && loaded.id === v.id && loaded.exercises) {
      all200LoadedCount++;
    }
  }
  assert(all200LoadedCount === 200, 'loadListeningVideoById all 200 videos loaded', `200/200 succeeded`);

  // ============================================================================
  // SECTION 5: LUCIDE ICON MAPPINGS
  // ============================================================================
  console.log('\n--- SECTION 5: Lucide Icon Mappings Verification ---');
  const allTopics: ListeningTopic[] = [
    'daily_life',
    'social_conversations',
    'workplace',
    'travel',
    'food_shopping',
    'science_tech_health',
    'culture',
    'social_stories',
  ];

  for (const topic of allTopics) {
    const iconName = getTopicIconName(topic);
    const LucideComponent = (LucideIcons as Record<string, any>)[iconName];
    assert(
      typeof LucideComponent === 'function' || typeof LucideComponent === 'object',
      `Lucide icon for '${topic}' -> '${iconName}'`,
      `Valid React icon component in lucide-react`
    );
  }

  // Fallback for invalid/unknown topic
  const fallbackIcon = getTopicIconName('unknown_topic_xyz' as any);
  assert(fallbackIcon === 'Headphones', 'getTopicIconName fallback for unknown topic', `Returned 'Headphones'`);
  const headphonesComp = (LucideIcons as Record<string, any>)['Headphones'];
  assert(typeof headphonesComp === 'function' || typeof headphonesComp === 'object', 'Fallback icon Headphones is valid Lucide component', 'Valid component');

  // ============================================================================
  // SECTION 6: TOPIC DISPLAY NAMES & BADGE STYLING
  // ============================================================================
  console.log('\n--- SECTION 6: Topic Display Names & Badge Styling ---');
  const expectedDisplayNames: Record<ListeningTopic, string> = {
    daily_life: 'Đời sống hàng ngày',
    social_conversations: 'Giao tiếp & Đời sống xã hội',
    workplace: 'Công việc & Sự nghiệp',
    travel: 'Du lịch & Khám phá',
    food_shopping: 'Ẩm thực, Mua sắm & Dịch vụ',
    science_tech_health: 'Khoa học, Công nghệ & Sức khỏe',
    culture: 'Văn hóa, TED & Câu chuyện',
    social_stories: 'Câu chuyện truyền cảm hứng',
  };

  for (const topic of allTopics) {
    const displayName = getTopicDisplayName(topic);
    assert(displayName === expectedDisplayNames[topic], `getTopicDisplayName for '${topic}'`, `Matched: '${displayName}'`);

    const badge = getTopicBadgeColor(topic);
    assert(typeof badge.bg === 'string' && badge.bg.length > 0, `getTopicBadgeColor '${topic}' has bg`, badge.bg);
    assert(typeof badge.text === 'string' && badge.text.length > 0, `getTopicBadgeColor '${topic}' has text`, badge.text);
    assert(typeof badge.border === 'string' && badge.border.length > 0, `getTopicBadgeColor '${topic}' has border`, badge.border);
  }

  // Unknown topic display fallback
  const unknownDisplay = getTopicDisplayName('custom_topic' as any);
  assert(unknownDisplay === 'custom_topic', 'getTopicDisplayName fallback for unknown topic', 'Returns topic as string');

  const unknownBadge = getTopicBadgeColor('custom_topic' as any);
  assert(unknownBadge.bg.includes('bg-slate-50'), 'getTopicBadgeColor fallback for unknown topic', 'Returns slate styling');

  // ============================================================================
  // SECTION 7: TWO-TIER ARCHITECTURE SEPARATION OF CONCERNS
  // ============================================================================
  console.log('\n--- SECTION 7: Two-Tier Architecture Separation of Concerns ---');
  const indexRaw = fs.readFileSync(INDEX_PATH, 'utf-8');
  const indexSizeKb = fs.statSync(INDEX_PATH).size / 1024;
  console.log(`videos-index.json size: ${indexSizeKb.toFixed(2)} KB`);
  assert(indexSizeKb <= 200, 'videos-index.json within performance budget (<= 200 KB)', `${indexSizeKb.toFixed(2)} KB`);

  const indexItems = JSON.parse(indexRaw);
  assert(indexItems.length === 200, 'videos-index.json has exactly 200 items', `Found ${indexItems.length}`);

  // Ensure index items are lightweight (no transcripts, no comprehension question details)
  const firstIndexItem = indexItems[0];
  assert(!('transcript' in firstIndexItem), 'Index item does NOT contain transcript', 'Separation verified');
  assert(!('comprehensionQuestions' in firstIndexItem), 'Index item does NOT contain full quiz questions', 'Separation verified');
  assert(!('clozeItems' in firstIndexItem), 'Index item does NOT contain full cloze items', 'Separation verified');
  assert('transcriptCuesCount' in firstIndexItem, 'Index item contains transcriptCuesCount', 'Count metric present');
  assert('clozeCount' in firstIndexItem, 'Index item contains clozeCount', 'Count metric present');
  assert('quizCount' in firstIndexItem, 'Index item contains quizCount', 'Count metric present');
  assert('coreVocabularyPreview' in firstIndexItem, 'Index item contains coreVocabularyPreview', 'Preview array present');
  assert('topicDisplay' in firstIndexItem, 'Index item contains topicDisplay', 'Topic display present');

  // Ensure detail files in details/ directory are complete
  const detailFiles = fs.readdirSync(DETAILS_DIR).filter((f) => f.endsWith('.json'));
  assert(detailFiles.length === 200, 'details/ directory contains exactly 200 JSON files', `Found ${detailFiles.length}`);

  let totalDetailSizeBytes = 0;
  for (const f of detailFiles) {
    totalDetailSizeBytes += fs.statSync(path.join(DETAILS_DIR, f)).size;
  }
  const avgDetailSizeKb = totalDetailSizeBytes / 200 / 1024;
  console.log(`Average detail file size: ${avgDetailSizeKb.toFixed(2)} KB`);
  assert(avgDetailSizeKb > 5 && avgDetailSizeKb < 50, 'Detail file size in reasonable range (~15 KB)', `${avgDetailSizeKb.toFixed(2)} KB`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  if (failureCount === 0) {
    console.log('🏆 ALL ADVERSARIAL CHECKS PASSED WITH 0 FAILURES!');
    console.log('================================================================\n');
  } else {
    console.error(`❌ VERDICT: FAIL — ${failureCount} check(s) failed!`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal probe crash:', err);
  process.exit(1);
});
