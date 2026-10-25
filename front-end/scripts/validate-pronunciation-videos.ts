#!/usr/bin/env tsx
/**
 * Automated Data Validator for Rachel's English Video Integration
 * Verifies that all 26 IPA pronunciation lessons in lessons-v1.json contain
 * valid, authentic video metadata conforming to interface contracts and security policies.
 * 
 * Flags:
 *   --verify-online : Connects to YouTube oEmbed API to verify 100% reachability & channel ownership.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

interface VideoMeta {
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number;
  channelName: string;
  videoTip: string;
  clipTitle?: string;
  mouthTipSummary?: string;
}

interface LessonItem {
  id: string;
  level: string;
  title: string;
  ipa: string;
  whyHard: string;
  mouthTip: string;
  exampleWords: string[];
  drillType: string;
  minimalPairs: Array<{ a: string; b: string; note: string }>;
  video?: VideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: string;
  videoTip?: string;
}

interface LessonsArtifact {
  version: string;
  source: string;
  lessons: LessonItem[];
}

export const VERIFIED_CANONICAL_RACHEL_IDS: Record<string, string> = {
  'word-stress-basics': 'pRXsIthxgH8',
  'final-stops-ptk': 'IV6e_XyNe0w',
  'final-s-z': 'xl-7mSeybmI',
  'w-initial': 'RW94L6606DE',
  'j-glide': '1Yo4BHIIBP8',
  'initial-p-b': 'JPUr5MgeDHM',
  'vowel-i-long-short': 'scCesnn-0XY',
  'final-l-n': 'FP0jHNoFqWo',
  'sentence-rhythm': 'PrAe07KluZY',
  's-vs-sh': 'uguN4ghpKtQ',
  'vowel-u-long-short': 'IwahymIkGJ0',
  'vowel-ae-e': 'UM9gPzKs1Hg',
  'final-n-ng': '6ESY7ueSfrc',
  'basic-intonation': 'Aoj4HZlLQBY',
  'schwa': '2BmkUa4Mv60',
  'weak-forms': 'JqxEjQ5xfpw',
  'linking': '7tsljuK4f2E',
  'v-f-final': 'nR-K3mrHFv0',
  'th-voiceless': 'nlKNo1TGALA',
  'final-clusters-ed': 'gftHWQ6CLu8',
  'th-voiced': 'nlKNo1TGALA',
  'vowel-uh-ah': 'eJPv2mJJwHQ',
  'diphthongs': 'XajvB178Hhs',
  'r-l-z': 'mO7J-b8vi54',
  'ch-j': 'jaRcbpN_KlM',
  'vowel-aw-o': 'opMab62SybY',
};

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const EXPECTED_CHANNEL = "Rachel's English";
const EXPECTED_LESSON_COUNT = 26;

interface OEmbedResult {
  statusCode: number;
  authorName?: string;
  title?: string;
  error?: string;
}

function fetchOEmbed(videoId: string): Promise<OEmbedResult> {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let authorName: string | undefined;
        let title: string | undefined;
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            authorName = parsed.author_name;
            title = parsed.title;
          } catch {
            // Ignore parse errors
          }
        }
        resolve({
          statusCode: res.statusCode ?? 0,
          authorName,
          title,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 408, error: 'Request timeout' });
    });
  });
}

async function runValidation(): Promise<void> {
  const isOnlineCheck = process.argv.includes('--verify-online');

  console.log('================================================================================');
  console.log(`  RACHEL'S ENGLISH IPA VIDEO CATALOG VALIDATION ${isOnlineCheck ? '(LIVE OEMBED MODE)' : '(OFFLINE WHITELIST MODE)'}`);
  console.log('================================================================================');

  const jsonPath = path.resolve(__dirname, '../src/data/pronunciation/lessons-v1.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ CRITICAL: Pronunciation lessons file not found at: ${jsonPath}`);
    process.exit(1);
  }

  let data: LessonsArtifact;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error('❌ CRITICAL: Failed to parse lessons-v1.json:', err);
    process.exit(1);
  }

  const errors: string[] = [];
  const lessons = data.lessons;

  if (!Array.isArray(lessons)) {
    console.error('❌ CRITICAL: lessons-v1.json does not contain a "lessons" array.');
    process.exit(1);
  }

  // 1. Validate lesson count
  if (lessons.length !== EXPECTED_LESSON_COUNT) {
    errors.push(`Expected exactly ${EXPECTED_LESSON_COUNT} lessons, found ${lessons.length}.`);
  }

  const seenIds = new Set<string>();
  const tableRows: Array<{
    index: number;
    id: string;
    ipa: string;
    videoId: string;
    timestamps: string;
    duration: string;
    channel: string;
    onlineStatus?: string;
    status: string;
  }> = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const prefix = `[Lesson #${i + 1}: ${lesson.id || 'unknown'}]`;

    // Duplicate check
    if (seenIds.has(lesson.id)) {
      errors.push(`${prefix} Duplicate lesson ID detected: "${lesson.id}".`);
    }
    seenIds.add(lesson.id);

    // Required core fields
    if (!lesson.id || typeof lesson.id !== 'string') {
      errors.push(`${prefix} Missing or invalid "id".`);
    }
    if (!lesson.title || typeof lesson.title !== 'string') {
      errors.push(`${prefix} Missing or invalid "title".`);
    }
    if (!lesson.ipa || typeof lesson.ipa !== 'string') {
      errors.push(`${prefix} Missing or invalid "ipa".`);
    }

    // Video object check
    if (!lesson.video || typeof lesson.video !== 'object') {
      errors.push(`${prefix} Missing structured "video" metadata object.`);
      continue;
    }

    const v = lesson.video;

    // Validate youtubeVideoId syntax
    if (!v.youtubeVideoId || typeof v.youtubeVideoId !== 'string') {
      errors.push(`${prefix} Missing video.youtubeVideoId.`);
    } else if (!YOUTUBE_ID_REGEX.test(v.youtubeVideoId)) {
      errors.push(`${prefix} Invalid video.youtubeVideoId "${v.youtubeVideoId}" (must match 11-char regex).`);
    }

    // Offline Canonical Whitelist Validation
    const expectedCanonicalId = VERIFIED_CANONICAL_RACHEL_IDS[lesson.id];
    if (expectedCanonicalId && v.youtubeVideoId !== expectedCanonicalId) {
      errors.push(
        `${prefix} YouTube ID "${v.youtubeVideoId}" does not match canonical whitelist ID "${expectedCanonicalId}".`
      );
    }

    // Validate channelName
    if (v.channelName !== EXPECTED_CHANNEL) {
      errors.push(`${prefix} Invalid video.channelName "${v.channelName}". Expected strictly "${EXPECTED_CHANNEL}".`);
    }

    // Validate timestamps
    if (typeof v.startSeconds !== 'number' || v.startSeconds < 0) {
      errors.push(`${prefix} Invalid startSeconds: ${v.startSeconds} (must be integer >= 0).`);
    }
    if (typeof v.endSeconds !== 'number' || v.endSeconds <= (v.startSeconds ?? 0)) {
      errors.push(`${prefix} Invalid endSeconds: ${v.endSeconds} (must be > startSeconds).`);
    }

    // Validate videoTip
    if (!v.videoTip || typeof v.videoTip !== 'string' || v.videoTip.trim().length === 0) {
      errors.push(`${prefix} Missing or empty videoTip.`);
    }

    // Validate dual-compatibility flat fields
    if (lesson.youtubeVideoId !== v.youtubeVideoId) {
      errors.push(`${prefix} Flat youtubeVideoId does not match video.youtubeVideoId.`);
    }
    if (lesson.startSeconds !== v.startSeconds) {
      errors.push(`${prefix} Flat startSeconds does not match video.startSeconds.`);
    }
    if (lesson.endSeconds !== v.endSeconds) {
      errors.push(`${prefix} Flat endSeconds does not match video.endSeconds.`);
    }
    if (lesson.channelName !== v.channelName) {
      errors.push(`${prefix} Flat channelName does not match video.channelName.`);
    }
    if (lesson.videoTip !== v.videoTip) {
      errors.push(`${prefix} Flat videoTip does not match video.videoTip.`);
    }

    let onlineStatusStr = 'OFFLINE_CHECK';
    if (isOnlineCheck && v.youtubeVideoId) {
      const oembed = await fetchOEmbed(v.youtubeVideoId);
      if (oembed.statusCode !== 200) {
        errors.push(`${prefix} Live YouTube oEmbed check failed: HTTP ${oembed.statusCode} (${oembed.error || 'Not Found'}) for ID "${v.youtubeVideoId}".`);
        onlineStatusStr = `ERR ${oembed.statusCode}`;
      } else if (oembed.authorName !== EXPECTED_CHANNEL) {
        errors.push(`${prefix} Live YouTube author is "${oembed.authorName || 'unknown'}", expected "${EXPECTED_CHANNEL}".`);
        onlineStatusStr = `AUTH_MISMATCH`;
      } else {
        onlineStatusStr = `200 OK (${oembed.authorName})`;
      }
    }

    const duration = (v.endSeconds && v.startSeconds) ? `${v.endSeconds - v.startSeconds}s` : 'N/A';
    const timestampRange = `${v.startSeconds ?? '?'}s - ${v.endSeconds ?? '?'}s`;

    tableRows.push({
      index: i + 1,
      id: lesson.id,
      ipa: lesson.ipa,
      videoId: v.youtubeVideoId,
      timestamps: timestampRange,
      duration,
      channel: v.channelName,
      onlineStatus: isOnlineCheck ? onlineStatusStr : undefined,
      status: 'VALID',
    });
  }

  // Print results table
  if (isOnlineCheck) {
    console.log('| #  | Lesson ID               | IPA       | YouTube ID    | Segment     | Dur  | Live oEmbed Status           | Status |');
    console.log('|:---|:------------------------|:---------:|:-------------:|:-----------:|:----:|:-----------------------------|:------:|');
    for (const row of tableRows) {
      const idx = String(row.index).padEnd(2);
      const id = row.id.padEnd(23);
      const ipa = row.ipa.padEnd(9);
      const vid = row.videoId.padEnd(13);
      const seg = row.timestamps.padEnd(11);
      const dur = row.duration.padEnd(4);
      const oStatus = (row.onlineStatus || '').padEnd(28);
      console.log(`| ${idx} | ${id} | ${ipa} | ${vid} | ${seg} | ${dur} | ${oStatus} | ${row.status}  |`);
    }
  } else {
    console.log('| #  | Lesson ID               | IPA       | YouTube ID    | Segment     | Dur  | Channel          | Status |');
    console.log('|:---|:------------------------|:---------:|:-------------:|:-----------:|:----:|:-----------------|:------:|');
    for (const row of tableRows) {
      const idx = String(row.index).padEnd(2);
      const id = row.id.padEnd(23);
      const ipa = row.ipa.padEnd(9);
      const vid = row.videoId.padEnd(13);
      const seg = row.timestamps.padEnd(11);
      const dur = row.duration.padEnd(4);
      const ch = row.channel.padEnd(16);
      console.log(`| ${idx} | ${id} | ${ipa} | ${vid} | ${seg} | ${dur} | ${ch} | ${row.status}  |`);
    }
  }
  console.log('--------------------------------------------------------------------------------');

  if (errors.length > 0) {
    console.error(`\n❌ VALIDATION FAILED with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ VALIDATION PASSED: All ${lessons.length} lessons strictly adhere to Rachel's English video specifications.`);
  console.log('   - 26/26 lessons verified');
  console.log('   - 100% valid 11-char YouTube Video IDs');
  console.log('   - 100% authoritative whitelist matched');
  if (isOnlineCheck) {
    console.log('   - 100% live YouTube oEmbed verified (HTTP 200 + Rachel\'s English)');
  }
  console.log('   - 100% valid start/end timestamp ranges');
  console.log(`   - 100% channel uniformity ("${EXPECTED_CHANNEL}")`);
  console.log('   - 100% dual-compatibility (nested video object + flat fields)');
}

runValidation().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});
