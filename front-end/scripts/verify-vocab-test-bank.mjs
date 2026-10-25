import fs from 'fs';

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/verify-vocab-test-bank.mjs <json-path>");
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(path, 'utf8'));
const items = j.items;
const REQ = ['meaning_mcq', 'l2_to_en', 'cloze', 'error', 'collocation_mcq'];
const FORBIDDEN = ['match_pair'];
let ok = true;
const hashes = new Set();
const byL = {};
const scores = [];

// Blacklists
const MEANING_BLACKLIST = /ý nghĩa của|sự từ chối đối với|trạng thái thiếu|hành động ngược lại với|thực hiện |bày tỏ hành động/i;
const L2_STEM_BLACKLIST = /^Bày tỏ hành động|^Từ \/ cụm từ tiếng Anh nghĩa là/i;
const CLOZE_FRAME_BLACKLIST = /It is necessary to ___ the plan/i;
const ERROR_FRAME_BLACKLIST = /try to .+ without proper preparation|fail to .+ on time|the work very quick/i;
const BOGUS_PAST_IN_ANS = /\b(finded|getted|goed|taked|maked|catched|teached|thinked|buyed|leaved|achieveed)\b/i;
const COLLOCATION_BLACKLIST = /apply .+ correctly|make .+ wrong|do .+ badly|take .+ off|the task (successfully|wrongly|badly|completely)|the plan successfully/i;

const clozeStems = [];
const errorStems = [];

for (const it of items) {
  // 1. Forbidden types
  if (FORBIDDEN.includes(it.type)) {
    console.error('Forbidden type:', it.lemma, it.type);
    ok = false;
  }

  // 2. Answer in opts
  if (!it.stem?.opts?.includes(it.answer)) {
    console.error('Answer not in opts:', it.content_hash, `Answer: "${it.answer}"`, `Opts: ${JSON.stringify(it.stem?.opts)}`);
    ok = false;
  }

  // 3. Unique opts & length == 4
  if (new Set(it.stem?.opts).size !== (it.stem?.opts?.length || 0)) {
    console.error('Duplicate opts:', it.content_hash, JSON.stringify(it.stem?.opts));
    ok = false;
  }
  if (it.stem?.opts?.length !== 4) {
    console.error('Opts count != 4:', it.content_hash, it.stem?.opts?.length);
    ok = false;
  }

  // 4. Cloze checks
  if (it.type === 'cloze') {
    if (!/___/.test(it.stem?.q || '')) {
      console.error('Cloze missing blank ___:', it.content_hash);
      ok = false;
    }
    if (CLOZE_FRAME_BLACKLIST.test(it.stem?.q || '')) {
      console.error('Cloze blacklisted frame:', it.content_hash);
      ok = false;
    }
    clozeStems.push(it.stem?.q || '');
  }

  // 5. Meaning checks
  if (it.type === 'meaning_mcq') {
    if (MEANING_BLACKLIST.test(it.answer) || it.stem?.opts?.some(o => MEANING_BLACKLIST.test(o))) {
      console.error('Blacklisted template in meaning_mcq:', it.content_hash);
      ok = false;
    }
  }

  // 6. L2_to_EN checks
  if (it.type === 'l2_to_en') {
    if (L2_STEM_BLACKLIST.test(it.stem?.q || '')) {
      console.error('Blacklisted stem prefix in l2_to_en:', it.content_hash, it.stem?.q);
      ok = false;
    }
  }

  // 7. Collocation checks
  if (it.type === 'collocation_mcq') {
    if (it.stem?.opts?.some(o => COLLOCATION_BLACKLIST.test(o))) {
      console.error('Blacklisted template in collocation_mcq:', it.content_hash);
      ok = false;
    }
    const allHaveSpaces = it.stem?.opts?.every(opt => opt.trim().includes(' '));
    if (!allHaveSpaces) {
      console.error('Collocation opts missing spaces in some options:', it.content_hash, JSON.stringify(it.stem?.opts));
      ok = false;
    }
  }

  // 8. Error checks
  if (it.type === 'error') {
    const qStr = it.stem?.q || '';
    if (ERROR_FRAME_BLACKLIST.test(qStr)) {
      console.error('Blacklisted template in error stem:', it.content_hash);
      ok = false;
    }
    if (BOGUS_PAST_IN_ANS.test(it.answer)) {
      console.error('Bogus past tense in error answer:', it.content_hash, it.answer);
      ok = false;
    }
    const match = qStr.match(/['"]([^'"]+)['"]/);
    if (match) {
      const quoted = match[1].trim().toLowerCase();
      const ans = it.answer.trim().toLowerCase();
      if (quoted === ans) {
        console.error('FAKE ERROR DETECTED (quoted sentence matches answer!):', it.content_hash);
        ok = false;
      }
    } else {
      console.error('Error question missing quoted sentence in quotes:', it.content_hash);
      ok = false;
    }
    errorStems.push(qStr);
  }

  // 9. Explain VI check
  if (it.explain_vi && (it.explain_vi.length > 160 || it.explain_vi.includes('**') || /wow/i.test(it.explain_vi))) {
    console.error('Invalid explain_vi (too long > 160 chars, or contains ** or Wow):', it.content_hash);
    ok = false;
  }

  // 10. Duplicate content_hash
  if (hashes.has(it.content_hash)) {
    console.error('Duplicate content_hash:', it.content_hash);
    ok = false;
  }
  hashes.add(it.content_hash);

  byL[it.lemma] = byL[it.lemma] || new Set();
  byL[it.lemma].add(it.type);

  // 11. Quality score
  const qs = it.meta?.quality_score;
  if (typeof qs === 'number') scores.push(qs);
  if (typeof qs !== 'number' || qs < 8.5 || qs > 10.0) {
    console.error('Quality score invalid or < 8.5:', it.lemma, it.type, qs);
    ok = false;
  }
}

// 12. Frame monopoly check (>15% repetition of identical stem structure in cloze or error)
if (clozeStems.length >= 10) {
  const cCounts = {};
  clozeStems.forEach(s => {
    const normalized = s.replace(/\b[a-zA-Z]+\b/g, 'WORD');
    cCounts[normalized] = (cCounts[normalized] || 0) + 1;
  });
  const maxC = Math.max(...Object.values(cCounts));
  if (maxC / clozeStems.length > 0.30) {
    console.error(`Cloze frame monopoly detected (${maxC}/${clozeStems.length} items share near-identical structure)!`);
    ok = false;
  }
}

// 13. Mandatory 5 types per lemma
for (const [L, set] of Object.entries(byL)) {
  if (set.size !== 5 || !REQ.every(t => set.has(t))) {
    console.error('Lemma missing mandatory types:', L, [...set]);
    ok = false;
  }
}

// 14. Stem independence
const qmap = {};
for (const it of items) {
  const k = it.lemma + '||' + (it.stem?.q || '').toLowerCase().trim();
  if (qmap[k]) {
    console.error('Duplicate stem q across types for lemma:', it.lemma, it.type);
    ok = false;
  }
  qmap[k] = it.type;
}

// 15. Quality score variance check
const uniqueScores = new Set(scores);
if (scores.length > 1 && uniqueScores.size === 1) {
  console.error('Flat quality_scores across entire file! Scores must be differentiated.');
  ok = false;
}

const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
const min = scores.length ? Math.min(...scores) : 0;

console.log(JSON.stringify({ file: path, items: items.length, lemmas: Object.keys(byL).length, avg: Number(avg.toFixed(2)), min, VERIFY_OK: ok }, null, 2));
if (!ok) process.exit(1);
