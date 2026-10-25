import { sessionErrorResponse } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorized, forbidden, isValidString, safeErrorResponse } from '@/lib/api-security';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const classroomId = typeof body.classroomId === 'string' ? body.classroomId.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!isValidString(classroomId, 60)) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    if (!email || !email.includes('@') || email.length > 255) {
      return NextResponse.json({ success: false, error: 'Email không hợp lệ' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Verify classroom ownership
    const { data: classroom, error: classErr } = await supabase
      .from('classrooms')
      .select('id, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classErr) throw classErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return forbidden('Bạn không có quyền quản lý lớp học này');
    }

    // 2. Look up existing profile or auth user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .ilike('email', email)
      .maybeSingle();

    let studentId = existingProfile?.id;

    if (!studentId) {
      // Check auth users via admin API with pagination
      let existingAuthUser = null;
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: userList } = await supabase.auth.admin.listUsers({ page, perPage });
        if (!userList?.users || userList.users.length === 0) break;
        const found = userList.users.find((u) => u.email?.toLowerCase() === email);
        if (found) {
          existingAuthUser = found;
          break;
        }
        if (userList.users.length < perPage) break;
        page++;
      }

      if (existingAuthUser) {
        studentId = existingAuthUser.id;
      } else {
        // Create user in Supabase Auth
        const tempPassword = `LingoPro@${Math.random().toString(36).slice(-8)}!2026`;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: name || email.split('@')[0],
            role: 'student',
          },
        });

        if (createError) {
          if (createError.message?.toLowerCase().includes('already') || createError.message?.toLowerCase().includes('exists')) {
            let recoveryPage = 1;
            while (true) {
              const { data: recoveryList } = await supabase.auth.admin.listUsers({ page: recoveryPage, perPage: 1000 });
              const found = recoveryList?.users?.find((u) => u.email?.toLowerCase() === email);
              if (found) {
                studentId = found.id;
                break;
              }
              if (!recoveryList?.users || recoveryList.users.length < 1000) break;
              recoveryPage++;
            }
          }
          if (!studentId) {
            throw new Error(`Không thể tạo tài khoản cho học sinh: ${createError.message || 'Lỗi không xác định'}`);
          }
        } else if (newUser?.user) {
          studentId = newUser.user.id;
        }
      }
    }

    const now = new Date();
    const finalName = name || existingProfile?.full_name || email.split('@')[0];

    // 3. Upsert only identity/display fields. Enrollment never grants entitlement.
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: studentId,
      email,
      full_name: finalName,
      role: existingProfile?.role === 'teacher' ? 'teacher' : 'student',
    }, { onConflict: 'id' });

    if (profErr) throw profErr;

    // 4. Upsert enrollment into classroom
    const joinedAt = now.toISOString();
    const { error: enrollErr } = await supabase.from('enrollments').upsert({
      student_id: studentId,
      classroom_id: classroomId,
      joined_at: joinedAt,
    }, { onConflict: 'student_id,classroom_id' });

    if (enrollErr) throw enrollErr;

    return NextResponse.json({
      success: true,
      message: `Đã thêm học sinh ${finalName} vào lớp.`,
      student: {
        student_id: studentId,
        student_name: finalName,
        email,
        classroom_id: classroomId,
        joined_at: joinedAt,
        words_reviewed: 0,
        total_words: 0,
        mastered_words: 0,
        vms: 0,
        active_vms: 0,
        lcs: 0,
        avg_quiz_accuracy: 0,
        quizzes_taken: 0,
        communicative_depth: 0,
        cefr_level: 'A1',
      },
    });
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(error, 'Không thể thêm học sinh vào lớp');
  }
}
