/**
 * Hotfix P0 quiz keys + purge pollution (teacher audit 2026-07-22).
 * Report-only was FAIL; this writes DB exercises for FAIL slugs.
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

/** Full on-topic refill banks for heavily polluted lessons */
const REFILLS = {
  'passive-voice': [
    mcq('English ___ spoken in many countries.', ['is', 'are', 'be', 'been'], 'is', 'HTĐ passive: is/are + V3', 'pres'),
    mcq('The letter ___ yesterday.', ['was sent', 'sent', 'is send', 'was send'], 'was sent', 'QKĐ passive: was + V3', 'past'),
    mcq('The room is ___ cleaned every day.', ['being', 'been', 'be', 'is'], 'being', 'continous passive: is being + V3', 'cont'),
    fill('The work has ___ finished. (been/be)', ['been', 'be', 'being'], 'been', 'PP passive: has been + V3', 'pp'),
    mcq('This report must ___ carefully.', ['be checked', 'check', 'checked', 'to check'], 'be checked', 'modal + be + V3', 'modal'),
    err('Find the error: The cake was ate by the children.', ['The cake was eaten by the children.', 'The cake ate by the children.', 'The cake was eat by the children.'], 'The cake was eaten by the children.', 'V3 = eaten', 'v3'),
    tf('In "The window was broken", we do not always need "by someone".', true, 'agent optional', 'agent'),
    mcq('A new hospital ___ next year.', ['will be built', 'will build', 'is build', 'builds'], 'will be built', 'will be + V3', 'fut'),
    fill('Rice ___ grown in this region. (is/are)', ['is', 'are'], 'is', 'U subject → is', 'agr'),
    mcq('The documents ___ to the manager.', ['were given', 'gave', 'was gave', 'given'], 'were given', 'plural + QKĐ passive', 'past'),
    err('Find the error: English spoken here.', ['English is spoken here.', 'English are spoken here.', 'English speaks here.'], 'English is spoken here.', 'thiếu be', 'be'),
    tf('"The house is being painted" is Present Continuous passive.', true, 'is being + V3', 'cont'),
    mcq('Who ___ this book written by?', ['was', 'did', 'has', 'is being'], 'was', 'passive question: was + V3 + by', 'q'),
    fill('The problem can ___ solved. (be/been)', ['be', 'been', 'being'], 'be', 'can be + V3', 'modal'),
    mcq('My bike ___ last night.', ['was stolen', 'stole', 'has steal', 'was stole'], 'was stolen', 'QKĐ passive', 'past'),
    err('Find the error: The work has cleaned already.', ['The work has been cleaned already.', 'The work cleaned already.', 'The work has clean already.'], 'The work has been cleaned already.', 'have been + V3', 'pp'),
    tf('Active: "They build houses." → Passive: "Houses are built."', true, 'HTĐ passive', 'map'),
    mcq('The results ___ tomorrow.', ['will be announced', 'will announce', 'are announce', 'announce'], 'will be announced', 'future passive', 'fut'),
    fill('He is said ___ be very rich. (to/for)', ['to', 'for', 'of'], 'to', 'is said to + V1', 'adv'),
    mcq('The windows need ___.', ['cleaning / to be cleaned', 'clean', 'cleaned only without be', 'to cleaning'], 'cleaning / to be cleaned', 'need + V-ing = need to be V3', 'need'),
  ],

  'second-conditional': [
    mcq('If I ___ rich, I would travel the world.', ['were', 'am', 'will be', 'was being'], 'were', 'loại 2: If + past; formal were', 'were'),
    mcq('If she studied harder, she ___ pass.', ['would', 'will', 'would have', 'passes'], 'would', 'would + V1', 'would'),
    fill('If I ___ you, I would apologise. (were/was/am)', ['were', 'was', 'am'], 'were', 'If I were you', 'were'),
    err('Find the error: If I will be free, I would call you.', ['If I were free, I would call you.', 'If I will free, I would call you.', 'If I am free, I would call you.'], 'If I were free, I would call you.', 'no will in if-clause type 2', 'will'),
    tf('Second conditional talks about unreal or unlikely present/future situations.', true, 'unreal present', 'def'),
    mcq('If we ___ a car, we could go now.', ['had', 'have', 'will have', 'has'], 'had', 'If + past', 'had'),
    fill("If he didn't live so far, we ___ meet more often. (would/will)", ['would', 'will', 'would have'], 'would', 'would + V1', 'would'),
    mcq('What would you do if you ___ the lottery?', ['won', 'win', 'will win', 'had won'], 'won', 'If + V2', 'v2'),
    err('Find the error: If I knew, I will tell you.', ['If I knew, I would tell you.', 'If I know, I will tell you.', 'If I had known, I will tell you.'], 'If I knew, I would tell you.', 'main clause would', 'mix'),
    tf('"If I was you" is more formal than "If I were you".', false, 'were is the formal/subjunctive form preferred in exams', 'was'),
    mcq("If she weren't busy, she ___ come.", ['would', 'will', 'comes', 'would have'], 'would', 'negative if + would', 'neg'),
    fill('If I spoke Japanese, I ___ work in Tokyo. (could/can)', ['could', 'can', 'will'], 'could', 'could = would be able to', 'could'),
    mcq('If it ___ so expensive, I would buy it.', ["weren't", "isn't", "won't be", "hadn't been"], "weren't", 'unreal present', 'neg'),
    err('Find the error: If I would have more time, I would help.', ['If I had more time, I would help.', 'If I would have more time, I will help.', 'If I have more time, I would help.'], 'If I had more time, I would help.', 'no would in if-clause type 2', 'would_if'),
    tf('We use would + base verb in the result clause of the second conditional.', true, 'would + V1', 'form'),
    mcq('If they invited me, I ___ go.', ["would", "will", "would have", "go"], 'would', 'would + V1', 'would'),
    fill('If I ___ the answer, I would tell you. (knew/know/had known)', ['knew', 'know', 'had known'], 'knew', 'type 2 past simple', 'v2'),
    mcq("I'd rather you ___ here.", ['stayed', 'stay', 'would stay', 'had stayed'], 'stayed', "I'd rather + past (related unreal)", 'rather'),
    tf('Type 1 uses will; type 2 uses would for a less real situation.', true, '1 vs 2', 'cmp'),
    mcq('If the weather ___ better, we would eat outside.', ['were', 'is', 'will be', 'had been'], 'were', 'If + past', 'were'),
  ],
};

