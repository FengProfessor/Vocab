/**
 * CHALLENGER EMPIRICAL ADVERSARIAL STRESS-TEST HARNESS — VNU TEST BẬC 3 DATASETS
 * Agent: challenger_m1_1 (critic, specialist)
 * Objective: Empirically stress-test datasets in src/data/vnu-bac-3/
 * Location: tests/vnu-bac-3/challenger-stress-test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gradeVnuBac3Exam } from '../../src/lib/vnu-bac-3/scoring.ts';
import { stripSensitiveVnuData } from '../../src/lib/vnu-bac-3/loader.ts';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data', 'vnu-bac-3');

const EXAM_FILES = [
  'ulis-sample-test-01.json',
  'vnupress-official-practice-02.json',
  'vnu-bac3-test-10.json',
  'vnu-bac3-test-09.json',
  'cambridge-pet-equiv-01.json',
  'cambridge-pet-equiv-02.json',
  'vnu-bac3-test-03.json',
  'vnu-bac3-test-04.json',
  'vnu-bac3-test-05.json',
  'vnu-bac3-test-06.json',
  'vnu-bac3-test-07.json',
  'vnu-bac3-test-08.json',
  'vnupress-official-mock-01.json'
];

const CATALOG_FILE = 'vnu-bac-3-catalog.json';

console.log('======================================================================');
console.log('   CHALLENGER ADVERSARIAL STRESS-TEST SUITE — VNU BẬC 3 DATASETS     ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
const anomalies = [];

function runCheck(title, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${title}`);
  } catch (err) {
    anomalies.push({ title, error: err.message });
    console.error(`  [FAIL] ${title}: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// SUITE 1: JSON PARSING & CATALOG CROSS-REFERENCING
// ----------------------------------------------------------------------------
console.log('>>> SUITE 1: JSON Parsing & Catalog Integrity');

const examDataMap = new Map();

for (const fileName of EXAM_FILES) {
  runCheck(`Parse JSON & verify size: ${fileName}`, () => {
    const filePath = path.join(DATA_DIR, fileName);
    assert.ok(fs.existsSync(filePath), `File does not exist: ${filePath}`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 50000, `File size too small (${stat.size} bytes), expected > 50KB`);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(parsed && typeof parsed === 'object', 'Parsed content is not an object');
    examDataMap.set(fileName, parsed);
  });
}

runCheck(`Parse and validate catalog: ${CATALOG_FILE} (13 ordered exams across 4 stages)`, () => {
  const catPath = path.join(DATA_DIR, CATALOG_FILE);
  assert.ok(fs.existsSync(catPath), `Catalog file does not exist: ${catPath}`);
  const raw = fs.readFileSync(catPath, 'utf8');
  const catalog = JSON.parse(raw);
  assert.ok(Array.isArray(catalog), 'Catalog must be an array');
  assert.equal(catalog.length, 13, 'Catalog must list all 13 exams');

  const validStages = new Set([
    'stage-1-diagnostic',
    'stage-2-official-practice',
    'stage-3-b1-drills',
    'stage-4-final-mock'
  ]);

  catalog.forEach((c, idx) => {
    assert.equal(c.orderNumber, idx + 1, `Catalog item ${c.id} orderNumber must be ${idx + 1}`);
    assert.ok(validStages.has(c.stageId), `Catalog item ${c.id} has invalid stageId: ${c.stageId}`);
    assert.ok(c.recommendedSession && c.recommendedSession.length > 5, `Catalog item ${c.id} missing recommendedSession`);
    assert.ok(c.grammarFocus && c.grammarFocus.length > 5, `Catalog item ${c.id} missing grammarFocus`);

    const examJson = examDataMap.get(`${c.id}.json`);
    assert.ok(examJson, `Missing loaded exam JSON for catalog ID: ${c.id}`);
    assert.equal(examJson.title, c.title, `Title mismatch between catalog and ${c.id}.json`);
  });

  const catalogIds = catalog.map(c => c.id);
  for (const fileName of EXAM_FILES) {
    const baseId = fileName.replace('.json', '');
    assert.ok(catalogIds.includes(baseId), `Catalog is missing exam ID: ${baseId}`);
  }
});

// ----------------------------------------------------------------------------
// SUITE 2: DEEP SCHEMA VALIDATION (ROOT & SECTIONS)
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 2: Deep Schema Validation');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Root schema contract conformance`, () => {
    assert.equal(exam.id, fileName.replace('.json', ''), 'exam.id must match filename');
    assert.ok(typeof exam.title === 'string' && exam.title.length > 10, 'title must be substantive string');
    assert.equal(exam.series, 'VNU-BAC-3', 'series must be VNU-BAC-3');
    assert.equal(exam.durationMinutes, 65, 'durationMinutes must be 65');
    assert.equal(exam.targetLevel, 'B1', 'targetLevel must be B1');
    assert.equal(exam.totalQuestions, 45, 'totalQuestions must be 45');
    assert.ok(Array.isArray(exam.sections), 'sections must be array');
    assert.equal(exam.sections.length, 4, 'sections must contain exactly 4 sections (reading, listening, writing, speaking)');
  });

  runCheck(`${fileName}: Section structure & question distribution`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const writing = exam.sections.find(s => s.type === 'writing');
    const speaking = exam.sections.find(s => s.type === 'speaking');

    assert.ok(reading, 'Reading section missing');
    assert.ok(listening, 'Listening section missing');
    assert.ok(writing, 'Writing section missing');
    assert.ok(speaking, 'Speaking section missing');

    assert.equal(reading.totalQuestions, 25, 'Reading totalQuestions must be 25');
    assert.equal(reading.timeLimitMinutes, 40, 'Reading timeLimitMinutes must be 40');
    assert.equal(reading.tasks.length, 4, 'Reading must have exactly 4 parts');
    assert.equal(reading.tasks[0].questions.length, 7, 'Reading Part 1 must have 7 questions');
    assert.equal(reading.tasks[1].questions.length, 8, 'Reading Part 2 must have 8 questions');
    assert.equal(reading.tasks[2].questions.length, 5, 'Reading Part 3 must have 5 questions');
    assert.equal(reading.tasks[3].questions.length, 5, 'Reading Part 4 must have 5 questions');

    assert.equal(listening.totalQuestions, 20, 'Listening totalQuestions must be 20');
    assert.equal(listening.timeLimitMinutes, 25, 'Listening timeLimitMinutes must be 25');
    assert.equal(listening.tasks.length, 3, 'Listening must have exactly 3 parts');
    assert.equal(listening.tasks[0].questions.length, 7, 'Listening Part 1 must have 7 questions');
    assert.equal(listening.tasks[1].questions.length, 7, 'Listening Part 2 must have 7 questions');
    assert.equal(listening.tasks[2].questions.length, 6, 'Listening Part 3 must have 6 questions');

    assert.equal(writing.totalQuestions, 2, 'Writing totalQuestions must be 2');
    assert.equal(writing.timeLimitMinutes, 40, 'Writing timeLimitMinutes must be 40');
    assert.equal(writing.tasks.length, 2, 'Writing must have 2 tasks');

    assert.equal(speaking.totalQuestions, 2, 'Speaking totalQuestions must be 2');
    assert.equal(speaking.timeLimitMinutes, 8, 'Speaking timeLimitMinutes must be 8');
    assert.equal(speaking.tasks.length, 2, 'Speaking must have 2 parts');
  });
}

// ----------------------------------------------------------------------------
// SUITE 3: QUESTION NUMBERING CONTINUITY & ID INTEGRITY
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 3: Question Numbering Continuity & ID Integrity');

const allExamQuestionIds = new Set();

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Reading question numbering strictly continuous Q1..Q25`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const readingQuestions = reading.tasks.flatMap(t => t.questions);
    assert.equal(readingQuestions.length, 25, 'Must have exactly 25 reading questions');

    const expectedNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const actualNumbers = readingQuestions.map(q => q.questionNumber);
    assert.deepEqual(actualNumbers, expectedNumbers, `Reading numbers must strictly be [1..25], got ${JSON.stringify(actualNumbers)}`);
  });

  runCheck(`${fileName}: Listening question numbering strictly continuous Q1..Q20`, () => {
    const listening = exam.sections.find(s => s.type === 'listening');
    const listeningQuestions = listening.tasks.flatMap(t => t.questions);
    assert.equal(listeningQuestions.length, 20, 'Must have exactly 20 listening questions');

    const expectedNumbers = Array.from({ length: 20 }, (_, i) => i + 1);
    const actualNumbers = listeningQuestions.map(q => q.questionNumber);
    assert.deepEqual(actualNumbers, expectedNumbers, `Listening numbers must strictly be [1..20], got ${JSON.stringify(actualNumbers)}`);
  });

  runCheck(`${fileName}: Question ID uniqueness within exam and across exams`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    const localIds = new Set();
    for (const q of allQuestions) {
      assert.ok(typeof q.id === 'string' && q.id.length > 0, `Question missing valid id: Q${q.questionNumber}`);
      assert.ok(!localIds.has(q.id), `Duplicate question ID within exam: ${q.id}`);
      localIds.add(q.id);

      assert.ok(!allExamQuestionIds.has(q.id), `Question ID collision across exams: ${q.id}`);
      allExamQuestionIds.add(q.id);
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 4: ANSWER KEY & CHOICE VALIDITY, DUPLICATE DETECTION
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 4: Answer Option Validation & Duplicate Choices');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Every question has exactly 1 valid answer and zero duplicate choices`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    for (const q of allQuestions) {
      assert.ok(Array.isArray(q.options), `Question ${q.id} missing options array`);
      assert.ok(q.options.length >= 2, `Question ${q.id} has fewer than 2 options`);

      // Verify keys uniqueness
      const keys = q.options.map(o => o.key);
      const uniqueKeys = new Set(keys);
      assert.equal(uniqueKeys.size, keys.length, `Question ${q.id} has duplicate option keys: ${JSON.stringify(keys)}`);

      // Verify correctAnswer exists and matches exactly 1 option key
      assert.ok(q.correctAnswer, `Question ${q.id} missing correctAnswer`);
      const matchingOptions = q.options.filter(o => o.key === q.correctAnswer);
      assert.equal(matchingOptions.length, 1, `Question ${q.id} correctAnswer '${q.correctAnswer}' does not match exactly one option`);

      // Verify answerIndex consistency if present
      if (typeof q.answerIndex === 'number') {
        const expectedIndex = q.options.findIndex(o => o.key === q.correctAnswer);
        assert.equal(q.answerIndex, expectedIndex, `Question ${q.id} answerIndex (${q.answerIndex}) mismatch with expected (${expectedIndex})`);
      }

      // Verify no duplicate option texts (case-insensitive & whitespace trimmed)
      const texts = q.options.map(o => o.text.trim().toLowerCase());
      const uniqueTexts = new Set(texts);
      assert.equal(uniqueTexts.size, texts.length, `Question ${q.id} has duplicate option text contents: ${JSON.stringify(q.options.map(o => o.text))}`);
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 5: WHITESPACE HYGIENE & CORRUPT CHARACTERS STRESS-TEST
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 5: Whitespace Hygiene & Invisible Character Scan');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Zero leading/trailing whitespace in options, prompts, and explanations`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    for (const q of allQuestions) {
      // Prompt whitespace
      if (q.prompt) {
        assert.equal(q.prompt, q.prompt.trim(), `Question ${q.id} prompt has accidental leading/trailing whitespace: "${q.prompt}"`);
        assert.ok(q.prompt.length > 0, `Question ${q.id} prompt is empty`);
      }

      // Options whitespace
      for (const opt of q.options) {
        assert.equal(opt.key, opt.key.trim(), `Question ${q.id} option key has whitespace: "${opt.key}"`);
        assert.equal(opt.text, opt.text.trim(), `Question ${q.id} option '${opt.key}' text has leading/trailing whitespace: "${opt.text}"`);
        assert.ok(opt.text.length > 0, `Question ${q.id} option '${opt.key}' text is empty`);

        // Check for control characters or null bytes
        assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(opt.text), `Question ${q.id} option text contains illegal control character`);
      }

      // Explanation whitespace
      if (q.explanationVi) {
        assert.equal(q.explanationVi, q.explanationVi.trim(), `Question ${q.id} explanationVi has leading/trailing whitespace`);
        assert.ok(q.explanationVi.length >= 10, `Question ${q.id} explanationVi too brief (${q.explanationVi.length} chars)`);
      }
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 6: WRITING SAMPLE ANSWERS WORD COUNT VERIFICATION
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 6: Writing Word Count Stress-Test');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Writing Task 1 sampleAnswer >= 80 words`, () => {
    const writing = exam.sections.find(s => s.type === 'writing');
    const task1 = writing.tasks[0];
    assert.ok(task1 && task1.writingPrompts && task1.writingPrompts.length > 0, 'Writing Task 1 prompt missing');
    const prompt1 = task1.writingPrompts[0];

    assert.ok(prompt1.sampleAnswer, `${fileName} Task 1 sampleAnswer is missing`);
    assert.equal(prompt1.minWords, 80, `${fileName} Task 1 minWords must be 80`);

    const whitespaceWordCount = prompt1.sampleAnswer.trim().split(/\s+/).filter(Boolean).length;
    const boundaryWordCount = (prompt1.sampleAnswer.match(/[a-zA-Z0-9'-]+/g) || []).length;

    console.log(`    -> ${fileName} Task 1 Word Count: ${whitespaceWordCount} (whitespace split) / ${boundaryWordCount} (regex token)`);
    assert.ok(whitespaceWordCount >= 80, `${fileName} Task 1 sampleAnswer word count (${whitespaceWordCount}) is below 80`);
  });

  runCheck(`${fileName}: Writing Task 2 sampleAnswer >= 100 words`, () => {
    const writing = exam.sections.find(s => s.type === 'writing');
    const task2 = writing.tasks[1];
    assert.ok(task2 && task2.writingPrompts && task2.writingPrompts.length > 0, 'Writing Task 2 prompt missing');
    const prompt2 = task2.writingPrompts[0];

    assert.ok(prompt2.sampleAnswer, `${fileName} Task 2 sampleAnswer is missing`);
    assert.equal(prompt2.minWords, 100, `${fileName} Task 2 minWords must be 100`);

    const whitespaceWordCount = prompt2.sampleAnswer.trim().split(/\s+/).filter(Boolean).length;
    const boundaryWordCount = (prompt2.sampleAnswer.match(/[a-zA-Z0-9'-]+/g) || []).length;

    console.log(`    -> ${fileName} Task 2 Word Count: ${whitespaceWordCount} (whitespace split) / ${boundaryWordCount} (regex token)`);
    assert.ok(whitespaceWordCount >= 100, `${fileName} Task 2 sampleAnswer word count (${whitespaceWordCount}) is below 100`);
  });
}

// ----------------------------------------------------------------------------
// SUITE 7: LISTENING & READING VOCABULARY NOTES PARITY
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 7: Vocabulary Notes Parity & Integrity');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: 100% Reading questions have vocabularyNotes`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const questions = reading.tasks.flatMap(t => t.questions);
    const withVocab = questions.filter(q => Array.isArray(q.vocabularyNotes) && q.vocabularyNotes.length > 0);
    assert.equal(withVocab.length, 25, `${fileName} Reading has ${withVocab.length}/25 questions with vocabularyNotes`);
  });

  runCheck(`${fileName}: 100% Listening questions have vocabularyNotes (Milestone 1 requirement)`, () => {
    const listening = exam.sections.find(s => s.type === 'listening');
    const questions = listening.tasks.flatMap(t => t.questions);
    const withVocab = questions.filter(q => Array.isArray(q.vocabularyNotes) && q.vocabularyNotes.length > 0);
    assert.equal(withVocab.length, 20, `${fileName} Listening has ${withVocab.length}/20 questions with vocabularyNotes`);

    // Verify vocabulary item internal schema
    for (const q of questions) {
      for (const v of q.vocabularyNotes) {
        assert.ok(v.word && v.word.trim().length > 0, `Question ${q.id} vocabulary note has empty word`);
        assert.ok((v.meaning && v.meaning.trim().length > 0) || (v.meaningVi && v.meaningVi.trim().length > 0), `Question ${q.id} vocab note '${v.word}' missing meaning`);
      }
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 8: AUDIO URL ALIGNMENT & SPECIFICATION CONFORMANCE
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 8: Audio URL Conformance');

const EXPECTED_AUDIO_PREFIXES = {
  'ulis-sample-test-01.json': '/audio/vnu-bac3/sample-01/',
  'vnupress-official-practice-02.json': '/audio/vnu-bac3/vnupress-practice-02/',
  'vnu-bac3-test-10.json': '/audio/vnu-bac3/test-10/',
  'vnu-bac3-test-09.json': '/audio/vnu-bac3/test-09/',
  'cambridge-pet-equiv-01.json': '/audio/vnu-bac3/equiv-01/',
  'cambridge-pet-equiv-02.json': '/audio/vnu-bac3/equiv-02/',
  'vnu-bac3-test-03.json': '/audio/vnu-bac3/test-03/',
  'vnu-bac3-test-04.json': '/audio/vnu-bac3/test-04/',
  'vnu-bac3-test-05.json': '/audio/vnu-bac3/test-05/',
  'vnu-bac3-test-06.json': '/audio/vnu-bac3/test-06/',
  'vnu-bac3-test-07.json': '/audio/vnu-bac3/test-07/',
  'vnu-bac3-test-08.json': '/audio/vnu-bac3/test-08/',
  'vnupress-official-mock-01.json': '/audio/vnu-bac3/vnupress-mock-01/'
};

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Audio URLs align with specification`, () => {
    const listening = exam.sections.find(s => s.type === 'listening');
    const expectedPrefix = EXPECTED_AUDIO_PREFIXES[fileName];

    for (let i = 0; i < listening.tasks.length; i++) {
      const task = listening.tasks[i];
      const partNum = i + 1;
      const expectedUrl = `${expectedPrefix}listening-part${partNum}.mp3`;
      assert.ok(task.media && task.media.audioUrl, `Listening Task ${task.id} missing audioUrl`);
      assert.equal(task.media.audioUrl, expectedUrl, `Listening Task ${task.id} audioUrl mismatch: got '${task.media.audioUrl}', expected '${expectedUrl}'`);
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 9: REMEDIATION FIDELITY (Q21 GRAMMAR & Q23 ELDERLY)
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 9: Remediation Defect Regression Verification');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: No ungrammatical "What does the word ... closest in meaning to?" in Reading Part 4`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    for (const q of reading.tasks.flatMap(t => t.questions)) {
      assert.ok(
        !q.prompt?.includes('What does the word') || !q.prompt?.includes('closest in meaning to'),
        `${fileName} Q${q.questionNumber} contains ungrammatical 'What does the word ... closest in meaning to?': "${q.prompt}"`
      );
    }
  });
}

runCheck(`ulis-sample-test-01.json: Q21 prompt has correct grammar ("What is the word ...")`, () => {
  const ulisExam = examDataMap.get('ulis-sample-test-01.json');
  const reading = ulisExam.sections.find(s => s.type === 'reading');
  const q21 = reading.tasks.flatMap(t => t.questions).find(q => q.questionNumber === 21);
  assert.ok(q21, 'Question 21 not found');
  assert.ok(q21.prompt.includes('What is the word'), `Q21 must contain 'What is the word ...': "${q21.prompt}"`);
});

runCheck(`ulis-sample-test-01.json: Q23 prompt uses "the elderly" instead of "old people"`, () => {
  const ulisExam = examDataMap.get('ulis-sample-test-01.json');
  const reading = ulisExam.sections.find(s => s.type === 'reading');
  const q23 = reading.tasks.flatMap(t => t.questions).find(q => q.questionNumber === 23);
  assert.ok(q23, 'Question 23 not found');
  assert.ok(!q23.prompt.includes('old people'), `Q23 still contains 'old people': "${q23.prompt}"`);
  assert.ok(q23.prompt.includes('the elderly'), `Q23 must contain 'the elderly': "${q23.prompt}"`);
});

// ----------------------------------------------------------------------------
// SUITE 10: ANSWER KEY DISTRIBUTION & EXPLANATION COHERENCE
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 10: Answer Key Distribution & Explanation Coherence');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Plausible key distribution across MCQ questions`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    const keyDist = { A: 0, B: 0, C: 0 };
    for (const q of allQuestions) {
      if (keyDist[q.correctAnswer] !== undefined) {
        keyDist[q.correctAnswer]++;
      }
    }

    console.log(`    -> ${fileName} Key Distribution (45 Qs): A=${keyDist.A}, B=${keyDist.B}, C=${keyDist.C}`);
    assert.ok(keyDist.A > 5, 'Too few A keys (< 5)');
    assert.ok(keyDist.B > 5, 'Too few B keys (< 5)');
    assert.ok(keyDist.C > 5, 'Too few C keys (< 5)');
  });

  runCheck(`${fileName}: Explanation coherence with correctAnswer`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    let checkedContradictions = 0;
    for (const q of allQuestions) {
      if (!q.explanationVi) continue;
      const expl = q.explanationVi;

      // Look for explicit ending statements like:
      // "Phương án A là đáp án chính xác", "Đáp án A đúng", "Do đó chọn A"
      const match = expl.match(/(?:Đáp án|Phương án|chọn)\s+([ABC])\s+(?:là đáp án|đúng|chính xác)/i);
      if (match) {
        const assertedKey = match[1].toUpperCase();
        assert.equal(
          assertedKey,
          q.correctAnswer,
          `Question ${q.id} (Q${q.questionNumber}) explanation mentions '${assertedKey}' is correct, but correctAnswer is '${q.correctAnswer}'! Explanation snippet: "${expl.slice(0, 100)}..."`
        );
        checkedContradictions++;
      }
    }
    console.log(`    -> ${fileName}: Checked ${checkedContradictions} explicit explanation statements (0 contradictions found).`);
  });
}

// ----------------------------------------------------------------------------
// SUITE 11: SPEAKING PROMPTS & CUE CARDS INTEGRITY
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 11: Speaking Prompts & Cue Cards Structural Integrity');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Speaking Part 1 has 5-6 questions, Part 2 has 2 Cue Cards`, () => {
    const speaking = exam.sections.find(s => s.type === 'speaking');
    assert.ok(speaking, 'Speaking section missing');
    assert.equal(speaking.tasks.length, 2, 'Speaking must have 2 tasks');

    const part1 = speaking.tasks[0];
    assert.ok(part1.speakingPrompts && part1.speakingPrompts.length > 0, 'Speaking Part 1 missing speakingPrompts');
    const p1Questions = part1.speakingPrompts[0].questions;
    assert.ok(Array.isArray(p1Questions) && p1Questions.length >= 5, `Speaking Part 1 must have >= 5 questions, got ${p1Questions?.length}`);

    const part2 = speaking.tasks[1];
    assert.ok(part2.speakingPrompts && part2.speakingPrompts.length > 0, 'Speaking Part 2 missing speakingPrompts');
    const cueCards = part2.speakingPrompts[0].cueCards;
    assert.ok(Array.isArray(cueCards) && cueCards.length === 2, `Speaking Part 2 must have exactly 2 cue cards, got ${cueCards?.length}`);

    for (const card of cueCards) {
      assert.ok(card.code && card.title, 'Cue Card missing code or title');
      assert.ok(Array.isArray(card.prompts) && card.prompts.length >= 3, 'Cue Card must have >= 3 prompts');
      assert.ok(Array.isArray(card.furtherQuestions) && card.furtherQuestions.length >= 2, 'Cue Card must have >= 2 further questions');
    }
  });
}

// ----------------------------------------------------------------------------
// SUITE 12: SIMULATED GRADING ENGINE INTERACTION
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 12: End-to-End Scoring Engine Invariance with Master Datasets');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: 100% correct answers produces Perfect 10.0 and PASSED status`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    const perfectAnswers = {};
    for (const q of allQuestions) {
      perfectAnswers[q.id] = String(q.correctAnswer);
    }

    const result = gradeVnuBac3Exam(exam, perfectAnswers, 1800);
    assert.equal(result.readingCorrect, 25, 'Reading correct count must be 25');
    assert.equal(result.readingTotal, 25, 'Reading total must be 25');
    assert.equal(result.readingScore, 10.0, 'Reading score must be 10.0');
    assert.equal(result.listeningCorrect, 20, 'Listening correct count must be 20');
    assert.equal(result.listeningTotal, 20, 'Listening total must be 20');
    assert.equal(result.listeningScore, 10.0, 'Listening score must be 10.0');
    assert.equal(result.overallScore, 10.0, 'Overall score must be 10.0');
    assert.equal(result.isPassed, true, 'isPassed must be true');
    assert.equal(result.statusLabel, 'ĐẠT (BẬC 3 / B1)', 'statusLabel must be ĐẠT (BẬC 3 / B1)');
  });

  runCheck(`${fileName}: 0% correct answers safely produces 0.0 and CHƯA ĐẠT`, () => {
    const reading = exam.sections.find(s => s.type === 'reading');
    const listening = exam.sections.find(s => s.type === 'listening');
    const allQuestions = [...reading.tasks.flatMap(t => t.questions), ...listening.tasks.flatMap(t => t.questions)];

    // Submit deliberately wrong keys
    const wrongAnswers = {};
    for (const q of allQuestions) {
      wrongAnswers[q.id] = q.correctAnswer === 'A' ? 'B' : 'A';
    }

    const result = gradeVnuBac3Exam(exam, wrongAnswers, 1800);
    assert.equal(result.readingCorrect, 0, 'Reading correct count must be 0');
    assert.equal(result.readingScore, 0.0, 'Reading score must be 0.0');
    assert.equal(result.listeningCorrect, 0, 'Listening correct count must be 0');
    assert.equal(result.listeningScore, 0.0, 'Listening score must be 0.0');
    assert.equal(result.overallScore, 0.0, 'Overall score must be 0.0');
    assert.equal(result.isPassed, false, 'isPassed must be false');
    assert.equal(result.statusLabel, 'CHƯA ĐẠT', 'statusLabel must be CHƯA ĐẠT');
  });
}

// ----------------------------------------------------------------------------
// SUITE 13: CYBER DEFENSE ZERO-BULK-LEAK ACTIVE DATA SANITIZATION
// ----------------------------------------------------------------------------
console.log('\n>>> SUITE 13: Active Cyber Defense Data Purge Stress-Test');

for (const fileName of EXAM_FILES) {
  const exam = examDataMap.get(fileName);
  if (!exam) continue;

  runCheck(`${fileName}: Zero Bulk Leak sanitization purges 100% answers, sample answers, and explanations`, () => {
    const sanitized = stripSensitiveVnuData(exam);
    const jsonStr = JSON.stringify(sanitized);

    // Verify raw JSON string does not leak any forbidden keys
    assert.ok(!jsonStr.includes('"correctAnswer"'), 'Sanitized JSON must not contain "correctAnswer"');
    assert.ok(!jsonStr.includes('"answerIndex"'), 'Sanitized JSON must not contain "answerIndex"');
    assert.ok(!jsonStr.includes('"explanationVi"'), 'Sanitized JSON must not contain "explanationVi"');
    assert.ok(!jsonStr.includes('"transcript"'), 'Sanitized JSON must not contain "transcript"');
    assert.ok(!jsonStr.includes('"sampleAnswer"'), 'Sanitized JSON must not contain "sampleAnswer"');
    assert.ok(!jsonStr.includes('"sampleResponse"'), 'Sanitized JSON must not contain "sampleResponse"');

    // Confirm that public questions and writing prompts are STILL intact!
    const rSection = sanitized.sections.find(s => s.type === 'reading');
    const wSection = sanitized.sections.find(s => s.type === 'writing');
    assert.equal(rSection.tasks.flatMap(t => t.questions).length, 25, 'Reading questions count must remain 25 after sanitization');
    assert.equal(wSection.tasks.length, 2, 'Writing tasks count must remain 2 after sanitization');
    assert.ok(wSection.tasks[0].writingPrompts[0].prompt || wSection.tasks[0].writingPrompts[0].instructions, 'Writing prompts must remain visible');
  });
}

// ----------------------------------------------------------------------------
// FINAL SUMMARY & VERDICT
// ----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`TOTAL STRESS-TEST CHECKS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED / ANOMALIES: ${anomalies.length}`);
console.log('======================================================================\n');

if (anomalies.length > 0) {
  console.error('ANOMALIES DETECTED:');
  for (const a of anomalies) {
    console.error(`- ${a.title}: ${a.error}`);
  }
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL CHALLENGER STRESS-TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
