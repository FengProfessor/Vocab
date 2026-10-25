export type PhonemeType = 'monophthong' | 'diphthong' | 'consonant';
export type PhonemeSubType =
  | 'long-vowel'
  | 'short-vowel'
  | 'diphthong'
  | 'voiceless-consonant'
  | 'voiced-consonant'
  | 'sonorant';

export type PhonemeDifficulty = 'high' | 'medium' | 'low';

export interface PhonemeMinimalPair {
  target: string;
  contrast: string;
  contrastPhoneme: string;
  note: string;
}

export interface PhonemePracticeSentence {
  sentence: string;
  translationVi: string;
  targetWords: string[];
}

import type { RachelVideoMeta } from './pronunciation';

export interface IpaPhoneme {
  id: string;
  symbol: string;
  name: string;
  type: PhonemeType;
  subType: PhonemeSubType;
  partnerId?: string;
  anchorWord: string;
  anchorWordIpa: string;
  vietnameseNote: string;
  mouthTip: string;
  difficultyForVn: PhonemeDifficulty;
  video: RachelVideoMeta;
  initialWords: string[];
  medialWords: string[];
  finalWords: string[];
  minimalPairs: PhonemeMinimalPair[];
  practiceSentences: PhonemePracticeSentence[];
}

export interface IpaChartData {
  version: string;
  author: string;
  totalPhonemes: number;
  monophthongsCount: number;
  diphthongsCount: number;
  consonantsCount: number;
  phonemes: IpaPhoneme[];
}

export interface UserPhonemeProgress {
  phonemeId: string;
  masteryPercent: number; // 0 - 100
  stagesCompleted: number; // 1 to 5
  lastPracticed?: string;
  stars: number; // 0 - 3
}
