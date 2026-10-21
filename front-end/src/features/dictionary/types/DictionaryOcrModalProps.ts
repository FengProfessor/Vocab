export interface DictionaryOcrModalProps {
  /** Whether OCR modal is visible. */
  open: boolean;
  /** Callback to close modal. */
  onClose: () => void;
  /** Callback when OCR detects a word to lookup. */
  onSelectTerm: (term: string) => void;
}
