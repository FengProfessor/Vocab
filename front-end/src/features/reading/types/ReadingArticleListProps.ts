import { ServerReadingArticleDto } from '@/types/reading/ServerReadingArticleDto';

/**
 * Props for the ReadingArticleList component.
 */
export interface ReadingArticleListProps {
  /** Published reading articles. */
  articles: ServerReadingArticleDto[];
  /** Currently selected article id. */
  selectedArticleId: string;
  /** Selects an article. */
  onSelectArticle: (articleId: string) => void;
}
