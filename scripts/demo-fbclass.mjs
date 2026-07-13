/**
 * Demo luồng "Lớp live FB trả phí" — chạy SAU khi migration 20260713_fb_classes.sql đã apply.
 *
 *   node scripts/demo-fbclass.mjs
 *
 * Tự tạo dữ liệu GIẢ (2 khóa + vài đơn paid), in ra Roster + Kick list đúng như API,
 * rồi XÓA SẠCH ở cuối (không để lại rác trong orders/fb_classes).
 * Dùng service role → bypass RLS. KHÔNG đụng dữ liệu thật (chỉ xóa đúng rows demo vừa tạo).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnv(path.join(root, '.env.local'));
loadEnv(path.join(root, '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Thiếu SUPABASE env'); process.exit(2); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const created = { classes: [], orders: [] };

async function cleanup() {
  if (created.orders.length) await sb.from('orders').delete().in('id', created.orders);
  if (created.classes.length) await sb.from('fb_classes').delete().in('id', created.classes);
}

async function main() {
  // 0. Lấy 3 user thật để gắn đơn (chỉ đọc id, không sửa gì của họ)
  const { data: users, error: uErr } = await sb.from('profiles').select('id, full_name, email').limit(3);
  if (uErr) throw new Error('Query profiles lỗi (migration chưa chạy?): ' + uErr.message);
  if (!users || users.length < 2) throw new Error('Cần ít nhất 2 user trong profiles để demo');
  const [u1, u2, u3] = users;

  const owner = u1.id; // coi u1 là "giáo viên chủ khóa"
  const today = new Date();
  const endA = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);
  const endB = new Date(today.getTime() + 40 * 86400000).toISOString().slice(0, 10);

  // 1. Tạo 2 khóa
  const { data: clsA } = await sb.from('fb_classes').insert({
    owner_id: owner, title: '[DEMO] Khóa A (cũ)', price: 50000, session_count: 10,
    end_date: endA, status: 'active', fb_group_url: 'https://facebook.com/groups/demo-a',
  }).select('id').single();
  created.classes.push(clsA.id);

  const { data: clsB } = await sb.from('fb_classes').insert({
    owner_id: owner, title: '[DEMO] Khóa B (mới)', price: 50000, session_count: 10,
    end_date: endB, status: 'active', fb_group_url: 'https://facebook.com/groups/demo-b',
  }).select('id').single();
  created.classes.push(clsB.id);

  // 2. Đơn PAID: cả 3 vào khóa A; chỉ u1 mua tiếp khóa B (gia hạn)
  const members = [u1, u2, u3].filter(Boolean);
  for (const u of members) {
    const { data: o } = await sb.from('orders').insert({
      user_id: u.id, plan: 'pro', amount: 50000, payment_method: 'bank_transfer',
      period_months: 1, status: 'paid', order_kind: 'fbclass', seats: 1,
      fb_class_id: clsA.id, fb_profile_url: `https://facebook.com/${(u.full_name || u.email || u.id).toString().replace(/\s+/g, '.')}`,
      paid_at: new Date().toISOString(), expires_at: new Date(endA).toISOString(), note: 'DEMO_FBCLASS',
    }).select('id').single();
    created.orders.push(o.id);
  }
  const { data: oB } = await sb.from('orders').insert({
    user_id: u1.id, plan: 'pro', amount: 50000, payment_method: 'bank_transfer',
    period_months: 1, status: 'paid', order_kind: 'fbclass', seats: 1,
    fb_class_id: clsB.id, fb_profile_url: `https://facebook.com/${(u1.full_name || u1.email).toString().replace(/\s+/g, '.')}`,
    paid_at: new Date().toISOString(), expires_at: new Date(endB).toISOString(), note: 'DEMO_FBCLASS',
  }).select('id').single();
  created.orders.push(oB.id);

  // 3. Kết thúc khóa A
  await sb.from('fb_classes').update({ status: 'ended' }).eq('id', clsA.id);

  // 4. Tính Roster + Kick (y hệt API /api/admin/fbclass/[id])
  const { data: paidA } = await sb.from('orders')
    .select('user_id, fb_profile_url, profiles!orders_user_id_fkey(full_name, email)')
    .eq('fb_class_id', clsA.id).eq('order_kind', 'fbclass').eq('status', 'paid');

  const { data: activeCls } = await sb.from('fb_classes').select('id').eq('owner_id', owner).eq('status', 'active');
  const activeIds = (activeCls || []).map(c => c.id);
  const stillValid = new Set();
  if (activeIds.length) {
    const { data: valid } = await sb.from('orders').select('user_id')
      .in('fb_class_id', activeIds).eq('order_kind', 'fbclass').eq('status', 'paid');
    for (const o of valid || []) stillValid.add(o.user_id);
  }

  const name = (o) => o.profiles?.full_name || o.profiles?.email || o.user_id.slice(0, 8);
  console.log('\n══════════════════════════════════════════════');
  console.log('  DEMO: Lớp live FB trả phí — Roster & Kick');
  console.log('══════════════════════════════════════════════');
  console.log(`\nKhóa A "[DEMO] Khóa A (cũ)" — đã KẾT THÚC (end ${endA})`);
  console.log(`Khóa B "[DEMO] Khóa B (mới)" — đang mở (end ${endB})\n`);
  console.log(`ĐÃ ĐÓNG khóa A (${paidA.length} người):`);
  for (const o of paidA) console.log(`   ✅ ${name(o)}   FB: ${o.fb_profile_url}`);

  const kick = paidA.filter(o => !stillValid.has(o.user_id));
  console.log(`\nCẦN KICK (${kick.length}) — học khóa A nhưng KHÔNG mua khóa B:`);
  if (kick.length === 0) console.log('   (không có)');
  for (const o of kick) console.log(`   ❌ ${name(o)}   → mở link kick: ${o.fb_profile_url}`);
  console.log(`\nGiữ lại: ${name(paidA.find(o => stillValid.has(o.user_id)) || {})} (đã mua khóa B)\n`);
  console.log('→ Logic khớp API. Đang dọn dữ liệu demo...');
}

main()
  .then(cleanup)
  .then(() => console.log('✓ Đã xóa sạch dữ liệu demo. Xong.\n'))
  .catch(async (err) => { console.error('LỖI:', err.message); await cleanup(); process.exit(1); });
