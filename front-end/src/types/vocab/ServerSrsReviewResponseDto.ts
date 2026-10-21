import { SrsCardState } from '@/types/enums/SrsCardState';

export interface ServerSrsReviewResponseDto {
  wordId: string;
  state: SrsCardState;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string;
  reps: number;
  lapses: number;
  xpAwarded: number;
}
