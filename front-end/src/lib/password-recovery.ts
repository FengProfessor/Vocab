import { createHmac, randomBytes } from 'node:crypto';
import { appOrigin, assertAppRequest, cookieHeader, providerSessionId, requestCookie,
  serverAuthClient, sessionCookieName, SessionRequestError, verifiedProviderUser } from '@/lib/server-auth-session';
import { beginPasswordReset, createRecoveryRecord, endPasswordReset, FLOW_LIFETIME_MS,
  recoveryRecord, revokeSessionVault, SessionStoreUnavailableError, type SessionVault } from '@/lib/server-session-store';
import { checkRateLimitAsync, RateLimitUnavailableError } from '@/lib/distributed-rate-limit';
import { getClientIp } from '@/lib/api-security';
import { PRIVATE_SESSION_HEADERS } from '@/lib/session-response';

export const RECOVERY_HEADERS = { ...PRIVATE_SESSION_HEADERS, 'Referrer-Policy': 'no-referrer' };
export const RECOVERY_ACCEPTED = { accepted: true,
  message: 'Nếu tài khoản tồn tại, hướng dẫn khôi phục sẽ được gửi. Mở liên kết trong cùng trình duyệt này.' };
export function recoveryCookieName(flow = false): string {
  return (process.env.NODE_ENV === 'production' ? '__Host-lingopro-' : 'lingopro-dev-') +
    (flow ? 'recovery-flow' : 'recovery');
}

export function recoveryFailure(error: unknown): Response {
  const status = error instanceof SessionRequestError ? error.status :
    error instanceof RecoveryInputError ? 400 : 503;
  return Response.json({ error: status === 400 ? 'Thông tin không hợp lệ hoặc mật khẩu chưa đạt yêu cầu.' :
    status === 401 ? 'Liên kết không hợp lệ, đã dùng hoặc hết hạn. Yêu cầu liên kết mới.' :
      status === 403 ? 'Yêu cầu không hợp lệ.' : 'Tạm thời không khả dụng. Yêu cầu liên kết mới nếu cần.' },
  { status, headers: RECOVERY_HEADERS });
}

class RecoveryInputError extends Error {}
async function bodyObject(req: Request): Promise<Record<string, unknown>> {
  const reader = req.body?.getReader();
  if (!reader) throw new RecoveryInputError();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > 12_000) { await reader.cancel(); throw new RecoveryInputError(); }
    chunks.push(part.value);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RecoveryInputError();
    return body as Record<string, unknown>;
  } catch { throw new RecoveryInputError(); }
}

function digest(value: string): string {
  const key = process.env.AUTH_SESSION_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) throw new SessionStoreUnavailableError();
  return createHmac('sha256', Buffer.from(key, 'hex')).update(`recovery:${value}`).digest('hex');
}

export async function requestPasswordRecovery(req: Request): Promise<Response> {
  assertAppRequest(req);
  const ip = await checkRateLimitAsync(`recovery-ip:${digest(getClientIp(req))}`, 5, 60_000);
  if (!ip.allowed) return Response.json({ error: 'Quá nhiều yêu cầu. Thử lại sau.' }, {
    status: 429, headers: { ...RECOVERY_HEADERS, 'Retry-After': '60' },
  });
  const body = await bodyObject(req);
  if (typeof body.email !== 'string') throw new RecoveryInputError();
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RecoveryInputError();
  const account = await checkRateLimitAsync(`recovery-email:${digest(email)}`, 3, 15 * 60_000);
  // Một cookie/DTO contract cho mọi email hợp lệ, kể cả quota/provider rejection.
  let verifier = JSON.stringify(`${randomBytes(32).toString('base64url')}/recovery`);
  if (account.allowed) {
    const auth = serverAuthClient();
    try {
      const { error } = await auth.client.auth.resetPasswordForEmail(email, {
        redirectTo: new URL('/auth/recovery/callback', appOrigin(req)).toString(),
      });
      if (!error && auth.verifier()) verifier = auth.verifier()!;
    } catch {
      // Không log email/provider error/URL. Generic acceptance không cam kết deliverability.
    }
  }
  const flow = await createRecoveryRecord({ phase: 'pkce', verifier });
  const response = Response.json(RECOVERY_ACCEPTED, { headers: RECOVERY_HEADERS });
  response.headers.append('Set-Cookie', cookieHeader(recoveryCookieName(true), flow, FLOW_LIFETIME_MS / 1000));
  response.headers.append('Set-Cookie', cookieHeader(recoveryCookieName(), '', 0));
  return response;
}

