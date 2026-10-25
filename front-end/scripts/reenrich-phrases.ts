/**
 * Re-enrich CỤM TỪ / IDIOM / PHRASAL VERB trong global_dictionary (tag pro3m).
 *
 * Lý do: audit cho thấy ~1,005 cụm từ bị lỗi — IPA cắt cụt (lấy IPA 1 từ),
 * nghĩa để nguyên tiếng Anh hoặc dịch word-by-word sai nghĩa idiom.
 * Script cũ (enrich_pro3m_with_groq.ts) chỉ quét placeholder nên KHÔNG đụng nhóm này.
 *
 * Cách chạy (trong web-app):
 *   npx tsx scripts/reenrich-phrases.ts                  # XEM TRƯỚC 12 cụm lỗi, KHÔNG ghi DB
 *   npx tsx scripts/reenrich-phrases.ts --limit=30       # xem trước 30
 *   npx tsx scripts/reenrich-phrases.ts --all            # xem mọi cụm (kể cả chưa gắn cờ lỗi)
 *   npx tsx scripts/reenrich-phrases.ts --commit --limit=1005   # GHI ĐÈ DB thật
 *
 * Model: tier 'smart' (Groq llama-3.3-70b / Gemini) — mạnh hơn cho ngữ nghĩa idiom.
 * GHI: chỉ cột `data` (nghĩa/IPA/synonym). Ảnh (cột image_*) giữ nguyên.
 */
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
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
if (!url || !key) { console.error('❌ Thiếu Supabase env'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const getArg = (n: string) => { const p = process.argv.find(a => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : undefined; };
const hasFlag = (n: string) => process.argv.includes(`--${n}`);
const LIMIT = parseInt(getArg('limit') || '12', 10);
const COMMIT = hasFlag('commit');
const ALL = hasFlag('all');

const PLACEHOLDER = '⏳ Click to enrich / Auto-enrich';
const VIET_RE = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

interface Row { id: string; word: string; data: any; }

function isBrokenPhrase(word: string, data: any): boolean {
  const wc = word.trim().split(/\s+/).filter(Boolean).length;
  if (wc < 2) return false; // chỉ cụm từ
  const def = (data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
  if (!def || def === PLACEHOLDER) return false; // bỏ placeholder (đã có script khác)
  if (ALL) return true;
  const ipa = (data?.pronunciations?.[0]?.ipa || '').trim();
  const ipaTokens = ipa.split(/\s+/).filter(Boolean).length;
  const ipaShort = wc >= 3 && ipaTokens < Math.ceil(wc / 2);   // IPA cắt cụt
  const notViet = !VIET_RE.test(def);                           // nghĩa nghi tiếng Anh
  const ipaJunk = /n\/a|cannot|provide|\bAI\b/i.test(ipa);      // IPA rác
  return ipaShort || notViet || ipaJunk;
}

function buildPrompt(word: string): string {
  return `You are an expert English-Vietnamese lexicographer specializing in idioms, phrasal verbs and fixed expressions.
Analyze this English phrase: "${word}".

CRITICAL RULES:
- "vietnamese": Dịch Ý NGHĨA của cả cụm sang tiếng Việt tự nhiên. Với idiom hãy cho nghĩa tương đương/giải thích ngắn — TUYỆT ĐỐI KHÔNG dịch word-by-word, KHÔNG để sót từ tiếng Anh.
- "ipa": IPA cho cả cụm. Nếu KHÔNG chắc chắn, trả về chuỗi RỖNG "". TUYỆT ĐỐI KHÔNG ghi "N/A", "cannot provide" hay bất kỳ chữ nào không phải IPA.
- "pos": loại — "idiom" | "phrasal verb" | "phrase".
- "example": MỘT câu tiếng Anh tự nhiên dùng đúng cụm này.
- "synonyms"/"antonyms": 2-4 cụm/từ tiếng Anh đồng/trái nghĩa (mảng rỗng nếu không có).
- "image_search_query": 2-5 từ tiếng Anh mô tả hình ảnh trực quan cho nghĩa cụm.

Return ONLY valid JSON, keys: english, vietnamese, ipa, pos, example, synonyms, antonyms, image_search_query. No markdown.`;
}

/** Cổng chất lượng: trả lý do nếu output MỚI không đủ tốt để ghi đè (null = OK) */
function validateNew(p: any): string | null {
  if (!p || typeof p !== 'object') return 'parse rỗng';
  const def = (p.vietnamese || '').trim();
  if (!def) return 'nghĩa rỗng';
  if (/click|enrich|⏳/i.test(def)) return 'nghĩa là marker';
  if (!VIET_RE.test(def)) return 'nghĩa không có ký tự tiếng Việt'; // chặn def để nguyên tiếng Anh
  const ipa = (p.ipa || '').trim();
  if (/n\/a|cannot|provide|\bAI\b|unknown|error|sorry/i.test(ipa)) return 'IPA rác';
  if (!(p.example || '').trim()) return 'thiếu ví dụ';
  return null;
}

async function main() {
  const { getRouter } = await import('../src/lib/ai-router');

  console.log(`🔍 Quét cụm từ ${ALL ? '(tất cả)' : '(đang gắn cờ lỗi)'} trong tag pro3m...`);
  let from = 0; const size = 1000; const broken: Row[] = [];
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary').select('id, word, data').contains('tags', ['pro3m'])
      .range(from, from + size - 1);
    if (error) { console.error('❌', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    for (const r of data as Row[]) if (isBrokenPhrase(r.word, r.data)) broken.push(r);
    if (data.length < size) break;
    from += size;
  }
  console.log(`📊 Tìm thấy ${broken.length} cụm cần sửa. Xử lý ${Math.min(LIMIT, broken.length)} cụm.`);
  console.log(COMMIT ? '⚠️  CHẾ ĐỘ COMMIT — sẽ GHI ĐÈ cột data.' : '👁️  CHẾ ĐỘ XEM TRƯỚC — KHÔNG ghi DB. Thêm --commit để ghi thật.\n');

  const router = getRouter();
  const todo = broken.slice(0, LIMIT);
  let ok = 0, fail = 0, skipped = 0;

  // LỚP CHẮN 1: backup toàn bộ data cũ TRƯỚC khi ghi → hoàn tác được nếu cần
  if (COMMIT) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.resolve(__dirname, `../../tmp/phrase-reenrich-backup-${ts}.json`);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(todo.map(t => ({ id: t.id, word: t.word, data: t.data })), null, 2), 'utf8');
    console.log(`💾 Backup ${todo.length} bản ghi cũ → ${backupPath}\n`);
  }

  for (let i = 0; i < todo.length; i++) {
    const { id, word, data } = todo[i];
    const oldIpa = (data?.pronunciations?.[0]?.ipa || '').trim();
    const oldDef = (data?.results?.[0]?.meanings?.[0]?.definition || '').trim();

    let parsed: any;
    try {
      let raw = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        try { raw = await router.generate(buildPrompt(word), 'smart', true); break; }
        catch (e: any) {
          const rl = /429|quota|cooldown|RESOURCE_EXHAUSTED|No keys/i.test(e.message || '');
          if (rl && attempt < 2) { console.warn(`   ⏳ rate limit, chờ 60s...`); await new Promise(r => setTimeout(r, 60000)); }
          else throw e;
        }
      }
      try { parsed = JSON.parse(raw.trim()); }
      catch { const m = raw.match(/\{[\s\S]*\}/); if (!m) throw new Error('không parse được JSON'); parsed = JSON.parse(m[0]); }
    } catch (e: any) {
      fail++; console.error(`✗ [${i + 1}/${todo.length}] "${word}": ${e.message}`); continue;
    }

    const invalidReason = validateNew(parsed);

    // In before/after
    console.log(`[${i + 1}/${todo.length}] "${word}"  (${parsed.pos || '?'})${invalidReason ? `  ⚠️ BỎ QUA (${invalidReason}) — giữ data cũ` : ''}`);
    console.log(`   IPA  : ${oldIpa || '∅'}  →  ${parsed.ipa || '∅'}`);
    console.log(`   Nghĩa: ${oldDef}`);
    console.log(`        → ${parsed.vietnamese}`);
    console.log(`   Ví dụ: ${parsed.example || ''}`);
    console.log(`   Syn  : ${(parsed.synonyms || []).join(', ') || '—'}\n`);

    // LỚP CHẮN 2: output mới phải qua cổng chất lượng mới được ghi
    if (invalidReason) { skipped++; continue; }

    if (COMMIT) {
      // Chuẩn hóa IPA: bóc mọi slash thừa rồi bọc đúng 1 cặp /.../ cho khớp dữ liệu cũ
      const bareIpa = (parsed.ipa || '').trim().replace(/^\/+|\/+$/g, '').trim();
      const cleanIpa = bareIpa ? `/${bareIpa}/` : '';
      const enriched = {
        word: parsed.english || word,
        pronunciations: cleanIpa ? [{ ipa: cleanIpa }] : [],
        results: [{ meanings: [{ pos: parsed.pos || '', definition: parsed.vietnamese || '', example: parsed.example || '', collocations: [] }] }],
        synonyms: parsed.synonyms || [],
        antonyms: parsed.antonyms || [],
        image_search_query: parsed.image_search_query || '',
      };
      const { error } = await supabase.from('global_dictionary').update({ data: enriched }).eq('id', id);
      if (error) { fail++; console.error(`   ✗ ghi DB lỗi: ${error.message}`); continue; }
    }
    ok++;
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n🏁 Xong: ${ok} ${COMMIT ? 'đã ghi' : 'xem trước OK'}, ${skipped} bỏ qua (giữ data cũ), ${fail} lỗi. Tổng cần sửa: ${broken.length}.`);
  if (!COMMIT) console.log('→ Ưng thì chạy lại với:  --commit --limit=' + broken.length);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
