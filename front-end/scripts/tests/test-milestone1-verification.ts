/**
 * Automated Milestone 1 Verification Test Suite
 * Verifies:
 * 1. Editorial Tone Scrubbing (0 prohibited phrases in target files & out/*.json)
 * 2. Data Schema Normalization (unified keys, CEFR levels A0-B2, order 1-62, distractor breakdowns)
 * 3. Database Migration script integrity (constraint, deduplication, consolidation)
 */

import * as fs from 'fs';
import * as path from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    failedTests++;
  }
}

async function runVerification() {
  console.log('===============================================================');
  console.log('     MILESTONE 1 AUTOMATED VERIFICATION TEST SUITE             ');
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Tone Purity in Specific Files
  // --------------------------------------------------------------------------
  console.log('📋 Test Group 1: Editorial Tone Scrubbing (Prohibited Phrases)');

  const targetFiles = [
    'src/components/grammar/GrammarVisualConcept.tsx',
    'src/data/toeic/theory/flashcards.ts',
    'src/components/toeic/learn/ToeicTipBox.tsx',
    'src/components/toeic/learn/ToeicLessonCheatSheet.tsx',
    'src/data/toeic/theory/types.ts',
    'src/data/toeic/theory/modules/grammar-foundation.ts',
    'src/components/landing/refero/ReferoProofWall.tsx',
    'src/data/roadmap/roadmap-thpt-v1.json',
  ];

  const prohibitedPhrases = [
    'mẹo 5s',
    'mẹo nhớ 5s',
    'thần chú',
    'hack điểm',
    'ăn trọn điểm',
    'thời phong kiến phương tây',
    'sóng gió chẳng sợ zì',
  ];

  for (const relPath of targetFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    assert(fs.existsSync(fullPath), `Target file exists: ${relPath}`);
    const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
    for (const phrase of prohibitedPhrases) {
      assert(
        !content.includes(phrase),
        `Zero "${phrase}" in ${relPath}`,
        `Found occurrence of prohibited phrase "${phrase}"`
      );
    }
  }

  // Check 62 JSON files for tips prefix
  const outDir = path.resolve(process.cwd(), 'scripts/grammar-gen/out');
  const jsonFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.json'));
  assert(jsonFiles.length === 62, 'Found exactly 62 topic JSON files');

  let meoNhoCount = 0;
  let luuYCount = 0;

  for (const f of jsonFiles) {
    const content = fs.readFileSync(path.join(outDir, f), 'utf8');
    if (content.includes('**Mẹo nhớ:**') || content.includes('**Mẹo 2×2:**')) meoNhoCount++;
    if (content.includes('**Lưu ý trọng tâm:**')) luuYCount++;
  }

  assert(meoNhoCount === 0, 'Zero "**Mẹo nhớ:**" in scripts/grammar-gen/out/*.json');
  assert(luuYCount === 62, 'All 62 topic files have "**Lưu ý trọng tâm:**"');

  // --------------------------------------------------------------------------
  // TEST 2: Data Schema Normalization
  // --------------------------------------------------------------------------
  console.log('\n📋 Test Group 2: Data Schema Normalization in 62 JSON Files');

  const validCefrLevels = new Set(['A0', 'A1', 'A2', 'B1', 'B2']);
  const ordersSeen = new Set<number>();
  let legacyKeysFound = 0;
  let totalExercises = 0;
  let mcqWithBreakdowns = 0;
  let totalMCQ = 0;

  for (const f of jsonFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'));

    // Top-level structure
    assert(validCefrLevels.has(data.level), `Valid CEFR level "${data.level}" in ${f}`);
    assert(typeof data.order === 'number' && data.order >= 1 && data.order <= 62, `Valid order ${data.order} in ${f}`);
    ordersSeen.add(data.order);

    // Exercises validation
    const exercises = data.exercises || [];
    assert(Array.isArray(exercises) && exercises.length > 0, `Non-empty exercises in ${f} (${exercises.length} items)`);

    for (const ex of exercises) {
      totalExercises++;
      // Legacy keys must NOT exist
      if (ex.q !== undefined || ex.opts !== undefined || ex.answer !== undefined || ex.fb !== undefined) {
        legacyKeysFound++;
      }

      // Unified keys must exist
      assert(typeof ex.id === 'string' && ex.id.length > 0, `Exercise has id in ${f}`);
      assert(['multiple_choice', 'fill_blank', 'error_correction'].includes(ex.type), `Valid type "${ex.type}" in ${f}`);
      assert(typeof ex.question === 'string' && ex.question.length > 0, `Exercise has question in ${f}`);
      assert(typeof ex.correct_answer === 'string' && ex.correct_answer.length > 0, `Exercise has correct_answer in ${f}`);
      assert(typeof ex.explanation === 'string', `Exercise has explanation in ${f}`);
      assert([1, 2, 3].includes(ex.difficulty), `Valid difficulty [1,2,3] in ${f}`);

      // Distractor breakdowns for multiple choice
      if (ex.type === 'multiple_choice' || ex.type === 'error_correction') {
        totalMCQ++;
        if (Array.isArray(ex.distractor_breakdowns) && ex.distractor_breakdowns.length > 0) {
          mcqWithBreakdowns++;
          const hasCorrect = ex.distractor_breakdowns.some((b: any) => b.isCorrect === true);
          assert(hasCorrect, `Breakdown has correct answer in ${ex.id}`);
        }
      }
    }
  }

  assert(ordersSeen.size === 62, 'Orders 1..62 are strictly unique without collisions');
  assert(legacyKeysFound === 0, 'Zero legacy keys (q, opts, answer, fb) across all exercises');
  assert(totalExercises === 1593, `Total exercises count is exactly 1,593 (found: ${totalExercises})`);
  assert(mcqWithBreakdowns === totalMCQ, `100% of multiple choice & error questions have distractor breakdowns (${mcqWithBreakdowns}/${totalMCQ})`);

  // --------------------------------------------------------------------------
  // TEST 3: Database Migration Script
  // --------------------------------------------------------------------------
  console.log('\n📋 Test Group 3: Database Migration Script Integrity');

  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260930_unify_grammar_roadmap.sql');
  assert(fs.existsSync(migrationPath), 'Migration file supabase/migrations/20260930_unify_grammar_roadmap.sql exists');

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  assert(migrationContent.includes("check (level in ('A0', 'A1', 'A2', 'B1', 'B2'"), 'Migration updates level check constraint to CEFR A0-B2');
  assert(migrationContent.includes("set order_index = 100 +"), 'Migration offsets legacy 25 Buổi order_index to eliminate collisions');
  assert(migrationContent.includes("where slug = 'personal-pronouns'"), 'Migration updates 62 CEFR topic levels and order_index');
  assert(migrationContent.includes("update public.grammar_topics t set parent_id = c.id"), 'Migration consolidates 25 legacy Buổi into CEFR topics');
  assert(migrationContent.includes('create or replace view public.v_canonical_grammar_topics'), 'Migration creates v_canonical_grammar_topics view');

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TOTAL TESTS:  ${passedTests + failedTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL MILESTONE 1 VERIFICATION CHECKS PASSED PERFECTLY!\n');
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
