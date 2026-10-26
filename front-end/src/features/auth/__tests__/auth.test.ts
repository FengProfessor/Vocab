import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { apiClient, refreshAccessToken } from '@/lib/apiClient';
import { TokenStore } from '@/features/auth/tokenStore';
import {
  authService,
  hydrateSessionFromAuthTokens,
  resetAuthSessionForTests,
} from '@/features/auth/session';

function createFakeJwt(sub: string, email: string, expOffsetSeconds = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub,
      email,
      exp: Math.floor(Date.now() / 1000) + expOffsetSeconds,
    }),
  );
  return `${header}.${payload}.signature`;
}

describe('Auth module (.NET 10 + HttpOnly refresh cookie)', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    resetAuthSessionForTests();
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('preserves cached session and does not emit SIGNED_OUT on network error or 500 during refresh/profile fetch (Offline-First)', async () => {
    const initialJwt = createFakeJwt('user-123', 'learner@example.com', 3600);
    hydrateSessionFromAuthTokens({
      accessToken: initialJwt,
      userId: 'user-123',
      email: 'learner@example.com',
      fullName: 'Offline Learner',
      role: 'Student',
    });

    const events: string[] = [];
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event) => {
      events.push(event);
    });

    // Simulate memory token loss (e.g. tab reload or expired in-memory token) while cached profile remains
    TokenStore.clear();

    // Case 1: Network error (no response)
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    };

    const resNetworkErr = await authService.getSession({ force: true });
    expect(resNetworkErr.data.session).not.toBeNull();
    expect(resNetworkErr.data.session?.user.id).toBe('user-123');
    expect(events).not.toContain('SIGNED_OUT');

    // Case 2: Server 500 error on /auth/refresh
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const response: AxiosResponse = {
        data: { success: false, message: 'Internal Server Error' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config,
      };
      throw new AxiosError('Request failed with status code 500', 'ERR_BAD_RESPONSE', config, null, response);
    };

    const res500 = await authService.getSession({ force: true });
    expect(res500.data.session).not.toBeNull();
    expect(res500.data.session?.user.email).toBe('learner@example.com');
    expect(events).not.toContain('SIGNED_OUT');

    subscription.unsubscribe();
  });

  it('deduplicates concurrent 401 responses into a single POST /auth/refresh call', async () => {
    const expiredJwt = createFakeJwt('user-456', 'concurrent@example.com', 3600);
    const refreshedJwt = createFakeJwt('user-456', 'concurrent@example.com', 7200);
    TokenStore.save(expiredJwt);

    let refreshCallCount = 0;
    let protectedCallCount = 0;

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      if (config.url === '/auth/refresh') {
        refreshCallCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return {
          data: {
            success: true,
            statusCode: 200,
            data: {
              accessToken: refreshedJwt,
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      protectedCallCount += 1;
      const authHeader = config.headers?.Authorization;
      if (authHeader !== `Bearer ${refreshedJwt}`) {
        const response: AxiosResponse = {
          data: { success: false, statusCode: 401, message: 'Unauthorized' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        };
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response);
      }

      return {
        data: { success: true, data: { url: config.url } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const [r1, r2, r3] = await Promise.all([
      apiClient.get('/vocab/due?q=1'),
      apiClient.get('/vocab/due?q=2'),
      apiClient.get('/vocab/due?q=3'),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(protectedCallCount).toBe(6); // 3 initial 401s + 3 successful retries
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);
    expect(TokenStore.getAccessToken()).toBe(refreshedJwt);
  });

  it('clears in-memory access token, clears cached session, and emits SIGNED_OUT on signOut()', async () => {
    const jwt = createFakeJwt('user-789', 'signout@example.com', 3600);
    hydrateSessionFromAuthTokens({
      accessToken: jwt,
      userId: 'user-789',
      email: 'signout@example.com',
      fullName: 'SignOut User',
      role: 'Student',
    });

    expect(TokenStore.getAccessToken()).toBe(jwt);
    expect(authService.getSessionSync()?.user.id).toBe('user-789');

    let logoutCalled = false;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      if (config.url === '/auth/logout') {
        logoutCalled = true;
      }
      return {
        data: { success: true, statusCode: 200, data: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const events: Array<{ event: string; hasSession: boolean }> = [];
    const {
      data: { subscription },
    } = authService.onAuthStateChange((event, session) => {
      events.push({ event, hasSession: Boolean(session) });
    });

    const { error } = await authService.signOut();
    expect(error).toBeNull();
    expect(logoutCalled).toBe(true);
    expect(TokenStore.getAccessToken()).toBeNull();
    expect(authService.getSessionSync()).toBeNull();
    expect(events.some((e) => e.event === 'SIGNED_OUT' && !e.hasSession)).toBe(true);

    subscription.unsubscribe();
    expect(typeof refreshAccessToken).toBe('function');
  });
});
