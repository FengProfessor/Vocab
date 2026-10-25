/**
 * Export sections.usage của 62 bài grammar prod ra JSON để review/audit ngoài.
 * Chạy: npx tsx scripts/grammar-gen/export-usage.ts > usage-export.json (hoặc --out <path>)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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
  const { data: topics } = await client.from('grammar_topics').select('id, slug, title_vi').order('order_index');
  const out: { slug: string; title: string; usage: unknown[] }[] = [];
  for (const topic of topics ?? []) {
    const { data: lessons } = await client.from('grammar_lessons').select('sections').eq('topic_id', topic.id).limit(1);
    const usage = ((lessons?.[0]?.sections ?? {}) as { usage?: { label?: string; en?: string }[] }).usage ?? [];
    out.push({ slug: topic.slug, title: topic.title_vi ?? topic.slug, usage: usage.map((u) => ({ label: u.label, en: u.en })) });
  }
  const outIdx = process.argv.indexOf('--out');
  const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : path.join(process.cwd(), 'scripts', 'grammar-gen', 'data', 'usage-export.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[UsageExport] ${out.length} bài → ${outPath}`);
}

main();
