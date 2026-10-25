declare const data: {
  version: string;
  description: string;
  updatedAt: string;
  stages: Array<{
    stage: 1 | 2 | 3;
    title: string;
    titleVi: string;
    cefrLevel: string;
    wordCount: number;
    topics: Array<{
      id: string;
      stage: 1 | 2 | 3;
      index: number;
      title: string;
      titleEn: string;
      icon: string;
      badge: string;
      description: string;
      wordCount: number;
      words: Array<Record<string, unknown>>;
    }>;
  }>;
};
export default data;
