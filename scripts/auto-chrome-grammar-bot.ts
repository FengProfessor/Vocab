import * as path from 'path';
import * as fs from 'fs';
import puppeteer from 'puppeteer-core';

/**
 * auto-chrome-grammar-bot — lái NHIỀU Chrome (mỗi cái 1 nick Google) tự cào grammar
 * qua aistudio/gemini (LLM FREE, 0 quota API).
 * Node làm hết phần HTTP/DB; browser chỉ sinh text.
 *
 * QUY TRÌNH (1 Chrome profile "ta phong", 8 tab = 8 nick qua /u/0../u/7):
 *   1) ĐÓNG hết Chrome. Chạy launch-chrome-grammar-bots.cmd → mở Profile 1 + 8 tab aistudio.
 *   2) cd web-app && npx tsx scripts/auto-chrome-grammar-bot.ts --ports=9222
 *      → connect, gom MỌI tab aistudio/gemini, mỗi tab (nick) là 1 worker, chia pending.
 *
 * Cờ: --ports=9222 (mặc định 9222) · --dry
 */

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1].trim()] = v;
    }
  });
}

const arg = (n: string, d: string) => {
  const p = process.argv.find((a) => a.startsWith(`--${n}=`));
  return p ? p.split('=').slice(1).join('=') : d;
};
const PORTS = arg('ports', '').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = process.argv.includes('--dry');
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 150_000; // 2.5 mins

/** Đổ prompt vào editor + bấm chạy. Chạy trong page context. */
const PAGE_SUBMIT = (prompt: string, isAI: boolean) => {
  function deepQuery(root: Document | ShadowRoot | Element, sel: string): Element | null {
    const el = (root as Element).querySelector?.(sel) || (root as Document).querySelector?.(sel);
    if (el && (el as HTMLElement).offsetParent !== null) return el;
    const all = (root as Element).querySelectorAll?.('*') || (root as Document).querySelectorAll('*');
    for (const e of Array.from(all)) {
      const sr = (e as HTMLElement).shadowRoot;
      if (sr) {
        const f = deepQuery(sr, sel);
        if (f) return f;
      }
    }
    return null;
  }
  const inSel = isAI
    ? ['textarea', 'div[contenteditable="true"]', 'div[role="textbox"]']
    : ['rich-textarea .ql-editor', 'rich-textarea p', 'div[contenteditable="true"]', 'textarea'];
  let ed: Element | null = null;
  for (const s of inSel) {
    ed = deepQuery(document.documentElement, s);
    if (ed) break;
  }
  if (!ed) return 'NO_INPUT';
  const e = ed as HTMLElement & { value?: string; isContentEditable?: boolean };
  e.focus();
  if (e.tagName === 'TEXTAREA' || e.tagName === 'INPUT') {
    (e as HTMLInputElement).value = prompt;
  } else if (e.isContentEditable) {
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, prompt);
  } else {
    e.textContent = prompt;
  }
  e.dispatchEvent(new Event('input', { bubbles: true }));
  setTimeout(() => {
    if (isAI) {
      const btns = document.querySelectorAll('button, div[role="button"]');
      for (const b of Array.from(btns)) {
        const t = (b as HTMLElement).innerText || '';
        if ((b as HTMLElement).offsetParent !== null && (t.includes('Run') || t.includes('Submit'))) {
          (b as HTMLElement).click();
          return;
        }
      }
    } else {
      const b =
        deepQuery(document.documentElement, 'button.send-button') ||
        deepQuery(document.documentElement, 'button[aria-label*="Send"]') ||
        deepQuery(document.documentElement, 'button[aria-label*="Gửi"]');
      if (b) (b as HTMLElement).click();
    }
  }, 800);
  return 'OK';
};

