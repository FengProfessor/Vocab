/**
 * Re-audit easy P0: mixed There is/are residual + wrong key #10,
 * subjunctive plural residual, relative modal residual.
 * Cap ~15 replacements.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

const mcq = (q, opts, answer, fb, case_id) => ({ type: 'mcq', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });
const tf = (q, answer, fb, case_id) => ({ type: 'tf', q, answer, fb, case_id });

const MIXED_POOL = [
  mcq(
    'If I had saved more money, I ___ a house now.',
    ['would own', 'would have owned', 'owned', 'will own'],
    'would own',
    'mixed 3â†’2: past condition â†’ present result',
    'm32',
  ),
  mcq(
    "If I weren't afraid of flying, I ___ to Japan last year.",
    ['would have gone', 'would go', 'went', 'go'],
    'would have gone',
    'mixed 2â†’3: present trait â†’ past result',
    'm23',
  ),
  fill(
    'If she had taken the job, she ___ in Singapore now. (might live / might have lived)',
    ['might live', 'might have lived', 'lived'],
    'might live',
    'mixed 3â†’2 + modal',
    'm32',
  ),
  tf(
    'Mixed conditionals combine different time references in the if-clause and the result clause.',
    true,
    'def',
    'def',
  ),
  err(
    'Find the error: If I am rich, I would have bought it last year.',
    [
      'If I were rich, I would have bought it last year.',
      'If I am rich, I will have bought it last year.',
      'If I had been rich, I buy it last year.',
    ],
    'If I were rich, I would have bought it last year.',
    'mixed 2â†’3: if + past (were)',
    'm23',
  ),
  mcq(
    "If he were more careful, he ___ the car yesterday.",
    ["wouldn't have crashed", "wouldn't crash", "didn't crash", "won't crash"],
    "wouldn't have crashed",
    'mixed 2â†’3',
    'm23',
  ),
  fill(
    'If they had left earlier, they ___ stuck in traffic now. (would not be / would not have been)',
    ['would not be', 'would not have been', 'are not'],
    'would not be',
    'mixed 3â†’2 present result',
    'm32',
  ),
  mcq(
    'I would speak better English now if I ___ abroad as a child.',
    ['had lived', 'lived', 'would live', 'live'],
    'had lived',
    'mixed 3â†’2: past condition',
    'm32',
  ),
  err(
    'Find the error: If she studied medicine, she would have become a doctor last year â€” wait, present habit + past result needs were/past: If she were a doctorâ€¦',
    [
      'If she had studied medicine, she would be a doctor now.',
      'If she studies medicine, she would be a doctor now.',
      'If she study medicine, she would be a doctor now.',
    ],
    'If she had studied medicine, she would be a doctor now.',
    'classic mixed 3â†’2',
    'm32',
  ),
  tf(
    '"If I had known, I would help you now" is a valid mixed conditional (past â†’ present).',
    true,
    'would + V1 for present result',
    'ok',
  ),
];

const SUBJ_POOL = [
  mcq(
    'It is vital that every employee ___ on time.',
    ['be', 'is', 'are', 'being'],
    'be',
    'mandative: vital that + bare be',
    'be',
  ),
  fill(
    'The judge insisted that the witness ___ the truth. (tell/tells)',
    ['tell', 'tells', 'told'],
    'tell',
    'insist that + bare V1',
    'insist',
  ),
  err(
    'Find the error: They recommended that she applies again.',
    [
      'They recommended that she apply again.',
      'They recommended that she applies again next year only.',
      'They recommended she to apply again.',
    ],
    'They recommended that she apply again.',
    'recommend that + bare V1',
    'rec',
  ),
  mcq(
    'I wish it ___ Friday today.',
    ['were', 'is', 'be', 'was being'],
    'were',
    'wish + past subjunctive were',
    'wish',
  ),
];

const REL_POOL = [
  err(
    'Find the error: The book who I borrowed is lost.',
    [
      'The book which/that I borrowed is lost.',
      'The book who I borrowed is lost still.',
      'The book whose I borrowed is lost.',
    ],
    'The book which/that I borrowed is lost.',
    'things â†’ which/that not who',
    'which',
  ),
  err(
    'Find the error: London, that is the capital of the UK, is huge.',
    [
      'London, which is the capital of the UK, is huge.',
      'London that is the capital of the UK is huge.',
      'London, who is the capital of the UK, is huge.',
    ],
    'London, which is the capital of the UK, is huge.',
    'non-defining: which not that',
    'nondef',
  ),
];

function isTherePollution(q) {
  const s = String(q || '');
  // blanked or full There is/are drills (not mixed if-clauses)
  if (/\bif\b/i.test(s)) return false;
  if (/\bthere\b/i.test(s) && /\b(is|are|any|a |an |not any|five people|money|clouds|apples|chairs|dog|computer|information|problems|bus)\b/i.test(s))
    return true;
  if (/^Choose the correct form:\s*___ there/i.test(s)) return true;
  if (/Fill in the blank:\s*(There|___ there)/i.test(s)) return true;
  if (/Find the error:\s*(Is|Are) there/i.test(s)) return true;
  return false;
}

function isPluralPollution(q) {
  return /\(watch\)|\(potato\)|\(man\)|\(mouse\)|two ___ \(watch\)|three ___ \(potato\)/i.test(
    String(q || ''),
  );
}

function isRelativeModalPollution(q) {
  return /Do you mind if I taking|Could you please to pass|Would you mind|Can I asking|Could you to/i.test(
    String(q || ''),
  );
}

function isMixedBadKey(q, ans) {
  // "If I had studied harder, I __ a better grade." + would get without "now"
  return (
    /If I had studied harder,\s*I\s*__+\s*a better grade/i.test(String(q || '')) &&
    String(ans) === 'would get'
  );
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const TARGETS = ['mixed-conditionals', 'subjunctive', 'relative-clauses'];

const { data: topics } = await sb.from('grammar_topics').select('id,slug').in('slug', TARGETS);
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,exercises')
  .in(
    'topic_id',
    topics.map((t) => t.id),
  );
const slugBy = Object.fromEntries(topics.map((t) => [t.id, t.slug]));
const report = [];
let totalFixes = 0;

for (const L of lessons) {
  const slug = slugBy[L.topic_id];
  let list = Array.isArray(L.exercises) ? [...L.exercises] : [];
  const changes = [];
  let poolIdx = 0;

  if (slug === 'mixed-conditionals') {
    const next = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const q = e.q || e.question || '';
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;

      if (isTherePollution(q)) {
        const rep = MIXED_POOL[poolIdx % MIXED_POOL.length];
        poolIdx++;
        next.push(rep);
        changes.push(`#${i} There-pollution â†’ mixed on-topic`);
        totalFixes++;
        continue;
      }
      if (isMixedBadKey(q, ans)) {
        next.push(
          fill(
            'If I had studied harder, I ___ a better grade. (would have got / would get / got)',
            ['would have got', 'would get', 'got', 'will get'],
            'would have got',
            'past condition + past result â†’ type 3: would have + V3 (not mixed without "now")',
            't3',
          ),
        );
        changes.push(`#${i} would get â†’ would have got (type 3)`);
        totalFixes++;
        continue;
      }
      next.push(e);
    }
    // ensure density â‰¥ 16 on-topic after ops
    list = next;
    if (list.length < 16) {
      const need = 16 - list.length;
      for (let k = 0; k < need; k++) {
        list.push(MIXED_POOL[(poolIdx + k) % MIXED_POOL.length]);
        changes.push(`top-up +1`);
        totalFixes++;
      }
    }
  }

  if (slug === 'subjunctive') {
    let pi = 0;
    list = list.map((e, i) => {
      const q = e.q || e.question || '';
      if (isPluralPollution(q)) {
        const rep = SUBJ_POOL[pi % SUBJ_POOL.length];
        pi++;
        changes.push(`#${i} plural pollution â†’ subjunctive`);
        totalFixes++;
        return rep;
      }
      return e;
    });
  }

  if (slug === 'relative-clauses') {
    let pi = 0;
    list = list.map((e, i) => {
      const q = e.q || e.question || '';
      if (isRelativeModalPollution(q)) {
        const rep = REL_POOL[pi % REL_POOL.length];
        pi++;
        changes.push(`#${i} modal pollution â†’ relative`);
        totalFixes++;
        return rep;
      }
      return e;
    });
  }

  if (!changes.length) {
    report.push({ slug, n: list.length, changes: ['none'] });
    continue;
  }

  const { error } = await sb.from('grammar_lessons').update({ exercises: list }).eq('id', L.id);
  if (error) throw error;
  await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  report.push({ slug, n: list.length, changes });
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(
  'tmp/hotfix-reaudit-p0.json',
  JSON.stringify({ totalFixes, report }, null, 2),
);
console.log(JSON.stringify({ totalFixes, report }, null, 2));
