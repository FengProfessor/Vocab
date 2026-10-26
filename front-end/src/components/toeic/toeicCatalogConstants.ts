import catalogIndexRaw from '@/data/toeic/toeic-catalog-index.json';
import {
  TOEIC_PART_BANK_TOTALS,
  type PartProgressStats,
} from '@/lib/toeic-question-history';
import type {
  ToeicCatalogIndex,
  ToeicCatalogTestItem,
} from '@/lib/toeic-test-loader';

export const catalog = catalogIndexRaw as unknown as ToeicCatalogIndex;

export const TESTS_PER_PAGE = 10;

export interface PartMeta {
  part: number;
  name: string;
  vietnameseTitle: string;
  section: 'listening' | 'reading';
  setsCount: number;
  questionCount: number;
  timeEst: string;
  desc: string;
  defaultCount: number;
  standardCount: number;
  secondsPerQuestion: number;
}

function getCatalogPartStats(partNum: number, fallbackSets: number, fallbackQ: number) {
  const list = catalog?.practiceParts?.[String(partNum)];
  if (Array.isArray(list) && list.length > 0) {
    const qCount = list.reduce((s, x) => s + (x.questionCount || 0), 0);
    return { setsCount: list.length, questionCount: qCount };
  }
  return { setsCount: fallbackSets, questionCount: fallbackQ };
}

const PART_DEFINITIONS_RAW: Array<
  Omit<PartMeta, 'setsCount' | 'questionCount'> & { fallbackSets: number; fallbackQ: number }
> = [
  {
    part: 1,
    name: 'Part 1: Photographs',
    vietnameseTitle: 'Mô tả hình ảnh',
    section: 'listening',
    fallbackSets: 35,
    fallbackQ: 210,
    timeEst: '~40s / câu',
    desc: 'Quan sát tranh ảnh thực tế và nghe 4 phương án mô tả (A, B, C, D). Luyện phản xạ nhận diện hành động, vị trí và ngữ cảnh trực quan.',
    defaultCount: 6,
    standardCount: 6,
    secondsPerQuestion: 40,
  },
  {
    part: 2,
    name: 'Part 2: Question - Response',
    vietnameseTitle: 'Hỏi & Đáp phản xạ',
    section: 'listening',
    fallbackSets: 29,
    fallbackQ: 1543,
    timeEst: '~25s / câu',
    desc: 'Nghe 1 câu hỏi hoặc phát biểu và chọn 1 trong 3 câu phản hồi thích hợp nhất (A, B, C). Rèn luyện phản xạ phát âm, ngữ điệu và câu trả lời gián tiếp.',
    defaultCount: 25,
    standardCount: 25,
    secondsPerQuestion: 25,
  },
  {
    part: 3,
    name: 'Part 3: Short Conversations',
    vietnameseTitle: 'Hội thoại ngắn',
    section: 'listening',
    fallbackSets: 22,
    fallbackQ: 858,
    timeEst: '~35s / câu',
    desc: 'Nghe các đoạn đối thoại công sở & đời sống giữa 2-3 người (3 câu hỏi/đoạn). Bắt ý chính, chi tiết sự kiện và câu hỏi suy luận ngữ cảnh.',
    defaultCount: 3,
    standardCount: 39,
    secondsPerQuestion: 35,
  },
  {
    part: 4,
    name: 'Part 4: Short Talks',
    vietnameseTitle: 'Bài nói độc thoại',
    section: 'listening',
    fallbackSets: 23,
    fallbackQ: 1407,
    timeEst: '~35s / câu',
    desc: 'Nghe bài phát biểu, thông báo công cộng, tin tức hoặc tin nhắn thoại (3 câu hỏi/bài). Rèn luyện khả năng tóm tắt và ghi nhớ thông tin nhanh.',
    defaultCount: 3,
    standardCount: 30,
    secondsPerQuestion: 35,
  },
  {
    part: 5,
    name: 'Part 5: Incomplete Sentences',
    vietnameseTitle: 'Hoàn thành câu',
    section: 'reading',
    fallbackSets: 24,
    fallbackQ: 720,
    timeEst: '~25s / câu',
    desc: 'Điền từ vựng hoặc dạng ngữ pháp chuẩn xác vào chỗ trống câu đơn. Tổng ôn ngữ pháp trọng tâm, từ loại, liên từ và collocations công sở.',
    defaultCount: 30,
    standardCount: 30,
    secondsPerQuestion: 25,
  },
  {
    part: 6,
    name: 'Part 6: Text Completion',
    vietnameseTitle: 'Hoàn thành đoạn văn',
    section: 'reading',
    fallbackSets: 24,
    fallbackQ: 384,
    timeEst: '~40s / câu',
    desc: 'Đọc 4 bài văn ngắn (email, thông báo, thư ngỏ) và điền 4 vị trí trống mỗi bài. Luyện tư duy liên kết ý và chọn câu văn phù hợp mạch bài.',
    defaultCount: 16,
    standardCount: 16,
    secondsPerQuestion: 40,
  },
  {
    part: 7,
    name: 'Part 7: Reading Comprehension',
    vietnameseTitle: 'Đọc hiểu thực tế',
    section: 'reading',
    fallbackSets: 74,
    fallbackQ: 2427,
    timeEst: '~60s / câu',
    desc: 'Đọc hiểu văn bản thực tế bao gồm Đoạn đơn (Single), Đoạn đôi (Double) và Đoạn ba (Triple): email thương mại, hóa đơn, báo cáo, lịch trình.',
    defaultCount: 20,
    standardCount: 54,
    secondsPerQuestion: 60,
  },
];

