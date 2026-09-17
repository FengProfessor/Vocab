import type { ToeicPart } from '@/types/toeic';

export type TheoryModuleId = 'grammar-foundation' | 'listening-tactics' | 'reading-mastery';

export type TheoryDifficulty = 'starter' | 'intermediate' | 'advanced'; // 450-550 | 600-750 | 800+

export interface RealWorldExample {
  context: string;          // e.g. "Board Meeting", "Company Memo", "Airport Announcement"
  english: string;          // Interactive English text (supports 1-click lookup)
  vietnamese: string;       // Natural Vietnamese translation
  analysis: string;         // Structural & grammatical breakdown
  audioUrl?: string;        // Optional audio stimulus for listening lessons
  highlights?: string[];    // Target keywords to highlight
}

export interface TipBox {
  title: string;            // e.g. "Quy Tắc 5 Giây: Nhận Diện Đuôi Danh Từ"
  type: 'tip' | 'shortcut' | 'rule' | 'warning';
  content: string;
  keySignals: string[];     // Bullet signals, e.g. ["a / an / the + [?] + Noun -> Chọn Tính từ"]
}

export interface TrapAlert {
  trapName: string;         // e.g. "Bẫy Từ Trùng Âm / Na Ná Part 2"
  trapLevel: 'common' | 'high_distractor' | 'subtle';
  trapDescription: string;
  distractorExample: {
    prompt: string;
    incorrectChoice: string;
    correctChoice: string;
    whyDistractorFails: string;
  };
  antidote: string;         // Phương pháp nhận diện và hóa giải bẫy
}

export interface ComparisonTable {
  title: string;
  headers: string[];
  rows: Array<{
    colValues: string[];
    highlight?: boolean;
    badge?: string;
  }>;
  summaryNote?: string;
}

export interface VisualGrammarFormula {
  pattern: string;          // e.g. "S + V + O + [ Adv ]" or "Preposition + [ V-ing / Noun ]"
  elements: Array<{
    symbol: string;
    label: string;
    explanation: string;
    color?: 'blue' | 'emerald' | 'amber' | 'purple';
  }>;
  notes?: string;
}

export type TheorySectionType =
  | 'concept'          // Lý thuyết nền tảng
  | 'rules'            // Quy tắc & Công thức cốt lõi
  | 'comparison'       // Bảng so sánh đối chiếu
  | 'traps'            // Bẫy thường gặp & Sai lầm phổ biến
  | 'shortcuts'        // Mẹo nhận diện nhanh 5 giây
  | 'real_examples';   // Trích dẫn ví dụ đề thi thật ETS

export interface TheorySection {
  id: string;
  order: number;
  title: string;
  sectionType: TheorySectionType;
  contentMarkdown?: string;
  formula?: VisualGrammarFormula;
  tipBox?: TipBox;
  trapAlert?: TrapAlert;
  comparisonTable?: ComparisonTable;
  examples?: RealWorldExample[];
  keyTakeaways?: string[];
}

export interface TheoryCheckpointOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface TheoryCheckpoint {
  id: string;
  order: number;
  prompt: string;
  passage?: string;
  audioUrl?: string;
  imageUrl?: string;
  options: TheoryCheckpointOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanationVi: string;
  trapSignal?: string;        // Nhãn bẫy nếu thí sinh chọn sai phương án này
  timeTargetSeconds: number;  // Thời gian giải mục tiêu (e.g. 15s cho Part 5, 30s cho Part 7)
}

export interface BridgeToPractice {
  targetPart: ToeicPart;
  partName: string;
  recommendedQuestionCount: number;
  filterMode: 'unseen' | 'mistakes' | 'all_random';
  practiceUrl: string;        // e.g. "/toeic/exam/bank?part=5&limit=20&mode=practice&filterMode=unseen"
  ctaText: string;            // e.g. "Luyện ngay 20 câu Part 5 Ngữ pháp"
}

export interface TheoryLesson {
  id: string;                 // e.g. "toeic-grammar-01-parts-of-speech"
  moduleId: TheoryModuleId;
  slug: string;               // e.g. "parts-of-speech"
  order: number;
  title: string;              // Tiêu đề tiếng Việt
  englishTitle: string;       // English title
  targetPart: ToeicPart;
  targetSections: ('reading' | 'listening')[];
  difficulty: TheoryDifficulty;
  estimatedMinutes: number;   // e.g. 15-20
  textbookSources: string[];  // e.g. ["Hackers TOEIC Start Ch.1-4", "Very Easy TOEIC Unit 1-3"]
  objectives: string[];       // Can-do statements
  sections: TheorySection[];
  checkpoints: TheoryCheckpoint[];
  bridgeToPractice: BridgeToPractice;
}

export interface TheoryModule {
  id: TheoryModuleId;
  title: string;
  shortTitle: string;
  description: string;
  targetParts: ToeicPart[];
  icon: string;               // Lucide icon name
  badgeColor: string;
  lessons: TheoryLesson[];
}

export interface TheoryCurriculumIndex {
  version: string;
  totalLessons: number;
  totalCheckpoints: number;
  modules: TheoryModule[];
}

export interface LessonFlashcard {
  id: string;
  lessonId: string;
  term: string;
  ipa: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'phrase' | 'formula';
  vietnamese: string;
  collocation?: string;
  exampleSentence: string;
  exampleTranslation: string;
  trapWarning?: string;
}

export interface LessonCheatSheet {
  lessonId: string;
  title: string;
  targetScore: string;
  formulaSummary: string;
  coreRules: string[];
  speedTricks: string[];
  commonTraps: string[];
  examChecklist: string[];
}
