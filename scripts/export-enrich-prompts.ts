/**
 * BƯỚC 1/3 — Xuất từ pro3m CẦN xử lý thành các file PROMPT (mẻ) để feed vào Gemini CLI.
 *
 * KHÔNG gọi AI, KHÔNG tốn quota API — chỉ đọc Supabase + ghi file.
 *
 * 2 nhóm (prompt khác nhau, ghi tiền tố file khác nhau):
 *   - new   : placeholder chưa enrich (definition === PLACEHOLDER)
 *   - phrase: cụm từ/idiom ĐANG lỗi (IPA cắt cụt / nghĩa ko-Việt / IPA rác)
 *
 * Chạy (trong web-app):
 *   npx tsx scripts/export-enrich-prompts.ts                 # mẻ 150 từ
 *   npx tsx scripts/export-enrich-prompts.ts --size=120      # đổi cỡ mẻ
 *   npx tsx scripts/export-enrich-prompts.ts --only=phrase   # chỉ xuất nhóm cụm
 *
 * Output: ../../tmp/enrich-batches/{new|phrase}-NNN.txt  +  _RUN-GUIDE.md
 * Sau đó feed từng .txt vào Gemini CLI → lưu kết quả ra <tên>.out.json
 * rồi: npx tsx scripts/import-enrich-output.ts            (xem trước)
 *      npx tsx scripts/import-enrich-output.ts --commit   (ghi DB)
 */
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// --- Load .env.local ---
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('❌ Thiếu Supabase env trong .env.local'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const getArg = (n: string) => { const p = process.argv.find(a => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : undefined; };
const SIZE = parseInt(getArg('size') || '150', 10);
const ONLY = getArg('only'); // 'new' | 'phrase' | undefined (cả hai)
const TAG = getArg('tag') || 'pro3m';

const PLACEHOLDER = '⏳ Click to enrich / Auto-enrich';
const VIET_RE = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

type Kind = 'new' | 'phrase';
interface Row { id: string; word: string; data: any; }

/** Cụm từ ≥2 chữ ĐANG lỗi (đồng bộ với reenrich-phrases.ts) */
function isBrokenPhrase(word: string, data: any): boolean {
  const wc = word.trim().split(/\s+/).filter(Boolean).length;
  if (wc < 2) return false;
  const def = (data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
  if (!def || def === PLACEHOLDER) return false; // placeholder thuộc nhóm 'new'
  const ipa = (data?.pronunciations?.[0]?.ipa || '').trim();
  const ipaTokens = ipa.split(/\s+/).filter(Boolean).length;
  const ipaShort = wc >= 3 && ipaTokens < Math.ceil(wc / 2);
  const notViet = !VIET_RE.test(def);
  const ipaJunk = /n\/a|cannot|provide|\bAI\b/i.test(ipa);
  return ipaShort || notViet || ipaJunk;
}

const OUT_KEYS = `"word" (GIỮ NGUYÊN y hệt input), "english", "vietnamese", "ipa", "pos", "example", "synonyms", "antonyms", "image_search_query"`;

function promptHeader(kind: Kind, n: number): string {
  const common = `Bạn là từ điển Anh-Việt chuyên nghiệp. Với MỖI mục trong danh sách dưới đây, sinh dữ liệu từ điển.
Trả về DUY NHẤT một JSON array gồm đúng ${n} phần tử, MỖI phần tử có các key: ${OUT_KEYS}.
KHÔNG markdown, KHÔNG \`\`\`json, KHÔNG văn bản ngoài JSON. Giữ nguyên thứ tự và field "word" y hệt input.
- "vietnamese": nghĩa tiếng Việt tự nhiên, BẮT BUỘC là tiếng Việt (không để nguyên tiếng Anh).
- "ipa": phiên âm IPA. Nếu KHÔNG chắc chắn → trả chuỗi RỖNG "". TUYỆT ĐỐI KHÔNG ghi "N/A"/"cannot"/chữ không phải IPA.
- "pos": từ loại. "example": 1 câu tiếng Anh tự nhiên. "synonyms"/"antonyms": 2-5 mục (mảng rỗng nếu không có).
- "image_search_query": 2-5 từ tiếng Anh mô tả hình ảnh trực quan cho nghĩa.`;
  if (kind === 'phrase') {
    return `${common}
LƯU Ý CỤM TỪ/IDIOM/PHRASAL VERB: dịch Ý NGHĨA cả cụm — TUYỆT ĐỐI KHÔNG dịch word-by-word, không sót từ tiếng Anh. IPA cho CẢ cụm (không lấy IPA 1 từ). "pos" = "idiom" | "phrasal verb" | "phrase".`;
  }
  return common;
}

function buildBatchFile(kind: Kind, items: Row[]): string {
  const list = items.map((r, i) => `${i + 1}. ${r.word}`).join('\n');
  return `${promptHeader(kind, items.length)}

DANH SÁCH (${items.length} mục):
${list}
`;
}

async function main() {
  console.log(`🔍 Quét global_dictionary tag "${TAG}" (paginate)...`);
  let from = 0; const size = 1000;
  const news: Row[] = [];
  const phrases: Row[] = [];
  let total = 0;

  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, data')
      .contains('tags', [TAG])
      .range(from, from + size - 1);
    if (error) { console.error('❌', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const r of data as Row[]) {
      total++;
      const def = (r.data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
      if (!def || def === PLACEHOLDER) news.push(r);
      else if (isBrokenPhrase(r.word, r.data)) phrases.push(r);
    }
    if (data.length < size) break;
    from += size;
  }

  console.log(`   → Tổng ${total} từ. Cần xử lý: ${news.length} placeholder (new) + ${phrases.length} cụm lỗi (phrase).`);

  const outDir = path.resolve(__dirname, '../../tmp/enrich-batches');
  fs.mkdirSync(outDir, { recursive: true });

  const groups: Array<{ kind: Kind; rows: Row[] }> = [];
  if (ONLY !== 'phrase') groups.push({ kind: 'new', rows: news });
  if (ONLY !== 'new') groups.push({ kind: 'phrase', rows: phrases });

  let fileCount = 0;
  const manifest: Array<{ file: string; kind: Kind; count: number }> = [];

  for (const { kind, rows } of groups) {
    for (let i = 0; i < rows.length; i += SIZE) {
      const chunk = rows.slice(i, i + SIZE);
      const seq = String(Math.floor(i / SIZE) + 1).padStart(3, '0');
      const name = `${kind}-${seq}.txt`;
      fs.writeFileSync(path.join(outDir, name), buildBatchFile(kind, chunk), 'utf8');
      manifest.push({ file: name, kind, count: chunk.length });
      fileCount++;
    }
  }

  // Hướng dẫn chạy
  const guide = `# Enrich qua Gemini CLI — ${fileCount} mẻ (cỡ ${SIZE})

new: ${news.length} từ · phrase: ${phrases.length} cụm · tổng mẻ: ${fileCount}

## Chạy từng mẻ (dán tay)
Mở file .txt, copy toàn bộ, dán vào Gemini CLI. Lưu output (JSON array) ra cùng tên + đuôi .out.json
Ví dụ: new-001.txt → new-001.out.json

## Hoặc non-interactive (nếu \`gemini\` hỗ trợ -p và đọc stdin)
PowerShell, chạy trong thư mục này:
\`\`\`powershell
Get-ChildItem *.txt | ForEach-Object {
  $out = $_.BaseName + '.out.json'
  if (Test-Path $out) { return }                 # bỏ mẻ đã chạy
  Write-Host "→ $($_.Name)"
  gemini -p (Get-Content $_.FullName -Raw) | Out-File -Encoding utf8 $out
  Start-Sleep -Seconds 2
}
\`\`\`
TEST 1 mẻ trước (new-001) xem JSON ra đúng chưa rồi mới chạy cả loạt.

## Nạp về DB
\`\`\`
cd web-app
npx tsx scripts/import-enrich-output.ts            # XEM TRƯỚC, không ghi
npx tsx scripts/import-enrich-output.ts --commit   # ghi DB (tự backup)
\`\`\`

## Mẻ
${manifest.map(m => `- ${m.file} (${m.kind}, ${m.count})`).join('\n')}
`;
  fs.writeFileSync(path.join(outDir, '_RUN-GUIDE.md'), guide, 'utf8');

  console.log(`\n📄 Đã ghi ${fileCount} mẻ + _RUN-GUIDE.md → ${outDir}`);
  console.log(`→ Đọc _RUN-GUIDE.md để biết cách feed vào Gemini CLI.`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
