import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';

/**
 * auto-chrome-bot — lái NHIỀU Chrome (mỗi cái 1 nick Google) tự cào family +
 * synonyms/antonyms qua aistudio/gemini (LLM FREE, 0 quota API). Node làm hết
 * phần HTTP/DB (không CORS, không cần dev server); browser chỉ sinh text.
 *
 * QUY TRÌNH:
 *   1) Chạy launch-chrome-bots.cmd để mở K Chrome (profile + debug port riêng).
 *      Lần đầu: login Google + mở 1 chat aistudio.google.com ở mỗi cửa sổ.
 *   2) cd web-app && npx tsx scripts/auto-chrome-bot.ts --ports=9222,9223,9224,9225
 *
 * Cờ: --ports=9222,... (bắt buộc) · --batch=10 · --dry
 */

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1].trim()] = v; }
  });
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

const arg = (n: string, d: string) => { const p = process.argv.find((a) => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : d; };
const PORTS = arg('ports', '').split(',').map((s) => s.trim()).filter(Boolean);
const BATCH = Math.max(parseInt(arg('batch', '10'), 10), 1);
const DRY = process.argv.includes('--dry');
const MAX_BATCHES_PER_RELOAD = 20;

interface FamilyEntry { word: string; pos?: string; meaning?: string }
type Row = { id: string; word: string; data: any };

const isFamilyEnriched = (fw: unknown) => Array.isArray(fw) && fw.length > 0 && fw.every((e: any) => e && typeof e === 'object' && e.word && e.meaning);
function needsWork(r: Row) {
  const d = r.data || {}; const single = !/\s/.test(r.word);
  return { family: single && !isFamilyEnriched(d.familyWords) && d.familyChecked !== true, synant: !(Array.isArray(d.synonyms) && d.synonyms.length > 0) && d.synAntChecked !== true };
}
function cleanList(arr: unknown): string[] { if (!Array.isArray(arr)) return []; const seen = new Set<string>(); const out: string[] = []; for (const x of arr) { const v = String(x || '').trim(); if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); } } return out.slice(0, 8); }

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = []; let from = 0; const page = 1000;
  while (true) { const { data, error } = await supabase.from('global_dictionary').select('id, word, data').range(from, from + page - 1); if (error) { console.error('❌ fetch:', error.message); process.exit(1); } if (!data || !data.length) break; rows.push(...(data as Row[])); if (data.length < page) break; from += page; }
  return rows;
}

function buildPrompt(items: { word: string; def: string }[]): string {
  const list = items.map((x) => x.def ? `${x.word} (nghĩa: ${x.def})` : x.word).join(' | ');
  return `Bạn là máy từ điển Anh-Việt. Với MỖI từ dưới đây, trả về JSON ARRAY RAW (không markdown, không giải thích):
[{"word":"từ gốc","family":[{"word":"dạng phái sinh lowercase","pos":"noun|verb|adjective|adverb","meaning":"nghĩa Việt ngắn"}],"synonyms":["3-6 từ đồng nghĩa tiếng Anh"],"antonyms":["0-5 từ trái nghĩa, không có để []"]}]
QUY TẮC: family gồm cả từ gốc, chỉ dạng CÓ THẬT tối đa 6 (không có để []). Chỉ JSON.
DANH SÁCH: ${list}`;
}

/** Đổ prompt vào editor + bấm chạy. Chạy trong page context. */
const PAGE_SUBMIT = (prompt: string, isAI: boolean) => {
  function deepQuery(root: Document | ShadowRoot | Element, sel: string): Element | null {
    const el = (root as Element).querySelector?.(sel) || (root as Document).querySelector?.(sel);
    if (el && (el as HTMLElement).offsetParent !== null) return el;
    const all = (root as Element).querySelectorAll?.('*') || (root as Document).querySelectorAll('*');
    for (const e of Array.from(all)) { const sr = (e as HTMLElement).shadowRoot; if (sr) { const f = deepQuery(sr, sel); if (f) return f; } }
    return null;
  }
  const inSel = isAI ? ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]'] : ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'];
  let ed: Element | null = null;
  for (const s of inSel) { ed = deepQuery(document.documentElement, s); if (ed) break; }
  if (!ed) return 'NO_INPUT';
  const e = ed as HTMLElement & { value?: string; isContentEditable?: boolean };
  e.focus();
  if (e.tagName === 'TEXTAREA' || e.tagName === 'INPUT') (e as HTMLInputElement).value = prompt;
  else if (e.isContentEditable) document.execCommand('insertText', false, prompt);
  else e.textContent = prompt;
  e.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(() => {
    if (isAI) {
      const btns = document.querySelectorAll('button, div[role="button"]');
      for (const b of Array.from(btns)) { const t = (b as HTMLElement).innerText || ''; if ((b as HTMLElement).offsetParent !== null && (t.includes('Run') || t.includes('Submit'))) { (b as HTMLElement).click(); return; } }
    } else {
      const b = deepQuery(document.documentElement, 'button.send-button') || deepQuery(document.documentElement, 'button[aria-label*="Send"]') || deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
      if (b) (b as HTMLElement).click();
    }
  }, 800);
  return 'OK';
};

