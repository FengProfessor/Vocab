/**
 * Vocab Stages Library — Hỗ trợ Lộ trình Lấy gốc 3.000 từ vựng:
 * - Chặng 1: 1.000 từ Căn bản lấy gốc (A0 - A1, neo bởi 100 Động từ Cốt lõi + 12 chủ đề đời sống)
 * - Chặng 2: 1.000 từ Giao tiếp mở rộng (A2 - B1, 12 chủ đề công việc & xã hội)
 * - Chặng 3: 1.000 từ Làm chủ tự tin & Bứt phá (B1 - B2, 12 chủ đề nâng cao & học thuật)
 */

import vocabStagesArtifact from '@/data/roadmap/vocab-stages-v1.json';

export interface VocabStageCloze {
  sentence: string;
  options: string[];
  answer: string;
  explain: string;
}

export interface VocabStageItem {
  id: string;
  word: string;
  pos: string;
  ipa: string;
  meaningVi: string;
  example: string;
  exampleVi: string;
  collocation?: string;
  audioUrl?: string;
  cloze: VocabStageCloze;
}

export interface VocabStageTopic {
  id: string;
  stage: 1 | 2 | 3;
  index: number;
  title: string;
  titleEn: string;
  icon: string;
  badge: string;
  description: string;
  wordCount: number;
  words: VocabStageItem[];
}

export interface VocabStageData {
  stage: 1 | 2 | 3;
  title: string;
  titleVi: string;
  cefrLevel: string;
  wordCount: number;
  topics: VocabStageTopic[];
}

interface VocabStagesJson {
  version: string;
  description: string;
  updatedAt: string;
  stages: VocabStageData[];
}

const artifact = vocabStagesArtifact as unknown as VocabStagesJson;

/** Lấy danh sách toàn bộ 3 Chặng */
export function getVocabStages(): VocabStageData[] {
  return artifact.stages ?? [];
}

/** Lấy dữ liệu chi tiết của 1 chặng cụ thể (1, 2 hoặc 3) */
export function getVocabStage(stageNumber: 1 | 2 | 3): VocabStageData | null {
  const stages = getVocabStages();
  return stages.find((s) => s.stage === stageNumber) ?? null;
}

/** Lấy toàn bộ 36 chủ đề trên hệ thống */
export function getAllVocabTopics(): VocabStageTopic[] {
  return getVocabStages().flatMap((s) => s.topics);
}

/** Lấy dữ liệu của một chủ đề cụ thể theo topicId */
export function getVocabTopic(topicId: string): VocabStageTopic | null {
  const norm = topicId.trim().toLowerCase();
  for (const stage of getVocabStages()) {
    const found = stage.topics.find((t) => t.id.toLowerCase() === norm);
    if (found) return found;
  }
  return null;
}

/** Lấy danh sách từ vựng của 1 chủ đề */
export function getTopicWordList(topicId: string): VocabStageItem[] {
  const topic = getVocabTopic(topicId);
  return topic ? topic.words : [];
}

/** Lấy toàn bộ từ vựng của 1 chặng (1.000 từ) */
export function getStageWordList(stageNumber: 1 | 2 | 3): VocabStageItem[] {
  const stage = getVocabStage(stageNumber);
  return stage ? stage.topics.flatMap((t) => t.words) : [];
}

/** Tìm kiếm từ vựng trong 3 chặng */
export function searchVocabStages(query: string): VocabStageItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: VocabStageItem[] = [];
  for (const topic of getAllVocabTopics()) {
    for (const item of topic.words) {
      if (item.word.toLowerCase().includes(q) || item.meaningVi.toLowerCase().includes(q)) {
        results.push(item);
        if (results.length >= 50) return results;
      }
    }
  }
  return results;
}

/** Tra cứu 1 từ vựng theo ID hoặc lemma */
export function getVocabItem(idOrWord: string): VocabStageItem | null {
  const norm = idOrWord.trim().toLowerCase();
  for (const topic of getAllVocabTopics()) {
    const found = topic.words.find(
      (w) => w.id.toLowerCase() === norm || w.word.toLowerCase() === norm
    );
    if (found) return found;
  }
  return null;
}
