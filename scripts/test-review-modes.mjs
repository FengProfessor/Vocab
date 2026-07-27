/**
 * Unit tests — review-modes helpers (S1).
 * Run: node scripts/test-review-modes.mjs
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Prefer compiled-ish load via tsx if available; else inline reimplementation check
// Dynamic import of .ts needs tsx — fallback: spawn is external. Use require of built logic.

let mod;
try {
  // Try dynamic import with experimental TypeScript (Node 22+)
  mod = await import(pathToFileURL(path.join(root, 'src/lib/review-modes.ts')).href);
} catch (e1) {
  try {
    const { register } = await import('node:module');
    // fallback path
    throw e1;
  } catch {
    console.error('[test-review-modes] Cannot import .ts — run with: npx tsx scripts/test-review-modes.ts');
    console.error(String(e1?.message || e1));
    process.exit(2);
  }
}

const {
  makeCloze,
  pickItemMode,
  resultToQuality,
  buildWordChoices,
  verdictAndQuality,
  shuffle,
  HUB_MODES,
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

// --- makeCloze ---
console.log('makeCloze');
{
  const c = makeCloze('She made a decision after the meeting.', 'decision');
  assert('blanks target word', c && c.stem.includes('___') && !c.stem.toLowerCase().includes('decision'));
  assert('answer is surface form', c && /decision/i.test(c.answer));
  assert('full preserved', c && c.full.includes('meeting'));
}
{
  const c = makeCloze('I DECIDE quickly.', 'decide');
  assert('case-insensitive match', c && c.stem.includes('___'));
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
  const c = makeCloze('Look up ice-cream now.', 'ice-cream');
  assert('hyphenated phrase', c && c.stem.includes('___'));
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

// --- pickItemMode ---
console.log('\npickItemMode');
{
  const young = { id: '1', word: 'a', translation: 'b', srsLevel: 0, example: 'I have a book.' };
  const mature = { id: '2', word: 'decision', translation: 'qd', srsLevel: 5, example: 'She made a decision.' };
  const modes = new Set();
  for (let i = 0; i < 40; i++) modes.add(pickItemMode(young, 'mixed', true));
  assert('young mixed stays recognition-ish', [...modes].every((m) =>
    ['mcq_vi_en', 'mcq_en_vi', 'listen_mcq'].includes(m)));
  const m2 = new Set();
  for (let i = 0; i < 60; i++) m2.add(pickItemMode(mature, 'mixed', true));
  assert('mature can pick production', [...m2].some((m) =>
    ['cloze_type', 'listen_type', 'type_vi_en', 'cloze_mcq'].includes(m)));
  assert('session cloze → cloze_*', ['cloze_mcq', 'cloze_type', 'type_vi_en'].includes(pickItemMode(mature, 'cloze', true)));
  assert('session listen → listen_*', ['listen_mcq', 'listen_type'].includes(pickItemMode(mature, 'listen', true)));
  assert('session type → type_vi_en', pickItemMode(mature, 'type', true) === 'type_vi_en');
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
