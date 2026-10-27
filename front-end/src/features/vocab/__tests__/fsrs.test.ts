import { describe, expect, it } from 'vitest';
import { scheduleNext, stateToText, textToState, State } from '@/lib/fsrs';
import {
  calculateInterval,
  calculateNextReview,
  calculateRetrievability,
  defaultSRS,
  mapQualityToRating,
  reviewCountToLevel,
  stabilityToLevel,
} from '@/lib/srs';

describe('FSRS v5 scheduler (fsrs.ts)', () => {
  const fixedNow = new Date('2026-05-01T10:00:00.000Z');

  it('schedules a brand-new card into short-term Learning on Good (3)', () => {
    const res = scheduleNext(null, 3, fixedNow);
    expect(res.review_count).toBe(1);
    expect(res.stability).toBeGreaterThan(0);
    expect(res.difficulty).toBeGreaterThanOrEqual(1);
    expect(res.difficulty).toBeLessThanOrEqual(10);
    expect(res.state).toBe(State.Learning);
    expect(new Date(res.next_review_date).getTime()).toBeGreaterThan(fixedNow.getTime());
  });

  it('schedules an existing Review card into Relearning on Again (1) and increments lapses', () => {
    const existing = {
      stability: 12,
      difficulty: 5.5,
      interval_days: 12,
      review_count: 4,
      state: State.Review,
      lapses: 1,
      learning_steps: 0,
      last_reviewed_at: '2026-04-19T10:00:00.000Z',
      next_review_date: '2026-05-01T10:00:00.000Z',
    };
    const res = scheduleNext(existing, 1, fixedNow);
    expect(res.state).toBe(State.Relearning);
    expect(res.lapses).toBe(2);
    expect(res.review_count).toBe(5);
  });

  it('heals legacy rows where state=0 or difficulty=0 but history exists', () => {
    const legacyRow = {
      stability: 8.5,
      difficulty: 0,
      interval_days: 8,
      review_count: 3,
      state: State.New,
      lapses: 0,
      last_reviewed_at: '2026-04-23T10:00:00.000Z',
    };
    const res = scheduleNext(legacyRow, 3, fixedNow);
    expect(res.state).toBe(State.Review);
    expect(res.stability).toBeGreaterThan(legacyRow.stability);
    expect(res.interval_days).toBeGreaterThanOrEqual(1);
  });

  it('converts between numeric FSRS State and text representation accurately', () => {
    expect(stateToText(State.New)).toBe('new');
    expect(stateToText(State.Learning)).toBe('learning');
    expect(stateToText(State.Review)).toBe('review');
    expect(stateToText(State.Relearning)).toBe('relearning');

    expect(textToState('new')).toBe(State.New);
    expect(textToState('learning')).toBe(State.Learning);
    expect(textToState('review')).toBe(State.Review);
    expect(textToState('mastered')).toBe(State.Review);
    expect(textToState('relearning')).toBe(State.Relearning);
  });
});

describe('SRS helpers & L1-L6 level mapping (srs.ts)', () => {
  it('computes retrievability and interval according to FSRS power-law formula', () => {
    expect(calculateRetrievability(0, 10)).toBeCloseTo(1, 5);
    expect(calculateRetrievability(9, 10)).toBeCloseTo(1 / 1.1, 4);
    expect(calculateInterval(10, 0.9)).toBe(10);
  });

  it('updates card stability and reviewCount on initial and subsequent reviews', () => {
    const initial = defaultSRS();
    const first = calculateNextReview(initial, 3);
    expect(first.stability).toBeGreaterThan(0);
    expect(first.reviewCount).toBe(1);

    const second = calculateNextReview(
      {
        ...first,
        lastReviewDate: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
      4,
    );
    expect(second.stability).toBeGreaterThan(first.stability);
    expect(second.reviewCount).toBe(2);

    const lapsed = calculateNextReview(second, 1);
    expect(lapsed.reviewCount).toBe(0);
  });

  it('maps quality ratings and stability/review counts to L1-L6 buckets', () => {
    expect(mapQualityToRating(0)).toBe(1);
    expect(mapQualityToRating(3)).toBe(2);
    expect(mapQualityToRating(4)).toBe(3);
    expect(mapQualityToRating(5)).toBe(4);

    expect(stabilityToLevel(0.5)).toBe(1);
    expect(stabilityToLevel(3)).toBe(2);
    expect(stabilityToLevel(7)).toBe(3);
    expect(stabilityToLevel(20)).toBe(4);
    expect(stabilityToLevel(60)).toBe(5);
    expect(stabilityToLevel(120)).toBe(6);

    expect(reviewCountToLevel(0)).toBe(0);
    expect(reviewCountToLevel(1)).toBe(1);
    expect(reviewCountToLevel(2)).toBe(2);
    expect(reviewCountToLevel(4)).toBe(3);
    expect(reviewCountToLevel(7)).toBe(4);
    expect(reviewCountToLevel(10)).toBe(5);
    expect(reviewCountToLevel(15)).toBe(6);
  });
});
