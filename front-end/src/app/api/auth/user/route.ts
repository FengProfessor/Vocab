import { NextResponse } from 'next/server';
import { publicAppUser, verifiedAppSession } from '@/lib/server-auth-session';
import type { User } from '@supabase/supabase-js';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';

/** Only existing onboarding metadata. No role, plan, email or password mutation. */
export async function PATCH(req: Request) {
  try {
    const session = await verifiedAppSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_SESSION_HEADERS });
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || !('data' in body) || !body.data ||
        typeof body.data !== 'object' || Array.isArray(body.data) || Object.keys(body).some(key => key !== 'data')) {
      return NextResponse.json({ error: 'Invalid metadata' }, { status: 400, headers: PRIVATE_SESSION_HEADERS });
    }
    const updates: Record<string, string | boolean> = {};
    for (const [key, value] of Object.entries(body.data)) {
      if (key === 'force_onboarding' && value === false) updates[key] = false;
      else if (['lingopro_onboarding_completed', 'lingopro_onboarding_version', 'referral_source'].includes(key) &&
        typeof value === 'string' && value.length <= 200) updates[key] = value;
      else return NextResponse.json({ error: 'Invalid metadata' }, { status: 400, headers: PRIVATE_SESSION_HEADERS });
    }
    // Auth update uses the verified user JWT, never an admin mutation.
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${session.vault.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: updates }),
    });
    const user: unknown = await response.json();
    if (!response.ok || !user || typeof user !== 'object' || !('id' in user) || user.id !== session.user.id ||
        !('user_metadata' in user) || !user.user_metadata || typeof user.user_metadata !== 'object') {
      return NextResponse.json({ error: 'Metadata update unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
    }
    return NextResponse.json({ user: publicAppUser(user as User) }, { headers: PRIVATE_SESSION_HEADERS });
  } catch (error) {
    return sessionErrorResponse(error) ?? NextResponse.json({ error: 'Authentication temporarily unavailable' }, { status: 503, headers: PRIVATE_SESSION_HEADERS });
  }
}
