import {
  callDotNetRaw,
  callServerOriginApi,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapCrmDashboardResponse } from '@/features/admin/mappers';

/**
 * Domain API service for Administrative CRM Analytics, Dashboard Stats, and Pilot Leads.
 */
export class AdminApi {
  /**
   * Retrieves administrative CRM dashboard metrics via `GET /api/v1/admin/crm/dashboard`.
   */
  public static async getCrmDashboard(options?: {
    forceRefresh?: boolean;
    headers?: HeadersInit | Record<string, string>;
  }) {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/admin/crm/dashboard',
      {
        method: 'GET',
        params: options?.forceRefresh ? { refresh: 1 } : undefined,
        headers: options?.headers,
      },
    );
    const payload = mapCrmDashboardResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves administrative overview stats via `GET /api/v1/admin/crm/dashboard`.
   */
  public static async getStats(options?: LegacyRequestOptions & { forceRefresh?: boolean }) {
    return AdminApi.getCrmDashboard(options);
  }

  /**
   * Lists pilot leads for administrative review.
   */
  public static async getPilotLeads(options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/admin/pilot-leads', {
      method: 'GET',
      headers: options?.headers,
    });
  }

  /**
   * Updates pilot lead status/notes.
   */
  public static async updatePilotLead(rawBody: unknown, options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/admin/pilot-leads', {
      method: 'PATCH',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Subscribes a teacher or learner pilot lead via `POST /api/v1/admin/leads/subscribe`.
   */
  public static async subscribePilotLead(rawBody: unknown, options?: LegacyRequestOptions) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/admin/leads/subscribe',
      {
        method: 'POST',
        headers: options?.headers,
        data: {
          email: body.email || `${body.phone || 'lead'}@lingopro.online`,
          fullName: body.fullName || body.name || 'Giáo viên / Học viên',
          phone: body.phone || '',
          source: body.source || '/api/pilot/leads',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        ...(resBody ?? {}),
      },
      status,
      ok,
    );
  }
}
