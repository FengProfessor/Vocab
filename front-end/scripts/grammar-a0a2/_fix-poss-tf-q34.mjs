/**
 * Fix possessives TF clarity + residual inverted keys.
 * Q34: meta "Mine can be followed by noun" → sentence-style + clear VI fb
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
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

const APPLY = process.argv.includes('--apply');

/** Known correct English snippets that must be TF true when wrapped as "… is correct" */
const MUST_TRUE = [
  /is this your bag/i,
  /this is my (bag|book|jacket|pen)/i,
  /this pen is mine/i,
  /the red pen is mine/i,
  /its tail/i,
  /tom's (bike|car)/i,
  /this is her box/i,
];

/** Known wrong English → TF false */
const MUST_FALSE = [
  /her's/i,
  /it's tail/i,
  /their is a/i,
  /mine (jacket|pen|bag|book|room)/i,
  /yours bag/i,
  /toms (bike|car)/i, // missing '
  /mine pen/i,
];

function fixItem(e, idx) {
  const q = String(e.q || e.question || '');
  const type = e.type;
  if (type !== 'tf') return { e, changed: false, note: null };

  // Q34 meta → sentence style
  if (
    /mine.*followed.*noun|mine pen|can be followed directly by a noun/i.test(q)
  ) {
    const next = {
      ...e,
      type: 'tf',
      q: '"mine pen" is correct.',
      answer: false,
      fb: 'Sai. mine = đại từ sở hữu, đứng một mình — KHÔNG + danh từ. Sai: mine pen. Đúng: my pen / This pen is mine.',
      case_id: e.case_id || 'poss_mine_no_noun',
    };
    return { e: next, changed: true, note: `#${idx + 1} meta→sentence mine pen` };
  }

  // "X is correct" pattern
  const m = q.match(/^["“]?(.+?)["”]?\s+is correct\.?$/i);
  if (m) {
    const inner = m[1].replace(/^["“]|["”]$/g, '').trim();
    if (MUST_TRUE.some((re) => re.test(inner)) && e.answer !== true) {
      return {
        e: {
          ...e,
          answer: true,
          fb: `Đúng. "${inner}" — chuẩn.`,
        },
        changed: true,
        note: `#${idx + 1} force true: ${inner}`,
      };
    }
    if (MUST_FALSE.some((re) => re.test(inner)) && e.answer !== false) {
      return {
        e: {
          ...e,
          answer: false,
          fb: e.fb || `Sai. "${inner}" không chuẩn.`,
        },
        changed: true,
        note: `#${idx + 1} force false: ${inner}`,
      };
    }
  }

  // Weak generic FB on #34-class
  if (
    e.answer === false &&
    /mine/i.test(q) &&
    /không đúng với quy tắc|khẳng định này/i.test(String(e.fb || ''))
  ) {
    return {
      e: {
        ...e,
        fb: 'Sai. mine không + danh từ. Đúng: my + N, hoặc N + is mine.',
      },
      changed: true,
      note: `#${idx + 1} clear fb only`,
    };
  }

  return { e, changed: false, note: null };
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: topic } = await sb
    .from('grammar_topics')
    .select('id, slug')
    .eq('slug', 'possessives')
    .single();
  if (!topic) throw new Error('no topic');

  const { data: lesson } = await sb
    .from('grammar_lessons')
    .select('id, exercises')
    .eq('topic_id', topic.id)
    .single();
  if (!lesson) throw new Error('no lesson');

  const ex = [...(lesson.exercises || [])];
  const notes = [];
  let n = 0;
  for (let i = 0; i < ex.length; i++) {
    const { e, changed, note } = fixItem(ex[i], i);
    if (changed) {
      ex[i] = e;
      n++;
      notes.push(note);
    }
  }

  console.log('changes:', n);
  notes.forEach((x) => console.log(' -', x));
  console.log('\nQ34 after:', JSON.stringify(ex[33], null, 2));

  if (APPLY && n > 0) {
    const { error } = await sb
      .from('grammar_lessons')
      .update({ exercises: ex })
      .eq('id', lesson.id);
    if (error) throw error;
    console.log('APPLIED', lesson.id);
  } else if (!APPLY) {
    console.log('\n(dry-run — pass --apply to write)');
  } else {
    console.log('nothing to apply');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
