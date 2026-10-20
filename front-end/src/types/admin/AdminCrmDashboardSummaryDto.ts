/**
 * Aggregate CRM telemetry metrics returned by GET /api/v1/admin/crm/dashboard.
 */
export interface AdminCrmDashboardSummaryDto {
  /** Total registered users in the platform database. */
  totalUsers: number;
  /** Active paid Pro or Premium subscribers. */
  activePremiumUsers: number;
  /** Number of subscription orders awaiting payment confirmation. */
  pendingOrdersCount: number;
  /** Total verified platform revenue in VND. */
  totalPaidRevenueVnd: number;
  /** Total teacher pilot applications received. */
  totalPilotLeads: number;
  /** Number of pending affiliate commission payout requests. */
  pendingPayoutRequests: number;
}
