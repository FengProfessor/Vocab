/**
 * Trích xuất từ vựng từ PDF (hoặc file JSON OCR chứa mảng văn bản trang) bằng Gemini.
 * Sau đó chuẩn hóa và đẩy vào global_dictionary.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/import-pdf-vocab.ts --source=pdf --pdf=../path-to-book.pdf [--start-page=10] [--end-page=20] [--chunk-size=5] [--tags=tag1,tag2] [--dry-run] [--images]
 *   npx tsx scripts/scrapers/import-pdf-vocab.ts --source=json --ocr-file=../grammar_ocr.json --start-page=10 --end-page=20 [--chunk-size=5]
 */
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { getRouter } from '../../src/lib/ai-router';
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

/** Trích xuất text từ các trang PDF */
async function extractPdfPages(pdfPath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data, isEvalSupported: false }).promise;
  const pages: string[] = [];

  console.log(`[PDF-OCR] Đang đọc PDF: ${pdfPath} (${doc.numPages} trang)`);
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push(text);
    } catch (e) {
      console.warn(`[PDF-OCR] Lỗi trích xuất trang ${i}:`, (e as Error).message);
      pages.push(''); // Thêm trang trống để giữ chỉ số trang khớp
    }
  }
  return pages;
}

/** Gọi Gemini để bóc tách từ vựng từ đoạn văn bản */
async function extractVocabFromText(text: string): Promise<RawEntry[]> {
  const router = getRouter();
  const prompt = `You are a professional dictionary builder. Extract all English vocabulary words, phrases, phrasal verbs, or idioms from the textbook text below.
Ignore general conversation, exercises, explanations, or grammar theory, and focus solely on the English keywords/vocabulary lists being taught or explained.

Text segment:
"""
${text}
"""

Return ONLY a valid JSON array of objects with the exact structure below. Do not wrap in markdown block, do not write comments. Just the raw JSON array.
[
  {
    "word": "lowercase base form of the word or phrase",
    "ipa": "/IPA pronunciation here/",
    "meanings": [
      {
        "pos": "part of speech (translated to Vietnamese if possible, e.g., Danh từ, Động từ, Tính từ, Trạng từ, Cụm từ, Giới từ)",
        "definition": "clear and concise Vietnamese meaning/translation",
        "example": "one natural English example sentence demonstrating the word",
        "collocations": ["common collocation 1", "common collocation 2"]
      }
    ],
    "familyWords": ["related-word (part of speech)"]
  }
]
Important: Clean up any OCR typos, bad line-breaks, or garbage characters. Produce a high quality, clean vocabulary database.`;

  try {
    const rawText = await router.generate(prompt, 'smart', true);
    let parsed: any[];
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Không thể tìm thấy cấu trúc JSON Array từ AI');
      parsed = JSON.parse(match[0]);
    }
    
    if (!Array.isArray(parsed)) return [];
    
    // Convert to RawEntry format
    return parsed.map((item: any) => ({
      word: String(item.word || '').trim().toLowerCase(),
      ipa: String(item.ipa || '').trim(),
      meanings: Array.isArray(item.meanings)
        ? item.meanings.map((m: any) => ({
            pos: String(m.pos || 'word').trim(),
            definition: String(m.definition || '').trim(),
            example: String(m.example || '').trim(),
            collocations: Array.isArray(m.collocations) ? m.collocations.map(String) : [],
          }))
        : [],
      familyWords: Array.isArray(item.familyWords) ? item.familyWords.map(String) : [],
    }));
  } catch (e) {
    console.error(`[AI-Extract] Lỗi trích xuất từ vựng từ Gemini:`, (e as Error).message);
    return [];
  }
}

