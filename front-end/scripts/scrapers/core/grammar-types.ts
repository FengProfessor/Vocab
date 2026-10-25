/** Kiểu dữ liệu trung gian cho nội dung grammar trước khi ghi vào DB. */

export interface GrammarExampleDraft {
  en: string;
  vi?: string;
  note?: string;
}

export interface GrammarLessonDraft {
  topic_slug: string;
  topic_title: string;
  topic_title_vi?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  theory: string;
  theory_vi?: string;
  examples: GrammarExampleDraft[];
  source: string;
  source_url?: string;
}
