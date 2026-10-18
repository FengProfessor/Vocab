/**
 * Represents a homework assignment dispatched by a teacher to a classroom cohort.
 */
export interface TeacherAssignmentDto {
  /** Unique assignment identifier. */
  id: string;

  /** Title of the assignment. */
  title: string;

  /** Target classroom name. */
  className: string;

  /** Module type (Vocabulary Pack, TOEIC Drill, Writing Prompt, Speaking Task). */
  moduleType: string;

  /** ISO 8601 due date timestamp. */
  dueAt: string;

  /** Number of students who have submitted the assignment. */
  submittedCount: number;

  /** Total number of students assigned. */
  totalAssignedCount: number;
}
