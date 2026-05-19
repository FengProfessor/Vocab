/**
 * Adapter cào Oxford Learner's Dictionaries (oxfordlearnersdictionaries.com).
 * LƯU Ý: selector HTML có thể đổi — verify khi chạy thật, sửa cục bộ file này.
 */
import * as cheerio from 'cheerio';
import { fetchUrl } from '../core/http-client';
import type { RawEntry, RawMeaning } from '../core/normalizer';

const BASE = 'https://www.oxfordlearnersdictionaries.com/definition/english';

export async function scrapeWord(word: string): Promise<RawEntry | null> {
  const slug = word.trim().toLowerCase().replace(/\s+/g, '-');
  const html = await fetchUrl(`${BASE}/${encodeURIComponent(slug)}`);
  if (!html || typeof html !== 'string') return null;

  const $ = cheerio.load(html);
  const entry = $('.entry').first();
  if (!entry.length) return null;

  const ipa =
    entry.find('.phons_br .phon').first().text().trim() ||
    entry.find('.phon').first().text().trim();
  const pos = entry.find('.pos').first().text().trim();

  const meanings: RawMeaning[] = [];
  entry.find('.sense').each((_, el) => {
    const sense = $(el);
    const definition = sense.find('.def').first().text().trim();
    if (!definition) return;
    const example = sense.find('.examples .x').first().text().trim();
    const collocations: string[] = [];
    sense.find('.collocations .cf, .cf').each((__, c) => {
      const t = $(c).text().trim();
      if (t) collocations.push(t);
    });
    meanings.push({ pos, definition, example, collocations });
  });

  if (!meanings.length) return null;

  const familyWords: string[] = [];
  $('#wordfamily a, .wordfamily a').each((_, a) => {
    const t = $(a).text().trim();
    if (t) familyWords.push(t);
  });

  return { word, ipa, meanings, familyWords };
}
