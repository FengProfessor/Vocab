import { sessionErrorResponse } from '@/lib/session-response';
import { authorizeWebAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { safeErrorResponse } from '@/lib/api-security';
import { isPilotLeadStatus } from '@/lib/pilot-sales';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await authorizeWebAdmin(req);
    if (admin.response) return admin.response;
    const { supabase } = admin;

    const { data, error } = await supabase
      .from('pilot_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ success: true, leads: data ?? [] });
  } catch (err: unknown) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(err, 'Không thể tải lead pilot.');
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const admin = await authorizeWebAdmin(req);
    if (admin.response) return admin.response;
    const { supabase } = admin;

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
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(err, 'Không thể cập nhật lead pilot.');
  }
}
