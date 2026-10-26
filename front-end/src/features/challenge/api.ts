/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapChallengesListResponse } from '@/features/challenge/mappers';

/**
 * Domain API service for Commitment Challenges, Enrollments, and Challenge Leads.
 */
export class ChallengeApi {
  /**
   * Lists commitment challenges via `GET /api/v1/challenges`.
   */
  public static async getChallenges(params?: { includeAll?: boolean | number | string }) {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/challenges', {
      method: 'GET',
      params: params as Record<string, unknown>,
    });
    const payload = mapChallengesListResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves active challenges for the student dashboard widget via `GET /api/v1/challenges`.
   */
  public static async getWidget() {
    return ChallengeApi.getChallenges();
  }

  /**
   * Retrieves a single challenge by slug or ID.
   */
  public static async getChallengeBySlug(slug: string) {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/challenges', {
      method: 'GET',
    });
    if (ok && Array.isArray(body?.data)) {
      const match = body!.data.find(
        (c) => String(c.slug ?? '') === slug || String(c.id ?? '') === slug,
      );
      if (match) {
        return withResponseCompat(
          { success: true, challenge: match, data: match, ...match },
          status,
          true,
        );
      }
    }
    return callServerOriginApi(`/api/challenges/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });
  }

  /**
   * Creates a new commitment challenge via `POST /api/v1/challenges`.
   */
  public static async createChallenge(rawBody: unknown) {
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/challenges',
      {
        method: 'POST',
        data: normalizePayloadData(rawBody),
      },
    );
    return withResponseCompat(
      (resBody ?? { success: ok }) as Record<string, any>,
      status,
      ok,
    );
  }

  /**
   * Enrolls the authenticated user in a challenge via `POST /api/v1/challenges/{challengeId}/join`.
   */
  public static async joinChallenge(challengeId: string, rawBody?: unknown) {
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      `/challenges/${encodeURIComponent(challengeId)}/join`,
      {
        method: 'POST',
        data: normalizePayloadData(rawBody),
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        ...(resBody?.data && typeof resBody.data === 'object' ? resBody.data : {}),
        error: ok ? undefined : resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Submits a challenge landing page lead via `POST /api/v1/admin/leads/subscribe`.
   */
  public static async submitLead(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/admin/leads/subscribe',
      {
        method: 'POST',
        data: {
          email: body.email || `${body.phone || 'lead'}@lingopro.online`,
          fullName: body.fullName || body.name || 'Học viên Challenge',
          phone: body.phone || '',
          source: body.source || '/api/challenge/lead',
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
