import { NextRequest, NextResponse } from 'next/server';
import { safeErrorResponse } from '@/lib/api-security';
import { isPilotLeadStatus } from '@/lib/pilot-sales';
import { createServiceClient } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function authorize(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data: callerProfile } = await supabase.from('profiles').select('email, role').eq('id', user.id).maybeSingle();
  const callerEmail = (callerProfile?.email || user.email || '').toLowerCase().trim();
  const isAdminRole = callerProfile?.role === 'admin';
  const isWhitelisted = ADMIN_EMAILS.length > 0 && Boolean(callerEmail && ADMIN_EMAILS.includes(callerEmail));
  if (!isAdminRole && !isWhitelisted) return null;
  return supabase;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await authorize(req);
    if (!supabase) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const { data, error } = await supabase
      .from('pilot_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ success: true, leads: data ?? [] });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể tải lead pilot.');
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await authorize(req);
    if (!supabase) return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });

    const body = await req.json() as { id?: unknown; status?: unknown; adminNote?: unknown };
    if (typeof body.id !== 'string' || !isPilotLeadStatus(body.status)) {
      return NextResponse.json({ success: false, error: 'Invalid lead update' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('pilot_leads')
      .select('contacted_at, converted_at')
      .eq('id', body.id)
      .single();
    if (fetchError) throw fetchError;

    const now = new Date().toISOString();
    const updates: Record<string, string | null> = {
      status: body.status,
      updated_at: now,
    };
    if ('adminNote' in body) {
      updates.admin_note = typeof body.adminNote === 'string' ? body.adminNote.trim().slice(0, 1000) || null : null;
    }
    if ((body.status === 'contacted' || body.status === 'qualified') && !existing.contacted_at) {
      updates.contacted_at = now;
    }
    if (body.status === 'won' && !existing.converted_at) updates.converted_at = now;
    if (body.status !== 'won' && existing.converted_at) updates.converted_at = null;

    const { data, error } = await supabase
      .from('pilot_leads')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể cập nhật lead pilot.');
  }
}
