import assert from 'node:assert/strict';
import {
  aggregateWordSummaries,
  mergeAndDedupeNewWords,
  type UnifiedWordSummaryCounts,
} from '../src/lib/unified-student-words';

interface MockNewWord {
  id: string;
  word: string;
  translation: string;
  classroom_id?: string | null;
  created_at?: string | null;
  source?: string;
  familyWords?: Array<{ word: string; pos?: string; meaning?: string }>;
  teacherNote?: string;
}

const PERSONAL_ID = '11111111-1111-4111-8111-111111111111';
const CLASS_A_ID = '22222222-2222-4222-8222-222222222222';
const CLASS_B_ID = '33333333-3333-4333-8333-333333333333';

// 1. Teacher-assigned words come first in exact 10ms-offset batch order ahead of older personal words
{
  const baseMs = Date.parse('2026-11-19T10:00:00.000Z');
  const personalWords: MockNewWord[] = [
    {
      id: 'p-1',
      word: 'resilient',
      translation: 'kiên cường',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-10T08:00:00.000Z',
    },
    {
      id: 'p-2',
      word: 'meticulous',
      translation: 'tỉ mỉ',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-09T08:00:00.000Z',
    },
  ];
  const teacherBatch: MockNewWord[] = [
    {
      id: 't-1',
      word: 'Antibiotic',
      translation: 'Thuốc kháng sinh',
      classroom_id: CLASS_A_ID,
      created_at: new Date(baseMs).toISOString(),
      source: 'teacher_import',
      familyWords: [{ word: 'Antibacterial', pos: 'adj', meaning: 'kháng khuẩn' }],
    },
    {
      id: 't-2',
      word: 'Bacteria',
      translation: 'Vi khuẩn',
      classroom_id: CLASS_A_ID,
      created_at: new Date(baseMs - 10).toISOString(),
      source: 'teacher_import',
    },
    {
      id: 't-3',
      word: 'Balance',
      translation: 'Sự cân bằng',
      classroom_id: CLASS_A_ID,
      created_at: new Date(baseMs - 20).toISOString(),
      source: 'teacher_import',
      teacherNote: 'Chú ý giới từ',
    },
  ];

  // Deliberately put personalWords BEFORE teacherBatch in input array
  const merged = mergeAndDedupeNewWords([...personalWords, ...teacherBatch], PERSONAL_ID, 20);
  assert.deepEqual(
    merged.map((w) => w.id),
    ['t-1', 't-2', 't-3', 'p-1', 'p-2'],
    'Teacher batch words must come first in exact assigned order, followed by older personal words',
  );
}

// 1b. Teacher-assigned words STILL come first ahead of NEWER personal words saved later
{
  const newerPersonalWords: MockNewWord[] = [
    {
      id: 'p-new-1',
      word: 'ephemeral',
      translation: 'phù du',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-21T08:30:00.000Z',
    },
    {
      id: 'p-new-2',
      word: 'ubiquitous',
      translation: 'phổ biến khắp nơi',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-21T08:20:00.000Z',
    },
  ];
  const earlierTeacherBatch: MockNewWord[] = [
    {
      id: 't-u1-1',
      word: 'balanced diet',
      translation: 'chế độ ăn cân bằng',
      classroom_id: CLASS_A_ID,
      created_at: '2026-11-20T10:00:00.000Z',
      source: 'teacher_import',
    },
    {
      id: 't-u1-2',
      word: 'cut down on',
      translation: 'cắt giảm',
      classroom_id: CLASS_A_ID,
      created_at: '2026-11-20T09:59:59.990Z',
      source: 'teacher_import',
    },
  ];

  const merged = mergeAndDedupeNewWords([...newerPersonalWords, ...earlierTeacherBatch], PERSONAL_ID, 20);
  assert.deepEqual(
    merged.map((w) => w.id),
    ['t-u1-1', 't-u1-2', 'p-new-1', 'p-new-2'],
    'Teacher-assigned words must stay prioritized ahead of newer personal words in Học Từ Mới',
  );
}

