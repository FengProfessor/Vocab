/**
 * Chuẩn hóa dữ liệu thô từ mọi scraper về shape JSONB của global_dictionary.data.
 * Shape khớp interface DictionaryData trong src/lib/supabase.ts (định nghĩa lại
 * cục bộ để module scraper độc lập, không kéo side-effect tạo Supabase client).
 */
export interface RawMeaning {
  pos?: string;
  definition?: string;
  example?: string;
  collocations?: string[];
}

export interface RawEntry {
  word: string;
  ipa?: string;
  ipaUS?: string;
  meanings: RawMeaning[];
  familyWords?: string[];
}

export interface NormMeaning {
  pos: string;
  definition: string;
  example: string;
  collocations: string[];
}

export interface NormData {
  word: string;
  pronunciations: { ipa: string; region?: 'UK' | 'US' }[];
  results: { meanings: NormMeaning[] }[];
  familyWords: string[];
}

function cleanText(s?: string): string {
  return (s || '').replace(/\s+/g, ' ').trim();
}

/** Chuẩn hóa RawEntry → { word, data } sẵn sàng upsert vào global_dictionary. */
export function normalizeToGlobalDict(raw: RawEntry): { word: string; data: NormData } {
  const seen = new Set<string>();
  const meanings: NormMeaning[] = [];

  for (const m of raw.meanings || []) {
    const definition = cleanText(m.definition);
    if (!definition) continue;

    // Dedup nghĩa trùng (cùng pos + definition)
    const key = `${cleanText(m.pos).toLowerCase()}|${definition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    meanings.push({
      pos: cleanText(m.pos),
      definition,
      example: cleanText(m.example),
      collocations: (m.collocations || []).map(cleanText).filter(Boolean),
    });
  }

  const word = raw.word.trim().toLowerCase();
  const data: NormData = {
    word,
    pronunciations: (() => {
      const uk = cleanText(raw.ipa);
      const us = cleanText(raw.ipaUS);
      if (uk && us) return [{ ipa: uk, region: 'UK' as const }, { ipa: us, region: 'US' as const }];
      if (uk) return [{ ipa: uk, region: 'UK' as const }];
      return [];
    })(),
    results: [{ meanings }],
    familyWords: [...new Set((raw.familyWords || []).map(cleanText).filter(Boolean))],
  };
  return { word, data };
}

/** Kiểm tra một NormData có đủ chất lượng để lưu không (ít nhất 1 nghĩa có definition). */
export function isUsable(data: NormData): boolean {
  return (data.results?.[0]?.meanings?.length || 0) > 0;
}
