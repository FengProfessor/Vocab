/**
 * scripts/onboard_students_tonight.ts
 *
 * Fast batch onboarding tool for tonight's class:
 * 1. Checks/creates user in Supabase Auth (with email auto-confirmed).
 * 2. Sets profile: role='student', plan='pro', plan_expires_at = 1 year from now.
 * 3. Enrolls student into the target classroom.
 * 4. Inserts into `orders` (status='paid', payment_method='teacher_grant', period_months=12).
 * 5. Logs to `subscription_history`.
 *
 * Usage:
 *   npx tsx scripts/onboard_students_tonight.ts --email student@example.com --name "Nguyen Van A" --classroom <classroomId_or_inviteCode>
 *   npx tsx scripts/onboard_students_tonight.ts --file path/to/students.json --classroom <classroomId_or_inviteCode>
 *   npx tsx scripts/onboard_students_tonight.ts   (runs interactive / default tonight list)
 */

import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface StudentToOnboard {
  email: string;
  name?: string;
}

// Sample / default students list for tonight if not passed via CLI
const TONIGHT_STUDENTS_DEFAULT: StudentToOnboard[] = [
  // Teacher can add quick entries here or supply via CLI / file
  // { email: 'student1@example.com', name: 'Nguyễn Văn A' },
];

async function resolveClassroom(identifier?: string): Promise<{ id: string; name: string } | null> {
  if (identifier) {
    // Try by ID first
    const { data: byId } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('id', identifier)
      .maybeSingle();

    if (byId) return byId;

    // Try by invite code
    const { data: byCode } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('invite_code', identifier.toUpperCase())
      .maybeSingle();

    if (byCode) return byCode;

    // Try by name
    const { data: byName } = await supabase
      .from('classrooms')
      .select('id, name')
      .ilike('name', identifier)
      .maybeSingle();

    if (byName) return byName;
  }

  // Fallback: get first non-personal classroom
  const { data: defaultClass } = await supabase
    .from('classrooms')
    .select('id, name')
    .neq('name', '__personal__')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return defaultClass || null;
}

