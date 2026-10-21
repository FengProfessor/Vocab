import { UserProfileDto } from '@/types/auth/UserProfileDto';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * State contract for the global cookie-session authentication store.
 */
export interface AuthStoreState {
  /** Convenience pointer to the authenticated user profile. */
  user: UserProfileDto | null;

  /** Whether the user is currently authenticated with the server. */
  isAuthenticated: boolean;

  /** Whether a server session check via /api/v1/auth/profile is in progress. */
  isCheckingSession: boolean;

  /** Whether the server verification has completed at least once. */
  hasVerifiedServer: boolean;

  /** Verifies the HttpOnly cookie session against GET /api/v1/auth/profile. */
  verifyServerSession: () => Promise<boolean>;

  /** Updates the learner's target certification level (a client-side preference). */
  setTargetCertLevel: (level: CertLevel) => void;

  /**
   * Stores the token pair returned by the server after a successful sign-in/sign-up and verifies the
   * session with it. Resolves true when the profile was loaded.
   */
  completeLogin: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => Promise<boolean>;

  /**
   * Ends the session: asks the server to revoke the Supabase session, wipes local state and tokens,
   * and returns the browser to the SPA login page.
   */
  signOut: () => void;
}
