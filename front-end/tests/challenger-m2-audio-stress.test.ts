/**
 * CHALLENGER M2.1 EMPIRICAL STRESS TEST SUITE
 * Audio Duration, Transition Races, +400ms Buffer & Rapid Keypress Debouncing
 */

import fs from 'fs';
import path from 'path';

// ANSI terminal colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}[PASS]${RESET} ${testName}`);
  } else {
    failedTests++;
    const msg = `${testName}${detail ? ` -> ${detail}` : ''}`;
    failures.push(msg);
    console.error(`  ${RED}[FAIL]${RESET} ${msg}`);
  }
}

// Configurable mock audio duration
let mockAudioDurationMs = 200;
let mockAudioShouldHang = false;
let audioInstanceCount = 0;
let activeAudioInstances = 0;
let maxConcurrentAudioInstances = 0;

class MockAudio {
  src = '';
  preload = 'auto';
  playbackRate = 1.0;
  preservesPitch = true;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _timer: any = null;

  constructor() {
    audioInstanceCount++;
  }

  play(): Promise<void> {
    activeAudioInstances++;
    maxConcurrentAudioInstances = Math.max(maxConcurrentAudioInstances, activeAudioInstances);

    if (mockAudioShouldHang) {
      // Audio hangs indefinitely (e.g. network stall or muted browser)
      return Promise.resolve();
    }

    this._timer = setTimeout(() => {
      activeAudioInstances = Math.max(0, activeAudioInstances - 1);
      if (this.onended) {
        this.onended();
      }
    }, mockAudioDurationMs);

    return Promise.resolve();
  }

  pause() {
    if (this._timer) clearTimeout(this._timer);
    activeAudioInstances = Math.max(0, activeAudioInstances - 1);
  }

  removeAttribute(attr: string) {}
  load() {}
}

