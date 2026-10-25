import assert from 'assert';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('================================================================');
  console.log('  CHALLENGE LANDING PAGE VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  [PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  [FAIL] ${name}`);
        console.error(`         ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. Static PDF Asset Check
  await test('V1: Static handbook PDF exists on disk and has valid PDF header', () => {
    const filePath = path.join(process.cwd(), 'public', 'resources', 'So-Tay-3000-Tu-Vung-LingoPro.pdf');
    assert(fs.existsSync(filePath), `File does not exist at ${filePath}`);
    const stats = fs.statSync(filePath);
    assert(stats.size > 100000, `PDF size is unexpectedly small: ${stats.size} bytes`);
    const header = fs.readFileSync(filePath, { encoding: 'ascii', flag: 'r' }).slice(0, 5);
    assert.strictEqual(header, '%PDF-', `File does not have valid PDF magic bytes: ${header}`);
  });

  // 2. HTTP Endpoint for static PDF asset
  await test('V2: HTTP GET /resources/So-Tay-3000-Tu-Vung-LingoPro.pdf returns 200 OK and application/pdf', async () => {
    const res = await fetch('http://localhost:3000/resources/So-Tay-3000-Tu-Vung-LingoPro.pdf');
    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    assert(contentType.includes('application/pdf'), `Expected application/pdf, got ${contentType}`);
    const arrayBuffer = await res.arrayBuffer();
    assert(arrayBuffer.byteLength > 100000, `Buffer size too small: ${arrayBuffer.byteLength}`);
  });

  // 3. HTTP GET Landing Page and Host Header Check
  await test('V3: HTTP GET /challenge-landing returns 200 OK with proper HTML content', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes('Thử Thách Tiếng Anh 180 Ngày'), 'Missing page title in HTML');
    assert(html.includes('Kiên Trì Mỗi Ngày'), 'Missing hero headline in HTML');
  });

  // 4. Schema.org JSON-LD Validation
  await test('V4: Schema.org JSON-LD contains valid Course, Product (with offers & rating), and FAQPage', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    const html = await res.text();
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert(jsonLdMatch, 'No ld+json script found in HTML');
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    assert(Array.isArray(jsonLd['@graph']), 'jsonLd.@graph must be an array');

    const course = jsonLd['@graph'].find((item: any) => item['@type'] === 'Course');
    assert(course, 'Course schema missing');
    assert(Array.isArray(course.offers), 'Course.offers must be an array');

    const product = jsonLd['@graph'].find((item: any) => item['@type'] === 'Product');
    assert(product, 'Product schema missing');
    assert(product.aggregateRating, 'Product.aggregateRating missing');
    assert.strictEqual(product.aggregateRating.ratingValue, '4.9');
    assert(product.offers, 'Product.offers missing (required by Google for rich snippets)');
    assert.strictEqual(product.offers['@type'], 'AggregateOffer');
    assert(Array.isArray(product.offers.offers), 'Product.offers.offers must be an array');

    const faqPage = jsonLd['@graph'].find((item: any) => item['@type'] === 'FAQPage');
    assert(faqPage, 'FAQPage schema missing');
    assert.strictEqual(faqPage.mainEntity.length, 7, 'FAQPage should have 7 questions');
  });

  // 5. Semantic Headings Check
  await test('V5: Semantic Headings include H1, H2 in GuaranteeSeal, and H3 for FAQs', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    const html = await res.text();
    
    // H1 check
    assert(/<h1[^>]*>([\s\S]*?)<\/h1>/i.test(html), 'Missing H1 tag');

    // GuaranteeSeal H2 check
    assert(
      html.includes('Bạn Học Đủ Chuỗi – Chúng Tôi Hoàn Lại 100% Tiền Cọc Trong 24H'),
      'Guarantee title missing'
    );
    assert(
      /<h2[^>]*>[\s\S]*?Bạn Học Đủ Chuỗi – Chúng Tôi Hoàn Lại 100% Tiền Cọc Trong 24H[\s\S]*?<\/h2>/i.test(html),
      'Guarantee title must be an H2'
    );

    // FAQ H3 check
    assert(
      /<h3[^>]*>[\s\S]*?1\. Thử thách học tiếng Anh LingoPro Challenge hoạt động như thế nào\?[\s\S]*?<\/h3>/i.test(html),
      'FAQ question 1 must be an H3'
    );
  });

  // 6. Pricing and Refund Consistency Check
  await test('V6: Pricing and Refund guarantees are consistent (300k & 500k 100% money back)', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    const html = await res.text();

    // Check that deceptive "Hoàn 100k + Tặng 6 Tháng Pro" does NOT exist
    assert(
      !html.includes('Hoàn 100k + 6 Tháng Pro') && !html.includes('Hoàn 100k + Tặng 6 Tháng Pro'),
      'Conflicting refund copy "Hoàn 100k" should be replaced with "Hoàn 100% (300.000đ)"'
    );
    // Check that deceptive "Hoàn 200k + Tặng 1 Năm Pro" does NOT exist
    assert(
      !html.includes('Hoàn 200k + Tặng 1 Năm Pro'),
      'Conflicting refund copy "Hoàn 200k" should be replaced with "Hoàn 100% (500.000đ)"'
    );

    // Check that 100% refund strings exist
    assert(html.includes('Hoàn 100% (300.000đ)'), 'Missing 300k 100% refund string');
    assert(html.includes('Hoàn 100% (500.000đ)'), 'Missing 500k 100% refund string');
  });

  // 7. Lead API POST validation
  await test('V7.1: POST /api/challenge/lead fails with 400 on invalid email', async () => {
    const res = await fetch('http://localhost:3000/api/challenge/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', fullName: 'Tester' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await test('V7.2: POST /api/challenge/lead succeeds with full payload and returns working downloadUrl', async () => {
    const testEmail = `test-verify-${Date.now()}@example.com`;
    const res = await fetch('http://localhost:3000/api/challenge/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nguyễn Kiểm Thử',
        email: testEmail,
        phone: '0988776655',
        targetGoal: 'Luyện thi TOEIC 650+',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.voucherCode, 'CHALLENGE50K');
    assert(data.downloadUrl.includes('So-Tay-3000-Tu-Vung-LingoPro.pdf'));

    // Verify the downloadUrl actually works
    const downloadRes = await fetch(`http://localhost:3000${data.downloadUrl}`);
    assert.strictEqual(downloadRes.status, 200);
    assert((downloadRes.headers.get('content-type') || '').includes('application/pdf'));
  });

  await test('V7.3: POST /api/challenge/lead succeeds without phone number (null phone safety)', async () => {
    const testEmail = `test-nophone-${Date.now()}@example.com`;
    const res = await fetch('http://localhost:3000/api/challenge/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Học Viên Không Điền SĐT',
        email: testEmail,
        phone: '', // empty phone
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  await test('V7.4: POST /api/challenge/lead traps bot honeypot correctly', async () => {
    const res = await fetch('http://localhost:3000/api/challenge/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'spambot@example.com',
        hp: 'i-am-a-bot',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 8. Urgency Countdown Scarcity Bar Check
  await test('V8: Urgency Countdown contains scarcity progress bar and 86% reserved slot indicator', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    const html = await res.text();
    assert(html.includes('86% đã đặt chỗ'), 'Missing 86% scarcity badge in countdown');
    assert(html.includes('43/50 bạn'), 'Missing 43/50 counter');
  });

  // 9. LeadMagnetSection Chapter Structure Preview Check
  await test('V9: LeadMagnetSection displays structured chapter preview (Chặng 1, Chặng 2, Chặng 3)', async () => {
    const res = await fetch('http://localhost:3000/challenge-landing');
    const html = await res.text();
    assert(html.includes('Cấu trúc sổ tay 4 phần cô đọng'), 'Missing handbook structure header');
    assert(html.includes('Chặng 1: Nền tảng'), 'Missing Chặng 1 preview');
    assert(html.includes('Chặng 2: Công sở'), 'Missing Chặng 2 preview');
    assert(html.includes('Chặng 3: Bứt phá'), 'Missing Chặng 3 preview');
  });

  console.log('\n================================================================');
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Test harness exception:', err);
  process.exit(1);
});
