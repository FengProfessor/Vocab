/**
 * Comprehensive Verification Script for TOEIC Theory Curriculum Completeness & Pedagogical Integrity
 *
 * Designed by: explorer_m1_remed_verifier
 * Target Milestone: Milestone 1 TOEIC Curriculum Remediation
 *
 * Asserts all 6 core requirements from the remediation mandate:
 * 1. 100% of all 16 lessons across all 3 modules have `examples` populated with at least 1-2 real-world bilingual examples.
 * 2. 100% of all 16 lessons have at least 1 `tipBox` and at least 1 `trapAlert`.
 * 3. 100% of all 16 lessons have visual `formula` or structural breakdown.
 * 4. All 61 checkpoints have prompt, 4 options, valid correctAnswer, trapSignal, and Vietnamese explanation > 50 characters.
 * 5. Checkpoint answer key distribution is balanced (no single key > 40%).
 * 6. All `bridgeToPractice` URLs match valid `/toeic/exam/bank?part={part}&limit={limit}&mode=practice&filterMode=unseen`.
 *
 * Usage:
 *   npx tsx .agents/explorer_m1_remed_verifier/verify-curriculum-complete.ts
 */

import {
  getAllModules,
  getModuleById,
  getAllLessons,
  getLessonById,
  getLessonBySlug,
  getAdjacentLessons,
  getCurriculumStats,
  type TheoryLesson,
  type TheoryModule,
  type TheorySection,
  type TheoryCheckpoint,
  type RealWorldExample,
  type TipBox,
  type TrapAlert,
  type VisualGrammarFormula,
  type BridgeToPractice,
  type TheoryModuleId,
} from '../../src/data/toeic/theory/index';

export interface VerificationFailure {
  rule: string;
  lessonId: string;
  subItem?: string;
  message: string;
  severity: 'CRITICAL' | 'MAJOR';
}

export interface VerificationReport {
  timestamp: string;
  totalModules: number;
  totalLessons: number;
  totalSections: number;
  totalCheckpoints: number;
  failures: VerificationFailure[];
  warnings: string[];
  keyDistribution: Record<'A' | 'B' | 'C' | 'D', number>;
  keyPercentages: Record<'A' | 'B' | 'C' | 'D', number>;
  moduleKeyDistribution: Record<TheoryModuleId, Record<'A' | 'B' | 'C' | 'D', number>>;
  lessonScorecard: Array<{
    id: string;
    module: string;
    sections: number;
    examples: number;
    tipBoxes: number;
    traps: number;
    formulas: number;
    checkpoints: number;
    status: 'PASS' | 'FAIL';
  }>;
  passed: boolean;
}

const PLACEHOLDER_REGEX = /\b(TODO|TBD|dummy|mock|placeholder|lorem|ipsum|asdf|qwerty)\b/i;
const BRIDGE_URL_REGEX = /^\/toeic\/exam\/bank\?part=([1-7])&limit=(\d+)&mode=practice&filterMode=unseen$/;

