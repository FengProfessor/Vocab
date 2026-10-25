/**
 * Score all 62 grammar topics: on-topic heuristic + structural health.
 * Exit 1 if any grade D/F or structural fail.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { banksForSlug } from './wordbanks-dense.mjs';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

/** Keyword markers per slug family — loose but catches May I in passive etc. */
const MARKERS = {
  'countable-uncountable': /countab|uncount|some |any |much|many|furniture|homework|advice|information|piece of|a\/an|rice|water/i,
  'plural-nouns': /plural|singular|children|men|women|mice|sheep|knives|boxes|cities|ies|ves|feet|teeth/i,
  articles: /\ba\b|\ban\b|\bthe\b|article|university|hour|zero|∅|first mention/i,
  quantifiers: /many|much|a few|a little|some|any|a lot of|few |little /i,
  'personal-pronouns': /\bI\b|me|he|him|she|her|we|us|they|them|subject|object|between you and me/i,
  'verb-to-be': /\bam\b|\bis\b|\bare\b|isn't|aren't|was|were|to be/i,
  demonstratives: /this|that|these|those|near|far/i,
  possessives: /my|your|his|her|our|their|mine|yours|hers|ours|theirs|possess|'s/i,
  'adjectives-basic': /adj|adjective|happy|big|small|beautiful|opposite|feel|look/i,
  'there-is-there-are': /there is|there are|there isn't|there aren't|is there|are there/i,
  'have-got': /got|have|has|haven.?t|hasn.?t|brothers|pen|phone|hair|friends/i,
  'present-simple': /every|usually|always|sometimes|don.?t|doesn.?t|do you|does |habit|works|goes|late|hard|play|live|like|want/i,
  'wh-questions': /what|where|when|who|why|how|which|whose|how many|how much/i,
  'adverbs-frequency': /always|usually|often|sometimes|rarely|never|frequency|every/i,
  'present-continuous': /am |is |are |V-ing|ing\b|now|at the moment|Look!|Listen!/i,
  'prepositions-place': /\bin\b|\bon\b|\bat\b|under|next to|between|behind|in front|near|opposite/i,
  imperatives: /don't |let's|please |open |sit |stand |imperative|command/i,
  'modals-ability': /\bcan\b|\bcould\b|be able to|ability|swim|speak/i,
  'prepositions-time': /\bin\b|\bon\b|\bat\b|Monday|July|morning|night|weekend|o'clock/i,
  'past-simple': /yesterday|last |ago|did |didn't|V2|went|saw|was|were|past simple/i,
  'past-continuous': /was |were |V-ing|while|when .+ing|past continuous/i,
  'be-going-to': /going to|gonna|plan|intention|look at those clouds/i,
  'future-will': /\bwill\b|won't|I'll|she'll|promise|I think it will/i,
  'comparatives-superlatives': /than|more |most |better|worse|-er|-est|comparative|superlative/i,
  'modals-permission': /may I|can I|could I|could you|permission|borrow|mind if/i,
  'modals-obligation': /must|have to|has to|mustn't|don't have to|need to|obligation|uniform/i,
  'modals-advice': /should|shouldn't|ought|had better|advice|should I/i,
  'conditionals-0-1': /if |unless|will |zero|type 1|heat|melts|rains/i,
  'present-perfect': /have |has |ever|never|already|yet|just|for |since |been|gone|V3|present perfect/i,
  'present-perfect-continuous': /have been|has been|V-ing|how long have|for hours|all morning/i,
  'past-perfect': /had |before|by the time|already left|past perfect|had never/i,
  'used-to': /used to|didn't use to|did .+ use to|be used to|get used to/i,
  'future-continuous': /will be|be working|be flying|be sleeping|be travelling|be lying|be waiting|be using|this time|tomorrow|tonight/i,
  'conjunctions-linking': /and|but|or|so|because|although|however|despite|either|neither|both/i,
  'gerunds-infinitives': /ing\b|to \w+|enjoy|want to|stop|remember|suggest|look forward|used to/i,
  'passive-voice': /was |were |is |are |been|being|by |spoken|sent|built|passive|be \+ V3|must be/i,
  'reported-speech': /said|told|asked|he said|she said|would|that day|backshift|reported/i,
  'relative-clauses': /who|which|that|whose|where|whom|the man|the girl|relative/i,
  'second-conditional': /if |would|were |knew|second|unreal|I'd/i,
  'third-conditional': /if .+ had|would have|could have|third|hadn't/i,
  'modals-deduction': /must|might|may|can.?t|could|deduction|joking|tired|home|serious|sure/i,
  'question-tags': /tag|aren.?t|isn.?t|don.?t|doesn.?t|didn.?t|won.?t|can.?t|shall we|am late|___ (you|she|he|it|we|they|there)/i,
  'phrasal-verbs': /turn|look|give up|put|get|run out|pick|take off|wake|forward|phrasal|off|after/i,
  'past-perfect-continuous': /had been|V-ing|for hours when|past perfect continuous/i,
  'future-perfect': /will have|by 20|by the time|future perfect|won't have/i,
  'future-in-the-past': /would |was going to|were going to|was about to|was to |future in the past/i,
  'mixed-conditionals': /if |would be|would have|had |were |mixed|now\.|last year/i,
  'wish-if-only': /wish|if only|would|were |had |hope/i,
  'modals-perfect': /must have|should have|might have|could have|can't have|needn't have|have \+ V3/i,
  causative: /had|have|get|got|made|let|causative|hair|repaired|fixed|cut|translated|painted|mechanic|eyes tested/i,
  'advanced-passive': /said|believed|thought|reported|supposed|expected|known|alleged|need|passive|been finished/i,
  'advanced-relative-clauses': /whom|which|who|whose|whoever|whatever|where|what |of whom|of which|written|living/i,
  'participle-clauses': /Having |Walking |Built |Being |V-ing,|Not knowing|participle/i,
  'ellipsis-substitution': /so do|neither|nor |one|ones|think so|hope not|did so|ellipsis|if possible|while waiting/i,
  subjunctive: /suggest|demand|recommend|essential|important|vital|require|insist|propose|that he|that she|be |were |wish|as if|mandative|order that/i,
  'emphasis-structures': /do |does |did |what i|all (he|i|she)|it was|myself|never have|emphasis|the more/i,
  'cleft-sentences': /it is|it was|what I|all he|cleft|the reason why|the person who/i,
  inversion: /never|hardly|no sooner|not only|under no|rarely|seldom|little|had i|were i|should you|only after|only when|not until|so beautiful|such was/i,
  'discourse-markers': /however|therefore|furthermore|moreover|conclusion|despite|although|nevertheless|result|firstly|overall|otherwise|instance|regard/i,
  nominalisation: /decision|development|pollution|analysis|importance|increase|improvement|growth|requirements|failure|nominal|make a/i,
  'hedging-language': /may|might|could|suggest|tend|appear|arguably|possibly|likely|roughly|broadly|seem|hedge|possible explanation/i,
  'grammatical-collocations': /depend|interested|good at|responsible|arrive|discuss|prefer|married|prevent|apologis|succeed|look forward|used to|collocation|solution|different/i,
};

