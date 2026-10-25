/**
 * Ingestion Script for Internal Reading Datasets (VSTEP + TOEIC)
 *
 * Usage:
 *   npx tsx scripts/ingest-reading-articles.ts [options]
 *
 * Options:
 *   --dry-run             Parse and summarize without writing to database
 *   --source=<vstep|toeic|all> Filter which sources to ingest (default: all)
 *   --limit=<N>           Limit total number of articles to process
 *   --enrich              Enrich articles with Gemini (translation, cloze, vocab, mindmap)
 *   --enrich-limit=<N>    Maximum articles to enrich with Gemini (default: 3)
 *   --nlm                 Test NotebookLM CLI artifacts on sample articles
 *   --batch-size=<N>      Supabase upsert batch size (default: 50)
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseVstepArticles, parseToeicArticles } from '../src/lib/reading-article-parser';
import {
  enrichArticleWithGemini,
  checkNlmCliStatus,
  generateNlmArtifacts,
  initGeminiKeys,
} from '../src/lib/reading-ai-enricher';
import type { ReadingArticle } from '../src/types/reading-library';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const enrichEnabled = args.includes('--enrich');
const nlmEnabled = args.includes('--nlm');

const sourceArg = args.find((a) => a.startsWith('--source='))?.split('=')[1] || 'all';
const limitArg = parseInt(
  args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0',
  10
);
const enrichLimitArg = parseInt(
  args.find((a) => a.startsWith('--enrich-limit='))?.split('=')[1] || '3',
  10
);
const batchSizeArg = parseInt(
  args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] || '50',
  10
);

async function main() {
  console.log('====================================================');
  console.log('   LINGOPRO READING LIBRARY INGESTION PIPELINE      ');
  console.log('====================================================\n');

  console.log(`Configuration:`);
  console.log(`- Mode:         ${dryRun ? '🔍 DRY RUN (no DB writes)' : '🚀 LIVE DB UPSERT'}`);
  console.log(`- Source:       ${sourceArg}`);
  console.log(`- Limit:        ${limitArg > 0 ? limitArg : 'All'}`);
  console.log(`- Enrich AI:    ${enrichEnabled ? `Yes (limit: ${enrichLimitArg})` : 'No'}`);
  console.log(`- NLM Podcast:  ${nlmEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`- Batch Size:   ${batchSizeArg}\n`);

  initGeminiKeys();

  // 1. Parse Articles
  let allArticles: ReadingArticle[] = [];

  if (sourceArg === 'all' || sourceArg === 'vstep') {
    console.log('Reading VSTEP practice & exam materials...');
    const vstepArticles = parseVstepArticles();
    console.log(`✓ Parsed ${vstepArticles.length} VSTEP reading articles.`);
    allArticles.push(...vstepArticles);
  }

  if (sourceArg === 'all' || sourceArg === 'toeic') {
    console.log('Reading TOEIC reading materials...');
    const toeicArticles = parseToeicArticles();
    console.log(`✓ Parsed ${toeicArticles.length} TOEIC reading articles (Part 6 & Part 7).`);
    allArticles.push(...toeicArticles);
  }

  if (limitArg > 0 && allArticles.length > limitArg) {
    allArticles = allArticles.slice(0, limitArg);
    console.log(`Applied limit: Processing first ${allArticles.length} articles.`);
  }

  // 2. Summary stats
  const levelCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};

  for (const art of allArticles) {
    levelCounts[art.cefr_level] = (levelCounts[art.cefr_level] || 0) + 1;
    themeCounts[art.theme_id] = (themeCounts[art.theme_id] || 0) + 1;
    sourceCounts[art.source_type] = (sourceCounts[art.source_type] || 0) + 1;
  }

  console.log('\n--- DATASET BREAKDOWN ---');
  console.log('By CEFR Level:', levelCounts);
  console.log('By Theme:', themeCounts);
  console.log('By Source:', sourceCounts);
  console.log(`Total Articles to ingest: ${allArticles.length}\n`);

  // 3. Optional Gemini AI Enrichment for sample articles
  if (enrichEnabled && allArticles.length > 0) {
    console.log(`--- RUNNING GEMINI AI ENRICHMENT (up to ${enrichLimitArg} articles) ---`);
    let enrichedCount = 0;
    for (const art of allArticles) {
      if (enrichedCount >= enrichLimitArg) break;

      console.log(`\nEnriching [${art.source_type.toUpperCase()}] "${art.title}" (${art.cefr_level})...`);
      try {
        const enriched = await enrichArticleWithGemini(
          art.title,
          art.passage_plain,
          art.cefr_level,
          art.theme_id,
          { hasCloze: art.cloze.blanks.length > 0 }
        );

        art.translation = enriched.translation;
        art.summary = enriched.summary;
        if (art.cloze.blanks.length === 0 && enriched.clozeBlanks.length > 0) {
          art.cloze = { blanks: enriched.clozeBlanks };
        }
        art.vocabulary_highlights = enriched.vocabularyHighlights;
        art.mindmap_data = enriched.mindmapData;

        console.log(`✓ Generated Vietnamese translation (${enriched.translation.slice(0, 60)}...)`);
        console.log(`✓ Generated ${art.cloze.blanks.length} cloze blanks`);
        console.log(`✓ Generated ${art.vocabulary_highlights.length} vocabulary highlights`);
        console.log(`✓ Generated mindmap structure`);
        enrichedCount++;
      } catch (err: any) {
        console.warn(`✗ Gemini enrichment failed for "${art.title}": ${err.message}`);
      }
    }
  }

  // 4. Optional NotebookLM CLI Verification
  const nlmProfileArg =
    args.find((a) => a.startsWith('--nlm-profile='))?.split('=')[1] || 'burn-minh';
  const nlmLimitArg = parseInt(
    args.find((a) => a.startsWith('--nlm-limit='))?.split('=')[1] || '2',
    10
  );

  if (nlmEnabled && allArticles.length > 0) {
    console.log('\n--- TESTING NOTEBOOKLM CLI INTEGRATION ---');
    const auth = await checkNlmCliStatus(nlmProfileArg);
    console.log(
      `NLM CLI Status: installed=${auth.installed}, authenticated=${auth.authenticated}, account=${auth.account || 'unknown'}`
    );
    if (auth.error) console.log(`NLM Notice: ${auth.error}`);

    if (auth.authenticated) {
      const samples = allArticles.slice(0, Math.min(nlmLimitArg, allArticles.length));
      console.log(`Processing up to ${samples.length} sample article(s) with live NLM artifacts...\n`);

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        console.log(`[NLM ${i + 1}/${samples.length}] Generating artifacts for: "${sample.title}" (${sample.cefr_level})...`);
        const nlmRes = await generateNlmArtifacts(sample.title, sample.passage_plain, {
          profile: nlmProfileArg,
          generateAudio: true,
          generateQuiz: true,
          generateMindmap: true,
          waitForQuiz: true,
          quizTimeoutMs: 30000,
        });

        if (nlmRes.error) {
          console.warn(`  ⚠️ NLM Warning for "${sample.title}": ${nlmRes.error}`);
        } else {
          if (nlmRes.podcastMeta) {
            sample.podcast_meta = nlmRes.podcastMeta;
            console.log(`  ✓ Podcast audio initiated (status: ${nlmRes.podcastMeta.audio_status}, id: ${nlmRes.podcastMeta.nlm_audio_id || 'n/a'})`);
          }
          if (nlmRes.mindmapData) {
            sample.mindmap_data = nlmRes.mindmapData;
            console.log(`  ✓ Mindmap generated (${sample.mindmap_data.root?.children?.length || 0} primary branches)`);
          }
          if (nlmRes.quizQuestions && nlmRes.quizQuestions.length > 0) {
            if (!sample.questions || sample.questions.length === 0) {
              sample.questions = nlmRes.quizQuestions;
              console.log(`  ✓ Saved ${nlmRes.quizQuestions.length} NLM quiz questions as primary article questions`);
            } else {
              sample.source_metadata = {
                ...(sample.source_metadata || {}),
                nlm_quiz_questions: nlmRes.quizQuestions,
              };
              console.log(`  ✓ Saved ${nlmRes.quizQuestions.length} NLM quiz questions to source_metadata (preserved ${sample.questions.length} existing exam questions)`);
            }
          }
          if (nlmRes.audioUrl) {
            sample.audio_url = nlmRes.audioUrl;
          }
          console.log(`  ✓ Artifacts saved to article metadata for "${sample.title}" (Notebook: ${nlmRes.notebookId})\n`);
        }
      }
    } else {
      console.log('ℹ️ NLM is currently not authenticated. Skipped live NLM creation.');
    }
  }

  // 5. Database Upsert
  if (dryRun) {
    console.log('\n[DRY RUN] Completed successfully without writing to database.');
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('\n❌ Missing Supabase credentials in environment.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify table existence first
  const { error: testErr } = await supabase.from('reading_articles').select('id').limit(1);
  if (testErr && (testErr.message.includes('Could not find the table') || testErr.message.includes('does not exist'))) {
    console.error('\n❌ Table public.reading_articles does not exist in Supabase schema.');
    console.error('👉 Please apply the migration first:');
    console.log('   npx tsx scripts/apply-reading-library-migration.ts\n');
    process.exit(1);
  }

  console.log(`\n--- UPSERTING ${allArticles.length} ARTICLES TO SUPABASE ---`);
  let upsertedCount = 0;
  for (let i = 0; i < allArticles.length; i += batchSizeArg) {
    const chunk = allArticles.slice(i, i + batchSizeArg);
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
      cloze: a.cloze,
      questions: a.questions,
      vocabulary_highlights: a.vocabulary_highlights,
      audio_url: a.audio_url,
      podcast_meta: a.podcast_meta || {},
      mindmap_data: a.mindmap_data || {},
      source_type: a.source_type,
      source_id: a.source_id,
      source_metadata: a.source_metadata || {},
      status: a.status,
      difficulty_score: a.difficulty_score,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from('reading_articles')
      .upsert(dbPayload, { onConflict: 'slug' });

    if (upsertErr) {
      console.error(`✗ Error upserting batch ${i / batchSizeArg + 1}: ${upsertErr.message}`);
    } else {
      upsertedCount += chunk.length;
      process.stdout.write(`✓ Upserted ${upsertedCount}/${allArticles.length} articles\r`);
    }
  }

  console.log(`\n🎉 Done! Successfully upserted ${upsertedCount} reading articles into database.`);
}

main().catch((err) => {
  console.error('\n❌ Fatal error in reading ingestion pipeline:', err);
  process.exit(1);
});
