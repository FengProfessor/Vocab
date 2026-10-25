/**
 * LingoPro Speaking Topic Library
 * Master Index
 */

import { allDescribingTopics } from './describing';
import { allDailySituationsTopics } from './daily-situations';
import { allSocialTopics } from './social';
import { allWorkplaceExtendedTopics } from './workplace-extended';

import type { TopicLibraryItem, TopicLibraryCategory, TopicLibraryCefrLevel, TopicLibraryStats } from '@/types/speaking-topic-library';

export const allTopicLibraryItems: TopicLibraryItem[] = [
  ...allDescribingTopics,
  ...allDailySituationsTopics,
  ...allSocialTopics,
  ...allWorkplaceExtendedTopics
];

export function getTopicLibraryByCategory(category: TopicLibraryCategory): TopicLibraryItem[] {
  return allTopicLibraryItems.filter(item => item.category === category);
}

export function getTopicLibraryByLevel(level: TopicLibraryCefrLevel): TopicLibraryItem[] {
  return allTopicLibraryItems.filter(item => item.level === level);
}

export function getTopicLibraryBySubcategory(subcategory: string): TopicLibraryItem[] {
  return allTopicLibraryItems.filter(item => item.subcategory === subcategory);
}

export function searchTopicLibrary(query: string): TopicLibraryItem[] {
  const q = query.toLowerCase();
  return allTopicLibraryItems.filter(item => {
    return (
      item.titleEn.toLowerCase().includes(q) ||
      item.titleVi.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  });
}

export function getTopicLibraryStats(): TopicLibraryStats {
  const stats = {
    totalTopics: allTopicLibraryItems.length,
    byCategory: {} as Record<string, number>,
    byLevel: {} as Record<string, number>
  };

  allTopicLibraryItems.forEach(item => {
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;
  });

  return {
    total: allTopicLibraryItems.length,
    subcategoryCount: 0,
    byCategory: stats.byCategory,
    byLevel: stats.byLevel,
  } as unknown as TopicLibraryStats;
}

export function getTopicById(id: string): TopicLibraryItem | undefined {
  return allTopicLibraryItems.find(item => item.id === id);
}

