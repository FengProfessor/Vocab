/**
 * tests/adversarial-challenger-deep-dive.test.ts
 * Deep Empirical Challenger Suite for Chinese Language Module & Remotion Specs.
 * 
 * Conducted by orch4_v2_challenger_technical.
 * Rigorously probes edge cases, mathematical limits, schema injection, and regex boundaries.
 */

import { z } from 'zod';
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';
import fs from 'node:fs';
import path from 'node:path';

// 1. Re-import or recreate functions exactly as specified in docs/specs/chinese-language-module-spec.md
const CHINESE_FSRS_WEIGHTS = [
  0.1400, // w0:  S0(Again)
  0.7500, // w1:  S0(Hard)
  1.6000, // w2:  S0(Good)
  5.2000, // w3:  S0(Easy)
  9.2500, // w4:  D0(Again) anchor (yields D0(Good) = 7.42)
  0.5200, // w5:  D0 grade sensitivity
  2.6500, // w6:  next_difficulty delta multiplier
  0.0250, // w7:  mean reversion weight
  1.5200, // w8:  next_recall_stability base
  0.2200, // w9:  stability difficulty power factor
  0.8500, // w10: stability retrievability factor
  1.1500, // w11: next_forget_stability multiplier
  0.0950, // w12: forget difficulty power
  0.2300, // w13: forget stability power
  1.5500, // w14: forget retrievability factor
  0.4800, // w15: Hard penalty
  1.4200, // w16: Easy bonus
  0.6200, // w17: short-term stability multiplier
  0.0750, // w18: short-term stability offset
  0.0658, // w19: short-term decay exponent (ts-fsrs v5.4.1)
  0.1542, // w20: short-term scaling factor (ts-fsrs v5.4.1)
];

function computeChineseInitialDifficulty(
  baseGrade: 1 | 2 | 3 | 4,
  context?: any
): number {
  const w4 = CHINESE_FSRS_WEIGHTS[4]; // 9.25
  const w5 = CHINESE_FSRS_WEIGHTS[5]; // 0.52
  let d0 = w4 - Math.exp((baseGrade - 1) * w5) + 1;

  if (!context) return Math.min(10, Math.max(1, d0));

  const strokeCount = context.strokeCount ?? 4;
  const deltaStrokes = 0.45 * Math.log(1 + Math.max(0, strokeCount - 4));

  const structMap: Record<string, number> = {
    single: 0.0,
    left_right: 0.20,
    top_bottom: 0.30,
    semi_enclosure: 0.55,
    full_enclosure: 0.80,
    tri_cluster: 0.80,
  };
  const deltaStruct = structMap[context.structure || 'left_right'] ?? 0.20;

  const confusable = context.confusableNeighborsCount ?? 0;
  const deltaOrtho = Math.min(1.20, 0.35 * confusable);

  let deltaTone = 0.0;
  if (context.isPolyphonic) deltaTone += 0.75;
  if (context.hasComplexSandhi) deltaTone += 0.35;

  const sinoMap: Record<string, number> = {
    identical: 1.20,
    partial: 0.60,
    none: 0.00,
    false_friend: -0.85,
  };
  const deltaSino = sinoMap[context.sinoVietnameseMatch || 'none'] ?? 0.0;

  const finalDifficulty = d0 + deltaStrokes + deltaStruct + deltaOrtho + deltaTone - deltaSino;
  return Math.min(10.0, Math.max(1.0, finalDifficulty));
}

// 2. Remotion Zod Schemas
const CenterBrandingSchema = z.object({
  centerId: z.string().min(1),
  centerName: z.string().min(2),
  logoUrl: z.string().url(),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/).default('#B91C1C'),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/).default('#F59E0B'),
  hotline: z.string().min(8),
  ctaText: z.string().optional(),
  watermarkPosition: z.enum(['top-left', 'top-right']).default('top-left'),
});

const ChineseVideoPropsSchema = z.object({
  character: z.string().min(1).max(4),
  pinyin: z.string().min(1),
  pinyinClean: z.string().min(1),
  toneNumber: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  sinoVietnamese: z.string().min(1),
  meaningVi: z.string().min(1),
  posVi: z.string().optional(),
  hskLevel: z.number().int().min(1).max(9),
  radical: z.string().min(1),
  radicalNameVi: z.string().min(1),
  strokeCount: z.number().int().min(1).max(64),
  strokesSvg: z.array(z.string().min(5)).min(1),
  strokeMedians: z.array(z.array(z.array(z.number()))).optional(),
  example: z.object({
    hanzi: z.string().min(1),
    pinyin: z.string().min(1),
    vietnamese: z.string().min(1),
    audioUrl: z.string().min(1).optional(),
  }),
  characterAudioUrl: z.string().min(1),
  backgroundMusicUrl: z.string().min(1).optional(),
  centerConfig: CenterBrandingSchema,
});

