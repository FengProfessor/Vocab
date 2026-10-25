/**
 * Independent Empirical Challenge Harness for Milestone 1
 * Pedagogical Content & Timestamp Monotonicity Integrity
 *
 * Challenger 2 Verification
 */

import * as fs from 'fs';
import * as path from 'path';

interface Cue {
  id: string;
  start: number;
  end: number;
  en: string;
  vi: string;
}

interface CoreVocab {
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
  options: string[];
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
  transcript: Cue[];
  coreVocabulary: CoreVocab[];
  clozeItems: ClozeItem[];
  comprehensionQuestions: ComprehensionQuestion[];
}

interface ListeningVideoIndexItem {
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
  coreVocabularyPreview: string[];
  coreVocabularyCount: number;
  transcriptCuesCount: number;
  clozeCount: number;
  quizCount: number;
}

interface TestFailure {
  category: string;
  videoId: string;
  detail: string;
}

async function runPedagogyAndTimingChallenge() {
  console.log('================================================================');
  console.log('CHALLENGER 2: EMPIRICAL STRESS-TEST & PEDAGOGICAL AUDIT');
  console.log('Auditing all 200 videos in canonical dataset and two-tier files');
  console.log('================================================================\n');

  const ROOT_DIR = path.resolve(__dirname, '..', '..');
  const VIDEOS_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos.json');
  const INDEX_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');
  const DETAILS_DIR = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');

  const failures: TestFailure[] = [];
  const warnings: TestFailure[] = [];

  // 0. Load Datasets
  if (!fs.existsSync(VIDEOS_PATH)) {
    throw new Error(`FATAL: Canonical dataset not found at ${VIDEOS_PATH}`);
  }
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`FATAL: Index dataset not found at ${INDEX_PATH}`);
  }
  if (!fs.existsSync(DETAILS_DIR)) {
    throw new Error(`FATAL: Details directory not found at ${DETAILS_DIR}`);
  }

  const canonicalVideos: ListeningVideo[] = JSON.parse(fs.readFileSync(VIDEOS_PATH, 'utf-8'));
  const indexVideos: ListeningVideoIndexItem[] = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

  console.log(`[DATA] Loaded ${canonicalVideos.length} canonical videos from videos.json`);
  console.log(`[DATA] Loaded ${indexVideos.length} index items from videos-index.json`);

  if (canonicalVideos.length !== 200) {
    failures.push({
      category: 'DATASET_SIZE',
      videoId: 'GLOBAL',
      detail: `Expected exactly 200 canonical videos, found ${canonicalVideos.length}`,
    });
  }
  if (indexVideos.length !== 200) {
    failures.push({
      category: 'INDEX_SIZE',
      videoId: 'GLOBAL',
      detail: `Expected exactly 200 index items, found ${indexVideos.length}`,
    });
  }

  // 1. Monotonic Timestamp Integrity
  console.log('\n--- SUITE 1: Monotonic Timestamp & Cue Timing Integrity ---');
  let totalCuesChecked = 0;
  for (const v of canonicalVideos) {
    if (!v.transcript || !Array.isArray(v.transcript)) {
      failures.push({ category: 'TRANSCRIPT', videoId: v.id, detail: 'Transcript missing or not an array' });
      continue;
    }

    if (v.transcript.length < 10) {
      failures.push({
        category: 'CUE_COUNT',
        videoId: v.id,
        detail: `Expected at least 10 cues, found ${v.transcript.length}`,
      });
    }

    let prevStart = -1;
    const cueIds = new Set<string>();

    for (let i = 0; i < v.transcript.length; i++) {
      const cue = v.transcript[i];
      totalCuesChecked++;

      // Cue ID uniqueness
      if (cueIds.has(cue.id)) {
        failures.push({ category: 'CUE_ID_DUP', videoId: v.id, detail: `Duplicate cue id: ${cue.id}` });
      }
      cueIds.add(cue.id);

      // Negative timestamp checks
      if (cue.start < 0) {
        failures.push({ category: 'NEGATIVE_START', videoId: v.id, detail: `Cue ${cue.id} has start < 0: ${cue.start}` });
      }
      if (cue.end < 0) {
        failures.push({ category: 'NEGATIVE_END', videoId: v.id, detail: `Cue ${cue.id} has end < 0: ${cue.end}` });
      }

      // start < end integrity
      if (cue.start >= cue.end) {
        failures.push({
          category: 'START_GTE_END',
          videoId: v.id,
          detail: `Cue ${cue.id} has start >= end (${cue.start} >= ${cue.end})`,
        });
      }

      // Monotonicity: start[i] >= start[i-1]
      if (cue.start < prevStart) {
        failures.push({
          category: 'MONOTONIC_ORDER',
          videoId: v.id,
          detail: `Cue ${cue.id} start (${cue.start}) < prev start (${prevStart}) at index ${i}`,
        });
      }
      prevStart = cue.start;

      // Duration upper bound sanity
      if (cue.start > v.duration) {
        failures.push({
          category: 'START_EXCEEDS_DURATION',
          videoId: v.id,
          detail: `Cue ${cue.id} start (${cue.start}) exceeds video duration (${v.duration})`,
        });
      }
      if (cue.end > v.duration + 5) {
        warnings.push({
          category: 'END_EXCEEDS_DURATION',
          videoId: v.id,
          detail: `Cue ${cue.id} end (${cue.end}) exceeds video duration (${v.duration}) by >5s`,
        });
      }

      // Non-degenerate duration
      if (cue.end - cue.start < 0.2) {
        failures.push({
          category: 'TINY_CUE',
          videoId: v.id,
          detail: `Cue ${cue.id} duration too small (<0.2s): ${cue.end - cue.start}`,
        });
      }

      // Non-empty text
      if (!cue.en || typeof cue.en !== 'string' || cue.en.trim().length === 0) {
        failures.push({ category: 'EMPTY_CUE_EN', videoId: v.id, detail: `Cue ${cue.id} has empty English text` });
      }
      if (!cue.vi || typeof cue.vi !== 'string' || cue.vi.trim().length === 0) {
        failures.push({ category: 'EMPTY_CUE_VI', videoId: v.id, detail: `Cue ${cue.id} has empty Vietnamese text` });
      }
    }
  }
  console.log(`[PASS CHECK] Checked ${totalCuesChecked} cues across 200 videos.`);

  // 2. Core Vocabulary Pedagogical Integrity
  console.log('\n--- SUITE 2: Core Vocabulary Pedagogical Integrity ---');
  let totalVocabChecked = 0;
  const ipaRegex = /^\/[^/]{2,}\/$/;
  for (const v of canonicalVideos) {
    if (!v.coreVocabulary || !Array.isArray(v.coreVocabulary)) {
      failures.push({ category: 'VOCAB_MISSING', videoId: v.id, detail: 'coreVocabulary missing or not array' });
      continue;
    }

    if (v.coreVocabulary.length < 3) {
      failures.push({
        category: 'VOCAB_COUNT',
        videoId: v.id,
        detail: `Expected >= 3 vocab items, found ${v.coreVocabulary.length}`,
      });
    }

    const wordsInVideo = new Set<string>();

    for (let i = 0; i < v.coreVocabulary.length; i++) {
      const vocab = v.coreVocabulary[i];
      totalVocabChecked++;

      // Word non-empty
      if (!vocab.word || typeof vocab.word !== 'string' || vocab.word.trim().length === 0) {
        failures.push({ category: 'EMPTY_WORD', videoId: v.id, detail: `Vocab item ${i} has empty word` });
      }

      // Uniqueness within video
      const lowerWord = (vocab.word || '').toLowerCase();
      if (wordsInVideo.has(lowerWord)) {
        failures.push({
          category: 'DUPLICATE_VOCAB_WORD',
          videoId: v.id,
          detail: `Duplicate vocab word in video: '${vocab.word}'`,
        });
      }
      wordsInVideo.add(lowerWord);

      // Phonetic valid in /.../
      if (!vocab.phonetic || typeof vocab.phonetic !== 'string') {
        failures.push({
          category: 'MISSING_PHONETIC',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' missing phonetic`,
        });
      } else if (!ipaRegex.test(vocab.phonetic.trim())) {
        failures.push({
          category: 'INVALID_PHONETIC',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' phonetic does not match /.../ regex: '${vocab.phonetic}'`,
        });
      } else if (
        vocab.phonetic.includes('/.../') ||
        vocab.phonetic.includes('/IPA/') ||
        vocab.phonetic.toLowerCase().includes('todo')
      ) {
        failures.push({
          category: 'PLACEHOLDER_PHONETIC',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' has placeholder phonetic: '${vocab.phonetic}'`,
        });
      }

      // viDefinition non-empty
      if (!vocab.viDefinition || typeof vocab.viDefinition !== 'string' || vocab.viDefinition.trim().length === 0) {
        failures.push({
          category: 'EMPTY_VI_DEFINITION',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' has empty viDefinition`,
        });
      }

      // contextSentence non-empty
      if (
        !vocab.contextSentence ||
        typeof vocab.contextSentence !== 'string' ||
        vocab.contextSentence.trim().length === 0
      ) {
        failures.push({
          category: 'EMPTY_CONTEXT_SENTENCE',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' has empty contextSentence`,
        });
      } else if (vocab.contextSentence.trim().length < 10) {
        warnings.push({
          category: 'SHORT_CONTEXT_SENTENCE',
          videoId: v.id,
          detail: `Vocab '${vocab.word}' contextSentence unusually short (<10 chars): '${vocab.contextSentence}'`,
        });
      }
    }
  }
  console.log(`[PASS CHECK] Checked ${totalVocabChecked} core vocabulary entries across 200 videos.`);

  // 3. Cloze Exercises Pedagogical Integrity
  console.log('\n--- SUITE 3: Cloze Exercises Pedagogical Integrity ---');
  let totalClozeChecked = 0;
  for (const v of canonicalVideos) {
    if (!v.clozeItems || !Array.isArray(v.clozeItems)) {
      failures.push({ category: 'CLOZE_MISSING', videoId: v.id, detail: 'clozeItems missing or not array' });
      continue;
    }

    if (v.clozeItems.length < 3) {
      failures.push({
        category: 'CLOZE_COUNT',
        videoId: v.id,
        detail: `Expected >= 3 cloze items, found ${v.clozeItems.length}`,
      });
    }

    for (let i = 0; i < v.clozeItems.length; i++) {
      const cloze = v.clozeItems[i];
      totalClozeChecked++;

      // Sentence contains '{{blank}}'
      if (!cloze.sentence || typeof cloze.sentence !== 'string') {
        failures.push({ category: 'CLOZE_NO_SENTENCE', videoId: v.id, detail: `Cloze ${cloze.id} has no sentence` });
      } else if (!cloze.sentence.includes('{{blank}}')) {
        failures.push({
          category: 'CLOZE_MISSING_BLANK',
          videoId: v.id,
          detail: `Cloze ${cloze.id} sentence lacks '{{blank}}': '${cloze.sentence}'`,
        });
      }

      // blankWord non-empty
      if (!cloze.blankWord || typeof cloze.blankWord !== 'string' || cloze.blankWord.trim().length === 0) {
        failures.push({ category: 'EMPTY_BLANK_WORD', videoId: v.id, detail: `Cloze ${cloze.id} has empty blankWord` });
      }

      // Exactly 4 options
      if (!cloze.options || !Array.isArray(cloze.options)) {
        failures.push({ category: 'CLOZE_OPTIONS_NOT_ARRAY', videoId: v.id, detail: `Cloze ${cloze.id} options invalid` });
      } else {
        if (cloze.options.length !== 4) {
          failures.push({
            category: 'CLOZE_OPTIONS_COUNT',
            videoId: v.id,
            detail: `Cloze ${cloze.id} options count is ${cloze.options.length}, expected 4`,
          });
        }

        // All 4 options non-empty strings
        for (let optIdx = 0; optIdx < cloze.options.length; optIdx++) {
          const opt = cloze.options[optIdx];
          if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
            failures.push({
              category: 'CLOZE_EMPTY_OPTION',
              videoId: v.id,
              detail: `Cloze ${cloze.id} option[${optIdx}] is empty`,
            });
          }
        }

        // All 4 options distinct (no duplicate options)
        const optSet = new Set(cloze.options.map((o) => (o || '').trim().toLowerCase()));
        if (optSet.size !== cloze.options.length) {
          failures.push({
            category: 'CLOZE_DUPLICATE_OPTIONS',
            videoId: v.id,
            detail: `Cloze ${cloze.id} contains duplicate options: [${cloze.options.join(', ')}]`,
          });
        }

        // Options include blankWord
        const hasBlankWord = cloze.options.some(
          (opt) => (opt || '').trim().toLowerCase() === (cloze.blankWord || '').trim().toLowerCase()
        );
        if (!hasBlankWord) {
          failures.push({
            category: 'CLOZE_OPTIONS_MISSING_BLANKWORD',
            videoId: v.id,
            detail: `Cloze ${cloze.id} options do not include blankWord '${cloze.blankWord}'. Options: [${cloze.options.join(', ')}]`,
          });
        }
      }

      // Timestamp validity
      if (typeof cloze.timestamp !== 'number' || cloze.timestamp < 0 || cloze.timestamp > v.duration) {
        failures.push({
          category: 'CLOZE_INVALID_TIMESTAMP',
          videoId: v.id,
          detail: `Cloze ${cloze.id} timestamp (${cloze.timestamp}) out of bounds [0, ${v.duration}]`,
        });
      }

      // hintVi validity
      if (!cloze.hintVi || typeof cloze.hintVi !== 'string' || cloze.hintVi.trim().length === 0) {
        warnings.push({
          category: 'CLOZE_EMPTY_HINT',
          videoId: v.id,
          detail: `Cloze ${cloze.id} has empty hintVi`,
        });
      }
    }
  }
  console.log(`[PASS CHECK] Checked ${totalClozeChecked} cloze exercises across 200 videos.`);

  // 4. Comprehension Quizzes Integrity
  console.log('\n--- SUITE 4: Comprehension Quizzes Integrity ---');
  let totalQuizzesChecked = 0;
  for (const v of canonicalVideos) {
    if (!v.comprehensionQuestions || !Array.isArray(v.comprehensionQuestions)) {
      failures.push({ category: 'QUIZ_MISSING', videoId: v.id, detail: 'comprehensionQuestions missing or not array' });
      continue;
    }

    if (v.comprehensionQuestions.length < 3) {
      failures.push({
        category: 'QUIZ_COUNT',
        videoId: v.id,
        detail: `Expected >= 3 comprehension questions, found ${v.comprehensionQuestions.length}`,
      });
    }

    for (let i = 0; i < v.comprehensionQuestions.length; i++) {
      const q = v.comprehensionQuestions[i];
      totalQuizzesChecked++;

      // Question text non-empty
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 5) {
        failures.push({
          category: 'EMPTY_QUESTION',
          videoId: v.id,
          detail: `Quiz ${q.id} question is empty or too short: '${q.question}'`,
        });
      }

      // Exactly 4 options
      if (!q.options || !Array.isArray(q.options)) {
        failures.push({ category: 'QUIZ_OPTIONS_NOT_ARRAY', videoId: v.id, detail: `Quiz ${q.id} options invalid` });
      } else {
        if (q.options.length !== 4) {
          failures.push({
            category: 'QUIZ_OPTIONS_COUNT',
            videoId: v.id,
            detail: `Quiz ${q.id} options count is ${q.options.length}, expected 4`,
          });
        }

        // Distinct options
        const optSet = new Set(q.options.map((o) => (o || '').trim()));
        if (optSet.size !== q.options.length) {
          failures.push({
            category: 'QUIZ_DUPLICATE_OPTIONS',
            videoId: v.id,
            detail: `Quiz ${q.id} contains duplicate options: [${q.options.join(' | ')}]`,
          });
        }

        // All options non-empty
        for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
          const opt = q.options[optIdx];
          if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
            failures.push({
              category: 'QUIZ_EMPTY_OPTION',
              videoId: v.id,
              detail: `Quiz ${q.id} option[${optIdx}] is empty`,
            });
          }
        }
      }

      // correctIndex in [0, 3]
      if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
        failures.push({
          category: 'INVALID_CORRECT_INDEX',
          videoId: v.id,
          detail: `Quiz ${q.id} correctIndex is '${q.correctIndex}', expected integer in [0, 3]`,
        });
      }

      // explanation >= 15 chars
      if (!q.explanation || typeof q.explanation !== 'string') {
        failures.push({
          category: 'MISSING_EXPLANATION',
          videoId: v.id,
          detail: `Quiz ${q.id} explanation is missing or not a string`,
        });
      } else if (q.explanation.trim().length < 15) {
        failures.push({
          category: 'SHORT_EXPLANATION',
          videoId: v.id,
          detail: `Quiz ${q.id} explanation length is ${q.explanation.trim().length} (< 15 chars): '${q.explanation}'`,
        });
      }

      // timestampSeek within [0, duration]
      if (typeof q.timestampSeek !== 'number' || isNaN(q.timestampSeek) || q.timestampSeek < 0 || q.timestampSeek > v.duration) {
        failures.push({
          category: 'INVALID_TIMESTAMP_SEEK',
          videoId: v.id,
          detail: `Quiz ${q.id} timestampSeek (${q.timestampSeek}) out of bounds [0, ${v.duration}]`,
        });
      }
    }
  }
  console.log(`[PASS CHECK] Checked ${totalQuizzesChecked} comprehension questions across 200 videos.`);

  // 5. Parity between Canonical, Index, and Details
  console.log('\n--- SUITE 5: Parity & Consistency Between Canonical, Index & Details ---');
  for (let i = 0; i < canonicalVideos.length; i++) {
    const v = canonicalVideos[i];
    const indexItem = indexVideos.find((item) => item.id === v.id);

    if (!indexItem) {
      failures.push({
        category: 'MISSING_IN_INDEX',
        videoId: v.id,
        detail: `Video ${v.id} in videos.json is missing in videos-index.json`,
      });
      continue;
    }

    // Parity of counts
    if (indexItem.coreVocabularyCount !== v.coreVocabulary.length) {
      failures.push({
        category: 'COUNT_MISMATCH_VOCAB',
        videoId: v.id,
        detail: `Index vocab count (${indexItem.coreVocabularyCount}) != canonical (${v.coreVocabulary.length})`,
      });
    }
    if (indexItem.transcriptCuesCount !== v.transcript.length) {
      failures.push({
        category: 'COUNT_MISMATCH_CUES',
        videoId: v.id,
        detail: `Index cues count (${indexItem.transcriptCuesCount}) != canonical (${v.transcript.length})`,
      });
    }
    if (indexItem.clozeCount !== v.clozeItems.length) {
      failures.push({
        category: 'COUNT_MISMATCH_CLOZE',
        videoId: v.id,
        detail: `Index cloze count (${indexItem.clozeCount}) != canonical (${v.clozeItems.length})`,
      });
    }
    if (indexItem.quizCount !== v.comprehensionQuestions.length) {
      failures.push({
        category: 'COUNT_MISMATCH_QUIZ',
        videoId: v.id,
        detail: `Index quiz count (${indexItem.quizCount}) != canonical (${v.comprehensionQuestions.length})`,
      });
    }

    // Check detail file exists and is identical
    const detailFilePath = path.join(DETAILS_DIR, `${v.id}.json`);
    if (!fs.existsSync(detailFilePath)) {
      failures.push({
        category: 'MISSING_DETAIL_FILE',
        videoId: v.id,
        detail: `Detail file does not exist at ${detailFilePath}`,
      });
    } else {
      const detailRaw = fs.readFileSync(detailFilePath, 'utf-8');
      const detailVideo: ListeningVideo = JSON.parse(detailRaw);

      if (detailVideo.id !== v.id || detailVideo.youtubeId !== v.youtubeId) {
        failures.push({
          category: 'DETAIL_CONTENT_MISMATCH',
          videoId: v.id,
          detail: `Detail file ID or youtubeId does not match canonical`,
        });
      }
      if (detailVideo.transcript.length !== v.transcript.length) {
        failures.push({
          category: 'DETAIL_CUES_MISMATCH',
          videoId: v.id,
          detail: `Detail cues count (${detailVideo.transcript.length}) != canonical (${v.transcript.length})`,
        });
      }
    }

    // durationDisplay sanity
    const expectedMinutes = Math.floor(v.duration / 60);
    const expectedSeconds = v.duration % 60;
    const expectedDisplay = `${expectedMinutes.toString().padStart(2, '0')}:${expectedSeconds.toString().padStart(2, '0')}`;
    if (v.durationDisplay !== expectedDisplay) {
      warnings.push({
        category: 'DURATION_DISPLAY_FORMAT',
        videoId: v.id,
        detail: `durationDisplay is '${v.durationDisplay}', mathematical MM:SS is '${expectedDisplay}'`,
      });
    }
  }
  console.log('[PASS CHECK] Two-tier architecture parity and count accuracy verified.');

  // Summary Report
  console.log('\n================================================================');
  console.log('CHALLENGE AUDIT EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Total Videos Audited: ${canonicalVideos.length}`);
  console.log(`Total Cues Checked: ${totalCuesChecked}`);
  console.log(`Total Core Vocabulary Checked: ${totalVocabChecked}`);
  console.log(`Total Cloze Exercises Checked: ${totalClozeChecked}`);
  console.log(`Total Quizzes Checked: ${totalQuizzesChecked}`);
  console.log(`Total Strict Failures: ${failures.length}`);
  console.log(`Total Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS (Informational) ---');
    for (const w of warnings.slice(0, 10)) {
      console.log(`[WARN] [${w.category}] ${w.videoId}: ${w.detail}`);
    }
    if (warnings.length > 10) {
      console.log(`... and ${warnings.length - 10} more warnings.`);
    }
  }

  if (failures.length > 0) {
    console.error('\n--- CRITICAL FAILURES FOUND ---');
    for (const f of failures) {
      console.error(`[FAIL] [${f.category}] ${f.videoId}: ${f.detail}`);
    }
    console.error(`\n🚨 AUDIT VERDICT: REQUEST_CHANGES (${failures.length} defects detected)`);
    process.exit(1);
  } else {
    console.log('\n🏆 AUDIT VERDICT: APPROVE');
    console.log('100% of all 200 videos satisfy all pedagogical, timing, and structural constraints with ZERO defects.');
  }
}

runPedagogyAndTimingChallenge().catch((err) => {
  console.error('Unhandled execution error:', err);
  process.exit(1);
});
