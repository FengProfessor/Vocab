import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import {
  COHORT_PROMO_ACTIVE_ISO,
  attachStudentFixtureInterceptor,
  createPersonaConfig,
  installBrowserInstrumentations,
  startProductionServer,
  stopProductionServer,
} from './fixtures/student-dashboard-fixtures.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ALL_CASE_IDS = [
  // Tier 1 (60)
  'T1-F1-01', 'T1-F1-02', 'T1-F1-03', 'T1-F1-04', 'T1-F1-05',
  'T1-F2-01', 'T1-F2-02', 'T1-F2-03', 'T1-F2-04', 'T1-F2-05',
  'T1-F3-01', 'T1-F3-02', 'T1-F3-03', 'T1-F3-04', 'T1-F3-05',
  'T1-F4-01', 'T1-F4-02', 'T1-F4-03', 'T1-F4-04', 'T1-F4-05',
  'T1-F5-01', 'T1-F5-02', 'T1-F5-03', 'T1-F5-04', 'T1-F5-05',
  'T1-F6-01', 'T1-F6-02', 'T1-F6-03', 'T1-F6-04', 'T1-F6-05',
  'T1-F7-01', 'T1-F7-02', 'T1-F7-03', 'T1-F7-04', 'T1-F7-05',
  'T1-F8-01', 'T1-F8-02', 'T1-F8-03', 'T1-F8-04', 'T1-F8-05',
  'T1-F9-01', 'T1-F9-02', 'T1-F9-03', 'T1-F9-04', 'T1-F9-05',
  'T1-F10-01', 'T1-F10-02', 'T1-F10-03', 'T1-F10-04', 'T1-F10-05',
  'T1-F11-01', 'T1-F11-02', 'T1-F11-03', 'T1-F11-04', 'T1-F11-05',
  'T1-F12-01', 'T1-F12-02', 'T1-F12-03', 'T1-F12-04', 'T1-F12-05',
  // Tier 2 (60)
  'T2-F1-01', 'T2-F1-02', 'T2-F1-03', 'T2-F1-04', 'T2-F1-05',
  'T2-F2-01', 'T2-F2-02', 'T2-F2-03', 'T2-F2-04', 'T2-F2-05',
  'T2-F3-01', 'T2-F3-02', 'T2-F3-03', 'T2-F3-04', 'T2-F3-05',
  'T2-F4-01', 'T2-F4-02', 'T2-F4-03', 'T2-F4-04', 'T2-F4-05',
  'T2-F5-01', 'T2-F5-02', 'T2-F5-03', 'T2-F5-04', 'T2-F5-05',
  'T2-F6-01', 'T2-F6-02', 'T2-F6-03', 'T2-F6-04', 'T2-F6-05',
  'T2-F7-01', 'T2-F7-02', 'T2-F7-03', 'T2-F7-04', 'T2-F7-05',
  'T2-F8-01', 'T2-F8-02', 'T2-F8-03', 'T2-F8-04', 'T2-F8-05',
  'T2-F9-01', 'T2-F9-02', 'T2-F9-03', 'T2-F9-04', 'T2-F9-05',
  'T2-F10-01', 'T2-F10-02', 'T2-F10-03', 'T2-F10-04', 'T2-F10-05',
  'T2-F11-01', 'T2-F11-02', 'T2-F11-03', 'T2-F11-04', 'T2-F11-05',
  'T2-F12-01', 'T2-F12-02', 'T2-F12-03', 'T2-F12-04', 'T2-F12-05',
  // Tier 3 (14)
  'T3-01', 'T3-02', 'T3-03', 'T3-04', 'T3-05', 'T3-06', 'T3-07',
  'T3-08', 'T3-09', 'T3-10', 'T3-11', 'T3-12', 'T3-13', 'T3-14',
  // Tier 4 (7)
  'T4-01', 'T4-02', 'T4-03', 'T4-04', 'T4-05', 'T4-06', 'T4-07',
];

function parseCliFilters(argv) {
  let tierFilter = null;
  let caseFilter = null;
  for (const arg of argv) {
    if (arg.startsWith('--tier=')) {
      tierFilter = arg.slice('--tier='.length).trim();
      if (!tierFilter) {
        throw new Error('CLI filter --tier= requires a non-empty tier (1, 2, 3, or 4)');
      }
    } else if (arg.startsWith('--case=')) {
      caseFilter = arg.slice('--case='.length).trim().toUpperCase();
      if (!caseFilter) {
        throw new Error('CLI filter --case= requires a non-empty case ID');
      }
    } else {
      throw new Error(`Unsupported CLI argument "${arg}". Supported: --tier=<1|2|3|4>, --case=<CASE_ID>`);
    }
  }
  return { tierFilter, caseFilter };
}

function matchesFilters(id, { tierFilter, caseFilter }) {
  if (caseFilter && id !== caseFilter) return false;
  if (tierFilter && !id.startsWith(`T${tierFilter}-`)) return false;
  return true;
}

function shouldRunGroup(caseIds, filters) {
  return caseIds.some((id) => matchesFilters(id, filters));
}

/**
 * Runs a callback inside an isolated BrowserContext with clean storage,
 * CSP/pageerror/console auditing, and deterministic fixture interception.
 */
async function withIsolatedContext(
  browser,
  origin,
  scenario,
  {
    viewport = { width: 1280, height: 800 },
    instrumentation = {},
    allowConsolePatterns = [],
  } = {},
  fn,
) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const cspViolations = [];
  const pageErrors = [];
  const consoleErrors = [];

  await page.exposeFunction('__onCspViolation', (entry) => {
    cspViolations.push(entry);
  });
  page.on('pageerror', (err) => {
    pageErrors.push(`${err.name}: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const allowed = allowConsolePatterns.some((pat) => pat.test(text));
      if (!allowed) consoleErrors.push(text);
    }
  });

  try {
    await page.setViewport(viewport);
    await page.setBypassServiceWorker(true);
    await installBrowserInstrumentations(page, instrumentation);
    const tracker = await attachStudentFixtureInterceptor(page, origin, scenario);
    const result = await fn({ page, context, tracker });
    const windowCsp = await page.evaluate(() => window.__cspViolations || []);
    const allCsp = [...cspViolations];
    for (const entry of windowCsp) {
      if (!allCsp.includes(entry)) allCsp.push(entry);
    }
    assert.deepEqual(allCsp, [], `zero CSP violations expected, got: ${allCsp.join('; ')}`);
    assert.deepEqual(pageErrors, [], `zero uncaught pageerrors expected, got: ${pageErrors.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `zero unexpected console.error expected, got: ${consoleErrors.join('; ')}`);
    return result;
  } finally {
    await context.close();
  }
}

async function openRoute(page, origin, routePath, waitUntil = 'networkidle0') {
  const response = await page.goto(`${origin}${routePath}`, { waitUntil, timeout: 30000 });
  assert(response, `${routePath}: navigation response must exist`);
  return response;
}

function assertSecurityHeaders(response, route) {
  assert.equal(response.status(), 200, `${route}: expected HTTP 200`);
  const headers = response.headers();
  const csp = headers['content-security-policy'] || '';
  assert(csp.length > 0, `${route}: Content-Security-Policy header must be set`);
  assert(!csp.includes("'unsafe-eval'"), `${route}: CSP must omit 'unsafe-eval'`);
  assert.equal(headers['x-content-type-options'], 'nosniff', `${route}: nosniff expected`);
  assert.equal(headers['x-frame-options'], 'SAMEORIGIN', `${route}: SAMEORIGIN expected`);
}

async function inspectPriorityBanners(page) {
  return page.evaluate(() => {
    const isVisibleEl = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const freeQuotaEl =
      Array.from(document.querySelectorAll('a[href^="/upgrade?from=banner_quota"]')).find((el) =>
        isVisibleEl(el.closest('div.relative, section, div')),
      ) || null;
    const cohortPromoEl =
      Array.from(document.querySelectorAll('a[href^="/upgrade?from=cohort_promo"]')).find((el) =>
        isVisibleEl(el.closest('div[role="status"], div.relative, div')),
      ) || null;
    const challengeEl =
      Array.from(document.querySelectorAll('a[href^="/challenge/"]')).find((el) =>
        isVisibleEl(el.closest('div, section')),
      ) || null;
    const notifyNodes = Array.from(document.querySelectorAll('[data-onboarding="notify"]'));
    const notifyEl =
      notifyNodes.find((el) => {
        if (!isVisibleEl(el)) return false;
        const txt = el.textContent || '';
        return txt.includes('Bật nhắc ôn tập') || txt.includes('Thông báo bị gián đoạn');
      }) || null;

    const visible = [];
    if (freeQuotaEl) visible.push('FreeQuotaBanner');
    if (cohortPromoEl) visible.push('CohortProPromoBanner');
    if (challengeEl) visible.push('ChallengeWidget');
    if (notifyEl) visible.push('EnableNotifications');

    return {
      visible,
      count: visible.length,
      hasNotifyAnchor: notifyNodes.length > 0,
    };
  });
}

async function inspectDashboardCommon(page) {
  return page.evaluate(() => {
    const text = document.body.innerText || '';
    const isVisible = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };

    const learnEls = Array.from(document.querySelectorAll('[data-onboarding="learn"]'));
    const reviewEls = Array.from(document.querySelectorAll('[data-onboarding="review"]'));
    const progressEls = Array.from(document.querySelectorAll('[data-onboarding="progress"]'));
    const vaultEls = Array.from(document.querySelectorAll('[data-onboarding="vault"]'));
    const notifyEls = Array.from(document.querySelectorAll('[data-onboarding="notify"]'));
    const mobileNavEl = document.querySelector('[data-onboarding="mobile-nav"]');

    const packLinks = Array.from(document.querySelectorAll('main a[href*="/flashcard?mode=learn&ids="]'));
    const vstepLinks = document.querySelectorAll('main a[href="/vstep"]').length;
    const vnuLinks = document.querySelectorAll('main a[href="/vnu-bac-3"]').length;
    const grammarLinks = document.querySelectorAll('main a[href="/grammar"]').length;
    const speakingLinks = document.querySelectorAll('main a[href="/student/speaking/foundation"]').length;
    const practiceLinks = document.querySelectorAll('main a[href="/practice"]').length;
    const vaultLinks = document.querySelectorAll('main a[href="/student/vault"]').length;
    const mainButtons = Array.from(document.querySelectorAll('main button'));
    const toeicButtons = mainButtons.filter(
      (b) => /\bTOEIC\b/i.test(b.textContent || '') || Boolean(b.querySelector('img[alt="TOEIC"]')),
    ).length;
    const readingButtons = mainButtons.filter((b) => /\bReading\b/i.test(b.textContent || '')).length;
    const listeningButtons = mainButtons.filter((b) => /\bListening\b/i.test(b.textContent || '')).length;
    const classroomSwitcher =
      document.body.innerText.includes('Về kho cá nhân') ||
      Array.from(document.querySelectorAll('main select, main [role="combobox"], main button')).some((el) =>
        /Lớp học|Tất cả kho|Kho cá nhân|TOEIC 650\+/i.test(el.textContent || ''),
      );

    const rectOf = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, width: r.width, height: r.height, visible: isVisible(el) };
    };

    return {
      text,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      counts: {
        learn: learnEls.length,
        review: reviewEls.length,
        progress: progressEls.length,
        vault: vaultEls.length,
        notify: notifyEls.length,
        packLinks: packLinks.length,
        vstepLinks,
        vnuLinks,
        grammarLinks,
        speakingLinks,
        practiceLinks,
        vaultLinks,
        toeicButtons,
        readingButtons,
        listeningButtons,
      },
      rects: {
        learn: rectOf(learnEls[0]),
        review: rectOf(reviewEls[0]),
        progress: rectOf(progressEls[0]),
        vault: rectOf(vaultEls[0]),
        mobileNav: rectOf(mobileNavEl),
      },
      forbidden: {
        ieltsText: /\bIELTS\b/i.test(text),
        ieltsBtn: Boolean(document.querySelector('button[aria-label*="IELTS"], img[alt="IELTS"], img[src*="ielts"]')),
        writingText: /\bWriting\b/i.test(text),
        writingBtn: Boolean(document.querySelector('button[aria-label*="Writing"]')),
        staticProBox: text.includes('Săn ngày PRO miễn phí') || text.includes('+3 ngày PRO / mốc'),
        badgeGridHeading: text.includes('Thành tích'),
        fullWordSearch: Boolean(document.querySelector('input[placeholder*="Tìm trong kho"]')),
        loadMoreBtn: text.includes('Tải thêm ('),
        comingSoonBadge: text.includes('Sắp có') || text.includes('Đang cập nhật'),
        meaningSelector: text.includes('Select the correct meaning to study'),
      },
      classroomSwitcher,
    };
  });
}

