import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * enrich-all — TỰ ĐỘNG toàn bộ enrich global_dictionary trong 1 lệnh:
 *   Phase 0: backfill audio (youdao URL, tức thì, không AI)
 *   Phase 1: family + synonyms + antonyms — 1 AI call/từ lấp MỌI field còn thiếu
 *
 * Tự trị qua AIRouter (Groq+Gemini rotation+cooldown), chạy song song, resume-safe
 * (chỉ đụng field thiếu, đánh dấu *Checked khi AI trả rỗng → không kẹt lặp),
 * tự dừng khi quota cạn.
 *
 * Chạy: cd web-app && npx tsx scripts/enrich-all.ts [--limit=N] [--conc=4] [--skip-audio] [--dry]
 */

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function arg(name: string, def: string): string {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : def;
}
const LIMIT = parseInt(arg('limit', '0'), 10);        // 0 = không giới hạn
const CONC = Math.max(parseInt(arg('conc', '4'), 10), 1);
const SKIP_AUDIO = process.argv.includes('--skip-audio');
const DRY = process.argv.includes('--dry');
const LOOP = process.argv.includes('--loop');         // tự lặp tới khi xong
const COOLDOWN_MIN = parseInt(arg('cooldown', '5'), 10); // phút nghỉ khi quota cạn

interface FamilyEntry { word: string; pos?: string; meaning?: string }
type Row = { id: string; word: string; data: any };

const isFamilyEnriched = (fw: unknown): boolean =>
  Array.isArray(fw) && fw.length > 0 &&
  fw.every((e: any) => e && typeof e === 'object' && e.word && e.meaning);

const audioUrl = (w: string, t: 1 | 2) => `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(w)}&type=${t}`;

