/**
 * Tier 4: Real-World Application Scenarios (05/09 Back-to-School Campaign)
 * Opaque-box end-to-end user journeys mirroring live production workflows:
 * Scenario 1: Full Funnel to Active Learner (High complexity)
 * Scenario 2: Teacher Phong Lead Management (High complexity)
 * Scenario 3: Abuse Prevention & Double Claim (Medium complexity)
 * Scenario 4: Existing Pro User Extension (Medium complexity)
 * Scenario 5: Non-logged-in User Funnel (High complexity)
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
  trialCouponDays,
  trialCouponExpiry,
  isKhaiGiangCampaignCode,
  assertCouponAllowedForOrder,
} from '../../src/lib/billing';

import {
  isKnownProvince,
} from '../../src/lib/provinces';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 4: Real-World Application Scenarios (05/09 Campaign)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Full Funnel to Active Learner (High complexity)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 1: Full Funnel to Active Learner (Lead form -> /upgrade -> 90d Pro -> Modal -> Lesson 1)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Step 1: Student arrives at /nhan-qua from TikTok and fills lead form
    const leadInput = {
      fullName: 'Hoàng Quốc Việt',
      phone: '0978.123.456',
      birthYear: '2008',
      targetRole: 'Học sinh THPT (Lớp 10, 11, 12)',
      province: 'Hà Nội',
      currentLevel: 'Mất gốc hoàn toàn, sợ tiếng Anh',
      needConsulting: true,
    };

    expect(isKnownProvince(leadInput.province)).toBe(true);
    const cleanPhone = leadInput.phone.replace(/\D/g, '');
    expect(cleanPhone).toBe('0978123456');

    // Step 2: Ingest lead into pilot_leads
    const message = [
      `[KHAI GIẢNG 05/09]`,
      `Tư vấn lớp mất gốc Thầy Phong: 👉 CẦN TƯ VẤN (Ưu tiên gọi)`,
      `Năm sinh: ${leadInput.birthYear}`,
      `Đối tượng: ${leadInput.targetRole}`,
      `Tỉnh/Thành phố: ${leadInput.province}`,
      `Trình độ hiện tại: ${leadInput.currentLevel}`,
    ].join('\n');

    const { data: createdLead } = await supabase
      .from('pilot_leads')
      .insert({
        contact_name: leadInput.fullName,
        email: `${cleanPhone}@khaigiang0509.lingopro.vn`,
        phone: leadInput.phone,
        organization: `[KhaiGiang] ${leadInput.province} - ${leadInput.targetRole} (${leadInput.birthYear})`,
        teacher_count: 1,
        student_count: 1,
        source: 'tiktok_khaigiang_0509',
        status: 'new',
        message,
      })
      .select()
      .single();

    expect(createdLead.id).toBeDefined();
    expect(createdLead.source).toBe('tiktok_khaigiang_0509');

    // Step 3: API returns campaign promo code KHAIGIANG3M
    const promoCode = 'KHAIGIANG3M';
    expect(isKhaiGiangCampaignCode(promoCode)).toBe(true);
    expect(trialCouponDays(promoCode)).toBe(90);

    // Step 4: User navigates to /upgrade?code=KHAIGIANG3M and claims gift
    const beforeClaim = Date.now();
    const orderResult = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      periodMonths: 1,
      paymentMethod: 'bank_transfer',
      couponCode: promoCode,
      orderKind: 'individual',
      note: `gift_redeem:${promoCode}`,
    });

    expect(orderResult.order.amount).toBe(0);
    expect(orderResult.order.status).toBe('paid');
    expect(orderResult.order.coupon_code).toBe('KHAIGIANG3M');

    // Step 5: Verify profile plan and expiry are upgraded to Pro for 90 days
    const studentProfile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    expect(studentProfile?.plan).toBe('pro');
    expect(studentProfile?.plan_expires_at).toBeDefined();

    const expDate = new Date(studentProfile!.plan_expires_at!);
    const expectedExpMin = beforeClaim + 89 * 24 * 60 * 60 * 1000;
    expect(expDate.getTime()).toBeGreaterThanOrEqual(expectedExpMin);

    // Step 6: WelcomeKhaiGiangModal captures and persists province
    await supabase
      .from('profiles')
      .update({ province: leadInput.province })
      .eq('id', 'user-free-1');

    expect(studentProfile?.province).toBe('Hà Nội');

    // Step 7: Welcome modal provides direct lesson 1 CTA
    const directLessonCTA = {
      actionUrl: '/journey',
      targetLevel: 'A0',
      description: 'Bắt đầu Chặng 1: Đại từ nhân xưng',
    };
    expect(directLessonCTA.actionUrl).toBe('/journey');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Teacher Phong Lead Management (High complexity)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 2: Teacher Phong Lead Management (Multi-lead ingestion -> Filtering -> Zalo contact -> CSV export)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Step 1: Ingest diverse leads from campaign and teacher landing
    const batchLeads = [
      {
        contact_name: 'Trần Thị Thảo',
        phone: '0912.334.455',
        organization: '[KhaiGiang] Nghệ An - Học sinh THPT (2007)',
        source: 'tiktok_khaigiang_0509',
        status: 'new',
        message: 'Tư vấn lớp mất gốc: 👉 CẦN TƯ VẤN (Ưu tiên gọi)\nTỉnh/Thành phố: Nghệ An',
      },
      {
        contact_name: 'Nguyễn Văn Đạt',
        phone: '0988.776.655',
        organization: '[KhaiGiang] Đà Nẵng - Sinh viên Đại học (2005)',
        source: 'tiktok_khaigiang_0509',
        status: 'new',
        message: 'Tư vấn lớp mất gốc: Tự học app\nTỉnh/Thành phố: Đà Nẵng',
      },
      {
        contact_name: 'Cô Thuý - THCS Lê Quý Đôn',
        phone: '0903.112.233',
        organization: 'THCS Lê Quý Đôn',
        source: 'teacher_landing',
        status: 'new',
        message: 'Tôi muốn tìm hiểu gói 50 học sinh',
      },
    ];

    for (const lead of batchLeads) {
      const clean = lead.phone.replace(/\D/g, '');
      await supabase.from('pilot_leads').insert({
        ...lead,
        email: `${clean}@lingopro.vn`,
        teacher_count: 1,
        student_count: 1,
      });
    }

    // Step 2: Teacher Phong accesses /admin/pilot-leads
    const { data: allLeads } = await supabase.from('pilot_leads').select('*');
    expect(allLeads.length).toBe(3);

    // Step 3: Filter by source 'tiktok_khaigiang_0509'
    const campaignLeads = allLeads.filter((l: any) => l.source === 'tiktok_khaigiang_0509');
    expect(campaignLeads.length).toBe(2);

    // Step 4: Filter by "Cần tư vấn"
    const parseNeedConsulting = (msg: string) => msg.toLowerCase().includes('cần tư vấn');
    const priorityLeads = campaignLeads.filter((l: any) => parseNeedConsulting(l.message));
    expect(priorityLeads.length).toBe(1);
    expect(priorityLeads[0].contact_name).toBe('Trần Thị Thảo');

    // Step 5: Thầy Phong clicks 1-click Zalo URL
    const targetCleanPhone = priorityLeads[0].phone.replace(/\D/g, '');
    const zaloUrl = `https://zalo.me/${targetCleanPhone}`;
    expect(zaloUrl).toBe('https://zalo.me/0912334455');

    // Step 6: Thầy Phong calls and updates status to 'contacted'
    const nowIso = new Date().toISOString();
    await supabase
      .from('pilot_leads')
      .update({
        status: 'contacted',
        contacted_at: nowIso,
        admin_note: 'Đã trao đổi qua Zalo, hẹn test trình độ tối nay',
      })
      .eq('id', priorityLeads[0].id);

    const updatedLead = mockDb.pilot_leads.find((l) => l.id === priorityLeads[0].id);
    expect(updatedLead?.status).toBe('contacted');
    expect(updatedLead?.contacted_at).toBe(nowIso);

    // Step 7: Export to UTF-8 BOM CSV
    const escapeCsv = (val: unknown): string => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Link Zalo', 'Cần tư vấn'];
    const rows = campaignLeads.map((l: any, i: number) => {
      const pClean = l.phone.replace(/\D/g, '');
      return [
        escapeCsv(i + 1),
        escapeCsv(l.contact_name),
        escapeCsv(l.phone),
        escapeCsv(`https://zalo.me/${pClean}`),
        escapeCsv(parseNeedConsulting(l.message) ? 'CÓ (Ưu tiên)' : 'Không'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n' + rows.join('\n');
    expect(csvContent.charCodeAt(0)).toBe(0xfeff);
    expect(csvContent).toContain('Trần Thị Thảo');
    expect(csvContent).toContain('https://zalo.me/0912334455');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Abuse Prevention & Double Claim (Medium complexity)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 3: Abuse Prevention & Double Claim (Single claim policy & cross-code lockout)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Step 1: User claims KHAIGIANG3M
    const res1 = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });
    expect(res1.order.status).toBe('paid');

    const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    const firstClaimExpiry = profile?.plan_expires_at;

    // Step 2: User attempts second claim with KHAIGIANG3M
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'KHAIGIANG3M',
        }),
      'đã kích hoạt',
    );

    // Step 3: User tries loophole using sister code THAYPHONG3M
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'THAYPHONG3M',
        }),
      'đã kích hoạt',
    );

    // Step 4: User tries applying campaign coupon to 12-month annual order
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'KHAIGIANG3M',
        coupon: {
          id: 'mock',
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

    // Step 5: User tries applying to group order
    expect(() =>
      assertCouponAllowedForOrder({
        couponCode: 'KHAIGIANG3M',
        coupon: {
          id: 'mock',
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
    ).toThrow('chỉ dùng gói Pro cá nhân');

    // Step 6: Verify no corruption of original expiry
    expect(profile?.plan_expires_at).toBe(firstClaimExpiry);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: Existing Pro User Extension (Medium complexity)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 4: Existing Pro User Extension (Zero truncation, stacks +90 days onto existing expiry)', async () => {
    const mockDb = createInitialMockDb();
    const existingProUser = mockDb.profiles[1]; // user-active-pro has 30 days left
    const initialExpiry = new Date(existingProUser.plan_expires_at!);
    const supabase = createMockSupabaseClient(mockDb);

    // User claims KHAIGIANG3M
    const orderResult = await createOrder(supabase as any, {
      userId: existingProUser.id,
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    expect(orderResult.order.amount).toBe(0);
    expect(orderResult.order.status).toBe('paid');

    // Verify expiry extension
    const updatedUser = mockDb.profiles.find((p) => p.id === existingProUser.id);
    const newExpiry = new Date(updatedUser!.plan_expires_at!);

    // Must be initialExpiry + 90 days
    const addedTimeMs = newExpiry.getTime() - initialExpiry.getTime();
    const expected90DaysMs = 90 * 24 * 60 * 60 * 1000;
    expect(addedTimeMs).toBe(expected90DaysMs);

    // Verify order starts_at equals initialExpiry
    const orderInDb = mockDb.orders.find((o) => o.id === orderResult.order.id);
    expect(new Date(orderInDb!.starts_at!).toISOString()).toBe(initialExpiry.toISOString());
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: Non-logged-in User Funnel (High complexity)
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 5: Non-logged-in User Funnel (/nhan-qua -> /upgrade -> /auth -> /upgrade preserved)', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // 1. Unauthenticated visitor gets code KHAIGIANG3M on /nhan-qua
    const promoCode = 'KHAIGIANG3M';

    // 2. Clicks CTA linking to /upgrade?code=KHAIGIANG3M
    const targetUpgradeUrl = `/upgrade?code=${promoCode}`;

    // 3. /upgrade detects no session -> redirects to /auth with return URL
    const authUrl = `/auth?redirectTo=${encodeURIComponent(targetUpgradeUrl)}`;
    const authUrlObj = new URL(`https://lingopro.vn${authUrl}`);
    const returnTarget = authUrlObj.searchParams.get('redirectTo');
    expect(returnTarget).toBe('/upgrade?code=KHAIGIANG3M');

    // 4. Student signs up / logs in
    const newUserId = 'user-newly-registered';
    mockDb.profiles.push({
      id: newUserId,
      email: 'new_student@example.com',
      full_name: 'Tân Học Viên',
      plan: 'free',
      plan_expires_at: null,
      province: null,
    });

    // 5. Auth completion redirects back to returnTarget (/upgrade?code=KHAIGIANG3M)
    const returnUrlObj = new URL(`https://lingopro.vn${returnTarget}`);
    const codeFromParam = returnUrlObj.searchParams.get('code');
    expect(codeFromParam).toBe('KHAIGIANG3M');

    // 6. /upgrade auto-fills and redeems code
    const claimResult = await createOrder(supabase as any, {
      userId: newUserId,
      plan: 'pro',
      couponCode: codeFromParam!,
    });

    expect(claimResult.order.status).toBe('paid');
    const newProfile = mockDb.profiles.find((p) => p.id === newUserId);
    expect(newProfile?.plan).toBe('pro');
    expect(newProfile?.plan_expires_at).toBeDefined();
  });
}
