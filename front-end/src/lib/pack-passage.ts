import { PACK_PASSAGE_MIN_WORDS, PACK_PASSAGE_MAX_WORDS } from './pack-passage-constants';

export { PACK_PASSAGE_MIN_WORDS, PACK_PASSAGE_MAX_WORDS };

export interface PackWord {
  word: string;
  translation?: string;
  pos?: string;
}

export interface PassageQuestion {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

export interface PassageClozeBlank {
  id: number;
  answer: string;
  options: string[];
}

export interface PackPassageResult {
  title: string;
  passage: string;
  passagePlain: string;
  level: string;
  themeId: string;
  themeLabelVi: string;
  readingLevelId: string;
  readingLevelLabelVi: string;
  wordCount: number;
  usedWords: string[];
  missingWords: string[];
  coverage: number;
  questions: PassageQuestion[];
  cloze: {
    text: string;
    blanks: PassageClozeBlank[];
  };
  meta: {
    attempts: number;
    providerNote: string;
  };
}
