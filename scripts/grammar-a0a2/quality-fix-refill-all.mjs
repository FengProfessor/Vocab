/**
 * Purge junk AG padding + refill quality exercises for all 62 lessons.
 * NO external LLM API — deterministic from sections/examples + keep good items.
 *
 *   node scripts/grammar-a0a2/quality-fix-refill-all.mjs --dry
 *   node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply
 *   node scripts/grammar-a0a2/quality-fix-refill-all.mjs --apply --only articles,present-simple
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GOLD_A0 } from './gold-lessons-a0.mjs';
import { FRESH_BY_SLUG } from './practice-banks-fresh.mjs';

const DRY = !process.argv.includes('--apply');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  if (i < 0) return null;
  return new Set(
    String(process.argv[i + 1] || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
})();

const TARGET = 42;
const HARD_CAP = 56;
// error: soft floor 0 (fake errors worse); FRESH/EXTRA banks supply real errors
const TYPE_MIN = { mcq: 10, fill: 8, error: 0, tf: 6 };

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

const mcq = (q, opts, answer, fb, case_id) => ({
  type: 'mcq',
  q,
  opts,
  answer,
  fb,
  case_id,
});
const fill = (q, opts, answer, fb, case_id) => ({
  type: 'fill',
  q,
  opts,
  answer,
  fb,
  case_id,
});
const err = (q, opts, answer, fb, case_id) => ({
  type: 'error',
  q,
  opts,
  answer,
  fb,
  case_id,
});
const tf = (q, answer, fb, case_id) => ({ type: 'tf', q, answer, fb, case_id });

const VI =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const LEGIT_SS =
  /\b(class|glass|pass|less|success|address|process|access|discuss|miss|press|across|business|stress|express|possess|assess|embarrass|necessary|possible|possible|assignment|passive|massive|classic|russian|lesson|messy|kiss|boss|cross|dress|guess|bless|chess|bass|fuss|moss|toss|hiss|loss|mass|mess)\b/i;

function normQ(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getQ(e) {
  return String(e?.q || e?.question || '').trim();
}
function getOpts(e) {
  const o = e?.opts ?? e?.options;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
}
function getAns(e) {
  return e?.answer !== undefined ? e.answer : e?.correct_answer;
}
function getFb(e) {
  return String(e?.fb || e?.explanation || '').trim();
}
function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  if (!['mcq', 'fill', 'error', 'tf'].includes(t)) t = 'mcq';
  return t;
}

/** Heuristic: item is AG junk / unusable */
function junkReasons(e) {
  const reasons = [];
  const q = getQ(e);
  const opts = getOpts(e);
  const ans = getAns(e);
  const fb = getFb(e);
  const type = getType(e);
  const caseId = String(e?.case_id || '');

  if (!q) reasons.push('empty_q');

  // opts junk
  if (opts.some((o) => /^another$/i.test(o))) reasons.push('opt_another');
  if (opts.some((o) => /another incorrect variation/i.test(o))) reasons.push('opt_another_var');
  if (opts.some((o) => /another wrong variant/i.test(o))) reasons.push('opt_another_var2');
  if (opts.some((o) => /(eds|ings|seds)$/i.test(o))) reasons.push('opt_morph');
  if (opts.some((o) => /[a-z]s{2,}(?:ing|ed)?$/i.test(o) && !LEGIT_SS.test(o)))
    reasons.push('opt_fake_ss');

  // fake double-s in error stems (teachess, bookss, tonights)
  if (/find the error|sửa/i.test(q)) {
    const stem = q.replace(/^.*?(find the error|sửa)\s*:\s*/i, '');
    if (/\b\w+ss\b/i.test(stem) && !LEGIT_SS.test(stem)) reasons.push('fake_ss_stem');
    // polarity flip only: answer is just will↔won't of correct sentence
    const a = String(ans || '').trim();
    if (stem && a) {
      const s0 = stem.replace(/[.?!]+$/, '').trim().toLowerCase();
      const a0 = a.replace(/[.?!]+$/, '').trim().toLowerCase();
      if (s0 === a0) reasons.push('error_ans_eq_stem');
      // will↔won't / can↔can't only (stem already grammatical)
      const neut = (x) =>
        x
          .replace(/\b(won'?t|will not)\b/g, 'WILL')
          .replace(/\bwill\b/g, 'WILL')
          .replace(/\b(can'?t|cannot)\b/g, 'CAN')
          .replace(/\bcan\b/g, 'CAN')
          .replace(/\b(isn'?t|is not)\b/g, 'IS')
          .replace(/\bis\b/g, 'IS');
      if (s0 !== a0 && neut(s0) === neut(a0)) reasons.push('polarity_fake_error');
    }
  }

  if (/which of the following demonstrates the rule/i.test(q)) reasons.push('meta_rule');
  if (/which example fits/i.test(q)) reasons.push('meta_rule_fit'); // often multi-correct (a book + a cat)
  if (/is this formula rule correct/i.test(q)) reasons.push('meta_formula_tf');
  if (/is ".*?" a correct example of "/i.test(q) && /→/.test(q)) reasons.push('meta_rule_arrow');
  // multi-correct trap: fits "a" with several "a …" options
  if (/which example fits\s*"a"/i.test(q)) {
    const aOpts = opts.filter((o) => /^a\s+/i.test(o));
    if (aOpts.length >= 2) reasons.push('multi_correct_a');
  }
  if (/which example fits\s*"an"/i.test(q)) {
    const aOpts = opts.filter((o) => /^an\s+/i.test(o));
    if (aOpts.length >= 2) reasons.push('multi_correct_an');
  }
  // VI note stuck in stem
  if (/\(khi | \(nói | \(khi nói/i.test(q)) reasons.push('vi_parenthetical');

  // Vietnamese treated as English sentence
  if (/is the sentence\s+"/i.test(q) && VI.test(q)) reasons.push('vi_as_en');
  // error stem is Vietnamese tip / non-English
  if (/find the error|sửa/i.test(q)) {
    const stem = q.replace(/^.*?(find the error|sửa)\s*:\s*/i, '');
    const letters = (stem.match(/[A-Za-z]/g) || []).join('');
    if (VI.test(stem) && letters.length < 24) reasons.push('vi_error_stem');
    if (
      /dùng (cấu trúc|nhầm)|thành phần|bỏ thành|ghép hai|trước khi viết|mẫu “|mẫu "/i.test(stem)
    )
      reasons.push('vi_error_stem');
    // starts with Vietnamese word (capital or not)
    if (/^(dùng|sử dụng|ghép|tránh|không|nên|cần|lỗi)/i.test(stem.trim()))
      reasons.push('vi_error_stem');
  }
  // VI option as "answer sentence"
  if (opts.some((o) => VI.test(o) && (o.match(/[A-Za-z]/g) || []).length < 16 && o.length > 12))
    reasons.push('vi_opt');

  // vocabulary padding case_id with junk morph opts
  if (/^vocabulary/i.test(caseId)) {
    if (opts.some((o) => /another/i.test(o) || /(eds|ings)$/i.test(o) || /s{2}/.test(o)))
      reasons.push('vocab_pad_junk');
    // noun fill not grammar: They play ___. football
    if (type === 'fill') {
      const a = String(ans || '');
      if (
        /___\s*\.?$/.test(q.trim()) &&
        !/\b(am|is|are|was|were|do|does|did|have|has|had|will|would|can|could|may|might|must|should|shall|to|a|an|the|not|be|been|being)\b/i.test(
          a,
        ) &&
        !/prep|modal|article|pronoun|relative|tag|if|wish/i.test(caseId)
      ) {
        // allow if q clearly tests article/prep etc
        if (!/\b(a|an|the|in|on|at|to|for|of|with|by|from)\b.*___/i.test(q) && !/___\s+(a|an|the|in|on|at)\b/i.test(q)) {
          if (!/\b(much|many|some|any|few|little|who|which|that|this|these|those)\b/i.test(a)) {
            reasons.push('noun_vocab_fill');
          }
        }
      }
    }
  }

  // generic fb marker from AG
  if (/giải thích bài tập/i.test(fb)) reasons.push('generic_fb');

  // answer not in opts
  if (type !== 'tf') {
    const a = String(ans ?? '').trim();
    if (!opts.length) reasons.push('no_opts');
    else if (a && !opts.includes(a)) reasons.push('ans_not_in_opts');
  } else {
    if (ans !== true && ans !== false && !/^(true|false|đúng|sai)$/i.test(String(ans)))
      reasons.push('bad_tf_ans');
  }

  // TF pad spam: "The sentence \"X\" is grammatically correct." with vocabulary_tf*
  if (
    /^vocabulary_tf/i.test(caseId) ||
    (/_tf_true$/i.test(caseId) && /the sentence "/i.test(q))
  ) {
    // keep some if not other junk — mark soft; we'll demote later
    reasons.push('tf_template_pad');
  }

  // too short mcq options that are "An incorrect sentence for X"
  if (opts.some((o) => /^an incorrect sentence/i.test(o))) reasons.push('placeholder_opt');
  if (opts.some((o) => /^another wrong sentence/i.test(o))) reasons.push('placeholder_opt2');

  return reasons;
}

function isHardJunk(reasons) {
  const hard = new Set([
    'empty_q',
    'opt_another',
    'opt_another_var',
    'opt_another_var2',
    'opt_morph',
    'opt_fake_ss',
    'fake_ss_stem',
    'error_ans_eq_stem',
    'polarity_fake_error',
    'meta_rule',
    'meta_rule_fit',
    'meta_formula_tf',
    'multi_correct_a',
    'multi_correct_an',
    'vi_as_en',
    'vi_error_stem',
    'vi_opt',
    'vi_parenthetical',
    'vocab_pad_junk',
    'noun_vocab_fill',
    'no_opts',
    'ans_not_in_opts',
    'bad_tf_ans',
    'placeholder_opt',
    'placeholder_opt2',
  ]);
  return reasons.some((r) => hard.has(r));
}

function normalizeItem(e) {
  const type = getType(e);
  const q = getQ(e);
  let opts = getOpts(e);
  let answer = getAns(e);
  const fb = getFb(e) || 'Ôn lại quy tắc trong bài.';
  const case_id = e?.case_id ? String(e.case_id).slice(0, 80) : undefined;

  if (type === 'tf') {
    let a = answer;
    if (a === true || a === false) {
      /* ok */
    } else {
      const s = String(a).toLowerCase();
      a = s === 'true' || s === 'đúng' || s === 'yes' || s === 'correct';
    }
    return { type: 'tf', q, answer: a, fb, case_id };
  }

  answer = String(answer ?? '').trim();
  opts = opts.map((o) => String(o).trim()).filter(Boolean);
  // dedupe opts keep answer
  const seen = new Set();
  const cleanOpts = [];
  for (const o of opts) {
    const k = o.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    cleanOpts.push(o);
  }
  if (answer && !cleanOpts.includes(answer)) cleanOpts.unshift(answer);
  while (cleanOpts.length < 2 && type !== 'tf') {
    cleanOpts.push(cleanOpts[0] === answer ? `${answer} (wrong)` : '—');
  }

  return {
    type,
    q,
    opts: cleanOpts.slice(0, 5),
    answer,
    fb: fb.slice(0, 280),
    case_id,
  };
}

function scoreItem(e) {
  let s = 0;
  const type = getType(e);
  const q = getQ(e);
  const opts = getOpts(e);
  const fb = getFb(e);
  if (q.length > 12) s += 2;
  if (fb.length > 8) s += 2;
  if (e?.case_id) s += 1;
  if (type === 'fill' && q.includes('___')) s += 2;
  if (type === 'error' && /find the error|sửa/i.test(q)) s += 2;
  if (type === 'mcq' && opts.length >= 3) s += 2;
  if (type === 'tf') s += 0; // lower priority
  if (/giải thích bài tập/i.test(fb)) s -= 5;
  if (/^vocabulary/i.test(String(e?.case_id || ''))) s -= 2;
  if (/tf_template|vocabulary_tf/i.test(String(e?.case_id || ''))) s -= 3;
  return s;
}

// ── Theory banlist: practice must NOT clone lesson examples / mistakes ─────

function stripViNote(s) {
  return String(s || '')
    .replace(/\s*[\(（][^)\）]*[\)）]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Banlist for practice clones of "outside theory" content.
 * Includes examples + usage + rule/formula examples.
 * Mistakes are allowed as practice source for non-FRESH topics (still strip VI notes).
 * For FRESH topics we ignore mistakes entirely and only use hand bank.
 */
function buildTheoryBanlist(sections = {}, examples = [], { includeMistakes = false } = {}) {
  const phrases = [];
  for (const e of examples || []) {
    if (e?.en) phrases.push(e.en);
  }
  if (includeMistakes) {
    for (const m of sections.mistakes || []) {
      if (m?.wrong) phrases.push(stripViNote(m.wrong));
      if (m?.right) phrases.push(stripViNote(m.right));
    }
  }
  for (const r of sections.rules || []) {
    for (const p of String(r.example || '').split(/·/)) phrases.push(p.trim());
  }
  for (const u of sections.usage || []) {
    if (u?.en) {
      for (const p of String(u.en).split(/·/)) phrases.push(p.trim());
    }
  }
  if (sections.formula?.rows) {
    for (const row of sections.formula.rows) {
      const ex = row['Ví dụ'] || row['Example'] || '';
      for (const p of String(ex).split(/·/)) phrases.push(p.trim());
    }
  }
  const set = new Set();
  for (const p of phrases) {
    const n = normQ(stripViNote(p));
    if (n && n.length >= 10) set.add(n);
  }
  return set;
}

function itemOverlapsTheory(item, banlist) {
  if (!banlist || banlist.size === 0) return false;
  const q = stripViNote(getQ(item));
  const stem = normQ(
    q
      .replace(
        /^(find the error|sửa|choose the (correct sentence|missing word)|is the sentence|which example fits|which sentence fits|example for)\s*:?\s*/i,
        '',
      )
      .replace(/^"+|"+$/g, ''),
  );
  const ans = normQ(stripViNote(String(getAns(item) ?? '')));
  for (const ban of banlist) {
    if (!ban || ban.length < 10) continue;
    // Only full-phrase clones (3+ words or long phrase), not single tokens
    const words = ban.split(/\s+/).filter(Boolean);
    if (words.length < 3 && ban.length < 18) continue;
    if (stem === ban || stem.startsWith(ban + ' ') || stem.endsWith(' ' + ban)) return true;
    if (stem.includes(ban) && ban.length >= 14) return true;
    if (ans === ban && words.length >= 3) return true;
  }
  return false;
}

// ── Quality generators from theory ─────────────────────────────────────────

function corruptSimple(en) {
  // light, on-purpose corruptions for distractors — not fake ss
  let s = en;
  const swaps = [
    [/\bdoesn't\b/i, "don't"],
    [/\bdon't\b/i, "doesn't"],
    [/\bgoes\b/i, 'go'],
    [/\bgo\b/i, 'goes'],
    [/\bis\b/i, 'are'],
    [/\bare\b/i, 'is'],
    [/\bwas\b/i, 'were'],
    [/\bwere\b/i, 'was'],
    [/\bhas\b/i, 'have'],
    [/\bhave\b/i, 'has'],
    [/\bwill\b/i, 'would'],
    [/\bwould\b/i, 'will'],
    [/\bcan\b/i, 'could'],
    [/\bmuch\b/i, 'many'],
    [/\bmany\b/i, 'much'],
    [/\ba\b/i, 'an'],
    [/\ban\b/i, 'a'],
    [/\bthis\b/i, 'these'],
    [/\bthese\b/i, 'this'],
    [/\bthat\b/i, 'those'],
    [/\bthose\b/i, 'that'],
    [/\bif\b/i, 'unless'],
    [/\bwho\b/i, 'which'],
    [/\bwhich\b/i, 'who'],
  ];
  for (const [re, to] of swaps) {
    if (re.test(s)) {
      const next = s.replace(re, to);
      if (next !== s) return next;
    }
  }
  // remove -s from 3sg if present
  if (/\b(he|she|it)\b/i.test(s) && /\b\w+s\b/.test(s)) {
    const n = s.replace(/\b([a-z]+)s\b/i, '$1');
    if (n !== s) return n;
  }
  // last resort: flip a common aux if none matched
  if (/\bnot\b/i.test(s)) return s.replace(/\bnot\b/i, '');
  return null;
}

/**
 * Practice from mistakes: strip VI notes; still may overlap theory → filtered by banlist.
 * Prefer FRESH banks when present. For other topics this restores error volume.
 */
function genFromMistakes(mistakes, { allowTheoryClone = false } = {}) {
  const out = [];
  for (const m of mistakes || []) {
    const wrong = stripViNote(m.wrong || '');
    const right = stripViNote(m.right || '');
    const why = String(m.why || 'Lỗi thường gặp').trim();
    if (!wrong || !right || wrong.toLowerCase() === right.toLowerCase()) continue;
    if (VI.test(wrong) && (wrong.match(/[A-Za-z]/g) || []).length < 8) continue;
    if (/^(dùng|sử dụng|ghép|tránh)/i.test(wrong)) continue;

    const case_id = `mx_${normQ(right).slice(0, 28).replace(/\s+/g, '_')}`;
    if (!allowTheoryClone) {
      out.push(tf(`Rule check: ${why}`, true, why, `rule_${case_id}`));
      continue;
    }
    const bad2 = corruptSimple(right);
    const opts = [right, wrong, bad2].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i);
    if (opts.length < 2) continue;
    out.push(err(`Find the error: ${wrong}`, opts, right, why, case_id));
    out.push(mcq('Choose the correct sentence.', opts, right, why, case_id));
    out.push(tf(`"${wrong}" is correct English.`, false, `Sai. Đúng: ${right}. ${why}`, case_id));
  }
  return out;
}

function genFromRules(rules) {
  const out = [];
  for (const r of rules || []) {
    const c = String(r.case || r.rule || '').trim();
    const rule = String(r.rule || '').trim();
    const example = String(r.example || '').trim();
    if (!c && !rule) continue;
    const case_id = `rule_${normQ(c || rule).slice(0, 36).replace(/\s+/g, '_')}`;

    // Morphology only (play → plays) — not free-text multi-correct "fits a"
    if (example && example.includes('→')) {
      const parts = example.split(/·/).map((x) => x.trim()).filter(Boolean);
      for (const p of parts.slice(0, 2)) {
        const m = p.match(/^(.+?)\s*→\s*(.+)$/);
        if (!m) continue;
        const from = m[1].trim();
        const to = m[2].trim();
        if (!from || !to || from.length > 24 || to.length > 24) continue;
        out.push(
          mcq(
            `${from} → ?`,
            [to, from, from + 'ing'].filter((x, i, a) => a.indexOf(x) === i),
            to,
            `${c}: ${rule || example}`,
            case_id,
          ),
        );
        out.push(
          fill(
            `${from} → ___`,
            [to, from, from + 'ed'].filter((x, i, a) => a.indexOf(x) === i),
            to,
            rule || c,
            case_id,
          ),
        );
      }
    } else if (rule) {
      // rule statement only — do NOT paste example phrases into practice opts
      out.push(tf(`Rule "${c}": ${rule}`, true, `${c}: ${rule}`, case_id));
    }
  }
  return out;
}

function genFromFormula(formula) {
  const out = [];
  const rows = formula?.rows;
  if (!Array.isArray(rows)) return out;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const vals = Object.values(row).map((v) => String(v || '').trim());
    const form =
      row['Cấu trúc'] ||
      row['Quy tắc'] ||
      row['Form'] ||
      row['Pattern'] ||
      vals.find((v) => /S \+|V-|don't|Does|will|have|be /i.test(v)) ||
      '';
    const ex =
      row['Ví dụ'] ||
      row['Example'] ||
      vals.find((v) => /[.?]/.test(v) && /[A-Za-z]/.test(v)) ||
      '';
    const label =
      row['Dạng'] ||
      row['Trường hợp'] ||
      row['Case'] ||
      row['Loại'] ||
      `form_${i}`;
    const case_id = `formula_${normQ(String(label)).slice(0, 30).replace(/\s+/g, '_')}`;

    if (form && form.length > 3 && form.length < 80) {
      const badForm = corruptSimple(form) || 'S + being + V3';
      out.push(
        mcq(
          `Which structure matches "${label}"?`,
          [form, badForm, 'S + being + V3'].filter((x, i, a) => a.indexOf(x) === i),
          form,
          `Công thức: ${form}`,
          case_id,
        ),
      );
      out.push(
        tf(`For "${label}", structure is: ${form}`, true, String(label), case_id),
      );
    }
    if (ex && /[A-Za-z]{3,}/.test(ex) && ex.length < 100 && !VI.test(ex.split('·')[0] || '')) {
      const e0 = ex.split(/·/)[0].trim();
      const badE = corruptSimple(e0);
      if (e0.length > 5 && badE) {
        out.push(
          err(
            `Find the error: ${badE}`,
            [e0, badE].filter((x, i, a) => a.indexOf(x) === i),
            e0,
            `Dạng ${label}: ${form || e0}`,
            case_id,
          ),
        );
      }
    }
  }
  return out;
}

const GRAMMAR_BLANK_RES = [
  { re: /\b(a|an|the)\b/i, opts: ['a', 'an', 'the', '—'], case_id: 'article' },
  { re: /\b(am|is|are|was|were)\b/i, opts: ['am', 'is', 'are', 'was', 'were'], case_id: 'be' },
  { re: /\b(do|does|did|don't|doesn't|didn't)\b/i, opts: ['do', 'does', 'did', "don't", "doesn't"], case_id: 'do' },
  { re: /\b(have|has|had|haven't|hasn't)\b/i, opts: ['have', 'has', 'had'], case_id: 'have' },
  { re: /\b(will|won't|would|wouldn't)\b/i, opts: ['will', "won't", 'would', "wouldn't"], case_id: 'will' },
  { re: /\b(can|can't|could|couldn't|may|might|must|should|shouldn't)\b/i, opts: ['can', 'could', 'may', 'must', 'should'], case_id: 'modal' },
  { re: /\b(much|many|some|any|few|little|a few|a little)\b/i, opts: ['much', 'many', 'some', 'any', 'a few', 'a little'], case_id: 'quant' },
  { re: /\b(this|that|these|those)\b/i, opts: ['this', 'that', 'these', 'those'], case_id: 'dem' },
  { re: /\b(who|whom|whose|which|that|where|when)\b/i, opts: ['who', 'which', 'that', 'whose', 'where'], case_id: 'rel' },
  { re: /\b(in|on|at|by|for|from|to|with|of)\b/i, opts: ['in', 'on', 'at', 'by', 'for', 'to'], case_id: 'prep' },
  { re: /\b(if|unless|when|while|although|because|so|but)\b/i, opts: ['if', 'unless', 'when', 'although', 'because'], case_id: 'link' },
  { re: /\b(I|me|he|him|she|her|we|us|they|them)\b/, opts: ['I', 'me', 'he', 'him', 'she', 'her', 'we', 'us', 'they', 'them'], case_id: 'pron' },
  { re: /\b(my|mine|your|yours|his|her|hers|our|ours|their|theirs)\b/i, opts: ['my', 'mine', 'your', 'yours', 'his', 'her', 'hers'], case_id: 'poss' },
  { re: /\b(going to|used to|have to|has to|ought to)\b/i, opts: ['going to', 'used to', 'have to', 'ought to'], case_id: 'chunk' },
];

/** Preferred blank case_ids per topic — avoid article drills on future-will etc. */
function preferredCasesForSlug(slug) {
  const s = String(slug || '');
  if (s === 'articles') return ['article'];
  if (s.includes('pronoun')) return ['pron'];
  if (s.includes('possess')) return ['poss'];
  if (s.includes('demonstrat')) return ['dem'];
  if (s.includes('quantifier') || s.includes('countable')) return ['quant', 'article'];
  if (s.includes('preposition')) return ['prep'];
  if (s.includes('relative') || s.includes('cleft')) return ['rel'];
  if (s.includes('modal') || s.includes('permission') || s.includes('obligation') || s.includes('advice') || s.includes('ability') || s.includes('deduction'))
    return ['modal', 'will', 'have'];
  if (s.includes('conditional') || s.includes('wish')) return ['link', 'will', 'have', 'be'];
  if (s.includes('future') || s === 'be-going-to') return ['will', 'chunk', 'be'];
  if (s.includes('perfect') || s.includes('passive') || s.includes('causative')) return ['have', 'be', 'will'];
  if (s.includes('continuous') || s === 'verb-to-be') return ['be'];
  if (s.includes('present-simple') || s.includes('past-simple') || s.includes('wh-question')) return ['do', 'verb_form', 'be'];
  if (s.includes('used-to') || s.includes('going-to')) return ['chunk', 'be'];
  if (s.includes('gerund') || s.includes('infinit')) return ['verb_form', 'chunk'];
  if (s.includes('reported')) return ['will', 'have', 'do', 'be'];
  if (s.includes('question-tag')) return ['be', 'do', 'will', 'have', 'modal'];
  if (s.includes('there-is')) return ['be'];
  if (s.includes('have-got')) return ['have', 'chunk'];
  if (s.includes('imperative')) return ['verb_form', 'be'];
  if (s.includes('adverb') || s.includes('adjective')) return ['be', 'verb_form'];
  if (s.includes('conjunction') || s.includes('discourse') || s.includes('hedging')) return ['link'];
  if (s.includes('subjunctive')) return ['be', 'rel', 'will'];
  if (s.includes('inversion') || s.includes('emphasis') || s.includes('ellipsis') || s.includes('nominal') || s.includes('participle'))
    return ['be', 'have', 'will', 'link'];
  if (s.includes('phrasal') || s.includes('collocation')) return ['prep', 'chunk', 'verb_form'];
  if (s.includes('plural')) return ['verb_form', 'be'];
  return ['any'];
}

function blankSentence(en, slug) {
  const s = String(en || '').trim();
  if (!s || s.length < 6 || s.length > 120) return null;
  if (VI.test(s) && (s.match(/[A-Za-z]/g) || []).length < 10) return null;

  const preferred = preferredCasesForSlug(slug);
  const ordered = [
    ...GRAMMAR_BLANK_RES.filter((r) => preferred.includes(r.case_id)),
    // only fall back to other cases if preferred empty match — never to article unless preferred
    ...GRAMMAR_BLANK_RES.filter((r) => !preferred.includes(r.case_id) && preferred.includes('any')),
  ];
  // if preferred has no 'any' and no match, try preferred-only only (already in ordered)

  const tryRules = ordered.length ? ordered : GRAMMAR_BLANK_RES.filter((r) => preferred.includes(r.case_id));

  for (const rule of tryRules) {
    const m = s.match(rule.re);
    if (!m) continue;
    const target = m[1];
    const q = s.replace(rule.re, '___');
    if (q === s || !q.includes('___')) continue;
    const opts2 = [...new Set([target, ...rule.opts.map((o) => (o.toLowerCase() === target.toLowerCase() ? target : o))])].slice(0, 5);
    if (!opts2.includes(target)) opts2.unshift(target);
    return {
      q,
      answer: target,
      opts: opts2,
      case_id: rule.case_id,
    };
  }

  // verb form only if topic wants it
  if (preferred.includes('verb_form') || preferred.includes('any')) {
    const vm = s.match(/\b([A-Za-z]{3,})(ing|ed|es|s)\b/);
    if (vm && !/this|that|with|from|have|does|will|shall|there|less|ness/i.test(vm[1])) {
      const full = vm[0];
      const base = vm[1];
      const q = s.replace(full, '___');
      const opts = [...new Set([full, base, base + 'ing', base + 'ed'])].slice(0, 4);
      return { q, answer: full, opts, case_id: 'verb_form' };
    }
  }
  return null;
}

/** Drop items clearly off-topic for slug (article drills on future-will, etc.) */
function isOffTopicForSlug(e, slug) {
  const caseId = String(e?.case_id || '');
  const q = getQ(e);
  const ans = String(getAns(e) ?? '');
  const fb = getFb(e);
  const opts = getOpts(e);
  const pref = preferredCasesForSlug(slug);
  if (pref.includes('any')) return false;

  // Vietnamese option as "correct sentence"
  if (opts.some((o) => VI.test(o) && (o.match(/[A-Za-z]/g) || []).length < 12)) return true;
  if (/\(wrong form\)/i.test(q) || opts.some((o) => /\(wrong form\)/i.test(o))) return true;

  // derived broken: "Choose ___ missing word" from replacing "the" in template
  if (/choose\s+___\s+missing/i.test(q)) return true;

  // If answer is pure article but topic is not articles/countable
  if (
    /^(a|an|the|—)$/i.test(ans) &&
    !['articles', 'countable-uncountable', 'quantifiers'].includes(slug) &&
    !pref.includes('article')
  ) {
    return true;
  }
  // case_id article on non-article lessons
  if (/^article/i.test(caseId) && !pref.includes('article') && slug !== 'articles') return true;

  if (slug.includes('future-will') && /^(a|an|the)$/i.test(ans)) return true;

  // articles: drop verb/pronoun blanks that are not about a/an/the
  if (slug === 'articles') {
    if (/^(plays?|are|is|am|do|does|i|me|he|she|they|we|was|were)$/i.test(ans)) return true;
    if (
      !/^(a|an|the|—)$/i.test(ans) &&
      getType(e) !== 'tf' &&
      getType(e) !== 'error' &&
      !/\b(a|an|the)\b/i.test(opts.join(' '))
    ) {
      return true;
    }
  }

  return false;
}

/**
 * When no FRESH bank: blank examples for practice volume (banlist drops exact clones if too close).
 * When has FRESH: skip — theory examples stay outside practice.
 */
function genFromExamples(examples, slug, { skip = false } = {}) {
  if (skip) return [];
  const out = [];
  for (const ex of examples || []) {
    const en = String(ex.en || '').trim();
    const vi = String(ex.vi || '').trim();
    const note = String(ex.note || '').trim();
    if (!en) continue;
    const blank = blankSentence(en, slug);
    if (!blank?.q) continue;
    const fb = [vi, note].filter(Boolean).join(' · ') || 'Theo ví dụ bài học';
    const itemFill = fill(blank.q, blank.opts, blank.answer, fb, `${blank.case_id}_${slug}`.slice(0, 40));
    if (!isOffTopicForSlug(itemFill, slug)) out.push(itemFill);
  }
  return out;
}

function genFromUsage(usage, { skip = false } = {}) {
  if (skip) return [];
  const out = [];
  for (const u of usage || []) {
    const label = String(u.label || '').trim();
    const vi = String(u.vi || '').trim();
    if (!label && !vi) continue;
    const case_id = `usage_${normQ(label || vi).slice(0, 28).replace(/\s+/g, '_')}`;
    out.push(tf(`This lesson covers: "${label || vi}".`, true, vi || label, case_id));
  }
  return out;
}

function genFromComparison(comparison, tips) {
  const out = [];
  const text = [comparison, tips].filter(Boolean).join(' ');
  if (!text) return out;
  // Extract **A vs B** style
  const pairs = [...text.matchAll(/\*\*([^*]+?)\s+vs\.?\s+([^*]+?)\*\*/gi)];
  for (const m of pairs.slice(0, 4)) {
    const a = m[1].trim();
    const b = m[2].trim();
    if (a.length > 40 || b.length > 40) continue;
    const case_id = `contrast_${normQ(a).slice(0, 16)}`;
    out.push(
      tf(`"${a}" and "${b}" are the same form.`, false, `Khác nhau: ${a} vs ${b}`, case_id),
    );
    out.push(
      mcq(
        `Contrast focus: which is a valid pair in this lesson?`,
        [`${a} vs ${b}`, `${a} = ${b} always`, `Ignore ${b}`],
        `${a} vs ${b}`,
        `Phân biệt ${a} / ${b}`,
        case_id,
      ),
    );
  }
  return out;
}

function typeCounts(list) {
  const c = { mcq: 0, fill: 0, error: 0, tf: 0 };
  for (const e of list) c[getType(e)] = (c[getType(e)] || 0) + 1;
  return c;
}

function mergeUnique(lists, slug = '', banlist = null) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    for (const raw of list || []) {
      if (!raw) continue;
      const item = normalizeItem(raw);
      const reasons = junkReasons(item);
      if (isHardJunk(reasons)) continue;
      if (slug && isOffTopicForSlug(item, slug)) continue;
      if (banlist && itemOverlapsTheory(item, banlist)) continue;
      if (/\(wrong form\)/i.test(item.q) || (item.opts || []).some((o) => /\(wrong form\)/i.test(o))) continue;
      if (/\(khi | \(nói /i.test(item.q)) continue;
      const k = normQ(item.q);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      // Prefer fresh practice banks
      const boost = /^practice_|^art_|^fresh_|err_|zero_|an_|a_|the_/i.test(String(item.case_id || ''))
        ? 5
        : 0;
      out.push({
        ...item,
        _score:
          scoreItem(item) +
          boost -
          (reasons.includes('tf_template_pad') ? 4 : 0) -
          (reasons.includes('generic_fb') ? 3 : 0),
      });
    }
  }
  return out;
}

/** Derive alternate types from a good item to hit floors */
function deriveSiblings(e) {
  const out = [];
  const type = getType(e);
  const q = getQ(e);
  const opts = getOpts(e);
  const ans = String(getAns(e) ?? '');
  const fb = getFb(e) || 'Ôn quy tắc bài học';
  const case_id = e?.case_id ? `${e.case_id}_d` : 'derived';

  if (type === 'mcq' && opts.length >= 2 && ans) {
    // never derive from multi-slot answers like "The / the" or "a / The"
    if (/\/|,/.test(ans) || ans.split(/\s+/).length > 6) {
      /* skip fragile derives */
    } else if (
      ans.length > 0 &&
      ans.length < 40 &&
      !/^choose the /i.test(q) &&
      new RegExp(`\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q)
    ) {
      out.push(
        fill(
          q.replace(new RegExp(`\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '___'),
          opts,
          ans,
          fb,
          `${case_id}_fill`,
        ),
      );
    } else if (!q.includes('___') && ans.length < 24 && opts.every((o) => o.split(/\s+/).length <= 3 && !/\//.test(o))) {
      out.push(fill(`${q.replace(/\?$/, '')}: ___`, opts, ans, fb, `${case_id}_fill2`));
    }
    if (ans.split(/\s+/).length >= 4 && /[A-Za-z]/.test(ans) && !VI.test(ans) && !/\//.test(ans)) {
      const wrong =
        opts.find((o) => o !== ans && o.split(/\s+/).length >= 3 && !VI.test(o) && !/\//.test(o)) ||
        corruptSimple(ans);
      if (wrong && String(wrong).length > 8) {
        out.push(
          err(
            `Find the error: ${wrong}`,
            [ans, wrong].filter((x, i, a) => a.indexOf(x) === i),
            ans,
            fb,
            `${case_id}_err`,
          ),
        );
      }
    }
  }

  if (type === 'error' && opts.length >= 2 && ans && !VI.test(ans)) {
    const cleanOpts = opts.filter((o) => !VI.test(o));
    if (cleanOpts.length >= 2 && cleanOpts.includes(ans)) {
      out.push(mcq('Choose the correct sentence.', cleanOpts, ans, fb, `${case_id}_mcq`));
      const wrongOpt = cleanOpts.find((o) => o !== ans) || '';
      if (wrongOpt) {
        out.push(tf(`"${wrongOpt}" is correct.`, false, fb, `${case_id}_tf`));
      }
    }
  }

  if (type === 'fill' && opts.length >= 2 && ans && q.includes('___')) {
    out.push(mcq(`Choose: ${q}`, opts, ans, fb, `${case_id}_mcq`));
  }

  if (type === 'tf' && typeof getAns(e) === 'boolean') {
    // skip derive — low value
  }

  return out;
}

function balanceAndCap(pool, target = TARGET, slug = '', banlist = null) {
  // expand pool with derived siblings for type coverage
  const expanded = mergeUnique([pool, ...pool.map((e) => deriveSiblings(e))], slug, banlist);

  expanded.sort((a, b) => (b._score || 0) - (a._score || 0));

  const buckets = { mcq: [], fill: [], error: [], tf: [] };
  for (const e of expanded) {
    const t = getType(e);
    buckets[t].push(e);
  }

  const out = [];
  const seen = new Set();
  const take = (e) => {
    const k = normQ(e.q);
    if (!k || seen.has(k)) return false;
    // reject hard junk again
    if (isHardJunk(junkReasons(e))) return false;
    seen.add(k);
    const { _score, ...rest } = e;
    out.push(rest);
    return true;
  };

  // 1) type mins first
  for (const t of ['mcq', 'fill', 'error', 'tf']) {
    for (const e of buckets[t]) {
      if ((typeCounts(out)[t] || 0) >= TYPE_MIN[t]) break;
      take(e);
    }
  }

  // 2) round-robin until target
  let guard = 0;
  while (out.length < target && guard < 800) {
    guard++;
    let added = false;
    for (const t of ['mcq', 'fill', 'error', 'tf']) {
      if (out.length >= target) break;
      if (t === 'tf' && out.length >= 20) {
        const tc = typeCounts(out);
        if (tc.tf >= Math.ceil(target * 0.25)) continue;
      }
      while (buckets[t].length) {
        const e = buckets[t].shift();
        if (take(e)) {
          added = true;
          break;
        }
      }
    }
    if (!added) break;
  }

  // 3) if type floor still missing, force more derived from what's in out
  let fixGuard = 0;
  while (fixGuard < 40) {
    fixGuard++;
    const tc = typeCounts(out);
    const need = Object.entries(TYPE_MIN).find(([t, n]) => (tc[t] || 0) < n);
    if (!need) break;
    const [needType] = need;
    let got = false;
    for (const base of [...out]) {
      for (const d of deriveSiblings(base)) {
        if (getType(d) !== needType) continue;
        if (take({ ...normalizeItem(d), _score: 1 })) {
          got = true;
          break;
        }
      }
      if (got) break;
    }
    if (!got) break;
  }

  return out.slice(0, HARD_CAP);
}

function loadGoldSeeds(slug) {
  const g = GOLD_A0[slug];
  return Array.isArray(g?.seed_exercises) ? g.seed_exercises : [];
}

/** Hand packs for topics whose theory/examples yield thin fill banks after junk purge */
const EXTRA_SEEDS = {
  'conditionals-0-1': [
    mcq('If it rains, we ___ at home.', ['stay', 'stayed', 'would stay', 'had stayed'], 'stay', 'Type 0/1: If + present, present/will', 't1'),
    fill('If you heat ice, it ___. (melts/melted)', ['melts', 'melted', 'would melt'], 'melts', 'Type 0 fact', 't0'),
    fill('If she ___ hard, she will pass. (studies/studied)', ['studies', 'studied', 'study'], 'studies', 'Type 1: If + present', 't1if'),
    fill('If I see him, I ___ say hello. (will/would)', ['will', 'would', 'would have'], 'will', 'Type 1 result will', 't1will'),
    err('Find the error: If it will rain, we will stay home.', ['If it rains, we will stay home.', 'If it will rain, we stay home.', 'If it rained, we will stay home.'], 'If it rains, we will stay home.', 'If-clause Type1: present, not will', 'willif'),
    err('Find the error: If you will heat water, it boils.', ['If you heat water, it boils.', 'If you heated water, it boils.', 'If you heat water, it boiled.'], 'If you heat water, it boils.', 'Type 0: present-present', 't0err'),
    tf('Type 0 conditionals talk about general truths.', true, 'If + present, present', 't0tf'),
    tf('In Type 1, the if-clause usually uses will + V1.', false, 'If-clause: present; result: will', 't1tf'),
    mcq('If he is late again, I ___ angry.', ['will be', 'would be', 'am being', 'was'], 'will be', 'Type 1 future result', 't1b'),
    fill('Water ___ if you heat it to 100°C. (boils/would boil)', ['boils', 'would boil', 'boiled'], 'boils', 'Type 0', 't0b'),
    mcq('___ it rains, the match will be cancelled.', ['If', 'Unless when', 'Would', 'Had'], 'If', 'If + present', 'ifw'),
    fill('Unless you hurry, you ___ miss the bus. (will/would)', ['will', 'would', 'would have'], 'will', 'unless ≈ if not', 'unless'),
    err('Find the error: If I will have time, I call you.', ['If I have time, I will call you.', 'If I will have time, I will call you.', 'If I had time, I will call you.'], 'If I have time, I will call you.', 'have + will call', 't1c'),
    tf('"If you freeze water, it turns into ice" is Type 0.', true, 'general truth', 't0c'),
    mcq('If she does not study, she ___ fail.', ['will', 'would', 'would have', 'had'], 'will', 'Type 1 negative', 't1d'),
    fill('If they ___ invite us, we will go. (invite/invited)', ['invite', 'invited', 'invites'], 'invite', 'If + present plural', 't1e'),
  ],
  'wish-if-only': [
    mcq('I wish I ___ taller.', ['were', 'am', 'will be', 'have been'], 'were', 'wish + past for present unreal', 'wish_now'),
    fill('I wish I ___ speak French. (could/can)', ['could', 'can', 'will'], 'could', 'wish + could', 'could'),
    fill('I wish you ___ here now. (were/are)', ['were', 'are', 'be'], 'were', 'wish + past', 'were'),
    fill('I wish I ___ harder last year. (had studied/studied)', ['had studied', 'studied', 'study'], 'had studied', 'wish + past perfect for past regret', 'pp'),
    err('Find the error: I wish I am rich.', ['I wish I were rich.', 'I wish I am rich now.', 'I wish I be rich.'], 'I wish I were rich.', 'wish + past (were)', 'am'),
    err('Find the error: I wish I studied yesterday. (past regret)', ['I wish I had studied yesterday.', 'I wish I studied yesterday is always OK for past.', 'I wish I study yesterday.'], 'I wish I had studied yesterday.', 'past regret → past perfect', 'reg'),
    tf('"I wish I were..." can refer to a present unreal situation.', true, 'wish + past', 'tf1'),
    tf('"If only" has a similar meaning to "I wish".', true, 'If only ≈ wish', 'ifonly'),
    mcq('If only it ___ raining.', ['would stop', 'stops', 'will stop', 'stopped will'], 'would stop', 'If only + would for annoyance/future wish', 'would'),
    fill('She wishes she ___ more time. (had/has)', ['had', 'has', 'have'], 'had', 'wish + past', 'had'),
    mcq('I wish he ___ me earlier.', ['had told', 'told', 'tells', 'will tell'], 'had told', 'past regret', 'told'),
    fill('If only I ___ the truth then. (had known/knew)', ['had known', 'knew', 'know'], 'had known', 'If only + past perfect', 'onlypp'),
    err('Find the error: I wish I will be there tomorrow. (hope-like)', ['I hope I will be there tomorrow. / I wish I could be there tomorrow.', 'I wish I will be there tomorrow is best.', 'I wish I am there tomorrow.'], 'I hope I will be there tomorrow. / I wish I could be there tomorrow.', 'wish rarely + will; use hope/could', 'will'),
    tf('"I wish I had gone" regrets a past action.', true, 'wish + past perfect', 'tf2'),
    mcq('They wish they ___ more carefully.', ['had driven', 'drive', 'drives', 'will drive'], 'had driven', 'past regret', 'drive'),
    fill('I wish it ___ so cold today. (weren\'t/isn\'t)', ["weren't", "isn't", "won't be"], "weren't", 'present unreal negative', 'cold'),
  ],
  'imperatives': [
    err('Find the error: Opens the window, please.', ['Open the window, please.', 'Opens the window, please.', 'Opening the window, please.'], 'Open the window, please.', 'imperative = V1', 'imp1'),
    err('Find the error: Not touch that wire.', ["Don't touch that wire.", 'Not touch that wire.', "Doesn't touch that wire."], "Don't touch that wire.", "Don't + V1", 'imp2'),
    fill('___ careful! (Be/Is)', ['Be', 'Is', 'Are'], 'Be', 'Be + adj', 'be'),
  ],
  'prepositions-place': [
    fill('The book is ___ the table. (on/in)', ['on', 'in', 'at'], 'on', 'on + surface', 'on'),
    fill('She is ___ home. (at/in)', ['at', 'in', 'on'], 'at', 'at home', 'at'),
    fill('They live ___ Ha Noi. (in/on)', ['in', 'on', 'at'], 'in', 'in + city', 'in'),
    fill('The cat is ___ the box. (in/on)', ['in', 'on', 'at'], 'in', 'in + enclosed', 'in2'),
    fill('He sits ___ me. (next to/on)', ['next to', 'on', 'at'], 'next to', 'next to + person', 'next'),
    fill('The picture is ___ the wall. (on/in)', ['on', 'in', 'at'], 'on', 'on the wall', 'wall'),
    mcq('Choose: The keys are ___ my bag.', ['in', 'on', 'at'], 'in', 'in + bag', 'bag'),
    mcq('Choose: Meet me ___ the station.', ['at', 'on', 'in'], 'at', 'at + place point', 'st'),
    err('Find the error: She is in home.', ['She is at home.', 'She is in home.', 'She is on home.'], 'She is at home.', 'at home', 'home'),
    err('Find the error: The book is in the table.', ['The book is on the table.', 'The book is in the table.', 'The book is at the table.'], 'The book is on the table.', 'on surface', 'tab'),
  ],
  'modals-advice': [
    fill('You ___ see a doctor. (should/must always)', ['should', 'must', 'can'], 'should', 'advice should', 'sh'),
    fill('You ___ better leave now. (had/would)', ['had', 'would', 'have'], 'had', 'had better', 'hb'),
    fill('You ought ___ apologize. (to/—)', ['to', '—', 'for'], 'to', 'ought to', 'ought'),
    mcq('___ I buy this jacket?', ['Should', 'Must to', 'Ought', 'Have'], 'Should', 'Should for advice Q', 'q'),
    err('Find the error: You should to go home.', ['You should go home.', 'You should to go home.', 'You should going home.'], 'You should go home.', 'should + V1', 'to'),
    err('Find the error: You had better to rest.', ['You had better rest.', 'You had better to rest.', 'You had better resting.'], 'You had better rest.', 'had better + V1', 'hb2'),
    tf('"Should" is softer advice than "must".', true, 'should vs must', 'soft'),
    fill("You shouldn't ___ so much sugar. (eat/eats)", ['eat', 'eats', 'eating'], 'eat', "shouldn't + V1", 'neg'),
  ],
  'discourse-markers': [
    fill('___, I disagree with that point. (However/Because)', ['However', 'Because', 'And'], 'However', 'contrast marker', 'how'),
    fill('I was tired. ___, I finished the work. (Nevertheless/Because)', ['Nevertheless', 'Because', 'So that'], 'Nevertheless', 'contrast', 'nev'),
    fill('___, let us look at the data. (Firstly/Although)', ['Firstly', 'Although', 'Unless'], 'Firstly', 'ordering', 'first'),
    fill('The plan failed. ___ , we learned a lot. (Still/Because of)', ['Still', 'Because of', 'Unless'], 'Still', 'concession', 'still'),
    mcq('Choose the best marker: ___, smoking is harmful.', ['In conclusion', 'Although that', 'Unless'], 'In conclusion', 'closing', 'conc'),
    err('Find the error: However I was tired, I went out. (prefer comma/clause)', ['Although I was tired, I went out. / I was tired. However, I went out.', 'However I was tired, I went out is always best.', 'Because I was tired, however I went out.'], 'Although I was tired, I went out. / I was tired. However, I went out.', 'However is not a conjunction like although', 'hov'),
    fill('___ of the rain, the match continued. (In spite/Because)', ['In spite', 'Because', 'However'], 'In spite', 'In spite of', 'spite'),
    tf('"Moreover" adds another supporting point.', true, 'addition', 'more'),
    mcq('She is smart. ___, she works hard.', ['Furthermore', 'Despite', 'Unless'], 'Furthermore', 'addition', 'fur'),
    fill('___ sum up, practice every day. (To/For)', ['To', 'For', 'At'], 'To', 'To sum up', 'sum'),
  ],
  'ellipsis-substitution': [
    fill('A: Do you like tea? B: Yes, I ___. (do/like)', ['do', 'like', 'am'], 'do', 'substitution with do', 'do'),
    fill('She can swim and so ___ I. (can/do)', ['can', 'do', 'am'], 'can', 'so + aux', 'so'),
    fill('He doesn\'t drive but I ___. (do/drive)', ['do', 'drive', 'am'], 'do', 'but I do', 'but'),
    err('Find the error: A: Are you ready? B: Yes, I do.', ['A: Are you ready? B: Yes, I am.', 'A: Are you ready? B: Yes, I do.', 'A: Are you ready? B: Yes, I ready.'], 'A: Are you ready? B: Yes, I am.', 'be → am not do', 'be'),
    mcq('I like coffee and she ___.', ['does too', 'likes too does', 'is too like'], 'does too', 'too + aux', 'too'),
    fill('They have finished and so ___ we. (have/do)', ['have', 'do', 'are'], 'have', 'so have we', 'have'),
    tf('We can omit repeated words when the meaning is clear (ellipsis).', true, 'ellipsis def', 'def'),
    err('Find the error: She is taller than I am taller.', ['She is taller than I am.', 'She is taller than I am taller.', 'She is taller than I is.'], 'She is taller than I am.', 'ellipsis of taller', 'than'),
  ],
  'nominalisation': [
    fill('The ___ of the bridge took two years. (construction/construct)', ['construction', 'construct', 'constructing'], 'construction', 'verb → noun', 'n1'),
    fill('There has been a rapid ___ in prices. (increase/increaseing)', ['increase', 'increaseing', 'increased'], 'increase', 'nominal increase', 'inc'),
    mcq('Choose the more academic form:', ['The destruction of the forest is worrying.', 'People destroy the forest is worrying.', 'Destroy forest worrying.'], 'The destruction of the forest is worrying.', 'nominalisation', 'ac'),
    err('Find the error: The develop of the city is fast.', ['The development of the city is fast.', 'The develop of the city is fast.', 'The developing of the city is fasts.'], 'The development of the city is fast.', 'develop → development', 'dev'),
    fill('His ___ to help was appreciated. (refusal/refuse)', ['refusal', 'refuse', 'refusing'], 'refusal', 'refuse → refusal', 'ref'),
    tf('Nominalisation often makes writing more formal/academic.', true, 'style', 'st'),
    mcq('Which is a noun form?', ['decision', 'decide', 'decidedly'], 'decision', 'decide → decision', 'dec'),
    fill('The ___ of data took hours. (analysis/analyse)', ['analysis', 'analyse', 'analysing'], 'analysis', 'analyse → analysis', 'an'),
  ],
  'participle-clauses': [
    fill('___ the door, she left. (Closing/Closed)', ['Closing', 'Closed', 'Close'], 'Closing', 'present participle clause', 'ing'),
    fill('___ by the news, he sat down. (Shocked/Shocking)', ['Shocked', 'Shocking', 'Shock'], 'Shocked', 'past participle clause', 'ed'),
    mcq('___ English, he found the job easily.', ['Knowing', 'Knew', 'Known'], 'Knowing', 'Knowing + clause', 'know'),
    err('Find the error: Walked down the street, a dog bit me. (dangling)', ['Walking down the street, I was bitten by a dog. / As I walked..., a dog bit me.', 'Walked down the street, a dog bit me is fine.', 'Walk down the street, a dog bit me.'], 'Walking down the street, I was bitten by a dog. / As I walked..., a dog bit me.', 'dangling participle', 'dang'),
    fill('___ carefully, you will pass. (Studying/Studied)', ['Studying', 'Studied', 'Study'], 'Studying', 'condition-like -ing', 'stu'),
    tf('A participle clause can replace a relative clause or time clause.', true, 'function', 'fn'),
    mcq('The man ___ in the corner is my uncle.', ['sitting', 'sits', 'sat always only'], 'sitting', 'reduced relative', 'sit'),
    err('Find the error: Written the letter, she posted it. (active subject)', ['Having written the letter, she posted it. / After she wrote the letter, she posted it.', 'Written the letter, she posted it is best.', 'Wrote the letter, she posted it.'], 'Having written the letter, she posted it. / After she wrote the letter, she posted it.', 'perfect participle / active', 'hav'),
  ],
  inversion: [
    mcq('___ had I arrived when it started to rain.', ['Hardly', 'Hard', 'Harder'], 'Hardly', 'Hardly + had + S + V3', 'hardly'),
    fill('___ no circumstances should you open that door. (Under/Over)', ['Under', 'Over', 'On'], 'Under', 'Under no circumstances + inversion', 'under'),
    err('Find the error: Never I have seen such a mess.', ['Never have I seen such a mess.', 'Never I have seen such a mess.', 'Never I seen such a mess.'], 'Never have I seen such a mess.', 'Never + aux + S', 'never'),
    fill('Not only ___ she late, but she also forgot the keys. (was/she was)', ['was', 'she was', 'is'], 'was', 'Not only + aux + S', 'notonly'),
    tf('After negative adverbials (Never, Rarely, Hardly), we invert aux and subject.', true, 'inversion rule', 'tf'),
    mcq('Little ___ he know about the plan.', ['did', 'does he did', 'he did'], 'did', 'Little + did + S', 'little'),
  ],
  'hedging-language': [
    fill('It ___ be true. (might/must always)', ['might', 'must', 'will'], 'might', 'weak certainty', 'might'),
    fill('There is ___ evidence for this. (some/absolute)', ['some', 'absolute', 'all'], 'some', 'hedge quantifier', 'some'),
    fill('This ___ suggests a link. (appears to/definitely)', ['appears to', 'definitely', 'never'], 'appears to', 'appears to + V', 'app'),
    mcq('Choose a hedge:', ['It seems that the policy works.', 'The policy always works 100%.', 'No doubt ever fails.'], 'It seems that the policy works.', 'seems that', 'seem'),
    err('Find the error: It is perhaps must true.', ['It is perhaps true. / It must be true.', 'It is perhaps must true.', 'It perhaps must being true.'], 'It is perhaps true. / It must be true.', 'don\'t stack hedges wrongly', 'stack'),
    fill('The results ___ indicate a trend. (tend to/definitely always)', ['tend to', 'definitely always', 'never'], 'tend to', 'tend to', 'tend'),
    tf('Hedging softens claims in academic writing.', true, 'purpose', 'pur'),
    mcq('___ of students passed the test.', ['The majority', 'Every single impossible all', 'Nobody always'], 'The majority', 'majority hedge', 'maj'),
  ],
};

// optional: seeds embedded in apply-a0a2 GOLD for countable etc
async function loadApplyGoldSeeds() {
  try {
    const mod = await import(`./apply-a0a2-quality.mjs?t=${Date.now()}`);
    // may not export GOLD
    return mod.GOLD || mod.default?.GOLD || {};
  } catch {
    return {};
  }
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: topics, error: te } = await sb.from('grammar_topics').select('id,slug,level,title_vi');
  if (te) throw te;
  const { data: lessons, error: le } = await sb
    .from('grammar_lessons')
    .select('id,topic_id,exercises,sections,examples,theory_vi');
  if (le) throw le;

  const topicById = Object.fromEntries(topics.map((t) => [t.id, t]));
  const report = [];
  let updated = 0;

  for (const lesson of lessons) {
    const topic = topicById[lesson.topic_id];
    const slug = topic?.slug || '?';
    if (ONLY && !ONLY.has(slug)) continue;

    const sections = lesson.sections && typeof lesson.sections === 'object' ? lesson.sections : {};
    const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
    const existing = Array.isArray(lesson.exercises) ? lesson.exercises : [];

    // classify existing
    let hardDrop = 0;
    const kept = [];
    for (const e of existing) {
      const reasons = junkReasons(e);
      if (isHardJunk(reasons)) {
        hardDrop++;
        continue;
      }
      kept.push(e);
    }

    const fresh = FRESH_BY_SLUG[slug] || [];
    const hasFresh = fresh.length >= 36;
    // FRESH: ban examples+mistakes (full isolation). Others: ban only examples/usage (mistakes OK as drills).
    const banlist = buildTheoryBanlist(sections, examples, { includeMistakes: hasFresh });

    // FRESH topics: practice-only hand bank (no theory clones)
    // Others: allow cleaned mistakes/examples for volume; ban exact theory phrase clones
    const gen = [
      ...fresh,
      ...(EXTRA_SEEDS[slug] || []),
      ...(hasFresh
        ? []
        : [
            ...loadGoldSeeds(slug),
            ...genFromMistakes(sections.mistakes, { allowTheoryClone: true }),
            ...genFromRules(sections.rules),
            ...genFromFormula(sections.formula),
            ...genFromExamples(examples, slug, { skip: false }),
            ...genFromUsage(sections.usage, { skip: false }),
            ...genFromComparison(sections.comparison, sections.tips),
          ]),
    ];

    const keptClean = hasFresh
      ? []
      : kept.filter((e) => !itemOverlapsTheory(e, banlist));

    const pool = mergeUnique([fresh, gen, keptClean], slug, banlist);
    let final = balanceAndCap(pool, TARGET, slug, banlist);

    if (final.length < TARGET) {
      const soft = existing.filter(
        (e) =>
          !isHardJunk(junkReasons(e)) &&
          !isOffTopicForSlug(e, slug) &&
          !itemOverlapsTheory(e, banlist),
      );
      const pool2 = mergeUnique([final, soft, gen, fresh], slug, banlist);
      final = balanceAndCap(pool2, TARGET, slug, banlist);
    }

    if (final.length < 36 && fresh.length) {
      final = balanceAndCap(mergeUnique([fresh, final], slug, null), Math.max(TARGET, fresh.length), slug, null);
    }

    const tc = typeCounts(final);
    const row = {
      slug,
      before: existing.length,
      hardDrop,
      pool: pool.length,
      after: final.length,
      types: tc,
      minsOk:
        final.length >= 36 &&
        tc.mcq >= TYPE_MIN.mcq &&
        tc.fill >= TYPE_MIN.fill &&
        tc.error >= TYPE_MIN.error &&
        tc.tf >= TYPE_MIN.tf,
    };
    report.push(row);

    if (!DRY) {
      const { error } = await sb.from('grammar_lessons').update({ exercises: final }).eq('id', lesson.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
      await sb.from('grammar_quiz_cache').delete().eq('lesson_id', lesson.id);
      updated++;
    }
  }

  const summary = {
    dry: DRY,
    target: TARGET,
    updated,
    lessons: report.length,
    avgAfter: report.reduce((s, r) => s + r.after, 0) / (report.length || 1),
    under36: report.filter((r) => r.after < 36).length,
    minsFail: report.filter((r) => !r.minsOk).length,
    report: report.sort((a, b) => a.after - b.after),
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/quality-fix-refill-report.json', JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        dry: DRY,
        updated,
        avgAfter: +summary.avgAfter.toFixed(2),
        under36: summary.under36,
        minsFail: summary.minsFail,
        worst: summary.report.slice(0, 12),
        best: summary.report.slice(-5),
      },
      null,
      2,
    ),
  );
  console.log(DRY ? '\n[DRY] re-run with --apply' : '\n[DONE] DB updated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
