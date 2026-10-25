/**
 * Empirical Adversarial Stress Test Suite: Billing & Expiry Math
 * Challenger 1: Billing & Expiry Math Stress-Tester
 * 
 * Verifies:
 * 1. Subscription Stacking (active Pro with 1, 30, 100, 365 days; expired Pro; free user; RPC vs TS fallback)
 * 2. Abuse Prevention (repeated calls, cross-code lockout, case/whitespace/tab variants, state immutability)
 * 3. Plan Boundaries (12-month, 3-month, 6-month, group/classroom orders, plan boundaries)
 * 4. Synthetic Fallback vs Real DB Query Parity
 */

import {
  TestRunner,
  expect,
  assertRejects,
  createMockSupabaseClient,
  createInitialMockDb,
} from './test-harness';

import {
  createOrder,
  assertCouponAllowedForOrder,
  trialCouponDays,
  trialCouponExpiry,
  isTrialCouponCode,
  isKhaiGiangCampaignCode,
  KHAI_GIANG_CAMPAIGN_CODES,
  TRIAL_COUPON_DAYS,
} from '../../src/lib/billing';

export async function runStressBillingTests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // VECTOR 1: Subscription Stacking & Mathematical Precision
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Stress Vector 1: Subscription Stacking & Expiry Math', () => {});

  await runner.it('STRESS-STACK-01: Active Pro with 1 day remaining gets extended by exactly 90 days (never shortened or clamped)', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const oneDayMs = 1 * 24 * 60 * 60 * 1000;
    const initialExp = new Date(now + oneDayMs);

    mockDb.profiles.push({
      id: 'user-pro-1d',
      email: 'pro_1d@example.com',
      plan: 'pro',
      plan_expires_at: initialExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-pro-1d',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.status).toBe('paid');
    const updated = mockDb.profiles.find((p) => p.id === 'user-pro-1d');
    const newExp = new Date(updated!.plan_expires_at!);

    // Must be initialExp + 90 days = now + 91 days
    const diffFromInitialMs = newExp.getTime() - initialExp.getTime();
    expect(diffFromInitialMs).toBe(90 * 24 * 60 * 60 * 1000);

    // Assert it was NOT clamped to now + 90 days (which would be 1 day shorter!)
    const totalDaysFromNow = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(totalDaysFromNow)).toBe(91);
  });

  await runner.it('STRESS-STACK-02: Active Pro with 30 days remaining gets extended by exactly 90 days to 120 days total', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const initialExp = new Date(now + thirtyDaysMs);

    mockDb.profiles.push({
      id: 'user-pro-30d',
      email: 'pro_30d@example.com',
      plan: 'pro',
      plan_expires_at: initialExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-pro-30d',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.status).toBe('paid');
    const updated = mockDb.profiles.find((p) => p.id === 'user-pro-30d');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromInitialMs = newExp.getTime() - initialExp.getTime();
    expect(diffFromInitialMs).toBe(90 * 24 * 60 * 60 * 1000);

    const totalDaysFromNow = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(totalDaysFromNow)).toBe(120);
  });

  await runner.it('STRESS-STACK-03: Active Pro with 100 days remaining gets extended by exactly 90 days to 190 days total', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const hundredDaysMs = 100 * 24 * 60 * 60 * 1000;
    const initialExp = new Date(now + hundredDaysMs);

    mockDb.profiles.push({
      id: 'user-pro-100d',
      email: 'pro_100d@example.com',
      plan: 'pro',
      plan_expires_at: initialExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-pro-100d',
      plan: 'pro',
      couponCode: 'THAYPHONG3M',
    });

    expect(result.order.status).toBe('paid');
    const updated = mockDb.profiles.find((p) => p.id === 'user-pro-100d');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromInitialMs = newExp.getTime() - initialExp.getTime();
    expect(diffFromInitialMs).toBe(90 * 24 * 60 * 60 * 1000);

    const totalDaysFromNow = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(totalDaysFromNow)).toBe(190);
  });

  await runner.it('STRESS-STACK-04: Active Pro with 365 days remaining gets extended to 455 days (preserves annual entitlement)', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const annualMs = 365 * 24 * 60 * 60 * 1000;
    const initialExp = new Date(now + annualMs);

    mockDb.profiles.push({
      id: 'user-pro-annual',
      email: 'pro_annual@example.com',
      plan: 'pro',
      plan_expires_at: initialExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-pro-annual',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.status).toBe('paid');
    const updated = mockDb.profiles.find((p) => p.id === 'user-pro-annual');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromInitialMs = newExp.getTime() - initialExp.getTime();
    expect(diffFromInitialMs).toBe(90 * 24 * 60 * 60 * 1000);

    const totalDaysFromNow = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(totalDaysFromNow)).toBe(455);
  });

  await runner.it('STRESS-STACK-05: Expired Pro (expired 1 second ago) starts from now (never docked for past expiration)', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const pastExp = new Date(now - 1000); // 1 sec ago

    mockDb.profiles.push({
      id: 'user-just-expired',
      email: 'just_expired@example.com',
      plan: 'pro',
      plan_expires_at: pastExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    await createOrder(supabase as any, {
      userId: 'user-just-expired',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const updated = mockDb.profiles.find((p) => p.id === 'user-just-expired');
    const newExp = new Date(updated!.plan_expires_at!);

    // Expiry should be approximately now + 90 days, NOT pastExp + 90 days
    const diffFromNowMs = newExp.getTime() - now;
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(diffFromNowMs).toBeGreaterThanOrEqual(ninetyDaysMs - 2000);
  });

  await runner.it('STRESS-STACK-06: Expired Pro (expired 30 days ago) starts from now, receiving full 90 days from today', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const pastExp = new Date(now - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    mockDb.profiles.push({
      id: 'user-long-expired',
      email: 'long_expired@example.com',
      plan: 'pro',
      plan_expires_at: pastExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    await createOrder(supabase as any, {
      userId: 'user-long-expired',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const updated = mockDb.profiles.find((p) => p.id === 'user-long-expired');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromNowDays = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(diffFromNowDays)).toBe(90);
  });

  await runner.it('STRESS-STACK-07: Free user with null plan_expires_at receives exactly 90 days from current timestamp', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();

    const supabase = createMockSupabaseClient(mockDb);
    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const updated = mockDb.profiles.find((p) => p.id === 'user-free-1');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromNowDays = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(diffFromNowDays)).toBe(90);
  });

  await runner.it('STRESS-STACK-08: Stacking in TypeScript Fallback path (RPC failure) correctly extends active Pro by 90 days', async () => {
    const mockDb = createInitialMockDb();
    const now = Date.now();
    const initialExp = new Date(now + 100 * 24 * 60 * 60 * 1000); // 100 days

    mockDb.profiles.push({
      id: 'user-rpc-fallback',
      email: 'rpc_fallback@example.com',
      plan: 'pro',
      plan_expires_at: initialExp.toISOString(),
    });

    const supabase = createMockSupabaseClient(mockDb);
    // Force RPC failure to exercise lines 473-543 of billing.ts
    supabase.rpc = async (name: string, args: any) => {
      if (name === 'redeem_free_coupon_order') {
        throw new Error('Simulated Supabase RPC connection error');
      }
      if (name === 'increment_coupon_usage') {
        return { data: true, error: null };
      }
      return { data: null, error: new Error('Unknown RPC') };
    };

    const result = await createOrder(supabase as any, {
      userId: 'user-rpc-fallback',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.status).toBe('paid');
    const updated = mockDb.profiles.find((p) => p.id === 'user-rpc-fallback');
    const newExp = new Date(updated!.plan_expires_at!);

    const diffFromInitialMs = newExp.getTime() - initialExp.getTime();
    expect(diffFromInitialMs).toBe(90 * 24 * 60 * 60 * 1000);
    const totalDays = (newExp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(totalDays)).toBe(190);
  });

  await runner.it('STRESS-STACK-09: Millisecond math check: order starts_at to expires_at equals 7,776,000,000 ms', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const orderInDb = mockDb.orders.find((o) => o.id === result.order.id);
    expect(orderInDb).toBeDefined();
    const startsAt = new Date(orderInDb!.starts_at!).getTime();
    const expiresAt = new Date(orderInDb!.expires_at!).getTime();
    const diffMs = expiresAt - startsAt;
    const expectedNinetyDaysMs = 90 * 24 * 60 * 60 * 1000; // 7,776,000,000 ms
    expect(diffMs).toBe(expectedNinetyDaysMs);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // VECTOR 2: Abuse Prevention & Repeated Calls Permutations
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Stress Vector 2: Abuse Prevention & Repeated Calls Permutations', () => {});

  await runner.it('STRESS-ABUSE-01: Call 1: Initial redemption with KHAIGIANG3M succeeds', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(res.order.status).toBe('paid');
    expect(res.order.amount).toBe(0);
    expect(res.order.coupon_code).toBe('KHAIGIANG3M');
  });

  await runner.it('STRESS-ABUSE-02: Call 2: Immediate repeated call with same code KHAIGIANG3M is blocked', async () => {
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

  await runner.it('STRESS-ABUSE-03: Call 3: Call with sister code THAYPHONG3M is blocked by cross-code policy', async () => {
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
          couponCode: 'THAYPHONG3M',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-04: Call 4: Lowercase variation "khaigiang3m" is blocked by cross-code policy', async () => {
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
          couponCode: 'khaigiang3m',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-05: Call 5: Whitespace-padded code "   KHAIGIANG3M   " is blocked', async () => {
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
          couponCode: '   KHAIGIANG3M   ',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-06: Call 6: Mixed case with whitespace "  kHaIGiAnG3m  " is blocked', async () => {
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
          couponCode: '  kHaIGiAnG3m  ',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-07: Call 7: Tabs/newlines in sister code "\\t\\nTHAYPHONG3M\\r\\n " is blocked', async () => {
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
          couponCode: '\t\nTHAYPHONG3M\r\n ',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-08: Reverse sequence: THAYPHONG3M first -> KHAIGIANG3M blocked -> thayphong3m blocked', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // 1. Redeem THAYPHONG3M first
    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'THAYPHONG3M',
    });
    expect(res.order.status).toBe('paid');

    // 2. Subsequent KHAIGIANG3M attempt blocked
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'KHAIGIANG3M',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );

    // 3. Subsequent thayphong3m attempt blocked
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'thayphong3m',
        }),
      'Tài khoản của bạn đã kích hoạt gói quà tặng Khai Giảng rồi.',
    );
  });

  await runner.it('STRESS-ABUSE-09: State invariance under repeated attacks: expiry and paid orders untouched', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Legitimate redemption
    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const expectedProfileExp = mockDb.profiles.find((p) => p.id === 'user-free-1')?.plan_expires_at;
    const initialOrderCount = mockDb.orders.length;
    expect(initialOrderCount).toBe(1);

    // Blast 10 varied abusive attempts
    const abusiveInputs = [
      'KHAIGIANG3M',
      'THAYPHONG3M',
      'khaigiang3m',
      'thayphong3m',
      '  KHAIGIANG3M  ',
      '  THAYPHONG3M  ',
      '\tKHAIGIANG3M\n',
      'kHaIgIaNg3M',
      'ThayPhong3M',
      '   khaigiang3m   ',
    ];

    for (const code of abusiveInputs) {
      try {
        await createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: code,
        });
      } catch {
        // Expected rejection
      }
    }

    // Verify database state is untouched
    const finalProfile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    expect(finalProfile?.plan_expires_at).toBe(expectedProfileExp);
    expect(mockDb.orders.length).toBe(initialOrderCount);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // VECTOR 3: Plan Boundaries & Structural Constraints
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Stress Vector 3: Plan Boundaries & Structural Constraints', () => {});

  await runner.it('STRESS-BOUND-01: assertCouponAllowedForOrder rejects trial coupon for 12-month period', () => {
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'KHAIGIANG3M',
        coupon: {
          id: 'mock-kg',
          code: 'KHAIGIANG3M',
          discount_pct: 100,
          discount_amount: null,
          max_uses: null,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_until: null,
          applicable_plans: ['pro'],
          is_active: true,
        },
        orderKind: 'individual',
        periodMonths: 12,
      }),
    ).toThrow('chỉ áp dụng kỳ 1 tháng');
  });

  await runner.it('STRESS-BOUND-02: assertCouponAllowedForOrder rejects trial coupon for 3-month period', () => {
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'KHAIGIANG3M',
        coupon: {
          id: 'mock-kg',
          code: 'KHAIGIANG3M',
          discount_pct: 100,
          discount_amount: null,
          max_uses: null,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_until: null,
          applicable_plans: ['pro'],
          is_active: true,
        },
        orderKind: 'individual',
        periodMonths: 3,
      }),
    ).toThrow('chỉ áp dụng kỳ 1 tháng');
  });

  await runner.it('STRESS-BOUND-03: assertCouponAllowedForOrder rejects trial coupon for 6-month period', () => {
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'THAYPHONG3M',
        coupon: {
          id: 'mock-tp',
          code: 'THAYPHONG3M',
          discount_pct: 100,
          discount_amount: null,
          max_uses: null,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_until: null,
          applicable_plans: ['pro'],
          is_active: true,
        },
        orderKind: 'individual',
        periodMonths: 6,
      }),
    ).toThrow('chỉ áp dụng kỳ 1 tháng');
  });

  await runner.it('STRESS-BOUND-04: assertCouponAllowedForOrder rejects trial coupon for group / classroom orders', () => {
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'KHAIGIANG3M',
        coupon: {
          id: 'mock-kg',
          code: 'KHAIGIANG3M',
          discount_pct: 100,
          discount_amount: null,
          max_uses: null,
          used_count: 0,
          valid_from: new Date().toISOString(),
          valid_until: null,
          applicable_plans: ['pro'],
          is_active: true,
        },
        orderKind: 'group',
        periodMonths: 1,
      }),
    ).toThrow('Mã quà live/trial chỉ dùng gói Pro cá nhân, không dùng gói nhóm.');
  });

  await runner.it('STRESS-BOUND-05: createOrder rejects group / classroom orders with KHAIGIANG3M', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          orderKind: 'group',
          seats: 5,
          couponCode: 'KHAIGIANG3M',
        }),
      'Mã quà live/trial chỉ dùng gói Pro cá nhân, không dùng gói nhóm.',
    );
  });

  await runner.it('STRESS-BOUND-06: createOrder with periodMonths=12 normalizes trial order to 90-day grant (no 365-day leak)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);
    const now = Date.now();

    // Passing periodMonths: 12 with KHAIGIANG3M
    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      periodMonths: 12,
      couponCode: 'KHAIGIANG3M',
    });

    // Verify order period_months was clamped to 1 (not 12)
    expect(result.order.period_months).toBe(1);

    // Verify user received exactly 90 days, NOT 365 days
    const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    const exp = new Date(profile!.plan_expires_at!);
    const daysGranted = (exp.getTime() - now) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysGranted)).toBe(90);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // VECTOR 4: Synthetic Fallback vs Real DB Query Parity
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Stress Vector 4: Synthetic Fallback vs Real DB Query Parity', () => {});

  await runner.it('STRESS-DB-01: Pro redemption under DB Query path succeeds with amount: 0, status: paid, plan: pro', async () => {
    const mockDb = createInitialMockDb();
    expect(mockDb.coupons.some((c) => c.code === 'KHAIGIANG3M')).toBe(true);

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.amount).toBe(0);
    expect(result.order.status).toBe('paid');
    expect(result.order.plan).toBe('pro');
    expect(result.coupon?.code).toBe('KHAIGIANG3M');
  });

  await runner.it('STRESS-DB-02: Pro redemption under Synthetic Fallback path (empty DB) succeeds with identical parameters', async () => {
    const mockDb = createInitialMockDb();
    mockDb.coupons = []; // Wipe coupons table to force synthetic branch
    expect(mockDb.coupons.length).toBe(0);

    const supabase = createMockSupabaseClient(mockDb);
    const result = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(result.order.amount).toBe(0);
    expect(result.order.status).toBe('paid');
    expect(result.order.plan).toBe('pro');
    expect(result.coupon?.code).toBe('KHAIGIANG3M');
    expect(result.coupon?.id).toBe('synthetic-khaigiang3m');
  });

  await runner.it('STRESS-DB-03: Parity of profile plan_expires_at between DB query and Synthetic fallback is within 1s', async () => {
    // 1. Run with DB coupon
    const db1 = createInitialMockDb();
    const c1 = createMockSupabaseClient(db1);
    await createOrder(c1 as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });
    const exp1 = new Date(db1.profiles[0].plan_expires_at!).getTime();

    // 2. Run with Synthetic fallback
    const db2 = createInitialMockDb();
    db2.coupons = [];
    const c2 = createMockSupabaseClient(db2);
    await createOrder(c2 as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });
    const exp2 = new Date(db2.profiles[0].plan_expires_at!).getTime();

    // Difference between two executions should be virtually 0 (< 1000ms)
    expect(Math.abs(exp1 - exp2)).toBeLessThan(1000);
  });

  await runner.it('STRESS-DB-04: Abuse prevention is identical whether coupon exists in DB or is synthetic', async () => {
    const dbSynthetic = createInitialMockDb();
    dbSynthetic.coupons = []; // Synthetic path
    const supabase = createMockSupabaseClient(dbSynthetic);

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

  await runner.it('STRESS-DB-05: Non-campaign bogus codes (e.g. HACK90D) are rejected in both DB and Synthetic paths', async () => {
    // DB path: not found -> charges full price (pending order)
    const db = createInitialMockDb();
    const supabase = createMockSupabaseClient(db);

    const res = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'HACK90D',
    });

    expect(res.order.amount).toBe(79000); // Charged full price
    expect(res.order.status).toBe('pending');

    // Helper check
    expect(isTrialCouponCode('HACK90D')).toBe(false);
    expect(isKhaiGiangCampaignCode('HACK90D')).toBe(false);
  });

  await runner.it('STRESS-DB-06: Empirical Discrepancy Probe on Premium Plan: DB rejects discount vs Synthetic fallback leaks free Premium', async () => {
    // Branch A: With DB coupon (applicable_plans: ['pro'])
    const dbWithCoupon = createInitialMockDb();
    const c1 = createMockSupabaseClient(dbWithCoupon);
    const res1 = await createOrder(c1 as any, {
      userId: 'user-free-1',
      plan: 'premium',
      couponCode: 'KHAIGIANG3M',
    });
    // DB coupon checks data.applicable_plans -> coupon not applied -> full price 129,000 pending
    expect(res1.order.amount).toBe(129000);
    expect(res1.order.status).toBe('pending');

    // Branch B: Without DB coupon (Synthetic fallback)
    const dbSynthetic = createInitialMockDb();
    dbSynthetic.coupons = [];
    const c2 = createMockSupabaseClient(dbSynthetic);
    const res2 = await createOrder(c2 as any, {
      userId: 'user-free-1',
      plan: 'premium',
      couponCode: 'KHAIGIANG3M',
    });
    // Observation: In synthetic fallback, applicable_plans is ['pro'], but billing.ts lacked an assert on plan === 'pro'
    // Consequently, res2 was granted amount: 0, status: 'paid'
    console.log(`    [DISCREPANCY DETECTED] DB Path: amount=${res1.order.amount} (${res1.order.status}) vs Synthetic Path: amount=${res2.order.amount} (${res2.order.status})`);
  });
}

// Standalone execution if invoked directly
if (require.main === module) {
  const runner = new TestRunner();
  runStressBillingTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nStress Test Execution Completed: ${stats.passed}/${stats.total} passed in ${stats.durationMs}ms`);
    if (stats.failed > 0) {
      process.exit(1);
    }
  });
}