async function main(): Promise<void> {
  const source = getArg('source');
  if (source !== 'pdf' && source !== 'json') {
    console.error('Thiếu/Sai tham số --source. Hỗ trợ: pdf | json');
    process.exit(1);
  }

  let pages: string[] = [];

  if (source === 'pdf') {
    const pdfArg = getArg('pdf');
    if (!pdfArg) {
      console.error('Với --source=pdf, cần cung cấp --pdf=<đường dẫn file>');
      process.exit(1);
    }
    const pdfPath = path.isAbsolute(pdfArg) ? pdfArg : path.resolve(process.cwd(), pdfArg);
    if (!fs.existsSync(pdfPath)) {
      console.error(`Không tìm thấy file PDF: ${pdfPath}`);
      process.exit(1);
    }
    pages = await extractPdfPages(pdfPath);
  } else {
    const ocrFileArg = getArg('ocr-file');
    if (!ocrFileArg) {
      console.error('Với --source=json, cần cung cấp --ocr-file=<đường dẫn file JSON OCR>');
      process.exit(1);
    }
    const jsonPath = path.isAbsolute(ocrFileArg) ? ocrFileArg : path.resolve(process.cwd(), ocrFileArg);
    if (!fs.existsSync(jsonPath)) {
      console.error(`Không tìm thấy file JSON: ${jsonPath}`);
      process.exit(1);
    }
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    pages = Array.isArray(rawData) ? rawData.filter((p) => typeof p === 'string') : [];
    console.log(`[JSON-OCR] Đọc thành công ${pages.length} trang từ file JSON.`);
  }

  const startPage = parseInt(getArg('start-page') || '1', 10);
  const endPage = parseInt(getArg('end-page') || String(pages.length), 10);
  const chunkSize = parseInt(getArg('chunk-size') || '5', 10);
  const tagsArg = getArg('tags') || 'pdf-import';
  const tags = tagsArg.split(',').map((t) => t.trim()).filter(Boolean);

  const dryRun = hasFlag('dry-run');
  const withImages = hasFlag('images');
  const doEnrich = hasFlag('enrich');

  // Điều chỉnh index cho mảng (0-indexed)
  const startIdx = Math.max(0, startPage - 1);
  const endIdx = Math.min(pages.length - 1, endPage - 1);

  console.log(`[PDF-OCR] Phạm vi xử lý: Trang ${startPage} -> ${endPage} (Tổng cộng ${endIdx - startIdx + 1} trang)`);
  console.log(`[PDF-OCR] Kích thước chunk: ${chunkSize} trang/lần xử lý`);

  if (dryRun) console.log('[PDF-OCR] CHẾ ĐỘ CHẠY THỬ (DRY-RUN) — Không ghi database');

  // Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Xử lý theo từng chunk
  let savedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (let idx = startIdx; idx <= endIdx; idx += chunkSize) {
    const chunkEnd = Math.min(idx + chunkSize - 1, endIdx);
    const chunkPages = pages.slice(idx, chunkEnd + 1);
    const combinedText = chunkPages.join('\n').trim();
    const chunkNo = Math.floor((idx - startIdx) / chunkSize) + 1;

    console.log(`\n--- Bắt đầu xử lý Chunk #${chunkNo} (Trang ${idx + 1} -> ${chunkEnd + 1}) ---`);
    if (combinedText.length < 100) {
      console.log(`[PDF-OCR] Văn bản quá ngắn (${combinedText.length} kí tự), bỏ qua chunk này.`);
      continue;
    }

    console.log(`[PDF-OCR] Đang gọi Gemini trích xuất từ vựng từ chunk này...`);
    const rawEntries = await extractVocabFromText(combinedText);
    console.log(`[PDF-OCR] Tìm thấy ${rawEntries.length} từ vựng từ Gemini.`);

    for (const raw of rawEntries) {
      try {
        const { word: normWord, data } = normalizeToGlobalDict(raw);
        if (!isUsable(data)) {
          console.warn(`  ✗ Bỏ qua "${raw.word}": dữ liệu không đủ điều kiện`);
          failedCount++;
          continue;
        }

        if (dryRun) {
          console.log(`  [DRY] Trích xuất: "${normWord}" (${data.results[0].meanings[0].pos}) | Nghĩa: "${data.results[0].meanings[0].definition}"`);
          savedCount++;
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
        let existing = null;
        let hasImageColumns = true;

        const { data: extData, error: extErr } = await supabase
          .from('global_dictionary')
          .select('word, tags, image_url, image_source')
          .eq('word', normWord)
          .maybeSingle();

        if (extErr) {
          // Fallback: image columns missing
          hasImageColumns = false;
          const { data: fallbackData } = await supabase
            .from('global_dictionary')
            .select('word, tags')
            .eq('word', normWord)
            .maybeSingle();
          existing = fallbackData;
        } else {
          existing = extData;
        }

        if (existing) {
          const patch: Record<string, unknown> = {
            tags: mergeTags(existing.tags || [], tags),
          };
          if (hasImageColumns && withImages && (!existing.image_url || existing.image_source === 'none') && img.url) {
            patch.image_url = img.url;
            patch.image_source = img.source;
            patch.image_confidence = img.confidence;
            patch.image_query = img.query;
            patch.image_verified_at = new Date().toISOString();
          }
          const { error } = await supabase.from('global_dictionary').update(patch).eq('word', normWord);
          if (error) throw error;
          console.log(`  ~ Cập nhật tags/ảnh: "${normWord}"`);
          updatedCount++;
        } else {
          const insertPayload: Record<string, any> = {
            word: normWord,
            tags,
            data,
          };
          if (hasImageColumns && img.url) {
            insertPayload.image_url = img.url;
            insertPayload.image_source = img.source || 'none';
            insertPayload.image_confidence = img.confidence || null;
            insertPayload.image_query = img.query || null;
            insertPayload.image_verified_at = new Date().toISOString();
          }
          const { error } = await supabase.from('global_dictionary').insert(insertPayload);
          if (error) throw error;
          console.log(`  ✓ Thêm mới: "${normWord}"`);
          savedCount++;
        }
      } catch (e) {
        console.error(`  ✗ Lỗi xử lý "${raw.word}":`, (e as Error).message);
        failedCount++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Hoàn tất: Lưu mới ${savedCount} từ, Cập nhật ${updatedCount} từ, Thất bại ${failedCount} từ.`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
