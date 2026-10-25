/**
 * Adversarial Stress & Edge Case Test Suite for VNU B3 AI Speaking Topics
 * File: scripts/test_vnu_b3_adversarial.ts
 */

import {
  VNU_B3_EXAMINER_PERSONAS,
  VNU_B3_AI_SPEAKING_TOPICS,
  AI_SPEAKING_TOPICS_VNU_B3,
  getVnuB3TopicById,
  buildVnuB3ExaminerSystemPrompt,
} from '../src/data/vnu_b3_drafts/ai-topics-vnu-b3-draft';
import type { AiSpeakingTopic } from '../src/data/speaking/ai-topics';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('================================================================');
console.log(' ADVERSARIAL STRESS SUITE: VNU B3 AI TOPICS');
console.log('================================================================\n');

// ── ADV 1: JSON SERIALIZATION & CIRCULAR DEPENDENCY SCAN ──────────────────────
console.log('--- Adv 1: JSON Serialization & Deep Clone ---');
try {
  const jsonStr = JSON.stringify(VNU_B3_AI_SPEAKING_TOPICS);
  assert(jsonStr.length > 500, 'JSON serialization successful', `${jsonStr.length} bytes`);
  const parsed = JSON.parse(jsonStr);
  assert(Array.isArray(parsed) && parsed.length === VNU_B3_AI_SPEAKING_TOPICS.length, 'Round-trip JSON parse matches original length');
  assert(parsed[0].id === 'vnu_b3_part1_sparring', 'JSON parsed payload preserved accurately');
} catch (err: any) {
  assert(false, 'JSON serialization failed', err?.message);
}

// ── ADV 2: WEIRD & UNTYPED INPUTS TO getVnuB3TopicById ─────────────────────────
console.log('\n--- Adv 2: Untyped / Runtime Boundary Inputs to getVnuB3TopicById ---');
const weirdInputs = [
  null,
  undefined,
  123,
  true,
  {},
  [],
  Symbol('test'),
  '\x00\x00',
  '../../etc/passwd',
  '<script>alert(1)</script>',
  'DROP TABLE topics;--',
];

for (const input of weirdInputs) {
  try {
    const res = (getVnuB3TopicById as any)(input);
    assert(res === undefined, `Graceful undefined on weird input: ${String(input)}`);
  } catch (err: any) {
    assert(false, `Threw exception on weird input: ${String(input)}`, err?.message);
  }
}

// ── ADV 3: EXTREME PROMPT INTERPOLATION STRESS ─────────────────────────────────
console.log('\n--- Adv 3: Extreme Prompt Construction Edge Cases ---');

// Case A: Empty strings in optional fields
const emptyOptionalTopic: AiSpeakingTopic = {
  id: 'empty_opt',
  category: 'exam_prep',
  categoryLabelVi: '',
  level: 'B1',
  label: 'Empty Opt Test',
  desc: '',
  icon: '',
  initialGreeting: '',
  suggestedStarters: [],
  keyVocabulary: [],
  roleplayPersona: {
    name: '',
    role: '',
    organization: '',
    tone: '',
  },
  contextSettingVi: '',
  conversationGoalsVi: [],
  situationalTipsVi: [],
};

const promptA = buildVnuB3ExaminerSystemPrompt(emptyOptionalTopic);
assert(typeof promptA === 'string', 'Handles empty optional strings');
assert(!promptA.includes('undefined'), 'Empty opt strings do not emit "undefined"');
assert(!promptA.includes('null'), 'Empty opt strings do not emit "null"');
assert(promptA.includes('Examiner'), 'Falls back to default Examiner name when empty string provided');
assert(promptA.includes('VNU Testing Center'), 'Falls back to default organization when empty string provided');
assert(promptA.includes('Warm, patient, highly encouraging.'), 'Falls back to default tone when empty string provided');
assert(promptA.includes('VNU Test Speaking Exam Room'), 'Falls back to default context when empty string provided');
assert(promptA.includes('Answer in 2-3 sentences, maintain fluency'), 'Falls back to default goals when empty array provided');

// Case B: Special characters, markdown, regex chars in labels
const specialCharsTopic: AiSpeakingTopic = {
  id: 'special_chars',
  category: 'exam_prep',
  categoryLabelVi: 'Thi thử',
  level: 'B1',
  label: 'Special <Topic> & "Quotes" \'Single\' `Code` ${injection} / \n Newline',
  desc: 'Desc with special chars',
  icon: '⚡',
  initialGreeting: 'Hi',
  suggestedStarters: ['Start'],
  keyVocabulary: ['Vocab'],
};

const promptB = buildVnuB3ExaminerSystemPrompt(specialCharsTopic);
assert(promptB.includes('Special <Topic> & "Quotes" \'Single\' `Code` ${injection} / \n Newline'), 'Preserves verbatim special characters without corruption');

// ── ADV 4: IMMUTABILITY & SIDE EFFECT SCAN ────────────────────────────────────
console.log('\n--- Adv 4: Immutability & Side Effects ---');
const originalLength = VNU_B3_AI_SPEAKING_TOPICS.length;
const originalFirstId = VNU_B3_AI_SPEAKING_TOPICS[0].id;
const clonedTopic = { ...VNU_B3_AI_SPEAKING_TOPICS[0] };

buildVnuB3ExaminerSystemPrompt(VNU_B3_AI_SPEAKING_TOPICS[0]);
getVnuB3TopicById(originalFirstId);

assert(VNU_B3_AI_SPEAKING_TOPICS.length === originalLength, 'Array length unchanged after operations');
assert(VNU_B3_AI_SPEAKING_TOPICS[0].id === clonedTopic.id, 'Topic 0 ID unchanged');
assert(VNU_B3_AI_SPEAKING_TOPICS[0].label === clonedTopic.label, 'Topic 0 label unchanged');

// ── ADV 5: COVERAGE OF BẬC 3 (B1) PEDAGOGICAL DOMAIN ──────────────────────────
console.log('\n--- Adv 5: Pedagogical Domain Coverage Audit ---');
const hasPart1 = VNU_B3_AI_SPEAKING_TOPICS.some((t) => t.id.includes('part1'));
const hasPart2 = VNU_B3_AI_SPEAKING_TOPICS.some((t) => t.id.includes('part2'));
assert(hasPart1, 'Contains at least one Part 1 Sparring Topic');
assert(hasPart2, 'Contains at least one Part 2 Sparring Topic');

const allTopicsMentionLenience = VNU_B3_AI_SPEAKING_TOPICS.every((t) => {
  const p = t.roleplayPersona;
  if (!p) return false;
  const toneLower = p.tone.toLowerCase();
  return toneLower.includes('kiên nhẫn') || toneLower.includes('khích lệ') || toneLower.includes('cởi mở') || toneLower.includes('thân thiện');
});
assert(allTopicsMentionLenience, '100% of topics have empathetic, encouraging examiner personas tailored for B1 candidates');

// ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(` RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
