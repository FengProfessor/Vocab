import {
  CertLevel,
  ReadingArticleSourceType,
  UserReadingProgressStatus,
} from '@/types/enums';

export interface ReadingArticleDto {
  id: string;
  title: string;
  titleVi: string;
  category: string;
  certLevel: CertLevel;
  sourceType: ReadingArticleSourceType;
  wordCount: number;
  estimatedMinutes: number;
  paragraphsEn: string[];
  paragraphsVi: string[];
  keyWords: string[];
  progressStatus: UserReadingProgressStatus;
}

export interface ServerDailyReadingDto {
  id: string;
  exerciseDate: string;
  title: string;
  passageContent: string;
  certLevel: CertLevel;
  usedWordsJson: string;
  mcqQuestionsJson: string;
  clozeItemsJson: string;
  isCompletedToday: boolean;
}

export interface ServerReadingArticleDto {
  id: string;
  slug: string;
  title: string;
  topic: string;
  certLevel: CertLevel;
  sourceType: string;
  wordCount: number;
  contentText: string;
  questionsJson: string;
}

export type * from '@/types/reading-library';
