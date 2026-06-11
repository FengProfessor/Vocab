/**
 * BÀO nội dung grammar hàng loạt theo "Golden Lesson" template.
 *
 * Anchor chất lượng = golden-seed.json (Present Simple). Few-shot ép mọi bài
 * ra cùng độ dày + cấu trúc. Kết quả ghi out/<slug>.json (chưa đụng DB).
 *
 * Chạy (trong web-app/):
 *   npx tsx scripts/grammar-gen/generate.ts                      # bào hết 60 bài (Gemini)
 *   npx tsx scripts/grammar-gen/generate.ts --level beginner     # 1 cấp
 *   npx tsx scripts/grammar-gen/generate.ts --only past-simple,articles
 *   npx tsx scripts/grammar-gen/generate.ts --provider groq      # bào bằng Groq
 *   npx tsx scripts/grammar-gen/generate.ts --force              # bào lại cả bài đã có
 *
 * Env: GEMINI_API_KEY (nhiều key phân tách bằng dấu phẩy) hoặc GROQ_API_KEY.
 * Tiết kiệm quota: mặc định SKIP bài đã có file out/<slug>.json (resume).
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');

type Topic = { slug: string; title: string; title_vi: string; level: string; order: number };

// ── CLI args ──
const args = process.argv.slice(2);
const getFlag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] ?? '') : undefined; };
const has = (n: string) => args.includes(n);
const levelArg = getFlag('--level');
const onlyArg = getFlag('--only');
const force = has('--force');
const provider = (getFlag('--provider') || 'gemini').toLowerCase();
const limit = parseInt(getFlag('--limit') || '0', 10);
const delayMs = parseInt(getFlag('--delay') || '3000', 10);

function pickKey(envName: string): string {
  const raw = process.env[envName] || '';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  if (!keys.length) throw new Error(`Thiếu env ${envName}`);
  return keys[Math.floor(Math.random() * keys.length)];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** tsx không tự nạp .env.local — đọc thủ công các key cần. */
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

function buildPrompt(topic: Topic, seed: string): string {
  const levelLabel = { beginner: 'cơ bản (A1-A2)', intermediate: 'trung cấp (B1-B2)', advanced: 'nâng cao (C1-C2)' }[topic.level] || topic.level;
  return `Bạn là giáo viên tiếng Anh giỏi nhất Việt Nam, viết giáo trình ngữ pháp cho người Việt mới học. Chất lượng phải đặt LÊN HÀNG ĐẦU: hay, dày, dễ hiểu, sư phạm, chính xác tuyệt đối.

Tạo MỘT bài học ngữ pháp hoàn chỉnh về: "${topic.title}" (${topic.title_vi}) — cấp độ ${levelLabel}.

Trả về JSON THUẦN (không markdown bao ngoài) ĐÚNG schema như bài mẫu dưới đây. Bài mẫu là CHUẨN CHẤT LƯỢNG TỐI THIỂU — bài bạn viết phải dày và chất lượng tương đương hoặc hơn.

YÊU CẦU BẮT BUỘC:
- Giải thích bằng tiếng Việt rõ ràng cho người MỚI BẮT ĐẦU; thuật ngữ khó phải giải thích (vd phụ âm/nguyên âm là gì).
- sections.definition: 2-4 câu, dễ hiểu, in đậm thuật ngữ chính bằng **.
- sections.usage: >=4 trường hợp dùng, mỗi cái có icon emoji, label, câu ví dụ en + dịch vi.
- sections.formula: bảng rows (+)(-)(?) + note. Nếu chủ đề không phải "thì" thì rows mô tả cấu trúc phù hợp.
- sections.rules: bảng biến đổi/quy tắc (>=2 dòng) nếu có; ví dụ phải chỉ rõ (vd chữ trước "y").
- sections.signals: mảng dấu hiệu nhận biết (để [] nếu không áp dụng).
- sections.examples: >=6 câu song ngữ tự nhiên, đa dạng (khẳng định/phủ định/nghi vấn...), mỗi câu có note ngắn.
- sections.mistakes: >=3 lỗi người Việt hay mắc, mỗi cái có wrong, right, why.
- sections.tips: mẹo nhớ (markdown).
- sections.comparison: so sánh với cấu trúc dễ nhầm (markdown). Để "" nếu không có.
- sections.timeline: { caption, points:[{label,note}] } nếu chủ đề là THÌ (tense); chủ đề khác để null.
- exercises: >=12 câu, đa dạng type: "mcq" (opts+answer), "fill" (answer là MẢNG các đáp án chấp nhận), "tf" (answer true/false), "error" (opts+answer là câu sai). Mỗi câu có fb (giải thích ngắn).
- Tất cả tiếng Anh phải chuẩn ngữ pháp, tự nhiên; tiếng Việt phải mượt.
- Giữ nguyên: slug="${topic.slug}", title="${topic.title}", title_vi="${topic.title_vi}", level="${topic.level}", order=${topic.order}.

=== BÀI MẪU CHUẨN (schema + độ dày bắt buộc) ===
${seed}
=== HẾT BÀI MẪU ===

Bây giờ viết bài cho "${topic.title}". CHỈ trả JSON, không giải thích thêm.`;
}

