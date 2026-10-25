/**
 * Empirical & Adversarial Test Suite for VNU B3 AI Speaking Topics Draft
 * File: scripts/test_vnu_b3_ai_topics.ts
 *
 * Verifies:
 * 1. Exports, types, array lengths, aliases.
 * 2. Complete field verification (required + optional) against AiSpeakingTopic interface.
 * 3. Query helper getVnuB3TopicById (positive, negative, edge cases).
 * 4. buildVnuB3ExaminerSystemPrompt prompt interpolation, anti-undefined/null guarantees, and fallback robustness.
 * 5. Adversarial edge cases: malformed objects, empty arrays, missing optional fields, stress performance.
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
console.log(' EMPIRICAL TEST SUITE: VNU B3 AI SPEAKING TOPICS DRAFT');
console.log('================================================================\n');

// ── TEST SUITE 1: ARRAYS & EXPORT ALIASES ─────────────────────────────────────
console.log('--- Suite 1: Array Integrity & Aliases ---');
assert(Array.isArray(VNU_B3_AI_SPEAKING_TOPICS), 'VNU_B3_AI_SPEAKING_TOPICS is an array');
assert(VNU_B3_AI_SPEAKING_TOPICS.length >= 3, 'Array has at least 3 topics', `Actual: ${VNU_B3_AI_SPEAKING_TOPICS.length}`);
assert(VNU_B3_AI_SPEAKING_TOPICS === AI_SPEAKING_TOPICS_VNU_B3, 'AI_SPEAKING_TOPICS_VNU_B3 is identical alias');

// ── TEST SUITE 2: PERSONA DICTIONARY ─────────────────────────────────────────
console.log('\n--- Suite 2: Examiner Personas Dictionary ---');
assert(typeof VNU_B3_EXAMINER_PERSONAS === 'object' && VNU_B3_EXAMINER_PERSONAS !== null, 'VNU_B3_EXAMINER_PERSONAS is an object');
const personaKeys = Object.keys(VNU_B3_EXAMINER_PERSONAS);
assert(personaKeys.length >= 3, 'Contains at least 3 examiner personas', `Keys: ${personaKeys.join(', ')}`);

for (const key of personaKeys) {
  const p = VNU_B3_EXAMINER_PERSONAS[key];
  assert(Boolean(p.name && p.name.trim().length > 0), `Persona '${key}' has valid name`, p.name);
  assert(Boolean(p.role && p.role.trim().length > 0), `Persona '${key}' has valid role`, p.role);
  assert(Boolean(p.organization && p.organization.trim().length > 0), `Persona '${key}' has valid organization`, p.organization);
  assert(Boolean(p.tone && p.tone.trim().length > 0), `Persona '${key}' has valid tone`, p.tone.slice(0, 30) + '...');
}

// ── TEST SUITE 3: TOPIC SCHEMA CONFORMANCE ────────────────────────────────────
console.log('\n--- Suite 3: Schema Conformance (AiSpeakingTopic) ---');
const VALID_CATEGORIES = new Set(['workplace', 'academic', 'daily_travel', 'debates', 'exam_prep', 'grammar_in_action']);
const VALID_LEVELS = new Set(['A2', 'B1', 'B2', 'C1']);
const seenIds = new Set<string>();

VNU_B3_AI_SPEAKING_TOPICS.forEach((topic, idx) => {
  console.log(`\n  Checking Topic [${idx + 1}/${VNU_B3_AI_SPEAKING_TOPICS.length}]: ${topic.id}`);

  // Unique ID
  assert(!seenIds.has(topic.id), `Unique ID: ${topic.id}`);
  seenIds.add(topic.id);
  assert(typeof topic.id === 'string' && topic.id.length > 0, `ID is non-empty string: ${topic.id}`);

  // Category
  assert(VALID_CATEGORIES.has(topic.category), `Valid category enum: ${topic.category}`);
  assert(typeof topic.categoryLabelVi === 'string' && topic.categoryLabelVi.length > 0, `Valid categoryLabelVi: ${topic.categoryLabelVi}`);

  // Level
  assert(VALID_LEVELS.has(topic.level), `Valid level enum: ${topic.level}`);
  assert(topic.level === 'B1', `Level is specifically B1 for VNU B3`);

  // Label & desc
  assert(typeof topic.label === 'string' && topic.label.length >= 5, `Valid label: "${topic.label}"`);
  assert(typeof topic.desc === 'string' && topic.desc.length >= 20, `Valid desc: ${topic.desc.slice(0, 40)}...`);

  // Icon
  assert(typeof topic.icon === 'string' && topic.icon.length > 0, `Valid icon: ${topic.icon}`);

  // Initial greeting
  assert(typeof topic.initialGreeting === 'string' && topic.initialGreeting.length >= 20, `Valid initialGreeting (${topic.initialGreeting.length} chars)`);

  // Suggested starters
  assert(Array.isArray(topic.suggestedStarters) && topic.suggestedStarters.length >= 3, `Has >= 3 suggestedStarters (${topic.suggestedStarters?.length})`);
  topic.suggestedStarters?.forEach((starter, sIdx) => {
    assert(typeof starter === 'string' && starter.length >= 10, `Starter ${sIdx + 1} is valid English sentence starter`);
  });

  // Key vocabulary
  assert(Array.isArray(topic.keyVocabulary) && topic.keyVocabulary.length >= 4, `Has >= 4 keyVocabulary items (${topic.keyVocabulary?.length})`);
  topic.keyVocabulary?.forEach((vocab, vIdx) => {
    assert(typeof vocab === 'string' && vocab.length > 0, `Vocab ${vIdx + 1}: "${vocab}"`);
  });

  // Optional fields
  if (topic.roleplayPersona) {
    assert(typeof topic.roleplayPersona.name === 'string' && topic.roleplayPersona.name.length > 0, `Roleplay persona has name: ${topic.roleplayPersona.name}`);
    assert(typeof topic.roleplayPersona.tone === 'string' && topic.roleplayPersona.tone.length > 0, `Roleplay persona has tone`);
  }

  if (topic.contextSettingVi) {
    assert(typeof topic.contextSettingVi === 'string' && topic.contextSettingVi.length >= 15, `Context setting Vi is descriptive`);
  }

  if (topic.conversationGoalsVi) {
    assert(Array.isArray(topic.conversationGoalsVi) && topic.conversationGoalsVi.length >= 2, `Conversation goals Vi has >= 2 goals`);
  }

  if (topic.situationalTipsVi) {
    assert(Array.isArray(topic.situationalTipsVi) && topic.situationalTipsVi.length >= 2, `Situational tips Vi has >= 2 tips`);
  }
});

// ── TEST SUITE 4: QUERY HELPER (getVnuB3TopicById) ────────────────────────────
console.log('\n--- Suite 4: Query Helper (getVnuB3TopicById) ---');

// Positive queries
for (const id of Array.from(seenIds)) {
  const found = getVnuB3TopicById(id);
  assert(Boolean(found && found.id === id), `Found topic by ID: ${id}`);
}

// Negative queries
const nonExistentQueries = [
  'non_existent_topic_123',
  '',
  '   ',
  'vnu_b3_part1_SPARRING', // case sensitivity check
  'undefined',
  'null',
];
for (const badId of nonExistentQueries) {
  const res = getVnuB3TopicById(badId);
  assert(res === undefined, `Returns undefined for invalid ID: "${badId}"`);
}

// ── TEST SUITE 5: SYSTEM PROMPT BUILDER (buildVnuB3ExaminerSystemPrompt) ──────
console.log('\n--- Suite 5: System Prompt Construction & Interpolation ---');

for (const topic of VNU_B3_AI_SPEAKING_TOPICS) {
  const prompt = buildVnuB3ExaminerSystemPrompt(topic);
  assert(typeof prompt === 'string' && prompt.length >= 200, `Prompt built for "${topic.id}" (${prompt.length} chars)`);

  // Ensure NO unwanted literal string interpolations of 'undefined' or 'null'
  const hasUndefined = prompt.includes('undefined');
  const hasNull = prompt.includes('null');
  assert(!hasUndefined, `Prompt for "${topic.id}" contains no "undefined" strings`);
  assert(!hasNull, `Prompt for "${topic.id}" contains no "null" strings`);

  // Verify key pedagogical examiner directives are present
  assert(prompt.includes('VNU Test Bậc 3 (CEFR B1)'), `Prompt includes VNU Bậc 3 exam framing`);
  assert(prompt.includes('Managing Hesitation & Silence') || prompt.includes('Hesitation'), `Prompt instructs AI on handling pauses/stutters`);
  assert(prompt.includes('Error Tolerance') || prompt.includes('slips'), `Prompt enforces lenient error tolerance`);
  assert(prompt.includes(topic.label), `Prompt interpolates topic label: "${topic.label}"`);
}

// ── TEST SUITE 6: ADVERSARIAL STRESS TESTING & FALLBACK BEHAVIOR ───────────────
console.log('\n--- Suite 6: Adversarial Fallback & Stress Testing ---');

// Fallback topic with minimal required fields (missing all optional fields)
const minimalTopic: AiSpeakingTopic = {
  id: 'minimal_mock_id',
  category: 'exam_prep',
  categoryLabelVi: 'Thi thử',
  level: 'B1',
  label: 'Minimal Topic Test',
  desc: 'Minimal Topic description for stress testing',
  icon: '🧪',
  initialGreeting: 'Hello minimal',
  suggestedStarters: ['Starter one'],
  keyVocabulary: ['vocab1'],
};

const minimalPrompt = buildVnuB3ExaminerSystemPrompt(minimalTopic);
assert(typeof minimalPrompt === 'string', 'Handles topic with NO optional fields gracefully');
assert(!minimalPrompt.includes('undefined'), 'Fallback contains NO "undefined" tokens');
assert(!minimalPrompt.includes('null'), 'Fallback contains NO "null" tokens');
assert(minimalPrompt.includes('Examiner'), 'Fallback uses default persona name "Examiner"');
assert(minimalPrompt.includes('VNU Testing Center'), 'Fallback uses default organization');

// Performance benchmark: 10,000 lookups + 1,000 prompt generations
const tStart = performance.now();
for (let i = 0; i < 10000; i++) {
  getVnuB3TopicById('vnu_b3_part1_sparring');
}
const lookupTimeMs = performance.now() - tStart;
assert(lookupTimeMs < 50, `10,000 lookups completed in < 50ms (Actual: ${lookupTimeMs.toFixed(2)}ms)`);

const pStart = performance.now();
for (let i = 0; i < 1000; i++) {
  buildVnuB3ExaminerSystemPrompt(VNU_B3_AI_SPEAKING_TOPICS[0]);
}
const promptTimeMs = performance.now() - pStart;
assert(promptTimeMs < 50, `1,000 prompt constructions completed in < 50ms (Actual: ${promptTimeMs.toFixed(2)}ms)`);

// ── FINAL SUMMARY ─────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(` RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
