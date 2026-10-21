import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { BrowserStorage } from '@/lib/storage';
import { AdminTelemetryDto } from '@/types/admin/AdminTelemetryDto';
import { AdminCrmDashboardSummaryDto } from '@/types/admin/AdminCrmDashboardSummaryDto';
import { ApiResponse } from '@/types/api/ApiResponse';
import { EnumMemberItemDto } from '@/types/api/EnumMemberItemDto';

/** Session storage key used to hydrate the dashboard instantly on revisit (GEMINI.md rule 3). */
const ADMIN_TELEMETRY_CACHE_KEY = 'lingopro.admin.telemetry.v2';

/**
 * Loads CRM counters and enum groups concurrently (Promise.all) from GET /admin/crm/dashboard and GET /system/enums.
 * The last successful response is hydrated synchronously from sessionStorage and refreshed in the background.
 */
export function useAdminTelemetry() {
  return useQuery({
    queryKey: ['admin-crm-telemetry'],
    initialData: () => BrowserStorage.getSession<AdminTelemetryDto | null>(ADMIN_TELEMETRY_CACHE_KEY, null) ?? undefined,
    queryFn: async () => {
      const [crmResponse, enumsResponse] = await Promise.all([
        apiClient.get<ApiResponse<AdminCrmDashboardSummaryDto>>('/admin/crm/dashboard'),
        apiClient.get<ApiResponse<Record<string, EnumMemberItemDto[]>>>('/system/enums'),
      ]);
      const crm = crmResponse.data.data;
      if (!crm) {
        throw new Error('CRM dashboard returned no data.');
      }
      const telemetry: AdminTelemetryDto = {
        crm,
        enumGroupCount: Object.keys(enumsResponse.data.data ?? {}).length,
      };
      BrowserStorage.setSession(ADMIN_TELEMETRY_CACHE_KEY, telemetry);
      return telemetry;
    },
  });
}
