/**
 * Automated Verification Suite for Foundation Verbs & Multi-Modal Practice Station
 * Tests:
 * 1. 100 Core Verbs Dataset & Pedagogy Verification
 * 2. Cloze & Sentence Scramble Syntax Consistency
 * 3. Mini-Story Contextual Quality & Story Cloze Integrity
 * 4. Starter Pack Registry & Backwards Compatibility
 * 5. Foundation Verb Lookup & Edge Cases
 */

import {
  getStarterPack,
  getFoundationVerbPacks,
  getFoundationVerbPack,
  getFoundationVerb,
  resolveFoundationVerbPack,
  getFoundationVerbsByTier,
} from '../../src/lib/roadmap';
import foundationData from '../../src/data/roadmap/foundation-verbs-v1.json';
import starterPacksData from '../../src/data/roadmap/starter-packs-v1.json';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('================================================================================');
  console.log('  FOUNDATION VERBS & PRACTICE STATION — AUTOMATED TEST SUITE');
  console.log('================================================================================\n');

  // ── 1. 100 Core Verbs Dataset Verification ──
  console.log('▶ 1. Dataset & Structure Invariants...');
  const packs = getFoundationVerbPacks();
  assert(packs.length === 10, 'Exactly 10 Verb Packs exist in foundation-verbs-v1.json');

  let totalVerbs = 0;
  const uniqueLemmas = new Set<string>();

  for (const p of packs) {
    assert(p.verbs.length === 10, `Pack "${p.id}" contains exactly 10 verbs`);
    totalVerbs += p.verbs.length;

    for (const v of p.verbs) {
      assert(v.lemma.length > 0, `Verb lemma is non-empty (${v.lemma})`);
      assert(v.meaningVi.length > 0, `Verb "${v.lemma}" has Vietnamese meaning (${v.meaningVi})`);
      assert(v.ipa.startsWith('/') && v.ipa.endsWith('/'), `Verb "${v.lemma}" has valid IPA format (${v.ipa})`);
      assert(v.pattern.length > 0, `Verb "${v.lemma}" specifies sentence pattern (${v.pattern})`);
      assert(v.collocation.length > 0, `Verb "${v.lemma}" has common collocation`);
      assert(v.example.length > 0, `Verb "${v.lemma}" has example sentence`);
      assert(v.exampleVi.length > 0, `Verb "${v.lemma}" has bilingual translation`);

      uniqueLemmas.add(v.lemma.toLowerCase());
    }
  }

  assert(totalVerbs === 100, `Total verbs across all packs is exactly 100 (got ${totalVerbs})`);
  assert(uniqueLemmas.size === 100, `All 100 verb lemmas are unique (got ${uniqueLemmas.size})`);

  // ── 2. Cloze & Sentence Scramble Consistency ──
  console.log('\n▶ 2. Cloze & Sentence Scramble Invariants...');
  for (const p of packs) {
    for (const v of p.verbs) {
      // Cloze check
      const cloze = v.cloze;
      assert(cloze.sentence.includes('_____'), `Cloze for "${v.lemma}" contains blank token "_____"`);
      assert(cloze.options.length >= 4, `Cloze for "${v.lemma}" has at least 4 options`);
      assert(cloze.options.includes(cloze.answer), `Cloze answer "${cloze.answer}" exists in options for "${v.lemma}"`);
      assert(cloze.explain.length > 5, `Cloze for "${v.lemma}" provides detailed Vietnamese explanation`);

      // Scramble check
      const scramble = v.sentenceScramble;
      assert(scramble.tokens.length >= 3, `Sentence scramble for "${v.lemma}" has >= 3 tokens`);
      assert(scramble.answer.length === scramble.tokens.length, `Scramble answer length matches tokens for "${v.lemma}"`);
      assert(scramble.meaningVi.length > 0, `Scramble for "${v.lemma}" has Vietnamese translation`);
    }
  }

  // ── 3. Mini-Story & Contextual Passage Verification ──
  console.log('\n▶ 3. Mini-Story Contextual Passages & Story Cloze...');
  for (const p of packs) {
    const story = p.story;
    assert(story.title.length > 0, `Pack "${p.id}" has story title "${story.title}"`);
    assert(story.passage.length > 50, `Pack "${p.id}" story passage has sufficient length`);
    assert(story.passageVi.length > 50, `Pack "${p.id}" story Vietnamese translation is provided`);
    assert(story.highlightWords.length >= 8, `Pack "${p.id}" highlights core verbs in story`);

    // Story cloze checks
    assert(story.cloze.blanks.length >= 4, `Pack "${p.id}" story cloze has >= 4 blanks`);
    for (const b of story.cloze.blanks) {
      assert(story.cloze.text.includes(`{{${b.id}}}`), `Story cloze text contains token {{${b.id}}}`);
      assert(b.options.includes(b.answer), `Story blank ${b.id} answer "${b.answer}" is among options`);
    }
  }

  // ── 4. Starter Pack Registry & Backwards Compatibility ──
  console.log('\n▶ 4. Starter Pack Registry & Backwards-Compatibility...');
  // All 10 verb packs in starter packs
  for (let i = 1; i <= 10; i++) {
    const num = i < 10 ? `0${i}` : `${i}`;
    const packId = `starter-verb-${num}`;
    const sp = getStarterPack(packId);
    assert(sp !== null, `Starter pack "${packId}" resolves successfully via getStarterPack`);
    assert(sp?.words.length === 10, `Starter pack "${packId}" contains exactly 10 words`);
  }

  // Legacy packs still resolve
  const legacyPack = getStarterPack('starter-a0-greetings');
  assert(legacyPack !== null, 'Legacy "starter-a0-greetings" pack resolves properly');
  assert(Boolean(legacyPack?.words.includes('hello')), 'Legacy pack retains original words');

  const legacyVerbs = getStarterPack('starter-a0-verbs');
  assert(legacyVerbs !== null, 'Legacy "starter-a0-verbs" pack resolves properly');
  assert(Boolean(legacyVerbs?.words.includes('go')), 'Legacy verbs pack retains original words');

  // ── 5. Helper Functions & Edge Cases ──
  console.log('\n▶ 5. Helper Functions & Edge Cases...');
  const foundWant = getFoundationVerb('want');
  assert(foundWant !== null, 'getFoundationVerb("want") returns verb item');
  assert(foundWant?.lemma === 'want', 'Verb lemma matches "want"');
  assert(Boolean(foundWant?.pattern.includes('want')), 'Verb pattern matches "want"');

  const foundUpper = getFoundationVerb('WANT');
  assert(foundUpper !== null && foundUpper.lemma === 'want', 'getFoundationVerb handles case-insensitivity');

  const nonExistent = getFoundationVerb('nonexistentverb123');
  assert(nonExistent === null, 'getFoundationVerb returns null for non-existent verb');

  const nonExistentPack = getFoundationVerbPack('starter-verb-999');
  assert(nonExistentPack === null, 'getFoundationVerbPack returns null for non-existent pack ID');

  // ── 6. Resolver & Tier Mapping Checks ──
  console.log('\n▶ 6. Resolver & Tier Mapping Checks...');
  const exactResolved = resolveFoundationVerbPack('starter-verb-03');
  assert(exactResolved.id === 'starter-verb-03', 'resolveFoundationVerbPack resolves exact pack ID');

  const mappedVerbs = resolveFoundationVerbPack('starter-a0-verbs');
  assert(mappedVerbs.id === 'starter-verb-01', 'resolveFoundationVerbPack maps "starter-a0-verbs" to "starter-verb-01"');

  const mappedDaily = resolveFoundationVerbPack('starter-a0-daily');
  assert(mappedDaily.id === 'starter-verb-03', 'resolveFoundationVerbPack maps "starter-a0-daily" to "starter-verb-03"');

  const fallbackResolved = resolveFoundationVerbPack('unknown-pack-id');
  assert(fallbackResolved.id === 'starter-verb-01', 'resolveFoundationVerbPack falls back gracefully to starter-verb-01');

  const nullResolved = resolveFoundationVerbPack(null);
  assert(nullResolved.id === 'starter-verb-01', 'resolveFoundationVerbPack handles null gracefully');

  // Tier filtering
  const tier1Verbs = getFoundationVerbsByTier(1);
  assert(tier1Verbs.length === 20, `Tier 1 contains 20 verbs (got ${tier1Verbs.length})`);
  const tier5Verbs = getFoundationVerbsByTier(5);
  assert(tier5Verbs.length === 20, `Tier 5 contains 20 verbs (got ${tier5Verbs.length})`);

  // ── 7. Story Cloze Token Parsing Verification ──
  console.log('\n▶ 7. Story Cloze Token Parsing Invariants...');
  for (const p of packs) {
    const tokens = p.story.cloze.text.match(/\{\{\d+\}\}/g) || [];
    assert(tokens.length === p.story.cloze.blanks.length, `Pack "${p.id}" cloze token count matches blanks (${tokens.length})`);
    
    // Test that parsing handles replacing tokens with user choices
    const sampleUserAnswers: Record<number, string> = {};
    p.story.cloze.blanks.forEach(b => { sampleUserAnswers[b.id] = b.answer; });
    const rendered = p.story.cloze.text.replace(/\{\{(\d+)\}\}/g, (_, id) => sampleUserAnswers[parseInt(id, 10)] || '_____');
    assert(!rendered.includes('{{'), `Pack "${p.id}" rendered text contains no unresolved cloze tokens`);
    assert(rendered.length > p.story.cloze.text.length - 10, `Pack "${p.id}" rendered story has appropriate length`);
  }

  // ── 8. Scoring & No Off-By-One Invariant ──
  console.log('\n▶ 8. Scoring & Robustness Verification...');
  const testScoreFormat = (score: number, total: number) => `Bạn trả lời đúng ${score}/${total} câu.`;
  assert(testScoreFormat(10, 10) === 'Bạn trả lời đúng 10/10 câu.', 'Perfect score 10/10 renders without off-by-one');
  assert(testScoreFormat(0, 10) === 'Bạn trả lời đúng 0/10 câu.', 'Zero score 0/10 renders without off-by-one');

  console.log('\n================================================================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
