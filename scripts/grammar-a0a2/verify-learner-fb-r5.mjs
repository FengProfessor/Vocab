import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

const FORCE_TRUE = [
  /^Tom is happy\.?$/i,
  /^She is a player\.?$/i,
  /^He works here\.?$/i,
  /^Tom was playing football\.?$/i,
  /^They were not watching TV\.?$/i,
  /^I love Tom\.?$/i,
  /^Tom was happy\.?$/i,
];

const VI_REGEX = /[àáạảãâăèéêìíòóôơùúưỳýđ]/i;
const BOILERPLATE_REGEX = /hãy đối chiếu|minh họa cách dùng|^Gợi ý:/i;

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,level)');
  if (error) throw error;

  let beginnerExTotal = 0;
  let allExTotal = 0;
  let beginnerMissingVi = 0;
  let allLevelsMissingVi = 0;
  let beginnerBoilerplate = 0;
  let p0WrongTfKeys = 0;

  const failedItems = [];

  for (const L of lessons || []) {
    const level = L.topic?.level || 'beginner';
    const slug = L.topic?.slug || '';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];

    for (const e of exercises) {
      allExTotal++;
      if (level === 'beginner') beginnerExTotal++;

      const fb = String(e.fb || '').trim();
      const q = String(e.q || '').trim();
      const type = e.type || 'mcq';
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;

      const hasVi = VI_REGEX.test(fb);
      if (!hasVi) {
        allLevelsMissingVi++;
        if (level === 'beginner') beginnerMissingVi++;
        if (failedItems.length < 10) {
          failedItems.push({ slug, level, reason: 'missing_vi', q, fb });
        }
      }

      if (level === 'beginner' && BOILERPLATE_REGEX.test(fb)) {
        beginnerBoilerplate++;
        if (failedItems.length < 10) {
          failedItems.push({ slug, level, reason: 'boilerplate_in_beginner', q, fb });
        }
      }

      // Check TF whitelist
      const m = q.match(/"([^"]+)"\s+is correct/i);
      if (type === 'tf' && m) {
        const sent = m[1].trim();
        for (const re of FORCE_TRUE) {
          if (re.test(sent) && ans === false) {
            p0WrongTfKeys++;
            if (failedItems.length < 10) {
              failedItems.push({ slug, level, reason: 'p0_wrong_tf_key', q, sent, ans });
            }
            break;
          }
        }
      }
    }
  }

  const pass =
    beginnerMissingVi === 0 &&
    allLevelsMissingVi === 0 &&
    beginnerBoilerplate === 0 &&
    p0WrongTfKeys === 0;

  console.log('================ R5 VERIFICATION GATE ================');
  console.log(`Total Exercises: ${allExTotal}`);
  console.log(`Beginner Exercises: ${beginnerExTotal}`);
  console.log(`beginner_missing_vi: ${beginnerMissingVi} (must be 0)`);
  console.log(`all_levels_missing_vi: ${allLevelsMissingVi} (must be 0)`);
  console.log(`beginner_boilerplate: ${beginnerBoilerplate} (must be 0)`);
  console.log(`p0_wrong_tf_keys: ${p0WrongTfKeys} (must be 0)`);
  console.log('======================================================');

  if (failedItems.length > 0) {
    console.log('Sample failed items:');
    console.log(JSON.stringify(failedItems, null, 2));
  }

  console.log(pass ? 'STATUS: PASS' : 'STATUS: FAIL');
  process.exitCode = pass ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
