/**
 * Focused, deterministic opaque-box Puppeteer E2E suite for the Synchronized
 * Tap-to-Lookup Vocabulary Experience (Requirement R3, TEST_INFRA.md).
 *
 * Usage:
 *   node tests/e2e/tap-to-lookup.test.mjs
 *   node tests/e2e/tap-to-lookup.test.mjs --only=5-flashcard-flip,6-dictionary-cache-latency
 *   node tests/e2e/tap-to-lookup.test.mjs --case=7-toeic-learn-quickquiz
 *
 * Environment flags:
 *   E2E_BASE_URL=<url>     Attach to a running server (verifies /api/health)
 *   E2E_USE_DEV=1          Force `next dev` with TSX_TEST=1
 *   E2E_LIVE_LOOKUP=1      Pass /api/dictionary/lookup through to the real handler
 */

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import puppeteer from 'puppeteer';

const CASE_IDS = [
  '1-grammar',
  '2-reading-library',
  '3-daily-reading',
  '4-listening',
  '5-flashcard-flip',
  '6-dictionary-cache-latency',
  '7-toeic-learn-quickquiz',
  '8-exam-post-reveal-thpt',
];

// Minimal 44-byte valid silent PCM WAV so <audio> receives HTTP 200 without Chromium error logs
const SILENT_WAV_BUFFER = Buffer.from(
  'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
  'base64',
);

// Minimal 1x1 transparent PNG
const TRANSPARENT_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const YOUTUBE_IFRAME_API_STUB = `
window.YT = {
  PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
  Player: function MockYTPlayer(_el, opts) {
    this.getCurrentTime = function () { return 0; };
    this.getDuration = function () { return 60; };
    this.getPlayerState = function () { return 2; };
    this.playVideo = function () {};
    this.pauseVideo = function () {};
    this.stopVideo = function () {};
    this.seekTo = function () {};
    this.setPlaybackRate = function () {};
    this.getPlaybackRate = function () { return 1; };
    this.getAvailablePlaybackRates = function () { return [0.75, 1, 1.25]; };
    this.destroy = function () {};
    if (opts && opts.events && typeof opts.events.onReady === 'function') {
      var self = this;
      setTimeout(function () { opts.events.onReady({ target: self }); }, 0);
    }
  }
};
if (typeof window.onYouTubeIframeAPIReady === 'function') {
  window.onYouTubeIframeAPIReady();
}
`;

const DICT_FIXTURES = {
  achieve: {
    word: 'achieve',
    ipa: '/əˈtʃiːv/',
    pos: 'verb',
    definition: 'đạt được, giành được',
    example: 'We achieved our goal this year.',
    example_vi: 'Chúng tôi đã đạt được mục tiêu của mình trong năm nay.',
    synonyms: ['accomplish', 'attain'],
    antonyms: ['fail'],
  },
  goal: {
    word: 'goal',
    ipa: '/ɡoʊl/',
    pos: 'noun',
    definition: 'mục tiêu, mục đích',
    example: 'Employees are expected to evaluate their annual goals.',
    example_vi: 'Nhân viên được kỳ vọng đánh giá các mục tiêu hàng năm.',
    synonyms: ['target', 'objective'],
  },
  year: {
    word: 'year',
    ipa: '/jɪr/',
    pos: 'noun',
    definition: 'năm',
    example: 'We achieved our goal this year.',
    example_vi: 'Chúng tôi đã đạt được mục tiêu của mình trong năm nay.',
  },
  student: {
    word: 'student',
    ipa: '/ˈstuː.dənt/',
    pos: 'noun',
    definition: 'học sinh, sinh viên',
    example: 'I am a student.',
    example_vi: 'Tôi là một học sinh.',
  },
  happy: {
    word: 'happy',
    ipa: '/ˈhæp.i/',
    pos: 'adjective',
    definition: 'vui vẻ, hạnh phúc',
    example: 'I am happy today.',
    example_vi: 'Hôm nay tôi cảm thấy vui.',
  },
  morning: {
    word: 'morning',
    ipa: '/ˈmɔːr.nɪŋ/',
    pos: 'noun',
    definition: 'buổi sáng',
    example: 'Every morning, Anna wakes up at six.',
    example_vi: 'Mỗi buổi sáng, Anna thức dậy lúc sáu giờ.',
  },
  coffee: {
    word: 'coffee',
    ipa: '/ˈkɔː.fi/',
    pos: 'noun',
    definition: 'cà phê',
    example: 'She makes a fresh cup of coffee.',
    example_vi: 'Cô ấy pha một tách cà phê mới.',
  },
  routine: {
    word: 'routine',
    ipa: '/ruːˈtiːn/',
    pos: 'noun',
    definition: 'thói quen hằng ngày, lịch trình thường nhật',
    example: 'She follows a healthy morning routine.',
    example_vi: 'Cô ấy duy trì thói quen buổi sáng lành mạnh.',
  },
  lesson: {
    word: 'lesson',
    ipa: '/ˈles.ən/',
    pos: 'noun',
    definition: 'bài học',
    example: 'Welcome to this English lesson.',
    example_vi: 'Chào mừng đến với bài học tiếng Anh này.',
  },
  daily: {
    word: 'daily',
    ipa: '/ˈdeɪ.li/',
    pos: 'adjective',
    definition: 'hằng ngày',
    example: 'She follows a healthy daily routine.',
    example_vi: 'Cô ấy duy trì thói quen hằng ngày lành mạnh.',
  },
  committee: {
    word: 'committee',
    ipa: '/kəˈmɪt.i/',
    pos: 'noun',
    definition: 'ủy ban, hội đồng',
    example: 'The executive committee will meet tomorrow.',
    example_vi: 'Ủy ban điều hành sẽ họp vào ngày mai.',
  },
  executive: {
    word: 'executive',
    ipa: '/ɪɡˈzek.jə.tɪv/',
    pos: 'adjective',
    definition: 'điều hành, quản trị',
    example: 'The executive committee approved the plan.',
    example_vi: 'Ủy ban điều hành đã phê duyệt kế hoạch.',
  },
  approval: {
    word: 'approval',
    ipa: '/əˈpruː.vəl/',
    pos: 'noun',
    definition: 'sự chấp thuận, sự phê chuẩn',
    example: 'The plan is waiting for final approval.',
    example_vi: 'Kế hoạch đang chờ sự phê chuẩn cuối cùng.',
  },
  approve: {
    word: 'approve',
    ipa: '/əˈpruːv/',
    pos: 'verb',
    definition: 'chấp thuận, phê duyệt',
    example: 'The manager will approve the budget.',
    example_vi: 'Quản lý sẽ phê duyệt ngân sách.',
  },
  approved: {
    word: 'approved',
    ipa: '/əˈpruːvd/',
    pos: 'adjective',
    definition: 'đã được phê duyệt',
    example: 'The approved budget takes effect today.',
    example_vi: 'Ngân sách đã được phê duyệt có hiệu lực hôm nay.',
  },
  equip: {
    word: 'equip',
    ipa: '/ɪˈkwɪp/',
    pos: 'verb',
    definition: 'trang bị',
    example: 'We equip the laboratory with new tools.',
    example_vi: 'Chúng tôi trang bị cho phòng thí nghiệm dụng cụ mới.',
  },
  equipment: {
    word: 'equipment',
    ipa: '/ɪˈkwɪp.mənt/',
    pos: 'noun',
    definition: 'thiết bị, trang thiết bị',
    example: 'The facility has advanced medical equipment.',
    example_vi: 'Cơ sở có trang thiết bị y tế hiện đại.',
  },
  laboratory: {
    word: 'laboratory',
    ipa: '/ˈlæb.rə.tɔːr.i/',
    pos: 'noun',
    definition: 'phòng thí nghiệm',
    example: 'The new laboratory facility opened today.',
    example_vi: 'Cơ sở phòng thí nghiệm mới đã khai trương hôm nay.',
  },
  family: {
    word: 'family',
    ipa: '/ˈfæm.əl.i/',
    pos: 'noun',
    definition: 'gia đình',
    example: 'Family meals bring everyone together.',
    example_vi: 'Bữa cơm gia đình gắn kết mọi người.',
  },
  meal: {
    word: 'meal',
    ipa: '/miːl/',
    pos: 'noun',
    definition: 'bữa ăn',
    example: 'Sharing a meal helps family members feel closer.',
    example_vi: 'Chia sẻ bữa ăn giúp các thành viên gia đình gắn bó hơn.',
  },
};

