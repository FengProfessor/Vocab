import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';

export interface ServerWordWithSrsDto {
  id: string;
  term: string;
  ipa: string;
  translation: string;
  partOfSpeech: PartOfSpeechType | string;
  imageUrl: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  topic: string;
  level: CertLevel | string;
  srsState: SrsCardState | string;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string | null;
}
