/**
 * Unit tests — review-modes helpers (S1).
 * Run: node scripts/test-review-modes.mjs
 */
import { createRequire } from 'module';
import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

let mod;
try {
  // Try dynamic import (works directly if running via tsx or TS-aware loader)
  mod = await import(pathToFileURL(path.join(root, 'src/lib/review-modes.ts')).href);
} catch (e1) {
  // If running via plain node without tsconfig path mapping, re-exec via npx tsx
  if (!process.env.__TSX_SPAWNED__) {
    const { spawnSync } = await import('child_process');
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'npx.cmd' : 'npx';
    const res = spawnSync(cmd, ['tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
      stdio: 'inherit',
      env: { ...process.env, __TSX_SPAWNED__: '1' },
      shell: isWindows,
    });
    process.exit(res.status ?? 0);
  }
  console.error('[test-review-modes] Cannot import .ts — run with: npx tsx scripts/test-review-modes.mjs');
  console.error(String(e1?.message || e1));
  process.exit(2);
}

const {
  makeCloze,
  generateClozeCandidates,
  getWordInflections,
  pickItemMode,
  resultToQuality,
  buildWordChoices,
  verdictAndQuality,
  shuffle,
  HUB_MODES,
  stripEmbeddedVietnamese,
} = mod;

let passed = 0;
let failed = 0;
const fails = [];

