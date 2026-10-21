import { FoundationClarityRating } from '@/types/enums/FoundationClarityRating';
import { ServerDiagnosticProbeDto } from '@/types/speaking/ServerDiagnosticProbeDto';

/**
 * Props for the SpeakingProbeCard component.
 */
export interface SpeakingProbeCardProps {
  /** Concept the learner practices. */
  probe: ServerDiagnosticProbeDto;
  /** Reports the learner's self-rated clarity after recording. */
  onRated: (probe: ServerDiagnosticProbeDto, clarity: FoundationClarityRating) => void;
}
