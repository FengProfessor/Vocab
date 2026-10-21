import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';

export interface SubmitWordReviewParams {
  wordId: string;
  quality: SrsReviewQuality;
}
