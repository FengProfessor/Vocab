/**
 * Cào trang web dạy ngữ pháp (British Council, Perfect English Grammar...).
 * Lấy text vùng nội dung chính rồi đưa Gemini cấu trúc hóa — không phụ thuộc
 * selector chi tiết của từng site.
 */
import * as cheerio from 'cheerio';
import { fetchUrl } from '../core/http-client';
import { structureGrammarText } from '../core/grammar-ai';
import type { GrammarLessonDraft } from '../core/grammar-types';

export async function scrapeGrammarPage(url: string): Promise<GrammarLessonDraft[]> {
  const html = await fetchUrl(url);
  if (!html || typeof html !== 'string') return [];

  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, aside, .menu, .nav, .sidebar').remove();

  const main = $('main, article, .content, #content, .field-body, .node__content').first();
  const text = (main.length ? main : $('body'))
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14000);

  if (text.length < 150) {
    console.warn('[grammar-web] Nội dung quá ngắn:', url);
    return [];
  }
  return structureGrammarText(text, 'web-scrape', url);
}
