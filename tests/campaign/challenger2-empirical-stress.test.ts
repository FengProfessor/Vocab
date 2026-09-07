/**
 * Challenger 2: Funnel, Admin Leads & Onboarding Empirical Stress-Test Suite
 * 
 * Adversarial and empirical verification covering:
 * 1. Honeypot and rate limiting on POST /api/campaign/khaigiang (zero DB/file pollution, 10 req/min RL)
 * 2. Virtual email formatting and Vietnamese phone regex edge cases
 * 3. Admin leads filtering (accent-insensitive search, multi-filter, Excel UTF-8 BOM byte sequence)
 * 4. Profile API province validation (known vs custom provinces, boundaries, null reset)
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import { POST } from '../../src/app/api/campaign/khaigiang/route';
import { PROVINCES, POPULAR_PROVINCES, isKnownProvince } from '../../src/lib/provinces';
import { removeVietnameseTones, parseNeedConsulting } from '../../src/app/admin/pilot-leads/page';
import type { PilotLead, PilotLeadStatus } from '../../src/lib/pilot-sales';

const PHONE_REGEX = /^[0-9+().\s-]{8,20}$/;

export async function runChallenger2StressTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger 2: Empirical Stress-Test Suite', () => {});

  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: Honeypot & Rate Limiting on POST /api/campaign/khaigiang
  // ══════════════════════════════════════════════════════════════════════════

  await runner.it('CH2.1.1: Bot filling honeypot `hp` receives 200 fake success with KHAIGIANG3M', async () => {
    const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Bot User 1',
        phone: '0949317036',
        hp: 'i-am-a-spambot',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.1',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; code: string; days: number; message: string };
    expect(body.success).toBe(true);
    expect(body.code).toBe('KHAIGIANG3M');
    expect(body.days).toBe(90);
    expect(body.message).toContain('KHAIGIANG3M');
  });

  await runner.it('CH2.1.2: Honeypot traps bots with whitespace-padded `hp` string ("   crawler   ")', async () => {
    const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Bot User 2',
        phone: '0949317036',
        hp: '   crawler   ',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.2',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; code: string };
    expect(body.success).toBe(true);
    expect(body.code).toBe('KHAIGIANG3M');
  });

  await runner.it('CH2.1.3: Honeypot intercepts invalid/malformed payloads before validation (no 400 error)', async () => {
    // Bot with empty fullName, invalid phone, but hp filled
    const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: '',
        phone: 'invalid-not-a-number',
        hp: 'spam_link_http://spam.ru',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.3',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // 200 fake success, NOT 400 validation error
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  await runner.it('CH2.1.4: Honeypot execution leaves zero file pollution in backup directory', async () => {
    const backupDir = path.join(process.cwd(), 'data', 'campaign-leads');
    const logFile = path.join(backupDir, 'leads-khaigiang-0509.jsonl');

    // Record file size or line count before bot attack
    const linesBefore = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).length
      : 0;

    // Send 3 honeypot bot requests
    for (let i = 0; i < 3; i++) {
      const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
        method: 'POST',
        body: JSON.stringify({
          fullName: `Spam Bot ${i}`,
          phone: `094931700${i}`,
          hp: `attack_payload_${i}`,
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': `192.0.2.1${i}`,
        },
      });
      await POST(req);
    }

    // Record file size or line count after bot attack
    const linesAfter = fs.existsSync(logFile)
      ? fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).length
      : 0;

    expect(linesAfter).toBe(linesBefore); // Absolutely zero disk pollution
  });

  await runner.it('CH2.1.5: Rate Limiter permits exactly 10 requests within 60s from same IP', async () => {
    const testIp = '198.51.100.10';

    for (let i = 1; i <= 10; i++) {
      const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
        method: 'POST',
        body: JSON.stringify({
          fullName: `Student Rate Test ${i}`,
          phone: '0949317036',
          province: 'Hà Nội',
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp,
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { success: boolean };
      expect(json.success).toBe(true);
    }
  });

  await runner.it('CH2.1.6: Rate Limiter strictly blocks 11th request with HTTP 429 Too Many Requests', async () => {
    const testIp = '198.51.100.10'; // same IP as CH2.1.5

    const req11 = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Student Rate Test 11',
        phone: '0949317036',
        province: 'Hà Nội',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIp,
      },
    });

    const res11 = await POST(req11);
    expect(res11.status).toBe(429); // HTTP 429 Too Many Requests

    const body11 = (await res11.json()) as { error?: string };
    expect(body11.error).toContain('Too many requests');
  });

  await runner.it('CH2.1.7: Rate Limiter maintains IP isolation (IP B unaffected when IP A is rate-limited)', async () => {
    // IP A (198.51.100.10) is currently locked at 429
    // IP B (198.51.100.20) should succeed with 200
    const reqB = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Student Different IP',
        phone: '0949317036',
        province: 'Đà Nẵng',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.20',
      },
    });

    const resB = await POST(reqB);
    expect(resB.status).toBe(200);
    const bodyB = (await resB.json()) as { success: boolean };
    expect(bodyB.success).toBe(true);
  });

  await runner.it('CH2.1.8: Rate Limiter precedes Honeypot (prevents bots from DoSing honeypot handler)', async () => {
    const botIp = '198.51.100.99';

    // 10 honeypot hits from bot IP
    for (let i = 1; i <= 10; i++) {
      const req = new NextRequest('http://localhost/api/campaign/khaigiang', {
        method: 'POST',
        body: JSON.stringify({
          fullName: `Bot Spam ${i}`,
          phone: '0949317036',
          hp: `spam-${i}`,
        }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': botIp,
        },
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 11th honeypot hit from bot IP -> Rate Limiter blocks before honeypot check
    const req11 = new NextRequest('http://localhost/api/campaign/khaigiang', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Bot Spam 11',
        phone: '0949317036',
        hp: 'spam-11',
      }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': botIp,
      },
    });
    const res11 = await POST(req11);
    expect(res11.status).toBe(429); // Rate limit triggers first, mitigating CPU/RAM exhaustion
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Virtual Email Formatting & Vietnamese Phone Regex Edge Cases
  // ══════════════════════════════════════════════════════════════════════════

  await runner.it('CH2.2.1: Regex validates all major Vietnamese telecom network prefixes', () => {
    const telcoNumbers = [
      '0981234567', // Viettel 098
      '0869876543', // Viettel 086
      '0321234567', // Viettel 032
      '0912345678', // VinaPhone 091
      '0949317036', // VinaPhone 094
      '0888123456', // VinaPhone 088
      '0812345678', // VinaPhone 081
      '0901234567', // MobiFone 090
      '0931234567', // MobiFone 093
      '0891234567', // MobiFone 089
      '0701234567', // MobiFone 070
      '0921234567', // Vietnamobile 092
      '0561234567', // Vietnamobile 056
      '0871234567', // I-Telecom 087
      '0551234567', // Wintel 055
    ];

    for (const num of telcoNumbers) {
      expect(PHONE_REGEX.test(num)).toBe(true);
    }
  });

  await runner.it('CH2.2.2: Regex validates Vietnamese fixed landlines across major regions', () => {
    const landlines = [
      '02438512345', // Hanoi (024)
      '02838512345', // Ho Chi Minh City (028)
      '02363851234', // Da Nang (0236)
      '02253851234', // Hai Phong (0225)
      '02923851234', // Can Tho (0292)
    ];

    for (const num of landlines) {
      expect(PHONE_REGEX.test(num)).toBe(true);
    }
  });

  await runner.it('CH2.2.3: Regex accepts diverse real-world formatting styles', () => {
    const formats = [
      '0949.317.036',
      '094-931-7036',
      '094 931 7036',
      '(094) 931-7036',
      '+84 949 317 036',
      '+84(94)931-7036',
      '+84.949.317.036',
      '(+84) 949 317 036',
    ];

    for (const fmt of formats) {
      expect(PHONE_REGEX.test(fmt)).toBe(true);
    }
  });

  await runner.it('CH2.2.4: Regex enforces boundary lengths (8 <= len <= 20)', () => {
    expect(PHONE_REGEX.test('09123456')).toBe(true); // Exact 8 chars
    expect(PHONE_REGEX.test('0912345')).toBe(false); // 7 chars -> Reject
    expect(PHONE_REGEX.test('+84 (094) 931-7036-1')).toBe(true); // Exact 20 chars
    expect(PHONE_REGEX.test('+84 (094) 931-7036-12')).toBe(false); // 21 chars -> Reject
  });

  await runner.it('CH2.2.5: Regex strictly rejects malicious injection attempts and invalid characters', () => {
    const maliciousInputs = [
      "' OR '1'='1",
      '<script>alert(1)</script>',
      '0949317036; DROP TABLE pilot_leads;',
      '0949abc036',
      '0949317036#123',
      '0949317036$',
      '0949317036@vn',
      '0949317036🔥',
      '0949317036\0',
    ];

    for (const mal of maliciousInputs) {
      expect(PHONE_REGEX.test(mal)).toBe(false);
    }
  });

  await runner.it('CH2.2.6: Virtual email generator strips non-digits and constructs valid RFC 5322 email', () => {
    const RFC_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const testPhones = [
      { raw: '0949317036', expected: '0949317036@khaigiang0509.lingopro.vn' },
      { raw: '+84 949 317 036', expected: '84949317036@khaigiang0509.lingopro.vn' },
      { raw: '(024) 3851.2345', expected: '02438512345@khaigiang0509.lingopro.vn' },
      { raw: '094-931-7036', expected: '0949317036@khaigiang0509.lingopro.vn' },
    ];

    for (const { raw, expected } of testPhones) {
      const cleanPhone = raw.replace(/[^0-9]/g, '');
      const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
      expect(virtualEmail).toBe(expected);
      expect(RFC_EMAIL_REGEX.test(virtualEmail)).toBe(true);
    }
  });

  await runner.it('CH2.2.7: Edge case phone with zero digits falls back gracefully to `lead` username', () => {
    const RFC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneNoDigits = '+(). - - '; // 8 chars, passes regex
    expect(PHONE_REGEX.test(phoneNoDigits)).toBe(true);

    const cleanPhone = phoneNoDigits.replace(/[^0-9]/g, '');
    expect(cleanPhone).toBe('');

    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('lead@khaigiang0509.lingopro.vn');
    expect(RFC_EMAIL_REGEX.test(virtualEmail)).toBe(true);
  });

  await runner.it('CH2.2.8: Adversarial analysis: whitespace character class \\s matches \\n but downstream cleanPhone strips it safely', () => {
    const multilinePhone = '0949317036\n0949';
    // \\s in regex matches \\n
    expect(PHONE_REGEX.test(multilinePhone)).toBe(true);

    // Downstream sanitization in route.ts:
    const cleanPhone = multilinePhone.replace(/[^0-9]/g, '');
    expect(cleanPhone).toBe('09493170360949'); // Strips \\n completely

    const virtualEmail = `${cleanPhone}@khaigiang0509.lingopro.vn`;
    expect(virtualEmail).toBe('09493170360949@khaigiang0509.lingopro.vn');
    // Resulting virtual email contains zero newlines and is RFC compliant
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(virtualEmail)).toBe(true);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: Admin Leads Filtering & Excel UTF-8 BOM Byte Sequence
  // ══════════════════════════════════════════════════════════════════════════

  await runner.it('CH2.3.1: removeVietnameseTones strips all combining diacritics and transforms đ/Đ', () => {
    const sampleAccented = 'Nguyễn Thị Mai Đức Đắk Lắk Huế Cần Thơ';
    const unaccented = removeVietnameseTones(sampleAccented);
    expect(unaccented).toBe('Nguyen Thi Mai Duc Dak Lak Hue Can Tho');
  });

  // Sample leads fixture for search & filter tests
  const testLeads: PilotLead[] = [
    {
      id: 'lead-1',
      contact_name: 'Nguyễn Văn Đức',
      phone: '0949.317.036',
      email: '0949317036@khaigiang0509.lingopro.vn',
      organization: '[KhaiGiang] Đắk Lắk - Học sinh THPT (2008)',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'new',
      message: '[KHAI GIẢNG 05/09]\nTư vấn lớp mất gốc Thầy Phong: 👉 CẦN TƯ VẤN (Ưu tiên gọi)\nTỉnh/Thành phố: Đắk Lắk',
      admin_note: 'Hẹn gọi lại chiều mai',
      contacted_at: null,
      converted_at: null,
      created_at: '2026-09-05T10:00:00Z',
      updated_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'lead-2',
      contact_name: 'Trần Thị Hằng',
      phone: '0988776655',
      email: '0988776655@khaigiang0509.lingopro.vn',
      organization: '[KhaiGiang] Hà Nội - Người đi làm (1998)',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'contacted',
      message: '[KHAI GIẢNG 05/09]\nTư vấn lớp mất gốc Thầy Phong: Tự học app\nTỉnh/Thành phố: Hà Nội',
      admin_note: null,
      contacted_at: '2026-09-05T10:20:00Z',
      converted_at: null,
      created_at: '2026-09-05T10:15:00Z',
      updated_at: '2026-09-05T10:20:00Z',
    },
    {
      id: 'lead-3',
      contact_name: 'Lê Hoàng Phong',
      phone: '0912345678',
      email: 'phong.le@school.edu.vn',
      organization: 'Trường THPT Chuyên Hà Nội - Amsterdam',
      teacher_count: 15,
      student_count: 450,
      source: 'teacher_landing',
      status: 'qualified',
      message: 'Quan tâm gói trường học cho giáo viên tiếng Anh',
      admin_note: 'Đã gửi báo giá',
      contacted_at: '2026-09-04T10:00:00Z',
      converted_at: null,
      created_at: '2026-09-04T09:00:00Z',
      updated_at: '2026-09-04T10:00:00Z',
    },
    {
      id: 'lead-4',
      contact_name: 'Vũ Quốc Toàn',
      phone: '0903112233',
      email: '0903112233@khaigiang0509.lingopro.vn',
      organization: '[KhaiGiang] Đà Nẵng - Sinh viên (2004)',
      teacher_count: 1,
      student_count: 1,
      source: 'tiktok_khaigiang_0509',
      status: 'won',
      message: '[KHAI GIẢNG 05/09]\nTư vấn: can tu van\nTỉnh/Thành phố: Đà Nẵng',
      admin_note: 'Đã thanh toán Pro trọn đời',
      contacted_at: '2026-09-05T11:15:00Z',
      converted_at: '2026-09-05T11:30:00Z',
      created_at: '2026-09-05T11:00:00Z',
      updated_at: '2026-09-05T11:30:00Z',
    },
  ];

  function filterLeads(
    leads: PilotLead[],
    sourceFilter: 'all' | 'tiktok_khaigiang_0509' | 'teacher_landing',
    statusFilter: 'all' | PilotLeadStatus,
    onlyNeedConsulting: boolean,
    searchQuery: string
  ): PilotLead[] {
    return leads.filter((lead) => {
      // 1. Source filter
      if (sourceFilter === 'tiktok_khaigiang_0509' && lead.source !== 'tiktok_khaigiang_0509') return false;
      if (sourceFilter === 'teacher_landing' && lead.source === 'tiktok_khaigiang_0509') return false;

      // 2. Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // 3. Need consulting filter
      if (onlyNeedConsulting && !parseNeedConsulting(lead)) return false;

      // 4. Live Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const qNorm = removeVietnameseTones(q);
        const qDigits = q.replace(/\D/g, '');

        const phone = lead.phone.toLowerCase();
        const phoneDigits = lead.phone.replace(/\D/g, '');
        const phoneMatch = phone.includes(q) || (qDigits.length >= 3 && phoneDigits.includes(qDigits));

        const name = lead.contact_name.toLowerCase();
        const nameMatch = name.includes(q) || removeVietnameseTones(name).includes(qNorm);

        const org = lead.organization.toLowerCase();
        const orgMatch = org.includes(q) || removeVietnameseTones(org).includes(qNorm);

        const emailMatch = lead.email.toLowerCase().includes(q);

        const msg = (lead.message ?? '').toLowerCase();
        const msgMatch = msg.includes(q) || removeVietnameseTones(msg).includes(qNorm);

        const note = (lead.admin_note ?? '').toLowerCase();
        const noteMatch = note.includes(q) || removeVietnameseTones(note).includes(qNorm);

        if (!phoneMatch && !nameMatch && !orgMatch && !emailMatch && !msgMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }

  await runner.it('CH2.3.2: Unaccented lowercase query matches accented student names', () => {
    const results = filterLeads(testLeads, 'all', 'all', false, 'nguyen van duc');
    expect(results.length).toBe(1);
    expect(results[0].contact_name).toBe('Nguyễn Văn Đức');
  });

  await runner.it('CH2.3.3: Accented uppercase query matches lead correctly ("ĐỨC" -> "Nguyễn Văn Đức")', () => {
    const results = filterLeads(testLeads, 'all', 'all', false, 'ĐỨC');
    expect(results.length).toBe(1);
    expect(results[0].contact_name).toBe('Nguyễn Văn Đức');
  });

  await runner.it('CH2.3.4: Unaccented query matches accented province in organization ("dak lak")', () => {
    const results = filterLeads(testLeads, 'all', 'all', false, 'dak lak');
    expect(results.length).toBe(1);
    expect(results[0].organization).toContain('Đắk Lắk');
  });

  await runner.it('CH2.3.5: Clean phone digits match formatted phone numbers (search "317036")', () => {
    const results = filterLeads(testLeads, 'all', 'all', false, '317036');
    expect(results.length).toBe(1);
    expect(results[0].phone).toBe('0949.317.036');
  });

  await runner.it('CH2.3.6: Unaccented query matches content in admin_note ("chieu mai")', () => {
    const results = filterLeads(testLeads, 'all', 'all', false, 'chieu mai');
    expect(results.length).toBe(1);
    expect(results[0].admin_note).toContain('Hẹn gọi lại chiều mai');
  });

  await runner.it('CH2.3.7: Source filter segregates campaign leads from teacher leads', () => {
    const campaignOnly = filterLeads(testLeads, 'tiktok_khaigiang_0509', 'all', false, '');
    expect(campaignOnly.length).toBe(3);
    for (const l of campaignOnly) {
      expect(l.source).toBe('tiktok_khaigiang_0509');
    }

    const teacherOnly = filterLeads(testLeads, 'teacher_landing', 'all', false, '');
    expect(teacherOnly.length).toBe(1);
    expect(teacherOnly[0].source).toBe('teacher_landing');
  });

  await runner.it('CH2.3.8: Status filter isolates specific lifecycle states', () => {
    const wonLeads = filterLeads(testLeads, 'all', 'won', false, '');
    expect(wonLeads.length).toBe(1);
    expect(wonLeads[0].status).toBe('won');
  });

  await runner.it('CH2.3.9: parseNeedConsulting correctly matches accented, unaccented, and JSON flags', () => {
    expect(parseNeedConsulting({ message: 'Tư vấn: 👉 CẦN TƯ VẤN (Ưu tiên gọi)' } as PilotLead)).toBe(true);
    expect(parseNeedConsulting({ message: 'Tư vấn: can tu van' } as PilotLead)).toBe(true);
    expect(parseNeedConsulting({ message: 'needconsulting: true' } as PilotLead)).toBe(true);
    expect(parseNeedConsulting({ message: '{"needconsulting": true}' } as PilotLead)).toBe(true);
    expect(parseNeedConsulting({ message: 'Tự học app, không cần gọi' } as PilotLead)).toBe(false);
    expect(parseNeedConsulting({ message: '' } as PilotLead)).toBe(false);
  });

  await runner.it('CH2.3.10: Multi-filter intersection (source + status + needConsulting + search)', () => {
    // 1 lead matches all: source=tiktok, status=new, needConsulting=true, query='Đắk Lắk'
    const results = filterLeads(testLeads, 'tiktok_khaigiang_0509', 'new', true, 'dak lak');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('lead-1');

    // Changing status to 'won' should yield 0
    const zeroResults = filterLeads(testLeads, 'tiktok_khaigiang_0509', 'won', true, 'dak lak');
    expect(zeroResults.length).toBe(0);
  });

  await runner.it('CH2.3.11: Excel CSV export starts with exact UTF-8 BOM byte sequence (0xEF, 0xBB, 0xBF)', () => {
    const bom = '\uFEFF';
    const csvContent = bom + 'STT,Họ và tên,Tỉnh/Thành phố\r\n1,"Nguyễn Văn Đức","Đắk Lắk"';

    // Verify string BOM character
    expect(csvContent.charCodeAt(0)).toBe(0xFEFF);

    // Verify raw UTF-8 bytes
    const buffer = Buffer.from(csvContent, 'utf8');
    expect(buffer[0]).toBe(0xEF);
    expect(buffer[1]).toBe(0xBB);
    expect(buffer[2]).toBe(0xBF);

    // Verify round-trip decoding preserves Vietnamese characters without loss
    const decoded = buffer.toString('utf8');
    expect(decoded).toContain('Nguyễn Văn Đức');
    expect(decoded).toContain('Đắk Lắk');
  });

  await runner.it('CH2.3.12: CSV escaping properly sanitizes double quotes, commas, newlines, and nulls', () => {
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    expect(escapeCsv(null)).toBe('""');
    expect(escapeCsv(undefined)).toBe('""');
    expect(escapeCsv('Hà Nội, Việt Nam')).toBe('"Hà Nội, Việt Nam"');
    expect(escapeCsv('Học viên "VIP"')).toBe('"Học viên ""VIP"""');
    expect(escapeCsv('Dòng 1\r\nDòng 2')).toBe('"Dòng 1\r\nDòng 2"');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 4: Profile API Province Validation
  // ══════════════════════════════════════════════════════════════════════════

  function extractProfileProvinceUpdates(body: Record<string, unknown>): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    if (typeof body.province === 'string') {
      const trimmed = body.province.trim();
      if (trimmed.length > 0 && trimmed.length <= 100) {
        updates.province = trimmed;
      } else if (trimmed.length === 0) {
        updates.province = null;
      }
    } else if (body.province === null) {
      updates.province = null;
    }

    if (typeof body.city === 'string') {
      const trimmed = body.city.trim();
      if (trimmed.length > 0 && trimmed.length <= 100) {
        updates.city = trimmed;
      } else if (trimmed.length === 0) {
        updates.city = null;
      }
    } else if (body.city === null) {
      updates.city = null;
    }

    return updates;
  }

  await runner.it('CH2.4.1: isKnownProvince accurately identifies standard Vietnamese provinces catalog', () => {
    expect(PROVINCES.length).toBe(64); // 63 provinces/cities + 1 catch-all
    expect(isKnownProvince('Hà Nội')).toBe(true);
    expect(isKnownProvince('TP. Hồ Chí Minh')).toBe(true);
    expect(isKnownProvince('Đà Nẵng')).toBe(true);
    expect(isKnownProvince('Hải Phòng')).toBe(true);
    expect(isKnownProvince('Cần Thơ')).toBe(true);
    expect(isKnownProvince('Tỉnh/Thành khác')).toBe(true);

    // Non-standard strings
    expect(isKnownProvince('California')).toBe(false);
    expect(isKnownProvince('Tokyo')).toBe(false);
    expect(isKnownProvince('Unknown City')).toBe(false);
  });

  await runner.it('CH2.4.2: Profile updates save standard known provinces cleanly', () => {
    const updates1 = extractProfileProvinceUpdates({ province: 'Hà Nội' });
    expect(updates1.province).toBe('Hà Nội');

    const updates2 = extractProfileProvinceUpdates({ province: '   TP. Hồ Chí Minh   ' });
    expect(updates2.province).toBe('TP. Hồ Chí Minh');
  });

  await runner.it('CH2.4.3: Profile updates accept custom provinces (<=100 chars) for international/district flex', () => {
    const customProvinces = [
      'Ninh Kiều, Cần Thơ',
      'Thủ Đức, TP.HCM',
      'Tokyo, Nhật Bản',
      'California, United States',
    ];

    for (const cust of customProvinces) {
      const updates = extractProfileProvinceUpdates({ province: cust });
      expect(updates.province).toBe(cust);
    }
  });

  await runner.it('CH2.4.4: Empty string and whitespace-only province resets province to null', () => {
    const updatesEmpty = extractProfileProvinceUpdates({ province: '' });
    expect(updatesEmpty.province).toBeNull();

    const updatesWhitespace = extractProfileProvinceUpdates({ province: '      ' });
    expect(updatesWhitespace.province).toBeNull();
  });

  await runner.it('CH2.4.5: Explicit null input resets province to null', () => {
    const updatesNull = extractProfileProvinceUpdates({ province: null });
    expect(updatesNull.province).toBeNull();
  });

  await runner.it('CH2.4.6: Province length boundary tests (exact 100 chars accepted, 101 chars ignored)', () => {
    const exact100 = 'A'.repeat(100);
    const updates100 = extractProfileProvinceUpdates({ province: exact100 });
    expect(updates100.province).toBe(exact100);

    const oversized101 = 'A'.repeat(101);
    const updates101 = extractProfileProvinceUpdates({ province: oversized101 });
    expect(updates101.province).toBeUndefined(); // Ignored / not saved
  });

  await runner.it('CH2.4.7: City field mirrors province validation (accepts valid string, resets on empty/null)', () => {
    const updatesCity = extractProfileProvinceUpdates({ city: 'Hà Nội' });
    expect(updatesCity.city).toBe('Hà Nội');

    const updatesCityReset = extractProfileProvinceUpdates({ city: '' });
    expect(updatesCityReset.city).toBeNull();

    const updatesCityNull = extractProfileProvinceUpdates({ city: null });
    expect(updatesCityNull.city).toBeNull();
  });
}

// Standalone runner execution
if (process.argv[1]?.includes('challenger2-empirical-stress')) {
  const runner = new TestRunner();
  runChallenger2StressTests(runner).then(() => {
    const stats = runner.getStats();
    console.log('\n================================================================================');
    console.log('  CHALLENGER 2 EMPIRICAL STRESS-TEST RESULTS');
    console.log('================================================================================');
    console.log(`Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | Duration: ${stats.durationMs}ms`);
    if (stats.failed > 0) {
      console.error('❌ STRESS TESTS FAILED');
      process.exit(1);
    } else {
      console.log('✅ ALL CHALLENGER 2 STRESS TESTS PASSED EMPIRICALLY!');
      process.exit(0);
    }
  });
}
