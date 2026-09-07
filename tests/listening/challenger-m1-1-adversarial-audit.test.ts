/**
 * Challenger 1 Adversarial Audit & Verification Test Suite
 * Milestone 1: Data Integrity & Distribution Stress
 *
 * Probes:
 * 1. Deep schema, monotonic timestamps, cue boundaries, core vocabulary definitions and phonetics validation across all files in src/data/listening/details/*.json.
 * 2. Strict 11-char YouTube ID and thumbnail URL validation across all 200 videos.
 * 3. Deep vocabulary diversity, pairwise Jaccard similarity, and dummy token / boilerplate elimination check.
 * 4. Cloze items and Comprehension Quiz referential and pedagogical integrity.
 */

import * as fs from 'fs';
import * as path from 'path';

interface TranscriptCue {
  id: string;
  start: number;
  end: number;
  en: string;
  vi: string;
}

interface CoreVocabulary {
  word: string;
  phonetic: string;
  viDefinition: string;
  contextSentence: string;
}

interface ClozeItem {
  id: string;
  cueId?: string;
  sentence: string;
  blankWord: string;
  hintVi: string;
  timestamp: number;
  options?: string[];
}

interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timestampSeek: number;
}

interface ListeningVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: number;
  durationDisplay: string;
  durationCategory: 'short' | 'medium';
  cefrLevel: 'A2' | 'B1' | 'B2';
  topic: string;
  topicDisplay: string;
  thumbnailUrl: string;
  description: string;
  coreVocabulary: CoreVocabulary[];
  transcript: TranscriptCue[];
  clozeItems: ClozeItem[];
  comprehensionQuestions: ComprehensionQuestion[];
}

