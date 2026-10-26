/**
 * Maps `.NET 10` `CrmDashboardSummaryDto` into `{ success, data, ...dto }`.
 */
export function mapCrmDashboardResponse(dto: Record<string, any> | null | undefined, ok = true) {
  return {
    success: ok,
    data: dto ?? null,
    ...(dto && typeof dto === 'object' ? dto : {}),
  };
}
