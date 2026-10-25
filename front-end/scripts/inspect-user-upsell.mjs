/**
 * node scripts/inspect-user-upsell.mjs cngoclan94@gmail.com
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env.local');
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

const email = process.argv[2] || 'cngoclan94@gmail.com';
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: p, error: pe } = await sb
  .from('profiles')
  .select('id, email, full_name, plan, plan_expires_at, created_at, role')
  .eq('email', email)
  .maybeSingle();

if (pe || !p) {
  console.log(JSON.stringify({ error: pe?.message || 'not found', email }));
  process.exit(1);
}

const uid = p.id;
const monthStart = new Date(
  Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
).toISOString();

const { count: lifetime } = await sb
  .from('words')
  .select('id', { count: 'exact', head: true })
  .eq('added_by', uid);

const { count: thisMonth } = await sb
  .from('words')
  .select('id', { count: 'exact', head: true })
  .eq('added_by', uid)
  .gte('created_at', monthStart);

const { data: enrolls } = await sb
  .from('classroom_enrollments')
  .select('classroom_id')
  .eq('student_id', uid);
const classIds = (enrolls || []).map((e) => e.classroom_id);

const { count: srsRows } = await sb
  .from('srs_progress')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', uid);

const PAGE = 1000;
let from = 0;
let reviewTotal = 0;
let lapses = 0;
let learned = 0;
let last = null;
for (;;) {
  const { data, error } = await sb
    .from('srs_progress')
    .select('review_count, lapses, last_reviewed_at')
    .eq('user_id', uid)
    .range(from, from + PAGE - 1);
  if (error) throw error;
  for (const r of data || []) {
    const rc = r.review_count || 0;
    reviewTotal += rc;
    lapses += r.lapses || 0;
    if (rc >= 1) learned += 1;
    if (r.last_reviewed_at && (!last || r.last_reviewed_at > last)) last = r.last_reviewed_at;
  }
  if (!data || data.length < PAGE) break;
  from += PAGE;
}

const { count: quizCount } = await sb
  .from('quiz_attempts')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', uid);

console.log(
  JSON.stringify(
    {
      name: p.full_name,
      email: p.email,
      plan: p.plan,
      expires: p.plan_expires_at,
      role: p.role,
      created: p.created_at,
      words: {
        lifetimeAddedBy: lifetime ?? 0,
        thisMonthUtc: thisMonth ?? 0,
        monthStart,
        classroomEnrollments: classIds.length,
      },
      srs: {
        rows: srsRows ?? 0,
        learned,
        reviewTotal,
        lapses,
        lastReview: last,
      },
      quizCount: quizCount ?? 0,
      freeMonthlyLimit: 200,
      overMonthly: (thisMonth ?? 0) > 200,
      overLifetime: (lifetime ?? 0) > 200,
      ENTITLEMENT_ENFORCED: process.env.ENTITLEMENT_ENFORCED === 'true',
    },
    null,
    2,
  ),
);
