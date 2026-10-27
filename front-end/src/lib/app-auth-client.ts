export {
  authService,
  appAuth,
  clearLegacyAuthStorage,
  authStateVersion,
  buildSessionFromDto,
  hydrateSessionFromAuthTokens,
  fetchSessionOnce,
  type DotNetAuthTokensDto,
  type AppSession,
  type AppUser,
  type AppAuthEvent,
} from '@/features/auth/session';
