import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { EXT_TOKEN_PREFIX, hashExtensionToken, unauthorized, checkRateLimit } from '@/lib/api-security';

/**
 * POST /api/extension-token — mint extension token dài hạn cho Chrome Extension.
 * Auth: CHỈ nhận Supabase JWT (web session) — không cho dùng extension token
 * để mint token mới (token bị lộ không thể tự nhân bản).
 * 1 token/user: mint lại → token cũ bị thu hồi (upsert đè hash).
 * Token chỉ trả plaintext đúng 1 lần; DB lưu SHA-256 hash.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    const jwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!jwt || jwt.startsWith(EXT_TOKEN_PREFIX)) return unauthorized();

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(jwt);
    if (error || !data.user) return unauthorized();

    // Chống spam mint (đổi token liên tục vô hiệu thiết bị khác)
    const rl = checkRateLimit(`ext-token:${data.user.id}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const token = `${EXT_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
    const { error: upErr } = await supabase
      .from('extension_tokens')
      .upsert(
        {
          user_id: data.user.id,
          token_hash: hashExtensionToken(token),
          created_at: new Date().toISOString(),
          last_used_at: null,
        },
        { onConflict: 'user_id' }
      );
    if (upErr) throw upErr;

    return NextResponse.json({ success: true, token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ExtToken] mint failed:', msg);
    return NextResponse.json({ success: false, error: 'Failed to create token' }, { status: 500 });
  }
}
