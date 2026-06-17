/**
 * seed_toeic_demo.ts — Tạo dữ liệu DEMO lớp TOEIC để show khi đi pitch.
 *
 * Tạo: 1 GV demo + lớp "TOEIC Demo" + 15 từ TOEIC + 3 học sinh khớp video:
 *   - Lan  → ĐỀU ĐẶN  (RisingStar: lcs>80, accuracy ~92%, nhiều từ đã "mastered")
 *   - Huy  → LƯỜI     (Dormant + struggling: last_active > 3 ngày, accuracy ~54%, nhiều từ quá hạn)
 *   - Vy   → NHỒI NHÉT (Cramming: lcs<30, accuracy ~85%, học dồn 1-2 ngày)
 *
 * Công thức badge khớp view `student_progress` (20260421_analytics_view.sql) + teacher/page.tsx:
 *   vms = mastered(stability>15)/total ; lcs = active_days_14/14 ; dormant = last_active>3d ;
 *   cramming = lcs<30 && acc>0.8 && quizzes>2 ; risingStar = lcs>80 && acc>0.8.
 *
 * Chạy:   cd web-app && npx tsx scripts/seed_toeic_demo.ts
 * Dọn:    cd web-app && npx tsx scripts/seed_toeic_demo.ts --clean
 *
 * GHI VÀO SUPABASE PRODUCTION (service key). Cô lập trong lớp "TOEIC Demo" + email *.lingopro.test.
 * Dọn sạch sau buổi demo bằng --clean.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !serviceKey) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const CLASS_NAME = 'TOEIC Demo';
const TEACHER = { email: 'demo.teacher@lingopro.test', password: 'Demo@1234', name: 'GV Demo (TOEIC)' };
const STUDENTS = [
  { key: 'lan', email: 'lan.toeic@lingopro.test', name: 'Lan' },
  { key: 'huy', email: 'huy.toeic@lingopro.test', name: 'Huy' },
  { key: 'vy', email: 'vy.toeic@lingopro.test', name: 'Vy' },
];

/** 15 từ TOEIC / business English */
const WORDS = [
  { word: 'invoice', translation: 'hóa đơn', pos: 'noun', ipa: '/ˈɪn.vɔɪs/', example: 'Please send the invoice by Friday.' },
  { word: 'deadline', translation: 'hạn chót', pos: 'noun', ipa: '/ˈded.laɪn/', example: 'We must meet the project deadline.' },
  { word: 'negotiate', translation: 'đàm phán', pos: 'verb', ipa: '/nɪˈɡoʊ.ʃi.eɪt/', example: 'They are negotiating a new contract.' },
  { word: 'schedule', translation: 'lịch trình', pos: 'noun', ipa: '/ˈskedʒ.uːl/', example: 'The meeting is on the schedule.' },
  { word: 'colleague', translation: 'đồng nghiệp', pos: 'noun', ipa: '/ˈkɑː.liːɡ/', example: 'My colleague will cover the shift.' },
  { word: 'refund', translation: 'hoàn tiền', pos: 'noun', ipa: '/ˈriː.fʌnd/', example: 'You can request a full refund.' },
  { word: 'warehouse', translation: 'nhà kho', pos: 'noun', ipa: '/ˈwer.haʊs/', example: 'The goods are in the warehouse.' },
  { word: 'shipment', translation: 'lô hàng', pos: 'noun', ipa: '/ˈʃɪp.mənt/', example: 'The shipment arrives next week.' },
  { word: 'contract', translation: 'hợp đồng', pos: 'noun', ipa: '/ˈkɑːn.trækt/', example: 'Both parties signed the contract.' },
  { word: 'agenda', translation: 'chương trình nghị sự', pos: 'noun', ipa: '/əˈdʒen.də/', example: 'The first item on the agenda is sales.' },
  { word: 'reimburse', translation: 'bồi hoàn', pos: 'verb', ipa: '/ˌriː.ɪmˈbɜːs/', example: 'The company will reimburse travel costs.' },
  { word: 'vacancy', translation: 'vị trí trống', pos: 'noun', ipa: '/ˈveɪ.kən.si/', example: 'There is a vacancy in the sales team.' },
  { word: 'merchandise', translation: 'hàng hóa', pos: 'noun', ipa: '/ˈmɜːr.tʃən.daɪz/', example: 'The store displays new merchandise.' },
  { word: 'itinerary', translation: 'lịch trình chuyến đi', pos: 'noun', ipa: '/aɪˈtɪn.ə.rer.i/', example: 'Here is the itinerary for your trip.' },
  { word: 'subsidiary', translation: 'công ty con', pos: 'noun', ipa: '/səbˈsɪd.i.er.i/', example: 'The firm opened a subsidiary abroad.' },
];

