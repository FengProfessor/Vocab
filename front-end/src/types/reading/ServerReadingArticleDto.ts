import { CertLevel } from '@/types/enums/CertLevel';

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
