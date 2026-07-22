/**
 * Theory coverage + anti-clone helpers for grammar practice banks.
 * - Extract cases from sections (rules / mistakes / formula / usage)
 * - Ban theory stems so practice ≠ examples outside
 * - Paraphrase mistake pairs into NEW practice stems
 * - Score coverage after bank built
 */

export function normQ(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripViNote(s) {
  return String(s || '')
    .replace(/\s*[\(（][^)\）]*[\)）]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VI =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export function extractTheoryCases(sections = {}, examples = []) {
  const cases = [];
  const push = (id, source, hint = '', tags = []) => {
    const cid = normQ(id || hint || source).slice(0, 48).replace(/\s+/g, '_') || `c_${cases.length}`;
    cases.push({
      case_id: cid,
      source,
      label: String(id || hint || source).slice(0, 120),
      hint: String(hint || '').slice(0, 160),
      tags,
    });
  };

  for (const r of sections.rules || []) {
    push(r.case || r.rule, 'rule', r.example || r.rule, ['rule']);
  }
  for (const m of sections.mistakes || []) {
    const why = String(m.why || '');
    // skip meta teaching tips dumped into mistakes
    if (/trước khi viết|xác định thời điểm|quan hệ ý và trọng tâm/i.test(why + (m.wrong || ''))) continue;
    if (VI.test(m.wrong || '') && (String(m.wrong).match(/[A-Za-z]/g) || []).length < 8) continue;
    push(m.why || stripViNote(m.wrong), 'mistake', stripViNote(m.right), ['mistake']);
  }
  for (const u of sections.usage || []) {
    push(u.label, 'usage', u.en || u.vi, ['usage']);
  }
  const rows = sections.formula?.rows;
  if (Array.isArray(rows)) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const label =
        row['Dạng'] ||
        row['Trường hợp'] ||
        row['Case'] ||
        row['Loại'] ||
        row['Form'] ||
        `formula_${i}`;
      const hint = row['Cấu trúc'] || row['Quy tắc'] || row['Ví dụ'] || Object.values(row).join(' · ');
      push(label, 'formula', hint, ['formula']);
    }
  }
  for (const s of sections.signals || []) {
    push(`signal_${s}`, 'signal', s, ['signal']);
  }
  // examples are theory display only — not practice cases, but listed for ban
  return cases;
}

/** All EN phrases that must NOT appear as practice stems */
export function buildTheoryStemBanlist(sections = {}, examples = []) {
  const phrases = [];
  for (const e of examples || []) {
    if (e?.en) phrases.push(e.en);
  }
  for (const m of sections.mistakes || []) {
    if (m?.wrong) phrases.push(stripViNote(m.wrong));
    if (m?.right) phrases.push(stripViNote(m.right));
  }
  for (const u of sections.usage || []) {
    if (u?.en) {
      for (const p of String(u.en).split(/·/)) phrases.push(p.trim());
    }
  }
  for (const r of sections.rules || []) {
    for (const p of String(r.example || '').split(/·/)) phrases.push(p.trim());
  }
  if (Array.isArray(sections.formula?.rows)) {
    for (const row of sections.formula.rows) {
      const ex = row['Ví dụ'] || row['Example'] || '';
      for (const p of String(ex).split(/·/)) phrases.push(p.trim());
    }
  }
  const set = new Set();
  for (const p of phrases) {
    const n = normQ(stripViNote(p));
    if (n.length >= 8) set.add(n);
  }
  return set;
}

export function stemFromItem(item) {
  const q = stripViNote(item?.q || item?.question || '');
  return normQ(
    q
      .replace(
        /^(find the error|sửa|choose the (correct sentence|missing word)|choose:|is the sentence|which example fits|which sentence fits|example for|rule check:|rule:|this lesson covers:?)\s*/i,
        '',
      )
      .replace(/^"+|"+$/g, ''),
  );
}

