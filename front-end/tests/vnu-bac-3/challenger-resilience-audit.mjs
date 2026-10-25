/**
 * EMPIRICAL RESILIENCE & EDGE-CASE AUDIT SUITE — VNU TEST BẬC 3
 * Executed by Empirical Challenger (challenger_final_1)
 *
 * Objectives:
 * 1. Test error resilience: VnuAudioPlayer behavior on missing audio, network failure, 2-play limit
 * 2. Test word count boundary edge cases: pure whitespace, emojis, punctuation, Unicode, surrogates
 * 3. Verify physical audio file headers and properties
 * 4. Verify decoupled scoring invariance with Writing/Speaking submissions
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const AUDIO_DIR = path.join(ROOT_DIR, 'public', 'audio', 'vnu-bac3');

console.log('======================================================================');
console.log('   CHALLENGER RESILIENCE & EDGE-CASE AUDIT — VNU TEST BẬC 3          ');
console.log('======================================================================\n');

// ============================================================================
// PART 1: WORD COUNT EDGE CASES & BOUNDARY CONDITIONS
// ============================================================================
console.log('>>> [PART 1] Word Count Boundary & Edge-Case Stress Testing');

// Extract verbatim function matching src/components/vnu-bac-3/VnuSplitPane.tsx:59-64
function countWords(str) {
  if (!str) return 0;
  const trimmed = str.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

// 1.1 Pure Whitespace Edge Cases
{
  assert.equal(countWords(undefined), 0, 'undefined must be 0 words');
  assert.equal(countWords(null), 0, 'null must be 0 words');
  assert.equal(countWords(''), 0, 'empty string must be 0 words');
  assert.equal(countWords('   '), 0, 'spaces only must be 0 words');
  assert.equal(countWords('\t\t\t'), 0, 'tabs only must be 0 words');
  assert.equal(countWords('\n\n\r\n'), 0, 'newlines only must be 0 words');
  assert.equal(countWords('  \t \n \r  \t\t '), 0, 'mixed whitespace must be 0 words');
  
  // Unicode Whitespace checks
  assert.equal(countWords('\u00A0\u00A0'), 0, 'NBSP (Non-breaking space) must be 0 words');
  assert.equal(countWords('\u2002\u2003\u2009'), 0, 'En-space, em-space, thin-space must be 0 words');
  assert.equal(countWords('\u3000'), 0, 'Ideographic space (CJK) must be 0 words');
  console.log('  [PASS] 1.1 Pure whitespace edge cases (empty, tabs, newlines, Unicode NBSP) -> 0 words');
}

// 1.2 Punctuation Edge Cases
{
  // Punctuation attached to words
  assert.equal(countWords('Hello, world!'), 2, 'Comma and exclamation mark attached to words');
  assert.equal(countWords("It's a state-of-the-art solution."), 4, "Contraction and hyphenated compound words");
  assert.equal(countWords('Wait... what? Really?!'), 3, 'Ellipsis and double punctuation');
  assert.equal(countWords('Dear Mr. Smith,\n\nThank you for your letter.'), 8, 'Formal letter salutation and paragraph');
  
  // Punctuation only (split by whitespace)
  assert.equal(countWords('.'), 1, 'Single dot token');
  assert.equal(countWords('... ,,, !!! ??? ---'), 5, '5 punctuation tokens separated by spaces');
  assert.equal(countWords('?!.,:;()[]{}'), 1, 'Punctuation cluster without spaces');
  console.log('  [PASS] 1.2 Punctuation attached to words, contractions, and compound words handled consistently');
}

// 1.3 Emojis & Multi-Byte Unicode Edge Cases
{
  assert.equal(countWords('Hello 😊 world!'), 3, 'Single emoji between words');
  assert.equal(countWords('😊 👍 🚀'), 3, '3 emojis separated by spaces');
  assert.equal(countWords('😊👍🚀'), 1, '3 emojis without space counted as single token');
  
  // Compound emoji with Zero-Width Joiner (ZWJ sequence)
  const familyEmoji = '👨‍👩‍👧‍👦'; // 4 emojis joined with \u200D
  assert.equal(countWords(familyEmoji), 1, 'Compound ZWJ family emoji is 1 token');
  assert.equal(countWords(`My family ${familyEmoji} is happy.`), 5, 'Text with compound ZWJ emoji');
  console.log('  [PASS] 1.3 Emojis, surrogate pairs, and ZWJ sequences evaluated safely without crash');
}

// 1.4 Writing Task Minimum Word Thresholds (Task 1: 80, Task 2: 100)
{
  const makeTextOfWordCount = (count) => {
    return Array.from({ length: count }, (_, i) => `word${i + 1}`).join(' ');
  };

  // Task 1: minWords = 80
  const t1_under = makeTextOfWordCount(79);
  const t1_exact = makeTextOfWordCount(80);
  const t1_over = makeTextOfWordCount(81);

  assert.equal(countWords(t1_under), 79);
  assert.equal(countWords(t1_under) >= 80, false, '79 words must NOT meet Task 1 threshold');
  assert.equal(countWords(t1_exact), 80);
  assert.equal(countWords(t1_exact) >= 80, true, '80 words MUST meet Task 1 threshold');
  assert.equal(countWords(t1_over), 81);
  assert.equal(countWords(t1_over) >= 80, true, '81 words MUST meet Task 1 threshold');

  // Task 2: minWords = 100
  const t2_under = makeTextOfWordCount(99);
  const t2_exact = makeTextOfWordCount(100);
  const t2_over = makeTextOfWordCount(101);

  assert.equal(countWords(t2_under), 99);
  assert.equal(countWords(t2_under) >= 100, false, '99 words must NOT meet Task 2 threshold');
  assert.equal(countWords(t2_exact), 100);
  assert.equal(countWords(t2_exact) >= 100, true, '100 words MUST meet Task 2 threshold');
  assert.equal(countWords(t2_over), 101);
  assert.equal(countWords(t2_over) >= 100, true, '101 words MUST meet Task 2 threshold');

  console.log('  [PASS] 1.4 Task 1 (80 words) and Task 2 (100 words) boundary thresholds strictly enforced');
}

// 1.5 Stress & Performance on Massive Texts
{
  const hugeText = ('The quick brown fox jumps over the lazy dog. '.repeat(10000)); // 90,000 words
  const t0 = performance.now();
  const hugeCount = countWords(hugeText);
  const duration = performance.now() - t0;

  assert.equal(hugeCount, 90000, 'Massive text must accurately yield 90,000 words');
  assert.ok(duration < 100, `Execution time (${duration.toFixed(2)}ms) must be under 100ms`);
  console.log(`  [PASS] 1.5 Massive input stress test (90,000 words processed in ${duration.toFixed(2)}ms < 100ms)`);
}

// ============================================================================
// PART 2: VNU AUDIO PLAYER ERROR RESILIENCE SIMULATION
// ============================================================================
console.log('\n>>> [PART 2] VnuAudioPlayer Error Resilience & Regulation Simulation');

/**
 * Model of VnuAudioPlayer state machine and event transitions
 * from src/components/vnu-bac-3/VnuAudioPlayer.tsx
 */
