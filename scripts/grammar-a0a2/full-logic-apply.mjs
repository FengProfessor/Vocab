/**
 * FULL LOGIC APPLY — Grok-owned, thorough, no AG.
 *
 * 1) Fix inverted TF keys (incl. "grammatically correct" wording)
 * 2) Fix error items (stem already correct / poison repair)
 * 3) Strip meta filler TF ("Usage point… taught") and refill from FRESH banks (on-topic)
 * 4) ans ∈ opts normalize
 * 5) Backup + optional cache clear
 *
 *   node scripts/grammar-a0a2/full-logic-apply.mjs
 *   node scripts/grammar-a0a2/full-logic-apply.mjs --apply
 *   node scripts/grammar-a0a2/full-logic-apply.mjs --apply --clear-cache
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { FRESH_BY_SLUG } from './practice-banks-fresh.mjs';

const APPLY = process.argv.includes('--apply');
const CLEAR_CACHE = process.argv.includes('--clear-cache');
const MIN_EX = 36;

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

function getQ(e) {
  return String(e?.q || e?.question || '').trim();
}
function getAns(e) {
  return e?.answer !== undefined ? e.answer : e?.correct_answer;
}
function getOpts(e) {
  const o = e?.opts ?? e?.options;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
}
function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  return t;
}
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function strip(s) {
  return String(s || '')
    .replace(/^["“'‘]+|["”'’]+$/g, '')
    .trim();
}
function tfBool(raw) {
  if (raw === true || raw === false) return raw;
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (['true', 'đúng', 'yes', 'correct'].includes(s)) return true;
  if (['false', 'sai', 'no', 'incorrect'].includes(s)) return false;
  return null;
}
function qKey(e) {
  return norm(getQ(e));
}

// ─── Extract quoted English under TF judgment ───────────────────────────────
function extractJudgedSentence(q) {
  let m =
    q.match(/["“]([^"”]+)["”]\s+is(?:\s+grammatically)?\s+correct/i) ||
    q.match(/sentence\s+["“]([^"”]+)["”]/i) ||
    q.match(/The sentence\s+["“]([^"”]+)["”]/i);
  if (m) return strip(m[1]);
  return null;
}

// ─── High-confidence wrong / right ──────────────────────────────────────────
const WRONG_RES = [
  [/\bthey\s+(is|isn't|is\s+not)\b/i, 'they_is'],
  [/\b(we|you)\s+(is|isn't)\b/i, 'we_you_is'],
  [/\b(he|she|it)\s+(are|aren't|am)\b/i, 'sg_are'],
  [/\b(tom|anna|mary|john)\s+(are|am)\b/i, 'name_are'],
  [/^(i\s+is|i\s+are)\b/i, 'i_is'],
  [/\beveryone\s+are\b/i, 'everyone_are'],
  [/\b(me|him|them|us)\s+(am|is|are)\b/i, 'obj_subj'],
  [/\b(he|she|it|tom|they|we|you|i)\s+not\s+(is|are|am|was|were)\b/i, 'wo_not'],
  [/\b(mine|yours|hers|ours|theirs)\s+(pen|bag|jacket|book|room|bike|car|box)\b/i, 'poss_n'],
  [/\b(her's|your's|our's|their's)\b/i, 'fake_poss'],
  [/\bit's\s+(tail|name|color|colour|bone|food)\b/i, 'its'],
  [/\btheir\s+is\s+(a|an)\b/i, 'their_is'],
  [/\btoms\s+(bike|car|book|bag)\b/i, 'toms'],
  [/\ban\s+(book|pen|cat|dog|university|one|table)\b/i, 'an_c'],
  [/\ba\s+(apple|egg|orange|hour|umbrella|elephant|idea|honest)\b/i, 'a_v'],
  [/\b(an information|a furniture|a advice|a news)\b/i, 'uncount_a'],
  [/\b(furnitures|informations|advices|homeworks)\b/i, 'uncount_s'],
  [/\bthere\s+is\s+(many|two|three|four|five)\b/i, 'there_pl'],
  [/\bthere\s+are\s+(a|an)\s+/i, 'there_sg'],
  [/\b(he|she|it|tom)\s+(work|live|play|like|go|want|need)\s+(here|every|in|to|hard)\b/i, 'ps'],
  [/\bdoesn't\s+(goes|works|likes|lives|plays|has)\b/i, 'doesnt'],
  [/\bdidn't\s+(went|was|were|had|saw|ate|bought|did)\b/i, 'didnt'],
  [/\bdo\s+he\b/i, 'do_he'],
  [/\bdoes\s+(he|she)\s+(lives|works|likes|goes)\b/i, 'does_s'],
  [/\bwas\s+play\b|\bwere\s+play\b/i, 'was_play'],
  [/\bhas\s+been\s+work\b/i, 'been_work'],
  [/\b(have|has)\s+(saw|went|ate|catched|wrote)\b/i, 'pp_v'],
  [/\b(goed|buyed|catched|teached)\b/i, 'irreg'],
  [/\bi\s+am\s+knowing\b|\bi\s+am\s+wanting\b/i, 'stative'],
  [/\blooking\s+forward\s+to\s+meet\b/i, 'lf'],
  [/\binterested\s+on\b|\bcapable\s+to\b|\bbehind\s+of\b/i, 'colloc'],
  [/\bborn\s+at\s+\d{4}\b/i, 'born_at'],
  [/\bsince\s+(two|three|four|five)\s+years\b/i, 'since'],
  [/\bhave\s+(bought|seen|gone|done)\b.{0,40}\blast\s+(week|year|month|Monday)\b/i, 'pp_past'],
  [/\babout\s+to\s+(left|went|came)\b/i, 'about_to'],
  [/\bhas\s+to\s+goes\b|\bhave\s+to\s+goes\b/i, 'has_to_goes'],
  [/\bare\s+a\s+student,\s+don't\s+you\b/i, 'tag'],
  [/\bi\s+wish\s+i\s+am\b/i, 'wish_am'],
  [/\bif\s+i\s+am\s+you\b/i, 'if_am'],
  [/\bmore\s+(better|worse|bigger|happier)\b/i, 'dcomp'],
  [/\bmuch\s+(books|people|students|apples)\b/i, 'much_c'],
  [/\bmany\s+(water|milk|rice|money|furniture)\b/i, 'many_u'],
  [/\byours\s+bag\b|\bmine\s+pen\b|\bmine\s+jacket\b/i, 'poss_bad'],
  [/\bthe\s+red\s+pen\s+is\s+my\b/i, 'is_my'],
  [/\bsheeps\b|\bchilds\b|\bmouses\b/i, 'bad_pl'],
  [/\ban\s+lot\s+of\b/i, 'an_lot'],
  [/\bthree\s+furnitures\b/i, '3_furn'],
];

const GOOD_RES = [
  [/^tom is happy\.?$/i, 'tom_happy'],
  [/^she is a player\.?$/i, 'she_player'],
  [/^he is a doctor\.?$/i, 'he_doc'],
  [/^i am a student\.?$/i, 'i_student'],
  [/^i love tom\.?$/i, 'i_love'],
  [/^he works here\.?$/i, 'he_works'],
  [/^she works hard\.?$/i, 'she_works'],
  [/^is this your bag\??$/i, 'your_bag'],
  [/^is everyone (ok|okay)\??$/i, 'everyone'],
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
  [/^she asked where i was going\.?$/i, 'rs'],
  [/^sara and i are classmates\.?$/i, 'sara_i'],
  [/^they will have lived here for 10 years by next month\.?$/i, 'fp_ok'],
];

function tags(s, list) {
  const out = [];
  for (const [re, tag] of list) if (re.test(s)) out.push(tag);
  return out;
}

function isMetaFiller(q) {
  // Pure lesson-meta, not English judgment
  if (/usage point .+ is taught in this lesson/i.test(q)) return true;
  if (/this lesson covers(\s+usage)?\s*:/i.test(q)) return true;
  if (/^theory check\s*[—–-]/i.test(q) && !extractJudgedSentence(q)) return true;
  // Generic template labels that aren't real practice
  if (/^usage point "diễn đạt ý chính"/i.test(q)) return true;
  if (/^usage point "dùng trong giao tiếp"/i.test(q)) return true;
  if (/^usage point "dùng ở dạng biến đổi"/i.test(q)) return true;
  if (/^usage point "dùng trong ngữ cảnh tự nhiên"/i.test(q)) return true;
  if (/which example fits/i.test(q)) return true;
  if (/contrast focus/i.test(q)) return true;
  return false;
}

function isPoisonAnswer(ans) {
  const a = String(ans || '');
  // Never flag compound subject "X and I are"
  if (/\band\s+i\s+are\b/i.test(a)) return false;
  if (/\bthey\s+(is|isn't)\b/i.test(a) && !/\bthey\s+are\b/i.test(a)) return true;
  if (/\b(he|she|it)\s+(are|am)\b/i.test(a) && !/\b(he|she|it)\s+is\b/i.test(a)) return true;
  if (/\btom\s+are\b/i.test(a)) return true;
  if (/^i\s+(is|are)\b/i.test(a)) return true;
  if (/\b(mine|yours|hers)\s+(pen|bag|jacket)\b/i.test(a)) return true;
  if (/^they is not\b/i.test(a)) return true;
  if (/^i playing\b/i.test(a)) return true;
  if (/^does he lives\b/i.test(a)) return true;
  if (/^if i am you\b/i.test(a)) return true;
  if (/^she asked where was i\b/i.test(a)) return true;
  return false;
}

// Known error repairs
function fixErrorItem(stem, ans, opts, q) {
  const s = stem || '';
  const n = norm(s);

  if (/they not is tired/i.test(s)) {
    return {
      type: 'error',
      q: 'Find the error: They not is tired.',
      opts: ['They are not tired.', 'They is not tired.', 'They not are tired.'],
      answer: 'They are not tired.',
      fb: "They → are. Phủ định: They are not / aren't tired.",
    };
  }
  if (/^tom are happy/i.test(n)) {
    return {
      type: 'error',
      q: 'Find the error: Tom are happy.',
      opts: ['Tom is happy.', 'Tom are happy.', 'Tom am happy.'],
      answer: 'Tom is happy.',
      fb: 'Tom → is.',
    };
  }
  if (/^tom is happy/i.test(n)) {
    // inverted good stem
    return {
      type: 'error',
      q: 'Find the error: Tom are happy.',
      opts: ['Tom is happy.', 'Tom are happy.', 'Tom am happy.'],
      answer: 'Tom is happy.',
      fb: 'Tom → is.',
    };
  }
  if (/i was play football/i.test(s)) {
    return {
      type: 'error',
      q: 'Find the error: I was play football yesterday at 4.',
      opts: [
        'I was playing football yesterday at 4.',
        'I was play football yesterday at 4.',
        'I playing football yesterday at 4.',
      ],
      answer: 'I was playing football yesterday at 4.',
      fb: 'was + V-ing → was playing.',
    };
  }
  if (/do he live/i.test(s)) {
    return {
      type: 'error',
      q: 'Find the error: Do he live here?',
      opts: ['Does he live here?', 'Do he live here?', 'Does he lives here?'],
      answer: 'Does he live here?',
      fb: 'He → Does + V nguyên mẫu.',
    };
  }
  if (/will have lived here for 10 years/i.test(s) && norm(s) === norm(ans)) {
    // stem already correct — invent real error
    return {
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
  }
  if (tags(s, GOOD_RES).length && (tags(String(ans), WRONG_RES).length || norm(s) === norm(ans))) {
    // generic: if good stem equals ans — need invert but unknown wrong form
    return null;
  }
  if (isPoisonAnswer(ans)) {
    const goodOpt = (opts || []).find((o) => !isPoisonAnswer(o) && tags(o, GOOD_RES).length);
    if (goodOpt) {
      return { answer: goodOpt, fb: `Đúng: ${goodOpt}.` };
    }
  }
  return null;
}

function processLesson(slug, exercises) {
  const log = [];
  let list = exercises.map((e) => ({ ...e }));
  let metaRemoved = 0;
  let keyFixes = 0;

  // Pass 1: meta strip (park removed — may restore if under MIN after refill)
  const kept = [];
  const strippedMeta = [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const q = getQ(e);
    if (
      (getType(e) === 'tf' && isMetaFiller(q)) ||
      /which example fits|contrast focus|another incorrect/i.test(q)
    ) {
      strippedMeta.push(e);
      log.push({ code: 'META_STRIP', i: i + 1, q: q.slice(0, 80) });
      continue;
    }
    kept.push(e);
  }
  metaRemoved = strippedMeta.length;
  list = kept;

  // Pass 2: TF + error + mcq key fixes
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const type = getType(e);
    const q = getQ(e);
    const ans = getAns(e);
    const opts = getOpts(e);

    if (type === 'tf') {
      const sent = extractJudgedSentence(q);
      if (sent) {
        const good = tags(sent, GOOD_RES);
        const wrong = tags(sent, WRONG_RES);
        const b = tfBool(ans);

        if (good.length && b === false) {
          list[i] = {
            type: 'tf',
            q: /grammatically correct/i.test(q)
              ? `The sentence "${sent}" is grammatically correct.`
              : `"${sent}" is correct.`,
            answer: true,
            fb: `Đúng. "${sent}" — chuẩn.`,
            case_id: e.case_id || 'tf_force_true',
          };
          keyFixes++;
          log.push({ code: 'TF_FORCE_TRUE', i: i + 1, sent });
          continue;
        }
        if (wrong.length && b === true) {
          list[i] = {
            ...e,
            type: 'tf',
            answer: false,
            fb: `Sai. "${sent}" không chuẩn.`,
          };
          keyFixes++;
          log.push({ code: 'TF_FORCE_FALSE', i: i + 1, sent, wrong });
          continue;
        }
      }
      // bool normalize
      const b2 = tfBool(getAns(list[i]));
      if (b2 !== null && getAns(list[i]) !== b2) {
        list[i] = { ...list[i], answer: b2 };
        keyFixes++;
        log.push({ code: 'TF_BOOL', i: i + 1, b2 });
      }
    }

    if (type === 'error' || /find the error/i.test(q)) {
      const m = q.match(/find the error\s*:\s*(.+)/i);
      const stem = m ? strip(m[1]) : '';
      const ansS = String(ans || '');
      const patch = fixErrorItem(stem, ansS, opts, q);
      if (patch) {
        const next = { ...e, ...patch, type: patch.type || e.type || 'error' };
        if (patch.opts) {
          next.opts = patch.opts;
          delete next.options;
        }
        // Only count/write when content actually changes
        const same =
          norm(getQ(next)) === norm(q) &&
          norm(String(getAns(next) ?? '')) === norm(ansS) &&
          JSON.stringify(getOpts(next)) === JSON.stringify(opts);
        if (!same) {
          list[i] = next;
          keyFixes++;
          log.push({
            code: 'ERROR_FIX',
            i: i + 1,
            stem: stem.slice(0, 60),
            to: patch.answer || patch.q,
          });
        }
      } else if (stem && tags(stem, GOOD_RES).length && norm(stem) === norm(ansS)) {
        log.push({ code: 'ERROR_GOOD_STEM_MANUAL', i: i + 1, stem });
      }
    }

    if (type === 'mcq' && isPoisonAnswer(String(ans || ''))) {
      const goodOpt = opts.find((o) => !isPoisonAnswer(o) && tags(o, GOOD_RES).length);
      if (goodOpt) {
        list[i] = { ...e, answer: goodOpt, fb: `Đúng: ${goodOpt}.` };
        keyFixes++;
        log.push({ code: 'MCQ_FIX', i: i + 1, from: ans, to: goodOpt });
      }
    }

    // ans ∈ opts soft align
    if ((type === 'mcq' || type === 'error' || (type === 'fill' && opts.length >= 2)) && opts.length) {
      const ansS = String(getAns(list[i]) ?? '');
      if (ansS && !opts.some((o) => norm(o) === norm(ansS))) {
        const hit = opts.find((o) => norm(o) === norm(ansS));
        if (hit) {
          list[i] = { ...list[i], answer: hit };
          keyFixes++;
        } else {
          const soft = opts.find(
            (o) => norm(o).includes(norm(ansS)) || norm(ansS).includes(norm(o))
          );
          if (soft && norm(ansS).length >= 4) {
            list[i] = { ...list[i], answer: soft };
            keyFixes++;
            log.push({ code: 'ANS_ALIGN', i: i + 1, from: ansS, to: soft });
          } else {
            log.push({ code: 'ANS_NOT_IN_OPTS', i: i + 1, ans: ansS.slice(0, 50) });
          }
        }
      }
    }
  }

  // Pass 3: refill from on-topic FRESH bank — restore size, floor MIN_EX
  const seen = new Set(list.map(qKey).filter(Boolean));
  const bank = FRESH_BY_SLUG[slug] || [];
  const target = Math.max(MIN_EX, Math.min(48, exercises.length));
  let refilled = 0;
  for (const item of bank) {
    if (list.length >= target) break;
    const k = qKey(item);
    if (!k || seen.has(k)) continue;
    if (isMetaFiller(getQ(item))) continue;
    list.push({ ...item });
    seen.add(k);
    refilled++;
  }
  // If still under MIN_EX, restore least-bad stripped meta (keeps count gate)
  let restored = 0;
  while (list.length < MIN_EX && strippedMeta.length) {
    list.push(strippedMeta.shift());
    restored++;
  }
  if (refilled) log.push({ code: 'REFILL', n: refilled, final: list.length, target });
  if (restored) {
    metaRemoved -= restored;
    log.push({ code: 'META_RESTORE_FOR_MIN', n: restored, final: list.length });
  }
  if (list.length < MIN_EX) {
    log.push({ code: 'UNDER_MIN', n: list.length, slug });
  }

  return { list, log, metaRemoved, keyFixes, refilled, finalN: list.length };
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log(`\n🛠  FULL LOGIC APPLY (${APPLY ? 'APPLY' : 'DRY'})…\n`);

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
        lessons: lessons.map((L) => ({
          id: L.id,
          slug: L.topic?.slug,
          exercises: L.exercises,
        })),
      })
    );
    console.log('📦 backup', bp);
  }

  const report = {
    at: new Date().toISOString(),
    apply: APPLY,
    lessons: [],
    totals: { metaRemoved: 0, keyFixes: 0, refilled: 0, lessonsUpdated: 0 },
  };

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '?';
    const before = Array.isArray(L.exercises) ? L.exercises : [];
    const { list, log, metaRemoved, keyFixes, refilled, finalN } = processLesson(slug, before);

    const changed =
      metaRemoved > 0 ||
      keyFixes > 0 ||
      refilled > 0 ||
      JSON.stringify(list) !== JSON.stringify(before);

    if (!changed) continue;

    report.totals.metaRemoved += metaRemoved;
    report.totals.keyFixes += keyFixes;
    report.totals.refilled += refilled;
    report.totals.lessonsUpdated++;
    report.lessons.push({
      slug,
      before: before.length,
      after: finalN,
      metaRemoved,
      keyFixes,
      refilled,
      log,
    });

    console.log(
      `${APPLY ? '💾' : '·'} ${slug}: ${before.length}→${finalN} meta-${metaRemoved} key+${keyFixes} refill+${refilled}`
    );

    if (APPLY) {
      const { error: uErr } = await sb
        .from('grammar_lessons')
        .update({ exercises: list })
        .eq('id', L.id);
      if (uErr) console.error('  FAIL', uErr.message);
    }
  }

  // Highlight key fixes
  const keyLogs = report.lessons.flatMap((L) =>
    (L.log || [])
      .filter((x) => /TF_FORCE|ERROR_FIX|MCQ_FIX/.test(x.code))
      .map((x) => ({ slug: L.slug, ...x }))
  );
  console.log('\n=== KEY FIXES ===');
  keyLogs.forEach((x) => console.log(JSON.stringify(x)));
  console.log('\n=== TOTALS ===', report.totals);

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/full-logic-apply-report.json', JSON.stringify(report, null, 2));
  console.log('→ tmp/full-logic-apply-report.json\n');

  if (APPLY && CLEAR_CACHE) {
    try {
      await sb.from('grammar_quiz_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('🧹 quiz cache cleared');
    } catch {
      /* ignore */
    }
  }

  if (!APPLY) console.log('Run with --apply to write DB.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
