/**
 * Props for the CreateClassroomModal component.
 */
export interface CreateClassroomModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Whether the create request is in flight. */
  isSubmitting?: boolean;
  /** Closes the modal. */
  onClose: () => void;
  /** Creates the classroom with the entered values. */
  onCreate: (name: string, description: string) => void;
}
