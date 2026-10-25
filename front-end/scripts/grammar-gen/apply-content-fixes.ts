/**
 * Áp data/content-fixes.json (agent audit sâu) vào grammar_lessons.sections.
 * Merge có chọn field: definition/examples/mistakes/comparison — chỉ field nào có trong fix.
 * Chạy: npx tsx scripts/grammar-gen/apply-content-fixes.ts --dry | --apply [--file <name>]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

interface Fix {
  problems?: string[];
  definition?: string;
  examples?: { en: string; vi: string }[];
  mistakes?: { wrong: string; right: string; why: string }[];
  comparison?: string;
}

const LOG = '[ContentFix]';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = !process.argv.includes('--apply');
const fileIdx = process.argv.indexOf('--file');
const FILE = fileIdx >= 0 ? process.argv[fileIdx + 1] : 'content-fixes.json';

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const fixes = JSON.parse(readFileSync(path.join(DIR, 'data', FILE), 'utf8')) as Record<string, Fix>;

  let applied = 0;
  for (const [slug, fix] of Object.entries(fixes)) {
    const { data: topic } = await client.from('grammar_topics').select('id').eq('slug', slug).maybeSingle();
    if (!topic) { console.log(`${LOG} ⚠ ${slug}: không có topic`); continue; }
    const { data: lessons } = await client.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id).limit(1);
    const lesson = lessons?.[0];
    if (!lesson) continue;

    const sections = { ...(lesson.sections as Record<string, unknown>) };
    const changed: string[] = [];
    if (fix.definition && fix.definition.length > 30) { sections.definition = fix.definition; changed.push('definition'); }
    if (fix.examples && fix.examples.length >= 6) { sections.examples = fix.examples; changed.push(`examples(${fix.examples.length})`); }
    if (fix.mistakes && fix.mistakes.length >= 4) { sections.mistakes = fix.mistakes; changed.push(`mistakes(${fix.mistakes.length})`); }
    if (fix.comparison && fix.comparison.length > 60) { sections.comparison = fix.comparison; changed.push('comparison'); }
    if (changed.length === 0) { console.log(`${LOG} ⚠ ${slug}: fix rỗng/không đủ chuẩn — bỏ qua`); continue; }

    console.log(`${LOG} ${DRY ? 'dry' : 'apply'} ${slug}: ${changed.join(', ')} | ${(fix.problems ?? []).join(' | ')}`);
    if (!DRY) {
      const { error } = await client.from('grammar_lessons').update({ sections }).eq('id', lesson.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
      const filePath = path.join(OUT, `${slug}.json`);
      if (existsSync(filePath)) {
        const local = JSON.parse(readFileSync(filePath, 'utf8'));
        local.sections = sections;
        writeFileSync(filePath, JSON.stringify(local, null, 2) + '\n', 'utf8');
      }
    }
    applied++;
  }
  console.log(`${LOG} done: ${applied} bài, dry=${DRY}`);
}
main().catch((e: unknown) => { console.error(LOG, 'FATAL:', e instanceof Error ? e.message : e); process.exit(1); });
