import { UserProfileDto } from '@/types/auth/UserProfileDto';

/**
 * Client-side view of the authenticated session.
 * Tokens are intentionally absent: the access and refresh tokens live exclusively in HttpOnly cookies
 * issued by the .NET 10 server and are never readable by JavaScript.
 */
export interface AuthSessionDto {
  /** Authenticated user profile details. */
  user: UserProfileDto;
}
