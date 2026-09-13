'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Play,
  RotateCcw,
  Search,
  Clock,
  Layers,
  Headphones,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Filter,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import {
  getVstepProgressStats,
  getVstepExamSummaries,
  clearVstepExamHistory,
  clearVstepSkillHistory,
  resetAllVstepHistory,
  VSTEP_HISTORY_UPDATED_EVENT,
  VstepPracticeFilterMode,
} from '@/lib/vstep-history';
import {
  VstepSkillType,
  VstepCefrLevel,
  VstepExamCatalogItem,
  VstepSourceType,
  VstepExamSummary,
} from '@/lib/vstep-types';

interface VstepCatalogIndex {
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

const catalog = catalogDataRaw as unknown as VstepCatalogIndex;

export const ITEMS_PER_PAGE = 12;

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

function VstepCatalogContent() {
  const searchParams = useSearchParams();

  // Tab State: 'full_mock' | 'skill_practice' (learned directly from TOEIC's 2-tab architecture)
  const initialTab =
    searchParams.get('tab') === 'skill_practice' ||
    searchParams.get('flow') === 'skill_practice' ||
    searchParams.get('tab') === 'practice'
      ? 'skill_practice'
      : 'full_mock';

  const [activeTab, setActiveTab] = useState<'full_mock' | 'skill_practice'>(initialTab);

  // Sub-skill when in 'skill_practice': 'listening' | 'reading' | 'writing_speaking'
  const initialSkill = searchParams.get('skill') === 'reading' ? 'reading' : 'listening';
  const [selectedPracticeSkill, setSelectedPracticeSkill] = useState<'listening' | 'reading' | 'writing_speaking'>(initialSkill);

  // Filtering & View Mode
  const [testFilter, setTestFilter] = useState<'all' | 'unattempted' | 'completed' | 'b1_b2' | 'c1'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('list');
  const [filterMode, setFilterMode] = useState<VstepPracticeFilterMode>('unseen');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // History & Completion tracking
  const [examSummaries, setExamSummaries] = useState<Record<string, VstepExamSummary>>({});
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  // Consolidated Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetOption, setResetOption] = useState<'listening' | 'reading' | 'exams' | 'all'>('listening');

  // Restore layout preference from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedLayout = localStorage.getItem('lingo_vstep_catalog_layout');
      if (savedLayout === 'list' || savedLayout === 'grid') {
        setDisplayLayout(savedLayout);
      }
    } catch {}
  }, []);

  const handleLayoutChange = (layout: 'list' | 'grid') => {
    setDisplayLayout(layout);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lingo_vstep_catalog_layout', layout);
      } catch {}
    }
  };

  // Pre-index search haystack
  const indexedItems = useMemo(() => {
    return catalog.items.map((item) => ({
      ...item,
      _searchKey: normalizeViText(
        [item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' ')
      ),
    }));
  }, []);

  // Dynamic Bank Totals calculation (5,604 objective questions across 190 tests)
  const bankTotals = useMemo(() => {
    let listening = 0;
    let reading = 0;
    for (const item of catalog.items) {
      if (item.category === 'full_mock') {
        listening += 35;
        reading += 40;
      } else if (item.category === 'listening' || item.skills?.includes('listening')) {
        listening += item.totalQuestions || 0;
      } else if (item.category === 'reading' || item.skills?.includes('reading')) {
        reading += item.totalQuestions || 0;
      }
    }
    return {
      totalListening: listening, // 2,960
      totalReading: reading,     // 2,644
      totalQuestions: listening + reading, // 5,604
      totalExams: catalog.items.length,    // 190
      totalMockExams: 24,
      totalPracticeSets: 166,
    };
  }, []);

  // Progress stats from localStorage
  const [listeningStats, setListeningStats] = useState({
    answeredCount: 0,
    totalCount: bankTotals.totalListening,
    percentage: 0,
    mistakeCount: 0,
  });
  const [readingStats, setReadingStats] = useState({
    answeredCount: 0,
    totalCount: bankTotals.totalReading,
    percentage: 0,
    mistakeCount: 0,
  });

  const refreshHistory = () => {
    setListeningStats(getVstepProgressStats('listening', bankTotals.totalListening));
    setReadingStats(getVstepProgressStats('reading', bankTotals.totalReading));
    setExamSummaries(getVstepExamSummaries());
  };

  useEffect(() => {
    setHasMounted(true);
    refreshHistory();

    const handleUpdate = () => refreshHistory();
    window.addEventListener(VSTEP_HISTORY_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(VSTEP_HISTORY_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [bankTotals]);

  // Aggregate completion stats for Full Mock and exams
  const examCompletionStats = useMemo(() => {
    let completedMockCount = 0;
    let highestScore = 0;
    let highestCefr: VstepCefrLevel = 'A2';

    if (!hasMounted) {
      return { completedMockCount: 0, highestScore: 0, highestCefr: 'A2' as VstepCefrLevel };
    }

    for (const item of catalog.items) {
      const summary = examSummaries[item.id];
      if (summary?.isCompleted) {
        if (item.category === 'full_mock') {
          completedMockCount++;
        }
        if (summary.highestScore > highestScore) {
          highestScore = summary.highestScore;
          highestCefr = summary.highestCefr;
        }
      }
    }

    return {
      completedMockCount,
      highestScore,
      highestCefr,
    };
  }, [examSummaries, hasMounted]);

  // Synchronize state changes with URL query parameters without full reload
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === 'skill_practice') {
      params.set('tab', 'skill_practice');
      params.set('skill', selectedPracticeSkill);
    } else {
      params.delete('tab');
      params.delete('skill');
      params.delete('flow');
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/vstep?${newQuery}` : '/vstep';
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, selectedPracticeSkill]);

  // Reset to page 1 on filter/search/tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedPracticeSkill, testFilter, selectedLevel, selectedSource, searchQuery]);

  // Filter items for current active tab
  const { filteredItems, counts } = useMemo(() => {
    const normQ = searchQuery.trim() ? normalizeViText(searchQuery.trim()) : '';

    let itemsToFilter = indexedItems;

    // Partition by Tab
    if (activeTab === 'full_mock') {
      itemsToFilter = itemsToFilter.filter((item) => item.category === 'full_mock');
    } else {
      // Skill Practice Tab
      if (selectedPracticeSkill === 'listening') {
        itemsToFilter = itemsToFilter.filter(
          (item) => item.category === 'listening' || item.skills?.includes('listening')
        );
      } else if (selectedPracticeSkill === 'reading') {
        itemsToFilter = itemsToFilter.filter(
          (item) => item.category === 'reading' || item.skills?.includes('reading')
        );
      } else {
        itemsToFilter = itemsToFilter.filter((item) => item.category === 'writing' || item.category === 'speaking');
      }
    }

    const levelCounts: Record<string, number> = { all: 0, B1: 0, B2: 0, C1: 0 };
    const statusCounts: Record<string, number> = { all: 0, unattempted: 0, completed: 0 };
    const sourceCounts: Record<string, number> = { all: 0, vstepowl: 0, onthivstep: 0, englishteststore: 0, vnu: 0 };

    const filtered: typeof indexedItems = [];

    for (let i = 0; i < itemsToFilter.length; i++) {
      const item = itemsToFilter[i];
      const isCompleted = hasMounted && Boolean(examSummaries[item.id]?.isCompleted);
      const itemLevel = item.cefrLevel || item.targetLevel || 'B2';
      const itemSource = item.source || 'vstepowl';

      // Count for filters
      statusCounts.all++;
      if (isCompleted) {
        statusCounts.completed++;
      } else {
        statusCounts.unattempted++;
      }

      levelCounts.all++;
      if (levelCounts[itemLevel] !== undefined) {
        levelCounts[itemLevel]++;
      }

      sourceCounts.all++;
      if (sourceCounts[itemSource] !== undefined) {
        sourceCounts[itemSource]++;
      }

      // Search match
      if (normQ && !item._searchKey.includes(normQ)) {
        continue;
      }

      // Filter match
      if (activeTab === 'full_mock') {
        if (testFilter === 'unattempted' && isCompleted) continue;
        if (testFilter === 'completed' && !isCompleted) continue;
        if (testFilter === 'b1_b2' && itemLevel === 'C1') continue;
        if (testFilter === 'c1' && itemLevel !== 'C1') continue;
      } else {
        // Practice filters
        if (testFilter === 'unattempted' && isCompleted) continue;
        if (testFilter === 'completed' && !isCompleted) continue;
        if (selectedLevel !== 'all' && itemLevel !== selectedLevel) continue;
        if (selectedSource !== 'all' && itemSource !== selectedSource) continue;
      }

      filtered.push(item);
    }

    return {
      filteredItems: filtered,
      counts: {
        status: statusCounts,
        levels: levelCounts,
        sources: sourceCounts,
      },
    };
  }, [
    indexedItems,
    activeTab,
    selectedPracticeSkill,
    testFilter,
    selectedLevel,
    selectedSource,
    searchQuery,
    hasMounted,
    examSummaries,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === safePage) return;
    setCurrentPage(page);
    const anchor = document.getElementById('catalog-controls');
    if (anchor) {
      const topOffset = anchor.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getSourceBadge = (source?: VstepSourceType) => {
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
  };

  // Safe progress reset
  const handleExecuteReset = () => {
    if (resetOption === 'listening') {
      clearVstepSkillHistory('listening');
      toast.success('Đã đặt lại tiến độ kỹ năng Nghe (Listening) về 0%!');
    } else if (resetOption === 'reading') {
      clearVstepSkillHistory('reading');
      toast.success('Đã đặt lại tiến độ kỹ năng Đọc (Reading) về 0%!');
    } else if (resetOption === 'exams') {
      clearVstepExamHistory();
      toast.success('Đã xóa toàn bộ lịch sử thi và bảng điểm đề thi!');
    } else if (resetOption === 'all') {
      resetAllVstepHistory();
      toast.success('Đã đặt lại toàn bộ tiến độ câu hỏi và điểm thi VSTEP!');
    }
    refreshHistory();
    setIsResetModalOpen(false);
  };

  const currentSkillProgress = selectedPracticeSkill === 'listening' ? listeningStats : readingStats;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans pb-20">
      {/* ── 1. TECHNICAL HEADER & HIGH-AUTHORITY SHELL (Modeled after TOEIC) ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb & Subsystem Tag */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              LingoPro
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Khảo Thí VSTEP</span>
          </div>

          {/* System Title */}
          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
            Hệ Thống Khảo Thí & Luyện Thi VSTEP
          </h1>

          {/* Compact Subtitle */}
          <p className="mt-2 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Phòng thi máy tính trực tuyến chuẩn định dạng B1-B2-C1: 24 Đề Full Mock 4 kỹ năng, 166 bài luyện chuyên sâu, chống trùng đề và barem điểm 10.0.
          </p>

          {/* ── Prominent Stat Cards Grid (Identical to TOEIC) ── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Card 1: 5.604 Câu Hỏi (Hero Metric) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Kho Câu Hỏi</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {bankTotals.totalQuestions.toLocaleString('vi-VN')}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">câu</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Nghe 2.960 · Đọc 2.644 câu
              </p>
            </div>

            {/* Card 2: 24 Đề Full Mock */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Đề Full Mock</span>
                <Award className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {bankTotals.totalMockExams}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">đề thi</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                4 kỹ năng · 172 phút thi
              </p>
            </div>

            {/* Card 3: 166 Bài Luyện */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Bài Luyện Tập</span>
                <Layers className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {bankTotals.totalPracticeSets}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">bài</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Nghe & Đọc chuyên sâu
              </p>
            </div>

            {/* Card 4: Thang Điểm 10.0 */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Barem Khảo Thí</span>
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  10.0
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">điểm</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Chuẩn 6 Bậc B1–B2–C1
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. PROMINENT 2-TAB CTA SWITCHER (Identical to TOEIC) ── */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 p-3 sm:p-4">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tablist">
              {/* Tab 1: ĐỀ FULL MOCK CTA */}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'full_mock'}
                onClick={() => {
                  setActiveTab('full_mock');
                  setSearchQuery('');
                  setTestFilter('all');
                }}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-sm border transition-all cursor-pointer text-left ${
                  activeTab === 'full_mock'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-base font-bold ${
                      activeTab === 'full_mock'
                        ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                        Đề Thi Full Mock (4 Kỹ Năng)
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        activeTab === 'full_mock'
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Mô phỏng 172 phút chuẩn phòng thi máy tính B1-B2-C1
                    </p>
                  </div>
                </div>

                <span
                  className={`hidden sm:inline-flex rounded-sm px-2.5 py-1 font-mono text-xs font-bold tabular-nums shrink-0 ${
                    activeTab === 'full_mock'
                      ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                      : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  [{bankTotals.totalMockExams} Đề]
                </span>
              </button>

              {/* Tab 2: LUYỆN KỸ NĂNG & CHUYÊN ĐỀ CTA */}
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'skill_practice'}
                onClick={() => {
                  setActiveTab('skill_practice');
                  setSearchQuery('');
                  setTestFilter('all');
                }}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-sm border transition-all cursor-pointer text-left ${
                  activeTab === 'skill_practice'
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-base font-bold ${
                      activeTab === 'skill_practice'
                        ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                        Luyện Tập Kỹ Năng & Chuyên Đề
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        activeTab === 'skill_practice'
                          ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Luyện Nghe & Đọc với cơ chế chống trùng & ôn câu sai
                    </p>
                  </div>
                </div>

                <span
                  className={`hidden sm:inline-flex rounded-sm px-2.5 py-1 font-mono text-xs font-bold tabular-nums shrink-0 ${
                    activeTab === 'skill_practice'
                      ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                      : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  [{bankTotals.totalPracticeSets} Bài]
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN CATALOG BODY ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* ── TAB 1: FULL MOCK CATALOG ── */}
        {activeTab === 'full_mock' && (
          <div className="space-y-6">
            {/* Filter & Search Bar (Single clean row like TOEIC) */}
            <div id="catalog-controls" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              {/* Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  <Filter className="h-3.5 w-3.5" />
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
                  Tất cả ({bankTotals.totalMockExams})
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('unattempted')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'unattempted'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Chưa làm ({counts.status.unattempted})
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('completed')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'completed'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Đã thi ({counts.status.completed})
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('b1_b2')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'b1_b2'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Mục tiêu B1–B2
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('c1')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'c1'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Mục tiêu C1 ({counts.levels.C1 || 0})
                </button>
              </div>

              {/* Instant Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã hoặc tên đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Counter & Layout Switcher (List vs Grid) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>
                  Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{filteredItems.length}</strong> đề thi phù hợp
                </span>
                <span>•</span>
                <span>Thời gian chuẩn: 172 phút | 75 trắc nghiệm + 2 Viết + 3 Nói</span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 font-sans">
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
            {filteredItems.length === 0 && (
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Không tìm thấy đề thi phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTestFilter('all');
                  }}
                  className="mt-3 text-xs font-mono text-slate-900 dark:text-white underline cursor-pointer"
                >
                  Xóa bộ lọc và tìm lại
                </button>
              </div>
            )}

            {/* View Mode 1: Compact List View (Default - Lean & Fast) */}
            {filteredItems.length > 0 && displayLayout === 'list' && (
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
                {paginatedItems.map((item) => {
                  const summary = hasMounted ? examSummaries[item.id] : undefined;
                  const isDone = Boolean(summary?.isCompleted);

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                    >
                      {/* Left: Identifier, Title, Badges & Meta Specs */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Display ID */}
                          <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                            [{item.id.toUpperCase()}]
                          </span>

                          {/* Test Title */}
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            {item.title}
                          </h3>

                          {/* Personal User Exam Status */}
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              ĐÃ THI · {summary?.highestScore.toFixed(1)}/10 (Bậc {summary?.highestCefr})
                            </span>
                          ) : (
                            item.id === 'vstep-mock-01' && (
                              <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80">
                                <Flame className="h-3 w-3 fill-current" />
                                Đề Khuyên Dùng
                              </span>
                            )
                          )}

                          {/* Source badge */}
                          {getSourceBadge(item.source)}

                          <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            Bậc {item.targetLevel || 'B1-B2-C1'}
                          </span>
                        </div>

                        {/* Metadata Specification Subline */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Clock className="h-3 w-3 text-slate-400" />
                            172 phút
                          </span>
                          <span>•</span>
                          <span>75 câu trắc nghiệm (Nghe 35, Đọc 40)</span>
                          <span>•</span>
                          <span>2 bài luận Viết</span>
                          <span>•</span>
                          <span>3 phần thi Nói</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Chuẩn Khung 6 Bậc
                          </span>
                        </div>
                      </div>

                      {/* Right: 1-Click Launch Button */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/vstep/exam/${item.id}?filter=unseen`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-1.5 px-3.5 text-xs font-bold transition-colors whitespace-nowrap"
                          title="Vào phòng thi máy tính 172 phút đầy đủ 4 kỹ năng"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Vào Phòng Thi (172p)</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Enhanced Grid View */}
            {filteredItems.length > 0 && displayLayout === 'grid' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => {
                  const summary = hasMounted ? examSummaries[item.id] : undefined;
                  const isDone = Boolean(summary?.isCompleted);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            [{item.id.toUpperCase()}]
                          </span>
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                            <Clock className="h-3 w-3 text-slate-400" />
                            172 phút
                          </span>
                        </div>

                        {isDone && (
                          <div className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            ĐÃ THI · {summary?.highestScore.toFixed(1)}/10
                          </div>
                        )}

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        <div className="space-y-1.5 rounded-sm border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                          <div className="flex items-center justify-between">
                            <span>Quy mô trắc nghiệm:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">75 câu (Nghe + Đọc)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tự luận & Nói:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">2 Viết + 3 Nói</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Cấp bậc chuẩn:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Bậc {item.targetLevel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/vstep/exam/${item.id}?filter=unseen`}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-3 text-xs font-bold transition-colors text-center"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Vào Phòng Thi (172p)</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-sm p-3 sm:px-4 shadow-xs">
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  Trang <span className="font-bold text-slate-800 dark:text-slate-200">{safePage}</span> / {totalPages} ({filteredItems.length} đề thi)
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage - 1)}
                    disabled={safePage === 1}
                    className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  {getPaginationPages(safePage, totalPages).map((p, idx) => {
                    if (p === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs font-mono text-slate-400 select-none">
                          …
                        </span>
                      );
                    }
                    const isCurrent = p === safePage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`min-w-[30px] h-[28px] px-1.5 rounded-sm text-xs font-mono tabular-nums transition-colors border ${
                          isCurrent
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: SKILL PRACTICE CONFIGURATOR (Modeled after TOEIC Part Practice) ── */}
        {activeTab === 'skill_practice' && (
          <div className="space-y-6">
            {/* Skill Switcher Bar (Listening vs Reading vs Writing/Speaking) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center justify-between">
                <span>CHỌN KỸ NĂNG LUYỆN TẬP CHUYÊN SÂU:</span>
                <span className="font-mono tabular-nums">Tổng cộng: 166 Bài Luyện | 5.604 Câu Hỏi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Listening Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPracticeSkill('listening')}
                  className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
                    selectedPracticeSkill === 'listening'
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                      <Headphones className="w-4 h-4" /> Kỹ Năng Nghe
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                        selectedPracticeSkill === 'listening'
                          ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      56 Đề
                    </span>
                  </div>
                  <span className="text-xs mt-1 truncate w-full">Listening Part 1–3 Audio R2</span>
                  <span
                    className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                      selectedPracticeSkill === 'listening'
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    2.960 câu hỏi
                  </span>
                </button>

                {/* Reading Card */}
                <button
                  type="button"
                  onClick={() => setSelectedPracticeSkill('reading')}
                  className={`flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer ${
                    selectedPracticeSkill === 'reading'
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Kỹ Năng Đọc
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase tabular-nums ${
                        selectedPracticeSkill === 'reading'
                          ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      110 Bài
                    </span>
                  </div>
                  <span className="text-xs mt-1 truncate w-full">Reading Passage 1–4 Chuyên Đề</span>
                  <span
                    className={`font-mono text-[11px] mt-0.5 tabular-nums ${
                      selectedPracticeSkill === 'reading'
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    2.644 câu hỏi
                  </span>
                </button>

                {/* Writing & Speaking Card */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('full_mock');
                    toast.info('Kỹ năng Viết & Nói được tích hợp trọn vẹn trong 24 Đề Thi Full Mock.');
                  }}
                  className="flex flex-col items-start p-3 rounded-sm border text-left transition-colors cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-extrabold uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" /> Viết & Nói
                    </span>
                    <span className="font-mono text-[10px] px-1 py-0.2 rounded-xs uppercase bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Full Mock
                    </span>
                  </div>
                  <span className="text-xs mt-1 truncate w-full">Task 1–2 Viết & Part 1–3 Nói</span>
                  <span className="font-mono text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                    Trong 24 Đề Toàn Diện
                  </span>
                </button>
              </div>
            </div>

            {/* Skill Practice Setup Box (Consolidated & Streamlined, exactly like TOEIC) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5 shadow-xs">
              {/* Header: Title + Info Tooltip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tabular-nums">
                    {selectedPracticeSkill === 'listening' ? 'KỸ NĂNG NGHE' : 'KỸ NĂNG ĐỌC'}
                  </span>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {selectedPracticeSkill === 'listening'
                      ? 'Luyện Nghe Chuyên Sâu (Part 1–3) Kèm Audio CDN & Tapescript'
                      : 'Luyện Đọc Hiểu Chuyên Đề (Passage 1–4) Phân Tích Ý Chính'}
                  </h2>
                </div>

                <div className="group relative flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-help select-none shrink-0">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <span className="underline decoration-dotted text-[11px] font-medium">Hướng dẫn kỹ năng</span>
                  <div className="absolute right-0 top-full mt-1.5 hidden w-80 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-600 dark:text-slate-300 shadow-lg group-hover:block z-30 leading-relaxed">
                    {selectedPracticeSkill === 'listening'
                      ? 'Rèn luyện phản xạ nghe hiểu thông tin chi tiết, hội thoại đời sống và bài giảng học thuật chuẩn B1-B2-C1.'
                      : 'Rèn luyện kỹ năng đọc lướt (Skimming), quét chi tiết (Scanning) và suy luận ngữ cảnh từ các bài báo và đoạn văn học thuật.'}
                  </div>
                </div>
              </div>

              {/* Visual Progress Bar & 3-Column Stats (Identical to TOEIC) */}
              <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    TIẾN ĐỘ HOÀN THÀNH KỸ NĂNG {selectedPracticeSkill === 'listening' ? 'NGHE' : 'ĐỌC'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetOption(selectedPracticeSkill === 'reading' ? 'reading' : 'listening');
                      setIsResetModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Đặt lại tiến độ kỹ năng này"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại tiến độ</span>
                  </button>
                </div>

                {/* Progress Bar Track */}
                <div className="h-2 w-full rounded-xs bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-slate-900 dark:bg-white transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, currentSkillProgress.percentage))}%` }}
                  />
                </div>

                {/* 3-Column Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Đã làm:</div>
                    <div className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {currentSkillProgress.answeredCount.toLocaleString('vi-VN')} / {currentSkillProgress.totalCount.toLocaleString('vi-VN')} câu ({currentSkillProgress.percentage}%)
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cần ôn:</div>
                    <div className="text-xs font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {currentSkillProgress.mistakeCount.toLocaleString('vi-VN')} câu từng làm sai
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-sm bg-white dark:bg-slate-950">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Còn lại:</div>
                    <div className="text-xs font-mono tabular-nums font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      {Math.max(0, currentSkillProgress.totalCount - currentSkillProgress.answeredCount).toLocaleString('vi-VN')} câu chưa làm
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: Chế độ chống trùng (Anti-duplication Mode) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                    1
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Chiến thuật nạp câu hỏi chống trùng lặp:
                  </label>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {/* Unseen Option */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('unseen')}
                    className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                      filterMode === 'unseen'
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          filterMode === 'unseen'
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {filterMode === 'unseen' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          Chỉ câu mới (Chống trùng 100%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Lọc bỏ toàn bộ câu đã làm trong lịch sử.
                      </p>
                    </div>
                  </button>

                  {/* Mistakes Option */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('mistakes')}
                    className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                      filterMode === 'mistakes'
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          filterMode === 'mistakes'
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {filterMode === 'mistakes' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          Ôn câu sai (Spaced Repetition)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Chỉ nạp các câu đã từng trả lời sai ({currentSkillProgress.mistakeCount} câu sẵn sàng).
                      </p>
                    </div>
                  </button>

                  {/* Random Option */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('all_random')}
                    className={`flex items-start gap-3 p-3.5 rounded-sm border text-left transition-colors cursor-pointer ${
                      filterMode === 'all_random'
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 ring-1 ring-slate-900 dark:ring-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          filterMode === 'all_random'
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {filterMode === 'all_random' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          Xáo trộn ngẫu nhiên
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Bốc ngẫu nhiên không hoàn lại từ kho câu hỏi.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Bộ lọc nguồn & cấp bậc */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold">
                    2
                  </span>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Bộ lọc nguồn đề & cấp bậc:
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    <option value="all">Tất Cả Nguồn Đề ({counts.sources.all})</option>
                    <option value="vstepowl">Khảo Thí Chuẩn Hóa ({counts.sources.vstepowl})</option>
                    <option value="onthivstep">Đọc Hiểu Chuyên Đề ({counts.sources.onthivstep})</option>
                    <option value="englishteststore">Trắc Nghiệm Tương Tác ({counts.sources.englishteststore})</option>
                    <option value="vnu">Đề Mẫu ĐHQGHN ({counts.sources.vnu})</option>
                  </select>

                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-mono"
                  >
                    <option value="all">Mọi Cấp Bậc ({counts.levels.all})</option>
                    <option value="B1">Mục Tiêu B1 ({counts.levels.B1})</option>
                    <option value="B2">Mục Tiêu B2 ({counts.levels.B2})</option>
                    <option value="C1">Mục Tiêu C1 ({counts.levels.C1})</option>
                  </select>

                  {/* 1-Click Launch Button for Skill Practice */}
                  {filteredItems.length > 0 && (
                    <Link
                      href={`/vstep/exam/${filteredItems[0].id}?filter=${filterMode}`}
                      className="ml-auto inline-flex items-center gap-2 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-4 text-xs font-bold transition-colors shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Bắt Đầu Luyện Nhanh (${filteredItems[0].id.toUpperCase()})</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Catalog List of Practice Sets for Selected Skill */}
            <div className="space-y-4">
              {/* Header subline with search and layout switcher */}
              <div id="catalog-controls" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>
                    Hiển thị <strong className="text-slate-900 dark:text-white tabular-nums">{filteredItems.length}</strong> bài luyện phù hợp
                  </span>
                  <span>•</span>
                  <span>Chế độ: <strong className="text-slate-900 dark:text-white uppercase">{filterMode}</strong></span>
                </div>

                <div className="flex items-center gap-3 font-sans">
                  {/* Search in practice */}
                  <div className="relative w-48 sm:w-56">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm bài luyện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Layout switch */}
                  <div className="flex items-center rounded-sm border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('list')}
                      title="Xem danh sách gọn"
                      className={`p-1 rounded-xs transition-all cursor-pointer ${
                        displayLayout === 'list'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLayoutChange('grid')}
                      title="Xem dạng lưới"
                      className={`p-1 rounded-xs transition-all cursor-pointer ${
                        displayLayout === 'grid'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact List View for Practice */}
              {filteredItems.length > 0 && displayLayout === 'list' && (
                <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs">
                  {paginatedItems.map((item) => {
                    const summary = hasMounted ? examSummaries[item.id] : undefined;
                    const isDone = Boolean(summary?.isCompleted);

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 hover:bg-slate-50/90 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                              [{item.id.toUpperCase()}]
                            </span>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                              {item.title}
                            </h3>

                            {isDone && (
                              <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                ĐÃ LÀM · {summary?.highestScore.toFixed(1)}/10
                              </span>
                            )}

                            {getSourceBadge(item.source)}

                            <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                              Bậc {item.targetLevel || 'B2'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {item.duration} phút
                            </span>
                            <span>•</span>
                            <span>{item.totalQuestions || 35} câu hỏi</span>
                            {item.totalTasks && (
                              <>
                                <span>•</span>
                                <span>{item.totalTasks} phần thi</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                          <Link
                            href={`/vstep/exam/${item.id}?filter=${filterMode}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-1.5 px-3.5 text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Luyện Tập Ngay</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grid View for Practice */}
              {filteredItems.length > 0 && displayLayout === 'grid' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            [{item.id.toUpperCase()}]
                          </span>
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {item.duration} phút
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-2 pt-1">
                          {getSourceBadge(item.source)}
                          <span className="font-mono text-xs text-slate-500">
                            {item.totalQuestions || 35} câu hỏi
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href={`/vstep/exam/${item.id}?filter=${filterMode}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-3 text-xs font-bold transition-colors text-center"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Luyện Tập Ngay</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-sm p-3 sm:px-4 shadow-xs">
                  <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Trang <span className="font-bold text-slate-800 dark:text-slate-200">{safePage}</span> / {totalPages} ({filteredItems.length} bài luyện)
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage - 1)}
                      disabled={safePage === 1}
                      className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>

                    {getPaginationPages(safePage, totalPages).map((p, idx) => {
                      if (p === 'ellipsis') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs font-mono text-slate-400 select-none">
                            …
                          </span>
                        );
                      }
                      const isCurrent = p === safePage;
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          className={`min-w-[30px] h-[28px] px-1.5 rounded-sm text-xs font-mono tabular-nums transition-colors border ${
                            isCurrent
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage + 1)}
                      disabled={safePage === totalPages}
                      className="px-2.5 py-1 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── 4. CONSOLIDATED RESET MODAL (Identical to TOEIC) ── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm max-w-lg w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Quản Lý Tiến Độ & Lịch Sử Khảo Thí
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chọn phạm vi dữ liệu bạn muốn đặt lại trên thiết bị này
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Listening */}
              <label
                className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
                  resetOption === 'listening'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="reset_option"
                  checked={resetOption === 'listening'}
                  onChange={() => setResetOption('listening')}
                  className="mt-1 text-blue-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    1. Đặt lại Kỹ Năng Nghe (Listening Bank)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Xóa lịch sử {listeningStats.answeredCount} câu Nghe đã làm và {listeningStats.mistakeCount} câu sai.
                  </p>
                </div>
              </label>

              {/* Option 2: Reading */}
              <label
                className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
                  resetOption === 'reading'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="reset_option"
                  checked={resetOption === 'reading'}
                  onChange={() => setResetOption('reading')}
                  className="mt-1 text-blue-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    2. Đặt lại Kỹ Năng Đọc (Reading Bank)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Xóa lịch sử {readingStats.answeredCount} câu Đọc đã làm và {readingStats.mistakeCount} câu sai.
                  </p>
                </div>
              </label>

              {/* Option 3: Exam History */}
              <label
                className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
                  resetOption === 'exams'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="reset_option"
                  checked={resetOption === 'exams'}
                  onChange={() => setResetOption('exams')}
                  className="mt-1 text-blue-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    3. Đặt lại Bảng Điểm & Lịch Sử Đề Thi (Exam Records)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Xóa các bản ghi nộp bài, điểm số cao nhất của toàn bộ 190 đề thi.
                  </p>
                </div>
              </label>

              {/* Option 4: Full Reset */}
              <label
                className={`p-3 rounded-sm border flex items-start gap-3 cursor-pointer transition-colors ${
                  resetOption === 'all'
                    ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="reset_option"
                  checked={resetOption === 'all'}
                  onChange={() => setResetOption('all')}
                  className="mt-1 text-rose-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block">
                    4. Đặt Lại Toàn Bộ (Full Reset Khảo Thí)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Xóa sạch toàn bộ lịch sử 5.604 câu hỏi và bảng điểm đề thi, khôi phục trạng thái ban đầu.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-1.5 rounded-sm text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-3.5 py-1.5 rounded-sm text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VstepCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-xs font-mono text-slate-500">
          Đang tải hệ thống khảo thí VSTEP...
        </div>
      }
    >
      <VstepCatalogContent />
    </Suspense>
  );
}
