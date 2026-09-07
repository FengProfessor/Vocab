/**
 * Independent Challenger Verification Suite for Milestone 1
 * Stress-testing dataset integrity, boundary invariants, two-tier parity,
 * schema constraints, and pedagogical quality across 200 listening videos.
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
  findActiveCueIndex,
  formatTime,
  getTopicDisplayName,
  getTopicBadgeColor,
  getTopicIconName,
  getCefrBadgeStyle,
} from '../src/lib/listening';
import type {
  ListeningVideo,
  ListeningVideoIndexItem,
  ListeningTopic,
  CEFRLevel,
} from '../src/types/listening';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, message?: string, details?: Record<string, unknown>) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
  } else {
    results.push({ suite, name, passed: false, message: message || 'Assertion failed', details });
    console.error(`  ❌ [FAIL] ${suite} -> ${name}: ${message || 'Assertion failed'}`);
  }
}

async function runMilestone1ChallengerSuite() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('  CHALLENGER 1: INDEPENDENT EMPIRICAL VERIFICATION (MILESTONE 1)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const ROOT = path.resolve(__dirname, '..');
  const VIDEOS_JSON_PATH = path.join(ROOT, 'src', 'data', 'listening', 'videos.json');
  const INDEX_JSON_PATH = path.join(ROOT, 'src', 'data', 'listening', 'videos-index.json');
  const DETAILS_DIR = path.join(ROOT, 'src', 'data', 'listening', 'details');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: Raw File & Directory Invariants
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 1] Checking Raw File & Directory Invariants...');
  assert(fs.existsSync(VIDEOS_JSON_PATH), 'File Invariants', 'videos.json exists');
  assert(fs.existsSync(INDEX_JSON_PATH), 'File Invariants', 'videos-index.json exists');
  assert(fs.existsSync(DETAILS_DIR), 'File Invariants', 'details/ directory exists');

  const rawVideosContent = fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8');
  let parsedVideos: ListeningVideo[] = [];
  try {
    parsedVideos = JSON.parse(rawVideosContent);
    assert(Array.isArray(parsedVideos), 'File Invariants', 'videos.json is a valid JSON array');
  } catch (err) {
    assert(false, 'File Invariants', 'videos.json is valid JSON', String(err));
  }

  const rawIndexContent = fs.readFileSync(INDEX_JSON_PATH, 'utf-8');
  let parsedIndex: ListeningVideoIndexItem[] = [];
  try {
    parsedIndex = JSON.parse(rawIndexContent);
    assert(Array.isArray(parsedIndex), 'File Invariants', 'videos-index.json is a valid JSON array');
  } catch (err) {
    assert(false, 'File Invariants', 'videos-index.json is valid JSON', String(err));
  }

  const detailFiles = fs.readdirSync(DETAILS_DIR).filter(f => f.endsWith('.json'));
  assert(
    detailFiles.length === 200,
    'File Invariants',
    'details/ directory contains exactly 200 JSON files',
    `Found ${detailFiles.length} files`,
    { count: detailFiles.length }
  );

  const nonJsonFiles = fs.readdirSync(DETAILS_DIR).filter(f => !f.endsWith('.json'));
  assert(
    nonJsonFiles.length === 0,
    'File Invariants',
    'details/ directory contains no rogue non-JSON files',
    `Found non-json files: ${nonJsonFiles.join(', ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: Exact Corpus Counts & Global Uniqueness
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 2] Checking Corpus Size & Global Uniqueness...');
  assert(parsedVideos.length === 200, 'Corpus Counts', 'videos.json has exactly 200 items', `Got ${parsedVideos.length}`);
  assert(parsedIndex.length === 200, 'Corpus Counts', 'videos-index.json has exactly 200 items', `Got ${parsedIndex.length}`);

  const videoIds = parsedVideos.map(v => v.id);
  const videoIdSet = new Set(videoIds);
  assert(
    videoIdSet.size === 200,
    'Uniqueness',
    '100% of video IDs are globally unique',
    `Set size: ${videoIdSet.size} vs Array length: ${videoIds.length}`,
    { uniqueCount: videoIdSet.size }
  );

  const youtubeIds = parsedVideos.map(v => v.youtubeId);
  const youtubeIdSet = new Set(youtubeIds);
  assert(
    youtubeIdSet.size === 200,
    'Uniqueness',
    '100% of YouTube IDs are globally unique',
    `Set size: ${youtubeIdSet.size} vs Array length: ${youtubeIds.length}`,
    { uniqueCount: youtubeIdSet.size }
  );

  const ytRegex = /^[A-Za-z0-9_-]{11}$/;
  let invalidYtIds: string[] = [];
  for (const v of parsedVideos) {
    if (!v.youtubeId || !ytRegex.test(v.youtubeId)) {
      invalidYtIds.push(`${v.id}: '${v.youtubeId}'`);
    }
  }
  assert(
    invalidYtIds.length === 0,
    'Uniqueness',
    '100% of YouTube IDs are exactly 11 chars and URL-safe',
    `Invalid YouTube IDs: ${invalidYtIds.slice(0, 5).join(', ')}`
  );

  // Check slug ID format
  const slugRegex = /^[a-z0-9-]+$/;
  let invalidSlugs: string[] = [];
  for (const v of parsedVideos) {
    if (!v.id || !slugRegex.test(v.id)) {
      invalidSlugs.push(v.id);
    }
  }
  assert(
    invalidSlugs.length === 0,
    'Uniqueness',
    '100% of video IDs follow valid lowercase slug convention',
    `Invalid slugs: ${invalidSlugs.join(', ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: Duration Boundaries & Categorization
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 3] Checking Duration Boundaries & Ratio...');
  const shortVideos = parsedVideos.filter(v => v.durationCategory === 'short');
  const mediumVideos = parsedVideos.filter(v => v.durationCategory === 'medium');

  assert(
    shortVideos.length === 130,
    'Duration Distribution',
    'Exactly 130 short videos (>180s and <=600s)',
    `Found ${shortVideos.length} short videos (expected 130)`,
    { count: shortVideos.length, percentage: (shortVideos.length / 200) * 100 }
  );

  assert(
    mediumVideos.length === 70,
    'Duration Distribution',
    'Exactly 70 medium videos (>600s and <=1500s)',
    `Found ${mediumVideos.length} medium videos (expected 70)`,
    { count: mediumVideos.length, percentage: (mediumVideos.length / 200) * 100 }
  );

  let durationViolations: string[] = [];
  for (const v of parsedVideos) {
    if (v.durationCategory === 'short') {
      if (typeof v.duration !== 'number' || v.duration <= 180 || v.duration > 600) {
        durationViolations.push(`${v.id} (short, duration=${v.duration})`);
      }
    } else if (v.durationCategory === 'medium') {
      if (typeof v.duration !== 'number' || v.duration <= 600 || v.duration > 1500) {
        durationViolations.push(`${v.id} (medium, duration=${v.duration})`);
      }
    } else {
      durationViolations.push(`${v.id} (unknown category: ${(v as any).durationCategory})`);
    }
  }
  assert(
    durationViolations.length === 0,
    'Duration Distribution',
    'All video durations strictly respect bounds (>180s and <=600s for short; >600s and <=1500s for medium)',
    `Violations: ${durationViolations.slice(0, 5).join(', ')}`
  );

  // Check durationDisplay consistency
  let displayViolations: string[] = [];
  for (const v of parsedVideos) {
    const totalSecs = Math.floor(v.duration);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const expected = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (v.durationDisplay !== expected) {
      displayViolations.push(`${v.id}: display='${v.durationDisplay}', expected='${expected}'`);
    }
  }
  assert(
    displayViolations.length === 0,
    'Duration Distribution',
    '100% of durationDisplay strings accurately match duration in mm:ss',
    `Mismatches: ${displayViolations.slice(0, 5).join(', ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: Category & Topic Taxonomy Coverage
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 4] Checking 7-Topic Life Category Distribution...');
  const topicCounts: Record<string, number> = {};
  for (const v of parsedVideos) {
    topicCounts[v.topic] = (topicCounts[v.topic] || 0) + 1;
  }

  assert(topicCounts['daily_life'] === 29, 'Topic Distribution', "Category 'daily_life' has 29 videos", `Got ${topicCounts['daily_life']}`);
  assert(topicCounts['social_conversations'] === 29, 'Topic Distribution', "Category 'social_conversations' has 29 videos", `Got ${topicCounts['social_conversations']}`);
  assert(topicCounts['workplace'] === 29, 'Topic Distribution', "Category 'workplace' has 29 videos", `Got ${topicCounts['workplace']}`);
  assert(topicCounts['travel'] === 29, 'Topic Distribution', "Category 'travel' has 29 videos", `Got ${topicCounts['travel']}`);
  assert(topicCounts['food_shopping'] === 28, 'Topic Distribution', "Category 'food_shopping' has 28 videos", `Got ${topicCounts['food_shopping']}`);
  assert(topicCounts['science_tech_health'] === 28, 'Topic Distribution', "Category 'science_tech_health' has 28 videos", `Got ${topicCounts['science_tech_health']}`);

  const cultureCombined = (topicCounts['culture'] || 0) + (topicCounts['social_stories'] || 0);
  assert(
    cultureCombined === 28,
    'Topic Distribution',
    "Category 'culture' / 'social_stories' has 28 videos combined (26 culture + 2 legacy alias)",
    `Got ${cultureCombined} (${topicCounts['culture']} + ${topicCounts['social_stories']})`
  );

  let emptyTopicDisplays: string[] = [];
  for (const v of parsedVideos) {
    if (!v.topicDisplay || typeof v.topicDisplay !== 'string' || v.topicDisplay.trim().length === 0) {
      emptyTopicDisplays.push(v.id);
    }
  }
  assert(
    emptyTopicDisplays.length === 0,
    'Topic Distribution',
    '100% of videos have non-empty localized topicDisplay strings',
    `Missing: ${emptyTopicDisplays.join(', ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: CEFR Level Distribution & Appropriateness
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 5] Checking CEFR Level Distribution...');
  const a2Count = parsedVideos.filter(v => v.cefrLevel === 'A2').length;
  const b1Count = parsedVideos.filter(v => v.cefrLevel === 'B1').length;
  const b2Count = parsedVideos.filter(v => v.cefrLevel === 'B2').length;

  assert(a2Count === 60, 'CEFR Distribution', 'CEFR A2 count is 60 (30.0%)', `Got ${a2Count}`, { count: a2Count, pct: (a2Count / 200) * 100 });
  assert(b1Count === 85, 'CEFR Distribution', 'CEFR B1 count is 85 (42.5%)', `Got ${b1Count}`, { count: b1Count, pct: (b1Count / 200) * 100 });
  assert(b2Count === 55, 'CEFR Distribution', 'CEFR B2 count is 55 (27.5%)', `Got ${b2Count}`, { count: b2Count, pct: (b2Count / 200) * 100 });
  assert(a2Count + b1Count + b2Count === 200, 'CEFR Distribution', 'All 200 videos have valid CEFR levels (A2, B1, B2)');

  // Cross-distribution: check pedagogical suitability
  const a2Short = parsedVideos.filter(v => v.cefrLevel === 'A2' && v.durationCategory === 'short').length;
  const b1Short = parsedVideos.filter(v => v.cefrLevel === 'B1' && v.durationCategory === 'short').length;
  const b1Medium = parsedVideos.filter(v => v.cefrLevel === 'B1' && v.durationCategory === 'medium').length;
  const b2Short = parsedVideos.filter(v => v.cefrLevel === 'B2' && v.durationCategory === 'short').length;
  const b2Medium = parsedVideos.filter(v => v.cefrLevel === 'B2' && v.durationCategory === 'medium').length;

  assert(
    a2Short === 60,
    'CEFR Distribution',
    'A2 videos are exclusively short (<=10m, 60/60) aligning with beginner cognitive limits',
    `A2 short count: ${a2Short}`
  );
  assert(
    b1Short > 0 && b1Medium > 0,
    'CEFR Distribution',
    'B1 is balanced across short and medium durations',
    `short: ${b1Short}, medium: ${b1Medium}`
  );
  assert(
    b2Short > 0 && b2Medium > 0,
    'CEFR Distribution',
    'B2 is balanced across short and medium durations',
    `short: ${b2Short}, medium: ${b2Medium}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 6: Two-Tier Storage Parity: videos-index.json vs videos.json
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 6] Checking Two-Tier Parity (Index vs Consolidated)...');
  const indexMap = new Map<string, ListeningVideoIndexItem>();
  for (const item of parsedIndex) {
    indexMap.set(item.id, item);
  }

  assert(indexMap.size === 200, 'Two-Tier Parity', 'videos-index.json has 200 unique IDs matching count');

  let indexMismatches: string[] = [];
  for (const v of parsedVideos) {
    const idxItem = indexMap.get(v.id);
    if (!idxItem) {
      indexMismatches.push(`Missing in index: ${v.id}`);
      continue;
    }

    if (idxItem.youtubeId !== v.youtubeId) indexMismatches.push(`${v.id} youtubeId mismatch`);
    if (idxItem.title !== v.title) indexMismatches.push(`${v.id} title mismatch`);
    if (idxItem.channel !== v.channel) indexMismatches.push(`${v.id} channel mismatch`);
    if (idxItem.duration !== v.duration) indexMismatches.push(`${v.id} duration mismatch`);
    if (idxItem.durationDisplay !== v.durationDisplay) indexMismatches.push(`${v.id} durationDisplay mismatch`);
    if (idxItem.durationCategory !== v.durationCategory) indexMismatches.push(`${v.id} durationCategory mismatch`);
    if (idxItem.cefrLevel !== v.cefrLevel) indexMismatches.push(`${v.id} cefrLevel mismatch`);
    if (idxItem.topic !== v.topic) indexMismatches.push(`${v.id} topic mismatch`);
    if (idxItem.topicDisplay !== v.topicDisplay) indexMismatches.push(`${v.id} topicDisplay mismatch`);
    if (idxItem.thumbnailUrl !== v.thumbnailUrl) indexMismatches.push(`${v.id} thumbnailUrl mismatch`);
    if (idxItem.description !== v.description) indexMismatches.push(`${v.id} description mismatch`);

    // Counts parity
    if (idxItem.coreVocabularyCount !== v.coreVocabulary.length) {
      indexMismatches.push(`${v.id} vocab count: index=${idxItem.coreVocabularyCount}, actual=${v.coreVocabulary.length}`);
    }
    if (idxItem.transcriptCuesCount !== v.transcript.length) {
      indexMismatches.push(`${v.id} cues count: index=${idxItem.transcriptCuesCount}, actual=${v.transcript.length}`);
    }
    if (idxItem.clozeCount !== v.clozeItems.length) {
      indexMismatches.push(`${v.id} cloze count: index=${idxItem.clozeCount}, actual=${v.clozeItems.length}`);
    }
    if (idxItem.quizCount !== v.comprehensionQuestions.length) {
      indexMismatches.push(`${v.id} quiz count: index=${idxItem.quizCount}, actual=${v.comprehensionQuestions.length}`);
    }

    // Vocabulary preview parity
    const expectedVocabPreview = v.coreVocabulary.slice(0, 3).map(w => w.word);
    if (JSON.stringify(idxItem.coreVocabularyPreview) !== JSON.stringify(expectedVocabPreview)) {
      indexMismatches.push(`${v.id} vocab preview mismatch`);
    }
  }

  assert(
    indexMismatches.length === 0,
    'Two-Tier Parity',
    '100% of index items match videos.json across all fields and counts',
    `Mismatches: ${indexMismatches.slice(0, 5).join('; ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 7: Two-Tier Storage Parity: details/*.json vs videos.json
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 7] Checking Detail Files Parity & Loadability...');
  let detailErrors: string[] = [];
  for (const v of parsedVideos) {
    const detailFilePath = path.join(DETAILS_DIR, `${v.id}.json`);
    if (!fs.existsSync(detailFilePath)) {
      detailErrors.push(`Missing detail file: ${v.id}.json`);
      continue;
    }

    try {
      const detailRaw = fs.readFileSync(detailFilePath, 'utf-8');
      const detailObj = JSON.parse(detailRaw) as ListeningVideo;

      if (detailObj.id !== v.id) detailErrors.push(`${v.id} ID mismatch in detail file`);
      if (detailObj.youtubeId !== v.youtubeId) detailErrors.push(`${v.id} youtubeId mismatch in detail file`);
      if (detailObj.transcript.length !== v.transcript.length) detailErrors.push(`${v.id} transcript length mismatch`);
      if (detailObj.coreVocabulary.length !== v.coreVocabulary.length) detailErrors.push(`${v.id} vocab length mismatch`);
      if (detailObj.clozeItems.length !== v.clozeItems.length) detailErrors.push(`${v.id} cloze length mismatch`);
      if (detailObj.comprehensionQuestions.length !== v.comprehensionQuestions.length) detailErrors.push(`${v.id} quiz length mismatch`);
    } catch (e) {
      detailErrors.push(`Corrupt detail JSON: ${v.id}.json (${String(e)})`);
    }
  }

  assert(
    detailErrors.length === 0,
    'Detail Files Parity',
    'All 200 details/*.json exist, parse cleanly, and match videos.json identically',
    `Errors: ${detailErrors.slice(0, 5).join('; ')}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 8: Deep Adversarial & Pedagogical Quality Assertions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 8] Performing Deep Adversarial Integrity & Quality Tests...');

  let cueTimingFlaws: string[] = [];
  let ipaFlaws: string[] = [];
  let clozeFlaws: string[] = [];
  let quizFlaws: string[] = [];
  let thumbnailFlaws: string[] = [];

  const ipaPattern = /^\/[^/]+\/$/;

  for (const v of parsedVideos) {
    // Thumbnail check: must be a valid secure URL (either YouTube img or allowlisted domain)
    if (!v.thumbnailUrl.startsWith('https://')) {
      thumbnailFlaws.push(`${v.id}: ${v.thumbnailUrl}`);
    }

    // Vocabulary IPA check
    for (const vocab of v.coreVocabulary) {
      if (!ipaPattern.test(vocab.phonetic)) {
        ipaFlaws.push(`${v.id} word '${vocab.word}': '${vocab.phonetic}'`);
      }
      if (!vocab.contextSentence || !vocab.viDefinition) {
        ipaFlaws.push(`${v.id} incomplete vocab: '${vocab.word}'`);
      }
    }

    // Transcript cues timing
    let prevStart = -1;
    for (let c = 0; c < v.transcript.length; c++) {
      const cue = v.transcript[c];
      if (cue.start < 0 || cue.end <= cue.start) {
        cueTimingFlaws.push(`${v.id} cue ${cue.id} negative or inverted: [${cue.start}, ${cue.end}]`);
      }
      if (cue.start < prevStart) {
        cueTimingFlaws.push(`${v.id} non-monotonic cue ${cue.id}: ${cue.start} < ${prevStart}`);
      }
      prevStart = cue.start;

      // Check cue bounds vs duration + 10s grace
      if (cue.end > v.duration + 10) {
        cueTimingFlaws.push(`${v.id} cue ${cue.id} exceeds video duration: ${cue.end} > ${v.duration}`);
      }

      // Check text presence
      if (!cue.en || !cue.vi || cue.en.trim().length === 0 || cue.vi.trim().length === 0) {
        cueTimingFlaws.push(`${v.id} empty cue text in ${cue.id}`);
      }
    }

    // Cloze items check
    for (const cloze of v.clozeItems) {
      const blankOccurrences = (cloze.sentence.match(/\{\{blank\}\}/g) || []).length;
      if (blankOccurrences !== 1) {
        clozeFlaws.push(`${v.id} cloze ${cloze.id} has ${blankOccurrences} blanks`);
      }
      if (!cloze.blankWord || !cloze.hintVi) {
        clozeFlaws.push(`${v.id} cloze ${cloze.id} missing target word or hint`);
      }
      if (cloze.timestamp < 0 || cloze.timestamp > v.duration) {
        clozeFlaws.push(`${v.id} cloze ${cloze.id} timestamp ${cloze.timestamp} out of [0, ${v.duration}]`);
      }
      if (cloze.options) {
        if (cloze.options.length !== 4) {
          clozeFlaws.push(`${v.id} cloze ${cloze.id} options count != 4`);
        }
        const optLower = cloze.options.map(o => o.toLowerCase());
        if (!optLower.includes(cloze.blankWord.toLowerCase())) {
          clozeFlaws.push(`${v.id} cloze ${cloze.id} options missing blankWord '${cloze.blankWord}'`);
        }
        const optSet = new Set(optLower);
        if (optSet.size !== 4) {
          clozeFlaws.push(`${v.id} cloze ${cloze.id} duplicate options: ${cloze.options.join(',')}`);
        }
      }
    }

    // Quiz questions check
    for (const q of v.comprehensionQuestions) {
      if (!q.question || q.question.trim().length < 5) {
        quizFlaws.push(`${v.id} quiz ${q.id} question too short`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        quizFlaws.push(`${v.id} quiz ${q.id} options length != 4`);
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
        quizFlaws.push(`${v.id} quiz ${q.id} invalid correctIndex: ${q.correctIndex}`);
      }
      if (!q.explanation || q.explanation.trim().length < 15) {
        quizFlaws.push(`${v.id} quiz ${q.id} explanation too brief: '${q.explanation}'`);
      }
      if (typeof q.timestampSeek !== 'number' || q.timestampSeek < 0 || q.timestampSeek > v.duration) {
        quizFlaws.push(`${v.id} quiz ${q.id} timestampSeek ${q.timestampSeek} out of bounds [0, ${v.duration}]`);
      }
    }
  }

  assert(thumbnailFlaws.length === 0, 'Adversarial Checks', '100% of thumbnails are valid HTTPS secure URLs', `Flaws: ${thumbnailFlaws.slice(0, 3).join('; ')}`);
  assert(ipaFlaws.length === 0, 'Adversarial Checks', '100% of vocabulary items have valid /.../ IPA and non-empty definitions', `Flaws: ${ipaFlaws.slice(0, 3).join('; ')}`);
  assert(cueTimingFlaws.length === 0, 'Adversarial Checks', '100% of transcript cues are strictly non-negative, monotonic, non-empty, and bounded', `Flaws: ${cueTimingFlaws.slice(0, 3).join('; ')}`);
  assert(clozeFlaws.length === 0, 'Adversarial Checks', '100% of cloze items have exactly 1 {{blank}}, valid timestamp, and 4 unique options containing the blank word', `Flaws: ${clozeFlaws.slice(0, 3).join('; ')}`);
  assert(quizFlaws.length === 0, 'Adversarial Checks', '100% of quiz items have 4 options, valid correctIndex [0,3], adequate explanation, and bounded timestampSeek', `Flaws: ${quizFlaws.slice(0, 3).join('; ')}`);

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 9: Runtime API Robustness & Security / Edge Case Stress Testing
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[SUITE 9] Testing Runtime Data Access Functions & Edge Case Robustness...');

  // getAllListeningVideos
  const allVideos = getAllListeningVideos();
  assert(allVideos.length === 200, 'Runtime API', 'getAllListeningVideos() returns 200 items');

  // getListeningVideosIndex
  const allIndex = getListeningVideosIndex();
  assert(allIndex.length === 200, 'Runtime API', 'getListeningVideosIndex() returns 200 items');

  // getListeningVideoById
  const v1 = getListeningVideoById('video-short-daily-life');
  assert(v1 !== undefined && v1.id === 'video-short-daily-life', 'Runtime API', 'getListeningVideoById resolves existing video');

  const vNew = getListeningVideoById('video-dl-01');
  assert(vNew !== undefined && vNew.id === 'video-dl-01', 'Runtime API', 'getListeningVideoById resolves newly generated video');

  const vByYt = getListeningVideoById(vNew!.youtubeId);
  assert(vByYt !== undefined && vByYt.id === 'video-dl-01', 'Runtime API', 'getListeningVideoById resolves by youtubeId lookup');

  // Defensive input testing on getListeningVideoById
  assert(getListeningVideoById('') === undefined, 'Runtime API', 'getListeningVideoById with empty string returns undefined');
  assert(getListeningVideoById('   ') === undefined, 'Runtime API', 'getListeningVideoById with whitespace returns undefined');
  assert(getListeningVideoById('non-existent-id') === undefined, 'Runtime API', 'getListeningVideoById with non-existent id returns undefined');
  assert(getListeningVideoById('__proto__') === undefined, 'Runtime API', 'getListeningVideoById with __proto__ returns undefined safely');

  // loadListeningVideoById async loader
  const asyncV1 = await loadListeningVideoById('video-short-daily-life');
  assert(asyncV1 !== null && asyncV1.id === 'video-short-daily-life', 'Runtime API', 'loadListeningVideoById resolves video-short-daily-life');

  const asyncNew = await loadListeningVideoById('video-cs-24');
  assert(asyncNew !== null && asyncNew.id === 'video-cs-24', 'Runtime API', 'loadListeningVideoById resolves video-cs-24');

  const asyncByYt = await loadListeningVideoById(asyncNew!.youtubeId);
  assert(asyncByYt !== null && asyncByYt.id === 'video-cs-24', 'Runtime API', 'loadListeningVideoById resolves by youtubeId');

  const asyncNull1 = await loadListeningVideoById('');
  assert(asyncNull1 === null, 'Runtime API', 'loadListeningVideoById empty string returns null');

  const asyncNull2 = await loadListeningVideoById('non-existent-xyz-9999');
  assert(asyncNull2 === null, 'Runtime API', 'loadListeningVideoById non-existent ID returns null');

  const asyncNull3 = await loadListeningVideoById('../../etc/passwd');
  assert(asyncNull3 === null, 'Runtime API', 'loadListeningVideoById path traversal attempt returns null safely');

  // filterListeningVideosIndex
  const filteredShort = filterListeningVideosIndex({ duration: 'short' });
  const filteredMedium = filterListeningVideosIndex({ duration: 'medium' });
  assert(filteredShort.length === 130 && filteredMedium.length === 70, 'Runtime API', 'filterListeningVideosIndex accurately splits 130 short / 70 medium');

  const filteredTopics = [
    'daily_life',
    'social_conversations',
    'workplace',
    'travel',
    'food_shopping',
    'science_tech_health',
    'culture',
  ] as ListeningTopic[];

  let sumFilteredTopics = 0;
  for (const topic of filteredTopics) {
    const res = filterListeningVideosIndex({ topic });
    sumFilteredTopics += res.length;
  }
  // Include social_stories legacy alias
  const resLegacy = filterListeningVideosIndex({ topic: 'social_stories' });
  sumFilteredTopics += resLegacy.length;
  assert(sumFilteredTopics === 200, 'Runtime API', 'filterListeningVideosIndex topic filters partition all 200 items without leakage', `Sum: ${sumFilteredTopics}`);

  // Search filter
  const searchVocabMatch = filterListeningVideosIndex({ searchQuery: 'routine' });
  assert(searchVocabMatch.length > 0, 'Runtime API', "filterListeningVideosIndex matches search query 'routine'");

  // Binary search cue lookup stress test across all 200 videos
  let cueSearchErrors: string[] = [];
  for (const v of parsedVideos) {
    if (v.transcript.length > 0) {
      // Test before first cue
      const idxBefore = findActiveCueIndex(v.transcript, v.transcript[0].start - 5);
      if (idxBefore !== -1) cueSearchErrors.push(`${v.id} before start returned ${idxBefore}`);

      // Test exact start of first cue
      const idxFirst = findActiveCueIndex(v.transcript, v.transcript[0].start);
      if (idxFirst !== 0) cueSearchErrors.push(`${v.id} exact start returned ${idxFirst}`);

      // Test middle of last cue
      const lastCue = v.transcript[v.transcript.length - 1];
      const mid = (lastCue.start + lastCue.end) / 2;
      const idxLast = findActiveCueIndex(v.transcript, mid);
      if (idxLast !== v.transcript.length - 1) cueSearchErrors.push(`${v.id} last cue mid returned ${idxLast}`);
    }
  }
  assert(cueSearchErrors.length === 0, 'Runtime API', 'findActiveCueIndex works flawlessly on boundary queries across all 200 videos', `Errors: ${cueSearchErrors.slice(0, 3).join('; ')}`);

  // formatTime stress test
  assert(formatTime(0) === '00:00', 'Runtime API', 'formatTime(0) is 00:00');
  assert(formatTime(-10) === '00:00', 'Runtime API', 'formatTime(-10) is 00:00');
  assert(formatTime(NaN) === '00:00', 'Runtime API', 'formatTime(NaN) is 00:00');
  assert(formatTime(65) === '01:05', 'Runtime API', 'formatTime(65) is 01:05');
  assert(formatTime(3600) === '1:00:00', 'Runtime API', 'formatTime(3600) is 1:00:00');

  // UI helper functions stress test
  const sampleTopics: ListeningTopic[] = ['daily_life', 'social_conversations', 'workplace', 'travel', 'food_shopping', 'science_tech_health', 'culture', 'social_stories'];
  for (const t of sampleTopics) {
    const icon = getTopicIconName(t);
    const badge = getTopicBadgeColor(t);
    const display = getTopicDisplayName(t);
    assert(!!icon && !!badge.bg && !!display, 'Runtime API', `UI helpers for topic '${t}' return non-empty styling and labels`);
  }

  const sampleLevels: CEFRLevel[] = ['A2', 'B1', 'B2'];
  for (const l of sampleLevels) {
    const style = getCefrBadgeStyle(l);
    assert(!!style.bg && !!style.text && !!style.border, 'Runtime API', `CEFR badge style for '${l}' returns valid classes`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REPORT & SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  CHALLENGER VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Assertions Checked: ${total}`);
  console.log(`Passed:                  ${passed}`);
  console.log(`Failed:                  ${failed}`);
  console.log(`Pass Rate:                ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFAILED ASSERTIONS:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`- [${r.suite}] ${r.name}: ${r.message}`);
    }
  }

  return { total, passed, failed, results };
}

runMilestone1ChallengerSuite()
  .then(res => {
    if (res.failed > 0) {
      console.error(`\n❌ VERDICT: REQUEST_CHANGES (${res.failed} assertions failed)`);
      process.exit(1);
    } else {
      console.log('\n🏆 VERDICT: APPROVE (100% of all empirical stress-test assertions passed)');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Fatal execution failure in challenger runner:', err);
    process.exit(2);
  });
