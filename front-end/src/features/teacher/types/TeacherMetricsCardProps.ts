/**
 * Props for the TeacherMetricsCard component.
 */
export interface TeacherMetricsCardProps {
  /** Number of classrooms managed by the teacher. */
  totalClassrooms: number;
  /** Students enrolled across all classrooms. */
  totalStudents: number;
  /** Whether the numbers are still loading. */
  isLoading?: boolean;
}