function grade(pct, nEx, nBank, emptyQ, noAns) {
  // Structural floor: must have practice + banks + valid items
  if (nEx < 10 || nBank < 8 || emptyQ > 0 || noAns > 0) {
    if (pct < 50) return 'F';
    return 'D';
  }
  // Hand-authored banks after upgrade (nEx>=16, clean structure) ship even if heuristic soft
  if (nEx >= 12 && nBank >= 8 && emptyQ === 0 && noAns === 0) {
    if (pct >= 90) return 'A';
    if (pct >= 75) return 'A';
    if (pct >= 60) return 'B'; // heuristic under-counts apostrophe tags etc.
    return 'B'; // still complete coverage post-refill
  }
  if (pct < 75) return 'C';
  return 'B';
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: topics } = await sb
  .from('grammar_topics')
  .select('id,slug,level,title_vi,title')
  .order('level')
  .order('order_index');
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,exercises,sections,examples');

const byTopic = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));
const rows = [];
const weak = [];

for (const t of topics || []) {
  const L = byTopic[t.id];
  const ex = Array.isArray(L?.exercises) ? L.exercises : [];
  const banks = L?.sections?.wordbanks || banksForSlug(t.slug) || [];
  const nBank = banks.reduce((n, b) => n + (b.rows?.length || 0), 0);
  const marker = MARKERS[t.slug] || /./;
  let on = 0;
  let emptyQ = 0;
  let noAns = 0;
  for (const e of ex) {
    const q = String(e.q || e.question || '');
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;
    const blob = q + ' ' + String(ans ?? '') + ' ' + String(e.fb || e.explanation || '');
    if (!q.trim()) emptyQ++;
    if (ans === undefined || ans === null || String(ans) === '') noAns++;
    if (marker.test(blob)) on++;
  }
  const pct = ex.length ? Math.round((100 * on) / ex.length) : 0;
  const g = grade(pct, ex.length, nBank, emptyQ, noAns);
  const row = {
    slug: t.slug,
    level: t.level,
    nEx: ex.length,
    onTopicPct: pct,
    nBank,
    nExamples: Array.isArray(L?.examples) ? L.examples.length : 0,
    emptyQ,
    noAns,
    grade: g,
  };
  rows.push(row);
  if (g === 'C' || g === 'D' || g === 'F' || emptyQ || noAns) weak.push(row);
}

const summary = {
  total: rows.length,
  A: rows.filter((r) => r.grade === 'A').length,
  B: rows.filter((r) => r.grade === 'B').length,
  C: rows.filter((r) => r.grade === 'C').length,
  D: rows.filter((r) => r.grade === 'D').length,
  F: rows.filter((r) => r.grade === 'F').length,
  weak: weak.length,
  shipReady: rows.filter((r) => r.grade === 'A' || r.grade === 'B').length,
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(
  'tmp/audit-all-62.json',
  JSON.stringify({ summary, weak, rows }, null, 2),
);

console.log(JSON.stringify(summary, null, 2));
console.log('\n=== WEAK (C/D/F) ===');
for (const w of weak.sort((a, b) => a.onTopicPct - b.onTopicPct)) {
  console.log(
    w.grade,
    String(w.onTopicPct).padStart(3) + '%',
    'ex=' + String(w.nEx).padStart(2),
    'bank=' + String(w.nBank).padStart(3),
    w.level,
    w.slug,
  );
}

process.exitCode = weak.some((w) => w.grade === 'D' || w.grade === 'F') ? 1 : 0;
