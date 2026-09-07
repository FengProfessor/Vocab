import contentData from '../src/data/toeic/content-toeic-reading-v1.json';
import roadmapData from '../src/data/roadmap/roadmap-toeic-v1.json';
import { getRoadmapLevels, resolveStep, orderedStepIds } from '../src/lib/roadmap';
import type { ToeicReadingContent } from '../src/types/toeic';

const content = contentData as unknown as ToeicReadingContent;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
}

console.log('--- 1. Validating TOEIC Content JSON ---');
assert(content.version === 'toeic-reading-v1', 'Version must be toeic-reading-v1');
assert(content.part5.length >= 30, `Expected at least 30 Part 5 questions, found ${content.part5.length}`);
assert(content.part6.length >= 4, `Expected at least 4 Part 6 passages, found ${content.part6.length}`);
assert(content.part7_single.length >= 5, `Expected at least 5 Part 7 passages, found ${content.part7_single.length}`);
assert(content.mini_test.length >= 2, `Expected at least 2 mini tests, found ${content.mini_test.length}`);

// Validate Part 5
console.log(`Checking ${content.part5.length} Part 5 questions...`);
for (const q of content.part5) {
  assert(!!q.id, `Part 5 question missing ID: ${JSON.stringify(q)}`);
  assert(!!q.setId, `Part 5 question ${q.id} missing setId`);
  assert(q.options.length === 4, `Part 5 question ${q.id} must have 4 options`);
  assert(['A', 'B', 'C', 'D'].includes(q.answer.replace(/[()]/g, '')), `Part 5 question ${q.id} invalid answer: ${q.answer}`);
  assert(!!q.explain && q.explain.length > 5, `Part 5 question ${q.id} missing explain`);
}

// Validate Part 6
console.log(`Checking ${content.part6.length} Part 6 passages...`);
for (const p of content.part6) {
  assert(!!p.id, `Part 6 passage missing ID`);
  assert(!!p.setId, `Part 6 passage ${p.id} missing setId`);
  assert(p.blanks.length === 4, `Part 6 passage ${p.id} must have 4 blanks, found ${p.blanks.length}`);
  for (const b of p.blanks) {
    assert(b.options.length === 4, `Part 6 ${p.id} blank ${b.index} must have 4 options`);
    assert(['A', 'B', 'C', 'D'].includes(b.answer.replace(/[()]/g, '')), `Part 6 ${p.id} blank ${b.index} invalid answer: ${b.answer}`);
    assert(!!b.explain, `Part 6 ${p.id} blank ${b.index} missing explain`);
  }
}

// Validate Part 7
console.log(`Checking ${content.part7_single.length} Part 7 passages...`);
for (const p of content.part7_single) {
  assert(!!p.id, `Part 7 passage missing ID`);
  assert(!!p.setId, `Part 7 passage ${p.id} missing setId`);
  assert(p.questions.length >= 2, `Part 7 passage ${p.id} should have at least 2 questions`);
  for (const q of p.questions) {
    assert(q.options.length === 4, `Part 7 ${p.id} question "${q.q}" must have 4 options`);
    assert(['A', 'B', 'C', 'D'].includes(q.answer.replace(/[()]/g, '')), `Part 7 ${p.id} invalid answer: ${q.answer}`);
    assert(!!q.explain, `Part 7 ${p.id} missing explain`);
  }
}

// Validate Mini Tests
console.log(`Checking ${content.mini_test.length} mini tests...`);
for (const test of content.mini_test) {
  assert(!!test.id, 'Mini test missing ID');
  assert(test.timeMinutes > 0, `Mini test ${test.id} must have timeMinutes > 0`);
  assert(test.sections.length > 0, `Mini test ${test.id} has no sections`);
}

console.log('--- 2. Validating Roadmap Integration ---');
const levels = getRoadmapLevels('toeic');
assert(levels.length === 3, `Expected 3 levels in TOEIC track, found ${levels.length}`);
assert(levels[0].id === 'toeic-450', 'Level 1 must be toeic-450');
assert(levels[1].id === 'toeic-650', 'Level 2 must be toeic-650');
assert(levels[2].id === 'toeic-800', 'Level 3 must be toeic-800');

const stepIds = orderedStepIds('toeic');
console.log(`Found ${stepIds.length} steps in TOEIC track roadmap.`);
assert(stepIds.length >= 10, 'Expected at least 10 steps in TOEIC roadmap');

for (const stepId of stepIds) {
  const resolved = resolveStep(stepId, 'toeic');
  assert(!!resolved, `Step ${stepId} failed to resolve`);
  assert(!!resolved?.step.title, `Step ${stepId} missing title`);
}

console.log('✅ ALL 100% OF TOEIC DATA & ROADMAP VALIDATIONS PASSED!');
