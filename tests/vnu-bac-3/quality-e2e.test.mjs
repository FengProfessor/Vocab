/**
 * COMPREHENSIVE QUALITY E2E VERIFICATION SUITE — VNU TEST BẬC 3 (ULIS - ĐHQGHN)
 * File: tests/vnu-bac-3/quality-e2e.test.mjs
 *
 * 4 Pillars of Comprehensive Quality Verification:
 * - Pillar 1: Physical Audio Verification (9 MP3s in public/audio/vnu-bac3/, size > 20KB, valid ID3/MPEG headers)
 * - Pillar 2: 4-Skill Data & Schema Verification (Reading 25 Qs, Listening 20 Qs, Writing minWords 80/100, Speaking Cue Cards, 100% vocab notes)
 * - Pillar 3: API & Zero Bulk Leaks Security (Data sanitization, HMAC session tokens, watermarking, barem grading engine)
 * - Pillar 4: UI & Navigation Integration (/vstep navigation banner, component contracts of VnuExamRoom, VnuSplitPane, VnuQuestionPalette, VnuAudioPlayer)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Production Module Imports
import {
  roundToHalf,
  calculateVnuReadingScore,
  calculateVnuListeningScore,
  calculateVnuOverallScore,
  checkVnuPassCriteria,
  gradeVnuBac3Exam,
  normalizeAnswerKey,
} from '../../src/lib/vnu-bac-3/scoring.ts';

import {
  SENSITIVE_VNU_KEYS,
  stripSensitiveVnuData,
  createVnuSessionToken,
  verifyVnuSessionToken,
  embedInvisibleWatermark,
  getRawVnuBac3Exam,
  getVnuBac3Catalog,
} from '../../src/lib/vnu-bac-3/loader.ts';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data', 'vnu-bac-3');
const AUDIO_DIR = path.join(ROOT_DIR, 'public', 'audio', 'vnu-bac3');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'src', 'components', 'vnu-bac-3');
const VSTEP_PAGE_PATH = path.join(ROOT_DIR, 'src', 'app', 'vstep', 'page.tsx');

console.log('========================================================================');
console.log('   VNU TEST BẬC 3 (ULIS ĐHQGHN) — COMPREHENSIVE QUALITY E2E TEST SUITE   ');
console.log('========================================================================\n');

// ============================================================================
// PILLAR 1: PHYSICAL AUDIO VERIFICATION
// ============================================================================
console.log('>>> PILLAR 1: Physical Audio Verification');

assert.ok(fs.existsSync(AUDIO_DIR), `Audio base directory must exist at ${AUDIO_DIR}`);

const primaryAudioFolders = [
  'sample-01',
  'vnupress-mock-01',
  'vnupress-practice-02',
  'equiv-01',
  'equiv-02',
  'test-03',
  'test-04',
  'test-05',
  'test-06',
  'test-07',
  'test-08',
  'test-09',
  'test-10',
];
let totalVerifiedAudioFiles = 0;

for (const folder of primaryAudioFolders) {
  const folderPath = path.join(AUDIO_DIR, folder);
  assert.ok(fs.existsSync(folderPath), `Audio folder ${folder} must exist`);

  for (let part = 1; part <= 3; part++) {
    const filename = `listening-part${part}.mp3`;
    const audioFilePath = path.join(folderPath, filename);

    // 1. Physical existence
    assert.ok(
      fs.existsSync(audioFilePath),
      `Audio file ${folder}/${filename} must exist on disk`
    );

    // 2. File size verification (> 20KB threshold)
    const stats = fs.statSync(audioFilePath);
    const minSizeBytes = 20 * 1024; // 20KB
    assert.ok(
      stats.size > minSizeBytes,
      `Audio file ${folder}/${filename} size (${stats.size} bytes) must exceed 20KB threshold (${minSizeBytes} bytes)`
    );

    // 3. Audio Header Verification (ID3v2 or MPEG sync header)
    const fd = fs.openSync(audioFilePath, 'r');
    const headerBuf = Buffer.alloc(10);
    fs.readSync(fd, headerBuf, 0, 10, 0);
    fs.closeSync(fd);

    const isId3 =
      headerBuf[0] === 0x49 && // 'I'
      headerBuf[1] === 0x44 && // 'D'
      headerBuf[2] === 0x33;   // '3'

    const isMpegSync =
      headerBuf[0] === 0xff &&
      (headerBuf[1] & 0xe0) === 0xe0;

    assert.ok(
      isId3 || isMpegSync,
      `Audio file ${folder}/${filename} must have valid ID3 or MPEG sync header (got: ${headerBuf.toString('hex')})`
    );

    totalVerifiedAudioFiles++;
    console.log(
      `  [PASS] ${folder}/${filename} — Size: ${(stats.size / 1024).toFixed(1)} KB, Header: ${
        isId3 ? 'ID3v2.' + headerBuf[3] : 'MPEG Sync'
      }`
    );
  }
}

// Check aliases (pet-01, pet-02) if present
const aliasFolders = ['pet-01', 'pet-02'];
for (const alias of aliasFolders) {
  const aliasPath = path.join(AUDIO_DIR, alias);
  if (fs.existsSync(aliasPath)) {
    for (let part = 1; part <= 3; part++) {
      const aliasFile = path.join(aliasPath, `listening-part${part}.mp3`);
      assert.ok(fs.existsSync(aliasFile), `Alias file ${alias}/listening-part${part}.mp3 must exist`);
      const st = fs.statSync(aliasFile);
      assert.ok(st.size > 20 * 1024, `Alias file ${alias} size must be > 20KB`);
    }
    console.log(`  [PASS] Alias directory ${alias}/ verified for legacy audio URL compatibility.`);
  }
}

assert.equal(totalVerifiedAudioFiles, 39, 'Exactly 39 primary listening MP3 files must be verified');
console.log('✓ Pillar 1 Complete: 39/39 Physical MP3 Audio files verified with valid headers & size > 20KB.\n');

// ============================================================================
// PILLAR 2: 4-SKILL DATA & SCHEMA VERIFICATION
// ============================================================================
console.log('>>> PILLAR 2: 4-Skill Data & Schema Verification');

const examFilenames = [
  'ulis-sample-test-01.json',
  'vnupress-official-mock-01.json',
  'vnupress-official-practice-02.json',
  'cambridge-pet-equiv-01.json',
  'cambridge-pet-equiv-02.json',
  'vnu-bac3-test-03.json',
  'vnu-bac3-test-04.json',
  'vnu-bac3-test-05.json',
  'vnu-bac3-test-06.json',
  'vnu-bac3-test-07.json',
  'vnu-bac3-test-08.json',
  'vnu-bac3-test-09.json',
  'vnu-bac3-test-10.json',
];

let grandTotalVocabNotes = 0;
let grandTotalReadingQuestions = 0;
let grandTotalListeningQuestions = 0;

for (const examFile of examFilenames) {
  const fullExamPath = path.join(DATA_DIR, examFile);
  assert.ok(fs.existsSync(fullExamPath), `Exam JSON file ${examFile} must exist`);

  const examData = JSON.parse(fs.readFileSync(fullExamPath, 'utf8'));

  // Root properties
  assert.ok(examData.id && typeof examData.id === 'string', `${examFile}: id must be non-empty string`);
  assert.ok(examData.title && typeof examData.title === 'string', `${examFile}: title must be non-empty string`);
  assert.ok(examData.durationMinutes >= 65, `${examFile}: durationMinutes must be >= 65 minutes`);
  assert.equal(examData.totalQuestions, 45, `${examFile}: totalQuestions (objective R+L) must be exactly 45`);

  // Sections presence (All 4 skills)
  const readingSection = examData.sections.find((s) => s.type === 'reading');
  const listeningSection = examData.sections.find((s) => s.type === 'listening');
  const writingSection = examData.sections.find((s) => s.type === 'writing');
  const speakingSection = examData.sections.find((s) => s.type === 'speaking');

  assert.ok(readingSection, `${examFile}: Must contain reading section`);
  assert.ok(listeningSection, `${examFile}: Must contain listening section`);
  assert.ok(writingSection, `${examFile}: Must contain writing section`);
  assert.ok(speakingSection, `${examFile}: Must contain speaking section`);

  // --- 2.1 READING SECTION VERIFICATION (25 Questions) ---
  assert.equal(readingSection.totalQuestions, 25, `${examFile}: Reading totalQuestions must be 25`);
  assert.equal(readingSection.tasks.length, 4, `${examFile}: Reading must have 4 tasks`);

  let examReadingQCount = 0;
  let examReadingVocabCount = 0;

  for (const task of readingSection.tasks) {
    assert.ok(task.instructions, `${examFile} Reading task ${task.id} must have instructions`);
    for (const q of task.questions) {
      examReadingQCount++;
      grandTotalReadingQuestions++;

      assert.equal(q.questionNumber, examReadingQCount, `${examFile}: Reading Q numbers must be sequential 1..25`);
      assert.ok(q.prompt && q.prompt.length > 0, `${examFile} Q${q.id}: prompt must not be empty`);
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `${examFile} Q${q.id}: options must be >= 2`);
      assert.ok(['A', 'B', 'C'].includes(q.correctAnswer), `${examFile} Q${q.id}: correctAnswer must be A, B, or C`);
      assert.ok(q.explanationVi && q.explanationVi.length >= 15, `${examFile} Q${q.id}: explanationVi must be substantial`);

      // 100% vocabulary notes verification
      assert.ok(
        Array.isArray(q.vocabularyNotes) && q.vocabularyNotes.length > 0,
        `${examFile} Reading Q${q.id} MUST have vocabularyNotes array`
      );
      for (const vn of q.vocabularyNotes) {
        assert.ok(vn.word && vn.word.length > 0, `${examFile} Q${q.id} vocabulary item must have word`);
        assert.ok(vn.meaning || vn.meaningVi, `${examFile} Q${q.id} vocabulary item must have meaning`);
        grandTotalVocabNotes++;
      }
      examReadingVocabCount++;
    }
  }
  assert.equal(examReadingQCount, 25, `${examFile}: Total verified Reading questions must be 25`);
  assert.equal(examReadingVocabCount, 25, `${examFile}: 100% of Reading questions must have vocabulary notes`);

  // --- 2.2 LISTENING SECTION VERIFICATION (20 Questions & Audio Links) ---
  assert.equal(listeningSection.totalQuestions, 20, `${examFile}: Listening totalQuestions must be 20`);
  assert.equal(listeningSection.tasks.length, 3, `${examFile}: Listening must have 3 tasks`);

  let examListeningQCount = 0;
  let examListeningVocabCount = 0;

  for (const task of listeningSection.tasks) {
    const audioUrl = task.media?.audioUrl || task.audioUrl;
    assert.ok(audioUrl, `${examFile} Listening task ${task.id} must specify audioUrl (in task.media or task)`);
    assert.ok(task.transcript && task.transcript.length > 50, `${examFile} task ${task.id} must have transcript`);

    // Verify audioUrl matches a real file in public/
    const publicAudioPath = path.join(ROOT_DIR, 'public', audioUrl.replace(/^\//, ''));
    assert.ok(
      fs.existsSync(publicAudioPath),
      `${examFile} task ${task.id} audioUrl '${audioUrl}' must point to an existing file at ${publicAudioPath}`
    );

    for (const q of task.questions) {
      examListeningQCount++;
      grandTotalListeningQuestions++;

      assert.equal(q.questionNumber, examListeningQCount, `${examFile}: Listening Q numbers must be sequential 1..20`);
      assert.ok(q.prompt && q.prompt.length > 0, `${examFile} Q${q.id}: prompt must not be empty`);
      assert.ok(Array.isArray(q.options) && q.options.length >= 2, `${examFile} Q${q.id}: options must be >= 2`);
      assert.ok(['A', 'B', 'C'].includes(q.correctAnswer), `${examFile} Q${q.id}: correctAnswer must be A, B, or C`);
      assert.ok(q.explanationVi && q.explanationVi.length >= 15, `${examFile} Q${q.id}: explanationVi must be substantial`);

      // 100% vocabulary notes verification
      assert.ok(
        Array.isArray(q.vocabularyNotes) && q.vocabularyNotes.length > 0,
        `${examFile} Listening Q${q.id} MUST have vocabularyNotes array`
      );
      for (const vn of q.vocabularyNotes) {
        assert.ok(vn.word && vn.word.length > 0, `${examFile} Q${q.id} vocabulary item must have word`);
        assert.ok(vn.meaning || vn.meaningVi, `${examFile} Q${q.id} vocabulary item must have meaning`);
        grandTotalVocabNotes++;
      }
      examListeningVocabCount++;
    }
  }
  assert.equal(examListeningQCount, 20, `${examFile}: Total verified Listening questions must be 20`);
  assert.equal(examListeningVocabCount, 20, `${examFile}: 100% of Listening questions must have vocabulary notes`);

  // --- 2.3 WRITING SECTION VERIFICATION (2 Tasks: 80 & 100 words with sample answers) ---
  assert.equal(writingSection.tasks.length, 2, `${examFile}: Writing must have 2 tasks`);

  const task1 = writingSection.tasks[0];
  const task2 = writingSection.tasks[1];

  const wp1 = task1.writingPrompts?.[0];
  const wp2 = task2.writingPrompts?.[0];

  assert.ok(wp1, `${examFile}: Writing Task 1 must have writingPrompts[0]`);
  assert.ok(wp2, `${examFile}: Writing Task 2 must have writingPrompts[0]`);

  assert.equal(wp1.minWords, 80, `${examFile}: Writing Task 1 minWords must be 80`);
  assert.equal(wp2.minWords, 100, `${examFile}: Writing Task 2 minWords must be 100`);

  const wp1WordCount = (wp1.sampleAnswer || '').trim().split(/\s+/).filter(Boolean).length;
  const wp2WordCount = (wp2.sampleAnswer || '').trim().split(/\s+/).filter(Boolean).length;

  assert.ok(
    wp1WordCount >= 80,
    `${examFile}: Writing Task 1 sampleAnswer must have >= 80 words (got ${wp1WordCount})`
  );
  assert.ok(
    wp2WordCount >= 100,
    `${examFile}: Writing Task 2 sampleAnswer must have >= 100 words (got ${wp2WordCount})`
  );

  // --- 2.4 SPEAKING SECTION VERIFICATION (2 Parts: Social Interaction & Cue Cards) ---
  assert.equal(speakingSection.tasks.length, 2, `${examFile}: Speaking must have 2 parts`);

  const speakingPart1 = speakingSection.tasks[0];
  const speakingPart2 = speakingSection.tasks[1];

  const sp1Prompt = speakingPart1.speakingPrompts?.[0];
  const sp2Prompt = speakingPart2.speakingPrompts?.[0];

  assert.ok(sp1Prompt, `${examFile}: Speaking Part 1 must have speakingPrompts[0]`);
  assert.ok(sp2Prompt, `${examFile}: Speaking Part 2 must have speakingPrompts[0]`);

  assert.ok(
    Array.isArray(sp1Prompt.questions) && sp1Prompt.questions.length >= 3,
    `${examFile}: Speaking Part 1 must have >= 3 social interaction questions`
  );

  assert.ok(
    Array.isArray(sp2Prompt.cueCards) && sp2Prompt.cueCards.length >= 2,
    `${examFile}: Speaking Part 2 must have >= 2 cue cards`
  );

  for (const card of sp2Prompt.cueCards) {
    assert.ok(card.title, `${examFile} cue card must have title`);
    assert.ok(Array.isArray(card.prompts) && card.prompts.length >= 2, `${examFile} cue card must have prompts`);
    assert.ok(
      card.sampleResponse && card.sampleResponse.trim().split(/\s+/).length >= 40,
      `${examFile} cue card '${card.code}' must have a substantial B1 sampleResponse (>= 40 words)`
    );
  }

  console.log(
    `  [PASS] ${examFile} verified: R(25 Qs / 100% vocab) + L(20 Qs / 100% vocab) + W(2 tasks: ${wp1WordCount}/${wp2WordCount} words) + S(2 parts: questions + Cue Cards with sampleResponse)`
  );
}

// Check Catalog JSON & 4-Stage Ordering Parity
const catalogJsonPath = path.join(DATA_DIR, 'vnu-bac-3-catalog.json');
assert.ok(fs.existsSync(catalogJsonPath), 'vnu-bac-3-catalog.json must exist');
const catalogList = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf8'));
assert.equal(catalogList.length, 13, 'Catalog must list all 13 exams');

const validStageIds = new Set([
  'stage-1-diagnostic',
  'stage-2-official-practice',
  'stage-3-b1-drills',
  'stage-4-final-mock',
]);

const seenPart2Titles = new Set();
const seenPart3Titles = new Set();
const seenPart4Titles = new Set();
const seenWritingTask1Titles = new Set();
const seenWritingTask2Topics = new Set();
const seenSpeakingPart1Questions = new Set();
const seenSpeakingPart2CueCards = new Set();

catalogList.forEach((item, index) => {
  assert.equal(item.orderNumber, index + 1, `Catalog item ${item.id} orderNumber must be ${index + 1}`);
  assert.ok(validStageIds.has(item.stageId), `Catalog item ${item.id} must have valid stageId`);
  assert.ok(item.recommendedSession && item.recommendedSession.length > 5, `${item.id} must have recommendedSession`);
  assert.ok(item.grammarFocus && item.grammarFocus.length > 5, `${item.id} must have grammarFocus`);

  const rawExamJson = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${item.id}.json`), 'utf8'));
  assert.equal(rawExamJson.title, item.title, `Title in ${item.id}.json must match catalog title`);
  assert.equal(rawExamJson.description, item.description, `Description in ${item.id}.json must match catalog description`);

  const readingSec = rawExamJson.sections.find((s) => (s.skill || s.type) === 'reading');
  const p2Title = readingSec.tasks[1].passage.title;
  const p3Title = readingSec.tasks[2].passage.title;
  const p4Title = readingSec.tasks[3].passage.title;

  assert.equal(seenPart2Titles.has(p2Title), false, `Duplicate Reading Part 2 title '${p2Title}' in ${item.id}`);
  assert.equal(seenPart3Titles.has(p3Title), false, `Duplicate Reading Part 3 title '${p3Title}' in ${item.id}`);
  assert.equal(seenPart4Titles.has(p4Title), false, `Duplicate Reading Part 4 title '${p4Title}' in ${item.id}`);
  seenPart2Titles.add(p2Title);
  seenPart3Titles.add(p3Title);
  seenPart4Titles.add(p4Title);

  const writingSec = rawExamJson.sections.find((s) => (s.skill || s.type) === 'writing');
  const wt1Title = writingSec ? writingSec.tasks[0].title : rawExamJson.writingPrompts[0].title;
  assert.equal(seenWritingTask1Titles.has(wt1Title), false, `Duplicate Writing Task 1 title '${wt1Title}' in ${item.id}`);
  seenWritingTask1Titles.add(wt1Title);

  const wt2Choices = writingSec.tasks[1].writingPrompts[0].topicChoices;
  for (const choice of wt2Choices) {
    const topicText = choice.topic || choice.prompt;
    assert.ok(topicText, `Writing Task 2 topic must not be empty in ${item.id}`);
    assert.equal(seenWritingTask2Topics.has(topicText), false, `Duplicate Writing Task 2 topic '${topicText}' in ${item.id}`);
    seenWritingTask2Topics.add(topicText);
  }

  const speakingSec = rawExamJson.sections.find((s) => (s.skill || s.type) === 'speaking');
  const sp1Questions = speakingSec.tasks[0].speakingPrompts[0].questions;
  for (const qText of sp1Questions) {
    assert.equal(seenSpeakingPart1Questions.has(qText), false, `Duplicate Speaking Part 1 question '${qText}' in ${item.id}`);
    seenSpeakingPart1Questions.add(qText);
  }
  const sp2Cards = speakingSec.tasks[1].speakingPrompts[0].cueCards;
  for (const card of sp2Cards) {
    assert.equal(seenSpeakingPart2CueCards.has(card.title), false, `Duplicate Speaking Part 2 cue card '${card.title}' in ${item.id}`);
    seenSpeakingPart2CueCards.add(card.title);
  }

  if (item.id === 'vnu-bac3-test-10') {
    assert.equal(
      writingSec.tasks[0].title,
      'Task 1: A Wonderful Holiday Experience in Da Nang',
      'vnu-bac3-test-10 writing-task1 title must match Da Nang holiday prompt'
    );
  }
});
console.log('  [PASS] vnu-bac-3-catalog.json verified: 13 exams in strict 01..13 order, 100% title/description parity, 0 duplicate passages/prompts.');

// Check 240 Vocabulary JSON (8 Topics x 30 Words + 4 Sign Keyword Groups)
const vocab240Path = path.join(DATA_DIR, 'vnupress-vocabulary-240.json');
assert.ok(fs.existsSync(vocab240Path), 'vnupress-vocabulary-240.json must exist');
const vocab240Data = JSON.parse(fs.readFileSync(vocab240Path, 'utf8'));
assert.equal(vocab240Data.topics.length, 8, 'vnupress-vocabulary-240.json must have 8 official topics');
let totalStructuredWords = 0;
for (const topic of vocab240Data.topics) {
  assert.equal(topic.items.length, 30, `Topic ${topic.topicId} (${topic.topicEn}) must have exactly 30 words`);
  for (const w of topic.items) {
    assert.ok(w.word && w.partOfSpeech && w.ipa && w.meaningVi, `Topic ${topic.topicId} word #${w.stt} missing required fields`);
    totalStructuredWords++;
  }
}
assert.equal(totalStructuredWords, 240, 'Total structured vocabulary words must be 240');
assert.equal(vocab240Data.signKeywordGroups.length, 4, 'Must have 4 signKeywordGroups for Reading Part 1');
console.log('  [PASS] vnupress-vocabulary-240.json verified: 240 structured B1 words (8 topics × 30) + 4 Reading Part 1 sign keyword groups.');

console.log(
  `✓ Pillar 2 Complete: 13 exams verified (${grandTotalReadingQuestions} Reading Qs, ${grandTotalListeningQuestions} Listening Qs, ${grandTotalVocabNotes} vocabulary notes, 240 official book words, 100% coverage).\n`
);

// ============================================================================
// PILLAR 3: API & ZERO BULK LEAKS SECURITY
// ============================================================================
console.log('>>> PILLAR 3: API & Zero Bulk Leaks Security');

// 3.1 Sanitization and Answer Stripping
for (const examFile of examFilenames) {
  const rawExam = JSON.parse(fs.readFileSync(path.join(DATA_DIR, examFile), 'utf8'));
  const originalJsonString = JSON.stringify(rawExam);

  // Sanitized output
  const sanitized = stripSensitiveVnuData(rawExam);
  const sanitizedJsonString = JSON.stringify(sanitized);

  // 1. Original immutability check
  assert.equal(
    JSON.stringify(rawExam),
    originalJsonString,
    `${examFile}: stripSensitiveVnuData must NOT mutate original exam`
  );

  // 2. Sensitive key patterns must be 100% absent in output
  for (const key of SENSITIVE_VNU_KEYS) {
    const pattern = `"${key}":`;
    assert.equal(
      sanitizedJsonString.includes(pattern),
      false,
      `${examFile}: Sanitized payload must NOT contain '${key}'`
    );
  }

  // 3. Deep question check
  for (const s of sanitized.sections) {
    for (const t of s.tasks) {
      assert.equal(t.transcript, undefined, `${examFile} task ${t.id} must not leak transcript`);
      for (const q of t.questions) {
        assert.equal(q.correctAnswer, undefined, `${examFile} Q${q.id} must not leak correctAnswer`);
        assert.equal(q.answerIndex, undefined, `${examFile} Q${q.id} must not leak answerIndex`);
        assert.equal(q.explanationVi, undefined, `${examFile} Q${q.id} must not leak explanationVi`);
      }
    }
  }
}
console.log('  [PASS] stripSensitiveVnuData verified across all 13 exam master datasets: 0 leaks.');

// 3.2 HMAC Session Token Security
const testSessionExamId = 'ulis-sample-test-01';
const validToken = createVnuSessionToken(testSessionExamId, '127.0.0.1');
assert.ok(validToken && typeof validToken === 'string', 'Token must be non-empty string');
assert.equal(verifyVnuSessionToken(validToken, testSessionExamId), true, 'Valid token must be accepted');
assert.equal(verifyVnuSessionToken(validToken, 'wrong-exam-id'), false, 'Wrong exam ID token must be rejected');
assert.equal(verifyVnuSessionToken('invalid.token.structure', testSessionExamId), false, 'Malformed token must be rejected');
assert.equal(verifyVnuSessionToken('', testSessionExamId), false, 'Empty token must be rejected');
console.log('  [PASS] HMAC Session Token cryptographic validation verified.');

// 3.3 Zero-width Watermarking
const originalText = 'Phương án đúng là C vì người nói nêu rõ lý do.';
const watermarkedText = embedInvisibleWatermark(originalText, 'learner_ip_192.168.1.1');
assert.ok(watermarkedText.length > originalText.length, 'Watermarked string must have injected zero-width bytes');
const strippedText = watermarkedText.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
assert.equal(strippedText, originalText, 'Visible characters must remain 100% identical after stripping zero-width');
console.log('  [PASS] Invisible zero-width steganographic watermarking verified.');

// 3.4 Barem Scoring Mathematical Engine & Elimination Logic
// Reading scale (0..25 -> 10.0)
assert.equal(calculateVnuReadingScore(0), 0.0);
assert.equal(calculateVnuReadingScore(4), 1.5); // Liệt (< 2.0)
assert.equal(calculateVnuReadingScore(5), 2.0); // Thoát liệt
assert.equal(calculateVnuReadingScore(15), 6.0); // Chuẩn B1
assert.equal(calculateVnuReadingScore(25), 10.0);

// Listening scale (0..20 -> 10.0)
assert.equal(calculateVnuListeningScore(0), 0.0);
assert.equal(calculateVnuListeningScore(3), 1.5); // Liệt (< 2.0)
assert.equal(calculateVnuListeningScore(4), 2.0); // Thoát liệt
assert.equal(calculateVnuListeningScore(12), 6.0); // Chuẩn B1
assert.equal(calculateVnuListeningScore(20), 10.0);

// Pass / Fail Rules
// Normal Pass
const passCheck = checkVnuPassCriteria(6.0, 6.0, 6.0);
assert.equal(passCheck.isPassed, true, 'Overall 6.0, R 6.0, L 6.0 must pass');
assert.equal(passCheck.statusLabel, 'ĐẠT (BẬC 3 / B1)');

// Elimination Failure 1: Reading Liệt (< 2.0) even with Listening 10.0
const rElim = checkVnuPassCriteria(1.5, 10.0, 6.0);
assert.equal(rElim.isPassed, false, 'Reading < 2.0 must fail');
assert.match(rElim.failureReason, /Đọc/, 'Must cite Reading failure');

// Elimination Failure 2: Listening Liệt (< 2.0) even with Reading 10.0
const lElim = checkVnuPassCriteria(10.0, 1.5, 6.0);
assert.equal(lElim.isPassed, false, 'Listening < 2.0 must fail');
assert.match(lElim.failureReason, /Nghe/, 'Must cite Listening failure');

// Low Average Failure: R 5.0, L 5.0 -> Avg 5.0 (< 6.0)
const avgFail = checkVnuPassCriteria(5.0, 5.0, 5.0);
assert.equal(avgFail.isPassed, false, 'Overall < 6.0 must fail');

// 3.5 End-to-End Simulation with gradeVnuBac3Exam
const ulisRaw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'ulis-sample-test-01.json'), 'utf8'));

// Build perfect answers
const perfectAnswers = {};
for (const s of ulisRaw.sections) {
  if (s.type === 'reading' || s.type === 'listening') {
    for (const t of s.tasks) {
      for (const q of t.questions) {
        perfectAnswers[q.id] = q.correctAnswer;
      }
    }
  }
}
const gradedPerfect = gradeVnuBac3Exam(ulisRaw, perfectAnswers, 3600);
assert.equal(gradedPerfect.readingCorrect, 25, 'Perfect test should have 25 reading correct');
assert.equal(gradedPerfect.listeningCorrect, 20, 'Perfect test should have 20 listening correct');
assert.equal(gradedPerfect.readingScore, 10.0, 'Perfect reading score should be 10.0');
assert.equal(gradedPerfect.listeningScore, 10.0, 'Perfect listening score should be 10.0');
assert.equal(gradedPerfect.overallScore, 10.0, 'Perfect overall score should be 10.0');
assert.equal(gradedPerfect.isPassed, true, 'Perfect score must pass');

console.log('  [PASS] Barem scoring engine & pass/elimination logic verified with 0 errors.');
console.log('✓ Pillar 3 Complete: API and Zero Bulk Leaks defense verified.\n');

// ============================================================================
// PILLAR 4: UI & NAVIGATION INTEGRATION
// ============================================================================
console.log('>>> PILLAR 4: UI & Navigation Integration');

// 4.1 Navigation Banner in src/app/vstep/page.tsx
assert.ok(fs.existsSync(VSTEP_PAGE_PATH), `src/app/vstep/page.tsx must exist at ${VSTEP_PAGE_PATH}`);
const vstepPageContent = fs.readFileSync(VSTEP_PAGE_PATH, 'utf8');

// Banner assertions
assert.ok(
  vstepPageContent.includes('/vnu-bac-3'),
  'src/app/vstep/page.tsx must contain a link pointing directly to /vnu-bac-3'
);
assert.ok(
  vstepPageContent.includes('Kỳ thi Chuẩn đầu ra Bậc 3 (VNU Test Bậc 3 - ULIS ĐHQGHN)'),
  'src/app/vstep/page.tsx must contain the official VNU Bậc 3 banner title'
);
assert.ok(
  vstepPageContent.includes('4 Kỹ Năng') || vstepPageContent.includes('4 kỹ năng'),
  'src/app/vstep/page.tsx banner must highlight 4 skills'
);
assert.ok(
  vstepPageContent.includes('Reading') &&
  vstepPageContent.includes('Listening') &&
  vstepPageContent.includes('Writing') &&
  vstepPageContent.includes('Speaking'),
  'src/app/vstep/page.tsx banner must explicitly feature Reading, Listening, Writing, and Speaking'
);
assert.ok(
  vstepPageContent.includes('Cambridge PET') || vstepPageContent.includes('PET B1'),
  'src/app/vstep/page.tsx banner must mention Cambridge PET B1 equivalent exams'
);
assert.ok(
  vstepPageContent.includes('Audio Player') || vstepPageContent.includes('audio player'),
  'src/app/vstep/page.tsx banner must highlight realistic audio player'
);
console.log('  [PASS] src/app/vstep/page.tsx contains prominent, elegant Technical Minimalist banner linking to /vnu-bac-3.');

// 4.2 Component Contract: VnuExamRoom.tsx
const examRoomPath = path.join(COMPONENTS_DIR, 'VnuExamRoom.tsx');
assert.ok(fs.existsSync(examRoomPath), 'VnuExamRoom.tsx must exist');
const examRoomCode = fs.readFileSync(examRoomPath, 'utf8');

assert.ok(
  examRoomCode.includes('export function VnuExamRoom') || examRoomCode.includes('export default function VnuExamRoom'),
  'VnuExamRoom must export VnuExamRoom component'
);
assert.ok(
  examRoomCode.includes('VnuSplitPane'),
  'VnuExamRoom must integrate VnuSplitPane'
);
assert.ok(
  examRoomCode.includes('VnuQuestionPalette'),
  'VnuExamRoom must integrate VnuQuestionPalette'
);
assert.ok(
  examRoomCode.includes('writingDrafts') && examRoomCode.includes('speakingNotes'),
  'VnuExamRoom must manage writingDrafts and speakingNotes state for 4-skill support'
);
assert.ok(
  examRoomCode.includes('vnu_b3_writing_') || examRoomCode.includes('localStorage'),
  'VnuExamRoom must support localStorage persistence for student drafts'
);
console.log('  [PASS] VnuExamRoom component contract verified (4-skill state, storage, split-pane, palette).');

// 4.3 Component Contract: VnuSplitPane.tsx
const splitPanePath = path.join(COMPONENTS_DIR, 'VnuSplitPane.tsx');
assert.ok(fs.existsSync(splitPanePath), 'VnuSplitPane.tsx must exist');
const splitPaneCode = fs.readFileSync(splitPanePath, 'utf8');

assert.ok(
  splitPaneCode.includes('export function VnuSplitPane'),
  'VnuSplitPane must export VnuSplitPane component'
);
assert.ok(
  splitPaneCode.includes('VnuAudioPlayer'),
  'VnuSplitPane must integrate VnuAudioPlayer for listening stimulus'
);
assert.ok(
  splitPaneCode.includes('countWords') || splitPaneCode.includes('minWords'),
  'VnuSplitPane must implement real-time word counting and minWords verification for Writing'
);
assert.ok(
  splitPaneCode.includes('cueCards') || splitPaneCode.includes('furtherQuestions'),
  'VnuSplitPane must render Speaking Cue Cards and follow-up prompts'
);
assert.ok(
  splitPaneCode.includes('sampleAnswer'),
  'VnuSplitPane must provide sampleAnswer viewing capability in practice / review mode'
);
assert.ok(
  splitPaneCode.includes('ExamInteractiveText'),
  'VnuSplitPane must import and integrate ExamInteractiveText for 1-click dictionary lookup'
);
assert.ok(
  !splitPaneCode.includes('disabled={isReviewMode}'),
  'VnuSplitPane must not use disabled={isReviewMode} on option buttons so that word lookup clicks are not blocked'
);
console.log('  [PASS] VnuSplitPane component contract verified (audio player, word counter, cue cards, sample answers, interactive dictionary).');

// 4.4 Component Contract: VnuQuestionPalette.tsx
const palettePath = path.join(COMPONENTS_DIR, 'VnuQuestionPalette.tsx');
assert.ok(fs.existsSync(palettePath), 'VnuQuestionPalette.tsx must exist');
const paletteCode = fs.readFileSync(palettePath, 'utf8');

assert.ok(
  paletteCode.includes('export function VnuQuestionPalette'),
  'VnuQuestionPalette must export VnuQuestionPalette component'
);
assert.ok(
  paletteCode.includes('writing') && paletteCode.includes('speaking'),
  'VnuQuestionPalette must support Writing and Speaking items in addition to Reading and Listening'
);
assert.ok(
  paletteCode.includes('isAnswered') && paletteCode.includes('isFlagged'),
  'VnuQuestionPalette must support answered, flagged, and active states'
);
console.log('  [PASS] VnuQuestionPalette component contract verified (4-skill navigation, 4 visual states).');

// 4.5 Component Contract: VnuAudioPlayer.tsx
const audioPlayerPath = path.join(COMPONENTS_DIR, 'VnuAudioPlayer.tsx');
assert.ok(fs.existsSync(audioPlayerPath), 'VnuAudioPlayer.tsx must exist');
const audioPlayerCode = fs.readFileSync(audioPlayerPath, 'utf8');

assert.ok(
  audioPlayerCode.includes('export function VnuAudioPlayer'),
  'VnuAudioPlayer must export VnuAudioPlayer component'
);
assert.ok(
  audioPlayerCode.includes('playCount') || audioPlayerCode.includes('maxPlays'),
  'VnuAudioPlayer must manage playCount with regulation 2-play limit'
);
assert.ok(
  audioPlayerCode.includes('duration') || audioPlayerCode.includes('formatTime'),
  'VnuAudioPlayer must support time/duration formatting and progress display'
);
console.log('  [PASS] VnuAudioPlayer component contract verified (play limits, duration, loading state).');

// 4.6 Portal Landing Page & VnuCatalogGrid 3-Tab Interface
const portalPagePath = path.join(ROOT_DIR, 'src', 'app', 'vnu-bac-3', 'page.tsx');
assert.ok(fs.existsSync(portalPagePath), 'src/app/vnu-bac-3/page.tsx must exist');
const portalPageCode = fs.readFileSync(portalPagePath, 'utf8');
assert.ok(portalPageCode.includes('VNU Test'), 'Portal page must render VNU Test information');

const catalogGridPath = path.join(COMPONENTS_DIR, 'VnuCatalogGrid.tsx');
assert.ok(fs.existsSync(catalogGridPath), 'VnuCatalogGrid.tsx must exist');
const catalogGridCode = fs.readFileSync(catalogGridPath, 'utf8');
assert.ok(
  catalogGridCode.includes('STAGE_METADATA') &&
  catalogGridCode.includes('vnupress-study-guide.json') &&
  catalogGridCode.includes('vnupress-vocabulary-240.json'),
  'VnuCatalogGrid must integrate 4-Stage Exam Catalog, Official 4-Skill Study Guide, and 240 Vocabulary Explorer'
);

const studyGuidePath = path.join(DATA_DIR, 'vnupress-study-guide.json');
assert.ok(fs.existsSync(studyGuidePath), 'vnupress-study-guide.json must exist');
const studyGuideData = JSON.parse(fs.readFileSync(studyGuidePath, 'utf8'));
assert.equal(studyGuideData.readingGuide.subSkills.length, 4, 'Reading guide must have 4 sub-skills');
assert.equal(studyGuideData.listeningGuide.parts.length, 3, 'Listening guide must have 3 parts');
assert.ok(studyGuideData.writingGuide.task1 && studyGuideData.writingGuide.task2, 'Writing guide must have task1 and task2');
assert.equal(
  studyGuideData.writingGuide.task1.models.length + studyGuideData.writingGuide.task2.models.length,
  7,
  'Writing guide must contain all 7 official sample essays'
);
assert.equal(studyGuideData.speakingGuide.part1.topicQuestionBanks.length, 8, 'Speaking Part 1 guide must have 8 official topics');
assert.equal(studyGuideData.speakingGuide.part2.modelCueCards.length, 3, 'Speaking Part 2 guide must have 3 sample cue cards');

// 4.7 Copyright & IP Hygiene Verification (No redundant dumps or commercial publisher leaks)
const forbiddenDocs = [
  'vnupress_official_book_full_text.txt',
  'VNUPRESS_OFFICIAL_BOOK_2026.md',
  'CAMBRIDGE_CONVERSION_SPEC.md',
  'PARALLEL_CURRICULUM_ROADMAP.md',
  'QUALITY_AUDIT_REPORT.md',
];
for (const docFile of forbiddenDocs) {
  assert.equal(
    fs.existsSync(path.join(ROOT_DIR, 'docs', 'vnu-bac-3', docFile)),
    false,
    `Redundant/copyright-sensitive file docs/vnu-bac-3/${docFile} must be deleted`
  );
}
for (const redundantAudio of ['pet-01', 'pet-02']) {
  assert.equal(
    fs.existsSync(path.join(AUDIO_DIR, redundantAudio)),
    false,
    `Redundant duplicate audio directory ${redundantAudio} must be deleted`
  );
}

const forbiddenCopyrightStrings = [
  'NXB ĐHQGHN',
  'Nhà xuất bản Đại học Quốc gia',
  '978-604-43-6262-5',
  'Đỗ Tuấn Minh',
  'Vũ Thị Thanh Nhã',
  'Cambridge PET',
  'Cambridge KET',
  'B1 Preliminary',
  'Chris Zaremba',
  'FitnessOverFifty',
  'vnupress.edu.vn',
];

for (const term of forbiddenCopyrightStrings) {
  assert.equal(portalPageCode.includes(term), false, `page.tsx must not contain copyright term '${term}'`);
  assert.equal(catalogGridCode.includes(term), false, `VnuCatalogGrid.tsx must not contain copyright term '${term}'`);
}

const allDataJsonFiles = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
for (const jsonFile of allDataJsonFiles) {
  const rawContent = fs.readFileSync(path.join(DATA_DIR, jsonFile), 'utf8');
  for (const term of forbiddenCopyrightStrings) {
    assert.equal(
      rawContent.includes(term),
      false,
      `Data file ${jsonFile} must not contain commercial copyright term '${term}'`
    );
  }
}
console.log('  [PASS] /vnu-bac-3 portal page, 3-Tab VnuCatalogGrid & 100% Copyright/IP Hygiene verified.');

console.log('✓ Pillar 4 Complete: UI, Navigation, and Copyright Compliance verified.\n');

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('========================================================================');
console.log('   QUALITY E2E TEST RESULTS: 100% PASS (ALL 4 PILLARS VERIFIED)         ');
console.log('   - Pillar 1 (Physical Audio): 39/39 MP3 files > 20KB with valid headers');
console.log('   - Pillar 2 (4-Skill Schemas): 585 MCQs + 52 Writing/Speaking + 240 Vocab');
console.log('   - Pillar 3 (Security Defense): Zero Bulk Leaks across 13 exams, HMAC, Watermarking');
console.log('   - Pillar 4 (UI Integration): /vstep banner + 3-Tab Portal + 4-Skill Room');
console.log('========================================================================');
