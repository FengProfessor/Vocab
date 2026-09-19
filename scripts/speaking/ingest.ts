/**
 * Master Speaking Data Ingestion CLI Orchestrator
 * File: scripts/speaking/ingest.ts
 *
 * CLI Usage:
 *   npx tsx scripts/speaking/ingest.ts --offline
 *   npx tsx scripts/speaking/ingest.ts --source=elllo --offline
 *   npx tsx scripts/speaking/ingest.ts --source=all --outDir=src/data/speaking/ingested/
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  isStandardizedSpeakingLesson,
  StandardizedSpeakingLesson,
} from '../../src/types/speaking-curriculum';
import { crawlElllo } from './crawlers/crawl-elllo';
import { crawlTalkEnglish } from './crawlers/crawl-talkenglish';
import { crawlYouTube } from './crawlers/crawl-youtube';

export interface IngestCliArgs {
  source: 'elllo' | 'talkenglish' | 'youtube' | 'all';
  offline: boolean;
  outDir: string;
  limit?: number;
}

/**
 * Parse CLI arguments into structured configuration.
 */
export function parseArgs(argv: string[]): IngestCliArgs {
  const args: IngestCliArgs = {
    source: 'all',
    offline: false,
    outDir: path.resolve(process.cwd(), 'src/data/speaking/ingested'),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--offline') {
      args.offline = true;
    } else if (arg.startsWith('--source=')) {
      const val = arg.split('=')[1] as IngestCliArgs['source'];
      if (['elllo', 'talkenglish', 'youtube', 'all'].includes(val)) {
        args.source = val;
      }
    } else if (arg === '--source' && i + 1 < argv.length) {
      const val = argv[++i] as IngestCliArgs['source'];
      if (['elllo', 'talkenglish', 'youtube', 'all'].includes(val)) {
        args.source = val;
      }
    } else if (arg.startsWith('--outDir=')) {
      args.outDir = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg === '--outDir' && i + 1 < argv.length) {
      args.outDir = path.resolve(process.cwd(), argv[++i]);
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--limit' && i + 1 < argv.length) {
      args.limit = parseInt(argv[++i], 10);
    }
  }

  return args;
}

/**
 * Generates the TypeScript index barrel file exporting catalogs and typed lookup helpers.
 */
export function generateIndexTsContent(): string {
  return `/**
 * Master Ingested Speaking Catalog & Lookup Helpers
 * File: src/data/speaking/ingested/index.ts
 *
 * Generated automatically by scripts/speaking/ingest.ts.
 * 100% compliant with StandardizedSpeakingLesson contracts.
 */

import {
  CefrLevel,
  IngestionSource,
  StandardizedSpeakingLesson,
} from '@/types/speaking-curriculum';

import ellloData from './elllo-catalog.json';
import talkenglishData from './talkenglish-catalog.json';
import youtubeData from './youtube-catalog.json';

export const ellloCatalog: StandardizedSpeakingLesson[] = ellloData as StandardizedSpeakingLesson[];
export const talkenglishCatalog: StandardizedSpeakingLesson[] = talkenglishData as StandardizedSpeakingLesson[];
export const youtubeCatalog: StandardizedSpeakingLesson[] = youtubeData as StandardizedSpeakingLesson[];

export const allIngestedLessons: StandardizedSpeakingLesson[] = [
  ...ellloCatalog,
  ...talkenglishCatalog,
  ...youtubeCatalog,
];

/**
 * Find a specific ingested lesson by unique ID across all catalogs.
 */
export function getLessonById(id: string): StandardizedSpeakingLesson | undefined {
  return allIngestedLessons.find((l) => l.id === id);
}

/**
 * Filter ingested lessons by source platform.
 */
export function getLessonsBySource(
  source: IngestionSource
): StandardizedSpeakingLesson[] {
  return allIngestedLessons.filter((l) => l.source === source);
}

/**
 * Filter ingested lessons by CEFR proficiency level (A1, A2, B1, B2).
 */
export function getLessonsByLevel(
  level: CefrLevel
): StandardizedSpeakingLesson[] {
  return allIngestedLessons.filter((l) => l.cefrLevel === level);
}

/**
 * Search lessons by topic substring (case-insensitive).
 */
export function getLessonsByTopic(
  topicQuery: string
): StandardizedSpeakingLesson[] {
  const query = topicQuery.toLowerCase().trim();
  return allIngestedLessons.filter(
    (l) =>
      l.topic.toLowerCase().includes(query) ||
      l.title.toLowerCase().includes(query)
  );
}

/**
 * Get aggregate catalog statistics.
 */
export function getIngestedCatalogStats() {
  const byLevel: Record<CefrLevel, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  };

  for (const lesson of allIngestedLessons) {
    if (byLevel[lesson.cefrLevel] !== undefined) {
      byLevel[lesson.cefrLevel] += 1;
    }
  }

  return {
    total: allIngestedLessons.length,
    elllo: ellloCatalog.length,
    talkenglish: talkenglishCatalog.length,
    youtube: youtubeCatalog.length,
    byLevel,
    averageQualityScore:
      allIngestedLessons.length > 0
        ? Math.round(
            allIngestedLessons.reduce((acc, cur) => acc + cur.qualityScore, 0) /
              allIngestedLessons.length
          )
        : 0,
  };
}
`;
}

