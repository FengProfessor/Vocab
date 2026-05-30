/**
 * Import từ vựng từ file Word (.docx) vào global_dictionary.
 * Sử dụng helper Python `docx_parser.py` để đọc văn bản và bảng biểu.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/import-word-vocab.ts --file=../vocab-doc.docx [--mapping="word:0,pos:1,ipa:2,def:3,example:4"] [--tags=tag1,tag2] [--dry-run] [--images] [--enrich]
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { normalizeToGlobalDict, isUsable, RawEntry } from './core/normalizer';
import { resolveWordImage } from '../../src/lib/image-pipeline';
import { enrichWord } from '../../src/lib/ai-enrich';
import { mergeTags } from '../../src/lib/bot-utils';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

interface DocxData {
  paragraphs: string[];
  tables: string[][][];
  error?: string;
}

/** Gọi helper Python để parse file docx sang JSON */
function parseDocxFile(filePath: string): DocxData {
  const pythonScript = path.resolve(process.cwd(), 'scripts/scrapers/core/docx_parser.py');
  
  // Xác định python interpreter
  let pythonPath = path.resolve(process.cwd(), '../venv/Scripts/python.exe');
  if (!fs.existsSync(pythonPath)) {
    // Thử fallback trên Unix/Mac
    pythonPath = path.resolve(process.cwd(), '../venv/bin/python');
  }
  if (!fs.existsSync(pythonPath)) {
    // Fallback hệ thống
    pythonPath = 'python';
  }

  console.log(`[Word] Đang đọc file: ${filePath}`);
  console.log(`[Word] Dùng Python: ${pythonPath}`);
  
  try {
    const stdout = execSync(`"${pythonPath}" "${pythonScript}" "${filePath}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });
    const parsed = JSON.parse(stdout) as DocxData;
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  } catch (e) {
    console.error(`[Word] Lỗi chạy parser Python:`, (e as Error).message);
    throw e;
  }
}

/** Phân tích cấu hình mapping cột */
function parseMapping(mappingStr?: string) {
  const mapping = {
    word: 0,
    pos: 1,
    ipa: 2,
    def: 3,
    example: 4,
  };

  if (!mappingStr) return mapping;

  const parts = mappingStr.split(',');
  for (const part of parts) {
    const [key, val] = part.split(':');
    const idx = parseInt(val, 10);
    if (key && !isNaN(idx)) {
      if (key === 'word') mapping.word = idx;
      if (key === 'pos') mapping.pos = idx;
      if (key === 'ipa') mapping.ipa = idx;
      if (key === 'def') mapping.def = idx;
      if (key === 'example') mapping.example = idx;
    }
  }

  return mapping;
}

/** Kiểm tra xem hàng đó có phải tiêu đề bảng (header) không */
function isHeaderRow(row: string[]): boolean {
  const headerKeywords = ['word', 'từ vựng', 'từ gốc', 'definition', 'định nghĩa', 'nghĩa', 'pos', 'từ loại', 'ipa', 'phiên âm'];
  return row.some((cell) =>
    headerKeywords.some((keyword) => cell.toLowerCase().trim().includes(keyword))
  );
}

async function main(): Promise<void> {
  const fileArg = getArg('file');
  if (!fileArg) {
    console.error('Thiếu tham số bắt buộc --file=<đường dẫn file Word>');
    process.exit(1);
  }

  const filePath = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`Không tìm thấy file: ${filePath}`);
    process.exit(1);
  }

  const mappingStr = getArg('mapping');
  const mapping = parseMapping(mappingStr);
  console.log(`[Word] Mapping cột:`, mapping);

  const tagsArg = getArg('tags') || 'word-import';
  const tags = tagsArg.split(',').map((t) => t.trim()).filter(Boolean);

  const dryRun = hasFlag('dry-run');
  const withImages = hasFlag('images');
  const doEnrich = hasFlag('enrich');

  if (dryRun) console.log('[Word] CHẾ ĐỘ CHẠY THỬ (DRY-RUN) — Không ghi database');

  // Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. Đọc docx
  const docxData = parseDocxFile(filePath);
  
  // 2. Trích xuất từ vựng từ tables
  const rawEntries: RawEntry[] = [];
  let tableCount = 0;
  
  for (const table of docxData.tables) {
    tableCount++;
    console.log(`[Word] Đang quét bảng số ${tableCount} (${table.length} dòng)...`);
    
    let skipHeader = true;
    for (let r = 0; r < table.length; r++) {
      const row = table[r];
      
      // Bỏ qua dòng rỗng hoặc quá ít cột
      if (row.length === 0 || row.join('').trim().length === 0) continue;
      
      // Kiểm tra dòng đầu có phải tiêu đề không
      if (r === 0 && isHeaderRow(row)) {
        console.log(`  -> Bỏ qua dòng tiêu đề: [${row.join(' | ')}]`);
        continue;
      }
      
      const word = row[mapping.word]?.trim();
      const definition = row[mapping.def]?.trim();
      
      if (!word || !definition) {
        continue; // Bỏ qua nếu thiếu từ hoặc nghĩa chính
      }

      const ipa = row[mapping.ipa]?.trim() || '';
      const pos = row[mapping.pos]?.trim() || 'word';
      const example = row[mapping.example]?.trim() || '';

      rawEntries.push({
        word,
        ipa,
        meanings: [
          {
            pos,
            definition,
            example,
          },
        ],
      });
    }
  }

  console.log(`[Word] Tìm thấy ${rawEntries.length} từ từ các bảng.`);

  // Fallback: nếu không có bảng, phân tích đoạn văn
  if (rawEntries.length === 0 && docxData.paragraphs.length > 0) {
    console.log(`[Word] Không tìm thấy từ dạng bảng. Thử quét danh sách đoạn văn (${docxData.paragraphs.length} dòng)...`);
    for (const p of docxData.paragraphs) {
      // Ví dụ định dạng: "apple (n) /'æpl/: quả táo - Ex: I eat an apple"
      // Phân tách cơ bản bằng dấu gạch ngang hoặc dấu hai chấm
      const parts = p.split(/[-–—:]+/);
      if (parts.length >= 2) {
        const wordPart = parts[0].trim();
        const defPart = parts.slice(1).join('-').trim();
        
        // Trích xuất từ loại hoặc phiên âm nếu có trong dấu ngoặc
        let word = wordPart;
        let pos = 'word';
        let ipa = '';
        
        const posMatch = wordPart.match(/\(([^)]+)\)/);
        if (posMatch) {
          pos = posMatch[1].trim();
          word = word.replace(/\([^)]+\)/, '').trim();
        }
        
        const ipaMatch = wordPart.match(/\/([^/]+)\//);
        if (ipaMatch) {
          ipa = ipaMatch[1].trim();
          word = word.replace(/\/([^/]+)\//, '').trim();
        }

        word = word.trim();
        if (word && defPart) {
          rawEntries.push({
            word,
            ipa,
            meanings: [
              {
                pos,
                definition: defPart,
              },
            ],
          });
        }
      }
    }
    console.log(`[Word] Tìm thấy ${rawEntries.length} từ từ đoạn văn.`);
  }

  if (rawEntries.length === 0) {
    console.log('[Word] Không tìm thấy dữ liệu từ vựng hợp lệ.');
    process.exit(0);
  }

  // 3. Import từng từ
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rawEntries.length; i++) {
    const raw = rawEntries[i];
    const word = raw.word.trim().toLowerCase();
    
    try {
      const { word: normWord, data } = normalizeToGlobalDict(raw);
      if (!isUsable(data)) {
        console.warn(`  ✗ [${i+1}/${rawEntries.length}] Bỏ qua "${word}": thiếu nghĩa sau chuẩn hóa`);
        failed++;
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY] Trích xuất thành công: "${normWord}" (${data.results[0].meanings[0].pos}) | Nghĩa: "${data.results[0].meanings[0].definition}"`);
        saved++;
        continue;
      }

      const meanings = data.results[0].meanings;
      const primary = meanings[0];

      // AI Enrichment (tùy chọn)
      let imageSearchQuery = '';
      if (doEnrich) {
        try {
          const enriched = await enrichWord(normWord, process.env.GEMINI_API_KEY, data, primary.definition);
          imageSearchQuery = enriched.image_search_query || '';
          const dataExt = data as unknown as Record<string, unknown>;
          dataExt.synonyms = enriched.synonyms;
          dataExt.antonyms = enriched.antonyms;
          dataExt.image_search_query = imageSearchQuery;
        } catch (e) {
          console.warn(`    [enrich] bỏ qua bổ khuyết cho "${normWord}":`, (e as Error).message);
        }
      }

      // Gắn ảnh minh họa (tùy chọn)
      let img = { url: '', source: 'none', confidence: 0 as number | null, query: '' };
      if (withImages) {
        try {
          img = await resolveWordImage({
            word: normWord,
            pos: primary.pos,
            definition: primary.definition,
            imageSearchQuery,
            meaningCount: meanings.length,
          });
        } catch (e) {
          console.warn(`    [images] bỏ qua ảnh cho "${normWord}":`, (e as Error).message);
        }
      }

      // Kiểm tra trùng
      const { data: existing } = await supabase
        .from('global_dictionary')
        .select('word, tags, image_url, image_source')
        .eq('word', normWord)
        .maybeSingle();

      if (existing) {
        const patch: Record<string, unknown> = {
          tags: mergeTags(existing.tags || [], tags),
        };
        // Cập nhật ảnh nếu chưa có ảnh hoặc ảnh cũ rỗng
        if (withImages && (!existing.image_url || existing.image_source === 'none') && img.url) {
          patch.image_url = img.url;
          patch.image_source = img.source;
          patch.image_confidence = img.confidence;
          patch.image_query = img.query;
          patch.image_verified_at = new Date().toISOString();
        }
        const { error } = await supabase.from('global_dictionary').update(patch).eq('word', normWord);
        if (error) throw error;
        console.log(`  ~ [${i+1}/${rawEntries.length}] Cập nhật tags/ảnh: "${normWord}"`);
        skipped++;
      } else {
        const { error } = await supabase.from('global_dictionary').insert({
          word: normWord,
          tags,
          data,
          image_url: img.url || null,
          image_source: img.source || 'none',
          image_confidence: img.confidence || null,
          image_query: img.query || null,
          image_verified_at: img.url ? new Date().toISOString() : null,
        });
        if (error) throw error;
        console.log(`  ✓ [${i+1}/${rawEntries.length}] Thêm mới: "${normWord}"`);
        saved++;
      }
    } catch (e) {
      console.error(`  ✗ [${i+1}/${rawEntries.length}] Lỗi xử lý "${word}":`, (e as Error).message);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Hoàn tất: Lưu mới ${saved} từ, Cập nhật ${skipped} từ, Thất bại ${failed} từ.`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
