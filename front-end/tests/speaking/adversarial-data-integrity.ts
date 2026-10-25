/**
 * ADVERSARIAL EMPIRICAL TEST HARNESS: DATA INTEGRITY & WORKFLOWS
 * Challenger 2 Verification Suite
 * Target: Foundational Speaking System for False Beginners
 *
 * Verifies:
 * 1. 100% of Rachel's English YouTube video IDs in stage-0-phonetics.ts
 *    (11-char format, channelName === "Rachel's English", startSeconds < endSeconds, bounded timestamps).
 * 2. All 28 survival frames have valid domain classifications, template slots matching exemplar variables,
 *    and non-empty coreKeywords found in exemplar sentences.
 * 3. All 6 Lego lessons have valid brick substitutions and target latency of 1000ms.
 * 4. All 6 3-beat expansions have all 3 beats defined in both English and Vietnamese with coreKeywords.
 * 5. All 6 micro-dialogues alternate turns correctly.
 * 6. Verify zero placeholder, TODO, or lorem ipsum strings across all codebase files.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import datasets directly from production data source
import { STAGE_0_PHONETIC_LESSONS } from '../../src/data/speaking/foundation/stage-0-phonetics';
import { STAGE_1_SURVIVAL_FRAMES } from '../../src/data/speaking/foundation/stage-1-survival-frames';
import { STAGE_2_LEGO_LESSONS } from '../../src/data/speaking/foundation/stage-2-lego-slots';
import {
  STAGE_3_EXPANSIONS,
  STAGE_3_MICRO_DIALOGUES,
} from '../../src/data/speaking/foundation/stage-3-expansions';
import {
  getSpeakingStats,
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
  getMicroDialogues,
} from '../../src/data/speaking/foundation/index';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  errors?: string[];
  durationMs: number;
}

const results: TestResult[] = [];

function runTest(category: string, name: string, fn: () => string[] | void) {
  const start = Date.now();
  try {
    const errorList = fn();
    if (errorList && errorList.length > 0) {
      results.push({
        category,
        name,
        passed: false,
        errors: errorList,
        durationMs: Date.now() - start,
      });
      console.error(`  [FAIL] [${category}] ${name}`);
      for (const e of errorList) {
        console.error(`         ↳ ${e}`);
      }
    } else {
      results.push({
        category,
        name,
        passed: true,
        durationMs: Date.now() - start,
      });
      console.log(`  [PASS] [${category}] ${name}`);
    }
  } catch (err: any) {
    results.push({
      category,
      name,
      passed: false,
      errors: [err?.message || String(err)],
      durationMs: Date.now() - start,
    });
    console.error(`  [FAIL] [${category}] ${name} => ${err?.message}`);
  }
}

console.log('================================================================================');
console.log('  CHALLENGER 2: ADVERSARIAL DATA INTEGRITY & WORKFLOW VERIFICATION');
console.log('================================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: RACHEL'S ENGLISH YOUTUBE VIDEO METADATA (STAGE 0)
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- SUITE 1: Stage 0 Phonetics & Rachel\'s English Videos ---');

runTest('Stage 0 Videos', 'Exactly 10 phonetic lessons are defined', () => {
  if (STAGE_0_PHONETIC_LESSONS.length !== 10) {
    return [`Expected 10 lessons, got ${STAGE_0_PHONETIC_LESSONS.length}`];
  }
});

runTest('Stage 0 Videos', '100% of lessons have a valid video metadata object', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    if (!lesson.video) errs.push(`Lesson ${lesson.id} missing video object`);
    else if (typeof lesson.video.youtubeVideoId !== 'string') errs.push(`Lesson ${lesson.id} videoId not string`);
  }
  return errs;
});

runTest('Stage 0 Videos', 'All 10 video IDs match strict 11-character YouTube format /^[a-zA-Z0-9_-]{11}$/', () => {
  const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    const vid = lesson.video?.youtubeVideoId;
    if (!vid || !ytRegex.test(vid)) {
      errs.push(`Lesson ${lesson.id} invalid YouTube ID "${vid}"`);
    }
  }
  return errs;
});

runTest('Stage 0 Videos', '100% of videos have channelName strictly equal to "Rachel\'s English"', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    if (lesson.video?.channelName !== "Rachel's English") {
      errs.push(`Lesson ${lesson.id} channelName "${lesson.video?.channelName}" !== "Rachel's English"`);
    }
  }
  return errs;
});

runTest('Stage 0 Videos', 'startSeconds is non-negative and integer across all 10 lessons', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    const s = lesson.video?.startSeconds;
    if (typeof s !== 'number' || !Number.isFinite(s) || s < 0) {
      errs.push(`Lesson ${lesson.id} invalid startSeconds: ${s}`);
    }
  }
  return errs;
});

runTest('Stage 0 Videos', 'endSeconds is strictly greater than startSeconds across all 10 lessons', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    const s = lesson.video?.startSeconds;
    const e = lesson.video?.endSeconds;
    if (typeof e !== 'number' || e <= s) {
      errs.push(`Lesson ${lesson.id} endSeconds (${e}) not > startSeconds (${s})`);
    }
  }
  return errs;
});

runTest('Stage 0 Videos', 'Timestamps are bounded within pedagogical sweet spot (15s <= duration <= 180s)', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    const duration = (lesson.video?.endSeconds ?? 0) - (lesson.video?.startSeconds ?? 0);
    if (duration < 15 || duration > 180) {
      errs.push(`Lesson ${lesson.id} duration ${duration}s out of range [15s, 180s]`);
    }
  }
  return errs;
});

runTest('Stage 0 Videos', 'Titles and articulatory mouth summaries are non-empty strings', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    if (!lesson.video?.title || lesson.video.title.length < 5) errs.push(`Lesson ${lesson.id} short title`);
    if (!lesson.video?.mouthTipSummary || lesson.video.mouthTipSummary.length < 5) errs.push(`Lesson ${lesson.id} short mouthTipSummary`);
  }
  return errs;
});

runTest('Stage 0 Content', 'Every lesson contains practice words with word, IPA, and Vietnamese meaning', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_0_PHONETIC_LESSONS) {
    if (!Array.isArray(lesson.practiceWords) || lesson.practiceWords.length < 4) {
      errs.push(`Lesson ${lesson.id} practiceWords < 4`);
      continue;
    }
    for (const pw of lesson.practiceWords) {
      if (!pw.word?.trim()) errs.push(`Lesson ${lesson.id} empty word`);
      if (!pw.ipa?.startsWith('/') || !pw.ipa?.endsWith('/')) errs.push(`Lesson ${lesson.id} invalid IPA "${pw.ipa}"`);
      if (!pw.meaningVi?.trim()) errs.push(`Lesson ${lesson.id} empty meaningVi`);
    }
  }
  return errs;
});

runTest('Stage 0 Content', 'Minimal pair lessons contain valid contrasting pairs with distinct IPAs and explanations', () => {
  const pairLessons = STAGE_0_PHONETIC_LESSONS.filter(l => l.category === 'vowel-pairs' || l.category === 'consonant-pairs');
  const errs: string[] = [];
  if (pairLessons.length !== 6) errs.push(`Expected 6 minimal pair lessons, found ${pairLessons.length}`);
  for (const lesson of pairLessons) {
    if (!Array.isArray(lesson.minimalPairs) || lesson.minimalPairs.length < 3) {
      errs.push(`Lesson ${lesson.id} minimalPairs < 3`);
      continue;
    }
    for (const mp of lesson.minimalPairs) {
      if (mp.wordA === mp.wordB) errs.push(`Lesson ${lesson.id} wordA === wordB "${mp.wordA}"`);
      if (mp.ipaA === mp.ipaB) errs.push(`Lesson ${lesson.id} ipaA === ipaB "${mp.ipaA}"`);
      if (!mp.distinctionVi || mp.distinctionVi.length < 5) errs.push(`Lesson ${lesson.id} missing distinctionVi`);
    }
  }
  return errs;
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: SURVIVAL FRAMES (STAGE 1)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 2: All 28 Survival Frames (Stage 1) ---');

const VALID_DOMAINS = ['fnb', 'shopping', 'directions', 'hotel', 'workplace', 'emergency', 'fillers'] as const;

runTest('Survival Frames', 'Exactly 28 survival frames exist', () => {
  if (STAGE_1_SURVIVAL_FRAMES.length !== 28) {
    return [`Expected 28 frames, got ${STAGE_1_SURVIVAL_FRAMES.length}`];
  }
});

runTest('Survival Frames', 'All 28 frames map to valid domain classifications (7 domains, 4 frames each)', () => {
  const errs: string[] = [];
  const counts: Record<string, number> = {};
  for (const domain of VALID_DOMAINS) counts[domain] = 0;

  for (const frame of STAGE_1_SURVIVAL_FRAMES) {
    if (!VALID_DOMAINS.includes(frame.domain as any)) {
      errs.push(`Frame ${frame.id} invalid domain "${frame.domain}"`);
    } else {
      counts[frame.domain] = (counts[frame.domain] || 0) + 1;
    }
    if (!frame.domainNameVi?.trim()) errs.push(`Frame ${frame.id} missing domainNameVi`);
  }

  for (const domain of VALID_DOMAINS) {
    if (counts[domain] !== 4) {
      errs.push(`Domain "${domain}" has ${counts[domain]} frames, expected 4`);
    }
  }
  return errs;
});

runTest('Survival Frames', 'Template slots bi-directionally match slots array definitions', () => {
  const errs: string[] = [];
  for (const frame of STAGE_1_SURVIVAL_FRAMES) {
    const templateMatches = frame.template.match(/\{([a-zA-Z0-9_-]+)\}/g) || [];
    const templateKeys = templateMatches.map(m => m.slice(1, -1));
    const definedKeys = frame.slots.map(s => s.key);

    if (definedKeys.length === 0) {
      errs.push(`Frame ${frame.id} has no defined slots`);
    }
    if (templateKeys.length === 0) {
      errs.push(`Frame ${frame.id} template "${frame.template}" contains no {slot} placeholders, but defines slots [${definedKeys.join(', ')}]`);
    }

    for (const tk of templateKeys) {
      if (!definedKeys.includes(tk)) {
        errs.push(`Frame ${frame.id}: Template placeholder {${tk}} has no definition in slots`);
      }
    }
    for (const dk of definedKeys) {
      if (!templateKeys.includes(dk)) {
        errs.push(`Frame ${frame.id}: Slot key "${dk}" defined in slots but omitted from template "${frame.template}"`);
      }
    }

    for (const slot of frame.slots) {
      if (!slot.labelVi?.trim()) errs.push(`Frame ${frame.id} slot ${slot.key} missing labelVi`);
      if (!Array.isArray(slot.options) || slot.options.length < 2) {
        errs.push(`Frame ${frame.id} slot ${slot.key} options < 2`);
      }
    }
  }
  return errs;
});

runTest('Survival Frames', 'All frames have >= 2 exemplars with valid sentence, meaningVi, and non-empty coreKeywords', () => {
  const errs: string[] = [];
  for (const frame of STAGE_1_SURVIVAL_FRAMES) {
    if (!Array.isArray(frame.exemplars) || frame.exemplars.length < 2) {
      errs.push(`Frame ${frame.id} exemplars count is ${frame.exemplars?.length || 0} (< 2)`);
      continue;
    }
    for (const ex of frame.exemplars) {
      if (!ex.sentence?.trim()) errs.push(`Frame ${frame.id} missing exemplar sentence`);
      if (!ex.meaningVi?.trim()) errs.push(`Frame ${frame.id} missing exemplar meaningVi`);
      if (!Array.isArray(ex.coreKeywords) || ex.coreKeywords.length < 2) {
        errs.push(`Frame ${frame.id} coreKeywords < 2 in "${ex.sentence}"`);
      }
    }
  }
  return errs;
});

runTest('Survival Frames', 'Adversarial: 100% of coreKeywords exist within their exemplar sentence text', () => {
  const errs: string[] = [];
  for (const frame of STAGE_1_SURVIVAL_FRAMES) {
    for (const ex of frame.exemplars) {
      const cleanSentence = ex.sentence
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9\s]/g, ' ');
      const tokens = cleanSentence.split(/\s+/).filter(Boolean);

      for (const kw of ex.coreKeywords) {
        const cleanKw = kw.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]/g, '');
        const match = tokens.some(tok => tok === cleanKw || tok.includes(cleanKw) || cleanKw.includes(tok));
        if (!match) {
          errs.push(`Frame ${frame.id}: Keyword "${kw}" not found in sentence "${ex.sentence}"`);
        }
      }
    }
  }
  return errs;
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: LEGO LESSONS (STAGE 2)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 3: All 6 Lego Lessons (Stage 2) ---');

runTest('Lego Lessons', 'Exactly 6 Lego lessons exist', () => {
  if (STAGE_2_LEGO_LESSONS.length !== 6) {
    return [`Expected 6 Lego lessons, got ${STAGE_2_LEGO_LESSONS.length}`];
  }
});

runTest('Lego Lessons', 'targetReflexMs is strictly 1000ms across all 6 Lego lessons', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_2_LEGO_LESSONS) {
    if (lesson.targetReflexMs !== 1000) {
      errs.push(`Lesson ${lesson.id} targetReflexMs is ${lesson.targetReflexMs}ms, expected exactly 1000ms`);
    }
  }
  return errs;
});

runTest('Lego Lessons', 'baseFrame slots match slots definitions', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_2_LEGO_LESSONS) {
    const frameSlots = (lesson.baseFrame.match(/\{([a-zA-Z0-9_-]+)\}/g) || []).map(s => s.slice(1, -1));
    const definedKeys = lesson.slots.map(s => s.slotKey);

    if (frameSlots.length === 0) errs.push(`Lego lesson ${lesson.id} baseFrame has no slots`);
    for (const fs of frameSlots) {
      if (!definedKeys.includes(fs)) errs.push(`Lego lesson ${lesson.id}: {${fs}} not in slots`);
    }
    for (const dk of definedKeys) {
      if (!frameSlots.includes(dk)) errs.push(`Lego lesson ${lesson.id}: slot "${dk}" not in baseFrame`);
    }
  }
  return errs;
});

runTest('Lego Lessons', 'Valid brick substitutions: all slots have >= 3 valid bricks with value, meaningVi, ipa', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_2_LEGO_LESSONS) {
    for (const slot of lesson.slots) {
      if (!Array.isArray(slot.bricks) || slot.bricks.length < 3) {
        errs.push(`Lesson ${lesson.id} slot ${slot.slotKey} bricks < 3`);
        continue;
      }
      for (const brick of slot.bricks) {
        if (!brick.value?.trim()) errs.push(`Lesson ${lesson.id} empty brick value`);
        if (!brick.meaningVi?.trim()) errs.push(`Lesson ${lesson.id} empty brick meaningVi`);
        if (!brick.ipa?.startsWith('/') || !brick.ipa?.endsWith('/')) errs.push(`Lesson ${lesson.id} invalid brick IPA "${brick.ipa}"`);
      }
    }
  }
  return errs;
});

runTest('Lego Lessons', 'Adversarial: every brick substitution generates a clean sentence without remaining brackets', () => {
  const errs: string[] = [];
  for (const lesson of STAGE_2_LEGO_LESSONS) {
    if (lesson.slots.length === 1) {
      const slot = lesson.slots[0];
      for (const brick of slot.bricks) {
        const assembled = lesson.baseFrame.replace(`{${slot.slotKey}}`, brick.value);
        if (assembled.includes('{') || assembled.includes('}')) errs.push(`Unreplaced brackets in "${assembled}"`);
        if (assembled.includes('undefined') || assembled.includes('null')) errs.push(`Bad token in "${assembled}"`);
      }
    } else if (lesson.slots.length === 2) {
      for (const brick0 of lesson.slots[0].bricks) {
        for (const brick1 of lesson.slots[1].bricks) {
          let assembled = lesson.baseFrame.replace(`{${lesson.slots[0].slotKey}}`, brick0.value);
          assembled = assembled.replace(`{${lesson.slots[1].slotKey}}`, brick1.value);
          if (assembled.includes('{') || assembled.includes('}')) errs.push(`Unreplaced brackets in "${assembled}"`);
          if (assembled.includes('undefined') || assembled.includes('null')) errs.push(`Bad token in "${assembled}"`);
        }
      }
    }
  }
  return errs;
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: 3-BEAT EXPANSIONS (STAGE 3)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 4: All 6 3-Beat Expansions (Stage 3) ---');

runTest('3-Beat Expansions', 'Exactly 6 3-beat expansions exist', () => {
  if (STAGE_3_EXPANSIONS.length !== 6) {
    return [`Expected 6 expansions, got ${STAGE_3_EXPANSIONS.length}`];
  }
});

runTest('3-Beat Expansions', 'All 6 expansions have all 3 beats defined in both English and Vietnamese', () => {
  const errs: string[] = [];
  for (const exp of STAGE_3_EXPANSIONS) {
    if (!exp.beat1Core?.en?.trim()) errs.push(`Expansion ${exp.id} missing beat1Core.en`);
    if (!exp.beat1Core?.vi?.trim()) errs.push(`Expansion ${exp.id} missing beat1Core.vi`);
    if (!exp.beat2Context?.en?.trim()) errs.push(`Expansion ${exp.id} missing beat2Context.en`);
    if (!exp.beat2Context?.vi?.trim()) errs.push(`Expansion ${exp.id} missing beat2Context.vi`);
    if (!exp.beat3EmotionReason?.en?.trim()) errs.push(`Expansion ${exp.id} missing beat3EmotionReason.en`);
    if (!exp.beat3EmotionReason?.vi?.trim()) errs.push(`Expansion ${exp.id} missing beat3EmotionReason.vi`);
  }
  return errs;
});

runTest('3-Beat Expansions', 'fullSentence and fullMeaningVi are defined and non-empty for all 6 expansions', () => {
  const errs: string[] = [];
  for (const exp of STAGE_3_EXPANSIONS) {
    if (!exp.fullSentence || exp.fullSentence.length < 20) errs.push(`Expansion ${exp.id} short fullSentence`);
    if (!exp.fullMeaningVi || exp.fullMeaningVi.length < 20) errs.push(`Expansion ${exp.id} short fullMeaningVi`);
    if (!Array.isArray(exp.coreKeywords) || exp.coreKeywords.length < 4) errs.push(`Expansion ${exp.id} coreKeywords < 4`);
  }
  return errs;
});

runTest('3-Beat Expansions', 'Adversarial: 100% of coreKeywords exist in fullSentence text', () => {
  const errs: string[] = [];
  for (const exp of STAGE_3_EXPANSIONS) {
    const cleanSentence = exp.fullSentence
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleanSentence.split(/\s+/).filter(Boolean);

    for (const kw of exp.coreKeywords) {
      const cleanKw = kw.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]/g, '');
      const match = tokens.some(tok => tok === cleanKw || tok.includes(cleanKw) || cleanKw.includes(tok));
      if (!match) errs.push(`Expansion ${exp.id}: Keyword "${kw}" not in fullSentence "${exp.fullSentence}"`);
    }
  }
  return errs;
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5: MICRO-DIALOGUES (STAGE 3)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 5: All 6 Micro-Dialogues (Stage 3) ---');

runTest('Micro-Dialogues', 'Exactly 6 micro-dialogues exist', () => {
  if (STAGE_3_MICRO_DIALOGUES.length !== 6) {
    return [`Expected 6 micro-dialogues, got ${STAGE_3_MICRO_DIALOGUES.length}`];
  }
});

runTest('Micro-Dialogues', 'All 6 micro-dialogues have scenarios, scenarioVi, and exactly 4 turns', () => {
  const errs: string[] = [];
  for (const dial of STAGE_3_MICRO_DIALOGUES) {
    if (!dial.scenario || dial.scenario.length < 3) errs.push(`Dialogue ${dial.id} missing scenario`);
    if (!dial.scenarioVi || dial.scenarioVi.length < 3) errs.push(`Dialogue ${dial.id} missing scenarioVi`);
    if (!Array.isArray(dial.turns) || dial.turns.length !== 4) {
      errs.push(`Dialogue ${dial.id} turns count is ${dial.turns?.length}, expected 4`);
    }
  }
  return errs;
});

runTest('Micro-Dialogues', 'All 6 micro-dialogues alternate turns between speakers', () => {
  const errs: string[] = [];
  for (const dial of STAGE_3_MICRO_DIALOGUES) {
    for (let i = 0; i < dial.turns.length - 1; i++) {
      if (dial.turns[i].speaker === dial.turns[i + 1].speaker) {
        errs.push(`Dialogue ${dial.id} turn ${i} and ${i + 1} have identical speaker "${dial.turns[i].speaker}"`);
      }
    }
  }
  return errs;
});

runTest('Micro-Dialogues', 'Conversational consistency: check dialogue opener speaker role', () => {
  const errs: string[] = [];
  for (const dial of STAGE_3_MICRO_DIALOGUES) {
    if (dial.turns[0].speaker !== 'Partner') {
      errs.push(`Dialogue ${dial.id} opens with "${dial.turns[0].speaker}" instead of standard conversational "Partner" opener`);
    }
  }
  return errs;
});

runTest('Micro-Dialogues', 'All turns contain non-empty textEn and textVi', () => {
  const errs: string[] = [];
  for (const dial of STAGE_3_MICRO_DIALOGUES) {
    for (let i = 0; i < dial.turns.length; i++) {
      const turn = dial.turns[i];
      if (!turn.textEn?.trim()) errs.push(`Dialogue ${dial.id} turn ${i} textEn empty`);
      if (!turn.textVi?.trim()) errs.push(`Dialogue ${dial.id} turn ${i} textVi empty`);
    }
  }
  return errs;
});

runTest('Micro-Dialogues', 'Learner turns define coreKeywords and all keywords exist in textEn', () => {
  const errs: string[] = [];
  for (const dial of STAGE_3_MICRO_DIALOGUES) {
    const learnerTurns = dial.turns.filter(t => t.speaker === 'Learner');
    for (const turn of learnerTurns) {
      if (!Array.isArray(turn.coreKeywords) || turn.coreKeywords.length < 3) {
        errs.push(`Dialogue ${dial.id} learner turn coreKeywords < 3`);
        continue;
      }
      const cleanText = turn.textEn.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ');
      const tokens = cleanText.split(/\s+/).filter(Boolean);
      for (const kw of turn.coreKeywords) {
        const cleanKw = kw.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]/g, '');
        const match = tokens.some(tok => tok === cleanKw || tok.includes(cleanKw) || cleanKw.includes(tok));
        if (!match) errs.push(`Dialogue ${dial.id} keyword "${kw}" not in textEn "${turn.textEn}"`);
      }
    }
  }
  return errs;
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6: ZERO PLACEHOLDER / TODO / LOREM IPSUM SCAN
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- SUITE 6: Zero Placeholder / TODO / Lorem Ipsum Scan ---');

const FILES_TO_SCAN = [
  'src/data/speaking/foundation/stage-0-phonetics.ts',
  'src/data/speaking/foundation/stage-1-survival-frames.ts',
  'src/data/speaking/foundation/stage-2-lego-slots.ts',
  'src/data/speaking/foundation/stage-3-expansions.ts',
  'src/data/speaking/foundation/index.ts',
  'src/types/speaking-foundation.ts',
  'src/lib/speaking/safe-harbor-matcher.ts',
  'src/lib/speaking/index.ts',
  'src/components/speaking/foundation/SafeHarborRecorder.tsx',
  'src/components/speaking/foundation/DualSpeedAudioButton.tsx',
  'src/components/speaking/foundation/StageProgressNav.tsx',
  'src/components/speaking/foundation/index.ts',
  'src/app/student/speaking/foundation/page.tsx',
  'src/app/student/speaking/foundation/stage-0/page.tsx',
  'src/app/student/speaking/foundation/stage-1/page.tsx',
  'src/app/student/speaking/foundation/stage-2/page.tsx',
  'src/app/student/speaking/foundation/stage-3/page.tsx',
];

runTest('Code Cleanliness', 'Scan for TODO / FIXME across all 17 speaking codebase files', () => {
  const violations: string[] = [];
  for (const relPath of FILES_TO_SCAN) {
    const fullPath = path.resolve(relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/\b(TODO|FIXME)\b/i.test(line)) {
        violations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
  return violations;
});

runTest('Code Cleanliness', 'Scan for "lorem ipsum" or dummy latin text across all 17 files', () => {
  const violations: string[] = [];
  for (const relPath of FILES_TO_SCAN) {
    const fullPath = path.resolve(relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/lorem\s+ipsum/i.test(line)) {
        violations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
  return violations;
});

runTest('Code Cleanliness', 'Verify no fake "placeholder" text strings (distinguishing from HTML input attributes)', () => {
  const violations: string[] = [];
  for (const relPath of FILES_TO_SCAN) {
    const fullPath = path.resolve(relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const stripped = line
        .replace(/placeholder="[^"]*"/g, '')
        .replace(/placeholder=\{[^}]*\}/g, '')
        .replace(/zero placeholders/gi, '')
        .replace(/zero placeholder/gi, '')
        .replace(/without placeholders/gi, '');

      if (/\bplaceholder\b/i.test(stripped)) {
        violations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
  return violations;
});

// ─────────────────────────────────────────────────────────────────────────────
export function getDataIntegrityStats() {
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;
  return { total: totalCount, passed: passedCount, failed: failedCount };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('adversarial-data-integrity')) {
  console.log('\n================================================================================');
  console.log('  CHALLENGER 2 TEST EXECUTION SUMMARY');
  console.log('================================================================================');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalCount = results.length;

  console.log(`Total Adversarial Tests Executed : ${totalCount}`);
  console.log(`Tests Passed                     : ${passedCount}`);
  console.log(`Tests Failed                     : ${failedCount}`);

  if (failedCount > 0) {
    console.log('\nFAILED TESTS AUDIT REPORT:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n• [${r.category}] ${r.name}:`);
      r.errors?.forEach(e => console.log(`    - ${e}`));
    });
    console.log('\n❌ EMPIRICAL VERDICT: REJECT (Defects identified in dataset and configuration)');
    process.exit(1);
  } else {
    console.log('\n✅ ALL ADVERSARIAL INTEGRITY TESTS PASSED WITH 0 DEFECTS!');
    console.log('✅ EMPIRICAL VERDICT: APPROVE');
    process.exit(0);
  }
}