const LEMMA_ALIASES = {
  achieved: 'achieve',
  achieves: 'achieve',
  goals: 'goal',
  meals: 'meal',
  families: 'family',
  lessons: 'lesson',
  students: 'student',
  years: 'year',
};

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveFixtureEntry(rawWord) {
  const clean = String(rawWord || '')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^[^a-z]+|[^a-z]+$/gi, '');
  if (!clean) return null;
  const lemma = LEMMA_ALIASES[clean] || clean;
  return DICT_FIXTURES[lemma] || null;
}

function buildDictPayload(rawWord) {
  const entry = resolveFixtureEntry(rawWord);
  if (!entry) return null;

  const mockAudioUrl = `/mock-audio/${encodeURIComponent(entry.word)}.wav`;

  return {
    success: true,
    source: 'e2e_fixture',
    word: entry.word,
    cleanWord: entry.word,
    ipa: entry.ipa,
    pos: entry.pos,
    definition: entry.definition,
    meaning: entry.definition,
    example: entry.example,
    example_vi: entry.example_vi,
    exampleVi: entry.example_vi,
    synonyms: entry.synonyms || [],
    antonyms: entry.antonyms || [],
    audio_us: mockAudioUrl,
    audioUs: mockAudioUrl,
    audio_uk: mockAudioUrl,
    audioUk: mockAudioUrl,
    pronunciations: [{ ipa: entry.ipa, region: 'US', audio_us: mockAudioUrl, audio_uk: mockAudioUrl }],
    results: [
      {
        pronunciations: [{ ipa: entry.ipa, region: 'US' }],
        meanings: [
          {
            pos: entry.pos,
            definition: entry.definition,
            example: entry.example,
            example_vi: entry.example_vi,
            isPrimary: true,
          },
        ],
      },
    ],
    meanings: [
      {
        meaning: entry.definition,
        part_of_speech: entry.pos,
        definition: entry.definition,
        pos: entry.pos,
        example: entry.example,
        example_vi: entry.example_vi,
        toeic_tip: '',
        word_family: [],
        antonyms: entry.antonyms || [],
        isPrimary: true,
      },
    ],
  };
}

function parseCliArgs(argv) {
  const selected = new Set();
  for (const arg of argv) {
    if (arg.startsWith('--case=')) {
      const id = arg.slice('--case='.length).trim();
      assert(id.length > 0, 'CLI error: --case= requires a non-empty case ID.');
      selected.add(id);
    } else if (arg.startsWith('--only=')) {
      const rawList = arg.slice('--only='.length);
      const parts = rawList
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      assert(parts.length > 0, 'CLI error: --only= requires at least one case ID.');
      for (const p of parts) selected.add(p);
    } else {
      throw new Error(
        `Unknown CLI argument "${arg}". Supported flags: --only=<id1,id2>, --case=<id>`,
      );
    }
  }
  if (selected.size === 0) return [...CASE_IDS];
  for (const id of selected) {
    assert(
      CASE_IDS.includes(id),
      `Unknown E2E case "${id}". Valid cases: ${CASE_IDS.join(', ')}`,
    );
  }
  return CASE_IDS.filter((id) => selected.has(id));
}

async function allocatePort() {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const addr = socket.address();
  const port = typeof addr === 'object' && addr ? addr.port : 3000;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

async function waitForHealth(origin, server, getStderrTail = () => '') {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server && server.exitCode !== null) {
      const tail = getStderrTail();
      throw new Error(
        `[E2E] Next server exited early with code ${server.exitCode}${tail ? `\n--- server stderr tail ---\n${tail}` : ''}`,
      );
    }
    try {
      const res = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.status === 'ok') return;
      }
    } catch {
      // Wait for local server readiness
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const tail = getStderrTail();
  throw new Error(
    `[E2E] Server failed /api/health check at ${origin}/api/health${tail ? `\n--- server stderr tail ---\n${tail}` : ''}`,
  );
}

async function stopServer(server) {
  if (!server) return;
  const exited =
    server.exitCode !== null
      ? Promise.resolve('already')
      : once(server, 'exit').catch(() => 'error');

  if (process.platform === 'win32' && server.pid) {
    try {
      execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Process tree already exited
    }
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1500))]);
    return;
  }

  if (server.exitCode === null) {
    server.kill('SIGTERM');
    const outcome = await Promise.race([
      exited.then(() => 'exited'),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000)),
    ]);
    if (outcome === 'timeout' && server.exitCode === null) {
      server.kill('SIGKILL');
      await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1500))]);
    }
  }
}

async function resolveServerTarget(cwd = process.cwd(), onServerSpawned = null) {
  const externalBase = process.env.E2E_BASE_URL?.trim();
  if (externalBase) {
    const origin = externalBase.replace(/\/+$/, '');
    await waitForHealth(origin, null);
    return { origin, server: null, mode: 'attached' };
  }

  const buildIdPath = path.join(cwd, '.next', 'BUILD_ID');
  const hasBuild = fs.existsSync(buildIdPath);
  const useDev = process.env.E2E_USE_DEV === '1' || !hasBuild;
  const port = await allocatePort();
  const origin = `http://127.0.0.1:${port}`;
  const mode = useDev ? 'dev' : 'start';

  const args = [
    'node_modules/next/dist/bin/next',
    mode,
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ];

  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    ...(useDev
      ? { NODE_ENV: 'development', TSX_TEST: '1' }
      : { NODE_ENV: 'production' }),
  };

  const server = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ['ignore', 'ignore', 'pipe'],
    windowsHide: true,
  });
  if (typeof onServerSpawned === 'function') {
    onServerSpawned(server);
  }

  let stderrBuf = '';
  const MAX_STDERR_BYTES = 8192;
  server.stderr?.on('data', (chunk) => {
    stderrBuf += chunk.toString('utf8');
    if (stderrBuf.length > MAX_STDERR_BYTES) {
      stderrBuf = stderrBuf.slice(-MAX_STDERR_BYTES);
    }
  });
  const getStderrTail = () => stderrBuf.trim().split(/\r?\n/).slice(-30).join('\n');

  server.on('error', (err) => {
    stderrBuf += `\n[spawn error] ${err.message}`;
  });

  try {
    await waitForHealth(origin, server, getStderrTail);
    return { origin, server, mode };
  } catch (err) {
    await stopServer(server);
    throw err;
  }
}

async function installBrowserInstrumentations(page) {
  await page.evaluateOnNewDocument(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push(`${event.effectiveDirective}:${event.blockedURI}`);
    });

    try {
      localStorage.setItem('lingopro_onboarding_v6-20260805-mandatory', 'v6-20260805-mandatory');
      localStorage.setItem('lingopro_onboarding_completed', 'true');
      localStorage.setItem('install_prompt_dismissed_at', String(Date.now()));
      localStorage.setItem('lingopro_push_prompt_dismissed', '1');
      localStorage.setItem('lingopro_push_prompt_dismissed_at', String(Date.now()));
      localStorage.setItem('lingopro_study_guide_seen', '1');
      localStorage.setItem('lingopro_typing_mode', 'off');
    } catch {
      // Ignore storage access restriction on opaque origins
    }
  });
}

