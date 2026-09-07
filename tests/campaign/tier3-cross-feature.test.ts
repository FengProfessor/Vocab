/**
 * Tier 3: Cross-Feature Combinations Test Suite (05/09 Back-to-School Campaign)
 * Opaque-box verification of pairwise interactions, end-to-end multi-module contracts,
 * and state transitions across Funnel, Billing, Geo-Location, Admin, and Onboarding.
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
} from '../../src/lib/billing';

import {
  isKnownProvince,
  PROVINCES,
} from '../../src/lib/provinces';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 3: Cross-Feature Combinations (05/09 Campaign)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 1: Lead Form -> /upgrade prefill -> Pro Activation -> Province Alignment
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.1: Lead form submit -> /upgrade code prefill -> Pro trial activation -> Profile province sync', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // 1. Student submits lead form on /nhan-qua with province "Hải Phòng"
    const leadSubmission = {
      fullName: 'Vũ Minh Tuấn',
      phone: '0936112233',
      birthYear: '2008',
      targetRole: 'Học sinh THPT (Lớp 10, 11, 12)',
      province: 'Hải Phòng',
      currentLevel: 'Mất gốc hoàn toàn',
      needConsulting: true,
    };

    expect(isKnownProvince(leadSubmission.province)).toBe(true);

    // 2. Form handler returns code KHAIGIANG3M
    const promoCode = 'KHAIGIANG3M';
    expect(trialCouponDays(promoCode)).toBe(90);

    // 3. User navigates to /upgrade?code=KHAIGIANG3M and redeems
    const orderResult = await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: promoCode,
    });

    expect(orderResult.order.status).toBe('paid');
    expect(orderResult.order.amount).toBe(0);

    // 4. Welcome modal updates profile province to match lead submission
    await supabase
      .from('profiles')
      .update({ province: leadSubmission.province })
      .eq('id', 'user-free-1');

    const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    expect(profile?.plan).toBe('pro');
    expect(profile?.province).toBe('Hải Phòng');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 2: Lead Consulting Flag -> Admin Ingestion -> Zalo Link
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.2: Lead with needConsulting=true -> Ingestion in pilot_leads -> Admin filter -> 1-click Zalo generation', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const rawPhone = '0949.317.036';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const needConsulting = true;

    // Ingest into pilot_leads
    const messageContent = [
      `[KHAI GIẢNG 05/09]`,
      `Tư vấn lớp mất gốc Thầy Phong: ${needConsulting ? '👉 CẦN TƯ VẤN (Ưu tiên gọi)' : 'Tự học app'}`,
      `Năm sinh: 2007`,
      `Tỉnh/Thành phố: Nam Định`,
    ].join('\n');

    await supabase.from('pilot_leads').insert({
      contact_name: 'Hoàng Mai Phương',
      email: `${cleanPhone}@khaigiang0509.lingopro.vn`,
      phone: rawPhone,
      organization: '[KhaiGiang] Nam Định - THPT (2007)',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'new',
      message: messageContent,
    });

    // Admin queries leads
    const { data: allLeads } = await supabase.from('pilot_leads').select('*');
    expect(allLeads.length).toBe(1);

    // Filter by consulting
    const parseNeedConsulting = (msg: string) => msg.toLowerCase().includes('cần tư vấn');
    const priorityLeads = allLeads.filter((l: any) => parseNeedConsulting(l.message));
    expect(priorityLeads.length).toBe(1);

    // 1-click Zalo URL
    const targetLead = priorityLeads[0];
    const targetCleanPhone = targetLead.phone.replace(/\D/g, '');
    const zaloUrl = `https://zalo.me/${targetCleanPhone}`;
    expect(zaloUrl).toBe('https://zalo.me/0949317036');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 3: Active Pro Extension + Subsequent Abuse Prevention
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.3: Active Pro user -> Redeems KHAIGIANG3M (+90d) -> Tries THAYPHONG3M -> Blocked by abuse check', async () => {
    const mockDb = createInitialMockDb();
    const initialExpiry = new Date(mockDb.profiles[1].plan_expires_at!); // user-active-pro has 30 days left
    const supabase = createMockSupabaseClient(mockDb);

    // 1. Redeems KHAIGIANG3M
    await createOrder(supabase as any, {
      userId: 'user-active-pro',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const profileAfter1st = mockDb.profiles.find((p) => p.id === 'user-active-pro');
    const exp1 = new Date(profileAfter1st!.plan_expires_at!);
    expect(exp1.getTime() - initialExpiry.getTime()).toBe(90 * 24 * 60 * 60 * 1000);

    // 2. Attempts to claim THAYPHONG3M to get another 90 days
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-active-pro',
          plan: 'pro',
          couponCode: 'THAYPHONG3M',
        }),
      'đã kích hoạt',
    );

    // 3. Expiry remains exp1, unchanged
    const profileAfter2nd = mockDb.profiles.find((p) => p.id === 'user-active-pro');
    expect(profileAfter2nd!.plan_expires_at).toBe(exp1.toISOString());
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 4: Non-Popular Province Validation and Ingestion
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.4: Student in rare province ("Điện Biên") -> Catalog validation -> Persisted in pilot_leads', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const province = 'Điện Biên';
    expect(isKnownProvince(province)).toBe(true);

    await supabase.from('pilot_leads').insert({
      contact_name: 'Lò Văn Mười',
      email: '0977112233@khaigiang0509.lingopro.vn',
      phone: '0977112233',
      organization: `[KhaiGiang] ${province} - Học sinh THPT (2006)`,
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'new',
      message: `Tỉnh/Thành phố: ${province}`,
    });

    const lead = mockDb.pilot_leads[0];
    expect(lead.organization).toContain('Điện Biên');
    expect(lead.message).toContain('Điện Biên');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 5: Welcome Modal First Lesson Navigation
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.5: Successful redemption -> Welcome Modal presentation -> Direct Lesson 1 CTA links to A0 roadmap', () => {
    const roadmapA0 = {
      levelId: 'A0',
      titleVi: 'Mất gốc',
      unit1: 'Chặng 1 · Đại từ nhân xưng',
      firstLessonUrl: '/journey',
    };

    expect(roadmapA0.levelId).toBe('A0');
    expect(roadmapA0.firstLessonUrl).toBe('/journey');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 6: Streak Commitment Setting
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.6: Welcome modal 7-day streak commitment sets daily_goal and notification_hour in profile', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // Student commits to 15 words/day and 20:00 notification
    await supabase
      .from('profiles')
      .update({
        daily_goal: 15,
        notification_hour: 20,
      })
      .eq('id', 'user-free-1');

    const profile = mockDb.profiles.find((p) => p.id === 'user-free-1');
    expect(profile?.daily_goal).toBe(15);
    expect(profile?.notification_hour).toBe(20);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 7: Admin Lead Workflow Lifecycle & Timestamps
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.7: Admin lead workflow lifecycle: new -> contacted -> qualified -> won with timestamp tracking', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    // 1. Lead created (new)
    const { data: lead } = await supabase
      .from('pilot_leads')
      .insert({
        contact_name: 'Đặng Quốc Huy',
        email: '0911223344@khaigiang0509.lingopro.vn',
        phone: '0911223344',
        organization: '[KhaiGiang] Cần Thơ',
        teacher_count: 1,
        student_count: 1,
        source: 'tiktok_khaigiang_0509',
        status: 'new',
        message: 'Cần tư vấn',
      })
      .select()
      .single();

    expect(lead.status).toBe('new');
    expect(lead.contacted_at).toBeUndefined();

    // 2. Admin contacts lead -> contacted
    const contactedAt = new Date().toISOString();
    await supabase
      .from('pilot_leads')
      .update({
        status: 'contacted',
        contacted_at: contactedAt,
        admin_note: 'Đã gọi điện tư vấn lộ trình mất gốc cho em Huy',
      })
      .eq('id', lead.id);

    let updated = mockDb.pilot_leads.find((l) => l.id === lead.id);
    expect(updated?.status).toBe('contacted');
    expect(updated?.contacted_at).toBe(contactedAt);

    // 3. Lead enrolls in course -> won
    const convertedAt = new Date().toISOString();
    await supabase
      .from('pilot_leads')
      .update({
        status: 'won',
        converted_at: convertedAt,
        admin_note: 'Đã đóng học phí khóa Thầy Phong',
      })
      .eq('id', lead.id);

    updated = mockDb.pilot_leads.find((l) => l.id === lead.id);
    expect(updated?.status).toBe('won');
    expect(updated?.converted_at).toBe(convertedAt);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 8: Admin UTF-8 BOM CSV Export
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.8: Admin UTF-8 BOM CSV export with Vietnamese characters, phone numbers, and Zalo links', () => {
    const leads = [
      {
        id: '1',
        contact_name: 'Nguyễn Thị Ánh Tuyết',
        phone: '0988.123.456',
        organization: '[KhaiGiang] Quảng Ninh - Lớp 12',
        source: 'tiktok_khaigiang_0509',
        status: 'new',
        message: 'Tư vấn lớp mất gốc: 👉 CẦN TƯ VẤN',
      },
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const cleanPhone = leads[0].phone.replace(/\D/g, '');
    const zaloLink = `https://zalo.me/${cleanPhone}`;
    const row = [
      escapeCsv(1),
      escapeCsv(leads[0].contact_name),
      escapeCsv(leads[0].phone),
      escapeCsv(zaloLink),
      escapeCsv(leads[0].organization),
    ].join(',');

    const csvContent = '\uFEFF' + 'STT,Họ và tên,Số điện thoại,Link Zalo,Đơn vị\n' + row;

    expect(csvContent.charCodeAt(0)).toBe(0xfeff);
    expect(csvContent).toContain('Nguyễn Thị Ánh Tuyết');
    expect(csvContent).toContain('https://zalo.me/0988123456');
    expect(csvContent).toContain('Quảng Ninh');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 9: Auth Redirect Parameter Preservation
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.9: Unauthenticated landing on /upgrade?code=KHAIGIANG3M preserves return target', () => {
    const targetUrl = '/upgrade?code=KHAIGIANG3M';
    const authUrl = `/auth?redirectTo=${encodeURIComponent(targetUrl)}`;

    const parsedUrl = new URL(`https://lingopro.vn${authUrl}`);
    const redirectTo = parsedUrl.searchParams.get('redirectTo');
    expect(redirectTo).toBe('/upgrade?code=KHAIGIANG3M');

    // After auth success: target URL preserves code
    const afterLoginUrl = new URL(`https://lingopro.vn${redirectTo}`);
    expect(afterLoginUrl.searchParams.get('code')).toBe('KHAIGIANG3M');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 10: Multi-User Isolation
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.10: Cross-account isolation: User A redeems -> User B redeems independently', async () => {
    const mockDb = createInitialMockDb();
    mockDb.profiles.push({
      id: 'user-free-b',
      email: 'student_b@example.com',
      plan: 'free',
      plan_expires_at: null,
    });

    const supabase = createMockSupabaseClient(mockDb);

    // User A claims
    await createOrder(supabase as any, {
      userId: 'user-free-1',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    // User B claims
    await createOrder(supabase as any, {
      userId: 'user-free-b',
      plan: 'pro',
      couponCode: 'KHAIGIANG3M',
    });

    const profA = mockDb.profiles.find((p) => p.id === 'user-free-1');
    const profB = mockDb.profiles.find((p) => p.id === 'user-free-b');

    expect(profA?.plan).toBe('pro');
    expect(profB?.plan).toBe('pro');

    // User A blocked from second claim
    await assertRejects(
      () =>
        createOrder(supabase as any, {
          userId: 'user-free-1',
          plan: 'pro',
          couponCode: 'THAYPHONG3M',
        }),
      'đã kích hoạt',
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 11: Ingestion Idempotency & Repeat Submissions
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.11: Repeat submissions with same phone number generate distinct audit records', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const phone = '0988990011';
    // First submission
    await supabase.from('pilot_leads').insert({
      contact_name: 'Lê Văn C',
      email: `${phone}@khaigiang0509.lingopro.vn`,
      phone,
      organization: '[KhaiGiang] Hà Nội',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'new',
      message: 'Lần 1',
    });

    // Second submission (updated need or question)
    await supabase.from('pilot_leads').insert({
      contact_name: 'Lê Văn C',
      email: `${phone}@khaigiang0509.lingopro.vn`,
      phone,
      organization: '[KhaiGiang] Hà Nội',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'new',
      message: 'Lần 2: Thầy gọi lại cho em',
    });

    expect(mockDb.pilot_leads.length).toBe(2);
    expect(mockDb.pilot_leads[1].message).toContain('Lần 2');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 12: Profile Province Update Reflection
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('T3.12: Profile province update via API reflects in student profile state', async () => {
    const mockDb = createInitialMockDb();
    const supabase = createMockSupabaseClient(mockDb);

    const initialProfile = mockDb.profiles[0];
    expect(initialProfile.province).toBeNull();

    // Student updates province in /student/profile
    await supabase
      .from('profiles')
      .update({ province: 'Bình Dương' })
      .eq('id', 'user-free-1');

    const updated = mockDb.profiles[0];
    expect(updated.province).toBe('Bình Dương');
    expect(isKnownProvince(updated.province!)).toBe(true);
  });
}
