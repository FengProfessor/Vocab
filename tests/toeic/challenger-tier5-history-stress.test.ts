/**
 * Final Challenger M6-1 — Tier 5 Adversarial Hardening Suite:
 * Question History Rapid Flag Toggling, Note Saving & Concurrency Stress Test.
 *
 * Requirements:
 * - Test high-frequency rapid flag toggling (alternating state, timestamps, isolation).
 * - Test rapid note saving (mutations, interleaving, special characters, massive inputs).
 * - Test multi-question stress across all 7 Parts (200 questions).
 * - Test filter isolation in review mode ('flagged', 'mistakes', 'notes', 'all').
 * - Test storage resilience under corruption, backward compatibility, and reactive event bus dispatch.
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';
import {
  toggleQuestionFlag,
  saveQuestionNote,
  recordQuestionAnswers,
  getQuestionsForReview,
  getFlaggedQuestionIds,
  getMistakeQuestionIds,
  getCorrectQuestionIds,
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  resetPartProgress,
  TOEIC_QUESTION_HISTORY_STORAGE_KEY,
  TOEIC_HISTORY_UPDATED_EVENT,
} from '../../src/lib/toeic-question-history';

export async function runChallengerHistoryStressTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger Tier 5: Question History Rapid Flag Toggling & Note Saving Stress', () => {});

  let mockStorage: any;

  runner.beforeEach(() => {
    mockStorage = setupMockBrowserEnvironment();
    mockStorage.clear();
    if (typeof (global as any).window !== 'undefined') {
      (global as any).window.location = { hash: '', search: '', pathname: '/' };
    }
  });

  runner.afterEach(() => {
    teardownMockBrowserEnvironment();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-1: High-Frequency Flag Toggling (100 Rapid Invocations)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-1.1: 100 rapid alternating flag toggles maintain strict boolean inversion', () => {
    const qId = 'ets-pro-01-q001';
    const part = 1;

    for (let i = 1; i <= 100; i++) {
      const result = toggleQuestionFlag(qId, part);
      const expectedState = i % 2 === 1; // Odd: true, Even: false
      expect(result).toBe(expectedState);
    }

    // After 100 toggles (even number), question must be unflagged
    const flaggedIds = getFlaggedQuestionIds();
    expect(flaggedIds.includes(qId)).toBe(false);

    // 101st toggle sets to true
    const toggle101 = toggleQuestionFlag(qId, part);
    expect(toggle101).toBe(true);
    expect(getFlaggedQuestionIds().includes(qId)).toBe(true);

    // 102nd toggle sets back to false
    const toggle102 = toggleQuestionFlag(qId, part);
    expect(toggle102).toBe(false);
    expect(getFlaggedQuestionIds().includes(qId)).toBe(false);
  });

  await runner.it('ADV-HS-1.2: Flagged timestamp is preserved or refreshed correctly across toggle cycles', () => {
    const qId = 'ets-pro-01-q005';
    toggleQuestionFlag(qId, 1);

    const storage1 = loadToeicQuestionHistory();
    const record1 = storage1.records[qId];
    expect(record1.isFlagged).toBe(true);
    expect(typeof record1.flaggedAt).toBe('string');
    expect(isNaN(Date.parse(record1.flaggedAt!))).toBe(false);

    // Toggle off: flagged state is false
    toggleQuestionFlag(qId, 1);
    const storage2 = loadToeicQuestionHistory();
    expect(storage2.records[qId].isFlagged).toBe(false);

    // Toggle on again: receives new valid timestamp
    toggleQuestionFlag(qId, 1);
    const storage3 = loadToeicQuestionHistory();
    expect(storage3.records[qId].isFlagged).toBe(true);
    expect(typeof storage3.records[qId].flaggedAt).toBe('string');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-2: Interleaved Rapid Flag Toggling & Note Saving
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-2.1: Interleaved flag toggles and note updates preserve each other orthogonally', () => {
    const qId = 'ets-pro-02-q035';
    const part = 2;

    // 1. Save note first
    saveQuestionNote(qId, part, 'Ghi chú ban đầu: Chú ý trợ từ');
    let record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe('Ghi chú ban đầu: Chú ý trợ từ');
    expect(record.isFlagged).toBeFalsy();

    // 2. Toggle flag on: note must NOT be overwritten
    toggleQuestionFlag(qId, part);
    record = loadToeicQuestionHistory().records[qId];
    expect(record.isFlagged).toBe(true);
    expect(record.notes).toBe('Ghi chú ban đầu: Chú ý trợ từ');

    // 3. Update note: flag must NOT be lost
    saveQuestionNote(qId, part, 'Cập nhật lần 2: Đáp án gián tiếp');
    record = loadToeicQuestionHistory().records[qId];
    expect(record.isFlagged).toBe(true);
    expect(record.notes).toBe('Cập nhật lần 2: Đáp án gián tiếp');

    // 4. Toggle flag off: note must remain intact
    toggleQuestionFlag(qId, part);
    record = loadToeicQuestionHistory().records[qId];
    expect(record.isFlagged).toBe(false);
    expect(record.notes).toBe('Cập nhật lần 2: Đáp án gián tiếp');

    // 5. Submit answer via recordQuestionAnswers: notes and unflagged state preserved
    recordQuestionAnswers([
      {
        questionId: qId,
        part,
        selectedOption: 'B',
        isCorrect: false,
      },
    ]);
    record = loadToeicQuestionHistory().records[qId];
    expect(record.attemptCount).toBe(1);
    expect(record.selectedOption).toBe('B');
    expect(record.isCorrect).toBe(false);
    expect(record.notes).toBe('Cập nhật lần 2: Đáp án gián tiếp');
    expect(record.isFlagged).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-3: Multi-Question Stress Across All 7 Parts (200 Questions)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-3.1: 200 questions across 7 Parts handled concurrently with accurate review filtering', () => {
    const partDistribution: Record<number, number> = {
      1: 6,
      2: 25,
      3: 39,
      4: 30,
      5: 30,
      6: 16,
      7: 54,
    };

    let qCounter = 1;
    for (let p = 1; p <= 7; p++) {
      const count = partDistribution[p];
      for (let i = 0; i < count; i++) {
        const qId = `ets-pro-01-q${String(qCounter).padStart(3, '0')}`;
        toggleQuestionFlag(qId, p);
        saveQuestionNote(qId, p, `Ghi chú cho câu ${qCounter} Part ${p}`);
        qCounter++;
      }
    }
    expect(qCounter - 1).toBe(200);

    // Verify review filter 'flagged' returns all 200
    const allFlagged = getQuestionsForReview({ filter: 'flagged' });
    expect(allFlagged.length).toBe(200);

    // Verify review filter 'notes' returns all 200
    const allWithNotes = getQuestionsForReview({ filter: 'notes' });
    expect(allWithNotes.length).toBe(200);

    // Verify per-Part exact isolation
    for (let p = 1; p <= 7; p++) {
      const partFlagged = getQuestionsForReview({ filter: 'flagged', part: p });
      expect(partFlagged.length).toBe(partDistribution[p]);
      expect(partFlagged.every((r) => r.part === p)).toBe(true);

      const partNotes = getQuestionsForReview({ filter: 'notes', part: p });
      expect(partNotes.length).toBe(partDistribution[p]);
      expect(partNotes.every((r) => r.part === p)).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-4: Adversarial & Extreme Note Payloads
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-4.1: Empty and whitespace-only notes are saved without crashing', () => {
    const qId = 'ets-pro-03-q101';
    saveQuestionNote(qId, 5, '');
    let record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe('');

    saveQuestionNote(qId, 5, '   \n\t  ');
    record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe('   \n\t  ');

    // Review filter 'notes' checks .trim().length > 0, so whitespace-only should NOT appear
    const notesReview = getQuestionsForReview({ filter: 'notes' });
    expect(notesReview.some((r) => r.questionId === qId)).toBe(false);
  });

  await runner.it('ADV-HS-4.2: Massive note (10,000 characters) saves and serializes cleanly', () => {
    const qId = 'ets-pro-03-q102';
    const massiveText = 'A'.repeat(10000);
    saveQuestionNote(qId, 5, massiveText);

    const record = loadToeicQuestionHistory().records[qId];
    expect(record.notes?.length).toBe(10000);
    expect(record.notes).toBe(massiveText);

    // Check retrieval
    const review = getQuestionsForReview({ filter: 'notes' });
    expect(review.find((r) => r.questionId === qId)?.notes?.length).toBe(10000);
  });

  await runner.it('ADV-HS-4.3: XSS vectors and HTML markup are safely preserved as raw strings', () => {
    const qId = 'ets-pro-03-q103';
    const xssPayload = '<script>alert("hack")</script><img src=x onerror=alert(1)>';
    saveQuestionNote(qId, 5, xssPayload);

    const record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe(xssPayload);
  });

  await runner.it('ADV-HS-4.4: Emojis, Vietnamese diacritics, and zero-width Unicode characters are preserved', () => {
    const qId = 'ets-pro-03-q104';
    const complexText = 'Luyện nghe phản xạ 🚀 🔥 \u200B\u200C\uFEFF Cụm từ: take into account (cân nhắc)';
    saveQuestionNote(qId, 5, complexText);

    const record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe(complexText);
  });

  await runner.it('ADV-HS-4.5: JSON strings, quotes, and backslashes do not break serialization', () => {
    const qId = 'ets-pro-03-q105';
    const jsonPayload = '{"title": "Note", "escapes": "He said \\"Hello\\""}';
    saveQuestionNote(qId, 5, jsonPayload);

    const record = loadToeicQuestionHistory().records[qId];
    expect(record.notes).toBe(jsonPayload);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-5: Storage Resilience & Corruption Disaster Recovery
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-5.1: Corrupted JSON in localStorage falls back to empty storage envelope', () => {
    mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, '{ invalid json corrupted string');
    const storage = loadToeicQuestionHistory();

    expect(storage.version).toBe(1);
    expect(typeof storage.records).toBe('object');
    expect(Object.keys(storage.records).length).toBe(0);
  });

  await runner.it('ADV-HS-5.2: Legacy unversioned dictionary map automatically migrates to version 1', () => {
    const legacyData = {
      'q-legacy-01': {
        part: 5,
        isCorrect: true,
        attemptCount: 1,
        lastAnsweredAt: '2026-01-01T00:00:00.000Z',
      },
    };
    mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, JSON.stringify(legacyData));

    const migrated = loadToeicQuestionHistory();
    expect(migrated.version).toBe(1);
    expect(migrated.records['q-legacy-01']).toBeDefined();
    expect(migrated.records['q-legacy-01'].isCorrect).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-6: Reactive Event Bus Under Rapid Operations
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-6.1: Window dispatchEvent fires reliably on flag toggling and note saving', () => {
    const dispatchedEvents: any[] = [];
    (global as any).window.dispatchEvent = (event: any) => {
      dispatchedEvents.push(event);
    };

    toggleQuestionFlag('ets-pro-01-q010', 1);
    saveQuestionNote('ets-pro-01-q010', 1, 'Event bus note test');

    expect(dispatchedEvents.length).toBe(2);
    expect(dispatchedEvents[0].type).toBe(TOEIC_HISTORY_UPDATED_EVENT);
    expect(dispatchedEvents[0].detail.source).toBe('local_record');
    expect(dispatchedEvents[0].detail.questionIds).toEqual(['ets-pro-01-q010']);

    expect(dispatchedEvents[1].type).toBe(TOEIC_HISTORY_UPDATED_EVENT);
    expect(dispatchedEvents[1].detail.source).toBe('local_record');
    expect(dispatchedEvents[1].detail.questionIds).toEqual(['ets-pro-01-q010']);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-HS-7: Reset and Isolation Verification
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-HS-7.1: resetPartProgress isolates reset to targeted Part without affecting others', () => {
    toggleQuestionFlag('q-p1-1', 1);
    toggleQuestionFlag('q-p1-2', 1);
    toggleQuestionFlag('q-p2-1', 2);
    toggleQuestionFlag('q-p2-2', 2);

    expect(getFlaggedQuestionIds().length).toBe(4);

    // Reset Part 1 only
    resetPartProgress(1);

    const remainingFlagged = getFlaggedQuestionIds();
    expect(remainingFlagged.length).toBe(2);
    expect(remainingFlagged.includes('q-p2-1')).toBe(true);
    expect(remainingFlagged.includes('q-p2-2')).toBe(true);
    expect(remainingFlagged.includes('q-p1-1')).toBe(false);
  });
}

// Standalone execution support
if (
  require.main === module ||
  (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-tier5-history-stress.test'))
) {
  const runner = new TestRunner();
  runChallengerHistoryStressTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nHistory Stress Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
