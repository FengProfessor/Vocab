/**
 * Snapshot CRM gộp cho upsell — không in email.
 * Usage: node scripts/crm-upsell-snapshot.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('NO .env.local');
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const k = m[1].trim();
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NO_KEYS');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const PAGE = 1000;

async function all(table, select, orderCol) {
  const out = [];
  let from = 0;
  for (;;) {
    let q = sb.from(table).select(select).range(from, from + PAGE - 1);
    if (orderCol) q = q.order(orderCol, { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

const profiles = await all(
  'profiles',
  'id, plan, plan_expires_at, role, created_at',
  'created_at',
);

const wordByUser = new Map();
let from = 0;
for (;;) {
  const { data, error } = await sb
    .from('words')
    .select('added_by')
    .range(from, from + PAGE - 1);
  if (error) {
    console.error('WORDS_ERR', error.message);
    break;
  }
  for (const w of data || []) {
    if (!w.added_by) continue;
    wordByUser.set(w.added_by, (wordByUser.get(w.added_by) || 0) + 1);
  }
  if (!data || data.length < PAGE) break;
  from += PAGE;
}

const now = Date.now();
const isFuture = (s) => s && new Date(s).getTime() > now;

const byPlan = { free: 0, pro: 0, premium: 0, other: 0 };
const buckets = {
  b0: 0,
  b1_49: 0,
  b50_99: 0,
  b100_149: 0,
  b150_199: 0,
  b200p: 0,
};
let free150 = 0;
let free200 = 0;
let learners = 0;
const top = [];

for (const p of profiles) {
  const raw = p.plan || 'free';
  const active = raw !== 'free' && isFuture(p.plan_expires_at);
  const eff = active ? raw : 'free';
  if (eff === 'free') byPlan.free += 1;
  else if (eff === 'pro') byPlan.pro += 1;
  else if (eff === 'premium') byPlan.premium += 1;
  else byPlan.other += 1;

  const wc = wordByUser.get(p.id) || 0;
  if (wc > 0) learners += 1;
  if (wc === 0) buckets.b0 += 1;
  else if (wc < 50) buckets.b1_49 += 1;
  else if (wc < 100) buckets.b50_99 += 1;
  else if (wc < 150) buckets.b100_149 += 1;
  else if (wc < 200) buckets.b150_199 += 1;
  else buckets.b200p += 1;

  if (eff === 'free' && wc >= 150 && wc < 200) free150 += 1;
  if (eff === 'free' && wc >= 200) free200 += 1;
  if (wc > 0) {
    top.push({
      wc,
      plan: eff,
      role: p.role,
      created: (p.created_at || '').slice(0, 10),
    });
  }
}
top.sort((a, b) => b.wc - a.wc);

const { count: paidOrders } = await sb
  .from('orders')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'paid');
const paidAmt = await all('orders', 'amount, status', null);
const revenue = paidAmt
  .filter((o) => o.status === 'paid')
  .reduce((s, o) => s + (o.amount || 0), 0);

// Pro sắp hết hạn ≤7 ngày
let expiring7 = 0;
for (const p of profiles) {
  const raw = p.plan || 'free';
  if (raw === 'free' || !p.plan_expires_at) continue;
  const left = Math.ceil((new Date(p.plan_expires_at).getTime() - now) / 86400000);
  if (left > 0 && left <= 7) expiring7 += 1;
}

console.log(
  JSON.stringify(
    {
      totalUsers: profiles.length,
      byPlan,
      paying: byPlan.pro + byPlan.premium,
      learners,
      wordBuckets_allUsers: buckets,
      freeHot_150_199: free150,
      freeHot_200plus: free200,
      proExpiringWithin7d: expiring7,
      paidOrders: paidOrders ?? 0,
      revenueVnd: revenue,
      topWordUsers_noPII: top.slice(0, 15),
    },
    null,
    2,
  ),
);
