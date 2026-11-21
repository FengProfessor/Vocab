import assert from 'node:assert/strict';
import {
  buildAssignedWordsOverview,
  classifyAssignedWordProgress,
  countLearnedClassroomWordsByStudent,
} from '../src/lib/teacher-assigned-words';

// Case 1: Word assigned in classroom but student hasn't studied it yet
{
  const unreviewed = classifyAssignedWordProgress(null);
  assert.equal(unreviewed.status, 'pending');
  assert.equal(unreviewed.reviewCount, 0);
  assert.equal(unreviewed.lastReviewedAt, null);

  const zeroCount = classifyAssignedWordProgress({
    word_id: 'w0',
    review_count: 0,
    last_reviewed_at: null,
    stability: 0,
  });
  assert.equal(zeroCount.status, 'pending');
}

// Case 2: Word studied in flashcards (< 7 days stability -> learning, >= 7 days -> mastered)
{
  const learning = classifyAssignedWordProgress({
    word_id: 'w1',
    review_count: 1,
    stability: 2.5,
    last_reviewed_at: '2026-11-21T02:00:00Z',
  });
  assert.equal(learning.status, 'learning');
  assert.equal(learning.reviewCount, 1);

  const mastered = classifyAssignedWordProgress({
    word_id: 'w2',
    review_count: 4,
    stability: 12.0,
    last_reviewed_at: '2026-11-21T02:05:00Z',
  });
  assert.equal(mastered.status, 'mastered');
  assert.equal(mastered.reviewCount, 4);
}

// Case 3: Full classroom assigned words overview preserves order, dictionary_data metadata, and summary
{
  const overview = buildAssignedWordsOverview(
    [
      {
        id: 'w1',
        word: 'balanced diet',
        translation: 'chế độ ăn cân bằng',
        pos: 'n',
        ipa: 'ˈbæl.ənst ˈdaɪ.ət',
        created_at: '2026-11-21T02:00:00Z',
        dictionary_data: { section: '1. Từ vựng trọng tâm', source: 'teacher_import' },
      },
      {
        id: 'w2',
        word: 'regular exercise',
        translation: 'tập thể dục đều đặn',
        created_at: '2026-11-21T01:59:00Z',
        dictionary_data: { section: '1. Từ vựng trọng tâm', source: 'teacher_import' },
      },
      {
        id: 'w3',
        word: 'nutritious',
        translation: 'giàu dinh dưỡng',
        created_at: '2026-11-21T01:58:00Z',
      },
    ],
    [
      { word_id: 'w2', review_count: 2, stability: 4, last_reviewed_at: '2026-11-21T02:10:00Z' },
      { word_id: 'w3', review_count: 5, stability: 15, last_reviewed_at: '2026-11-20T09:00:00Z' },
    ],
  );

  assert.deepEqual(overview.summary, {
    total: 3,
    learned: 2,
    mastered: 1,
    pending: 1,
  });
  assert.equal(overview.items[0].status, 'pending');
  assert.equal(overview.items[0].section, '1. Từ vựng trọng tâm');
  assert.equal(overview.items[0].source, 'teacher_import');
  assert.equal(overview.items[1].status, 'learning');
  assert.equal(overview.items[2].status, 'mastered');
}

// Case 4: Multi-student count ignores personal words and zero-review rows
{
  const counts = countLearnedClassroomWordsByStudent(
    ['cw1', 'cw2', 'cw3'],
    [
      { user_id: 's1', word_id: 'cw1', review_count: 0, last_reviewed_at: null },
      { user_id: 's1', word_id: 'personal-1', review_count: 5, last_reviewed_at: '2026-11-21T01:00:00Z' },
      { user_id: 's2', word_id: 'cw1', review_count: 1, last_reviewed_at: '2026-11-21T01:00:00Z' },
      { user_id: 's2', word_id: 'cw1', review_count: 2, last_reviewed_at: '2026-11-21T02:00:00Z' },
      { user_id: 's2', word_id: 'cw2', review_count: 3, last_reviewed_at: '2026-11-21T02:05:00Z' },
    ],
  );

  assert.equal(counts.get('s1') ?? 0, 0);
  assert.equal(counts.get('s2'), 2);
}

console.log('ALL teacher-assigned-words tests PASSED!');
