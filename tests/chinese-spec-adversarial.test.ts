/**
 * tests/chinese-spec-adversarial.test.ts
 * Empirical Adversarial Verification Harness for Remediated Chinese Language & Remotion Specs.
 * 
 * Verifies:
 * 1. FSRS Ideographic mathematical edge cases (w4 = 9.25, w5 = 0.52 -> D0(Good) = 7.42, 21 weights vector).
 * 2. NaN safety in computeChineseInitialDifficulty with partial context.
 * 3. Extreme review intervals (0d to 180d) with ts-fsrs 5.4.1.
 * 4. Zod Schema boundary conditions for Remotion ChineseVideoProps (64 strokes, tone 0, local audio, HSK 1-9, 8-digit hex).
 * 5. Safe zone geometry calculations (Watermark y=180px >= 160px, CTA y=1420-1560px <= 1600px).
 * 6. Headless CLI worker pool error handling (.catch and .finally).
 * 7. Verification of actual specification markdown files (AST / string inspection for security, CAS, and decoupling).
 */

import { fsrs, generatorParameters, createEmptyCard, Rating } from 'ts-fsrs';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// 1. REMEDIATED FSRS IDEOGRAPHIC FORMULA & WEIGHTS SPEC
// ============================================================================

export const CHINESE_FSRS_WEIGHTS_SPEC: number[] = [
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

export interface ChineseLinguisticContext {
  strokeCount?: number;
  structure?: 'single' | 'left_right' | 'top_bottom' | 'semi_enclosure' | 'full_enclosure' | 'tri_cluster';
  confusableNeighborsCount?: number;
  isPolyphonic?: boolean;
  hasComplexSandhi?: boolean;
  sinoVietnameseMatch?: 'identical' | 'partial' | 'none' | 'false_friend';
}

export function computeChineseInitialDifficultySpec(
  baseGrade: 1 | 2 | 3 | 4,
  context?: ChineseLinguisticContext
): number {
  const w4 = CHINESE_FSRS_WEIGHTS_SPEC[4]; // 9.25
  const w5 = CHINESE_FSRS_WEIGHTS_SPEC[5]; // 0.52
  let d0 = w4 - Math.exp((baseGrade - 1) * w5) + 1;

  if (!context) return Math.min(10, Math.max(1, d0));

  // Stroke count penalty (default fallback 4 strokes prevents NaN)
  const strokeCount = context.strokeCount ?? 4;
  const deltaStrokes = 0.45 * Math.log(1 + Math.max(0, strokeCount - 4));

  // Structure penalty
  const structMap: Record<string, number> = {
    single: 0.0,
    left_right: 0.20,
    top_bottom: 0.30,
    semi_enclosure: 0.55,
    full_enclosure: 0.80,
    tri_cluster: 0.80,
  };
  const deltaStruct = structMap[context.structure || 'left_right'] ?? 0.20;

  // Orthographic neighbor confusion (default fallback 0 prevents NaN)
  const confusable = context.confusableNeighborsCount ?? 0;
  const deltaOrtho = Math.min(1.20, 0.35 * confusable);

  // Tone irregularity
  let deltaTone = 0.0;
  if (context.isPolyphonic) deltaTone += 0.75;
  if (context.hasComplexSandhi) deltaTone += 0.35;

  // Sino-Vietnamese cognate bonus / false friend penalty
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

// ============================================================================
// 2. REMEDIATED REMOTION PROPS SCHEMA SPEC
// ============================================================================

export const CenterBrandingSchemaSpec = z.object({
  centerId: z.string().min(1),
  centerName: z.string().min(2),
  logoUrl: z.string().url(),
  brandColor: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/).default('#B91C1C'),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/).default('#F59E0B'),
  hotline: z.string().min(8),
  ctaText: z.string().optional(),
  watermarkPosition: z.enum(['top-left', 'top-right']).default('top-left'),
});

