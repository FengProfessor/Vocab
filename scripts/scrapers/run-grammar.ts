/**
 * Orchestrator import nội dung grammar → grammar_topics + grammar_lessons.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/run-grammar.ts --source=pdf --pdf=scripts/scrapers/decks/mai-lan-huong.pdf [--chunk-size=15]
 *   npx tsx scripts/scrapers/run-grammar.ts --source=web
 *   Thêm --images để gắn ảnh minh họa cho mỗi bài học (tốn quota Gemini Vision).
 */
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { importPdf } from './sources/mai-lan-huong-pdf';
import { scrapeGrammarPage } from './sources/grammar-web';
import { resolveWordImage } from '../../src/lib/image-pipeline';
import { GrammarLessonDraft } from './core/grammar-types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

/** Upsert topic theo slug, trả về id. */
async function upsertTopic(supabase: SupabaseClient, draft: GrammarLessonDraft): Promise<string> {
  const { data: existing } = await supabase
    .from('grammar_topics')
    .select('id')
    .eq('slug', draft.topic_slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('grammar_topics')
    .insert({
      slug: draft.topic_slug,
      title: draft.topic_title,
      title_vi: draft.topic_title_vi,
      level: draft.level,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function saveLesson(
  supabase: SupabaseClient,
  draft: GrammarLessonDraft,
  topicId: string,
  withImage: boolean
): Promise<boolean> {
  // Tránh trùng: cùng topic + title
  const { data: dup } = await supabase
    .from('grammar_lessons')
    .select('id')
    .eq('topic_id', topicId)
    .eq('title', draft.title)
    .maybeSingle();
  if (dup) return false;

  let imageUrl: string | null = null;
  let imageSource = 'none';
  let imageConfidence: number | null = null;
  if (withImage) {
    const img = await resolveWordImage({ word: draft.topic_title, definition: draft.title });
    imageUrl = img.url;
    imageSource = img.source;
    imageConfidence = img.confidence;
  }

  const { error } = await supabase.from('grammar_lessons').insert({
    topic_id: topicId,
    title: draft.title,
    theory: draft.theory,
    theory_vi: draft.theory_vi,
    examples: draft.examples,
    source: draft.source,
    source_url: draft.source_url,
    image_url: imageUrl,
    image_source: imageSource,
    image_confidence: imageConfidence,
  });
  if (error) throw error;
  return true;
}

async function persist(
  supabase: SupabaseClient,
  drafts: GrammarLessonDraft[],
  withImage: boolean
): Promise<void> {
  let saved = 0;
  let skipped = 0;
  for (const d of drafts) {
    try {
      const topicId = await upsertTopic(supabase, d);
      const ok = await saveLesson(supabase, d, topicId, withImage);
      if (ok) {
        saved++;
        console.log(`  ✓ ${d.topic_title} / ${d.title}`);
      } else {
        skipped++;
        console.log(`  ~ trùng, bỏ qua: ${d.title}`);
      }
    } catch (e) {
      console.error(`  ✗ ${d.title}:`, (e as Error).message);
    }
  }
  console.log(`\nĐã lưu ${saved} bài học, bỏ qua ${skipped} bài trùng.`);
}

async function main(): Promise<void> {
  const source = getArg('source');
  if (source !== 'pdf' && source !== 'web') {
    console.error('Thiếu/sai --source. Hỗ trợ: pdf | web');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);
  const withImage = hasFlag('images');

  if (source === 'pdf') {
    const pdf = getArg('pdf');
    if (!pdf) {
      console.error('Source pdf cần --pdf=<đường dẫn file>');
      process.exit(1);
    }
    const pdfPath = path.isAbsolute(pdf) ? pdf : path.resolve(process.cwd(), pdf);
    const chunkSize = parseInt(getArg('chunk-size') || '15', 10);
    const drafts = await importPdf(pdfPath, chunkSize);
    console.log(`\nTổng ${drafts.length} bài học trích được từ PDF.`);
    await persist(supabase, drafts, withImage);
  } else {
    const cfgPath = path.resolve(process.cwd(), 'scripts/scrapers/config/grammar-pages.json');
    if (!fs.existsSync(cfgPath)) {
      console.error('Thiếu config:', cfgPath);
      process.exit(1);
    }
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    const pages: string[] = cfg.pages || [];
    for (const url of pages) {
      console.log(`\n[grammar-web] ${url}`);
      try {
        const drafts = await scrapeGrammarPage(url);
        await persist(supabase, drafts, withImage);
      } catch (e) {
        console.error('  ✗ lỗi:', (e as Error).message);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
