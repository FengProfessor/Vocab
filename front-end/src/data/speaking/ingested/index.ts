/**
 * Master Ingested Speaking Catalog & Lookup Helpers
 * File: src/data/speaking/ingested/index.ts
 *
 * Generated automatically by scripts/speaking/ingest.ts.
 * 100% compliant with StandardizedSpeakingLesson contracts.
 */

import {
  CefrLevel,
  IngestionSource,
  StandardizedSpeakingLesson,
} from '@/types/speaking-curriculum';

import ellloData from './elllo-catalog.json';
import talkenglishData from './talkenglish-catalog.json';
import youtubeData from './youtube-catalog.json';

export const ellloCatalog: StandardizedSpeakingLesson[] = ellloData as StandardizedSpeakingLesson[];
export const talkenglishCatalog: StandardizedSpeakingLesson[] = talkenglishData as StandardizedSpeakingLesson[];
export const youtubeCatalog: StandardizedSpeakingLesson[] = youtubeData as StandardizedSpeakingLesson[];

export const allIngestedLessons: StandardizedSpeakingLesson[] = [
  ...ellloCatalog,
  ...talkenglishCatalog,
  ...youtubeCatalog,
];

/**
 * Find a specific ingested lesson by unique ID across all catalogs.
 */
export function getLessonById(id: string): StandardizedSpeakingLesson | undefined {
  return allIngestedLessons.find((l) => l.id === id);
}

/**
 * Filter ingested lessons by source platform.
 */
export function getLessonsBySource(
  source: IngestionSource
): StandardizedSpeakingLesson[] {
  return allIngestedLessons.filter((l) => l.source === source);
}

/**
 * Filter ingested lessons by CEFR proficiency level (A1, A2, B1, B2).
 */
export function getLessonsByLevel(
  level: CefrLevel
): StandardizedSpeakingLesson[] {
  return allIngestedLessons.filter((l) => l.cefrLevel === level);
}

/**
 * Search lessons by topic substring (case-insensitive).
 */
export function getLessonsByTopic(
  topicQuery: string
): StandardizedSpeakingLesson[] {
  const query = topicQuery.toLowerCase().trim();
  return allIngestedLessons.filter(
    (l) =>
      l.topic.toLowerCase().includes(query) ||
      l.title.toLowerCase().includes(query)
  );
}

/**
 * Get aggregate catalog statistics.
 */
export function getIngestedCatalogStats() {
  const byLevel: Record<CefrLevel, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  };

  for (const lesson of allIngestedLessons) {
    if (byLevel[lesson.cefrLevel] !== undefined) {
      byLevel[lesson.cefrLevel] += 1;
    }
  }

  return {
    total: allIngestedLessons.length,
    elllo: ellloCatalog.length,
    talkenglish: talkenglishCatalog.length,
    youtube: youtubeCatalog.length,
    byLevel,
    averageQualityScore:
      allIngestedLessons.length > 0
        ? Math.round(
            allIngestedLessons.reduce((acc, cur) => acc + cur.qualityScore, 0) /
              allIngestedLessons.length
          )
        : 0,
  };
}
