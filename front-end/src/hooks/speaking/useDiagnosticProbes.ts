import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerDiagnosticProbeDto } from '@/types/speaking/ServerDiagnosticProbeDto';

/** Number of diagnostic probes requested per session. */
const MAX_PROBES = 6;

/**
 * Loads the next diagnostic probes from GET /api/v1/speaking-foundation/diagnostic/probes.
 */
export function useDiagnosticProbes() {
  return useQuery({
    queryKey: ['speaking-foundation-probes'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerDiagnosticProbeDto[]>>(
        '/speaking-foundation/diagnostic/probes',
        { params: { maxProbes: MAX_PROBES } }
      );
      return response.data.data ?? [];
    },
  });
}
