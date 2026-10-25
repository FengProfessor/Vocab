/**
 * Xóa tài khoản test khỏi CRM (auth.users → cascade profiles + related).
 * Chạy: cd web-app && npx tsx scripts/cleanup-test-crm-users.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

/** Chỉ xóa đúng email trong list — không wildcard */
const TARGET_EMAILS = new Set([
  ...Array.from({ length: 10 }, (_, i) => `student.${i}@lingopro.test`),
  'test.mass@example.com',
  'student.x@lingopro.test',
  'student.y@lingopro.test',
  'lan.toeic@lingopro.test',
  'huy.toeic@lingopro.test',
  'vy.toeic@lingopro.test',
]);

async function listAllAuthUsers() {
  const users: { id: string; email?: string }[] = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data.users ?? [];
    users.push(...batch.map((u) => ({ id: u.id, email: u.email ?? undefined })));
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  console.log(`[CleanupCRM] Mục tiêu: ${TARGET_EMAILS.size} email test`);

  // 1) Tìm từ profiles (CRM source of truth cho UI)
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('email', [...TARGET_EMAILS]);
  if (pErr) throw pErr;

  // 2) Bổ sung từ auth (phòng profile orphan / email khác casing)
  const authUsers = await listAllAuthUsers();
  const byEmail = new Map<string, { id: string; email: string; full_name?: string | null; source: string }>();

  for (const p of profiles ?? []) {
    const email = (p.email ?? '').toLowerCase();
    if (TARGET_EMAILS.has(email)) {
      byEmail.set(email, { id: p.id, email, full_name: p.full_name, source: 'profile' });
    }
  }
  for (const u of authUsers) {
    const email = (u.email ?? '').toLowerCase();
    if (!TARGET_EMAILS.has(email)) continue;
    if (!byEmail.has(email)) {
      byEmail.set(email, { id: u.id, email, source: 'auth-only' });
    }
  }

  const found = [...byEmail.values()];
  const missing = [...TARGET_EMAILS].filter((e) => !byEmail.has(e));

  console.log(`[CleanupCRM] Tìm thấy: ${found.length}`);
  for (const u of found) {
    console.log(`  · ${u.full_name ?? '—'} <${u.email}> (${u.id.slice(0, 8)}… / ${u.source})`);
  }
  if (missing.length) {
    console.log(`[CleanupCRM] Không có trong DB (${missing.length}):`);
    for (const e of missing) console.log(`  · ${e}`);
  }

  if (found.length === 0) {
    console.log('[CleanupCRM] Không có gì để xóa.');
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const u of found) {
    // Dọn enrollment/quiz/classroom cá nhân trước nếu cascade lỏng (idempotent)
    await supabase.from('enrollments').delete().eq('student_id', u.id);
    await supabase.from('quiz_results').delete().eq('user_id', u.id);
    await supabase.from('srs_progress').delete().eq('user_id', u.id);
    await supabase.from('grammar_progress').delete().eq('user_id', u.id);
    await supabase.from('orders').delete().eq('user_id', u.id);
    await supabase.from('group_members').delete().eq('user_id', u.id);
    await supabase.from('fcm_tokens').delete().eq('user_id', u.id);
    await supabase.from('extension_tokens').delete().eq('user_id', u.id);

    // FK words.added_by → profiles (không cascade)
    await supabase.from('words').update({ added_by: null }).eq('added_by', u.id);

    // Classroom do user sở hữu (vd __personal__)
    const { data: classes } = await supabase.from('classrooms').select('id').eq('teacher_id', u.id);
    for (const c of classes ?? []) {
      const { data: ws } = await supabase.from('words').select('id').eq('classroom_id', c.id);
      const wids = (ws ?? []).map((w) => w.id);
      if (wids.length) await supabase.from('srs_progress').delete().in('word_id', wids);
      await supabase.from('quiz_results').delete().eq('classroom_id', c.id);
      await supabase.from('enrollments').delete().eq('classroom_id', c.id);
      await supabase.from('words').delete().eq('classroom_id', c.id);
      await supabase.from('classrooms').delete().eq('id', c.id);
    }

    await supabase.from('groups').delete().eq('owner_id', u.id);
    await supabase.from('profiles').delete().eq('id', u.id);
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) {
      fail += 1;
      console.error(`  ✗ ${u.email}: ${error.message}`);
    } else {
      ok += 1;
      console.log(`  ✓ xóa ${u.email}`);
    }
  }

  console.log(`[CleanupCRM] Xong: ${ok} ok, ${fail} fail, ${missing.length} đã không tồn tại`);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
