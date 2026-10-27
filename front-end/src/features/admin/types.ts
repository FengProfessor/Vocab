import { PilotLeadStatus } from '@/types/enums';

/**
 * Aggregate CRM telemetry metrics returned by GET /api/v1/admin/crm/dashboard.
 */
export interface AdminCrmDashboardSummaryDto {
  totalUsers: number;
  activePremiumUsers: number;
  pendingOrdersCount: number;
  totalPaidRevenueVnd: number;
  totalPilotLeads: number;
  pendingPayoutRequests: number;
}

/**
 * Data transfer object representing a pilot teacher lead registration for B2B classroom adoption.
 */
export interface AdminPilotLeadDto {
  id: string;
  teacherName: string;
  organization: string;
  studentScale: string;
  status: PilotLeadStatus;
  email?: string;
  phone?: string;
}

/**
 * Aggregated admin telemetry: CRM counters plus the number of business enum groups served by the API.
 */
export interface AdminTelemetryDto {
  crm: AdminCrmDashboardSummaryDto;
  enumGroupCount: number;
}
