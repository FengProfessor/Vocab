/**
 * Re-audit easy P0 keys (≤15): modals-perfect inverted deduction + mixed broken error item.
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

const mcq = (q, opts, answer, fb, case_id) => ({ type: 'mcq', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const TARGETS = ['modals-perfect', 'mixed-conditionals'];

const { data: topics } = await sb.from('grammar_topics').select('id,slug').in('slug', TARGETS);
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,exercises')
  .in(
    'topic_id',
    topics.map((t) => t.id),
  );
const slugBy = Object.fromEntries(topics.map((t) => [t.id, t.slug]));
const report = [];

for (const L of lessons) {
  const slug = slugBy[L.topic_id];
  const changes = [];
  const next = (L.exercises || []).map((e, i) => {
    const q = String(e.q || e.question || '');
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;

    if (slug === 'modals-perfect') {
      // P0: looks fresh → must have slept (not can't have)
      if (/looks fresh/i.test(q) && /slept well/i.test(q)) {
        changes.push(`#${i} fresh → must have (was can't have)`);
        return mcq(
          'He looks fresh — he ___ slept well.',
          ['must have', "can't have", 'should', 'might'],
          'must have',
          'looks fresh → deduction he slept well: must have + V3',
          'must',
        );
      }
    }

    if (slug === 'mixed-conditionals') {
      // P0: "find error" on correct sentence + meta answer
      if (/would have a mansion now/i.test(q) && /is OK if have/i.test(String(ans))) {
        changes.push(`#${i} replace meta error with real mixed error`);
        return err(
          'Find the error: If I had won the lottery, I would have owned a mansion now.',
          [
            'If I had won the lottery, I would own a mansion now.',
            'If I won the lottery, I would have owned a mansion now.',
            'If I had won the lottery, I owned a mansion now.',
          ],
          'If I had won the lottery, I would own a mansion now.',
          'mixed 3→2 present possession: would + V1 (own), not would have + V3',
          'm32',
        );
      }
      // P1 messy stem
      if (/Wait — for PRESENT result/i.test(q)) {
        changes.push(`#${i} clean messy mixed stem`);
        return fill(
          'If I had known about the traffic, I ___ stuck now. (would not be / would not have been)',
          ['would not be', 'would not have been', 'am not'],
          'would not be',
          'mixed 3→2: past condition → present result',
          'm32',
        );
      }
    }

    return e;
  });

  if (!changes.length) {
    report.push({ slug, changes: ['none'], n: next.length });
    continue;
  }

  const { error } = await sb.from('grammar_lessons').update({ exercises: next }).eq('id', L.id);
  if (error) throw error;
  await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  report.push({ slug, changes, n: next.length });
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/hotfix-reaudit-keys.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
