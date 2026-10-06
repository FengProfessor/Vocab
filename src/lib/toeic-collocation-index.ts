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
let cachedFamilyClusters: Map<string, Map<string, WordFamilyEntry>> | null = null;

import type { WordFamilyEntry } from './supabase';
import { getCandidateLemmas, getDerivationalStems } from './dict-cache';

/**
 * Loads the in-memory collocation vocabulary index from `collocation-vocab-index.json`.
 * Caches the parsed index in memory for 0ms synchronous lookups.
 */
export function getCollocationIndex(): Record<string, CollocationVocabEntry> | null {
  if (cachedIndex) return cachedIndex;

  try {
    const possiblePaths: string[] = [
      path.resolve(process.cwd(), 'src/data/toeic/collocation-vocab-index.json'),
    ];

    if (typeof __dirname !== 'undefined') {
      possiblePaths.push(path.resolve(__dirname, '../data/toeic/collocation-vocab-index.json'));
    }

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
 * Builds and caches bidirectional word family clusters across all 14,860 entries in 0ms.
 * Maps every member in a word family cluster (e.g. success, succeed, successful, successfully)
 * to the entire family cluster so any member can immediately retrieve the full family.
 */
function getFamilyClusterMap(): Map<string, Map<string, WordFamilyEntry>> {
  if (cachedFamilyClusters) return cachedFamilyClusters;

  const clusters = new Map<string, Map<string, WordFamilyEntry>>();
  const index = getCollocationIndex();
  if (!index) {
    cachedFamilyClusters = clusters;
    return clusters;
  }

  for (const [head, entry] of Object.entries(index)) {
    if (!entry.wordFamily || !Array.isArray(entry.wordFamily) || entry.wordFamily.length === 0) {
      continue;
    }

    const members: WordFamilyEntry[] = [];
    const headLow = head.toLowerCase().trim();
    if (entry.pos || entry.definition) {
      members.push({ word: head, pos: entry.pos || '', meaning: entry.definition || '' });
    }

    for (const item of entry.wordFamily) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) continue;
        const m = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/);
        if (m) {
          members.push({ word: m[1].trim(), pos: m[2].trim(), meaning: m[3]?.trim() || '' });
        } else {
          const s = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
          if (s) members.push({ word: s[1].trim(), pos: s[2].trim(), meaning: '' });
          else members.push({ word: trimmed, pos: '', meaning: '' });
        }
      } else if (item && typeof item === 'object' && (item as WordFamilyEntry).word) {
        members.push({ ...(item as WordFamilyEntry) });
      }
    }

    // Collect all unique member keys
    const memberKeys: string[] = [];
    for (const m of members) {
      const k = m.word.toLowerCase().trim();
      if (k && !memberKeys.includes(k)) memberKeys.push(k);
    }

    // Identify if any member already belongs to an existing cluster to merge
    let targetMap: Map<string, WordFamilyEntry> | null = null;
    for (const k of memberKeys) {
      if (clusters.has(k)) {
        targetMap = clusters.get(k)!;
        break;
      }
    }

    if (!targetMap) {
      targetMap = new Map<string, WordFamilyEntry>();
    }

    // Insert/enrich members into targetMap
    for (const m of members) {
      const k = m.word.toLowerCase().trim();
      const existing = targetMap.get(k);
      if (!existing) {
        targetMap.set(k, { ...m });
      } else {
        if (!existing.meaning && m.meaning) existing.meaning = m.meaning;
        if (!existing.pos && m.pos) existing.pos = m.pos;
      }
    }

    // Link every member to the shared targetMap
    for (const k of targetMap.keys()) {
      clusters.set(k, targetMap);
    }
  }

  cachedFamilyClusters = clusters;
  return clusters;
}

/**
 * Looks up the bidirectional word family for any word or derivation.
 * E.g. "succeed" -> returns [success (n), successful (adj), successfully (adv), ...]
 * E.g. "active" -> returns [act (v), action (n), actor (n), activate (v), ...]
 *
 * @param query Word or stem to look up
 * @param excludeSelf If true (default), filters out the queried word itself from the returned list
 */
export function getWordFamilyCluster(query: string, excludeSelf = true): WordFamilyEntry[] | null {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
  if (!clean) return null;

  const clusters = getFamilyClusterMap();

  // 1. Direct hit on family cluster
  let target = clusters.get(clean);

  // 2. Lemma expansion fallback
  if (!target) {
    for (const lemma of getCandidateLemmas(clean)) {
      if (lemma !== clean && clusters.has(lemma)) {
        target = clusters.get(lemma);
        break;
      }
    }
  }

  // 3. Derivational stems fallback
  if (!target) {
    for (const stem of getDerivationalStems(clean)) {
      if (stem !== clean && clusters.has(stem)) {
        target = clusters.get(stem);
        break;
      }
    }
  }

  if (!target || target.size === 0) return null;

  const entries = Array.from(target.values());
  if (excludeSelf) {
    const nonSelf = entries.filter((e) => e.word.toLowerCase().trim() !== clean);
    return nonSelf.length > 0 ? nonSelf : entries;
  }
  return entries;
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

