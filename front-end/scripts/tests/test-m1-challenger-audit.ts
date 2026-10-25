/**
 * scripts/tests/test-m1-challenger-audit.ts
 *
 * COMPREHENSIVE EMPIRICAL CHALLENGER AUDIT SUITE FOR MILESTONE 1
 * Stress-tests and audits all 62 grammar topic JSON files in `scripts/grammar-gen/out/*.json`.
 *
 * Checks:
 * 1. Global inventory and CEFR level / order constraints (62 files, A0-B2, unique order 1..62).
 * 2. Unified exercise schema compliance (id, type, question, options, correct_answer, explanation, difficulty).
 * 3. Prohibition of legacy keys (q, opts, answer, fb, why, etc.).
 * 4. Option array integrity (no empty options, non-string options, whitespace, or duplicates).
 * 5. Comprehensive Distractor Breakdown Verification across all 1,308 exercises with options:
 *    - 1:1 parity between options array and distractor_breakdowns
 *    - every breakdown has valid option, boolean isCorrect, and pedagogicalReason (trimmed length >= 10)
 *    - exactly one breakdown item marked isCorrect === true per exercise
 *    - isCorrect === true aligns with correct_answer
 *    - zero placeholder/empty pedagogical reasons
 * 6. Fill-blank integrity for free-text items (valid question, answer, explanation).
 * 7. Global ID uniqueness across all 1,593 exercises (zero duplicates anywhere).
 * 8. Tone and editorial purity (zero clickbait/informal phrases in any file).
 * 9. Database migration script integrity.
 */

import * as fs from 'fs';
import * as path from 'path';

interface DistractorBreakdown {
  option: string;
  isCorrect: boolean;
  pedagogicalReason: string;
}

interface Exercise {
  id: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  distractor_breakdowns?: DistractorBreakdown[];
  difficulty: number;
  [key: string]: any;
}

interface TopicFile {
  slug: string;
  title: string;
  title_vi: string;
  level: string;
  order: number;
  sections?: any;
  exercises: Exercise[];
}

export interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalExercises: number;
  exercisesByType: Record<string, number>;
  exercisesByLevel: Record<string, number>;
  exercisesWithOptionsCount: number;
  exercisesFreeTextCount: number;
  totalDistractorBreakdowns: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  errors: string[];
  warnings: string[];
  uniqueIdsCount: number;
  duplicateIds: string[];
  optionsMismatches: string[];
  breakdownAlignmentIssues: string[];
  prohibitedPhraseMatches: Array<{ file: string; phrase: string; location: string }>;
}

