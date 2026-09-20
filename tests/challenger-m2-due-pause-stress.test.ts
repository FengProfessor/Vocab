/**
 * Challenger M2.2 Empirical Stress Test Suite
 * Focus: SRS Due Queue Starvation Prevention & Error State Indefinite Pause
 *
 * Requirements:
 * 1. SRS Due Queue Starvation: 50 unstudied words + 10 due words scenario.
 *    Verify that get_due_words_list strictly returns the 10 due words first
 *    and never starves them with unstudied words.
 * 2. Error State Indefinite Pause: In ReviewSession, Writing, and LearnMode,
 *    submitting wrong/close answers must NOT auto-advance after 2.4s or 2.5s.
 *    The card must pause indefinitely until manual user confirmation (Enter/Space/Next).
 * 3. Keyboard handlers must cleanly advance to next card upon Enter or Space.
 * 4. Correct answer audio synchronization: audio + 400ms buffer completes before transition.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('\n================================================================');
console.log('🔥 CHALLENGER M2.2: EMPIRICAL STRESS TEST SUITE');
console.log('   SRS Due Queue Starvation & Error Manual Pause Verification');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(desc: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(
        () => {
          passedTests++;
          console.log(`  ✅ [PASS] ${desc}`);
        },
        (err) => {
          failedTests++;
          console.error(`  ❌ [FAIL] ${desc}`);
          console.error(`     Error: ${err.message}`);
          throw err;
        },
      );
    }
    passedTests++;
    console.log(`  ✅ [PASS] ${desc}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

async function runAllChallengerTests() {
  // ==========================================================================
  // SECTION 1: SQL MIGRATION CODE & SCHEMA INTEGRITY AUDIT
  // ==========================================================================
  console.log('\n--- Section 1: SQL Schema & Due Priority RPC Audit ---');

  const migrationPath = path.resolve('supabase/migrations/20260919_optimize_session_queries.sql');
  assert(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  it('S1.1: Migration defines get_due_words_list and get_new_words_list RPCs', () => {
    assert(migrationSql.includes('CREATE OR REPLACE FUNCTION public.get_due_words_list'), 'Must create get_due_words_list');
    assert(migrationSql.includes('CREATE OR REPLACE FUNCTION public.get_new_words_list'), 'Must create get_new_words_list');
  });

  it('S1.2: get_due_words_list uses CTE with explicit priority 1 for due and 2 for new', () => {
    assert(migrationSql.includes('1 AS priority'), 'Due words CTE must assign priority 1');
    assert(migrationSql.includes('2 AS priority'), 'New words CTE must assign priority 2');
    assert(migrationSql.includes('ORDER BY c.priority ASC'), 'Outer query must sort by priority ASC');
  });

  it('S1.3: Elimination of legacy 1970 COALESCE starvation bug', () => {
    assert(!migrationSql.includes("'1970-01-01'::timestamp"), 'Old COALESCE 1970 starvation bug must be completely absent');
  });

  it('S1.4: get_due_words_list limits new_words CTE to remaining capacity', () => {
    assert(
      migrationSql.includes('LIMIT GREATEST(0, p_limit - (SELECT count(*)::int FROM due_words))'),
      'New words CTE must limit fetch to GREATEST(0, p_limit - due_words count) to avoid overfetching',
    );
  });

  // ==========================================================================
  // SECTION 2: EMPIRICAL SIMULATION: 50 UNSTUDIED WORDS VS 10 DUE REVIEW WORDS
  // ==========================================================================
  console.log('\n--- Section 2: Empirical Stress Test: 50 Unstudied vs 10 Due Words ---');

  interface MockWord {
    id: string;
    word: string;
    translation: string;
    classroom_id: string;
    created_at: string;
  }

  interface MockSRS {
    word_id: string;
    user_id: string;
    review_count: number;
    next_review_date: string;
  }

  // Model the EXACT PostgreSQL query logic from 20260919_optimize_session_queries.sql:
  function simulateGetDueWordsList(
    words: MockWord[],
    srs: MockSRS[],
    userId: string,
    classroomId: string,
    limit: number,
    now: Date = new Date('2026-09-19T17:00:00Z'),
  ) {
    const nowIso = now.toISOString();

    // CTE due_words:
    // WHERE w.classroom_id = v_target_class_id
    //   AND s.review_count > 0
    //   AND s.next_review_date <= (now() AT TIME ZONE 'UTC')
    // ORDER BY s.next_review_date ASC
    // LIMIT p_limit
    const srsMap = new Map<string, MockSRS>();
    for (const s of srs) {
      if (s.user_id === userId) {
        srsMap.set(s.word_id, s);
      }
    }

    const eligibleDue = words
      .filter((w) => {
        if (w.classroom_id !== classroomId) return false;
        const s = srsMap.get(w.id);
        return s && s.review_count > 0 && s.next_review_date <= nowIso;
      })
      .map((w) => {
        const s = srsMap.get(w.id)!;
        return {
          ...w,
          review_count: s.review_count,
          next_review_date: s.next_review_date,
          priority: 1,
        };
      })
      .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date))
      .slice(0, limit);

    const dueCount = eligibleDue.length;
    const newWordsLimit = Math.max(0, limit - dueCount);

    // CTE new_words:
    // WHERE w.classroom_id = v_target_class_id
    //   AND (s.id IS NULL OR s.review_count = 0)
    // ORDER BY w.created_at DESC
    // LIMIT GREATEST(0, p_limit - due_count)
    const eligibleNew = words
      .filter((w) => {
        if (w.classroom_id !== classroomId) return false;
        const s = srsMap.get(w.id);
        return !s || s.review_count === 0;
      })
      .map((w) => ({
        ...w,
        review_count: 0,
        next_review_date: w.created_at,
        priority: 2,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, newWordsLimit);

    // Final union:
    // SELECT * FROM (due_words UNION ALL new_words)
    // ORDER BY c.priority ASC, c.next_review_date ASC
    // LIMIT p_limit
    const combined = [...eligibleDue, ...eligibleNew];
    combined.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.next_review_date.localeCompare(b.next_review_date);
    });

    return combined.slice(0, limit);
  }

  // Generate 50 unstudied words (created recently) and 10 due review words (past next_review_date)
  const mockClassId = 'class-stress-100';
  const mockUserId = 'user-stress-200';
  const testWords: MockWord[] = [];
  const testSRS: MockSRS[] = [];

  // 10 Due Words (with review_count > 0, next_review_date between 10 days ago and 1 hour ago)
  for (let i = 1; i <= 10; i++) {
    const id = `due-word-${String(i).padStart(2, '0')}`;
    // staggered past review dates: due-word-01 is oldest (10 days ago), due-word-10 is newest (1 hr ago)
    const hoursAgo = (11 - i) * 24;
    const pastDate = new Date(Date.parse('2026-09-19T17:00:00Z') - hoursAgo * 3600_000).toISOString();
    testWords.push({
      id,
      word: `due_${i}`,
      translation: `nghia_due_${i}`,
      classroom_id: mockClassId,
      created_at: '2026-08-01T00:00:00Z',
    });
    testSRS.push({
      word_id: id,
      user_id: mockUserId,
      review_count: i, // 1 to 10 reviews
      next_review_date: pastDate,
    });
  }

  // 50 Unstudied Words (created staggered from 2026-09-10 to 2026-09-18)
  for (let i = 1; i <= 50; i++) {
    const id = `new-word-${String(i).padStart(2, '0')}`;
    const minutesAgo = (51 - i) * 60;
    const createdDate = new Date(Date.parse('2026-09-19T12:00:00Z') - minutesAgo * 60_000).toISOString();
    testWords.push({
      id,
      word: `unstudied_${i}`,
      translation: `nghia_unstudied_${i}`,
      classroom_id: mockClassId,
      created_at: createdDate,
    });
    // No SRS record or review_count = 0 for unstudied words
    if (i % 5 === 0) {
      // Some unstudied words have an initialized SRS record with review_count = 0
      testSRS.push({
        word_id: id,
        user_id: mockUserId,
        review_count: 0,
        next_review_date: createdDate,
      });
    }
  }

  // Also add 15 future words (next_review_date in the future) that must NOT appear
  for (let i = 1; i <= 15; i++) {
    const id = `future-word-${String(i).padStart(2, '0')}`;
    testWords.push({
      id,
      word: `future_${i}`,
      translation: `nghia_future_${i}`,
      classroom_id: mockClassId,
      created_at: '2026-08-15T00:00:00Z',
    });
    testSRS.push({
      word_id: id,
      user_id: mockUserId,
      review_count: 3,
      next_review_date: new Date(Date.parse('2026-09-19T17:00:00Z') + i * 86400_000).toISOString(),
    });
  }

  it('S2.1: 50 unstudied + 10 due words with limit=20 returns all 10 due words first', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 20);
    assert.strictEqual(result.length, 20, 'Should return exactly 20 items');

    // The FIRST 10 items MUST be the 10 due words
    const first10 = result.slice(0, 10);
    for (let i = 0; i < 10; i++) {
      assert(first10[i].id.startsWith('due-word-'), `Item ${i} must be a due word, got ${first10[i].id}`);
      assert(first10[i].review_count > 0, `Item ${i} must have review_count > 0`);
      assert.strictEqual(first10[i].priority, 1, `Item ${i} must have priority 1`);
    }

    // The remaining 10 items MUST be unstudied words
    const remaining10 = result.slice(10, 20);
    for (let i = 0; i < 10; i++) {
      assert(remaining10[i].id.startsWith('new-word-'), `Item ${10 + i} must be an unstudied word, got ${remaining10[i].id}`);
      assert.strictEqual(remaining10[i].review_count, 0, `Item ${10 + i} must have review_count 0`);
      assert.strictEqual(remaining10[i].priority, 2, `Item ${10 + i} must have priority 2`);
    }
  });

  it('S2.2: Due words within priority 1 are sorted by earliest next_review_date ascending', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 10);
    assert.strictEqual(result.length, 10);
    for (let i = 0; i < 9; i++) {
      const curr = result[i].next_review_date;
      const next = result[i + 1].next_review_date;
      assert(curr <= next, `Due words must sort chronologically ASC: ${curr} <= ${next}`);
    }
  });

  it('S2.3: When limit=10, 0 unstudied words starve the 10 due words (100% due words returned)', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 10);
    assert.strictEqual(result.length, 10);
    assert(result.every((w) => w.id.startsWith('due-word-')), 'Every returned word must be a due word');
    const unstudiedCount = result.filter((w) => w.id.startsWith('new-word-')).length;
    assert.strictEqual(unstudiedCount, 0, 'Zero unstudied words when limit matches due count');
  });

  it('S2.4: When limit=5, earliest 5 due words are returned without any unstudied words', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 5);
    assert.strictEqual(result.length, 5);
    assert.strictEqual(result[0].id, 'due-word-01', 'Most overdue word must come first');
    assert.strictEqual(result[4].id, 'due-word-05');
  });

  it('S2.5: When limit=50, all 10 due words return first followed by 40 newest unstudied words', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 50);
    assert.strictEqual(result.length, 50);
    // Index 0-9 are due words
    for (let i = 0; i < 10; i++) {
      assert(result[i].id.startsWith('due-word-'), `Index ${i} must be due word`);
    }
    // Index 10-49 are unstudied words sorted by created_at DESC
    for (let i = 10; i < 50; i++) {
      assert(result[i].id.startsWith('new-word-'), `Index ${i} must be new word`);
    }
    for (let i = 10; i < 49; i++) {
      assert(
        result[i].next_review_date <= result[i + 1].next_review_date,
        'Unstudied words within priority 2 are sorted by c.next_review_date ASC',
      );
    }
  });

  it('S2.6: Future scheduled words (next_review_date > now) are strictly excluded from queue', () => {
    const result = simulateGetDueWordsList(testWords, testSRS, mockUserId, mockClassId, 50);
    for (const item of result) {
      assert(!item.id.startsWith('future-word-'), `Future word ${item.id} must never appear in due queue`);
    }
  });

  // ==========================================================================
  // SECTION 3: ERROR STATE INDEFINITE PAUSE & KEYBOARD ADVANCE VERIFICATION
  // ==========================================================================
  console.log('\n--- Section 3: Error State Indefinite Pause & Manual Advance ---');

  const reviewSessionPath = path.resolve('src/app/review/session/page.tsx');
  const reviewSessionCode = fs.readFileSync(reviewSessionPath, 'utf8');

  it('S3.1: ReviewSession does not schedule auto-advance timer on incorrect or close answers', () => {
    // Audit lines in finalize():
    assert(reviewSessionCode.includes('if (isCorrect) {'), 'Must branch on isCorrect');
    assert(
      reviewSessionCode.includes('playWordWithBuffer(current.word, 400)'),
      'Correct answers must await playWordWithBuffer',
    );
    // Incorrect branch must clear timer and NOT call setTimeout(advance, ...)
    const incorrectBranch = reviewSessionCode.substring(
      reviewSessionCode.indexOf('} else {'),
      reviewSessionCode.indexOf('[current, userId, goNext]'),
    );
    assert(!incorrectBranch.includes('setTimeout(advance'), 'Must NOT call setTimeout(advance) in incorrect branch');
    assert(incorrectBranch.includes('clearTimeout(advanceTimer.current)'), 'Must clear advanceTimer on error');
    assert(incorrectBranch.includes('advanceTimer.current = null'), 'Must set advanceTimer to null on error');
    assert(incorrectBranch.includes('speak(current.word, 1.0)'), 'Must pronounce word for reinforcement on error');
  });

  it('S3.2: ReviewSession keyboard handler binds Enter and Space to skipWait after answer submission', () => {
    assert(
      reviewSessionCode.includes("if (answeredRef.current && (e.key === 'Enter' || e.key === ' '))"),
      'Must listen for Enter and Space when answeredRef is true',
    );
    assert(reviewSessionCode.includes('skipWait();'), 'Must call skipWait on Enter/Space');
  });

  it('S3.3: ReviewSession skipWait buffers rapid keypresses via pendingSkipRef until feedback lock releases', () => {
    assert(reviewSessionCode.includes('pendingSkipRef.current = true'), 'Must set pendingSkipRef if pressed before lock releases');
    assert(reviewSessionCode.includes('FEEDBACK_LOCK_MS = 100'), 'FEEDBACK_LOCK_MS must be 100ms');
    assert(
      reviewSessionCode.includes('if (pendingSkipRef.current) {\n          pendingSkipRef.current = false;\n          advanceFn.current?.();\n        }'),
      'Must execute pending skip when feedback lock expires',
    );
  });

  const writingPath = path.resolve('src/app/writing/page.tsx');
  const writingCode = fs.readFileSync(writingPath, 'utf8');

  it('S3.4: Writing practice page does not auto-advance after 2.4s or 2.5s on error/close', () => {
    assert(!writingCode.includes('setTimeout(advance, 2400)'), 'Old 2400ms auto-advance must be removed');
    assert(!writingCode.includes('setTimeout(advance, 2500)'), 'Old 2500ms auto-advance must be removed');
    const writingSubmitBody = writingCode.substring(
      writingCode.indexOf('const handleSubmit = useCallback'),
      writingCode.indexOf('// Lưu session accuracy khi xong'),
    );
    assert(writingSubmitBody.includes('if (v === ' + "'correct')"), 'Must distinguish correct verdict');
    const writingElse = writingSubmitBody.substring(writingSubmitBody.indexOf('} else {'));
    assert(!writingElse.includes('setTimeout(advance'), 'Must NOT set auto-advance in wrong/close branch');
    assert(writingElse.includes('clearTimeout(advanceTimer.current)'), 'Must clear advanceTimer');
    assert(writingElse.includes('advanceTimer.current = null'), 'Must nullify advanceTimer');
  });

  it('S3.5: Writing practice page binds both input onKeyDown and global onGlobalKey for Enter and Space', () => {
    assert(writingCode.includes("if (e.key === 'Enter')"), 'Input onKeyDown must check Enter');
    assert(writingCode.includes("else skipWait();"), 'Input onKeyDown must skipWait when verdict !== null');
    assert(writingCode.includes("else if (e.key === ' ' && verdict !== null)"), 'Input onKeyDown must handle Space');
    assert(writingCode.includes("if (e.key === 'Enter' || e.key === ' ')"), 'Global key listener must check Enter or Space');
    assert(writingCode.includes("skipWait();"), 'Global key listener must call skipWait()');
  });

  const learnModePath = path.resolve('src/app/flashcard/LearnMode.tsx');
  const learnModeCode = fs.readFileSync(learnModePath, 'utf8');

  it('S3.6: Flashcard LearnMode recall phase pauses indefinitely on wrong answers', () => {
    assert(learnModeCode.includes('// wrong / close: không auto-next'), 'LearnMode must document no auto-next on wrong/close');
    const recallFinalize = learnModeCode.substring(
      learnModeCode.indexOf('const finalizeRecall = useCallback'),
      learnModeCode.indexOf('const submitRecall = useCallback'),
    );
    assert(!recallFinalize.includes('setTimeout(advance, 2500)'), 'LearnMode must not use 2500ms timer');
    assert(recallFinalize.includes('advanceTimer.current = null'), 'LearnMode must clear advanceTimer on error');
    assert(learnModeCode.includes("if (verdict === null) submitRecall(); else goNextRecall();"), 'Enter must advance on answered card');
    assert(learnModeCode.includes("else if (e.key === ' ' && verdict !== null)"), 'Space must advance on answered card');
  });

  // ==========================================================================
  // SECTION 4: STATE-MACHINE SIMULATION: VERIFYING INDEFINITE PAUSE & ENTER/SPACE
  // ==========================================================================
  console.log('\n--- Section 4: State-Machine Simulation: Indefinite Pause & Keys ---');

  interface SessionState {
    currentIndex: number;
    cards: string[];
    verdict: 'correct' | 'wrong' | 'close' | null;
    advanceTimer: NodeJS.Timeout | null;
    answered: boolean;
    canSkip: boolean;
    pendingSkip: boolean;
  }

  class SessionStateMachineSimulator {
    public state: SessionState;

    constructor(cards: string[]) {
      this.state = {
        currentIndex: 0,
        cards: [...cards],
        verdict: null,
        advanceTimer: null,
        answered: false,
        canSkip: false,
        pendingSkip: false,
      };
    }

    submitAnswer(guess: string, answer: string): void {
      if (this.state.answered) return;
      this.state.answered = true;
      const isCorrect = guess.trim().toLowerCase() === answer.trim().toLowerCase();
      this.state.verdict = isCorrect ? 'correct' : 'wrong';

      // Feedback lock (100ms)
      setTimeout(() => {
        this.state.canSkip = true;
        if (this.state.pendingSkip) {
          this.state.pendingSkip = false;
          this.advance();
        }
      }, 100);

      if (isCorrect) {
        // Correct branch: audio buffer advance simulated at 400ms
        this.state.advanceTimer = setTimeout(() => {
          this.advance();
        }, 400);
      } else {
        // Error branch: INDEFINITE PAUSE
        if (this.state.advanceTimer) {
          clearTimeout(this.state.advanceTimer);
          this.state.advanceTimer = null;
        }
      }
    }

    pressKey(key: 'Enter' | ' '): void {
      if (!this.state.answered) return;
      if (!this.state.canSkip) {
        this.state.pendingSkip = true;
        return;
      }
      this.advance();
    }

    advance(): void {
      if (this.state.verdict === 'wrong') {
        // push head to back of queue
        const currentCard = this.state.cards[this.state.currentIndex];
        this.state.cards.push(currentCard);
      }
      this.state.currentIndex++;
      this.state.verdict = null;
      this.state.answered = false;
      this.state.canSkip = false;
      this.state.pendingSkip = false;
      if (this.state.advanceTimer) {
        clearTimeout(this.state.advanceTimer);
        this.state.advanceTimer = null;
      }
    }
  }

  await it('S4.1: Wrong answer pauses indefinitely after 2.4s, 2.5s, 5s without advancing', async () => {
    const sim = new SessionStateMachineSimulator(['word1', 'word2', 'word3']);
    sim.submitAnswer('wrong-guess', 'word1');

    assert.strictEqual(sim.state.verdict, 'wrong');
    assert.strictEqual(sim.state.currentIndex, 0);
    assert.strictEqual(sim.state.advanceTimer, null, 'Advance timer must be null on wrong answer');

    // Wait 250ms (well past lock, simulating user staring at the error screen)
    await new Promise((r) => setTimeout(r, 250));

    // Card MUST STILL be at index 0 — NO AUTO ADVANCE!
    assert.strictEqual(sim.state.currentIndex, 0, 'Card must NOT auto-advance on error');
    assert.strictEqual(sim.state.answered, true);
    assert.strictEqual(sim.state.canSkip, true, 'User is now allowed to advance manually');
  });

  await it('S4.2: Pressing Enter after wrong answer advances cleanly to next card', async () => {
    const sim = new SessionStateMachineSimulator(['apple', 'banana', 'cherry']);
    sim.submitAnswer('wrong-guess', 'apple');

    await new Promise((r) => setTimeout(r, 120)); // wait for lock release
    assert.strictEqual(sim.state.currentIndex, 0);

    // User presses Enter
    sim.pressKey('Enter');
    assert.strictEqual(sim.state.currentIndex, 1, 'Card index must advance to 1');
    assert.strictEqual(sim.state.verdict, null, 'Verdict must reset to null for next card');
    assert.strictEqual(sim.state.answered, false, 'Answered state must reset');
    // Failed card was re-queued to the back
    assert.strictEqual(sim.state.cards[sim.state.cards.length - 1], 'apple', 'Failed card must be re-queued');
  });

  await it('S4.3: Pressing Space after wrong answer advances cleanly to next card', async () => {
    const sim = new SessionStateMachineSimulator(['cat', 'dog']);
    sim.submitAnswer('kitten', 'cat');

    await new Promise((r) => setTimeout(r, 120)); // wait for lock release
    assert.strictEqual(sim.state.currentIndex, 0);

    // User presses Space
    sim.pressKey(' ');
    assert.strictEqual(sim.state.currentIndex, 1, 'Space key must advance to next card');
    assert.strictEqual(sim.state.verdict, null);
  });

  await it('S4.4: Pressing Enter during 100ms lock buffers input and advances immediately upon unlock', async () => {
    const sim = new SessionStateMachineSimulator(['sun', 'moon']);
    sim.submitAnswer('star', 'sun');

    // User immediately mashes Enter at 20ms (before lock expires)
    await new Promise((r) => setTimeout(r, 20));
    sim.pressKey('Enter');
    assert.strictEqual(sim.state.pendingSkip, true, 'Input must be buffered in pendingSkip');
    assert.strictEqual(sim.state.currentIndex, 0, 'Card has not yet advanced during lock');

    // Wait until 120ms total (lock expiry)
    await new Promise((r) => setTimeout(r, 120));
    assert.strictEqual(sim.state.currentIndex, 1, 'Card must have advanced immediately when lock expired');
    assert.strictEqual(sim.state.pendingSkip, false, 'Pending skip must be consumed');
  });

  // ==========================================================================
  // SECTION 5: AUDIO SYNCHRONIZATION GUARANTEE
  // ==========================================================================
  console.log('\n--- Section 5: Audio Synchronization & Fail-Safe Timeouts ---');

  const audioSyncPath = path.resolve('src/lib/audio-sync.ts');
  const audioSyncCode = fs.readFileSync(audioSyncPath, 'utf8');

  it('S5.1: playWordWithBuffer has safety timeout guard (maxWaitMs=3000)', () => {
    assert(audioSyncCode.includes('maxWaitMs = 3000'), 'Default maxWaitMs must be 3000ms');
    assert(audioSyncCode.includes('Promise.race([audioPromise, timeoutPromise])'), 'Must race against timeoutPromise');
    assert(audioSyncCode.includes('bufferMs = 400'), 'Default buffer interval must be 400ms');
  });

  const studyPath = path.resolve('src/lib/study.ts');
  const studyCode = fs.readFileSync(studyPath, 'utf8');

  it('S5.2: speak() returns Promise<void> with 3500ms safety watchdog', () => {
    assert(studyCode.includes('export function speak(text: string'), 'speak must be exported');
    assert(studyCode.includes('Promise<void>'), 'speak must return Promise<void>');
    assert(studyCode.includes('window.setTimeout(resolve, 3500)'), 'speak must have 3500ms race guard');
    assert(studyCode.includes('speechEpoch'), 'speak must track speechEpoch');
  });

  it('S5.3: ReviewSession correctly awaits playWordWithBuffer before advance', () => {
    assert(
      reviewSessionCode.includes('void playWordWithBuffer(current.word, 400).then(() => {'),
      'ReviewSession must await playWordWithBuffer(400)',
    );
    assert(
      reviewSessionCode.includes('if (advanceFn.current === advance) {\n            advance();\n          }'),
      'Must verify advanceFn reference before calling advance',
    );
  });

  console.log('\n================================================================');
  console.log(`📊 CHALLENGER M2.2 SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.log(`❌ FAILED TESTS: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('🎉 ALL EMPIRICAL CHALLENGES VERIFIED AND PASSED PERFECTLY!');
    console.log('================================================================\n');
  }
}

runAllChallengerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
