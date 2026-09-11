import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
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
      .select('id, name, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classErr) throw classErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return forbidden('Bạn không có quyền quản lý lớp học này');
    }

    // 2. Look up existing profile or auth user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, plan, plan_expires_at')
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
    // Extend or set 1 year Pro
    let expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (existingProfile?.plan_expires_at) {
      const curExp = new Date(existingProfile.plan_expires_at);
      if (curExp > now) {
        expiresAt = new Date(curExp.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
    }

    const finalName = name || existingProfile?.full_name || email.split('@')[0];

    // 3. Upsert profile with role=student and plan=pro
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: studentId,
      email,
      full_name: finalName,
      role: existingProfile?.role === 'teacher' ? 'teacher' : 'student',
      plan: 'pro',
      plan_expires_at: expiresAt.toISOString(),
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

    // 5. Insert into orders (status='paid', period_months=12)
    let orderId: string | null = null;
    const orderPayload = {
      user_id: studentId,
      plan: 'pro',
      amount: 0,
      payment_method: 'teacher_grant',
      status: 'paid',
      period_months: 12,
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      paid_at: now.toISOString(),
      note: `Teacher grant: ${classroom.name} (by teacher ${auth.userId})`,
    };

    const orderRes = await supabase.from('orders').insert(orderPayload).select('id').maybeSingle();
    if (orderRes.error && (orderRes.error.message?.includes('payment_method') || orderRes.error.code === '23514')) {
      // Fallback if check constraint only allows manual
      orderPayload.payment_method = 'manual';
      orderPayload.note = `teacher_grant: ${classroom.name} (by teacher ${auth.userId})`;
      const retryRes = await supabase.from('orders').insert(orderPayload).select('id').maybeSingle();
      orderId = retryRes.data?.id || null;
    } else {
      orderId = orderRes.data?.id || null;
    }

    // 6. Insert into subscription_history
    const historyPayload = {
      user_id: studentId,
      old_plan: existingProfile?.plan || 'free',
      new_plan: 'pro',
      reason: 'teacher_grant',
      order_id: orderId,
      changed_by: auth.userId,
    };
    const histRes = await supabase.from('subscription_history').insert(historyPayload);
    if (histRes.error && (histRes.error.message?.includes('reason') || histRes.error.code === '23514')) {
      await supabase.from('subscription_history').insert({
        ...historyPayload,
        reason: 'admin_manual',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã thêm học sinh ${finalName} vào lớp và kích hoạt 1 năm Pro!`,
      student: {
        student_id: studentId,
        student_name: finalName,
        email,
        classroom_id: classroomId,
        plan: 'pro',
        plan_expires_at: expiresAt.toISOString(),
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
    return safeErrorResponse(error, 'Không thể thêm học sinh vào lớp');
  }
}
