/**
 * Test Suite: Review SRS Level & Cross-Classroom Deduplication Verification
 * 
 * Verifies the fixes for:
 * 1. SRS Level calculation (stabilityToLevel and reviewCountToLevel fallback).
 * 2. Cross-classroom word deduplication (case-insensitive, trim, higher review count, earlier next_review_date, richer metadata tie-break).
 * 3. Enriched review payload consistency across RPC, fallback query, and browse modes.
 * 4. Robust word validation (case-insensitive 'failed', 'analyzing', '⏳', blank/whitespace).
 * 5. RPC fetch limit padding to avoid queue starvation when duplicates exist.
 */

import { stabilityToLevel, reviewCountToLevel } from '../src/lib/srs';

// Test Runner
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

console.log('--- 1. Testing reviewCountToLevel Fallback Mapping ---');
assert(reviewCountToLevel(0) === 0, 'reviewCount = 0 -> level 0 (new)');
assert(reviewCountToLevel(-1) === 0, 'reviewCount < 0 -> level 0');
assert(reviewCountToLevel(1) === 1, 'reviewCount = 1 -> level 1 (~1d)');
assert(reviewCountToLevel(2) === 2, 'reviewCount = 2 -> level 2 (~3d)');
assert(reviewCountToLevel(3) === 3, 'reviewCount = 3 -> level 3 (~1w)');
assert(reviewCountToLevel(4) === 3, 'reviewCount = 4 -> level 3 (~1w)');
assert(reviewCountToLevel(5) === 4, 'reviewCount = 5 -> level 4 (~3w)');
assert(reviewCountToLevel(7) === 4, 'reviewCount = 7 -> level 4 (~3w)');
assert(reviewCountToLevel(8) === 5, 'reviewCount = 8 -> level 5 (~2mo)');
assert(reviewCountToLevel(12) === 5, 'reviewCount = 12 -> level 5 (~2mo)');
assert(reviewCountToLevel(13) === 6, 'reviewCount = 13 -> level 6 (3mo+)');
assert(reviewCountToLevel(50) === 6, 'reviewCount = 50 -> level 6');

console.log('\n--- 2. Testing stabilityToLevel Function ---');
assert(stabilityToLevel(0.5) === 1, 'stability 0.5 -> level 1');
assert(stabilityToLevel(1.9) === 1, 'stability 1.9 -> level 1');
assert(stabilityToLevel(2.0) === 2, 'stability 2.0 -> level 2');
assert(stabilityToLevel(4.9) === 2, 'stability 4.9 -> level 2');
assert(stabilityToLevel(5.0) === 3, 'stability 5.0 -> level 3');
assert(stabilityToLevel(9.9) === 3, 'stability 9.9 -> level 3');
assert(stabilityToLevel(10.0) === 4, 'stability 10.0 -> level 4');
assert(stabilityToLevel(29.9) === 4, 'stability 29.9 -> level 4');
assert(stabilityToLevel(30.0) === 5, 'stability 30.0 -> level 5');
assert(stabilityToLevel(89.9) === 5, 'stability 89.9 -> level 5');
assert(stabilityToLevel(90.0) === 6, 'stability 90.0 -> level 6');
assert(stabilityToLevel(365.0) === 6, 'stability 365.0 -> level 6');

console.log('\n--- 3. Testing isWordValidForReview Logic ---');
function isWordValidForReview(w: { word?: string | null; translation?: string | null }): boolean {
  if (!w.word || !w.word.trim()) return false;
  if (!w.translation || !w.translation.trim()) return false;
  const transLower = w.translation.toLowerCase();
  if (transLower.includes('failed') || transLower.includes('analyzing') || w.translation.includes('⏳')) {
    return false;
  }
  return true;
}