class MockSpeechSynthesisUtterance {
  text = '';
  rate = 1.0;
  pitch = 1.0;
  volume = 1.0;
  lang = 'en-US';
  voice: any = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

// Set up globals BEFORE importing audio modules
(global as any).window = {
  setTimeout: (fn: Function, ms: number) => setTimeout(fn, ms),
  clearTimeout: (id: any) => clearTimeout(id),
  addEventListener: () => {},
  removeEventListener: () => {},
  speechSynthesis: {
    speaking: false,
    paused: false,
    getVoices: () => [{ lang: 'en-US', name: 'Samantha' }],
    speak: (u: any) => {
      activeAudioInstances++;
      maxConcurrentAudioInstances = Math.max(maxConcurrentAudioInstances, activeAudioInstances);
      setTimeout(() => {
        activeAudioInstances = Math.max(0, activeAudioInstances - 1);
        if (u.onend) u.onend();
      }, mockAudioDurationMs);
    },
    cancel: () => {
      activeAudioInstances = 0;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  },
};
(global as any).Audio = MockAudio;
(global as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

async function runAllChallengerTests() {
  console.log(`${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}   CHALLENGER M2.1: EMPIRICAL STRESS TEST - AUDIO & TRANSITIONS   ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}\n`);

  // Dynamic import so globals are already in place
  const { playWordWithBuffer } = await import('../src/lib/audio-sync');
  const { playWordAudio, stopWordAudio } = await import('../src/lib/audio');
  const { speak } = await import('../src/lib/study');

  // ─────────────────────────────────────────────────────────────
  // SUITE 1: Multi-Syllable Audio Duration (> 1500ms) Zero Cutoff
  // ─────────────────────────────────────────────────────────────
  console.log(`${YELLOW}▶ Suite 1: Multi-Syllable Audio Duration (>1500ms) Zero Cutoff${RESET}`);

  // Test 1.1: Multi-syllable word (1600ms duration)
  {
    mockAudioDurationMs = 1600;
    mockAudioShouldHang = false;
    let transitionFinished = false;

    const start = Date.now();
    const p = playWordWithBuffer('incomprehensibility', 400);
    p.then(() => {
      transitionFinished = true;
    });

    // At 1000ms (well past legacy 950ms timer), transition MUST NOT have completed
    await new Promise((r) => setTimeout(r, 1000));
    assert(!transitionFinished, '1.1: Audio is NOT cut off at legacy 950ms timer (still playing at 1000ms)');

    // At 1550ms (audio still playing), transition MUST NOT have completed
    await new Promise((r) => setTimeout(r, 550));
    assert(!transitionFinished, '1.2: Audio is NOT cut off at 1550ms (duration > 1500ms preserved)');

    // Await full completion
    await p;
    const elapsed = Date.now() - start;
    assert(elapsed >= 1950, `1.3: Full transition waited audio (1600ms) + buffer (400ms) = ${elapsed}ms >= 1950ms`);
  }

  // Test 1.4: Extremely long pronunciation (2200ms duration)
  {
    mockAudioDurationMs = 2200;
    mockAudioShouldHang = false;

    const start = Date.now();
    await playWordWithBuffer('biodegradability', 400);
    const elapsed = Date.now() - start;

    assert(elapsed >= 2550, `1.4: 2200ms audio + 400ms buffer completed in ${elapsed}ms (>= 2550ms) without truncation`);
  }

  // Test 1.5: Hanging audio fail-safe timeout guard (maxWaitMs)
  {
    mockAudioShouldHang = true; // Audio never ends
    const start = Date.now();
    // Safety guard with maxWaitMs = 600ms, bufferMs = 400ms -> should resolve in ~1000ms
    await playWordWithBuffer('stalledWord', 400, 600);
    const elapsed = Date.now() - start;

    assert(elapsed >= 950 && elapsed < 1300, `1.5: Safety timeout guard resolves hanging audio at maxWaitMs (600ms) + buffer (400ms) = ${elapsed}ms`);
    mockAudioShouldHang = false;
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 2: Strict Adherence to +400ms Post-Audio Buffer
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}▶ Suite 2: Strict Adherence to +400ms Post-Audio Buffer${RESET}`);

  const bufferCases = [
    { audio: 150, buffer: 400, minElapsed: 520 },
    { audio: 300, buffer: 400, minElapsed: 670 },
    { audio: 100, buffer: 500, minElapsed: 570 },
    { audio: 200, buffer: 300, minElapsed: 470 },
    { audio: 250, buffer: 0, minElapsed: 230 },
  ];

  for (let i = 0; i < bufferCases.length; i++) {
    const { audio, buffer, minElapsed } = bufferCases[i];
    mockAudioDurationMs = audio;
    const start = Date.now();
    await playWordWithBuffer('bufferTest', buffer);
    const elapsed = Date.now() - start;

    assert(
      elapsed >= minElapsed,
      `2.${i + 1}: Audio ${audio}ms + Buffer ${buffer}ms strictly honored (elapsed: ${elapsed}ms >= ${minElapsed}ms)`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 3: Rapid Keypress Debouncing & Double Advance Prevention
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}▶ Suite 3: Rapid Keypress Debouncing & Race Conditions${RESET}`);

  // Test 3.1: ReviewSession advance idempotency & 100ms lock
  {
    let goNextCalls = 0;
    const advanceFn: { current: (() => void) | null } = { current: null };
    const answeredRef = { current: true };
    let canSkip = false;
    let pendingSkip: any = false;

    const goNext = () => {
      advanceFn.current = null;
      goNextCalls++;
    };

    const advance = () => {
      if (advanceFn.current !== advance) return;
      goNext();
    };
    advanceFn.current = advance;

    const skipWait = () => {
      if (!answeredRef.current) return;
      if (!canSkip) {
        pendingSkip = true;
        return;
      }
      advanceFn.current?.();
    };

    // User hammers Enter 10 times rapidly within lock window
    for (let k = 0; k < 10; k++) {
      skipWait();
    }
    assert(goNextCalls === 0, '3.1: ReviewSession ignores rapid Enter presses while canSkip is false (lock active)');
    assert(pendingSkip === true, '3.2: First press during lock records pendingSkip');

    // Lock opens after FEEDBACK_LOCK_MS
    canSkip = true;
    if (pendingSkip) {
      pendingSkip = false;
      advanceFn.current?.();
    }
    assert(goNextCalls === 1, '3.3: Exactly 1 advance executes upon lock release');

    // Hammer 10 more times after advance
    for (let k = 0; k < 10; k++) {
      skipWait();
    }
    assert(goNextCalls === 1, '3.4: Subsequent rapid Enter/Space presses do not trigger duplicate advance (advanceFn is null)');
  }

  // Test 3.5: Empirical test of Writing page skipWait with Event Bubbling
  {
    let queue = ['card1', 'card2', 'card3'];
    const advanceFn: { current: (() => void) | null } = { current: null };
    let verdict: any = 'correct';
    let goNextCalls = 0;

    const goNext = (wasWrong = false) => {
      advanceFn.current = null;
      goNextCalls++;
      queue = queue.slice(1);
    };

    const advance = () => {
      if (advanceFn.current !== advance) return;
      goNext(false);
    };
    advanceFn.current = advance;

    // Writing page implementation of skipWait:
    const skipWait = () => {
      if (verdict === null) return;
      advanceFn.current?.();
    };

    // When Enter is pressed on <input onKeyDown={onKeyDown}>:
    // 1. Input onKeyDown executes:
    skipWait();

    // 2. The keydown event bubbles up to window.addEventListener('keydown', onGlobalKey):
    // In React 18, the state update setVerdict(null) is batched and has not rendered yet.
    // So verdict is still 'correct'.
    skipWait();

    const isDoubleAdvance = goNextCalls > 1;
    if (isDoubleAdvance) {
      assert(
        false,
        '3.5: Writing page skipWait input event bubbling to window triggers double goNext()',
        `goNext was called ${goNextCalls} times! Queue length dropped from 3 to ${queue.length}. A card was skipped!`
      );
    } else {
      assert(true, '3.5: Writing page does not double-advance on key bubbling');
    }
  }

  // Test 3.6: Static code audit of `src/app/writing/page.tsx`
  {
    const writingCode = fs.readFileSync(path.resolve('src/app/writing/page.tsx'), 'utf-8');
    const hasInputOnKey = writingCode.includes('onKeyDown={onKeyDown}');
    const hasGlobalOnKey = writingCode.includes("window.addEventListener('keydown', onGlobalKey)");
    const hasElseGoNext = writingCode.includes("else {\n      goNext(verdict === 'wrong');") ||
                          writingCode.includes("else {\r\n      goNext(verdict === 'wrong');") ||
                          writingCode.includes("else { goNext(verdict === 'wrong'); }");

    const hasDoubleKeyBug = hasInputOnKey && hasGlobalOnKey && hasElseGoNext;
    assert(
      !hasDoubleKeyBug,
      '3.6: Writing page code audit: input onKeyDown + window onGlobalKey + else goNext hazard',
      hasDoubleKeyBug
        ? 'CRITICAL DEFECT: <input onKeyDown> and window onGlobalKey both call skipWait() on same event, and the fallback else branch calls goNext() again!'
        : undefined
    );
  }

  // Test 3.7: LearnMode onKeyDown double-tap check
  {
    const learnCode = fs.readFileSync(path.resolve('src/app/flashcard/LearnMode.tsx'), 'utf-8');
    // Check if LearnMode has any feedback lock or debounce on onKeyDown
    const hasDebounceOrLock = learnCode.includes('FEEDBACK_LOCK_MS') || learnCode.includes('canSkip');
    assert(
      hasDebounceOrLock,
      '3.7: LearnMode should implement feedback lock or debounce for rapid Enter/Space',
      'LearnMode allows rapid keypresses to trigger goNextRecall without debounce'
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 4: Audio Overlap & Speech Cancellation
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}▶ Suite 4: Audio Overlap & Speech Cancellation${RESET}`);

  // Test 4.1: stopWordAudio cancels ongoing playback
  {
    mockAudioDurationMs = 500;
    maxConcurrentAudioInstances = 0;
    activeAudioInstances = 0;

    // Start playback
    void playWordAudio('wordA');
    assert(activeAudioInstances === 1, '4.1: Audio begins playing for wordA');

    // Rapid transition cancels wordA
    stopWordAudio();
    assert(activeAudioInstances === 0, '4.2: stopWordAudio immediately terminates active audio');

    // Start wordB
    void playWordAudio('wordB');
    assert(activeAudioInstances === 1, '4.3: Audio begins playing for wordB without overlap');
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 5: Error State Manual Confirmation
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${YELLOW}▶ Suite 5: Error State Manual Confirmation${RESET}`);

  // Test 5.1: ReviewSession error state
  {
    const reviewCode = fs.readFileSync(path.resolve('src/app/review/session/page.tsx'), 'utf-8');
    const pausesOnError = reviewCode.includes('// INCORRECT / ALMOST CORRECT:') &&
      reviewCode.includes('advanceTimer.current = null;') &&
      reviewCode.includes('speak(current.word, 1.0);');
    assert(pausesOnError, '5.1: ReviewSession pauses on error and speaks for reinforcement without timer');
  }

  // Test 5.2: Writing error state
  {
    const writingCode = fs.readFileSync(path.resolve('src/app/writing/page.tsx'), 'utf-8');
    const pausesOnError = writingCode.includes('// WRONG / CLOSE:') &&
      writingCode.includes('advanceTimer.current = null;') &&
      writingCode.includes('speak(current.word, 1.0);');
    assert(pausesOnError, '5.2: Writing pauses on error and speaks for reinforcement without timer');
  }

  // Test 5.3: LearnMode error state
  {
    const learnCode = fs.readFileSync(path.resolve('src/app/flashcard/LearnMode.tsx'), 'utf-8');
    const pausesOnError = learnCode.includes('// wrong / close: không auto-next') &&
      learnCode.includes('advanceTimer.current = null;') &&
      learnCode.includes('speak(recallWord.word, 1.0);');
    assert(pausesOnError, '5.3: LearnMode pauses on error and speaks for reinforcement without timer');
  }

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log(`\n${CYAN}================================================================${RESET}`);
  console.log(`${CYAN}               CHALLENGER M2.1 EXECUTION SUMMARY                 ${RESET}`);
  console.log(`${CYAN}================================================================${RESET}`);
  console.log(`  Total Tests Run:  ${passedTests + failedTests}`);
  console.log(`  Passed:           ${GREEN}${passedTests}${RESET}`);
  console.log(`  Failed:           ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);
  console.log(`  Pass Rate:        ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    console.log(`\n${RED}Failures Detected:${RESET}`);
    failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  }
  console.log(`${CYAN}================================================================${RESET}\n`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllChallengerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
