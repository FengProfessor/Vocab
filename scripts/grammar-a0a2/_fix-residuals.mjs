/**
 * Residual P0/P1 after full-logic-apply
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
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

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic:grammar_topics(slug)');

  let fixes = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug;
    const ex = Array.isArray(L.exercises) ? L.exercises.map((e) => ({ ...e })) : [];
    let dirty = false;

    for (let i = 0; i < ex.length; i++) {
      const e = ex[i];
      const q = String(e.q || e.question || '');
      const ans = String(e.answer ?? e.correct_answer ?? '');
      const opts = e.opts || e.options || [];

      // 1) ans soft-align when answer is substring of an option
      if (Array.isArray(opts) && opts.length && ans) {
        const exact = opts.some((o) => norm(o) === norm(ans));
        if (!exact) {
          const soft = opts.find(
            (o) => norm(o).includes(norm(ans)) || norm(ans).includes(norm(o))
          );
          if (soft) {
            console.log(`[${slug} #${i + 1}] ANS_ALIGN "${ans.slice(0, 40)}" → "${String(soft).slice(0, 60)}"`);
            ex[i] = { ...e, answer: soft };
            dirty = true;
            fixes++;
          }
        }
      }

      // 2) error stem already correct → invert known futures / drop dup
      if ((e.type === 'error' || /find the error/i.test(q)) && /find the error/i.test(q)) {
        const m = q.match(/find the error\s*:\s*(.+)/i);
        const stem = m ? m[1].trim() : '';
        if (/will have lived here for 10 years by next month/i.test(stem)) {
          // replace with real error form
          ex[i] = {
            type: 'error',
            q: 'Find the error: By next year she will has finished the course.',
            opts: [
              'By next year she will have finished the course.',
              'By next year she will has finished the course.',
              'By next year she will finished the course.',
            ],
            answer: 'By next year she will have finished the course.',
            fb: 'Future perfect: will have + V3 (have, không has).',
            case_id: 'fp_will_have_v3',
          };
          console.log(`[${slug} #${i + 1}] ERROR_INVERT future-perfect good stem`);
          dirty = true;
          fixes++;
        }
      }
    }

    // 3) de-dupe identical full questions (keep first)
    const seen = new Set();
    const deduped = [];
    for (const e of ex) {
      const k = norm(e.q || e.question || '') + '|' + norm(String(e.answer ?? ''));
      if (seen.has(k)) {
        console.log(`[${slug}] DROP_DUP ${String(e.q || '').slice(0, 60)}`);
        dirty = true;
        fixes++;
        continue;
      }
      seen.add(k);
      deduped.push(e);
    }

    if (dirty && APPLY) {
      const { error } = await sb
        .from('grammar_lessons')
        .update({ exercises: deduped })
        .eq('id', L.id);
      if (error) console.error('fail', slug, error.message);
      else console.log('💾', slug, deduped.length);
    } else if (dirty) {
      console.log('· would update', slug);
    }
  }

  console.log('fixes', fixes, 'apply', APPLY);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
