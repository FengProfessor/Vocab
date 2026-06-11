/**
 * Cập nhật lộ trình grammar theo CEFR A1-C2 mà không đổi topic/lesson ID.
 * Giữ nguyên grammar_progress; xóa quiz cache khi topic đổi level.
 *
 * Chạy:
 *   npx tsx scripts/grammar-gen/update-roadmap.ts --dry
 *   npx tsx scripts/grammar-gen/update-roadmap.ts --apply
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

type Level = 'beginner' | 'intermediate' | 'advanced';
type RoadmapItem = {
  slug: string;
  title: string;
  title_vi: string;
  level: Level;
  order: number;
};
type Placement = { slug: string; level: Level };

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const ROADMAP_PATH = path.join(DIR, 'roadmap.json');
const DRY = !process.argv.includes('--apply');

const PLACEMENTS: Placement[] = [
  { slug: 'verb-to-be', level: 'beginner' },
  { slug: 'have-got', level: 'beginner' },
  { slug: 'personal-pronouns', level: 'beginner' },
  { slug: 'possessives', level: 'beginner' },
  { slug: 'demonstratives', level: 'beginner' },
  { slug: 'articles', level: 'beginner' },
  { slug: 'plural-nouns', level: 'beginner' },
  { slug: 'adjectives-basic', level: 'beginner' },
  { slug: 'present-simple', level: 'beginner' },
  { slug: 'adverbs-frequency', level: 'beginner' },
  { slug: 'wh-questions', level: 'beginner' },
  { slug: 'there-is-there-are', level: 'beginner' },
  { slug: 'prepositions-place', level: 'beginner' },
  { slug: 'imperatives', level: 'beginner' },
  { slug: 'modals-ability', level: 'beginner' },
  { slug: 'present-continuous', level: 'beginner' },
  { slug: 'countable-uncountable', level: 'beginner' },
  { slug: 'quantifiers', level: 'beginner' },
  { slug: 'comparatives-superlatives', level: 'beginner' },
  { slug: 'prepositions-time', level: 'beginner' },
  { slug: 'past-simple', level: 'beginner' },
  { slug: 'past-continuous', level: 'beginner' },
  { slug: 'future-will', level: 'beginner' },
  { slug: 'be-going-to', level: 'beginner' },
  { slug: 'modals-permission', level: 'beginner' },
  { slug: 'modals-obligation', level: 'beginner' },
  { slug: 'modals-advice', level: 'beginner' },
  { slug: 'present-perfect', level: 'beginner' },
  { slug: 'conditionals-0-1', level: 'beginner' },
  { slug: 'question-tags', level: 'beginner' },
  { slug: 'conjunctions-linking', level: 'intermediate' },
  { slug: 'gerunds-infinitives', level: 'intermediate' },
  { slug: 'used-to', level: 'intermediate' },
  { slug: 'present-perfect-continuous', level: 'intermediate' },
  { slug: 'past-perfect', level: 'intermediate' },
  { slug: 'past-perfect-continuous', level: 'intermediate' },
  { slug: 'future-continuous', level: 'intermediate' },
  { slug: 'modals-deduction', level: 'intermediate' },
  { slug: 'second-conditional', level: 'intermediate' },
  { slug: 'third-conditional', level: 'intermediate' },
  { slug: 'relative-clauses', level: 'intermediate' },
  { slug: 'passive-voice', level: 'intermediate' },
  { slug: 'reported-speech', level: 'intermediate' },
  { slug: 'phrasal-verbs', level: 'intermediate' },
  { slug: 'future-perfect', level: 'intermediate' },
  { slug: 'wish-if-only', level: 'intermediate' },
  { slug: 'mixed-conditionals', level: 'intermediate' },
  { slug: 'modals-perfect', level: 'intermediate' },
  { slug: 'causative', level: 'intermediate' },
  { slug: 'advanced-passive', level: 'intermediate' },
  { slug: 'advanced-relative-clauses', level: 'intermediate' },
  { slug: 'future-in-the-past', level: 'intermediate' },
  { slug: 'participle-clauses', level: 'advanced' },
  { slug: 'discourse-markers', level: 'advanced' },
  { slug: 'inversion', level: 'advanced' },
  { slug: 'cleft-sentences', level: 'advanced' },
  { slug: 'emphasis-structures', level: 'advanced' },
  { slug: 'subjunctive', level: 'advanced' },
  { slug: 'ellipsis-substitution', level: 'advanced' },
  { slug: 'nominalisation', level: 'advanced' },
  { slug: 'hedging-language', level: 'advanced' },
  { slug: 'grammatical-collocations', level: 'advanced' },
];

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const oldRoadmap = JSON.parse(readFileSync(ROADMAP_PATH, 'utf8')) as RoadmapItem[];
  const sourceBySlug = new Map(oldRoadmap.map((item) => [item.slug, {
    slug: item.slug,
    title: item.title,
    title_vi: item.title_vi,
    level: item.level,
    order: item.order,
  }]));
  for (const placement of PLACEMENTS) {
    if (sourceBySlug.has(placement.slug)) continue;
    const filePath = path.join(OUT, `${placement.slug}.json`);
    if (!existsSync(filePath)) throw new Error(`Thiếu roadmap source cho ${placement.slug}`);
    const lesson = JSON.parse(readFileSync(filePath, 'utf8')) as RoadmapItem;
    sourceBySlug.set(placement.slug, {
      slug: lesson.slug,
      title: lesson.title,
      title_vi: lesson.title_vi,
      level: lesson.level,
      order: lesson.order,
    });
  }
  if (sourceBySlug.size !== PLACEMENTS.length) {
    const missing = [...sourceBySlug.keys()].filter((slug) => !PLACEMENTS.some((item) => item.slug === slug));
    throw new Error(`Mapping roadmap không đủ/khớp: source=${sourceBySlug.size}, placement=${PLACEMENTS.length}, dư=${missing.join(',')}`);
  }

  const roadmap = PLACEMENTS.map((placement, index): RoadmapItem => {
    const source = sourceBySlug.get(placement.slug);
    if (!source) throw new Error(`Không thấy ${placement.slug}`);
    return { ...source, level: placement.level, order: index + 1 };
  });
  if (!DRY) writeFileSync(ROADMAP_PATH, JSON.stringify(roadmap, null, 2) + '\n', 'utf8');

  const client = createClient(url, key, { auth: { persistSession: false } });
  let topicsUpdated = 0;
  let lessonsUpdated = 0;
  let cacheDeleted = 0;
  let missingDb = 0;

  for (const item of roadmap) {
    const filePath = path.join(OUT, `${item.slug}.json`);
    const lessonFile = JSON.parse(readFileSync(filePath, 'utf8')) as RoadmapItem;
    lessonFile.level = item.level;
    lessonFile.order = item.order;
    if (!DRY) writeFileSync(filePath, JSON.stringify(lessonFile, null, 2) + '\n', 'utf8');

    const { data: topic, error: topicError } = await client
      .from('grammar_topics')
      .select('id, level, order_index')
      .eq('slug', item.slug)
      .maybeSingle();
    if (topicError) throw new Error(`[GrammarRoadmap] ${item.slug}: ${topicError.message}`);
    if (!topic) {
      missingDb++;
      console.log(`[GrammarRoadmap] ${item.slug}: chưa có trên DB`);
      continue;
    }
    const levelChanged = topic.level !== item.level;
    if (DRY) {
      console.log(`[GrammarRoadmap] dry ${item.slug}: ${topic.level}/${topic.order_index} -> ${item.level}/${item.order}`);
      continue;
    }
    const { error: updateTopicError } = await client
      .from('grammar_topics')
      .update({ level: item.level, order_index: item.order })
      .eq('id', topic.id);
    if (updateTopicError) throw new Error(`[GrammarRoadmap] ${item.slug} topic: ${updateTopicError.message}`);
    topicsUpdated++;

    const { data: lessons, error: lessonError } = await client
      .from('grammar_lessons')
      .update({ order_index: item.order })
      .eq('topic_id', topic.id)
      .select('id');
    if (lessonError) throw new Error(`[GrammarRoadmap] ${item.slug} lessons: ${lessonError.message}`);
    lessonsUpdated += lessons?.length ?? 0;

    if (levelChanged && lessons?.length) {
      const lessonIds = lessons.map((lesson) => lesson.id);
      const { error: cacheError, count } = await client
        .from('grammar_quiz_cache')
        .delete({ count: 'exact' })
        .in('lesson_id', lessonIds);
      if (cacheError) throw new Error(`[GrammarRoadmap] ${item.slug} quiz cache: ${cacheError.message}`);
      cacheDeleted += count ?? 0;
    }
  }

  console.log(
    `[GrammarRoadmap] done topics=${topicsUpdated} lessons=${lessonsUpdated} cache=${cacheDeleted} missingDb=${missingDb} dry=${DRY}`,
  );
  if (missingDb > 0) throw new Error(`[GrammarRoadmap] production thiếu ${missingDb} topic`);
}

main().catch((error: unknown) => {
  console.error('[GrammarRoadmap] FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
