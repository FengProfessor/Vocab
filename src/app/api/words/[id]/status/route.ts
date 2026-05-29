import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';

type StatusValue = 'approved' | 'rejected' | 'pending';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { id: wordId } = await params;
    const body = await req.json() as { status?: unknown };
    const status = body.status as StatusValue;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Verify user is teacher of the classroom containing this word
    const supabase = createServiceClient();
    const { data: word } = await supabase
      .from('words')
      .select('id, classroom:classrooms(teacher_id)')
      .eq('id', wordId)
      .maybeSingle();

    if (!word) {
      return NextResponse.json({ success: false, error: 'Word not found' }, { status: 404 });
    }

    const cls = word.classroom as { teacher_id?: string } | { teacher_id?: string }[] | null;
    const teacherId = Array.isArray(cls) ? cls[0]?.teacher_id : cls?.teacher_id;

    if (teacherId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('words')
      .update({ status })
      .eq('id', wordId)
      .select('id, status')
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
