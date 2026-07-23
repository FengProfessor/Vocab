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

export const BLACKLIST_PATTERNS = [
  /dạng đúng chuẩn/i,
  /diễn đạt chuẩn xác cấu trúc/i,
  /diễn đạt chuẩn xác cấu trúc và ý nghĩa/i,
  /đáp án này diễn đạt chuẩn/i,
  /vì đây là dạng đúng/i,
  /Sai ở chỗ lỗi từ trong câu/i,
  /^Gợi ý:/i,
];

export function isAnswerRepetition(ansStr, fb) {
  const cleanAns = String(ansStr || '').trim().toLowerCase();
  const cleanFb = String(fb || '').trim().toLowerCase();
  if (!cleanAns || !cleanFb) return false;
  const repMatch = cleanFb.match(/^đúng là ["“']?([^"”']+)["”']? vì ["“']?([^"”']+)["”']?\.?$/i);
  if (repMatch) {
    const part1 = repMatch[1].trim();
    const part2 = repMatch[2].trim();
    if (part1 === part2) return true;
  }
  return false;
}

export function isGenericFeedback(ansStr, fb) {
  const fbStr = String(fb || '').trim();
  if (!fbStr) return true;
  for (const re of BLACKLIST_PATTERNS) {
    if (re.test(fbStr)) return true;
  }
  if (isAnswerRepetition(ansStr, fbStr)) return true;
  return false;
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

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,level)');
  if (error) throw error;

  let totalEx = 0;
  let totalGeneric = 0;
  let p0WrongTfKeys = 0;

  const genericSamples = [];

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '';
    const level = L.topic?.level || 'beginner';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];

    for (const e of exercises) {
      totalEx++;
      const q = String(e.q || '').trim();
      const type = e.type || 'mcq';
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;
      const ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
      const fb = String(e.fb || '').trim();

      if (isGenericFeedback(ansStr, fb)) {
        totalGeneric++;
        if (genericSamples.length < 10) {
          genericSamples.push({ slug, level, q, ans: ansStr, fb });
        }
      }

      const m = q.match(/"([^"]+)"\s+is correct/i);
      if (type === 'tf' && m) {
        const sent = m[1].trim();
        for (const re of FORCE_TRUE) {
          if (re.test(sent) && ans === false) {
            p0WrongTfKeys++;
            break;
          }
        }
      }
    }
  }

  const pass = totalGeneric === 0 && p0WrongTfKeys === 0;

  console.log('================ R5.1 SPECIFIC FEEDBACK GATE ================');
  console.log(`Total Exercises: ${totalEx}`);
  console.log(`total_generic: ${totalGeneric} (must be 0)`);
  console.log(`p0_wrong_tf_keys: ${p0WrongTfKeys} (must be 0)`);
  console.log('============================================================');

  if (genericSamples.length > 0) {
    console.log('Sample generic items remaining:');
    console.log(JSON.stringify(genericSamples, null, 2));
  }

  console.log(pass ? 'STATUS: PASS' : 'STATUS: FAIL');
  process.exitCode = pass ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
