/**
 * Syntactic breakdown returned by POST /api/v1/ai-coaching/sentence/analyze (backend AiSentenceAnalysisDto, Pro plan only).
 */
export interface ServerAiSentenceAnalysisDto {
  /** The main clause of the sentence. */
  mainClause: string;
  /** Subordinate or secondary clauses. */
  secondaryClauses: string[];
  /** Sentence kernel (e.g. subject / verb / object) as key-value pairs. */
  kernel: Record<string, unknown>;
  /** Progressive build-up of the sentence, from kernel to full form. */
  buildLevels: string[];
  /** Meaningful word chunks of the sentence. */
  chunks: unknown[];
  /** AI provider that produced the analysis. */
  aiSource: string;
}
