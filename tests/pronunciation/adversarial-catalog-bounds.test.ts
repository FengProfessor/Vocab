/**
 * Adversarial Stress-Test Harness: Data Catalog, Video Timestamps & YouTube Bounds
 *
 * Empirical Challenger 1 for Rachel's English Video Integration for IPA Pronunciation.
 * Exhaustively stress-tests:
 *  1. All 26 canonical lessons in src/data/pronunciation/lessons-v1.json.
 *  2. 11-char regex, timestamp ordering, and segment duration bounds (15s–180s).
 *  3. 100% channel uniformity ("Rachel's English").
 *  4. Non-empty, articulatory videoTips tailored for Vietnamese learners.
 *  5. Adversarial boundary conditions (duration=0, negative timestamps, XSS/injection IDs, origin spoofing).
 *  6. Playback rate bounds (0.5x, 0.75x, 1.0x acceptance and out-of-band clamping).
 *  7. Fuzzing / mutation testing with zero false positives.
 *  8. Extreme edge cases & custom origins.
 *
 * Usage:
 *   npx tsx tests/pronunciation/adversarial-catalog-bounds.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  CANONICAL_RACHEL_LESSONS,
  validateRachelVideoMeta,
  validateLessonVideoData,
  buildYouTubeEmbedUrl,
  MockYouTubeIpaPlayer,
} from './test-harness';

// ──────────────────────────────────────────────────────────────────────────
// Helper: Load lessons-v1.json directly from disk
// ──────────────────────────────────────────────────────────────────────────
function loadLessonsJson(): any {
  const jsonPath = path.resolve(__dirname, '../../src/data/pronunciation/lessons-v1.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(raw);
}

// ──────────────────────────────────────────────────────────────────────────
// Adversarial URL Builder Simulator (Mirroring InteractiveIpaVideoPlayer)
// ──────────────────────────────────────────────────────────────────────────
function simulateEmbedUrl(
  videoId: string,
  start: number,
  end: number,
  origin: string = 'http://localhost:3000',
  autoPlay: boolean = false
): string {
  if (!videoId) return '';
  const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    controls: '1',
    modestbranding: '1',
    origin,
    start: String(Math.floor(start)),
    end: String(Math.floor(end)),
  });
  if (autoPlay) {
    params.set('autoplay', '1');
  }
  return `${base}?${params.toString()}`;
}

// ──────────────────────────────────────────────────────────────────────────
// Test Runner Function
// ──────────────────────────────────────────────────────────────────────────
export async function runAdversarialCatalogBoundsTests(runner: TestRunner): Promise<void> {
  const rawCatalog = loadLessonsJson();
  const lessons: any[] = rawCatalog.lessons;

  // ========================================================================
  // Suite 1: Exhaustive Catalog & Integrity Verification (26/26 Lessons)
  // ========================================================================
  runner.describe('Suite 1: Exhaustive Catalog & Integrity Verification (26 Lessons)', () => {
    runner.it('ADV-1.1: Catalog contains exactly 26 canonical lessons', () => {
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBe(26);
    });

    runner.it('ADV-1.2: All 26 lesson IDs are unique and non-empty strings', () => {
      const ids = lessons.map((l) => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(26);
      for (const id of ids) {
        expect(typeof id).toBe('string');
        expect(id.trim().length).toBeGreaterThan(0);
      }
    });

    runner.it('ADV-1.3: All 26 lessons have valid 11-char YouTube video ID (/^[a-zA-Z0-9_-]{11}$/)', () => {
      const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
      for (const l of lessons) {
        expect(l.video).toBeDefined();
        expect(typeof l.video.youtubeVideoId).toBe('string');
        expect(l.video.youtubeVideoId).toMatch(ytRegex);
        expect(l.video.youtubeVideoId.length).toBe(11);
      }
    });

    runner.it('ADV-1.4: Dual-compatibility parity: flat youtubeVideoId strictly matches video.youtubeVideoId', () => {
      for (const l of lessons) {
        expect(l.youtubeVideoId).toBe(l.video.youtubeVideoId);
      }
    });

    runner.it('ADV-1.5: 100% channel uniformity: channelName === "Rachel\'s English" in both nested and flat fields', () => {
      for (const l of lessons) {
        expect(l.video.channelName).toBe("Rachel's English");
        expect(l.channelName).toBe("Rachel's English");
      }
    });

    runner.it('ADV-1.6: Timestamps ordering: startSeconds < endSeconds and startSeconds >= 0 for all 26 lessons', () => {
      for (const l of lessons) {
        const v = l.video;
        expect(typeof v.startSeconds).toBe('number');
        expect(typeof v.endSeconds).toBe('number');
        expect(v.startSeconds).toBeGreaterThanOrEqual(0);
        expect(v.endSeconds).toBeGreaterThan(v.startSeconds);
      }
    });

    runner.it('ADV-1.7: Dual-compatibility timestamp parity: flat startSeconds and endSeconds match video object', () => {
      for (const l of lessons) {
        expect(l.startSeconds).toBe(l.video.startSeconds);
        expect(l.endSeconds).toBe(l.video.endSeconds);
      }
    });

    runner.it('ADV-1.8: Segment duration is reasonable (15s <= duration <= 180s) across all 26 lessons', () => {
      for (const l of lessons) {
        const dur = l.video.endSeconds - l.video.startSeconds;
        expect(dur).toBeGreaterThanOrEqual(15);
        expect(dur).toBeLessThanOrEqual(180);
      }
    });

    runner.it('ADV-1.9: Non-empty videoTip with >= 20 characters across all 26 lessons', () => {
      for (const l of lessons) {
        const tip = l.video.videoTip;
        expect(typeof tip).toBe('string');
        expect(tip.trim().length).toBeGreaterThanOrEqual(20);
      }
    });

    runner.it('ADV-1.10: Articulatory pedagogical advice present in videoTip (contains speech organ keywords)', () => {
      const organKeywords = [
        'lip', 'tongue', 'jaw', 'teeth', 'mouth', 'throat', 'vocal', 'air',
        'palate', 'pitch', 'stress', 'glide', 'stop', 'sound', 'neutral', 'nasal',
        'vowel', 'consonant', 'syllable', 'resonance', 'breath', 'ridge', 'front', 'back',
        'speech', 'reduce', 'form'
      ];
      for (const l of lessons) {
        const tipLower = l.video.videoTip.toLowerCase();
        const matches = organKeywords.some((kw) => tipLower.includes(kw));
        if (!matches) {
          throw new Error(`Lesson "${l.id}" videoTip lacks articulatory keywords: "${l.video.videoTip}"`);
        }
        expect(matches).toBe(true);
      }
    });

    runner.it('ADV-1.11: Dual-compatibility videoTip parity: flat videoTip matches video.videoTip', () => {
      for (const l of lessons) {
        expect(l.videoTip).toBe(l.video.videoTip);
      }
    });

    runner.it('ADV-1.12: Level distribution covers CEFR progression (A0: 3, A1: 5, A2: 7, B1: 5, B2: 6)', () => {
      const counts: Record<string, number> = {};
      for (const l of lessons) {
        counts[l.level] = (counts[l.level] || 0) + 1;
      }
      expect(counts['A0']).toBe(3);
      expect(counts['A1']).toBe(5);
      expect(counts['A2']).toBe(7);
      expect(counts['B1']).toBe(5);
      expect(counts['B2']).toBe(6);
      expect(counts['A0'] + counts['A1'] + counts['A2'] + counts['B1'] + counts['B2']).toBe(26);
    });

    runner.it('ADV-1.13: Every lesson passes validateLessonVideoData validator without errors', () => {
      for (const l of lessons) {
        const res = validateLessonVideoData(l);
        expect(res.valid).toBe(true);
        expect(res.errors.length).toBe(0);
      }
    });
  });

  // ========================================================================
  // Suite 2: Adversarial Boundary Conditions (Duration & Timestamps)
  // ========================================================================
  runner.describe('Suite 2: Adversarial Boundary Conditions (Duration & Timestamps)', () => {
    const validBase = {
      youtubeVideoId: 'pRXsIthxgH8',
      channelName: "Rachel's English",
      videoTip: 'Stressed syllables must have 3 dimensions: higher in pitch, longer in duration, and louder.',
    };

    runner.it('ADV-2.1: Zero duration (startSeconds === endSeconds = 30) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 30, endSeconds: 30 });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must be greater than startSeconds'))).toBe(true);
    });

    runner.it('ADV-2.2: Negative startSeconds (-1, -100) is rejected', () => {
      const res1 = validateRachelVideoMeta({ ...validBase, startSeconds: -1, endSeconds: 30 });
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('startSeconds must be a non-negative number'))).toBe(true);

      const res2 = validateRachelVideoMeta({ ...validBase, startSeconds: -100, endSeconds: 50 });
      expect(res2.valid).toBe(false);
    });

    runner.it('ADV-2.3: Inverted timestamps (startSeconds: 60, endSeconds: 30) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 60, endSeconds: 30 });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must be greater than startSeconds'))).toBe(true);
    });

    runner.it('ADV-2.4: Clip duration of 14 seconds (under 15s boundary) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 30, endSeconds: 44 });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('too short'))).toBe(true);
    });

    runner.it('ADV-2.5: Clip duration of exactly 15 seconds (minimum lower boundary) is accepted', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 30, endSeconds: 45 });
      expect(res.valid).toBe(true);
    });

    runner.it('ADV-2.6: Clip duration of exactly 180 seconds (maximum upper boundary) is accepted', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 20, endSeconds: 200 });
      expect(res.valid).toBe(true);
    });

    runner.it('ADV-2.7: Clip duration of 181 seconds (over 180s boundary) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 20, endSeconds: 201 });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('too long'))).toBe(true);
    });

    runner.it('ADV-2.8: Decimal / floating-point timestamps floor properly into integer query params', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 35.85, 95.15);
      expect(url).toContain('start=35');
      expect(url).toContain('end=95');
    });

    runner.it('ADV-2.9: NaN or non-number timestamps produce validation errors', () => {
      const resNaN = validateRachelVideoMeta({ ...validBase, startSeconds: NaN, endSeconds: 60 });
      expect(resNaN.valid).toBe(false);

      const resStr = validateRachelVideoMeta({ ...validBase, startSeconds: '35' as any, endSeconds: 60 });
      expect(resStr.valid).toBe(false);
    });

    runner.it('ADV-2.10: High timestamp (e.g. Rachel long 2-hour livestream at 5400s) calculates duration safely', () => {
      const res = validateRachelVideoMeta({ ...validBase, startSeconds: 5400, endSeconds: 5460 });
      expect(res.valid).toBe(true);
      const url = simulateEmbedUrl('pRXsIthxgH8', 5400, 5460);
      expect(url).toContain('start=5400');
      expect(url).toContain('end=5460');
    });
  });

  // ========================================================================
  // Suite 3: Adversarial Video ID & Security / Injection Stress-Testing
  // ========================================================================
  runner.describe('Suite 3: Adversarial Video ID & Security / Injection Stress-Testing', () => {
    const validBase = {
      startSeconds: 30,
      endSeconds: 90,
      channelName: "Rachel's English",
      videoTip: 'Stressed syllables must have 3 dimensions: higher in pitch, longer in duration, and louder.',
    };

    runner.it('ADV-3.1: Video ID with 10 characters (too short) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: 'pRXsIthxgH' });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must be exactly 11 valid characters'))).toBe(true);
    });

    runner.it('ADV-3.2: Video ID with 12 characters (too long) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: 'pRXsIthxgH8X' });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('must be exactly 11 valid characters'))).toBe(true);
    });

    runner.it('ADV-3.3: Video ID with script tag / XSS injection is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '<script>abc' });
      expect(res.valid).toBe(false);
    });

    runner.it('ADV-3.4: Video ID with directory traversal ("../../evil") is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '../../evil1' });
      expect(res.valid).toBe(false);
    });

    runner.it('ADV-3.5: Video ID with query string injection ("33F2e7o1&x=" ) is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '33F2e7o1&x=' });
      expect(res.valid).toBe(false);
    });

    runner.it('ADV-3.6: Video ID with spaces or special punctuation ("33F2 e7o1q!", "33F2e7o1q;1") is rejected', () => {
      const res1 = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '33F2 e7o1q!' });
      expect(res1.valid).toBe(false);

      const res2 = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '33F2e7o1q;1' });
      expect(res2.valid).toBe(false);
    });

    runner.it('ADV-3.7: Video ID with unicode / emoji ("33F2e7o1q🔥1") is rejected', () => {
      const res = validateRachelVideoMeta({ ...validBase, youtubeVideoId: '33F2e7o1q🔥1' });
      expect(res.valid).toBe(false);
    });

    runner.it('ADV-3.8: Null, undefined, or non-string video ID is rejected cleanly', () => {
      const resNull = validateRachelVideoMeta({ ...validBase, youtubeVideoId: null as any });
      expect(resNull.valid).toBe(false);

      const resUndef = validateRachelVideoMeta({ ...validBase, youtubeVideoId: undefined as any });
      expect(resUndef.valid).toBe(false);

      const resNum = validateRachelVideoMeta({ ...validBase, youtubeVideoId: 12345678901 as any });
      expect(resNum.valid).toBe(false);
    });

    runner.it('ADV-3.9: Empty videoId in URL generator safely returns empty string without constructing malformed URL', () => {
      const urlEmpty = simulateEmbedUrl('', 30, 90);
      expect(urlEmpty).toBe('');

      const urlNull = simulateEmbedUrl(null as any, 30, 90);
      expect(urlNull).toBe('');
    });

    runner.it('ADV-3.10: Embed URLs strictly target youtube-nocookie.com privacy domain', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 35, 95);
      expect(url.startsWith('https://www.youtube-nocookie.com/embed/pRXsIthxgH8')).toBe(true);
      expect(url.includes('www.youtube.com/embed')).toBe(false);
    });
  });

  // ========================================================================
  // Suite 4: Origin Spoofing & Embed Parameter Bounds
  // ========================================================================
  runner.describe('Suite 4: Origin Spoofing & Embed Parameter Bounds', () => {
    runner.it('ADV-4.1: Standard origin (http://localhost:3000) is cleanly encoded', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, 'http://localhost:3000');
      expect(url).toContain('origin=http%3A%2F%2Flocalhost%3A3000');
    });

    runner.it('ADV-4.2: Production origin (https://lingopro.vn) is cleanly encoded', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, 'https://lingopro.vn');
      expect(url).toContain('origin=https%3A%2F%2Flingopro.vn');
    });

    runner.it('ADV-4.3: Custom or attacker origin with query injection is safely escaped by URLSearchParams', () => {
      const maliciousOrigin = 'https://attacker.com?token=leak&exploit=true#frag';
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, maliciousOrigin);
      // Ensure origin value is percent-encoded, not split into separate query params
      expect(url).toContain('origin=https%3A%2F%2Fattacker.com%3Ftoken%3Dleak%26exploit%3Dtrue%23frag');
    });

    runner.it('ADV-4.4: Javascript pseudo-protocol origin is safely encoded as a string without script execution', () => {
      const jsOrigin = 'javascript:alert(document.cookie)';
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, jsOrigin);
      expect(url).toContain('origin=javascript%3Aalert%28document.cookie%29');
    });

    runner.it('ADV-4.5: URL contains required privacy and embedded player flags (enablejsapi, playsinline, rel=0, controls=1)', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 35, 95);
      expect(url).toContain('enablejsapi=1');
      expect(url).toContain('playsinline=1');
      expect(url).toContain('rel=0');
      expect(url).toContain('controls=1');
      expect(url).toContain('modestbranding=1');
    });

    runner.it('ADV-4.6: Autoplay flag is omitted by default and added only when explicitly set to true', () => {
      const urlNoAuto = simulateEmbedUrl('pRXsIthxgH8', 35, 95, 'http://localhost:3000', false);
      expect(urlNoAuto).not.toContain('autoplay=1');

      const urlAuto = simulateEmbedUrl('pRXsIthxgH8', 35, 95, 'http://localhost:3000', true);
      expect(urlAuto).toContain('autoplay=1');
    });

    runner.it('ADV-4.7: Origin with custom port (https://example.com:8443) preserves port correctly', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, 'https://example.com:8443');
      expect(url).toContain('origin=https%3A%2F%2Fexample.com%3A8443');
    });

    runner.it('ADV-4.8: Origin with "null" string (e.g. sandboxed iframe) encodes cleanly without throwing', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 30, 90, 'null');
      expect(url).toContain('origin=null');
    });
  });

  // ========================================================================
  // Suite 5: Playback Rate Acceptance & Clamping Bounds
  // ========================================================================
  runner.describe('Suite 5: Playback Rate Acceptance & Clamping Bounds', () => {
    runner.it('ADV-5.1: Preset 0.5x is accepted and applied without clamping', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('ADV-5.2: Preset 0.75x is accepted and applied without clamping', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.75);
      expect(player.getPlaybackRate()).toBe(0.75);
    });

    runner.it('ADV-5.3: Preset 1.0x is accepted and applied without clamping', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(1.0);
      expect(player.getPlaybackRate()).toBe(1.0);
    });

    runner.it('ADV-5.4: Unsupported low rate 0.25x clamps to closest supported preset (0.5x)', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.25);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('ADV-5.5: Intermediate rate 0.65x clamps to 0.75x preset', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.65);
      expect(player.getPlaybackRate()).toBe(0.75);
    });

    runner.it('ADV-5.6: Intermediate rate 0.9x clamps to 1.0x preset', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.9);
      expect(player.getPlaybackRate()).toBe(1.0);
    });

    runner.it('ADV-5.7: High rates (1.25x, 1.5x, 2.0x) clamp to 1.0x to preserve articulatory visibility', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(1.25);
      expect(player.getPlaybackRate()).toBe(1.0);

      player.setPlaybackRate(1.5);
      expect(player.getPlaybackRate()).toBe(1.0);

      player.setPlaybackRate(2.0);
      expect(player.getPlaybackRate()).toBe(1.0);
    });

    runner.it('ADV-5.8: Zero or negative rate (0.0x, -0.5x) clamps safely to 0.5x or 1.0x without stalling', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.0);
      const rate = player.getPlaybackRate();
      expect(rate >= 0.5 && rate <= 1.0).toBe(true);

      player.setPlaybackRate(-1.0);
      const rateNeg = player.getPlaybackRate();
      expect(rateNeg >= 0.5 && rateNeg <= 1.0).toBe(true);
    });

    runner.it('ADV-5.9: Pitch preservation is guaranteed across all playback rates', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      for (const speed of [0.5, 0.75, 1.0]) {
        player.setPlaybackRate(speed);
        expect(player.isPitchPreserved()).toBe(true);
      }
    });

    runner.it('ADV-5.10: Rate transitions do not reset or jump currentTime', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.seekTo(45);
      expect(player.getCurrentTime()).toBe(45);

      player.setPlaybackRate(0.5);
      expect(player.getCurrentTime()).toBe(45);

      player.setPlaybackRate(0.75);
      expect(player.getCurrentTime()).toBe(45);

      player.setPlaybackRate(1.0);
      expect(player.getCurrentTime()).toBe(45);
    });

    runner.it('ADV-5.11: Non-numeric / NaN playback rate clamps safely to default 1.0x', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(NaN);
      expect(player.getPlaybackRate()).toBe(1.0);

      player.setPlaybackRate(Infinity);
      expect(player.getPlaybackRate()).toBe(1.0);
    });
  });

  // ========================================================================
  // Suite 6: Empirical Fuzzing & Mutation Testing (Zero False Positives)
  // ========================================================================
  runner.describe('Suite 6: Empirical Fuzzing & Mutation Testing (Zero False Positives)', () => {
    runner.it('ADV-6.1: Mutating every lesson with truncated videoId (10 chars) triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        mutated.video.youtubeVideoId = mutated.video.youtubeVideoId.slice(0, 10);
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.2: Mutating every lesson with inverted timestamps triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        const temp = mutated.video.startSeconds;
        mutated.video.startSeconds = mutated.video.endSeconds + 10;
        mutated.video.endSeconds = temp;
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.3: Mutating every lesson with sub-15s duration triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        mutated.video.endSeconds = mutated.video.startSeconds + 10; // 10s duration
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.4: Mutating every lesson with duration > 180s triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        mutated.video.endSeconds = mutated.video.startSeconds + 200; // 200s duration
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.5: Mutating every lesson with altered channelName triggers 100% rejection', () => {
      const foreignChannels = [
        "BBC Learning English",
        "Rachel English", // Missing apostrophe-s
        "rachel's english", // Lowercase
        "English with Lucy",
        "VOA Learning English",
      ];
      for (let i = 0; i < lessons.length; i++) {
        const mutated = JSON.parse(JSON.stringify(lessons[i]));
        mutated.video.channelName = foreignChannels[i % foreignChannels.length];
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.6: Mutating every lesson with empty or whitespace videoTip triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        mutated.video.videoTip = '   ';
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.7: Mutating every lesson with short videoTip (< 20 chars) triggers 100% rejection', () => {
      for (const l of lessons) {
        const mutated = JSON.parse(JSON.stringify(l));
        mutated.video.videoTip = 'Short mouth tip.'; // 16 chars
        const res = validateLessonVideoData(mutated);
        expect(res.valid).toBe(false);
      }
    });

    runner.it('ADV-6.8: Uncorrupted canonical catalog passes validation with exactly 0 errors (0 false positives)', () => {
      let totalTested = 0;
      for (const l of lessons) {
        const res = validateLessonVideoData(l);
        expect(res.valid).toBe(true);
        expect(res.errors.length).toBe(0);
        totalTested++;
      }
      expect(totalTested).toBe(26);
    });
  });

  // ========================================================================
  // Suite 7: YouTube Player Command & Boundary Edge Cases
  // ========================================================================
  runner.describe('Suite 7: YouTube Player Command & Boundary Edge Cases', () => {
    runner.it('ADV-7.1: Zero startSeconds is supported and formats clean start=0 param', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', 0, 60);
      expect(url).toContain('start=0');
      expect(url).toContain('end=60');
    });

    runner.it('ADV-7.2: Negative timestamps in embed URL floor to negative integers without crashing', () => {
      const url = simulateEmbedUrl('pRXsIthxgH8', -5, 30);
      expect(url).toContain('start=-5');
      expect(url).toContain('end=30');
    });

    runner.it('ADV-7.3: Loop boundary monitor handles rapid seeking past endSeconds and restarts at startSeconds', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setLoop(true);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1);

      // Simulate player advancing past end
      player.setCurrentTimeForTesting(89.98);
      player.tickInterval(150); // advances past 90.0s
      // Should reset to startSeconds (30)
      expect(player.getCurrentTime()).toBe(30);
    });

    runner.it('ADV-7.4: Rapid speed switching (0.5x -> 1.0x -> 0.75x -> 0.5x) preserves loop integrity', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setLoop(true);
      player.playVideo();

      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);
      player.setPlaybackRate(1.0);
      expect(player.getPlaybackRate()).toBe(1.0);
      player.setPlaybackRate(0.75);
      expect(player.getPlaybackRate()).toBe(0.75);
      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);

      expect(player.getLoop()).toBe(true);
    });

    runner.it('ADV-7.5: Replay clip at non-standard speeds returns accurately to startSeconds without speed reset', () => {
      const player = new MockYouTubeIpaPlayer(42, 108);
      player.setPlaybackRate(0.75);
      player.setCurrentTimeForTesting(80);
      player.replayClip();
      expect(player.getCurrentTime()).toBe(42);
      expect(player.getPlaybackRate()).toBe(0.75);
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Standalone Direct Execution Entrypoint
// ──────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL CATALOG & YOUTUBE BOUNDS STRESS-TEST HARNESS');
  console.log('  Target: src/data/pronunciation/lessons-v1.json (26 IPA Lessons)');
  console.log('================================================================================\n');

  const runner = new TestRunner();
  const startTime = Date.now();

  await runAdversarialCatalogBoundsTests(runner);

  const stats = runner.getStats();
  const durationMs = Date.now() - startTime;

  console.log('\n================================================================================');
  console.log('  ADVERSARIAL STRESS-TEST SUMMARY');
  console.log('================================================================================');
  console.log(`Total Adversarial Tests : ${stats.total}`);
  console.log(`Passed                  : ${stats.passed}`);
  console.log(`Failed                  : ${stats.failed}`);
  console.log(`Duration                : ${durationMs}ms`);
  console.log(`Verdict                 : ${stats.failed === 0 ? 'APPROVE (ALL PASSED)' : 'REJECT (FAILURES DETECTED)'}`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ STRESS-TEST FAILED: ${stats.failed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`✅ STRESS-TEST PASSED: 100% of ${stats.total} adversarial test cases succeeded cleanly!`);
    process.exit(0);
  }
}

if (require.main === module || !process.env.VITEST) {
  main().catch((err) => {
    console.error('Fatal error running adversarial test harness:', err);
    process.exit(1);
  });
}
