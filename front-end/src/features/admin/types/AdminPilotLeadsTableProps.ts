import { AdminPilotLeadDto } from '@/types/admin/AdminPilotLeadDto';

/**
 * Props for the AdminPilotLeadsTable component.
 */
export interface AdminPilotLeadsTableProps {
  /** Teacher pilot leads (empty until the backend lists them). */
  leads: AdminPilotLeadDto[];
  /** Number of pending subscription orders shown as a badge. */
  pendingCount: number;
  /** Whether the first load is pending. */
  isLoading?: boolean;
}