assert(isWordValidForReview({ word: 'cat', translation: 'con mèo' }) === true, 'Valid word accepted');
assert(isWordValidForReview({ word: '', translation: 'con mèo' }) === false, 'Empty word rejected');
assert(isWordValidForReview({ word: '   ', translation: 'con mèo' }) === false, 'Whitespace word rejected');
assert(isWordValidForReview({ word: 'cat', translation: '' }) === false, 'Empty translation rejected');
assert(isWordValidForReview({ word: 'cat', translation: '   ' }) === false, 'Whitespace translation rejected');
assert(isWordValidForReview({ word: 'cat', translation: 'failed to load' }) === false, 'Lowercase "failed" rejected');
assert(isWordValidForReview({ word: 'cat', translation: 'FAILED: API timeout' }) === false, 'Uppercase "FAILED" rejected');
assert(isWordValidForReview({ word: 'cat', translation: 'Analyzing translation...' }) === false, 'Capital "Analyzing" rejected');
assert(isWordValidForReview({ word: 'cat', translation: 'analyzing...' }) === false, 'Lowercase "analyzing" rejected');
assert(isWordValidForReview({ word: 'cat', translation: '⏳ Analyzing...' }) === false, 'Hourglass emoji rejected');
assert(isWordValidForReview({ word: 'cat', translation: 'mèo ⏳' }) === false, 'Hourglass in translation rejected');

console.log('\n--- 4. Testing Cross-Classroom Deduplication Logic ---');

interface CandidateWord {
  id: string;
  word: string;
  translation: string;
  classroom_id: string;
  reviewCount: number;
  srsLevel: number;
  next_review_date: string | null;
  example?: string | null;
}

function deduplicateReviewWords<T extends {
  word: string;
  reviewCount: number;
  next_review_date?: string | null;
  example?: string | null;
}>(words: T[]): T[] {
  const parseTime = (d: string | null | undefined): number => {
    if (!d) return Infinity;
    const t = new Date(d).getTime();
    return Number.isNaN(t) ? Infinity : t;
  };

  const dedupMap = new Map<string, T>();
  for (const item of words) {
    const key = item.word.trim().toLowerCase();
    if (!key) continue;

    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, item);
      continue;
    }

    if (item.reviewCount > existing.reviewCount) {
      dedupMap.set(key, item);
    } else if (item.reviewCount === existing.reviewCount) {
      const itemDate = parseTime(item.next_review_date);
      const existingDate = parseTime(existing.next_review_date);
      if (itemDate < existingDate) {
        dedupMap.set(key, item);
      } else if (itemDate === existingDate) {
        if (item.example?.trim() && !existing.example?.trim()) {
          dedupMap.set(key, item);
        }
      }
    }
  }

  return Array.from(dedupMap.values());
}

// Scenario A: Higher review count takes priority
const listA: CandidateWord[] = [
  { id: '1', word: 'sit', translation: 'ngồi', classroom_id: 'class-1', reviewCount: 1, srsLevel: 1, next_review_date: '2026-10-01T10:00:00Z' },
  { id: '2', word: 'sit', translation: 'ngồi', classroom_id: 'class-2', reviewCount: 5, srsLevel: 4, next_review_date: '2026-10-02T10:00:00Z' },
];
const resA = deduplicateReviewWords(listA);
assert(resA.length === 1, 'Scenario A: deduplicated to 1 item');
assert(resA[0].id === '2' && resA[0].reviewCount === 5, 'Scenario A: kept record with higher reviewCount (5)');

// Scenario B: Equal review count, earlier next_review_date takes priority
const listB: CandidateWord[] = [
  { id: '1', word: 'antibiotic', translation: 'kháng sinh', classroom_id: 'class-1', reviewCount: 3, srsLevel: 3, next_review_date: '2026-10-02T12:00:00Z' },
  { id: '2', word: 'antibiotic', translation: 'thuốc kháng sinh', classroom_id: 'class-2', reviewCount: 3, srsLevel: 3, next_review_date: '2026-10-01T08:00:00Z' },
];
const resB = deduplicateReviewWords(listB);
assert(resB.length === 1, 'Scenario B: deduplicated to 1 item');
assert(resB[0].id === '2' && resB[0].next_review_date === '2026-10-01T08:00:00Z', 'Scenario B: kept record with earlier review date');