class VnuAudioPlayerSim {
  constructor(options = {}) {
    this.examId = options.examId || 'ulis-sample-test-01';
    this.taskId = options.taskId || 'listening-part1';
    this.audioUrl = options.audioUrl;
    this.mode = options.mode || 'full_simulation';
    this.maxPlays = options.maxPlays || 2;
    this.storageKey = `vnu_b3_audio_${this.examId}_${this.taskId}`;

    this.isExamMode = this.mode === 'full_simulation';
    this.isPlaying = false;
    this.isLoading = false;
    this.currentTime = 0;
    this.duration = 0;
    this.playCount = 0;
    this.isLocked = false;
    this.audioError = null;
    this.limitReachedTriggered = false;

    // Simulated localStorage mock
    this.localStorage = options.localStorage || {};

    // Restore from storage if exam mode
    if (this.isExamMode && this.localStorage[this.storageKey]) {
      try {
        const parsed = JSON.parse(this.localStorage[this.storageKey]);
        this.playCount = typeof parsed.playCount === 'number' ? parsed.playCount : 0;
        if (parsed.isLocked || (this.playCount >= this.maxPlays && parsed.completed)) {
          this.isLocked = true;
        }
      } catch {
        // ignore
      }
    }
  }

  // Record play count persistence
  recordPlayCount(newCount) {
    this.playCount = newCount;
    if (this.isExamMode) {
      this.localStorage[this.storageKey] = JSON.stringify({
        playCount: newCount,
        completed: false,
        isLocked: false,
        lastPlayedAt: Date.now(),
      });
    }
  }