export async function runChallenger1Audit(): Promise<{ totalProbes: number; passedProbes: number; failedProbes: number; errors: string[] }> {
  const errors: string[] = [];
  let probeCount = 0;
  let passCount = 0;

  function probe(name: string, fn: () => void) {
    probeCount++;
    try {
      fn();
      passCount++;
      console.log(`  [PASS] Probe ${probeCount}: ${name}`);
    } catch (err: any) {
      errors.push(`Probe ${probeCount} (${name}) FAILED: ${err.message}`);
      console.error(`  [FAIL] Probe ${probeCount}: ${name} -> ${err.message}`);
    }
  }

  const ROOT_DIR = path.resolve(__dirname, '..', '..');
  const DETAILS_DIR = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');
  const VIDEOS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos.json');
  const INDEX_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');

  console.log('================================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL DATASET & DETAIL AUDIT (MILESTONE 1)');
  console.log('  Target: src/data/listening/details/*.json, videos.json, videos-index.json');
  console.log('================================================================================\n');

  // Load files
  if (!fs.existsSync(DETAILS_DIR)) {
    throw new Error(`Details directory not found: ${DETAILS_DIR}`);
  }

  const detailFiles = fs.readdirSync(DETAILS_DIR).filter((f) => f.endsWith('.json'));
  const allDetailVideos: ListeningVideo[] = [];

  // PROBE 1: File count and naming convention
  probe('Exactly 200 JSON files in src/data/listening/details/ with no orphan/extraneous files', () => {
    if (detailFiles.length !== 200) {
      throw new Error(`Expected exactly 200 detail JSON files, found ${detailFiles.length}`);
    }
    const nonJsonFiles = fs.readdirSync(DETAILS_DIR).filter((f) => !f.endsWith('.json'));
    if (nonJsonFiles.length > 0) {
      throw new Error(`Extraneous non-JSON files found in details dir: ${nonJsonFiles.join(', ')}`);
    }
  });

  // PROBE 2: JSON Parse and matching ID
  probe('All 200 detail files parse valid JSON and file name strictly matches video.id', () => {
    for (const filename of detailFiles) {
      const filePath = path.join(DETAILS_DIR, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      let parsed: ListeningVideo;
      try {
        parsed = JSON.parse(raw);
      } catch (e: any) {
        throw new Error(`JSON parse error in ${filename}: ${e.message}`);
      }
      const expectedId = filename.replace(/\.json$/, '');
      if (parsed.id !== expectedId) {
        throw new Error(`File ${filename} contains video with mismatched ID '${parsed.id}'`);
      }
      allDetailVideos.push(parsed);
    }
  });

  // PROBE 3: Canonical schema properties presence and types
  probe('All 200 detail files satisfy complete ListeningVideo schema structure and types', () => {
    const requiredProps = [
      'id', 'youtubeId', 'title', 'channel', 'duration', 'durationDisplay',
      'durationCategory', 'cefrLevel', 'topic', 'topicDisplay', 'thumbnailUrl',
      'description', 'coreVocabulary', 'transcript', 'clozeItems', 'comprehensionQuestions'
    ];

    for (const v of allDetailVideos) {
      for (const prop of requiredProps) {
        if ((v as any)[prop] === undefined || (v as any)[prop] === null) {
          throw new Error(`Video ${v.id} is missing required property '${prop}'`);
        }
      }
      if (typeof v.duration !== 'number' || v.duration <= 0 || !Number.isFinite(v.duration)) {
        throw new Error(`Video ${v.id} has invalid duration: ${v.duration}`);
      }
      if (!['short', 'medium'].includes(v.durationCategory)) {
        throw new Error(`Video ${v.id} has invalid durationCategory: ${v.durationCategory}`);
      }
      if (!['A2', 'B1', 'B2'].includes(v.cefrLevel)) {
        throw new Error(`Video ${v.id} has invalid cefrLevel: ${v.cefrLevel}`);
      }
    }
  });

  // PROBE 4: Duration bounds and durationDisplay alignment
  probe('Duration bounds and durationDisplay format alignment across all 200 videos', () => {
    for (const v of allDetailVideos) {
      if (v.durationCategory === 'short') {
        if (v.duration < 181 || v.duration > 600) {
          throw new Error(`Video ${v.id} duration (${v.duration}s) out of short range [181, 600]`);
        }
      } else if (v.durationCategory === 'medium') {
        if (v.duration < 601 || v.duration > 1500) {
          throw new Error(`Video ${v.id} duration (${v.duration}s) out of medium range [601, 1500]`);
        }
      }

      const displayRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!displayRegex.test(v.durationDisplay)) {
        throw new Error(`Video ${v.id} durationDisplay '${v.durationDisplay}' does not match mm:ss format`);
      }

      const parts = v.durationDisplay.split(':').map(Number);
      const displaySec = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (Math.abs(displaySec - Math.round(v.duration)) > 2) {
        throw new Error(`Video ${v.id} durationDisplay '${v.durationDisplay}' (${displaySec}s) drifts from duration ${v.duration}s`);
      }
    }
  });

  // PROBE 5: Strict Monotonic Cue Timestamps & Invariants
  probe('Strict positive cue duration, non-negative start, and monotonic cue progression in all videos', () => {
    for (const v of allDetailVideos) {
      if (!Array.isArray(v.transcript) || v.transcript.length < 10) {
        throw new Error(`Video ${v.id} has insufficient transcript cues (${v.transcript?.length})`);
      }

      let prevStart = -1;
      for (let i = 0; i < v.transcript.length; i++) {
        const cue = v.transcript[i];
        if (typeof cue.start !== 'number' || typeof cue.end !== 'number') {
          throw new Error(`Video ${v.id} cue ${cue.id} has non-numeric start/end`);
        }
        if (cue.start < 0) {
          throw new Error(`Video ${v.id} cue ${cue.id} has negative start timestamp: ${cue.start}`);
        }
        if (cue.end <= cue.start) {
          throw new Error(`Video ${v.id} cue ${cue.id} has non-positive duration: start=${cue.start}, end=${cue.end}`);
        }
        if (cue.start < prevStart) {
          throw new Error(`Video ${v.id} cue ${cue.id} non-monotonic: start ${cue.start} < prevStart ${prevStart}`);
        }
        if (cue.end > v.duration + 10) {
          throw new Error(`Video ${v.id} cue ${cue.id} exceeds video duration: cue.end=${cue.end}, video.duration=${v.duration}`);
        }
        if (!cue.en || !cue.en.trim()) {
          throw new Error(`Video ${v.id} cue ${cue.id} has empty English transcript`);
        }
        if (!cue.vi || !cue.vi.trim()) {
          throw new Error(`Video ${v.id} cue ${cue.id} has empty Vietnamese transcript`);
        }
        prevStart = cue.start;
      }
    }
  });

  // PROBE 6: Cue overlap sanity (no negative time inversions)
  probe('Cue overlap sanity: adjacent cue overlap <= 0.5s across all 200 videos', () => {
    let maxOverlap = 0;
    for (const v of allDetailVideos) {
      for (let i = 1; i < v.transcript.length; i++) {
        const prev = v.transcript[i - 1];
        const curr = v.transcript[i];
        if (curr.start < prev.end) {
          const overlap = prev.end - curr.start;
          if (overlap > maxOverlap) maxOverlap = overlap;
          if (overlap > 0.5) {
            throw new Error(`Video ${v.id} cue ${curr.id} has excessive overlap (${overlap.toFixed(3)}s) with cue ${prev.id}`);
          }
        }
      }
    }
  });

  // PROBE 7: Core Vocabulary Completeness & IPA Phonetics
  probe('Core vocabulary: >= 3 items, valid IPA notation (/.../), non-empty definitions and contexts', () => {
    const ipaRegex = /^\/[^/]+\/$/;
    for (const v of allDetailVideos) {
      if (!Array.isArray(v.coreVocabulary) || v.coreVocabulary.length < 3) {
        throw new Error(`Video ${v.id} has fewer than 3 core vocabulary items (${v.coreVocabulary?.length})`);
      }

      const seenWords = new Set<string>();
      for (const vocab of v.coreVocabulary) {
        if (!vocab.word || !vocab.word.trim()) {
          throw new Error(`Video ${v.id} has empty vocab word: ${JSON.stringify(vocab)}`);
        }
        const lowerWord = vocab.word.trim().toLowerCase();
        if (seenWords.has(lowerWord)) {
          throw new Error(`Video ${v.id} has duplicate vocab word '${vocab.word}'`);
        }
        seenWords.add(lowerWord);

        if (!vocab.phonetic || !ipaRegex.test(vocab.phonetic)) {
          throw new Error(`Video ${v.id} vocab '${vocab.word}' has invalid IPA notation: '${vocab.phonetic}'`);
        }
        if (!vocab.viDefinition || vocab.viDefinition.trim().length < 2) {
          throw new Error(`Video ${v.id} vocab '${vocab.word}' has missing or too short viDefinition`);
        }
        if (!vocab.contextSentence || vocab.contextSentence.trim().length < 10) {
          throw new Error(`Video ${v.id} vocab '${vocab.word}' has missing or too short contextSentence`);
        }
      }
    }
  });

  // PROBE 8: 11-char YouTube ID Format & Uniqueness
  probe('All 200 YouTube IDs are valid 11-character URL-safe strings and 100% unique', () => {
    const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
    const seenYtIds = new Map<string, string>();

    for (const v of allDetailVideos) {
      if (!ytRegex.test(v.youtubeId)) {
        throw new Error(`Video ${v.id} has invalid YouTube ID '${v.youtubeId}' (must match ${ytRegex})`);
      }
      if (v.youtubeId.length !== 11) {
        throw new Error(`Video ${v.id} YouTube ID '${v.youtubeId}' length is ${v.youtubeId.length}, expected 11`);
      }
      if (seenYtIds.has(v.youtubeId)) {
        throw new Error(`Duplicate YouTube ID '${v.youtubeId}' found in videos '${seenYtIds.get(v.youtubeId)}' and '${v.id}'`);
      }
      seenYtIds.set(v.youtubeId, v.id);
    }
  });

  // PROBE 9: Valid Thumbnail URLs containing YouTube ID
  probe('All 200 thumbnail URLs are valid HTTPS URLs correctly embedding the video youtubeId', () => {
    for (const v of allDetailVideos) {
      if (!v.thumbnailUrl.startsWith('https://')) {
        throw new Error(`Video ${v.id} thumbnailUrl is not HTTPS: '${v.thumbnailUrl}'`);
      }
      if (!v.thumbnailUrl.includes(v.youtubeId)) {
        throw new Error(`Video ${v.id} thumbnailUrl '${v.thumbnailUrl}' does not contain its youtubeId '${v.youtubeId}'`);
      }
      if (!v.thumbnailUrl.includes('img.youtube.com') && !v.thumbnailUrl.includes('i.ytimg.com')) {
        throw new Error(`Video ${v.id} thumbnailUrl does not originate from YouTube CDN: '${v.thumbnailUrl}'`);
      }
    }
  });

  // PROBE 10: Zero Boilerplate and Dummy Token Triad Elimination
  probe('Zero occurrences of boilerplate string and dummy triad ["concept", "practice", "fluent"]', () => {
    const boilerplate = 'the speaker explains key concepts in English';
    const dummyTriad = ['concept', 'practice', 'fluent'];

    for (const v of allDetailVideos) {
      const rawStr = JSON.stringify(v);
      if (rawStr.includes(boilerplate)) {
        throw new Error(`Video ${v.id} contains banned boilerplate string '${boilerplate}'`);
      }

      const words = v.coreVocabulary.map((c) => c.word.toLowerCase());
      const hasTriad = dummyTriad.every((dw) => words.includes(dw));
      if (hasTriad) {
        throw new Error(`Video ${v.id} contains banned dummy vocabulary triad ${JSON.stringify(dummyTriad)}`);
      }
    }
  });

  // PROBE 11: Vocabulary Diversity & Cross-Video Uniqueness
  probe('Cross-video vocabulary diversity: no high-overlap clone pairs (Max Pairwise Jaccard < 0.60)', () => {
    const vocabMap = new Map<string, Set<string>>();
    const allWords = new Map<string, number>();

    for (const v of allDetailVideos) {
      const set = new Set(v.coreVocabulary.map((c) => c.word.toLowerCase()));
      vocabMap.set(v.id, set);
      for (const w of set) {
        allWords.set(w, (allWords.get(w) || 0) + 1);
      }
    }

    let maxWordFreq = 0;
    let mostFrequentWord = '';
    for (const [w, count] of allWords.entries()) {
      if (count > maxWordFreq) {
        maxWordFreq = count;
        mostFrequentWord = w;
      }
    }

    const uniqueWordCount = allWords.size;
    console.log(`    [INFO] Total unique vocabulary words: ${uniqueWordCount} across ${allDetailVideos.length * 3}+ total items`);
    console.log(`    [INFO] Most frequent word: '${mostFrequentWord}' appearing in ${maxWordFreq} videos (${(maxWordFreq / 200 * 100).toFixed(1)}%)`);

    if (uniqueWordCount < 300) {
      throw new Error(`Vocabulary diversity too low: only ${uniqueWordCount} unique words across 200 videos`);
    }

    if (maxWordFreq > 20) {
      throw new Error(`Word '${mostFrequentWord}' appears in ${maxWordFreq} videos (>10%), excessive repetition!`);
    }

    const videoList = allDetailVideos;
    let maxJaccard = 0;
    let maxPair = '';

    for (let i = 0; i < videoList.length; i++) {
      const v1 = videoList[i];
      const set1 = vocabMap.get(v1.id)!;

      for (let j = i + 1; j < videoList.length; j++) {
        const v2 = videoList[j];
        const set2 = vocabMap.get(v2.id)!;

        let intersection = 0;
        for (const w of set1) {
          if (set2.has(w)) intersection++;
        }
        const union = new Set([...set1, ...set2]).size;
        const jaccard = union > 0 ? intersection / union : 0;

        if (jaccard > maxJaccard) {
          maxJaccard = jaccard;
          maxPair = `${v1.id} <-> ${v2.id}`;
        }
      }
    }

    console.log(`    [INFO] Maximum pairwise vocabulary Jaccard similarity: ${(maxJaccard * 100).toFixed(1)}% (${maxPair})`);
    if (maxJaccard >= 0.60) {
      throw new Error(`Excessive vocabulary overlap (${(maxJaccard * 100).toFixed(1)}%) between ${maxPair}`);
    }
  });

  // PROBE 12: Cloze Items Referential & Pedagogical Integrity
  probe('Cloze items: >= 3 items, valid sentence with {{blank}}, blankWord present in options', () => {
    for (const v of allDetailVideos) {
      if (!Array.isArray(v.clozeItems) || v.clozeItems.length < 3) {
        throw new Error(`Video ${v.id} has fewer than 3 cloze items (${v.clozeItems?.length})`);
      }

      for (const cloze of v.clozeItems) {
        if (!cloze.id) throw new Error(`Video ${v.id} has cloze without id`);
        if (!cloze.sentence.includes('{{blank}}')) {
          throw new Error(`Video ${v.id} cloze ${cloze.id} sentence lacks '{{blank}}' placeholder`);
        }
        if (!cloze.blankWord || !cloze.blankWord.trim()) {
          throw new Error(`Video ${v.id} cloze ${cloze.id} has empty blankWord`);
        }
        if (!cloze.hintVi || !cloze.hintVi.trim()) {
          throw new Error(`Video ${v.id} cloze ${cloze.id} has empty hintVi`);
        }
        if (typeof cloze.timestamp !== 'number' || cloze.timestamp < 0 || cloze.timestamp > v.duration) {
          throw new Error(`Video ${v.id} cloze ${cloze.id} timestamp ${cloze.timestamp} out of bounds [0, ${v.duration}]`);
        }
        if (cloze.options) {
          if (cloze.options.length !== 4) {
            throw new Error(`Video ${v.id} cloze ${cloze.id} options length must be 4, found ${cloze.options.length}`);
          }
          const lowerOptions = cloze.options.map((o) => o.toLowerCase());
          if (!lowerOptions.includes(cloze.blankWord.toLowerCase())) {
            throw new Error(`Video ${v.id} cloze ${cloze.id} options do not contain blankWord '${cloze.blankWord}'`);
          }
          const uniqueOptions = new Set(lowerOptions);
          if (uniqueOptions.size !== 4) {
            throw new Error(`Video ${v.id} cloze ${cloze.id} contains duplicate options: ${cloze.options.join(', ')}`);
          }
        }
      }
    }
  });

  // PROBE 13: Comprehension Questions Pedagogical Integrity
  probe('Comprehension questions: >= 3 questions, 4 unique options, correctIndex 0-3, explanation >= 15 chars', () => {
    for (const v of allDetailVideos) {
      if (!Array.isArray(v.comprehensionQuestions) || v.comprehensionQuestions.length < 3) {
        throw new Error(`Video ${v.id} has fewer than 3 comprehension questions (${v.comprehensionQuestions?.length})`);
      }

      for (const q of v.comprehensionQuestions) {
        if (!q.id) throw new Error(`Video ${v.id} has quiz question without id`);
        if (!q.question || !q.question.trim()) {
          throw new Error(`Video ${v.id} quiz ${q.id} has empty question`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Video ${v.id} quiz ${q.id} must have exactly 4 options`);
        }
        const uniqueOpts = new Set(q.options.map((o) => o.trim().toLowerCase()));
        if (uniqueOpts.size !== 4) {
          throw new Error(`Video ${v.id} quiz ${q.id} has non-unique options: ${q.options.join(', ')}`);
        }
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
          throw new Error(`Video ${v.id} quiz ${q.id} has invalid correctIndex: ${q.correctIndex}`);
        }
        if (!q.explanation || q.explanation.trim().length < 15) {
          throw new Error(`Video ${v.id} quiz ${q.id} has missing or too short explanation (<15 chars)`);
        }
        if (typeof q.timestampSeek !== 'number' || q.timestampSeek < 0 || q.timestampSeek > v.duration) {
          throw new Error(`Video ${v.id} quiz ${q.id} timestampSeek ${q.timestampSeek} out of bounds [0, ${v.duration}]`);
        }
      }
    }
  });

  // PROBE 14: Deep Parity between details/*.json, videos.json, and videos-index.json
  probe('100% referential and metadata parity across details/*.json, videos.json, and videos-index.json', () => {
    const rawVideos = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
    const rawIndex = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf-8'));

    if (rawVideos.length !== 200) throw new Error(`videos.json length ${rawVideos.length} !== 200`);
    if (rawIndex.length !== 200) throw new Error(`videos-index.json length ${rawIndex.length} !== 200`);

    const videosMap = new Map<string, any>(rawVideos.map((v: any) => [v.id, v]));
    const indexMap = new Map<string, any>(rawIndex.map((v: any) => [v.id, v]));

    for (const detail of allDetailVideos) {
      const canon = videosMap.get(detail.id);
      if (!canon) throw new Error(`Detail video ${detail.id} not found in videos.json`);

      if (canon.youtubeId !== detail.youtubeId) throw new Error(`Mismatched youtubeId in ${detail.id}`);
      if (canon.duration !== detail.duration) throw new Error(`Mismatched duration in ${detail.id}`);
      if (canon.cefrLevel !== detail.cefrLevel) throw new Error(`Mismatched cefrLevel in ${detail.id}`);
      if (canon.topic !== detail.topic) throw new Error(`Mismatched topic in ${detail.id}`);
      if (canon.coreVocabulary.length !== detail.coreVocabulary.length) throw new Error(`Mismatched coreVocab length in ${detail.id}`);
      if (canon.transcript.length !== detail.transcript.length) throw new Error(`Mismatched transcript length in ${detail.id}`);

      const idxItem = indexMap.get(detail.id);
      if (!idxItem) throw new Error(`Detail video ${detail.id} not found in videos-index.json`);
      if (idxItem.youtubeId !== detail.youtubeId) throw new Error(`Index youtubeId mismatch for ${detail.id}`);
      if (idxItem.duration !== detail.duration) throw new Error(`Index duration mismatch for ${detail.id}`);
      if (idxItem.coreVocabularyCount !== detail.coreVocabulary.length) throw new Error(`Index vocab count mismatch for ${detail.id}`);
      if (idxItem.transcriptCuesCount !== detail.transcript.length) throw new Error(`Index transcript count mismatch for ${detail.id}`);
      if (idxItem.clozeCount !== detail.clozeItems.length) throw new Error(`Index cloze count mismatch for ${detail.id}`);
      if (idxItem.quizCount !== detail.comprehensionQuestions.length) throw new Error(`Index quiz count mismatch for ${detail.id}`);
    }
  });

  console.log('\n================================================================================');
  console.log('  CHALLENGER 1 AUDIT SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Probes Run : ${probeCount}`);
  console.log(`  Passed           : ${passCount}`);
  console.log(`  Failed           : ${errors.length}`);
  console.log('================================================================================\n');

  return { totalProbes: probeCount, passedProbes: passCount, failedProbes: errors.length, errors };
}

async function main() {
  const result = await runChallenger1Audit();
  if (result.failedProbes > 0) {
    console.error(`❌ VERDICT: REQUEST_CHANGES — ${result.failedProbes} probe(s) failed:`);
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log(`✅ VERDICT: APPROVE — All ${result.passedProbes}/${result.totalProbes} adversarial probes PASSED with 0 defects!`);
    process.exit(0);
  }
}

if (process.argv[1]?.includes('challenger-m1-1-adversarial-audit.test.ts')) {
  main().catch((err) => {
    console.error('Crash in audit runner:', err);
    process.exit(1);
  });
}
