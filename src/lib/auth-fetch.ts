/** Same-origin cookie auth. Never retries a business mutation or accepts a caller bearer. */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (typeof window === 'undefined' || new URL(input, window.location.origin).origin !== window.location.origin) {
    throw new Error('Authenticated requests must be same-origin');
  }
  const headers = new Headers(init.headers);
  if (headers.has('authorization')) throw new Error('Browser bearer authentication is disabled');
  headers.set('X-LingoPro-Request', '1');
  return fetch(input, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
}
