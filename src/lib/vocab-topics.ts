/**
 * Vocab Topics Lightweight Catalog & Dynamic Loader
 * 
 * Provides:
 * 1. Synchronous lightweight topic index for topic switcher dropdown & headers (0 heavy data, ~9.6KB).
 * 2. Asynchronous on-demand loader for individual topic word lists via:
 *    - Tier 1: Server API endpoint /api/vocab/topic?id=... (~15KB gzipped payload).
 *    - Tier 2: Resilient fallback to dynamic chunk import('@/lib/vocab-stages').
 * 3. In-memory topic cache to ensure 0-redundancy network calls on re-selection.
 */

import vocabTopicsIndexData from '@/data/roadmap/vocab-topics-index.json';
import type { VocabStageItem, VocabStageTopic } from '@/lib/vocab-stages';

export interface VocabTopicMeta {
  id: string;
  stage: 1 | 2 | 3;
  index: number;
  title: string;
  titleEn: string;
  icon: string;
  badge: string;
  description: string;
  wordCount: number;
}

export type { VocabStageItem, VocabStageTopic };

const topicsIndex = vocabTopicsIndexData as VocabTopicMeta[];
const topicMemoryCache = new Map<string, VocabStageTopic>();

/**
 * Returns all 36 topic metadata entries for dropdown listing.
 * Lightweight index only (~9.6KB JSON), zero word lists.
 */
export function getAllVocabTopicsIndex(): VocabTopicMeta[] {
  return topicsIndex;
}

/**
 * Backward-compatible alias for getAllVocabTopicsIndex.
 */
export function getAllVocabTopics(): VocabTopicMeta[] {
  return topicsIndex;
}

/**
 * Synchronously look up topic metadata by topic ID.
 */
export function getVocabTopicMeta(topicId: string): VocabTopicMeta | null {
  if (!topicId) return null;
  const norm = topicId.trim().toLowerCase();
  return topicsIndex.find((t) => t.id.toLowerCase() === norm) ?? null;
}

/**
 * Load full topic data (including words array) on demand.
 * Cached in memory after first load.
 */
export async function loadVocabTopic(topicId: string): Promise<VocabStageTopic | null> {
  if (!topicId) return null;
  const norm = topicId.trim().toLowerCase();

  // Return from in-memory cache if already loaded
  if (topicMemoryCache.has(norm)) {
    return topicMemoryCache.get(norm)!;
  }

  // Tier 1: Fetch single topic payload from Server API route (~15KB gzipped vs 1.49MB chunk)
  try {
    const res = await fetch(`/api/vocab/topic?id=${encodeURIComponent(norm)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.topic && Array.isArray(data.topic.words)) {
        const fullTopic = data.topic as VocabStageTopic;
        topicMemoryCache.set(norm, fullTopic);
        return fullTopic;
      }
    }
  } catch (err) {
    console.warn('[loadVocabTopic] API route fetch failed, falling back to dynamic import:', err);
  }

  // Tier 2: Resilient fallback to lazy dynamic chunk import
  try {
    const { getVocabTopic } = await import('@/lib/vocab-stages');
    const topic = getVocabTopic(norm);
    if (topic) {
      topicMemoryCache.set(norm, topic);
      return topic;
    }
  } catch (err) {
    console.error('[loadVocabTopic] Dynamic import fallback failed:', err);
  }

  return null;
}
