import { CertLevel } from '@/types/enums/CertLevel';
import { ReadingArticleSourceType } from '@/types/enums/ReadingArticleSourceType';
import { UserReadingProgressStatus } from '@/types/enums/UserReadingProgressStatus';

/**
 * Represents a bilingual reading passage with vocabulary highlights and comprehension metrics.
 */
export interface ReadingArticleDto {
  /** Unique reading article identifier. */
  id: string;

  /** English headline of the passage. */
  title: string;

  /** Vietnamese translated headline. */
  titleVi: string;

  /** Category or topic tag (e.g., Technology, Business, Environment). */
  category: string;

  /** Target CEFR certification level. */
  certLevel: CertLevel;

  /** Origin of the article content. */
  sourceType: ReadingArticleSourceType;

  /** Word count of the English passage. */
  wordCount: number;

  /** Estimated reading time in minutes. */
  estimatedMinutes: number;

  /** English paragraphs. */
  paragraphsEn: string[];

  /** Parallel Vietnamese translations corresponding to each English paragraph. */
  paragraphsVi: string[];

  /** Key vocabulary words highlighted in the passage. */
  keyWords: string[];

  /** Learner's current progress status on this passage. */
  progressStatus: UserReadingProgressStatus;
}
