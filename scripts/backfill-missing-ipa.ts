import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// --- Configuration & Environment Setup ---
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Command Line Arguments ---
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const TARGET = (args.find(a => a.startsWith('--target='))?.split('=')[1] || 'words').toLowerCase(); // 'words' | 'gd' | 'all'
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10);
const BATCH_SIZE = Math.max(10, Math.min(100, parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '40', 10)));
const SLEEP_MS = Math.max(200, parseInt(args.find(a => a.startsWith('--sleep='))?.split('=')[1] || '500', 10));

// --- API Keys Setup ---
function splitKeys(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

const GEMINI_KEYS = splitKeys(process.env.GEMINI_API_KEY);
const ZHIPU_KEYS = splitKeys(process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY);

let geminiKeyIndex = 0;
function getNextGeminiKey(): string | null {
  if (GEMINI_KEYS.length === 0) return null;
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return key;
}

let zhipuKeyIndex = 0;
function getNextZhipuKey(): string | null {
  if (ZHIPU_KEYS.length === 0) return null;
  const key = ZHIPU_KEYS[zhipuKeyIndex % ZHIPU_KEYS.length];
  zhipuKeyIndex++;
  return key;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- IPA Validation & Phonetic Helpers ---
const VIETNAMESE_ACCENTS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const BOX_DRAWING_CHARS = /[\u2500-\u259F\u25A0-\u25FF]/;
const IPA_PHONETIC_SYMBOLS = /[ˈˌːˑəæɑɒɔɜɛɪʊʌɨʉɵɤɯʏøœɐɶᵻᵿθðʃʒŋɹɾɟɡβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ]/;

const LEGITIMATE_IDENTICAL_WORDS = new Set([
  'set', 'bet', 'net', 'wet', 'let', 'met', 'pet', 'get',
  'pen', 'ten', 'men', 'bed', 'red', 'fed', 'led', 'stem',
  'spend', 'send', 'lend', 'mend', 'tend', 'bend', 'test',
  'best', 'nest', 'rest', 'vest', 'west', 'help', 'fit', 'sit', 'hit'
]);

export function isValidIpa(rawIpa: string | null | undefined, headword?: string): boolean {
  if (!rawIpa) return false;
  let s = String(rawIpa).trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();
  s = s.replace(/^(US|UK|AmE|BrE|GA|RP)\s*[:：]?\s*/i, '').trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();

  if (!s || s.length > 150) return false;
  if (/^https?:/i.test(s) || s.includes('://') || s.includes('.com')) return false;
  if (BOX_DRAWING_CHARS.test(s)) return false;
  if (/^(n\/a|unknown|placeholder|none|null|\.|\-|\?+|gibberish|not found|undefined)$/i.test(s)) return false;

  if (headword) {
    const normHead = headword.toLowerCase().replace(/[\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    const normIpa = s.toLowerCase().replace(/[\/\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normHead === normIpa) {
      if (IPA_PHONETIC_SYMBOLS.test(s)) return true;
      if (LEGITIMATE_IDENTICAL_WORDS.has(normHead)) return true;
      return false;
    }
  }

  if (s.length >= 4 && !IPA_PHONETIC_SYMBOLS.test(s) && /^[a-zA-Z\s\-_]+$/.test(s)) {
    if (headword && LEGITIMATE_IDENTICAL_WORDS.has(headword.toLowerCase().trim())) {
      return true;
    }
    return false;
  }

  return true;
}

export function formatIpa(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();
  s = s.replace(/^(US|UK|AmE|BrE|GA|RP)\s*[:：]?\s*/i, '').trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();
  s = s.replace(/'/g, 'ˈ');
  s = s.replace(/,([a-zæɑɒɔəɜɛɪʊʌθðʃʒŋɹɾɟɡɨʉɵɤɯʏøœɐɶæʏβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ])/g, 'ˌ$1');
  return `/${s}/`;
}

export function extractCleanHeadword(raw: string): { headword: string; inlineIpa?: string } {
  let text = raw.trim();

  const m = text.match(/\/([^/\n]{2,80})\//);
  let inlineIpa: string | undefined;
  if (m) {
    const cand = m[1].trim();
    if (isValidIpa(cand)) {
      inlineIpa = formatIpa(cand);
      text = text.replace(m[0], ' ');
    }
  }

  text = text.replace(/^\d+[\.\t\s]+\s*/, '');
  const headPart = text.split(/[:\t(]/)[0].trim();

  if (headPart && /^[a-zA-Z\s'\-]+$/.test(headPart) && !VIETNAMESE_ACCENTS.test(headPart)) {
    return { headword: headPart, inlineIpa };
  }

  return { headword: text, inlineIpa };
}

// --- LLM Phonetic Generator ---
interface IpaTranscriptionResult {
  word: string;
  ipa: string;
}

async function requestGeminiIpa(words: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const key = getNextGeminiKey();
  if (!key) throw new Error('No Gemini API key available');

  const prompt = `You are a precision English lexicographer and phonetician.
Provide the standard General American International Phonetic Alphabet (IPA) pronunciation for each of the following English words or phrases.
Rules:
1. Return strictly a JSON object with this shape:
{
  "items": [
    {"word": "exact word/phrase", "ipa": "/.../"}
  ]
}
2. Ensure every IPA transcription is enclosed in slashes and includes primary stress marks (ˈ) where appropriate.
3. For multi-word phrases, transcribe the connected speech natural pronunciation with spaces between words, e.g.:
   {"word": "video footage", "ipa": "/ˈvɪdioʊ ˈfʊtɪdʒ/"}
4. Transcribe accurately without returning the plain English spelling.

Words to transcribe:
${JSON.stringify(words)}`;

  const models = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini ${model} ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response content');

      const parsed = JSON.parse(text);
      const items: IpaTranscriptionResult[] = Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed) ? parsed : [];

      for (const item of items) {
        if (item?.word && item?.ipa) {
          const formatted = formatIpa(item.ipa);
          if (isValidIpa(formatted, item.word)) {
            map.set(item.word.toLowerCase().trim(), formatted);
          }
        }
      }
      return map;
    } catch (e: any) {
      lastError = e;
      console.warn(`[Gemini ${model} warning]: ${e.message}`);
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

async function requestZhipuIpa(words: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const key = getNextZhipuKey();
  if (!key) throw new Error('No Zhipu API key available');

  const prompt = `You are an expert English phonetician.
Provide standard General American IPA pronunciation for each word or phrase.
Return strictly valid JSON:
{"items": [{"word": "...", "ipa": "/.../"}]}
Words: ${JSON.stringify(words)}`;

  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Zhipu ${res.status}: ${t.slice(0, 200)}`);
  }

  const json = await res.json();
  const rawText = json.choices?.[0]?.message?.content || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/) || rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Zhipu non-JSON response');

  const parsed = JSON.parse(jsonMatch[0]);
  const items: IpaTranscriptionResult[] = Array.isArray(parsed.items)
    ? parsed.items
    : Array.isArray(parsed) ? parsed : [];

  for (const item of items) {
    if (item?.word && item?.ipa) {
      const formatted = formatIpa(item.ipa);
      if (isValidIpa(formatted, item.word)) {
        map.set(item.word.toLowerCase().trim(), formatted);
      }
    }
  }

  return map;
}

async function fetchBatchIpa(words: string[]): Promise<Map<string, string>> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await requestGeminiIpa(words);
    } catch (geminiErr: any) {
      console.warn(`⚠️ Gemini attempt ${attempt} failed (${geminiErr.message}), falling back to Zhipu GLM...`);
      try {
        return await requestZhipuIpa(words);
      } catch (zhipuErr: any) {
        if (attempt < 2) {
          console.warn(`  ⏳ Retrying batch in 1500ms...`);
          await sleep(1500);
        } else {
          console.error(`❌ Both Gemini and Zhipu failed for batch: ${zhipuErr.message}`);
          return new Map();
        }
      }
    }
  }
  return new Map();
}

// --- Main Execution Logic ---
async function main() {
  console.log('================================================================');
  console.log('🎙️ LINGOPRO PHONETIC SCANNER & IPA BACKFILL PIPELINE');
  console.log(`Mode   : ${APPLY ? '⚡ APPLY (Writes to database)' : '👁️ DRY-RUN (Preview only, no DB writes)'}`);
  console.log(`Target : ${TARGET.toUpperCase()}`);
  console.log(`Limit  : ${LIMIT > 0 ? LIMIT : 'No limit'}`);
  console.log(`Batch  : ${BATCH_SIZE} words/call`);
  console.log('================================================================\n');

  const tmpDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ─────────────────────────────────────────────────────────────
  // 1. TARGET: WORDS TABLE
  // ─────────────────────────────────────────────────────────────
  if (TARGET === 'words' || TARGET === 'all') {
    console.log('🔍 [1/2] Scanning "words" table for missing or bogus IPA...');
    let offset = 0;
    const PAGE = 1000;
    const recordsToFix: Array<{ id: string; rawWord: string; headword: string; inlineIpa?: string; currentIpa: string; dictData: any }> = [];

    while (true) {
      const { data, error } = await supabase
        .from('words')
        .select('id, word, ipa, dictionary_data')
        .range(offset, offset + PAGE - 1);

      if (error) {
        console.error('❌ Error fetching words:', error.message);
        break;
      }
      if (!data || data.length === 0) break;

      for (const row of data) {
        const rawW = (row.word || '').trim();
        const { headword, inlineIpa } = extractCleanHeadword(rawW);

        if (VIETNAMESE_ACCENTS.test(headword)) {
          continue;
        }

        const cleanIpaVal = (row.ipa || '').trim();
        if (!cleanIpaVal || !isValidIpa(cleanIpaVal, headword)) {
          recordsToFix.push({
            id: row.id,
            rawWord: rawW,
            headword: headword.toLowerCase(),
            inlineIpa,
            currentIpa: cleanIpaVal,
            dictData: row.dictionary_data,
          });
        }
      }

      if (data.length < PAGE) break;
      offset += PAGE;
    }

    console.log(`📊 Found ${recordsToFix.length} records in "words" table needing IPA.`);

    const uniqueWordMap = new Map<string, typeof recordsToFix>();
    for (const r of recordsToFix) {
      if (!uniqueWordMap.has(r.headword)) {
        uniqueWordMap.set(r.headword, []);
      }
      uniqueWordMap.get(r.headword)!.push(r);
    }

    let distinctWords = Array.from(uniqueWordMap.keys());
    console.log(`📌 Found ${distinctWords.length} unique English headwords needing IPA.`);

    if (LIMIT > 0 && distinctWords.length > LIMIT) {
      distinctWords = distinctWords.slice(0, LIMIT);
      console.log(`⏱️ Limiting to first ${LIMIT} unique words.`);
    }

    let wordsResolvedCount = 0;
    let wordsUpdatedCount = 0;

    const wordsNeedingLlm: string[] = [];
    const preResolvedMap = new Map<string, string>();

    for (const hw of distinctWords) {
      const recs = uniqueWordMap.get(hw) || [];
      const withInline = recs.find(r => r.inlineIpa);
      if (withInline?.inlineIpa) {
        preResolvedMap.set(hw, withInline.inlineIpa);
      } else {
        wordsNeedingLlm.push(hw);
      }
    }

    console.log(`✨ Pre-resolved from inline IPA: ${preResolvedMap.size} headwords`);
    console.log(`🤖 Querying LLM for: ${wordsNeedingLlm.length} headwords\n`);

    for (let i = 0; i < wordsNeedingLlm.length; i += BATCH_SIZE) {
      const batch = wordsNeedingLlm.slice(i, i + BATCH_SIZE);
      console.log(`[Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wordsNeedingLlm.length / BATCH_SIZE)}] Processing ${batch.length} words...`);

      const ipaMap = await fetchBatchIpa(batch);
      for (const [w, ipa] of ipaMap.entries()) {
        preResolvedMap.set(w, ipa);
      }

      await sleep(SLEEP_MS);
    }

    for (const hw of distinctWords) {
      const resolvedIpa = preResolvedMap.get(hw);
      const associatedRecords = uniqueWordMap.get(hw) || [];

      if (resolvedIpa) {
        wordsResolvedCount += associatedRecords.length;
        console.log(`  ✓ "${hw}": ➔ ${resolvedIpa} (${associatedRecords.length} rows)`);

        if (APPLY) {
          for (const rec of associatedRecords) {
            const updates: any = { ipa: resolvedIpa };
            if (rec.dictData && typeof rec.dictData === 'object') {
              const updatedDict = { ...rec.dictData };
              if (!Array.isArray(updatedDict.pronunciations)) updatedDict.pronunciations = [];
              if (updatedDict.pronunciations.length === 0) {
                updatedDict.pronunciations.push({ ipa: resolvedIpa });
              } else {
                updatedDict.pronunciations[0].ipa = resolvedIpa;
              }
              updates.dictionary_data = updatedDict;
            }

            const { error: upErr } = await supabase.from('words').update(updates).eq('id', rec.id);
            if (!upErr) wordsUpdatedCount++;
          }

          try {
            const { data: gdRows } = await supabase.from('global_dictionary').select('id, data').eq('word', hw);
            if (gdRows && gdRows.length > 0) {
              for (const gdRow of gdRows) {
                const d = gdRow.data || {};
                const prons = Array.isArray(d.pronunciations) ? [...d.pronunciations] : [];
                if (prons.length === 0) prons.push({ ipa: resolvedIpa });
                else prons[0] = { ...prons[0], ipa: resolvedIpa };
                const nd = { ...d, pronunciations: prons, phonetic: resolvedIpa };
                await supabase.from('global_dictionary').update({ data: nd }).eq('id', gdRow.id);
              }
            }
          } catch {}
        }
      }
    }

    console.log('\n----------------------------------------------------------------');
    console.log(`🎉 "words" Table Completed!`);
    console.log(`Resolved: ${wordsResolvedCount}/${recordsToFix.length} records`);
    console.log(`Database Updates: ${APPLY ? wordsUpdatedCount : 0} (Dry-run: ${!APPLY ? wordsResolvedCount : 0})`);
    console.log('----------------------------------------------------------------\n');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TARGET: GLOBAL_DICTIONARY
  // ─────────────────────────────────────────────────────────────
  if (TARGET === 'gd' || TARGET === 'all') {
    console.log('🔍 [2/2] Scanning "global_dictionary" for missing or fake IPA...');
    const PAGE = 1000;
    const gdToFix: Array<{ id: string; word: string; currentIpa: string; data: any }> = [];

    // Keyset pagination using id to prevent query timeouts
    let lastId: string | null = null;
    let totalScanned = 0;

    while (true) {
      let query = supabase
        .from('global_dictionary')
        .select('id, word, data')
        .order('id', { ascending: true })
        .limit(PAGE);

      if (lastId) {
        query = query.gt('id', lastId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching global_dictionary:', error.message);
        break;
      }
      if (!data || data.length === 0) break;

      totalScanned += data.length;
      lastId = data[data.length - 1].id;

      for (const row of data) {
        const w = (row.word || '').trim();
        if (!w || VIETNAMESE_ACCENTS.test(w)) continue;

        const d = row.data || {};
        const firstIpa = (d.pronunciations?.[0]?.ipa || d.phonetic || '').trim();

        if (!isValidIpa(firstIpa, w)) {
          gdToFix.push({
            id: row.id,
            word: w,
            currentIpa: firstIpa,
            data: d,
          });
        }
      }

      if (totalScanned % 10000 === 0) console.log(`  Scanned ${totalScanned} dictionary rows...`);
      if (data.length < PAGE) break;

      // If user specified limit and we have enough candidates, break early
      if (LIMIT > 0 && gdToFix.length >= LIMIT * 2) {
        break;
      }
    }

    console.log(`📊 Found ${gdToFix.length} entries in "global_dictionary" needing IPA.`);

    let targetGdList = gdToFix;
    if (LIMIT > 0 && targetGdList.length > LIMIT) {
      targetGdList = targetGdList.slice(0, LIMIT);
      console.log(`⏱️ Limiting to first ${LIMIT} dictionary entries.`);
    }

    const gdBackupFile = path.join(tmpDir, `gd-ipa-backup-${Date.now()}.json`);
    fs.writeFileSync(gdBackupFile, JSON.stringify(targetGdList.slice(0, 500), null, 2), 'utf8');
    console.log(`💾 Saved backup snapshot to ${gdBackupFile}\n`);

    let gdUpdatedCount = 0;
    for (let i = 0; i < targetGdList.length; i += BATCH_SIZE) {
      const batchRows = targetGdList.slice(i, i + BATCH_SIZE);
      const batchWords = batchRows.map(r => r.word);
      console.log(`[GD Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(targetGdList.length / BATCH_SIZE)}] Processing ${batchWords.length} words...`);

      const ipaMap = await fetchBatchIpa(batchWords);

      for (const row of batchRows) {
        const resolvedIpa = ipaMap.get(row.word.toLowerCase());
        if (resolvedIpa) {
          console.log(`  ✓ "${row.word}": ${row.currentIpa || '(empty)'} ➔ ${resolvedIpa}`);

          if (APPLY) {
            const d = row.data || {};
            const prons = Array.isArray(d.pronunciations) ? [...d.pronunciations] : [];
            if (prons.length === 0) {
              prons.push({ ipa: resolvedIpa });
            } else {
              prons[0] = { ...prons[0], ipa: resolvedIpa };
            }

            const updatedData = {
              ...d,
              pronunciations: prons,
              phonetic: resolvedIpa,
            };

            const { error: upErr } = await supabase
              .from('global_dictionary')
              .update({ data: updatedData })
              .eq('id', row.id);

            if (upErr) {
              console.error(`    ❌ Failed to update GD ${row.id}: ${upErr.message}`);
            } else {
              gdUpdatedCount++;
            }
          }
        } else {
          console.warn(`  ⚠️ Could not resolve IPA for: "${row.word}"`);
        }
      }

      await sleep(SLEEP_MS);
    }

    console.log('\n----------------------------------------------------------------');
    console.log(`🎉 "global_dictionary" Completed!`);
    console.log(`Database Updates: ${APPLY ? gdUpdatedCount : 0} (Dry-run: ${!APPLY ? targetGdList.length : 0})`);
    console.log('----------------------------------------------------------------\n');
  }

  console.log('🏁 ALL TASKS COMPLETED.');
}

main().catch(err => {
  console.error('Fatal error in backfill-missing-ipa:', err);
  process.exit(1);
});
