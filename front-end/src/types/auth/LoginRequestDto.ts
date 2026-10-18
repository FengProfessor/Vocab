/**
 * Request payload for email and password authentication.
 */
export interface LoginRequestDto {
  /** User email address. */
  email: string;

  /** Plaintext password to be verified by the backend identity service. */
  password: string;

  /** Optional post-login redirect path. */
  redirectTo?: string;
}
