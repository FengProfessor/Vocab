/**
 * Audit mục sections.usage của 62 bài grammar trên prod bằng Gemini.
 *
 * Lỗi cần bắt (teacher review 06, fix #4 — điển hình past-simple.json):
 * - usage item là CHỦ ĐỀ của câu ví dụ ("Trình độ học vấn", "Thành tựu giải thưởng")
 *   thay vì CHỨC NĂNG ngữ pháp ("hành động đã kết thúc tại thời điểm xác định trong quá khứ").
 * - usage lấn sân thì khác (past simple ghi "trải nghiệm/kinh nghiệm" = lãnh địa present perfect).
 *
 * Chạy (trong web-app/):
 *   npx tsx scripts/grammar-gen/audit-usage.ts --dry            # chấm + in đề xuất, không ghi
 *   npx tsx scripts/grammar-gen/audit-usage.ts --apply          # ghi usage mới cho bài LỖI
 *   npx tsx scripts/grammar-gen/audit-usage.ts --only past-simple,present-perfect --dry
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

interface UsageItem { icon?: string; label?: string; en?: string; vi?: string }
interface Verdict {
  ok: boolean;
  problems: string[];
  usage?: UsageItem[];
}

const LOG = '[GrammarUsage]';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = !process.argv.includes('--apply');
const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? new Set(process.argv[onlyIdx + 1].split(',').map((s) => s.trim())) : null;
const DELAY_MS = 3000;

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickKey(): string {
  // GEMINI_API_KEY hiện rỗng (hỏng từ 2026-06-22) → dùng Groq (pipeline grammar-gen từng dùng)
  const keys = (process.env.GROQ_API_KEY ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) throw new Error('Thiếu GROQ_API_KEY');
  return keys[Math.floor(Math.random() * keys.length)];
}

async function judgeUsage(slug: string, title: string, usage: UsageItem[]): Promise<Verdict> {
  const prompt = `Bạn là giáo viên ngữ pháp tiếng Anh 20 năm kinh nghiệm, cực kỳ khó tính về thuật ngữ.

Chủ đề ngữ pháp: "${title}" (slug: ${slug})
Mục "usage" (khi nào dùng) hiện tại của bài học:
${JSON.stringify(usage, null, 2)}

KIỂM TRA TỪNG item theo 2 tiêu chí:
1. Label mô tả CHỨC NĂNG NGỮ PHÁP (khi nào/để làm gì thì dùng cấu trúc)? Lỗi = label là CHỦ ĐỀ của câu ví dụ.
2. Chức năng ĐÚNG của cấu trúc này, không lấn thì/cấu trúc khác?

VÍ DỤ ĐẠT (KHÔNG được flag): Present Simple với labels "Thói quen, hành động lặp lại" / "Sự thật hiển nhiên, chân lý" / "Lịch trình cố định" — đây là chức năng chuẩn. Verb to be với "Miêu tả trạng thái/tính chất" / "Xác định danh tính" — chuẩn.
VÍ DỤ LỖI (phải flag): Past Simple với labels "Trình độ học vấn" / "Thành tựu giải thưởng" (= chủ đề câu ví dụ, không phải cách dùng thì) hoặc "Trải nghiệm, kinh nghiệm" (= chức năng của Present Perfect, không phải Past Simple).

QUY TẮC NGHIÊM: chỉ ok=false khi có ít nhất 1 item vi phạm RÕ RÀNG, KHÔNG THỂ CHỐI CÃI. Nghi ngờ / diễn đạt hơi khác cách bạn viết = VẪN ĐẠT. Đa số bài trong hệ thống là ĐẠT.

Trả về JSON:
{
  "ok": boolean,
  "problems": string[],    // MỖI lỗi phải TRÍCH NGUYÊN VĂN label vi phạm trong ngoặc kép + lý do ngắn; rỗng nếu ok
  "usage": [ ... ]         // CHỈ khi ok=false: bộ usage THAY THẾ 4-5 items chuẩn cho "${title}",
                           // format {"icon": "1 emoji", "label": "chức năng, tiếng Việt ngắn", "en": "câu ví dụ tiếng Anh", "vi": "dịch tiếng Việt"}
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pickKey()}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content ?? '';
  try {
    return JSON.parse(text) as Verdict;
  } catch {
    const m = text.match(/{[\s\S]*}/);
    if (m) return JSON.parse(m[0]) as Verdict;
    throw new Error('Không parse được JSON từ Groq');
  }
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: tErr } = await client.from('grammar_topics').select('id, slug, title, title_vi').order('order_index');
  if (tErr) throw new Error(tErr.message);

  let flagged = 0;
  let fixed = 0;
  const report: string[] = [];

  for (const topic of topics ?? []) {
    if (ONLY && !ONLY.has(topic.slug)) continue;
    const { data: lessons } = await client.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id).limit(1);
    const lesson = lessons?.[0];
    if (!lesson) continue;
    const sections = (lesson.sections ?? {}) as { usage?: UsageItem[] };
    const usage = sections.usage ?? [];
    if (usage.length === 0) { report.push(`${topic.slug}: KHÔNG có usage`); continue; }

    let verdict: Verdict;
    try {
      verdict = await judgeUsage(topic.slug, topic.title_vi ?? topic.title, usage);
    } catch (err) {
      console.warn(`${LOG} ⚠ ${topic.slug}: ${err instanceof Error ? err.message : err} — thử lại 1 lần`);
      await sleep(5000);
      verdict = await judgeUsage(topic.slug, topic.title_vi ?? topic.title, usage);
    }

    if (verdict.ok) {
      console.log(`${LOG} ✓ ${topic.slug}`);
    } else {
      flagged++;
      console.log(`${LOG} ✗ ${topic.slug}: ${verdict.problems.join(' | ')}`);
      report.push(`${topic.slug}: ${verdict.problems.join(' | ')}`);
      const replacement = (verdict.usage ?? []).filter((u) => u.label && u.en);
      if (replacement.length >= 3) {
        console.log(`${LOG}   → thay bằng: ${replacement.map((u) => u.label).join(' · ')}`);
        if (!DRY) {
          const nextSections = { ...(lesson.sections as object), usage: replacement };
          const { error } = await client.from('grammar_lessons').update({ sections: nextSections }).eq('id', lesson.id);
          if (error) throw new Error(`${topic.slug}: ${error.message}`);
          // Đồng bộ file local
          const filePath = path.join(OUT, `${topic.slug}.json`);
          if (existsSync(filePath)) {
            const local = JSON.parse(readFileSync(filePath, 'utf8'));
            local.sections = { ...(local.sections ?? {}), usage: replacement };
            writeFileSync(filePath, JSON.stringify(local, null, 2) + '\n', 'utf8');
          }
          fixed++;
        }
      } else {
        console.log(`${LOG}   ⚠ đề xuất thay thế không đủ chất lượng (${replacement.length} items) — cần sửa tay`);
      }
    }
    await sleep(DELAY_MS);
  }

  console.log(`${LOG} done: flagged=${flagged}, fixed=${fixed}, dry=${DRY}`);
  if (report.length) {
    console.log(`${LOG} BÁO CÁO:`);
    report.forEach((r) => console.log('  - ' + r));
  }
}

main().catch((error: unknown) => {
  console.error(LOG, 'FATAL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
