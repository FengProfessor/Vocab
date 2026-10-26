import {
  callDotNetRaw,
  callServerOriginApi,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapReferralHubResponse } from '@/features/social/mappers';

/**
 * Domain API service for Referrals, Study Groups, Room Presence, Lead Magnet, and Campaigns.
 */
export class SocialApi {
  /**
   * Retrieves referral hub statistics and active study groups via `GET /api/v1/social/referrals/hub`.
   */
  public static async getReferralHub(options?: LegacyRequestOptions) {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/social/referrals/hub',
      {
        method: 'GET',
        headers: options?.headers,
      },
    );
    const payload = mapReferralHubResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves the authenticated user's study groups via `GET /api/v1/social/referrals/hub`.
   */
  public static async getMyGroups(options?: LegacyRequestOptions) {
    return SocialApi.getReferralHub(options);
  }

  /**
   * Claims a referral code via `POST /api/v1/social/referrals/claim`.
   */
  public static async claimReferral(rawBody: unknown, options?: LegacyRequestOptions) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/social/referrals/claim',
      {
        method: 'POST',
        data: { referralCode: body.referralCode || body.code || '' },
        headers: options?.headers,
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

  /**
   * Resolves an invite referral code metadata.
   */
  public static async resolveReferral(rawBody: unknown) {
    return callServerOriginApi('/api/referral/resolve', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Evaluates whether a referred learner has reached activation criteria.
   */
  public static async evaluateReferralActivation(options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/referral/evaluate-activation', {
      method: 'POST',
      headers: options?.headers,
    });
  }

  /**
   * Submits a referral payout request.
   */
  public static async requestReferralPayout(rawBody: unknown, options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/referral/payout', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Joins a collaborative study group via `POST /api/v1/social/groups/join`.
   */
  public static async joinGroup(rawBody: unknown, options?: LegacyRequestOptions) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/social/groups/join',
      {
        method: 'POST',
        data: { inviteCode: body.inviteCode || body.code || '' },
        headers: options?.headers,
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

  /**
   * Leaves the current study group.
   */
  public static async leaveGroup(rawBody?: unknown, options?: LegacyRequestOptions) {
    return callServerOriginApi('/api/groups/leave', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Removes a member from an owned study group.
   */
  public static async removeGroupMember(
    groupId: string,
    rawBody: unknown,
    options?: LegacyRequestOptions,
  ) {
    return callServerOriginApi(`/api/groups/${encodeURIComponent(groupId)}/remove`, {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      headers: options?.headers,
    });
  }

  /**
   * Sends a heartbeat or queries presence in the Lingo Town / Social Hub room.
   */
  public static async getRoomPresence(params?: Record<string, unknown> | string) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params;
    }
    return callServerOriginApi('/api/hub/presence', {
      method: 'GET',
      params: queryParams,
    });
  }

  /**
   * Updates user presence in the Lingo Town / Social Hub room.
   */
  public static async updateRoomPresence(rawBody: unknown) {
    return callServerOriginApi('/api/hub/presence', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Clears user presence from the Social Hub room.
   */
  public static async leaveRoomPresence() {
    return callServerOriginApi('/api/hub/presence', {
      method: 'DELETE',
    });
  }

  /**
   * Subscribes an email to a lead magnet resource (`/api/lead-magnet/subscribe`).
   */
  public static async subscribeLeadMagnet(rawBody: unknown) {
    return callServerOriginApi('/api/lead-magnet/subscribe', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Fetches lead magnet ebook content (`/api/lead-magnet/ebook`).
   */
  public static async getLeadMagnetEbook() {
    return callServerOriginApi('/api/lead-magnet/ebook', {
      method: 'GET',
    });
  }

  /**
   * Submits a Khai Giảng campaign gift claim (`/api/campaign/khaigiang`).
   */
  public static async submitKhaiGiangCampaign(rawBody: unknown) {
    return callServerOriginApi('/api/campaign/khaigiang', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
