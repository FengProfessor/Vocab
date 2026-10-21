/**
 * Tutor feedback returned by POST /api/v1/ai-coaching/speaking/dialogue (backend AiSpeakingFeedbackDto).
 */
export interface ServerAiSpeakingFeedbackDto {
  /** The tutor's conversational reply. */
  response: string;
  /** Feedback on the learner's last utterance. */
  feedback: string;
  /** A stronger way to phrase the learner's utterance. */
  suggestedResponse: string;
}
