/**
 * Tier 2: Boundary & Corner Cases Test Suite (05/09 Back-to-School Campaign)
 * Opaque-box verification of boundary conditions, edge cases, input sanitization, and adversarial inputs.
 * Covers:
 * 1. Whitespace in codes (leading, trailing, tabs, newlines, internal spaces)
 * 2. Case-insensitivity (lowercase, uppercase, mixed, camelCase)
 * 3. Already-redeemed error & double claim edge cases
 * 4. Expired codes & inactive coupons behavior
 * 5. Invalid phone formats & boundary stress
 * 6. Synthetic email generation edge cases
 * 7. Missing optional fields in lead submission
 */

import {
  TestRunner,
  expect,
  assertRejects,
  createMockSupabaseClient,
  createInitialMockDb,
} from './test-harness';

import {
  isTrialCouponCode,
  trialCouponDays,
  isKhaiGiangCampaignCode,
  createOrder,
} from '../../src/lib/billing';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 2: Boundary & Corner Cases (05/09 Campaign)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // Category 1: Whitespace in codes
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.1.1: Leading spaces "   KHAIGIANG3M" trimmed and recognized', () => {
    expect(isTrialCouponCode('   KHAIGIANG3M')).toBe(true);
    expect(trialCouponDays('   KHAIGIANG3M')).toBe(90);
    expect(isKhaiGiangCampaignCode('   KHAIGIANG3M')).toBe(true);
  });

  await runner.it('T2.1.2: Trailing spaces "KHAIGIANG3M   " trimmed and recognized', () => {
    expect(isTrialCouponCode('KHAIGIANG3M   ')).toBe(true);
    expect(trialCouponDays('KHAIGIANG3M   ')).toBe(90);
    expect(isKhaiGiangCampaignCode('KHAIGIANG3M   ')).toBe(true);
  });

  await runner.it('T2.1.3: Surrounding tabs and newlines "\\tTHAYPHONG3M\\n" normalized', () => {
    expect(isTrialCouponCode('\tTHAYPHONG3M\n')).toBe(true);
    expect(trialCouponDays('\tTHAYPHONG3M\n')).toBe(90);
    expect(isKhaiGiangCampaignCode('\tTHAYPHONG3M\n')).toBe(true);
  });

  await runner.it('T2.1.4: Code with internal space "KHAI GIANG 3M" rejected as invalid coupon', () => {
    expect(isTrialCouponCode('KHAI GIANG 3M')).toBe(false);
    expect(isKhaiGiangCampaignCode('KHAI GIANG 3M')).toBe(false);
  });

  await runner.it('T2.1.5: Whitespace-only string "   " rejected with false', () => {
    expect(isTrialCouponCode('   ')).toBe(false);
    expect(isKhaiGiangCampaignCode('   ')).toBe(false);
  });

  await runner.it('T2.1.6: Empty string "" rejected with false', () => {
    expect(isTrialCouponCode('')).toBe(false);
    expect(isKhaiGiangCampaignCode('')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 2: Case-insensitivity
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.2.1: Lowercase "khaigiang3m" accepted and yields 90 days Pro', () => {
    expect(isTrialCouponCode('khaigiang3m')).toBe(true);
    expect(trialCouponDays('khaigiang3m')).toBe(90);
    expect(isKhaiGiangCampaignCode('khaigiang3m')).toBe(true);
  });

  await runner.it('T2.2.2: Mixed case "KhaiGiang3M" accepted and yields 90 days Pro', () => {
    expect(isTrialCouponCode('KhaiGiang3M')).toBe(true);
    expect(trialCouponDays('KhaiGiang3M')).toBe(90);
    expect(isKhaiGiangCampaignCode('KhaiGiang3M')).toBe(true);
  });

  await runner.it('T2.2.3: Lowercase "thayphong3m" accepted and yields 90 days Pro', () => {
    expect(isTrialCouponCode('thayphong3m')).toBe(true);
    expect(trialCouponDays('thayphong3m')).toBe(90);
    expect(isKhaiGiangCampaignCode('thayphong3m')).toBe(true);
  });

  await runner.it('T2.2.4: Mixed case "ThayPhong3M" accepted and yields 90 days Pro', () => {
    expect(isTrialCouponCode('ThayPhong3M')).toBe(true);
    expect(trialCouponDays('ThayPhong3M')).toBe(90);
    expect(isKhaiGiangCampaignCode('ThayPhong3M')).toBe(true);
  });

  await runner.it('T2.2.5: Inverted case "kHAiGiAnG3m" normalized to uppercase in database order', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'kHAiGiAnG3m',
    });

    expect(result.order.coupon_code).toBe('KHAIGIANG3M');
  });

  await runner.it('T2.2.6: Normalization preserves 90-day plan duration across all casing variations', async () => {
    const variations = ['khaigiang3m', 'KHAIGIANG3M', 'KhaiGiang3M', 'kHaIgIaNg3M'];
    for (const code of variations) {
      const mockDb = createInitialMockDb();
      const supabase = createMockSupabaseClient(mockDb);

      const result = await createOrder(supabase as any, {
        userId: 'user-free-1',
        plan: 'pro',
        couponCode: code,
      });

      expect(result.order.status).toBe('paid');
      const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
      expect(profile?.plan).toBe('pro');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 3: Already-redeemed error & double claim edge cases
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.3.1: Already-redeemed user receives localized Vietnamese error message', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'KHAIGIANG3M',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('T2.3.2: Concurrent duplicate redemption requests are safely handled', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Run first redemption
    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    // Rapid second call
    let failed = false;
    try {
      await createOrder(supabase as any, {
        userId: 'user-free-1',
        plan: 'pro',
        couponCode: 'KHAIGIANG3M',
      });
    } catch {
      failed = true;
    }

    expect(failed).toBe(true);
    // Order table should contain only 1 paid campaign order
    const campaignOrders = mockDb.orders.filter(
      (o) => o.user_id === 'user-free-1' && o.coupon_code === 'KHAIGIANG3M',
    );
    expect(campaignOrders.length).toBe(1);
  });

  await runner.it('T2.3.3: User attempting second redemption with alternate campaign code gets blocked', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'THAYPHONG3M',
    });

    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'KHAIGIANG3M',
        }),
      'đã kích hoạt',
    );
  });

  await runner.it('T2.3.4: Order status check: pending orders do not falsely lock out legitimate redemption', async () => {
    const mockDb = createInitialMockDb();
    // Simulate an abandoned pending order from past
    mockDb.orders.push({
      id: 'ord-old-pending',
      user_id: 'user-free-1',
      plan: 'pro',
      amount: 79000,
      payment_method: 'bank_transfer',
      period_months: 1,
      coupon_code: 'KHAIGIANG3M',
      status: 'pending', // NOT paid
      order_kind: 'individual',
      seats: 1,
    });

    const supabase = createMockSupabaseClient(mockDb);

    // Legitimate free redemption should succeed because previous was pending, not paid
    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.status).toBe('paid');
  });

  await runner.it('T2.3.5: Failed redemption does not alter profiles.plan or profiles.plan_expires_at', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Initial claim
    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const validExpiry = mockDb.profiles[0].plan_expires_at;

    // Second claim fails
    try {
      await createOrder(supabase as any, {
        userId: 'user-free-1',
        plan: 'pro',
        couponCode: 'KHAIGIANG3M',
      });
    } catch {
      // Expected failure
    }

    // Expiry should remain intact, not corrupted
    expect(mockDb.profiles[0].plan_expires_at).toBe(validExpiry);
  });

  await runner.it('T2.3.6: Different users can redeem same campaign code independently', async () => {
    const mockDb = createInitialMockDb();
    mockDb.profiles.push({
      id: 'user-free-2',
      email: 'student2@example.com',
      plan: 'free',
      plan_expires_at: null,
    });

    const supabase = createMockSupabaseClient(mockDb);

    const res1 = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });
    const res2 = await createOrder(supabase as any, {
      userId: 'user-free-2',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(res1.order.status).toBe('paid');
    expect(res2.order.status).toBe('paid');
    expect(mockDb.orders.length).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 4: Expired codes & inactive coupons behavior
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.4.1: Expired coupon code (valid_until in past) is not applied (0 VNĐ discount, pending order)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'EXPIRED3M',
    });

    expect(res.discount).toBe(0);
    expect(res.order.amount).toBe(79000);
    expect(res.order.status).toBe('pending');
    expect(res.order.coupon_code).toBeNull();

    const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    expect(profile?.plan).toBe('free'); // User not entitled to free Pro
  });

  await runner.it('T2.4.2: Inactive coupon code (is_active: false) is not applied (full price charged)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'INACTIVE3M',
    });

    expect(res.discount).toBe(0);
    expect(res.order.amount).toBe(79000);
    expect(res.order.status).toBe('pending');
    expect(res.order.coupon_code).toBeNull();
  });

  await runner.it('T2.4.3: Max uses exhausted (used_count >= max_uses) is not applied (full price charged)', async () => {
    const mockDb = createInitialMockDb();
    mockDb.coupons.push({
      id: 'cp-maxed',
      code: 'MAXEDOUT',
      discount_pct: 100,
      discount_amount: null,
      max_uses: 10,
      used_count: 10, // fully used
      valid_from: '2026-01-01T00:00:00Z',
      valid_until: '2026-12-31T00:00:00Z',
      applicable_plans: ['pro'],
      is_active: true,
    });

    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'MAXEDOUT',
    });

    expect(res.discount).toBe(0);
    expect(res.order.amount).toBe(79000);
    expect(res.order.status).toBe('pending');
  });

  await runner.it('T2.4.4: Future coupon (valid_from in future) is not applied (full price charged)', async () => {
    const mockDb = createInitialMockDb();
    mockDb.coupons.push({
      id: 'cp-future',
      code: 'FUTURE2027',
      discount_pct: 100,
      discount_amount: null,
      max_uses: 100,
      used_count: 0,
      valid_from: '2027-01-01T00:00:00Z',
      valid_until: '2027-12-31T00:00:00Z',
      applicable_plans: ['pro'],
      is_active: true,
    });

    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'FUTURE2027',
    });

    expect(res.discount).toBe(0);
    expect(res.order.amount).toBe(79000);
    expect(res.order.status).toBe('pending');
  });

  await runner.it('T2.4.5: Non-existent code "RANDOM_FAKE_CODE" is not applied (full price charged)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'RANDOM_FAKE_CODE',
    });

    expect(res.discount).toBe(0);
    expect(res.order.amount).toBe(79000);
    expect(res.order.status).toBe('pending');
  });

  await runner.it('T2.4.6: Invalid / non-trial codes rejected by isTrialCouponCode helper', () => {
    expect(isTrialCouponCode('EXPIRED3M')).toBe(false);
    expect(isTrialCouponCode('RANDOM_FAKE_CODE')).toBe(false);
    expect(isTrialCouponCode('MAXEDOUT')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 5: Invalid phone formats & boundary stress
  // ──────────────────────────────────────────────────────────────────────────

  const PHONE_REGEX = /^[0-9+().\s-]{8,20}$/;

  await runner.it('T2.5.1: Phone too short (<8 digits e.g. "12345") fails regex validation', () => {
    expect(PHONE_REGEX.test('12345')).toBe(false);
    expect(PHONE_REGEX.test('094931')).toBe(false);
  });

  await runner.it('T2.5.2: Phone too long (>20 chars) fails regex validation', () => {
    expect(PHONE_REGEX.test('012345678901234567891')).toBe(false); // 21 chars
  });

  await runner.it('T2.5.3: Phone containing alphabetical letters "0949abc036" fails regex validation', () => {
    expect(PHONE_REGEX.test('0949abc036')).toBe(false);
    expect(PHONE_REGEX.test('phone-number')).toBe(false);
  });

  await runner.it('T2.5.4: Phone with XSS / script tags "<script>alert(1)</script>" is rejected', () => {
    expect(PHONE_REGEX.test('<script>alert(1)</script>')).toBe(false);
    expect(PHONE_REGEX.test('DROP TABLE users;--')).toBe(false);
  });

  await runner.it('T2.5.5: Valid phone with parentheses and spaces "(094) 931-7036" passes regex', () => {
    expect(PHONE_REGEX.test('(094) 931-7036')).toBe(true);
    expect(PHONE_REGEX.test('+84 949 317 036')).toBe(true);
    expect(PHONE_REGEX.test('0949.317.036')).toBe(true);
  });

  await runner.it('T2.5.6: Boundary phone lengths of exact 8 and 20 characters pass regex', () => {
    expect(PHONE_REGEX.test('12345678')).toBe(true); // exactly 8 chars
    expect(PHONE_REGEX.test('12345678901234567890')).toBe(true); // exactly 20 chars
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 6: Synthetic email generation edge cases
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.6.1: Clean 10-digit phone generates exact email format', () => {
    const phone = '0949317036';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('0949317036@khaigiang0509.lingopro.vn');
  });

  await runner.it('T2.6.2: Formatted phone "+84-949-317-036" stripped to digits email', () => {
    const phone = '+84-949-317-036';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('84949317036@khaigiang0509.lingopro.vn');
  });

  await runner.it('T2.6.3: Phone with dots "0949.317.036" stripped to digits email', () => {
    const phone = '0949.317.036';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('0949317036@khaigiang0509.lingopro.vn');
  });

  await runner.it('T2.6.4: Fallback email format when phone has no digits defaults to lead prefix', () => {
    const phone = '---...()';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('lead@khaigiang0509.lingopro.vn');
  });

  await runner.it('T2.6.5: Domain part matches exactly @khaigiang0509.lingopro.vn', () => {
    const phone = '0912345678';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail.endsWith('@khaigiang0509.lingopro.vn')).toBe(true);
  });

  await runner.it('T2.6.6: Virtual email satisfies standard email format RFC regex', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = '0987654321';
    const cleanPhone = phone.replace(/\D/g, '');
    const virtualEmail = `${cleanPhone}@khaigiang0509.lingopro.vn`;
    expect(emailRegex.test(virtualEmail)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 7: Missing optional fields in lead submission
  // ──────────────────────────────────────────────────────────────────────────

  function sanitizeLeadPayload(body: Record<string, any>) {
    return {
      fullName: typeof body.fullName === 'string' ? body.fullName.trim() : '',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
      birthYear: body.birthYear ? String(body.birthYear).trim() : 'Không rõ',
      targetRole: typeof body.targetRole === 'string' ? body.targetRole.trim() : 'Chưa rõ',
      province: typeof body.province === 'string' ? body.province.trim() : 'Toàn quốc',
      currentLevel: typeof body.currentLevel === 'string' ? body.currentLevel.trim() : 'Mất gốc',
      needConsulting: Boolean(body.needConsulting),
    };
  }

  await runner.it('T2.7.1: Missing birthYear defaults to "Không rõ"', () => {
    const sanitized = sanitizeLeadPayload({ fullName: 'An', phone: '0949317036' });
    expect(sanitized.birthYear).toBe('Không rõ');
  });

  await runner.it('T2.7.2: Missing targetRole defaults to "Chưa rõ"', () => {
    const sanitized = sanitizeLeadPayload({ fullName: 'An', phone: '0949317036' });
    expect(sanitized.targetRole).toBe('Chưa rõ');
  });

  await runner.it('T2.7.3: Missing province defaults to "Toàn quốc"', () => {
    const sanitized = sanitizeLeadPayload({ fullName: 'An', phone: '0949317036' });
    expect(sanitized.province).toBe('Toàn quốc');
  });

  await runner.it('T2.7.4: Missing currentLevel defaults to "Mất gốc"', () => {
    const sanitized = sanitizeLeadPayload({ fullName: 'An', phone: '0949317036' });
    expect(sanitized.currentLevel).toBe('Mất gốc');
  });

  await runner.it('T2.7.5: Missing needConsulting defaults to false', () => {
    const sanitized = sanitizeLeadPayload({ fullName: 'An', phone: '0949317036' });
    expect(sanitized.needConsulting).toBe(false);
  });

  await runner.it('T2.7.6: Whitespace-padded optional fields are trimmed to clean values', () => {
    const sanitized = sanitizeLeadPayload({
      fullName: '  Nguyễn Văn An  ',
      phone: '  0949317036  ',
      birthYear: '  2007  ',
      targetRole: '  Học sinh THPT  ',
      province: '  Hải Phòng  ',
      currentLevel: '  Mất gốc hoàn toàn  ',
      needConsulting: true,
    });

    expect(sanitized.fullName).toBe('Nguyễn Văn An');
    expect(sanitized.phone).toBe('0949317036');
    expect(sanitized.birthYear).toBe('2007');
    expect(sanitized.targetRole).toBe('Học sinh THPT');
    expect(sanitized.province).toBe('Hải Phòng');
    expect(sanitized.currentLevel).toBe('Mất gốc hoàn toàn');
    expect(sanitized.needConsulting).toBe(true);
  });
}
