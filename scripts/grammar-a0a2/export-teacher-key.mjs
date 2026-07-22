/**
 * Export teacher answer key (Markdown) for selected grammar lessons.
 * Usage: node scripts/grammar-a0a2/export-teacher-key.mjs [slug1,slug2,...]
 */
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

const DEFAULT = [
  'articles',
  'present-simple',
  'personal-pronouns',
  'cleft-sentences',
  'conditionals-0-1',
];
const slugs = (process.argv[2] || DEFAULT.join(','))
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

let md = `# LingoPro — Đáp án GV (Teacher key)\n\n`;
md += `Xuất: ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `> Bản dành giáo viên. Học sinh dùng PDF không đáp án / app drill.\n\n`;

for (const slug of slugs) {
  const { data: topic } = await sb
    .from('grammar_topics')
    .select('id,slug,title,title_vi,level')
    .eq('slug', slug)
    .maybeSingle();
  if (!topic) {
    md += `## ${slug}\n\n_Không tìm thấy topic._\n\n`;
    continue;
  }
  const { data: lesson } = await sb
    .from('grammar_lessons')
    .select('exercises,examples')
    .eq('topic_id', topic.id)
    .maybeSingle();
  const ex = lesson?.exercises || [];
  md += `## ${topic.title_vi || topic.title} (\`${slug}\`)\n\n`;
  md += `Level: ${topic.level} · Exercises: ${ex.length} · Examples: ${(lesson?.examples || []).length}\n\n`;
  md += `| # | Type | Question (rút gọn) | Answer | FB |\n|---:|------|-------------------|--------|----|\n`;
  ex.forEach((e, i) => {
    const q = String(e.q || e.question || '')
      .replace(/\|/g, '/')
      .slice(0, 70);
    const a = String(e.answer ?? e.correct_answer ?? '')
      .replace(/\|/g, '/')
      .slice(0, 40);
    const fb = String(e.fb || e.explanation || '')
      .replace(/\|/g, '/')
      .slice(0, 50);
    md += `| ${i + 1} | ${e.type || '?'} | ${q} | ${a} | ${fb} |\n`;
  });
  md += `\n---\n\n`;
}

fs.mkdirSync('tmp', { recursive: true });
const out = path.resolve('tmp/TEACHER-KEY-sample.md');
fs.writeFileSync(out, md, 'utf8');
console.log('WROTE', out);
console.log('slugs', slugs.join(', '));