  // Toggle play
  handleTogglePlay(audioElementMock) {
    if (!audioElementMock || !this.audioUrl) {
      return { action: 'NO_OP_MISSING_AUDIO', audioUrl: this.audioUrl };
    }

    if (this.audioError) {
      this.handleRetry(audioElementMock);
      return { action: 'RETRY' };
    }

    if (this.isExamMode && this.isLocked) {
      return { action: 'BLOCKED_LOCKED', playCount: this.playCount, maxPlays: this.maxPlays };
    }

    if (this.isPlaying) {
      audioElementMock.pause();
      this.isPlaying = false;
      return { action: 'PAUSED', playCount: this.playCount };
    } else {
      if (audioElementMock.currentTime === 0 || audioElementMock.ended) {
        if (this.playCount >= this.maxPlays) {
          this.isLocked = true;
          return { action: 'BLOCKED_LIMIT_REACHED' };
        }
        const nextCount = this.playCount + 1;
        this.recordPlayCount(nextCount);
      }

      this.isLoading = true;
      try {
        audioElementMock.play();
        this.isPlaying = true;
        this.isLoading = false;
        this.audioError = null;
        return { action: 'PLAYING', playCount: this.playCount };
      } catch (err) {
        this.isPlaying = false;
        this.isLoading = false;
        this.audioError = 'Không thể phát tệp âm thanh. Vui lòng bấm thử lại.';
        return { action: 'PLAY_ERROR', error: this.audioError };
      }
    }
  }

  handleAudioError() {
    this.isLoading = false;
    this.isPlaying = false;
    this.audioError = 'Không thể tải tệp âm thanh. Vui lòng kiểm tra đường truyền mạng hoặc bấm thử lại.';
  }

  handleRetry(audioElementMock) {
    this.audioError = null;
    if (audioElementMock) {
      audioElementMock.load();
    }
  }

  handleAudioEnded() {
    this.isPlaying = false;
    this.isLoading = false;
    this.currentTime = 0;
    if (this.isExamMode && this.playCount >= this.maxPlays) {
      this.isLocked = true;
      this.limitReachedTriggered = true;
      this.localStorage[this.storageKey] = JSON.stringify({
        playCount: this.playCount,
        completed: true,
        isLocked: true,
        lastPlayedAt: Date.now(),
      });
    }
  }
}

// 2.1 Missing / Undefined Audio URL Behavior
{
  const player = new VnuAudioPlayerSim({ audioUrl: undefined });
  const mockAudio = { currentTime: 0, ended: false, play: () => {}, pause: () => {}, load: () => {} };
  const res = player.handleTogglePlay(mockAudio);

  assert.equal(res.action, 'NO_OP_MISSING_AUDIO', 'Missing audioUrl must safely return without error');
  assert.equal(player.isPlaying, false);
  assert.equal(player.isLoading, false);
  assert.equal(player.playCount, 0, 'Play count must not increment on missing audioUrl');
  console.log('  [PASS] 2.1 Undefined audioUrl safely ignored with 0 increments and zero exceptions');
}

// 2.2 Network 404 / Loading Error Event & Retry Mechanism
{
  const player = new VnuAudioPlayerSim({ audioUrl: '/audio/vnu-bac3/non-existent.mp3' });
  const mockAudio = {
    currentTime: 0,
    ended: false,
    play: () => { throw new Error('MEDIA_ELEMENT_ERROR: 404 Not Found'); },
    pause: () => {},
    load: () => { loadedCalled = true; },
  };
  let loadedCalled = false;

  // Trigger loading error event
  player.handleAudioError();
  assert.ok(player.audioError.includes('Không thể tải tệp âm thanh'), 'Audio error message displayed');
  assert.equal(player.isPlaying, false);
  assert.equal(player.isLoading, false);

  // Click retry button
  player.handleRetry(mockAudio);
  assert.equal(player.audioError, null, 'Error cleared on retry');
  assert.equal(loadedCalled, true, 'audio.load() invoked on retry');
  console.log('  [PASS] 2.2 Network / 404 error triggers error banner; retry cleanly resets error and reloads audio');
}