function attachObservability(page, origin) {
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  const httpErrors = [];
  const unexpectedApiRequests = [];
  const unexpectedExternalRequests = [];

  page.on('pageerror', (err) => {
    pageErrors.push(`${err.name}: ${err.message}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    const errText = req.failure()?.errorText || 'failed';
    // Allow Next.js <Link> RSC page prefetches (?_rsc=...) aborted on navigation/teardown — NEVER /api/*
    let isNonApiRsc = false;
    try {
      const parsed = new URL(url);
      isNonApiRsc = !parsed.pathname.startsWith('/api/') && url.includes('_rsc=');
    } catch {
      isNonApiRsc = false;
    }
    if (errText === 'net::ERR_ABORTED' && isNonApiRsc) {
      return;
    }
    if (url.startsWith(`${origin}/`)) {
      requestFailures.push(`${req.method()} ${url} (${errText})`);
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.startsWith(`${origin}/`) && res.status() >= 400) {
      httpErrors.push(`${res.status()} ${url}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    requestFailures,
    httpErrors,
    unexpectedApiRequests,
    unexpectedExternalRequests,
  };
}

async function assertCleanObservability(obs, page, contextLabel) {
  const cspViolations = await page.evaluate(() => window.__cspViolations || []);
  assert.deepEqual(obs.pageErrors, [], `${contextLabel}: unexpected pageerror(s): ${obs.pageErrors.join('; ')}`);
  assert.deepEqual(obs.httpErrors, [], `${contextLabel}: unexpected >=400 response(s): ${obs.httpErrors.join('; ')}`);
  assert.deepEqual(obs.requestFailures, [], `${contextLabel}: unexpected requestfailed: ${obs.requestFailures.join('; ')}`);
  assert.deepEqual(obs.consoleErrors, [], `${contextLabel}: unexpected console.error(s): ${obs.consoleErrors.join('; ')}`);
  assert.deepEqual(
    obs.unexpectedApiRequests,
    [],
    `${contextLabel}: unexpected unmocked /api/* request(s): ${obs.unexpectedApiRequests.join('; ')}`,
  );
  assert.deepEqual(
    obs.unexpectedExternalRequests,
    [],
    `${contextLabel}: unexpected external request(s): ${obs.unexpectedExternalRequests.join('; ')}`,
  );
  assert.deepEqual(cspViolations, [], `${contextLabel}: unexpected CSP violation(s): ${cspViolations.join('; ')}`);
}

async function attachHermeticInterceptor(page, origin, obs, { liveLookup = false } = {}) {
  const lookupRequests = [];
  const externalRequests = [];

  const respondJson = (request, status, payload) =>
    request.respond({
      status,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

  const starterArticle = {
    id: 'voa-a1-morning-coffee-tradition',
    slug: 'voa-a1-morning-coffee-tradition',
    title: 'A Morning Coffee Routine',
    cefr_level: 'A1',
    theme_id: 'daily-life',
    source_type: 'voa',
    passage:
      "<p>Every morning, Anna wakes up at six o'clock. She goes to the kitchen and makes a fresh cup of coffee. The warm smell of coffee fills her small apartment.</p>",
    passage_plain:
      "Every morning, Anna wakes up at six o'clock. She goes to the kitchen and makes a fresh cup of coffee. The warm smell of coffee fills her small apartment.",
    word_count: 29,
    estimated_read_minutes: 1,
    translation:
      'Mỗi buổi sáng, Anna thức dậy lúc sáu giờ. Cô ấy vào bếp và pha một tách cà phê mới.',
    summary: 'Anna duy trì thói quen buổi sáng uống cà phê.',
    vocabulary_highlights: [
      { word: 'coffee', phonetic: '/ˈkɔː.fi/', meaning_vi: 'cà phê', pos: 'noun' },
    ],
    cloze: { blanks: [] },
    questions: [],
  };

  const dailyReadingExercise = {
    id: 'dr-e2e-1',
    classroomId: null,
    classroomName: 'Kho từ cá nhân',
    isPersonal: true,
    exerciseDate: '2026-11-20',
    sourceDate: '2026-11-20',
    title: 'Morning Coffee Routine',
    passage:
      'Every morning, Anna **achieves** her daily goal before work.\n\nShe drinks fresh coffee and reviews every important routine carefully.',
    passagePlain:
      'Every morning, Anna achieves her daily goal before work.\n\nShe drinks fresh coffee and reviews every important routine carefully.',
    translation: 'Mỗi sáng, Anna đạt được mục tiêu hàng ngày trước khi làm việc.',
    level: 'A2',
    questions: [
      {
        q: 'When does Anna achieve her daily goal?',
        options: ['Before work', 'At midnight', 'On Sunday', 'After dinner'],
        answer: 'Before work',
        explain: 'Đoạn văn nêu rõ: every morning before work.',
      },
    ],
    cloze: {
      text: 'Every morning, Anna {{1}} her daily goal.',
      blanks: [{ id: 1, answer: 'achieves', options: ['achieves', 'achieve'] }],
    },
    sourceWords: [
      { word: 'achieves', translation: 'đạt được', pos: 'verb' },
    ],
    usedWords: ['achieves'],
    coverage: 1,
    bonusWords: [],
    generatedAt: '2026-11-20T00:00:00.000Z',
    completion: null,
  };

  const profileRow = {
    id: 'e2e-student-1',
    email: 'student@e2e.invalid',
    full_name: 'E2E Student',
    role: 'student',
    plan: 'free',
    daily_goal: 10,
    notification_hour: 20,
    province: 'TP.HCM',
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const flashcardWordRow = {
    id: 'w-e2e-achieve-1',
    word: 'achieve',
    translation: 'đạt được',
    ipa: '/əˈtʃiːv/',
    pos: 'verb',
    example: 'We achieved our goal and reached our goals this year.',
    example_vi: 'Chúng tôi đã đạt được mục tiêu của mình trong năm nay.',
    image_url: null,
    synonyms: ['accomplish'],
    antonyms: ['fail'],
    familyWords: [],
    srsLevel: 1,
    reviewCount: 1,
    isDue: true,
    srs: {
      stability: 1,
      difficulty: 5,
      interval_days: 0,
      review_count: 1,
      next_review_date: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
      state: 2,
      lapses: 0,
    },
  };

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const urlStr = request.url();
    const method = request.method();

    // 1. External request tracking & explicit allowlist
    if (!urlStr.startsWith(`${origin}/`)) {
      if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) {
        void request.continue();
        return;
      }

      let host = '';
      let extPathname = '';
      try {
        const parsed = new URL(urlStr);
        host = parsed.hostname.toLowerCase();
        extPathname = parsed.pathname;
      } catch {
        // Malformed URL
      }

      const isExternalDictOrTranslate =
        host === 'api.dictionaryapi.dev' ||
        host.includes('minhqnd') ||
        host.includes('dictionary') ||
        host.includes('wiktionary') ||
        host.includes('translate.google');

      if (host.endsWith('youtube.com') && extPathname === '/iframe_api') {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: false,
        });
        void request.respond({
          status: 200,
          contentType: 'application/javascript',
          body: YOUTUBE_IFRAME_API_STUB,
        });
        return;
      }

      if (host === 'api.dictionaryapi.dev') {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: true,
        });
        void respondJson(request, 200, []);
        return;
      }

      if (host === 'dict.youdao.com' || host === 'ssl.gstatic.com') {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: false,
        });
        void request.respond({
          status: 200,
          contentType: 'audio/wav',
          body: SILENT_WAV_BUFFER,
        });
        return;
      }

      if (host === 'i.ytimg.com' || host.endsWith('.ytimg.com') || host === 'img.youtube.com') {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: false,
        });
        void request.respond({
          status: 200,
          contentType: 'image/png',
          body: TRANSPARENT_PNG_BUFFER,
        });
        return;
      }

      if (host.endsWith('.supabase.co') && extPathname.includes('/storage/v1/object/public/')) {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: false,
        });
        void request.respond({
          status: 200,
          contentType: 'image/png',
          body: TRANSPARENT_PNG_BUFFER,
        });
        return;
      }

      if (liveLookup && (host === 'images.pexels.com' || host === 'images.unsplash.com')) {
        externalRequests.push({
          url: urlStr,
          host,
          ts: Date.now(),
          allowlisted: true,
          isDictOrTranslate: false,
        });
        void request.respond({
          status: 200,
          contentType: 'image/png',
          body: TRANSPARENT_PNG_BUFFER,
        });
        return;
      }

      // Any other external request is unexpected — record loudly and fail!
      externalRequests.push({
        url: urlStr,
        host,
        ts: Date.now(),
        allowlisted: false,
        isDictOrTranslate: isExternalDictOrTranslate,
      });
      obs.unexpectedExternalRequests.push(`${method} ${urlStr}`);
      void request.abort('blockedbyclient');
      return;
    }

    const urlObj = new URL(urlStr);
    const pathname = urlObj.pathname;

    // 2. Same-origin mock audio for deterministic offline audio playback
    if (pathname.startsWith('/mock-audio/')) {
      void request.respond({
        status: 200,
        contentType: 'audio/wav',
        body: SILENT_WAV_BUFFER,
      });
      return;
    }

    if (!pathname.startsWith('/api/')) {
      void request.continue();
      return;
    }

    // 3. First-party TTS & image proxy stubs
    if (pathname === '/api/tts') {
      void request.respond({
        status: 200,
        contentType: 'audio/wav',
        body: SILENT_WAV_BUFFER,
      });
      return;
    }

    if (pathname === '/api/image-proxy' || (liveLookup && pathname === '/api/toeic/media/proxy')) {
      void request.respond({
        status: 200,
        contentType: 'image/png',
        body: TRANSPARENT_PNG_BUFFER,
      });
      return;
    }

    // 4. ALL /api/dictionary/* and /api/translate tracking + mocks
    if (pathname.startsWith('/api/dictionary/') || pathname === '/api/translate') {
      const queriedWord =
        urlObj.searchParams.get('word') || urlObj.searchParams.get('q') || '';
      lookupRequests.push({
        pathname,
        method,
        word: queriedWord,
        search: urlObj.search,
        ts: Date.now(),
      });

      if (pathname === '/api/dictionary/suggest') {
        if (liveLookup) {
          void request.continue();
          return;
        }
        const q = queriedWord.trim().toLowerCase();
        const suggestions = Object.keys(DICT_FIXTURES).filter((k) => k.startsWith(q)).slice(0, 8);
        void respondJson(request, 200, {
          success: true,
          suggestions,
          isFuzzy: false,
          source: 'ram_smart',
        });
        return;
      }

      if (liveLookup && pathname === '/api/dictionary/lookup') {
        void request.continue();
        return;
      }

      if (pathname === '/api/translate') {
        void respondJson(request, 200, {
          success: true,
          translatedText: 'bản dịch mẫu',
          fromCache: true,
          provider: 'e2e_fixture',
          sourceLang: 'en',
          targetLang: 'vi',
        });
        return;
      }

      if (pathname === '/api/dictionary/lookup') {
        const payload = buildDictPayload(queriedWord);
        if (!payload) {
          void respondJson(request, 404, { success: false, error: 'Not found' });
          return;
        }
        void respondJson(request, 200, payload);
        return;
      }

      if (pathname === '/api/dictionary/external') {
        const payload = buildDictPayload(queriedWord);
        if (!payload) {
          void respondJson(request, 404, { success: false, error: 'Not found' });
          return;
        }
        void respondJson(request, 200, payload);
        return;
      }

      // Unexpected AI lookup endpoints (/api/dictionary/ai-lookup, ai-phrase-lookup, ai-sentence, etc.)
      obs.unexpectedApiRequests.push(`${method} ${pathname}${urlObj.search}`);
      void respondJson(request, 500, {
        success: false,
        error: `Unexpected dictionary endpoint in hermetic E2E: ${pathname}`,
      });
      return;
    }

    // 5. BFF Auth & Supabase REST proxy mocks
    if (pathname === '/api/auth/session') {
      void respondJson(request, 200, {
        session: {
          user: {
            id: profileRow.id,
            email: profileRow.email,
            user_metadata: {
              full_name: profileRow.full_name,
              role: 'student',
              lingopro_onboarding_completed: true,
              lingopro_onboarding_version: 'v6-20260805-mandatory',
            },
          },
          expires_at: Math.floor(Date.now() / 1000) + 7200,
        },
      });
      return;
    }

    if (pathname.startsWith('/api/auth/data/')) {
      const table = pathname.replace('/api/auth/data/', '');
      const wantsObject = String(request.headers().accept || '').includes(
        'application/vnd.pgrst.object+json',
      );
      if (table === 'profiles') {
        void respondJson(request, 200, wantsObject ? profileRow : [profileRow]);
        return;
      }
      if (table === 'user_gamification') {
        const gam = {
          user_id: profileRow.id,
          total_xp: 120,
          current_streak: 3,
          longest_streak: 5,
          last_active_date: '2026-11-20',
          daily_goal: 30,
          today_xp: 10,
          today_date: '2026-11-20',
        };
        void respondJson(request, 200, wantsObject ? gam : [gam]);
        return;
      }
      if (table === 'words') {
        void respondJson(request, 200, wantsObject ? flashcardWordRow : [flashcardWordRow]);
        return;
      }
      if (table === 'srs_progress') {
        void respondJson(
          request,
          200,
          wantsObject ? flashcardWordRow.srs : [flashcardWordRow.srs],
        );
        return;
      }
      if (table === 'classrooms') {
        void respondJson(request, 200, wantsObject ? {} : []);
        return;
      }
      obs.unexpectedApiRequests.push(`${method} ${pathname}`);
      void respondJson(request, 404, { success: false, error: `Unmocked table: ${table}` });
      return;
    }

    // 6. Explicit Learning, Profile & Exam API mocks
    if (pathname === '/api/words') {
      if (method === 'POST') {
        void respondJson(request, 200, {
          success: true,
          message: '"word" saved!',
          wordId: 'w-e2e-saved',
          wordQuota: { used: 2, limit: 30, remaining: 28 },
        });
        return;
      }
      void respondJson(request, 200, {
        success: true,
        data: [flashcardWordRow],
        classroomId: null,
        total: 1,
        newCount: 0,
        reviewDueCount: 1,
        dueCount: 1,
        limit: 100,
        offset: 0,
        hasMore: false,
      });
      return;
    }

    if (pathname === '/api/words/srs' || pathname === '/api/quiz/save') {
      void respondJson(request, 200, { success: true });
      return;
    }

    if (pathname === '/api/words/refresh-image') {
      void respondJson(request, 200, { success: true, image_url: null });
      return;
    }

    if (pathname === '/api/grammar/progress') {
      void respondJson(request, 200, { success: true, data: [], dueCount: 0 });
      return;
    }

    if (pathname === '/api/grammar/review') {
      void respondJson(request, 200, { success: true, count: 0, data: [] });
      return;
    }

    if (pathname === '/api/profile') {
      void respondJson(request, 200, {
        success: true,
        data: profileRow,
        entitlement: {
          rawPlan: 'free',
          effectivePlan: 'free',
          expiresAt: null,
          remainingDays: 0,
          wordQuota: { used: 1, lifetime: 1, limit: 30, remaining: 29 },
        },
      });
      return;
    }

    if (pathname === '/api/roadmap') {
      void respondJson(request, 200, {
        success: true,
        data: { enrolled: false, enrollments: [] },
      });
      return;
    }

    if (pathname === '/api/import/packages') {
      void respondJson(request, 200, {
        success: true,
        routes: [],
        microPackSize: 7,
        catalogVersion: 'e2e',
      });
      return;
    }

    if (pathname === '/api/referral/evaluate-activation' || pathname === '/api/push/fcm-register') {
      void respondJson(request, 200, { success: true });
      return;
    }

    if (pathname === '/api/reading/progress') {
      void respondJson(request, 200, { success: true, bookmarks: [], progress: [] });
      return;
    }

    if (pathname === '/api/reading/articles') {
      if (urlObj.searchParams.has('id') || urlObj.searchParams.has('slug')) {
        void respondJson(request, 200, { article: starterArticle, source: 'e2e_fixture' });
        return;
      }
      void respondJson(request, 200, {
        articles: [starterArticle],
        pagination: { page: 1, limit: 18, hasMore: false, total: 1 },
        source: 'e2e_fixture',
      });
      return;
    }

    if (pathname === '/api/practice/daily-reading') {
      void respondJson(request, 200, {
        success: true,
        date: '2026-11-20',
        todayVN: '2026-11-20',
        canGenerateToday: false,
        hasNew: false,
        hasUncompleted: true,
        uncompletedExerciseId: dailyReadingExercise.id,
        exercises: [dailyReadingExercise],
      });
      return;
    }

    if (pathname === '/api/toeic/test') {
      void respondJson(request, 200, {
        success: true,
        testId: 'estudyme-test-1',
        title: 'Luyện tập Part 5 (1 câu — ETS Simulation 1)',
        durationSeconds: 600,
        totalQuestions: 1,
        sessionToken: 'e2e-toeic-session-token',
        part: 5,
        filterMode: 'all_random',
        questions: [
          {
            id: 'q-e2e-p5-1',
            testId: 'estudyme-test-1',
            questionNumber: 1,
            part: 5,
            section: 'reading',
            prompt: 'The executive committee granted final _______ for the annual budget.',
            options: [
              { key: 'A', text: 'approve' },
              { key: 'B', text: 'approved' },
              { key: 'C', text: 'approval' },
              { key: 'D', text: 'approvingly' },
            ],
          },
        ],
      });
      return;
    }

    if (pathname === '/api/toeic/explain') {
      void respondJson(request, 200, {
        success: true,
        questionNumber: 1,
        questionId: 'q-e2e-p5-1',
        part: 5,
        correctAnswer: 'C',
        explanationVi:
          'Sau tính từ final\u200B cần một\u200C danh từ là approval\u200D (sự chấp thuận).\uFEFF',
      });
      return;
    }

    if (pathname === '/api/toeic/submit') {
      void respondJson(request, 200, { success: true });
      return;
    }

    // 7. Allow local static JSON endpoints like /api/grammar/theory, /api/listening/video, /api/health
    if (
      pathname === '/api/health' ||
      pathname === '/api/grammar/theory' ||
      pathname === '/api/listening/video'
    ) {
      void request.continue();
      return;
    }

    // 8. Unmocked /api/* must fail loudly instead of returning synthetic 200
    obs.unexpectedApiRequests.push(`${method} ${pathname}${urlObj.search}`);
    void respondJson(request, 404, {
      success: false,
      error: `Unmocked API endpoint in E2E: ${pathname}`,
    });
  });

  return {
    lookupRequests,
    externalRequests,
    sliceSince(startIdx) {
      return lookupRequests.slice(startIdx);
    },
    sliceExternalSince(startIdx) {
      return externalRequests.slice(startIdx);
    },
  };
}

