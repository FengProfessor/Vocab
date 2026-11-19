import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  forbidden,
  getAuthUser,
  isValidString,
  safeErrorResponse,
  unauthorized,
} from '@/lib/api-security';
import { PRIVATE_SESSION_HEADERS } from '@/lib/session-response';
import {
  getTeacherVocabPackById,
  getTeacherVocabPackCatalog,
} from '@/data/teacher-packs/grade11-global-success';

/**
 * GET /api/teacher/words/presets?classroomId=<uuid>[&packId=<id>]
 * Kho gói từ vựng soạn sẵn CHỈ DÀNH CHO GIÁO VIÊN giao vào lớp học.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = (searchParams.get('classroomId') || '').trim();
    const packId = (searchParams.get('packId') || '').trim();

    if (!isValidString(classroomId, 100)) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: cls, error: clsErr } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (clsErr) throw clsErr;
    if (!cls || cls.teacher_id !== auth.userId || cls.name === '__personal__') {
      return forbidden('Tính năng gói từ vựng này chỉ dành riêng cho giáo viên của lớp học');
    }

    if (!packId) {
      return NextResponse.json(
        { success: true, packs: getTeacherVocabPackCatalog() },
        { headers: PRIVATE_SESSION_HEADERS },
      );
    }

    const pack = getTeacherVocabPackById(packId);
    if (!pack) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy gói từ vựng' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, pack },
      { headers: PRIVATE_SESSION_HEADERS },
    );
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không tải được gói từ vựng giáo viên');
  }
}