/**
 * Main ingestion workflow runner.
 */
export async function runIngestionPipeline(
  args: IngestCliArgs
): Promise<{
  elllo: StandardizedSpeakingLesson[];
  talkenglish: StandardizedSpeakingLesson[];
  youtube: StandardizedSpeakingLesson[];
}> {
  console.log('================================================================');
  console.log('🚀 LINGOPRO SPEAKING INGESTION PIPELINE');
  console.log('================================================================');
  console.log(`Source Target : ${args.source.toUpperCase()}`);
  console.log(`Mode          : ${args.offline ? 'OFFLINE (Deterministic Seeds)' : 'LIVE (Web Scraping)'}`);
  console.log(`Output Path   : ${args.outDir}`);
  console.log('----------------------------------------------------------------');

  if (!fs.existsSync(args.outDir)) {
    fs.mkdirSync(args.outDir, { recursive: true });
  }

  let ellloLessons: StandardizedSpeakingLesson[] = [];
  let talkenglishLessons: StandardizedSpeakingLesson[] = [];
  let youtubeLessons: StandardizedSpeakingLesson[] = [];

  // 1. ELLLO Ingestion
  if (args.source === 'all' || args.source === 'elllo') {
    process.stdout.write('▶ Crawling & Normalizing ELLLO... ');
    ellloLessons = await crawlElllo({
      offline: args.offline,
      limit: args.limit,
    });
    for (const l of ellloLessons) {
      if (!isStandardizedSpeakingLesson(l)) {
        throw new Error(`ELLLO lesson "${l.id}" failed StandardizedSpeakingLesson contract.`);
      }
    }
    fs.writeFileSync(
      path.join(args.outDir, 'elllo-catalog.json'),
      JSON.stringify(ellloLessons, null, 2),
      'utf-8'
    );
    console.log(`✓ Ingested ${ellloLessons.length} lessons`);
  }

  // 2. TalkEnglish Ingestion
  if (args.source === 'all' || args.source === 'talkenglish') {
    process.stdout.write('▶ Crawling & Normalizing TalkEnglish... ');
    talkenglishLessons = await crawlTalkEnglish({
      offline: args.offline,
      limit: args.limit,
    });
    for (const l of talkenglishLessons) {
      if (!isStandardizedSpeakingLesson(l)) {
        throw new Error(`TalkEnglish lesson "${l.id}" failed StandardizedSpeakingLesson contract.`);
      }
    }
    fs.writeFileSync(
      path.join(args.outDir, 'talkenglish-catalog.json'),
      JSON.stringify(talkenglishLessons, null, 2),
      'utf-8'
    );
    console.log(`✓ Ingested ${talkenglishLessons.length} lessons`);
  }

  // 3. YouTube Ingestion
  if (args.source === 'all' || args.source === 'youtube') {
    process.stdout.write('▶ Crawling & Normalizing YouTube... ');
    youtubeLessons = await crawlYouTube({
      offline: args.offline,
      limit: args.limit,
    });
    for (const l of youtubeLessons) {
      if (!isStandardizedSpeakingLesson(l)) {
        throw new Error(`YouTube lesson "${l.id}" failed StandardizedSpeakingLesson contract.`);
      }
    }
    fs.writeFileSync(
      path.join(args.outDir, 'youtube-catalog.json'),
      JSON.stringify(youtubeLessons, null, 2),
      'utf-8'
    );
    console.log(`✓ Ingested ${youtubeLessons.length} lessons`);
  }

  // 4. Generate Master index.ts Barrel
  process.stdout.write('▶ Generating Master index.ts... ');
  fs.writeFileSync(
    path.join(args.outDir, 'index.ts'),
    generateIndexTsContent(),
    'utf-8'
  );
  console.log('✓ Generated');

  const totalCount = ellloLessons.length + talkenglishLessons.length + youtubeLessons.length;
  console.log('----------------------------------------------------------------');
  console.log(`🎉 Ingestion Pipeline Complete! Total Lessons: ${totalCount}`);
  console.log(`   - ELLLO Catalog       : ${ellloLessons.length}`);
  console.log(`   - TalkEnglish Catalog : ${talkenglishLessons.length}`);
  console.log(`   - YouTube Catalog     : ${youtubeLessons.length}`);
  console.log('================================================================');

  return {
    elllo: ellloLessons,
    talkenglish: talkenglishLessons,
    youtube: youtubeLessons,
  };
}

// Direct CLI execution
if (require.main === module) {
  const cliArgs = parseArgs(process.argv.slice(2));
  runIngestionPipeline(cliArgs).catch((err) => {
    console.error('❌ Ingestion Pipeline Fatal Error:', err);
    process.exit(1);
  });
}