export const PART_DEFINITIONS: PartMeta[] = PART_DEFINITIONS_RAW.map((raw) => {
  const stats = getCatalogPartStats(raw.part, raw.fallbackSets, raw.fallbackQ);
  return {
    part: raw.part,
    name: raw.name,
    vietnameseTitle: raw.vietnameseTitle,
    section: raw.section,
    setsCount: stats.setsCount,
    questionCount: stats.questionCount,
    timeEst: raw.timeEst,
    desc: raw.desc,
    defaultCount: raw.defaultCount,
    standardCount: raw.standardCount,
    secondsPerQuestion: raw.secondsPerQuestion,
  };
});

export const PART_QUESTION_PRESETS: Record<number, number[]> = {
  1: [6, 12, 18, 30],
  2: [10, 25, 50, 100],
  3: [3, 6, 9, 15, 30, 39],
  4: [3, 6, 9, 15, 21, 30],
  5: [10, 20, 30, 50],
  6: [8, 16, 24, 32],
  7: [10, 20, 35, 54],
};

export interface TestCatalogMeta {
  badge?: {
    label: string;
    icon: 'flame' | 'star' | 'sparkles';
    color: string;
  };
}

export function getTestMeta(test: ToeicCatalogTestItem, index: number): TestCatalogMeta {
  let badge: TestCatalogMeta['badge'] | undefined;
  if (test.source === 'ets2026') {
    badge = {
      label: 'Format 2026',
      icon: 'sparkles',
      color:
        'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80',
    };
  } else if (index < 3) {
    badge = {
      label: 'Bộ đề trọng tâm',
      icon: 'star',
      color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/80',
    };
  }

  return { badge };
}

export interface UserExamStatus {
  isCompleted?: boolean;
  score?: number;
  inProgress?: boolean;
  answeredCount?: number;
}

export type ToeicActiveTab = 'full_test' | 'practice_parts' | 'review_flagged';
export type ToeicListeningYear = 'all' | '2026' | '2024' | '2023' | '2022' | '2021' | '2020' | '2019';
export type ToeicTestFilter = 'all' | '200q' | 'ets2026' | 'ets2024' | 'estudyme' | 'study4';
export type ToeicFilterMode = 'unseen' | 'mistakes' | 'all_random';

export function emptyPartProgress(part: number): PartProgressStats {
  const totalQuestions = TOEIC_PART_BANK_TOTALS[part] || 0;
  return {
    part,
    completedCount: 0,
    totalQuestions,
    percentage: 0,
    mistakeCount: 0,
    unseenCount: totalQuestions,
    totalAnswered: 0,
    totalMistakes: 0,
    totalCorrect: 0,
    totalInBank: totalQuestions,
    completionPercentage: 0,
    accuracyPercentage: 0,
  };
}