const now = Date.now();
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (n: number) => iso(now - n * DAY);
const daysAhead = (n: number) => iso(now + n * DAY);

/** Lấy user theo email (tạo nếu chưa có). */
async function ensureUser(email: string, password: string, fullName: string, role: 'teacher' | 'student') {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  let user = created.data?.user ?? null;
  if (!user) {
    // Đã tồn tại → tìm qua listUsers
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    user = list.data.users.find((u) => u.email === email) ?? null;
  }
  if (!user) throw new Error(`Không tạo/tìm được user ${email}`);
  await supabase.from('profiles').upsert({ id: user.id, email, full_name: fullName, role });
  return user.id;
}

/** Tạo srs_progress cho 1 học sinh theo "kiểu học". */
function buildSrsRows(userId: string, wordIds: string[], kind: 'regular' | 'lazy' | 'cram') {
  return wordIds.map((wordId, i) => {
    if (kind === 'regular') {
      // Đều đặn: ôn rải nhiều ngày, stability cao (mastered), không quá hạn
      return {
        user_id: userId, word_id: wordId, ease_factor: 2.6,
        stability: 22 + (i % 5) * 4, difficulty: 4.5, interval_days: 14, review_count: 8 + (i % 4),
        lapses: 0, state: 2,
        last_reviewed_at: daysAgo(i % 13), next_review_date: daysAhead(7 + (i % 6)),
      };
    }
    if (kind === 'lazy') {
      // Lười: ôn dồn ~7 ngày trước rồi nghỉ, stability thấp, nhiều từ quá hạn
      return {
        user_id: userId, word_id: wordId, ease_factor: 2.0,
        stability: 2 + (i % 4), difficulty: 7.5, interval_days: 2, review_count: 1 + (i % 2),
        lapses: 2 + (i % 3), state: 3,
        last_reviewed_at: daysAgo(6 + (i % 3)), next_review_date: daysAgo(1 + (i % 3)),
      };
    }
    // Cram (nhồi nhét): ôn dồn 1-2 ngày gần đây, stability thấp-trung, sắp tới hạn
    return {
      user_id: userId, word_id: wordId, ease_factor: 2.3,
      stability: 5 + (i % 4), difficulty: 6.5, interval_days: 3, review_count: 4 + (i % 3),
      lapses: 1, state: 2,
      last_reviewed_at: daysAgo(i % 2), next_review_date: daysAhead(1 + (i % 2)),
    };
  });
}

function buildQuizzes(userId: string, classroomId: string, accuracy: number, count: number) {
  // `accuracy` là cột GENERATED (= score/total_questions) → KHÔNG insert, chỉ set score/total.
  // Dùng total=20 cho mịn: Vy 0.85 (>0.8 strict cho badge cramming), Lan 0.9, Huy 0.55.
  const total = 20;
  const score = Math.round(accuracy * total);
  return Array.from({ length: count }, (_, i) => ({
    user_id: userId, classroom_id: classroomId, quiz_type: 'vocabulary',
    score, total_questions: total,
    completed_at: daysAgo(i * 2 + 1),
  }));
}

