import { describe, expect, it } from 'vitest';
import {
  mapDueWordsPayload,
  mapQualityToEnum,
  mapVocabAnalyticsToStudentStats,
  mapVocabAnalyticsToWordsPayload,
} from '@/features/vocab/mappers';

describe('vocab mappers', () => {
  it('maps FSRS numeric quality ratings and string names to .NET ReviewQuality enum', () => {
    expect(mapQualityToEnum(1)).toBe('Again');
    expect(mapQualityToEnum(0)).toBe('Again');
    expect(mapQualityToEnum(2)).toBe('Hard');
    expect(mapQualityToEnum(3)).toBe('Hard');
    expect(mapQualityToEnum(4)).toBe('Good');
    expect(mapQualityToEnum(5)).toBe('Easy');
    expect(mapQualityToEnum('Good')).toBe('Good');
    expect(mapQualityToEnum('easy')).toBe('Easy');
  });

  it('maps VocabAnalyticsDto into words payload with accurate due calculation', () => {
    const fixedNow = new Date('2026-10-26T12:00:00Z').getTime();
    const payload = mapVocabAnalyticsToWordsPayload(
      {
        classroomId: 'cls-1',
        total: 2,
        newCount: 1,
        reviewDueCount: 1,
        dueCount: 2,
        grammarDueCount: 3,
        levelCounts: [1, 1, 0, 0, 0, 0],
        words: [
          {
            id: 'w-1',
            term: 'resilient',
            translation: 'kiên cường',
            partOfSpeech: 'adj',
            reviewCount: 0,
            srsLevel: 1,
          },
          {
            id: 'w-2',
            word: 'ubiquitous',
            translation: 'phổ biến',
            reviewCount: 3,
            nextReviewDate: '2026-10-27T12:00:00Z',
            stability: 8.5,
            difficulty: 4.2,
            intervalDays: 5,
            srsLevel: 3,
          },
        ],
      },
      true,
      fixedNow,
    );

    expect(payload.success).toBe(true);
    expect(payload.total).toBe(2);
    expect(payload.levelCounts).toEqual([1, 1, 0, 0, 0, 0]);
    expect(payload.words).toHaveLength(2);
    expect(payload.words[0].word).toBe('resilient');
    expect(payload.words[0].isDue).toBe(true);
    expect(payload.words[1].word).toBe('ubiquitous');
    expect(payload.words[1].isDue).toBe(false);
    expect(payload.words[1].srs.stability).toBe(8.5);
  });

  it('maps VocabAnalyticsDto into student dashboard stats with L1-L6 breakdown', () => {
    const stats = mapVocabAnalyticsToStudentStats(
      {
        total: 30,
        newCount: 10,
        reviewDueCount: 5,
        dueCount: 15,
        levelCounts: [10, 8, 5, 4, 2, 1],
        studyStreak: 7,
        totalXp: 450,
      },
      true,
      true,
    );

    expect(stats.success).toBe(true);
    expect(stats.lite).toBe(true);
    expect(stats.totalWords).toBe(30);
    expect(stats.reviewedWords).toBe(20);
    expect(stats.wordBreakdown.l1).toBe(10);
    expect(stats.wordBreakdown.l6).toBe(1);
    expect(stats.studyStreak).toBe(7);
    expect(stats.totalXp).toBe(450);
  });

  it('maps due words list from /vocab/due', () => {
    const result = mapDueWordsPayload([
      {
        id: 'due-1',
        term: 'meticulous',
        translation: 'tỉ mỉ',
        stability: 3.2,
        intervalDays: 2,
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(1);
    expect(result.words[0].word).toBe('meticulous');
    expect(result.words[0].isDue).toBe(true);
  });
});