function findResultJSON(text: string): any[] | null {
  const matches: any[] = [];
  let start = 0;
  while ((start = text.indexOf('{', start)) !== -1) {
    let end = start;
    let bracketCount = 1;
    for (let i = start + 1; i < text.length; i++) {
      if (text[i] === '{') bracketCount++;
      else if (text[i] === '}') {
        bracketCount--;
        if (bracketCount === 0) {
          end = i;
          break;
        }
      }
    }
    if (bracketCount === 0 && end > start) {
      try {
        const subStr = text.substring(start, end + 1);
        const parsed = JSON.parse(subStr);
        if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
          matches.push(parsed.exercises);
        }
      } catch {
        /* keep scanning */
      }
    }
    start++;
  }
  if (matches.length === 0) return null;
  return matches[matches.length - 1]; // Return the latest JSON block
}

async function driveTab(page: any, isAI: boolean, shardIdx: number, totalShards: number, tag: string) {
  console.log(`[${tag}] ${isAI ? 'aistudio' : 'gemini'} — Khởi chạy worker Shard #${shardIdx}/${totalShards}.`);
  let saved = 0;
  const botSecret = process.env.BOT_SECRET || 'lingopro-secret-key-123';
  const baseUrl = 'http://localhost:3000'; // local server URL

  while (true) {
    // 1. Fetch next grammar lesson for this shard
    let lessonData: any = null;
    try {
      const res = await fetch(`${baseUrl}/api/bot/grammar/next?shard=${shardIdx}&shards=${totalShards}`, {
        headers: { 'Authorization': `Bearer ${botSecret}` },
      });
      lessonData = await res.json();
    } catch (e: any) {
      console.error(`[${tag}] Lỗi kết nối local API khi lấy bài tiếp theo:`, e.message);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (!lessonData.success) {
      console.error(`[${tag}] API báo lỗi:`, lessonData.error);
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    if (lessonData.finished) {
      console.log(`[${tag}] ✅ Hoàn thành toàn bộ các bài học ngữ pháp trong Shard #${shardIdx}!`);
      break;
    }

    const lesson = lessonData;
    const currentCount = lesson.exercises.length;
    const need = 100 - currentCount;
    const currentBatchSize = Math.min(25, need);

    console.log(`[${tag}] Shard ${shardIdx}: Đang xử lý "${lesson.slug}" (Đã có: ${currentCount}/100, Cần thêm: ${need}, Batch này: ${currentBatchSize}, Còn lại: ${lesson.remaining} bài)`);

    const existingBrief = lesson.exercises.map((e: any) => ({
      question: e.question || e.q || '',
      type: e.type,
    }));

    // 2. Build Prompt
    const prompt = `SYSTEM ROLE: Bạn là giáo viên tiếng Anh chuyên nghiệp cho người Việt. Trả về JSON ARRAY RAW (không markdown, không giải thích).
NHIỆM VỤ: Tạo đúng ${currentBatchSize} bài tập ngữ pháp mới cho chủ đề: "${lesson.title}" (${lesson.title_vi}).
Level: ${lesson.level} (beginner = A1-A2, intermediate = B1-B2, advanced = C1-C2).

Ngữ cảnh lý thuyết:
- Định nghĩa: ${lesson.sections.definition || ''}
- Cách dùng: ${JSON.stringify(lesson.sections.usage || [])}
- Quy tắc: ${JSON.stringify(lesson.sections.rules || [])}

TRÁNH TRÙNG LẶP. Không tạo các câu trùng hoặc quá giống với các câu hiện có sau:
${JSON.stringify(existingBrief.slice(-35))}

Quy tắc tạo câu hỏi:
1. Tạo đúng ${currentBatchSize} câu hỏi.
2. Với mỗi câu hỏi:
   - "type" phải là một trong: "multiple_choice", "fill_blank", "error_correction".
   - In đậm từ khóa chính trong "question" bằng ** (ví dụ: "Choose the correct **preposition**: She sat ___ the table.").
   - "options" phải chứa đúng 4 lựa chọn khác nhau (mảng chuỗi).
   - "correct_answer" phải trùng khớp hoàn toàn với 1 trong 4 options.
   - "explanation" bằng tiếng Việt (giải thích tại sao đúng và tại sao lựa chọn khác sai, tối đa 3 câu).
   - "difficulty" là 1 (dễ), 2 (trung bình), hoặc 3 (khó).
3. Đảm bảo tỷ lệ đa dạng giữa các dạng câu hỏi.
4. Trả về định dạng: { "exercises": [ { "type": "...", "question": "...", "options": [...], "correct_answer": "...", "explanation": "...", "difficulty": 2 } ] }
`;

    // 3. Inject and run prompt in page
    const sub = await page.evaluate(PAGE_SUBMIT as any, prompt, isAI);
    if (sub === 'NO_INPUT') {
      console.warn(`[${tag}] Không tìm thấy ô nhập prompt — reload trang`);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }

    // 4. Poll for result
    let parsed: any[] | null = null;
    const t0 = Date.now();
    let quotaHit = false;

    while (Date.now() - t0 < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const text = await page.evaluate(() => document.body.innerText).catch(() => '');

      if (/reached your quota|rate limit|try again later|you've reached/i.test(text)) {
        console.warn(`[${tag}] ⚠️ HẾT QUOTA TRÌNH DUYỆT — Dừng worker này.`);
        quotaHit = true;
        break;
      }

      parsed = findResultJSON(text);
      if (parsed) break;
    }

    if (quotaHit) {
      break; // Exit loop
    }

    if (!parsed) {
      console.warn(`[${tag}] Quá thời gian chờ AI phản hồi (Timeout) — reload trang`);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }

    // 5. Save results back
    try {
      const saveRes = await fetch(`${baseUrl}/api/bot/grammar/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${botSecret}`,
        },
        body: JSON.stringify({
          lessonId: lesson.lessonId,
          exercises: parsed,
        }),
      });
      const saveResultData = await saveRes.json();
      if (saveResultData.success) {
        saved++;
        console.log(`[${tag}] Saved ${saveResultData.added} exercises for "${lesson.slug}". Total: ${saveResultData.total}/100.`);
      } else {
        console.error(`[${tag}] Lưu database thất bại:`, saveResultData.error);
      }
    } catch (saveErr: any) {
      console.error(`[${tag}] Lỗi kết nối database khi lưu:`, saveErr.message);
    }

    // Reload tab to clear AI Studio session chat context
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));
  }

  return saved;
}