async function callGemini(prompt: string): Promise<string> {
  const key = pickKey('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 8192 },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join('') ?? '';
  if (!text) throw new Error('Gemini trả rỗng (có thể bị chặn safety/maxTokens)');
  return text;
}

async function callGroq(prompt: string): Promise<string> {
  const key = pickKey('GROQ_API_KEY');
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'Bạn là giáo viên tiếng Anh chuyên nghiệp. Luôn trả JSON thuần đúng schema.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 8000,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq trả rỗng');
  return text;
}

function parseJson(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw); } catch { /* fallthrough */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Không tách được JSON');
  return JSON.parse(m[0]);
}

function validate(o: Record<string, unknown>): string[] {
  const errs: string[] = [];
  const s = o.sections as Record<string, unknown> | undefined;
  const ex = o.exercises as unknown[] | undefined;
  if (!s) errs.push('thiếu sections');
  if (s) {
    if (typeof s.definition !== 'string' || (s.definition as string).length < 40) errs.push('definition quá ngắn');
    if (!Array.isArray(s.usage) || (s.usage as unknown[]).length < 3) errs.push('usage < 3');
    if (!Array.isArray(s.examples) || (s.examples as unknown[]).length < 6) errs.push('examples < 6');
    if (!Array.isArray(s.mistakes) || (s.mistakes as unknown[]).length < 3) errs.push('mistakes < 3');
  }
  if (!Array.isArray(ex) || ex.length < 10) errs.push('exercises < 10');
  return errs;
}

async function main() {
  loadEnv();
  const roadmap: Topic[] = JSON.parse(await readFile(path.join(DIR, 'roadmap.json'), 'utf8'));
  const seed = (await readFile(path.join(DIR, 'golden-seed.json'), 'utf8')).trim();
  await mkdir(OUT, { recursive: true });

  let topics = roadmap;
  if (levelArg) topics = topics.filter((t) => t.level === levelArg);
  if (onlyArg) { const set = new Set(onlyArg.split(',').map((s) => s.trim())); topics = topics.filter((t) => set.has(t.slug)); }
  if (limit > 0) topics = topics.slice(0, limit);

  const call = provider === 'groq' ? callGroq : callGemini;
  // 429 (rate limit theo phút) → đợi 65s rồi thử lại; tránh fail oan trên free tier.
  const callRetry = async (prompt: string, label: string): Promise<string> => {
    for (let i = 0; i < 6; i++) {
      try { return await call(prompt); }
      catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/429|rate limit|tokens per minute|quota/i.test(msg) && i < 5) {
          console.log(`     ⏳ ${label}: rate limit, đợi 65s (thử lại ${i + 1}/5)...`);
          await sleep(65_000); continue;
        }
        throw e;
      }
    }
    throw new Error('hết lượt retry sau 429');
  };
  console.log(`[grammar-gen] provider=${provider} · ${topics.length} bài · delay=${delayMs}ms · force=${force}`);

  const issues: string[] = [];
  let done = 0, skipped = 0;

  for (const t of topics) {
    const outFile = path.join(OUT, `${t.slug}.json`);
    if (!force && existsSync(outFile)) { skipped++; console.log(`  ⏭  ${t.slug} (đã có)`); continue; }

    let lastErr = '';
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        const raw = await callRetry(buildPrompt(t, seed), t.slug);
        const obj = parseJson(raw);
        // ép field định danh đúng (model đôi khi đổi)
        obj.slug = t.slug; obj.title = t.title; obj.title_vi = t.title_vi; obj.level = t.level; obj.order = t.order;
        const errs = validate(obj);
        if (errs.length && attempt === 1) { lastErr = errs.join(', '); continue; } // thử lại 1 lần
        await writeFile(outFile, JSON.stringify(obj, null, 2), 'utf8');
        if (errs.length) { issues.push(`${t.slug}: ${errs.join(', ')}`); console.log(`  ⚠  ${t.slug} (lưu nhưng yếu: ${errs.join(', ')})`); }
        else console.log(`  ✅ ${t.slug}`);
        done++; ok = true;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (attempt === 2) { issues.push(`${t.slug}: FAIL ${lastErr}`); console.log(`  ❌ ${t.slug}: ${lastErr}`); }
        else await sleep(2000);
      }
    }
    await sleep(delayMs); // tránh rate limit
  }

  console.log(`\n[grammar-gen] xong: ${done} bào, ${skipped} bỏ qua. Output: ${OUT}`);
  if (issues.length) { console.log(`\n⚠ Cần review (${issues.length}):`); issues.forEach((i) => console.log('  - ' + i)); }

  const files = (await readdir(OUT)).filter((f) => f.endsWith('.json'));
  console.log(`\nTổng file trong out/: ${files.length}/${roadmap.length}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
