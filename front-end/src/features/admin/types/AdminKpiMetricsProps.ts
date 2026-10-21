import { AdminTelemetryDto } from '@/types/admin/AdminTelemetryDto';

/**
 * Props for the AdminKpiMetrics component.
 */
export interface AdminKpiMetricsProps {
  /** Telemetry from the API, or undefined while the first load is pending. */
  telemetry?: AdminTelemetryDto;
  /** Whether the first load is pending (renders skeletons). */
  isLoading?: boolean;
}
