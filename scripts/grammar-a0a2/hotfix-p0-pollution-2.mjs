/**
 * Purge remaining pollution after main P0 hotfix.
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
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });

const replacements = {
  subjunctive: {
    test: (q) => /tooths|footes|wifes|two men|potatoes|watches →|childs|two foots/i.test(q),
    pool: [
      mcq(
        'I suggest that he ___ harder.',
        ['study', 'studies', 'studied', 'to study'],
        'study',
        'mandative subjunctive bare V1',
        'mand',
      ),
      err(
        'Find the error: It is important that she is present.',
        [
          'It is important that she be present.',
          'It is important that she are present.',
          'It is important she is present.',
        ],
        'It is important that she be present.',
        'essential that + bare be',
        'be',
      ),
      fill(
        'They demanded that the report ___ finished today. (be/is)',
        ['be', 'is', 'was'],
        'be',
        'demand that + be',
        'demand',
      ),
    ],
  },
  'relative-clauses': {
    test: (q) =>
      /Could you to|Would you like holding|Can I asking|Would you mind/i.test(q),
    pool: [
      err(
        'Find the error: The man which lives next door is a doctor.',
        [
          'The man who lives next door is a doctor.',
          'The man what lives next door is a doctor.',
          'The man lives next door is a doctor.',
        ],
        'The man who lives next door is a doctor.',
        'people → who/that',
        'who',
      ),
      err(
        'Find the error: My father, that is 50, is a teacher.',
        [
          'My father, who is 50, is a teacher.',
          'My father that is 50 is a teacher.',
          'My father, which is 50, is a teacher.',
        ],
        'My father, who is 50, is a teacher.',
        'non-defining: who not that',
        'nondef',
      ),
      err(
        'Find the error: The girl who her phone is ringing…',
        [
          'The girl whose phone is ringing…',
          'The girl who phone is ringing…',
          'The girl which phone is ringing…',
        ],
        'The girl whose phone is ringing…',
        'whose = possession',
        'whose',
      ),
    ],
  },
  'modals-perfect': {
    test: (q) => {
      const hasBleed =
        /Lest he|suggest that he|demand that|It is essential that|I wish I were|Suppose he were/i.test(
          q,
        );
      const hasPerfect =
        /must have|should have|might have|could have|can't have|needn't have|have \+ V3|have left|have told/i.test(
          q,
        );
      return hasBleed && !hasPerfect;
    },
    pool: [
      mcq(
        'She left her bag — she ___ forgotten it.',
        ['must have', 'must', 'should', 'can'],
        'must have',
        'must have + V3',
        'must',
      ),
      fill(
        'You ___ have told me earlier. (should/must)',
        ['should', 'must', 'can'],
        'should',
        'should have + V3',
        'should',
      ),
      err(
        "Find the error: He must has left already.",
        [
          'He must have left already.',
          'He must has leave already.',
          'He must left already.',
        ],
        'He must have left already.',
        'modal + have + V3',
        'form',
      ),
    ],
  },
};

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const slugs = Object.keys(replacements);
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
  const conf = replacements[slug];
  let pi = 0;
  let n = 0;
  const next = (L.exercises || []).map((e) => {
    const q = String(e.q || e.question || '');
    if (conf.test(q)) {
      const rep = conf.pool[pi % conf.pool.length];
      pi++;
      n++;
      return rep;
    }
    return e;
  });
  if (n) {
    await sb.from('grammar_lessons').update({ exercises: next }).eq('id', L.id);
    await sb.from('grammar_quiz_cache').delete().eq('lesson_id', L.id);
  }
  report.push({ slug, replaced: n });
}

fs.writeFileSync('tmp/hotfix-p0-pollution-2.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
