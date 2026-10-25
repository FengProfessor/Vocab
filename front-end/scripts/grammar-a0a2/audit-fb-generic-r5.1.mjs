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
  // Match patterns like: Đúng là "x" vì "x" or Đúng là "x" vì x.
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

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id,exercises,topic:grammar_topics(slug,title,level)');
  if (error) throw error;

  let totalEx = 0;
  let totalGeneric = 0;

  const bySlugCount = {};
  const samples = [];

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '';
    const level = L.topic?.level || 'beginner';
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];

    for (const e of exercises) {
      totalEx++;
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;
      const ansStr = Array.isArray(ans) ? ans.join(' / ') : String(ans !== undefined ? ans : '');
      const fb = String(e.fb || '').trim();

      if (isGenericFeedback(ansStr, fb)) {
        totalGeneric++;
        bySlugCount[slug] = (bySlugCount[slug] || 0) + 1;
        if (samples.length < 30) {
          samples.push({ slug, level, q: e.q, ans: ansStr, fb });
        }
      }
    }
  }

  const topSlugEntries = Object.entries(bySlugCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const report = {
    totalEx,
    totalGeneric,
    top20Slugs: Object.fromEntries(topSlugEntries),
    samples,
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/r5.1-generic-baseline.json', JSON.stringify(report, null, 2));

  console.log('================ R5.1 GENERIC BASELINE AUDIT ================');
  console.log(`Total Exercises: ${totalEx}`);
  console.log(`Total Generic Feedback: ${totalGeneric}`);
  console.log('Top 20 Slugs with Generic FB:');
  console.log(JSON.stringify(Object.fromEntries(topSlugEntries), null, 2));
  console.log('Saved audit baseline to tmp/r5.1-generic-baseline.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
