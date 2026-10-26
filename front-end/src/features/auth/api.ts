/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { AuthTokensPayload } from '@/features/auth/types';
import { UserRole } from '@/types/enums';
import type { Profile, UserGamification } from '@/lib/supabase';
import {
  describeError,
  describeOAuthQueryError,
  formatRawMessage,
} from '@/features/auth/errors';
import { authService } from '@/features/auth/session';
import { callServerOriginApi, normalizePayloadData } from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';

export interface DotNetAuthTokensDto {
  userId?: string;
  id?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  role?: string | number;
  plan?: string | number;
  planExpiresAt?: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  totalXp?: number;
  currentStreak?: number;
  longestStreak?: number;
  learningGoal?: string | null;
  dailyTargetMins?: number;
  onboardingCompleted?: boolean;
  todayXp?: number;
  todayDate?: string | null;
  lastActiveDate?: string | null;
  notificationHour?: number | null;
  province?: string | null;
  city?: string | null;
  createdAt?: string | null;
}

function normalizeRole(role?: UserRole | 'student' | 'teacher' | string): UserRole.Student | UserRole.Teacher {
  return String(role ?? UserRole.Student).toLowerCase() === 'teacher'
    ? UserRole.Teacher
    : UserRole.Student;
}

function normalizePlan(plan?: string | number): 'free' | 'pro' | 'vip' {
  const raw = String(plan ?? 'free').toLowerCase();
  if (raw === 'pro' || raw === '1') return 'pro';
  if (raw === 'vip' || raw === '2') return 'vip';
  return 'free';
}

function normalizeLegacyRole(role?: string | number): 'teacher' | 'student' | 'admin' {
  const raw = String(role ?? 'student').toLowerCase();
  if (raw === 'teacher' || raw === '1') return 'teacher';
  if (raw === 'admin' || raw === '2') return 'admin';
  return 'student';
}

/**
 * Client for all .NET `/api/v1/auth/*` and onboarding endpoints.
 */
export class AuthApi {
  /**
   * Authenticates a user with email and password via `POST /api/v1/auth/login`.
   */
  public static async login(email: string, password: string): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/login', {
      email: email.trim(),
      password,
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Registers a new user account via `POST /api/v1/auth/register`.
   */
  public static async register(
    email: string,
    password: string,
    fullName: string,
    role: UserRole | 'student' | 'teacher' = UserRole.Student,
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>('/auth/register', {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role: normalizeRole(role),
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Generates a PKCE-protected Google OAuth authorization URL via `GET /api/v1/auth/google-url`.
   */
  public static async getGoogleAuthorizationUrl(
    redirectUri: string,
    codeChallenge: string,
  ): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ authorizationUrl: string }>>(
      '/auth/google-url',
      {
        params: { redirectUri, codeChallenge },
      },
    );
    return AuthApi.unwrap(response.data).authorizationUrl;
  }

  /**
   * Exchanges a one-time Google authorization code and PKCE verifier via `POST /api/v1/auth/callback/google`.
   */
  public static async exchangeGoogleCode(
    code: string,
    codeVerifier: string,
    role: UserRole | 'student' | 'teacher' = UserRole.Student,
  ): Promise<AuthTokensPayload> {
    const response = await apiClient.post<ApiResponse<AuthTokensPayload>>(
      '/auth/callback/google',
      {
        code,
        codeVerifier,
        role: normalizeRole(role),
      },
    );
    return AuthApi.unwrap(response.data);
  }

  /**
   * Retrieves the current user's profile and gamification summary via `GET /api/v1/auth/profile`.
   */
  public static async getProfile(): Promise<DotNetAuthTokensDto> {
    const response = await apiClient.get<ApiResponse<DotNetAuthTokensDto>>('/auth/profile');
    return AuthApi.unwrap(response.data);
  }

  /**
   * Retrieves the current user's profile mapped to the legacy `Profile` interface.
   */
  public static async getLegacyProfile(fallbackUserId = ''): Promise<Profile> {
    const dto = await AuthApi.getProfile();
    return {
      id: String(dto.id ?? dto.userId ?? fallbackUserId),
      email: dto.email ?? '',
      full_name: dto.fullName ?? '',
      avatar_url: dto.avatarUrl ?? undefined,
      role: (normalizeLegacyRole(dto.role) === 'teacher' ? 'teacher' : 'student') as Profile['role'],
      created_at: dto.createdAt ?? new Date().toISOString(),
      daily_goal: dto.dailyTargetMins ?? 15,
      notification_hour: dto.notificationHour ?? undefined,
      plan: (normalizePlan(dto.plan) === 'free' ? 'free' : 'pro') as Profile['plan'],
      plan_expires_at: dto.planExpiresAt ?? null,
      province: dto.province ?? null,
      city: dto.city ?? null,
    };
  }

  /**
   * Retrieves the current user's gamification state mapped to the legacy `UserGamification` interface.
   */
  public static async getGamification(fallbackUserId = ''): Promise<UserGamification> {
    const dto = await AuthApi.getProfile();
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      user_id: String(dto.id ?? dto.userId ?? fallbackUserId),
      total_xp: dto.totalXp ?? 0,
      current_streak: dto.currentStreak ?? 0,
      longest_streak: dto.longestStreak ?? 0,
      last_active_date: dto.lastActiveDate ?? null,
      daily_goal: dto.dailyTargetMins ?? 20,
      today_xp: dto.todayXp ?? 0,
      today_date: dto.todayDate ?? todayStr,
    };
  }