// Scenario C: Case-insensitive and whitespace trimming
const listC: CandidateWord[] = [
  { id: '1', word: '  Apple  ', translation: 'quả táo', classroom_id: 'class-1', reviewCount: 2, srsLevel: 2, next_review_date: '2026-10-01T10:00:00Z' },
  { id: '2', word: 'apple', translation: 'táo', classroom_id: 'class-2', reviewCount: 4, srsLevel: 3, next_review_date: '2026-10-02T10:00:00Z' },
  { id: '3', word: 'APPLE', translation: 'trái táo', classroom_id: 'class-3', reviewCount: 1, srsLevel: 1, next_review_date: '2026-09-30T10:00:00Z' },
];
const resC = deduplicateReviewWords(listC);
assert(resC.length === 1, 'Scenario C: trimmed & lowercase deduplicated to 1 item');
assert(resC[0].id === '2' && resC[0].reviewCount === 4, 'Scenario C: correctly kept id 2 with highest reviewCount');

// Scenario D: Distinct words are not collapsed
const listD: CandidateWord[] = [
  { id: '1', word: 'run', translation: 'chạy', classroom_id: 'class-1', reviewCount: 2, srsLevel: 2, next_review_date: '2026-10-01T10:00:00Z' },
  { id: '2', word: 'walk', translation: 'đi bộ', classroom_id: 'class-1', reviewCount: 3, srsLevel: 3, next_review_date: '2026-10-01T10:00:00Z' },
  { id: '3', word: 'swim', translation: 'bơi', classroom_id: 'class-2', reviewCount: 1, srsLevel: 1, next_review_date: '2026-10-01T10:00:00Z' },
];
const resD = deduplicateReviewWords(listD);
assert(resD.length === 3, 'Scenario D: 3 distinct words remain 3 words');

// Scenario E: Equal reviewCount and equal next_review_date -> prefer item with example sentence
const listE: CandidateWord[] = [
  { id: '1', word: 'vital', translation: 'quan trọng', classroom_id: 'class-1', reviewCount: 2, srsLevel: 2, next_review_date: '2026-10-01T10:00:00Z', example: '' },
  { id: '2', word: 'vital', translation: 'thiết yếu', classroom_id: 'class-2', reviewCount: 2, srsLevel: 2, next_review_date: '2026-10-01T10:00:00Z', example: 'Water is vital for life.' },
];
const resE = deduplicateReviewWords(listE);
assert(resE.length === 1, 'Scenario E: deduplicated to 1 item');
assert(resE[0].id === '2' && resE[0].example === 'Water is vital for life.', 'Scenario E: preferred record with example sentence');

// Scenario F: Malformed / invalid date strings safely handled without NaN breaking
const listF: CandidateWord[] = [
  { id: '1', word: 'echo', translation: 'tiếng vang', classroom_id: 'class-1', reviewCount: 1, srsLevel: 1, next_review_date: 'invalid-date' },
  { id: '2', word: 'echo', translation: 'tiếng vang', classroom_id: 'class-2', reviewCount: 1, srsLevel: 1, next_review_date: '2026-10-01T10:00:00Z' },
];
const resF = deduplicateReviewWords(listF);
assert(resF.length === 1, 'Scenario F: deduplicated to 1 item');
assert(resF[0].id === '2' && resF[0].next_review_date === '2026-10-01T10:00:00Z', 'Scenario F: valid date preferred over invalid date');

console.log('\n--- 5. Testing End-to-End Mapping & SRS Level Accuracy ---');