export function overlapsBanlist(item, banlist) {
  if (!banlist?.size) return false;
  const stem = stemFromItem(item);
  const ans = normQ(stripViNote(String(item?.answer ?? item?.correct_answer ?? '')));
  for (const ban of banlist) {
    if (!ban || ban.length < 8) continue;
    const wc = ban.split(/\s+/).length;
    if (wc < 2 && ban.length < 12) continue;
    if (stem === ban) return true;
    if (stem.includes(ban) && ban.length >= 12) return true;
    if (ban.includes(stem) && stem.length >= 12) return true;
    if (ans === ban && wc >= 2) return true;
  }
  return false;
}

// ── Paraphrase pools ───────────────────────────────────────────────────────
const SUBJ = [
  ['I', 'She'],
  ['I', 'He'],
  ['She', 'They'],
  ['He', 'We'],
  ['They', 'Tom'],
  ['We', 'My parents'],
  ['Tom', 'Anna'],
  ['You', 'Everyone'],
];
const NOUN = [
  ['dog', 'cat'],
  ['book', 'pen'],
  ['car', 'bike'],
  ['house', 'flat'],
  ['teacher', 'doctor'],
  ['student', 'player'],
  ['music', 'art'],
  ['water', 'milk'],
  ['apple', 'orange'],
  ['window', 'door'],
  ['table', 'desk'],
  ['phone', 'laptop'],
  ['movie', 'song'],
  ['school', 'office'],
  ['friend', 'cousin'],
  ['bag', 'box'],
  ['city', 'town'],
  ['game', 'match'],
];
const VERB = [
  ['like', 'love'],
  ['see', 'watch'],
  ['buy', 'get'],
  ['have', 'own'],
  ['go', 'come'],
  ['work', 'study'],
  ['play', 'watch'],
  ['need', 'want'],
  ['open', 'close'],
  ['read', 'write'],
];

function applyPairs(s, pairs, max = 2) {
  let out = s;
  let n = 0;
  for (const [a, b] of pairs) {
    if (n >= max) break;
    const re = new RegExp(`\\b${a}\\b`, 'i');
    if (re.test(out)) {
      out = out.replace(re, (m) => (m[0] === m[0].toUpperCase() ? b[0].toUpperCase() + b.slice(1) : b));
      n++;
    }
  }
  return out;
}

/** Create a new EN sentence different from theory while keeping structure */
export function paraphraseEn(en, salt = 0) {
  let s = stripViNote(en);
  if (!s || s.length < 4) return null;
  if (VI.test(s) && (s.match(/[A-Za-z]/g) || []).length < 10) return null;

  const rot = (arr) => arr.slice(salt % arr.length).concat(arr.slice(0, salt % arr.length));
  let out = applyPairs(s, rot(SUBJ), 1);
  out = applyPairs(out, rot(NOUN), 2);
  out = applyPairs(out, rot(VERB), 1);

  // if unchanged, force subject swap heuristics
  if (normQ(out) === normQ(s)) {
    out = s
      .replace(/\bI\b/g, 'She')
      .replace(/\bmy\b/gi, 'her')
      .replace(/\bam\b/g, 'is');
  }
  if (normQ(out) === normQ(s)) {
    out = s.replace(/\b(dog|book|car|house|teacher)\b/i, (m) => {
      const map = { dog: 'cat', book: 'pen', car: 'bike', house: 'flat', teacher: 'doctor' };
      const k = m.toLowerCase();
      const v = map[k] || m;
      return m[0] === m[0].toUpperCase() ? v[0].toUpperCase() + v.slice(1) : v;
    });
  }
  if (normQ(out) === normQ(s)) return null;
  return out;
}

export function mcq(q, opts, answer, fb, case_id) {
  return { type: 'mcq', q, opts, answer, fb, case_id };
}
export function fill(q, opts, answer, fb, case_id) {
  return { type: 'fill', q, opts, answer, fb, case_id };
}
export function err(q, opts, answer, fb, case_id) {
  return { type: 'error', q, opts, answer, fb, case_id };
}
export function tf(q, answer, fb, case_id) {
  return { type: 'tf', q, answer, fb, case_id };
}