async function waitForExamTrigger(page, selector, timeoutMs = 4500) {
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs });
  } catch {
    const count = await page.$$eval(selector, (els) => els.length).catch(() => 0);
    throw new Error(
      `Expected interactive lookup trigger (${selector}) to exist, found ${count}`,
    );
  }
}

async function clickTriggerMatching(page, containerSelector, wordPattern, options = {}) {
  const excludeSelector = typeof options === 'string' ? options : options.excludeSelector ?? null;
  const onBeforeClick = typeof options === 'object' && options ? options.onBeforeClick : null;

  const scrolledWord = await page.evaluate(
    (containerSel, patternSrc, excludeSel) => {
      const root = containerSel ? document.querySelector(containerSel) : document;
      if (!root) return null;
      const re = new RegExp(patternSrc, 'i');
      const triggers = Array.from(root.querySelectorAll('.exam-lookup-trigger'));
      const match = triggers.find((el) => {
        if (excludeSel && el.closest(excludeSel)) return false;
        const txt = (el.textContent || '').trim();
        return re.test(txt);
      });
      if (!match) return null;
      match.scrollIntoView({ block: 'center', inline: 'nearest' });
      return (match.textContent || '').trim();
    },
    containerSelector,
    wordPattern.source,
    excludeSelector,
  );
  assert(
    scrolledWord,
    `No .exam-lookup-trigger matching /${wordPattern.source}/i found in ${containerSelector || 'document'}`,
  );

  // Let any scroll event from scrollIntoView settle before clicking, so scroll-dismiss doesn't close the card
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60))),
      ),
  );

  const coords = await page.evaluate(
    (containerSel, patternSrc, excludeSel) => {
      const root = containerSel ? document.querySelector(containerSel) : document;
      if (!root) return null;
      const re = new RegExp(patternSrc, 'i');
      const triggers = Array.from(root.querySelectorAll('.exam-lookup-trigger'));
      const match = triggers.find((el) => {
        if (excludeSel && el.closest(excludeSel)) return false;
        const txt = (el.textContent || '').trim();
        return re.test(txt);
      });
      if (!match) return null;
      const rect = match.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        word: (match.textContent || '').trim(),
      };
    },
    containerSelector,
    wordPattern.source,
    excludeSelector,
  );
  assert(coords && coords.x > 0 && coords.y > 0, `Trigger "${scrolledWord}" has invalid bounding rect`);
  if (typeof onBeforeClick === 'function') {
    onBeforeClick(coords.word);
  }
  await page.mouse.click(coords.x, coords.y);
  return coords.word;
}