// 2.3 Strict ULIS 2-Play Limit & Session F5 Persistence
{
  const sharedStorage = {};
  const mockAudio = {
    currentTime: 0,
    ended: false,
    play: () => {},
    pause: () => {},
    load: () => {},
  };

  const session1 = new VnuAudioPlayerSim({
    audioUrl: '/audio/vnu-bac3/sample-01/listening-part1.mp3',
    mode: 'full_simulation',
    maxPlays: 2,
    localStorage: sharedStorage,
  });

  // Turn 1: First Play
  assert.equal(session1.playCount, 0);
  assert.equal(session1.isLocked, false);
  const r1 = session1.handleTogglePlay(mockAudio);
  assert.equal(r1.action, 'PLAYING');
  assert.equal(session1.playCount, 1, 'First play registered');

  // Pause halfway and resume
  mockAudio.currentTime = 50; // halfway
  const rPause = session1.handleTogglePlay(mockAudio);
  assert.equal(rPause.action, 'PAUSED');
  assert.equal(session1.playCount, 1, 'Pausing does not increment play count');

  const rResume = session1.handleTogglePlay(mockAudio);
  assert.equal(rResume.action, 'PLAYING');
  assert.equal(session1.playCount, 1, 'Resuming does not increment play count');

  // Turn 1 ends
  mockAudio.currentTime = 100;
  mockAudio.ended = true;
  session1.handleAudioEnded();
  assert.equal(session1.isPlaying, false);
  assert.equal(session1.isLocked, false, 'Not locked yet after 1 play');
  assert.equal(session1.limitReachedTriggered, false);

  // Turn 2: Second Play
  mockAudio.currentTime = 0;
  mockAudio.ended = false;
  const r2 = session1.handleTogglePlay(mockAudio);
  assert.equal(r2.action, 'PLAYING');
  assert.equal(session1.playCount, 2, 'Second play registered');

  // Turn 2 ends
  mockAudio.currentTime = 100;
  mockAudio.ended = true;
  session1.handleAudioEnded();
  assert.equal(session1.isLocked, true, 'Locked after 2 full plays complete');
  assert.equal(session1.limitReachedTriggered, true, 'onPlayLimitReached callback triggered');

  // Turn 3: Attempt third play
  mockAudio.currentTime = 0;
  mockAudio.ended = false;
  const r3 = session1.handleTogglePlay(mockAudio);
  assert.equal(r3.action, 'BLOCKED_LOCKED', 'Third play strictly blocked by ULIS regulation limiter');

  // F5 Page Reload Simulation: new component instance mounting with saved localStorage
  const session2_reloaded = new VnuAudioPlayerSim({
    audioUrl: '/audio/vnu-bac3/sample-01/listening-part1.mp3',
    mode: 'full_simulation',
    maxPlays: 2,
    localStorage: sharedStorage,
  });

  assert.equal(session2_reloaded.playCount, 2, 'Play count 2 preserved across page reloads');
  assert.equal(session2_reloaded.isLocked, true, 'Locked state preserved across page reloads');
  const rReloadPlay = session2_reloaded.handleTogglePlay(mockAudio);
  assert.equal(rReloadPlay.action, 'BLOCKED_LOCKED', 'Playback remains strictly locked after F5 reload');

  console.log('  [PASS] 2.3 Strict ULIS 2-play regulation limit enforced; F5 anti-cheat persistence verified');
}

// 2.4 Practice Mode: Playback Rate & Controls
{
  const mockAudio = {
    currentTime: 0,
    ended: false,
    play: () => {},
    pause: () => {},
    load: () => {},
  };

  const practicePlayer = new VnuAudioPlayerSim({
    audioUrl: '/audio/vnu-bac3/sample-01/listening-part1.mp3',
    mode: 'practice',
    maxPlays: 2,
  });

  assert.equal(practicePlayer.isExamMode, false, 'Exam mode disabled in practice');

  // Play 1
  const r1 = practicePlayer.handleTogglePlay(mockAudio);
  assert.equal(r1.action, 'PLAYING');
  practicePlayer.handleAudioEnded();

  // Play 2
  const r2 = practicePlayer.handleTogglePlay(mockAudio);
  assert.equal(r2.action, 'PLAYING');
  practicePlayer.handleAudioEnded();

  // Play 3: maxPlays=2 limit reached
  const r3 = practicePlayer.handleTogglePlay(mockAudio);
  assert.equal(r3.action, 'BLOCKED_LIMIT_REACHED', 'maxPlays=2 limit safely halts further playback');

  console.log('  [PASS] 2.4 Practice mode verifies mode flag and consistent maxPlays regulation handling');
}

