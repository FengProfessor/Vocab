/**
 * Tra cứu tranh minh họa cho lộ trình Speaking 32 bài.
 * Dữ liệu: src/data/speaking/curriculum/visuals.json (mã OpenMoji, CC BY-SA 4.0).
 * Tài sản: public/speaking/openmoji/<HEX>.svg — tạo bằng `npx tsx scripts/speaking/build-visual-assets.ts`.
 */
import visualsManifest from '@/data/speaking/curriculum/visuals.json';
import wordLevels from '@/data/speaking/curriculum/word-levels.json';

const WORD_LEVELS = (wordLevels as { levels: Record<string, string> }).levels;

/** Cấp CEFR theo CEFR-J/Octanove (tạo bằng scripts/speaking/audit-content.ts --write-levels). */
export function getWordCefrLevel(word: string): string | undefined {
  return WORD_LEVELS[word.trim().toLowerCase()];
}

export interface OpenMojiTile {
  hex: string;
  labelVi: string;
}

export interface OpenMojiPerson {
  hex: string;
  name: string;
}

export interface LessonVisual {
  place: OpenMojiTile;
  partner: OpenMojiPerson;
  learner: OpenMojiPerson;
  props: OpenMojiTile[];
  goalVi: string;
  words: Record<string, string>;
}

const LESSON_VISUALS = (visualsManifest as { lessons: Record<string, LessonVisual> }).lessons;

export const OPENMOJI_ATTRIBUTION = {
  label: 'OpenMoji',
  repoUrl: 'https://github.com/hfg-gmuend/openmoji',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
} as const;

export function openMojiUrl(hex: string): string {
  return `/speaking/openmoji/${hex}.svg`;
}

export function getLessonVisual(lessonId: string): LessonVisual | undefined {
  return LESSON_VISUALS[lessonId];
}

/** Ảnh cho một từ/cụm từ trong bài; trả về undefined với từ trừu tượng chưa có tranh. */
export function getWordPictureUrl(lessonId: string, word: string): string | undefined {
  const words = LESSON_VISUALS[lessonId]?.words;
  if (!words || !word) return undefined;
  const key = word.trim();
  const hex =
    words[key] ??
    Object.entries(words).find(([term]) => term.toLowerCase() === key.toLowerCase())?.[1];
  return hex ? openMojiUrl(hex) : undefined;
}

const LEARNER_SPEAKERS = new Set(['learner', 'candidate', 'b', 'bạn', 'you', 'student']);

/** Xác định lượt thoại của người học (Learner/Candidate/B), tránh đoán theo ký tự. */
export function isLearnerSpeaker(speaker: string): boolean {
  const key = speaker.trim().toLowerCase();
  return LEARNER_SPEAKERS.has(key) || key.includes('learner') || key.includes('candidate');
}

export function getAllLessonVisualIds(): string[] {
  return Object.keys(LESSON_VISUALS);
}
