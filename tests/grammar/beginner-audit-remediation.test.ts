/**
 * Comprehensive Verification Suite for Beginner Grammar Audit Remediation (P0 & P1)
 *
 * Usage:
 *   npx tsx tests/grammar/beginner-audit-remediation.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  areAnswersEqual,
  isGrammarAnswerCorrect,
  normalizeLessonExercise,
} from '../../src/lib/grammar-exercises';
import { UNIFIED_GRAMMAR_TOPICS } from '../../src/lib/grammar-roadmap-data';

let total = 0;
let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, details?: string) {
  total++;
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

console.log('\n======================================================================');
console.log('   BEGINNER GRAMMAR AUDIT REMEDIATION VERIFICATION SUITE');
console.log('======================================================================\n');

// 1. Answer Evaluator Edge Cases (areAnswersEqual)
console.log('--- 1. Answer Evaluator Edge Cases (areAnswersEqual) ---');

check(
  '1.1: ASCII "..." matches Unicode ellipsis "…" in two-slot verb questions',
  areAnswersEqual('Did ... spend', 'Did … spend') &&
    areAnswersEqual('is ... going', 'is … going') &&
    areAnswersEqual('have ... lived', 'have … lived') &&
    areAnswersEqual('Did spend', 'Did … spend'),
);

check(
  '1.2: Full sentence with comma matches full sentence',
  areAnswersEqual(
    "If she doesn't say sorry, I won't talk to her again.",
    "If she doesn't say sorry, I won't talk to her again.",
  ) &&
    areAnswersEqual(
      "If she does not say sorry, I will not talk to her again",
      "If she doesn't say sorry, I won't talk to her again.",
    ),
);

check(
  '1.3: Full sentence with comma does NOT falsely pass when only half-clause is entered',
  !areAnswersEqual(
    "If she doesn't say sorry",
    "If she doesn't say sorry, I won't talk to her again.",
  ) &&
    !areAnswersEqual(
      "I won't talk to her again",
      "If she doesn't say sorry, I won't talk to her again.",
    ),
);

check(
  '1.4: Short comma-separated alternative lists still match individual alternatives',
  areAnswersEqual('big', 'big, large') && areAnswersEqual('large', 'big, large'),
);

check(
  '1.5: Pure punctuation strings never match valid answers',
  !areAnswersEqual('...', 'went') &&
    !areAnswersEqual('///', 'is') &&
    !areAnswersEqual(',,,', 'are') &&
    !isGrammarAnswerCorrect('   ', 'is'),
);

// 2. All 63 Topic JSON Exercise Banks & Mobile Word Banks
console.log('\n--- 2. All 63 Topic JSON Exercise Banks & Mobile Word Banks ---');

const outDir = path.resolve(process.cwd(), 'scripts/grammar-gen/out');
let minCount = Infinity;
let minSlug = '';
let missingFiles = 0;
let fillBlankWithoutOptions = 0;
let phoneticsCount = 0;
let overlyLongFillBlanks = 0;
let missingBreakdowns = 0;

for (const topic of UNIFIED_GRAMMAR_TOPICS) {
  const p = path.join(outDir, `${topic.slug}.json`);
  if (!fs.existsSync(p)) {
    missingFiles++;
    continue;
  }
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const exs: any[] = Array.isArray(data.exercises) ? data.exercises : [];
  if (exs.length < minCount) {
    minCount = exs.length;
    minSlug = topic.slug;
  }

  for (let i = 0; i < exs.length; i++) {
    const raw = exs[i];
    const norm = normalizeLessonExercise(raw, topic.slug, i, topic.title, topic.level);

    if (/phát âm|trọng âm/i.test(norm.question)) {
      phoneticsCount++;
    }
    if (norm.type === 'fill_blank') {
      if (!Array.isArray(norm.options) || norm.options.length < 3) {
        fillBlankWithoutOptions++;
      }
      if (norm.correct_answer.split(/\s+/).length > 4) {
        overlyLongFillBlanks++;
        console.log(`    [LONG FILL_BLANK] ${topic.slug}#${i + 1}: "${norm.correct_answer}"`);
      }
    }
    if (!Array.isArray(raw.distractor_breakdowns) || raw.distractor_breakdowns.length === 0) {
      missingBreakdowns++;
    }
  }
}

check(
  '2.1: All 63 topics in UNIFIED_GRAMMAR_TOPICS have local JSON files',
  missingFiles === 0,
  `Missing: ${missingFiles}`,
);
check(
  '2.2: Every topic has >= 12 exercises (0 single-question or low-count topics)',
  minCount >= 12,
  `Minimum was ${minCount} in ${minSlug}`,
);
check(
  '2.3: 100% of fill_blank exercises across all 63 topics have >= 3 Word Bank options',
  fillBlankWithoutOptions === 0,
  `Found ${fillBlankWithoutOptions} fill_blank exercises without Word Bank options`,
);
check(
  '2.4: Zero off-topic phonetics/stress questions in grammar exercise bank',
  phoneticsCount === 0,
  `Found ${phoneticsCount} phonetics questions`,
);
check(
  '2.5: Zero overly long full-sentence rewrite fill_blank answers (> 4 words)',
  overlyLongFillBlanks === 0,
  `Found ${overlyLongFillBlanks} long fill_blank answers`,
);
check(
  '2.6: 100% of exercises have structured distractor_breakdowns',
  missingBreakdowns === 0,
  `Found ${missingBreakdowns} exercises missing distractor_breakdowns`,
);

let roboticBreakdowns = 0;
let untranslatedChooseCorrect = 0;

for (const topic of UNIFIED_GRAMMAR_TOPICS) {
  const p = path.join(outDir, `${topic.slug}.json`);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const exs: any[] = Array.isArray(data.exercises) ? data.exercises : [];
  for (const raw of exs) {
    if (/Choose the correct/i.test(String(raw.question || ''))) {
      untranslatedChooseCorrect++;
    }
    if (Array.isArray(raw.distractor_breakdowns)) {
      for (const b of raw.distractor_breakdowns) {
        if (/không thỏa mãn quy tắc ngữ pháp hoặc sự hòa hợp cú pháp/i.test(String(b?.pedagogicalReason || ''))) {
          roboticBreakdowns++;
        }
      }
    }
  }
}

check(
  '2.7: Zero robotic placeholder distractor_breakdowns across all 63 topics',
  roboticBreakdowns === 0,
  `Found ${roboticBreakdowns} robotic distractor reasons`,
);
check(
  '2.8: Zero untranslated "Choose the correct..." meta-instructions across all 63 topics',
  untranslatedChooseCorrect === 0,
  `Found ${untranslatedChooseCorrect} untranslated Choose the correct prompts`,
);

// Check future-will-ex-01 distractor "am" reason does not falsely claim subject is not "I"
const futureWillJson = JSON.parse(fs.readFileSync(path.join(outDir, 'future-will.json'), 'utf8'));
const futureWillEx1Am = futureWillJson.exercises[0]?.distractor_breakdowns?.find(
  (b: any) => b.option === 'am',
);
check(
  '2.9: future-will-ex-01 distractor "am" does NOT falsely claim subject is not "I"',
  Boolean(
    futureWillEx1Am &&
      !futureWillEx1Am.pedagogicalReason.includes('chỉ đi duy nhất với chủ ngữ ngôi thứ nhất số ít "I"'),
  ),
  futureWillEx1Am?.pedagogicalReason,
);

// 3. Visual Topic Assets Pedagogical Accuracy
console.log('\n--- 3. Visual Topic Assets Pedagogical Accuracy ---');

const assetsPath = path.resolve(process.cwd(), 'src/data/grammar-topic-assets.json');
const assetsData = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));

let boilerplateCount = 0;
for (const slug of Object.keys(assetsData)) {
  for (const item of assetsData[slug]) {
    const cr = item.usageAnalysisVi?.contextReason || '';
    if (
      cr.includes('được lựa chọn nhằm phản ánh chuẩn xác hoàn cảnh giao tiếp thực tế và tuân thủ chặt chẽ') ||
      cr.includes('giúp người học nắm bắt ngay mối liên hệ giữa ngữ cảnh thực tế và cấu trúc câu') ||
      /Ví dụ \d+:\s*minh họa cách dùng/i.test(cr)
    ) {
      boilerplateCount++;
    }
  }
}

check(
  '3.1: Zero generic filler boilerplate in grammar-topic-assets.json contextReason',
  boilerplateCount === 0,
  `Found ${boilerplateCount} cards with generic boilerplate`,
);

check(
  '3.2: verb-to-be card 01 ("I am a student.") matches "am" rule',
  assetsData['verb-to-be'][0].usageAnalysisVi.rule.toLowerCase().includes('am'),
  assetsData['verb-to-be'][0].usageAnalysisVi.rule,
);

check(
  '3.3: demonstratives card 02 ("That building is a museum.") matches singular "that" rule',
  assetsData['demonstratives'][1].usageAnalysisVi.rule.toLowerCase().includes('that'),
  assetsData['demonstratives'][1].usageAnalysisVi.rule,
);

check(
  '3.4: possessives cards 01-04 each match their exact sentence pronouns (my/mine, your/hers, their/ours, yours)',
  assetsData['possessives'][0].usageAnalysisVi.rule.includes('my') &&
    assetsData['possessives'][1].usageAnalysisVi.rule.includes('your') &&
    assetsData['possessives'][1].usageAnalysisVi.rule.includes('hers') &&
    assetsData['possessives'][2].usageAnalysisVi.rule.toLowerCase().includes('their') &&
    assetsData['possessives'][2].usageAnalysisVi.rule.includes('ours') &&
    assetsData['possessives'][3].usageAnalysisVi.rule.includes('yours'),
  JSON.stringify(assetsData['possessives'].map((c: any) => c.usageAnalysisVi.rule)),
);

check(
  '3.5: plural-nouns cards 01-03 accurately distinguish regular -s (sisters), -es (boxes), and irregular (children)',
  assetsData['plural-nouns'][0].usageAnalysisVi.rule.includes('sister → sisters') &&
    assetsData['plural-nouns'][1].usageAnalysisVi.rule.includes('box → boxes') &&
    assetsData['plural-nouns'][2].usageAnalysisVi.rule.includes('child → children'),
  JSON.stringify(assetsData['plural-nouns'].map((c: any) => c.usageAnalysisVi.rule)),
);

// 4. API & UI Integration Verification
console.log('\n--- 4. API & UI Integration Verification ---');

const apiGrammarRoute = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/api/grammar/route.ts'),
  'utf8',
);
check(
  '4.1: GET /api/grammar?topic=... prioritizes cleaned local JSON exercises while preserving dbLessonId',
  apiGrammarRoute.includes('const effectiveLessonId = dbLessonId || topicSlug;') &&
    apiGrammarRoute.includes('normalizeLessonExercise(raw, effectiveLessonId'),
);

const progressRoute = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/api/grammar/progress/route.ts'),
  'utf8',
);
check(
  '4.2: POST /api/grammar/progress supports both camelCase and snake_case payloads and grants immediate mastery at >=80%',
  progressRoute.includes('body.lesson_id') &&
    progressRoute.includes('body.topic_slug') &&
    progressRoute.includes('body.mastery_level') &&
    progressRoute.includes('currentScore >= 80'),
);

const practicePage = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/grammar/practice/page.tsx'),
  'utf8',
);
check(
  '4.3: Practice page renders clickable Word Bank pills for fill_blank exercises with options',
  practicePage.includes('Chạm chọn nhanh từ gợi ý (hoặc tự gõ bên dưới):'),
);
check(
  '4.4: Practice page saves topic progress and records wrong answers for 14-day review',
  practicePage.includes('saveLocalGrammarProgress') &&
    practicePage.includes('recordGrammarAttemptLocal') &&
    practicePage.includes("authFetch('/api/grammar/progress'") &&
    practicePage.includes("authFetch('/api/grammar/review'"),
);

const grammarMainPage = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/grammar/page.tsx'),
  'utf8',
);
check(
  '4.5: Grammar main page displays Orientation Banner, Symbol Legend, TenseTimeline, and updates wrongQueueCount accurately on focus',
  grammarMainPage.includes('Bắt đầu từ mất gốc (#00)') &&
    grammarMainPage.includes('Chú giải ký hiệu cho người mới:') &&
    grammarMainPage.includes('<TenseTimeline') &&
    grammarMainPage.includes('setWrongQueueCount(readLocalGrammarWrongQueue(14).length)') &&
    grammarMainPage.includes('Đến hạn ôn') &&
    grammarMainPage.includes('Thành thạo'),
);

const tenseTimelineFile = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/grammar/TenseTimeline.tsx'),
  'utf8',
);
check(
  '4.6: TenseTimeline supports past_perfect_continuous (before past_perfect), future_continuous, be_going_to, and future_in_the_past',
  tenseTimelineFile.includes('past_perfect_continuous:') &&
    tenseTimelineFile.includes('future_continuous:') &&
    tenseTimelineFile.includes('be_going_to:') &&
    tenseTimelineFile.includes('future_in_the_past:') &&
    tenseTimelineFile.indexOf('return TENSE_DATA.past_perfect_continuous') <
      tenseTimelineFile.indexOf('return TENSE_DATA.past_perfect;'),
);

console.log('\n======================================================================');
console.log(`   SUMMARY: ${passed} / ${total} PASSED (${failed} FAILED)`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
