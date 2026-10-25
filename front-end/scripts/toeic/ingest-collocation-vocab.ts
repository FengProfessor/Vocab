/**
 * Ingestion Script for DauTOEIC 8,504 Vocabulary Items & 10,075 Collocations.
 *
 * Responsibilities:
 * 1. Reads scripts/dautoeic/data/vocabulary_words.json (8,504 items).
 * 2. Rewrites 100% of media URLs (image_url, audio_us, audio_uk, phrase image_url)
 *    through deterministic AES-256 media proxy tokens via `resolveProxyMediaUrl`.
 * 3. Sanitizes all strings: wipes any competitor brand names or leaks.
 * 4. Deduplicates and merges multiple entries per headword, preserving the richest
 *    photos, collocations, TOEIC tips, and example sentences.
 * 5. Generates high-performance lookup entries for both headwords and individual
 *    collocation phrases (10,075 unique collocations).
 * 6. Emits `src/data/toeic/collocation-vocab-index.json` for 0ms in-memory lookups.
 *
 * Usage:
 *   npx tsx scripts/toeic/ingest-collocation-vocab.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveProxyMediaUrl } from '../../src/lib/toeic-media-proxy';

export interface IngestedPhrase {
  phrase: string;
  meaning: string;
  imageUrl?: string;
}

export interface IngestedVocabEntry {
  word: string;
  cleanWord: string;
  ipa?: string;
  pos?: string;
  definition: string;
  example?: string;
  exampleVi?: string;
  toeicTip?: string;
  wordFamily?: string[];
  synonyms?: string[];
  antonyms?: string[];
  imageUrl?: string;
  audioUs?: string;
  audioUk?: string;
  phrases?: IngestedPhrase[];
  parentWord?: string;
}

const FORBIDDEN_BRAND_REGEX = /(?:dautoeic|dauenglish|đậu\s*toeic|đậu\s*english)/gi;

function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(FORBIDDEN_BRAND_REGEX, 'LingoPro').trim();
}

function sanitizeStringArray(arr: any[] | null | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (typeof item === 'string') {
      const sanitized = sanitizeText(item);
      if (sanitized && !seen.has(sanitized.toLowerCase())) {
        seen.add(sanitized.toLowerCase());
        out.push(sanitized);
      }
    }
  }
  return out;
}

export function runVocabIngestion(
  inputPath: string,
  outputPath: string
): {
  totalRaw: number;
  uniqueHeadwords: number;
  uniqueCollocations: number;
  totalIndexKeys: number;
  proxiedMediaUrls: number;
} {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found at: ${inputPath}`);
  }

  const rawData: any[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const totalRaw = rawData.length;

  const headwordMap = new Map<string, IngestedVocabEntry>();
  const collocationMap = new Map<string, IngestedVocabEntry>();
  let proxiedMediaUrls = 0;

  for (const item of rawData) {
    if (!item.word || typeof item.word !== 'string') continue;

    const rawWord = sanitizeText(item.word);
    const cleanWord = rawWord.toLowerCase();
    if (!cleanWord) continue;

    // Resolve media URLs
    let imageUrl: string | undefined;
    if (item.image_url) {
      imageUrl = resolveProxyMediaUrl(item.image_url);
      if (imageUrl && imageUrl.startsWith('/api/toeic/media/proxy')) proxiedMediaUrls++;
    }

    let audioUs: string | undefined;
    if (item.audio_us) {
      audioUs = resolveProxyMediaUrl(item.audio_us);
      if (audioUs && audioUs.startsWith('/api/toeic/media/proxy')) proxiedMediaUrls++;
    }

    let audioUk: string | undefined;
    if (item.audio_uk) {
      audioUk = resolveProxyMediaUrl(item.audio_uk);
      if (audioUk && audioUk.startsWith('/api/toeic/media/proxy')) proxiedMediaUrls++;
    }

    // Process meanings
    const primaryMeaning = item.meanings?.[0];
    const pos = primaryMeaning?.part_of_speech ? sanitizeText(primaryMeaning.part_of_speech) : undefined;
    const definition = primaryMeaning?.meaning ? sanitizeText(primaryMeaning.meaning) : '';
    const example = primaryMeaning?.example ? sanitizeText(primaryMeaning.example) : undefined;
    const exampleVi = primaryMeaning?.example_vi ? sanitizeText(primaryMeaning.example_vi) : undefined;
    const toeicTip = primaryMeaning?.toeic_tip ? sanitizeText(primaryMeaning.toeic_tip) : undefined;
    const wordFamily = sanitizeStringArray(primaryMeaning?.word_family);
    const antonyms = sanitizeStringArray(primaryMeaning?.antonyms);
    const synonyms = sanitizeStringArray(item.synonyms);
    const ipa = item.ipa ? sanitizeText(item.ipa) : undefined;

    // Process phrases
    const phrases: IngestedPhrase[] = [];
    if (Array.isArray(item.phrases)) {
      for (const p of item.phrases) {
        if (!p.phrase) continue;
        const phraseText = sanitizeText(p.phrase);
        const phraseMeaning = sanitizeText(p.meaning || primaryMeaning?.meaning || '');
        let phraseImage: string | undefined;
        if (p.image_url) {
          phraseImage = resolveProxyMediaUrl(p.image_url);
          if (phraseImage && phraseImage.startsWith('/api/toeic/media/proxy')) proxiedMediaUrls++;
        }
        phrases.push({
          phrase: phraseText,
          meaning: phraseMeaning,
          ...(phraseImage ? { imageUrl: phraseImage } : {}),
        });
      }
    }

    // Merge or insert into headwordMap
    if (!headwordMap.has(cleanWord)) {
      headwordMap.set(cleanWord, {
        word: rawWord,
        cleanWord,
        ...(ipa ? { ipa } : {}),
        ...(pos ? { pos } : {}),
        definition,
        ...(example ? { example } : {}),
        ...(exampleVi ? { exampleVi } : {}),
        ...(toeicTip ? { toeicTip } : {}),
        ...(wordFamily.length > 0 ? { wordFamily } : {}),
        ...(synonyms.length > 0 ? { synonyms } : {}),
        ...(antonyms.length > 0 ? { antonyms } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(audioUs ? { audioUs } : {}),
        ...(audioUk ? { audioUk } : {}),
        ...(phrases.length > 0 ? { phrases } : {}),
      });
    } else {
      // Merge with existing record
      const existing = headwordMap.get(cleanWord)!;

      if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;
      if (!existing.audioUs && audioUs) existing.audioUs = audioUs;
      if (!existing.audioUk && audioUk) existing.audioUk = audioUk;
      if (!existing.ipa && ipa) existing.ipa = ipa;
      if (!existing.toeicTip && toeicTip) existing.toeicTip = toeicTip;
      if (!existing.example && example) {
        existing.example = example;
        existing.exampleVi = exampleVi;
      }
      if (!existing.definition && definition) existing.definition = definition;

      // Merge phrases
      if (phrases.length > 0) {
        const existingPhrases = existing.phrases || [];
        const seenPhrases = new Set(existingPhrases.map((p) => p.phrase.toLowerCase()));
        for (const p of phrases) {
          if (!seenPhrases.has(p.phrase.toLowerCase())) {
            seenPhrases.add(p.phrase.toLowerCase());
            existingPhrases.push(p);
          }
        }
        existing.phrases = existingPhrases;
      }

      // Merge synonyms
      if (synonyms.length > 0) {
        const existingSyn = existing.synonyms || [];
        const seenSyn = new Set(existingSyn.map((s) => s.toLowerCase()));
        for (const s of synonyms) {
          if (!seenSyn.has(s.toLowerCase())) {
            seenSyn.add(s.toLowerCase());
            existingSyn.push(s);
          }
        }
        existing.synonyms = existingSyn;
      }
    }

    // Index each phrase into collocationMap
    for (const p of phrases) {
      const pClean = p.phrase.trim().toLowerCase();
      if (!collocationMap.has(pClean)) {
        collocationMap.set(pClean, {
          word: p.phrase,
          cleanWord: pClean,
          pos: 'cụm từ',
          definition: p.meaning,
          ...(p.imageUrl ? { imageUrl: p.imageUrl } : imageUrl ? { imageUrl } : {}),
          ...(example ? { example } : {}),
          ...(exampleVi ? { exampleVi } : {}),
          ...(toeicTip ? { toeicTip } : {}),
          parentWord: rawWord,
        });
      }
    }
  }

  // Combine into single high-performance lookup dictionary
  const masterIndex: Record<string, IngestedVocabEntry> = {};

  // Headwords have higher priority than phrases
  for (const [key, entry] of headwordMap.entries()) {
    masterIndex[key] = entry;
  }

  // Add collocations (without overwriting existing headwords)
  for (const [key, entry] of collocationMap.entries()) {
    if (!masterIndex[key]) {
      masterIndex[key] = entry;
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write compact JSON
  fs.writeFileSync(outputPath, JSON.stringify(masterIndex), 'utf-8');

  return {
    totalRaw,
    uniqueHeadwords: headwordMap.size,
    uniqueCollocations: collocationMap.size,
    totalIndexKeys: Object.keys(masterIndex).length,
    proxiedMediaUrls,
  };
}

// Direct CLI execution
if (require.main === module) {
  const rootDir = path.resolve(__dirname, '../..');
  const input = path.resolve(rootDir, 'scripts/dautoeic/data/vocabulary_words.json');
  const output = path.resolve(rootDir, 'src/data/toeic/collocation-vocab-index.json');

  console.log('================================================================================');
  console.log('  DAUTOEIC 8,504 VOCABULARY & 10,075 COLLOCATIONS INGESTION ENGINE');
  console.log('================================================================================');
  console.log(`Input : ${input}`);
  console.log(`Output: ${output}`);

  const start = Date.now();
  const stats = runVocabIngestion(input, output);
  const duration = Date.now() - start;

  console.log('--------------------------------------------------------------------------------');
  console.log(`✓ Total Raw Entries Processed : ${stats.totalRaw}`);
  console.log(`✓ Unique Headwords Indexed    : ${stats.uniqueHeadwords}`);
  console.log(`✓ Unique Collocations Indexed  : ${stats.uniqueCollocations}`);
  console.log(`✓ Total Index Keys in Output   : ${stats.totalIndexKeys}`);
  console.log(`✓ Proxied Media URLs Generated : ${stats.proxiedMediaUrls}`);
  console.log(`✓ Duration                     : ${duration}ms`);
  console.log('================================================================================');
}