async function main() {
  const ports = PORTS.length ? PORTS : ['9222'];

  // Gom MỌI tab aistudio/gemini từ mọi port (mỗi /u/N/ = 1 nick = 1 worker)
  const tabs: { page: any; isAI: boolean; tag: string }[] = [];
  for (const port of ports) {
    let browser;
    try {
      browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null });
    } catch (e: any) {
      console.error(`❌ Không kết nối được Chrome qua port ${port}: ${e.message}`);
      continue;
    }
    const matched = (await browser.pages()).filter((p) => /aistudio\.google|gemini\.google/.test(p.url()));
    for (const p of matched) {
      const u = p.url();
      const acc = (u.match(/\/u\/(\d+)\//) || [])[1] ?? '?';
      tabs.push({ page: p, isAI: /aistudio/.test(u), tag: `u${acc}` });
    }
  }

  console.log(`📊 Tìm thấy ${tabs.length} tabs AI Studio/Gemini đang mở.`);
  if (DRY) {
    tabs.forEach((t) => console.log(`   tab ${t.tag} (${t.isAI ? 'aistudio' : 'gemini'})`));
    console.log('[DRY RUN] Thoát.');
    return;
  }
  if (tabs.length === 0) {
    console.error('❌ Không thấy tab aistudio/gemini nào. Hãy chạy launch-chrome-grammar-bots.cmd trước và mở chat.');
    return;
  }

  // Chạy các worker song song lái các tab
  const results = await Promise.all(
    tabs.map((t, i) =>
      driveTab(t.page, t.isAI, i, tabs.length, t.tag).catch((e) => {
        console.error(`[${t.tag}] Gặp lỗi nghiêm trọng:`, e.message);
        return 0;
      })
    )
  );

  console.log(`\n🏁 Hoàn tất! Đã lưu thành công ${results.reduce((a, b) => a + b, 0)} đợt bài học.`);
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
