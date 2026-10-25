/**
 * Sửa hàng loạt chất lượng global_dictionary:
 *  A) ant rác: none/null/self/trùng syn  (không AI)
 *  B) family≠def ngắn: AI re-verify có neo Free Dictionary EN
 *
 * Usage:
 *   node scripts/fix-dict-quality-batch.mjs --ants-only --apply
 *   node scripts/fix-dict-quality-batch.mjs --defs --limit=80 --apply
 *   node scripts/fix-dict-quality-batch.mjs --defs --limit=20          # dry-run
 *   node scripts/fix-dict-quality-batch.mjs --all --limit=200 --apply
 *
 * Provider: OPENROUTER (mặc định) | ZHIPU | GROQ
 *   --provider=openrouter|zhipu|groq
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
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const ANTS_ONLY = process.argv.includes('--ants-only');
const DEFS = process.argv.includes('--defs') || process.argv.includes('--all');
const ALL = process.argv.includes('--all');
const LIMIT = parseInt(
  (process.argv.find((a) => a.startsWith('--limit=')) || '--limit=100').split('=')[1],
  10,
);
const PROVIDER = (
  (process.argv.find((a) => a.startsWith('--provider=')) || '--provider=openrouter')
    .split('=')[1] || 'openrouter'
).toLowerCase();
const DELAY = parseInt(
  (process.argv.find((a) => a.startsWith('--delay=')) || '--delay=900').split('=')[1],
  10,
);
const BATCH = parseInt(
  (process.argv.find((a) => a.startsWith('--batch=')) || '--batch=12').split('=')[1],
  10,
);

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const GARBAGE_ANT = /^(none|null|n\/a|na|no|nil|unknown|-|—|–|\.|n\.a\.)$/i;

function resolveLlm() {
  if (PROVIDER === 'zhipu' || PROVIDER === 'glm') {
    return {
      apiKey: get('ZHIPU_API_KEY') || get('GLM_API_KEY'),
      baseUrl: (get('ZHIPU_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, ''),
      model: get('ZHIPU_MODEL') || 'glm-4-flash',
      label: 'zhipu',
    };
  }
  if (PROVIDER === 'groq') {
    const raw = get('GROQ_API_KEY');
    return {
      apiKey: raw.split(',')[0].trim(),
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
      label: 'groq',
    };
  }
  return {
    apiKey: get('OPENROUTER_API_KEY'),
    baseUrl: (get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: get('OPENROUTER_MODEL') || 'openrouter/free',
    label: 'openrouter',
  };
}

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
    if (typeof f === 'object' && (f.word || '').toLowerCase() === w && f.meaning) {
      return String(f.meaning).trim();
    }
  }
  if (fam.length === 1 && typeof fam[0] === 'object' && fam[0].meaning) {
    return String(fam[0].meaning).trim();
  }
  return null;
}

function cleanAntList(word, syn, ant) {
  const w = word.toLowerCase();
  const synSet = new Set((syn || []).map((s) => String(s).toLowerCase()));
  const out = [];
  const seen = new Set();
  for (const raw of ant || []) {
    const a = String(raw).trim();
    if (!a) continue;
    const low = a.toLowerCase();
    if (GARBAGE_ANT.test(a)) continue;
    if (low === w) continue;
    if (synSet.has(low)) continue;
    // single-token English only for headword syn/ant UI
    if (!/^[a-z][a-z'-]{1,24}$/i.test(a)) continue;
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(a.toLowerCase());
    if (out.length >= 8) break;
  }
  return out;
}

async function fetchAllRows() {
  const rows = [];
  let from = 0;
  const size = 1000;
  while (true) {
    const r = await fetch(
      `${url}/rest/v1/global_dictionary?select=id,word,data&order=word.asc&offset=${from}&limit=${size}`,
      { headers: { ...headers, Range: `${from}-${from + size - 1}` } },
    );
    const batch = await r.json();
    if (!Array.isArray(batch) || !batch.length) break;
    rows.push(...batch);
    if (batch.length < size) break;
    from += size;
    if (from % 5000 === 0) console.log(`[scan] ${rows.length} rows...`);
  }
  return rows;
}

async function patchRow(id, payload) {
  const r = await fetch(`${url}/rest/v1/global_dictionary?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`patch ${id}: ${r.status} ${t.slice(0, 200)}`);
  }
  return r.json();
}

/** A) Clean antonyms */
async function cleanAntonyms(rows) {
  let touched = 0;
  let skipped = 0;
  const backup = [];
  for (const row of rows) {
    const data = row.data || {};
    const ant = Array.isArray(data.antonyms) ? data.antonyms : [];
    const syn = Array.isArray(data.synonyms) ? data.synonyms : [];
    if (!ant.length) {
      skipped++;
      continue;
    }
    const cleaned = cleanAntList(row.word, syn, ant);
    const same =
      cleaned.length === ant.length &&
      cleaned.every((a, i) => String(ant[i]).toLowerCase() === a);
    if (same) {
      skipped++;
      continue;
    }
    touched++;
    backup.push({ word: row.word, before: ant, after: cleaned });
    if (touched <= 15) {
      console.log(`  ant ${row.word}: ${JSON.stringify(ant.slice(0, 5))} → ${JSON.stringify(cleaned)}`);
    }
    if (APPLY) {
      const nd = structuredClone(data);
      nd.antonyms = cleaned;
      // also lightly clean synonyms (garbage tokens only)
      if (Array.isArray(nd.synonyms)) {
        nd.synonyms = cleanAntList(row.word, [], nd.synonyms);
      }
      await patchRow(row.id, { data: nd });
    }
  }
  console.log(`[ants] touched=${touched} skipped=${skipped} apply=${APPLY}`);
  const dir = path.join(root, '..', 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `ant-clean-${Date.now()}.json`),
    JSON.stringify(backup, null, 2),
  );
  return touched;
}