async function waitForLookupCardSettled(page, expectedWordRegex, opts = {}) {
  const {
    timeoutMs = 5000,
    expectedDefRegex = null,
    expectedIpaRegex = null,
    liveLookup = false,
  } = opts;

  await page.waitForSelector('.exam-lookup-card[role="dialog"]', { timeout: timeoutMs });
  await page.waitForFunction(
    () => {
      const card = document.querySelector('.exam-lookup-card[role="dialog"]');
      if (!card) return false;
      const text = card.textContent || '';
      return text.trim().length > 0 && !text.includes('Đang tra từ điển...');
    },
    { timeout: timeoutMs },
  );

  // Allow CSS fade-in animation (animate-in fade-in duration-150) to become non-zero opacity,
  // while still letting permanently invisible (opacity: 0) cards fail the explicit assertion below.
  await page
    .waitForFunction(
      () => {
        const card = document.querySelector('.exam-lookup-card[role="dialog"]');
        if (!card) return false;
        const style = window.getComputedStyle(card);
        return Number.parseFloat(style.opacity || '1') > 0;
      },
      { timeout: Math.min(500, timeoutMs) },
    )
    .catch(() => {});

  const cardData = await page.evaluate(() => {
    const card = document.querySelector('.exam-lookup-card[role="dialog"]');
    if (!card) return null;

    const style = window.getComputedStyle(card);
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const inViewport =
      rect.width > 20 &&
      rect.height > 20 &&
      rect.left >= 0 &&
      rect.top >= 0 &&
      rect.right <= window.innerWidth &&
      rect.bottom <= window.innerHeight;
    const hitEl = inViewport ? document.elementFromPoint(cx, cy) : null;
    const hitTestOk = Boolean(hitEl && card.contains(hitEl));
    const visible =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number.parseFloat(style.opacity || '1') > 0 &&
      inViewport;

    const headerWord = card.querySelector('span.font-bold')?.textContent?.trim() || '';
    const ipa = card.querySelector('div.font-mono.text-xs')?.textContent?.trim() || '';

    // Extract actual definition/sense text only (excluding header word/POS/IPA and footer chrome)
    const bodyEl = card.querySelector(':scope > div.py-2\\.5') || card;
    const senseSpans = Array.from(
      bodyEl.querySelectorAll('.space-y-1\\.5 .space-y-1\\.5 span.font-medium'),
    )
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);
    const singleDefParagraphs = Array.from(bodyEl.querySelectorAll(':scope > p'))
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);
    const definitionTexts = senseSpans.length > 0 ? senseSpans : singleDefParagraphs;
    const definitionText = definitionTexts.join(' | ');

    return {
      visible,
      inViewport,
      hitTestOk,
      hitTag: hitEl ? `${hitEl.tagName.toLowerCase()}.${String(hitEl.className || '').slice(0, 60)}` : 'null',
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      style: {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
      },
      headerWord,
      ipa,
      definitionText,
    };
  });

  assert(cardData, '.exam-lookup-card[role="dialog"] disappeared before reading');
  assert(
    cardData.visible,
    `Lookup card must be visible within viewport, got style=${JSON.stringify(cardData.style)} rect=${JSON.stringify(cardData.rect)}`,
  );
  assert(
    cardData.hitTestOk,
    `Lookup card center is occluded/not hit-testable (hit=${cardData.hitTag}, rect=${JSON.stringify(cardData.rect)})`,
  );
  assert(
    expectedWordRegex.test(cardData.headerWord),
    `Expected lookup card header "${cardData.headerWord}" to match /${expectedWordRegex.source}/i`,
  );
  assert(
    /\/[^/]+\//.test(cardData.ipa),
    `Expected valid IPA /.../ in lookup card, got "${cardData.ipa}"`,
  );
  assert(
    cardData.definitionText.length > 0,
    `Expected non-empty definition/sense text inside lookup card, got "${cardData.definitionText}" (header="${cardData.headerWord}", ipa="${cardData.ipa}")`,
  );
  assert(
    !cardData.definitionText.includes('Từ vựng tiếng Anh. Bấm "Lưu vào Sổ từ"') &&
      !cardData.definitionText.includes('Cụm từ tiếng Anh. Bấm "Lưu vào Sổ từ"') &&
      !cardData.definitionText.includes('LingoPro SRS'),
    `Lookup card rendered generic fallback or footer chrome instead of real definition: "${cardData.definitionText}"`,
  );

  // Derive fixture expectations in hermetic mode if caller did not supply custom regexes
  const fixture = !liveLookup ? resolveFixtureEntry(cardData.headerWord) : null;
  const defRe =
    expectedDefRegex || (fixture ? new RegExp(escapeRegExp(fixture.definition), 'i') : null);
  const ipaRe =
    expectedIpaRegex || (fixture ? new RegExp(escapeRegExp(fixture.ipa), 'i') : null);

  if (defRe) {
    assert(
      defRe.test(cardData.definitionText),
      `Expected definition "${cardData.definitionText}" to match /${defRe.source}/i`,
    );
  }
  if (ipaRe) {
    assert(
      ipaRe.test(cardData.ipa),
      `Expected IPA "${cardData.ipa}" to match /${ipaRe.source}/i`,
    );
  }

  return cardData;
}

