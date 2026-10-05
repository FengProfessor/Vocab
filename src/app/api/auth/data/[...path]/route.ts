import { NextResponse } from 'next/server';
import {
  verifiedAppSession,
  sessionCookieName,
  ALLOWED_DATA_TABLES,
  ALLOWED_DATA_RPCS,
} from '@/lib/server-auth-session';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';

const TABLES = ALLOWED_DATA_TABLES;
const RPCS = ALLOWED_DATA_RPCS;
type Context = { params: Promise<{ path: string[] }> };

async function handle(req: Request, context: Context) {
  try {
    const { path } = await context.params;
    const valid = path.length === 1 ? TABLES.has(path[0]) :
      path.length === 2 && path[0] === 'rpc' && RPCS.has(path[1]) && req.method === 'POST';
    if (!valid || path.some(part => !/^[a-z_]+$/.test(part))) {
      return NextResponse.json({ message: 'Data endpoint unavailable' }, { status: 404, headers: PRIVATE_SESSION_HEADERS });
    }
    const session = await verifiedAppSession(req);
    const hasCookie = (req.headers.get('cookie') ?? '').split(';').some(value => value.trim().startsWith(`${sessionCookieName()}=`));
    if (!session && (!['GET', 'HEAD'].includes(req.method) || hasCookie)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401, headers: PRIVATE_SESSION_HEADERS });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ message: 'Data service unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
    const headers = new Headers({ apikey: key, Authorization: `Bearer ${session?.vault.accessToken ?? key}`,
      'Accept-Profile': 'public', 'Content-Profile': 'public' });
    for (const name of ['Accept', 'Content-Type', 'Prefer', 'Range', 'Range-Unit']) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text();
    if (body !== undefined && (Buffer.byteLength(body) > 256 * 1024 ||
        !req.headers.get('content-type')?.startsWith('application/json'))) {
      return NextResponse.json({ message: 'Invalid data request' }, { status: 400, headers: PRIVATE_SESSION_HEADERS });
    }
    const target = new URL(`/rest/v1/${path.join('/')}`, url);
    target.search = new URL(req.url).search;
    const upstream = await fetch(target, { method: req.method, headers, body,
      signal: AbortSignal.timeout(10_000), cache: 'no-store', redirect: 'error' });
    const outputHeaders = new Headers(PRIVATE_SESSION_HEADERS);
    for (const name of ['Content-Type', 'Content-Range', 'Range-Unit', 'Preference-Applied']) {
      const value = upstream.headers.get(name);
      if (value) outputHeaders.set(name, value);
    }
    if (!upstream.ok) return NextResponse.json({ message: 'Data request failed' }, {
      status: upstream.status >= 500 ? 503 : upstream.status, headers: PRIVATE_SESSION_HEADERS,
    });
    return new Response(req.method === 'HEAD' || upstream.status === 204 ? null : await upstream.arrayBuffer(), {
      status: upstream.status, headers: outputHeaders,
    });
  } catch (error) {
    return sessionErrorResponse(error) ?? NextResponse.json({ message: 'Data service unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
  }
}
export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
