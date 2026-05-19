/**
 * Import sách ngữ pháp dạng PDF (vd "Ngữ pháp tiếng Anh - Mai Lan Hương").
 * Trích text bằng pdfjs-dist, chia thành chunk theo trang, gửi từng chunk cho
 * Gemini cấu trúc hóa — tránh vượt context và dễ kiểm soát.
 *
 * LƯU Ý: chỉ xử lý PDF dạng text. PDF bản scan (ảnh) sẽ trích ra text rỗng —
 * cần OCR riêng (tham khảo api/import/ocr).
 */
import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { structureGrammarText } from '../core/grammar-ai';
import type { GrammarLessonDraft } from '../core/grammar-types';

async function extractPages(pdfPath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data, isEvalSupported: false }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ('str' in it ? (it as { str: string }).str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(text);
  }
  return pages;
}

/**
 * Đọc PDF, chia thành chunk `chunkSize` trang, gửi từng chunk cho Gemini.
 * Trả mảng bài học grammar.
 */
export async function importPdf(pdfPath: string, chunkSize = 15): Promise<GrammarLessonDraft[]> {
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF không tồn tại: ${pdfPath}`);

  const pages = await extractPages(pdfPath);
  console.log(`[PDF] ${pages.length} trang, chunk ${chunkSize} trang/lần`);

  const drafts: GrammarLessonDraft[] = [];
  for (let start = 0; start < pages.length; start += chunkSize) {
    const chunkPages = pages.slice(start, start + chunkSize);
    const text = chunkPages.join('\n').trim();
    const chunkNo = Math.floor(start / chunkSize) + 1;

    if (text.length < 200) {
      console.warn(
        `[PDF] Chunk ${chunkNo} (trang ${start + 1}-${start + chunkPages.length}) gần như rỗng — có thể là trang scan, bỏ qua.`
      );
      continue;
    }
    try {
      const lessons = await structureGrammarText(text.slice(0, 14000), 'mai-lan-huong-pdf');
      console.log(`[PDF] Chunk ${chunkNo}: ${lessons.length} bài học`);
      drafts.push(...lessons);
    } catch (e) {
      console.error(`[PDF] Chunk ${chunkNo} lỗi:`, (e as Error).message);
    }
  }
  return drafts;
}