function patchExercises(slug, exercises) {
  let list = Array.isArray(exercises) ? [...exercises] : [];
  let changes = [];

  if (REFILLS[slug]) {
    changes.push(`refill full bank (${REFILLS[slug].length})`);
    return { exercises: REFILLS[slug], changes };
  }

  list = list.map((e, i) => {
    const q = String(e.q || e.question || '');
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;
    const type = e.type;

    // present-perfect: remove/replace wrong "find error" on correct PP
    if (slug === 'present-perfect' && type === 'error') {
      if (/I have eaten a sandwich/i.test(q) && !/recently/i.test(q)) {
        changes.push(`#${i} replace PP-correct→PS with I have saw`);
        return err(
          "Find the error: I have saw that movie.",
          ['I have seen that movie.', 'I have see that movie.', 'I sawed that movie.'],
          'I have seen that movie.',
          'PP needs V3: seen',
          'v3',
        );
      }
      if (/I have gone to the store/i.test(q) && !/recently/i.test(q)) {
        changes.push(`#${i} replace PP-correct with finished yesterday`);
        return err(
          'Find the error: I have finished my homework yesterday.',
          ['I finished my homework yesterday.', 'I have finish my homework yesterday.', 'I has finished my homework yesterday.'],
          'I finished my homework yesterday.',
          'yesterday → Past Simple, not PP',
          'time',
        );
      }
      if (/I have eaten a sandwich recently/i.test(q)) {
        changes.push(`#${i} replace recently PP-correct with she have gone`);
        return err(
          'Find the error: She have gone to school.',
          ['She has gone to school.', 'She have go to school.', 'She has go to school.'],
          'She has gone to school.',
          'she → has',
          'has',
        );
      }
      if (/I have gone to the store recently/i.test(q)) {
        changes.push(`#${i} replace with did you ever`);
        return err(
          'Find the error: Did you ever go to Japan? (life experience)',
          ['Have you ever been to Japan?', 'Did you ever went to Japan?', 'Have you ever go to Japan?'],
          'Have you ever been to Japan?',
          'ever experience → Present Perfect',
          'ever',
        );
      }
    }

    // present-simple always late
    if (slug === 'present-simple' && /always late/i.test(q) && /work/i.test(q)) {
      changes.push(`#${i} always late → is`);
      return mcq('She ___ always late.', ['is', 'works', 'work', 'are'], 'is', 'be + adj: is late', 'be');
    }

    // modals-obligation double to
    if (slug === 'modals-obligation') {
      if (/You ___ to wear a uniform/i.test(q)) {
        changes.push(`#${i} remove double to stem`);
        return fill(
          'You ___ wear a uniform at school. (have to / must / can)',
          ['have to', 'must', 'can', 'should to'],
          'have to',
          'have to + V1 (no second to)',
          'have_to',
        );
      }
      if (/must to arrive early/i.test(q) && String(ans) === 'must') {
        changes.push(`#${i} error key must → to`);
        return {
          ...e,
          answer: 'to',
          opts: ['to', 'must', 'arrive', 'and'],
          options: ['to', 'must', 'arrive', 'and'],
          fb: 'must + V1 — remove extra to',
        };
      }
    }

    // mixed-conditionals
    if (slug === 'mixed-conditionals') {
      if (/If I had won the lottery/i.test(q)) {
        changes.push(`#${i} lottery ans had → would buy`);
        return fill(
          'If I had won the lottery, I ___ a mansion now. (would buy / would have bought / bought)',
          ['would buy', 'would have bought', 'bought', 'had'],
          'would buy',
          'mixed: past condition → present result = would + V1',
          'mixed_a',
        );
      }
      if (/If he were taller, he would have joined/i.test(q)) {
        changes.push(`#${i} correct mixed marked wrong → replace`);
        return err(
          'Find the error: If I would have studied, I would be a doctor now.',
          [
            'If I had studied, I would be a doctor now.',
            'If I would have studied, I would have been a doctor now.',
            'If I studied, I would be a doctor now.',
          ],
          'If I had studied, I would be a doctor now.',
          'mixed A: if + had + V3, not would have',
          'mixed_fix',
        );
      }
      // purge There is/are pollution
      if (/there is|there are|there isn't|there aren't/i.test(q) && !/if /i.test(q)) {
        changes.push(`#${i} drop There is/are pollution`);
        return null;
      }
    }

    // inversion empty error
    if (slug === 'inversion' && type === 'error' && /^Find the error:\s*$/i.test(q.trim())) {
      changes.push(`#${i} empty error q`);
      return err(
        'Find the error: Never I have seen such a mess.',
        ['Never have I seen such a mess.', 'Never I saw such a mess.', 'Never I have saw such a mess.'],
        'Never have I seen such a mess.',
        'negative adverb → invert aux + subject',
        'inv',
      );
    }

    return e;
  });

  list = list.filter(Boolean);

  // top up mixed-conditionals if too few after purge
  if (slug === 'mixed-conditionals' && list.length < 12) {
    const extra = [
      mcq('If I had saved more money, I ___ a house now.', ['would own', 'would have owned', 'owned', 'will own'], 'would own', 'QK → HT result', 'a'),
      mcq("If I weren't afraid of flying, I ___ to Japan last year.", ['would have gone', 'would go', 'went', 'go'], 'would have gone', 'HT trait → QK result', 'b'),
      fill('If she had taken the job, she ___ in Singapore now. (might live / might have lived)', ['might live', 'might have lived', 'lived'], 'might live', 'mixed A + might', 'a'),
      tf('Mixed conditionals combine different time references in if-clause and result.', true, 'def', 'def'),
      err(
        'Find the error: If I am rich, I would have bought it.',
        ['If I were rich, I would have bought it.', 'If I am rich, I will have bought it.', 'If I had been rich, I buy it.'],
        'If I were rich, I would have bought it.',
        'mixed B: if + past',
        'b',
      ),
      mcq("If he were more careful, he ___ the car yesterday.", ["wouldn't have crashed", "wouldn't crash", "didn't crash", "won't crash"], "wouldn't have crashed", 'mixed B', 'b'),
    ];
    list = [...list, ...extra];
    changes.push(`top-up mixed +${extra.length}`);
  }

  return { exercises: list, changes };
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TARGETS = [
  'present-perfect',
  'modals-obligation',
  'present-simple',
  'inversion',
  'mixed-conditionals',
  'passive-voice',
  'second-conditional',
];

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

for (const L of lessons) {
  const slug = slugBy[L.topic_id];
  const { exercises, changes } = patchExercises(slug, L.exercises);
  if (!changes.length) {
    report.push({ slug, changes: ['no match — manual review'], n: exercises.length });
    continue;
  }
  const { error } = await sb.from('grammar_lessons').update({ exercises }).eq('id', L.id);
  if (error) throw error;
  await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  report.push({ slug, changes, n: exercises.length });
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/hotfix-p0-quiz-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
