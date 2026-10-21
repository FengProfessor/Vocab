import { ServerToeicSubmissionResponseDto } from '@/types/exam/ServerToeicSubmissionResponseDto';

/**
 * Props for the ToeicScoreModal component.
 */
export interface ToeicScoreModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Server scoring result, or null before submission. */
  result: ServerToeicSubmissionResponseDto | null;
  /** Closes the modal. */
  onClose: () => void;
}
