import { CertLevel } from '@/types/enums/CertLevel';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';

/**
 * Props for the WordImportDrawer component.
 */
export interface WordImportDrawerProps {
  /** Whether the import drawer is open. */
  open: boolean;
  /** CEFR level assigned to imported words (the learner's target level). */
  defaultCertLevel: CertLevel;
  /** Callback to close drawer. */
  onClose: () => void;
  /** Callback to push parsed words into active study deck. */
  onImportWords: (items: VocabImportItemDto[]) => void;
}
