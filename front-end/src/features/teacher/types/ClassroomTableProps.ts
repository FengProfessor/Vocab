import { ServerClassroomDto } from '@/types/teacher/ServerClassroomDto';

/**
 * Props for the ClassroomTable component.
 */
export interface ClassroomTableProps {
  /** Classrooms owned by the teacher. */
  classrooms: ServerClassroomDto[];
  /** Whether the list is loading. */
  isLoading: boolean;
  /** Opens the create-classroom dialog. */
  onOpenCreateModal: () => void;
}
