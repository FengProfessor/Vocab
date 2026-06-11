/**
 * Deepen `sections.definition` cho 44 chủ đề chưa enrich (16 confusable đã làm comparison).
 * Adapt sang giọng golden VN từ nguồn chuẩn (NLM: docs/grammar-research/04-deep-definitions.md)
 * + giữ định nghĩa cũ làm mốc. Gemini flash-lite (Codex chết headless). Surgical update.
 *
 * Chạy (web-app/): npx tsx scripts/grammar-gen/update-definition.ts [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const REF = path.resolve(DIR, '../../../docs/grammar-research/04-deep-definitions.md');
const DRY = process.argv.includes('--dry');

const DONE = new Set(['present-simple', 'present-continuous', 'present-perfect', 'past-simple', 'past-continuous', 'present-perfect-continuous', 'future-will', 'be-going-to', 'conditionals-0-1', 'second-conditional', 'third-conditional', 'passive-voice', 'relative-clauses', 'reported-speech', 'gerunds-infinitives', 'used-to']);

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; }
  }
}
let KEYS: string[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gemini(prompt: string, attempt = 0): Promise<string> {
  const key = KEYS[attempt % KEYS.length];
  const m = new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-flash-lite-latest', generationConfig: { responseMimeType: 'application/json' } });
  try {
    const r = await m.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }, { signal: AbortSignal.timeout(45000) });
    return r.response.text();
  } catch (e: any) {
    if (/429|quota|rate/i.test(String(e?.message)) && attempt < 6) { await sleep(5000 * (attempt + 1)); return gemini(prompt, attempt + 1); }
    throw e;
  }
}

async function main() {
  loadEnv();
  KEYS = (process.env.GEMINI_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || KEYS.length === 0) throw new Error('Thiếu env');
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const reference = existsSync(REF) ? readFileSync(REF, 'utf8') : '';
  if (!reference) throw new Error('Thiếu reference: ' + REF);

  const onlyIdx = process.argv.indexOf('--only');
  const ONLY = onlyIdx >= 0 ? new Set((process.argv[onlyIdx + 1] || '').split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const road = JSON.parse(readFileSync(path.join(DIR, 'roadmap.json'), 'utf8')) as { slug: string; title: string; title_vi: string }[];
  const targets = road.filter((r) => !DONE.has(r.slug)).filter((r) => !ONLY || ONLY.has(r.slug));

  const PROMPT = (items: any[]) => `Bạn là chuyên gia sư phạm tiếng Anh. Dựa vào REFERENCE (định nghĩa chuẩn tiếng Anh từ Murphy/Cambridge/Oxford/British Council) và định nghĩa cũ, VIẾT LẠI định nghĩa tiếng Việt SÂU HƠN & chính xác cho mỗi chủ đề.
Yêu cầu mỗi định nghĩa: 2-3 câu, giọng sư phạm rõ ràng tự nhiên, **in đậm** thuật ngữ then chốt, nêu ĐÚNG bản chất + công dụng chính. KHÔNG dịch máy móc, KHÔNG dài dòng.
Trả về JSON: {"defs":{"<slug>":"định nghĩa tiếng Việt"}} — đúng mọi slug được cho. Không prose.

REFERENCE:
${reference}

TOPICS (json):
${JSON.stringify(items)}`;

  let okFile = 0, okDb = 0;
  const BATCH = 10;
  for (let i = 0; i < targets.length; i += BATCH) {
    const group = targets.slice(i, i + BATCH).map((t) => {
      const fp = path.join(OUT, `${t.slug}.json`);
      const cur = existsSync(fp) ? (JSON.parse(readFileSync(fp, 'utf8')).sections?.definition ?? '') : '';
      return { slug: t.slug, title: t.title, title_vi: t.title_vi, current_definition: cur };
    });
    process.stdout.write(`  [batch ${i / BATCH + 1}] ${group.length} topic... `);
    let raw: string;
    try { raw = await gemini(PROMPT(group)); } catch (e: any) { console.log('✗ ' + String(e.message).slice(0, 100)); continue; }
    let defs: Record<string, string> = {};
    try { defs = JSON.parse(raw).defs || {}; } catch { const mm = raw.match(/\{[\s\S]*\}/); if (mm) try { defs = JSON.parse(mm[0]).defs || {}; } catch {} }

    let n = 0;
    for (const t of group) {
      const d = defs[t.slug];
      if (!d || typeof d !== 'string' || d.length < 20) { console.log(`\n    ⚠ ${t.slug}: def yếu/thiếu, bỏ qua`); continue; }
      const fp = path.join(OUT, `${t.slug}.json`);
      if (existsSync(fp) && !DRY) { const j = JSON.parse(readFileSync(fp, 'utf8')); j.sections = j.sections || {}; j.sections.definition = d; writeFileSync(fp, JSON.stringify(j, null, 2) + '\n', 'utf8'); okFile++; }
      const { data: topic } = await sb.from('grammar_topics').select('id').eq('slug', t.slug).maybeSingle();
      if (topic && !DRY) {
        const { data: lessons } = await sb.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id);
        for (const l of lessons ?? []) { const sections = { ...(l.sections || {}), definition: d }; const { error } = await sb.from('grammar_lessons').update({ sections }).eq('id', l.id); if (!error) okDb++; }
      }
      n++;
    }
    console.log(`✓ ${n}`);
    await sleep(3500);
  }
  console.log(`\n[definition] ${okFile} out json · ${okDb} lesson DB cập nhật.`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
