import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import type { VstepExamCatalogItem, VstepSourceType } from '@/lib/vstep-types';

export interface VstepCatalogIndex {
  version: string;
  totalExams: number;
  totalPracticeSets: number;
  categories: Array<{
    id: string;
    titleVi: string;
    descriptionVi: string;
    badge: string;
  }>;
  sources?: Array<{
    id: string;
    name: string;
    descriptionVi: string;
    badge: string;
    totalItems: number;
  }>;
  items: VstepExamCatalogItem[];
}

export const catalog = catalogDataRaw as unknown as VstepCatalogIndex;

export const ITEMS_PER_PAGE = 12;

export type VstepPracticeSkill = 'listening' | 'reading' | 'writing' | 'speaking';
export type VstepActiveTab = 'full_mock' | 'skill_practice';
export type VstepTestFilter = 'all' | 'unattempted' | 'completed' | 'b1_b2' | 'c1';
export type VstepResetOption = 'listening' | 'reading' | 'exams' | 'all';

export interface VstepBankTotals {
  totalListening: number;
  totalReading: number;
  totalQuestions: number;
  totalExams: number;
  totalMockExams: number;
  totalPracticeSets: number;
  listeningPracticeSets: number;
  readingPracticeSets: number;
  writingPracticeSets: number;
  speakingPracticeSets: number;
  writingTasks: number;
  speakingTasks: number;
}

export interface VstepSkillProgressStats {
  answeredCount: number;
  totalCount: number;
  percentage: number;
  mistakeCount: number;
}

export interface VstepFilterCounts {
  status: Record<string, number>;
  levels: Record<string, number>;
  sources: Record<string, number>;
}

export const PRACTICE_SKILL_META: Record<
  VstepPracticeSkill,
  { label: string; title: string; help: string }
> = {
  listening: {
    label: 'KỸ NĂNG NGHE',
    title: 'Luyện Nghe Chuyên Sâu (Part 1–3) Kèm Audio CDN & Tapescript',
    help: 'Rèn luyện phản xạ nghe hiểu thông tin chi tiết, hội thoại đời sống và bài giảng học thuật chuẩn B1-B2-C1.',
  },
  reading: {
    label: 'KỸ NĂNG ĐỌC',
    title: 'Luyện Đọc Hiểu Chuyên Đề (Passage 1–4) Phân Tích Ý Chính',
    help: 'Rèn luyện kỹ năng đọc lướt (Skimming), quét chi tiết (Scanning) và suy luận ngữ cảnh từ các bài báo và đoạn văn học thuật.',
  },
  writing: {
    label: 'KỸ NĂNG VIẾT',
    title: 'Luyện Writing Task 1–2: Email/Letter & Academic Essay',
    help: 'Mỗi bộ gồm Task 1 tối thiểu 120 từ và Task 2 tối thiểu 250 từ, có hướng dẫn triển khai ý và bài mẫu khi hoàn thành.',
  },
  speaking: {
    label: 'KỸ NĂNG NÓI',
    title: 'Luyện Speaking Part 1–3 Theo Đồng Hồ 12 Phút',
    help: 'Luyện Social Interaction, Solution Discussion và Topic Development theo đúng cấu trúc VSTEP, kèm gợi ý sau khi hoàn thành.',
  },
};

export function normalizeViText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function getPaginationPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export function formatAttemptDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export function getSourceBadge(source?: VstepSourceType) {
  switch (source) {
    case 'onthivstep':
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-xs border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
          Đọc Chuyên Đề
        </span>
      );
    case 'englishteststore':
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-xs border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
          Luyện Tương Tác
        </span>
      );
    case 'vnu':
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-xs border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
          Chuẩn ĐHQG
        </span>
      );
    case 'vstepowl':
    default:
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-xs border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Khảo Thí Chuẩn
        </span>
      );
  }
}
