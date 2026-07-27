/**
 * Audit global_dictionary: family≠def, ant rác, syn rác, def ngắn bất thường.
 * node scripts/audit-dict-mismatches.mjs
 * → tmp/dict-mismatch-audit.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(root, '..', '.env.local'), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
};
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const GARBAGE_ANT = /^(none|null|n\/a|na|no|nil|unknown|-|—|–|\.)$/i;
const GARBAGE_DEF =
  /không có trong từ điển|not a real word|word not found|không tồn tại|click to enrich|⏳/i;

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s) {
  return new Set(norm(s).split(' ').filter((t) => t.length > 1));
}

/** Jaccard trên token — thấp = khác nghĩa */
function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function firstDef(data) {
  return (data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
}

function familySelfMeaning(word, data) {
  const fam = data?.familyWords;
  if (!Array.isArray(fam)) return null;
  const w = word.toLowerCase();
  for (const f of fam) {
    if (typeof f === 'string') continue;
    if ((f.word || '').toLowerCase() === w && f.meaning) return String(f.meaning).trim();
  }
  // fallback: first family meaning if only 1 entry
  if (fam.length === 1 && typeof fam[0] === 'object' && fam[0].meaning) {
    return String(fam[0].meaning).trim();
  }
  return null;
}

const issues = [];
let total = 0;
let page = 0;
const pageSize = 1000;

while (true) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const r = await fetch(
    `${url}/rest/v1/global_dictionary?select=word,data,image_url,image_source,tags&order=word.asc&offset=${from}&limit=${pageSize}`,
    { headers: { ...headers, Range: `${from}-${to}` } },
  );
  const rows = await r.json();
  if (!Array.isArray(rows) || rows.length === 0) break;

  for (const row of rows) {
    total++;
    const word = row.word;
    const data = row.data || {};
    const def = firstDef(data);
    const fam = familySelfMeaning(word, data);
    const syn = Array.isArray(data.synonyms) ? data.synonyms : [];
    const ant = Array.isArray(data.antonyms) ? data.antonyms : [];
    const flags = [];

    if (!def) flags.push('noDef');
    else if (GARBAGE_DEF.test(def)) flags.push('defGarbage');
    else if (!VI.test(def) && def.split(/\s+/).length >= 3) flags.push('defNotViet');

    if (fam && def && VI.test(fam) && VI.test(def)) {
      const sim = jaccard(fam, def);
      // cùng lemma family vs def khác rõ (badminton: cầu lông vs bóng chuyền)
      if (sim < 0.25 && norm(fam) !== norm(def)) {
        flags.push('familyDefMismatch');
      }
    }

    const badAnt = ant.filter(
      (a) =>
        GARBAGE_ANT.test(String(a)) ||
        String(a).toLowerCase() === word.toLowerCase() ||
        /\s/.test(String(a)),
    );
    if (badAnt.length) flags.push('antGarbage');

    // ant trùng syn
    const synSet = new Set(syn.map((s) => String(s).toLowerCase()));
    if (ant.some((a) => synSet.has(String(a).toLowerCase()))) flags.push('antInSyn');

    // sport-ish: có ant nhưng là concrete noun sport (thường không có ant thật)
    const sporty =
      /\b(ball|sport|tennis|football|soccer|golf|swim|run|play|court|match|game|athlete)\b/i.test(
        def + ' ' + (fam || ''),
      ) ||
      /(ball|tennis|golf|swim|sport)$/i.test(word);
    if (sporty && ant.length > 0 && !flags.includes('antGarbage')) flags.push('sportHasAnt');

    // image URL chứa từ khác (rất heuristic)
    if (row.image_url) {
      const img = row.image_url.toLowerCase();
      if (
        word === 'badminton' &&
        /bong-chuyen|volleyball|basketball|football/i.test(img)
      ) {
        flags.push('imageMismatch');
      }
      // generic: image path has another common sport word not in lemma
      const sports = [
        'volleyball',
        'basketball',
        'football',
        'soccer',
        'tennis',
        'baseball',
        'badminton',
        'bong-chuyen',
        'bong-ro',
        'bong-da',
      ];
      for (const s of sports) {
        if (img.includes(s) && !word.includes(s.replace(/-/g, '')) && !def.toLowerCase().includes(s)) {
          // only if sport token in URL clearly different
          if (s.length >= 6) {
            flags.push('imageSportSuspect');
            break;
          }
        }
      }
    }

    if (flags.length) {
      issues.push({
        word,
        def,
        fam,
        syn: syn.slice(0, 6),
        ant: ant.slice(0, 6),
        image: row.image_url ? String(row.image_url).slice(0, 100) : null,
        tags: row.tags || [],
        flags,
        jaccard: fam && def ? Number(jaccard(fam, def).toFixed(3)) : null,
      });
    }
  }

  if (rows.length < pageSize) break;
  page++;
  if (page % 5 === 0) console.log(`...scanned ${total}, issues ${issues.length}`);
}

// Stats
const byFlag = {};
for (const i of issues) {
  for (const f of i.flags) byFlag[f] = (byFlag[f] || 0) + 1;
}

const mismatch = issues.filter((i) => i.flags.includes('familyDefMismatch'));
const antGarbage = issues.filter((i) => i.flags.includes('antGarbage'));
const sportAnt = issues.filter((i) => i.flags.includes('sportHasAnt'));
const defNotViet = issues.filter((i) => i.flags.includes('defNotViet'));

const outDir = path.join(root, '..', 'tmp');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const report = {
  scanned: total,
  issueCount: issues.length,
  byFlag,
  samples: {
    familyDefMismatch: mismatch.slice(0, 80),
    antGarbage: antGarbage.slice(0, 40),
    sportHasAnt: sportAnt.slice(0, 40),
    defNotViet: defNotViet.slice(0, 40),
  },
  allMismatch: mismatch,
};

fs.writeFileSync(
  path.join(outDir, 'dict-mismatch-audit.json'),
  JSON.stringify(report, null, 2),
  'utf8',
);

console.log('\n=== AUDIT DONE ===');
console.log('scanned', total);
console.log('issues', issues.length);
console.log('byFlag', byFlag);
console.log('\n--- familyDefMismatch (top 40) ---');
for (const m of mismatch.slice(0, 40)) {
  console.log(`• ${m.word}: def="${m.def}" | fam="${m.fam}" | j=${m.jaccard}`);
}
console.log('\n--- antGarbage (top 20) ---');
for (const m of antGarbage.slice(0, 20)) {
  console.log(`• ${m.word}: ant=${JSON.stringify(m.ant)} def="${m.def}"`);
}
console.log(`\n📄 tmp/dict-mismatch-audit.json (${mismatch.length} family mismatches)`);
