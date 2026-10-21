import { CoachMessageSender } from '@/types/enums/CoachMessageSender';

/**
 * One message of the AI coach conversation.
 */
export interface CoachMessageItem {
  /** Unique message id. */
  id: string;
  /** Who wrote the message. */
  sender: CoachMessageSender;
  /** Message text. */
  text: string;
}
