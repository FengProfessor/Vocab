import { UserProfileDto } from '@/types/auth/UserProfileDto';

/**
 * Client-side view of the authenticated session.
 * Tokens are intentionally absent from this DTO: they are held separately by TokenStore, which captures the
 * Supabase tokens the server hands over after login. HttpOnly cookies remain a fallback.
 */
export interface AuthSessionDto {
  /** Authenticated user profile details. */
  user: UserProfileDto;
}
