import { AdminCrmDashboardSummaryDto } from '@/types/admin/AdminCrmDashboardSummaryDto';

/**
 * Aggregated admin telemetry: CRM counters plus the number of business enum groups served by the API.
 */
export interface AdminTelemetryDto {
  /** CRM dashboard counters. */
  crm: AdminCrmDashboardSummaryDto;
  /** Number of enum groups returned by GET /system/enums. */
  enumGroupCount: number;
}
