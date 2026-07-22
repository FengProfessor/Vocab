/**
 * Round-2 quiz upgrade: refill residual weak/polluted banks after P0 hotfix.
 * Targets: modals-perfect, mixed-conditionals, subjunctive, wish-if-only (+ optional inversion purge)
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

const BANKS = {
  'modals-perfect': [
    mcq("The lights are off — she ___ left already.", ['must have', 'must', 'should', 'can'], 'must have', 'suy đoán chắc QK: must have + V3', 'must'),
    mcq("He looks fresh — he ___ slept well.", ['must have', "can't have", 'should', 'might'], 'must have', 'looks fresh → must have + V3', 'must_fresh'),
    fill('You ___ have told me the truth. (should/must)', ['should', 'must', 'can'], 'should', 'lẽ ra đã: should have + V3', 'should'),
    err("Find the error: She must has gone home.", ['She must have gone home.', 'She must has go home.', 'She must gone home.'], 'She must have gone home.', 'modal + have (not has) + V3', 'form'),
    tf('"You should have studied" criticises a past action that did not happen (enough).', true, 'should have = regret/criticism of past', 'should_tf'),
    mcq('I am not sure — he ___ forgotten the meeting.', ['might have', 'must', 'should', 'can'], 'might have', 'có lẽ đã: might have + V3', 'might'),
    fill("You ___ have bought so much food — we already had some. (needn't/mustn't)", ["needn't", "mustn't", 'should'], "needn't", "needn't have = did it but unnecessary", 'neednt'),
    mcq('With more time, we ___ finished earlier.', ['could have', 'must have', 'should', 'can'], 'could have', 'đã có thể (nhưng không): could have + V3', 'could'),
    err("Find the error: He should had studied more.", ['He should have studied more.', 'He should had study more.', 'He should has studied more.'], 'He should have studied more.', 'should have + V3', 'form2'),
    tf("\"You needn't have come\" means you came, but it was not necessary.", true, "needn't have = action happened unnecessarily", 'neednt_tf'),
    mcq("She failed — she ___ prepared enough.", ["can't have", 'must have', 'should', 'will have'], "can't have", "can't have + V3 for strong negative deduction", 'cant2'),
    fill('They ___ have arrived by now — the roads are empty. (must/might)', ['must', 'might', 'should'], 'must', 'must have (strong deduction)', 'must2'),
    mcq("I'm angry you didn't call — you ___ me!", ['should have called', 'should call', 'must call', 'could call'], 'should have called', 'should have + V3', 'should2'),
    err("Find the error: It must rained last night — the ground is wet.", ['It must have rained last night — the ground is wet.', 'It must rain last night — the ground is wet.', 'It must has rained last night — the ground is wet.'], 'It must have rained last night — the ground is wet.', 'must have + V3', 'rain'),
    tf('"Could have + V3" can mean a past ability/opportunity that was not used.', true, 'could have = missed opportunity', 'could_tf'),
    mcq("He ___ stolen the money — he was with me all day.", ["can't have", 'must have', 'should have', 'will have'], "can't have", "impossible deduction", 'cant3'),
    fill("You ___ have been more careful. (should/must)", ['should', 'must', 'can'], 'should', 'criticism', 'should3'),
    mcq('She is late — she ___ missed the bus.', ['might have', 'must to have', 'should', 'can'], 'might have', 'weak past deduction', 'might2'),
    err("Find the error: You mustn't have bought bread — we already had some. (meaning: unnecessary purchase)", ["You needn't have bought bread — we already had some.", "You mustn't buy bread — we already had some.", "You don't have to bought bread — we already had some."], "You needn't have bought bread — we already had some.", "unnecessary past action → needn't have (not mustn't have)", 'neednt_vs'),
    tf('After a modal of deduction about the past, we use have + past participle.', true, 'modal + have + V3', 'form_tf'),
  ],

  'mixed-conditionals': [
    mcq('If I had studied medicine, I ___ a doctor now.', ['would be', 'would have been', 'will be', 'am'], 'would be', 'QK khác → kết quả HT: would + V1', 'a'),
    mcq("If I weren't afraid of flying, I ___ to Japan last year.", ['would have gone', 'would go', 'went', 'go'], 'would have gone', 'HT trait → kết quả QK: would have + V3', 'b'),
    fill('If she had taken that job, she ___ in London now. (would live / would have lived)', ['would live', 'would have lived', 'lived'], 'would live', 'mixed A', 'a2'),
    err('Find the error: If I would have saved money, I would own a house now.', ['If I had saved money, I would own a house now.', 'If I would have saved money, I would have owned a house now.', 'If I saved money, I would own a house now.'], 'If I had saved money, I would own a house now.', 'if-clause mixed A = had + V3', 'a_err'),
    tf('Mixed conditionals combine different time frames in the if-clause and the result clause.', true, 'def', 'def'),
    mcq("If he were more careful, he ___ yesterday.", ["wouldn't have crashed", "wouldn't crash", "didn't crash", "won't crash"], "wouldn't have crashed", 'mixed B', 'b2'),
    fill("If I ___ the lottery last year, I would be rich now. (had won / won / win)", ['had won', 'won', 'win'], 'had won', 'mixed A if = past perfect', 'a3'),
    mcq('If I knew her number, I ___ her last night.', ['would have called', 'would call', 'called', 'will call'], 'would have called', 'unreal present habit/state → past result', 'b3'),
    err('Find the error: If I am rich, I would have bought that car.', ['If I were rich, I would have bought that car.', 'If I am rich, I will have bought that car.', 'If I had been rich, I buy that car.'], 'If I were rich, I would have bought that car.', 'mixed B needs past in if-clause', 'b_err'),
    tf('Type: If + Past Perfect, would + V1 → past condition, present result.', true, 'mixed A form', 'form_a'),
    mcq("If we hadn't missed the train, we ___ there now.", ['would be', 'would have been', 'are', 'will be'], 'would be', 'past condition → present result', 'a4'),
    fill("If she ___ so busy, she would have come to the party. (weren't / isn't / hadn't been)", ["weren't", "isn't", "hadn't been"], "weren't", 'present state → past result (mixed B)', 'b4'),
    mcq('If I had listened to you, I ___ in this mess now.', ["wouldn't be", "wouldn't have been", "won't be", "am not"], "wouldn't be", 'mixed A negative result present', 'a5'),
    err('Find the error: If I had studied, I would have been a doctor now.', ['If I had studied, I would be a doctor now.', 'If I studied, I would have been a doctor now.', 'If I would study, I would be a doctor now.'], 'If I had studied, I would be a doctor now.', 'present result uses would + V1 not would have', 'a_err2'),
    tf('Type: If + Past Simple, would have + V3 → present/unreal condition, past result.', true, 'mixed B form', 'form_b'),
    mcq('If the company paid better, she ___ last year.', ["wouldn't have left", "wouldn't leave", "didn't leave", "won't leave"], "wouldn't have left", 'mixed B', 'b5'),
    fill('If I had known about the traffic, I ___ earlier. Wait — for PRESENT result use: I ___ stuck now. (would leave / would be)', ['would be', 'would leave', 'would have been'], 'would be', 'present result after past condition', 'a6'),
    mcq("If I didn't have to work today, I ___ with you yesterday.", ['would have gone', 'would go', 'went', 'go'], 'would have gone', 'present obligation → past missed action', 'b6'),
    err('Find the error: If I had won, I would have a mansion now. (intended present possession)', ['If I had won, I would have a mansion now. is OK if have=own', 'If I had won, I would had a mansion now.', 'If I won, I would have had a mansion now.'], 'If I had won, I would have a mansion now. is OK if have=own', 'have as main verb OK with would', 'note'),
    // replace problematic item with cleaner one:
    mcq('If I had won the lottery, I ___ a mansion now.', ['would own', 'would have owned', 'owned', 'had'], 'would own', 'mixed A: would + V1', 'a7'),
    tf('"If I had known, I would tell you now" is a possible mixed form (past condition, present result).', true, 'mixed A', 'tf2'),
  ],

  subjunctive: [
    mcq('I suggest that he ___ the form today.', ['complete', 'completes', 'completed', 'to complete'], 'complete', 'suggest that + bare V1', 'suggest'),
    mcq('It is essential that every student ___ on time.', ['be', 'is', 'are', 'being'], 'be', 'It is essential that + bare be', 'essential'),
    fill('They demanded that she ___ the room. (leave/leaves)', ['leave', 'leaves', 'left'], 'leave', 'demand that + V1', 'demand'),
    err('Find the error: I recommend that she applies now.', ['I recommend that she apply now.', 'I recommend that she applies now. (AmE informal often OK but exam prefers apply)', 'I recommend her to apply now.'], 'I recommend that she apply now.', 'mandative subjunctive: bare apply', 'rec'),
    tf('In formal English, after "suggest/demand/insist that", we often use the base form for all subjects.', true, 'mandative subjunctive', 'def'),
    mcq('The law requires that each applicant ___ a passport.', ['submit', 'submits', 'submitted', 'to submit'], 'submit', 'require that + V1', 'req'),
    fill('It is important that he ___ present. (be/is)', ['be', 'is', 'was'], 'be', 'important that + be', 'imp'),
    mcq('She insisted that the meeting ___ postponed.', ['be', 'is', 'was', 'been'], 'be', 'insist that + be + V3 passive', 'insist'),
    err('Find the error: They suggested him to go home.', ['They suggested that he go home. / They suggested going home.', 'They suggested him going home.', 'They suggested that he goes home only.'], 'They suggested that he go home. / They suggested going home.', 'suggest ≠ O + to V', 'pat'),
    tf('"If I were you" uses were for all persons in formal/subjunctive style.', true, 'were subjunctive', 'were'),
    mcq('I wish I ___ taller.', ['were', 'am', 'was being', 'be'], 'were', 'wish + past subjunctive', 'wish'),
    fill('The manager asked that the report ___ ready by Friday. (be/is)', ['be', 'is'], 'be', 'ask that + be', 'ask'),
    mcq('It is vital that no one ___ the secret.', ['reveal', 'reveals', 'revealed', 'to reveal'], 'reveal', 'vital that + V1', 'vital'),
    err('Find the error: It is necessary that she is careful.', ['It is necessary that she be careful.', 'It is necessary that she are careful.', 'It is necessary she careful.'], 'It is necessary that she be careful.', 'necessary that + bare be', 'nec'),
    tf('British English often uses "should + V1" instead of the bare subjunctive.', true, 'BrE should', 'bre'),
    mcq('He acts as if he ___ the boss.', ['were', 'is', 'be', 'was being'], 'were', 'as if + unreal past', 'asif'),
    fill("The judge ordered that the prisoner ___ released. (be/is)", ['be', 'is'], 'be', 'order that + be', 'order'),
    mcq('We proposed that the rule ___.', ['be changed', 'is changed', 'changes', 'changed'], 'be changed', 'propose that + passive subjunctive', 'prop'),
    err('Find the error: I suggest that he studies harder. (formal exam key)', ['I suggest that he study harder.', 'I suggest that he studies harder is only informal.', 'I suggest he to study harder.'], 'I suggest that he study harder.', 'exam prefers bare study', 'exam'),
    tf('The present subjunctive uses the base form (no -s) for he/she/it.', true, 'no -s', 'nos'),
  ],

  'wish-if-only': [
    mcq('I wish I ___ more free time.', ['had', 'have', 'will have', 'am having'], 'had', 'wish + past for present unreal', 'pres'),
    mcq('I wish I ___ harder at school.', ['had studied', 'studied', 'study', 'have studied'], 'had studied', 'wish + past perfect for past regret', 'past'),
    fill('I wish you ___ make so much noise. (would/will)', ['would', 'will', 'can'], 'would', 'wish + would = complaint/want change', 'would'),
    err('Find the error: I wish I am rich.', ['I wish I were rich. / I wish I was rich.', 'I wish I am rich still.', 'I wish I be rich.'], 'I wish I were rich. / I wish I was rich.', 'wish + past', 'am'),
    tf('"If only" is stronger/more emotional than "I wish" but similar grammar.', true, 'if only ≈ wish', 'ifonly'),
    mcq('If only I ___ her number yesterday.', ['had known', 'knew', 'know', 'have known'], 'had known', 'if only + past perfect', 'pp'),
    fill('I wish I ___ speak Japanese. (could/can)', ['could', 'can', 'will'], 'could', 'wish + could', 'could'),
    mcq('She wishes it ___ raining.', ['would stop', 'stops', 'will stop', 'stopped raining only without would'], 'would stop', 'wish + would for future change', 'stop'),
    err('Find the error: I wish you will listen to me.', ['I wish you would listen to me.', 'I wish you will listen to me still.', 'I wish you listen to me.'], 'I wish you would listen to me.', 'not will after wish', 'will'),
    tf('We do not normally use "wish + will".', true, 'use would/past', 'nowill'),
    mcq('I wish I ___ at home now.', ['were', 'am', 'be', 'will be'], 'were', 'wish + were', 'were'),
    fill('If only we ___ more time last week. (had had / had)', ['had had', 'had', 'have'], 'had had', 'past regret', 'hadhad'),
    mcq("He wishes he ___ the truth earlier.", ["had told", 'told', 'tells', 'has told'], 'had told', 'past regret', 'told'),
    err('Find the error: I hope I were taller.', ['I wish I were taller. / I hope to be taller.', 'I hope I were taller is correct wish grammar.', 'I hope I was being taller.'], 'I wish I were taller. / I hope to be taller.', 'hope ≠ wish unreal', 'hope'),
    tf('"I wish I had gone" refers to a past situation we regret.', true, 'wish + PP', 'regret'),
    mcq('I wish it ___ summer all year.', ['were', 'is', 'be', 'will be'], 'were', 'unreal present', 'sum'),
    fill("She wishes her neighbours ___ quieter. (were/are)", ['were', 'are'], 'were', 'wish + past', 'nei'),
    mcq("If only it ___ so cold today.", ["weren't", "isn't", "won't be", "hadn't been only for past"], "weren't", 'if only + past', 'cold'),
    err('Find the error: I wish I studied yesterday. (intended: regret about yesterday)', ['I wish I had studied yesterday.', 'I wish I studied yesterday is OK for present habit only.', 'I wish I have studied yesterday.'], 'I wish I had studied yesterday.', 'past time marker → past perfect', 'yst'),
    tf('After wish, "were" is preferred to "was" in formal English for all subjects.', true, 'formal were', 'formal'),
  ],
};

// Fix the awkward mixed-conditionals item that says answer is OK
BANKS['mixed-conditionals'] = BANKS['mixed-conditionals'].filter(
  (e) => !String(e.q || '').includes('is OK if have=own'),
);

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = Object.keys(BANKS);
const { data: topics } = await sb.from('grammar_topics').select('id,slug').in('slug', slugs);
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
  const bank = BANKS[slug];
  if (!bank) continue;
  const { error } = await sb.from('grammar_lessons').update({ exercises: bank }).eq('id', L.id);
  if (error) throw error;
  await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  report.push({ slug, n: bank.length });
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/upgrade-quiz-round2.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
