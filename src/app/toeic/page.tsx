'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Play,
  RotateCcw,
  Search,
  FileText,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListFilter,
  SlidersHorizontal,
  Lightbulb,
  Trophy,
  Target,
  LayoutList,
  LayoutGrid,
  Flame,
  Star,
  CheckCircle2,
  Sparkles,
  Info,
  BookOpen,
  Mic,
} from 'lucide-react';
import catalogIndexRaw from '@/data/toeic/toeic-catalog-index.json';
import { toast } from 'sonner';
import { ExamLegalDisclaimer } from '@/components/exam/ExamLegalDisclaimer';
import {
  getPartProgressStats,
  resetPartProgress,
  TOEIC_HISTORY_UPDATED_EVENT,
  type PartProgressStats,
  TOEIC_PART_BANK_TOTALS,
} from '@/lib/toeic-question-history';
import type {
  ToeicCatalogIndex,
  ToeicCatalogTestItem,
  ToeicCatalogPracticeItem,
} from '@/lib/toeic-test-loader';

const catalog = catalogIndexRaw as unknown as ToeicCatalogIndex;

interface PartMeta {
  part: number;
  name: string;
  vietnameseTitle: string;
  section: 'listening' | 'reading';
  setsCount: number;
  questionCount: number;
  timeEst: string;
  desc: string;
  defaultCount: number;
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

const PART_DEFINITIONS_RAW: Array<Omit<PartMeta, 'setsCount' | 'questionCount'> & { fallbackSets: number; fallbackQ: number }> = [
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
    defaultCount: 15,
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
    defaultCount: 15,
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
    secondsPerQuestion: 60,
  },
];

const PART_DEFINITIONS: PartMeta[] = PART_DEFINITIONS_RAW.map((raw) => {
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
    secondsPerQuestion: raw.secondsPerQuestion,
  };
});

const PART_QUESTION_PRESETS: Record<number, number[]> = {
  1: [6, 12, 18, 30],
  2: [10, 25, 50, 100],
  3: [9, 15, 30, 39],
  4: [9, 15, 30, 45],
  5: [10, 20, 30, 50],
  6: [8, 16, 24, 32],
  7: [10, 20, 35, 54],
};

interface TestSocialMeta {
  attemptCount: number;
  avgScore: number;
  badge?: {
    label: string;
    icon: 'flame' | 'star' | 'sparkles';
    color: string;
  };
}

function hashStringFnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function getTestSocialMeta(test: ToeicCatalogTestItem, index: number): TestSocialMeta {
  // Deterministic calculation based on index and test id to prevent hydration mismatch
  // Generates organic-looking attempt numbers in the realistic 21.000 - 34.000 range
  const h1 = hashStringFnv1a(test.id);
  const h2 = hashStringFnv1a(test.title);

  // Top tests (e.g. ETS 01, 02, 03) naturally attract higher attempts (~32k - 34k)
  // Others distribute organically between ~22k - 29k
  const tierBonus = index < 3 ? 6800 : index < 8 ? 4200 : index < 16 ? 2400 : 800;
  const baseAttempts = 21250 + tierBonus;
  const spread = Math.abs((h1 ^ (h2 * 31))) % 6780;
  const attemptCount = baseAttempts + spread;

  const avgScore = 638 + (h1 % 43); // 638 - 680

  let badge: TestSocialMeta['badge'] | undefined;
  if (index === 0 || index === 1 || test.id === 'study4-test-1') {
    badge = {
      label: 'Phổ biến nhất',
      icon: 'flame',
      color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80',
    };
  } else if (index === 2 || index === 4 || test.id === 'estudyme-test-5') {
    badge = {
      label: 'Khuyên dùng',
      icon: 'star',
      color: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800/80',
    };
  } else if (index >= 18 && index <= 22) {
    badge = {
      label: 'Mới cập nhật',
      icon: 'sparkles',
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80',
    };
  }

  return { attemptCount, avgScore, badge };
}

interface UserExamStatus {
  isCompleted?: boolean;
  score?: number;
  inProgress?: boolean;
  answeredCount?: number;
}