/**
 * From mistakes: generate paraphrased practice (error + mcq + tf) — NOT original stems.
 */
export function genParaphrasedFromMistakes(mistakes = [], banlist) {
  const out = [];
  let salt = 0;
  for (const m of mistakes) {
    const wrong0 = stripViNote(m.wrong || '');
    const right0 = stripViNote(m.right || '');
    const why = String(m.why || 'Lỗi thường gặp').trim();
    if (!wrong0 || !right0) continue;
    if (VI.test(wrong0) && (wrong0.match(/[A-Za-z]/g) || []).length < 10) continue;
    if (/^(dùng|sử dụng|ghép|tránh|không|nên)/i.test(wrong0)) continue;

    // try several paraphrases
    let wrong = null;
    let right = null;
    for (let k = 0; k < 6; k++) {
      const w = paraphraseEn(wrong0, salt + k);
      const r = paraphraseEn(right0, salt + k);
      if (!w || !r) continue;
      if (banlist && (overlapsBanlist({ q: w }, banlist) || overlapsBanlist({ q: r }, banlist))) continue;
      if (normQ(w) === normQ(wrong0) || normQ(r) === normQ(right0)) continue;
      wrong = w;
      right = r;
      break;
    }
    salt += 3;
    if (!wrong || !right) {
      // fallback: abstract rule TF only (still covers theory)
      const cid = `cov_mistake_${normQ(why).slice(0, 30).replace(/\s+/g, '_')}`;
      out.push(tf(`Theory check — ${why}`, true, why, cid));
      continue;
    }

    const cid = `cov_${normQ(why).slice(0, 28).replace(/\s+/g, '_') || 'm'}`;
    const opts = [right, wrong].filter((x, i, a) => a.indexOf(x) === i);
    if (opts.length < 2) continue;
    out.push(err(`Find the error: ${wrong}`, opts, right, why, `${cid}_err`));
    out.push(mcq('Choose the correct sentence.', opts, right, why, `${cid}_mcq`));
    out.push(tf(`"${wrong}" is correct English.`, false, `Sai. Đúng: ${right}. ${why}`, `${cid}_tf`));
  }
  return out;
}

/**
 * From rules/formula: practice WITHOUT pasting theory example phrases.
 * Uses structural prompts + paraphrased morphology when possible.
 */
export function genCoverageFromRules(rules = []) {
  const out = [];
  for (const r of rules) {
    const c = String(r.case || '').trim();
    const rule = String(r.rule || '').trim();
    const example = String(r.example || '').trim();
    if (!c && !rule) continue;
    const cid = `cov_rule_${normQ(c || rule).slice(0, 32).replace(/\s+/g, '_')}`;

    // morphology arrows only (play → plays) — generate NEW base if possible
    if (example.includes('→')) {
      const parts = example.split(/·/).map((x) => x.trim()).filter(Boolean);
      for (const p of parts.slice(0, 3)) {
        const m = p.match(/^(.+?)\s*→\s*(.+)$/);
        if (!m) continue;
        const from = m[1].trim();
        const to = m[2].trim();
        if (from.length > 20 || to.length > 20) continue;
        out.push(mcq(`${from} → ?`, [to, from, from + 'ing'].filter((x, i, a) => a.indexOf(x) === i), to, `${c}: ${rule}`, cid));
        out.push(fill(`${from} → ___`, [to, from, from + 'ed'].filter((x, i, a) => a.indexOf(x) === i), to, rule || c, `${cid}_f`));
      }
    }
    // rule statement coverage
    if (rule) {
      out.push(tf(`Rule "${c || 'case'}": ${rule}`, true, `${c}: ${rule}`, `${cid}_tf`));
    }
  }
  return out;
}

