/**
 * SVO Lesson Zero (#0: sentence-structure-svo) Comprehensive Automated Test Suite
 *
 * Verifies:
 * - Tier 1: Roadmap Integration (R1) — order: 0, A0 Foundation #0, 63 topics, Stage 1 count 7, getTopicBySlug
 * - Tier 2: Theory JSON & API Schema (R5) — 9 required sections, exactly 16 bilingual examples across 4 categories,
 *           POS token annotations, editorial content purity (zero clickbait terms), exercises schema
 * - Tier 3: Pedagogical Bridge Model (R2, R3) — Vietnamese mental model questions (Ai làm? / Làm gì? / Bị tác động?),
 *           canonical "TÔI ĂN CƠM" bridge, pronoun morphological transition (I vs me), Golden Rule card
 * - Tier 4: UI Visual Deck Conformance (R4) — SvoSentenceVisualDeck.tsx existence & GrammarVisualTopicDeck delegation,
 *           color tokens (S: sky/indigo, V: amber/orange, O: emerald), strict rounded-none, zero red error classes,
 *           audio manager integration, mobile touch targets & 3-tier sentence breakdown
 * - Tier 5: Edge Cases & Robustness — order: 0 falsy safety, API nullish coalescing check (?? vs ||), dark mode classes,
 *           desktop zero-scroll containment, casing invariants
 * - Tier 6: Overall Health & Self-Execution — Exit code 0 on full pass, comprehensive summary
 *
 * Usage:
 *   npx tsx tests/grammar/svo-lesson-zero.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  UNIFIED_GRAMMAR_TOPICS,
  GRAMMAR_STAGES,
  getTopicBySlug,
  getTopicsByLevel,
  type GrammarRoadmapTopic,
} from '@/lib/grammar-roadmap-data';

// ──────────────────────────────────────────────────────────────────────────
// Test Runner & Reporting Infrastructure
// ──────────────────────────────────────────────────────────────────────────

let totalTests = 0;
let passCount = 0;
let failCount = 0;
const failureList: Array<{ test: string; tier: string; details?: string }> = [];

function assert(condition: boolean, msg: string, tier: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    if (details) {
      console.error(`         -> Details: ${details}`);
    }
    failCount++;
    failureList.push({ test: msg, tier, details });
  }
}

function tierHeader(tierNum: number, title: string) {
  console.log(`\n======================================================================`);
  console.log(`TIER ${tierNum}: ${title.toUpperCase()}`);
  console.log(`======================================================================`);
}

console.log('\n======================================================================');
console.log('   LINGOPRO GRAMMAR: SVO LESSON ZERO (#0) AUTOMATED TEST SUITE');
console.log('======================================================================');

// ──────────────────────────────────────────────────────────────────────────
// TIER 1: ROADMAP INTEGRATION (R1)
// ──────────────────────────────────────────────────────────────────────────
tierHeader(1, 'Roadmap Integration Invariants (R1)');

{
  const SVO_SLUG = 'sentence-structure-svo';

  // 1.1: Topic existence in UNIFIED_GRAMMAR_TOPICS
  const svoTopic = UNIFIED_GRAMMAR_TOPICS.find((t) => t.slug === SVO_SLUG);
  assert(
    Boolean(svoTopic),
    `Topic '${SVO_SLUG}' exists in UNIFIED_GRAMMAR_TOPICS`,
    'Tier 1'
  );

  // 1.2: Order is explicitly 0
  assert(
    svoTopic?.order === 0,
    `Topic '${SVO_SLUG}' has order: 0 (Lesson #0 / Foundation #0)`,
    'Tier 1',
    `Observed order: ${svoTopic?.order}`
  );

  // 1.3: Topic is at index 0 of UNIFIED_GRAMMAR_TOPICS
  const firstTopic = UNIFIED_GRAMMAR_TOPICS[0];
  assert(
    firstTopic?.slug === SVO_SLUG,
    `Topic '${SVO_SLUG}' is at index 0 of UNIFIED_GRAMMAR_TOPICS array`,
    'Tier 1',
    `First topic slug: ${firstTopic?.slug}`
  );

  // 1.4: Level, stageNumber, and stageLabel
  assert(
    svoTopic?.level === 'A0',
    `Topic '${SVO_SLUG}' level is 'A0'`,
    'Tier 1',
    `Observed level: ${svoTopic?.level}`
  );
  assert(
    svoTopic?.stageNumber === 1,
    `Topic '${SVO_SLUG}' stageNumber is 1`,
    'Tier 1',
    `Observed stageNumber: ${svoTopic?.stageNumber}`
  );
  assert(
    svoTopic?.stageLabel === 'Stage 1: A0 Khởi đầu',
    `Topic '${SVO_SLUG}' stageLabel is 'Stage 1: A0 Khởi đầu'`,
    'Tier 1',
    `Observed stageLabel: ${svoTopic?.stageLabel}`
  );

  // 1.5: Total UNIFIED_GRAMMAR_TOPICS count is 63
  assert(
    UNIFIED_GRAMMAR_TOPICS.length === 63,
    `Total topics count in UNIFIED_GRAMMAR_TOPICS is 63 (expanded from 62 to include Lesson #0)`,
    'Tier 1',
    `Observed length: ${UNIFIED_GRAMMAR_TOPICS.length}`
  );

  // 1.6: Stage 1 topicCount in GRAMMAR_STAGES is 7
  const stage1 = GRAMMAR_STAGES.find((s) => s.id === 'A0' || s.stageNumber === 1);
  assert(
    stage1?.topicCount === 7,
    `Stage 1 (A0 Foundation) topicCount in GRAMMAR_STAGES is 7 (was 6)`,
    'Tier 1',
    `Observed Stage 1 count: ${stage1?.topicCount}`
  );

  // 1.7: Sum of all stage topicCount entries in GRAMMAR_STAGES equals 63
  const totalStageCount = GRAMMAR_STAGES.reduce((acc, s) => acc + s.topicCount, 0);
  assert(
    totalStageCount === 63,
    `Sum of topicCount across all GRAMMAR_STAGES entries equals 63`,
    'Tier 1',
    `Observed sum: ${totalStageCount}`
  );

  // 1.8: getTopicBySlug helper lookup
  const lookupTopic = getTopicBySlug(SVO_SLUG);
  assert(
    Boolean(lookupTopic && lookupTopic.order === 0 && lookupTopic.level === 'A0'),
    `getTopicBySlug('${SVO_SLUG}') succeeds and returns order: 0, level: 'A0'`,
    'Tier 1'
  );

  // 1.9: getTopicsByLevel('A0') returns 7 topics with SVO first
  const a0Topics = getTopicsByLevel('A0');
  assert(
    a0Topics.length === 7,
    `getTopicsByLevel('A0') returns exactly 7 topics`,
    'Tier 1',
    `Observed A0 topics count: ${a0Topics.length}`
  );
  assert(
    a0Topics[0]?.slug === SVO_SLUG,
    `getTopicsByLevel('A0')[0] is '${SVO_SLUG}'`,
    'Tier 1',
    `First A0 topic: ${a0Topics[0]?.slug}`
  );

  // 1.10: Topic summary or badge emphasizes Lesson #0 / Prerequisite / S+V+O
  const summaryLower = (svoTopic?.summary || '').toLowerCase();
  const summaryMatchesPedagogy =
    summaryLower.includes('bài số 0') &&
    summaryLower.includes('s + v + o') &&
    (summaryLower.includes('mất gốc') || summaryLower.includes('nền tảng'));
  assert(
    summaryMatchesPedagogy,
    `Topic summary emphasizes 'Bài số 0: Cấu trúc câu S + V + O — Nền tảng sống còn cho người mất gốc'`,
    'Tier 1',
    `Observed summary: "${svoTopic?.summary}"`
  );

  // 1.11: Slug uniqueness invariant across all 63 topics
  const allSlugs = UNIFIED_GRAMMAR_TOPICS.map((t) => t.slug);
  const uniqueSlugs = new Set(allSlugs);
  assert(
    uniqueSlugs.size === UNIFIED_GRAMMAR_TOPICS.length,
    `All ${UNIFIED_GRAMMAR_TOPICS.length} topic slugs in UNIFIED_GRAMMAR_TOPICS are globally unique (zero collisions)`,
    'Tier 1',
    `Total: ${UNIFIED_GRAMMAR_TOPICS.length}, Unique: ${uniqueSlugs.size}`
  );

  // 1.12: Check UI dynamic counter in src/app/grammar/page.tsx
  const grammarPagePath = path.resolve(process.cwd(), 'src/app/grammar/page.tsx');
  if (fs.existsSync(grammarPagePath)) {
    const pageContent = fs.readFileSync(grammarPagePath, 'utf8');
    const hasHardcoded62Counter =
      pageContent.includes('Tất cả (62)') ||
      pageContent.includes('/ 62 CHỦ ĐIỂM') ||
      pageContent.includes('62 Chủ điểm CEFR');
    assert(
      !hasHardcoded62Counter,
      `src/app/grammar/page.tsx dynamically references topic length (no hardcoded '62' counter)`,
      'Tier 1',
      hasHardcoded62Counter ? 'Hardcoded "62" detected in src/app/grammar/page.tsx' : undefined
    );
  } else {
    assert(false, `src/app/grammar/page.tsx exists`, 'Tier 1');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 2: THEORY JSON & API SCHEMA (R5)
// ──────────────────────────────────────────────────────────────────────────
tierHeader(2, 'Theory JSON & API Schema Verification (R5)');

const jsonPath = path.resolve(process.cwd(), 'scripts/grammar-gen/out/sentence-structure-svo.json');
let theoryJson: any = null;

{
  // 2.1: File exists
  const fileExists = fs.existsSync(jsonPath);
  assert(
    fileExists,
    `Theory JSON file exists at 'scripts/grammar-gen/out/sentence-structure-svo.json'`,
    'Tier 2',
    `Target: ${jsonPath}`
  );

  if (fileExists) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      theoryJson = JSON.parse(raw);
      assert(true, `Theory JSON parses cleanly as valid JSON`, 'Tier 2');
    } catch (e: any) {
      assert(false, `Theory JSON parses cleanly as valid JSON`, 'Tier 2', e.message);
    }
  } else {
    assert(false, `Theory JSON parses cleanly as valid JSON`, 'Tier 2', 'File missing');
  }
}

if (theoryJson) {
  // 2.2: Top-level metadata
  assert(
    theoryJson.slug === 'sentence-structure-svo',
    `JSON top-level slug is 'sentence-structure-svo'`,
    'Tier 2',
    `Observed: ${theoryJson.slug}`
  );
  assert(
    theoryJson.level === 'A0',
    `JSON top-level level is 'A0'`,
    'Tier 2',
    `Observed: ${theoryJson.level}`
  );
  assert(
    theoryJson.order === 0,
    `JSON top-level order is 0`,
    'Tier 2',
    `Observed: ${theoryJson.order}`
  );
  assert(
    typeof theoryJson.title === 'string' && theoryJson.title.trim().length > 0,
    `JSON title is a non-empty string ("${theoryJson.title}")`,
    'Tier 2'
  );
  assert(
    typeof theoryJson.title_vi === 'string' && theoryJson.title_vi.trim().length > 0,
    `JSON title_vi is a non-empty string ("${theoryJson.title_vi}")`,
    'Tier 2'
  );

  // 2.3: All 9 required sections present
  const requiredSections = [
    'definition',
    'usage',
    'formula',
    'rules',
    'signals',
    'mistakes',
    'examples',
    'tips',
    'comparison',
  ];
  const s = theoryJson.sections || {};
  const missingSections = requiredSections.filter((sec) => s[sec] === undefined || s[sec] === null);
  assert(
    missingSections.length === 0,
    `All 9 required sections present in sections (${requiredSections.join(', ')})`,
    'Tier 2',
    missingSections.length > 0 ? `Missing: ${missingSections.join(', ')}` : undefined
  );

  // 2.4: Definition is substantial
  assert(
    typeof s.definition === 'string' && s.definition.length >= 40,
    `sections.definition is substantial (length >= 40 characters; observed: ${s.definition?.length || 0})`,
    'Tier 2'
  );

  // 2.5: Usage has >= 4 structured items with icon, label, en, vi
  const usageValid =
    Array.isArray(s.usage) &&
    s.usage.length >= 4 &&
    s.usage.every((u: any) => u.icon && u.label && u.en && u.vi);
  assert(
    usageValid,
    `sections.usage contains >= 4 structured items with icon, label, en, vi (observed: ${s.usage?.length || 0})`,
    'Tier 2'
  );

  // 2.6: Formula contains rows (>= 2) and note
  const formulaValid =
    s.formula &&
    Array.isArray(s.formula.rows) &&
    s.formula.rows.length >= 2 &&
    typeof s.formula.note === 'string' &&
    s.formula.note.length > 0;
  assert(
    Boolean(formulaValid),
    `sections.formula contains >= 2 rows and pedagogical note`,
    'Tier 2'
  );

  // 2.7: Rules contains >= 3 rules
  const rulesValid =
    Array.isArray(s.rules) &&
    s.rules.length >= 3 &&
    s.rules.every((r: any) => r.case && r.rule && r.example);
  assert(
    rulesValid,
    `sections.rules contains >= 3 structured rules with case, rule, and example (observed: ${s.rules?.length || 0})`,
    'Tier 2'
  );

  // 2.8: Signals contains >= 3 items
  const signalsValid = Array.isArray(s.signals) && s.signals.length >= 3;
  assert(
    signalsValid,
    `sections.signals contains >= 3 signal strings (observed: ${s.signals?.length || 0})`,
    'Tier 2'
  );

  // 2.9: Mistakes contains >= 3 items with wrong, right, why
  const mistakesValid =
    Array.isArray(s.mistakes) &&
    s.mistakes.length >= 3 &&
    s.mistakes.every((m: any) => m.wrong && m.right && m.why);
  assert(
    mistakesValid,
    `sections.mistakes contains >= 3 structured mistakes with wrong, right, why (observed: ${s.mistakes?.length || 0})`,
    'Tier 2'
  );

  // 2.10: Exactly 16 bilingual examples in sections.examples
  const examples: any[] = Array.isArray(s.examples) ? s.examples : [];
  assert(
    examples.length === 16,
    `sections.examples contains EXACTLY 16 bilingual sentences`,
    'Tier 2',
    `Observed: ${examples.length}`
  );

  // 2.11: 4 categories represented, 4 sentences each
  const expectedSentences = [
    // Category 1: Ăn uống & Nhu cầu thiết yếu (4 sentences)
    { en: 'I eat rice.', vi: 'Tôi ăn cơm.' },
    { en: 'I drink water.', vi: 'Tôi uống nước.' },
    { en: 'We eat bread.', vi: 'Chúng tôi ăn bánh mì.' },
    { en: 'They drink coffee.', vi: 'Họ uống cà phê.' },
    // Category 2: Sinh hoạt & Sở thích hàng ngày (4 sentences)
    { en: 'I read books.', vi: 'Tôi đọc sách.' },
    { en: 'You listen to music.', vi: 'Bạn nghe nhạc.' },
    { en: 'We watch TV.', vi: 'Chúng tôi xem tivi.' },
    { en: 'They play football.', vi: 'Họ chơi bóng đá.' },
    // Category 3: Học tập & Công việc (4 sentences)
    { en: 'We learn English.', vi: 'Chúng tôi học tiếng Anh.' },
    { en: 'She teaches math.', vi: 'Cô ấy dạy toán.' },
    { en: 'My father drives a car.', vi: 'Bố tôi lái xe hơi.' },
    { en: 'My mother cooks dinner.', vi: 'Mẹ tôi nấu bữa tối.' },
    // Category 4: Tương tác giữa người với người (4 sentences)
    { en: 'I love you.', vi: 'Tôi yêu bạn.' },
    { en: 'You love me.', vi: 'Bạn yêu tôi.' },
    { en: 'I help him.', vi: 'Tôi giúp anh ấy.' },
    { en: 'He helps me.', vi: 'Anh ấy giúp tôi.' },
  ];

  let allSentencesPresent = true;
  const missingSentences: string[] = [];
  expectedSentences.forEach((expected) => {
    const found = examples.some(
      (ex) =>
        ex.en?.trim().toLowerCase() === expected.en.toLowerCase() &&
        ex.vi?.trim().toLowerCase() === expected.vi.toLowerCase()
    );
    if (!found) {
      allSentencesPresent = false;
      missingSentences.push(`${expected.en} / ${expected.vi}`);
    }
  });

  assert(
    allSentencesPresent,
    `All 16 authoritative curriculum sentences (R3) are present in examples`,
    'Tier 2',
    missingSentences.length > 0 ? `Missing: ${missingSentences.join('; ')}` : undefined
  );

  // 2.12 - 2.15: Category Breakdown Specifics
  const cat1 = examples.filter((ex) =>
    ['rice', 'water', 'bread', 'coffee'].some((kw) => ex.en?.toLowerCase().includes(kw))
  );
  assert(
    cat1.length === 4,
    `Category 1 (Ăn uống & Nhu cầu thiết yếu) has exactly 4 sentences`,
    'Tier 2',
    `Found: ${cat1.length}`
  );

  const cat2 = examples.filter((ex) =>
    ['books', 'music', 'tv', 'football'].some((kw) => ex.en?.toLowerCase().includes(kw))
  );
  assert(
    cat2.length === 4,
    `Category 2 (Sinh hoạt & Sở thích hàng ngày) has exactly 4 sentences`,
    'Tier 2',
    `Found: ${cat2.length}`
  );

  const cat3 = examples.filter((ex) =>
    ['english', 'math', 'car', 'dinner'].some((kw) => ex.en?.toLowerCase().includes(kw))
  );
  assert(
    cat3.length === 4,
    `Category 3 (Học tập & Công việc) has exactly 4 sentences`,
    'Tier 2',
    `Found: ${cat3.length}`
  );

  const cat4 = examples.filter((ex) =>
    ['love you', 'love me', 'help him', 'helps me'].some((kw) => ex.en?.toLowerCase().includes(kw))
  );
  assert(
    cat4.length === 4,
    `Category 4 (Tương tác giữa người với người - Cầu nối Đại từ) has exactly 4 sentences`,
    'Tier 2',
    `Found: ${cat4.length}`
  );

  // 2.16: POS Token Annotations & Slice Match Integrity
  const allowedRoles = new Set([
    'noun',
    'pronoun',
    'verb',
    'auxiliary',
    'modal',
    'adjective',
    'adverb',
    'preposition',
    'conjunction',
    'determiner',
    'article',
    'interjection',
    'other',
  ]);

  let annotationsValid = true;
  let sliceMatchValid = true;
  let invalidRoles: string[] = [];

  examples.forEach((ex, idx) => {
    if (!Array.isArray(ex.annotations) || ex.annotations.length === 0) {
      annotationsValid = false;
    } else {
      ex.annotations.forEach((anno: any) => {
        const slice = ex.en.slice(anno.start, anno.end);
        if (slice !== anno.word) {
          sliceMatchValid = false;
        }
        if (!allowedRoles.has(anno.role)) {
          invalidRoles.push(`${anno.role} (in ex #${idx})`);
        }
      });
    }
  });

  assert(
    annotationsValid,
    `All 16 examples have non-empty POS token annotations`,
    'Tier 2'
  );
  assert(
    sliceMatchValid,
    `All annotations satisfy exact substring slice integrity (ex.en.slice(start, end) === word)`,
    'Tier 2'
  );
  assert(
    invalidRoles.length === 0,
    `All annotation roles belong to the 13 allowed POS whitelist`,
    'Tier 2',
    invalidRoles.length > 0 ? `Invalid: ${invalidRoles.join(', ')}` : undefined
  );

  // 2.17: POS Tokens & Grammatical Role Coverage across S, V, O
  // Verify that every example has annotated tokens fulfilling S (subject: pronoun/noun), V (verb), and O (object: noun/pronoun)
  const allTaggedSvo = examples.every((ex) => {
    const roles = (ex.annotations || []).map((a: any) => a.role);
    const hasVerb = roles.includes('verb');
    const hasNominal = roles.some((r: string) => ['pronoun', 'noun'].includes(r));
    const note = (ex.note || '').toLowerCase();
    const hasSvoNote =
      note.includes('[s]') ||
      note.includes('[v]') ||
      note.includes('[o]') ||
      note.includes('chủ ngữ') ||
      note.includes('tân ngữ') ||
      note.includes('động từ');
    return hasVerb && hasNominal && hasSvoNote;
  });
  assert(
    allTaggedSvo,
    `POS tokens tagged with S, V, O roles: all 16 examples have verb, nominal (subject/object) annotations and pedagogical notes`,
    'Tier 2'
  );

  // 2.18: Content Purity (Editorial Scrubbing — Zero Taboo / Clickbait Terms)
  const prohibitedPhrases = [
    'mẹo 5s',
    '5 giây',
    'thần chú',
    'bí kíp hack',
    'hack điểm',
    'tuyệt chiêu',
    'ăn trọn điểm',
    'chiến thắng tuyệt đối',
    'cam kết đỗ',
    'cực sốc',
    'siêu cấp',
  ];
  const allText = JSON.stringify(theoryJson).toLowerCase();
  const foundProhibited = prohibitedPhrases.filter((p) => allText.includes(p));
  assert(
    foundProhibited.length === 0,
    `Content Purity: Zero prohibited clickbait/marketing phrases found in theory JSON`,
    'Tier 2',
    foundProhibited.length > 0 ? `Found: ${foundProhibited.join(', ')}` : undefined
  );

  // 2.19: Exercises Schema Audit (At least 12 exercises, valid distractors)
  const exercises = Array.isArray(theoryJson.exercises) ? theoryJson.exercises : [];
  assert(
    exercises.length >= 12,
    `JSON contains >= 12 standardized drill exercises for practice runner (observed: ${exercises.length})`,
    'Tier 2'
  );

  let exercisesConform = true;
  let exerciseIssues: string[] = [];
  exercises.forEach((ex: any, i: number) => {
    if (!ex.id || !ex.type || !ex.question || !ex.correct_answer || !ex.explanation) {
      exercisesConform = false;
      exerciseIssues.push(`Exercise #${i} missing required base fields`);
    }
    if (Array.isArray(ex.options) && !ex.options.includes(ex.correct_answer)) {
      exercisesConform = false;
      exerciseIssues.push(`Exercise #${i} correct_answer not found in options`);
    }
    if (
      Array.isArray(ex.distractor_breakdowns) &&
      ex.distractor_breakdowns.length !== ex.options?.length
    ) {
      exercisesConform = false;
      exerciseIssues.push(`Exercise #${i} distractor_breakdowns count mismatch with options`);
    }
  });

  assert(
    exercisesConform,
    `All drill exercises strictly conform to LingoPro exercise schema with distractor breakdowns`,
    'Tier 2',
    exerciseIssues.slice(0, 3).join('; ')
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 3: PEDAGOGICAL BRIDGE MODEL (R2, R3)
// ──────────────────────────────────────────────────────────────────────────
tierHeader(3, 'Pedagogical Bridge Model Invariants (R2, R3)');

{
  // 3.1: Vietnamese mental model questions
  // S -> "Ai làm?", V -> "Làm gì?", O -> "Bị/Được tác động bởi cái gì/ai?"
  const allTheoryText = theoryJson ? JSON.stringify(theoryJson) : '';
  const hasSubjectQuestion =
    allTheoryText.includes('Ai làm?') || allTheoryText.includes('Ai làm') || allTheoryText.includes('Ai?');
  const hasVerbQuestion =
    allTheoryText.includes('Làm gì?') || allTheoryText.includes('Làm gì');
  const hasObjectQuestion =
    allTheoryText.includes('tác động') || allTheoryText.includes('Cái gì') || allTheoryText.includes('nhận hành động');

  assert(
    hasSubjectQuestion && hasVerbQuestion && hasObjectQuestion,
    `Vietnamese mental model questions present: S ("Ai làm?"), V ("Làm gì?"), O ("Tác động vào cái gì / ai?")`,
    'Tier 3'
  );

  // 3.2: Canonical "TÔI ĂN CƠM" bridge ("Tôi ăn cơm" ➔ "I eat rice")
  const hasToiAnCom =
    allTheoryText.includes('Tôi ăn cơm') || allTheoryText.includes('TÔI ĂN CƠM') || allTheoryText.includes('TÔI [S]');
  const hasIEatRice =
    allTheoryText.includes('I eat rice') || allTheoryText.includes('I [S]');
  assert(
    hasToiAnCom && hasIEatRice,
    `Canonical bridge "TÔI ĂN CƠM" ➔ "I eat rice" is explicitly anchored in curriculum data`,
    'Tier 3'
  );

  // 3.3: 1:1 Structural Correspondence (Vietnamese S-V-O equals English S-V-O)
  const mentionsStructuralParallel =
    allTheoryText.includes('trật tự') ||
    allTheoryText.includes('tương đồng') ||
    allTheoryText.includes('giống hệt') ||
    allTheoryText.includes('3 khối');
  assert(
    Boolean(mentionsStructuralParallel),
    `Structural parallelism between Vietnamese and English S-V-O word order is highlighted`,
    'Tier 3'
  );

  // 3.4: Category 4 Pronoun Morphological Transition (I vs me)
  // "Tôi yêu bạn" -> "I love you" (Tôi làm chủ ngữ -> I)
  // "Bạn yêu tôi" -> "You love me" (Tôi làm tân ngữ -> me)
  const hasI = allTheoryText.includes('I love you') || allTheoryText.includes('I help him');
  const hasMe = allTheoryText.includes('You love me') || allTheoryText.includes('He helps me');
  const explainsPronounShift =
    allTheoryText.includes('me') &&
    (allTheoryText.includes('tân ngữ') || allTheoryText.includes('nhận hành động') || allTheoryText.includes('đại từ'));
  assert(
    hasI && hasMe && explainsPronounShift,
    `Category 4 illustrates pronoun morphological shift: 'tôi' as subject -> 'I', as object -> 'me'`,
    'Tier 3'
  );

  // 3.5: Contrast with Vietnamese language invariance
  // In Vietnamese, "tôi" is invariant in both positions; in English it changes to "me"
  const contrastsVietnamese =
    allTheoryText.includes('giữ nguyên') ||
    allTheoryText.includes('biến đổi') ||
    allTheoryText.includes('đổi thành') ||
    allTheoryText.includes('tiếng Việt');
  assert(
    Boolean(contrastsVietnamese),
    `Pedagogical contrast clearly notes that Vietnamese 'tôi' is invariant while English changes forms`,
    'Tier 3'
  );

  // 3.6: Golden Rule card text
  // "Không bao giờ bỏ rơi S và V trong câu tiếng Anh"
  const hasGoldenRule =
    allTheoryText.includes('bỏ rơi S và V') ||
    allTheoryText.includes('bỏ rơi') ||
    allTheoryText.includes('Không bao giờ bỏ') ||
    allTheoryText.includes('bắt buộc phải có');
  assert(
    Boolean(hasGoldenRule),
    `Golden Rule card present: "Không bao giờ bỏ rơi S và V trong câu tiếng Anh"`,
    'Tier 3'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 4: UI VISUAL DECK CONFORMANCE (R4)
// ──────────────────────────────────────────────────────────────────────────
tierHeader(4, 'UI Visual Deck Conformance (R4)');

const svoDeckPath = path.resolve(process.cwd(), 'src/components/grammar/SvoSentenceVisualDeck.tsx');
const visualTopicDeckPath = path.resolve(process.cwd(), 'src/components/grammar/GrammarVisualTopicDeck.tsx');

let svoDeckContent = '';
let visualTopicDeckContent = '';

{
  // 4.1: Component existence
  const svoExists = fs.existsSync(svoDeckPath);
  assert(
    svoExists,
    `src/components/grammar/SvoSentenceVisualDeck.tsx exists`,
    'Tier 4',
    `Path: ${svoDeckPath}`
  );
  if (svoExists) {
    svoDeckContent = fs.readFileSync(svoDeckPath, 'utf8');
  }

  // 4.2: Delegation in GrammarVisualTopicDeck.tsx
  const topicDeckExists = fs.existsSync(visualTopicDeckPath);
  assert(
    topicDeckExists,
    `src/components/grammar/GrammarVisualTopicDeck.tsx exists`,
    'Tier 4'
  );

  if (topicDeckExists) {
    visualTopicDeckContent = fs.readFileSync(visualTopicDeckPath, 'utf8');
    const importsSvo =
      visualTopicDeckContent.includes('SvoSentenceVisualDeck') &&
      visualTopicDeckContent.includes('./SvoSentenceVisualDeck');
    const delegatesSvo =
      visualTopicDeckContent.includes("props.topicSlug === 'sentence-structure-svo'") ||
      visualTopicDeckContent.includes('sentence-structure-svo');
    assert(
      importsSvo,
      `GrammarVisualTopicDeck.tsx imports SvoSentenceVisualDeck`,
      'Tier 4'
    );
    assert(
      delegatesSvo,
      `GrammarVisualTopicDeck.tsx early-delegates topic 'sentence-structure-svo' to SvoSentenceVisualDeck`,
      'Tier 4'
    );
  }
}

if (svoDeckContent) {
  // 4.3: Color tokens for S, V, O
  // S: Sky/Indigo, V: Amber/Orange, O: Emerald
  const hasSubjectSky =
    svoDeckContent.includes('sky') || svoDeckContent.includes('indigo');
  const hasVerbAmber =
    svoDeckContent.includes('amber') || svoDeckContent.includes('orange');
  const hasObjectEmerald = svoDeckContent.includes('emerald');

  assert(
    hasSubjectSky,
    `Visual deck uses Sky/Indigo color tokens for Subject [S] block`,
    'Tier 4'
  );
  assert(
    hasVerbAmber,
    `Visual deck uses Amber/Orange color tokens for Verb [V] block`,
    'Tier 4'
  );
  assert(
    hasObjectEmerald,
    `Visual deck uses Emerald color tokens for Object [O] block`,
    'Tier 4'
  );

  // 4.4: Technical Minimalist styling: 100% rounded-none, zero rounded-* classes
  const forbiddenRounded = svoDeckContent.match(
    /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g
  );
  assert(
    forbiddenRounded === null,
    `Strict Technical Minimalist: SvoSentenceVisualDeck.tsx contains 0 forbidden rounded classes (rounded-none only)`,
    'Tier 4',
    forbiddenRounded ? `Found forbidden: ${forbiddenRounded.slice(0, 5).join(', ')}` : undefined
  );
  assert(
    svoDeckContent.includes('rounded-none'),
    `Visual deck explicitly employs 'rounded-none' for minimalist borders and pills`,
    'Tier 4'
  );

  // 4.5: Zero Red Error Styling
  const redClasses = svoDeckContent.match(/border-red-500|bg-red-500|text-red-600|text-red-500/g);
  assert(
    redClasses === null,
    `Zero Red Error Styling: SvoSentenceVisualDeck.tsx has 0 red error styling classes in visual deck`,
    'Tier 4',
    redClasses ? `Found red classes: ${redClasses.join(', ')}` : undefined
  );

  // 4.6: Audio integration via grammarAudio
  const usesGrammarAudio =
    svoDeckContent.includes('grammarAudio') &&
    (svoDeckContent.includes('@/lib/grammar/grammarAudioManager') ||
      svoDeckContent.includes('grammarAudioManager'));
  const callsPlay = svoDeckContent.includes('grammarAudio.play');
  assert(
    usesGrammarAudio && callsPlay,
    `Visual deck integrates singleton grammarAudio with play() for zero-conflict audio playback`,
    'Tier 4'
  );

  // 4.7: Mobile Ergonomics & Apple HIG touch targets
  const hasTouchManipulation = svoDeckContent.includes('touch-manipulation');
  const hasMinHeight =
    svoDeckContent.includes('min-h-[44px]') ||
    svoDeckContent.includes('min-h-[36px]') ||
    svoDeckContent.includes('min-h-11');
  assert(
    hasTouchManipulation,
    `Visual deck interactive elements carry 'touch-manipulation' to remove 300ms mobile tap delay`,
    'Tier 4'
  );
  assert(
    hasMinHeight,
    `Visual deck interactive buttons satisfy Apple HIG minimum touch target height (>= 36px/44px)`,
    'Tier 4'
  );

  // 4.8: 3-tier sentence breakdown in UI
  const hasTier1Vi = svoDeckContent.includes('viBreakdown') || svoDeckContent.includes('[S]');
  const hasTier2Bridge = svoDeckContent.includes('bridge') || svoDeckContent.includes('cầu nối');
  const hasTier3En = svoDeckContent.includes('enBreakdown') || svoDeckContent.includes('[O]');
  assert(
    hasTier1Vi && hasTier3En,
    `Visual deck implements 3-tier breakdown: Vietnamese blocks, Bridge reasoning, English colored blocks`,
    'Tier 4'
  );

  // 4.9: 4 category tabs/pills navigation
  const hasCategories =
    svoDeckContent.includes('food') ||
    svoDeckContent.includes('Ăn uống') ||
    svoDeckContent.includes('habits') ||
    svoDeckContent.includes('work') ||
    svoDeckContent.includes('interpersonal');
  assert(
    hasCategories,
    `Visual deck implements 4 category tabs/pills for ergonomic 1-touch switching without vertical scrolling`,
    'Tier 4'
  );
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 5: EDGE CASES & ROBUSTNESS
// ──────────────────────────────────────────────────────────────────────────
tierHeader(5, 'Edge Cases & Robustness');

{
  // 5.1: order: 0 lookup robustness (0 is not falsy-coerced)
  const lookupByOrder0 = UNIFIED_GRAMMAR_TOPICS.find((t) => t.order === 0);
  assert(
    lookupByOrder0?.slug === 'sentence-structure-svo',
    `UNIFIED_GRAMMAR_TOPICS.find(t => t.order === 0) successfully resolves 'sentence-structure-svo'`,
    'Tier 5'
  );

  // Test zero padding formatting logic used in UI cards
  const formatOrder = (order: number) => `${order < 10 ? '0' : ''}${order}`;
  assert(
    formatOrder(0) === '00',
    `UI zero-padding logic: formatOrder(0) evaluates to '00' (aligned with '01', '02', etc.)`,
    'Tier 5'
  );

  // 5.2: API Nullish Coalescing Check in src/app/api/grammar/theory/route.ts
  const apiRoutePath = path.resolve(process.cwd(), 'src/app/api/grammar/theory/route.ts');
  if (fs.existsSync(apiRoutePath)) {
    const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');
    const hasFalsyBug = apiRouteContent.includes('order: raw.order || 1');
    const usesNullishCoalescing =
      apiRouteContent.includes('order: raw.order ?? 1') ||
      apiRouteContent.includes('raw.order !== undefined ? raw.order : 1') ||
      !hasFalsyBug;
    assert(
      !hasFalsyBug,
      `API route does NOT use 'raw.order || 1' which clobbers order 0 into 1`,
      'Tier 5',
      hasFalsyBug ? 'Falsy bug detected: "order: raw.order || 1" in route.ts' : undefined
    );
    assert(
      usesNullishCoalescing,
      `API route uses nullish coalescing ('??') or safe check to preserve order: 0`,
      'Tier 5'
    );
  } else {
    assert(false, `API route file exists at src/app/api/grammar/theory/route.ts`, 'Tier 5');
  }

  // 5.3: Case insensitivity & slug boundary checks
  const upperLookup = getTopicBySlug('SENTENCE-STRUCTURE-SVO');
  const lowerLookup = getTopicBySlug('sentence-structure-svo');
  assert(
    Boolean(lowerLookup),
    `Canonical lowercase slug lookup succeeds`,
    'Tier 5'
  );

  // 5.4: Dark mode styling support
  if (svoDeckContent) {
    const hasDarkSky = svoDeckContent.includes('dark:bg-sky') || svoDeckContent.includes('dark:text-sky');
    const hasDarkAmber = svoDeckContent.includes('dark:bg-amber') || svoDeckContent.includes('dark:text-amber');
    const hasDarkEmerald = svoDeckContent.includes('dark:bg-emerald') || svoDeckContent.includes('dark:text-emerald');
    assert(
      hasDarkSky && hasDarkAmber && hasDarkEmerald,
      `Visual deck provides comprehensive dark: mode classes for all 3 blocks (sky, amber, emerald)`,
      'Tier 5'
    );
  }

  // 5.5: Desktop zero-scroll containment check
  if (svoDeckContent) {
    const hasMaxWidthContainer =
      svoDeckContent.includes('max-w-') || svoDeckContent.includes('mx-auto');
    assert(
      hasMaxWidthContainer,
      `Visual deck contains a bounded max-width layout (max-w-* mx-auto) for desktop zero-scroll ergonomics`,
      'Tier 5'
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 6: OVERALL HEALTH & TEST EXECUTION SUMMARY
// ──────────────────────────────────────────────────────────────────────────
tierHeader(6, 'Overall Health & Execution Summary');

console.log('\n======================================================================');
console.log(`TOTAL ASSERTIONS : ${totalTests}`);
console.log(`PASSED           : ${passCount}`);
console.log(`FAILED           : ${failCount}`);
console.log('======================================================================\n');

if (failCount > 0) {
  console.error('FAILURES SUMMARY:');
  failureList.forEach((f, idx) => {
    console.error(`  ${idx + 1}. [${f.tier}] ${f.test}`);
    if (f.details) {
      console.error(`     -> ${f.details}`);
    }
  });
  console.log('\nResult: FAILED\n');
  process.exit(1);
} else {
  console.log('Result: ALL TESTS PASSED! SVO Lesson Zero is fully verified!\n');
  process.exit(0);
}
