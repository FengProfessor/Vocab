/**
 * Gắn opts cho free-fill (không options) → drill UI không vỡ.
 * Ưu tiên extract (a/b) trong đề; fallback [answer] + distractors đơn giản.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

function extractParenChoices(q) {
  // (can/could) · (must/can't) · (already/leave) · (at/in)
  const m = String(q).match(/\(([^)]{1,40})\)/);
  if (!m) return null;
  const inner = m[1];
  if (!/[\/|]/.test(inner) && !/,/.test(inner)) return null;
  const parts = inner
    .split(/[\/|,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 30 && !/^[a-z]+\.[a-z]+$/i.test(s));
  // skip pure verb base like (work) single
  if (parts.length < 2) return null;
  return parts;
}

function distractorsFor(answer) {
  const a = String(answer).trim();
  const low = a.toLowerCase();
  const pool = {
    is: ['are', 'was', 'be'],
    are: ['is', 'were', 'be'],
    was: ['were', 'is', 'had'],
    were: ['was', 'are', 'had'],
    has: ['have', 'had', 'is'],
    have: ['has', 'had', 'having'],
    had: ['has', 'have', 'was'],
    can: ['could', 'must', "can't"],
    could: ['can', 'would', 'might'],
    must: ['might', "can't", 'should'],
    might: ['must', 'may', 'could'],
    should: ['must', 'would', 'shall'],
    will: ['would', 'shall', 'can'],
    would: ['will', 'could', 'should'],
    do: ['does', 'did', 'done'],
    does: ['do', 'did', 'done'],
    did: ['do', 'does', 'done'],
    to: ['for', 'of', 'ing'],
    at: ['in', 'on', 'to'],
    in: ['at', 'on', 'of'],
    on: ['in', 'at', 'for'],
    of: ['for', 'to', 'in'],
    for: ['of', 'to', 'from'],
  };
  // multi-word answers
  if (low.includes(' ')) {
    return [a]; // only self — still need 2 opts; add slight variants later
  }
  const d = pool[low] || [];
  return d;
}

function buildOpts(answer, q) {
  const ans = String(answer).trim();
  const fromParen = extractParenChoices(q);
  let opts = [];
  if (fromParen) {
    opts = [...fromParen];
    // ensure answer (or first word of answer) is in list
    const ansLow = ans.toLowerCase();
    const hit = opts.some((o) => o.toLowerCase() === ansLow || ansLow.includes(o.toLowerCase()));
    if (!hit) {
      // answer might be "could" while paren is "can/could" — ok if substring
      const hit2 = opts.some((o) => ansLow === o.toLowerCase());
      if (!hit2) opts.unshift(ans);
    }
  } else {
    opts = [ans, ...distractorsFor(ans)];
  }
  // unique keep order
  const seen = new Set();
  opts = opts.filter((o) => {
    const k = o.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  // need ≥2
  if (opts.length < 2) {
    // last resort dummy wrong (clearly wrong so not confusing if never selected as key)
    if (ans.toLowerCase() !== '—') opts.push('—');
    else opts.push('???');
  }
  // put correct first or keep natural order from paren
  return opts.slice(0, 4);
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: lessons, error } = await sb.from('grammar_lessons').select('id,title,exercises,topic_id');
if (error) throw error;

const { data: topics } = await sb.from('grammar_topics').select('id,slug');
const slugBy = Object.fromEntries((topics || []).map((t) => [t.id, t.slug]));

let fixed = 0;
let lessonsTouched = 0;
const log = [];

for (const L of lessons || []) {
  const exs = Array.isArray(L.exercises) ? L.exercises : [];
  let changed = false;
  const next = exs.map((e, i) => {
    if (!e || typeof e !== 'object') return e;
    const type = e.type || 'mcq';
    const opts = e.opts || e.options || [];
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;
    const q = e.q || e.question || '';
    if (
      (type === 'fill' || type === 'fill_blank') &&
      (!Array.isArray(opts) || opts.length < 2) &&
      ans !== undefined &&
      ans !== null &&
      String(ans).trim()
    ) {
      const newOpts = buildOpts(ans, q);
      // ensure answer matches one option (soft)
      const a = String(ans).trim();
      const soft = newOpts.find((o) => o.toLowerCase() === a.toLowerCase());
      const finalAns = soft || a;
      if (!newOpts.map((o) => o.toLowerCase()).includes(finalAns.toLowerCase())) {
        newOpts.unshift(finalAns);
      }
      fixed++;
      changed = true;
      log.push({
        slug: slugBy[L.topic_id],
        i,
        q: String(q).slice(0, 60),
        ans: finalAns,
        opts: newOpts,
      });
      return { ...e, opts: newOpts, options: newOpts, answer: finalAns };
    }
    return e;
  });

  if (changed) {
    lessonsTouched++;
    const { error: ue } = await sb
      .from('grammar_lessons')
      .update({ exercises: next })
      .eq('id', L.id);
    if (ue) throw ue;
    await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  }
}

const report = { fixed, lessonsTouched, log };
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/fix-free-fill-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ fixed, lessonsTouched, sample: log.slice(0, 15) }, null, 2));
