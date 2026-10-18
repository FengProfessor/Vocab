import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Represents a teacher-managed classroom cohort and its real-time learner telemetry.
 */
export interface ClassroomSummaryDto {
  /** Unique classroom identifier. */
  id: string;

  /** Display name of the class or cohort. */
  className: string;

  /** Invitation join code for students. */
  joinCode: string;

  /** Target certification level for the class. */
  targetLevel: CertLevel;

  /** Total enrolled students. */
  studentCount: number;

  /** Number of students who completed their study goal today. */
  activeTodayCount: number;

  /** Average assignment completion rate across the class (0..100). */
  completionRatePercent: number;

  /** Number of at-risk students flagged for teacher intervention. */
  atRiskStudentCount: number;
}