async function onboardSingleStudent(student: StudentToOnboard, classroom: { id: string; name: string }) {
  const email = student.email.trim().toLowerCase();
  const name = (student.name || email.split('@')[0]).trim();

  console.log(`\n🚀 [Onboarding] Processing ${email} (${name})...`);

  // 1. Check or create auth user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, plan, plan_expires_at')
    .ilike('email', email)
    .maybeSingle();

  let studentId = existingProfile?.id;

  if (!studentId) {
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
      console.log(`   ℹ️ User already in auth.users (${studentId})`);
    } else {
      const tempPassword = `LingoPro@${Math.random().toString(36).slice(-8)}!2026`;
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: name, role: 'student' },
      });

      if (createErr) {
        if (createErr.message?.toLowerCase().includes('already') || createErr.message?.toLowerCase().includes('exists')) {
          let recoveryPage = 1;
          while (true) {
            const { data: recoveryList } = await supabase.auth.admin.listUsers({ page: recoveryPage, perPage: 1000 });
            const found = recoveryList?.users?.find((u) => u.email?.toLowerCase() === email);
            if (found) {
              studentId = found.id;
              console.log(`   ℹ️ User recovered from auth.users (${studentId})`);
              break;
            }
            if (!recoveryList?.users || recoveryList.users.length < 1000) break;
            recoveryPage++;
          }
        }
        if (!studentId) {
          throw new Error(`Failed to create auth user: ${createErr.message}`);
        }
      } else if (newUser?.user) {
        studentId = newUser.user.id;
        console.log(`   ✅ Created auth user (${studentId}) with temp password: ${tempPassword}`);
      }
    }
  } else {
    console.log(`   ℹ️ Found existing profile (${studentId})`);
  }

  const now = new Date();
  let expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  if (existingProfile?.plan_expires_at) {
    const curExp = new Date(existingProfile.plan_expires_at);
    if (curExp > now) {
      expiresAt = new Date(curExp.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
  }

  // 2. Set profile role='student', plan='pro', plan_expires_at = 1 year from now
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: studentId,
    email,
    full_name: name || existingProfile?.full_name || email.split('@')[0],
    role: existingProfile?.role === 'teacher' ? 'teacher' : 'student',
    plan: 'pro',
    plan_expires_at: expiresAt.toISOString(),
  }, { onConflict: 'id' });

  if (profErr) throw new Error(`Profile update failed: ${profErr.message}`);
  console.log(`   ✅ Profile updated to Pro (expires: ${expiresAt.toLocaleDateString('vi-VN')})`);

  // 3. Upsert into enrollments
  const joinedAt = now.toISOString();
  const { error: enrollErr } = await supabase.from('enrollments').upsert({
    student_id: studentId,
    classroom_id: classroom.id,
    joined_at: joinedAt,
  }, { onConflict: 'student_id,classroom_id' });

  if (enrollErr) throw new Error(`Enrollment failed: ${enrollErr.message}`);
  console.log(`   ✅ Enrolled into classroom "${classroom.name}"`);

  // 4. Insert into orders
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
    note: `Tonight Onboarding Grant: ${classroom.name}`,
  };

  const orderRes = await supabase.from('orders').insert(orderPayload).select('id').maybeSingle();
  if (orderRes.error && (orderRes.error.message?.includes('payment_method') || orderRes.error.code === '23514')) {
    orderPayload.payment_method = 'manual';
    orderPayload.note = `teacher_grant: ${classroom.name}`;
    const retryRes = await supabase.from('orders').insert(orderPayload).select('id').maybeSingle();
    orderId = retryRes.data?.id || null;
  } else {
    orderId = orderRes.data?.id || null;
  }
  console.log(`   ✅ Order recorded (id: ${orderId ?? 'created'})`);

  // 5. Insert into subscription_history
  const histPayload = {
    user_id: studentId,
    old_plan: existingProfile?.plan || 'free',
    new_plan: 'pro',
    reason: 'teacher_grant',
    order_id: orderId,
  };
  const histRes = await supabase.from('subscription_history').insert(histPayload);
  if (histRes.error && (histRes.error.message?.includes('reason') || histRes.error.code === '23514')) {
    await supabase.from('subscription_history').insert({
      ...histPayload,
      reason: 'admin_manual',
    });
  }
  console.log(`   ✅ Subscription history recorded`);

  return { studentId, email, name, expiresAt };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     LingoPro — Tonight Student Onboarding Script          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  let emailArg: string | undefined;
  let nameArg: string | undefined;
  let classArg: string | undefined;
  let fileArg: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) emailArg = args[++i];
    else if (args[i] === '--name' && args[i + 1]) nameArg = args[++i];
    else if (args[i] === '--classroom' && args[i + 1]) classArg = args[++i];
    else if (args[i] === '--class' && args[i + 1]) classArg = args[++i];
    else if (args[i] === '--file' && args[i + 1]) fileArg = args[++i];
  }

  const targetClass = await resolveClassroom(classArg);
  if (!targetClass) {
    console.error('❌ Could not find any classroom to enroll students into.');
    console.error('Please create a classroom first or specify --classroom <id|invite_code>');
    process.exit(1);
  }

  console.log(`📍 Target Classroom: "${targetClass.name}" (ID: ${targetClass.id})`);

  let studentsToProcess: StudentToOnboard[] = [];

  if (emailArg) {
    studentsToProcess = [{ email: emailArg, name: nameArg }];
  } else if (fileArg) {
    const raw = fs.readFileSync(path.resolve(fileArg), 'utf-8');
    studentsToProcess = JSON.parse(raw);
  } else if (TONIGHT_STUDENTS_DEFAULT.length > 0) {
    studentsToProcess = TONIGHT_STUDENTS_DEFAULT;
  } else {
    console.log('\n💡 No students specified on CLI.');
    console.log('Example usage:');
    console.log('  npx tsx scripts/onboard_students_tonight.ts --email student@example.com --name "Nguyễn An" --class <id>');
    console.log('  npx tsx scripts/onboard_students_tonight.ts --file ./students.json --class <id>');
    return;
  }

  console.log(`Found ${studentsToProcess.length} student(s) to onboard.`);

  const results = [];
  for (const s of studentsToProcess) {
    try {
      const res = await onboardSingleStudent(s, targetClass);
      results.push(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to onboard ${s.email}: ${msg}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Onboarding complete: ${results.length}/${studentsToProcess.length} students succeeded.`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
