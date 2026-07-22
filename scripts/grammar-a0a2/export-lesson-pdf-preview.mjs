/**
 * Xuất HTML handout 1 bài ngữ pháp (mở trình duyệt → In → Lưu PDF).
 * Usage: node scripts/grammar-a0a2/export-lesson-pdf-preview.mjs [slug]
 * Default slug: countable-uncountable
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'url';

// Inline minimal builder (avoid TS import in plain node) — keep in sync with grammar-lesson-pdf.ts idea
// We'll dynamically import the built logic by duplicating escape via reading after transpile
// Simpler: reimplement thin generator here calling same structure

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

const slug = process.argv[2] || 'countable-uncountable';
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topic, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,title,title_vi,level')
  .eq('slug', slug)
  .maybeSingle();
if (te) throw te;
if (!topic) {
  console.error('Topic not found:', slug);
  process.exit(1);
}

const { data: lesson, error: le } = await sb
  .from('grammar_lessons')
  .select('title,theory_vi,sections,exercises,examples')
  .eq('topic_id', topic.id)
  .maybeSingle();
if (le) throw le;
if (!lesson) {
  console.error('Lesson not found for', slug);
  process.exit(1);
}

// Use tsx-compatible dynamic import of TS lib
const { buildGrammarLessonPdfHtml } = await import('../../src/lib/grammar-lesson-pdf.ts');

const sections = lesson.sections || {};
const html = buildGrammarLessonPdfHtml({
  title: lesson.title || topic.title,
  titleVi: topic.title_vi || topic.title,
  level: topic.level,
  slug: topic.slug,
  definition: sections.definition || (lesson.theory_vi || '').slice(0, 800),
  tips: sections.tips,
  mistakes: sections.mistakes,
  wordbanks: sections.wordbanks,
  exercises: lesson.exercises,
  exerciseCap: 16,
  withAnswers: true,
  siteUrl: 'https://lingopro.online',
});

fs.mkdirSync('tmp', { recursive: true });
const out = path.resolve(`tmp/grammar-pdf-${slug}.html`);
fs.writeFileSync(out, html, 'utf8');
console.log('WROTE', out);
console.log('Open in browser → Print → Save as PDF');
console.log('file:///' + out.replace(/\\/g, '/'));
