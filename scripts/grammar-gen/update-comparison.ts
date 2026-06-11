/**
 * Deepen `sections.comparison` (so sánh với cấu trúc dễ nhầm) cho các chủ đề confusable —
 * adapt sang giọng golden VN từ nguồn chuẩn (Murphy/Cambridge/British Council) qua NotebookLM
 * (docs/grammar-research/03-deep-def-contrast.md). Có minimal pair.
 *
 * Surgical: chỉ set sections.comparison; KHÔNG đụng examples/exercises/progress.
 * Ghi cả out/<slug>.json (source) và prod DB.
 *
 * Chạy (web-app/): npx tsx scripts/grammar-gen/update-comparison.ts [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const DRY = process.argv.includes('--dry');

const COMPARISON: Record<string, string> = {
  'present-simple':
    '**Hiện tại đơn vs Hiện tại tiếp diễn:** Đơn = sự thật / thói quen, mang tính lâu dài (*Water boils at 100°C* — chân lý). Tiếp diễn = tạm thời, đang diễn ra quanh lúc nói (*The water is boiling — be careful!* — ngay lúc này).',
  'present-continuous':
    '**Hiện tại tiếp diễn vs Hiện tại đơn:** Tiếp diễn = tình huống TẠM THỜI (*I\'m living with friends until I find my own place* — ở tạm). Đơn = tình huống LÂU DÀI / cố định (*My parents live in London. They have lived there all their lives.* — ổn định).',
  'present-perfect':
    '**Hiện tại hoàn thành vs Quá khứ đơn:** HTHT = khoảng thời gian CHƯA kết thúc, kéo dài tới hiện tại, KHÔNG đi với mốc thời gian rõ (*Tom has lost his key* — giờ vẫn chưa thấy). QKĐ = thời điểm ĐÃ kết thúc, có mốc cụ thể (*Tom lost his key yesterday* — chuyện hôm qua, xong rồi).',
  'past-simple':
    '**Quá khứ đơn vs Quá khứ tiếp diễn:** Đơn = hành động ĐÃ hoàn tất (*We drove home* — về tới nơi). Tiếp diễn = đang GIỮA CHỪNG hành động (*We were driving home* — đang trên đường).',
  'past-continuous':
    '**Quá khứ tiếp diễn vs Quá khứ đơn (hành động cắt ngang):** Tiếp diễn = bối cảnh dài đang diễn ra (*We were having dinner* — đang ăn tối). Đơn = hành động ngắn XEN VÀO cắt ngang (*Matt phoned while we were having dinner* — chuông gọi xen vào).',
  'present-perfect-continuous':
    '**HTHT tiếp diễn vs HTHT đơn:** Tiếp diễn nhấn vào QUÁ TRÌNH kéo dài bao lâu (*I\'ve been reading all afternoon* — suốt cả chiều). Đơn nhấn vào KẾT QUẢ đã xong bao nhiêu (*I\'ve read 200 pages* — được 200 trang).',
  'future-will':
    '**Will vs Be going to:** Will = quyết định BỘT PHÁT ngay lúc nói (*I\'ll turn on the light* — vừa nghĩ ra). Be going to = dự định đã có TRƯỚC khi nói (*I\'m going to clean my shoes* — đã định từ trước).',
  'be-going-to':
    '**Be going to vs Hiện tại tiếp diễn (nói về tương lai):** Going to = DỰ ĐỊNH / ý định, chưa chắc đã sắp xếp (*We\'re going to have a party* — định tổ chức). Tiếp diễn = lịch đã SẮP XẾP cố định với người khác (*We\'re having a party next week* — đã chốt, mời khách rồi).',
  'conditionals-0-1':
    '**Điều kiện loại 1 vs loại 0:** Loại 1 = khả năng CỤ THỂ trong tương lai (*If you are late, I will be angry* — có thể xảy ra). Loại 0 = chân lý / quy luật luôn đúng, không dùng will (*If you mix blue and yellow, you get green* — sự thật).',
  'second-conditional':
    '**Điều kiện loại 2 vs loại 1:** Loại 2 = giả định KHÔNG có thật ở hiện tại / tương lai (*If Jack was playing, they would win* — Jack không chơi). Loại 1 = khả năng CÓ THẬT (*If you are late, I will be angry* — có thể xảy ra).',
  'third-conditional':
    '**Điều kiện loại 3 vs loại 2:** Loại 3 = giả định trái với QUÁ KHỨ, không thể đổi (*If you had seen him, you could have spoken to him* — nhưng đã không gặp). Loại 2 = giả định trái với HIỆN TẠI / tương lai (*If I had his address, I could write to him* — giờ không có địa chỉ).',
  'passive-voice':
    '**Câu bị động vs chủ động:** Chủ động nhấn vào AI làm (*Somebody built this house in 1981*). Bị động nhấn vào ĐIỀU GÌ xảy ra với chủ thể, khi tác nhân không rõ / không quan trọng (*This house was built in 1981*).',
  'relative-clauses':
    '**Mệnh đề quan hệ xác định vs không xác định:** Xác định = thông tin THIẾT YẾU để hiểu danh từ, KHÔNG dấu phẩy (*The woman who called is my aunt* — bỏ đi thì không rõ ai). Không xác định = thông tin THÊM, đặt giữa dấu phẩy, bỏ vẫn hiểu (*My aunt, who called yesterday, is a doctor*).',
  'reported-speech':
    '**Câu tường thuật vs trực tiếp:** Trực tiếp = trích NGUYÊN VĂN, giữ thì gốc (*He said "I have to go"*). Tường thuật = thuật lại, LÙI THÌ về quá khứ khi không còn đúng ở hiện tại (*He said he had to go*).',
  'gerunds-infinitives':
    '**Danh động từ vs nguyên mẫu (đổi nghĩa):** Vài động từ đổi nghĩa theo dạng đi sau. *remember + V-ing* = nhớ việc ĐÃ làm (*I remember locking the door* — đã khóa, giờ nhớ lại). *remember + to V* = nhớ ĐỂ làm (*I remembered to lock the door* — nhớ mà đi khóa).',
  'used-to':
    '**Used to do vs Be used to doing:** *used to do* = thói quen QUÁ KHỨ nay không còn (*I used to drive to work* — trước hay lái, giờ thì không). *be / get used to doing* = đã QUEN, không còn lạ lẫm ở hiện tại (*She is used to driving on the left* — quen rồi).',
};

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

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let okFile = 0, okDb = 0, miss = 0;
  for (const [slug, comparison] of Object.entries(COMPARISON)) {
    // 1) out json (source)
    const fp = path.join(OUT, `${slug}.json`);
    if (existsSync(fp)) {
      const j = JSON.parse(readFileSync(fp, 'utf8'));
      j.sections = j.sections || {};
      j.sections.comparison = comparison;
      if (!DRY) writeFileSync(fp, JSON.stringify(j, null, 2) + '\n', 'utf8');
      okFile++;
    }
    // 2) prod DB
    const { data: topic } = await sb.from('grammar_topics').select('id').eq('slug', slug).maybeSingle();
    if (!topic) { console.log(`  ⚠ ${slug}: không thấy topic DB`); miss++; continue; }
    const { data: lessons } = await sb.from('grammar_lessons').select('id, sections').eq('topic_id', topic.id);
    for (const l of lessons ?? []) {
      const sections = { ...(l.sections || {}), comparison };
      if (DRY) { console.log(`  · ${slug} (dry)`); continue; }
      const { error } = await sb.from('grammar_lessons').update({ sections }).eq('id', l.id);
      if (error) { console.log(`  ✗ ${slug}: ${error.message}`); continue; }
      okDb++; console.log(`  ✓ ${slug}`);
    }
  }
  console.log(`\n[comparison] ${okFile} out json · ${okDb} lesson DB · ${miss} thiếu.`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
