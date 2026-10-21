import { ServerOrderDto } from '@/types/billing/ServerOrderDto';

/**
 * Props for the OrderQrModal component.
 */
export interface OrderQrModalProps {
  /** Order to pay, or null when the modal is closed. */
  order: ServerOrderDto | null;
  /** Closes the modal. */
  onClose: () => void;
}
