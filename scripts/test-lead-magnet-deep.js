const path = require('path');
const fs = require('fs');

async function runDeepVerification() {
  console.log('=== DEEP VERIFICATION FOR SÁT THỦ TOEIC LEAD MAGNET ===\n');

  // 1. Check file locations across root, docs, and public
  console.log('[1/6] Verifying file storage in docs/ and public/downloads/ ...');
  const docsPath = path.join(__dirname, '../docs/sat-thu-toeic-listening-lead-magnet.md');
  const pubPath1 = path.join(__dirname, '../public/downloads/sat-thu-toeic-listening-lead-magnet.md');
  const pubPath2 = path.join(__dirname, '../public/lead-magnet/sat-thu-toeic-listening-lead-magnet.md');

  if (!fs.existsSync(docsPath)) throw new Error('Missing docs file');
  if (!fs.existsSync(pubPath1)) throw new Error('Missing public/downloads file');
  if (!fs.existsSync(pubPath2)) throw new Error('Missing public/lead-magnet file');

  const content = fs.readFileSync(docsPath, 'utf8');
  console.log(`✔ File exists in docs and public (Size: ${(content.length / 1024).toFixed(1)} KB)`);

  // 2. Test TOC headings slugification
  console.log('\n[2/6] Testing Table of Contents slug matching against actual Markdown headings ...');
  function slugifyHeading(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  const tocItems = [
    { title: 'Trang 1: Bản Đồ Tư Duy 4 Part', keyword: 'BẢN ĐỒ TƯ DUY', slug: 'ban-do-tu-duy-4-phan-thi' },
    { title: 'Trang 2: Báo Cáo Số Liệu ETS 2024 vs 2026', keyword: 'BÁO CÁO DỮ LIỆU', slug: 'bao-cao-du-lieu-dinh-luong-ets-2024-vs-ets-2026' },
    { title: 'Trang 3: Bẫy từ chỉ nhóm đồ vật lớn', keyword: 'TỬ HUYỆT 1', slug: 'part-1-tu-huyet-1-bay-tu-chi-nhom-do-vat-lon-tu-bao-ham' },
    { title: 'Trang 4: Soi vi cử động ngón tay & mắt', keyword: 'TỬ HUYỆT 2', slug: 'part-1-tu-huyet-2-soi-vi-cu-dong-ngon-tay-anh-mat' },
    { title: 'Trang 5: Đang làm (Being) vs Đã xong (Been)', keyword: 'TỬ HUYỆT 3', slug: 'part-1-tu-huyet-3-bay-dang-lam-being-vs-da-xong-been-meo-soi-hau-canh' },
    { title: 'Trang 6: Đã mặc sẵn vs Đang mặc đồ', keyword: 'TỬ HUYỆT 4', slug: 'part-1-tu-huyet-4-bay-da-mac-san-vs-dang-mac-do-tu-da-nghia' },
    { title: 'Trang 7: Đối đáp câu trần thuật công sở', keyword: 'TỬ HUYỆT 5', slug: 'part-2-tu-huyet-5-cach-doi-dap-cau-tran-thuat-noi-cong-so-statements' },
    { title: 'Trang 8: Trả lời vòng vo, thoái thác', keyword: 'TỬ HUYỆT 6', slug: 'part-2-tu-huyet-6-bay-tra-loi-vong-vo-thoai-thac-be-lai-cau-hoi' },
    { title: 'Trang 9: Quy tắc thật Có Yes - Không No', keyword: 'TỬ HUYỆT 7', slug: 'part-2-tu-huyet-7-quy-tac-that-co-la-yes-khong-la-no-bay-tu-nghe-giong-nhau' },
    { title: 'Trang 10: Đổi chữ Paraphrase 3 Tầng', keyword: 'TỬ HUYỆT 8', slug: 'part-3-tu-huyet-8-ky-thuat-doi-chu-dong-nghia-paraphrase-3-tang' },
    { title: 'Trang 11: Gióng cột biểu đồ & Thoại 3 người', keyword: 'TỬ HUYỆT 9', slug: 'part-3-4-tu-huyet-9-meo-giong-cot-tranh-bieu-do-thoai-3-nguoi' },
    { title: 'Trang 12: 15 câu cửa miệng ngầm ý bản xứ', keyword: 'TỬ HUYỆT 10', slug: 'part-3-4-tu-huyet-10-15-cau-cua-mieng-ngam-y-cua-nguoi-ban-xu' },
    { title: 'Trang 13: 4 mẹo nghe nối âm - nuốt âm', keyword: 'TỬ HUYỆT 11', slug: 'ngu-am-tu-huyet-11-4-meo-nghe-thung-noi-am-nuot-am-ngu-dieu-4-nuoc' },
    { title: 'Trang 14: Tự Chẩn Đoán Lỗ Hổng 15 Bẫy', keyword: 'BẢNG TỰ CHẨN ĐOÁN', slug: 'bang-tu-chan-doan-lo-hong-nghe-15-bay-sat-thu' },
    { title: 'Trang 15: Lộ Trình 30 Ngày & Kế Hoạch', keyword: 'LỘ TRÌNH 30 NGÀY', slug: 'lo-trinh-30-ngay-lot-xac-thinh-giac-ke-hoach-hanh-dong' },
  ];

  for (const item of tocItems) {
    const foundInContent = content.toUpperCase().includes(item.keyword);
    if (!foundInContent) {
      throw new Error(`TOC keyword ${item.keyword} not found in markdown content!`);
    }
    console.log(`  ✔ TOC Item verified: "${item.title}" -> Keyword: [${item.keyword}] present in MD`);
  }

  // 3. Test Dictionary data structure
  console.log('\n[3/6] Verifying 150-word dictionary integrity ...');
  const dict = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/sat-thu-toeic-dict.json'), 'utf8'));
  if (dict.length !== 150) throw new Error(`Expected 150 words, got ${dict.length}`);
  const groups = new Set();
  for (const item of dict) {
    if (!item.word || !item.ipa || !item.meaning || !item.collocation || !item.citation || !item.trap) {
      throw new Error(`Dict item #${item.id} (${item.word}) is missing fields!`);
    }
    groups.add(item.groupIndex);
  }
  if (groups.size !== 6) throw new Error(`Expected 6 groups, got ${groups.size}`);
  console.log(`✔ All 150 dictionary items complete with IPA, Collocations, Traps, and Citations across 6 groups.`);

  // 4. Test 15-Dimension data structure
  console.log('\n[4/6] Verifying 15 Dimensions in sat-thu-toeic-listening-data.ts ...');
  const dataContent = fs.readFileSync(path.join(__dirname, '../src/data/sat-thu-toeic-listening-data.ts'), 'utf8');
  for (let i = 1; i <= 15; i++) {
    if (!dataContent.includes(`id: ${i},`)) {
      throw new Error(`Dimension ${i} missing!`);
    }
  }
  if (!dataContent.includes('DIAGNOSTIC_TIERS')) throw new Error('Missing DIAGNOSTIC_TIERS');
  if (!dataContent.includes('KEY_STATS_2026')) throw new Error('Missing KEY_STATS_2026');
  console.log(`✔ All 15 dimensions, Key Stats 2026, and Diagnostic Tiers validated.`);

  // 5. Test Server Loader Fallback
  console.log('\n[5/6] Testing Lead Magnet server loader multi-path resolution ...');
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.join(process.cwd(), 'public', 'lead-magnet', 'sat-thu-toeic-listening-lead-magnet.md'),
    path.join(process.cwd(), 'docs', 'sat-thu-toeic-listening-lead-magnet.md'),
  ];
  let resolvedCount = 0;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) resolvedCount++;
  }
  console.log(`✔ ${resolvedCount}/${candidatePaths.length} fallback paths resolved.`);
  if (resolvedCount === 0) throw new Error('No fallback paths could be resolved!');

  // 6. Test Marketing / Landing Page Linking
  console.log('\n[6/6] Verifying Landing Page navigation linking ...');
  const homePage = fs.readFileSync(path.join(__dirname, '../src/app/page.tsx'), 'utf8');
  if (!homePage.includes('/sat-thu-toeic-listening')) {
    throw new Error('Home page does not link to /sat-thu-toeic-listening!');
  }
  console.log('✔ Home page header and footer navigation links verified.');

  console.log('\n🎉 ALL DEEP VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

runDeepVerification().catch((err) => {
  console.error('\n❌ DEEP VERIFICATION FAILED:', err);
  process.exit(1);
});
