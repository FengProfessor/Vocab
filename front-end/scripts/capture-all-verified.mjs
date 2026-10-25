import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const outDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4\\demo-shots';
const brainDir = 'C:\\Users\\tapho\\.gemini\\antigravity\\brain\\2bd7c645-eb5e-46af-98e7-12f72bd32ad4';
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const catalogPayload = JSON.parse(
  fs.readFileSync(path.resolve('src/data/vocab/catalog-tree-exported.json'), 'utf8')
);

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromeExe,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850, deviceScaleFactor: 1.5 },
  });

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const url = req.url();

      if (url.includes('/api/auth/session')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            session: {
              user: {
                id: '11111111-1111-1111-1111-111111111111',
                email: 'taphong2002@gmail.com',
                user_metadata: {
                  full_name: 'Tạ Phong (LingoPro Admin)',
                  role: 'admin',
                  lingopro_onboarding_completed: true,
                },
              },
            },
          }),
        });
      }

      if (url.includes('/api/import/packages') && req.method() === 'GET') {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(catalogPayload),
        });
      }

      if (url.includes('/api/admin/stats')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            totalWords: 19175,
            totalQuizzes: 452,
            users: [
              { id: '1', email: 'taphong2002@gmail.com', full_name: 'Tạ Phong', role: 'admin', created_at: '2026-01-15T08:00:00Z', wordCount: 1420, wordsToday: 25, quizCount: 45, avgAccuracy: 0.92, lastActive: new Date().toISOString() },
              { id: '2', email: 'minh.nguyen@edu.vn', full_name: 'Nguyễn Văn Minh', role: 'student', created_at: '2026-02-10T09:30:00Z', wordCount: 850, wordsToday: 15, quizCount: 22, avgAccuracy: 0.88, lastActive: '2026-10-04T07:15:00Z' },
              { id: '3', email: 'thao.tran@company.com', full_name: 'Trần Thị Thu Thảo', role: 'student', created_at: '2026-03-01T14:15:00Z', wordCount: 620, wordsToday: 0, quizCount: 18, avgAccuracy: 0.75, lastActive: '2026-10-03T16:00:00Z' },
              { id: '4', email: 'duc.hoang@school.edu.vn', full_name: 'Hoàng Minh Đức', role: 'student', created_at: '2026-03-12T10:00:00Z', wordCount: 310, wordsToday: 30, quizCount: 12, avgAccuracy: 0.84, lastActive: '2026-10-04T06:30:00Z' }
            ],
          }),
        });
      }

      if (url.includes('/api/admin/crm')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            kpis: {
              totalUsers: 1248,
              newThisWeek: 85,
              payingUsers: 142,
              activeUsers: 680,
              learners: 540,
              churnedUsers: 68,
              totalRevenue: 48500000,
              activeGroups: 24,
              freeHot150: 35,
              freeHot200: 18,
              reviewedToday: 124,
              withDue: 82,
              neverReviewed: 45,
            },
            segments: {
              byPlan: { free: 1106, pro: 142 },
              byRole: { student: 1240, teacher: 7, admin: 1 },
              byLifecycle: { new: 350, active: 680, at_risk: 150, churned: 68 },
              bySource: { direct: 800, classroom: 300, group_member: 148 },
            },
            funnel: [
              { date: '2026-10-01', count: 24 },
              { date: '2026-10-02', count: 31 },
              { date: '2026-10-03', count: 42 },
              { date: '2026-10-04', count: 38 },
            ],
            customers: [
              {
                id: 'u1',
                email: 'taphong2002@gmail.com',
                full_name: 'Tạ Phong',
                role: 'admin',
                created_at: '2026-01-15T08:00:00Z',
                plan: 'pro',
                rawPlan: 'pro_annual',
                planExpiresAt: '2027-01-15T08:00:00Z',
                paying: true,
                source: 'direct',
                lifecycle: 'active',
                lastActive: new Date().toISOString(),
                wordCount: 1420,
                learnedCount: 1380,
                reviewTotal: 240,
                lapsesTotal: 12,
                lastReviewedAt: '2026-10-04T09:30:00Z',
                dueCount: 18,
                quizCount: 45,
                totalPaid: 499000,
                groupId: null,
              },
              {
                id: 'u2',
                email: 'minh.nguyen@edu.vn',
                full_name: 'Nguyễn Văn Minh',
                role: 'student',
                created_at: '2026-02-10T09:30:00Z',
                plan: 'free',
                rawPlan: 'free',
                planExpiresAt: null,
                paying: false,
                source: 'classroom',
                lifecycle: 'active',
                lastActive: '2026-10-04T07:15:00Z',
                wordCount: 850,
                learnedCount: 720,
                reviewTotal: 110,
                lapsesTotal: 35,
                lastReviewedAt: '2026-10-04T07:00:00Z',
                dueCount: 42,
                quizCount: 22,
                totalPaid: 0,
                groupId: 'grp-01',
              },
              {
                id: 'u3',
                email: 'thao.tran@company.com',
                full_name: 'Trần Thị Thu Thảo',
                role: 'student',
                created_at: '2026-03-01T14:15:00Z',
                plan: 'pro',
                rawPlan: 'pro_6m',
                planExpiresAt: '2026-09-01T14:15:00Z',
                paying: true,
                source: 'direct',
                lifecycle: 'at_risk',
                lastActive: '2026-10-03T16:00:00Z',
                wordCount: 620,
                learnedCount: 590,
                reviewTotal: 85,
                lapsesTotal: 8,
                lastReviewedAt: '2026-10-01T12:00:00Z',
                dueCount: 65,
                quizCount: 18,
                totalPaid: 299000,
                groupId: null,
              },
            ],
          }),
        });
      }

      if (url.includes('/api/billing/stats')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalRevenue: 48500000,
            monthlyRevenue: 12200000,
            totalOrders: 158,
            paidOrders: 142,
            pendingOrders: 16,
          }),
        });
      }

      if (url.includes('/api/billing/orders')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orders: [
              { id: 'ord-001', created_at: '2026-10-04T10:15:00Z', amount: 499000, status: 'paid', plan: 'LingoPro 1 Năm', user_email: 'minh.nguyen@edu.vn', payment_method: 'VietQR' },
              { id: 'ord-002', created_at: '2026-10-03T18:20:00Z', amount: 299000, status: 'paid', plan: 'LingoPro 6 Tháng', user_email: 'thao.tran@company.com', payment_method: 'VietQR' },
              { id: 'ord-003', created_at: '2026-10-02T09:45:00Z', amount: 499000, status: 'pending', plan: 'LingoPro 1 Năm', user_email: 'duc.hoang@school.edu.vn', payment_method: 'Chuyển khoản' }
            ],
          }),
        });
      }

      if (url.includes('/api/billing/coupons')) {
        return req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ coupons: [] }),
        });
      }

      req.continue();
    });

    // 1. Capture Admin Dashboard Desktop
    console.log('Capturing Admin Portal Desktop...');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    const adminPath = path.join(outDir, 'demo_admin_portal.png');
    await page.screenshot({ path: adminPath, fullPage: false });
    fs.copyFileSync(adminPath, path.join(brainDir, 'demo_admin_portal.png'));

    // 2. Capture Admin CRM
    console.log('Capturing Admin CRM Desktop...');
    await page.goto('http://localhost:3000/admin/crm', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    const crmPath = path.join(outDir, 'demo_admin_crm.png');
    await page.screenshot({ path: crmPath, fullPage: false });
    fs.copyFileSync(crmPath, path.join(brainDir, 'demo_admin_crm.png'));

    // 3. Capture Admin Billing
    console.log('Capturing Admin Billing Desktop...');
    await page.goto('http://localhost:3000/admin/billing', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    const billingPath = path.join(outDir, 'demo_admin_billing.png');
    await page.screenshot({ path: billingPath, fullPage: false });
    fs.copyFileSync(billingPath, path.join(brainDir, 'demo_admin_billing.png'));

    console.log('All admin pages captured successfully!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
