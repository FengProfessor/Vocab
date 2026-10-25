import { CODEMIX_MIN_WORDS, CODEMIX_MAX_WORDS } from './codemix-constants';

export { CODEMIX_MIN_WORDS, CODEMIX_MAX_WORDS };

export interface CodeMixWord {
  word: string;
  translation?: string;
  pos?: string;
}

export interface WordWowExplain {
  word: string;
  in_sentence: string;
  pattern: string;
  why_vi: string;
  tip_vi: string;
}

export interface CodeMixUpgradeResult {
  english: string;
  english_plain: string;
  meaning_vi: string;
  level: string;
  wow_note_vi: string;
  words: WordWowExplain[];
  meta: { providerNote: string };
}
