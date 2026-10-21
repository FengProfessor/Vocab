import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

export interface VocabSpellingCardProps {
  /** Complete list of vocabulary words in current deck. */
  words: VocabWordDto[];
  /** Callback fired when spelling practice grades the recall quality. */
  onGradeWord?: (wordId: string, quality: SrsReviewQuality) => void;
}
