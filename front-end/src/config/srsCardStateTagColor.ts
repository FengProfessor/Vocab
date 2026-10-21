import { SrsCardState } from '@/types/enums/SrsCardState';

/**
 * Ant Design Tag color used to display each FSRS card state (shared by the flashcard and the library table).
 */
export const SRS_CARD_STATE_TAG_COLOR: Readonly<Record<SrsCardState, string>> = {
  [SrsCardState.New]: 'blue',
  [SrsCardState.Learning]: 'orange',
  [SrsCardState.Review]: 'green',
  [SrsCardState.Relearning]: 'red',
};