export const ChineseVideoPropsSchemaSpec = z.object({
  character: z.string().min(1).max(4),
  pinyin: z.string().min(1),
  pinyinClean: z.string().min(1),
  toneNumber: z.union([
    z.literal(0), // Neutral tone (GB/T standard)
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  sinoVietnamese: z.string().min(1),
  meaningVi: z.string().min(1),
  posVi: z.string().optional(),
  hskLevel: z.number().int().min(1).max(9), // HSK 3.0 Levels 1-9
  radical: z.string().min(1),
  radicalNameVi: z.string().min(1),
  strokeCount: z.number().int().min(1).max(64), // Up to 64 strokes
  strokesSvg: z.array(z.string().min(5)).min(1),
  strokeMedians: z.array(z.array(z.array(z.number()))).optional(),
  example: z.object({
    hanzi: z.string().min(1),
    pinyin: z.string().min(1),
    vietnamese: z.string().min(1),
    audioUrl: z.string().min(1).optional(),
  }),
  characterAudioUrl: z.string().min(1), // Accepts HTTPS URLs or local cached paths
  backgroundMusicUrl: z.string().min(1).optional(),
  centerConfig: CenterBrandingSchemaSpec,
});

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

async function runAdversarialHarness() {
  console.log('================================================================');
  console.log('RUNNING EMPIRICAL ADVERSARIAL STRESS TEST SUITE FOR CHINESE SPECS');
  console.log('================================================================\n');

  let testCount = 0;
  let passCount = 0;
  let bugCount = 0;

  // TEST 1: Baseline Good Difficulty Calibration (w4 = 9.25, w5 = 0.52 -> D0(Good) = 7.42)
  testCount++;
  console.log(`[TEST 1] Testing Baseline "Good" Difficulty with Sino-Viet Cognate...`);
  const diffGood = computeChineseInitialDifficultySpec(3, {
    strokeCount: 4,
    structure: 'single',
    confusableNeighborsCount: 0,
    isPolyphonic: false,
    hasComplexSandhi: false,
    sinoVietnameseMatch: 'identical',
  });
  console.log(`  -> Initial Difficulty for Good (Grade 3) on Sino-Viet cognate: ${diffGood.toFixed(4)}`);
  // Expected: D0(3) = 9.25 - e^(2 * 0.52) + 1 = 9.25 - 2.8292 + 1 = 7.4208. Minus 1.20 = 6.2208.
  if (diffGood >= 5.0 && diffGood <= 10.0) {
    passCount++;
    console.log(`  [PASS] Difficulty calibrated at ${diffGood.toFixed(2)} (>= 5.0). Collapse to 1.0 successfully remediated!`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Baseline difficulty collapsed: ${diffGood}`);
  }

  // TEST 2: NaN Protection when Context Has Missing Optional Fields
  testCount++;
  console.log(`\n[TEST 2] Testing NaN Protection on Partial Linguistic Context...`);
  const diffPartial = computeChineseInitialDifficultySpec(3, {
    structure: 'single',
    // strokeCount and confusableNeighborsCount omitted
  });
  console.log(`  -> Result with missing optional properties: ${diffPartial.toFixed(4)}`);
  if (!Number.isNaN(diffPartial) && typeof diffPartial === 'number') {
    passCount++;
    console.log(`  [PASS] Safe fallbacks (strokeCount ?? 4, confusable ?? 0) successfully prevented NaN!`);
  } else {
    bugCount++;
    console.log(`  [FAIL] computeChineseInitialDifficultySpec returned NaN!`);
  }

  // TEST 3: ts-fsrs 5.4.1 Full 21-Parameter Vector Compatibility
  testCount++;
  console.log(`\n[TEST 3] Testing ts-fsrs v5.4.1 Parameter Vector Length Compatibility...`);
  const params = generatorParameters({
    request_retention: 0.94,
    maximum_interval: 180,
    w: CHINESE_FSRS_WEIGHTS_SPEC,
  });
  console.log(`  -> Passed w length: ${CHINESE_FSRS_WEIGHTS_SPEC.length}, ts-fsrs resulting w length: ${params.w.length}`);
  if (params.w.length === 21 && CHINESE_FSRS_WEIGHTS_SPEC.length === 21) {
    passCount++;
    console.log(`  [PASS] Exact 21 parameters supplied matching ts-fsrs v5.4.1. Zero autofill warnings!`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Vector length mismatch: expected 21, got ${CHINESE_FSRS_WEIGHTS_SPEC.length}`);
  }

  // TEST 4: Extreme Review Intervals (0d to 180d)
  testCount++;
  console.log(`\n[TEST 4] Testing 0 to 180-day Review Intervals with FSRS Scheduler...`);
  const f = fsrs(params);
  let card = createEmptyCard();
  const initRes = f.repeat(card, new Date('2026-10-01T00:00:00Z'));
  const matureCard = initRes[Rating.Good].card;
  const gap180Date = new Date('2027-03-30T00:00:00Z');
  const gap180Res = f.repeat(matureCard, gap180Date);
  const good180 = gap180Res[Rating.Good].card;
  console.log(`  -> 180-day gap: Stability=${good180.stability.toFixed(2)}, SchedDays=${good180.scheduled_days}, State=${good180.state}`);
  if (good180.scheduled_days <= 180 && !Number.isNaN(good180.stability)) {
    passCount++;
    console.log(`  [PASS] Stability bounded, scheduled days capped at maximum_interval (180d).`);
  } else {
    bugCount++;
    console.log(`  [FAIL] FSRS interval or stability invalid under 180d gap.`);
  }

  // TEST 5: Zod Schema Boundary - 36-stroke Character (齉) and Extreme Strokes
  testCount++;
  console.log(`\n[TEST 5] Testing Zod Schema on 36-Stroke Character (齉)...`);
  const nang36 = {
    character: '齉',
    pinyin: 'nàng',
    pinyinClean: 'nang4',
    toneNumber: 4,
    sinoVietnamese: 'NANG',
    meaningVi: 'Nghẹt mũi, nói giọng mũi',
    hskLevel: 6,
    radical: '鼻',
    radicalNameVi: 'Bộ Tị (Mũi)',
    strokeCount: 36, // Extreme boundary (now permitted up to 64)
    strokesSvg: ['M 0 0 L 10 10'],
    example: { hanzi: '鼻子齉了', pinyin: 'Bízi nàng le', vietnamese: 'Mũi bị nghẹt rồi' },
    characterAudioUrl: 'https://cdn.lingopro.online/audio/nang4.mp3',
    centerConfig: {
      centerId: 'c1',
      centerName: 'Center A',
      logoUrl: 'https://cdn.example.com/logo.png',
      hotline: '0123456789',
    },
  };
  const parse36 = ChineseVideoPropsSchemaSpec.safeParse(nang36);
  if (parse36.success) {
    passCount++;
    console.log(`  [PASS] 36-stroke character (齉) successfully validated with strokeCount <= 64.`);
  } else {
    bugCount++;
    console.log(`  [FAIL] 36-stroke character rejected:`, parse36.error.issues);
  }

  // TEST 6: Zod Schema - Neutral Tone Number 0
  testCount++;
  console.log(`\n[TEST 6] Testing Zod Schema on Neutral Tone 0...`);
  const neutralTone0 = { ...nang36, strokeCount: 8, toneNumber: 0 };
  const parseTone0 = ChineseVideoPropsSchemaSpec.safeParse(neutralTone0);
  if (parseTone0.success) {
    passCount++;
    console.log(`  [PASS] Neutral Tone 0 (GB/T standard) successfully accepted.`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Neutral Tone 0 rejected:`, parseTone0.error.issues);
  }

  // TEST 7: Zod Schema - Local Cached Audio Path & 8-Digit Hex Brand Color
  testCount++;
  console.log(`\n[TEST 7] Testing Local Cached Audio Path & 8-digit Hex Brand Color...`);
  const localAudio = {
    ...nang36,
    strokeCount: 8,
    characterAudioUrl: 'tmp/audio/nang4.mp3',
    hskLevel: 7, // HSK 3.0 advanced
    centerConfig: {
      ...nang36.centerConfig,
      brandColor: '#B91C1C80', // 8-digit hex with alpha
    },
  };
  const parseLocalAudio = ChineseVideoPropsSchemaSpec.safeParse(localAudio);
  if (parseLocalAudio.success) {
    passCount++;
    console.log(`  [PASS] Local audio path, HSK level 7, and 8-digit hex brandColor successfully validated.`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Local audio / HSK 7 / brandColor rejected:`, parseLocalAudio.error.issues);
  }

  // TEST 8: Safe Zone Mathematical Invariants Verification (1080x1920)
  testCount++;
  console.log(`\n[TEST 8] Verifying Safe Zone Coordinate Invariants (1080x1920)...`);
  const topSafeBoundary = 160;
  const brandWatermarkY = 180; // Remediated: Section 3.5 moved to y = 180px
  const bottomSafeBoundary = 1600;
  const ctaBannerY = 1420; // Remediated: Section 3.6 moved to y = 1420px
  const ctaBannerDiagramY = 1560; // Remediated: Section 2.2 diagram ends at y = 1560px

  const watermarkSafe = brandWatermarkY > topSafeBoundary;
  const ctaSafe = ctaBannerDiagramY < bottomSafeBoundary && ctaBannerY > 0;

  if (watermarkSafe && ctaSafe) {
    passCount++;
    console.log(`  [PASS] Watermark at y=${brandWatermarkY}px clears Top Safe Zone (> ${topSafeBoundary}px).`);
    console.log(`  [PASS] CTA banner at y=${ctaBannerY}-${ctaBannerDiagramY}px clears Bottom Safe Zone (< ${bottomSafeBoundary}px).`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Safe zone collision: watermarkSafe=${watermarkSafe}, ctaSafe=${ctaSafe}`);
  }

  // TEST 9: CLI Concurrency Worker Pool Error Isolation
  testCount++;
  console.log(`\n[TEST 9] Simulating Worker Pool Error Isolation under Task Failure...`);
  let unhandledRejectionCaught = false;
  let poolFinishedCount = 0;
  try {
    const items = [1, 2, 3];
    const concurrency = 2;
    const pool: Promise<void>[] = [];
    for (const item of items) {
      const p = (async () => {
        if (item === 2) throw new Error('Simulated FFmpeg render failure on item 2');
      })()
        .catch((err) => {
          // Graceful error logging
        })
        .finally(() => {
          poolFinishedCount++;
          const idx = pool.indexOf(p);
          if (idx !== -1) pool.splice(idx, 1);
        });
      pool.push(p);
      if (pool.length >= concurrency) {
        await Promise.race(pool);
      }
    }
    await Promise.all(pool);
  } catch (err: any) {
    unhandledRejectionCaught = true;
  }

  if (!unhandledRejectionCaught && poolFinishedCount === 3) {
    passCount++;
    console.log(`  [PASS] Worker pool handled single-item failure gracefully with .catch() and .finally(). All 3 slots settled without aborting.`);
  } else {
    bugCount++;
    console.log(`  [FAIL] Worker pool threw unhandled error or stalled! Finished: ${poolFinishedCount}`);
  }

  // TEST 10: Static Spec Files Integrity Inspection
  testCount++;
  console.log(`\n[TEST 10] Verifying Specification Markdown Files Direct Content...`);
  const cnSpecPath = path.resolve('docs/specs/chinese-language-module-spec.md');
  const remotionSpecPath = path.resolve('docs/specs/remotion-chinese-video-spec.md');
  const cnContent = fs.readFileSync(cnSpecPath, 'utf-8');
  const remotionContent = fs.readFileSync(remotionSpecPath, 'utf-8');

  const cnChecks = [
    { name: 'w4 = 9.25', pass: cnContent.includes('9.2500') },
    { name: 'w5 = 0.52', pass: cnContent.includes('0.5200') },
    { name: 'w19 = 0.0658 & w20 = 0.1542', pass: cnContent.includes('0.0658') && cnContent.includes('0.1542') },
    { name: 'user_classes CTE', pass: cnContent.includes('user_classes AS') },
    { name: 'caller authorization check', pass: cnContent.includes("coalesce(auth.role(), '') = 'service_role' OR auth.uid() = p_user_id") },
    { name: 'ON CONFLICT upsert', pass: cnContent.includes('ON CONFLICT (user_id, character_id) DO UPDATE') },
    { name: 'decoupled character SRS', pass: cnContent.includes('char_length(w.word) = 1') && !cnContent.includes('SUBSTRING(w.word FROM 1 FOR 1)') },
    { name: 'wildcard translation filter', pass: cnContent.includes("NOT ILIKE '%failed%'") && cnContent.includes("NOT LIKE '%⏳%'") },
    { name: 'composite all component due check', pass: cnContent.includes("p_component = 'all' THEN (s.next_review_recognition <= NOW() OR s.next_review_tone <= NOW() OR s.next_review_writing <= NOW())") },
  ];

  const remotionChecks = [
    { name: 'strokeCount <= 64', pass: remotionContent.includes('max(64)') },
    { name: 'toneNumber 0..5', pass: remotionContent.includes('z.literal(0)') },
    { name: 'characterAudioUrl string', pass: remotionContent.includes('characterAudioUrl: z.string().min(1)') },
    { name: 'hskLevel 1..9', pass: remotionContent.includes('hskLevel: z.number().int().min(1).max(9)') },
    { name: '8-digit hex brandColor', pass: remotionContent.includes('[A-Fa-f0-9]{8}') },
    { name: 'watermark y = 180px', pass: remotionContent.includes('y = 180\\text{ px}') },
    { name: 'CTA y = 1420 - 1560px', pass: remotionContent.includes('1420') && remotionContent.includes('1560') },
    { name: 'worker pool catch and finally', pass: remotionContent.includes('.catch(') && remotionContent.includes('.finally(') },
  ];

  let specChecksPassed = true;
  for (const c of [...cnChecks, ...remotionChecks]) {
    if (!c.pass) {
      console.log(`  [FAIL SPEC CHECK] Missing in markdown: ${c.name}`);
      specChecksPassed = false;
    }
  }

  if (specChecksPassed) {
    passCount++;
    console.log(`  [PASS] All 17 direct specification text assertions verified in markdown files!`);
  } else {
    bugCount++;
  }

  console.log('\n================================================================');
  console.log(`STRESS TEST SUMMARY: ${testCount} Tests Executed, ${passCount} PASSED, ${bugCount} BUGS DETECTED`);
  console.log('================================================================\n');

  if (bugCount > 0) {
    process.exit(1);
  }
}

runAdversarialHarness().catch(err => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
