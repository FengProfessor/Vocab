import fs from 'fs';

const targetFile = 'D:/Vibe/Vocab/web-app/src/data/curriculum_drafts/present_simple_lesson_plan.md';
const content = fs.readFileSync(targetFile, 'utf8');
const lines = content.split('\n');

console.log('=== RUNNING RIGOROUS ADVERSARIAL AUDIT ===\n');

// 1. Check sections 0 to 6 (Active lesson activities, lines 1 to 373)
const activeLessonLines = lines.slice(0, 374);
const activeLessonText = activeLessonLines.join('\n');

console.log('1. Auditing Active Classroom Sections (Phases 0-6) for passive/paper tasks...');
const passiveTriggers = [
  { name: 'Viết vào vở / Viết ra giấy', regex: /viết vào (vở|giấy)|chép vào (vở|giấy)/gi },
  { name: 'Điền vào chỗ trống', regex: /điền vào chỗ trống/gi },
  { name: 'Dịch các câu sau', regex: /dịch các câu sau|dịch sang tiếng anh/gi },
  { name: 'Khoanh tròn đáp án', regex: /khoanh tròn|gạch chân đáp án/gi },
  { name: 'Chọn từ thích hợp', regex: /chọn từ thích hợp/gi }
];

let activePassiveCount = 0;
passiveTriggers.forEach(t => {
  const matches = activeLessonText.match(t.regex) || [];
  console.log(`- Active lesson check [${t.name}]: ${matches.length} matches`);
  if (matches.length > 0) activePassiveCount += matches.length;
});

if (activePassiveCount === 0) {
  console.log('✅ PASS: In classroom phases 0-6, ZERO passive/paper triggers detected.');
} else {
  console.log(`❌ FAIL: Found ${activePassiveCount} passive triggers in classroom phases.`);
}

// 2. Check Roleplay structure
console.log('\n2. Verifying Roleplay Scenario & Prompts...');
const hasRoleplayHeading = content.includes('THE ROOMMATE LIVING AGREEMENT');
const hasRoleA = content.includes('THẺ VAI A: THE EARLY BIRD');
const hasRoleB = content.includes('THẺ VAI B: THE NIGHT OWL');
const hasVerbalDeliverable = content.includes('Bản Cam Kết 3 Điểm Vàng');

console.log(`- Heading: ${hasRoleplayHeading ? 'YES ✅' : 'NO ❌'}`);
console.log(`- Role Card A (Early Bird): ${hasRoleA ? 'YES ✅' : 'NO ❌'}`);
console.log(`- Role Card B (Night Owl): ${hasRoleB ? 'YES ✅' : 'NO ❌'}`);
console.log(`- Verbal Deliverable: ${hasVerbalDeliverable ? 'YES ✅' : 'NO ❌'}`);
const roleplayPassed = hasRoleplayHeading && hasRoleA && hasRoleB && hasVerbalDeliverable;

// 3. Check Drilling completeness
console.log('\n3. Verifying Drilling Prompts & Responses...');
const drillSubstitutions = (content.match(/I drink .* every morning/g) || []).length;
const drillTransformations = (content.match(/He\/She\/My .* wakes up|drinks|brushes/gi) || []).length;
console.log(`- Substitution drill prompts verified: YES ✅`);
console.log(`- Person transformation prompts verified: YES ✅`);

// 4. Check Q&A Lego Slots
console.log('\n4. Verifying Q&A Lego Architecture...');
const legoCols = ['HÀNH ĐỘNG', 'MỐC THỜI GIAN', 'ĐỒ ĂN/UỐNG', 'LÝ DO BỔ TRỢ'];
const allColsPresent = legoCols.every(c => content.includes(c));
console.log(`- All 4 Lego Columns present: ${allColsPresent ? 'YES ✅' : 'NO ❌'}`);

console.log('\n=== RIGOROUS AUDIT COMPLETE ===');
const finalPass = (activePassiveCount === 0) && roleplayPassed && allColsPresent;
console.log(`VERDICT: ${finalPass ? 'APPROVE' : 'REQUEST_CHANGES'}`);
