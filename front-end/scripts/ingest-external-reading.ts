/**
 * Ingestion Script for External Reading Sources (VOA, RACE, OpenStax)
 * Ensures complete CEFR coverage from A1 to C2 across all 15 themes.
 *
 * Usage:
 *   npx tsx scripts/ingest-external-reading.ts [options]
 *
 * Options:
 *   --dry-run             Parse and summarize without writing to database
 *   --source=<voa|race|openstax|all> Filter which sources to ingest
 *   --file=<path>         Path to external articles JSON file
 *   --enrich              Enrich articles with Gemini (translation, cloze, vocab, mindmap)
 *   --batch-size=<N>      Supabase upsert batch size (default: 50)
 */

import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { ReadingArticle } from '../src/types/reading-library';
import { enrichArticleWithGemini, initGeminiKeys } from '../src/lib/reading-ai-enricher';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const enrichEnabled = args.includes('--enrich');
const sourceFilter = args.find((a) => a.startsWith('--source='))?.split('=')[1] || 'all';
const customFile = args.find((a) => a.startsWith('--file='))?.split('=')[1];
const batchSize = parseInt(args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] || '50', 10);

async function main() {
  console.log('========================================================');
  console.log('   EXTERNAL READING INGESTION (VOA, RACE, OPENSTAX)     ');
  console.log('========================================================\n');

  const filePath = customFile
    ? path.resolve(process.cwd(), customFile)
    : path.resolve(process.cwd(), 'src/data/reading/external-starter-articles.json');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Source file not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let articles: ReadingArticle[] = JSON.parse(raw);

  if (sourceFilter !== 'all') {
    articles = articles.filter((a) => a.source_type === sourceFilter);
  }

  console.log(`Loaded ${articles.length} external articles from ${path.basename(filePath)}.`);

  const levelStats: Record<string, number> = {};
  const themeStats: Record<string, number> = {};
  const sourceStats: Record<string, number> = {};

  for (const a of articles) {
    levelStats[a.cefr_level] = (levelStats[a.cefr_level] || 0) + 1;
    themeStats[a.theme_id] = (themeStats[a.theme_id] || 0) + 1;
    sourceStats[a.source_type] = (sourceStats[a.source_type] || 0) + 1;
  }

  console.log('\n--- EXTERNAL DATASET BREAKDOWN ---');
  console.log('By CEFR Level:', levelStats);
  console.log('By Theme:', themeStats);
  console.log('By Source:', sourceStats);

  // Optional AI Enrichment
  if (enrichEnabled) {
    initGeminiKeys();
    console.log('\n--- RUNNING AI ENRICHMENT ON UNTRANSLATED EXTERNAL ARTICLES ---');
    for (const a of articles) {
      if (!a.translation || !a.cloze?.blanks?.length) {
        console.log(`Enriching "${a.title}" (${a.cefr_level})...`);
        try {
          const res = await enrichArticleWithGemini(a.title, a.passage_plain, a.cefr_level, a.theme_id);
          if (!a.translation) a.translation = res.translation;
          if (!a.summary) a.summary = res.summary;
          if (!a.cloze?.blanks?.length && res.clozeBlanks.length > 0) a.cloze = { blanks: res.clozeBlanks };
          if (!a.vocabulary_highlights?.length && res.vocabularyHighlights.length > 0) {
            a.vocabulary_highlights = res.vocabularyHighlights;
          }
          if (!a.mindmap_data) a.mindmap_data = res.mindmapData;
          console.log(`✓ Enriched "${a.title}"`);
        } catch (err: any) {
          console.warn(`✗ Enrichment failed: ${err.message}`);
        }
      }
    }
  }

  if (dryRun) {
    console.log('\n[DRY RUN] Finished verification without database writes.');
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials in environment.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: testErr } = await supabase.from('reading_articles').select('id').limit(1);
  if (testErr && (testErr.message.includes('Could not find the table') || testErr.message.includes('does not exist'))) {
    console.error('\n❌ Table public.reading_articles does not exist in Supabase schema.');
    console.error('👉 Please apply the migration first:');
    console.log('   npx tsx scripts/apply-reading-library-migration.ts\n');
    process.exit(1);
  }

  console.log(`\n--- UPSERTING ${articles.length} ARTICLES TO SUPABASE ---`);
  let upsertedCount = 0;
  for (let i = 0; i < articles.length; i += batchSize) {
    const chunk = articles.slice(i, i + batchSize);
    const dbPayload = chunk.map((a) => ({
      slug: a.slug,
      title: a.title,
      cefr_level: a.cefr_level,
      theme_id: a.theme_id,
      passage: a.passage,
      passage_plain: a.passage_plain,
      word_count: a.word_count,
      estimated_read_minutes: a.estimated_read_minutes,
      translation: a.translation,
      summary: a.summary,
      cloze: a.cloze || {},
      questions: a.questions || [],
      vocabulary_highlights: a.vocabulary_highlights || [],
      audio_url: a.audio_url || null,
      podcast_meta: a.podcast_meta || {},
      mindmap_data: a.mindmap_data || {},
      source_type: a.source_type,
      source_id: a.source_id,
      source_metadata: a.source_metadata || {},
      status: a.status || 'published',
      difficulty_score: a.difficulty_score || 3.0,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from('reading_articles')
      .upsert(dbPayload, { onConflict: 'slug' });

    if (upsertErr) {
      console.error(`✗ Error upserting batch: ${upsertErr.message}`);
    } else {
      upsertedCount += chunk.length;
    }
  }

  console.log(`\n🎉 Successfully upserted ${upsertedCount} external articles into reading library!`);
}

main().catch((err) => {
  console.error('\n❌ Error during external reading ingestion:', err);
  process.exit(1);
});
