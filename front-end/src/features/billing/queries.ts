import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BillingApi } from '@/features/billing/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading billing statistics.
 */
export function useBillingStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.stats(),
    queryFn: () => BillingApi.getStats(),
    enabled,
  });
}

/**
 * React Query hook for loading Pro milestone progress.
 */
export function useProMilestoneQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.proMilestone(),
    queryFn: () => BillingApi.getProMilestone(),
    enabled,
  });
}

/**
 * React Query mutation for creating a payment order.
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => BillingApi.createOrder(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    },
  });
}