function findResultJSON(text: string, expected: string[]): any[] | null {
  const exp = expected.map((w) => w.toLowerCase().trim());
  const out: any[][] = [];
  let start = 0;
  while ((start = text.indexOf('[', start)) !== -1) {
    let end = start;
    while ((end = text.indexOf(']', end + 1)) !== -1) {
      try { const p = JSON.parse(text.substring(start, end + 1)); if (Array.isArray(p) && p.length && p[0].word) { out.push(p); break; } } catch { /* keep */ }
    }
    start++;
  }
  for (let i = out.length - 1; i >= 0; i--) if (out[i].some((it) => it.word && exp.includes(String(it.word).toLowerCase().trim()))) return out[i];
  return null;
}

async function saveResult(parsed: any[], byWord: Map<string, Row>) {
  let n = 0;
  for (const item of parsed) {
    const w = String(item.word || '').trim().toLowerCase(); const r = byWord.get(w); if (!r) continue;
    const need = needsWork(r); const base = r.data || {}; const nd: any = { ...base }; let touched = false;
    if (need.family) {
      const fam: FamilyEntry[] = (Array.isArray(item.family) ? item.family : []).map((e: any) => ({ word: String(e.word || '').trim().toLowerCase(), pos: String(e.pos || '').trim().toLowerCase() || undefined, meaning: String(e.meaning || '').trim() || undefined })).filter((e: FamilyEntry) => e.word && e.meaning);
      const seen = new Set<string>(); const fd = fam.filter((e) => (seen.has(e.word) ? false : (seen.add(e.word), true)));
      if (fd.length) nd.familyWords = fd; else nd.familyChecked = true; touched = true;
    }
    if (need.synant) { const syn = cleanList(item.synonyms); const ant = cleanList(item.antonyms); if (syn.length || ant.length) { if (syn.length) nd.synonyms = syn; if (ant.length) nd.antonyms = ant; } else nd.synAntChecked = true; touched = true; }
    if (!touched) continue;
    const { error } = await supabase.from('global_dictionary').update({ data: nd }).eq('id', r.id); if (!error) { n++; r.data = nd; }
  }
  return n;
}

async function driveInstance(port: string, shard: Row[], byWord: Map<string, Row>, tag: string) {
  let browser;
  try { browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null }); }
  catch (e: any) { console.error(`[${tag}] connect ${port} fail: ${e.message}`); return 0; }

  const pages = await browser.pages();
  let page = pages.find((p) => /aistudio\.google|gemini\.google/.test(p.url()));
  if (!page) { console.error(`[${tag}] không thấy tab aistudio/gemini ở port ${port}. Mở 1 chat trước.`); browser.disconnect(); return 0; }
  const isAI = /aistudio/.test(page.url());
  console.log(`[${tag}] connected port ${port} (${isAI ? 'aistudio' : 'gemini'}), shard ${shard.length} từ.`);

  let saved = 0; let batchN = 0;
  for (let i = 0; i < shard.length; i += BATCH) {
    const batch = shard.slice(i, i + BATCH).filter((r) => needsWork(r).family || needsWork(r).synant);
    if (batch.length === 0) continue;
    const items = batch.map((r) => ({ word: r.word, def: r.data?.results?.[0]?.meanings?.[0]?.definition || '' }));
    const prompt = buildPrompt(items);
    const expected = batch.map((r) => r.word);

    const sub = await page.evaluate(PAGE_SUBMIT as any, prompt, isAI);
    if (sub === 'NO_INPUT') { console.warn(`[${tag}] NO_INPUT — reload`); await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await new Promise((r) => setTimeout(r, 4000)); continue; }

    // poll
    let parsed: any[] | null = null; const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      await new Promise((r) => setTimeout(r, 1500));
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');
      if (/reached your quota|rate limit|try again later|you've reached/i.test(text)) { console.warn(`[${tag}] HẾT QUOTA ở port ${port} — dừng instance.`); browser.disconnect(); return saved; }
      parsed = findResultJSON(text, expected);
      if (parsed) break;
    }
    if (!parsed) { console.warn(`[${tag}] timeout batch — reload`); await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await new Promise((r) => setTimeout(r, 4000)); continue; }

    const n = await saveResult(parsed, byWord); saved += n;
    console.log(`[${tag}] +${n} (tổng ${saved}/${shard.length})`);

    if (++batchN >= MAX_BATCHES_PER_RELOAD) { batchN = 0; await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); await new Promise((r) => setTimeout(r, 4000)); }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log(`[${tag}] XONG shard — ${saved} ghi.`);
  browser.disconnect();
  return saved;
}

async function main() {
  if (PORTS.length === 0) { console.error('❌ Cần --ports=9222,9223,... (mở Chrome bằng launch-chrome-bots.cmd trước).'); process.exit(1); }
  console.log('🔍 Fetching global_dictionary...');
  const rows = await fetchAll();
  const pending = rows.filter((r) => { const n = needsWork(r); return n.family || n.synant; });
  console.log(`📊 ${pending.length} entry pending. ${PORTS.length} Chrome instance.`);
  if (DRY) { console.log('[DRY] thoát.'); return; }
  if (pending.length === 0) { console.log('✅ Không còn gì.'); return; }

  const byWord = new Map<string, Row>(); for (const r of rows) byWord.set(r.word.toLowerCase(), r);

  // chia shard theo index
  const shards: Row[][] = PORTS.map(() => []);
  pending.forEach((r, i) => shards[i % PORTS.length].push(r));

  const results = await Promise.all(PORTS.map((port, i) => driveInstance(port, shards[i], byWord, `bot${i}`)));
  console.log(`\n🏁 Tổng: ${results.reduce((a, b) => a + b, 0)} ghi.`);
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