/** Free Dictionary EN glosses */
async function freeDictEn(word) {
  try {
    const r = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!r.ok) return [];
    const j = await r.json();
    if (!Array.isArray(j)) return [];
    const glosses = [];
    for (const entry of j.slice(0, 2)) {
      for (const m of entry.meanings || []) {
        const pos = m.partOfSpeech || '';
        for (const d of (m.definitions || []).slice(0, 2)) {
          if (d.definition) glosses.push(`[${pos}] ${d.definition}`);
        }
      }
    }
    return glosses.slice(0, 5);
  } catch {
    return [];
  }
}

async function chatJson(llm, system, user) {
  const r = await fetch(`${llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llm.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lingopro.online',
      'X-Title': 'LingoPro Dict QA',
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`LLM ${r.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text);
  const content = j.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('LLM non-json: ' + content.slice(0, 200));
  }
}

function pickMismatchCandidates(rows) {
  const out = [];
  for (const row of rows) {
    const data = row.data || {};
    const def = firstDef(data);
    const fam = familySelfMeaning(row.word, data);
    if (!def || !fam) continue;
    if (!VI.test(def) || !VI.test(fam)) continue;
    const defWords = def.split(/\s+/).length;
    const famWords = fam.split(/\s+/).length;
    if (defWords > 6 || famWords > 10) continue;
    const sim = jaccard(def, fam);
    if (sim >= 0.15) continue;
    if (norm(def) === norm(fam)) continue;
    // phrases: skip multi-word headwords for free-dict path
    if (/\s/.test(row.word)) continue;
    out.push({
      id: row.id,
      word: row.word,
      def,
      fam,
      jaccard: Number(sim.toFixed(3)),
      data,
    });
  }
  // prioritize shorter defs (often wrong single-word mistranslations)
  out.sort((a, b) => a.def.split(/\s+/).length - b.def.split(/\s+/).length || a.jaccard - b.jaccard);
  return out;
}