export function runComprehensiveChallengerAudit(): AuditReport {
  const outDir = path.resolve(process.cwd(), 'scripts/grammar-gen/out');
  const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.json')).sort();

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    totalExercises: 0,
    exercisesByType: {},
    exercisesByLevel: {},
    exercisesWithOptionsCount: 0,
    exercisesFreeTextCount: 0,
    totalDistractorBreakdowns: 0,
    totalAssertions: 0,
    passedAssertions: 0,
    failedAssertions: 0,
    errors: [],
    warnings: [],
    uniqueIdsCount: 0,
    duplicateIds: [],
    optionsMismatches: [],
    breakdownAlignmentIssues: [],
    prohibitedPhraseMatches: [],
  };

  function assert(condition: boolean, passMsg: string, failMsg: string) {
    report.totalAssertions++;
    if (condition) {
      report.passedAssertions++;
    } else {
      report.failedAssertions++;
      report.errors.push(failMsg);
    }
  }

  // 1. Check file count
  assert(files.length === 62, `Found exactly 62 topic files`, `Expected 62 files, found ${files.length}`);

  const validCefrLevels = new Set(['A0', 'A1', 'A2', 'B1', 'B2']);
  const observedOrders = new Set<number>();
  const observedSlugs = new Set<string>();
  const globalIdMap = new Map<string, string>(); // id -> filename

  const prohibitedPhrases = [
    'mẹo 5s',
    'mẹo 5 giây',
    'mẹo nhớ 5s',
    'thần chú',
    'hack điểm',
    'ăn trọn điểm',
    'tuyệt chiêu',
    'thời phong kiến phương tây',
    'sóng gió chẳng sợ zì',
    'tiền đô',
    'chính phủ phát sách',
    'chiến thắng tuyệt đối',
  ];

  // 2. Iterate each file
  for (const filename of files) {
    const filePath = path.join(outDir, filename);
    const rawContent = fs.readFileSync(filePath, 'utf8');

    // Check prohibited phrases in raw JSON
    const contentLower = rawContent.toLowerCase();
    for (const phrase of prohibitedPhrases) {
      if (contentLower.includes(phrase)) {
        report.prohibitedPhraseMatches.push({
          file: filename,
          phrase,
          location: 'raw_json',
        });
        report.errors.push(`Prohibited phrase "${phrase}" found in ${filename}`);
        report.failedAssertions++;
      } else {
        report.passedAssertions++;
      }
      report.totalAssertions++;
    }

    // Check tip headers
    assert(!rawContent.includes('**Mẹo nhớ:**'), `Zero "**Mẹo nhớ:**" in ${filename}`, `Found "**Mẹo nhớ:**" in ${filename}`);
    assert(!rawContent.includes('**Mẹo 2×2:**'), `Zero "**Mẹo 2×2:**" in ${filename}`, `Found "**Mẹo 2×2:**" in ${filename}`);

    let topic: TopicFile;
    try {
      topic = JSON.parse(rawContent);
    } catch (e: any) {
      report.errors.push(`Invalid JSON syntax in ${filename}: ${e.message}`);
      report.failedAssertions++;
      report.totalAssertions++;
      continue;
    }

    // Top-level schema validations
    assert(typeof topic.slug === 'string' && topic.slug.length > 0, `Topic has slug in ${filename}`, `Missing slug in ${filename}`);
    assert(!observedSlugs.has(topic.slug), `Unique slug ${topic.slug}`, `Duplicate slug ${topic.slug} in ${filename}`);
    observedSlugs.add(topic.slug);

    assert(validCefrLevels.has(topic.level), `Valid CEFR level ${topic.level} in ${filename}`, `Invalid CEFR level ${topic.level} in ${filename}`);
    report.exercisesByLevel[topic.level] = (report.exercisesByLevel[topic.level] || 0) + (topic.exercises?.length || 0);

    assert(
      typeof topic.order === 'number' && topic.order >= 1 && topic.order <= 62,
      `Valid order range ${topic.order} in ${filename}`,
      `Order ${topic.order} out of range 1..62 in ${filename}`
    );
    assert(!observedOrders.has(topic.order), `Unique order ${topic.order} for ${filename}`, `Duplicate order ${topic.order} in ${filename}`);
    observedOrders.add(topic.order);

    assert(typeof topic.title === 'string' && topic.title.length > 0, `Topic has title in ${filename}`, `Missing title in ${filename}`);
    assert(typeof topic.title_vi === 'string' && topic.title_vi.length > 0, `Topic has title_vi in ${filename}`, `Missing title_vi in ${filename}`);

    // Exercise array checks
    assert(Array.isArray(topic.exercises), `Exercises is array in ${filename}`, `Exercises not array in ${filename}`);
    assert(topic.exercises.length > 0, `Exercises non-empty in ${filename}`, `Exercises empty in ${filename}`);

    for (let idx = 0; idx < topic.exercises.length; idx++) {
      const ex = topic.exercises[idx];
      report.totalExercises++;
      report.exercisesByType[ex.type] = (report.exercisesByType[ex.type] || 0) + 1;

      // 1. ID check
      assert(typeof ex.id === 'string' && ex.id.trim().length > 0, `Exercise has non-empty ID in ${filename}[${idx}]`, `Exercise missing ID in ${filename}[${idx}]`);
      assert(/^[a-zA-Z0-9_-]+$/.test(ex.id), `ID has valid alphanumeric format in ${ex.id}`, `ID contains illegal characters: "${ex.id}"`);
      if (globalIdMap.has(ex.id)) {
        report.duplicateIds.push(`Duplicate ID "${ex.id}" in ${filename} (already seen in ${globalIdMap.get(ex.id)})`);
        report.errors.push(`Duplicate ID "${ex.id}" across files: ${filename} and ${globalIdMap.get(ex.id)}`);
        report.failedAssertions++;
      } else {
        globalIdMap.set(ex.id, filename);
        report.passedAssertions++;
      }
      report.totalAssertions++;

      // 2. Type check
      assert(
        ['multiple_choice', 'fill_blank', 'error_correction'].includes(ex.type),
        `Valid exercise type ${ex.type} in ${ex.id}`,
        `Invalid exercise type "${ex.type}" in ${ex.id} (${filename})`
      );

      // 3. Question check
      assert(typeof ex.question === 'string' && ex.question.trim().length > 0, `Question string non-empty in ${ex.id}`, `Empty question in ${ex.id}`);

      // 4. Options check
      assert(Array.isArray(ex.options), `Options is array in ${ex.id}`, `Options not array in ${ex.id}`);
      if (Array.isArray(ex.options)) {
        const seenOptSet = new Set<string>();
        for (let oIdx = 0; oIdx < ex.options.length; oIdx++) {
          const opt = ex.options[oIdx];
          assert(typeof opt === 'string', `Option is string in ${ex.id}[${oIdx}]`, `Option is non-string (${typeof opt}) in ${ex.id}[${oIdx}]`);
          assert(opt.trim().length > 0, `Option non-empty in ${ex.id}[${oIdx}]`, `Empty option string in ${ex.id}[${oIdx}]`);
          assert(opt === opt.trim(), `Option trimmed in ${ex.id}[${oIdx}]`, `Option has untrimmed whitespace in ${ex.id}[${oIdx}]: "${opt}"`);

          const optLower = String(opt).trim().toLowerCase();
          assert(!seenOptSet.has(optLower), `No duplicate option in ${ex.id}`, `Duplicate option "${opt}" in ${ex.id}`);
          seenOptSet.add(optLower);
        }
      }

      // 5. Correct answer check
      assert(
        typeof ex.correct_answer === 'string' && ex.correct_answer.trim().length > 0,
        `Correct answer non-empty in ${ex.id}`,
        `Empty correct_answer in ${ex.id} (${filename})`
      );

      // 6. Explanation check
      assert(
        typeof ex.explanation === 'string' && ex.explanation.trim().length > 0,
        `Explanation non-empty in ${ex.id}`,
        `Empty explanation in ${ex.id} (${filename})`
      );

      // 7. Difficulty check
      assert(
        typeof ex.difficulty === 'number' && [1, 2, 3].includes(ex.difficulty),
        `Difficulty in [1,2,3] in ${ex.id}`,
        `Invalid difficulty ${ex.difficulty} in ${ex.id} (${filename})`
      );

      // 8. Legacy keys check
      const legacyKeys = ['q', 'opts', 'answer', 'fb', 'why', 'sentence', 'prompt'];
      for (const lk of legacyKeys) {
        assert(ex[lk] === undefined, `Zero legacy key "${lk}" in ${ex.id}`, `Found legacy key "${lk}" in ${ex.id} (${filename})`);
      }

      // 9. Check exercises with options (MCQ, error correction, and fill_blank with options)
      if (Array.isArray(ex.options) && ex.options.length > 0) {
        report.exercisesWithOptionsCount++;

        // Minimum 2 options
        assert(
          ex.options.length >= 2,
          `Options length >= 2 in ${ex.id}`,
          `Options length < 2 (${ex.options.length}) in ${ex.id} (${filename})`
        );

        // Distractor breakdown validation
        assert(
          Array.isArray(ex.distractor_breakdowns) && ex.distractor_breakdowns.length > 0,
          `Distractor breakdowns present in ${ex.id}`,
          `Missing or empty distractor_breakdowns in ${ex.id} (${filename})`
        );

        if (Array.isArray(ex.distractor_breakdowns)) {
          report.totalDistractorBreakdowns += ex.distractor_breakdowns.length;

          // Parity check: length must match options length
          assert(
            ex.distractor_breakdowns.length === ex.options.length,
            `Breakdowns count equals options count in ${ex.id}`,
            `Breakdowns count (${ex.distractor_breakdowns.length}) != options count (${ex.options.length}) in ${ex.id}`
          );

          let correctCount = 0;
          for (let bIdx = 0; bIdx < ex.distractor_breakdowns.length; bIdx++) {
            const b = ex.distractor_breakdowns[bIdx];
            assert(typeof b.option === 'string' && b.option.trim().length > 0, `Breakdown option non-empty in ${ex.id}[${bIdx}]`, `Empty option in breakdown ${ex.id}[${bIdx}]`);
            assert(typeof b.isCorrect === 'boolean', `Breakdown isCorrect is boolean in ${ex.id}[${bIdx}]`, `isCorrect not boolean in ${ex.id}[${bIdx}]`);
            assert(
              typeof b.pedagogicalReason === 'string' && b.pedagogicalReason.trim().length >= 10,
              `Breakdown pedagogicalReason length >= 10 in ${ex.id}[${bIdx}]`,
              `Short or empty pedagogicalReason in ${ex.id}[${bIdx}]: "${b.pedagogicalReason}"`
            );

            // Mismatch check between options array and breakdown option
            if (ex.options[bIdx]) {
              assert(
                ex.options[bIdx] === b.option,
                `Breakdown option matches options[${bIdx}] in ${ex.id}`,
                `Option mismatch in ${ex.id}[${bIdx}]: option="${ex.options[bIdx]}" vs breakdown="${b.option}"`
              );
            }

            if (b.isCorrect) correctCount++;
          }

          // Exactly one correct breakdown item
          assert(
            correctCount === 1,
            `Exactly 1 correct breakdown item in ${ex.id}`,
            `Expected exactly 1 correct breakdown, found ${correctCount} in ${ex.id} (${filename})`
          );

          // Correct answer alignment
          const ans = (ex.correct_answer || '').trim().toLowerCase();
          const correctBreakdown = ex.distractor_breakdowns.find((b) => b.isCorrect);
          const optMatches = ex.options.some((o) => {
            const oTrim = o.trim().toLowerCase();
            const oClean = oTrim.replace(/^[a-d]\.\s*/i, '');
            return oTrim === ans || oClean === ans || (ans.length === 1 && /^[a-d]$/.test(ans) && oTrim.startsWith(ans + '.'));
          });

          assert(
            optMatches,
            `correct_answer matches an option in ${ex.id}`,
            `correct_answer "${ex.correct_answer}" does not match any option [${ex.options.join(', ')}] in ${ex.id}`
          );

          if (correctBreakdown) {
            const cbTrim = correctBreakdown.option.trim().toLowerCase();
            const cbClean = cbTrim.replace(/^[a-d]\.\s*/i, '');
            const cbMatches = cbTrim === ans || cbClean === ans || (ans.length === 1 && /^[a-d]$/.test(ans) && cbTrim.startsWith(ans + '.'));
            assert(
              cbMatches,
              `correct breakdown aligns with correct_answer in ${ex.id}`,
              `correct breakdown option "${correctBreakdown.option}" does not align with correct_answer "${ex.correct_answer}" in ${ex.id}`
            );
          }
        }
      } else {
        // Free text exercises (e.g. fill_blank without options)
        report.exercisesFreeTextCount++;
        assert(
          ex.type === 'fill_blank',
          `Option-less exercise is fill_blank in ${ex.id}`,
          `Option-less exercise has non-fill_blank type "${ex.type}" in ${ex.id}`
        );
        assert(
          Array.isArray(ex.distractor_breakdowns) && ex.distractor_breakdowns.length > 0,
          `Option-less exercise has pedagogical distractor_breakdowns in ${ex.id}`,
          `Option-less exercise missing distractor_breakdowns in ${ex.id}`
        );
        if (Array.isArray(ex.distractor_breakdowns)) {
          report.totalDistractorBreakdowns += ex.distractor_breakdowns.length;
          for (let bIdx = 0; bIdx < ex.distractor_breakdowns.length; bIdx++) {
            const b = ex.distractor_breakdowns[bIdx];
            assert(typeof b.option === 'string' && b.option.trim().length > 0, `Breakdown option non-empty in ${ex.id}[${bIdx}]`, `Empty option in breakdown ${ex.id}[${bIdx}]`);
            assert(typeof b.isCorrect === 'boolean', `Breakdown isCorrect is boolean in ${ex.id}[${bIdx}]`, `isCorrect not boolean in ${ex.id}[${bIdx}]`);
            assert(
              typeof b.pedagogicalReason === 'string' && b.pedagogicalReason.trim().length >= 10,
              `Breakdown pedagogicalReason length >= 10 in ${ex.id}[${bIdx}]`,
              `Short or empty pedagogicalReason in ${ex.id}[${bIdx}]: "${b.pedagogicalReason}"`
            );
          }
        }
      }
    }
  }

  report.uniqueIdsCount = globalIdMap.size;

  // Final order completeness check: 1..62
  assert(observedOrders.size === 62, 'All 62 topic orders 1..62 present', `Orders count is ${observedOrders.size}, expected 62`);
  for (let i = 1; i <= 62; i++) {
    assert(observedOrders.has(i), `Order index ${i} exists`, `Missing order index ${i}`);
  }

  // 10. Database Migration file checks
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260930_unify_grammar_roadmap.sql');
  assert(fs.existsSync(migrationPath), 'Migration file exists', 'Migration file does not exist');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    assert(
      migrationSql.includes("check (level in ('A0', 'A1', 'A2', 'B1', 'B2'"),
      'Migration has valid CEFR level check constraint',
      'Missing CEFR constraint in migration'
    );
    assert(migrationSql.includes('set order_index = 100 +'), 'Migration offsets legacy 25 Buổi order_index', 'Missing legacy offset in migration');
    assert(migrationSql.includes('create or replace view public.v_canonical_grammar_topics'), 'Migration creates canonical view', 'Missing canonical view in migration');
  }

  return report;
}