async function seed() {
  console.log('🚀 Seeding lớp TOEIC Demo...');
  const teacherId = await ensureUser(TEACHER.email, TEACHER.password, TEACHER.name, 'teacher');
  console.log('✅ GV demo:', TEACHER.email, '/', TEACHER.password);

  // Lớp (tìm theo name+teacher, tạo nếu chưa có)
  let { data: cls } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', teacherId)
    .eq('name', CLASS_NAME)
    .maybeSingle();
  if (!cls) {
    const invite = 'TOEIC' + Math.floor(100 + Math.random() * 900);
    const ins = await supabase
      .from('classrooms')
      .insert({ teacher_id: teacherId, name: CLASS_NAME, description: 'Lớp demo TOEIC để giới thiệu LingoPro', invite_code: invite })
      .select('id')
      .single();
    if (ins.error) throw ins.error;
    cls = ins.data;
  }
  const classroomId = cls!.id;
  console.log('✅ Lớp:', CLASS_NAME, classroomId);

  // Từ vựng — xóa cũ rồi chèn lại để idempotent
  await supabase.from('words').delete().eq('classroom_id', classroomId);
  const wordRows = WORDS.map((w) => ({ ...w, classroom_id: classroomId }));
  const wins = await supabase.from('words').insert(wordRows).select('id');
  if (wins.error) throw wins.error;
  const wordIds = wins.data.map((w) => w.id);
  console.log(`✅ ${wordIds.length} từ TOEIC`);

  // Học sinh + tiến độ
  const kindMap: Record<string, 'regular' | 'lazy' | 'cram'> = { lan: 'regular', huy: 'lazy', vy: 'cram' };
  const accMap: Record<string, number> = { lan: 0.92, huy: 0.54, vy: 0.85 };
  const quizCountMap: Record<string, number> = { lan: 4, huy: 3, vy: 4 };

  for (const st of STUDENTS) {
    const sid = await ensureUser(st.email, 'Demo@1234', st.name, 'student');
    await supabase.from('enrollments').upsert({ student_id: sid, classroom_id: classroomId });
    // reset tiến độ cũ
    await supabase.from('srs_progress').delete().eq('user_id', sid).in('word_id', wordIds);
    await supabase.from('quiz_results').delete().eq('user_id', sid).eq('classroom_id', classroomId);

    const srs = buildSrsRows(sid, wordIds, kindMap[st.key]);
    const sErr = (await supabase.from('srs_progress').insert(srs)).error;
    if (sErr) console.warn(`⚠️ srs_progress ${st.name}:`, sErr.message);
    const qErr = (await supabase.from('quiz_results').insert(buildQuizzes(sid, classroomId, accMap[st.key], quizCountMap[st.key]))).error;
    if (qErr) console.warn(`⚠️ quiz_results ${st.name}:`, qErr.message);
    console.log(`✅ HS ${st.name} (${kindMap[st.key]}) — acc ${Math.round(accMap[st.key] * 100)}%`);
  }

  console.log('\n🌟 XONG. Đăng nhập GV để show:');
  console.log(`   ${TEACHER.email}  /  ${TEACHER.password}`);
  console.log('   → /teacher → tab Học sinh: Lan (đều đặn) · Huy (lười/dormant) · Vy (nhồi nhét/cramming)');
}

async function clean() {
  console.log('🧹 Dọn dữ liệu demo...');
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const teacher = list.data.users.find((u) => u.email === TEACHER.email);
  if (teacher) {
    const { data: classes } = await supabase.from('classrooms').select('id').eq('teacher_id', teacher.id);
    for (const c of classes ?? []) {
      const { data: ws } = await supabase.from('words').select('id').eq('classroom_id', c.id);
      const wids = (ws ?? []).map((w) => w.id);
      if (wids.length) await supabase.from('srs_progress').delete().in('word_id', wids);
      await supabase.from('quiz_results').delete().eq('classroom_id', c.id);
      await supabase.from('enrollments').delete().eq('classroom_id', c.id);
      await supabase.from('words').delete().eq('classroom_id', c.id);
      await supabase.from('classrooms').delete().eq('id', c.id);
    }
  }
  for (const email of [TEACHER.email, ...STUDENTS.map((s) => s.email)]) {
    const u = list.data.users.find((x) => x.email === email);
    if (u) {
      await supabase.from('profiles').delete().eq('id', u.id);
      await supabase.auth.admin.deleteUser(u.id);
      console.log('  - xóa', email);
    }
  }
  console.log('✅ Đã dọn sạch demo.');
}

(process.argv.includes('--clean') ? clean() : seed()).catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