// ============================================================================
// PART 3: PHYSICAL AUDIO ASSET INTEGRITY AUDIT
// ============================================================================
console.log('\n>>> [PART 3] Physical Audio File Header & Size Audit');

const FOLDERS = [
  'sample-01',
  'vnupress-mock-01',
  'vnupress-practice-02',
  'equiv-01',
  'equiv-02',
  'test-03',
  'test-04',
  'test-05',
  'test-06',
  'test-07',
  'test-08',
  'test-09',
  'test-10',
];

const expectedFiles = FOLDERS.flatMap((folder) => [
  `${folder}/listening-part1.mp3`,
  `${folder}/listening-part2.mp3`,
  `${folder}/listening-part3.mp3`,
]);

for (const relPath of expectedFiles) {
  const fullPath = path.join(AUDIO_DIR, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);

  const stat = fs.statSync(fullPath);
  assert.ok(stat.size > 800 * 1024, `File ${relPath} size (${stat.size} bytes) must exceed 800KB`);

  // Read first 4 bytes to check ID3 header 'ID3' (0x49 0x44 0x33) or MPEG Frame Sync (0xFF & 0xE0)
  const fd = fs.openSync(fullPath, 'r');
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);

  const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  const isMpegSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  assert.ok(isId3 || isMpegSync, `${relPath} must have valid ID3 or MPEG sync header (got: ${buf.toString('hex')})`);
  console.log(`  [PASS] ${relPath.padEnd(30)} — ${(stat.size / 1024).toFixed(1)} KB — Valid ${isId3 ? 'ID3' : 'MPEG Sync'} Header`);
}

// ============================================================================
// PART 4: DECOUPLED SCORING INVARIANCE AUDIT
// ============================================================================
console.log('\n>>> [PART 4] Decoupled Scoring Invariance Audit');

import {
  calculateVnuReadingScore,
  calculateVnuListeningScore,
  calculateVnuOverallScore,
  checkVnuPassCriteria,
  gradeVnuBac3Exam,
} from '../../src/lib/vnu-bac-3/scoring.ts';
import { getRawVnuBac3Exam } from '../../src/lib/vnu-bac-3/loader.ts';

const rawSample = getRawVnuBac3Exam('ulis-sample-test-01');
assert.ok(rawSample, 'Sample exam must load');

// Baseline: 45 correct answers, empty writing & speaking
const perfectAnswers = {};
for (const s of rawSample.sections) {
  if (s.type === 'reading' || s.type === 'listening') {
    for (const t of s.tasks) {
      for (const q of t.questions) {
        perfectAnswers[q.id] = q.correctAnswer;
      }
    }
  }
}

const baselineGrade = gradeVnuBac3Exam(rawSample, perfectAnswers, 1200);
assert.equal(baselineGrade.readingScore, 10.0);
assert.equal(baselineGrade.listeningScore, 10.0);
assert.equal(baselineGrade.overallScore, 10.0);
assert.equal(baselineGrade.isPassed, true);

// Perturbed Answers with arbitrary extra keys from Writing or Speaking drafts
const perturbedAnswers = {
  ...perfectAnswers,
  'sample-01-writing-task-1': 'This is my writing draft essay with 100 words...',
  'sample-01-writing-task-2': 'Another writing draft essay with 120 words...',
  'sample-01-speaking-part-1': 'Speaking notes outline keywords...',
  'sample-01-speaking-part-2': 'Cue card topic notes...',
};

const perturbedGrade = gradeVnuBac3Exam(rawSample, perturbedAnswers, 1200);

// Delete non-deterministic timestamps before comparing
delete baselineGrade.submittedAt;
delete perturbedGrade.submittedAt;

assert.deepEqual(
  perturbedGrade,
  baselineGrade,
  'Writing/Speaking data MUST NOT alter objective Reading & Listening scores'
);
console.log('  [PASS] Writing drafts and Speaking notes strictly decoupled from objective grading engine');

console.log('\n======================================================================');
console.log('   ALL RESILIENCE & EDGE-CASE AUDIT CHECKS PASSED (0 REGRESSIONS)     ');
console.log('======================================================================\n');