function assert(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    fails.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\n[ReviewModes] unit tests\n');

// --- makeCloze & Morphology ---
console.log('makeCloze (basic & edge cases)');
{
  const c = makeCloze('She made a decision after the meeting.', 'decision');
  assert('blanks target word', c && c.stem.includes('___') && !c.stem.toLowerCase().includes('decision'));
  assert('answer is surface form', c && /decision/i.test(c.answer));
  assert('full preserved', c && c.full.includes('meeting'));
}
{
  const c = makeCloze('I DECIDE quickly.', 'decide');
  assert('case-insensitive match', c && c.stem.includes('___') && c.answer === 'DECIDE');
}
{
  const c = makeCloze('No match here.', 'decision');
  assert('fallback when no match', c && c.answer === 'decision' && c.stem === '___');
}
{
  const c = makeCloze('', 'hello');
  assert('empty example fallback', c && c.answer === 'hello');
}
{
  const c = makeCloze('foo', '');
  assert('empty word → null', c === null);
}
{
  const c = makeCloze('   ', '   ');
  assert('whitespace word → null', c === null);
}
{
  const c = makeCloze('Look up ice-cream now.', 'ice-cream');
  assert('hyphenated phrase', c && c.stem.includes('___') && c.answer === 'ice-cream');
}

console.log('\nmakeCloze (parentheses & morphological variants)');
{
  // Parentheses stripping: "balanced (diet)"
  const c1 = makeCloze('Eating a balanced diet is very important for your health.', 'balanced (diet)');
  assert('parentheses collocation: matches full phrase', c1 && c1.stem.includes('___') && c1.answer.toLowerCase() === 'balanced diet');
  assert('stem replaces balanced diet', c1 && c1.stem === 'Eating a ___ is very important for your health.');

  const c2 = makeCloze('He tries to maintain a balanced lifestyle.', 'balanced (diet)');
  assert('parentheses collocation: matches base word when phrase absent', c2 && c2.stem.includes('___') && c2.answer.toLowerCase() === 'balanced');
  assert('stem replaces balanced', c2 && c2.stem === 'He tries to maintain a ___ lifestyle.');

  const c3 = makeCloze('You should apply for the job immediately.', 'apply (for)');
  assert('parentheses particle: matches apply for', c3 && c3.answer.toLowerCase() === 'apply for');

  const c4 = makeCloze('Candidates must apply before Monday.', 'apply (for)');
  assert('parentheses particle: matches apply alone', c4 && c4.answer.toLowerCase() === 'apply');
}

{
  // Inflected verbs: -s, -es
  const c1 = makeCloze('She plans her entire schedule on Sunday.', 'plan');
  assert('verb inflection -s: plans', c1 && c1.answer === 'plans' && c1.stem === 'She ___ her entire schedule on Sunday.');

  const c2 = makeCloze('He watches news every morning.', 'watch');
  assert('verb inflection -es: watches', c2 && c2.answer === 'watches' && c2.stem === 'He ___ news every morning.');
}

{
  // Consonant doubling: planned, stopped
  const c1 = makeCloze('They planned the whole trip carefully.', 'plan');
  assert('consonant doubling -ed: planned', c1 && c1.answer === 'planned' && c1.stem === 'They ___ the whole trip carefully.');

  const c2 = makeCloze('The bus stopped at the corner.', 'stop');
  assert('consonant doubling -ed: stopped', c2 && c2.answer === 'stopped' && c2.stem === 'The bus ___ at the corner.');

  const c3 = makeCloze('She is planning a big party.', 'plan');
  assert('consonant doubling -ing: planning', c3 && c3.answer === 'planning' && c3.stem === 'She is ___ a big party.');

  const c4 = makeCloze('Stopping here is not allowed.', 'stop');
  assert('consonant doubling -ing with capital: Stopping', c4 && c4.answer === 'Stopping' && c4.stem === '___ here is not allowed.');
}

{
  // Regular past -ed / -d and gerund -ing
  const c1 = makeCloze('She decided to take the opportunity.', 'decide');
  assert('verb inflection -d: decided', c1 && c1.answer === 'decided' && c1.stem === 'She ___ to take the opportunity.');

  const c2 = makeCloze('He is studying architecture in Tokyo.', 'study');
  assert('verb inflection -ing: studying', c2 && c2.answer === 'studying' && c2.stem === 'He is ___ architecture in Tokyo.');
}

{
  // Plural nouns: -s, -ies
  const c1 = makeCloze('Several medical studies confirmed the diagnosis.', 'study');
  assert('noun plural -ies: studies', c1 && c1.answer === 'studies' && c1.stem === 'Several medical ___ confirmed the diagnosis.');

  const c2 = makeCloze('He bought several books at the store.', 'book');
  assert('noun plural -s: books', c2 && c2.answer === 'books' && c2.stem === 'He bought several ___ at the store.');
}

{
  // Phrasal verbs inflections: carry out -> carried out
  const c1 = makeCloze('The researchers carried out extensive testing.', 'carry out');
  assert('phrasal verb inflection: carried out', c1 && c1.answer === 'carried out' && c1.stem === 'The researchers ___ extensive testing.');
}

{
  // Reverse: database has inflected form, example uses base form
  const c1 = makeCloze('I plan to visit next week.', 'planned');
  assert('inflected lemma matches base in sentence', c1 && c1.answer === 'plan' && c1.stem === 'I ___ to visit next week.');
}

{
  // Irregular verbs: buy -> bought, see -> saw, speak -> spoke, take -> took, give -> gave, go -> went, grow -> grew
  const c1 = makeCloze('She bought a new laptop yesterday.', 'buy');
  assert('irregular verb past: buy -> bought', c1 && c1.answer === 'bought' && c1.stem === 'She ___ a new laptop yesterday.');

  const c2 = makeCloze('I saw him at the conference.', 'see');
  assert('irregular verb past: see -> saw', c2 && c2.answer === 'saw' && c2.stem === 'I ___ him at the conference.');

  const c3 = makeCloze('The professor spoke with great confidence.', 'speak');
  assert('irregular verb past: speak -> spoke', c3 && c3.answer === 'spoke' && c3.stem === 'The professor ___ with great confidence.');

  const c4 = makeCloze('She took a deep breath before speaking.', 'take');
  assert('irregular verb past: take -> took', c4 && c4.answer === 'took' && c4.stem === 'She ___ a deep breath before speaking.');

  const c5 = makeCloze('They went to the market in the morning.', 'go');
  assert('irregular verb past: go -> went', c5 && c5.answer === 'went' && c5.stem === 'They ___ to the market in the morning.');

  const c6 = makeCloze('The economy grew rapidly last year.', 'grow');
  assert('irregular verb past: grow -> grew', c6 && c6.answer === 'grew' && c6.stem === 'The economy ___ rapidly last year.');

  const c7 = makeCloze('I want to buy a new car.', 'bought');
  assert('reverse irregular verb: bought lemma matches buy in sentence', c7 && c7.answer === 'buy' && c7.stem === 'I want to ___ a new car.');
}

{
  // Irregular nouns: child -> children, person -> people, life -> lives, leaf -> leaves
  const c1 = makeCloze('The children are playing in the garden.', 'child');
  assert('irregular noun plural: child -> children', c1 && c1.answer === 'children' && c1.stem === 'The ___ are playing in the garden.');

  const c2 = makeCloze('Many people attended the festival.', 'person');
  assert('irregular noun plural: person -> people', c2 && c2.answer === 'people' && c2.stem === 'Many ___ attended the festival.');

  const c3 = makeCloze('They dedicated their lives to science.', 'life');
  assert('irregular noun plural: life -> lives', c3 && c3.answer === 'lives' && c3.stem === 'They dedicated their ___ to science.');

  const c4 = makeCloze('Every child should have access to books.', 'children');
  assert('reverse irregular noun: children lemma matches child in sentence', c4 && c4.answer === 'child' && c4.stem === 'Every ___ should have access to books.');
}

{
  // Idioms with one's / someone's / sb's pronoun placeholders
  const c1 = makeCloze('She made up her mind to study medicine.', "make up one's mind");
  assert("idiom with pronoun: make up one's mind -> made up her mind", c1 && c1.answer === 'made up her mind' && c1.stem === 'She ___ to study medicine.');

  const c2 = makeCloze('He lost his temper during the argument.', "lose one's temper");
  assert("idiom with pronoun: lose one's temper -> lost his temper", c2 && c2.answer === 'lost his temper' && c2.stem === 'He ___ during the argument.');

  const c3 = makeCloze('Students can learn at their own pace.', "at one's own pace");
  assert("idiom with pronoun: at one's own pace -> at their own pace", c3 && c3.answer === 'at their own pace' && c3.stem === 'Students can learn ___.');
}

{
  // Collocations with sb / sth / sb/sth placeholders
  const c1 = makeCloze('Never take for granted what you have.', 'take sb/sth for granted');
  assert('collocation placeholder: take sb/sth for granted -> take for granted', c1 && c1.answer === 'take for granted' && c1.stem === 'Never ___ what you have.');

  const c2 = makeCloze('We must take into account all factors.', 'take sth into account');
  assert('collocation placeholder: take sth into account -> take into account', c2 && c2.answer === 'take into account' && c2.stem === 'We must ___ all factors.');
}

{
  // Separable phrasal verbs with inserted pronouns
  const c1 = makeCloze("Don't forget to turn it off before leaving.", 'turn off');
  assert('separable phrasal verb: turn off -> turn it off', c1 && c1.answer === 'turn it off' && c1.stem === "Don't forget to ___ before leaving.");

  const c2 = makeCloze('She picked him up at the airport.', 'pick up');
  assert('separable phrasal verb: pick up -> picked him up', c2 && c2.answer === 'picked him up' && c2.stem === 'She ___ at the airport.');
}

{
  // Curly apostrophe vs straight apostrophe
  const c1 = makeCloze('They don’t understand the instructions.', "don't");
  assert('curly apostrophe tolerance: matches don’t in sentence with straight don\'t lemma', c1 && c1.answer === 'don’t' && c1.stem === 'They ___ understand the instructions.');
}

{
  // Slashes in headwords: "turn on/off"
  const c1 = makeCloze('Please turn off the air conditioner.', 'turn on/off');
  assert('slashed lemma: turn on/off matches turn off', c1 && c1.answer === 'turn off' && c1.stem === 'Please ___ the air conditioner.');
}

{
  // stripEmbeddedVietnamese does not truncate English sentences containing accented loanwords (café, résumé)
  const cleanCafe = stripEmbeddedVietnamese('He sat in a café for hours reading his book.');
  assert('stripEmbeddedVietnamese preserves café in English sentence', cleanCafe === 'He sat in a café for hours reading his book.');
}

// --- generateClozeCandidates ---
console.log('\ngenerateClozeCandidates helper');
{
  const candDiet = generateClozeCandidates('balanced (diet)');
  assert('generates balanced (diet)', candDiet.includes('balanced (diet)'));
  assert('generates balanced diet', candDiet.includes('balanced diet'));
  assert('generates balanced', candDiet.includes('balanced'));
  assert('longest candidate is first', candDiet[0].length >= candDiet[candDiet.length - 1].length);

  const candPlan = generateClozeCandidates('plan');
  assert('plan generates plans', candPlan.includes('plans'));
  assert('plan generates planned', candPlan.includes('planned'));
  assert('plan generates planning', candPlan.includes('planning'));

  const candBuy = generateClozeCandidates('buy');
  assert('buy generates bought', candBuy.includes('bought'));

  const candChild = generateClozeCandidates('child');
  assert('child generates children', candChild.includes('children'));
}

// --- buildWordChoices ---
console.log('\nbuildWordChoices');
{
  const pool = [
    { id: '1', word: 'decision', translation: 'quyết định' },
    { id: '2', word: 'apple', translation: 'táo' },
    { id: '3', word: 'run', translation: 'chạy' },
    { id: '4', word: 'happy', translation: 'vui' },
  ];
  const ch = buildWordChoices(pool[0], pool, 'word');
  assert('4 choices', ch.length === 4);
  assert('includes correct word', ch.includes('decision'));
  assert('unique enough', new Set(ch).size >= 3);
  const tr = buildWordChoices(pool[0], pool, 'translation');
  assert('translation field', tr.includes('quyết định'));
}

// --- resultToQuality ---
console.log('\nresultToQuality');
assert('MCQ correct → Good(4) not Easy', resultToQuality({ correct: true, itemMode: 'mcq_vi_en', elapsedMs: 500 }) === 4);
assert('cloze_mcq correct → 4', resultToQuality({ correct: true, itemMode: 'cloze_mcq', elapsedMs: 400 }) === 4);
assert('listen_mcq correct → 4', resultToQuality({ correct: true, itemMode: 'listen_mcq', elapsedMs: 400 }) === 4);
assert('type fast → Easy(5)', resultToQuality({ correct: true, itemMode: 'type_vi_en', elapsedMs: 1500 }) === 5);
assert('type slow → Good(4)', resultToQuality({ correct: true, itemMode: 'type_vi_en', elapsedMs: 5000 }) === 4);
assert('dictation fast → 5', resultToQuality({ correct: true, itemMode: 'listen_type', elapsedMs: 2000 }) === 5);
assert('wrong → 0', resultToQuality({ correct: false, itemMode: 'cloze_type' }) === 0);
assert('close → 3 Hard', resultToQuality({ correct: false, close: true, itemMode: 'type_vi_en' }) === 3);

// --- verdictAndQuality ---
console.log('\nverdictAndQuality');
{
  const r = verdictAndQuality('decision', 'decision', 'type_vi_en', 1000);
  assert('exact → correct + Easy', r.verdict === 'correct' && r.quality === 5);
}
{
  const r = verdictAndQuality('decisin', 'decision', 'type_vi_en', 4000);
  assert('typo ≤2 → close + Hard', r.verdict === 'close' && r.quality === 3);
}
{
  const r = verdictAndQuality('apple', 'decision', 'mcq_vi_en');
  assert('wrong → wrong + 0', r.verdict === 'wrong' && r.quality === 0);
}
{
  const r = verdictAndQuality('to', 'at', 'type_vi_en');
  assert('short word distance 2 → wrong', r.verdict === 'wrong' && r.quality === 0);
}
{
  const r = verdictAndQuality('book', 'boot', 'type_vi_en');
  assert('4-char typo distance 1 → close', r.verdict === 'close' && r.quality === 3);
}

// --- pickItemMode ---
console.log('\npickItemMode');
{
  const youngWithEx = { id: '1', word: 'decision', translation: 'quyết định', srsLevel: 0, example: 'She made a decision.' };
  const matureWithEx = { id: '2', word: 'decision', translation: 'quyết định', srsLevel: 5, example: 'She made a decision.' };
  const youngNoEx = { id: '3', word: 'apple', translation: 'táo', srsLevel: 0, example: '' };

  // 1. Young with example: cloze_mcq must be picked (~25-35%), NOT excluded!
  const youngPicks = [];
  for (let i = 0; i < 200; i++) {
    youngPicks.push(pickItemMode(youngWithEx, 'mixed', true));
  }
  const clozeMcqCount = youngPicks.filter((m) => m === 'cloze_mcq').length;
  const clozeMcqPct = (clozeMcqCount / youngPicks.length) * 100;
  assert('level 0 mixed with example picks cloze_mcq frequently (~20-40%)', clozeMcqPct >= 20 && clozeMcqPct <= 42, `${clozeMcqPct.toFixed(1)}%`);
  assert('level 0 does NOT pick cloze_type in mixed', !youngPicks.includes('cloze_type'));
  assert('level 0 includes recognition and typing modes', youngPicks.includes('mcq_vi_en') && youngPicks.includes('mcq_en_vi'));

  // 2. Young without example: no cloze modes, distributed among mcq/listen/type
  const noExPicks = [];
  for (let i = 0; i < 100; i++) {
    noExPicks.push(pickItemMode(youngNoEx, 'mixed', false));
  }
  assert('no-example excludes all cloze modes', !noExPicks.includes('cloze_mcq') && !noExPicks.includes('cloze_type'));
  assert('no-example picks mcq and listen', noExPicks.includes('mcq_vi_en') && noExPicks.includes('listen_mcq'));

  // 3. Mature with example: can pick cloze_type, listen_type, cloze_mcq
  const maturePicks = [];
  for (let i = 0; i < 200; i++) {
    maturePicks.push(pickItemMode(matureWithEx, 'mixed', true));
  }
  const clozeTypeCount = maturePicks.filter((m) => m === 'cloze_type').length;
  const clozeTypePct = (clozeTypeCount / maturePicks.length) * 100;
  assert('mature mixed picks cloze_type (~12-28%)', clozeTypePct >= 12 && clozeTypePct <= 28, `${clozeTypePct.toFixed(1)}%`);
  assert('mature mixed picks cloze_mcq', maturePicks.includes('cloze_mcq'));
  assert('mature mixed picks listen_type', maturePicks.includes('listen_type'));

  // 4. Anti-streak test: passing lastMode avoids immediate back-to-back repetitions
  let streakFails = 0;
  let prevMode;
  for (let i = 0; i < 100; i++) {
    const curMode = pickItemMode(matureWithEx, 'mixed', true, prevMode);
    if (prevMode && curMode === prevMode) {
      streakFails++;
    }
    prevMode = curMode;
  }
  assert('anti-streak: zero back-to-back duplicate modes when alternatives exist', streakFails === 0, `streakFails: ${streakFails}`);

  // 5. Anti-streak in 2-option session (mcq)
  let mcqStreakFails = 0;
  let prevMcq;
  for (let i = 0; i < 50; i++) {
    const curMcq = pickItemMode(youngWithEx, 'mcq', true, prevMcq);
    if (prevMcq && curMcq === prevMcq) {
      mcqStreakFails++;
    }
    prevMcq = curMcq;
  }
  assert('anti-streak in mcq mode alternates every card', mcqStreakFails === 0);

  // 6. Anti-streak accepts null explicitly
  const modeWithNull = pickItemMode(youngWithEx, 'mixed', true, null);
  assert('pickItemMode accepts lastMode as null without error', typeof modeWithNull === 'string');

  // 7. Explicit session modes
  assert('session cloze with ex → cloze_*', ['cloze_mcq', 'cloze_type'].includes(pickItemMode(matureWithEx, 'cloze', true)));
  assert('session cloze no ex fallback → type_vi_en', pickItemMode(youngNoEx, 'cloze', false) === 'type_vi_en');
  assert('session listen → listen_*', ['listen_mcq', 'listen_type'].includes(pickItemMode(matureWithEx, 'listen', true)));
  assert('session type → type_vi_en', pickItemMode(matureWithEx, 'type', true) === 'type_vi_en');
}

// --- shuffle / hub ---
console.log('\nmisc');
{
  const a = [1, 2, 3, 4, 5];
  const b = shuffle(a);
  assert('shuffle same length', b.length === 5);
  assert('shuffle not mutate orig', a[0] === 1 && a[4] === 5);
  assert('HUB has mixed highlight', HUB_MODES.some((m) => m.id === 'mixed' && m.highlight));
  assert('HUB has cloze+listen+flash', ['cloze', 'listen', 'flash', 'mcq', 'type'].every((id) =>
    HUB_MODES.some((m) => m.id === id)));
}

console.log(`\n[ReviewModes] ${passed} passed, ${failed} failed\n`);
if (failed) {
  console.error('FAILURES:\n' + fails.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('ALL PASS');
process.exit(0);
