/**
 * Automated Verification Suite for Student Navigation & Technical Minimalist Redesign
 * Tests: Section grouping, Lucide icons, exact/subpath routing, mobile drawer filtering, classroom options.
 */

import {
  buildStudentNavSections,
  buildStudentNavItems,
  type StudentNavSection,
  type StudentNavItem,
} from '../src/lib/student-nav';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runNavTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING STUDENT NAVIGATION ARCHITECTURE TEST SUITE');
  console.log('======================================================\n');

  const sections = buildStudentNavSections();
  const items = buildStudentNavItems();

  // ── 1. SECTION HEADERS & GROUP STRUCTURE ──
  console.log('--- 1. Testing Section Structure & Headers ---');
  assert(sections.length === 4, `Expected 4 navigation sections, got ${sections.length}`);
  assert(sections[0].id === 'learn', 'Section 0 id is learn');
  assert(sections[0].title === 'Học & Lộ trình', `Section 0 title is 'Học & Lộ trình', got '${sections[0].title}'`);
  assert(sections[1].id === 'practice', 'Section 1 id is practice');
  assert(sections[1].title === 'Kỹ năng thực hành', `Section 1 title is 'Kỹ năng thực hành', got '${sections[1].title}'`);
  assert(sections[2].id === 'exam', 'Section 2 id is exam');
  assert(sections[2].title === 'Khảo thí', `Section 2 title is 'Khảo thí', got '${sections[2].title}'`);
  assert(sections[3].id === 'vault', 'Section 3 id is vault');
  assert(sections[3].title === 'Tra cứu & Kho', `Section 3 title is 'Tra cứu & Kho', got '${sections[3].title}'`);

  // ── 2. ITEMS PER SECTION & CONTENT ──
  console.log('\n--- 2. Testing Items Per Section ---');
  // Group 1: Học & Lộ trình (4 items)
  assert(sections[0].items.length === 4, `Section 'Học & Lộ trình' has 4 items, got ${sections[0].items.length}`);
  const learnHrefs = sections[0].items.map((i) => i.href);
  assert(learnHrefs.includes('/student'), 'Learn group contains /student (Dashboard)');
  assert(learnHrefs.includes('/journey'), 'Learn group contains /journey (Lộ trình học)');
  assert(learnHrefs.includes('/review'), 'Learn group contains /review (Ôn tập ngắt quãng)');
  assert(learnHrefs.includes('/grammar/learn'), 'Learn group contains /grammar/learn (Ngữ pháp ứng dụng)');

  // Group 2: Kỹ năng thực hành (3 items)
  assert(sections[1].items.length === 3, `Section 'Kỹ năng thực hành' has 3 items, got ${sections[1].items.length}`);
  const practiceHrefs = sections[1].items.map((i) => i.href);
  assert(practiceHrefs.includes('/practice/listening'), 'Practice group contains /practice/listening (Luyện nghe Video)');
  assert(practiceHrefs.includes('/practice/pack-reading'), 'Practice group contains /practice/pack-reading (Luyện đọc hiểu)');
  assert(practiceHrefs.includes('/practice/codemix'), 'Practice group contains /practice/codemix (Đặt câu song ngữ)');

  // Group 3: Khảo thí (2 items: TOEIC & VSTEP)
  assert(sections[2].items.length === 2, `Section 'Khảo thí' has 2 items, got ${sections[2].items.length}`);
  assert(sections[2].items[0].href === '/toeic', 'Exam group contains /toeic (Thi thử TOEIC)');
  assert(sections[2].items[1].href === '/vstep', 'Exam group contains /vstep (Thi thử VSTEP)');

  // Group 4: Tra cứu & Kho (3 items)
  assert(sections[3].items.length === 3, `Section 'Tra cứu & Kho' has 3 items, got ${sections[3].items.length}`);
  const vaultHrefs = sections[3].items.map((i) => i.href);
  assert(vaultHrefs.includes('/dictionary'), 'Vault group contains /dictionary (Tra từ điển)');
  assert(vaultHrefs.includes('/library'), 'Vault group contains /library (Thư viện từ vựng)');
  assert(vaultHrefs.includes('/import'), 'Vault group contains /import (Nhập danh sách riêng)');

  // Total items check
  assert(items.length === 12, `Total nav items across all sections is 12, got ${items.length}`);

  // ── 3. ICON INTEGRITY & NO EMOJI TILES ──
  console.log('\n--- 3. Testing Iconography & Component Types ---');
  const seenIcons = new Set<any>();
  for (const item of items) {
    assert(typeof item.icon === 'object' || typeof item.icon === 'function', `Item '${item.label}' has valid Lucide icon component`);
    assert(typeof item.label === 'string' && item.label.length > 0, `Item '${item.label}' has non-empty label`);
    assert(typeof item.href === 'string' && item.href.startsWith('/'), `Item '${item.label}' has valid href starting with '/'`);
    assert(typeof item.match === 'function', `Item '${item.label}' has valid match function`);
    assert(!seenIcons.has(item.icon), `Item '${item.label}' icon is unique across all nav items (no icon collisions)`);
    seenIcons.add(item.icon);
  }
  assert(seenIcons.size === 12, `All 12 nav items have mutually distinct Lucide icons, got ${seenIcons.size}`);

  // ── 4. ROUTE MATCHING BEHAVIOR ──
  console.log('\n--- 4. Testing Exact & Subpath Route Matching ---');
  const findItem = (href: string) => items.find((i) => i.href === href || (href === '/review' && i.href.startsWith('/review')));

  // /student matches ONLY /student
  const studentItem = findItem('/student')!;
  assert(studentItem.match('/student') === true, '/student item matches /student');
  assert(studentItem.match('/student/profile') === false, '/student item does not match /student/profile (exact match)');
  assert(studentItem.match('/journey') === false, '/student item does not match /journey');

  // /journey subpaths
  const journeyItem = findItem('/journey')!;
  assert(journeyItem.match('/journey') === true, '/journey matches /journey');
  assert(journeyItem.match('/journey/checkpoint/unit-1') === true, '/journey matches /journey/checkpoint/unit-1');
  assert(journeyItem.match('/student') === false, '/journey does not match /student');

  // /review subpaths (review, flashcard, writing, quiz)
  const reviewItem = findItem('/review')!;
  assert(reviewItem.match('/review') === true, '/review matches /review');
  assert(reviewItem.match('/review/session') === true, '/review matches /review/session');
  assert(reviewItem.match('/flashcard/deck-1') === true, '/review matches /flashcard/deck-1');
  assert(reviewItem.match('/writing/task') === true, '/review matches /writing/task');
  assert(reviewItem.match('/quiz/mini') === true, '/review matches /quiz/mini');
  assert(reviewItem.match('/practice/listening') === false, '/review does not falsely match /practice/listening');

  // /grammar/learn subpaths
  const grammarItem = findItem('/grammar/learn')!;
  assert(grammarItem.match('/grammar/learn') === true, '/grammar/learn matches /grammar/learn');
  assert(grammarItem.match('/grammar/unit-5') === true, '/grammar/learn matches /grammar/unit-5');

  // Practice subpaths
  const listeningItem = findItem('/practice/listening')!;
  assert(listeningItem.match('/practice/listening') === true, 'listening item matches /practice/listening');
  assert(listeningItem.match('/practice/listening/video123') === true, 'listening item matches /practice/listening/video123');
  assert(listeningItem.match('/practice/codemix') === false, 'listening item does not match /practice/codemix');

  const readingItem = findItem('/practice/pack-reading')!;
  assert(readingItem.match('/practice/pack-reading') === true, 'reading item matches /practice/pack-reading');
  assert(readingItem.match('/practice/pack-reading/step-2') === true, 'reading item matches /practice/pack-reading/step-2');
  assert(readingItem.match('/practice/daily-reading') === true, 'reading item matches /practice/daily-reading');
  assert(readingItem.match('/practice/listening') === false, 'reading item does not match /practice/listening');

  const codemixItem = findItem('/practice/codemix')!;
  assert(codemixItem.match('/practice/codemix') === true, 'codemix item matches /practice/codemix');
  assert(codemixItem.match('/practice/listening') === false, 'codemix item does not match /practice/listening');

  // Practice Hub direct access: /practice should not falsely highlight any specific subpath
  assert(listeningItem.match('/practice') === false, '/practice does not match listening');
  assert(readingItem.match('/practice') === false, '/practice does not match reading');
  assert(codemixItem.match('/practice') === false, '/practice does not match codemix');

  // /toeic subpaths
  const toeicItem = findItem('/toeic')!;
  assert(toeicItem.match('/toeic') === true, 'toeic item matches /toeic');
  assert(toeicItem.match('/toeic/part5/ref-1') === true, 'toeic item matches /toeic/part5/ref-1');
  assert(toeicItem.match('/toeic/exam/full-1') === true, 'toeic item matches /toeic/exam/full-1');
  assert(toeicItem.match('/practice') === false, 'toeic item does not match /practice');

  // /vstep subpaths
  const vstepItem = findItem('/vstep')!;
  assert(vstepItem.match('/vstep') === true, 'vstep item matches /vstep');
  assert(vstepItem.match('/vstep/exam/vstep-mock-01') === true, 'vstep item matches /vstep/exam/vstep-mock-01');
  assert(vstepItem.match('/practice') === false, 'vstep item does not match /practice');
  assert(vstepItem.match('/toeic') === false, 'vstep item does not match /toeic');

  // Vault subpaths
  const dictItem = findItem('/dictionary')!;
  assert(dictItem.match('/dictionary') === true, 'dict item matches /dictionary');
  assert(dictItem.match('/dictionary/word/example') === true, 'dict item matches /dictionary/word/example');

  const libraryItem = findItem('/library')!;
  assert(libraryItem.match('/library') === true, 'library item matches /library');

  const importItem = findItem('/import')!;
  assert(importItem.match('/import') === true, 'import item matches /import');

  // ── 5. MOBILE DRAWER FILTERING LOGIC ──
  console.log('\n--- 5. Testing Mobile Drawer Deduplication ---');
  // In mobile drawer, items with footerDup === true are filtered out
  const drawerSections = sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.footerDup),
    }))
    .filter((s) => s.items.length > 0);

  assert(drawerSections.length === 4, `Mobile drawer preserves all 4 sections with remaining items, got ${drawerSections.length}`);

  // Check section 1 in drawer
  assert(drawerSections[0].id === 'learn', 'Drawer section 0 is learn');
  assert(drawerSections[0].items.length === 1, `Drawer section 0 has 1 item, got ${drawerSections[0].items.length}`);
  assert(drawerSections[0].items[0].href === '/grammar/learn', 'Drawer section 0 item is /grammar/learn');

  // Check section 2 in drawer
  assert(drawerSections[1].id === 'practice', 'Drawer section 1 is practice');
  assert(drawerSections[1].items.length === 3, `Drawer section 1 has 3 practice items, got ${drawerSections[1].items.length}`);

  // Check section 3 in drawer
  assert(drawerSections[2].id === 'exam', 'Drawer section 2 is exam');
  assert(drawerSections[2].items.length === 2, `Drawer section 2 has 2 items (/toeic & /vstep), got ${drawerSections[2].items.length}`);
  assert(drawerSections[2].items[0].href === '/toeic', 'Drawer section 2 item 0 is /toeic');
  assert(drawerSections[2].items[1].href === '/vstep', 'Drawer section 2 item 1 is /vstep');

  // Check section 4 in drawer
  assert(drawerSections[3].id === 'vault', 'Drawer section 3 is vault');
  assert(drawerSections[3].items.length === 1, `Drawer section 3 has 1 item (/import), got ${drawerSections[3].items.length}`);
  assert(drawerSections[3].items[0].href === '/import', 'Drawer section 3 item is /import');

  // Verify that the 5 bottom nav items are filtered out of drawer
  const drawerHrefs = drawerSections.flatMap((s) => s.items.map((i) => i.href));
  assert(!drawerHrefs.includes('/student'), 'Drawer does NOT contain /student (in bottom nav)');
  assert(!drawerHrefs.includes('/journey'), 'Drawer does NOT contain /journey (in bottom nav)');
  assert(!drawerHrefs.some((h) => h.startsWith('/review')), 'Drawer does NOT contain /review (in bottom nav)');
  assert(!drawerHrefs.includes('/dictionary'), 'Drawer does NOT contain /dictionary (in bottom nav)');
  assert(!drawerHrefs.includes('/library'), 'Drawer does NOT contain /library (in bottom nav)');

  // ── 6. CLASSROOM ID PROPAGATION & SANITIZATION ──
  console.log('\n--- 6. Testing Classroom ID Handling ---');
  const classSections = buildStudentNavSections({ classroomId: 'class-abc-123' });
  const classReviewItem = classSections[0].items.find((i) => i.href.startsWith('/review'))!;
  assert(
    classReviewItem.href === '/review?class=class-abc-123',
    `Review href with classroomId is '/review?class=class-abc-123', got '${classReviewItem.href}'`,
  );

  // Sanitization with special characters / spaces
  const specialClassSections = buildStudentNavSections({ classroomId: 'Lớp 12 A1 & B2' });
  const specialReviewItem = specialClassSections[0].items.find((i) => i.href.startsWith('/review'))!;
  assert(
    specialReviewItem.href === `/review?class=${encodeURIComponent('Lớp 12 A1 & B2')}`,
    'Review href safely encodes special characters and spaces',
  );

  // Empty string / whitespace classroomId returns default /review
  const emptyClassSections = buildStudentNavSections({ classroomId: '   ' });
  const emptyReviewItem = emptyClassSections[0].items.find((i) => i.href.startsWith('/review'))!;
  assert(emptyReviewItem.href === '/review', 'Whitespace-only classroomId falls back to clean /review');

  // ── 7. DYNAMIC BADGE PROPAGATION & CAPPING ──
  console.log('\n--- 7. Testing Dynamic Badge Counts & Clamping ---');
  const badgeSections = buildStudentNavSections({
    reviewDueCount: 15,
    grammarDueCount: 4,
  });
  const reviewBadgeItem = badgeSections[0].items.find((i) => i.href.startsWith('/review'))!;
  const grammarBadgeItem = badgeSections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(reviewBadgeItem.badge === 15, `Review badge is 15, got ${reviewBadgeItem.badge}`);
  assert(grammarBadgeItem.badge === 4, `Grammar badge is 4, got ${grammarBadgeItem.badge}`);

  // Test 99+ capping
  const cappedSections = buildStudentNavSections({
    reviewDueCount: 150,
    grammarDueCount: 105,
  });
  const cappedReviewItem = cappedSections[0].items.find((i) => i.href.startsWith('/review'))!;
  const cappedGrammarItem = cappedSections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(cappedReviewItem.badge === '99+', `Review badge capped at '99+', got ${cappedReviewItem.badge}`);
  assert(cappedGrammarItem.badge === '99+', `Grammar badge capped at '99+', got ${cappedGrammarItem.badge}`);

  // Test zero / undefined badge returns undefined (no badge shown)
  const zeroSections = buildStudentNavSections({
    reviewDueCount: 0,
    grammarDueCount: 0,
  });
  const zeroReviewItem = zeroSections[0].items.find((i) => i.href.startsWith('/review'))!;
  const zeroGrammarItem = zeroSections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(zeroReviewItem.badge === undefined, 'Review badge is undefined when count is 0');
  assert(zeroGrammarItem.badge === undefined, 'Grammar badge is undefined when count is 0');

  // Negative badge counts handled safely (no negative badges displayed)
  const negativeSections = buildStudentNavSections({
    reviewDueCount: -5,
    grammarDueCount: -1,
  });
  const negReviewItem = negativeSections[0].items.find((i) => i.href.startsWith('/review'))!;
  const negGrammarItem = negativeSections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(negReviewItem.badge === undefined, 'Negative reviewDueCount results in undefined badge');
  assert(negGrammarItem.badge === undefined, 'Negative grammarDueCount results in undefined badge');

  // ── 8. EDGE CASES & CALL CONVENTIONS ──
  console.log('\n--- 8. Testing Edge Cases & Default Arguments ---');
  // buildStudentNavSections with undefined opts
  const defaultSections = buildStudentNavSections(undefined);
  assert(defaultSections.length === 4, 'buildStudentNavSections(undefined) succeeds with 4 sections');
  const defaultItems = buildStudentNavItems(undefined);
  assert(defaultItems.length === 12, 'buildStudentNavItems(undefined) succeeds with 12 items');

  // Null classroomId fallback
  const nullClassSections = buildStudentNavSections({ classroomId: null });
  const nullReviewItem = nullClassSections[0].items.find((i) => i.href.startsWith('/review'))!;
  assert(nullReviewItem.href === '/review', 'null classroomId falls back cleanly to /review');

  // Empty string classroomId fallback
  const emptyStrClassSections = buildStudentNavSections({ classroomId: '' });
  const emptyStrReviewItem = emptyStrClassSections[0].items.find((i) => i.href.startsWith('/review'))!;
  assert(emptyStrReviewItem.href === '/review', 'empty string classroomId falls back cleanly to /review');

  // ── 9. BOUNDARY CONDITIONS & STRUCTURAL INVARIANTS ──
  console.log('\n--- 9. Testing Boundary Conditions & Invariants ---');
  // Badge boundary: exactly 99 -> 99
  const b99Sections = buildStudentNavSections({ reviewDueCount: 99, grammarDueCount: 99 });
  const b99Review = b99Sections[0].items.find((i) => i.href.startsWith('/review'))!;
  const b99Grammar = b99Sections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(b99Review.badge === 99, `Count 99 produces number 99, got ${b99Review.badge}`);
  assert(b99Grammar.badge === 99, `Grammar count 99 produces number 99, got ${b99Grammar.badge}`);

  // Badge boundary: exactly 100 -> '99+'
  const b100Sections = buildStudentNavSections({ reviewDueCount: 100, grammarDueCount: 100 });
  const b100Review = b100Sections[0].items.find((i) => i.href.startsWith('/review'))!;
  const b100Grammar = b100Sections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(b100Review.badge === '99+', `Count 100 produces '99+', got ${b100Review.badge}`);
  assert(b100Grammar.badge === '99+', `Grammar count 100 produces '99+', got ${b100Grammar.badge}`);

  // Badge boundary: exactly 1 -> 1
  const b1Sections = buildStudentNavSections({ reviewDueCount: 1, grammarDueCount: 1 });
  const b1Review = b1Sections[0].items.find((i) => i.href.startsWith('/review'))!;
  const b1Grammar = b1Sections[0].items.find((i) => i.href === '/grammar/learn')!;
  assert(b1Review.badge === 1, `Count 1 produces number 1, got ${b1Review.badge}`);
  assert(b1Grammar.badge === 1, `Grammar count 1 produces number 1, got ${b1Grammar.badge}`);

  // Invariant: all 12 items have onboardingId
  for (const item of items) {
    assert(
      typeof item.onboardingId === 'string' && item.onboardingId.length > 0,
      `Item '${item.label}' has valid non-empty onboardingId '${item.onboardingId}'`,
    );
  }

  // Invariant: footerDup is set ONLY on exactly the 5 bottom nav items
  const footerDupItems = items.filter((i) => i.footerDup === true);
  assert(footerDupItems.length === 5, `Exactly 5 items have footerDup: true, got ${footerDupItems.length}`);
  const expectedFooterDupHrefs = ['/student', '/journey', '/review', '/dictionary', '/library'];
  for (const expectedHref of expectedFooterDupHrefs) {
    assert(
      footerDupItems.some((i) => i.href === expectedHref || (expectedHref === '/review' && i.href.startsWith('/review'))),
      `footerDup items include ${expectedHref}`,
    );
  }

  // Invariant: no section has empty title or 0 items
  for (const section of sections) {
    assert(section.title.trim().length > 0, `Section '${section.id}' has non-empty title`);
    assert(section.items.length > 0, `Section '${section.id}' has at least 1 item`);
  }

  // Invariant: URL format sanity — no double slashes or trailing slashes (except root)
  for (const item of items) {
    assert(!item.href.includes('//'), `Item '${item.label}' href has no double slashes: ${item.href}`);
    assert(item.href === '/' || !item.href.endsWith('/'), `Item '${item.label}' href has no trailing slash: ${item.href}`);
  }

  console.log('\n======================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNavTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});