export async function finishRecoveryCallback(req: Request): Promise<Response> {
  const origin = appOrigin(req);
  const url = new URL(req.url);
  const fail = () => new Response(null, { status: 303, headers: { ...RECOVERY_HEADERS,
    Location: new URL('/auth/recovery?invalid=1', origin).toString(),
    'Set-Cookie': cookieHeader(recoveryCookieName(true), '', 0) } });
  const id = requestCookie(req, recoveryCookieName(true));
  const code = url.searchParams.get('code');
  if (!id || !code || !/^[A-Za-z0-9_-]{8,2048}$/.test(code) || url.searchParams.getAll('code').length !== 1 ||
      [...url.searchParams.keys()].some(name => name !== 'code') || req.headers.has('authorization')) return fail();
  const flow = await recoveryRecord(id, 'pkce', true);
  if (!flow?.verifier) return fail();
  const { data, error } = await serverAuthClient(flow.verifier).client.auth.exchangeCodeForSession(code);
  const expiresAt = data.session?.expires_at;
  if (error || !('redirectType' in data) || data.redirectType !== 'recovery' || !data.session ||
      !expiresAt || !Number.isSafeInteger(expiresAt) || !data.session.user.email_confirmed_at ||
      expiresAt * 1000 <= Date.now()) return fail();
  const session = data.session;
  const input = { userId: session.user.id, providerSessionId: providerSessionId(session.access_token),
    accessToken: session.access_token, refreshToken: session.refresh_token,
    tokenExpiresAt: expiresAt * 1000 };
  await verifiedProviderUser(input);
  const now = Date.now();
  const vault: SessionVault = { ...input, createdAt: now, expiresAt: now + FLOW_LIFETIME_MS };
  const context = await createRecoveryRecord({ phase: 'password', vault });
  const response = new Response(null, { status: 303, headers: { ...RECOVERY_HEADERS,
    Location: new URL('/auth/recovery', origin).toString() } });
  response.headers.append('Set-Cookie', cookieHeader(recoveryCookieName(), context, FLOW_LIFETIME_MS / 1000));
  response.headers.append('Set-Cookie', cookieHeader(recoveryCookieName(true), '', 0));
  return response;
}

async function authorizedRecovery(req: Request, consume = false): Promise<SessionVault> {
  assertAppRequest(req, req.method !== 'GET');
  const id = requestCookie(req, recoveryCookieName());
  if (!id) throw new SessionRequestError(401);
  const context = await recoveryRecord(id, 'password', consume);
  if (!context?.vault || context.vault.tokenExpiresAt <= Date.now()) throw new SessionRequestError(401);
  await verifiedProviderUser(context.vault);
  return context.vault;
}

export async function recoveryStatus(req: Request): Promise<Response> {
  await authorizedRecovery(req);
  return Response.json({ ready: true }, { headers: RECOVERY_HEADERS });
}

export async function updateRecoveredPassword(req: Request): Promise<Response> {
  assertAppRequest(req);
  const rate = await checkRateLimitAsync(`recovery-reset:${digest(getClientIp(req))}`, 10, 60_000);
  if (!rate.allowed) return Response.json({ error: 'Quá nhiều yêu cầu. Thử lại sau.' }, { status: 429, headers: RECOVERY_HEADERS });
  const body = await bodyObject(req);
  if (Object.keys(body).some(name => !['password', 'confirmation'].includes(name)) ||
      typeof body.password !== 'string' || typeof body.confirmation !== 'string' ||
      body.password.length < 6 || body.password.length > 1024 || body.password !== body.confirmation) {
    throw new RecoveryInputError();
  }
  const vault = await authorizedRecovery(req, true);
  const owner = await beginPasswordReset(vault.userId);
  if (!owner) throw new SessionStoreUnavailableError();
  try {
    const provider = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!provider || !publicKey) throw new SessionStoreUnavailableError();
    // Authenticated user endpoint: provider recovery bearer, không admin updateUserById.
    const result = await fetch(new URL('/auth/v1/user', provider), {
      method: 'PUT', headers: { apikey: publicKey, Authorization: `Bearer ${vault.accessToken}`,
        'Content-Type': 'application/json' }, body: JSON.stringify({ password: body.password }),
      signal: AbortSignal.timeout(10_000), cache: 'no-store',
    });
    if (!result.ok) {
      if (result.status === 400 || result.status === 422) throw new RecoveryInputError();
      throw new SessionStoreUnavailableError();
    }
    const user: unknown = await result.json();
    if (!user || typeof user !== 'object' || !('id' in user) || user.id !== vault.userId) throw new SessionStoreUnavailableError();
    // Cùng endpoint/scope với SDK signOut; timeout rõ ràng, không cần admin credential.
    const signedOut = await fetch(new URL('/auth/v1/logout?scope=global', provider), {
      method: 'POST', headers: { apikey: publicKey, Authorization: `Bearer ${vault.accessToken}` },
      signal: AbortSignal.timeout(10_000), cache: 'no-store',
    });
    if (!signedOut.ok) throw new SessionStoreUnavailableError();
    const previous = requestCookie(req, sessionCookieName());
    if (previous) await revokeSessionVault(previous);
  } finally {
    await endPasswordReset(vault.userId, owner);
  }
  const response = Response.json({ success: true, reloginRequired: true }, { headers: RECOVERY_HEADERS });
  response.headers.append('Set-Cookie', cookieHeader(recoveryCookieName(), '', 0));
  response.headers.append('Set-Cookie', cookieHeader(sessionCookieName(), '', 0));
  return response;
}

export { RateLimitUnavailableError };
