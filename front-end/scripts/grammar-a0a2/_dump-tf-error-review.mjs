/**
 * Dump ALL TF + error items for human review of key direction.
 * Output: tmp/tf-error-review.json + console stats
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

function strip(s) {
  return String(s || '')
    .replace(/^["“'‘]+|["”'’]+$/g, '')
    .trim();
}
function normEq(a, b) {
  return (
    String(a)
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '') ===
    String(b)
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
  );
}

// Expanded wrong fingerprints for REVIEW flagging (not auto-fix)
function flagWrong(s) {
  const reasons = [];
  if (/\bthey\s+(is|isn't)\b/i.test(s)) reasons.push('they_is');
  if (/\b(he|she|it|tom)\s+(are|am)\b/i.test(s)) reasons.push('sg_are');
  if (/(?:^|[.!?]\s+)i\s+(is|are)\b/i.test(s)) reasons.push('i_is_are');
  if (/\b(mine|yours|hers)\s+[a-z]+\b/i.test(s)) reasons.push('poss_pron_noun');
  if (/\b(her's|your's)\b/i.test(s)) reasons.push('false_poss');
  if (/\bit's\s+(tail|name)\b/i.test(s)) reasons.push('its_apos');
  if (/\ban information\b|\ba furniture\b|\bfurnitures\b/i.test(s)) reasons.push('uncount');
  if (/\bborn at \d{4}\b/i.test(s)) reasons.push('prep_year');
  if (/\blooking forward to meet\b/i.test(s)) reasons.push('lf_to_meet');
  if (/\binterested on\b|\bcapable to\b|\bbehind of\b/i.test(s)) reasons.push('colloc');
  if (/\bhave (saw|went|bought|eaten)\b|\bhas (saw|went)\b/i.test(s)) reasons.push('pp_v3');
  if (/\bsince three years\b/i.test(s)) reasons.push('since_duration');
  if (/\bi am knowing\b/i.test(s)) reasons.push('stative');
  if (/\bwas play\b|\bhas been work\b/i.test(s)) reasons.push('aspect');
  if (/\bdon't you\b/i.test(s) && /\byou are\b/i.test(s)) reasons.push('tag');
  if (/\bhas to goes\b/i.test(s)) reasons.push('modal_v');
  if (/\bmore better\b/i.test(s)) reasons.push('double_comp');
  if (/\bdo he\b/i.test(s)) reasons.push('do_he');
  if (/\bthey not is\b|\bnot is\b/i.test(s)) reasons.push('wo_not');
  if (/\btoms (bike|car)\b/i.test(s)) reasons.push('missing_apos');
  if (/\ba apple\b|\ban book\b|\ban university\b/i.test(s)) reasons.push('article');
  if (/\bthere is many\b|\bthere are a\b/i.test(s)) reasons.push('there');
  if (/\bgoed\b|\bbuyed\b/i.test(s)) reasons.push('irreg');
  if (/\bi wish i am\b|\bif i am you\b/i.test(s)) reasons.push('wish_if');
  return reasons;
}

function flagGood(s) {
  const reasons = [];
  if (/^Tom is happy/i.test(s)) reasons.push('tom_is_happy');
  if (/^I love Tom/i.test(s)) reasons.push('i_love_tom');
  if (/^Is this your bag/i.test(s)) reasons.push('your_bag');
  if (/^Is everyone (OK|okay)/i.test(s)) reasons.push('everyone_ok');
  if (/^There is some furniture/i.test(s)) reasons.push('furniture_ok');
  if (/^He works here/i.test(s)) reasons.push('he_works');
  if (/^She is a player/i.test(s)) reasons.push('she_player');
  if (/^They are not tired|^They aren't tired/i.test(s)) reasons.push('they_arent');
  if (/^Does he live here/i.test(s)) reasons.push('does_he');
  if (/^I wish I were /i.test(s)) reasons.push('wish_were');
  if (/^If I were you/i.test(s)) reasons.push('if_were');
  if (/^The cat wagged its tail/i.test(s)) reasons.push('its_tail');
  if (/^This is my /i.test(s)) reasons.push('this_is_my');
  return reasons;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic:grammar_topics(slug, level)');

  const tfSuspect = [];
  const errSuspect = [];
  const ansNotInOpts = [];
  let tfTotal = 0;
  let errTotal = 0;

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '?';
    const ex = L.exercises || [];
    for (let i = 0; i < ex.length; i++) {
      const e = ex[i];
      const type = e.type;
      const q = String(e.q || e.question || '');
      const ans = e.answer !== undefined ? e.answer : e.correct_answer;
      const opts = e.opts || e.options || [];

      if (type === 'tf') {
        tfTotal++;
        const m = q.match(/["“]([^"”]+)["”]\s+is correct/i) || q.match(/^["“]([^"”]+)["”]/);
        const sent = m ? strip(m[1]) : null;
        if (!sent) {
          tfSuspect.push({ slug, i: i + 1, kind: 'tf_no_sent', q: q.slice(0, 100), ans });
          continue;
        }
        const w = flagWrong(sent);
        const g = flagGood(sent);
        const ansB = ans === true || String(ans).toLowerCase() === 'true';
        const ansF = ans === false || String(ans).toLowerCase() === 'false';

        // wrong sentence marked true
        if (w.length && ansB) {
          tfSuspect.push({
            slug,
            i: i + 1,
            kind: 'wrong_marked_true',
            sent,
            ans,
            reasons: w,
            fb: String(e.fb || '').slice(0, 80),
          });
        }
        // good sentence marked false
        if (g.length && ansF) {
          tfSuspect.push({
            slug,
            i: i + 1,
            kind: 'good_marked_false',
            sent,
            ans,
            reasons: g,
            fb: String(e.fb || '').slice(0, 80),
          });
        }
        // wrong sentence marked false = OK (skip)
        // good marked true = OK
      }

      if (type === 'error' || /find the error/i.test(q)) {
        errTotal++;
        const m = q.match(/find the error\s*:\s*(.+)/i);
        const stem = m ? strip(m[1]) : '';
        const ansS = String(ans || '');
        const wStem = flagWrong(stem);
        const gStem = flagGood(stem);
        const wAns = flagWrong(ansS);
        const gAns = flagGood(ansS);

        if (gStem.length && (wAns.length || ansS.toLowerCase() === stem.toLowerCase())) {
          errSuspect.push({
            slug,
            i: i + 1,
            kind: 'error_on_good_stem',
            stem,
            ans: ansS,
            opts,
            gStem,
            wAns,
          });
        }
        if (wAns.length && !gAns.length) {
          // answer is wrong form
          errSuspect.push({
            slug,
            i: i + 1,
            kind: 'bad_repair',
            stem,
            ans: ansS,
            opts,
            wAns,
          });
        }
        // stem not wrong but no good flag — soft review if answer equals stem
        if (stem && normEq(stem, ansS) && !wStem.length) {
          errSuspect.push({
            slug,
            i: i + 1,
            kind: 'repair_equals_stem',
            stem,
            ans: ansS,
          });
        }
      }

      if ((type === 'mcq' || type === 'error') && Array.isArray(opts) && opts.length) {
        const ansS = String(ans || '').trim();
        const ok = opts.some(
          (o) =>
            String(o).trim().toLowerCase().replace(/[.!?]+$/, '') ===
            ansS.toLowerCase().replace(/[.!?]+$/, '')
        );
        if (!ok && ansS) {
          ansNotInOpts.push({
            slug,
            i: i + 1,
            type,
            ans: ansS.slice(0, 80),
            opts: opts.map((o) => String(o).slice(0, 40)),
            q: q.slice(0, 80),
          });
        }
      }
    }
  }

  const report = {
    tfTotal,
    errTotal,
    tfSuspect: tfSuspect.length,
    errSuspect: errSuspect.length,
    ansNotInOpts: ansNotInOpts.length,
    tfSuspectList: tfSuspect,
    errSuspectList: errSuspect,
    ansNotInOptsList: ansNotInOpts.slice(0, 80),
  };

  fs.writeFileSync('tmp/tf-error-review.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    tfTotal,
    errTotal,
    tfSuspect: tfSuspect.length,
    errSuspect: errSuspect.length,
    ansNotInOpts: ansNotInOpts.length,
  }, null, 2));
  console.log('\n--- TF SUSPECT ---');
  tfSuspect.forEach((x) => console.log(`[${x.slug} #${x.i}] ${x.kind}: ${x.sent || x.q} | ans=${x.ans}`));
  console.log('\n--- ERR SUSPECT ---');
  errSuspect.forEach((x) =>
    console.log(`[${x.slug} #${x.i}] ${x.kind}: stem="${x.stem}" ans="${x.ans}"`)
  );
  console.log('\n--- ANS NOT IN OPTS (first 30) ---');
  ansNotInOpts.slice(0, 30).forEach((x) =>
    console.log(`[${x.slug} #${x.i}] ans="${x.ans}" opts=${JSON.stringify(x.opts)}`)
  );
}

main().catch(console.error);