async function openReadingModalAndInspect(page) {
  const opened = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('main button'));
    const target = buttons.find((b) => /\bReading\b|Luyện đọc/i.test(b.textContent || ''));
    if (!target) return false;
    target.click();
    return true;
  });
  assert.equal(opened, true, 'Reading trigger button must exist');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  const modalInfo = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const links = Array.from(dialog.querySelectorAll('a[href]')).map((a) => ({
      href: a.getAttribute('href'),
      text: (a.textContent || '').trim(),
    }));
    const rect = dialog.getBoundingClientRect();
    return {
      title: dialog.getAttribute('aria-label') || dialog.textContent || '',
      links,
      hrefs: links.map((l) => l.href),
      fitsViewport: rect.width <= window.innerWidth && rect.height <= window.innerHeight,
    };
  });
  return modalInfo;
}

async function getStorageEntries(page) {
  return page.evaluate(() => ({
    local: Array.from({ length: localStorage.length }, (_, i) => [
      localStorage.key(i),
      localStorage.getItem(localStorage.key(i)),
    ]),
    session: Array.from({ length: sessionStorage.length }, (_, i) => [
      sessionStorage.key(i),
      sessionStorage.getItem(sessionStorage.key(i)),
    ]),
  }));
}

async function runSuite() {
  const filters = parseCliFilters(process.argv.slice(2));
  assert.equal(
    new Set(ALL_CASE_IDS).size,
    ALL_CASE_IDS.length,
    'ALL_CASE_IDS must contain unique case IDs',
  );
  const targetIds = ALL_CASE_IDS.filter((id) => matchesFilters(id, filters));
  assert(
    targetIds.length > 0,
    `CLI filter matched 0 test cases (tier=${filters.tierFilter ?? 'none'}, case=${filters.caseFilter ?? 'none'})`,
  );

  let server = null;
  let browser = null;
  const passed = [];
  const failed = [];
  const groupFailures = [];

  const runCaseGroup = async (caseIds, label, fn) => {
    if (!shouldRunGroup(caseIds, filters)) return;

    const targetedInGroup = caseIds.filter((id) => matchesFilters(id, filters));
    const bufferedPasses = new Map();

    const markGroupPass = (id, detail = '') => {
      assert(
        caseIds.includes(id),
        `Case ID "${id}" passed inside group "${label}" is not declared in group caseIds`,
      );
      if (!matchesFilters(id, filters)) return;
      if (!bufferedPasses.has(id)) {
        bufferedPasses.set(id, detail);
      }
    };

    try {
      await fn(markGroupPass);

      for (const id of targetedInGroup) {
        if (!bufferedPasses.has(id)) {
          throw new Error(`Case ${id} inside group "${label}" finished without calling markPass`);
        }
      }

      for (const [id, detail] of bufferedPasses.entries()) {
        assert(!passed.includes(id), `Duplicate pass commit for case ID "${id}"`);
        assert(!failed.some((f) => f.id === id), `Case ID "${id}" already failed`);
        passed.push(id);
        console.log(`[PASS] ${id}${detail ? ` — ${detail}` : ''}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.stack || err.message : String(err);
      groupFailures.push({ label, caseIds: targetedInGroup, error: msg });
      console.error(`[FAIL-GROUP] ${label}: ${err instanceof Error ? err.message : String(err)}`);
      for (const id of targetedInGroup) {
        if (!failed.some((f) => f.id === id)) {
          failed.push({ id, error: msg });
          console.error(`[FAIL] ${id} (${label}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  };

  try {
    const started = await startProductionServer(process.cwd());
    const origin = started.origin;
    server = started.server;
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // ── Group 1: Free Newbie Desktop Baseline + F1/F2/F4/F6/F7/F9/F10/F12 ──
    await runCaseGroup(
      [
        'T1-F1-01', 'T1-F2-04', 'T1-F3-03', 'T1-F4-01', 'T1-F4-02', 'T1-F4-03',
        'T1-F6-01', 'T1-F6-02', 'T1-F6-03', 'T1-F6-04', 'T1-F7-04', 'T1-F9-01',
        'T1-F9-03', 'T1-F9-04', 'T1-F10-01', 'T1-F12-01', 'T1-F12-04', 'T1-F12-05',
        'T2-F4-02', 'T2-F4-05', 'T2-F6-05', 'T2-F10-05',
      ],
      'Free Newbie Desktop Core',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          wordCount: 15,
          wordQuotaUsed: 20,
          studyStreak: 2,
          dailyGoal: 10,
          todayNewWords: 4,
          readingCompleted: 3,
          readingTotal: 619,
          inProgressPacks: 2,
          classrooms: 0,
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          { viewport: { width: 1280, height: 800 } },
          async ({ page, tracker }) => {
            const resp = await openRoute(page, origin, '/student');
            assertSecurityHeaders(resp, '/student');
            await page.waitForSelector('[data-onboarding="learn"]');
            await sleep(4000);

            const dash = await inspectDashboardCommon(page);
            assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 1, 'pro-milestone called once (no loop)');
            assert(await page.$('[data-onboarding="pro-milestone"]'), 'pro-milestone card visible');
            pass('T1-F1-01');

            const profileQueryReq = tracker.requests.find((r) => r.key === 'GET /api/auth/data/profiles');
            assert(profileQueryReq && profileQueryReq.search.includes('daily_goal'), 'profiles select includes daily_goal');
            const summaryReq = tracker.requests.find((r) => r.key === 'GET /api/words?summary');
            assert(summaryReq && summaryReq.search.includes('levels=1'), 'word summary includes levels=1');
            assert.equal(tracker.getCount('GET /api/words?summary'), 1, 'word summary single-flight');
            pass('T1-F2-04');

            assert(dash.scrollWidth <= 1280, 'no horizontal overflow on 1280px');
            assert(dash.rects.progress && dash.rects.progress.visible, '[data-onboarding="progress"] visible');
            const heatmapInfo = await page.evaluate(() => {
              const prog = document.querySelector('[data-onboarding="progress"]');
              if (!prog) return null;
              const grids = Array.from(prog.querySelectorAll('.grid-cols-7')).map((g) => ({
                display: window.getComputedStyle(g).display,
                cols: window.getComputedStyle(g).gridTemplateColumns.trim().split(/\s+/).length,
              }));
              return { text: prog.innerText || '', grids };
            });
            assert(heatmapInfo, '[data-onboarding="progress"] must exist');
            for (const wd of ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']) {
              assert(heatmapInfo.text.includes(wd), `Heatmap missing weekday ${wd}`);
            }
            assert(
              heatmapInfo.grids.some((g) => g.display === 'grid' && g.cols === 7),
              'StreakCounter must render 7-column CSS grid on 1280px',
            );
            assert(/\b2\s*liên tiếp/i.test(heatmapInfo.text), 'Heatmap must show 2 liên tiếp');
            pass('T1-F3-03');
            pass('T1-F7-04');

            assert(!dash.forbidden.staticProBox, 'static PRO box removed');
            pass('T1-F4-01');
            assert(!dash.forbidden.ieltsText && !dash.forbidden.ieltsBtn, 'no IELTS shortcut');
            assert(dash.counts.toeicButtons >= 1, 'TOEIC exam shortcut present');
            assert.equal(dash.counts.vstepLinks, 1);
            assert.equal(dash.counts.vnuLinks, 1);
            pass('T1-F4-02');
            assert(!dash.forbidden.writingText && !dash.forbidden.writingBtn && !dash.forbidden.comingSoonBadge, 'no Writing or Sắp có');
            pass('T1-F4-03');
            pass('T2-F4-02');
            pass('T2-F4-05');

            assert.equal(tracker.getCount('GET /api/practice/daily-reading'), 0, 'dashboard must not call legacy daily-reading');
            const readingCalls = tracker.getCount('GET /api/reading/progress') + tracker.getCount('GET /api/student/dashboard');
            assert(readingCalls >= 1, 'reading progress sourced from /api/reading/progress or /api/student/dashboard');
            pass('T1-F6-01');
            assert(dash.text.includes('3/619') || dash.text.includes('3 bài'), 'Reading progress matches 3/619');
            pass('T1-F6-02');

            const readingModal = await openReadingModalAndInspect(page);
            assert.equal(readingModal.links.length, 2, 'Reading modal must have exactly 2 options');
            pass('T1-F6-03');
            assert.deepEqual(
              readingModal.hrefs.slice().sort(),
              ['/practice/reading-library', '/toeic'],
              'Reading modal has unique /practice/reading-library and /toeic',
            );
            assert.equal(new Set(readingModal.hrefs).size, 2);
            pass('T1-F6-04');

            await page.keyboard.press('Escape');
            await sleep(150);
            assert.equal(await page.$('[role="dialog"]'), null, 'Escape closes Reading modal');
            const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
            assert.notEqual(bodyOverflow, 'hidden', 'overflow restored after closing modal');
            pass('T2-F6-05');

            assert(dash.rects.learn && dash.rects.progress && dash.rects.vault, 'core blocks present');
            assert(dash.rects.learn.top < dash.rects.progress.top, 'Hero above Progress');
            assert(dash.rects.progress.top < dash.rects.vault.top, 'Progress above Vault');
            pass('T1-F9-01');

            assert(dash.counts.toeicButtons >= 1, 'TOEIC exam shortcut present');
            assert.equal(dash.counts.vstepLinks, 1);
            assert.equal(dash.counts.vnuLinks, 1);
            assert.equal(dash.counts.grammarLinks, 1);
            assert(dash.counts.readingButtons >= 1, 'Reading skill shortcut present');
            assert(dash.counts.listeningButtons >= 1, 'Listening skill shortcut present');
            assert.equal(dash.counts.speakingLinks, 1);
            assert.equal(dash.counts.practiceLinks, 1);
            pass('T1-F9-03');

            assert.equal(dash.classroomSwitcher, false, 'classroom switcher hidden at 0 classrooms');
            pass('T1-F9-04');

            assert(!dash.forbidden.badgeGridHeading, 'BadgeGrid removed from /student');
            pass('T1-F10-01');
            pass('T2-F10-05');

            assert(
              tracker.getCount('GET /api/student/dashboard') >= 1,
              'M3 consolidated GET /api/student/dashboard must be fetched on /student',
            );
            pass('T1-F12-01');
            pass('T1-F12-04');

            const storage = await getStorageEntries(page);
            assert(!JSON.stringify(storage).match(/access_token|refresh_token|code-verifier/));
            pass('T1-F12-05');
          },
        );
      },
    );

    // ── Group 2: ProTrialMilestoneCard Eligible Claim, Claimed, Zero/Boundary, 403/500 ──
    await runCaseGroup(
      ['T1-F1-02', 'T4-05'],
      'ProTrialMilestoneCard Eligible Claim',
      async (pass) => {
        const scenario = createPersonaConfig('free-milestone-eligible');
        await withIsolatedContext(browser, origin, scenario, {}, async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="pro-milestone"]');
          await sleep(1000);
          assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 1);

          const claimBtn = await page.evaluateHandle(() => {
            const card = document.querySelector('[data-onboarding="pro-milestone"]');
            return Array.from(card.querySelectorAll('button')).find((b) =>
              b.textContent?.includes('Nhận quà Pro'),
            );
          });
          const btnEl = claimBtn.asElement();
          assert(btnEl, 'Claim button must exist');
          const disabled = await page.evaluate((el) => el.disabled, btnEl);
          assert.equal(disabled, false, 'Claim button enabled for eligible newbie');
          await btnEl.click();

          await page.waitForFunction(() => !document.querySelector('[data-onboarding="pro-milestone"]'));
          await sleep(300);
          assert.equal(tracker.getCount('POST /api/billing/pro-milestone'), 1, '1 POST on claim');
          pass('T1-F1-02');
          pass('T4-05');
        });
      },
    );

    await runCaseGroup(['T1-F1-05'], 'ProTrialMilestoneCard Already Claimed', async (pass) => {
      const scenario = createPersonaConfig('free-milestone-claimed');
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await sleep(1000);
        assert.equal(await page.$('[data-onboarding="pro-milestone"]'), null);
        pass('T1-F1-05');
      });
    });

    await runCaseGroup(['T2-F1-01'], 'Expired PRO Milestone Card', async (pass) => {
      const scenario = createPersonaConfig('expired-pro', {
        wordCount: 10,
        wordQuotaUsed: 10,
        studyStreak: 1,
        milestoneOverrides: { enrolled: true, eligible: false, alreadyClaimed: false, words: 10, streak: 1 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { instrumentation: { dismissPlanExpiredDay: scenario.profile.plan_expires_at.slice(0, 10) } },
        async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="pro-milestone"]');
          await sleep(2500);
          assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 1);
          pass('T2-F1-01');
        },
      );
    });

    await runCaseGroup(['T2-F1-02'], 'Power User Free Milestone Hidden', async (pass) => {
      const scenario = createPersonaConfig('free-over-limit', {
        wordCount: 30,
        wordQuotaUsed: 250,
        studyStreak: 10,
        milestoneOverrides: { enrolled: false, eligible: false, alreadyClaimed: false },
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await sleep(800);
        assert.equal(await page.$('[data-onboarding="pro-milestone"]'), null);
        pass('T2-F1-02');
      });
    });

    await runCaseGroup(['T2-F1-03'], '0 Words & 0 Streak Milestone Progress', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        wordCount: 0,
        wordQuotaUsed: 0,
        studyStreak: 0,
        rawStreak: 0,
        milestoneOverrides: { enrolled: true, eligible: false, words: 0, streak: 0 },
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await page.waitForSelector('[data-onboarding="pro-milestone"]');
        const cardInfo = await page.evaluate(() => {
          const card = document.querySelector('[data-onboarding="pro-milestone"]');
          const btn = card.querySelector('button');
          return {
            text: card.textContent || '',
            disabled: btn ? btn.disabled : false,
          };
        });
        assert(cardInfo.text.includes('0/3 ngày'));
        assert(cardInfo.text.includes('0/50 từ'));
        assert.equal(cardInfo.disabled, true);
        pass('T2-F1-03');
      });
    });

    await runCaseGroup(['T2-F1-04'], 'Words > maxWordsAtClaim (121)', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        wordCount: 25,
        wordQuotaUsed: 121,
        studyStreak: 3,
        milestoneOverrides: { enrolled: true, eligible: false, words: 121, streak: 3 },
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await sleep(800);
        const btnDisabled = await page.evaluate(() => {
          const card = document.querySelector('[data-onboarding="pro-milestone"]');
          if (!card) return true;
          const btn = card.querySelector('button');
          return !btn || btn.disabled;
        });
        assert.equal(btnDisabled, true);
        pass('T2-F1-04');
      });
    });

    await runCaseGroup(['T2-F1-05'], 'Milestone Network 500 Fails Closed', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: { '/api/billing/pro-milestone': 500 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/Failed to load resource:.*status of 500/] },
        async ({ page, tracker }) => {
        await openRoute(page, origin, '/student');
        await sleep(3000);
        assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 1, 'zero retry loop on 500');
        assert.equal(await page.$('[data-onboarding="pro-milestone"]'), null);
        pass('T2-F1-05');
      });
    });

    // ── Group 3: PRO & VIP Plan Gating + Classroom Flow ──
    await runCaseGroup(
      ['T1-F1-03', 'T1-F2-01', 'T1-F8-05', 'T1-F9-05', 'T3-02', 'T4-04'],
      'PRO Active + Enrolled Classrooms + Reading',
      async (pass) => {
        const scenario = createPersonaConfig('pro', {
          classrooms: 2,
          wordCount: 24,
          teacherWordCount: 4,
          wordQuotaUsed: 180,
          readingCompleted: 12,
          readingTotal: 619,
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          {
            instrumentation: {
              anchorIso: COHORT_PROMO_ACTIVE_ISO,
              notificationPermission: 'denied',
              suppressPushBanner: false,
            },
          },
          async ({ page, tracker }) => {
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="vault"]');
            await sleep(1000);

            assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 0);
            assert.equal(await page.$('[data-onboarding="pro-milestone"]'), null);
            pass('T1-F1-03');

            // UpsellProvider globally may call /api/profile <= 1, FreeQuotaBanner calls 0
            assert(tracker.getCount('GET /api/profile') <= 1, 'FreeQuotaBanner must not call /api/profile for PRO');
            pass('T1-F2-01');

            const banners = await inspectPriorityBanners(page);
            assert.equal(banners.count, 0, `PRO user sees 0 promo banners, got: ${banners.visible.join(',')}`);
            pass('T1-F8-05');

            const dash = await inspectDashboardCommon(page);
            assert.equal(dash.classroomSwitcher, true, 'classroom switcher visible when enrolled');
            assert(dash.text.includes('12/619') || dash.text.includes('12 bài'), 'Reading progress 12/619');

            // Switch to Classroom cls-1
            const clsSelectHandle = await page.evaluateHandle(
              () =>
                Array.from(document.querySelectorAll('main select')).find((s) =>
                  Array.from(s.options).some((o) => o.value === 'cls-1'),
                ) || null,
            );
            const clsSelectEl = clsSelectHandle.asElement();
            let switched = null;
            if (clsSelectEl) {
              await clsSelectEl.select('cls-1');
              switched = 'select';
            } else {
              const clsBtnHandle = await page.evaluateHandle(
                () =>
                  Array.from(document.querySelectorAll('main button')).find((b) =>
                    b.textContent?.includes('TOEIC 650+'),
                  ) || null,
              );
              const clsBtnEl = clsBtnHandle.asElement();
              if (clsBtnEl) {
                await clsBtnEl.click();
                switched = 'button';
              }
            }
            assert(switched, 'Classroom switcher control must be interactive');
            await page.waitForFunction(() => {
              const vault = document.querySelector('[data-onboarding="vault"]');
              if (!vault) return false;
              const txt = vault.innerText || '';
              return txt.includes('TOEIC 650+') && /\b2\b/.test(txt) && !/\b24\s*từ\b/.test(txt);
            }, { timeout: 5000 });
            const urlNow = page.url();
            assert(urlNow.includes('class=cls-1'), `URL should include ?class=cls-1, got ${urlNow}`);
            const hasClassroomRefetch = tracker.requests.some(
              (r) =>
                (r.path === '/api/words' || r.path === '/api/student/dashboard') &&
                r.search.includes('classroomId=cls-1'),
            );
            assert(hasClassroomRefetch, 'Switching classroom must refetch with classroomId=cls-1');
            const scopedCheck = await page.evaluate(() => ({
              vaultText: document.querySelector('[data-onboarding="vault"]')?.innerText || '',
              learnHref: document.querySelector('[data-onboarding="learn"]')?.getAttribute('href') || '',
              reviewHref: document.querySelector('[data-onboarding="review"]')?.getAttribute('href') || '',
            }));
            assert(/\b2\b/.test(scopedCheck.vaultText), `Vault summary must refresh to 2 words for cls-1, got: ${scopedCheck.vaultText}`);
            assert(scopedCheck.learnHref.includes('class=cls-1'), 'Learn CTA propagates class=cls-1');
            assert(scopedCheck.reviewHref.includes('class=cls-1'), 'Review CTA propagates class=cls-1');
            pass('T1-F9-05');
            pass('T3-02');

            const modal = await openReadingModalAndInspect(page);
            assert.deepEqual(modal.hrefs.slice().sort(), ['/practice/reading-library', '/toeic']);
            pass('T4-04');
          },
        );
      },
    );

    await runCaseGroup(
      ['T1-F1-04', 'T2-F2-01', 'T2-F4-03', 'T2-F8-04', 'T2-F8-05', 'T3-03', 'T3-13'],
      'VIP Active + Expired PRO + Zero Promos + Zero Packs + 0 Classrooms',
      async (pass) => {
        const scenario = createPersonaConfig('vip', {
          classrooms: 0,
          inProgressPacks: 0,
          wordQuotaUsed: 250,
          challengeMode: 'none',
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          {
            instrumentation: {
              anchorIso: COHORT_PROMO_ACTIVE_ISO,
              notificationPermission: 'denied',
              suppressPushBanner: false,
            },
          },
          async ({ page, tracker }) => {
            const resp = await openRoute(page, origin, '/student');
            assertSecurityHeaders(resp, '/student');
            await page.waitForSelector('[data-onboarding="vault"]');
            await sleep(800);

            assert.equal(tracker.getCount('GET /api/billing/pro-milestone'), 0);
            assert.equal(await page.$('[data-onboarding="pro-milestone"]'), null);
            pass('T1-F1-04');

            assert(tracker.getCount('GET /api/profile') <= 1);
            const banners = await inspectPriorityBanners(page);
            assert.equal(banners.count, 0, 'VIP sees 0 banners when all conditions false');
            assert.equal(banners.hasNotifyAnchor, true, '[data-onboarding="notify"] anchor kept');
            pass('T2-F8-05');

            const dash = await inspectDashboardCommon(page);
            assert.equal(dash.classroomSwitcher, false);
            assert.equal(dash.counts.packLinks, 0);
            pass('T3-13');
          },
        );

        // Verify Expired PRO triggers FreeQuotaBanner, suppresses CohortProPromo, hides static PRO box, no milestone loop
        const expiredAnchor = new Date(COHORT_PROMO_ACTIVE_ISO);
        const expiredScenario = createPersonaConfig('expired-pro', {
          anchorDate: expiredAnchor,
          wordQuotaUsed: 180,
          milestoneOverrides: { enrolled: true, eligible: false, words: 20, streak: 1 },
        });
        await withIsolatedContext(
          browser,
          origin,
          expiredScenario,
          {
            instrumentation: {
              anchorIso: COHORT_PROMO_ACTIVE_ISO,
              dismissNearLimitDay: expiredScenario.vn.todayVN,
              dismissPlanExpiredDay: expiredScenario.profile.plan_expires_at.slice(0, 10),
            },
          },
          async ({ page, tracker }) => {
            await openRoute(page, origin, '/student');
            await sleep(2500);
            const banners = await inspectPriorityBanners(page);
            assert.deepEqual(banners.visible, ['FreeQuotaBanner']);
            assert.equal(tracker.getCount('GET /api/billing/pro-milestone') <= 1, true);
            const dash = await inspectDashboardCommon(page);
            assert(!dash.forbidden.staticProBox, 'static PRO box absent on Expired PRO');
            pass('T2-F2-01');
            pass('T2-F4-03');
            pass('T2-F8-04');
            pass('T3-03');
          },
        );
      },
    );

    // ── Group 4: Push / FCM-Register Dedupe & Permission Cases ──
    await runCaseGroup(['T1-F2-02', 'T2-F2-04', 'T3-10'], 'Push Granted Stale Single Call', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        pushConfig: { count: 1, staleDays: 5, forceGen: 4 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        {
          instrumentation: {
            notificationPermission: 'granted',
            suppressPushBanner: false,
            pushDeviceRegistered: true,
            stubServiceWorker: true,
          },
          allowConsolePatterns: [
            /\[FCM\] Setup error:.*Push service disabled in offline E2E/,
            /\[FCM\] Lỗi khi lấy token:.*Push service disabled in offline E2E/,
          ],
        },
        async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          await sleep(3200);
          assert.equal(tracker.getCount('GET /api/push/fcm-register'), 1, 'fcm-register called at most once');
          const banners = await inspectPriorityBanners(page);
          assert(banners.visible.includes('EnableNotifications'), 'reconnect banner shown for staleDays=5');
          const dash = await inspectDashboardCommon(page);
          assert(dash.rects.progress && dash.rects.progress.visible);
          assert(!dash.forbidden.staticProBox && !dash.forbidden.ieltsBtn && !dash.forbidden.writingBtn);
          pass('T1-F2-02');
          pass('T2-F2-04');
          pass('T3-10');
        },
      );
    });

    await runCaseGroup(['T2-F2-02'], 'Push Denied Zero Calls', async (pass) => {
      const scenario = createPersonaConfig('free-newbie');
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { instrumentation: { notificationPermission: 'denied', suppressPushBanner: false } },
        async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await sleep(2800);
          assert.equal(tracker.getCount('GET /api/push/fcm-register'), 0);
          const banners = await inspectPriorityBanners(page);
          assert(!banners.visible.includes('EnableNotifications'));
          pass('T2-F2-02');
        },
      );
    });

    await runCaseGroup(['T2-F2-03'], 'Push Granted count=-1 Safe', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        pushConfig: { count: -1, staleDays: 0, forceGen: 4 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        {
          instrumentation: {
            notificationPermission: 'granted',
            suppressPushBanner: false,
            pushDeviceRegistered: true,
            stubServiceWorker: true,
          },
          allowConsolePatterns: [
            /\[FCM\] Setup error:.*Push service disabled in offline E2E/,
            /\[FCM\] Lỗi khi lấy token:.*Push service disabled in offline E2E/,
          ],
        },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await sleep(1200);
          const txt = await page.evaluate(() => document.body.innerText);
          assert(!txt.includes('Thông báo bị gián đoạn'));
          pass('T2-F2-03');
        },
      );
    });

    // ── Group 5: Mobile 390x844 Core + No words?limit=20 + Onboarding Anchors ──
    await runCaseGroup(
      [
        'T1-F2-03', 'T1-F2-05', 'T1-F3-04', 'T1-F4-05', 'T1-F6-05', 'T1-F7-05',
        'T1-F9-02', 'T2-F3-02', 'T2-F4-01', 'T2-F7-05', 'T3-01', 'T3-04', 'T4-01',
      ],
      'Mobile 390x844 Action-First Home + Bottom Nav + Reading Modal',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          wordCount: 25,
          wordQuotaUsed: 12,
          studyStreak: 2,
          dailyGoal: 10,
          inProgressPacks: 2,
          classrooms: 0,
          readingCompleted: 5,
          readingTotal: 619,
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          {
            viewport: { width: 390, height: 844 },
            instrumentation: { notificationPermission: 'default', suppressPushBanner: false },
          },
          async ({ page, tracker }) => {
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="mobile-nav"]');
            await sleep(800);

            assert.equal(tracker.getCount('GET /api/words?limit=20'), 0, 'zero words?limit=20 on /student');
            pass('T1-F2-03');
            await sleep(700); // total >= 1500ms post-load settle
            assert.equal(tracker.getCount('GET /api/practice/daily-reading'), 0);
            assert.equal(
              tracker.getCount('GET /api/student/classrooms'),
              0,
              'no standalone classrooms fetch on /student when 0 classrooms',
            );
            const secondaryCount =
              tracker.getCount('GET /api/student/dashboard') +
              tracker.getCount('GET /api/student/stats?lite=1') +
              tracker.getCount('GET /api/reading/progress') +
              tracker.getCount('GET /api/vocab/packs');
            assert(secondaryCount <= 3, `mobile secondary requests must stay <= 3, got ${secondaryCount}`);
            pass('T1-F2-05');

            const dash = await inspectDashboardCommon(page);
            assert(dash.scrollWidth <= 390, `mobile scrollWidth ${dash.scrollWidth} <= 390`);
            pass('T1-F3-04');
            pass('T2-F3-02');

            assert(!dash.forbidden.staticProBox && !dash.forbidden.ieltsText && !dash.forbidden.writingText && !dash.forbidden.comingSoonBadge);
            pass('T2-F4-01');

            const navText = await page.evaluate(() => document.querySelector('[data-onboarding="mobile-nav"]').innerText);
            for (const label of ['Home', 'Kho', 'Lộ trình', 'Tra từ', 'Profile']) {
              assert(navText.includes(label), `MobileBottomNav includes ${label}`);
            }
            pass('T1-F4-05');

            assert(dash.counts.learn === 1 && dash.counts.review === 1 && dash.counts.progress === 1 && dash.counts.vault === 1);
            assert(dash.rects.progress && dash.rects.progress.visible, '[data-onboarding="progress"] visible on mobile');
            assert(dash.counts.notify >= 1);
            pass('T1-F7-05');
            pass('T2-F7-05');

            assert.equal(dash.counts.packLinks, 2, '2 in_progress packs visible on mobile');
            assert.equal(dash.classroomSwitcher, false);
            const banners = await inspectPriorityBanners(page);
            assert.equal(banners.count, 1);
            assert.deepEqual(banners.visible, ['EnableNotifications']);
            pass('T1-F9-02');
            pass('T3-01');

            // Dismiss mobile notify sheet so it doesn't cover lower taps
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll('[data-onboarding="notify"] button')).find((b) =>
                b.textContent?.includes('Để sau'),
              );
              if (btn) btn.click();
            });
            await sleep(200);

            const modal = await openReadingModalAndInspect(page);
            assert.deepEqual(modal.hrefs.slice().sort(), ['/practice/reading-library', '/toeic']);
            pass('T1-F6-05');
            pass('T3-04');
            await page.keyboard.press('Escape');
            await sleep(150);

            // Tap Profile in MobileBottomNav -> verify BadgeGrid and daily_goal in từ
            await page.click('[data-onboarding="mobile-profile"]');
            await page.waitForFunction(() => window.location.pathname === '/student/profile', { timeout: 10000 });
            await page.waitForSelector('#daily-goal');
            const profileCheck = await page.evaluate(() => ({
              text: document.body.innerText,
              scrollWidth: document.documentElement.scrollWidth,
            }));
            assert(profileCheck.text.includes('Thành tích'), 'BadgeGrid on /student/profile');
            assert(profileCheck.text.includes('từ') && !profileCheck.text.includes('10 phút'));
            assert(profileCheck.scrollWidth <= 390);
            pass('T4-01');
          },
        );
      },
    );

    // ── Group 6: Responsive Resize + Single DOM Tree + Modal Survival + Drawer Escape ──
    await runCaseGroup(
      ['T1-F3-01', 'T1-F3-02', 'T1-F3-05', 'T2-F3-01', 'T2-F3-04', 'T2-F9-02', 'T3-11', 'T4-07'],
      'Unified Responsive Tree & Resize 1280 <-> 768 <-> 767 <-> 390',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          studyStreak: 7,
          rawStreak: 2,
          inProgressPacks: 4,
          challengeMode: 'active',
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          { viewport: { width: 1280, height: 800 } },
          async ({ page, tracker }) => {
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="learn"]');
            await sleep(600);

            const initialPackCount = await page.evaluate(
              () => document.querySelectorAll('a[href*="/flashcard?mode=learn&ids="]').length,
            );
            assert.equal(initialPackCount, 3, '4+ in_progress packs capped at 3 on Desktop');
            pass('T2-F9-02');

            await page.evaluate(() => {
              window.__mainRef = document.querySelector('main');
            });
            const challengeBefore = tracker.getCount('GET /api/challenges/widget');
            const packsBefore = tracker.getCount('GET /api/vocab/packs');

            // Resize 1280 -> 390
            await page.setViewport({ width: 390, height: 844 });
            await sleep(300);
            const afterMobile = await page.evaluate(() => ({
              sameMain: window.__mainRef === document.querySelector('main'),
              packs: document.querySelectorAll('a[href*="/flashcard?mode=learn&ids="]').length,
              overflow: document.documentElement.scrollWidth <= 390,
            }));
            assert.equal(afterMobile.sameMain, true, 'main DOM node preserved across resize');
            assert.equal(afterMobile.packs, 3, '3 in_progress packs preserved on Mobile');
            assert.equal(afterMobile.overflow, true);
            assert.equal(tracker.getCount('GET /api/challenges/widget'), challengeBefore);
            assert.equal(tracker.getCount('GET /api/vocab/packs'), packsBefore);
            pass('T1-F3-01');
            pass('T3-11');

            // Breakpoint 768 <-> 767 & mobile drawer check on /student/profile (since /student sets hideMobileHeader)
            await page.setViewport({ width: 768, height: 800 });
            await sleep(200);
            await openRoute(page, origin, '/student/profile');
            await page.waitForSelector('#stats');
            await page.setViewport({ width: 767, height: 800 });
            await sleep(200);
            const drawerTriggerVisible = await page.evaluate(() => {
              const btn = document.querySelector('button[aria-label="Mở menu"]');
              return Boolean(btn && btn.getBoundingClientRect().width > 0);
            });
            assert.equal(drawerTriggerVisible, true, 'Mở menu visible on /student/profile at 767px');
            pass('T2-F3-01');

            // Open drawer, verify streak 7 & Escape closes
            await page.setViewport({ width: 390, height: 844 });
            await sleep(200);
            await page.click('button[aria-label="Mở menu"]');
            await page.waitForSelector('#mobile-nav-drawer');
            const drawerText = await page.evaluate(() => document.querySelector('#mobile-nav-drawer').innerText);
            assert(drawerText.includes('7 ngày'), 'Mobile drawer shows unified streak 7 ngày');
            await page.keyboard.press('Escape');
            await sleep(200);
            assert.equal(await page.$('#mobile-nav-drawer'), null, 'Escape closes mobile drawer');
            pass('T2-F3-04');

            // Return to /student -> open review modal at 1280, resize to 390 -> single dialog remains open
            await page.setViewport({ width: 1280, height: 800 });
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="review"]');
            await sleep(200);
            const reviewModalOpened = await page.evaluate(() => {
              const btn =
                Array.from(document.querySelectorAll('main button')).find((b) =>
                  /ôn tập FSRS|chế độ ôn tập/i.test(
                    `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''}`,
                  ),
                ) ||
                Array.from(document.querySelectorAll('main button')).find(
                  (b) =>
                    /\bTất cả\b/i.test(b.textContent || '') &&
                    Boolean(b.closest('div')?.parentElement?.querySelector('[data-onboarding="review"]')),
                ) ||
                document.querySelector('[data-onboarding="progress"] [title*="ôn tập"]');
              if (!btn) return false;
              btn.click();
              return true;
            });
            assert.equal(reviewModalOpened, true, 'Review ActionSelectionModal trigger must exist');
            await page.waitForSelector('[role="dialog"]');
            const dialogBefore = await page.evaluate(() => ({
              count: document.querySelectorAll('[role="dialog"]').length,
              text: document.querySelector('[role="dialog"]')?.textContent || '',
            }));
            assert.equal(dialogBefore.count, 1, 'Single unified ActionSelectionModal dialog on 1280px');
            assert(dialogBefore.text.includes('Ôn tập'), 'Opened modal must be Review mode, not Learn');

            await page.setViewport({ width: 390, height: 844 });
            await sleep(200);
            const dialogAfterCount = await page.$$eval('[role="dialog"]', (els) => els.length);
            assert.equal(dialogAfterCount, 1, 'Single ActionSelectionModal survives resize across 768px');
            pass('T1-F3-02');
            pass('T1-F3-05');
            await page.keyboard.press('Escape');
            pass('T4-07');
          },
        );
      },
    );

    // ── Group 7: Compact 320x568 Modal Fit + Toast Leak Check ──
    await runCaseGroup(['T2-F3-05', 'T2-F4-04'], '320x568 Modal Fit & Zero Coming-Soon Toasts', async (pass) => {
      const scenario = createPersonaConfig('free-newbie');
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { viewport: { width: 320, height: 568 } },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="learn"]');
          const modal = await openReadingModalAndInspect(page);
          assert(modal.fitsViewport, 'modal fits inside 320x568');
          pass('T2-F3-05');
          await page.keyboard.press('Escape');
          await sleep(150);

          // Click every real shortcut (3 exams + 4 skills) & verify no "sắp ra mắt" / "đang được cập nhật" toast
          for (const name of ['TOEIC', 'Reading', 'Listening']) {
            const clicked = await page.evaluate((targetName) => {
              const buttons = Array.from(document.querySelectorAll('main button'));
              const target = buttons.find((b) => {
                if (targetName === 'TOEIC') {
                  return /\bTOEIC\b/i.test(b.textContent || '') || Boolean(b.querySelector('img[alt="TOEIC"]'));
                }
                return new RegExp(`\\b${targetName}\\b`, 'i').test(b.textContent || '');
              });
              if (!target) return false;
              target.click();
              return true;
            }, name);
            assert.equal(clicked, true, `${name} shortcut button must exist`);
            await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
            const txt = await page.evaluate(() => document.body.innerText);
            assert(!/sắp ra mắt|đang được cập nhật|sắp có/i.test(txt), `Toast leak after clicking ${name}`);
            await page.keyboard.press('Escape');
            await sleep(150);
          }

          for (const href of ['/vstep', '/vnu-bac-3', '/grammar', '/student/speaking/foundation']) {
            const linkEl = await page.$(`main a[href="${href}"]`);
            assert(linkEl, `Shortcut link ${href} must exist in main`);
            await linkEl.click();
            await page.waitForFunction(
              (targetPath) => window.location.pathname.startsWith(targetPath),
              { timeout: 10000 },
              href,
            );
            await sleep(200);
            const txt = await page.evaluate(() => document.body.innerText);
            assert(!/sắp ra mắt|đang được cập nhật/i.test(txt), `Toast leak on ${href}`);
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="learn"]');
          }
          pass('T2-F4-04');
        },
      );
    });

    // ── Group 8: PriorityBannerSlot Strict Ordering & Dismissal ──
    await runCaseGroup(
      ['T1-F8-01', 'T2-F8-02', 'T4-06'],
      'PriorityBannerSlot FreeQuotaBanner > Cohort > Challenge > Notify + Dismiss',
      async (pass) => {
        const anchorDate = new Date(COHORT_PROMO_ACTIVE_ISO);
        const scenario = createPersonaConfig('free-near-limit', {
          anchorDate,
          wordQuotaUsed: 180,
          challengeMode: 'active',
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          {
            instrumentation: {
              anchorIso: COHORT_PROMO_ACTIVE_ISO,
              notificationPermission: 'default',
              suppressPushBanner: false,
              dismissNearLimitDay: scenario.vn.todayVN,
            },
          },
          async ({ page }) => {
            await openRoute(page, origin, '/student');
            await sleep(800);
            const first = await inspectPriorityBanners(page);
            assert.equal(first.count, 1, `Expected 1 banner, got ${first.visible.join(',')}`);
            assert.deepEqual(first.visible, ['FreeQuotaBanner']);
            pass('T1-F8-01');

            // Dismiss FreeQuotaBanner -> reload -> CohortProPromoBanner appears exclusively
            await page.click('button[aria-label="Ẩn banner phiên này"]');
            await sleep(250);
            await page.reload({ waitUntil: 'networkidle0' });
            await sleep(600);
            const second = await inspectPriorityBanners(page);
            assert.equal(second.count, 1, `After dismiss expected 1 next banner, got ${second.visible.join(',')}`);
            assert.deepEqual(second.visible, ['CohortProPromoBanner']);
            pass('T2-F8-02');
            pass('T4-06');
          },
        );
      },
    );

    await runCaseGroup(['T1-F8-02'], 'PriorityBannerSlot CohortProPromoBanner Wins When <150 Words', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        anchorDate: new Date(COHORT_PROMO_ACTIVE_ISO),
        wordQuotaUsed: 10,
        challengeMode: 'active',
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        {
          instrumentation: {
            anchorIso: COHORT_PROMO_ACTIVE_ISO,
            notificationPermission: 'default',
            suppressPushBanner: false,
          },
        },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await sleep(800);
          const banners = await inspectPriorityBanners(page);
          assert.equal(banners.count, 1);
          assert.deepEqual(banners.visible, ['CohortProPromoBanner']);
          pass('T1-F8-02');
        },
      );
    });

    await runCaseGroup(['T1-F8-03', 'T2-F8-03', 'T3-09'], 'PriorityBannerSlot ChallengeWidget When Promo Expired', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        wordQuotaUsed: 10,
        studyStreak: 1,
        challengeMode: 'active',
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        {
          instrumentation: {
            notificationPermission: 'default',
            suppressPushBanner: false,
          },
        },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await sleep(800);
          const banners = await inspectPriorityBanners(page);
          assert.equal(banners.count, 1);
          assert.deepEqual(banners.visible, ['ChallengeWidget']);
          assert(await page.$('[data-onboarding="pro-milestone"]'), 'ProTrialMilestoneCard renders outside banner slot');
          pass('T1-F8-03');
          pass('T2-F8-03');
          pass('T3-09');
        },
      );
    });

    await runCaseGroup(['T1-F8-04'], 'PriorityBannerSlot EnableNotifications Only Fallback', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        wordQuotaUsed: 10,
        challengeMode: 'none',
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { instrumentation: { notificationPermission: 'default', suppressPushBanner: false } },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await sleep(800);
          const banners = await inspectPriorityBanners(page);
          assert.equal(banners.count, 1);
          assert.deepEqual(banners.visible, ['EnableNotifications']);
          pass('T1-F8-04');
        },
      );
    });

    await runCaseGroup(['T2-F8-01'], 'FreeQuotaBanner Threshold 149 vs 150 vs 200', async (pass) => {
      for (const used of [149, 150, 200]) {
        const s = createPersonaConfig('free-newbie', {
          wordQuotaUsed: used,
          challengeMode: 'none',
        });
        await withIsolatedContext(
          browser,
          origin,
          s,
          { instrumentation: { dismissNearLimitDay: s.vn.todayVN } },
          async ({ page }) => {
            await openRoute(page, origin, '/student');
            await sleep(700);
            // If >=200, UpsellModal opens with force=true; inspect text / dismiss modal
            if (used >= 200) {
              await page.waitForSelector('[role="dialog"]');
              const closedUpsell = await page.evaluate(() => {
                const closeBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
                  (b) =>
                    b.getAttribute('aria-label') === 'Đóng' ||
                    /Đóng|Để sau|Ôn từ đã có|Tiếp tục Free/i.test(b.textContent || ''),
                );
                if (!closeBtn) return false;
                closeBtn.click();
                return true;
              });
              assert.equal(closedUpsell, true, 'UpsellModal dismiss button must exist');
              await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
            }
            const banners = await inspectPriorityBanners(page);
            if (used === 149) {
              assert(!banners.visible.includes('FreeQuotaBanner'), '149 words hides FreeQuotaBanner');
            } else {
              assert.deepEqual(banners.visible, ['FreeQuotaBanner'], `${used} words shows FreeQuotaBanner`);
              const txt = await page.evaluate(() => document.body.innerText);
              if (used === 200) assert(txt.includes('trần Free'));
            }
          },
        );
      }
      pass('T2-F8-01');
    });

    // ── Group 9: daily_goal End-to-End Sync (/student/profile <-> /student) ──
    await runCaseGroup(
      ['T1-F5-01', 'T1-F5-02', 'T1-F5-04', 'T1-F5-05', 'T3-05', 'T4-02'],
      'daily_goal Sync Profile <-> Dashboard',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          dailyGoal: 20,
          todayNewWords: 8,
        });
        await withIsolatedContext(browser, origin, scenario, {}, async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const dashText1 = await page.evaluate(() => document.body.innerText);
          assert(dashText1.includes('8 / 20 từ') || dashText1.includes('/ 20 từ'), 'Dashboard shows 8 / 20 từ');
          pass('T1-F5-02');

          await page.click('aside a[href="/student/profile"]');
          await page.waitForFunction(() => window.location.pathname === '/student/profile', { timeout: 10000 });
          await page.waitForSelector('#daily-goal');
          const sliderVal = await page.$eval('#daily-goal', (el) => el.value);
          assert.equal(sliderVal, '20');
          const profText = await page.evaluate(() => document.body.innerText);
          assert(profText.includes('20 từ') && !profText.includes('20 phút'));
          pass('T1-F5-01');

          // Update daily_goal to 25 and save
          await page.$eval('#daily-goal', (el) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, '25');
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          });
          const saveClicked = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('main button')).find((b) =>
              b.textContent?.trim().includes('Lưu'),
            );
            if (!btn) return false;
            btn.click();
            return true;
          });
          assert.equal(saveClicked, true, 'Save button must exist');
          await page.waitForFunction(() => document.body.innerText.includes('Đã lưu.'));
          assert.equal(tracker.getCount('PUT /api/profile'), 1);
          assert.equal(scenario.profile.daily_goal, 25);
          pass('T1-F5-04');

          // Navigate back to /student
          await page.click('aside nav a[href="/student"]');
          await page.waitForFunction(() => window.location.pathname === '/student', { timeout: 10000 });
          await page.waitForSelector('[data-onboarding="progress"]');
          const dashText2 = await page.evaluate(() => document.body.innerText);
          assert(dashText2.includes('8 / 25 từ') || dashText2.includes('/ 25 từ'), 'Dashboard synced to 25 từ');
          pass('T1-F5-05');
          pass('T3-05');
          pass('T4-02');
        });
      },
    );

    await runCaseGroup(
      ['T1-F5-03', 'T2-F5-01', 'T2-F5-02', 'T2-F5-03', 'T2-F5-04'],
      'daily_goal Null Default (10), Bounds 5..50 & Clamp & >100% Bar',
      async (pass) => {
        const nullGoalScenario = createPersonaConfig('free-newbie', {
          dailyGoal: null,
          todayNewWords: 25,
        });
        await withIsolatedContext(browser, origin, nullGoalScenario, {}, async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const txt = await page.evaluate(() => document.body.innerText);
          assert(txt.includes('25 / 10 từ') || txt.includes('/ 10 từ'));
          pass('T1-F5-03');
          pass('T2-F5-04');

          await openRoute(page, origin, '/student/profile');
          await page.waitForSelector('#daily-goal');
          const minAttr = await page.$eval('#daily-goal', (el) => el.min);
          const maxAttr = await page.$eval('#daily-goal', (el) => el.max);
          assert.equal(minAttr, '5');
          assert.equal(maxAttr, '50');
          pass('T2-F5-01');
          pass('T2-F5-02');

          const clampRes = await page.evaluate(async () => {
            const r1 = await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ daily_goal: 0 }),
            }).then((r) => r.json());
            const r2 = await fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ daily_goal: 999 }),
            }).then((r) => r.json());
            return { low: r1.data.daily_goal, high: r2.data.daily_goal };
          });
          assert.equal(clampRes.low, 5);
          assert.equal(clampRes.high, 50);
          pass('T2-F5-03');
        });
      },
    );

    await runCaseGroup(['T2-F5-05'], 'PUT /api/profile 500 Error Handling', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: { 'PUT /api/profile': 500 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 500/] },
        async ({ page }) => {
          await openRoute(page, origin, '/student/profile');
          await page.waitForSelector('#daily-goal');
          const saveClicked = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('main button')).find((b) =>
              b.textContent?.trim().includes('Lưu'),
            );
            if (!btn) return false;
            btn.click();
            return true;
          });
          assert.equal(saveClicked, true, 'Save button must exist for 500 error test');
          await page.waitForFunction(() => document.body.innerText.includes('Lưu thất bại'));
          pass('T2-F5-05');
        },
      );
    });

    // ── Group 10: Reading Progress Boundaries (0, 619, 500, Classroom) ──
    await runCaseGroup(['T2-F6-01', 'T2-F6-04'], 'Reading 0/619 + Classroom Scope Modal', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        readingCompleted: 0,
        readingInProgress: 0,
        readingTotal: 619,
        classrooms: 1,
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student?class=cls-1');
        await page.waitForSelector('[data-onboarding="progress"]');
        const txt = await page.evaluate(() => document.body.innerText);
        assert(txt.includes('0/619') || txt.includes('Chưa đọc'));
        pass('T2-F6-01');
        const modal = await openReadingModalAndInspect(page);
        assert.deepEqual(modal.hrefs.slice().sort(), ['/practice/reading-library', '/toeic']);
        pass('T2-F6-04');
      });
    });

    await runCaseGroup(['T2-F6-02'], 'Reading 619/619 Completed', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        readingCompleted: 619,
        readingInProgress: 0,
        readingTotal: 619,
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await page.waitForSelector('[data-onboarding="progress"]');
        const txt = await page.evaluate(() => document.body.innerText);
        assert(txt.includes('619/619'));
        pass('T2-F6-02');
      });
    });

    await runCaseGroup(['T2-F6-03'], 'Reading API 500 Graceful Fallback', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: {
          '/api/reading/progress': 500,
          '/api/student/dashboard': 500,
        },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 500/] },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          await sleep(500);
          const progressTxt = await page.evaluate(
            () => document.querySelector('[data-onboarding="progress"]')?.innerText || '',
          );
          assert(
            /0\/619|Chưa đọc|0 bài/i.test(progressTxt),
            `Reading 500 fallback must show 0/619 or Chưa đọc, got: ${progressTxt}`,
          );
          assert(!/\bNaN\b|\bundefined\b/i.test(progressTxt), 'No NaN/undefined on Reading 500');
          pass('T2-F6-03');
        },
      );
    });

    // ── Group 11: Unified Streak (studyStreak vs stale DB current_streak) & BadgeGrid ──
    await runCaseGroup(
      ['T1-F7-01', 'T1-F7-02', 'T1-F7-03', 'T1-F10-02', 'T1-F10-05', 'T3-07'],
      'Unified studyStreak=7 Across Header, Drawer, Bell, Heatmap, Profile, BadgeGrid',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          studyStreak: 7,
          rawStreak: 99,
          totalXp: 600,
          todayXp: 10,
          gamificationDailyGoal: 30,
          levelCountsOverride: [2, 2, 2, 2, 8, 7],
          totalWordsOverride: 23,
        });
        await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const streakValues = await page.evaluate(() => {
            const heatText = document.querySelector('[data-onboarding="progress"]').innerText;
            const headerText = document.querySelector('header')?.innerText || '';
            return { heatText, headerText, fullText: document.body.innerText };
          });
          assert(!streakValues.fullText.includes('99'), 'stale DB streak 99 must not leak');
          assert(/\b7\s*liên tiếp/i.test(streakValues.heatText), 'Heatmap must show 7 liên tiếp');
          assert(/🔥\s*7\b/.test(streakValues.headerText), 'Desktop header must show 🔥 7');
          pass('T1-F7-01');

          // NotificationBell dropdown
          await page.click('button[aria-label="Thông báo"]');
          await sleep(200);
          const bellText = await page.evaluate(() => document.body.innerText);
          assert(bellText.includes('7 ngày'), 'NotificationBell uses unified studyStreak 7');
          pass('T1-F7-03');

          // Navigate to /student/profile -> check Mobile drawer (since /student sets hideMobileHeader) & BadgeGrid
          await openRoute(page, origin, '/student/profile');
          await page.waitForSelector('#stats');
          await page.setViewport({ width: 390, height: 844 });
          await sleep(200);
          await page.click('button[aria-label="Mở menu"]');
          await page.waitForSelector('#mobile-nav-drawer');
          const drawerTxt = await page.evaluate(() => document.querySelector('#mobile-nav-drawer').innerText);
          assert(drawerTxt.includes('7 ngày') && !drawerTxt.includes('99'), 'Mobile drawer shows unified streak 7 ngày');
          pass('T1-F7-02');
          await page.keyboard.press('Escape');

          await page.setViewport({ width: 1280, height: 800 });
          await sleep(200);
          const badgeInfo = await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('[aria-label]')).map((el) =>
              el.getAttribute('aria-label'),
            );
            return { text: document.body.innerText, labels };
          });
          assert(badgeInfo.text.includes('Thành tích'));
          assert(badgeInfo.labels.some((l) => l && l.includes('Streak 7 ngày liên tiếp — Đã đạt được!')));
          assert(badgeInfo.labels.some((l) => l && l.includes('Tích luỹ 500 XP — Đã đạt được!')));
          assert(badgeInfo.labels.some((l) => l && l.includes('Thành thạo 10 từ — Đã đạt được!')));
          pass('T1-F10-02');
          pass('T1-F10-05');
          pass('T3-07');
        });
      },
    );

    await runCaseGroup(
      ['T1-F10-03', 'T1-F10-04', 'T2-F7-01', 'T2-F10-01'],
      '0 Streak + 0 Badges on Profile Mobile & Desktop',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          studyStreak: 0,
          rawStreak: 12,
          totalXp: 0,
          todayXp: 0,
          levelCountsOverride: [5, 0, 0, 0, 0, 0],
        });
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          { viewport: { width: 1280, height: 800 } },
          async ({ page }) => {
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="progress"]');
            const zeroCheck = await page.evaluate(() => ({
              heatText: document.querySelector('[data-onboarding="progress"]')?.innerText || '',
              headerText: document.querySelector('header')?.innerText || '',
              bodyText: document.body.innerText || '',
            }));
            assert(!/\b12\s*liên tiếp/i.test(zeroCheck.bodyText), 'stale DB streak 12 must not appear');
            assert(/\b0\s*liên tiếp/i.test(zeroCheck.heatText), 'Heatmap must show 0 liên tiếp');
            assert(/🔥\s*0\b/.test(zeroCheck.headerText), 'Header must show 🔥 0');
            await page.click('button[aria-label="Thông báo"]');
            await sleep(200);
            const bellText = await page.evaluate(() => document.body.innerText);
            assert(!bellText.includes('Streak 12 ngày'), 'NotificationBell must not use stale streak 12');
            pass('T2-F7-01');

            await page.setViewport({ width: 390, height: 844 });
            await openRoute(page, origin, '/student/profile');
            await page.waitForSelector('#stats');
            const profInfo = await page.evaluate(() => ({
              text: document.body.innerText,
              scrollWidth: document.documentElement.scrollWidth,
            }));
            assert(profInfo.text.includes('Học hôm nay để mở streak!'), '0 streak prompt visible on Profile');
            assert(/\b0\s*ngày liên tiếp/i.test(profInfo.text), 'Profile StreakCounter shows 0 ngày liên tiếp');
            assert(profInfo.text.includes('Thành tích'));
            assert(profInfo.text.includes('0/16'));
            assert(profInfo.scrollWidth <= 390);
            pass('T1-F10-03');
            pass('T1-F10-04');
            pass('T2-F10-01');
          },
        );
      },
    );

    await runCaseGroup(
      ['T2-F7-02', 'T2-F7-03', 'T2-F7-04'],
      'Grace-Day Streak, >=30 Streak, Empty dailyActivity Fallback',
      async (pass) => {
        const graceScenario = createPersonaConfig('free-newbie', {
          studyStreak: 4,
          rawStreak: 4,
          includeTodayInStreak: false,
        });
        await withIsolatedContext(browser, origin, graceScenario, {}, async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const graceCheck = await page.evaluate(() => ({
            heatText: document.querySelector('[data-onboarding="progress"]')?.innerText || '',
            headerText: document.querySelector('header')?.innerText || '',
          }));
          assert(/\b4\s*liên tiếp/i.test(graceCheck.heatText), 'Heatmap must show 4 liên tiếp');
          assert(/🔥\s*4\b/.test(graceCheck.headerText), 'Header must show 🔥 4');
          await page.click('button[aria-label="Thông báo"]');
          await sleep(200);
          const bellText = await page.evaluate(() => document.body.innerText);
          assert(bellText.includes('Streak 4 ngày'), 'NotificationBell must show Streak 4 ngày');
          pass('T2-F7-02');
        });

        const longScenario = createPersonaConfig('free-newbie', { studyStreak: 30, rawStreak: 30 });
        await withIsolatedContext(browser, origin, longScenario, {}, async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const longCheck = await page.evaluate(() => ({
            headerText: document.querySelector('header')?.innerText || '',
            heatText: document.querySelector('[data-onboarding="progress"]')?.innerText || '',
            scrollWidth: document.documentElement.scrollWidth,
          }));
          assert(/🔥\s*30\b/.test(longCheck.headerText), 'Header must show 🔥 30');
          assert(/\b30\s*liên tiếp/i.test(longCheck.heatText), 'Heatmap must show 30 liên tiếp');
          assert(longCheck.scrollWidth <= 1280);
          await page.click('button[aria-label="Thông báo"]');
          await sleep(200);
          const bellText = await page.evaluate(() => document.body.innerText);
          assert(bellText.includes('Streak 30 ngày'), 'NotificationBell must show Streak 30 ngày');
          pass('T2-F7-03');
        });

        const emptyActScenario = createPersonaConfig('free-newbie', {
          studyStreak: 6,
          rawStreak: 6,
          emptyDailyActivity: true,
        });
        await withIsolatedContext(browser, origin, emptyActScenario, {}, async ({ page }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="progress"]');
          const fallbackCheck = await page.evaluate(() => ({
            heatText: document.querySelector('[data-onboarding="progress"]')?.innerText || '',
            headerText: document.querySelector('header')?.innerText || '',
          }));
          assert(/\b6\s*liên tiếp/i.test(fallbackCheck.heatText), 'Heatmap must show 6 liên tiếp');
          assert(/🔥\s*6\b/.test(fallbackCheck.headerText), 'Header must show 🔥 6');
          pass('T2-F7-04');
        });
      },
    );

    await runCaseGroup(['T2-F10-02', 'T2-F10-04'], 'All Core Badges + Long Name Truncate', async (pass) => {
      const scenario = createPersonaConfig('pro', {
        fullName: 'Nguyễn Trần Bảo Ngọc Minh Anh Phương Thảo Vy Hương',
        studyStreak: 35,
        rawStreak: 35,
        totalXp: 3500,
        levelCountsOverride: [5, 5, 5, 5, 60, 50],
        totalWordsOverride: 130,
        roadmapUnitsDone: 12,
        roadmapLevelsDone: ['A0', 'A1', 'A2', 'B1', 'B2'],
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { viewport: { width: 390, height: 844 } },
        async ({ page }) => {
          await openRoute(page, origin, '/student/profile');
          await page.waitForSelector('#stats');
          const info = await page.evaluate((expectedName) => {
            const nameEl = Array.from(document.querySelectorAll('main h2')).find((el) =>
              (el.textContent || '').includes(expectedName.slice(0, 20)),
            );
            const nameStyle = nameEl ? window.getComputedStyle(nameEl) : null;
            const nameRect = nameEl ? nameEl.getBoundingClientRect() : null;
            const labels = Array.from(document.querySelectorAll('[aria-label]')).map((el) =>
              el.getAttribute('aria-label') || '',
            );
            const lockedCount = document.querySelectorAll('[aria-label^="🔒"]').length;
            return {
              text: document.body.innerText,
              scrollWidth: document.documentElement.scrollWidth,
              nameText: nameEl ? nameEl.textContent.trim() : '',
              textOverflow: nameStyle ? nameStyle.textOverflow : '',
              overflowX: nameStyle ? nameStyle.overflowX : '',
              nameRight: nameRect ? nameRect.right : 9999,
              labels,
              lockedCount,
            };
          }, scenario.profile.full_name);
          assert(info.text.includes('Thành tích'));
          assert(/\b(9|16)\/16\b/.test(info.text), `Badge summary must be 9/16 or 16/16, got snippet: ${info.text.slice(0, 400)}`);
          const expectedUnlockedDescriptions = [
            'Streak 3 ngày liên tiếp',
            'Streak 7 ngày liên tiếp',
            'Streak 30 ngày liên tiếp',
            'Tích luỹ 100 XP',
            'Tích luỹ 500 XP',
            'Tích luỹ 2000 XP',
            'Thành thạo 10 từ',
            'Thành thạo 50 từ',
            'Thành thạo 100 từ',
          ];
          for (const desc of expectedUnlockedDescriptions) {
            assert(
              info.labels.some((l) => l.includes(`${desc} — Đã đạt được!`)),
              `Badge "${desc}" must be unlocked`,
            );
            assert(
              !info.labels.some((l) => l.includes(`🔒 ${desc}`)),
              `Badge "${desc}" must not be locked`,
            );
          }
          if (info.text.includes('16/16')) {
            assert.equal(info.lockedCount, 0, 'Zero locked badges expected when all 16 earned');
          }
          assert.equal(info.nameText.length, 50, 'Profile must render full 50-char name in truncated heading');
          assert.equal(info.textOverflow, 'ellipsis', 'Profile name heading must use text-overflow: ellipsis');
          assert.equal(info.overflowX, 'hidden', 'Profile name heading must hide horizontal overflow');
          assert(info.nameRight <= 390 && info.scrollWidth <= 390, 'Truncated 50-char name must fit 390px');
          pass('T2-F10-02');
          pass('T2-F10-04');
        },
      );
    });

    await runCaseGroup(['T2-F10-03'], 'Profile Stats 500 Still Renders BadgeGrid', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: { '/api/student/stats': 500 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 500/] },
        async ({ page }) => {
          await openRoute(page, origin, '/student/profile');
          await page.waitForSelector('#stats');
          const txt = await page.evaluate(() => document.body.innerText);
          assert(txt.includes('Thành tích'));
          pass('T2-F10-03');
        },
      );
    });

    // ── Group 12: Block 4 Vault Summary Boundaries + Join Classroom Errors ──
    await runCaseGroup(
      ['T2-F2-05', 'T2-F9-01', 'T2-F9-03', 'T2-F9-04'],
      '0 Packs, 0 Words, 100+ Counts',
      async (pass) => {
        const zeroScenario = createPersonaConfig('free-newbie', {
          wordCount: 0,
          wordQuotaUsed: 0,
          inProgressPacks: 0,
          includeNotStartedPacks: true,
          includeCompletedPacks: true,
          classrooms: 0,
        });
        await withIsolatedContext(browser, origin, zeroScenario, {}, async ({ page, tracker }) => {
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="vault"]');
          await sleep(1000);
          const dash = await inspectDashboardCommon(page);
          assert.equal(dash.counts.packLinks, 0, 'not_started/completed must not render as in_progress');
          assert.equal(dash.classroomSwitcher, false, 'classroom switcher hidden at 0 classrooms');
          assert.equal(
            tracker.getCount('GET /api/words?summary'),
            1,
            '0 words & 0 classrooms must fetch ?summary=1&levels=1 once without looping',
          );
          assert.equal(
            tracker.getCount('GET /api/words?limit=20'),
            0,
            '0 words & 0 classrooms must never call words?limit=20',
          );
          assert.equal(
            tracker.getCount('GET /api/words'),
            1,
            '0 words & 0 classrooms must make no fallback /api/words calls',
          );
          pass('T2-F2-05');
          pass('T2-F9-01');
          pass('T2-F9-03');
        });

        const bigScenario = createPersonaConfig('free-newbie', {
          totalWordsOverride: 240,
          newCountOverride: 120,
          reviewDueCountOverride: 105,
          dueCountOverride: 225,
        });
        await withIsolatedContext(
          browser,
          origin,
          bigScenario,
          { viewport: { width: 390, height: 844 } },
          async ({ page }) => {
            await openRoute(page, origin, '/student');
            await page.waitForSelector('[data-onboarding="learn"]');
            await page.waitForFunction(() => {
              const txt = document.body.innerText || '';
              return txt.includes('120') && txt.includes('105') && txt.includes('240');
            }, { timeout: 5000 });
            const bigInfo = await page.evaluate(() => ({
              sw: document.documentElement.scrollWidth,
              learnText: document.querySelector('[data-onboarding="learn"]')?.innerText || '',
              reviewText: document.querySelector('[data-onboarding="review"]')?.innerText || '',
              vaultText: document.querySelector('[data-onboarding="vault"]')?.innerText || '',
              bodyText: document.body.innerText || '',
            }));
            assert(bigInfo.sw <= 390, `Mobile 390px overflow: ${bigInfo.sw}`);
            assert(bigInfo.learnText.includes('120') || bigInfo.bodyText.includes('120 từ mới'), 'Hero Learn shows 120');
            assert(bigInfo.reviewText.includes('105') || bigInfo.bodyText.includes('105 cần ôn'), 'Hero Review shows 105');
            assert(bigInfo.vaultText.includes('240'), 'Vault summary shows 240');
            pass('T2-F9-04');
          },
        );
      },
    );

    await runCaseGroup(['T2-F9-05'], 'Join Classroom Modal 404 Error', async (pass) => {
      const scenario = createPersonaConfig('free-newbie');
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 404/] },
        async ({ page }) => {
          await openRoute(page, origin, '/student?joinClass=BAD1');
          await page.waitForSelector('input[placeholder="Mã lớp..."]');
          await page.focus('input[placeholder="Mã lớp..."]');
          await page.keyboard.press('Enter');
          await page.waitForFunction(() => document.body.innerText.includes('Không tìm thấy lớp học'));
          assert(await page.$('input[placeholder="Mã lớp..."]'), 'join modal stays open on 404');
          pass('T2-F9-05');
        },
      );
    });

    // ── Group 13: /student/vault Full CRUD, Search, Filter, Sort, Pagination, GV Badge ──
    await runCaseGroup(
      [
        'T1-F4-04', 'T1-F11-01', 'T1-F11-02', 'T1-F11-03', 'T1-F11-04', 'T1-F11-05',
        'T2-F3-03', 'T2-F11-02', 'T2-F11-03', 'T3-06', 'T3-08', 'T3-12', 'T4-03',
      ],
      'Power Learner Vault (>20 words, GV badge, Filter/Sort/Search/Pagination/Delete)',
      async (pass) => {
        const scenario = createPersonaConfig('free-newbie', {
          wordCount: 25,
          teacherWordCount: 2,
          classrooms: 1,
          includeNamedWord: 'teacherword',
        });
        // Ensure a personal word matches "resilient" and is due so combined filter works
        const personalWord = scenario.words.find((w) => w.added_by === scenario.userId);
        if (personalWord) {
          personalWord.word = 'resilient';
          personalWord.isDue = true;
          personalWord.status = 'learning';
        }
        await withIsolatedContext(browser, origin, scenario, {}, async ({ page, tracker }) => {
          // Verify Dashboard Vault Summary first (T3-08, T4-03)
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="vault"]');
          const dash = await inspectDashboardCommon(page);
          assert.equal(tracker.getCount('GET /api/words?limit=20'), 0, 'zero words?limit=20 on /student');
          assert(!dash.forbidden.fullWordSearch && !dash.forbidden.loadMoreBtn);
          assert(dash.text.includes('25'));
          assert.equal(dash.classroomSwitcher, true);

          const vaultResp = await openRoute(page, origin, '/student/vault');
          assertSecurityHeaders(vaultResp, '/student/vault');
          await page.waitForSelector('input[placeholder*="Tìm"]');

          const vaultInit = await page.evaluate(() => ({
            text: document.body.innerText,
            scrollWidth: document.documentElement.scrollWidth,
          }));
          assert(vaultInit.scrollWidth <= 1280);
          pass('T2-F3-03');
          assert(vaultInit.text.includes('Tải thêm (5)'), '25 words shows Tải thêm (5)');
          assert(vaultInit.text.includes('GV'), 'teacher_import word displays GV badge');
          pass('T1-F11-01');

          // Click Load More -> 25 rendered, Tải thêm hides (T2-F11-02)
          const loadMoreClicked = await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('main button')).find((b) =>
              b.textContent?.includes('Tải thêm'),
            );
            if (!btn) return false;
            btn.click();
            return true;
          });
          assert.equal(loadMoreClicked, true, 'Tải thêm button must exist');
          await page.waitForFunction(() => !document.body.innerText.includes('Tải thêm ('));
          pass('T2-F11-02');

          // Click teacherword -> WordDetailModal shows "Giáo viên giao" & no MeaningSelectorModal (T1-F4-04, T1-F11-04)
          const teacherClicked = await page.evaluate(() => {
            const card = Array.from(document.querySelectorAll('main button, main [role="button"]')).find(
              (el) => el.textContent?.includes('teacherword'),
            );
            if (!card) return false;
            card.click();
            return true;
          });
          assert.equal(teacherClicked, true, 'teacherword interactive card must exist');
          await page.waitForSelector('[role="dialog"]');
          const modalTxt = await page.evaluate(() => document.querySelector('[role="dialog"]').innerText);
          assert(modalTxt.includes('Giáo viên giao'));
          assert(!modalTxt.includes('Select the correct meaning to study'));
          pass('T1-F4-04');
          pass('T1-F11-04');
          pass('T3-12');
          await page.keyboard.press('Escape');
          await sleep(150);

          // Filter status=due & sort=az & search q=resilient (T1-F11-02, T1-F11-03, T3-06)
          const dueClicked = await page.evaluate(() => {
            const dueBtn = Array.from(document.querySelectorAll('main button')).find(
              (b) => b.textContent?.trim() === 'Đến hạn',
            );
            if (!dueBtn) return false;
            dueBtn.click();
            return true;
          });
          assert.equal(dueClicked, true, 'Đến hạn filter button must exist on /student/vault');

          const sortSelectHandle = await page.evaluateHandle(
            () =>
              Array.from(document.querySelectorAll('main select')).find((s) =>
                Array.from(s.options).some((o) => o.value === 'az'),
              ) || null,
          );
          const sortSelectEl = sortSelectHandle.asElement();
          assert(sortSelectEl, 'Sort <select> with option "az" must exist on /student/vault');
          await sortSelectEl.select('az');

          await page.type('input[placeholder*="Tìm"]', 'resilient');
          await sleep(500);
          const hasCombinedParams = tracker.requests.some(
            (r) =>
              r.path === '/api/words' &&
              r.search.includes('q=resilient') &&
              r.search.includes('status=due') &&
              r.search.includes('sort=az'),
          );
          assert(hasCombinedParams, 'GET /api/words received q=resilient&status=due&sort=az');
          pass('T1-F11-02');
          pass('T1-F11-03');

          // Delete personal word via WordDetailModal (T1-F11-05)
          const resilientClicked = await page.evaluate(() => {
            const card = Array.from(document.querySelectorAll('main button, main [role="button"]')).find(
              (el) => el.textContent?.includes('resilient'),
            );
            if (!card) return false;
            card.click();
            return true;
          });
          assert.equal(resilientClicked, true, 'resilient interactive card must exist');
          await page.waitForSelector('[role="dialog"]');
          page.once('dialog', (dialog) => dialog.accept());
          const delClicked = await page.evaluate(() => {
            const delBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) =>
              b.textContent?.trim() === 'Xóa',
            );
            if (!delBtn) return false;
            delBtn.click();
            return true;
          });
          assert.equal(delClicked, true, 'Delete button must exist for personal word');
          await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
          assert.equal(tracker.getCount('DELETE /api/words'), 1);
          assert.equal(scenario.words.length, 24);
          pass('T1-F11-05');

          // Reset status to "Tất cả", test empty search q=zzzznotfound999 & clear search (T2-F11-03)
          const allBtnClicked = await page.evaluate(() => {
            const allBtn = Array.from(document.querySelectorAll('main button')).find(
              (b) => b.textContent?.trim() === 'Tất cả',
            );
            if (!allBtn) return false;
            allBtn.click();
            return true;
          });
          assert.equal(allBtnClicked, true, 'Tất cả filter button must exist before empty search check');
          await page.$eval('input[placeholder*="Tìm"]', (el) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, 'zzzznotfound999');
            el.dispatchEvent(new Event('input', { bubbles: true }));
          });
          for (let i = 0; i < 20; i++) {
            if (tracker.requests.some((r) => r.path === '/api/words' && r.search.includes('q=zzzznotfound999'))) {
              break;
            }
            await sleep(100);
          }
          await page.waitForFunction(
            () => /Không tìm thấy từ/i.test(document.querySelector('main')?.innerText || ''),
            { timeout: 5000 },
          );
          const hasEmptyQueryReq = tracker.requests.some(
            (r) => r.path === '/api/words' && r.search.includes('q=zzzznotfound999'),
          );
          assert(hasEmptyQueryReq, 'GET /api/words must receive q=zzzznotfound999');
          const emptyMainTxt = await page.$eval('main', (el) => el.innerText || '');
          assert(/Không tìm thấy từ/i.test(emptyMainTxt), 'Empty search state must render "Không tìm thấy từ"');
          assert(!emptyMainTxt.includes('abundant'));

          await page.$eval('input[placeholder*="Tìm"]', (el) => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, '');
            el.dispatchEvent(new Event('input', { bubbles: true }));
          });
          await page.waitForFunction(
            () => (document.querySelector('main')?.innerText || '').includes('abundant'),
            { timeout: 5000 },
          );
          pass('T2-F11-03');

          // Resize to Mobile 390x844 (T3-06, T4-03)
          await page.setViewport({ width: 390, height: 844 });
          await sleep(250);
          const mobileWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          assert(mobileWidth <= 390);
          pass('T3-06');

          // Return to /student -> verify summary updated to 24 (T3-08)
          await openRoute(page, origin, '/student');
          await page.waitForSelector('[data-onboarding="vault"]');
          await page.waitForFunction(() => {
            const vault = document.querySelector('[data-onboarding="vault"]');
            if (!vault) return false;
            const txt = vault.innerText || '';
            return /\b24\b/.test(txt) && !/\b25\s*từ\b/.test(txt);
          }, { timeout: 5000 });
          const vaultAfter = await page.$eval('[data-onboarding="vault"]', (el) => el.innerText || '');
          assert(/\b24\b/.test(vaultAfter), `Vault summary must update to 24, got: ${vaultAfter}`);
          pass('T3-08');
          pass('T4-03');
        });
      },
    );

    await runCaseGroup(['T2-F11-04'], '/student/vault Classroom Switcher 0 vs >=1', async (pass) => {
      const zeroClsScenario = createPersonaConfig('free-newbie', { wordCount: 8, classrooms: 0 });
      await withIsolatedContext(browser, origin, zeroClsScenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student/vault');
        await page.waitForSelector('main');
        const hasZeroSwitcher = await page.evaluate(() =>
          Array.from(document.querySelectorAll('main select')).some((s) =>
            Array.from(s.options).some((o) => o.value === 'cls-1'),
          ),
        );
        assert.equal(hasZeroSwitcher, false, '/student/vault hides classroom switcher when 0 classrooms');
      });

      const oneClsScenario = createPersonaConfig('free-newbie', {
        wordCount: 10,
        teacherWordCount: 2,
        classrooms: 1,
      });
      await withIsolatedContext(browser, origin, oneClsScenario, {}, async ({ page, tracker }) => {
        await openRoute(page, origin, '/student/vault');
        await page.waitForSelector('main');
        const vaultClsHandle = await page.evaluateHandle(
          () =>
            Array.from(document.querySelectorAll('main select')).find((s) =>
              Array.from(s.options).some((o) => o.value === 'cls-1'),
            ) || null,
        );
        const vaultClsEl = vaultClsHandle.asElement();
        assert(vaultClsEl, '/student/vault must show classroom switcher when >=1 classrooms enrolled');
        await vaultClsEl.select('cls-1');
        await sleep(400);
        assert(
          tracker.requests.some((r) => r.path === '/api/words' && r.search.includes('classroomId=cls-1')),
          '/student/vault must pass classroomId=cls-1 to GET /api/words',
        );
        pass('T2-F11-04');
      });
    });

    await runCaseGroup(['T2-F11-01'], '0 Words Empty Vault State', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', { wordCount: 0, classrooms: 0 });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student/vault');
        await page.waitForSelector('main');
        const txt = await page.evaluate(() => document.body.innerText);
        assert(!txt.includes('Tải thêm ('));
        assert(await page.$('a[href="/import"], a[href="/library"]'));
        pass('T2-F11-01');
      });
    });

    await runCaseGroup(['T2-F11-05'], 'Delete Word 500 Error Keeps Word', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        wordCount: 5,
        statusCodeOverrides: { 'DELETE /api/words': 500 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 500|\[WordDetailModal\] Delete error/] },
        async ({ page }) => {
          await openRoute(page, origin, '/student/vault');
          await page.waitForSelector('main');
          const cardClicked = await page.evaluate(() => {
            const card = Array.from(document.querySelectorAll('main button, main [role="button"]')).find((el) =>
              /resilient|ubiquitous|pragmatic/i.test(el.textContent || ''),
            );
            if (!card) return false;
            card.click();
            return true;
          });
          assert.equal(cardClicked, true, 'Word card must exist');
          await page.waitForSelector('[role="dialog"]');
          page.once('dialog', (dialog) => dialog.accept());
          const delClicked = await page.evaluate(() => {
            const delBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find((b) =>
              b.textContent?.trim() === 'Xóa',
            );
            if (!delBtn) return false;
            delBtn.click();
            return true;
          });
          assert.equal(delClicked, true, 'Delete button must exist');
          await page.waitForFunction(() => document.body.innerText.includes('Không xóa được từ'));
          assert.equal(scenario.words.length, 5);
          pass('T2-F11-05');
        },
      );
    });

    // ── Group 14: Security, Auth Redirect, Nav Active, Embed, Badges 99/100, 429 & 503 SWR ──
    await runCaseGroup(['T1-F12-02', 'T2-F12-05'], 'Unauthenticated Redirect to /auth', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', { unauthenticated: true });
      for (const route of ['/student', '/student/profile', '/student/vault']) {
        await withIsolatedContext(
          browser,
          origin,
          scenario,
          { allowConsolePatterns: [/Failed to load resource:.*status of 401/] },
          async ({ page }) => {
          await openRoute(page, origin, route);
          await page.waitForFunction(() => window.location.pathname.startsWith('/auth'), { timeout: 10000 });
        });
      }
      pass('T1-F12-02');
      pass('T2-F12-05');
    });

    await runCaseGroup(['T1-F12-03', 'T2-F12-03', 'T2-F12-04'], 'Sidebar Active Nav, 99 vs 99+ Badges, embed=1', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        reviewDueCountOverride: 99,
        newCountOverride: 0,
        dueCountOverride: 99,
      });
      await withIsolatedContext(browser, origin, scenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await page.waitForSelector('aside');
        const activeOnStudent = await page.evaluate(() => ({
          studentActive: document.querySelector('aside nav a[href="/student"]')?.getAttribute('aria-current'),
          sidebarText: document.querySelector('aside').innerText,
        }));
        assert.equal(activeOnStudent.studentActive, 'page');
        assert(activeOnStudent.sidebarText.includes('99') && !activeOnStudent.sidebarText.includes('99+'));

        await openRoute(page, origin, '/student/profile');
        const activeOnProfile = await page.evaluate(() =>
          document.querySelector('aside nav a[href="/student"]')?.getAttribute('aria-current'),
        );
        assert.notEqual(activeOnProfile, 'page');
        pass('T1-F12-03');
      });

      const hundredScenario = createPersonaConfig('free-newbie', {
        reviewDueCountOverride: 100,
        newCountOverride: 0,
        dueCountOverride: 100,
      });
      await withIsolatedContext(browser, origin, hundredScenario, {}, async ({ page }) => {
        await openRoute(page, origin, '/student');
        await page.waitForSelector('aside');
        const txt = await page.evaluate(() => document.querySelector('aside').innerText);
        assert(txt.includes('99+'));
        pass('T2-F12-03');

        await openRoute(page, origin, '/student?embed=1');
        await page.waitForSelector('[data-onboarding="learn"]');
        const hasSidebar = await page.evaluate(() => {
          const aside = document.querySelector('aside');
          return Boolean(aside && aside.getBoundingClientRect().width > 0);
        });
        assert.equal(hasSidebar, false, 'embed=1 hides sidebar chrome');
        pass('T2-F12-04');
      });
    });

    await runCaseGroup(['T2-F12-01', 'T3-14'], '503 Offline SWR Resilience Preserves Session', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: {
          '/api/student/dashboard': 503,
          '/api/student/stats': 503,
        },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        {
          allowConsolePatterns: [/status of 503/],
          instrumentation: {
            seedSwrCache: {
              local: {
                'lp:last_user_id': scenario.userId,
                [`lp:profile:${scenario.userId}`]: scenario.profile,
                [`lp:gamification:${scenario.userId}`]: scenario.gamification,
                [`lp:word-summary:${scenario.userId}`]: {
                  total: 18,
                  newCount: 4,
                  reviewDueCount: 6,
                  dueCount: 10,
                  classroomId: null,
                  levelCounts: [4, 4, 4, 3, 2, 1],
                },
                [`lp:dashboard-secondary:${scenario.userId}`]: {
                  studyStreak: 5,
                  dailyActivity: scenario.stats.dailyActivity,
                  todayWords: 7,
                  todayNewWords: 3,
                  todayReviewWords: 4,
                  todayKey: scenario.vn.todayVN,
                },
              },
            },
          },
        },
        async ({ page }) => {
          await openRoute(page, origin, '/student');
          await sleep(800);
          assert(page.url().includes('/student'), '503 must not redirect to /auth');
          assert(await page.$('[data-onboarding="vault"]'), 'cached dashboard UI stays rendered');
          pass('T2-F12-01');
          pass('T3-14');
        },
      );
    });

    await runCaseGroup(['T2-F12-02'], '429 Rate Limit on /student/vault', async (pass) => {
      const scenario = createPersonaConfig('free-newbie', {
        statusCodeOverrides: { 'GET /api/words': 429 },
      });
      await withIsolatedContext(
        browser,
        origin,
        scenario,
        { allowConsolePatterns: [/status of 429/] },
        async ({ page, tracker }) => {
          await openRoute(page, origin, '/student/vault');
          await page.waitForSelector('main');
          await page.waitForFunction(() => {
            const txt = `${document.querySelector('main')?.innerText || ''} ${document.body.innerText || ''}`;
            return /Quá nhiều yêu cầu|vui lòng thử lại|Không tải được|Thử lại/i.test(txt);
          }, { timeout: 5000 });
          const main429 = await page.$eval('main', (el) => el.innerText || '');
          assert(tracker.getCount('GET /api/words') >= 1, 'GET /api/words attempted before 429 feedback');
          assert(!/\bNaN\b|\bundefined\b|Application error/i.test(main429), 'No React crash on 429');
          pass('T2-F12-02');
        },
      );
    });

    console.log(
      `\n[E2E Summary] Passed: ${passed.length}/${targetIds.length}, Failed: ${failed.length}, FailedGroups: ${groupFailures.length}`,
    );
    assert.equal(groupFailures.length, 0, `${groupFailures.length} E2E groups failed`);
    assert.equal(failed.length, 0, `${failed.length} E2E cases failed`);
    assert.equal(passed.length, targetIds.length, 'Every targeted E2E case must execute and pass');
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      if (server) await stopProductionServer(server);
    }
  }
}

await runSuite();