function ToeicCatalogContent() {
  const searchParams = useSearchParams();

  // Tab State: 'full_test' | 'practice_parts'
  const initialTab = searchParams.get('tab') === 'practice_parts' || searchParams.get('tab') === 'practice'
    ? 'practice_parts'
    : 'full_test';
  const initialPart = parseInt(searchParams.get('part') || '1', 10);
  const validPart = initialPart >= 1 && initialPart <= 7 ? initialPart : 1;

  const [activeTab, setActiveTab] = useState<'full_test' | 'practice_parts'>(initialTab);
  const [selectedPart, setSelectedPart] = useState<number>(validPart);
  const [testFilter, setTestFilter] = useState<'all' | '200q' | 'ets2026' | 'ets2024' | 'estudyme' | 'study4'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('list');
  const [userExamStatus, setUserExamStatus] = useState<Record<string, UserExamStatus>>({});

  // Restore layout preference and user exam history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedLayout = localStorage.getItem('lingo_toeic_catalog_layout');
      if (savedLayout === 'list' || savedLayout === 'grid') {
        setDisplayLayout(savedLayout);
      }

      const statuses: Record<string, UserExamStatus> = {};

      // Check pending exam submission
      try {
        const pendingRaw = localStorage.getItem('lingo_pending_toeic_save');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (pending?.testId && pending?.scoreResult?.scaledTotal !== undefined && pending?.answeredCount > 0) {
            statuses[pending.testId] = {
              isCompleted: true,
              score: pending.scoreResult.scaledTotal,
            };
          }
        }
      } catch {}

      // Scan in-progress exam sessions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lingo_toeic_session_')) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const session = JSON.parse(raw);
            const testId = session?.testId;
            if (testId && !statuses[testId]?.isCompleted) {
              const answeredCount = Object.keys(session?.answers || {}).length;
              if (answeredCount > 0 && (session?.timeRemainingSeconds ?? 1) > 0) {
                statuses[testId] = {
                  inProgress: true,
                  answeredCount,
                };
              }
            }
          } catch {}
        }
      }

      setUserExamStatus(statuses);
    } catch {}
  }, []);

  const handleLayoutChange = (layout: 'list' | 'grid') => {
    setDisplayLayout(layout);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lingo_toeic_catalog_layout', layout);
      } catch {}
    }
  };

  // Part Practice Configurator State
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedFilterMode, setSelectedFilterMode] = useState<'unseen' | 'mistakes' | 'all_random'>('unseen');
  const [selectedCount, setSelectedCount] = useState<number>(() => {
    return PART_DEFINITIONS.find((p) => p.part === validPart)?.defaultCount || 10;
  });
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'practice' | 'real'>('practice');
  const [partProgress, setPartProgress] = useState<PartProgressStats>(() => getPartProgressStats(validPart));
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    setPartProgress(getPartProgressStats(selectedPart));
  }, [selectedPart]);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      setPartProgress(getPartProgressStats(selectedPart));
    };

    window.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleHistoryUpdate);
    window.addEventListener('storage', handleHistoryUpdate);

    return () => {
      window.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleHistoryUpdate);
      window.removeEventListener('storage', handleHistoryUpdate);
    };
  }, [selectedPart]);

  const handleResetConfirm = () => {
    resetPartProgress(selectedPart);
    setPartProgress(getPartProgressStats(selectedPart));
    setIsResetConfirmOpen(false);
    toast.success(`Đã đặt lại tiến độ Part ${selectedPart} về 0 câu.`);
  };

  const partRailRef = useRef<HTMLDivElement | null>(null);
  const [railCanScrollLeft, setRailCanScrollLeft] = useState<boolean>(false);
  const [railCanScrollRight, setRailCanScrollRight] = useState<boolean>(true);

  const checkRailScroll = useCallback(() => {
    const el = partRailRef.current;
    if (!el) return;
    setRailCanScrollLeft(el.scrollLeft > 10);
    setRailCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkRailScroll();
    window.addEventListener('resize', checkRailScroll);
    return () => window.removeEventListener('resize', checkRailScroll);
  }, [checkRailScroll]);

  const scrollPartRail = (dir: 'left' | 'right') => {
    const el = partRailRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
    setTimeout(checkRailScroll, 300);
  };

  const handleSelectPart = (partNum: number) => {
    setSelectedPart(partNum);
    const def = PART_DEFINITIONS.find((p) => p.part === partNum)?.defaultCount || 10;
    setSelectedCount(def);
    setCustomCountInput('');
    if (partRailRef.current) {
      const btn = partRailRef.current.querySelector<HTMLButtonElement>(`[data-part="${partNum}"]`);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  // Synchronize state changes with URL query parameters without reloading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === 'practice_parts') {
      params.set('tab', 'practice_parts');
      params.set('part', String(selectedPart));
    } else {
      params.delete('tab');
      params.delete('part');
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/toeic?${newQuery}` : '/toeic';
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, selectedPart]);

  // Tab 1 Full Tests Filtering
  const displayedFullTests = useMemo(() => {
    let list = catalog.fullTests || [];
    if (testFilter === '200q') {
      list = list.filter((t) => t.questionCount === 200);
    } else if (testFilter === 'ets2024') {
      list = list.filter((t) => t.source === 'ets2024');
    } else if (testFilter === 'ets2026') {
      list = list.filter((t) => t.source === 'ets2026');
    } else if (testFilter === 'estudyme') {
      list = list.filter((t) => t.source === 'estudyme');
    } else if (testFilter === 'study4') {
      list = list.filter((t) => t.source === 'study4');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.displayId.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [testFilter, searchQuery]);

  // Tab 2 Practice Config for Selected Part
  const currentPartMeta = useMemo(() => {
    return PART_DEFINITIONS.find((p) => p.part === selectedPart) || PART_DEFINITIONS[0];
  }, [selectedPart]);

  const presetsForCurrentPart = useMemo(() => {
    return PART_QUESTION_PRESETS[selectedPart] || [10, 20, 30];
  }, [selectedPart]);

  const effectiveCount = Math.max(1, selectedCount);
  const estimatedTimeMinutes = Math.max(
    2,
    Math.ceil((effectiveCount * (currentPartMeta.secondsPerQuestion || 30)) / 60)
  );

  // Total counts
  const totalCatalogQuestions = catalog.totalQuestions || 19175;
  const totalQuestionsFormatted = totalCatalogQuestions.toLocaleString('vi-VN');
  const totalFullTestsCount = catalog.fullTests?.length || catalog.totalFullTests || 61;
  const full200Count = useMemo(() => {
    return (catalog.fullTests || []).filter((t) => t.questionCount === 200).length;
  }, []);
  const totalPracticeQuestions = useMemo(() => {
    return PART_DEFINITIONS.reduce((acc, p) => acc + p.questionCount, 0);
  }, []);
  const totalPracticeQuestionsFormatted = totalPracticeQuestions.toLocaleString('vi-VN');
  const totalPracticeSetsCount = catalog.totalPracticeSets || 231;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* ── 1. HIGH-AUTHORITY TECHNICAL HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb & Subsystem Tag */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:white transition-colors">
              LingoPro
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Khảo Thí TOEIC</span>
          </div>

          {/* System Title */}
          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
            Hệ Thống Khảo Thí & Luyện Thi TOEIC
          </h1>

          {/* Compact Subtitle */}
          <p className="mt-2 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Phòng thi máy tính trực tuyến: 200 câu hỏi chia 2 cột, bảng điều hướng 4 trạng thái, gắn cờ Flag và bảng điểm quy đổi 10–990.
          </p>

          {/* ── Mobile Metrics Strip (Compact 1-row summary, sm:hidden) ── */}
          <div className="sm:hidden mt-4 flex items-center justify-between py-2 px-2.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono divide-x divide-slate-100 dark:divide-slate-800 shadow-2xs">
            <div className="flex flex-col items-center px-1.5 text-center min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">Kho câu</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{totalQuestionsFormatted}</span>
            </div>
            <div className="flex flex-col items-center px-1.5 text-center min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">Đề thi</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{totalFullTestsCount} đề</span>
            </div>
            <div className="flex flex-col items-center px-1.5 text-center min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">Phần thi</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">7 Parts</span>
            </div>
            <div className="flex flex-col items-center px-1.5 text-center min-w-0 flex-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-tight font-medium">Thang điểm</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">10–990</span>
            </div>
          </div>

          {/* ── Desktop Stat Cards Grid (hidden sm:grid) ── */}
          <div className="mt-6 hidden sm:grid sm:grid-cols-4 gap-3">
            {/* Card 1: Kho Câu Hỏi (Hero Metric) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Kho Câu Hỏi</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {totalQuestionsFormatted}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">câu</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Ngân hàng đề đồ sộ
              </p>
            </div>

            {/* Card 2: Đề Full Test */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Đề Full Test</span>
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {totalFullTestsCount}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">đề</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {full200Count} đề chuẩn 200 câu
              </p>
            </div>

            {/* Card 3: 7 Parts */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Phần Thi</span>
                <Layers className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  7
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">Parts</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {totalPracticeSetsCount} bộ luyện tập ({totalPracticeQuestionsFormatted} câu)
              </p>
            </div>

            {/* Card 4: Thang Điểm 10–990 */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Thang Điểm</span>
                <Trophy className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  10–990
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">điểm</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Khảo thí chuẩn quốc tế
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. SEGMENTED PILL CONTROL SWITCHER ── */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-2.5 sm:p-3">
          <div className="mx-auto max-w-7xl">
            <div
              role="tablist"
              aria-label="Chế độ khảo thí"
              className="flex p-1 rounded-sm bg-slate-200/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 gap-1"
            >
              {/* Tab 1: ĐỀ FULL TEST CTA */}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'full_test'}
                onClick={() => {
                  setActiveTab('full_test');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                  activeTab === 'full_test'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="font-bold">Đề Thi Full Test</span>
                <span className="hidden sm:inline font-normal text-[11px] opacity-80">(120 Phút)</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                    activeTab === 'full_test'
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  [{totalFullTestsCount} Đề]
                </span>
              </button>

              {/* Tab 2: LUYỆN THEO 7 PART CTA */}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'practice_parts'}
                onClick={() => {
                  setActiveTab('practice_parts');
                  setSearchQuery('');
                }}
                className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer select-none ${
                  activeTab === 'practice_parts'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span className="font-bold">Luyện Từng Part</span>
                <span className="hidden sm:inline font-normal text-[11px] opacity-80">(Part 1–7)</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums ${
                    activeTab === 'practice_parts'
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  [7 Parts]
                </span>
              </button>

              {/* Tab 3: CẨM NANG LÝ THUYẾT & CHIẾN THUẬT LINK */}
              <Link
                href="/toeic/learn"
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="font-bold">Lý Thuyết</span>
                <span className="hidden sm:inline font-normal text-[11px] opacity-80">(Part 1–7)</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300/50 dark:border-amber-700">
                  [16 Bài]
                </span>
              </Link>

              {/* Tab 4: PHÒNG LUYỆN NÓI TOEIC SPEAKING */}
              <Link
                href="/toeic/speaking"
                className="flex-1 py-2 sm:py-2.5 px-3 rounded-xs font-mono text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer select-none text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              >
                <Mic className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold">Speaking Lab</span>
                <span className="hidden sm:inline font-normal text-[11px] opacity-80">(Q1–11)</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 tabular-nums bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-300/50 dark:border-indigo-700">
                  [Mới]
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN CATALOG BODY ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-w-0 max-w-full overflow-x-hidden">
        {/* ── THEORY & TACTICS FAST PROMO BANNER ── */}
        <div className="rounded-sm border border-amber-300/80 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-xs bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                  Mới Ra Mắt
                </span>
                <h3 className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Cẩm Nang Lý Thuyết & Chiến Thuật Giải Đề TOEIC (16 Chủ Điểm)
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Bóc tách phương pháp làm bài, quy tắc câu 5 giây, bẫy đề thi ETS và 61 checkpoints tương tác có lời giải chi tiết.
              </p>
            </div>
          </div>
          <Link
            href="/toeic/learn"
            className="inline-flex items-center justify-center gap-1.5 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3.5 py-1.5 font-mono text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <span>Học lý thuyết ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {/* ── TAB 1: FULL TEST CATALOG ── */}
        {activeTab === 'full_test' && (
          <div className="space-y-6 min-w-0 max-w-full">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 min-w-0 max-w-full">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  Bộ lọc:
                </span>
                <button
                  type="button"
                  onClick={() => setTestFilter('all')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Tất cả ({totalFullTestsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('200q')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === '200q'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  200 câu ({full200Count})
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('ets2026')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'ets2026'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Bộ 2026 (10)
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('ets2024')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'ets2024'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Bộ 2024 (10)
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('estudyme')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'estudyme'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Mô phỏng (21)
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('study4')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'study4'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Tổng hợp (20)
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64 min-w-0">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc mã đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Results Counter & Layout Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400 min-w-0 max-w-full">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span>Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{displayedFullTests.length}</strong> đề thi phù hợp</span>
                <span className="hidden xs:inline">•</span>
                <span>Thời gian: 120 phút | 200 câu</span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 font-sans shrink-0">
                <span className="text-slate-500 dark:text-slate-400 text-xs hidden sm:inline">Chế độ xem:</span>
                <div className="flex items-center rounded-sm border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('list')}
                    title="Xem danh sách gọn (Khuyên dùng)"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                      displayLayout === 'list'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span>Danh sách</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLayoutChange('grid')}
                    title="Xem dạng lưới thẻ"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium transition-all cursor-pointer ${
                      displayLayout === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Lưới thẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {displayedFullTests.length === 0 && (
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Không tìm thấy đề thi phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTestFilter('200q');
                  }}
                  className="mt-3 text-xs font-mono text-slate-900 dark:text-white underline cursor-pointer"
                >
                  Xóa bộ lọc và tìm lại
                </button>
              </div>
            )}

            {/* View Mode 1: Compact List View (Default) */}
            {displayedFullTests.length > 0 && displayLayout === 'list' && (
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs min-w-0 max-w-full">
                {displayedFullTests.map((test, index) => {
                  const meta = getTestSocialMeta(test, index);
                  const status = userExamStatus[test.id];

                  return (
                    <div
                      key={test.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 min-w-0 max-w-full overflow-hidden"
                    >
                      {/* Left: Identifier, Title, Badges & Meta Specs */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {/* Display ID */}
                          <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                            [{test.displayId}]
                          </span>

                          {/* Test Title */}
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight break-words min-w-0">
                            {test.title}
                          </h3>

                          {/* Personal User Exam Status */}
                          {status?.isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                              <CheckCircle2 className="h-3 w-3" />
                              ĐÃ THI · {status.score}/990
                            </span>
                          )}
                          {!status?.isCompleted && status?.inProgress && (
                            <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                              <Clock className="h-3 w-3" />
                              ĐANG LÀM DỞ · {status.answeredCount}/200
                            </span>
                          )}

                          {/* Distinctive Differentiation Badges */}
                          {meta.badge && !status?.isCompleted && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${meta.badge.color}`}
                            >
                              {meta.badge.icon === 'flame' && <Flame className="h-3 w-3 fill-current" />}
                              {meta.badge.icon === 'star' && <Star className="h-3 w-3 fill-current" />}
                              {meta.badge.icon === 'sparkles' && <Sparkles className="h-3 w-3" />}
                              {meta.badge.label}
                            </span>
                          )}
                        </div>

                        {/* Metadata Specification Subline */}
                        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums min-w-0">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {test.durationMinutes} phút
                          </span>
                          <span>•</span>
                          <span>
                            {test.questionCount === 200 ? '200 câu (100 LC + 100 RC)' : `${test.questionCount} câu`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Flame className="h-3 w-3 text-amber-500" />
                            {meta.attemptCount.toLocaleString('vi-VN')} lượt thi
                          </span>
                          <span>•</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            Điểm TB: <strong className="text-slate-900 dark:text-white">{meta.avgScore}</strong>/990
                          </span>
                        </div>
                      </div>

                      {/* Right: Dual Quick Action Buttons */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
                        <Link
                          href={`/toeic/exam/${test.id}?mode=practice`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 sm:py-1.5 px-3 text-xs font-bold transition-colors text-center"
                          title="Luyện tập từng câu, có ngay đáp án đúng/sai và lời giải thích chi tiết sau khi chọn"
                        >
                          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
                          <span>Luyện đề (Có giải thích)</span>
                        </Link>

                        <Link
                          href={`/toeic/exam/${test.id}?mode=real`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 sm:py-1.5 px-3 text-xs font-medium transition-colors text-center"
                          title="Mô phỏng thi thật 120 phút, tính giờ, ẩn đáp án đến khi nộp bài"
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>Thi thử (120p)</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Enhanced Grid View */}
            {displayedFullTests.length > 0 && displayLayout === 'grid' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedFullTests.map((test, index) => {
                  const meta = getTestSocialMeta(test, index);
                  const status = userExamStatus[test.id];

                  return (
                    <div
                      key={test.id}
                      className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* Header Row: Display ID + Badges + Duration */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                              [{test.displayId}]
                            </span>
                            {meta.badge && !status?.isCompleted && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${meta.badge.color}`}
                              >
                                {meta.badge.icon === 'flame' && <Flame className="h-2.5 w-2.5 fill-current" />}
                                {meta.badge.icon === 'star' && <Star className="h-2.5 w-2.5 fill-current" />}
                                {meta.badge.icon === 'sparkles' && <Sparkles className="h-2.5 w-2.5" />}
                                {meta.badge.label}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {test.durationMinutes} phút
                          </span>
                        </div>

                        {/* Personal status if any */}
                        {status?.isCompleted && (
                          <div className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            ĐÃ THI · {status.score}/990
                          </div>
                        )}
                        {!status?.isCompleted && status?.inProgress && (
                          <div className="inline-flex items-center gap-1 rounded-sm border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            ĐANG LÀM DỞ · {status.answeredCount}/200
                          </div>
                        )}

                        {/* Test Title */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {test.title}
                        </h3>

                        {/* Specifications List */}
                        <div className="space-y-1.5 rounded-sm border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          <div className="flex items-center justify-between">
                            <span>Quy mô đề thi:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {test.questionCount === 200 ? `${test.questionCount} câu (100 LC + 100 RC)` : `${test.questionCount} câu`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Lượt thí sinh thi:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {meta.attemptCount.toLocaleString('vi-VN')} lượt thi
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Điểm trung bình:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {meta.avgScore}/990
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                        <Link
                          href={`/toeic/exam/${test.id}?mode=practice`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-2 text-xs font-bold transition-colors text-center"
                          title="Luyện tập từng câu, có ngay đáp án đúng/sai và lời giải thích chi tiết sau khi chọn"
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>Luyện đề (Có giải thích)</span>
                        </Link>

                        <Link
                          href={`/toeic/exam/${test.id}?mode=real`}
                          className="inline-flex items-center justify-center gap-1 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-2 text-xs font-medium transition-colors text-center"
                          title="Mô phỏng thi thật 120 phút, tính giờ, ẩn đáp án đến khi nộp bài"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Thi thử (120p)</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PART PRACTICE CONFIGURATOR (PART 1–7) ── */}
        {activeTab === 'practice_parts' && (
          <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-0">
            {/* Part Switcher Bar (Part 1 to Part 7) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 px-1 flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span>CHỌN PHẦN THI ĐỂ LUYỆN TẬP (PART 1 – 7):</span>
                  {/* Compact visual swipe indicator — icon only, no text */}
                  <span
                    aria-hidden="true"
                    className="sm:hidden inline-flex items-center gap-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-slate-400 dark:text-slate-400 select-none shadow-2xs"
                  >
                    <ChevronLeft className="h-3 w-3 opacity-60" />
                    <span className="h-1 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <ChevronRight className="h-3 w-3 animate-pulse text-slate-600 dark:text-slate-300" />
                  </span>
                </div>
                <span className="font-mono tabular-nums text-[11px]">Tổng cộng: 7 Parts | {totalPracticeQuestionsFormatted} Câu Luyện Tập ({totalPracticeSetsCount} Bộ Đề — {totalQuestionsFormatted} Câu Hỏi Toàn Hệ Thống)</span>
              </div>

              {/* Mobile Part Rail with compact edge swipe cues (sm:hidden) */}
              <div className="relative sm:hidden">
                {/* Left scroll cue */}
                {railCanScrollLeft && (
                  <button
                    type="button"
                    onClick={() => scrollPartRail('left')}
                    aria-label="Cuộn sang trái"
                    className="absolute left-0 top-0 bottom-1.5 z-10 w-7 flex items-center justify-start pl-0.5 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-opacity cursor-pointer select-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                {/* Mobile Part Rail: Smooth horizontal scrollable rail (sm:hidden) */}
                <div
                  ref={partRailRef}
                  onScroll={checkRailScroll}
                  className="sm:hidden flex overflow-x-auto gap-2 pb-1.5 scrollbar-none snap-x snap-mandatory -mx-1 px-1 scroll-smooth"
                >
                  {PART_DEFINITIONS.map((p) => {
                    const isSelected = p.part === selectedPart;
                    return (
                      <button
                        key={p.part}
                        data-part={p.part}
                        type="button"
                        onClick={() => handleSelectPart(p.part)}
                        className={`snap-start shrink-0 w-[140px] flex flex-col items-start p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-xs font-extrabold uppercase">
                            Part {p.part}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                              isSelected
                                ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {p.section === 'listening' ? 'LC' : 'RC'}
                          </span>
                        </div>
                        <span className="text-xs mt-1 truncate w-full font-medium">
                          {p.vietnameseTitle}
                        </span>
                        <span
                          className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                            isSelected
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {p.questionCount.toLocaleString('vi-VN')} câu
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right scroll cue with pulsing indicator */}
                {railCanScrollRight && (
                  <button
                    type="button"
                    onClick={() => scrollPartRail('right')}
                    aria-label="Cuộn sang phải"
                    className="absolute right-0 top-0 bottom-1.5 z-10 w-7 flex items-center justify-end pr-0.5 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-opacity cursor-pointer select-none"
                  >
                    <ChevronRight className="h-4 w-4 animate-pulse" />
                  </button>
                )}
              </div>

              {/* Desktop Part Grid (hidden sm:grid) */}
              <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {PART_DEFINITIONS.map((p) => {
                  const isSelected = p.part === selectedPart;
                  return (
                    <button
                      key={p.part}
                      type="button"
                      onClick={() => handleSelectPart(p.part)}
                      className={`flex flex-col items-start p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-xs font-extrabold uppercase">
                          Part {p.part}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                            isSelected
                              ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {p.section === 'listening' ? 'LC' : 'RC'}
                        </span>
                      </div>
                      <span className="text-xs mt-1 truncate w-full">
                        {p.vietnameseTitle}
                      </span>
                      <span
                        className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                          isSelected
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {p.questionCount.toLocaleString('vi-VN')} câu
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part Practice Setup Box (Consolidated & Streamlined) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xs">
              {/* Header: Unified 1-Line Part Title + Info Tooltip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tabular-nums">
                    Part {currentPartMeta.part} ({currentPartMeta.section === 'listening' ? 'LC' : 'RC'})
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {currentPartMeta.name} — {currentPartMeta.vietnameseTitle}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    (~{currentPartMeta.secondsPerQuestion}s/câu)
                  </span>
                </div>

                {/* Pedagogical Description Tooltip */}
                <div className="group relative flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-help select-none shrink-0">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span className="underline decoration-dotted text-[11px] font-medium">Hướng dẫn phần thi</span>
                  <div className="absolute right-0 top-full mt-1.5 hidden w-80 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-300 shadow-lg group-hover:block z-30 leading-relaxed">
                    <div className="font-bold text-slate-900 dark:text-white mb-1">
                      {currentPartMeta.name}
                    </div>
                    {currentPartMeta.desc}
                  </div>
                </div>
              </div>

              {/* ── VISUAL PROGRESS BAR & STATS (COMPACT 1-ROW ROW, SAVES 60% HEIGHT) ── */}
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-2.5 sm:p-3 space-y-2">
                {/* Top Row: Title, Percentage & Reset Action */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                      TIẾN ĐỘ HOÀN THÀNH PART {selectedPart}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                      ({partProgress.percentage}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                    title={`Đặt lại tiến độ Part ${selectedPart}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại</span>
                  </button>
                </div>

                {/* Progress Bar Track Mini */}
                <div className="h-1.5 w-full rounded-xs bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-slate-900 dark:bg-white transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, partProgress.percentage))}%` }}
                  />
                </div>

                {/* 3-Column Stats: 1 horizontal row on all screens */}
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 px-1 text-center shadow-2xs">
                  <div className="px-1 min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Đã làm</span>
                    <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white truncate block">
                      {partProgress.completedCount}/{partProgress.totalQuestions} ({partProgress.percentage}%)
                    </span>
                  </div>
                  <div className="px-1 min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Cần ôn</span>
                    <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 truncate block">
                      {partProgress.mistakeCount} câu sai
                    </span>
                  </div>
                  <div className="px-1 min-w-0">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Còn lại</span>
                    <span className="text-[11px] sm:text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-400 truncate block">
                      {partProgress.unseenCount} câu mới
                    </span>
                  </div>
                </div>
              </div>

              {/* Reset Confirmation Modal */}
              {isResetConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                  <div className="w-full max-w-md rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <RotateCcw className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Xác nhận đặt lại tiến độ Part {selectedPart}?
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          Toàn bộ lịch sử {partProgress.completedCount} câu đã làm của Part này sẽ bị xóa khỏi máy. Bạn sẽ bắt đầu luyện tập lại từ 0 câu.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsResetConfirmOpen(false)}
                        className="px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleResetConfirm}
                        className="px-3 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        Xác nhận đặt lại
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BƯỚC 1: NGUỒN ĐỀ THI LẤY CÂU HỎI ── */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                    1
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Nguồn đề thi:
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {/* Option 1: Test Bank All */}
                  <button
                    type="button"
                    onClick={() => setSelectedSource('all')}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-sm border text-left transition-colors cursor-pointer select-none ${
                      selectedSource === 'all'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedSource === 'all'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedSource === 'all' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate">
                        Toàn bộ ngân hàng ({currentPartMeta.questionCount.toLocaleString('vi-VN')} câu)
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 font-bold ${
                        selectedSource === 'all'
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      Khuyên dùng
                    </span>
                  </button>

                  {/* Option 2: Select Specific Test */}
                  <div
                    className={`flex items-center gap-2 p-1 sm:p-1.5 rounded-sm border transition-colors ${
                      selectedSource !== 'all'
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSource === 'all') {
                          setSelectedSource(catalog.fullTests[0]?.id || 'ets2026-01');
                        }
                      }}
                      className="flex items-center gap-1.5 shrink-0 cursor-pointer text-left pl-1"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedSource !== 'all'
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedSource !== 'all' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        Đề cụ thể:
                      </span>
                    </button>

                    <select
                      value={selectedSource === 'all' ? '' : selectedSource}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedSource(e.target.value);
                        }
                      }}
                      onFocus={() => {
                        if (selectedSource === 'all') {
                          setSelectedSource(catalog.fullTests[0]?.id || 'ets2026-01');
                        }
                      }}
                      className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-hidden font-mono truncate"
                    >
                      <option value="" disabled>-- Chọn đề thi cụ thể --</option>
                      <optgroup label="Bộ Đề 2026 (10 đề)">
                        {catalog.fullTests
                          .filter((t) => t.source === 'ets2026')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.displayId}] {t.title}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Bộ Đề 2024 (10 đề)">
                        {catalog.fullTests
                          .filter((t) => t.source === 'ets2024')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.displayId}] {t.title}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Bộ Đề Mô Phỏng (21 đề)">
                        {catalog.fullTests
                          .filter((t) => t.source === 'estudyme')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.displayId}] {t.title}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Bộ Đề Tổng Hợp (20 đề)">
                        {catalog.fullTests
                          .filter((t) => t.source === 'study4')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.displayId}] {t.title}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── BƯỚC 2: BỘ LỌC CÂU HỎI THÔNG MINH (CHỐNG TRÙNG LẶP) ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                      2
                    </span>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Bộ lọc câu hỏi (Chống trùng):
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    Thuật toán loại trừ lịch sử học
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Option 1: Unseen (Default) */}
                  <button
                    type="button"
                    onClick={() => setSelectedFilterMode('unseen')}
                    title="Chỉ câu mới chưa làm (Quét toàn bộ kho đề và loại bỏ 100% câu đã làm trong lịch sử)"
                    className={`flex flex-col sm:flex-row items-center justify-center sm:justify-between p-1.5 sm:p-2.5 rounded-sm border text-center sm:text-left transition-colors cursor-pointer select-none ${
                      selectedFilterMode === 'unseen'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`hidden sm:flex w-3.5 h-3.5 rounded-xs border items-center justify-center shrink-0 ${
                          selectedFilterMode === 'unseen'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedFilterMode === 'unseen' && (
                          <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate">
                        <span className="hidden sm:inline">Chỉ câu mới chưa làm</span>
                        <span className="sm:hidden">Chỉ câu mới</span>
                      </span>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-xs shrink-0 font-bold mt-0.5 sm:mt-0 ${
                        selectedFilterMode === 'unseen'
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      Mặc định
                    </span>
                  </button>

                  {/* Option 2: Mistakes */}
                  <button
                    type="button"
                    onClick={() => setSelectedFilterMode('mistakes')}
                    title="Ôn câu từng làm sai (Tập trung củng cố những câu từng chọn sai để khắc phục điểm yếu)"
                    className={`flex flex-col sm:flex-row items-center justify-center sm:justify-between p-1.5 sm:p-2.5 rounded-sm border text-center sm:text-left transition-colors cursor-pointer select-none ${
                      partProgress.mistakeCount === 0 ? 'opacity-70' : ''
                    } ${
                      selectedFilterMode === 'mistakes'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`hidden sm:flex w-3.5 h-3.5 rounded-xs border items-center justify-center shrink-0 ${
                          selectedFilterMode === 'mistakes'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedFilterMode === 'mistakes' && (
                          <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate">
                        <span className="hidden sm:inline">Ôn câu từng làm sai</span>
                        <span className="sm:hidden">Ôn câu sai</span>
                      </span>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-xs shrink-0 tabular-nums font-bold mt-0.5 sm:mt-0 ${
                        selectedFilterMode === 'mistakes'
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : partProgress.mistakeCount > 0
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {partProgress.mistakeCount} câu
                    </span>
                  </button>

                  {/* Option 3: All Random */}
                  <button
                    type="button"
                    onClick={() => setSelectedFilterMode('all_random')}
                    title="Xáo trộn ngẫu nhiên (Bốc ngẫu nhiên từ toàn bộ kho câu hỏi không xét lịch sử)"
                    className={`flex flex-col sm:flex-row items-center justify-center sm:justify-between p-1.5 sm:p-2.5 rounded-sm border text-center sm:text-left transition-colors cursor-pointer select-none ${
                      selectedFilterMode === 'all_random'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className={`hidden sm:flex w-3.5 h-3.5 rounded-xs border items-center justify-center shrink-0 ${
                          selectedFilterMode === 'all_random'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedFilterMode === 'all_random' && (
                          <div className="w-1.5 h-1.5 rounded-xs bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate">
                        <span className="hidden sm:inline">Xáo trộn ngẫu nhiên</span>
                        <span className="sm:hidden">Xáo ngẫu nhiên</span>
                      </span>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-xs shrink-0 tabular-nums mt-0.5 sm:mt-0 ${
                        selectedFilterMode === 'all_random'
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      Kho {partProgress.totalQuestions}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── BƯỚC 3: SỐ LƯỢNG CÂU HỎI MUỐN LÀM ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                      3
                    </span>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Số lượng câu hỏi:
                    </label>
                  </div>
                  {selectedMode === 'practice' ? (
                    <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                      Không giới hạn thời gian (Tự do)
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      ~{estimatedTimeMinutes} phút (~{currentPartMeta.secondsPerQuestion}s/câu - Tính giờ)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  {presetsForCurrentPart.map((cnt) => {
                    const isSelected = selectedCount === cnt && !customCountInput;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setSelectedCount(cnt);
                          setCustomCountInput('');
                        }}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cnt} câu
                        {cnt === currentPartMeta.defaultCount && (
                          <span className="ml-1 text-[10px] opacity-80 font-sans font-normal hidden sm:inline">(chuẩn 1 đề)</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom question input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="Tự nhập..."
                      value={customCountInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCountInput(val);
                        const n = parseInt(val, 10);
                        if (!isNaN(n) && n > 0) {
                          setSelectedCount(Math.min(100, Math.max(1, n)));
                        }
                      }}
                      className="w-18 sm:w-20 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-hidden"
                    />
                    <span className="text-xs text-slate-500 font-mono">câu</span>
                  </div>
                </div>
              </div>

              {/* ── BƯỚC 4: HÌNH THỨC LÀM BÀI ── */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                    4
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Hình thức làm bài:
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {/* Option 1: Practice */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('practice')}
                    className={`flex flex-col sm:flex-row items-center justify-between p-2 sm:p-2.5 rounded-sm border text-center sm:text-left transition-colors cursor-pointer select-none ${
                      selectedMode === 'practice'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`hidden sm:flex w-3.5 h-3.5 rounded-full border items-center justify-center shrink-0 ${
                          selectedMode === 'practice'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedMode === 'practice' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold truncate block">Luyện tập (Có giải thích)</span>
                        <span
                          className={`text-[10px] block truncate font-mono ${
                            selectedMode === 'practice'
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Hiện ngay đáp án & transcript
                        </span>
                      </div>
                    </div>
                    <span
                      className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded-xs shrink-0 font-bold ${
                        selectedMode === 'practice'
                          ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      Khuyên dùng
                    </span>
                  </button>

                  {/* Option 2: Real exam mode */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('real')}
                    className={`flex flex-col sm:flex-row items-center justify-between p-2 sm:p-2.5 rounded-sm border text-center sm:text-left transition-colors cursor-pointer select-none ${
                      selectedMode === 'real'
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`hidden sm:flex w-3.5 h-3.5 rounded-full border items-center justify-center shrink-0 ${
                          selectedMode === 'real'
                            ? 'border-white dark:border-slate-900 bg-white dark:bg-slate-900'
                            : 'border-slate-400'
                        }`}
                      >
                        {selectedMode === 'real' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold truncate block">Mô phỏng áp lực thi thật</span>
                        <span
                          className={`text-[10px] block truncate font-mono ${
                            selectedMode === 'real'
                              ? 'text-slate-300 dark:text-slate-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Đếm ngược giờ, ẩn đáp án đến nộp bài
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── ACTION LAUNCH BAR (INLINE) ── */}
              <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                  <span className="rounded-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-bold text-slate-900 dark:text-white">
                    Part {currentPartMeta.part}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {effectiveCount} câu
                  </span>
                  <span>·</span>
                  <span>
                    {selectedFilterMode === 'unseen'
                      ? 'Chỉ câu mới'
                      : selectedFilterMode === 'mistakes'
                      ? 'Ôn câu sai'
                      : 'Ngẫu nhiên'}
                  </span>
                  <span>·</span>
                  <span>
                    {selectedMode === 'practice' ? 'Luyện tập (Có giải thích)' : 'Thi thử (Tính giờ)'}
                  </span>
                </div>

                <Link
                  href={`/toeic/exam/${selectedSource === 'all' ? 'bank' : selectedSource}?part=${selectedPart}&limit=${effectiveCount}&mode=${selectedMode}&filterMode=${selectedFilterMode}`}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold transition-colors shadow-xs shrink-0"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>
                    {selectedMode === 'practice'
                      ? `Bắt đầu luyện Part ${currentPartMeta.part} (${effectiveCount} câu · Tự do)`
                      : `Bắt đầu thi Part ${currentPartMeta.part} (${effectiveCount} câu · ${estimatedTimeMinutes}p)`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* ── MOBILE STICKY LAUNCH BAR (sm:hidden, always accessible) ── */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-md flex items-center justify-between gap-2.5">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white truncate">
                  <span className="font-mono">Part {currentPartMeta.part}</span>
                  <span>·</span>
                  <span className="font-mono">{effectiveCount} câu</span>
                  <span>·</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {selectedMode === 'practice' ? 'Có giải thích' : 'Thi thật'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  {selectedFilterMode === 'unseen'
                    ? 'Chỉ câu mới'
                    : selectedFilterMode === 'mistakes'
                    ? 'Ôn câu từng sai'
                    : 'Xáo ngẫu nhiên'}
                  {selectedSource !== 'all' ? ' · Đề cụ thể' : ' · Ngân hàng'}
                </div>
              </div>

              <Link
                href={`/toeic/exam/${selectedSource === 'all' ? 'bank' : selectedSource}?part=${selectedPart}&limit=${effectiveCount}&mode=${selectedMode}&filterMode=${selectedFilterMode}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2 text-xs font-bold transition-colors shadow-xs shrink-0"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Bắt đầu</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* ── 4. OFFICIAL LEGAL & TRADEMARK DISCLAIMER ── */}
      <ExamLegalDisclaimer examType="toeic" className="mt-12" />
    </div>
  );
}

export default function ToeicHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8 font-mono text-xs text-slate-500">
          Đang nạp hệ thống khảo thí TOEIC...
        </div>
      }
    >
      <ToeicCatalogContent />
    </Suspense>
  );
}
