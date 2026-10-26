import { describe, expect, it } from 'vitest';
import {
  calculateToeicScore,
  getCefrDescriptor,
  getCefrLevel,
  getPartAccuracyRating,
  getScaledListeningScore,
  getScaledReadingScore,
} from '@/lib/toeic-scoring';
import type { ToeicClientQuestion } from '@/types/toeic';

describe('TOEIC Scoring Engine (toeic-scoring.ts & toeic-barem.ts)', () => {
  it('converts raw listening and reading counts to ETS 5..495 scaled scores', () => {
    expect(getScaledListeningScore(0)).toBe(5);
    expect(getScaledListeningScore(100)).toBe(495);
    expect(getScaledReadingScore(0)).toBe(5);
    expect(getScaledReadingScore(100)).toBe(495);
    expect(getScaledListeningScore(50)).toBeGreaterThan(200);
    expect(getScaledReadingScore(50)).toBeGreaterThan(150);
  });

  it('maps total scaled scores to CEFR levels A1..C1 accurately', () => {
    expect(getCefrLevel(950)).toBe('C1');
    expect(getCefrLevel(905)).toBe('C1');
    expect(getCefrLevel(785)).toBe('B2');
    expect(getCefrLevel(605)).toBe('B2');
    expect(getCefrLevel(500)).toBe('B1');
    expect(getCefrLevel(300)).toBe('A2');
    expect(getCefrLevel(150)).toBe('A1');
    expect(getCefrDescriptor('B2').level).toBe('B2');
  });

  it('evaluates part accuracy ratings and full test score breakdowns', () => {
    expect(getPartAccuracyRating(85)).toBe('high');
    expect(getPartAccuracyRating(65)).toBe('medium');
    expect(getPartAccuracyRating(30)).toBe('low');

    const sampleQuestions: ToeicClientQuestion[] = [
      {
        id: 'q1',
        testId: 'ets-1',
        questionNumber: 1,
        part: 1,
        section: 'listening',
        options: [
          { key: 'A', text: 'a' },
          { key: 'B', text: 'b' },
          { key: 'C', text: 'c' },
          { key: 'D', text: 'd' },
        ],
        correctAnswer: 'A',
      },
      {
        id: 'q2',
        testId: 'ets-1',
        questionNumber: 101,
        part: 5,
        section: 'reading',
        options: [
          { key: 'A', text: 'a' },
          { key: 'B', text: 'b' },
          { key: 'C', text: 'c' },
          { key: 'D', text: 'd' },
        ],
        correctAnswer: 'C',
      },
    ];

    const result = calculateToeicScore({ 1: 'A', 101: 'B' }, sampleQuestions, 120);
    expect(result.rawListening).toBe(1);
    expect(result.rawReading).toBe(0);
    expect(result.rawTotal).toBe(1);
    expect(result.partStats[1].correct).toBe(1);
    expect(result.partStats[1].percentage).toBe(100);
    expect(result.partStats[5].correct).toBe(0);
    expect(result.timeSpentSeconds).toBe(120);
  });
});
