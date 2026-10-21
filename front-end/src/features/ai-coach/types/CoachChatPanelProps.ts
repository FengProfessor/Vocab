import { CoachMessageItem } from '@/types/aicoach/CoachMessageItem';

/**
 * Props for the CoachChatPanel component.
 */
export interface CoachChatPanelProps {
  /** Conversation so far. */
  messages: CoachMessageItem[];
  /** Whether the tutor is answering. */
  isSending: boolean;
  /** Sends the learner's text to the tutor. */
  onSend: (text: string) => void;
}
