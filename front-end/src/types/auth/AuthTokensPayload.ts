import { UserRole } from '@/types/enums/UserRole';

/**
 * Token and identity fields returned by the server's AuthTokensDto (camelCase JSON).
 */
export interface AuthTokensPayload {
  /** Unique identifier of the authenticated user. */
  userId: string;

  /** Primary email address of the user. */
  email: string;

  /** Display full name of the user. */
  fullName: string;

  /** Assigned system authorization role. */
  role: UserRole | string;

  /** Supabase JWT access token; empty when email confirmation is required before a session exists. */
  accessToken: string;

  /** Supabase refresh token used to rotate the session. */
  refreshToken: string;

  /** Access token lifetime in seconds. */
  expiresIn: number;
}
