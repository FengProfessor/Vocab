import { ServerGrammarTopicDto } from '@/types/grammar/ServerGrammarTopicDto';

/**
 * Props for the GrammarTopicList component.
 */
export interface GrammarTopicListProps {
  /** Canonical grammar topics. */
  topics: ServerGrammarTopicDto[];
  /** Currently selected topic id. */
  selectedTopicId: string;
  /** Whether topics are loading. */
  isLoading?: boolean;
  /** Selects a topic. */
  onSelectTopic: (topicId: string) => void;
}
