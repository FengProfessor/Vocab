import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { EXT_TOKEN_PREFIX, hashExtensionToken, unauthorized, checkRateLimitAsync } from '@/lib/api-security';

const DEFAULT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 năm

async function requireWebUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt || jwt.startsWith(EXT_TOKEN_PREFIX)) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

/**
 * GET /api/extension-token — liệt kê thiết bị/token (không trả plaintext).
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await requireWebUser(req);
    if (!auth) return unauthorized();

    const { data, error } = await auth.supabase
      .from('extension_tokens')
      .select('id, device_name, created_at, last_used_at, expires_at, revoked_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      tokens: (data ?? []).map((row) => ({
        id: row.id,
        deviceName: row.device_name,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
        expiresAt: row.expires_at,
        revoked: Boolean(row.revoked_at),
        active:
          !row.revoked_at &&
          (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()),
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ExtToken] list failed:', msg);
    return NextResponse.json({ success: false, error: 'Failed to list tokens' }, { status: 500 });
  }
}

/**
 * POST /api/extension-token — mint token mới (multi-device).
 * Body optional: { deviceName?: string, replaceAll?: boolean }
 * replaceAll=true → revoke mọi token active trước (hành vi giống 1 token/user cũ).
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await requireWebUser(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimitAsync(`ext-token:${auth.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } },
      );
    }

    let deviceName = 'Unknown device';
    let replaceAll = false;
    try {
      const body = (await req.json()) as { deviceName?: unknown; replaceAll?: unknown };
      if (typeof body.deviceName === 'string' && body.deviceName.trim()) {
        deviceName = body.deviceName.trim().slice(0, 80);
      }
      replaceAll = body.replaceAll === true;
    } catch {
      // empty body ok
    }

    if (replaceAll) {
      await auth.supabase
        .from('extension_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .is('revoked_at', null);
    }

    const token = `${EXT_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS).toISOString();

    const { data: row, error: insErr } = await auth.supabase
      .from('extension_tokens')
      .insert({
        user_id: auth.user.id,
        token_hash: hashExtensionToken(token),
        device_name: deviceName,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        last_used_at: null,
        revoked_at: null,
      })
      .select('id, device_name, expires_at, created_at')
      .single();
    if (insErr) throw insErr;

    return NextResponse.json({
      success: true,
      token,
      id: row.id,
      deviceName: row.device_name,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ExtToken] mint failed:', msg);
    return NextResponse.json({ success: false, error: 'Failed to create token' }, { status: 500 });
  }
}

/**
 * DELETE /api/extension-token?id=<uuid> — revoke một token.
 * DELETE /api/extension-token?all=1 — revoke tất cả.
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  try {
    const auth = await requireWebUser(req);
    if (!auth) return unauthorized();

    const url = new URL(req.url);
    const all = url.searchParams.get('all') === '1';
    const id = url.searchParams.get('id');

    if (all) {
      const { error } = await auth.supabase
        .from('extension_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .is('revoked_at', null);
      if (error) throw error;
      return NextResponse.json({ success: true, revoked: 'all' });
    }

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('extension_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', auth.user.id)
      .eq('id', id)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: false, error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, revoked: data.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ExtToken] revoke failed:', msg);
    return NextResponse.json({ success: false, error: 'Failed to revoke token' }, { status: 500 });
  }
}