async function main() {
  console.log('=== ORCH4 V2 CHALLENGER TECHNICAL DEEP DIVE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: any) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`, details ?? '');
      failed++;
    }
  }

  // 1. Math probe on all 4 base grades
  console.log('1. Probing Base Difficulty Mathematical Trajectory:');
  const dAgain = computeChineseInitialDifficulty(1);
  const dHard = computeChineseInitialDifficulty(2);
  const dGood = computeChineseInitialDifficulty(3);
  const dEasy = computeChineseInitialDifficulty(4);

  assert('D0(Again) == 9.25', Math.abs(dAgain - 9.25) < 0.001, { dAgain });
  assert('D0(Hard) ~ 8.57', Math.abs(dHard - 8.568) < 0.01, { dHard });
  assert('D0(Good) ~ 7.42', Math.abs(dGood - 7.421) < 0.01, { dGood });
  assert('D0(Easy) ~ 5.49', Math.abs(dEasy - 5.491) < 0.01, { dEasy });
  assert('Strict monotonic descent: Again > Hard > Good > Easy', dAgain > dHard && dHard > dGood && dGood > dEasy);

  // 2. Boundary clamping: Extreme inputs
  console.log('\n2. Boundary Clamping & Extreme Input Invariance:');
  // Maximum possible stress: Grade 1, 64 strokes, tri_cluster, 10 confusable, polyphonic, complex sandhi, false_friend
  const dMax = computeChineseInitialDifficulty(1, {
    strokeCount: 64,
    structure: 'tri_cluster',
    confusableNeighborsCount: 10,
    isPolyphonic: true,
    hasComplexSandhi: true,
    sinoVietnameseMatch: 'false_friend',
  });
  assert('Max stress clamped to 10.0', dMax === 10.0, { dMax });

  // Minimum possible stress: Grade 4, 1 stroke, single, 0 confusable, identical Sino-Viet
  const dMin = computeChineseInitialDifficulty(4, {
    strokeCount: 1,
    structure: 'single',
    confusableNeighborsCount: 0,
    isPolyphonic: false,
    hasComplexSandhi: false,
    sinoVietnameseMatch: 'identical',
  });
  assert('Min stress clamped >= 1.0 (actual ~4.29)', dMin >= 1.0 && dMin <= 5.0, { dMin });

  // Empty object context & undefined fields do not cause NaN or collapse
  const dEmpty = computeChineseInitialDifficulty(3, {});
  assert('Empty object context produces valid number', !Number.isNaN(dEmpty) && typeof dEmpty === 'number', { dEmpty });

  // Weird property values: negative strokes, negative confusables
  const dNegative = computeChineseInitialDifficulty(3, {
    strokeCount: -10,
    confusableNeighborsCount: -5,
    structure: 'unknown_structure_hack',
    sinoVietnameseMatch: 'invalid_match_hack',
  });
  assert('Negative / malformed inputs handled safely without NaN', !Number.isNaN(dNegative) && dNegative >= 1.0 && dNegative <= 10.0, { dNegative });

  // 3. FSRS 21 parameters compatibility and scheduling simulation
  console.log('\n3. FSRS 21-Weights Scheduler Invariance:');
  const params = generatorParameters({
    request_retention: 0.94,
    maximum_interval: 180,
    w: CHINESE_FSRS_WEIGHTS,
  });
  assert('Parameters vector contains exactly 21 weights', params.w.length === 21);

  const f = fsrs(params);
  let card = createEmptyCard();
  // Simulate rating Again
  const resAgain = f.repeat(card, new Date('2026-10-01T00:00:00Z'));
  const cardAgain = resAgain[Rating.Again].card;
  assert('Again rating produces expected initial interval (short)', cardAgain.scheduled_days === 0);

  // Simulate repeated Good reviews up to 10 iterations
  let curr = resAgain[Rating.Good].card;
  let currDate = new Date('2026-10-01T00:00:00Z');
  let intervalsBounded = true;
  for (let i = 0; i < 10; i++) {
    currDate = new Date(currDate.getTime() + curr.scheduled_days * 86400000);
    const step = f.repeat(curr, currDate);
    curr = step[Rating.Good].card;
    if (curr.scheduled_days > 180 || Number.isNaN(curr.scheduled_days)) {
      intervalsBounded = false;
    }
  }
  assert('10 consecutive Good reviews remain <= 180 days and non-NaN', intervalsBounded, { lastInterval: curr.scheduled_days });

  // 4. Remotion Zod Schema Boundary Stress
  console.log('\n4. Remotion Zod Schema Boundary Stress:');
  const baseValidProps = {
    character: '好',
    pinyin: 'hǎo',
    pinyinClean: 'hao3',
    toneNumber: 3,
    sinoVietnamese: 'HẢO',
    meaningVi: 'Tốt, đẹp, hay',
    hskLevel: 1,
    radical: '女',
    radicalNameVi: 'Bộ Nữ',
    strokeCount: 6,
    strokesSvg: ['M 0 0 L 10 10'],
    example: {
      hanzi: '你好',
      pinyin: 'Nǐ hǎo',
      vietnamese: 'Xin chào',
    },
    characterAudioUrl: 'tmp/audio/hao3.mp3',
    centerConfig: {
      centerId: 'center_001',
      centerName: 'Trung Tâm Hoa Ngữ',
      logoUrl: 'https://example.com/logo.png',
      hotline: '0901234567',
      brandColor: '#FF5500AA', // 8-digit hex
      accentColor: '#123',     // 3-digit hex
    },
  };

  // 4.1 Test tone numbers 0..5
  for (let t = 0; t <= 5; t++) {
    const res = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, toneNumber: t });
    assert(`Tone ${t} accepted`, res.success);
  }
  const tone6 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, toneNumber: 6 });
  assert('Tone 6 rejected', !tone6.success);

  // 4.2 Test strokeCount boundary: 1, 64, 65
  const sc1 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, strokeCount: 1 });
  const sc64 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, strokeCount: 64 });
  const sc65 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, strokeCount: 65 });
  const sc0 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, strokeCount: 0 });
  assert('strokeCount = 1 accepted', sc1.success);
  assert('strokeCount = 64 accepted', sc64.success);
  assert('strokeCount = 65 rejected', !sc65.success);
  assert('strokeCount = 0 rejected', !sc0.success);

  // 4.3 Test hskLevel boundary: 1, 9, 10
  const hsk1 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, hskLevel: 1 });
  const hsk9 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, hskLevel: 9 });
  const hsk10 = ChineseVideoPropsSchema.safeParse({ ...baseValidProps, hskLevel: 10 });
  assert('hskLevel = 1 accepted', hsk1.success);
  assert('hskLevel = 9 accepted', hsk9.success);
  assert('hskLevel = 10 rejected', !hsk10.success);

  // 4.4 Test hex colors
  const hexInvalid = ChineseVideoPropsSchema.safeParse({
    ...baseValidProps,
    centerConfig: { ...baseValidProps.centerConfig, brandColor: 'red' },
  });
  assert('Named color "red" rejected by hex regex', !hexInvalid.success);

  // 5. Spec Markdown Structural Audit
  console.log('\n5. Direct Markdown Specification Verifications:');
  const cnSpec = fs.readFileSync(path.resolve('docs/specs/chinese-language-module-spec.md'), 'utf-8');
  const remotionSpec = fs.readFileSync(path.resolve('docs/specs/remotion-chinese-video-spec.md'), 'utf-8');

  // Verify CTE user_classes in cnSpec
  assert('chinese spec includes user_classes CTE', cnSpec.includes('WITH user_classes AS ('));
  // Verify auth check
  assert('chinese spec includes caller check with coalesce(auth.role(), "") = \'service_role\'',
    cnSpec.includes("coalesce(auth.role(), '') = 'service_role' OR auth.uid() = p_user_id"));
  // Verify char_length decoupling
  assert('chinese spec includes char_length(w.word) = 1 decoupling',
    cnSpec.includes('char_length(w.word) = 1'));
  // Verify ON CONFLICT
  assert('chinese spec includes ON CONFLICT (user_id, character_id) DO UPDATE',
    cnSpec.includes('ON CONFLICT (user_id, character_id) DO UPDATE'));
  // Verify translation error filter
  assert('chinese spec filters %failed% and %⏳%',
    cnSpec.includes("NOT ILIKE '%failed%'") && cnSpec.includes("NOT LIKE '%⏳%'"));
  // Verify composite all due check
  assert('chinese spec has composite all component due condition',
    cnSpec.includes("WHEN p_component = 'all' THEN (s.next_review_recognition <= NOW() OR s.next_review_tone <= NOW() OR s.next_review_writing <= NOW())"));

  // Verify safe zones in remotion spec
  assert('remotion spec watermark placed at y = 180 px', remotionSpec.includes('y = 180\\text{ px}') || remotionSpec.includes('y = 180 px'));
  assert('remotion spec CTA banner placed between 1420 px and 1560 px', remotionSpec.includes('1420') && remotionSpec.includes('1560'));
  // Verify worker pool catch and finally
  assert('remotion spec worker pool uses .catch() and .finally()',
    remotionSpec.includes('.catch(') && remotionSpec.includes('.finally('));

  console.log(`\n=== RESULT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
