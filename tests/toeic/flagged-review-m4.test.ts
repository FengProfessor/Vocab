/**
 * Unit & Integration Test Suite for Worker M4 (Listening Hub & Flagged Review Mode)
 * File: tests/toeic/flagged-review-m4.test.ts
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import {
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  recordQuestionAnswers,
  getFlaggedQuestionIds,
  toggleQuestionFlag,
  saveQuestionNote,
  getQuestionsForReview,
  type ToeicQuestionHistoryRecord,
} from '../../src/lib/toeic-question-history';

import fs from 'fs';
import path from 'path';

export async function runFlaggedReviewM4Tests(runner: TestRunner): Promise<void> {
  runner.describe('Worker M4: Listening Hub & Flagged Review Mode Suite', () => {});

  // ── 1. Flag Persistence & Toggle ──────────────────────────────────────────
  await runner.it('M4-1: toggleQuestionFlag creates record if absent and sets isFlagged=true', () => {
    setupMockBrowserEnvironment();
    try {
      const isFlagged = toggleQuestionFlag('q-ets-pro-01-001', 1);
      expect(isFlagged).toBe(true);

      const flaggedIds = getFlaggedQuestionIds(1);
      expect(flaggedIds).toContain('q-ets-pro-01-001');

      const storage = loadToeicQuestionHistory();
      const record = storage.records['q-ets-pro-01-001'];
      expect(record.isFlagged).toBe(true);
      expect(typeof record.flaggedAt).toBe('string');
      expect(record.part).toBe(1);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('M4-2: toggleQuestionFlag unflags previously flagged question', () => {
    setupMockBrowserEnvironment();
    try {
      toggleQuestionFlag('q-test-unflag-1', 2);
      expect(getFlaggedQuestionIds(2)).toContain('q-test-unflag-1');

      const isFlaggedAgain = toggleQuestionFlag('q-test-unflag-1', 2);
      expect(isFlaggedAgain).toBe(false);
      expect(getFlaggedQuestionIds(2).includes('q-test-unflag-1')).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 2. Personal Note Persistence ──────────────────────────────────────────
  await runner.it('M4-3: saveQuestionNote saves student note and timestamp', () => {
    setupMockBrowserEnvironment();
    try {
      saveQuestionNote('q-note-01', 5, 'Remember: subject-verb agreement with collective nouns');
      const storage = loadToeicQuestionHistory();
      const record = storage.records['q-note-01'];
      expect(record.notes).toBe('Remember: subject-verb agreement with collective nouns');
      expect(typeof record.notesUpdatedAt).toBe('string');
      expect(record.part).toBe(5);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 3. Questions For Review Retrieval ─────────────────────────────────────
  await runner.it('M4-4: getQuestionsForReview accurately filters by all, mistakes, flagged, and notes', () => {
    setupMockBrowserEnvironment();
    try {
      // Setup batch of records:
      // q1: correct, not flagged, no notes
      // q2: mistake (isCorrect=false)
      // q3: flagged (isFlagged=true, isCorrect=true)
      // q4: has notes (notes='check idiom', isCorrect=true, not flagged)
      recordQuestionAnswers([
        { questionId: 'q-rev-1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-rev-2', part: 1, isCorrect: false, selectedOption: 'B' },
        { questionId: 'q-rev-3', part: 2, isCorrect: true, selectedOption: 'C', isFlagged: true },
        { questionId: 'q-rev-4', part: 3, isCorrect: true, selectedOption: 'D', notes: 'Review dialogue' },
      ]);

      // 'all' review items: q2 (mistake), q3 (flagged), q4 (has notes) -> 3 items
      const allReview = getQuestionsForReview({ filter: 'all' });
      expect(allReview.length).toBe(3);
      const allIds = allReview.map((r) => r.questionId);
      expect(allIds).toContain('q-rev-2');
      expect(allIds).toContain('q-rev-3');
      expect(allIds).toContain('q-rev-4');
      expect(allIds.includes('q-rev-1')).toBe(false);

      // 'mistakes' filter: only q2
      const mistakes = getQuestionsForReview({ filter: 'mistakes' });
      expect(mistakes.length).toBe(1);
      expect(mistakes[0].questionId).toBe('q-rev-2');

      // 'flagged' filter: only q3
      const flagged = getQuestionsForReview({ filter: 'flagged' });
      expect(flagged.length).toBe(1);
      expect(flagged[0].questionId).toBe('q-rev-3');

      // 'notes' filter: only q4
      const notesList = getQuestionsForReview({ filter: 'notes' });
      expect(notesList.length).toBe(1);
      expect(notesList[0].questionId).toBe('q-rev-4');

      // Part filter: part 2 only returns q3
      const part2Review = getQuestionsForReview({ part: 2 });
      expect(part2Review.length).toBe(1);
      expect(part2Review[0].questionId).toBe('q-rev-3');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 4. Exam Submit Persistence Hook ───────────────────────────────────────
  await runner.it('M4-5: recordQuestionAnswers persists isFlagged and flaggedAt when provided', () => {
    setupMockBrowserEnvironment();
    try {
      const nowIso = new Date().toISOString();
      recordQuestionAnswers([
        {
          questionId: 'q-submit-flagged',
          part: 4,
          isCorrect: false,
          selectedOption: 'C',
          isFlagged: true,
          flaggedAt: nowIso,
        },
      ]);

      const storage = loadToeicQuestionHistory();
      const record = storage.records['q-submit-flagged'];
      expect(record.isFlagged).toBe(true);
      expect(record.flaggedAt).toBe(nowIso);
      expect(record.isCorrect).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 5. Listening Hub 260 Sets Integrity ───────────────────────────────────
  await runner.it('M4-6: Listening sets catalog has 260 sets spanning 2019-2026 and Parts 1-4', () => {
    const setsPath = path.resolve(process.cwd(), 'scripts/dautoeic/data/listening_sets.json');
    expect(fs.existsSync(setsPath)).toBe(true);
    const sets = JSON.parse(fs.readFileSync(setsPath, 'utf-8'));
    expect(sets.length).toBe(260);

    const yearCounts: Record<string, number> = {};
    const partCounts: Record<string, number> = {};
    for (const s of sets) {
      yearCounts[s.collection_name] = (yearCounts[s.collection_name] || 0) + 1;
      partCounts[s.toeic_part] = (partCounts[s.toeic_part] || 0) + 1;
    }

    expect(yearCounts['2026']).toBe(40);
    expect(yearCounts['2024']).toBe(40);
    expect(yearCounts['2023']).toBe(40);
    expect(yearCounts['2022']).toBe(40);
    expect(yearCounts['2021']).toBe(20);
    expect(yearCounts['2020']).toBe(40);
    expect(yearCounts['2019']).toBe(40);

    expect(partCounts['part1']).toBe(65);
    expect(partCounts['part2']).toBe(65);
    expect(partCounts['part3']).toBe(65);
    expect(partCounts['part4']).toBe(65);
  });
}

// Direct CLI execution support
if (require.main === module) {
  const runner = new TestRunner();
  runFlaggedReviewM4Tests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nWorker M4 Tests Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