async function closeLookupCard(page) {
  const closeBtn = await page.$('.exam-lookup-card button[aria-label="Đóng bảng tra từ"]');
  assert(closeBtn, 'Expected close button (.exam-lookup-card button[aria-label="Đóng bảng tra từ"]) to exist');
  const box = await closeBtn.boundingBox();
  assert(box && box.width > 0 && box.height > 0, 'Close button has invalid bounding box');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(
    () => !document.querySelector('.exam-lookup-card[role="dialog"]'),
    { timeout: 3000 },
  );
}

// ── Case 1: /grammar?topic=verb-to-be ──
async function runCase1Grammar(page, origin, tracker) {
  await page.goto(`${origin}/grammar?topic=verb-to-be`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { timeout: 8000 });
  await page.waitForFunction(
    () => (document.querySelector('[role="dialog"][aria-modal="true"]')?.textContent || '').includes('I am a student'),
    { timeout: 8000 },
  );

  await waitForExamTrigger(page, '[role="dialog"][aria-modal="true"] .exam-lookup-trigger', 4000);
  const startIdx = tracker.lookupRequests.length;
  const word = await clickTriggerMatching(
    page,
    '[role="dialog"][aria-modal="true"]',
    /^(student|happy)$/i,
  );
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(word)}$`, 'i'));
  await closeLookupCard(page);

  const reqs = tracker.sliceSince(startIdx);
  const lookups = reqs.filter((r) => r.pathname === '/api/dictionary/lookup');
  const externals = reqs.filter((r) => r.pathname === '/api/dictionary/external');
  assert.equal(lookups.length, 1, `Expected 1 /api/dictionary/lookup request, got ${lookups.length}`);
  assert.equal(externals.length, 0, `Expected 0 /api/dictionary/external requests, got ${externals.length}`);
}

// ── Case 2: /practice/reading-library?article=voa-a1-morning-coffee-tradition ──
async function runCase2ReadingLibrary(page, origin) {
  await page.goto(`${origin}/practice/reading-library?article=voa-a1-morning-coffee-tradition`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('.prose p', { timeout: 8000 });
  await waitForExamTrigger(page, '.prose .exam-lookup-trigger', 4000);
  const word = await clickTriggerMatching(page, '.prose', /^(morning|coffee)$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(word)}$`, 'i'));
  await closeLookupCard(page);
}

// ── Case 3: /practice/daily-reading ──
async function runCase3DailyReading(page, origin) {
  await page.goto(`${origin}/practice/daily-reading`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.whitespace-pre-line', { timeout: 8000 });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('.whitespace-pre-line')).some((el) =>
        (el.textContent || '').includes('achieves'),
      ),
    { timeout: 8000 },
  );

  // Verify bold/highlighted target word preserves emphasis AND uses .exam-lookup-trigger
  await waitForExamTrigger(
    page,
    '.whitespace-pre-line strong .exam-lookup-trigger, .whitespace-pre-line mark .exam-lookup-trigger, .whitespace-pre-line b .exam-lookup-trigger',
    4000,
  );
  const boldWord = await clickTriggerMatching(
    page,
    '.whitespace-pre-line strong, .whitespace-pre-line mark, .whitespace-pre-line b',
    /^achieves$/i,
  );
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(boldWord)}$`, 'i'));
  await closeLookupCard(page);

  // Verify plain unbolded English word also has .exam-lookup-trigger
  const plainWord = await clickTriggerMatching(
    page,
    '.whitespace-pre-line',
    /^(routine|coffee|morning)$/i,
    'strong, mark, b',
  );
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(plainWord)}$`, 'i'));
  await closeLookupCard(page);
}

// ── Case 4: /practice/listening/video-short-daily-life ──
async function runCase4Listening(page, origin) {
  await page.goto(`${origin}/practice/listening/video-short-daily-life`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('[data-cue-index="0"]', { timeout: 8000 });
  await waitForExamTrigger(page, '[data-cue-index="0"] .exam-lookup-trigger', 4000);
  const word = await clickTriggerMatching(page, '[data-cue-index="0"]', /^(routine|lesson|daily)$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(word)}$`, 'i'));
  await closeLookupCard(page);
}

// ── Case 5: /flashcard 3D flip + non-flip invariant ──
async function runCase5FlashcardFlip(page, origin) {
  await page.goto(`${origin}/flashcard`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Lật thẻ')),
    { timeout: 8000 },
  );

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Lật thẻ'),
    );
    btn?.click();
  });

  await page.waitForFunction(
    () => document.querySelector('div[style*="preserve-3d"]')?.style.transform === 'rotateY(180deg)',
    { timeout: 5000 },
  );
  await waitForExamTrigger(page, '.group\\/example .exam-lookup-trigger', 4000);

  const word = await clickTriggerMatching(page, '.group\\/example', /^(goals?|achieved|year)$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(word)}$`, 'i'));

  const transformAfter = await page.evaluate(
    () => document.querySelector('div[style*="preserve-3d"]')?.style.transform || '',
  );
  assert.equal(
    transformAfter,
    'rotateY(180deg)',
    `Flashcard flipped unexpectedly after tapping example word: transform="${transformAfter}"`,
  );
  await closeLookupCard(page);
}

