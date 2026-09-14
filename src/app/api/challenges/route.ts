import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';
import { slugify } from '@/lib/challenge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const includeAll = url.searchParams.get('includeAll') === '1';

    let query = supabase.from('challenges').select('*, challenge_participants(count)');
    if (status) {
      query = query.eq('status', status);
    } else if (!includeAll) {
      query = query.neq('status', 'draft');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Transform participant count for frontend
    const challenges = (data || []).map((c: any) => ({
      ...c,
      participant_count: c.challenge_participants?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ success: true, challenges });
  } catch (error) {
    return safeErrorResponse(error, 'Lỗi khi tải danh sách challenge');
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) throw new Error('Unauthorized');
    const user = { id: authUser.userId };

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const slug = slugify(body.name);

    const { data, error } = await supabase
      .from('challenges')
      .insert({ ...body, slug })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi tạo challenge');
  }
}