  /**
   * Registers or clears the current user's Firebase Cloud Messaging (FCM) device token via `POST /api/v1/users/me/fcm-token`.
   */
  public static async registerFcmToken(fcmToken: string | null): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>('/users/me/fcm-token', {
      fcmToken,
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Ends the session server-side and clears auth cookies via `POST /api/v1/auth/logout`.
   */
  public static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  /**
   * Requests a password recovery email link via `POST /api/v1/auth/password/forgot`.
   */
  public static async forgotPassword(email: string, redirectUri?: string): Promise<boolean> {
    const resolvedRedirect =
      redirectUri ??
      (typeof window !== 'undefined' ? `${window.location.origin}/auth/recovery` : undefined);
    const response = await apiClient.post<ApiResponse<boolean>>('/auth/password/forgot', {
      email: email.trim(),
      redirectUri: resolvedRedirect,
    });
    return Boolean(response.data?.success);
  }

  /**
   * Resets a user's password using a recovery access token or token hash via `POST /api/v1/auth/password/reset`.
   */
  public static async resetPassword(input: {
    newPassword: string;
    accessToken?: string | null;
    tokenHash?: string | null;
  }): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>('/auth/password/reset', {
      newPassword: input.newPassword,
      accessToken: input.accessToken ?? null,
      tokenHash: input.tokenHash ?? null,
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Updates onboarding preferences via `PUT /api/v1/auth/onboarding`.
   */
  public static async updateOnboarding(input: {
    fullName?: string;
    learningGoal?: string;
    dailyTargetMins?: number;
  }): Promise<DotNetAuthTokensDto> {
    const response = await apiClient.put<ApiResponse<DotNetAuthTokensDto>>('/auth/onboarding', {
      fullName: input.fullName ?? 'Học viên',
      learningGoal: input.learningGoal ?? 'General',
      dailyTargetMins: Number(input.dailyTargetMins ?? 10),
    });
    return AuthApi.unwrap(response.data);
  }

  /**
   * Elevates the current user's role from Student to Teacher via `POST /api/v1/auth/role/teacher`.
   */
  public static async claimTeacherRole(): Promise<DotNetAuthTokensDto> {
    const response = await apiClient.post<ApiResponse<DotNetAuthTokensDto>>('/auth/role/teacher');
    return AuthApi.unwrap(response.data);
  }

  /**
   * Claims the one-time 50 XP onboarding reward idempotently via `POST /api/v1/users/me/onboarding/claim-xp`.
   */
  public static async claimOnboardingXp(): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>('/users/me/onboarding/claim-xp');
    return AuthApi.unwrap(response.data);
  }

  /**
   * Retrieves the current session profile in the legacy `/api/profile` envelope shape.
   */
  public static async getProfileSession() {
    const { data } = await authService.getSession();
    const session = data.session;
    return withResponseCompat({
      success: Boolean(session),
      session,
      user: session?.user ?? null,
      data: session?.user ?? null,
    });
  }

  /**
   * Updates user profile fields (display name, daily goal, etc.) via `/auth/onboarding`.
   */
  public static async updateProfile(rawInput: unknown) {
    const input = normalizePayloadData(rawInput);
    try {
      const dto = await AuthApi.updateOnboarding({
        fullName: input.full_name ?? input.fullName ?? input.displayName,
        learningGoal: input.learning_goal ?? input.learningGoal ?? 'General',
        dailyTargetMins: Number(input.daily_goal ?? input.dailyTargetMins ?? 15),
      });
      return withResponseCompat({
        success: true,
        profile: dto,
        data: dto,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      return withResponseCompat({ success: false, error: msg }, 400, false);
    }
  }

  /**
   * Registers or queries FCM push notification status.
   */
  public static async fcmRegister(rawInput?: unknown) {
    if (!rawInput) {
      return withResponseCompat({ success: true, count: 1, staleDays: 0 });
    }
    const input = normalizePayloadData(rawInput);
    const token =
      typeof input.fcmToken === 'string'
        ? input.fcmToken
        : typeof input.fcm_token === 'string'
          ? input.fcm_token
          : null;
    try {
      await AuthApi.registerFcmToken(token);
      return withResponseCompat({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register FCM token';
      return withResponseCompat({ success: false, error: msg }, 400, false);
    }
  }

  /**
   * Requests a browser extension token.
   */
  public static async createExtensionToken(rawBody?: unknown) {
    return callServerOriginApi('/api/extension-token', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Triggers a test due-words push notification (`/api/test/push-due`).
   */
  public static async testPushDue(rawBody?: unknown) {
    return callServerOriginApi('/api/test/push-due', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  private static unwrap<T>(body: ApiResponse<T>): T {
    if (!body?.success || body.data === null || body.data === undefined) {
      throw new Error(body?.message || 'Request failed');
    }
    return body.data;
  }

  public static describeError = describeError;
  public static formatRawMessage = formatRawMessage;
  public static describeOAuthQueryError = describeOAuthQueryError;
}
