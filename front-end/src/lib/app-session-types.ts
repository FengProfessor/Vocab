/** Public session metadata. Deliberately contains no reusable credential. */
export interface AppUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}

export interface AppSession {
  user: AppUser;
  expires_at: number;
}

export type AppAuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'TOKEN_REFRESHED';
