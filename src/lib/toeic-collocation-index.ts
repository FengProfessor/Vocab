import fs from 'node:fs';
import path from 'node:path';

export interface CollocationPhrase {
  phrase: string;
  meaning: string;
  imageUrl?: string;
}

export interface CollocationVocabEntry {
  word: string;
  cleanWord?: string;
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
  phrases?: CollocationPhrase[];
  parentWord?: string;
}

let cachedIndex: Record<string, CollocationVocabEntry> | null = null;

/**
 * Loads the in-memory collocation vocabulary index from `collocation-vocab-index.json`.
 * Caches the parsed index in memory for 0ms synchronous lookups.
 */
export function getCollocationIndex(): Record<string, CollocationVocabEntry> | null {
  if (cachedIndex) return cachedIndex;

  try {
    const possiblePaths = [
      path.resolve(process.cwd(), 'src/data/toeic/collocation-vocab-index.json'),
      path.resolve(__dirname, '../data/toeic/collocation-vocab-index.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        cachedIndex = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return cachedIndex;
      }
    }
  } catch (err) {
    console.warn('[CollocationIndex] Failed to load index:', err);
  }

  return null;
}

/**
 * Looks up a word or multi-word collocation in the 8,504 vocabulary / 10,075 collocations index.
 * Case-insensitive, trims leading/trailing whitespace and punctuation.
 *
 * @param query Word or phrase to look up (e.g. "inspiring", "inspiring speech")
 * @returns Rich vocabulary entry or null if not indexed
 */
export function getCollocationVocabEntry(query: string): CollocationVocabEntry | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!clean) return null;

  const index = getCollocationIndex();
  if (!index) return null;

  return index[clean] || null;
}
