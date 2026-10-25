/**
 * Comprehensive Verification Script for Listening Module Dataset & Library
 * Milestone 1 - Vocab / LingoPro Web App
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getAllListeningVideos,
  getListeningVideosIndex,
  getListeningVideoById,
  loadListeningVideoById,
  filterListeningVideos,
  filterListeningVideosIndex,
  findActiveCue,
  findActiveCueIndex,
  formatTime,
  tokenizeSentence,
  validateClozeAnswer,
  getTopicDisplayName,
  getTopicBadgeColor,
  getTopicIconName,
  getCefrBadgeStyle,
} from '../src/lib/listening';
import type { ListeningTopic, CEFRLevel } from '../src/types/listening';

console.log('=== Starting Full Verification: 200 Video Dataset & Architecture ===\n');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');
const DETAILS_DIR_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');

// 1. Total Video Count
const videos = getAllListeningVideos();
console.log(`[TEST 1] Total videos in memory: ${videos.length}`);
if (videos.length !== 200) {
  throw new Error(`Expected exactly 200 videos, but found ${videos.length}`);
}
console.log('[PASS] Exactly 200 videos present.');

// 2. Preserved Original 7 Videos (indices 0 to 6)
console.log('\n[TEST 2] Verifying preservation of original 7 videos at indices 0-6...');
const expectedOriginalIds = [
  'video-short-daily-life',
  'video-short-travel',
  'video-short-culture',
  'video-short-social',
  'video-medium-workplace',
  'video-medium-culture',
  'video-medium-social-stories',
];
for (let i = 0; i < 7; i++) {
  if (videos[i].id !== expectedOriginalIds[i]) {
    throw new Error(`Original video ${i} expected ID '${expectedOriginalIds[i]}', got '${videos[i].id}'`);
  }
}
console.log('[PASS] First 7 videos preserved intact at indices 0-6.');

// 3. Duration Distribution: Exactly 130 Short (65.0%) and 70 Medium (35.0%)
console.log('\n[TEST 3] Verifying duration ratio (target: 130 short / 70 medium)...');
const shortVideos = videos.filter((v) => v.durationCategory === 'short');
const mediumVideos = videos.filter((v) => v.durationCategory === 'medium');

console.log(`Short count: ${shortVideos.length} (${(shortVideos.length / 200 * 100).toFixed(1)}%)`);
console.log(`Medium count: ${mediumVideos.length} (${(mediumVideos.length / 200 * 100).toFixed(1)}%)`);

if (shortVideos.length !== 130) {
  throw new Error(`Expected exactly 130 short videos, found ${shortVideos.length}`);
}
if (mediumVideos.length !== 70) {
  throw new Error(`Expected exactly 70 medium videos, found ${mediumVideos.length}`);
}
console.log('[PASS] Duration ratio is exactly 130:70 (65.0% : 35.0%).');

// 4. CEFR Distribution: Exactly 60 A2, 85 B1, 55 B2
console.log('\n[TEST 4] Verifying CEFR distribution (target: 60 A2, 85 B1, 55 B2)...');
const a2Videos = videos.filter((v) => v.cefrLevel === 'A2');
const b1Videos = videos.filter((v) => v.cefrLevel === 'B1');
const b2Videos = videos.filter((v) => v.cefrLevel === 'B2');

console.log(`A2 count: ${a2Videos.length} (target: 60)`);
console.log(`B1 count: ${b1Videos.length} (target: 85)`);
console.log(`B2 count: ${b2Videos.length} (target: 55)`);

if (a2Videos.length !== 60) throw new Error(`Expected 60 A2 videos, got ${a2Videos.length}`);
if (b1Videos.length !== 85) throw new Error(`Expected 85 B1 videos, got ${b1Videos.length}`);
if (b2Videos.length !== 55) throw new Error(`Expected 55 B2 videos, got ${b2Videos.length}`);
console.log('[PASS] CEFR distribution matches 60 A2 : 85 B1 : 55 B2 exactly.');

// 5. Topic Distribution (7 Core Life Topics)
console.log('\n[TEST 5] Verifying Topic distribution across 7 life categories...');
const topicCounts: Record<string, number> = {};
for (const v of videos) {
  topicCounts[v.topic] = (topicCounts[v.topic] || 0) + 1;
}
console.log('Topic counts:', topicCounts);

if (topicCounts['daily_life'] !== 29) throw new Error(`Expected 29 daily_life, got ${topicCounts['daily_life']}`);
if (topicCounts['social_conversations'] !== 29) throw new Error(`Expected 29 social_conversations, got ${topicCounts['social_conversations']}`);
if (topicCounts['workplace'] !== 29) throw new Error(`Expected 29 workplace, got ${topicCounts['workplace']}`);
if (topicCounts['travel'] !== 29) throw new Error(`Expected 29 travel, got ${topicCounts['travel']}`);
if (topicCounts['food_shopping'] !== 28) throw new Error(`Expected 28 food_shopping, got ${topicCounts['food_shopping']}`);
if (topicCounts['science_tech_health'] !== 28) throw new Error(`Expected 28 science_tech_health, got ${topicCounts['science_tech_health']}`);

const cultureTotal = (topicCounts['culture'] || 0) + (topicCounts['social_stories'] || 0);
if (cultureTotal !== 28) throw new Error(`Expected 28 culture/stories total, got ${cultureTotal}`);
console.log('[PASS] All 7 life topics match specified target counts.');

// 6. Detailed Integrity Checks across all 200 videos
console.log('\n[TEST 6] Verifying schema and pedagogical integrity across all 200 videos...');
const idSet = new Set<string>();
const ytSet = new Set<string>();
const ytRegex = /^[A-Za-z0-9_-]{11}$/;
const ipaRegex = /^\/[^/]+\/$/;

for (let idx = 0; idx < videos.length; idx++) {
  const v = videos[idx];

  // Unique ID
  if (idSet.has(v.id)) throw new Error(`Duplicate video ID detected: ${v.id}`);
  idSet.add(v.id);

  // Unique YouTube ID (11 chars URL-safe)
  if (!ytRegex.test(v.youtubeId)) {
    throw new Error(`Video ${v.id} has invalid YouTube ID '${v.youtubeId}' (must be 11 chars URL-safe)`);
  }
  if (ytSet.has(v.youtubeId)) throw new Error(`Duplicate YouTube ID detected: ${v.youtubeId}`);
  ytSet.add(v.youtubeId);

  // Duration
  if (v.durationCategory === 'short') {
    if (v.duration < 181 || v.duration > 600) {
      throw new Error(`Video ${v.id} short duration out of range [181, 600]: ${v.duration}`);
    }
  } else if (v.durationCategory === 'medium') {
    if (v.duration < 601 || v.duration > 1500) {
      throw new Error(`Video ${v.id} medium duration out of range [601, 1500]: ${v.duration}`);
    }
  }

  // Core Metadata
  if (!v.title || !v.channel || !v.description || !v.thumbnailUrl || !v.topicDisplay) {
    throw new Error(`Video ${v.id} missing core metadata fields.`);
  }

  // Core Vocabulary
  if (!v.coreVocabulary || v.coreVocabulary.length < 3) {
    throw new Error(`Video ${v.id} has fewer than 3 vocabulary items.`);
  }
  for (const vocab of v.coreVocabulary) {
    if (!vocab.word || !vocab.phonetic || !vocab.viDefinition || !vocab.contextSentence) {
      throw new Error(`Incomplete vocab item in ${v.id}: ${JSON.stringify(vocab)}`);
    }
    if (!ipaRegex.test(vocab.phonetic)) {
      throw new Error(`Invalid IPA notation in ${v.id} for '${vocab.word}': ${vocab.phonetic}`);
    }
  }

  // Transcript cues
  if (!v.transcript || v.transcript.length < 10) {
    throw new Error(`Video ${v.id} has fewer than 10 cues (${v.transcript?.length}).`);
  }
  let prevStart = -1;
  for (let c = 0; c < v.transcript.length; c++) {
    const cue = v.transcript[c];
    if (cue.start < 0 || cue.end <= cue.start) {
      throw new Error(`Invalid cue timing in ${v.id} cue ${cue.id}: ${cue.start} -> ${cue.end}`);
    }
    if (cue.start < prevStart) {
      throw new Error(`Non-monotonic start time in ${v.id} cue ${cue.id}: ${cue.start} < ${prevStart}`);
    }
    prevStart = cue.start;
    if (!cue.en.trim() || !cue.vi.trim()) {
      throw new Error(`Empty transcript text in ${v.id} cue ${cue.id}`);
    }
  }

  // Cloze items
  if (!v.clozeItems || v.clozeItems.length < 3) {
    throw new Error(`Video ${v.id} has fewer than 3 cloze items (${v.clozeItems?.length}).`);
  }
  for (const cloze of v.clozeItems) {
    if (!cloze.sentence.includes('{{blank}}')) {
      throw new Error(`Cloze in ${v.id} missing '{{blank}}': ${cloze.sentence}`);
    }
    if (!cloze.blankWord || !cloze.hintVi || cloze.timestamp < 0) {
      throw new Error(`Invalid cloze metadata in ${v.id}: ${JSON.stringify(cloze)}`);
    }
    if (cloze.options) {
      if (cloze.options.length !== 4) {
        throw new Error(`Cloze ${cloze.id} in ${v.id} must have 4 options, found ${cloze.options.length}`);
      }
      if (!cloze.options.map(o => o.toLowerCase()).includes(cloze.blankWord.toLowerCase())) {
        throw new Error(`Cloze ${cloze.id} options do not include blankWord '${cloze.blankWord}'`);
      }
    }
  }

  // Comprehension Questions
  if (!v.comprehensionQuestions || v.comprehensionQuestions.length < 3) {
    throw new Error(`Video ${v.id} has fewer than 3 quiz questions.`);
  }
  for (const q of v.comprehensionQuestions) {
    if (!q.question || q.options.length !== 4) {
      throw new Error(`Quiz ${q.id} in ${v.id} must have 4 options.`);
    }
    if (q.correctIndex < 0 || q.correctIndex > 3) {
      throw new Error(`Quiz ${q.id} in ${v.id} has invalid correctIndex: ${q.correctIndex}`);
    }
    if (!q.explanation || q.explanation.length < 15) {
      throw new Error(`Quiz ${q.id} in ${v.id} explanation is too brief (<15 chars): '${q.explanation}'`);
    }
    if (q.timestampSeek < 0 || q.timestampSeek > v.duration) {
      throw new Error(`Quiz ${q.id} in ${v.id} timestampSeek ${q.timestampSeek} out of bounds [0, ${v.duration}]`);
    }
  }
}
console.log(`[PASS] All 200 videos pass rigorous schema, monotonic timing, IPA, cloze, and quiz tests.`);

// 7. Two-Tier Storage Architecture Verification
console.log('\n[TEST 7] Verifying Two-Tier Storage Architecture...');
if (!fs.existsSync(INDEX_JSON_PATH)) {
  throw new Error(`Missing videos-index.json at ${INDEX_JSON_PATH}`);
}
const indexRaw = fs.readFileSync(INDEX_JSON_PATH, 'utf-8');
const indexItems = JSON.parse(indexRaw);
if (indexItems.length !== 200) {
  throw new Error(`videos-index.json expected 200 items, got ${indexItems.length}`);
}
const indexSizeKb = fs.statSync(INDEX_JSON_PATH).size / 1024;
console.log(`[INFO] videos-index.json size: ${indexSizeKb.toFixed(2)} KB (target: ~150 KB)`);

// Check detail files
if (!fs.existsSync(DETAILS_DIR_PATH)) {
  throw new Error(`Missing details directory at ${DETAILS_DIR_PATH}`);
}
for (const v of videos) {
  const detailPath = path.join(DETAILS_DIR_PATH, `${v.id}.json`);
  if (!fs.existsSync(detailPath)) {
    throw new Error(`Missing detail file for video ${v.id} at ${detailPath}`);
  }
}
console.log(`[PASS] Two-Tier architecture verified: 200 index items + 200 detail JSON files present.`);

// 8. Library Functions Verification
console.log('\n[TEST 8] Verifying Library Functions...');

// getListeningVideosIndex()
const libIndex = getListeningVideosIndex();
if (libIndex.length !== 200) {
  throw new Error(`getListeningVideosIndex returned ${libIndex.length} items, expected 200`);
}
console.log('[PASS] getListeningVideosIndex() returns 200 items.');

// loadListeningVideoById()
async function testAsyncLoader() {
  const loadedFirst = await loadListeningVideoById('video-short-daily-life');
  if (!loadedFirst || loadedFirst.id !== 'video-short-daily-life') {
    throw new Error('loadListeningVideoById failed for video-short-daily-life');
  }

  const loadedNew = await loadListeningVideoById('video-dl-01');
  if (!loadedNew || loadedNew.id !== 'video-dl-01') {
    throw new Error('loadListeningVideoById failed for video-dl-01');
  }

  const loadedByYt = await loadListeningVideoById(loadedNew.youtubeId);
  if (!loadedByYt || loadedByYt.id !== 'video-dl-01') {
    throw new Error('loadListeningVideoById failed for lookup by youtubeId');
  }

  const loadedUnknown = await loadListeningVideoById('unknown_xyz_999');
  if (loadedUnknown !== null) {
    throw new Error('loadListeningVideoById should return null for nonexistent ID');
  }
  console.log('[PASS] loadListeningVideoById() verified for existing, new, youtubeId, and nonexistent lookups.');
}

// filterListeningVideosIndex()
const filteredIndexShort = filterListeningVideosIndex({ duration: 'short' });
if (filteredIndexShort.length !== 130) {
  throw new Error(`filterListeningVideosIndex duration=short expected 130, got ${filteredIndexShort.length}`);
}

const filteredIndexTravel = filterListeningVideosIndex({ topic: 'travel' });
if (filteredIndexTravel.length !== 29) {
  throw new Error(`filterListeningVideosIndex topic=travel expected 29, got ${filteredIndexTravel.length}`);
}

const filteredIndexB2 = filterListeningVideosIndex({ level: 'B2' });
if (filteredIndexB2.length !== 55) {
  throw new Error(`filterListeningVideosIndex level=B2 expected 55, got ${filteredIndexB2.length}`);
}
console.log('[PASS] filterListeningVideosIndex() verified for duration, topic, and level filters.');

// getTopicIconName()
const testTopics: ListeningTopic[] = [
  'daily_life',
  'social_conversations',
  'workplace',
  'travel',
  'food_shopping',
  'science_tech_health',
  'culture',
  'social_stories',
];
for (const t of testTopics) {
  const icon = getTopicIconName(t);
  if (!icon || typeof icon !== 'string') {
    throw new Error(`getTopicIconName failed for topic '${t}'`);
  }
}
console.log('[PASS] getTopicIconName() verified for all 7 topics + legacy alias.');

// Display names & badge styles
for (const t of testTopics) {
  const name = getTopicDisplayName(t);
  const badge = getTopicBadgeColor(t);
  if (!name || !badge.bg || !badge.text) {
    throw new Error(`Topic display helpers incomplete for '${t}'`);
  }
}
console.log('[PASS] Topic display names and badge styles verified for all topics.');

// Execute async loader test
testAsyncLoader().then(() => {
  console.log('\n================================================================');
  console.log('🏆 ALL 200-VIDEO DATASET AND TWO-TIER LIBRARY TESTS PASSED 100%!');
  console.log('================================================================\n');
}).catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