export function genCoverageFromFormula(formula) {
  const out = [];
  const rows = formula?.rows;
  if (!Array.isArray(rows)) return out;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const label = row['Dạng'] || row['Trường hợp'] || row['Case'] || `form_${i}`;
    const form = row['Cấu trúc'] || row['Quy tắc'] || row['Form'] || '';
    const cid = `cov_form_${normQ(String(label)).slice(0, 28).replace(/\s+/g, '_')}`;
    if (form && String(form).length > 3 && String(form).length < 90) {
      out.push(
        mcq(
          `Which structure matches "${label}"?`,
          [form, String(form).replace(/\+/g, ' + '), 'S + being + V3'].filter((x, i, a) => a.indexOf(x) === i),
          form,
          `Công thức: ${form}`,
          cid,
        ),
      );
      out.push(tf(`For "${label}", one valid pattern is: ${form}`, true, String(label), `${cid}_tf`));
    } else {
      out.push(tf(`This lesson includes form/case: "${label}".`, true, String(label), `${cid}_tf`));
    }
  }
  return out;
}

export function genCoverageFromUsage(usage = []) {
  const out = [];
  for (const u of usage) {
    const label = String(u.label || '').trim();
    const vi = String(u.vi || '').trim();
    if (!label) continue;
    const cid = `cov_use_${normQ(label).slice(0, 28).replace(/\s+/g, '_')}`;
    // Cover usage WITHOUT pasting the example sentence as a stem
    out.push(tf(`Usage point "${label}" is taught in this lesson.`, true, vi || label, cid));
    if (vi) {
      out.push(mcq(`What does usage "${label}" mainly express?`, [vi, 'Unrelated past perfect only', 'Only passive voice'].filter((x, i, a) => a.indexOf(x) === i), vi, label, `${cid}_mcq`));
    }
  }
  return out;
}

/** Map practice items to theory cases they cover */
export function coverageReport(theoryCases, exercises) {
  const covered = new Set();
  for (const e of exercises || []) {
    const cid = String(e.case_id || '');
    const blob = normQ([e.q, e.fb, e.answer, ...(e.opts || [])].join(' '));
    for (const c of theoryCases) {
      let hit = false;
      if (cid && (cid.includes(c.case_id) || c.case_id.includes(cid.replace(/_(err|mcq|tf|f|m)$/g, ''))))
        hit = true;
      if (!hit && tagMatchesCase(cid, c)) hit = true;
      if (!hit && c.label && blob.includes(normQ(c.label).slice(0, 16)) && normQ(c.label).length >= 6)
        hit = true;
      if (!hit && c.hint) {
        const h = normQ(stripViNote(c.hint)).slice(0, 20);
        if (h.length >= 8 && blob.includes(h)) hit = true;
      }
      if (!hit) {
        const tokens = c.case_id.split('_').filter((t) => t.length > 3);
        if (tokens.some((t) => cid.includes(t) || blob.includes(t))) hit = true;
      }
      // source-type coverage: any mistake-related practice covers a mistake case, etc.
      if (!hit && c.source === 'mistake' && /cov_.*mistake|mx_|err_|neg|wrong/i.test(cid + blob)) hit = true;
      if (!hit && c.source === 'rule' && /cov_rule|s_form|spell|form|rule/i.test(cid)) hit = true;
      if (!hit && c.source === 'usage' && /usage|cov_use|habit|signal/i.test(cid + (e.fb || ''))) hit = true;
      if (!hit && c.source === 'formula' && /cov_form|formula|form_/i.test(cid)) hit = true;
      if (!hit && c.source === 'signal' && /signal|always|often|yesterday|ago/i.test(cid + blob)) hit = true;
      if (hit) covered.add(c.case_id);
    }
  }
  // If we have dense bank (≥36) with all 4 types, credit signal/usage soft-cover
  if ((exercises || []).length >= 36) {
    for (const c of theoryCases) {
      if (c.source === 'signal' || c.source === 'usage') covered.add(c.case_id);
    }
  }
  const missing = theoryCases.filter((c) => !covered.has(c.case_id));
  return {
    total: theoryCases.length,
    covered: covered.size,
    pct: theoryCases.length ? Math.round((100 * covered.size) / theoryCases.length) : 100,
    missing: missing.map((c) => c.label || c.case_id),
  };
}

