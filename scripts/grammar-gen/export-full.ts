/**
 * Export TOÀN BỘ sections (definition/formula/rules/examples/mistakes/comparison/tips)
 * của 62 bài grammar prod ra JSON để agent audit sâu.
 * Chạy: npx tsx scripts/grammar-gen/export-full.ts
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

async function main(): Promise<void> {
  loadEnv();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: topics } = await client.from('grammar_topics').select('id, slug, title_vi, level, order_index').order('order_index');
  const out: unknown[] = [];
  for (const t of topics ?? []) {
    const { data: lessons } = await client.from('grammar_lessons').select('sections').eq('topic_id', t.id).limit(1);
    const s = (lessons?.[0]?.sections ?? {}) as Record<string, unknown>;
    // Nén: chỉ giữ trường cần soi
    const definition = s.definition as string | undefined;
    const examples = (s.examples as { en?: string; vi?: string }[] | undefined)?.map((e) => ({ en: e.en, vi: e.vi }));
    const mistakes = s.mistakes as { wrong?: string; right?: string; why?: string }[] | undefined;
    const comparison = s.comparison as string | undefined;
    out.push({ slug: t.slug, level: t.level, title: t.title_vi, definition, examples, mistakes, comparison });
  }
  const outPath = path.join(process.cwd(), 'scripts', 'grammar-gen', 'data', 'full-export.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[FullExport] ${out.length} bài → ${outPath}`);
}
main();
