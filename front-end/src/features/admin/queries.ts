import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '@/features/admin/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading the administrative CRM dashboard.
 */
export function useAdminCrmQuery(forceRefresh = false, enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.crm(forceRefresh),
    queryFn: () => AdminApi.getCrmDashboard({ forceRefresh }),
    enabled,
  });
}

/**
 * React Query hook for loading administrative overview statistics.
 */
export function useAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => AdminApi.getStats(),
    enabled,
  });
}

/**
 * React Query mutation for subscribing a pilot lead.
 */
export function useSubscribePilotLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => AdminApi.subscribePilotLead(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.pilotLeads() });
    },
  });
}