// 2. Duplicate word in both personal and enrolled class prefers teacher-assigned / enrolled version
{
  const items: MockNewWord[] = [
    {
      id: 'personal-dup',
      word: 'Carbon footprint',
      translation: 'Dấu chân cacbon (từ điển chung)',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-19T12:00:00.000Z', // newer timestamp in personal
    },
    {
      id: 'teacher-dup',
      word: '  carbon footprint  ',
      translation: 'Lượng khí thải carbon (GV giao)',
      classroom_id: CLASS_A_ID,
      created_at: '2026-11-18T12:00:00.000Z', // older timestamp in class
      source: 'teacher_import',
      familyWords: [{ word: 'Carbon-neutral', pos: 'adj', meaning: 'trung hòa carbon' }],
      teacherNote: 'Cấu trúc: reduce one’s carbon footprint',
    },
    {
      id: 'enrolled-non-import',
      word: 'Sustain',
      translation: 'Duy trì (lớp học)',
      classroom_id: CLASS_B_ID,
      created_at: '2026-11-17T08:00:00.000Z',
    },
    {
      id: 'personal-sustain',
      word: 'sustain',
      translation: 'Chịu đựng (cá nhân)',
      classroom_id: PERSONAL_ID,
      created_at: '2026-11-19T08:00:00.000Z',
    },
    {
      id: 'teacher-older',
      word: 'Mitigate',
      translation: 'Giảm nhẹ (bản cũ)',
      classroom_id: CLASS_A_ID,
      created_at: '2026-11-15T08:00:00.000Z',
      source: 'teacher_import',
    },
    {
      id: 'teacher-newer',
      word: 'mitigate',
      translation: 'Làm dịu đi, giảm thiểu (bản mới)',
      classroom_id: CLASS_B_ID,
      created_at: '2026-11-19T09:00:00.000Z',
      source: 'teacher_import',
    },
  ];

  const merged = mergeAndDedupeNewWords(items, PERSONAL_ID, 20);
  assert.equal(merged.length, 3);

  const fp = merged.find((w) => w.word.trim().toLowerCase() === 'carbon footprint');
  assert.ok(fp);
  assert.equal(fp.id, 'teacher-dup');
  assert.equal(fp.translation, 'Lượng khí thải carbon (GV giao)');
  assert.equal(fp.familyWords?.[0]?.word, 'Carbon-neutral');
  assert.equal(fp.teacherNote, 'Cấu trúc: reduce one’s carbon footprint');

  const sustain = merged.find((w) => w.word.trim().toLowerCase() === 'sustain');
  assert.equal(sustain?.id, 'enrolled-non-import');

  const mitigate = merged.find((w) => w.word.trim().toLowerCase() === 'mitigate');
  assert.equal(mitigate?.id, 'teacher-newer');
}

// 3. Respects limit and filters empty/whitespace words
{
  const items: MockNewWord[] = [
    { id: '1', word: '   ', translation: 'blank', classroom_id: CLASS_A_ID, created_at: '2026-11-19T10:00:00.000Z' },
    { id: '2', word: 'alpha', translation: 'a', classroom_id: CLASS_A_ID, created_at: '2026-11-19T10:00:00.000Z' },
    { id: '3', word: 'beta', translation: 'b', classroom_id: CLASS_A_ID, created_at: '2026-11-19T09:00:00.000Z' },
    { id: '4', word: 'gamma', translation: 'c', classroom_id: CLASS_A_ID, created_at: '2026-11-19T08:00:00.000Z' },
  ];

  assert.deepEqual(mergeAndDedupeNewWords(items, PERSONAL_ID, 2).map((w) => w.id), ['2', '3']);
  assert.deepEqual(mergeAndDedupeNewWords(items, PERSONAL_ID, 0), []);
  assert.deepEqual(mergeAndDedupeNewWords([], PERSONAL_ID, 10), []);
}

// 4. aggregateWordSummaries sums all counters and 6 level buckets safely
{
  const empty = aggregateWordSummaries([]);
  assert.deepEqual(empty, {
    total: 0,
    dueCount: 0,
    newCount: 0,
    reviewDueCount: 0,
    levelCounts: [0, 0, 0, 0, 0, 0],
  });

  const personalSummary: UnifiedWordSummaryCounts = {
    total: 25,
    dueCount: 12,
    newCount: 10,
    reviewDueCount: 2,
    levelCounts: [10, 5, 4, 3, 2, 1],
  };
  const classSummary: UnifiedWordSummaryCounts = {
    total: 63,
    dueCount: 63,
    newCount: 63,
    reviewDueCount: 0,
    levelCounts: [63, 0, 0, 0, 0, 0],
  };
  const malformedSummary: UnifiedWordSummaryCounts = {
    total: Number.NaN,
    dueCount: -5,
    newCount: 3,
    reviewDueCount: 1,
    levelCounts: [2, 1], // shorter than 6 buckets
  };

  const aggregated = aggregateWordSummaries([personalSummary, classSummary, malformedSummary]);
  assert.deepEqual(aggregated, {
    total: 88,
    dueCount: 75,
    newCount: 76,
    reviewDueCount: 3,
    levelCounts: [75, 6, 4, 3, 2, 1],
  });
}

console.log('ALL unified-student-words tests PASSED!');
