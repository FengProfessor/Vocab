/**
 * Deep logic pass on A0–A2 core + any TF "is correct" + error stems.
 * Writes actionable fix list + applies with --apply.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
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

const CORE = new Set([
  'verb-to-be',
  'personal-pronouns',
  'possessives',
  'articles',
  'plural-nouns',
  'there-is-there-are',
  'demonstratives',
  'present-simple',
  'present-continuous',
  'past-simple',
  'past-continuous',
  'present-perfect',
  'countable-uncountable',
  'quantifiers',
  'have-got',
  'adjectives-basic',
  'adverbs-frequency',
  'prepositions-time',
  'prepositions-place',
  'wh-questions',
  'question-tags',
  'modals-ability',
  'modals-obligation',
  'future-will',
  'be-going-to',
  'comparatives-superlatives',
  'gerunds-infinitives',
  'conditionals-0-1',
  'second-conditional',
  'third-conditional',
  'passive-voice',
  'reported-speech',
  'used-to',
  'wish-if-only',
]);

function strip(s) {
  return String(s || '')
    .replace(/^["“'‘]+|["”'’]+$/g, '')
    .trim();
}
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** wrong English fingerprints — high confidence */
const WRONG = [
  [/they (is|isn't|is not)\b/i, 'they_is'],
  [/\b(we|you) (is|isn't)\b/i, 'we_you_is'],
  [/\b(he|she|it) (are|aren't|am)\b/i, 'sg_are'],
  [/\b(tom|anna|mary|john) (are|am)\b/i, 'name_are'],
  // bare "I is/are" at start only — NOT "Sara and I are"
  [/^(i is|i are)\b/i, 'i_is_start'],
  [/\beveryone are\b/i, 'everyone_are'],
  [/\b(me|him|them|us) (am|is|are)\b/i, 'obj_subj'],
  [/\b(he|she|it|tom|they|we|you|i) not (is|are|am|was|were)\b/i, 'wo_not'],
  [/\b(mine|yours|hers|ours|theirs) (pen|bag|jacket|book|room|bike|car|box)\b/i, 'poss_n'],
  [/\b(her's|your's|our's|their's)\b/i, 'fake_poss'],
  [/\bit's (tail|name|color|colour|bone|food)\b/i, 'its_wrong'],
  [/\btheir is (a|an)\b/i, 'their_is'],
  [/\btoms (bike|car|book|bag)\b/i, 'toms'],
  [/\ban (book|pen|cat|dog|university|one|table)\b/i, 'an_cons'],
  [/\ba (apple|egg|orange|hour|umbrella|elephant|idea|honest)\b/i, 'a_vowel'],
  [/\b(an information|a furniture|a advice|a news)\b/i, 'uncount_a'],
  [/\b(furnitures|informations|advices|homeworks)\b/i, 'uncount_s'],
  [/\bthere is (many|two|three|four|five)\b/i, 'there_is_pl'],
  [/\bthere are (a|an) /i, 'there_are_sg'],
  [/\b(he|she|it|tom) (work|live|play|like|go|want|need) (here|every|in|to|hard)\b/i, 'ps_agr'],
  [/\bdoesn't (goes|works|likes|lives|plays|has)\b/i, 'doesnt_vs'],
  [/\bdidn't (went|was|were|had|saw|ate|bought|did)\b/i, 'didnt_v2'],
  [/\bdo he\b/i, 'do_he'],
  [/\bdoes (he|she) (lives|works|likes|goes)\b/i, 'does_vs'],
  [/\bwas play\b|\bwere play\b/i, 'was_play'],
  [/\bhas been work\b/i, 'been_work'],
  [/\b(have|has) (saw|went|ate|catched|wrote)\b/i, 'pp_wrong_v3'],
  [/\b(goed|buyed|catched|teached)\b/i, 'irreg'],
  [/\bi am knowing\b|\bi am wanting\b/i, 'stative'],
  [/\blooking forward to meet\b/i, 'lf_meet'],
  [/\binterested on\b|\bcapable to\b|\bbehind of\b/i, 'colloc'],
  [/\bborn at \d{4}\b/i, 'born_at'],
  [/\bsince (two|three|four|five) years\b/i, 'since_dur'],
  [/\bhave (bought|seen|gone|done) .{0,30}last (week|year|month|Monday)\b/i, 'pp_past'],
  [/\babout to (left|went|came)\b/i, 'about_to_v2'],
  [/\bhas to goes\b|\bhave to goes\b/i, 'has_to_goes'],
  [/\bare a student, don't you\b/i, 'tag_wrong'],
  [/\bi wish i am\b/i, 'wish_am'],
  [/\bif i am you\b/i, 'if_am_you'],
  [/\bmore (better|worse|bigger|happier)\b/i, 'double_comp'],
  [/\bmuch (books|people|students|apples)\b/i, 'much_c'],
  [/\bmany (water|milk|rice|money|furniture)\b/i, 'many_u'],
  [/\byours bag\b|\bmine pen\b|\bmine jacket\b/i, 'poss_bad'],
  [/\bthe red pen is my\b/i, 'is_my'],
  [/\bsheeps\b|\bchilds\b|\bmouses\b/i, 'bad_pl'],
];

const GOOD = [
  [/^tom is happy\.?$/i, 'tom_is_happy'],
  [/^she is a player\.?$/i, 'she_player'],
  [/^he is a doctor\.?$/i, 'he_doctor'],
  [/^i am a student\.?$/i, 'i_am_student'],
  [/^i love tom\.?$/i, 'i_love_tom'],
  [/^he works here\.?$/i, 'he_works'],
  [/^she works hard\.?$/i, 'she_works'],
  [/^is this your bag\??$/i, 'your_bag'],
  [/^is everyone (ok|okay)\??$/i, 'everyone_ok'],
  [/^there is some furniture in the room\.?$/i, 'furniture'],
  [/^the cat wagged its tail\.?$/i, 'its_tail'],
  [/^they are not tired\.?$|^they aren't tired\.?$/i, 'they_not'],
  [/^tom was happy\.?$/i, 'tom_was'],
  [/^tom was playing football\.?$/i, 'tom_pc'],
  [/^they were not watching tv\.?$/i, 'they_pc'],
  [/^does he live here\??$/i, 'does_he'],
  [/^i wish i were rich\.?$/i, 'wish_were'],
  [/^if i were you, i would consult a doctor\.?$/i, 'if_were'],
  [/^this is my (bag|book|jacket|pen)\.?$/i, 'this_my'],
  [/^the red pen is mine\.?$/i, 'pen_mine'],
  [/^i was playing football yesterday at 4\.?$/i, 'was_playing'],
  [/^she asked where i was going\.?$/i, 'rs_ok'],
];

function matchAny(s, list) {
  const hits = [];
  for (const [re, tag] of list) {
    if (re.test(s)) hits.push(tag);
  }
  return hits;
}

function isMetaTf(q) {
  return (
    /usage point|this lesson covers|theory check|is taught in this lesson|structure is:|for "\+|rule "/i.test(
      q
    ) && !/["“][^"”]{4,}["”]\s+is correct/i.test(q)
  );
}

/** On-topic replacement banks for meta TF (slug → list of real items, cycled) */
const META_BANK = {
  default: [
    {
      type: 'mcq',
      q: 'Choose the correct option: She ___ a teacher.',
      opts: ['is', 'are', 'am'],
      answer: 'is',
      fb: 'She → is.',
    },
  ],
  'verb-to-be': [
    { type: 'tf', q: '"Tom is happy." is correct.', answer: true, fb: 'Tom → is.' },
    { type: 'tf', q: '"They is happy." is correct.', answer: false, fb: 'They → are.' },
    {
      type: 'mcq',
      q: 'I ___ a student.',
      opts: ['am', 'is', 'are'],
      answer: 'am',
      fb: 'I → am.',
    },
  ],
  possessives: [
    { type: 'tf', q: '"Is this your bag?" is correct.', answer: true, fb: 'your + N.' },
    { type: 'tf', q: '"mine pen" is correct.', answer: false, fb: 'mine không + N.' },
    {
      type: 'mcq',
      q: 'This book is ___.',
      opts: ['mine', 'my', 'me'],
      answer: 'mine',
      fb: 'mine đứng một mình.',
    },
  ],
  'countable-uncountable': [
    {
      type: 'tf',
      q: '"There is some furniture in the room." is correct.',
      answer: true,
      fb: 'furniture = U → There is some.',
    },
    {
      type: 'tf',
      q: '"I need an information." is correct.',
      answer: false,
      fb: 'information = U → some information.',
    },
    {
      type: 'mcq',
      q: 'There isn\'t ___ milk left.',
      opts: ['much', 'many', 'a'],
      answer: 'much',
      fb: 'milk = U → much.',
    },
  ],
  'present-simple': [
    {
      type: 'tf',
      q: '"He works here." is correct.',
      answer: true,
      fb: 'He → works.',
    },
    {
      type: 'tf',
      q: '"He work here." is correct.',
      answer: false,
      fb: 'He → works.',
    },
    {
      type: 'mcq',
      q: 'She ___ English every day.',
      opts: ['studies', 'study', 'is study'],
      answer: 'studies',
      fb: 'She → studies.',
    },
  ],
  'past-continuous': [
    {
      type: 'error',
      q: 'Find the error: I was play football yesterday at 4.',
      opts: [
        'I was playing football yesterday at 4.',
        'I was play football yesterday at 4.',
        'I playing football yesterday at 4.',
      ],
      answer: 'I was playing football yesterday at 4.',
      fb: 'was + V-ing.',
    },
  ],
  'future-perfect': [
    {
      type: 'error',
      q: 'Find the error: They will have live here for 10 years by next month.',
      opts: [
        'They will have lived here for 10 years by next month.',
        'They will have live here for 10 years by next month.',
        'They will lived here for 10 years by next month.',
      ],
      answer: 'They will have lived here for 10 years by next month.',
      fb: 'will have + V3 → lived.',
    },
  ],
  'personal-pronouns': [
    {
      type: 'mcq',
      q: 'Can you help ___?',
      opts: ['me', 'I', 'my'],
      answer: 'me',
      fb: 'Tân ngữ me.',
    },
    {
      type: 'tf',
      q: '"Sara and I are classmates." is correct.',
      answer: true,
      fb: 'Sara and I = chủ ngữ ghép → are.',
    },
    {
      type: 'tf',
      q: '"Me and Sara is classmates." is correct.',
      answer: false,
      fb: 'Dùng I (không me) làm chủ ngữ; are (không is).',
    },
  ],
  articles: [
    {
      type: 'mcq',
      q: 'She is ___ honest person.',
      opts: ['an', 'a', 'the'],
      answer: 'an',
      fb: 'honest → an.',
    },
    { type: 'tf', q: '"I have a book." is correct.', answer: true, fb: 'a + phụ âm.' },
    { type: 'tf', q: '"I have an book." is correct.', answer: false, fb: 'book → a book.' },
  ],
  'question-tags': [
    {
      type: 'mcq',
      q: "You're a student, ___?",
      opts: ["aren't you", "don't you", "isn't you"],
      answer: "aren't you",
      fb: 'You are → aren\'t you.',
    },
    {
      type: 'tf',
      q: '"You are a student, don\'t you?" is correct.',
      answer: false,
      fb: 'You are → aren\'t you (không don\'t you).',
    },
  ],
  'prepositions-time': [
    {
      type: 'tf',
      q: '"He was born at 2001." is correct.',
      answer: false,
      fb: 'Năm → in 2001 (không at).',
    },
    {
      type: 'mcq',
      q: 'I was born ___ 2001.',
      opts: ['in', 'at', 'on'],
      answer: 'in',
      fb: 'năm → in.',
    },
  ],
  'prepositions-place': [
    {
      type: 'tf',
      q: '"There is a shop behind of our office." is correct.',
      answer: false,
      fb: 'behind (không behind of).',
    },
  ],
  'present-perfect': [
    {
      type: 'tf',
      q: '"I have saw that movie." is correct.',
      answer: false,
      fb: 'have + V3 → seen.',
    },
    {
      type: 'tf',
      q: '"I have bought this car last week." is correct.',
      answer: false,
      fb: 'last week → past simple bought.',
    },
  ],
  'gerunds-infinitives': [
    {
      type: 'tf',
      q: '"I am looking forward to meet you." is correct.',
      answer: false,
      fb: 'look forward to + V-ing → meeting.',
    },
  ],
  'present-continuous': [
    {
      type: 'tf',
      q: '"I am knowing the answer." is correct.',
      answer: false,
      fb: 'know = stative → I know.',
    },
  ],
  'modals-obligation': [
    {
      type: 'tf',
      q: '"She has to goes to the dentist." is correct.',
      answer: false,
      fb: 'has to + V nguyên mẫu → go.',
    },
  ],
  'wish-if-only': [
    {
      type: 'error',
      q: 'Find the error: I wish I am rich.',
      opts: ['I wish I were rich.', 'I wish I am rich now.', 'I wish I was rich. (informal)'],
      answer: 'I wish I were rich.',
      fb: 'wish + past (were).',
    },
  ],
  'second-conditional': [
    {
      type: 'error',
      q: 'Find the error: If I was you, I would consult a doctor.',
      opts: [
        'If I were you, I would consult a doctor.',
        'If I was you, I would consult a doctor.',
        'If I am you, I would consult a doctor.',
      ],
      answer: 'If I were you, I would consult a doctor.',
      fb: 'If I were you (formal).',
    },
  ],
};

function bankItem(slug, salt) {
  const list = META_BANK[slug] || META_BANK.default;
  return { ...list[salt % list.length], case_id: `meta_repl_${salt}` };
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic:grammar_topics(slug, level)');
  if (error) throw error;

  if (APPLY) {
    const bp = `tmp/grammar-exercises-backup-logic-${Date.now()}.json`;
    fs.writeFileSync(
      bp,
      JSON.stringify({
        at: new Date().toISOString(),
        lessons: lessons.map((L) => ({ id: L.id, slug: L.topic?.slug, exercises: L.exercises })),
      })
    );
    console.log('Backup', bp);
  }

  const actions = [];
  let changedItems = 0;
  let lessonsUpdated = 0;
  let metaReplaced = 0;
  let keyFixed = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '?';
    const ex = Array.isArray(L.exercises) ? L.exercises.map((e) => ({ ...e })) : [];
    let dirty = false;
    let metaSalt = 0;

    for (let i = 0; i < ex.length; i++) {
      const e = ex[i];
      const type = e.type;
      const q = String(e.q || e.question || '');
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;
      const opts = e.opts || e.options || [];

      // ── Meta TF filler → replace with real practice ──
      if (type === 'tf' && isMetaTf(q)) {
        // Keep theoretically-useful English-rule TFs (not "usage point taught")
        const keep =
          /conditional|present perfect|inversion|reported|passive|modal|gerund|tag|article|plural|structure is always/i.test(
            q
          ) && !/usage point|this lesson covers|is taught in this lesson/i.test(q);

        if (!keep) {
          const rep = bankItem(slug, metaSalt++);
          // diversify: if bank tiny, create slug-aware tf
          ex[i] = rep;
          dirty = true;
          changedItems++;
          metaReplaced++;
          actions.push({ slug, i: i + 1, code: 'META_REPLACE', from: q.slice(0, 70), to: rep.q });
          continue;
        }
      }

      // ── TF "X is correct" ──
      if (type === 'tf') {
        const m = q.match(/["“]([^"”]+)["”]\s+is correct/i);
        if (m) {
          const sent = strip(m[1]);
          const wrong = matchAny(sent, WRONG);
          const good = matchAny(sent, GOOD);
          const ansB = ans === true || String(ans).toLowerCase() === 'true';
          const ansF = ans === false || String(ans).toLowerCase() === 'false';

          // Fix: good marked false
          if (good.length && ansF) {
            ex[i] = {
              ...e,
              type: 'tf',
              q: `"${sent}" is correct.`,
              answer: true,
              fb: `Đúng. "${sent}" — chuẩn (${good.join(',')}).`,
            };
            dirty = true;
            changedItems++;
            keyFixed++;
            actions.push({ slug, i: i + 1, code: 'TF_FORCE_TRUE', sent, was: ans });
            continue;
          }
          // Fix: wrong marked true
          if (wrong.length && ansB) {
            // special: "and I are" should not match i_is_are_bare - check
            const falsePos =
              wrong.length === 1 &&
              wrong[0] === 'i_is_are_bare' &&
              /\band i are\b/i.test(sent);
            if (!falsePos) {
              ex[i] = {
                ...e,
                type: 'tf',
                answer: false,
                fb: `Sai. "${sent}" không chuẩn (${wrong.join(',')}).`,
              };
              dirty = true;
              changedItems++;
              keyFixed++;
              actions.push({ slug, i: i + 1, code: 'TF_FORCE_FALSE', sent, was: ans, wrong });
              continue;
            }
          }
        }
      }

      // ── Error: stem good or repair = stem or repair wrong ──
      if (type === 'error' || /find the error/i.test(q)) {
        const m = q.match(/find the error\s*:\s*(.+)/i);
        const stem = m ? strip(m[1]) : '';
        const ansS = String(ans || '');
        const gStem = matchAny(stem, GOOD);
        const wStem = matchAny(stem, WRONG);
        const wAns = matchAny(ansS, WRONG);
        const gAns = matchAny(ansS, GOOD);

        // future-perfect known: stem = correct answer (no error)
        if (stem && norm(stem) === norm(ansS) && gStem.length) {
          // invert using bank
          const rep = bankItem(slug, i);
          if (rep.type === 'error') {
            ex[i] = rep;
          } else {
            // generic invert: break stem slightly if future perfect
            if (/will have lived/i.test(stem)) {
              ex[i] = {
                type: 'error',
                q: 'Find the error: They will have live here for 10 years by next month.',
                opts: [
                  'They will have lived here for 10 years by next month.',
                  'They will have live here for 10 years by next month.',
                  'They will lived here for 10 years by next month.',
                ],
                answer: 'They will have lived here for 10 years by next month.',
                fb: 'will have + V3 → lived.',
              };
            } else {
              actions.push({
                slug,
                i: i + 1,
                code: 'ERROR_STEM_EQ_ANS_MANUAL',
                stem,
                ans: ansS,
              });
              continue;
            }
          }
          dirty = true;
          changedItems++;
          keyFixed++;
          actions.push({ slug, i: i + 1, code: 'ERROR_INVERT', stem });
          continue;
        }

        // repair is wrong form while stem is wrong (double wrong) or repair wrong when stem good
        if (wAns.length && !gAns.length) {
          // try pick good opt
          const optsA = Array.isArray(opts) ? opts.map(String) : [];
          const goodOpt = optsA.find((o) => matchAny(o, GOOD).length && !matchAny(o, WRONG).length);
          if (goodOpt) {
            ex[i] = { ...e, answer: goodOpt, fb: `Đúng: ${goodOpt}.` };
            dirty = true;
            changedItems++;
            keyFixed++;
            actions.push({ slug, i: i + 1, code: 'ERROR_FIX_ANS', from: ansS, to: goodOpt });
            continue;
          }
        }

        if (gStem.length && (wAns.length || norm(stem) === norm(ansS))) {
          actions.push({
            slug,
            i: i + 1,
            code: 'ERROR_ON_GOOD_MANUAL',
            stem,
            ans: ansS,
            opts,
          });
        }
      }

      // ── MCQ: answer matches WRONG and another opt matches GOOD ──
      if (type === 'mcq' && Array.isArray(opts) && opts.length >= 2) {
        const ansS = String(ans || '');
        if (matchAny(ansS, WRONG).length) {
          const goodOpt = opts
            .map(String)
            .find((o) => matchAny(o, GOOD).length && !matchAny(o, WRONG).length);
          if (goodOpt) {
            ex[i] = { ...e, answer: goodOpt, fb: `Đúng: ${goodOpt}.` };
            dirty = true;
            changedItems++;
            keyFixed++;
            actions.push({ slug, i: i + 1, code: 'MCQ_FIX', from: ansS, to: goodOpt });
          }
        }
      }
    }

    // Deduplicate after meta replace (same q twice)
    const seen = new Set();
    for (let i = 0; i < ex.length; i++) {
      const k = norm(ex[i].q || ex[i].question || '') + '|' + String(ex[i].answer);
      if (seen.has(k) && /meta_repl/.test(String(ex[i].case_id || ''))) {
        // re-roll from bank with different salt
        const rep = bankItem(slug, i + 97);
        // if still dup, make mcq variant
        ex[i] = {
          ...rep,
          q: rep.q + (rep.type === 'tf' ? '' : ''),
          case_id: `meta_repl_dedup_${i}`,
        };
        // force unique by appending subtle case marker in case_id only; if still same q, tweak fb
        if (seen.has(norm(ex[i].q) + '|' + String(ex[i].answer))) {
          if (ex[i].type === 'mcq' && ex[i].opts) {
            // leave; later filter
          }
        }
        dirty = true;
      }
      seen.add(norm(ex[i].q || '') + '|' + String(ex[i].answer));
    }

    if (dirty) {
      lessonsUpdated++;
      if (APPLY) {
        const { error: uErr } = await sb
          .from('grammar_lessons')
          .update({ exercises: ex })
          .eq('id', L.id);
        if (uErr) console.error('fail', slug, uErr.message);
        else console.log('💾', slug);
      } else if (CORE.has(slug) || actions.some((a) => a.slug === slug)) {
        console.log('·', slug, 'changes pending');
      }
    }
  }

  const report = {
    at: new Date().toISOString(),
    apply: APPLY,
    changedItems,
    keyFixed,
    metaReplaced,
    lessonsUpdated,
    actions,
  };
  fs.writeFileSync('tmp/deep-core-logic-report.json', JSON.stringify(report, null, 2));
  console.log('\n=== DEEP CORE LOGIC ===');
  console.log({ changedItems, keyFixed, metaReplaced, lessonsUpdated, actions: actions.length });
  const byCode = {};
  for (const a of actions) byCode[a.code] = (byCode[a.code] || 0) + 1;
  console.log('byCode', byCode);
  console.log(
    'sample',
    actions.filter((a) => a.code !== 'META_REPLACE').slice(0, 30)
  );
  console.log('META sample', actions.filter((a) => a.code === 'META_REPLACE').slice(0, 8));
  if (!APPLY) console.log('\nRun with --apply to write.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
