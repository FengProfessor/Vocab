import { describe, expect, it } from 'vitest';
import {
  calculateListeningScore,
  calculateReadingScore,
  calculateVstepScore,
  getCefrDescription,
  getCefrLevel,
  roundVstepScore,
} from '@/lib/vstep-scoring';

describe('VSTEP Scoring Engine (vstep-scoring.ts)', () => {
  it('rounds raw scores to nearest 0.5 increment per MOET regulation', () => {
    expect(roundVstepScore(-1)).toBe(0);
    expect(roundVstepScore(12)).toBe(10);
    expect(roundVstepScore(6.1)).toBe(6.0);
    expect(roundVstepScore(6.24)).toBe(6.0);
    expect(roundVstepScore(6.25)).toBe(6.5);
    expect(roundVstepScore(6.74)).toBe(6.5);
    expect(roundVstepScore(6.75)).toBe(7.0);
  });

  it('calculates Listening (35 questions) and Reading (40 questions) scores on 10-point scale', () => {
    expect(calculateListeningScore(35, 35)).toBe(10);
    expect(calculateListeningScore(0, 35)).toBe(0);
    expect(calculateReadingScore(40, 40)).toBe(10);
    expect(calculateReadingScore(20, 40)).toBe(5);
  });

  it('maps overall VSTEP scores to CEFR levels (A2, B1, B2, C1)', () => {
    expect(getCefrLevel(3.5)).toBe('A2');
    expect(getCefrLevel(4.0)).toBe('B1');
    expect(getCefrLevel(5.5)).toBe('B1');
    expect(getCefrLevel(6.0)).toBe('B2');
    expect(getCefrLevel(8.0)).toBe('B2');
    expect(getCefrLevel(8.5)).toBe('C1');
    expect(getCefrDescription('C1').badgeVi).toContain('C1');
  });

  it('computes aggregate VSTEP 4-skill result with MOET 0.5 rounding', () => {
    const result = calculateVstepScore({
      listeningCorrect: 28, // 8.0
      listeningTotal: 35,
      readingCorrect: 30, // 7.5
      readingTotal: 40,
      writingScore: 6.5,
      speakingScore: 7.0,
    });
    // mean = (8.0 + 7.5 + 6.5 + 7.0) / 4 = 7.25 -> rounds to 7.5 (B2)
    expect(result.listeningScore).toBe(8.0);
    expect(result.readingScore).toBe(7.5);
    expect(result.overallScore).toBe(7.5);
    expect(result.cefrLevel).toBe('B2');
  });
});
