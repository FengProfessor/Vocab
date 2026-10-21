import { GrammarProgressDto } from '@/types/grammar/GrammarProgressDto';
import { ServerGrammarTopicDto } from '@/types/grammar/ServerGrammarTopicDto';

/**
 * Props for the GrammarStageViewer component.
 */
export interface GrammarStageViewerProps {
  /** The selected grammar topic. */
  topic: ServerGrammarTopicDto;
  /** Whether the progress submission is in flight. */
  isSubmitting?: boolean;
  /** Latest server result for this topic in the current session, if any. */
  lastResult?: GrammarProgressDto | null;
  /** Records the accuracy (0..100) of a practice attempt. */
  onSubmitAccuracy: (topicSlug: string, accuracyPercent: number) => void;
}
