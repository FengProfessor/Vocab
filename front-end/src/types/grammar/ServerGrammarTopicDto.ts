import { CertLevel } from '@/types/enums/CertLevel';
import { GrammarLevel } from '@/types/enums/GrammarLevel';

export interface ServerGrammarTopicDto {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  level: GrammarLevel | string;
  certLevel: CertLevel | string;
  category: string;
  sortOrder: number;
}