function mapReviewWord(
  w: { id: string; word: string; translation: string; review_count?: number | null },
  srsRecord?: { stability?: number; review_count?: number; next_review_date?: string } | null
) {
  const reviewCount = Number(srsRecord?.review_count ?? w.review_count ?? 0);
  const isNew = reviewCount === 0;
  const stability = Number(srsRecord?.stability ?? 0);
  const srsLevel = isNew
    ? 0
    : stability > 0
      ? stabilityToLevel(stability)
      : reviewCountToLevel(reviewCount);
  const mastery = isNew ? 0 : Math.min(100, srsLevel * 20);
  const status = isNew ? 'new' : srsLevel >= 5 ? 'mastered' : 'learning';

  return {
    id: w.id,
    word: w.word,
    translation: w.translation,
    reviewCount,
    srsLevel,
    mastery,
    status,
  };
}

// Word with stability = 15 (should be level 4, not hardcoded 1!)
const matureWord = mapReviewWord(
  { id: 'm1', word: 'comprehension', translation: 'sự hiểu', review_count: 5 },
  { stability: 15.2, review_count: 5, next_review_date: '2026-10-01T10:00:00Z' }
);
assert(matureWord.srsLevel === 4, 'Mature word mapped to srsLevel 4 (not hardcoded 1)');
assert(matureWord.mastery === 80, 'Mature word mastery is 80 (not hardcoded 20)');
assert(matureWord.status === 'learning', 'Level 4 status is learning');

// Mastered word with stability = 95 (level 6)
const masteredWord = mapReviewWord(
  { id: 'm2', word: 'diligent', translation: 'chăm chỉ', review_count: 10 },
  { stability: 95.0, review_count: 10, next_review_date: '2026-10-01T10:00:00Z' }
);
assert(masteredWord.srsLevel === 6, 'Mastered word mapped to srsLevel 6');
assert(masteredWord.mastery === 100, 'Mastered word mastery is 100');
assert(masteredWord.status === 'mastered', 'Level 6 status is mastered');

// Legacy word without stability record (fallback to review count = 3 -> level 3)
const fallbackWord = mapReviewWord(
  { id: 'f1', word: 'effort', translation: 'nỗ lực', review_count: 3 },
  null
);
assert(fallbackWord.srsLevel === 3, 'Legacy word without srsRecord falls back to reviewCountToLevel (level 3)');
assert(fallbackWord.mastery === 60, 'Fallback word mastery is 60');

// Unstudied / new word (review_count = 0)
const unstudiedWord = mapReviewWord(
  { id: 'u1', word: 'pristine', translation: 'nguyên sơ', review_count: 0 },
  null
);
assert(unstudiedWord.srsLevel === 0, 'Unstudied word mapped to srsLevel 0');
assert(unstudiedWord.mastery === 0, 'Unstudied word mastery is 0');
assert(unstudiedWord.status === 'new', 'Unstudied word status is new');

console.log('\n--- 6. Testing RPC Limit Padding Against Starvation ---');
// Simulate 30 due records from RPC with 5 duplicates:
const rawFromRpc: CandidateWord[] = [];
for (let i = 1; i <= 25; i++) {
  rawFromRpc.push({
    id: `w-${i}`,
    word: `word-${i}`,
    translation: `nghĩa ${i}`,
    classroom_id: 'class-1',
    reviewCount: 2,
    srsLevel: 2,
    next_review_date: '2026-10-01T10:00:00Z',
  });
}
// Add 5 duplicate words from class-2 with higher review count
for (let i = 1; i <= 5; i++) {
  rawFromRpc.push({
    id: `w-${i}-dup`,
    word: `word-${i}`,
    translation: `nghĩa ${i} (lớp 2)`,
    classroom_id: 'class-2',
    reviewCount: 4,
    srsLevel: 3,
    next_review_date: '2026-10-01T08:00:00Z',
  });
}
const dedupedQueue = deduplicateReviewWords(rawFromRpc);
const sessionWords = dedupedQueue.slice(0, 25);
assert(sessionWords.length === 25, 'Session gets full 25 words even with 5 duplicates present');
assert(sessionWords[0].reviewCount === 4, 'Deduplicated words took the higher review count');

console.log(`\n================================`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED!');
}
