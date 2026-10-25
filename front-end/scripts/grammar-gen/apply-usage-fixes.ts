/**
 * Áp data/usage-fixes.json (agent giáo viên chấm + đề xuất) vào grammar_lessons.sections.usage.
 * Chạy: npx tsx scripts/grammar-gen/apply-usage-fixes.ts --dry | --apply
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

interface UsageItem { icon?: string; label?: string; en?: string; vi?: string }
interface Fix { problems: string[]; usage: UsageItem[] }

const LOG = '[UsageFix]';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = !process.argv.includes('--apply');

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const fixes = JSON.parse(readFileSync(path.join(DIR, 'data', 'usage-fixes.json'), 'utf8')) as Record<string, Fix>;

  let applied = 0;
  for (const [slug, fix] of Object.entries(fixes)) {
    const valid = (fix.usage ?? []).filter((u) => u.label && u.en && u.vi);
    if (valid.length < 3) { console.log(`${LOG} ⚠ ${slug}: đề xuất <3 items — bỏ qua`); continue; }

    const { data: topic } = await client.from('grammar_topics').select('id').eq('slug', slug).maybeSingle();
    if (!topic) { console.log(`${LOG} ⚠ ${slug}: không có topic`); continue; }
    const { data: lessons } = await client.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id).limit(1);
    const lesson = lessons?.[0];
    if (!lesson) continue;

    console.log(`${LOG} ${DRY ? 'dry' : 'apply'} ${slug}: ${fix.problems.join(' | ')}`);
    console.log(`${LOG}   → ${valid.map((u) => u.label).join(' · ')}`);
    if (!DRY) {
      const nextSections = { ...(lesson.sections as object), usage: valid };
      const { error } = await client.from('grammar_lessons').update({ sections: nextSections }).eq('id', lesson.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
      const filePath = path.join(OUT, `${slug}.json`);
      if (existsSync(filePath)) {
        const local = JSON.parse(readFileSync(filePath, 'utf8'));
        local.sections = { ...(local.sections ?? {}), usage: valid };
        writeFileSync(filePath, JSON.stringify(local, null, 2) + '\n', 'utf8');
      }
    }
    applied++;
  }
  console.log(`${LOG} done: ${applied} bài, dry=${DRY}`);
}

main().catch((e: unknown) => { console.error(LOG, 'FATAL:', e instanceof Error ? e.message : e); process.exit(1); });
