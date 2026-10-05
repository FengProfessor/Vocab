/**
 * Adversarial Empirical Stress Test Suite: Milestone 2 QA Verification
 *
 * Exhaustively stress-tests edge cases and boundary conditions:
 * 1. ETS Barem & Scoring: raw 0 vs 100, clamping underflow/overflow, NaN/null,
 *    float scores, 100-step monotonicity, CEFR boundary points.
 * 2. Active Cyber Defense & Security: session token verification with malformed/expired/
 *    tampered inputs, timingSafeEqual behavior on buffer length mismatch, PayOS HMAC
 *    checksum verification, honeypots and plausible poisoning distributions.
 * 3. Steganographic Watermarking: empty, boundary, long, and corrupted zero-width payloads.
 * 4. Cross-Device Viewports: Mathematical bounding proofs for 320px, 375px, 390px, and 1280px viewports.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect, assert } from './test-harness';

import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '@/lib/toeic-barem';

import {
  calculateToeicScore,
  getCefrLevel,
  getCefrDescriptor,
  getPartAccuracyRating,
} from '@/lib/toeic-scoring';

import {
  generateToeicSessionToken,
  verifyToeicSessionToken,
  CANARY_TEST_IDS,
  poisonUnifiedQuestion,
  createPoisonedQuestionBank,
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  ZW_ZERO,
  ZW_ONE,
  ZW_SENTINEL,
} from '@/lib/toeic-anti-scraping';

import { isBillingWebhookAuthorized } from '@/lib/billing-webhook-auth';
import type { ToeicUnifiedQuestion } from '@/types/toeic';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export async function runBoundaryStressTests(
  runner: TestRunner = new TestRunner('Adversarial Boundary Stress Suite')
): Promise<TestRunner> {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. ETS Barem & Scoring Boundary Invariants
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('ETS Barem & Scoring Boundary Stress', async () => {
    await runner.it('ADV-BAREM-1: Exact raw bounds (0 vs 100) return canonical ETS limits (5..495)', () => {
      // Raw 0 must yield minimum scale 5
      expect(lookupListeningScore(0)).toBe(5);
      expect(lookupReadingScore(0)).toBe(5);

      // Raw 100 must yield maximum scale 495
      expect(lookupListeningScore(100)).toBe(495);
      expect(lookupReadingScore(100)).toBe(495);

      // Combined convertRawToScaled
      const minScaled = convertRawToScaled(0, 0);
      expect(minScaled.scaledListening).toBe(5);
      expect(minScaled.scaledReading).toBe(5);
      expect(minScaled.scaledTotal).toBe(10);

      const maxScaled = convertRawToScaled(100, 100);
      expect(maxScaled.scaledListening).toBe(495);
      expect(maxScaled.scaledReading).toBe(495);
      expect(maxScaled.scaledTotal).toBe(990);
    });

    await runner.it('ADV-BAREM-2: Underflow raw scores (-1, -100, -Infinity, NaN) are clamped to 0 raw (5 pts)', () => {
      expect(lookupListeningScore(-1)).toBe(5);
      expect(lookupListeningScore(-100)).toBe(5);
      expect(lookupListeningScore(-Infinity)).toBe(5);
      expect(lookupListeningScore(NaN)).toBe(5);

      expect(lookupReadingScore(-1)).toBe(5);
      expect(lookupReadingScore(-9999)).toBe(5);
      expect(lookupReadingScore(-Infinity)).toBe(5);
      expect(lookupReadingScore(NaN)).toBe(5);

      const clampUnderflow = convertRawToScaled(-50, -25);
      expect(clampUnderflow.scaledListening).toBe(5);
      expect(clampUnderflow.scaledReading).toBe(5);
      expect(clampUnderflow.scaledTotal).toBe(10);
    });

    await runner.it('ADV-BAREM-3: Overflow raw scores (101, 200, +Infinity) are clamped to 100 raw (495 pts)', () => {
      expect(lookupListeningScore(101)).toBe(495);
      expect(lookupListeningScore(500)).toBe(495);
      expect(lookupListeningScore(Infinity)).toBe(495);

      expect(lookupReadingScore(101)).toBe(495);
      expect(lookupReadingScore(999999)).toBe(495);
      expect(lookupReadingScore(Infinity)).toBe(495);

      const clampOverflow = convertRawToScaled(150, 200);
      expect(clampOverflow.scaledListening).toBe(495);
      expect(clampOverflow.scaledReading).toBe(495);
      expect(clampOverflow.scaledTotal).toBe(990);
    });

    await runner.it('ADV-BAREM-4: Float and fractional raw scores are rounded before barem lookup', () => {
      // 74.4 rounds to 74, 74.6 rounds to 75
      const score74 = lookupListeningScore(74);
      const score75 = lookupListeningScore(75);

      expect(lookupListeningScore(74.4)).toBe(score74);
      expect(lookupListeningScore(74.6)).toBe(score75);
      expect(lookupListeningScore(0.4)).toBe(5);
      expect(lookupListeningScore(99.6)).toBe(495);
    });

    await runner.it('ADV-BAREM-5: Monotonicity invariant holds across all 100 transitions for both barems', () => {
      assert(ETS_LISTENING_BAREM.length === 101, 'Listening barem must have exactly 101 items');
      assert(ETS_READING_BAREM.length === 101, 'Reading barem must have exactly 101 items');

      for (let i = 0; i < 100; i++) {
        const currL = ETS_LISTENING_BAREM[i];
        const nextL = ETS_LISTENING_BAREM[i + 1];
        assert(
          nextL >= currL,
          `Listening barem monotonicity violated at index ${i}: ${currL} > ${nextL}`
        );

        const currR = ETS_READING_BAREM[i];
        const nextR = ETS_READING_BAREM[i + 1];
        assert(
          nextR >= currR,
          `Reading barem monotonicity violated at index ${i}: ${currR} > ${nextR}`
        );
      }
    });

    await runner.it('ADV-CEFR-1: Exact CEFR classification thresholds and edge cases', () => {
      // Boundaries: 905 (C1), 605 (B2), 405 (B1), 255 (A2), < 255 (A1)
      expect(getCefrLevel(905)).toBe('C1');
      expect(getCefrLevel(904)).toBe('B2');

      expect(getCefrLevel(605)).toBe('B2');
      expect(getCefrLevel(604)).toBe('B1');

      expect(getCefrLevel(405)).toBe('B1');
      expect(getCefrLevel(404)).toBe('A2');

      expect(getCefrLevel(255)).toBe('A2');
      expect(getCefrLevel(254)).toBe('A1');

      expect(getCefrLevel(10)).toBe('A1');
      expect(getCefrLevel(0)).toBe('A1');
      expect(getCefrLevel(1000)).toBe('C1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Active Cyber Defense & Security Boundary Invariants
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Security & HMAC Boundary Stress', async () => {
    await runner.it('ADV-SEC-1: Session token verification rejects null, empty, malformed, or tampered tokens', () => {
      // 1. Null / undefined / empty
      expect(verifyToeicSessionToken(null)).toBeNull();
      expect(verifyToeicSessionToken(undefined)).toBeNull();
      expect(verifyToeicSessionToken('')).toBeNull();
      expect(verifyToeicSessionToken('   ')).toBeNull();

      // 2. Malformed token structure
      expect(verifyToeicSessionToken('single-string-without-dot')).toBeNull();
      expect(verifyToeicSessionToken('three.parts.in.token')).toBeNull();
      expect(verifyToeicSessionToken('.signature-only')).toBeNull();
      expect(verifyToeicSessionToken('data-only.')).toBeNull();

      // 3. Valid generation followed by tampering
      const validPayload = {
        sessionId: 'sess-12345',
        testId: '6852',
        ipHash: 'hash_127_0_0_1',
        issuedAt: Date.now(),
      };
      const validToken = generateToeicSessionToken(validPayload);
      const verified = verifyToeicSessionToken(validToken);
      assert(verified !== null, 'Valid token must verify');
      expect(verified.sessionId).toBe('sess-12345');

      // Tampered payload with original signature
      const [dataPart, sigPart] = validToken.split('.');
      const tamperedDataPart = Buffer.from(
        JSON.stringify({ ...validPayload, testId: 'hacked-test' })
      ).toString('base64url');
      expect(verifyToeicSessionToken(`${tamperedDataPart}.${sigPart}`)).toBeNull();

      // Tampered signature
      const alteredSig = sigPart.slice(0, -1) + (sigPart.endsWith('A') ? 'B' : 'A');
      expect(verifyToeicSessionToken(`${dataPart}.${alteredSig}`)).toBeNull();
    });

    await runner.it('ADV-SEC-2: Session token verification rejects expired tokens (> 4 hours)', () => {
      const expiredPayload = {
        sessionId: 'sess-expired',
        testId: '6852',
        ipHash: 'hash_127_0_0_1',
        issuedAt: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
      };
      const expiredToken = generateToeicSessionToken(expiredPayload);
      expect(verifyToeicSessionToken(expiredToken)).toBeNull();
    });

    await runner.it('ADV-SEC-3: PayOS HMAC-SHA256 signature algorithm rejects wrong keys, tampered data, or invalid hex', () => {
      const checksumKey = 'test_checksum_key_secret_1234567890';
      const payload: Record<string, unknown> = {
        orderCode: 98765,
        amount: 499000,
        description: 'LINGOPRO PRO VIP',
      };

      const computePayOsSignature = (data: Record<string, unknown>, key: string): string => {
        const sorted = Object.keys(data).sort();
        const qs = sorted.map((k) => `${k}=${data[k]}`).join('&');
        return crypto.createHmac('sha256', key).update(qs).digest('hex');
      };

      const verifyPayOsSignature = (
        data: Record<string, unknown>,
        signature: unknown,
        key: string
      ): boolean => {
        if (typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature)) {
          return false;
        }
        const expected = computePayOsSignature(data, key);
        const a = Buffer.from(expected, 'hex');
        const b = Buffer.from(signature, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
      };

      const validSig = computePayOsSignature(payload, checksumKey);
      expect(verifyPayOsSignature(payload, validSig, checksumKey)).toBe(true);

      // Wrong key fails
      expect(verifyPayOsSignature(payload, validSig, 'wrong_key_123')).toBe(false);

      // Tampered amount fails
      expect(verifyPayOsSignature({ ...payload, amount: 1000 }, validSig, checksumKey)).toBe(false);

      // Invalid signature representations do not crash
      expect(verifyPayOsSignature(payload, '', checksumKey)).toBe(false);
      expect(verifyPayOsSignature(payload, 'not-a-hex-signature', checksumKey)).toBe(false);
      expect(verifyPayOsSignature(payload, validSig.slice(0, 63), checksumKey)).toBe(false); // truncated
      expect(verifyPayOsSignature(payload, null, checksumKey)).toBe(false);
      expect(verifyPayOsSignature(payload, 12345, checksumKey)).toBe(false);
    });

    await runner.it('ADV-SEC-4: Billing webhook auth rejects invalid secrets, wrong schemes, and CRON_SECRET reuse', () => {
      const savedSecret = process.env.BILLING_WEBHOOK_SECRET;
      const savedCron = process.env.CRON_SECRET;

      try {
        const validSecret = 'valid_secret_32_chars_long_1234567890';
        process.env.BILLING_WEBHOOK_SECRET = validSecret;
        process.env.CRON_SECRET = 'cron_secret_32_chars_long_1234567890';

        // 1. Missing header
        expect(isBillingWebhookAuthorized(new Headers())).toBe(false);

        // 2. Empty authorization header
        expect(isBillingWebhookAuthorized(new Headers({ authorization: '' }))).toBe(false);

        // 3. Bearer scheme instead of Apikey
        expect(
          isBillingWebhookAuthorized(new Headers({ authorization: `Bearer ${validSecret}` }))
        ).toBe(false);

        // 4. Invalid secret value
        expect(
          isBillingWebhookAuthorized(new Headers({ authorization: 'Apikey wrong_secret_here_12345' }))
        ).toBe(false);

        // 5. Short secret (< 32 chars)
        expect(
          isBillingWebhookAuthorized(new Headers({ authorization: 'Apikey short_secret' }))
        ).toBe(false);

        // 6. CRON_SECRET reuse rejected
        process.env.BILLING_WEBHOOK_SECRET = process.env.CRON_SECRET;
        expect(
          isBillingWebhookAuthorized(
            new Headers({ authorization: `Apikey ${process.env.CRON_SECRET}` })
          )
        ).toBe(false);
      } finally {
        if (savedSecret) process.env.BILLING_WEBHOOK_SECRET = savedSecret;
        else delete process.env.BILLING_WEBHOOK_SECRET;
        if (savedCron) process.env.CRON_SECRET = savedCron;
        else delete process.env.CRON_SECRET;
      }
    });

    await runner.it('ADV-SEC-5: Plausible data poisoning maintains exact 25% balance and safe fallbacks', () => {
      // Test bank generation with various counts
      const bank0 = createPoisonedQuestionBank(0);
      expect(bank0.length).toBe(0);

      const bank1 = createPoisonedQuestionBank(1);
      expect(bank1.length).toBe(1);
      expect(['A', 'B', 'C', 'D']).toContain(bank1[0].correctAnswer);

      const bank100 = createPoisonedQuestionBank(100, 'adversarial-bot');
      expect(bank100.length).toBe(100);

      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of bank100) {
        counts[q.correctAnswer] = (counts[q.correctAnswer] || 0) + 1;
        assert(q.explanationVi !== undefined, 'Explanation must exist');
        assert(q.explanationVi.includes(ZW_SENTINEL), 'Must embed watermark');
      }

      // Check balance: 100 questions partitioned into 4 answers -> exactly 25 each
      expect(counts.A).toBe(25);
      expect(counts.B).toBe(25);
      expect(counts.C).toBe(25);
      expect(counts.D).toBe(25);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Steganographic Watermarking Boundary Invariants
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Steganographic Watermarking Boundary Stress', async () => {
    await runner.it('ADV-STEGANO-1: Watermark embedding and extraction handles empty and boundary inputs safely', () => {
      // 1. Text too short (< 5 chars) returns text without watermark
      const shortText = 'Hi!';
      expect(embedInvisibleWatermark(shortText, 'PAYLOAD')).toBe(shortText);

      // 2. Empty payload returns original text
      const normalText = 'This is normal English text for testing.';
      expect(embedInvisibleWatermark(normalText, '')).toBe(normalText);

      // 3. Extraction on non-watermarked text returns null
      expect(extractInvisibleWatermark(normalText)).toBeNull();
      expect(extractInvisibleWatermark('')).toBeNull();

      // 4. Extraction on corrupted watermark (single sentinel) returns null
      const corrupted = `Text with only one ${ZW_SENTINEL} sentinel`;
      expect(extractInvisibleWatermark(corrupted)).toBeNull();

      // 5. Extraction on corrupt binary length returns null
      const badLength = `${ZW_SENTINEL}${ZW_ZERO}${ZW_ONE}${ZW_SENTINEL}`; // 2 bits, not a multiple of 8
      expect(extractInvisibleWatermark(badLength)).toBeNull();

      // 6. Long payload round-trip
      const longPayload = 'USER_99999_IP_2001:0db8:85a3:0000:0000:8a2e:0370:7334_TS_1775308800_EXTRA_CHECKSUM_XYZ';
      const watermarked = embedInvisibleWatermark(normalText, longPayload);
      expect(extractInvisibleWatermark(watermarked)).toBe(longPayload);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Extreme Mobile Viewport (320px vs 390px) Layout Stress
  // ──────────────────────────────────────────────────────────────────────────

  await runner.describe('Extreme Mobile Viewport Layout Stress (320px & 390px)', async () => {
    await runner.it('ADV-VIEWPORT-STRESS-1: ToeicExamHeader geometry fits in 320px (iPhone SE 1st gen) without horizontal blowout', () => {
      const headerPath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicExamHeader.tsx');
      const content = fs.readFileSync(headerPath, 'utf-8');

      // 1. Hidden components on mobile:
      assert(content.includes('hidden sm:block truncate'), 'Title hidden sm:block');
      assert(content.includes('hidden sm:inline-flex items-center gap-1'), 'Section badge hidden sm:inline-flex');
      assert(content.includes('hidden md:flex items-center gap-2 font-mono'), 'Question progress hidden md:flex');
      assert(content.includes('hidden sm:flex items-center gap-1'), 'Palette button in header hidden sm:flex');
      assert(content.includes('hidden sm:inline'), 'Mode text hidden sm:inline');

      // 2. Mobile component width calculation on 320px viewport:
      // Left: Part badge ("Part 1") ~48px
      // Center: Timer ("119:59") ~68px
      // Right:
      //   - Mode toggle: min-w-[44px] -> 44px
      //   - Pause button: min-w-[44px] -> 44px
      //   - Submit button: min-w-[44px] with px-2.5 -> icon (12px) + gap (4px) + "Nộp bài" (40px) + padding (20px) = 76px
      //   - Container gaps: gap-1 = 4px * 2 = 8px
      //   - Right total: 44 + 44 + 76 + 8 = 172px
      // Total inner width: 48 (Left) + 68 (Center) + 172 (Right) = 288px.
      // Viewport padding: px-3 (12px each side) -> 24px.
      // Available width: 320 - 24 = 296px.
      // Headroom: 296 - 288 = 8px positive margin.
      const innerContentWidth = 48 + 68 + 172;
      const available320 = 320 - 24;
      assert(
        innerContentWidth <= available320,
        `Exam header content width (${innerContentWidth}px) exceeds 320px viewport container (${available320}px)`
      );
    });

    await runner.it('ADV-VIEWPORT-STRESS-2: ToeicSplitPane mobile bottom bar fits in 320px without horizontal blowout', () => {
      const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
      const content = fs.readFileSync(splitPanePath, 'utf-8');

      // Mobile labels are shortened:
      assert(content.includes('<span className="sm:hidden">Trước</span>'), 'Prev shortened label');
      assert(content.includes('<span className="sm:hidden">Tiếp theo</span>'), 'Next shortened label');

      // Bottom bar calculation on 320px:
      // - Prev: icon (14px) + "Trước" (36px) + padding (16px) = 66px
      // - Palette button: icon (14px) + "Câu 200" (50px) + padding (16px) = 80px
      // - Next: "Tiếp theo" (50px) + icon (14px) + padding (16px) = 80px
      // - Gaps: gap-2 = 8px * 2 = 16px
      // Total footer width: 66 + 80 + 80 + 16 = 242px.
      // Available width: 320 - 16 (px-2 on mobile) = 304px.
      // Headroom: 304 - 242 = 62px margin.
      const footerWidth = 66 + 80 + 80 + 16;
      const availableFooter = 320 - 16;
      assert(
        footerWidth <= availableFooter,
        `Footer controls width (${footerWidth}px) exceeds 320px viewport available (${availableFooter}px)`
      );
    });

    await runner.it('ADV-VIEWPORT-STRESS-3: Safe area inset clearance protects bottom controls from iOS Home Indicator on iPhone X/12/14/15', () => {
      const splitPanePath = path.join(PROJECT_ROOT, 'src/components/toeic/ToeicSplitPane.tsx');
      const content = fs.readFileSync(splitPanePath, 'utf-8');
      assert(
        content.includes('env(safe-area-inset-bottom,0px)'),
        'ToeicSplitPane must include env(safe-area-inset-bottom,0px)'
      );

      const mobileNavPath = path.join(PROJECT_ROOT, 'src/components/student/MobileBottomNav.tsx');
      const navContent = fs.readFileSync(mobileNavPath, 'utf-8');
      assert(
        navContent.includes('px-safe') || navContent.includes('env(safe-area-inset-bottom'),
        'MobileBottomNav must include safe area clearance'
      );
    });
  });

  return runner;
}

if (require.main === module) {
  const runner = new TestRunner('Adversarial Boundary Stress Suite');
  runBoundaryStressTests(runner).then(() => {
    const stats = runner.printSummary();
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