// ── Case 6: /dictionary cold tap vs same-page repeat vs cross-surface /flashcard cached tap ──
async function runCase6DictionaryCacheLatency(page, origin, tracker, { liveLookup = false } = {}) {
  await page.goto(`${origin}/dictionary`, { waitUntil: 'networkidle0' });
  const inputSel = 'input[placeholder*="Gõ từ"]';
  await page.waitForSelector(inputSel, { timeout: 8000 });
  await page.type(inputSel, 'achieve');
  await page.click('button[type="submit"]');

  await page.waitForSelector('.group\\/example .exam-lookup-trigger', { timeout: 8000 });
  // Allow debounced autocomplete/suggest requests triggered by typing to settle before cold tap
  await new Promise((resolve) => setTimeout(resolve, 250));

  // Cold miss tap on "goal" or "goals" (works for both hermetic fixture & live vocab-stages-v1.json)
  let coldStartIdx = tracker.lookupRequests.length;
  let coldExtIdx = tracker.externalRequests.length;
  let tColdStart = 0;
  const tappedWord = await clickTriggerMatching(page, '.group\\/example', /^goals?$/i, {
    onBeforeClick: () => {
      coldStartIdx = tracker.lookupRequests.length;
      coldExtIdx = tracker.externalRequests.length;
      tColdStart = performance.now();
    },
  });
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(tappedWord)}$`, 'i'), {
    liveLookup,
  });
  const coldMs = Number((performance.now() - tColdStart).toFixed(2));

  const coldRequests = tracker
    .sliceSince(coldStartIdx)
    .filter((r) => r.pathname.startsWith('/api/dictionary/') || r.pathname === '/api/translate');
  const coldLookups = coldRequests.filter((r) => r.pathname === '/api/dictionary/lookup');
  const coldExternals = coldRequests.filter((r) => r.pathname === '/api/dictionary/external');
  const coldAiLookups = coldRequests.filter((r) => r.pathname.startsWith('/api/dictionary/ai-'));
  const coldTranslates = coldRequests.filter((r) => r.pathname === '/api/translate');
  const coldExtAll = tracker.sliceExternalSince(coldExtIdx);
  const coldExternalDict = coldExtAll.filter((r) => r.isDictOrTranslate);
  const coldUnexpectedExt = coldExtAll.filter((r) => !r.allowlisted);

  assert.equal(
    coldRequests.length,
    1,
    `Expected totalLookupOrTranslateCalls === 1 on cold tap for "${tappedWord}", got ${coldRequests.length}: ${JSON.stringify(coldRequests)}`,
  );
  assert.equal(
    coldLookups.length,
    1,
    `Expected exactly 1 cold /api/dictionary/lookup request for "${tappedWord}", got ${coldLookups.length}`,
  );
  assert.equal(
    coldExternals.length,
    0,
    `Expected 0 client /api/dictionary/external requests, got ${coldExternals.length}`,
  );
  assert.equal(
    coldAiLookups.length,
    0,
    `Expected 0 /api/dictionary/ai-* requests, got ${coldAiLookups.length}`,
  );
  assert.equal(
    coldTranslates.length,
    0,
    `Expected 0 /api/translate requests, got ${coldTranslates.length}`,
  );
  assert.equal(
    coldExternalDict.length,
    0,
    `Expected 0 external dictionary/translate requests on cold tap, got ${JSON.stringify(coldExternalDict)}`,
  );
  assert.equal(
    coldUnexpectedExt.length,
    0,
    `Expected 0 unexpected external requests on cold tap, got ${JSON.stringify(coldUnexpectedExt)}`,
  );

  await closeLookupCard(page);

  const exactWordRe = new RegExp(`^${escapeRegExp(tappedWord)}$`, 'i');

  // Same-page repeat tap on exact same word -> 0 network requests
  let repeatStartIdx = tracker.lookupRequests.length;
  let repeatExtIdx = tracker.externalRequests.length;
  let tRepeatStart = 0;
  await clickTriggerMatching(page, '.group\\/example', exactWordRe, {
    onBeforeClick: () => {
      repeatStartIdx = tracker.lookupRequests.length;
      repeatExtIdx = tracker.externalRequests.length;
      tRepeatStart = performance.now();
    },
  });
  await waitForLookupCardSettled(page, exactWordRe, { liveLookup });
  const samePageCachedMs = Number((performance.now() - tRepeatStart).toFixed(2));

  const repeatRequests = tracker
    .sliceSince(repeatStartIdx)
    .filter((r) => r.pathname.startsWith('/api/dictionary/') || r.pathname === '/api/translate');
  const repeatExtAll = tracker.sliceExternalSince(repeatExtIdx);
  const repeatExternalDict = repeatExtAll.filter((r) => r.isDictOrTranslate);
  const repeatUnexpectedExt = repeatExtAll.filter((r) => !r.allowlisted);
  assert.equal(
    repeatRequests.length,
    0,
    `Expected 0 lookup/translate requests on same-page repeat tap, got ${JSON.stringify(repeatRequests)}`,
  );
  assert.equal(
    repeatExternalDict.length,
    0,
    `Expected 0 external dictionary/translate requests on same-page repeat tap, got ${JSON.stringify(repeatExternalDict)}`,
  );
  assert.equal(
    repeatUnexpectedExt.length,
    0,
    `Expected 0 unexpected external requests on same-page repeat tap, got ${JSON.stringify(repeatUnexpectedExt)}`,
  );

  await closeLookupCard(page);

  // Navigate in same page/tab (preserving sessionStorage) to /flashcard
  await page.goto(`${origin}/flashcard`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Lật thẻ')),
    { timeout: 8000 },
  );
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Lật thẻ'),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () => document.querySelector('div[style*="preserve-3d"]')?.style.transform === 'rotateY(180deg)',
    { timeout: 5000 },
  );
  await waitForExamTrigger(page, '.group\\/example .exam-lookup-trigger', 4000);

  let crossStartIdx = tracker.lookupRequests.length;
  let crossExtIdx = tracker.externalRequests.length;
  let tCrossStart = 0;
  await clickTriggerMatching(page, '.group\\/example', exactWordRe, {
    onBeforeClick: () => {
      crossStartIdx = tracker.lookupRequests.length;
      crossExtIdx = tracker.externalRequests.length;
      tCrossStart = performance.now();
    },
  });
  await waitForLookupCardSettled(page, exactWordRe, { liveLookup });
  const crossSurfaceCachedMs = Number((performance.now() - tCrossStart).toFixed(2));

  const crossRequests = tracker
    .sliceSince(crossStartIdx)
    .filter((r) => r.pathname.startsWith('/api/dictionary/') || r.pathname === '/api/translate');
  const crossExtAll = tracker.sliceExternalSince(crossExtIdx);
  const crossExternalDict = crossExtAll.filter((r) => r.isDictOrTranslate);
  const crossUnexpectedExt = crossExtAll.filter((r) => !r.allowlisted);
  assert.equal(
    crossRequests.length,
    0,
    `Expected 0 lookup/translate requests on cross-surface cached tap, got ${JSON.stringify(crossRequests)}`,
  );
  assert.equal(
    crossExternalDict.length,
    0,
    `Expected 0 external dictionary/translate requests on cross-surface cached tap, got ${JSON.stringify(crossExternalDict)}`,
  );
  assert.equal(
    crossUnexpectedExt.length,
    0,
    `Expected 0 unexpected external requests on cross-surface cached tap, got ${JSON.stringify(crossUnexpectedExt)}`,
  );

  await closeLookupCard(page);

  const latencySummary = `coldMs=${coldMs}ms, samePageCachedMs=${samePageCachedMs}ms, crossSurfaceCachedMs=${crossSurfaceCachedMs}ms`;
  console.log(`    [latency] 6-dictionary-cache-latency: ${latencySummary}`);
  return latencySummary;
}

// ── Case 7: /toeic/learn?lesson=toeic-grammar-01-parts-of-speech + QuickQuiz + IT-7.5 ──
async function runCase7ToeicLearnQuickQuiz(page, origin) {
  await page.goto(`${origin}/toeic/learn?lesson=toeic-grammar-01-parts-of-speech`, {
    waitUntil: 'networkidle0',
  });
  const quizSectionSel = 'section[aria-label="Khối câu hỏi kiểm tra nhanh lý thuyết"]';
  const optionSelector = `${quizSectionSel} [role="radiogroup"] button, ${quizSectionSel} [role="radiogroup"] [role="button"], ${quizSectionSel} [role="radiogroup"] [role="radio"]`;
  await page.waitForSelector(quizSectionSel, { timeout: 8000 });

  // 1. Lesson example tap opens .exam-lookup-card
  const exampleWord = await clickTriggerMatching(page, 'article', /^committee$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(exampleWord)}$`, 'i'));
  await closeLookupCard(page);

  // 2. Tap .exam-lookup-trigger inside a ToeicQuickQuiz option -> card opens WITHOUT selecting option
  const optionTriggerWord = await clickTriggerMatching(
    page,
    `${quizSectionSel} [role="radiogroup"]`,
    /^(equip|equipment)$/i,
  );
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(optionTriggerWord)}$`, 'i'));

  const selectedPrematurely = await page.evaluate((quizSel) => {
    const sec = document.querySelector(quizSel);
    if (!sec) return false;
    const text = sec.textContent || '';
    return text.includes('Xem giải thích chi tiết') || text.includes('Chính xác!') || text.includes('Chưa chính xác.');
  }, quizSectionSel);
  assert.equal(
    selectedPrematurely,
    false,
    'Clicking .exam-lookup-trigger inside ToeicQuickQuiz option must NOT select/answer the option',
  );
  await closeLookupCard(page);

  // 3. Click an option outside .exam-lookup-trigger (letter badge) -> reveal Vietnamese explanation
  const clickedOption = await page.evaluate((optSel) => {
    const btn = document.querySelector(optSel);
    if (!btn) return false;
    const badge = btn.querySelector('span');
    if (badge) {
      badge.click();
    } else {
      btn.click();
    }
    return true;
  }, optionSelector);
  assert(clickedOption, 'Could not find ToeicQuickQuiz option button');

  await page.waitForFunction(
    (quizSel) => (document.querySelector(quizSel)?.textContent || '').includes('Xem giải thích chi tiết'),
    { timeout: 4000 },
    quizSectionSel,
  );

  await page.evaluate((quizSel) => {
    const sec = document.querySelector(quizSel);
    const btn = Array.from(sec?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Xem giải thích chi tiết'),
    );
    btn?.click();
  }, quizSectionSel);

  await page.waitForFunction(
    (quizSel) => (document.querySelector(quizSel)?.textContent || '').includes('Giải thích chi tiết:'),
    { timeout: 4000 },
    quizSectionSel,
  );

  // IT-7.5: 0 .exam-lookup-trigger inside Vietnamese explanation block
  const viExplainTriggers = await page.evaluate((quizSel) => {
    const sec = document.querySelector(quizSel);
    const viBlock = sec?.querySelector('.whitespace-pre-line');
    return viBlock ? viBlock.querySelectorAll('.exam-lookup-trigger').length : -1;
  }, quizSectionSel);
  assert.equal(
    viExplainTriggers,
    0,
    `IT-7.5 violation: expected 0 .exam-lookup-trigger inside ToeicQuickQuiz Vietnamese explanation, found ${viExplainTriggers}`,
  );

  // 4. Post-answer option .exam-lookup-trigger must still open lookup card (disabled={isAnswered} must not block!)
  const postAnswerWord = await clickTriggerMatching(
    page,
    `${quizSectionSel} [role="radiogroup"]`,
    /^equipment$/i,
  );
  try {
    await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(postAnswerWord)}$`, 'i'));
  } catch (err) {
    throw new Error(
      `Post-answer option .exam-lookup-trigger failed to open lookup card (check disabled={isAnswered} on ToeicQuickQuiz option button): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  await closeLookupCard(page);
}

// ── Case 8: /toeic/exam/estudyme-test-1?mode=practice&part=5 + /thpt/reading/rd-10-1 ──
async function runCase8ExamPostRevealThpt(page, origin) {
  // Part A: TOEIC Practice Part 5
  await page.goto(`${origin}/toeic/exam/estudyme-test-1?mode=practice&part=5`, {
    waitUntil: 'networkidle0',
  });
  const radioOptionSel =
    '[role="radiogroup"] button, [role="radiogroup"] [role="button"], [role="radiogroup"] [role="radio"]';
  await page.waitForSelector(radioOptionSel, { timeout: 8000 });

  // Pre-reveal: 0 .exam-lookup-trigger in question prompt / options
  const preRevealCount = await page.evaluate(() => {
    const radios = document.querySelector('[role="radiogroup"]');
    const promptTriggers = Array.from(document.querySelectorAll('.exam-lookup-trigger')).filter(
      (el) => {
        const text = el.closest('p, div')?.textContent || '';
        return text.includes('committee') || Boolean(el.closest('[role="radiogroup"]'));
      },
    );
    return (radios?.querySelectorAll('.exam-lookup-trigger').length || 0) + promptTriggers.length;
  });
  assert.equal(
    preRevealCount,
    0,
    `Expected 0 .exam-lookup-trigger pre-reveal on TOEIC exam, found ${preRevealCount}`,
  );

  // Answer option C to reveal explanation & interactive words
  await page.evaluate((optSel) => {
    const buttons = Array.from(document.querySelectorAll(optSel));
    const optC = buttons.find((b) => b.textContent?.includes('approval')) || buttons[0];
    optC?.click();
  }, radioOptionSel);

  await page.waitForFunction(
    () => (document.body.textContent || '').includes('Phân tích ngữ pháp & Bản dịch tiếng Việt'),
    { timeout: 6000 },
  );

  // Post-reveal prompt & option triggers must exist and open lookup card
  await waitForExamTrigger(page, '[role="radiogroup"] .exam-lookup-trigger', 4000);
  const promptWord = await clickTriggerMatching(page, 'main', /^committee$/i, '[role="radiogroup"]');
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(promptWord)}$`, 'i'));
  await closeLookupCard(page);

  const optionWord = await clickTriggerMatching(page, '[role="radiogroup"]', /^approval$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(optionWord)}$`, 'i'));
  await closeLookupCard(page);

  // IT-7.5: Vietnamese explanation must have 0 .exam-lookup-trigger
  const toeicViTriggers = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.whitespace-pre-line'));
    return blocks.reduce((sum, el) => sum + el.querySelectorAll('.exam-lookup-trigger').length, 0);
  });
  assert.equal(
    toeicViTriggers,
    0,
    `IT-7.5 violation: expected 0 .exam-lookup-trigger in TOEIC Vietnamese explanation, found ${toeicViTriggers}`,
  );

  // Part B: THPT Reading
  await page.goto(`${origin}/thpt/reading/rd-10-1`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.whitespace-pre-line', { timeout: 8000 });
  await page.waitForFunction(
    () =>
      (document.querySelector('.whitespace-pre-line')?.textContent || '').includes(
        'Vietnamese families',
      ),
    { timeout: 8000 },
  );
  await waitForExamTrigger(page, '.whitespace-pre-line .exam-lookup-trigger', 4000);
  const thptWord = await clickTriggerMatching(page, '.whitespace-pre-line', /^(family|meals?)$/i);
  await waitForLookupCardSettled(page, new RegExp(`^${escapeRegExp(thptWord)}$`, 'i'));
  await closeLookupCard(page);

  // Advance to Q2 ("closer = gần gũi hơn = more connected.") and assert IT-7.5 on THPT Vietnamese q.explain
  await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll('[role="radiogroup"] [role="radio"], [role="radiogroup"] button, .grid button'),
    );
    const opt = buttons.find((b) => b.textContent?.includes('Family meals are important')) || buttons[0];
    opt?.click();
  });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Kiểm tra'),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll('button')).some((b) => b.textContent?.includes('Tiếp tục')),
    { timeout: 4000 },
  );
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tiếp tục'),
    );
    btn?.click();
  });

  await page.waitForFunction(
    () => (document.body.textContent || '').includes('more connected'),
    { timeout: 4000 },
  );
  await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll('[role="radiogroup"] [role="radio"], [role="radiogroup"] button, .grid button'),
    );
    const opt = buttons.find((b) => b.textContent?.includes('more connected')) || buttons[0];
    opt?.click();
  });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Kiểm tra'),
    );
    btn?.click();
  });
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('.rounded-lg.bg-muted')).some((p) =>
        (p.textContent || '').includes('closer = gần gũi hơn'),
      ),
    { timeout: 4000 },
  );

  const thptExplainTriggers = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('.rounded-lg.bg-muted'));
    if (blocks.length === 0) return -1;
    return blocks.reduce((sum, el) => sum + el.querySelectorAll('.exam-lookup-trigger').length, 0);
  });
  assert.equal(
    thptExplainTriggers,
    0,
    `IT-7.5 violation: expected 0 .exam-lookup-trigger inside THPT Vietnamese q.explain, found ${thptExplainTriggers}`,
  );
}

const CASE_RUNNERS = {
  '1-grammar': (page, origin, tracker) => runCase1Grammar(page, origin, tracker),
  '2-reading-library': (page, origin) => runCase2ReadingLibrary(page, origin),
  '3-daily-reading': (page, origin) => runCase3DailyReading(page, origin),
  '4-listening': (page, origin) => runCase4Listening(page, origin),
  '5-flashcard-flip': (page, origin) => runCase5FlashcardFlip(page, origin),
  '6-dictionary-cache-latency': (page, origin, tracker, opts) =>
    runCase6DictionaryCacheLatency(page, origin, tracker, opts),
  '7-toeic-learn-quickquiz': (page, origin) => runCase7ToeicLearnQuickQuiz(page, origin),
  '8-exam-post-reveal-thpt': (page, origin) => runCase8ExamPostRevealThpt(page, origin),
};

async function main() {
  const casesToRun = parseCliArgs(process.argv.slice(2));
  const liveLookup = process.env.E2E_LIVE_LOOKUP === '1';

  let browser = null;
  let activeServer = null;
  let cleanedUp = false;
  const cleanupResources = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (browser) {
      await browser.close().catch(() => {});
      browser = null;
    }
    if (activeServer) {
      await stopServer(activeServer).catch(() => {});
      activeServer = null;
    }
  };

  const onSignal = (sig) => {
    void cleanupResources().finally(() => {
      process.exit(sig === 'SIGINT' ? 130 : 143);
    });
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  const results = [];

  try {
    const { origin, server, mode } = await resolveServerTarget(process.cwd(), (spawned) => {
      activeServer = spawned;
    });
    activeServer = server;
    console.log(
      `[tap-to-lookup E2E] target=${origin} serverMode=${mode} liveLookup=${liveLookup} cases=${casesToRun.join(',')}`,
    );

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const caseId of casesToRun) {
      const t0 = performance.now();
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setBypassServiceWorker(true);
      await installBrowserInstrumentations(page);

      const obs = attachObservability(page, origin);
      const tracker = await attachHermeticInterceptor(page, origin, obs, { liveLookup });

      try {
        const detail = await CASE_RUNNERS[caseId](page, origin, tracker, { liveLookup });
        await assertCleanObservability(obs, page, caseId);
        const durationMs = Math.round(performance.now() - t0);
        const note = detail ? ` (${detail})` : '';
        console.log(`  PASS  ${caseId} [${durationMs}ms]${note}`);
        results.push({ caseId, status: 'PASS', durationMs, detail: detail || '' });
      } catch (err) {
        const durationMs = Math.round(performance.now() - t0);
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  FAIL  ${caseId} [${durationMs}ms]: ${msg}`);
        results.push({ caseId, status: 'FAIL', durationMs, error: msg });
      } finally {
        await context.close().catch(() => {});
      }
    }
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    await cleanupResources();
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`[tap-to-lookup E2E] Summary: ${passed}/${results.length} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
