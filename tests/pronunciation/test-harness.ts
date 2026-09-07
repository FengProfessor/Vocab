/**
 * E2E & Integration Test Harness for Rachel's English Video Integration for IPA Pronunciation.
 * Self-contained, zero-external-dependency test runner, YouTube player simulator,
 * CSP validator, audio coordination emulator, and canonical 26-lesson catalog oracle.
 */

import fs from 'node:fs';
import path from 'node:path';

// ──────────────────────────────────────────────────────────────────────────
// Test Runner & Assertion Interfaces
// ──────────────────────────────────────────────────────────────────────────

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteStats {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export class TestRunner {
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];

  describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    fn();
  }

  beforeEach(fn: () => Promise<void> | void) {
    this.beforeHooks.push(fn);
  }

  afterEach(fn: () => Promise<void> | void) {
    this.afterHooks.push(fn);
  }

  async it(name: string, fn: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    for (const hook of this.beforeHooks) {
      await hook();
    }

    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        durationMs,
      });
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        durationMs,
        error,
      });
      console.error(`  [FAIL] ${name} (${durationMs}ms) -> ${error.message}`);
    } finally {
      for (const hook of this.afterHooks) {
        await hook();
      }
    }
  }

  getStats(): SuiteStats {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      suiteName: this.currentSuite,
      total,
      passed,
      failed,
      durationMs,
      results: this.results,
    };
  }

  clear() {
    this.results = [];
    this.beforeHooks = [];
    this.afterHooks = [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Assertion Matchers
// ──────────────────────────────────────────────────────────────────────────

export function expect<T>(actual: T) {
  const matchers = (negate: boolean) => ({
    toBe(expected: unknown) {
      const pass = actual === expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: unknown) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toContain(item: unknown) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        pass = actual.includes(item);
      }
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`,
        );
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex.toString()}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = typeof actual === 'number' && actual > expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be greater than' : 'to be greater than'} ${expected}`,
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`,
        );
      }
    },
    toBeLessThan(expected: number) {
      const pass = typeof actual === 'number' && actual < expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be less than' : 'to be less than'} ${expected}`,
        );
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual <= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be <=' : 'to be <='} ${expected}`,
        );
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be null' : 'to be null'}`,
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(expected?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function to test toThrow');
      }
      let threw = false;
      let errorMsg = '';
      try {
        (actual as Function)();
      } catch (e) {
        threw = true;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
      if (negate ? threw : !threw) {
        throw new Error(
          negate
            ? 'Expected function not to throw, but it threw an error'
            : 'Expected function to throw an error, but it did not throw',
        );
      }
      if (!negate && expected) {
        if (typeof expected === 'string') {
          if (!errorMsg.includes(expected)) {
            throw new Error(
              `Expected error message to include "${expected}", but got: "${errorMsg}"`,
            );
          }
        } else if (!expected.test(errorMsg)) {
          throw new Error(
            `Expected error message to match ${expected}, but got: "${errorMsg}"`,
          );
        }
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

export async function assertRejects(
  fn: () => Promise<unknown> | unknown,
  expectedPattern?: RegExp | string,
): Promise<void> {
  let threw = false;
  let thrownError: unknown = null;
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }

  if (!threw) {
    throw new Error('Expected function to throw an error, but it succeeded.');
  }

  if (expectedPattern && thrownError) {
    const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
    if (typeof expectedPattern === 'string') {
      if (!msg.includes(expectedPattern)) {
        throw new Error(
          `Expected error message to include "${expectedPattern}", but got: "${msg}"`,
        );
      }
    } else if (!expectedPattern.test(msg)) {
      throw new Error(
        `Expected error message to match ${expectedPattern}, but got: "${msg}"`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Browser Mock Environment
// ──────────────────────────────────────────────────────────────────────────

let originalWindow: unknown;

export function setupMockBrowserEnvironment(): void {
  originalWindow = (global as any).window;
  (global as any).window = {
    location: {
      origin: 'http://localhost:3000',
    },
  };
}

export function teardownMockBrowserEnvironment(): void {
  if (originalWindow !== undefined) {
    (global as any).window = originalWindow;
  } else {
    delete (global as any).window;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Domain Interfaces (PROJECT.md Interface Contracts)
// ──────────────────────────────────────────────────────────────────────────

export interface RachelVideoMeta {
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  channelName: "Rachel's English";
  videoTip: string;
  clipTitle?: string;
  mouthTipSummary?: string;
}

export interface MinimalPairItem {
  a: string;
  b: string;
  note?: string;
}

export interface PronunciationLesson {
  id: string;
  level: string;
  title: string;
  ipa: string;
  whyHard: string;
  mouthTip: string;
  exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: MinimalPairItem[];
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: "Rachel's English" | string;
  videoTip?: string;
}

export interface InteractiveIpaVideoPlayerProps {
  video: RachelVideoMeta;
  ipa?: string;
  title?: string;
  compact?: boolean;
  autoPlay?: boolean;
  initialSpeed?: number;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export interface PhoneticArticulationProps {
  ipa: string;
  mouthTip: string;
  whyHard: string;
  audioUrl?: string;
  minimalPairs: MinimalPairItem[];
  onComplete: (stats: { score: number; passed: boolean }) => void;
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: string;
  videoTip?: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Canonical 26-Lesson Video Catalog (Authoritative Oracle)
// ──────────────────────────────────────────────────────────────────────────

export interface CanonicalLessonEntry {
  id: string;
  level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
  title: string;
  ipa: string;
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  channelName: "Rachel's English";
  videoTip: string;
  category: 'Prosody' | 'Consonants' | 'Vowels' | 'Glides' | 'Connected Speech' | 'Diphthongs';
}

export const CANONICAL_RACHEL_LESSONS: CanonicalLessonEntry[] = [
  {
    id: 'word-stress-basics',
    level: 'A0',
    title: 'Trọng âm từ cơ bản',
    ipa: 'ˈ●○',
    youtubeVideoId: 'pRXsIthxgH8',
    startSeconds: 35,
    endSeconds: 95,
    channelName: "Rachel's English",
    videoTip: 'Stressed syllables must have 3 dimensions: higher in pitch, longer in duration, and louder. Imagine an elastic rubber band.',
    category: 'Prosody',
  },
  {
    id: 'final-stops-ptk',
    level: 'A0',
    title: 'Bật âm cuối /p/ /t/ /k/',
    ipa: '-p -t -k',
    youtubeVideoId: 'IV6e_XyNe0w',
    startSeconds: 42,
    endSeconds: 108,
    channelName: "Rachel's English",
    videoTip: 'Stop consonants have two phases: the stop (air blocked) and release. Keep throat relaxed and avoid swallowing ending consonants.',
    category: 'Consonants',
  },
  {
    id: 'final-s-z',
    level: 'A0',
    title: 'Âm cuối /s/ /z/ và đuôi -s/-es',
    ipa: '-s -z -ɪz',
    youtubeVideoId: 'xl-7mSeybmI',
    startSeconds: 25,
    endSeconds: 88,
    channelName: "Rachel's English",
    videoTip: 'Teeth lightly closed, lips slightly retracted. /s/ is a voiceless hiss; /z/ shares identical mouth shape with strong vocal cord vibration.',
    category: 'Consonants',
  },
  {
    id: 'w-initial',
    level: 'A1',
    title: '/w/ đầu từ (wet, want)',
    ipa: 'w',
    youtubeVideoId: 'RW94L6606DE',
    startSeconds: 20,
    endSeconds: 75,
    channelName: "Rachel's English",
    videoTip: 'Form a tight, small circle with lips flared forward away from teeth. Back of tongue lifts. Teeth must NEVER touch bottom lip.',
    category: 'Glides',
  },
  {
    id: 'j-glide',
    level: 'A1',
    title: '/j/ đầu từ (yes, year)',
    ipa: 'j',
    youtubeVideoId: '1Yo4BHIIBP8',
    startSeconds: 28,
    endSeconds: 82,
    channelName: "Rachel's English",
    videoTip: 'Tongue arches high with mid-front blade pressing close to hard palate; tip behind bottom front teeth. Glides smoothly into following vowel.',
    category: 'Glides',
  },
  {
    id: 'initial-p-b',
    level: 'A1',
    title: '/p/ vs /b/ đầu từ',
    ipa: 'p b',
    youtubeVideoId: 'JPUr5MgeDHM',
    startSeconds: 30,
    endSeconds: 85,
    channelName: "Rachel's English",
    videoTip: 'Bilabial stop: lips press firmly together. For /p/, explode open with puff of unvoiced air. For /b/, vocal cords vibrate immediately.',
    category: 'Consonants',
  },
  {
    id: 'vowel-i-long-short',
    level: 'A1',
    title: '/iː/ dài vs /ɪ/ ngắn',
    ipa: 'iː ɪ',
    youtubeVideoId: 'scCesnn-0XY',
    startSeconds: 45,
    endSeconds: 115,
    channelName: "Rachel's English",
    videoTip: '/iː/ is tense: lips smile wide, corners pulled back. /ɪ/ is lax: face and jaw completely relax, mouth slightly open, sound short.',
    category: 'Vowels',
  },
  {
    id: 'final-l-n',
    level: 'A1',
    title: 'Âm cuối /l/ vs /n/',
    ipa: '-l -n',
    youtubeVideoId: 'FP0jHNoFqWo',
    startSeconds: 50,
    endSeconds: 120,
    channelName: "Rachel's English",
    videoTip: 'Dark L at word end: back of tongue pulls back creating dark resonance. For /n/: tongue tip must seal roof of mouth on alveolar ridge.',
    category: 'Consonants',
  },
  {
    id: 'sentence-rhythm',
    level: 'A2',
    title: 'Trọng âm câu & nhịp điệu',
    ipa: '●○○●',
    youtubeVideoId: 'PrAe07KluZY',
    startSeconds: 40,
    endSeconds: 110,
    channelName: "Rachel's English",
    videoTip: 'Stress content words (nouns, main verbs); reduce structure words. Unstressed syllables squeeze quickly between regular rhythm pulses.',
    category: 'Prosody',
  },
  {
    id: 's-vs-sh',
    level: 'A2',
    title: '/s/ vs /ʃ/',
    ipa: 's ʃ',
    youtubeVideoId: 'uguN4ghpKtQ',
    startSeconds: 30,
    endSeconds: 95,
    channelName: "Rachel's English",
    videoTip: 'For /s/: lips spread flat, teeth close, sharp hiss. For /ʃ/: lips push forward into flared trumpet circle, tongue pulls back.',
    category: 'Consonants',
  },
  {
    id: 'vowel-u-long-short',
    level: 'A2',
    title: '/uː/ dài vs /ʊ/ ngắn',
    ipa: 'uː ʊ',
    youtubeVideoId: 'IwahymIkGJ0',
    startSeconds: 38,
    endSeconds: 100,
    channelName: "Rachel's English",
    videoTip: '/uː/ is tense: lips purse into a tiny tight circle. /ʊ/ is lax: lips flare softly without tight squeeze, jaw drops slightly.',
    category: 'Vowels',
  },
  {
    id: 'vowel-ae-e',
    level: 'A2',
    title: '/æ/ vs /e/',
    ipa: 'æ e',
    youtubeVideoId: 'UM9gPzKs1Hg',
    startSeconds: 35,
    endSeconds: 105,
    channelName: "Rachel's English",
    videoTip: '/æ/ requires major jaw drop (wide open mouth), tongue flat. /e/ requires only half jaw drop, lips relaxed neutral.',
    category: 'Vowels',
  },
  {
    id: 'final-n-ng',
    level: 'A2',
    title: 'Âm cuối /n/ vs /ŋ/',
    ipa: '-n -ŋ',
    youtubeVideoId: '6ESY7ueSfrc',
    startSeconds: 32,
    endSeconds: 95,
    channelName: "Rachel's English",
    videoTip: 'For /n/: tongue tip touches alveolar ridge. For /ŋ/: back of tongue lifts to touch soft palate, tongue tip stays low, nasal air flow.',
    category: 'Consonants',
  },
  {
    id: 'basic-intonation',
    level: 'A2',
    title: 'Ngữ điệu cơ bản ↘↗',
    ipa: '↘ ↗',
    youtubeVideoId: 'Aoj4HZlLQBY',
    startSeconds: 42,
    endSeconds: 112,
    channelName: "Rachel's English",
    videoTip: 'Statements and Wh- questions pitch downward at the end (↘). Yes/No questions curve upward at the end (↗).',
    category: 'Prosody',
  },
  {
    id: 'schwa',
    level: 'B1',
    title: 'Âm schwa /ə/',
    ipa: 'ə',
    youtubeVideoId: '2BmkUa4Mv60',
    startSeconds: 30,
    endSeconds: 90,
    channelName: "Rachel's English",
    videoTip: 'Completely neutral mouth: jaw hangs slightly open, lips and tongue totally passive. Unstressed, ultra-short, lower pitch.',
    category: 'Vowels',
  },
  {
    id: 'weak-forms',
    level: 'B1',
    title: 'Weak forms — dạng yếu của từ ngữ pháp',
    ipa: 'kən tə ən əv',
    youtubeVideoId: 'JqxEjQ5xfpw',
    startSeconds: 45,
    endSeconds: 118,
    channelName: "Rachel's English",
    videoTip: 'In connected speech, grammatical words reduce to /kən/, /tə/, /ən/, /əv/. Never use strong dictionary forms unless emphasized.',
    category: 'Connected Speech',
  },
  {
    id: 'linking',
    level: 'B1',
    title: 'Nối âm (linking)',
    ipa: 'C‿V',
    youtubeVideoId: '7tsljuK4f2E',
    startSeconds: 35,
    endSeconds: 105,
    channelName: "Rachel's English",
    videoTip: 'When word ending in consonant meets word starting with vowel, carry ending consonant over to become starting consonant. No glottal stop.',
    category: 'Connected Speech',
  },
  {
    id: 'v-f-final',
    level: 'B1',
    title: '/v/ vs /f/ (nhất là cuối từ)',
    ipa: 'v f',
    youtubeVideoId: 'nR-K3mrHFv0',
    startSeconds: 30,
    endSeconds: 95,
    channelName: "Rachel's English",
    videoTip: 'Upper front teeth rest lightly on inside wet margin of bottom lip. For /f/: purely voiceless airflow. For /v/: strong vocal cord vibration buzzing.',
    category: 'Consonants',
  },
  {
    id: 'th-voiceless',
    level: 'B1',
    title: '/θ/ — "th" điếc (think)',
    ipa: 'θ',
    youtubeVideoId: 'nlKNo1TGALA',
    startSeconds: 25,
    endSeconds: 85,
    channelName: "Rachel's English",
    videoTip: 'Place only the very tip of the tongue between upper and lower front teeth. Blow unvoiced air smoothly through teeth gap.',
    category: 'Consonants',
  },
  {
    id: 'final-clusters-ed',
    level: 'A2',
    title: 'Cụm phụ âm cuối & đuôi -ed',
    ipa: '-st -kt -ɪd',
    youtubeVideoId: 'gftHWQ6CLu8',
    startSeconds: 40,
    endSeconds: 115,
    channelName: "Rachel's English",
    videoTip: '-ed has 3 rules: /ɪd/ only after /t/ or /d/; /t/ after unvoiced sounds; /d/ after voiced sounds. Link smoothly without adding vowels.',
    category: 'Consonants',
  },
  {
    id: 'th-voiced',
    level: 'B2',
    title: '/ð/ — "th" kêu (this)',
    ipa: 'ð',
    youtubeVideoId: 'nlKNo1TGALA',
    startSeconds: 85,
    endSeconds: 145,
    channelName: "Rachel's English",
    videoTip: 'Identical tongue position between teeth as /θ/, but with full vocal cord vibration. Shortcut: tip presses lightly behind upper teeth.',
    category: 'Consonants',
  },
  {
    id: 'vowel-uh-ah',
    level: 'B2',
    title: '/ʌ/ vs /ɑː/ (và /ɒ/)',
    ipa: 'ʌ ɑː ɒ',
    youtubeVideoId: 'eJPv2mJJwHQ',
    startSeconds: 35,
    endSeconds: 100,
    channelName: "Rachel's English",
    videoTip: '/ɑː/ has maximum jaw drop, tongue low and pressed back. /ʌ/ is mid-central: half jaw drop, short and punchy.',
    category: 'Vowels',
  },
  {
    id: 'diphthongs',
    level: 'B2',
    title: 'Nguyên âm đôi /eɪ aɪ oʊ aʊ/',
    ipa: 'eɪ aɪ oʊ aʊ',
    youtubeVideoId: 'XajvB178Hhs',
    startSeconds: 45,
    endSeconds: 120,
    channelName: "Rachel's English",
    videoTip: 'Diphthongs require dynamic movement: 75% duration on first vowel, smooth gliding transition for 25% into second vowel. Do NOT flatten.',
    category: 'Diphthongs',
  },
  {
    id: 'r-l-z',
    level: 'B2',
    title: '/r/ vs /l/ vs /z/ (d/gi/r giọng Bắc)',
    ipa: 'r l z',
    youtubeVideoId: 'mO7J-b8vi54',
    startSeconds: 45,
    endSeconds: 115,
    channelName: "Rachel's English",
    videoTip: 'For American /r/: tongue tip curls up or bunches back suspended in mid-air (touches NOTHING). For /l/: tongue touches gum ridge.',
    category: 'Consonants',
  },
  {
    id: 'ch-j',
    level: 'B2',
    title: '/tʃ/ vs /dʒ/',
    ipa: 'tʃ dʒ',
    youtubeVideoId: 'jaRcbpN_KlM',
    startSeconds: 948,
    endSeconds: 1010,
    channelName: "Rachel's English",
    videoTip: 'Affricates: lips flare forward, tongue tip seals alveolar ridge then releases into friction. /tʃ/ is voiceless blast; /dʒ/ adds vocal vibration.',
    category: 'Consonants',
  },
  {
    id: 'vowel-aw-o',
    level: 'B2',
    title: '/ɔː/ vs /ɒ/',
    ipa: 'ɔː ɒ',
    youtubeVideoId: 'opMab62SybY',
    startSeconds: 35,
    endSeconds: 95,
    channelName: "Rachel's English",
    videoTip: '/ɔː/ (AW): jaw drops moderately with distinct oval lip rounding and elevated back of tongue. Distinct from unrounded open /ɑː/.',
    category: 'Vowels',
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Helper & Validation Functions
// ──────────────────────────────────────────────────────────────────────────

export function buildYouTubeEmbedUrl(
  videoId: string,
  startSeconds: number,
  endSeconds: number,
  origin = 'http://localhost:3000',
): string {
  const base = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    controls: '1',
    modestbranding: '1',
    origin,
    start: String(Math.floor(startSeconds)),
    end: String(Math.floor(endSeconds)),
  });
  return `${base}?${params.toString()}`;
}

export function validateRachelVideoMeta(meta: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!meta || typeof meta !== 'object') {
    return { valid: false, errors: ['Video metadata must be an object'] };
  }

  // 1. youtubeVideoId regex validation (strictly 11 chars)
  if (!meta.youtubeVideoId || typeof meta.youtubeVideoId !== 'string') {
    errors.push('Missing or invalid youtubeVideoId');
  } else if (!/^[a-zA-Z0-9_-]{11}$/.test(meta.youtubeVideoId)) {
    errors.push(`youtubeVideoId "${meta.youtubeVideoId}" must be exactly 11 valid characters`);
  }

  // 2. channelName invariance
  if (meta.channelName !== "Rachel's English") {
    errors.push(`channelName must strictly equal "Rachel's English", got "${meta.channelName}"`);
  }

  // 3. Timestamps validation
  if (typeof meta.startSeconds !== 'number' || isNaN(meta.startSeconds) || meta.startSeconds < 0) {
    errors.push(`startSeconds must be a non-negative number, got ${meta.startSeconds}`);
  }
  if (typeof meta.endSeconds !== 'number' || isNaN(meta.endSeconds)) {
    errors.push(`endSeconds must be a valid number, got ${meta.endSeconds}`);
  } else if (typeof meta.startSeconds === 'number' && meta.endSeconds <= meta.startSeconds) {
    errors.push(`endSeconds (${meta.endSeconds}) must be greater than startSeconds (${meta.startSeconds})`);
  }

  // 4. Duration bounds (15s to 180s)
  if (
    typeof meta.startSeconds === 'number' &&
    typeof meta.endSeconds === 'number' &&
    meta.endSeconds > meta.startSeconds
  ) {
    const duration = meta.endSeconds - meta.startSeconds;
    if (duration < 15) {
      errors.push(`Clip duration (${duration}s) is too short: minimum is 15 seconds`);
    } else if (duration > 180) {
      errors.push(`Clip duration (${duration}s) is too long: maximum is 180 seconds`);
    }
  }

  // 5. Video Tip validation
  const tip = meta.videoTip || meta.rachelMouthTip || meta.keyArticulationTip;
  if (!tip || typeof tip !== 'string') {
    errors.push('Missing actionable videoTip string');
  } else if (tip.trim().length < 20) {
    errors.push(`videoTip length (${tip.trim().length}) must be at least 20 characters`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateLessonVideoData(lesson: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!lesson || typeof lesson !== 'object') {
    return { valid: false, errors: ['Lesson must be an object'] };
  }

  // Support structured video object or flat properties
  if (lesson.video) {
    const res = validateRachelVideoMeta(lesson.video);
    if (!res.valid) errors.push(...res.errors);
  } else if (lesson.youtubeVideoId) {
    const flatMeta = {
      youtubeVideoId: lesson.youtubeVideoId,
      startSeconds: lesson.startSeconds,
      endSeconds: lesson.endSeconds,
      channelName: lesson.channelName,
      videoTip: lesson.videoTip,
    };
    const res = validateRachelVideoMeta(flatMeta);
    if (!res.valid) errors.push(...res.errors);
  } else {
    errors.push(`Lesson "${lesson.id || 'unknown'}" is missing video metadata`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateCspDirectives(cspContent: string): {
  valid: boolean;
  frameSrcAllowed: boolean;
  scriptSrcAllowed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check frame-src includes youtube.com and youtube-nocookie.com
  const hasFrameSrcYoutube =
    /frame-src[^;]*https:\/\/www\.youtube\.com/i.test(cspContent) ||
    /frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/i.test(cspContent);

  const hasScriptSrcYoutube =
    /script-src[^;]*https:\/\/www\.youtube\.com/i.test(cspContent) ||
    /script-src[^;]*https:\/\/s\.ytimg\.com/i.test(cspContent);

  if (!hasFrameSrcYoutube) {
    errors.push('CSP frame-src directive does not allow YouTube domains');
  }
  if (!hasScriptSrcYoutube) {
    errors.push('CSP script-src directive does not allow YouTube domains (youtube.com / s.ytimg.com)');
  }

  return {
    valid: errors.length === 0,
    frameSrcAllowed: hasFrameSrcYoutube,
    scriptSrcAllowed: hasScriptSrcYoutube,
    errors,
  };
}

export function getResponsivePlayerDimensions(screenWidthPx: number): {
  aspectRatio: string;
  maxHeightPx: number;
  minTouchTargetPx: number;
  isMobileCompact: boolean;
} {
  if (screenWidthPx < 640) {
    return {
      aspectRatio: '16/9',
      maxHeightPx: 240,
      minTouchTargetPx: 44,
      isMobileCompact: true,
    };
  }
  return {
    aspectRatio: '16/9',
    maxHeightPx: 380,
    minTouchTargetPx: 44,
    isMobileCompact: false,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// YouTube IPA Player Simulator
// ──────────────────────────────────────────────────────────────────────────

export class MockYouTubeIpaPlayer {
  private currentTime: number;
  private startSeconds: number;
  private endSeconds: number;
  private playerState = -1; // -1: UNSTARTED, 1: PLAYING, 2: PAUSED, 0: ENDED
  private playbackRate = 1.0;
  private isLooping = false;
  private pitchPreserved = true;
  public onStateChangeCallback?: (state: number) => void;

  constructor(startSeconds = 30, endSeconds = 90) {
    this.startSeconds = startSeconds;
    this.endSeconds = endSeconds;
    this.currentTime = startSeconds;
  }

  playVideo(): void {
    this.playerState = 1; // PLAYING
    this.onStateChangeCallback?.(1);
  }

  pauseVideo(): void {
    this.playerState = 2; // PAUSED
    this.onStateChangeCallback?.(2);
  }

  stopVideo(): void {
    this.playerState = 0; // ENDED
    this.currentTime = this.startSeconds;
    this.onStateChangeCallback?.(0);
  }

  seekTo(seconds: number, allowSeekAhead = true): void {
    this.currentTime = Math.max(0, seconds);
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  setCurrentTimeForTesting(seconds: number): void {
    this.currentTime = seconds;
  }

  getPlayerState(): number {
    return this.playerState;
  }

  setPlaybackRate(suggestedRate: number): void {
    const allowed = [0.5, 0.75, 1.0];
    if (allowed.includes(suggestedRate)) {
      this.playbackRate = suggestedRate;
    } else {
      // Clamp to closest supported
      if (suggestedRate < 0.6) this.playbackRate = 0.5;
      else if (suggestedRate < 0.85) this.playbackRate = 0.75;
      else this.playbackRate = 1.0;
    }
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  isPitchPreserved(): boolean {
    return this.pitchPreserved;
  }

  setLoop(enabled: boolean): void {
    this.isLooping = enabled;
  }

  getLoop(): boolean {
    return this.isLooping;
  }

  replayClip(): void {
    this.seekTo(this.startSeconds, true);
    this.playVideo();
  }

  getBounds(): { start: number; end: number } {
    return { start: this.startSeconds, end: this.endSeconds };
  }

  /**
   * Simulates the 150ms interval polling check.
   */
  tickInterval(deltaMs = 150): void {
    if (this.playerState === 1 /* PLAYING */) {
      this.currentTime += (deltaMs / 1000) * this.playbackRate;

      if (this.isLooping) {
        if (this.currentTime >= this.endSeconds || this.currentTime < this.startSeconds - 1) {
          this.seekTo(this.startSeconds, true);
        }
      }
    }
  }

  triggerStateChange(state: number): void {
    this.playerState = state;
    this.onStateChangeCallback?.(state);

    // Fallback: If video ends while looping, seek to start and replay
    if (state === 0 /* ENDED */ && this.isLooping) {
      this.seekTo(this.startSeconds, true);
      this.playVideo();
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Audio Coordination Simulator
// ──────────────────────────────────────────────────────────────────────────

export class AudioCoordinationController {
  public isWordAudioActive = false;
  public isMicRecording = false;
  public videoPlayer: MockYouTubeIpaPlayer;

  constructor(player: MockYouTubeIpaPlayer) {
    this.videoPlayer = player;
  }

  onVideoPlay(): void {
    // Invariant: Playing video must call stopWordAudio() to silence single words / TTS
    this.stopWordAudio();
    this.videoPlayer.playVideo();
  }

  onPlayDrillTarget(): void {
    // Invariant: Playing drill audio must pause the video player
    this.videoPlayer.pauseVideo();
    this.isWordAudioActive = true;
  }

  onStartMic(): void {
    // Invariant: Activating mic for recording must pause the video player
    this.videoPlayer.pauseVideo();
    this.isMicRecording = true;
  }

  onStopMic(): void {
    this.isMicRecording = false;
  }

  stopWordAudio(): void {
    this.isWordAudioActive = false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Roadmap Progression Simulator
// ──────────────────────────────────────────────────────────────────────────

export interface RoadmapStepCompletionPayload {
  stepId: string;
  score: number;
}

export interface RoadmapCompletionResult {
  success: boolean;
  xpAwarded: number;
  stepId: string;
  score: number;
  unlockedNextStep: boolean;
}

export class RoadmapProgressionSimulator {
  private completedSteps: Map<string, { score: number; completedAt: string }> = new Map();

  completeRoadmapStep(payload: RoadmapStepCompletionPayload): RoadmapCompletionResult {
    if (!payload.stepId || !payload.stepId.startsWith('sp-')) {
      throw new Error(`Invalid pronunciation roadmap stepId: "${payload.stepId}". Must start with "sp-".`);
    }

    if (typeof payload.score !== 'number' || payload.score < 0 || payload.score > 100) {
      throw new Error(`Invalid score ${payload.score}. Must be between 0 and 100.`);
    }

    const passed = payload.score >= 80;
    this.completedSteps.set(payload.stepId, {
      score: payload.score,
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      xpAwarded: 15, // Standard pronunciation step XP
      stepId: payload.stepId,
      score: payload.score,
      unlockedNextStep: passed,
    };
  }

  isStepCompleted(stepId: string): boolean {
    return this.completedSteps.has(stepId);
  }

  getStepScore(stepId: string): number | null {
    return this.completedSteps.get(stepId)?.score ?? null;
  }
}
