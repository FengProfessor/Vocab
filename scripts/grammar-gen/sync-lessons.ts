/**
 * Đồng bộ topic + lesson theo slug mà không đổi lesson ID, vì vậy giữ nguyên grammar_progress.
 *
 * Bắt buộc truyền --only để tránh vô tình ghi đè toàn bộ nội dung production:
 *   npx tsx scripts/grammar-gen/sync-lessons.ts --only verb-to-be,have-got --dry
 *   npx tsx scripts/grammar-gen/sync-lessons.ts --only verb-to-be,have-got --apply
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

type Annotation = { word: string; role: string; start: number; end: number };
type Example = { en?: string; vi?: string; note?: string; annotations?: Annotation[] };
type Exercise = {
  type: 'mcq' | 'fill' | 'tf' | 'error';
  q: string;
  opts?: string[];
  answer: string | string[] | boolean;
  fb?: string;
};
type Sections = {
  definition?: string;
  usage?: { icon?: string; label?: string; en?: string; vi?: string }[];
  formula?: { rows?: Record<string, string>[]; note?: string };
  rules?: { case?: string; rule?: string; example?: string }[];
  signals?: string[];
  examples?: Example[];
  mistakes?: { wrong?: string; right?: string; why?: string }[];
  tips?: string;
  comparison?: string;
  timeline?: { caption?: string; points?: { label?: string; note?: string }[] } | null;
};
type LessonFile = {
  slug: string;
  title: string;
  title_vi: string;
  level: string;
  order: number;
  sections: Sections;
  exercises?: Exercise[];
};

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

function getOnlySlugs(): string[] {
  const index = process.argv.indexOf('--only');
  if (index < 0 || !process.argv[index + 1]) {
    throw new Error('Bắt buộc truyền --only <slug,slug>. Script không cho phép sync toàn bộ.');
  }
  return process.argv[index + 1].split(',').map((slug) => slug.trim()).filter(Boolean);
}

function buildTheory(lesson: LessonFile): string {
  const sections = lesson.sections;
  const parts = [sections.definition ?? ''];

  if (sections.usage?.length) {
    parts.push('## Khi nào dùng');
    parts.push(sections.usage.map((item) =>
      `- ${item.icon ?? ''} **${item.label ?? ''}**: ${item.en ?? ''}${item.vi ? ` — *${item.vi}*` : ''}`,
    ).join('\n'));
  }
  if (sections.formula?.rows?.length) {
    parts.push('## Công thức');
    parts.push(sections.formula.rows.map((row) =>
      Object.entries(row).map(([key, value]) => `**${key}:** ${value}`).join(' · '),
    ).join('\n'));
    if (sections.formula.note) parts.push(`> ${sections.formula.note}`);
  }
  if (sections.mistakes?.length) {
    parts.push('## Lỗi thường gặp');
    parts.push(sections.mistakes.map((item) =>
      `- ❌ ${item.wrong ?? ''} → ✅ **${item.right ?? ''}**${item.why ? ` — ${item.why}` : ''}`,
    ).join('\n'));
  }
  if (sections.tips) parts.push('## Mẹo nhớ', sections.tips);
  if (sections.comparison) parts.push('## So sánh', sections.comparison);
  return parts.filter(Boolean).join('\n\n');
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const slugs = getOnlySlugs();
  const client = createClient(url, key, { auth: { persistSession: false } });
  let inserted = 0;
  let updated = 0;

  for (const slug of slugs) {
    const filePath = path.join(OUT, `${slug}.json`);
    if (!existsSync(filePath)) throw new Error(`Không thấy ${filePath}`);
    const lesson = JSON.parse(readFileSync(filePath, 'utf8')) as LessonFile;
    if (lesson.slug !== slug) throw new Error(`${filePath}: slug không khớp`);

    if (DRY) {
      console.log(`[GrammarSync] dry ${slug}: level=${lesson.level}, order=${lesson.order}, examples=${lesson.sections.examples?.length ?? 0}`);
      continue;
    }

    const { data: topic, error: topicError } = await client.from('grammar_topics').upsert({
      slug: lesson.slug,
      title: lesson.title,
      title_vi: lesson.title_vi,
      level: lesson.level,
      order_index: lesson.order,
    }, { onConflict: 'slug' }).select('id').single();
    if (topicError || !topic) throw new Error(`[GrammarSync] ${slug} topic: ${topicError?.message ?? 'missing id'}`);

    const examples = (lesson.sections.examples ?? [])
      .map((item) => ({
        en: item.en ?? '',
        vi: item.vi ?? '',
        note: item.note ?? '',
        annotations: item.annotations ?? [],
      }))
      .filter((item) => item.en);
    const payload = {
      topic_id: topic.id,
      title: lesson.title_vi,
      theory_vi: buildTheory(lesson),
      examples,
      sections: lesson.sections,
      exercises: lesson.exercises ?? [],
      source: 'ai-golden',
      order_index: lesson.order,
    };
    const { data: existingRows, error: selectError } = await client
      .from('grammar_lessons')
      .select('id')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true });
    if (selectError) throw new Error(`[GrammarSync] ${slug} select lesson: ${selectError.message}`);
    if ((existingRows?.length ?? 0) > 1) {
      throw new Error(`[GrammarSync] ${slug}: có ${existingRows?.length} lessons; từ chối chọn/ghi đè tùy ý`);
    }
    const existing = existingRows?.[0] ?? null;

    if (existing) {
      const { error } = await client.from('grammar_lessons').update(payload).eq('id', existing.id);
      if (error) throw new Error(`[GrammarSync] ${slug} update: ${error.message}`);
      const { error: cacheError } = await client.from('grammar_quiz_cache').delete().eq('lesson_id', existing.id);
      if (cacheError) throw new Error(`[GrammarSync] ${slug} clear quiz cache: ${cacheError.message}`);
      updated++;
      console.log(`[GrammarSync] updated ${slug}`);
    } else {
      const { error } = await client.from('grammar_lessons').insert(payload);
      if (error) throw new Error(`[GrammarSync] ${slug} insert: ${error.message}`);
      inserted++;
      console.log(`[GrammarSync] inserted ${slug}`);
    }
  }

  console.log(`[GrammarSync] done inserted=${inserted} updated=${updated} dry=${DRY ? slugs.length : 0}`);
}

main().catch((error: unknown) => {
  console.error('[GrammarSync] FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