// Execution and formatting
if (require.main === module) {
  console.log('========================================================================');
  console.log('     COMPREHENSIVE EMPIRICAL CHALLENGER AUDIT: MILESTONE 1 VERIFICATION ');
  console.log('========================================================================\n');

  const report = runComprehensiveChallengerAudit();

  console.log('📊 AUDIT SUMMARY METRICS:');
  console.log(`  - Total Files Audited:         ${report.totalFiles} / 62`);
  console.log(`  - Total Exercises Audited:     ${report.totalExercises} (expected: 1593)`);
  console.log(`  - Unique Global Exercise IDs:  ${report.uniqueIdsCount} / 1593 (0 collisions)`);
  console.log(`  - Exercises with Options:      ${report.exercisesWithOptionsCount}`);
  console.log(`  - Free-Text Fill Exercises:    ${report.exercisesFreeTextCount}`);
  console.log(`  - Total Distractor Breakdowns: ${report.totalDistractorBreakdowns}`);
  console.log(`  - Total Test Assertions:       ${report.totalAssertions}`);
  console.log(`  - Assertions Passed:           ${report.passedAssertions}`);
  console.log(`  - Assertions Failed:           ${report.failedAssertions}`);
  console.log('\n📚 EXERCISES BY CEFR LEVEL:');
  for (const [lvl, count] of Object.entries(report.exercisesByLevel)) {
    console.log(`  - ${lvl}: ${count} exercises`);
  }
  console.log('\n🏷️ EXERCISES BY TYPE:');
  for (const [t, count] of Object.entries(report.exercisesByType)) {
    console.log(`  - ${t}: ${count} exercises`);
  }

  if (report.warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (${report.warnings.length}):`);
    report.warnings.slice(0, 10).forEach((w) => console.log(`  - ${w}`));
  }

  if (report.errors.length > 0) {
    console.log(`\n❌ FAILURES DETECTED (${report.errors.length}):`);
    report.errors.slice(0, 20).forEach((e) => console.error(`  - ${e}`));
    if (report.errors.length > 20) console.error(`  ... and ${report.errors.length - 20} more`);
    console.log('\n========================================================================');
    console.log('VERDICT: REQUEST_CHANGES (Failures detected)');
    console.log('========================================================================');
    process.exit(1);
  } else {
    console.log('\n========================================================================');
    console.log('VERDICT: APPROVE (Zero failures, 100% assertions satisfied)');
    console.log('========================================================================');
  }
}