export function verifyCurriculumComplete(): VerificationReport {
  const failures: VerificationFailure[] = [];
  const warnings: string[] = [];

  function fail(rule: string, lessonId: string, message: string, severity: 'CRITICAL' | 'MAJOR' = 'CRITICAL', subItem?: string) {
    failures.push({ rule, lessonId, subItem, message, severity });
  }

  function warn(msg: string) {
    warnings.push(msg);
  }

  const allModules = getAllModules();
  const allLessons = getAllLessons();

  // 1. Structure Verification
  if (allModules.length !== 3) {
    fail('R0:Structure', 'global', `Expected exactly 3 modules, found ${allModules.length}`);
  }
  if (allLessons.length !== 16) {
    fail('R0:Structure', 'global', `Expected exactly 16 lessons, found ${allLessons.length}`);
  }

  const globalCheckpointIds = new Set<string>();
  const globalKeyDist: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
  let totalCheckpoints = 0;
  let totalSections = 0;

  const moduleCheckpointCounts: Record<TheoryModuleId, number> = {
    'grammar-foundation': 0,
    'listening-tactics': 0,
    'reading-mastery': 0,
  };

  const moduleKeyDist: Record<TheoryModuleId, Record<'A' | 'B' | 'C' | 'D', number>> = {
    'grammar-foundation': { A: 0, B: 0, C: 0, D: 0 },
    'listening-tactics': { A: 0, B: 0, C: 0, D: 0 },
    'reading-mastery': { A: 0, B: 0, C: 0, D: 0 },
  };

  const scorecard: VerificationReport['lessonScorecard'] = [];

  allLessons.forEach((lesson, index) => {
    let lessonHasFailures = false;
    const initialFailuresCount = failures.length;

    // Sanity checks
    if (!lesson.id || lesson.id.trim().length === 0) {
      fail('R0:Identity', `index-${index}`, 'Lesson has empty id');
    }
    if (!lesson.slug || !/^[a-z0-9-]+$/.test(lesson.slug)) {
      fail('R0:Identity', lesson.id, `Lesson slug '${lesson.slug}' contains invalid URL characters`);
    }
    if (!lesson.title || lesson.title.trim().length < 5) {
      fail('R0:Identity', lesson.id, 'Lesson title missing or too short (<5 chars)');
    }
    if (!lesson.englishTitle || lesson.englishTitle.trim().length < 5) {
      fail('R0:Identity', lesson.id, 'Lesson englishTitle missing or too short (<5 chars)');
    }
    if (!lesson.sections || lesson.sections.length === 0) {
      fail('R0:Structure', lesson.id, 'Lesson has 0 sections');
      return;
    }

    totalSections += lesson.sections.length;

    // Collect pedagogical components
    const examples: { sectionId: string; ex: RealWorldExample }[] = [];
    const tipBoxes: { sectionId: string; tb: TipBox }[] = [];
    const traps: { sectionId: string; ta: TrapAlert }[] = [];
    const formulas: { sectionId: string; f: VisualGrammarFormula }[] = [];

    lesson.sections.forEach((sec, sIdx) => {
      // 1. Examples Check
      if (sec.examples && sec.examples.length > 0) {
        sec.examples.forEach((ex, eIdx) => {
          examples.push({ sectionId: sec.id, ex });
          if (!ex.context || ex.context.trim().length === 0) {
            fail('R1:Examples', lesson.id, `Example #${eIdx + 1} in section ${sec.id} missing context`, 'MAJOR', sec.id);
          }
          if (!ex.english || ex.english.trim().length < 10) {
            fail('R1:Examples', lesson.id, `Example #${eIdx + 1} in section ${sec.id} English text too short (<10 chars)`, 'CRITICAL', sec.id);
          }
          if (!ex.vietnamese || ex.vietnamese.trim().length < 10) {
            fail('R1:Examples', lesson.id, `Example #${eIdx + 1} in section ${sec.id} Vietnamese translation too short (<10 chars)`, 'CRITICAL', sec.id);
          }
          if (!ex.analysis || ex.analysis.trim().length < 15) {
            fail('R1:Examples', lesson.id, `Example #${eIdx + 1} in section ${sec.id} analysis too short (<15 chars)`, 'MAJOR', sec.id);
          }
          if (PLACEHOLDER_REGEX.test(ex.english) || PLACEHOLDER_REGEX.test(ex.vietnamese) || PLACEHOLDER_REGEX.test(ex.analysis)) {
            fail('R1:Examples', lesson.id, `Example #${eIdx + 1} in section ${sec.id} contains suspicious placeholder text`, 'CRITICAL', sec.id);
          }
        });
      }

      // 2. TipBox Check
      if (sec.tipBox) {
        const tb = sec.tipBox;
        tipBoxes.push({ sectionId: sec.id, tb });
        if (!tb.title || tb.title.trim().length < 5) {
          fail('R2:TipBox', lesson.id, `TipBox title too short (<5 chars) in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (!['tip', 'shortcut', 'rule', 'warning'].includes(tb.type)) {
          fail('R2:TipBox', lesson.id, `Invalid tipBox type '${tb.type}' in section ${sec.id}`, 'CRITICAL', sec.id);
        }
        if (!tb.content || tb.content.trim().length < 20) {
          fail('R2:TipBox', lesson.id, `TipBox content too short (<20 chars) in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (!tb.keySignals || tb.keySignals.length === 0) {
          fail('R2:TipBox', lesson.id, `TipBox missing keySignals in section ${sec.id}`, 'CRITICAL', sec.id);
        } else {
          tb.keySignals.forEach((sig, sigIdx) => {
            if (!sig || sig.trim().length < 5) {
              fail('R2:TipBox', lesson.id, `TipBox keySignal #${sigIdx + 1} too short in section ${sec.id}`, 'MAJOR', sec.id);
            }
          });
        }
        if (PLACEHOLDER_REGEX.test(tb.title) || PLACEHOLDER_REGEX.test(tb.content)) {
          fail('R2:TipBox', lesson.id, `TipBox contains placeholder in section ${sec.id}`, 'CRITICAL', sec.id);
        }
      }

      // 2b. TrapAlert Check
      if (sec.trapAlert) {
        const ta = sec.trapAlert;
        traps.push({ sectionId: sec.id, ta });
        if (!ta.trapName || ta.trapName.trim().length < 5) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert trapName too short in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (!['common', 'high_distractor', 'subtle'].includes(ta.trapLevel)) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert invalid trapLevel '${ta.trapLevel}' in section ${sec.id}`, 'CRITICAL', sec.id);
        }
        if (!ta.trapDescription || ta.trapDescription.trim().length < 20) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert trapDescription too short (<20 chars) in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (!ta.distractorExample || !ta.distractorExample.prompt || !ta.distractorExample.incorrectChoice || !ta.distractorExample.correctChoice) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert distractorExample missing required fields in section ${sec.id}`, 'CRITICAL', sec.id);
        } else {
          if (!ta.distractorExample.whyDistractorFails || ta.distractorExample.whyDistractorFails.trim().length < 15) {
            fail('R2:TrapAlert', lesson.id, `TrapAlert whyDistractorFails too short in section ${sec.id}`, 'MAJOR', sec.id);
          }
        }
        if (!ta.antidote || ta.antidote.trim().length < 15) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert antidote too short (<15 chars) in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (PLACEHOLDER_REGEX.test(ta.trapName) || PLACEHOLDER_REGEX.test(ta.trapDescription) || PLACEHOLDER_REGEX.test(ta.antidote)) {
          fail('R2:TrapAlert', lesson.id, `TrapAlert contains placeholder in section ${sec.id}`, 'CRITICAL', sec.id);
        }
      }

      // 3. Formula Check
      if (sec.formula) {
        const f = sec.formula;
        formulas.push({ sectionId: sec.id, f });
        if (!f.pattern || f.pattern.trim().length < 3) {
          fail('R3:Formula', lesson.id, `Formula pattern too short (<3 chars) in section ${sec.id}`, 'MAJOR', sec.id);
        }
        if (!f.elements || f.elements.length === 0) {
          fail('R3:Formula', lesson.id, `Formula has 0 elements in section ${sec.id}`, 'CRITICAL', sec.id);
        } else {
          f.elements.forEach((el, elIdx) => {
            if (!el.symbol || el.symbol.trim().length === 0) {
              fail('R3:Formula', lesson.id, `Formula element #${elIdx + 1} missing symbol in section ${sec.id}`, 'MAJOR', sec.id);
            }
            if (!el.label || el.label.trim().length === 0) {
              fail('R3:Formula', lesson.id, `Formula element #${elIdx + 1} missing label in section ${sec.id}`, 'MAJOR', sec.id);
            }
            if (!el.explanation || el.explanation.trim().length < 5) {
              fail('R3:Formula', lesson.id, `Formula element #${elIdx + 1} explanation too short in section ${sec.id}`, 'MAJOR', sec.id);
            }
            if (el.color && !['blue', 'emerald', 'amber', 'purple'].includes(el.color)) {
              fail('R3:Formula', lesson.id, `Formula element #${elIdx + 1} invalid color '${el.color}' in section ${sec.id}`, 'MAJOR', sec.id);
            }
          });
        }
        if (PLACEHOLDER_REGEX.test(f.pattern)) {
          fail('R3:Formula', lesson.id, `Formula pattern contains placeholder in section ${sec.id}`, 'CRITICAL', sec.id);
        }
      }
    });

    // Requirement 1 Assertion: 100% of all 16 lessons have examples populated (at least 1-2)
    if (examples.length === 0) {
      fail('R1:Examples', lesson.id, `Lesson has 0 RealWorldExample objects across all sections (expected at least 1-2)`, 'CRITICAL');
    }

    // Requirement 2 Assertion: at least 1 tipBox and at least 1 trapAlert
    if (tipBoxes.length === 0) {
      fail('R2:TipBox', lesson.id, `Lesson has 0 TipBox objects across all sections (expected >= 1)`, 'CRITICAL');
    }
    if (traps.length === 0) {
      fail('R2:TrapAlert', lesson.id, `Lesson has 0 TrapAlert objects across all sections (expected >= 1)`, 'CRITICAL');
    }

    // Requirement 3 Assertion: visual formula or structural breakdown
    if (formulas.length === 0) {
      fail('R3:Formula', lesson.id, `Lesson has 0 VisualGrammarFormula objects across all sections (expected >= 1)`, 'CRITICAL');
    }

    // Requirement 6 Assertion: bridgeToPractice URL validation
    const bridge = lesson.bridgeToPractice;
    if (!bridge) {
      fail('R6:Bridge', lesson.id, `Lesson is missing bridgeToPractice entirely`, 'CRITICAL');
    } else {
      if (!BRIDGE_URL_REGEX.test(bridge.practiceUrl)) {
        fail(
          'R6:Bridge',
          lesson.id,
          `practiceUrl '${bridge.practiceUrl}' does not match format '/toeic/exam/bank?part={part}&limit={limit}&mode=practice&filterMode=unseen'`,
          'CRITICAL'
        );
      } else {
        const match = bridge.practiceUrl.match(BRIDGE_URL_REGEX)!;
        const urlPart = parseInt(match[1], 10);
        const urlLimit = parseInt(match[2], 10);

        if (urlPart !== bridge.targetPart) {
          fail('R6:Bridge', lesson.id, `practiceUrl part (${urlPart}) !== bridge.targetPart (${bridge.targetPart})`, 'CRITICAL');
        }
        if (urlLimit !== bridge.recommendedQuestionCount) {
          fail('R6:Bridge', lesson.id, `practiceUrl limit (${urlLimit}) !== bridge.recommendedQuestionCount (${bridge.recommendedQuestionCount})`, 'CRITICAL');
        }
        if (bridge.filterMode !== 'unseen') {
          fail('R6:Bridge', lesson.id, `filterMode must be 'unseen', found '${bridge.filterMode}'`, 'CRITICAL');
        }
        if (!bridge.ctaText || bridge.ctaText.trim().length < 8) {
          fail('R6:Bridge', lesson.id, `ctaText empty or too short (<8 chars): '${bridge.ctaText}'`, 'MAJOR');
        }
      }
    }

    // Requirement 4: Checkpoints Auditing
    if (!lesson.checkpoints || lesson.checkpoints.length === 0) {
      fail('R4:Checkpoints', lesson.id, `Lesson has 0 checkpoints`, 'CRITICAL');
    } else if (lesson.checkpoints.length < 3) {
      fail('R4:Checkpoints', lesson.id, `Lesson has fewer than 3 checkpoints (${lesson.checkpoints.length})`, 'MAJOR');
    } else {
      lesson.checkpoints.forEach((cp, cpIdx) => {
        totalCheckpoints++;
        moduleCheckpointCounts[lesson.moduleId]++;

        // Unique ID
        if (globalCheckpointIds.has(cp.id)) {
          fail('R4:Checkpoints', lesson.id, `Duplicate checkpoint ID globally: '${cp.id}'`, 'CRITICAL', cp.id);
        }
        globalCheckpointIds.add(cp.id);

        // Prompt
        if (!cp.prompt || cp.prompt.trim().length < 10) {
          fail('R4:Checkpoints', lesson.id, `Prompt too short (<10 chars) in checkpoint ${cp.id}`, 'MAJOR', cp.id);
        }
        if (PLACEHOLDER_REGEX.test(cp.prompt)) {
          fail('R4:Checkpoints', lesson.id, `Prompt contains placeholder in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
        }

        // 4 Options exactly
        if (!cp.options || cp.options.length !== 4) {
          fail('R4:Checkpoints', lesson.id, `Options length !== 4 in checkpoint ${cp.id} (got ${cp.options?.length})`, 'CRITICAL', cp.id);
        } else {
          const keys = cp.options.map(o => o.key).join('');
          if (keys !== 'ABCD') {
            fail('R4:Checkpoints', lesson.id, `Option keys order !== 'ABCD' in checkpoint ${cp.id} (got '${keys}')`, 'CRITICAL', cp.id);
          }
          const texts = new Set(cp.options.map(o => o.text.trim().toLowerCase()));
          if (texts.size !== 4) {
            fail('R4:Checkpoints', lesson.id, `Duplicate option texts in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
          }
          cp.options.forEach(opt => {
            if (!opt.text || opt.text.trim().length === 0) {
              fail('R4:Checkpoints', lesson.id, `Option ${opt.key} text is empty in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
            }
          });
        }

        // correctAnswer
        if (!['A', 'B', 'C', 'D'].includes(cp.correctAnswer)) {
          fail('R4:Checkpoints', lesson.id, `Invalid correctAnswer '${cp.correctAnswer}' in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
        } else {
          globalKeyDist[cp.correctAnswer]++;
          moduleKeyDist[lesson.moduleId][cp.correctAnswer]++;
        }

        // trapSignal
        if (!cp.trapSignal || cp.trapSignal.trim().length === 0) {
          fail('R4:Checkpoints', lesson.id, `Missing trapSignal in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
        }

        // explanationVi > 50 characters
        if (!cp.explanationVi) {
          fail('R4:Checkpoints', lesson.id, `Missing explanationVi in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
        } else {
          const trimmedLen = cp.explanationVi.trim().length;
          if (trimmedLen <= 50) {
            fail(
              'R4:Checkpoints',
              lesson.id,
              `explanationVi length (${trimmedLen} chars) <= 50 in checkpoint ${cp.id}. Required > 50 characters!`,
              'CRITICAL',
              cp.id
            );
          }
          if (PLACEHOLDER_REGEX.test(cp.explanationVi)) {
            fail('R4:Checkpoints', lesson.id, `explanationVi contains placeholder in checkpoint ${cp.id}`, 'CRITICAL', cp.id);
          }
        }

        // timeTargetSeconds
        if (cp.timeTargetSeconds <= 0 || cp.timeTargetSeconds > 120) {
          fail('R4:Checkpoints', lesson.id, `Abnormal timeTargetSeconds (${cp.timeTargetSeconds}s) in checkpoint ${cp.id}`, 'MAJOR', cp.id);
        }
      });
    }

    lessonHasFailures = failures.length > initialFailuresCount;
    scorecard.push({
      id: lesson.id,
      module: lesson.moduleId,
      sections: lesson.sections.length,
      examples: examples.length,
      tipBoxes: tipBoxes.length,
      traps: traps.length,
      formulas: formulas.length,
      checkpoints: lesson.checkpoints?.length ?? 0,
      status: lessonHasFailures ? 'FAIL' : 'PASS',
    });
  });

  // Global Checkpoint Count Assertions
  if (totalCheckpoints !== 61) {
    fail('R4:Checkpoints', 'global', `Total checkpoints count (${totalCheckpoints}) !== 61`, 'CRITICAL');
  }
  if (moduleCheckpointCounts['grammar-foundation'] !== 24) {
    fail('R4:Checkpoints', 'grammar-foundation', `Grammar module checkpoints (${moduleCheckpointCounts['grammar-foundation']}) !== 24`, 'CRITICAL');
  }
  if (moduleCheckpointCounts['listening-tactics'] !== 17) {
    fail('R4:Checkpoints', 'listening-tactics', `Listening module checkpoints (${moduleCheckpointCounts['listening-tactics']}) !== 17`, 'CRITICAL');
  }
  if (moduleCheckpointCounts['reading-mastery'] !== 20) {
    fail('R4:Checkpoints', 'reading-mastery', `Reading module checkpoints (${moduleCheckpointCounts['reading-mastery']}) !== 20`, 'CRITICAL');
  }

  // Requirement 5 Assertion: Answer Key Distribution (No single key > 40%)
  const keyPercentages: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  for (const k of keys) {
    const count = globalKeyDist[k];
    const pct = totalCheckpoints > 0 ? (count / totalCheckpoints) * 100 : 0;
    keyPercentages[k] = pct;

    if (pct > 40.0) {
      fail(
        'R5:KeyBalance',
        'global',
        `Option '${k}' represents ${pct.toFixed(1)}% (${count}/${totalCheckpoints}), which exceeds the 40.0% maximum threshold!`,
        'CRITICAL'
      );
    }
    if (pct < 10.0) {
      fail(
        'R5:KeyBalance',
        'global',
        `Option '${k}' is severely starved (${pct.toFixed(1)}% = ${count}/${totalCheckpoints}), falling below 10.0% floor!`,
        'CRITICAL'
      );
    }
  }

  // Cross-Module Transition Verification
  const g06Adjacent = getAdjacentLessons('toeic-grammar-06-part6-text-completion');
  if (g06Adjacent.nextLesson?.id !== 'toeic-listening-01-part1-photos') {
    fail('R0:Navigation', 'cross-module', 'Adjacent lesson transition G06 -> L01 failed', 'CRITICAL');
  }
  const l05Adjacent = getAdjacentLessons('toeic-listening-05-part4-talks');
  if (l05Adjacent.nextLesson?.id !== 'toeic-reading-01-time-and-skimming-scanning') {
    fail('R0:Navigation', 'cross-module', 'Adjacent lesson transition L05 -> R01 failed', 'CRITICAL');
  }

  return {
    timestamp: new Date().toISOString(),
    totalModules: allModules.length,
    totalLessons: allLessons.length,
    totalSections,
    totalCheckpoints,
    failures,
    warnings,
    keyDistribution: globalKeyDist,
    keyPercentages,
    moduleKeyDistribution: moduleKeyDist,
    lessonScorecard: scorecard,
    passed: failures.length === 0,
  };
}

// -----------------------------------------------------------------------------
// CLI FORMATTER & EXECUTION
// -----------------------------------------------------------------------------
function runCli() {
  console.log('================================================================================');
  console.log('   TOEIC THEORY CURRICULUM INTEGRITY VERIFICATION SUITE');
  console.log('   Enforcing 6-Point Remediation Contract (Milestone 1)');
  console.log('================================================================================\n');

  const report = verifyCurriculumComplete();

  // Print Lesson Scorecard Table
  console.log('┌───────────────────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────┬─────────┐');
  console.log('│ Lesson ID                                         │ Examples │ TipBoxes │  Traps   │ Formulas │ CPs  │ Status  │');
  console.log('├───────────────────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────┼─────────┤');

  report.lessonScorecard.forEach(row => {
    const idStr = row.id.padEnd(49);
    const exStr = String(row.examples).padStart(8);
    const tbStr = String(row.tipBoxes).padStart(8);
    const trStr = String(row.traps).padStart(8);
    const foStr = String(row.formulas).padStart(8);
    const cpStr = String(row.checkpoints).padStart(4);
    const stStr = (row.status === 'PASS' ? '  PASS ' : '  FAIL ').padEnd(7);
    console.log(`│ ${idStr} │ ${exStr} │ ${tbStr} │ ${trStr} │ ${foStr} │ ${cpStr} │ ${stStr} │`);
  });
  console.log('└───────────────────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────┴─────────┘\n');

  // Checkpoints Summary
  console.log('--- CHECKPOINT AUDIT SUMMARY ---');
  console.log(`Total Checkpoints: ${report.totalCheckpoints} / 61`);
  console.log(`  - grammar-foundation: 24 (actual: ${report.lessonScorecard.filter(l => l.module === 'grammar-foundation').reduce((a, b) => a + b.checkpoints, 0)})`);
  console.log(`  - listening-tactics:  17 (actual: ${report.lessonScorecard.filter(l => l.module === 'listening-tactics').reduce((a, b) => a + b.checkpoints, 0)})`);
  console.log(`  - reading-mastery:    20 (actual: ${report.lessonScorecard.filter(l => l.module === 'reading-mastery').reduce((a, b) => a + b.checkpoints, 0)})`);

  // Key Distribution
  console.log('\n--- ANSWER KEY DISTRIBUTION (CONTRACT: NO KEY > 40%) ---');
  for (const k of ['A', 'B', 'C', 'D'] as const) {
    const count = report.keyDistribution[k];
    const pct = report.keyPercentages[k];
    const alert = pct > 40.0 ? ' ❌ [EXCEEDS 40%]' : pct < 10.0 ? ' ❌ [BELOW 10% FLOOR]' : ' ✓ [BALANCED]';
    console.log(`  Key ${k}: ${String(count).padStart(2)} / ${report.totalCheckpoints} (${pct.toFixed(1)}%)${alert}`);
  }

  // Failures breakdown
  console.log('\n================================================================================');
  console.log(`VERIFICATION RESULT: ${report.passed ? 'PASSED (0 Defects)' : `FAILED (${report.failures.length} Defects)`}`);
  console.log('================================================================================\n');

  if (!report.passed) {
    const grouped = report.failures.reduce((acc, f) => {
      acc[f.rule] = acc[f.rule] || [];
      acc[f.rule].push(f);
      return acc;
    }, {} as Record<string, VerificationFailure[]>);

    for (const [rule, items] of Object.entries(grouped)) {
      console.error(`▶ Rule [${rule}] (${items.length} failures):`);
      items.forEach(it => {
        console.error(`   - [${it.lessonId}${it.subItem ? ` :: ${it.subItem}` : ''}] ${it.message}`);
      });
    }
    process.exit(1);
  } else {
    console.log('🎉 ALL 16 LESSONS & 61 CHECKPOINTS SATISFY 100% OF THE 6-POINT INTEGRITY CONTRACT!\n');
    process.exit(0);
  }
}

if (process.argv[1]?.includes('verify-curriculum-complete')) {
  runCli();
}
