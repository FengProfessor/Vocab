/**
 * Probe live: sample free users with many words — eligible phải = false nếu chưa enroll under.
 * node scripts/probe-pro-milestone-users.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';

// Load env
const env = fs.readFileSync('.env.local', 'utf8');
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const MIN_STREAK = 3;
const MIN_WORDS = 50;
const MAX_WORDS = 120;

function isUnder(words, streak) {
  return words < MIN_WORDS && streak < MIN_STREAK;
}

function evaluate({ streak, words, alreadyClaimed, effectivePlan, enrolled }) {
  const streakMet = streak >= MIN_STREAK;
  const wordsMet = words >= MIN_WORDS && words <= MAX_WORDS;
  const free = effectivePlan === 'free';
  return {
    eligible: free && !!enrolled && streakMet && wordsMet && !alreadyClaimed,
    enrolled: !!enrolled,
    streakMet,
    wordsMet,
  };
}

async function countWords(userId) {
  const [srs, added, cls] = await Promise.all([
    sb.from('srs_progress').select('word_id', { count: 'exact', head: true }).eq('user_id', userId),
    sb.from('words').select('id', { count: 'exact', head: true }).eq('added_by', userId),
    sb.from('classrooms').select('id').eq('teacher_id', userId).eq('name', '__personal__').maybeSingle(),
  ]);
  let personal = 0;
  if (cls.data?.id) {
    const r = await sb.from('words').select('id', { count: 'exact', head: true }).eq('classroom_id', cls.data.id);
    personal = r.count ?? 0;
  }
  return Math.max(srs.count ?? 0, added.count ?? 0, personal);
}

async function hasNewbieClaim(userId) {
  const { data } = await sb
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .in('coupon_code', ['NEWBIE1W', 'NEWBIE2W'])
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function enrolledMeta(userId) {
  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  const v = data.user.user_metadata?.pro_milestone_enrolled_at;
  return typeof v === 'string' && v ? v : null;
}

function effectivePlan(plan, exp) {
  if (!plan || plan === 'free') return 'free';
  if (exp && new Date(exp).getTime() <= Date.now()) return 'free';
  return plan;
}

// Sample free-ish profiles
const { data: profiles, error } = await sb
  .from('profiles')
  .select('id, email, plan, plan_expires_at')
  .order('created_at', { ascending: false })
  .limit(80);

if (error) {
  console.error(error);
  process.exit(1);
}

let checked = 0;
let powerBlocked = 0;
let powerEligibleBug = 0;
let newbieEligible = 0;
let underWouldEnroll = 0;

const rows = [];

for (const p of profiles ?? []) {
  const words = await countWords(p.id);
  if (words < 30) continue; // skip empty-ish
  checked++;

  const { data: gam } = await sb
    .from('user_gamification')
    .select('current_streak')
    .eq('user_id', p.id)
    .maybeSingle();
  const streak = gam?.current_streak ?? 0;
  const plan = effectivePlan(p.plan, p.plan_expires_at);
  const claimed = await hasNewbieClaim(p.id);
  const enrolled = await enrolledMeta(p.id);
  const under = isUnder(words, streak);
  const ev = evaluate({
    streak,
    words,
    alreadyClaimed: claimed,
    effectivePlan: plan,
    enrolled: !!enrolled,
  });

  if (under && plan === 'free' && !claimed) underWouldEnroll++;

  if (words >= 120 && plan === 'free' && !claimed) {
    if (ev.eligible) {
      powerEligibleBug++;
      rows.push({
        email: p.email,
        words,
        streak,
        enrolled: !!enrolled,
        eligible: ev.eligible,
        BUG: true,
      });
    } else {
      powerBlocked++;
    }
  }

  if (ev.eligible) {
    newbieEligible++;
    if (words <= 120) {
      rows.push({
        email: p.email,
        words,
        streak,
        enrolled: !!enrolled,
        eligible: true,
        BUG: false,
      });
    }
  }
}

console.log(JSON.stringify({
  checked,
  powerBlocked_words_ge_120: powerBlocked,
  powerEligibleBUG_should_be_0: powerEligibleBug,
  currentlyEligible_ok_if_enrolled: newbieEligible,
  underWouldEnroll_on_GET: underWouldEnroll,
  sample: rows.slice(0, 15),
}, null, 2));

if (powerEligibleBug > 0) process.exit(2);
console.log('\nProbe OK: no power user with words>=120 is eligible without proper gate.');