async function fixDefinitions(rows) {
  const llm = resolveLlm();
  if (!llm.apiKey) {
    console.error('Missing LLM key for provider', PROVIDER);
    process.exit(1);
  }
  console.log(`[defs] provider=${llm.label} model=${llm.model}`);

  let cands = pickMismatchCandidates(rows);
  console.log(`[defs] candidates=${cands.length}, limit=${LIMIT}`);
  cands = cands.slice(0, LIMIT);

  const system = `You are a careful English→Vietnamese lexicographer for Vietnamese high-school learners.
Task: for each English headword, choose ONE short correct Vietnamese gloss for the MOST COMMON sense.
Rules:
- Prefer accuracy over creativity. 2–8 Vietnamese words.
- Do NOT confuse similar English words (abstract≠abstention, allergic≠antigen, allude≠emphasize, appendicitis≠constipation, astonishing≠sky, astronaut≠engineer, backpacking≠backpack, badge≠certificate, batter≠bowl, badminton≠volleyball).
- Use Free Dictionary English glosses as ground truth when provided.
- Between current_def and family_meaning, pick the better one OR write a new better gloss.
- Keep example as a natural simple English sentence using the word.
- synonyms: 0–5 single English words (true near-synonyms only; empty if none).
- antonyms: 0–5 single English words (true antonyms only; empty for nouns like sports/objects).
Return JSON: {"items":[{"word":"...","definition_vi":"...","example":"...","synonyms":[],"antonyms":[],"reason":"short"}]}`;

  const results = [];
  const backup = [];

  for (let i = 0; i < cands.length; i += BATCH) {
    const group = cands.slice(i, i + BATCH);
    // free-dict parallel
    const enriched = await Promise.all(
      group.map(async (c) => ({
        ...c,
        en: await freeDictEn(c.word),
      })),
    );

    const payload = enriched.map((c) => ({
      word: c.word,
      current_def: c.def,
      family_meaning: c.fam,
      free_dict_en: c.en,
    }));

    let parsed;
    try {
      parsed = await chatJson(
        llm,
        system,
        `Fix these ${payload.length} entries:\n${JSON.stringify(payload)}`,
      );
    } catch (e) {
      console.error(`[defs] batch ${i} fail:`, e.message || e);
      await sleep(DELAY * 2);
      continue;
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const byWord = new Map(items.map((it) => [String(it.word || '').toLowerCase(), it]));

    for (const c of enriched) {
      const it = byWord.get(c.word.toLowerCase());
      if (!it?.definition_vi) {
        console.log(`  skip ${c.word}: no AI item`);
        continue;
      }
      const vi = String(it.definition_vi).trim();
      if (!vi || !VI.test(vi)) {
        console.log(`  skip ${c.word}: bad VI "${vi}"`);
        continue;
      }
      // skip if AI just echoed same wrong short def without change and fam is different
      if (norm(vi) === norm(c.def) && jaccard(vi, c.fam) < 0.15 && c.en.length) {
        // allow if free dict suggests def is OK - still update if fam was wrong noise
      }

      const changed = norm(vi) !== norm(c.def);
      console.log(
        `  ${changed ? 'FIX' : 'keep'} ${c.word}: "${c.def}" → "${vi}"${it.reason ? ` (${it.reason})` : ''}`,
      );

      results.push({
        word: c.word,
        before: c.def,
        after: vi,
        fam: c.fam,
        example: it.example,
        synonyms: it.synonyms,
        antonyms: it.antonyms,
      });

      if (!APPLY) continue;
      if (!changed && norm(vi) === norm(c.def)) {
        // still clean ants/syn if provided
      }

      backup.push({ word: c.word, data: c.data });
      const nd = structuredClone(c.data);
      nd.results = nd.results || [{}];
      nd.results[0] = nd.results[0] || {};
      const meanings = Array.isArray(nd.results[0].meanings) ? nd.results[0].meanings : [{}];
      meanings[0] = {
        ...(meanings[0] || {}),
        pos: meanings[0]?.pos || 'noun',
        definition: vi,
        example:
          (typeof it.example === 'string' && it.example.trim()) ||
          meanings[0]?.example ||
          '',
      };
      nd.results[0].meanings = meanings;

      // sync family self meaning
      if (Array.isArray(nd.familyWords)) {
        nd.familyWords = nd.familyWords.map((f) => {
          if (typeof f === 'object' && (f.word || '').toLowerCase() === c.word.toLowerCase()) {
            return { ...f, meaning: vi };
          }
          return f;
        });
      }

      if (Array.isArray(it.synonyms)) {
        nd.synonyms = cleanAntList(c.word, [], it.synonyms);
      }
      if (Array.isArray(it.antonyms)) {
        nd.antonyms = cleanAntList(c.word, nd.synonyms || [], it.antonyms);
      } else if (Array.isArray(nd.antonyms)) {
        nd.antonyms = cleanAntList(c.word, nd.synonyms || [], nd.antonyms);
      }

      await patchRow(c.id, { data: nd });

      // cascade: user notebook wrong translations matching old def
      if (changed && c.def) {
        try {
          await fetch(
            `${url}/rest/v1/words?word=ilike.${encodeURIComponent(c.word)}&translation=eq.${encodeURIComponent(c.def)}`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ translation: vi }),
            },
          );
        } catch {
          /* ignore */
        }
      }
    }

    console.log(`[defs] progress ${Math.min(i + BATCH, cands.length)}/${cands.length}`);
    await sleep(DELAY);
  }

  const dir = path.join(root, '..', 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const stamp = Date.now();
  fs.writeFileSync(path.join(dir, `def-fix-results-${stamp}.json`), JSON.stringify(results, null, 2));
  if (backup.length) {
    fs.writeFileSync(path.join(dir, `def-fix-backup-${stamp}.json`), JSON.stringify(backup, null, 2));
  }
  console.log(`[defs] done results=${results.length} apply=${APPLY}`);
  return results.length;
}

async function main() {
  console.log(`[fix-dict-quality] apply=${APPLY} ants=${ANTS_ONLY || ALL} defs=${DEFS || ALL}`);
  if (!ANTS_ONLY && !DEFS && !ALL) {
    console.log('Specify --ants-only and/or --defs (or --all). Add --apply to write.');
    process.exit(0);
  }

  console.log('[scan] loading global_dictionary...');
  const rows = await fetchAllRows();
  console.log(`[scan] ${rows.length} rows`);

  if (ANTS_ONLY || ALL) {
    await cleanAntonyms(rows);
  }
  if (DEFS || ALL) {
    await fixDefinitions(rows);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
