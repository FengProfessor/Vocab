/**
 * Comprehensive Automated Test Suite: Speaking Ingestion & Crawling Pipeline
 * File: tests/speaking/crawling-pipeline.test.ts
 *
 * Verifies:
 * 1. Rate Limiter (Jitter range, Exponential backoff 45s * retryCount, Circuit Breaker).
 * 2. User-Agent Pool & HTTP Client (Rotation, Domain extraction, Offline mode).
 * 3. Normalizer & SafeHarbor Core Keyword Extractor (Stopword filtering, Quality score).
 * 4. High-Fidelity Seeds Determinism & Quality (100% compliance with isStandardizedSpeakingLesson, 0 placeholders).
 * 5. Production Ingested Catalogs & Lookup Helpers (Catalog index, filtering by source/level/topic, stats).
 * 6. Crawlers Offline Determinism (crawlElllo, crawlTalkEnglish, crawlYouTube).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  defaultHttpClient,
  HttpClient,
  USER_AGENT_POOL,
} from '../../scripts/speaking/core/http-client';
import {
  defaultRateLimiter,
  RateLimiter,
} from '../../scripts/speaking/core/rate-limiter';
import {
  crawlElllo,
  loadEllloSeeds,
} from '../../scripts/speaking/crawlers/crawl-elllo';
import {
  crawlTalkEnglish,
  loadTalkEnglishSeeds,
} from '../../scripts/speaking/crawlers/crawl-talkenglish';
import {
  crawlYouTube,
  loadYouTubeSeeds,
  parseTimedTextXml,
} from '../../scripts/speaking/crawlers/crawl-youtube';
import {
  calculateQualityScore,
  extractCoreKeywords,
  hasPlaceholderText,
  normalizeLesson,
  STOPWORDS,
} from '../../scripts/speaking/normalizer';
import {
  allIngestedLessons,
  ellloCatalog,
  getIngestedCatalogStats,
  getLessonById,
  getLessonsByLevel,
  getLessonsBySource,
  getLessonsByTopic,
  talkenglishCatalog,
  youtubeCatalog,
} from '../../src/data/speaking/ingested';
import {
  isStandardizedSpeakingLesson,
  StandardizedSpeakingLesson,
} from '../../src/types/speaking-curriculum';

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failure: ${message}`);
  }
}

// ── 1. Rate Limiter & Circuit Breaker Tests ───────────────────────────────────

test('1.1: RateLimiter jittered delay stays strictly within [minDelayMs, maxDelayMs]', () => {
  const limiter = new RateLimiter({ minDelayMs: 1500, maxDelayMs: 4000 });
  for (let i = 0; i < 50; i++) {
    const delay = limiter.calculateJitterDelay();
    assert(delay >= 1500, `Delay ${delay} should be >= 1500`);
    assert(delay <= 4000, `Delay ${delay} should be <= 4000`);
  }
});

test('1.2: RateLimiter exponential backoff for 429/403 equals (45s * retryCount)', () => {
  const limiter = new RateLimiter();
  assert(limiter.getBackoffDelay('elllo.org', 1, 429) === 45000, 'Attempt 1 on 429 should be 45,000ms');
  assert(limiter.getBackoffDelay('elllo.org', 2, 429) === 90000, 'Attempt 2 on 429 should be 90,000ms');
  assert(limiter.getBackoffDelay('talkenglish.com', 3, 403) === 135000, 'Attempt 3 on 403 should be 135,000ms');
});

test('1.3: RateLimiter exponential backoff for 5xx/network equals (1000ms * 2^(retryCount-1))', () => {
  const limiter = new RateLimiter();
  assert(limiter.getBackoffDelay('youtube.com', 1, 500) === 1000, 'Attempt 1 on 500 should be 1000ms');
  assert(limiter.getBackoffDelay('youtube.com', 2, 503) === 2000, 'Attempt 2 on 503 should be 2000ms');
  assert(limiter.getBackoffDelay('youtube.com', 3, 502) === 4000, 'Attempt 3 on 502 should be 4000ms');
});

test('1.4: Circuit breaker trips after threshold consecutive failures and trips circuit', () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 3, circuitCooldownMs: 1000 });
  const domain = 'test-domain.org';

  assert(!limiter.isCircuitOpen(domain), 'Circuit should initially be closed');

  limiter.recordFailure(domain, 429);
  assert(!limiter.isCircuitOpen(domain), 'Circuit should remain closed after 1 failure');

  limiter.recordFailure(domain, 429);
  assert(!limiter.isCircuitOpen(domain), 'Circuit should remain closed after 2 failures');

  limiter.recordFailure(domain, 429);
  assert(limiter.isCircuitOpen(domain), 'Circuit must trip open after 3 consecutive failures');

  // Success resets failures and closes circuit
  limiter.recordSuccess(domain);
  assert(!limiter.isCircuitOpen(domain), 'Record success must reset failure count and close circuit');
  assert(limiter.getFailureCount(domain) === 0, 'Failure count should be 0');
});

test('1.5: Throttle throws error when circuit breaker is open', async () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 2 });
  const domain = 'failing-domain.com';
  limiter.recordFailure(domain);
  limiter.recordFailure(domain);
  assert(limiter.isCircuitOpen(domain), 'Circuit should be open');

  let caught = false;
  try {
    await limiter.throttle(domain);
  } catch (err: unknown) {
    caught = true;
    assert((err as Error).message.includes('Circuit breaker is OPEN'), 'Error must mention circuit breaker');
  }
  assert(caught, 'throttle() must throw when circuit is open');
});

test('1.6: Circuit breaker auto-resets after cooldown period expires', async () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 1, circuitCooldownMs: 30 });
  const domain = 'cooldown-domain.com';
  limiter.recordFailure(domain);
  assert(limiter.isCircuitOpen(domain), 'Circuit should trip immediately');

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert(!limiter.isCircuitOpen(domain), 'Circuit should reset after 30ms cooldown');
});

// ── 2. User-Agent Pool & HTTP Client Tests ────────────────────────────────────

test('2.1: User-Agent pool contains multiple modern browser signatures and rotates', () => {
  assert(USER_AGENT_POOL.length >= 5, 'UA pool must contain at least 5 user agents');
  const client = new HttpClient();
  const firstUa = client.getNextUserAgent();
  const secondUa = client.getNextUserAgent();
  assert(typeof firstUa === 'string' && firstUa.includes('Mozilla'), 'UA 1 must be valid Mozilla string');
  assert(typeof secondUa === 'string' && secondUa.includes('Mozilla'), 'UA 2 must be valid Mozilla string');
  assert(firstUa !== secondUa, 'User-Agent rotation must cycle to next agent');
});

test('2.2: HttpClient extractDomain parses domain hostnames accurately', () => {
  const client = defaultHttpClient;
  assert(client.extractDomain('https://www.elllo.org/english/1501.htm') === 'www.elllo.org', 'Must extract www.elllo.org');
  assert(client.extractDomain('https://talkenglish.com/speaking/basics.aspx') === 'talkenglish.com', 'Must extract talkenglish.com');
  assert(client.extractDomain('https://www.youtube.com/watch?v=12345') === 'www.youtube.com', 'Must extract www.youtube.com');
  assert(client.extractDomain('invalid-url') === 'unknown-host', 'Must fallback to unknown-host on bad URL');
});

test('2.3: HttpClient offline mode blocks outgoing network calls cleanly', async () => {
  const client = new HttpClient();
  let caught = false;
  try {
    await client.request('https://www.google.com', {}, { offline: true });
  } catch (err: unknown) {
    caught = true;
    assert((err as Error).message.includes('Offline mode active'), 'Must block with offline mode active error');
  }
  assert(caught, 'Offline mode must block network requests');
});

// ── 3. Normalizer & SafeHarbor Core Keyword Tests ─────────────────────────────

test('3.1: extractCoreKeywords filters out standard English stopwords', () => {
  const sentence = 'I would like to order a warm cup of coffee with oat milk in the morning.';
  const keywords = extractCoreKeywords(sentence);

  assert(keywords.includes('coffee'), 'Must keep content word: coffee');
  assert(keywords.includes('order'), 'Must keep content word: order');
  assert(keywords.includes('warm'), 'Must keep content word: warm');
  assert(keywords.includes('milk'), 'Must keep content word: milk');
  assert(keywords.includes('morning'), 'Must keep content word: morning');

  assert(!keywords.includes('the'), 'Must filter stopword: the');
  assert(!keywords.includes('a'), 'Must filter stopword: a');
  assert(!keywords.includes('in'), 'Must filter stopword: in');
  assert(!keywords.includes('to'), 'Must filter stopword: to');
  assert(!keywords.includes('with'), 'Must filter stopword: with');
});

test('3.2: extractCoreKeywords properly expands contractions before filtering', () => {
  const sentence = "I'm trying to avoid mistakes and I can't finish it's too difficult.";
  const keywords = extractCoreKeywords(sentence);

  assert(keywords.includes('trying'), 'Must keep trying');
  assert(keywords.includes('avoid'), 'Must keep avoid');
  assert(keywords.includes('mistakes'), 'Must keep mistakes');
  assert(keywords.includes('finish'), 'Must keep finish');
  assert(keywords.includes('difficult'), 'Must keep difficult');
  assert(!keywords.includes("i'm"), "Must not include raw i'm token");
  assert(!keywords.includes("can't"), "Must not include raw can't token");
});

test('3.3: calculateQualityScore evaluates complete lesson >= 90', () => {
  const sample: Partial<StandardizedSpeakingLesson> = {
    id: 'elllo-a1-test',
    source: 'elllo',
    title: 'Morning Routine and Coffee',
    cefrLevel: 'A1',
    topic: 'Daily Routines',
    audioUrl: 'https://www.elllo.org/audio/sample.mp3',
    slowAudioUrl: 'https://www.elllo.org/audio/sample_slow.mp3',
    turns: [
      { speaker: 'Todd', textEn: 'Good morning!', textVi: 'Chào buổi sáng!', coreKeywords: ['morning'] },
      { speaker: 'Katia', textEn: 'Hello Todd!', textVi: 'Chào Todd!', coreKeywords: ['hello'] },
    ],
    vocabulary: [
      { term: 'wake up', ipa: '/weɪk ʌp/', meaningVi: 'thức giấc' },
      { term: 'coffee', ipa: '/ˈkɔːfi/', meaningVi: 'cà phê' },
    ],
    reflexPairs: [
      { promptEn: 'What do you drink?', responseEn: 'I drink coffee.', coreKeywords: ['drink', 'coffee'] },
    ],
  };

  const score = calculateQualityScore(sample);
  assert(score >= 90, `Complete lesson score should be >= 90, got: ${score}`);
});

test('3.4: calculateQualityScore penalizes placeholder text heavily', () => {
  const sampleWithPlaceholder: Partial<StandardizedSpeakingLesson> = {
    id: 'elllo-a1-placeholder',
    source: 'elllo',
    title: 'TODO: Add lesson title later',
    cefrLevel: 'A1',
    topic: 'Daily Routines',
    audioUrl: 'https://www.elllo.org/audio/sample.mp3',
    turns: [
      { speaker: 'A', textEn: 'lorem ipsum placeholder', textVi: 'placeholder', coreKeywords: [] },
      { speaker: 'B', textEn: 'lorem ipsum text', textVi: 'text', coreKeywords: [] },
    ],
    vocabulary: [{ term: 'TODO', meaningVi: 'placeholder' }],
    reflexPairs: [],
  };

  const score = calculateQualityScore(sampleWithPlaceholder);
  assert(score <= 50, `Lesson with placeholders should score <= 50, got: ${score}`);
  assert(hasPlaceholderText(JSON.stringify(sampleWithPlaceholder)), 'hasPlaceholderText must detect TODO');
});

test('3.5: normalizeLesson standardizes raw payloads into valid StandardizedSpeakingLesson', () => {
  const rawInput = {
    title: 'At the Coffee Counter',
    level: 'a2',
    topic: 'Ordering Drinks',
    audioUrl: 'https://audio.example.com/coffee.mp3',
    turns: [
      { speaker: 'Barista', textEn: 'What can I get for you today?', textVi: 'Tôi có thể lấy cho bạn món gì?' },
      { speaker: 'Customer', textEn: "I'd like a large cappuccino please.", textVi: 'Cho tôi một ly cappuccino lớn nhé.' },
    ],
    vocab: [
      { term: 'cappuccino', meaningVi: 'cà phê cappuccino', ipa: '/ˌkæpʊˈtʃiːnoʊ/' },
      { term: 'counter', meaningVi: 'quầy gọi món', ipa: '/ˈkaʊntər/' },
    ],
    reflexes: [
      { prompt: 'What size would you like?', response: 'A large please.', promptVi: 'Bạn muốn cỡ nào?', responseVi: 'Cỡ lớn làm ơn.' },
    ],
  };

  const normalized = normalizeLesson(rawInput, 'elllo');
  assert(isStandardizedSpeakingLesson(normalized), 'Normalized lesson must satisfy isStandardizedSpeakingLesson');
  assert(normalized.cefrLevel === 'A2', 'Level should be capitalized A2');
  assert(normalized.turns.length === 2, 'Turns length must be 2');
  assert(Boolean(normalized.turns[0].coreKeywords && normalized.turns[0].coreKeywords.length > 0), 'Turns must have auto-extracted coreKeywords');
  assert(normalized.qualityScore >= 80, `Quality score must be >= 80, got ${normalized.qualityScore}`);
});

// ── 4. High-Fidelity Seeds Determinism & Quality Tests ───────────────────────

test('4.1: elllo-seed.json is non-empty, 100% compliant, and contains 0 placeholders', () => {
  const seeds = loadEllloSeeds();
  assert(seeds.length >= 6, `ELLLO seeds count should be >= 6, got ${seeds.length}`);

  for (const lesson of seeds) {
    assert(isStandardizedSpeakingLesson(lesson), `Lesson ${lesson.id} must be valid StandardizedSpeakingLesson`);
    assert(lesson.source === 'elllo', `Source must be 'elllo' on ${lesson.id}`);
    assert(['A1', 'A2', 'B1', 'B2'].includes(lesson.cefrLevel), `CEFR level must be valid on ${lesson.id}`);
    assert(lesson.turns.length >= 2, `Turns must be >= 2 on ${lesson.id}`);
    assert(lesson.vocabulary.length >= 2, `Vocabulary must be >= 2 on ${lesson.id}`);
    assert(lesson.reflexPairs.length >= 1, `Reflex pairs must be >= 1 on ${lesson.id}`);
    assert(lesson.qualityScore >= 90, `Quality score must be >= 90 on ${lesson.id}`);

    const serialized = JSON.stringify(lesson);
    assert(!hasPlaceholderText(serialized), `Lesson ${lesson.id} must contain 0 placeholder words`);
  }
});

test('4.2: talkenglish-seed.json is non-empty, 100% compliant, and contains 0 placeholders', () => {
  const seeds = loadTalkEnglishSeeds();
  assert(seeds.length >= 4, `TalkEnglish seeds count should be >= 4, got ${seeds.length}`);

  for (const lesson of seeds) {
    assert(isStandardizedSpeakingLesson(lesson), `Lesson ${lesson.id} must be valid StandardizedSpeakingLesson`);
    assert(lesson.source === 'talkenglish', `Source must be 'talkenglish' on ${lesson.id}`);
    assert(lesson.turns.length >= 2, `Turns must be >= 2 on ${lesson.id}`);
    assert(lesson.vocabulary.length >= 2, `Vocabulary must be >= 2 on ${lesson.id}`);
    assert(lesson.reflexPairs.length >= 1, `Reflex pairs must be >= 1 on ${lesson.id}`);
    assert(lesson.qualityScore >= 90, `Quality score must be >= 90 on ${lesson.id}`);

    const serialized = JSON.stringify(lesson);
    assert(!hasPlaceholderText(serialized), `Lesson ${lesson.id} must contain 0 placeholder words`);
  }
});

test('4.3: youtube-seed.json contains timed transcripts, video metadata, and 0 placeholders', () => {
  const seeds = loadYouTubeSeeds();
  assert(seeds.length >= 3, `YouTube seeds count should be >= 3, got ${seeds.length}`);

  for (const lesson of seeds) {
    assert(isStandardizedSpeakingLesson(lesson), `Lesson ${lesson.id} must be valid StandardizedSpeakingLesson`);
    assert(lesson.source === 'youtube', `Source must be 'youtube' on ${lesson.id}`);
    assert(Boolean(lesson.rawMetadata?.youtubeVideoId), `Must have youtubeVideoId on ${lesson.id}`);
    assert(lesson.turns.length >= 2, `Turns must be >= 2 on ${lesson.id}`);

    // Verify timed transcripts have start and end times
    for (const turn of lesson.turns) {
      assert(typeof turn.startTime === 'number', `Turn on ${lesson.id} must have numeric startTime`);
      assert(typeof turn.endTime === 'number', `Turn on ${lesson.id} must have numeric endTime`);
      assert((turn.endTime ?? 0) >= (turn.startTime ?? 0), `endTime must be >= startTime on ${lesson.id}`);
    }

    assert(lesson.qualityScore >= 90, `Quality score must be >= 90 on ${lesson.id}`);
    const serialized = JSON.stringify(lesson);
    assert(!hasPlaceholderText(serialized), `Lesson ${lesson.id} must contain 0 placeholder words`);
  }
});

// ── 5. Production Ingested Catalogs & Lookup Helpers Tests ────────────────────

test('5.1: Ingested production catalogs exist and match expected lesson counts', () => {
  assert(Array.isArray(ellloCatalog) && ellloCatalog.length >= 6, 'ellloCatalog must have >= 6 lessons');
  assert(Array.isArray(talkenglishCatalog) && talkenglishCatalog.length >= 4, 'talkenglishCatalog must have >= 4 lessons');
  assert(Array.isArray(youtubeCatalog) && youtubeCatalog.length >= 3, 'youtubeCatalog must have >= 3 lessons');
  assert(allIngestedLessons.length === ellloCatalog.length + talkenglishCatalog.length + youtubeCatalog.length, 'allIngestedLessons must equal sum of all catalogs');
});

test('5.2: getLessonById accurately retrieves lessons or returns undefined', () => {
  const firstElllo = ellloCatalog[0];
  assert(Boolean(firstElllo), 'firstElllo should exist');

  const found = getLessonById(firstElllo.id);
  assert(found !== undefined, `Must find lesson by ID "${firstElllo.id}"`);
  assert(found?.id === firstElllo.id, 'IDs must match');

  const nonExistent = getLessonById('non-existent-lesson-id-999');
  assert(nonExistent === undefined, 'Non-existent lesson should return undefined');
});

test('5.3: getLessonsBySource filters catalogs accurately', () => {
  const ellloOnly = getLessonsBySource('elllo');
  assert(ellloOnly.length === ellloCatalog.length, 'ellloOnly length must match ellloCatalog');
  assert(ellloOnly.every((l) => l.source === 'elllo'), 'All items must have source === elllo');

  const talkEnglishOnly = getLessonsBySource('talkenglish');
  assert(talkEnglishOnly.length === talkenglishCatalog.length, 'talkEnglishOnly length must match');
  assert(talkEnglishOnly.every((l) => l.source === 'talkenglish'), 'All items must have source === talkenglish');

  const youtubeOnly = getLessonsBySource('youtube');
  assert(youtubeOnly.length === youtubeCatalog.length, 'youtubeOnly length must match');
  assert(youtubeOnly.every((l) => l.source === 'youtube'), 'All items must have source === youtube');
});

test('5.4: getLessonsByLevel partitions lessons across CEFR levels A1, A2, B1, B2', () => {
  const a1 = getLessonsByLevel('A1');
  const a2 = getLessonsByLevel('A2');
  const b1 = getLessonsByLevel('B1');
  const b2 = getLessonsByLevel('B2');

  assert(a1.length > 0, 'A1 lessons must be > 0');
  assert(a2.length > 0, 'A2 lessons must be > 0');
  assert(b1.length > 0, 'B1 lessons must be > 0');
  assert(b2.length > 0, 'B2 lessons must be > 0');
  assert(a1.every((l) => l.cefrLevel === 'A1'), 'All A1 items must have cefrLevel A1');
});

test('5.5: getLessonsByTopic searches topics and titles case-insensitively', () => {
  const coffeeLessons = getLessonsByTopic('coffee');
  assert(coffeeLessons.length > 0, 'Must find lessons mentioning coffee');

  const businessLessons = getLessonsByTopic('business');
  assert(businessLessons.length > 0, 'Must find lessons mentioning business');
});

test('5.6: getIngestedCatalogStats aggregates totals, level distribution, and quality score', () => {
  const stats = getIngestedCatalogStats();
  assert(stats.total === allIngestedLessons.length, 'stats.total must equal allIngestedLessons.length');
  assert(stats.elllo === ellloCatalog.length, 'stats.elllo must equal ellloCatalog.length');
  assert(stats.talkenglish === talkenglishCatalog.length, 'stats.talkenglish must equal talkenglishCatalog.length');
  assert(stats.youtube === youtubeCatalog.length, 'stats.youtube must equal youtubeCatalog.length');
  assert(stats.averageQualityScore >= 90, `Average quality score must be >= 90, got ${stats.averageQualityScore}`);
  assert(stats.byLevel.A1 > 0, 'A1 count must be > 0');
  assert(stats.byLevel.A2 > 0, 'A2 count must be > 0');
  assert(stats.byLevel.B1 > 0, 'B1 count must be > 0');
  assert(stats.byLevel.B2 > 0, 'B2 count must be > 0');
});

// ── 6. Crawlers Offline Determinism Tests ─────────────────────────────────────

test('6.1: crawlElllo in offline mode returns normalized lessons and respects filters', async () => {
  const allLessons = await crawlElllo({ offline: true });
  assert(allLessons.length >= 6, 'crawlElllo offline should return >= 6 lessons');

  const a1Only = await crawlElllo({ offline: true, level: 'A1' });
  assert(a1Only.length > 0 && a1Only.every((l) => l.cefrLevel === 'A1'), 'Must filter by level A1');

  const limited = await crawlElllo({ offline: true, limit: 2 });
  assert(limited.length === 2, 'Limit 2 must return exactly 2 lessons');
});

test('6.2: crawlTalkEnglish in offline mode returns normalized lessons and respects limits', async () => {
  const allLessons = await crawlTalkEnglish({ offline: true });
  assert(allLessons.length >= 4, 'crawlTalkEnglish offline should return >= 4 lessons');

  const limited = await crawlTalkEnglish({ offline: true, limit: 1 });
  assert(limited.length === 1, 'Limit 1 must return exactly 1 lesson');
});

test('6.3: crawlYouTube in offline mode returns normalized lessons and respects videoId filtering', async () => {
  const allLessons = await crawlYouTube({ offline: true });
  assert(allLessons.length >= 3, 'crawlYouTube offline should return >= 3 lessons');

  const filtered = await crawlYouTube({ offline: true, videoIds: ['dJ4kPGdUShQ'] });
  assert(filtered.length === 1, 'Filtering by video ID should return 1 lesson');
  assert(filtered[0].rawMetadata?.youtubeVideoId === 'dJ4kPGdUShQ', 'Video ID must match requested filter');
});

test('6.4: parseTimedTextXml parses XML caption timestamps and text cues accurately', () => {
  const sampleXml = `
    <transcript>
      <text start="1.5" dur="3.0">Hello and welcome to Rachel&#39;s English.</text>
      <text start="4.5" dur="2.5">Today we learn the TH sound.</text>
    </transcript>
  `;

  const cues = parseTimedTextXml(sampleXml);
  assert(cues.length === 2, 'Must parse exactly 2 cues');
  assert(cues[0].start === 1.5, 'Cue 1 start must be 1.5');
  assert(cues[0].duration === 3.0, 'Cue 1 duration must be 3.0');
  assert(cues[0].text.includes("Rachel's English"), 'Cue 1 text must decode entity and contain text');
  assert(cues[1].start === 4.5, 'Cue 2 start must be 4.5');
});

// ── Runner ───────────────────────────────────────────────────────────────────

export async function runCrawlingPipelineTestSuite() {
  console.log('================================================================================');
  console.log('  SPEAKING INGESTION & CRAWLING PIPELINE TEST SUITE (M2)');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;
  const start = Date.now();

  for (const t of tests) {
    process.stdout.write(`▶ ${t.name}... `);
    try {
      await t.fn();
      console.log('PASS');
      passed++;
    } catch (err: unknown) {
      console.log('FAIL');
      console.error(`  Error: ${(err as Error).message}`);
      failed++;
    }
  }

  const duration = Date.now() - start;
  console.log('\n================================================================================');
  console.log(`  RESULTS: ${passed}/${tests.length} passed, ${failed} failed (${duration}ms)`);
  console.log('================================================================================');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in crawling pipeline test suite.`);
  }

  return { passed, failed, total: tests.length, duration };
}

if (require.main === module) {
  runCrawlingPipelineTestSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