function cleanList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>(); const out: string[] = [];
  for (const x of arr) { const v = String(x || '').trim(); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); } }
  return out.slice(0, 8);
}

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = []; let from = 0; const page = 1000;
  while (true) {
    const { data, error } = await supabase.from('global_dictionary').select('id, word, data').range(from, from + page - 1);
    if (error) { console.error('❌ fetch:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

// ---------- Phase 0: audio ----------
async function backfillAudio(rows: Row[]) {
  let n = 0; let batch: { id: string; data: any }[] = [];
  const flush = async () => { if (batch.length && !DRY) await Promise.all(batch.map((b) => supabase.from('global_dictionary').update({ data: b.data }).eq('id', b.id))); batch = []; };
  for (const r of rows) {
    const d = r.data || {}; const prons = Array.isArray(d.pronunciations) ? d.pronunciations : [];
    let changed = false;
    if (prons.length === 0) { d.pronunciations = [{ ipa: '', audio_uk: audioUrl(r.word, 1), audio_us: audioUrl(r.word, 2) }]; changed = true; }
    else { const p = prons[0]; if (!p.audio_uk) { p.audio_uk = audioUrl(r.word, 1); changed = true; } if (!p.audio_us) { p.audio_us = audioUrl(r.word, 2); changed = true; } }
    if (changed) { n++; r.data = d; batch.push({ id: r.id, data: d }); if (batch.length >= 50) await flush(); }
  }
  await flush();
  console.log(`🔊 Audio: ${DRY ? 'sẽ bù' : 'bù'} ${n} entry.`);
}

// ---------- Phase 1: family + syn/ant ----------
function needsWork(r: Row): { family: boolean; synant: boolean } {
  const d = r.data || {};
  const single = !/\s/.test(r.word);
  const family = single && !isFamilyEnriched(d.familyWords) && d.familyChecked !== true;
  const synant = !(Array.isArray(d.synonyms) && d.synonyms.length > 0) && d.synAntChecked !== true;
  return { family, synant };
}

function buildPrompt(word: string, def: string, need: { family: boolean; synant: boolean }): string {
  const parts: string[] = [];
  if (need.family) parts.push(`"family": [{"word":"dạng phái sinh lowercase","pos":"noun|verb|adjective|adverb","meaning":"nghĩa tiếng Việt ngắn gọn"}] (gồm cả từ gốc, chỉ dạng CÓ THẬT, tối đa 6; nếu không có để [])`);
  if (need.synant) parts.push(`"synonyms": ["3-6 từ đồng nghĩa tiếng Anh"]`, `"antonyms": ["0-5 từ trái nghĩa tiếng Anh, không có để []"]`);
  return `Bạn là máy từ điển Anh-Việt. Cho từ "${word}"${def ? ` (nghĩa: "${def}")` : ''}, trả về JSON RAW duy nhất:
{${parts.join(', ')}}
Chỉ JSON, không markdown, không giải thích.`;
}

/** 1 lượt: fetch → tính work → xử lý song song. Trả về {workLen, ok, aborted}. */
async function runPass(router: any): Promise<{ workLen: number; ok: number; aborted: boolean }> {
  const rows = await fetchAll();
  if (!SKIP_AUDIO) await backfillAudio(rows);

  let work = rows.map((r) => ({ r, need: needsWork(r) })).filter((x) => x.need.family || x.need.synant);
  if (LIMIT > 0) work = work.slice(0, LIMIT);
  console.log(`📊 ${work.length} entry cần family/syn-ant.`);
  if (work.length === 0) return { workLen: 0, ok: 0, aborted: false };

  let ok = 0, done = 0, consecutiveRL = 0;
  const RL_ABORT = 8;
  let aborted = false;

  async function processOne(item: { r: Row; need: { family: boolean; synant: boolean } }) {
    if (aborted) return;
    const { r, need } = item;
    const def = r.data?.results?.[0]?.meanings?.[0]?.definition || '';
    const prompt = buildPrompt(r.word, def, need);

    let raw = ''; let success = false; let wasRL = false;
    for (let attempt = 0; attempt < 2 && !success; attempt++) {
      try { raw = await router.generate(prompt, 'normal', true); success = true; }
      catch (e: any) { const msg = e.message || String(e); wasRL = /429|quota|cooldown|RESOURCE_EXHAUSTED|limit|No keys available/i.test(msg); if (!wasRL) break; await new Promise((x) => setTimeout(x, 2000)); }
    }
    done++;
    if (!success) { if (wasRL && ++consecutiveRL >= RL_ABORT) { aborted = true; console.warn(`\n🛑 Quota cạn (${consecutiveRL} fail). Dừng lượt tại ${ok}.`); } return; }
    consecutiveRL = 0;

    let parsed: any;
    try { parsed = JSON.parse(raw.trim()); } catch { const m = raw.match(/\{[\s\S]*\}/); if (!m) return; try { parsed = JSON.parse(m[0]); } catch { return; } }

    const base = r.data || {};
    const newData: any = { ...base };
    let touched = false;

    if (need.family) {
      const arr = Array.isArray(parsed.family) ? parsed.family : [];
      const fam: FamilyEntry[] = arr.map((e: any) => ({ word: String(e.word || '').trim().toLowerCase(), pos: String(e.pos || '').trim().toLowerCase() || undefined, meaning: String(e.meaning || '').trim() || undefined })).filter((e: FamilyEntry) => e.word && e.meaning);
      const seen = new Set<string>(); const fd = fam.filter((e) => (seen.has(e.word) ? false : (seen.add(e.word), true)));
      if (fd.length > 0) { newData.familyWords = fd; } else { newData.familyChecked = true; }
      touched = true;
    }
    if (need.synant) {
      const syn = cleanList(parsed.synonyms); const ant = cleanList(parsed.antonyms);
      if (syn.length || ant.length) { if (syn.length) newData.synonyms = syn; if (ant.length) newData.antonyms = ant; }
      else { newData.synAntChecked = true; }
      touched = true;
    }
    if (!touched) return;

    const { error } = await supabase.from('global_dictionary').update({ data: newData }).eq('id', r.id);
    if (!error) { ok++; if (ok % 25 === 0) console.log(`   ... ${ok} ghi / ${done} xử lý / ${work.length} tổng`); }
  }

  let idx = 0;
  async function worker() { while (idx < work.length && !aborted) { const i = idx++; await processOne(work[i]); await new Promise((x) => setTimeout(x, 150)); } }
  console.log(`🚀 Xử lý ${work.length} entry, song song ${CONC}...`);
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`   ✓ Lượt: ${ok} ghi / ${done} xử lý.`);
  return { workLen: work.length, ok, aborted };
}

async function main() {
  if (DRY) {
    console.log('🔍 Fetching global_dictionary...');
    const rows = await fetchAll();
    if (!SKIP_AUDIO) await backfillAudio(rows);
    const work = rows.map((r) => ({ r, need: needsWork(r) })).filter((x) => x.need.family || x.need.synant);
    console.log(`[DRY] ${work.length} entry cần xử lý.`);
    return;
  }

  const { getRouter } = await import('../src/lib/ai-router');
  const router = getRouter();

  let pass = 0;
  while (true) {
    pass++;
    console.log(`\n===== LƯỢT ${pass} =====`);
    const { workLen, ok, aborted } = await runPass(router);

    if (workLen === 0) { console.log('\n✅ HOÀN TẤT — không còn gì để enrich.'); break; }
    if (!LOOP) { console.log(`\n🏁 ${ok} ghi. ${aborted ? 'Quota cạn — chạy lại để tiếp.' : 'Còn pending — thêm --loop để tự chạy hết.'}`); break; }
    if (aborted) {
      console.log(`\n💤 Quota cạn — nghỉ ${COOLDOWN_MIN} phút rồi tiếp...`);
      await new Promise((x) => setTimeout(x, COOLDOWN_MIN * 60_000));
    }
  }
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
