/**
 * Maps `.NET 10` `ReferralHubDto` into the shape expected by both referral hub and study groups views.
 */
export function mapReferralHubResponse(dto: Record<string, any> | null | undefined, ok = true) {
  return {
    success: ok,
    data: dto ?? null,
    groups: Array.isArray(dto?.activeGroups) ? dto!.activeGroups : [],
    ...(dto && typeof dto === 'object' ? dto : {}),
  };
}
