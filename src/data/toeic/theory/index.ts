/**
 * TOEIC Theory & Tactics Curriculum Index
 * 
 * Tổng hợp toàn bộ chương trình lý thuyết TOEIC:
 * - Module 1: Khối Ngữ Pháp Cốt Lõi & Điền Từ (Part 5 & 6) - 6 bài học, 24 checkpoints
 * - Module 2: Chiến Thuật Nghe & Bẫy Đề Thi (Part 1 - 4) - 5 bài học, 17 checkpoints
 * - Module 3: Kỹ Thuật Đọc Hiểu & Xử Lý Đoạn Văn (Part 7) - 5 bài học, 20 checkpoints
 * Tổng cộng: 16 bài học, 61 checkpoints tương tác.
 */

import {
  TheoryCurriculumIndex,
  TheoryLesson,
  TheoryModule,
  TheoryModuleId,
} from './types';
import { grammarFoundationModule } from './modules/grammar-foundation';
import { listeningTacticsModule } from './modules/listening-tactics';
import { readingMasteryModule } from './modules/reading-mastery';

export * from './types';
export { grammarFoundationModule, listeningTacticsModule, readingMasteryModule };

export const toeicTheoryCurriculum: TheoryCurriculumIndex = {
  version: '1.0.0',
  totalLessons:
    grammarFoundationModule.lessons.length +
    listeningTacticsModule.lessons.length +
    readingMasteryModule.lessons.length,
  totalCheckpoints:
    grammarFoundationModule.lessons.reduce((sum, l) => sum + l.checkpoints.length, 0) +
    listeningTacticsModule.lessons.reduce((sum, l) => sum + l.checkpoints.length, 0) +
    readingMasteryModule.lessons.reduce((sum, l) => sum + l.checkpoints.length, 0),
  modules: [
    grammarFoundationModule,
    listeningTacticsModule,
    readingMasteryModule,
  ],
};

/**
 * Lấy tất cả các module lý thuyết TOEIC
 */
export function getAllModules(): TheoryModule[] {
  return toeicTheoryCurriculum.modules;
}

/**
 * Lấy chi tiết module theo ID
 */
export function getModuleById(id: TheoryModuleId): TheoryModule | undefined {
  return toeicTheoryCurriculum.modules.find(m => m.id === id);
}

/**
 * Lấy danh sách phẳng tất cả bài học theo thứ tự chương trình
 */
export function getAllLessons(): TheoryLesson[] {
  return toeicTheoryCurriculum.modules.flatMap(m => m.lessons);
}

/**
 * Tìm bài học theo ID duy nhất (e.g. "toeic-grammar-01-parts-of-speech")
 */
export function getLessonById(id: string): TheoryLesson | undefined {
  for (const mod of toeicTheoryCurriculum.modules) {
    const found = mod.lessons.find(l => l.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Tìm bài học theo slug duy nhất (e.g. "parts-of-speech")
 */
export function getLessonBySlug(slug: string): TheoryLesson | undefined {
  for (const mod of toeicTheoryCurriculum.modules) {
    const found = mod.lessons.find(l => l.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/**
 * Lấy bài học liền trước và liền sau bài học hiện tại (hỗ trợ chuyển bài mượt mà qua các module)
 */
export function getAdjacentLessons(lessonId: string): {
  prevLesson?: TheoryLesson;
  nextLesson?: TheoryLesson;
} {
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);

  if (currentIndex === -1) {
    return { prevLesson: undefined, nextLesson: undefined };
  }

  return {
    prevLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : undefined,
    nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : undefined,
  };
}

export interface CurriculumStats {
  totalModules: number;
  totalLessons: number;
  totalCheckpoints: number;
  byModule: Record<string, number>;
  checkpointsByModule: Record<string, number>;
  moduleDetails: Record<
    string,
    {
      title: string;
      lessons: number;
      checkpoints: number;
    }
  >;
}

/**
 * Thống kê tổng quan toàn bộ chương trình lý thuyết
 */
export function getCurriculumStats(): CurriculumStats {
  const byModule: Record<string, number> = {};
  const checkpointsByModule: Record<string, number> = {};
  const moduleDetails: Record<
    string,
    {
      title: string;
      lessons: number;
      checkpoints: number;
    }
  > = {};

  for (const mod of toeicTheoryCurriculum.modules) {
    const cpCount = mod.lessons.reduce((acc, l) => acc + l.checkpoints.length, 0);
    byModule[mod.id] = mod.lessons.length;
    checkpointsByModule[mod.id] = cpCount;
    moduleDetails[mod.id] = {
      title: mod.title,
      lessons: mod.lessons.length,
      checkpoints: cpCount,
    };
  }

  return {
    totalModules: toeicTheoryCurriculum.modules.length,
    totalLessons: toeicTheoryCurriculum.totalLessons,
    totalCheckpoints: toeicTheoryCurriculum.totalCheckpoints,
    byModule,
    checkpointsByModule,
    moduleDetails,
  };
}
