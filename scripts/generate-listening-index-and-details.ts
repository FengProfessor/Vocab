/**
 * scripts/generate-listening-index-and-details.ts
 *
 * Generates the two-tier dataset architecture for Listening Module:
 * 1. src/data/listening/videos-index.json (~150 KB lightweight index)
 * 2. src/data/listening/details/<id>.json (200 individual video files)
 *
 * Source: src/data/listening/videos.json (200 canonical videos)
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ListeningVideo,
  ListeningVideoIndexItem,
} from '../src/types/listening';

const ROOT_DIR = path.resolve(__dirname, '..');
const VIDEOS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos.json');
const INDEX_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');
const DETAILS_DIR_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');

export function generateIndexAndDetails(): { indexCount: number; detailsCount: number; indexSizeKb: number } {
  console.log('--- Reading canonical videos dataset ---');
  if (!fs.existsSync(VIDEOS_JSON_PATH)) {
    throw new Error(`Videos dataset not found at ${VIDEOS_JSON_PATH}`);
  }

  const raw = fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8');
  const videos: ListeningVideo[] = JSON.parse(raw);
  console.log(`Loaded ${videos.length} videos from videos.json`);

  if (videos.length !== 200) {
    throw new Error(`Expected exactly 200 videos, but found ${videos.length}`);
  }

  // Ensure details directory exists
  if (!fs.existsSync(DETAILS_DIR_PATH)) {
    fs.mkdirSync(DETAILS_DIR_PATH, { recursive: true });
  }

  // 1. Build videos-index.json
  const indexItems: ListeningVideoIndexItem[] = videos.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    channel: v.channel,
    duration: v.duration,
    durationDisplay: v.durationDisplay,
    durationCategory: v.durationCategory,
    cefrLevel: v.cefrLevel,
    topic: v.topic,
    topicDisplay: v.topicDisplay,
    thumbnailUrl: v.thumbnailUrl,
    description: v.description,
    coreVocabularyPreview: (v.coreVocabulary || []).slice(0, 3).map((item) => item.word),
    coreVocabularyCount: (v.coreVocabulary || []).length,
    transcriptCuesCount: (v.transcript || []).length,
    clozeCount: (v.clozeItems || []).length,
    quizCount: (v.comprehensionQuestions || []).length,
  }));

  fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(indexItems, null, 2), 'utf-8');
  const indexSizeKb = fs.statSync(INDEX_JSON_PATH).size / 1024;
  console.log(`[PASS] Wrote ${indexItems.length} items to videos-index.json (${indexSizeKb.toFixed(2)} KB)`);

  // 2. Build individual details/<id>.json files
  let detailCount = 0;
  for (const video of videos) {
    const detailFilePath = path.join(DETAILS_DIR_PATH, `${video.id}.json`);
    fs.writeFileSync(detailFilePath, JSON.stringify(video, null, 2), 'utf-8');
    detailCount++;
  }
  console.log(`[PASS] Wrote ${detailCount} individual detail files to ${DETAILS_DIR_PATH}`);

  // 3. Purge all orphan/junk files from details/ directory
  const validFileNames = new Set(videos.map((v) => `${v.id}.json`));
  const existingFiles = fs.readdirSync(DETAILS_DIR_PATH);
  let purgedCount = 0;
  for (const file of existingFiles) {
    if (file.endsWith('.json') && !validFileNames.has(file)) {
      fs.unlinkSync(path.join(DETAILS_DIR_PATH, file));
      purgedCount++;
    }
  }
  console.log(`[PASS] Purged ${purgedCount} orphan/junk files from ${DETAILS_DIR_PATH}`);

  return {
    indexCount: indexItems.length,
    detailsCount: detailCount,
    purgedCount,
    indexSizeKb,
  };
}

if (require.main === module) {
  const result = generateIndexAndDetails();
  console.log(`\nSuccessfully synchronized two-tier listening architecture:`);
  console.log(`- Index: ${result.indexCount} videos (${result.indexSizeKb.toFixed(2)} KB)`);
  console.log(`- Details: ${result.detailsCount} individual JSON files`);
  console.log(`- Purged: ${result.purgedCount} orphan/junk files\n`);
}
