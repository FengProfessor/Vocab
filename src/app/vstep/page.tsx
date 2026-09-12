'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  Search,
  Clock,
  Layers,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Award,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import catalogDataRaw from '@/data/vstep/vstep-catalog-index.json';
import {
  getVstepProgressStats,
  getVstepExamSummaries,
  clearVstepExamHistory,
  clearVstepSkillHistory,
  resetAllVstepHistory,
  resetVstepSkillProgress,
  resetAllVstepProgress,
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

export default function VstepCatalogPage() {
  // Study flow: Luồng 1 (full_mock), Luồng 2 (skill_practice), hoặc Tất Cả (all)
  const [activeFlow, setActiveFlow] = useState<'full_mock' | 'skill_practice' | 'all'>('full_mock');
  const [selectedCategory, setSelectedCategory] = useState<string>('full_mock');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unattempted' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<VstepPracticeFilterMode>('unseen');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // History & Completion tracking
  const [examSummaries, setExamSummaries] = useState<Record<string, VstepExamSummary>>({});
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  // Consolidated Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetOption, setResetOption] = useState<'listening' | 'reading' | 'exams' | 'all'>('listening');

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
        listening += (item.totalQuestions || 0);
      } else if (item.category === 'reading' || item.skills?.includes('reading')) {
        reading += (item.totalQuestions || 0);
      }
    }
    return {
      totalListening: listening, // 2,960
      totalReading: reading,     // 2,644
      totalQuestions: listening + reading, // 5,604
      totalExams: catalog.items.length,    // 190
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

  const totalMistakes = listeningStats.mistakeCount + readingStats.mistakeCount;
  const totalAnswered = listeningStats.answeredCount + readingStats.answeredCount;
  const overallPercentage = bankTotals.totalQuestions > 0
    ? Math.round((totalAnswered / bankTotals.totalQuestions) * 100)
    : 0;

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

  // Execute safe progress reset
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

  // Reset to page 1 on filter/search/flow changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFlow, selectedCategory, selectedLevel, selectedSource, statusFilter, searchQuery]);

  // Single-pass cross-facet counting & filtering
  const { filteredItems, counts } = useMemo(() => {
    const normQ = searchQuery.trim() ? normalizeViText(searchQuery.trim()) : '';

    const skillCounts: Record<string, number> = {
      all: 0,
      full_mock: 0,
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
    };
    const levelCounts: Record<string, number> = {
      all: 0,
      B1: 0,
      B2: 0,
      C1: 0,
    };
    const sourceCounts: Record<string, number> = {
      all: 0,
      vstepowl: 0,
      onthivstep: 0,
      englishteststore: 0,
      vnu: 0,
    };
    const statusCounts: Record<string, number> = {
      all: 0,
      unattempted: 0,
      completed: 0,
    };

    const filtered: typeof indexedItems = [];

    for (let i = 0; i < indexedItems.length; i++) {
      const item = indexedItems[i];

      // Instant text search
      if (normQ && !item._searchKey.includes(normQ)) {
        continue;
      }

      const itemSkill = item.skill || item.category;
      const itemLevel = item.cefrLevel || item.targetLevel;
      const itemSource = item.source || 'vstepowl';
      const isCompleted = hasMounted && Boolean(examSummaries[item.id]?.isCompleted);

      // Flow partition:
      // full_mock: 24 Full Mock exams
      // skill_practice: 166 Practice sets (listening / reading)
      // all: all 190 items
      const matchFlow =
        activeFlow === 'all'
          ? true
          : activeFlow === 'full_mock'
          ? item.category === 'full_mock'
          : item.category !== 'full_mock';

      if (!matchFlow) continue;

      const matchSkill =
        selectedCategory === 'all' ||
        selectedCategory === 'all_practice' ||
        itemSkill === selectedCategory;

      const matchLevel = selectedLevel === 'all' || itemLevel === selectedLevel;
      const matchSource = selectedSource === 'all' || itemSource === selectedSource;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && isCompleted) ||
        (statusFilter === 'unattempted' && !isCompleted);

      // Cross-facet counts for Skill / Category
      if (matchLevel && matchSource && matchStatus) {
        skillCounts.all++;
        if (skillCounts[itemSkill] !== undefined) {
          skillCounts[itemSkill]++;
        }
      }

      // Cross-facet counts for CEFR Level
      if (matchSkill && matchSource && matchStatus) {
        levelCounts.all++;
        if (levelCounts[itemLevel] !== undefined) {
          levelCounts[itemLevel]++;
        }
      }

      // Cross-facet counts for Source
      if (matchSkill && matchLevel && matchStatus) {
        sourceCounts.all++;
        if (sourceCounts[itemSource] !== undefined) {
          sourceCounts[itemSource]++;
        }
      }

      // Cross-facet counts for Status
      if (matchSkill && matchLevel && matchSource) {
        statusCounts.all++;
        if (isCompleted) {
          statusCounts.completed++;
        } else {
          statusCounts.unattempted++;
        }
      }

      // Final match
      if (matchSkill && matchLevel && matchSource && matchStatus) {
        filtered.push(item);
      }
    }

    return {
      filteredItems: filtered,
      counts: {
        skills: skillCounts,
        levels: levelCounts,
        sources: sourceCounts,
        status: statusCounts,
      },
    };
  }, [
    indexedItems,
    activeFlow,
    selectedCategory,
    selectedLevel,
    selectedSource,
    statusFilter,
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
    const anchor = document.getElementById('catalog-controls') || document.getElementById('catalog-grid');
    if (anchor) {
      const topOffset = anchor.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isFiltered =
    (activeFlow === 'full_mock'
      ? selectedCategory !== 'full_mock'
      : activeFlow === 'skill_practice'
      ? selectedCategory !== 'all_practice'
      : selectedCategory !== 'all') ||
    selectedLevel !== 'all' ||
    selectedSource !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const activeFilterCount =
    ((activeFlow === 'full_mock' && selectedCategory !== 'full_mock') ||
    (activeFlow === 'skill_practice' && selectedCategory !== 'all_practice') ||
    (activeFlow === 'all' && selectedCategory !== 'all')
      ? 1
      : 0) +
    (selectedLevel !== 'all' ? 1 : 0) +
    (selectedSource !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0);

  const resetAllFilters = () => {
    if (activeFlow === 'full_mock') {
      setSelectedCategory('full_mock');
    } else if (activeFlow === 'skill_practice') {
      setSelectedCategory('all_practice');
    } else {
      setSelectedCategory('all');
    }
    setSelectedLevel('all');
    setSelectedSource('all');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getSourceBadge = (source?: VstepSourceType) => {
    switch (source) {
      case 'onthivstep':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
            Đọc Chuyên Đề
          </span>
        );
      case 'englishteststore':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
            Luyện Tương Tác
          </span>
        );
      case 'vnu':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
            Chuẩn ĐHQG
          </span>
        );
      case 'vstepowl':
      default:
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Khảo Thí Chuẩn
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* ── 1. HEADER KHẢO THÍ CHUẨN MỰC (TECHNICAL MINIMALIST) ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                MOET VSTEP B1-B2-C1
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Chống Trùng Đề 100%
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Phòng Khảo Thí VSTEP Chuẩn Quốc Gia
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Mô phỏng phòng thi máy tính: 190 đề thi & bài luyện, 5.604 câu hỏi chuẩn định dạng VSTEP B1-B2-C1
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── 2. HERO QUICK-ACTION ("BẮT ĐẦU THI THỬ NGAY" -> FULL MOCK 01) ── */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 sm:p-5 shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Đề Thi Tiêu Chuẩn Đề Xuất
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Mô phỏng 100% phòng thi máy tính
                </span>
                {hasMounted && examSummaries['vstep-mock-01']?.isCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Đã thi: {examSummaries['vstep-mock-01'].highestScore.toFixed(1)}/10 ({examSummaries['vstep-mock-01'].highestCefr})
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Đề Thi Mô Phỏng Chuẩn VSTEP B1-B2-C1 — Đề Số 01
              </h2>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> 172 phút
                </span>
                <span>•</span>
                <span>75 câu trắc nghiệm (Nghe 35, Đọc 40)</span>
                <span>•</span>
                <span>2 bài luận Viết</span>
                <span>•</span>
                <span>3 phần thi Nói</span>
                <span>•</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Bậc B1–B2–C1</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/vstep/exam/vstep-mock-01?filter=unseen"
                className="w-full sm:w-auto px-4 py-2.5 rounded text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-colors inline-flex items-center justify-center gap-2 shadow-none"
              >
                <Play className="w-4 h-4 fill-current" />
                Bắt Đầu Thi Thử Ngay (172 Phút)
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3. BẢNG CHỈ SỐ KHẢO THÍ (EXAM HUB DASHBOARD) ── */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 sm:p-5 shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Bảng Chỉ Số Khảo Thí VSTEP (Exam Hub Dashboard)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Tiêu chuẩn MOET 6 Bậc (A2–C1)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Cột 1: Ngân Hàng Khảo Thí */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Ngân Hàng Khảo Thí</span>
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {bankTotals.totalExams} Đề · {bankTotals.totalQuestions.toLocaleString()} Câu
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 flex items-center justify-between">
                <span>24 Full Mock · 166 Luyện</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Chuẩn Khung 6 Bậc</span>
              </div>
            </div>

            {/* Cột 2: Tiến Độ Ngân Hàng Câu Hỏi */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Tiến Độ Câu Hỏi</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {totalAnswered.toLocaleString()} / {bankTotals.totalQuestions.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">({overallPercentage}%)</span>
                </div>
                {/* Dual mini-bars */}
                <div className="space-y-1.5 mt-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>Nghe ({listeningStats.percentage}%)</span>
                      <span className="tabular-nums">{listeningStats.answeredCount}/{bankTotals.totalListening}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${listeningStats.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>Đọc ({readingStats.percentage}%)</span>
                      <span className="tabular-nums">{readingStats.answeredCount}/{bankTotals.totalReading}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${readingStats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1.5 flex items-center justify-between">
                <span>
                  Sai cần ôn:{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-mono tabular-nums">{totalMistakes}</strong>
                </span>
              </div>
            </div>

            {/* Cột 3: Hồ Sơ Khảo Thí Đề Thi */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Hồ Sơ Khảo Thí</span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {examCompletionStats.completedMockCount} / 24 Đề Full
                </div>
                <div className="text-xs font-mono mt-1 text-slate-700 dark:text-slate-300">
                  {examCompletionStats.highestScore > 0 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      Điểm cao nhất: {examCompletionStats.highestScore.toFixed(1)}/10 (Bậc {examCompletionStats.highestCefr})
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic">Chưa có bài thi</span>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-2 flex items-center justify-between">
                <span>Mục tiêu B2 (6.0–8.0)</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Chuẩn B1–C1</span>
              </div>
            </div>

            {/* Cột 4: Thao Tác Quản Lý Tiến Độ */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Quản Lý Tiến Độ</span>
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Lưu trữ trên thiết bị: Cho phép đặt lại câu hỏi theo kỹ năng hoặc xóa bảng điểm thi.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full px-3 py-1.5 rounded text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center justify-center gap-1.5 shadow-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Quản Lý Tiến Độ
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. CẤU TRÚC 2 LUỒNG HỌC TẬP (DUAL STUDY FLOWS) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Luồng 1 Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveFlow('full_mock');
              setSelectedCategory('full_mock');
              setCurrentPage(1);
            }}
            className={`p-3 rounded text-left transition-colors border flex flex-col justify-between ${
              activeFlow === 'full_mock'
                ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white shadow-none'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Luồng 1: Thi Thử Toàn Diện
              </span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tabular-nums">
                24 Đề
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Full Mock 4 Kỹ Năng · 172 phút · Mô phỏng chuẩn B1-B2-C1
            </p>
          </button>

          {/* Luồng 2 Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveFlow('skill_practice');
              setSelectedCategory('all_practice');
              setCurrentPage(1);
            }}
            className={`p-3 rounded text-left transition-colors border flex flex-col justify-between ${
              activeFlow === 'skill_practice'
                ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white shadow-none'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Luồng 2: Luyện Nhanh Kỹ Năng
              </span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                166 Bài
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Nghe & Đọc · 15–45 phút · Chống trùng đề & Ôn câu sai
            </p>
          </button>

          {/* All Exams Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveFlow('all');
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`p-3 rounded text-left transition-colors border flex flex-col justify-between ${
              activeFlow === 'all'
                ? 'bg-white dark:bg-slate-900 border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white shadow-none'
                : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Tất Cả Kho Đề Khảo Thí
              </span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                190 Đề
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Toàn bộ 190 đề thi & bài luyện trong hệ thống khảo thí
            </p>
          </button>
        </div>

        {/* ── BỘ CHỌN CHỐNG TRÙNG LẶP CHO LUỒNG 2 (PRACTICE ANTI-DUPLICATION SELECTOR) ── */}
        {activeFlow === 'skill_practice' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Chế Độ Lọc Chống Trùng Đề Luyện Tập:
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chọn thuật toán nạp câu hỏi cho phiên luyện tập kỹ năng Nghe hoặc Đọc.
              </p>
            </div>

            {/* Mode buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('unseen')}
                className={`px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1.5 ${
                  filterMode === 'unseen'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-none font-semibold border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Chỉ câu mới</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('mistakes')}
                className={`px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1.5 ${
                  filterMode === 'mistakes'
                    ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-none font-semibold border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Ôn câu sai</span>
                {totalMistakes > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 tabular-nums">
                    {totalMistakes}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('all_random')}
                className={`px-2.5 py-1 rounded transition-colors inline-flex items-center gap-1.5 ${
                  filterMode === 'all_random'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-none font-semibold border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Ngẫu nhiên</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 5. BỘ LỌC ĐA TIÊU CHÍ (MULTI-FACET FILTER CONTROLS) & TÌM KIẾM ── */}
        <div id="catalog-controls" className="space-y-3">
          {/* Subtabs for Skill Selection (when in Luồng 2 or All) */}
          {activeFlow !== 'full_mock' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                {
                  id: activeFlow === 'skill_practice' ? 'all_practice' : 'all',
                  label: activeFlow === 'skill_practice' ? 'Tất Cả Bài Luyện' : 'Tất Cả',
                  count: counts.skills.all,
                },
                ...(activeFlow === 'all'
                  ? [{ id: 'full_mock', label: 'Đề Full 4 Kỹ Năng', count: counts.skills.full_mock }]
                  : []),
                { id: 'listening', label: 'Luyện Nghe', count: counts.skills.listening },
                { id: 'reading', label: 'Luyện Đọc', count: counts.skills.reading },
                { id: 'writing', label: 'Luyện Viết', count: counts.skills.writing },
                { id: 'speaking', label: 'Luyện Nói', count: counts.skills.speaking },
              ].map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors border inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-none font-semibold'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded tabular-nums ${
                        isActive
                          ? 'bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-800'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 2: Status Filter Tabs + Facet Filters (Source, Level, Search, Clear) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Segmented Control */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Trạng thái:
              </span>
              {[
                { id: 'all', label: 'Tất Cả Đề', count: counts.status.all },
                { id: 'unattempted', label: 'Chưa Làm', count: counts.status.unattempted },
                { id: 'completed', label: 'Đã Hoàn Thành', count: counts.status.completed },
              ].map((st) => {
                const isActive = statusFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st.id as any);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-colors border inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-semibold shadow-none'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 py-0.2 rounded tabular-nums ${
                        isActive
                          ? 'bg-slate-700 text-slate-100 dark:bg-slate-200 dark:text-slate-800'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dropdowns and Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Source Dropdown */}
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              >
                <option value="all">Tất Cả Các Bộ Đề ({counts.sources.all})</option>
                <option value="vstepowl">Khảo Thí Chuẩn Hóa ({counts.sources.vstepowl})</option>
                <option value="onthivstep">Đọc Hiểu Chuyên Đề ({counts.sources.onthivstep})</option>
                <option value="englishteststore">Trắc Nghiệm Tương Tác ({counts.sources.englishteststore})</option>
                <option value="vnu">Đề Mẫu ĐHQGHN ({counts.sources.vnu})</option>
              </select>

              {/* CEFR Level Dropdown */}
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              >
                <option value="all">Mọi Cấp Bậc ({counts.levels.all})</option>
                <option value="B1">Mục Tiêu B1 ({counts.levels.B1})</option>
                <option value="B2">Mục Tiêu B2 ({counts.levels.B2})</option>
                <option value="C1">Mục Tiêu C1 ({counts.levels.C1})</option>
              </select>

              {isFiltered && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30"
                >
                  <X className="w-3 h-3" /> Xóa bộ lọc ({activeFilterCount})
                </button>
              )}

              {/* Instant Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đề, tên bài, huy hiệu..."
                  className="pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-56 text-slate-900 dark:text-slate-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Xóa từ khóa"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Live Count and Page Range Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="font-mono tabular-nums">
              Hiển thị <strong className="text-slate-800 dark:text-slate-200">{filteredItems.length === 0 ? 0 : startIndex + 1}–{endIndex}</strong> trên <strong className="text-slate-800 dark:text-slate-200">{filteredItems.length}</strong> đề thi
            </span>
            <span className="font-mono tabular-nums">
              Trang <strong className="text-slate-800 dark:text-slate-200">{safePage}</strong> / {totalPages}
            </span>
          </div>
        </div>

        {/* ── WRITING / SPEAKING INFORMATIONAL BANNER ── */}
        {(selectedCategory === 'writing' || selectedCategory === 'speaking') && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {selectedCategory === 'writing' ? 'Kỹ năng Viết (Writing)' : 'Kỹ năng Nói (Speaking)'} hiện được tích hợp trọn vẹn trong 24 Đề Thi Full Mock
                </p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  Bạn có thể luyện tập Task 1-2 Viết hoặc Part 1-3 Nói trực tiếp bên trong 24 Đề Thi Mô Phỏng Toàn Diện (Full Mock Tests).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveFlow('full_mock');
                setSelectedCategory('full_mock');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium whitespace-nowrap transition-colors shadow-none"
            >
              Chuyển Sang 24 Đề Full Mock
            </button>
          </div>
        )}

        {/* ── 6. DANH SÁCH ĐỀ THI VSTEP (PAGINATED CARDS GRID: 12 ITEMS/PAGE) ── */}
        <div id="catalog-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedItems.map((item) => {
            const isFullMock = item.category === 'full_mock';
            const summary = hasMounted ? examSummaries[item.id] : undefined;
            const isDone = Boolean(summary?.isCompleted);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-md p-4 sm:p-5 flex flex-col justify-between transition-colors shadow-none group ${
                  isDone
                    ? 'border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.015] hover:border-emerald-500/60 dark:hover:border-emerald-500/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Card Header: Badges & CEFR Level */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getSourceBadge(item.source)}
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.badge}
                      </span>
                      {item.isPopular && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                          Đề Trọng Tâm
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                      Bậc {item.targetLevel}
                    </span>
                  </div>

                  {/* Exam Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  {/* Card Metrics & Core Specs (Zero Redundant Skill Pills on Full Mock) */}
                  {isFullMock ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">172 phút</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">75</strong> trắc nghiệm (Nghe 35, Đọc 40)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">2</strong> bài luận Viết
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">3</strong> phần thi Nói
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{item.duration} phút</strong>
                      </span>
                      {item.totalQuestions > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{item.totalQuestions}</strong> câu hỏi
                        </span>
                      )}
                      {item.totalTasks > 0 && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{item.totalTasks}</strong> phần
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                        {item.category === 'listening' || item.skill === 'listening' ? 'Kỹ năng Nghe' : 'Kỹ năng Đọc'}
                      </span>
                    </div>
                  )}

                  {/* Completion Status & Best Score Tracker UI (R2) */}
                  {summary?.isCompleted ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 mt-3">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                          Đã hoàn thành ({summary.attemptCount} lần thi)
                        </span>
                        {summary.latestAttemptAt && (
                          <span className="text-[10px] font-mono text-emerald-700/70 dark:text-emerald-300/70">
                            • {formatAttemptDate(summary.latestAttemptAt)}
                          </span>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                          Điểm cao nhất: {summary.highestScore.toFixed(1)}/10
                        </span>
                        <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                          Bậc {summary.highestCefr}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 dark:text-slate-500 mt-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>Chưa làm bài</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata & Action CTA */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between">
                  <div className="text-xs font-mono text-slate-400">
                    Mã đề: <span className="font-semibold text-slate-600 dark:text-slate-400">{item.id}</span>
                  </div>

                  <Link
                    href={`/vstep/exam/${item.id}?filter=${filterMode}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-colors shadow-none"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {isFullMock ? 'Vào Phòng Thi' : 'Luyện Tập Ngay'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 7. THANH PHÂN TRANG CHUYÊN NGHIỆP (PAGINATION CONTROLS) ── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md p-3 sm:px-4 shadow-none">
            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Trang <span className="font-bold text-slate-800 dark:text-slate-200">{safePage}</span> trên tổng số <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({filteredItems.length} đề thi)
            </div>

            <div className="flex items-center gap-1">
              {/* Previous button */}
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page numbers with smart ellipsis */}
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
                    className={`min-w-[30px] h-[28px] px-1.5 rounded text-xs font-mono tabular-nums transition-colors border ${
                      isCurrent
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-bold shadow-none'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                aria-label="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {filteredItems.length === 0 && selectedCategory !== 'writing' && selectedCategory !== 'speaking' && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy đề thi phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Không có đề thi nào thỏa mãn đồng thời các điều kiện lọc và từ khóa &quot;{searchQuery}&quot;. Hãy thử điều chỉnh lại bộ lọc hoặc xóa từ khóa tìm kiếm.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-none"
            >
              <RotateCcw className="w-3 h-3" />
              Xóa tất cả bộ lọc ({catalog.items.length} đề)
            </button>
          </div>
        )}
      </main>

      {/* ── 8. MODAL HỢP NHẤT XÁC NHẬN ĐẶT LẠI TIẾN ĐỘ (CONSOLIDATED PROGRESS RESET MODAL) ── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-lg w-full p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
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
                className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
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
                    Xóa lịch sử {listeningStats.answeredCount} câu Nghe đã làm và {listeningStats.mistakeCount} câu sai. Bảng điểm đề thi Full Mock vẫn được bảo lưu an toàn.
                  </p>
                </div>
              </label>

              {/* Option 2: Reading */}
              <label
                className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
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
                    Xóa lịch sử {readingStats.answeredCount} câu Đọc đã làm và {readingStats.mistakeCount} câu sai. Bảng điểm đề thi Full Mock vẫn được bảo lưu an toàn.
                  </p>
                </div>
              </label>

              {/* Option 3: Exam History */}
              <label
                className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
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
                    Xóa các bản ghi nộp bài, điểm số cao nhất và trạng thái &quot;Đã hoàn thành&quot; của toàn bộ 190 đề thi. Tiến độ câu hỏi trắc nghiệm vẫn được giữ nguyên.
                  </p>
                </div>
              </label>

              {/* Option 4: Full Reset */}
              <label
                className={`p-3 rounded border flex items-start gap-3 cursor-pointer transition-colors ${
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
                    Xóa sạch toàn bộ lịch sử 5.604 câu hỏi, danh sách câu sai và bảng điểm đề thi, đưa toàn bộ hệ thống khảo thí về trạng thái ban đầu.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-1.5 rounded text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-none"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-3.5 py-1.5 rounded text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-none"
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
