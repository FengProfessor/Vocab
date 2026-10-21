import { ServerAiSentenceAnalysisDto } from '@/types/aicoach/ServerAiSentenceAnalysisDto';

/**
 * Props for the SentenceAnalysisCard component.
 */
export interface SentenceAnalysisCardProps {
  /** Latest analysis, or null when none was requested yet. */
  analysis: ServerAiSentenceAnalysisDto | null;
  /** Whether the learner's plan includes sentence analysis. */
  isAvailable: boolean;
  /** Whether an analysis request is in flight. */
  isLoading: boolean;
}