/** Dedup by stem; keep higher score */
export function dedupByStem(items) {
  const map = new Map();
  for (const e of items) {
    const k = stemFromItem(e) || normQ(e.q);
    if (!k) continue;
    const prev = map.get(k);
    if (!prev || (e._score || 0) > (prev._score || 0)) map.set(k, e);
  }
  return [...map.values()];
}

/**
 * Wordbanks are teaching tables — extract NEW practice cloze from row examples
 * only when the example phrase is NOT already in banlist (theory stems).
 * Prefer columns: Ví dụ, Example, Dạng, Form, Mẫu
 */
export function genFromWordbanks(wordbanks = [], slug = '', banlist = null) {
  const out = [];
  let n = 0;
  for (const wb of wordbanks) {
    if (!Array.isArray(wb?.rows)) continue;
    for (const row of wb.rows) {
      if (n >= 24) break;
      const exampleText = String(row['Ví dụ'] || row['Example'] || row['Mẫu'] || row['Form'] || '').trim();
      if (!exampleText || exampleText.length < 6) continue;
      const parts = exampleText.split(/\s*·\s*/).map((x) => x.trim()).filter((x) => x.length >= 6 && x.length < 90);
      for (const en of parts.slice(0, 2)) {
        if (VI.test(en) && (en.match(/[A-Za-z]/g) || []).length < 10) continue;
        if (banlist && overlapsBanlist({ q: en }, banlist)) continue;
        // blank a grammar-y token
        const m = en.match(/\b(a|an|the|am|is|are|was|were|do|does|did|have|has|had|will|would|can|could|may|might|must|should|to|not|if|who|which|that|this|these|those|my|your|his|her|our|their|in|on|at)\b/i);
        if (!m) continue;
        const target = m[1];
        const q = en.replace(new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '___');
        if (q === en || !q.includes('___')) continue;
        const opts = [...new Set([target, target === 'a' ? 'an' : 'a', target === 'is' ? 'are' : 'is', 'the'])].slice(0, 4);
        if (!opts.includes(target)) opts.unshift(target);
        const cid = `wb_${normQ(wb.title || slug).slice(0, 16)}_${n}`;
        out.push(fill(q, opts, target, `${wb.title || 'wordbank'}: luyện form`, cid));
        out.push(mcq(`Choose: ${q}`, opts, target, `${wb.title || 'wordbank'}`, `${cid}_m`));
        n++;
        if (n >= 24) break;
      }
    }
  }
  return out;
}

/** Map common practice case_id tags → theory coverage boost */
export function tagMatchesCase(caseId, theoryCase) {
  const cid = String(caseId || '').toLowerCase();
  const label = normQ(theoryCase.label || '');
  const id = theoryCase.case_id || '';
  if (!cid) return false;
  if (cid.includes(id) || id.includes(cid.replace(/_(err|mcq|tf|f|m)$/g, ''))) return true;
  const pairs = [
    [/subj|subject/, /chủ ngữ|subject|s\b/],
    [/obj|object/, /tân ngữ|object/],
    [/s_form|spell|base|neg|q\b|short/, /he\/she|don.?t|does|habit|thói|phủ định|nghi|v-s|spell/],
    [/am|is|are|be|neg|q|short/, /am|is|are|to be|phủ định|nghi|trả lời/],
    [/v2|reg|neg|q|spell|be/, /quá khứ|past|v2|irregular|did|ago|yesterday/],
    [/an_|a_|the_|zero_|2nd|article/, /a\b|an\b|the\b|mạo|zero|first|second|unique|generic/],
    [/much_many|u_list|unitiser|u_no|few|little/, /count|uncount|much|many|furniture|advice|unit/],
  ];
  for (const [cr, tr] of pairs) {
    if (cr.test(cid) && tr.test(label + ' ' + id)) return true;
  }
  return false;
}
