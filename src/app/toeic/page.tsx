'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Play,
  RotateCcw,
  Search,
  FileText,
  Clock,
  ArrowRight,
  Layers,
  ListFilter,
} from 'lucide-react';
import catalogIndexRaw from '@/data/toeic/toeic-catalog-index.json';
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
}

const PART_DEFINITIONS: PartMeta[] = [
  {
    part: 1,
    name: 'Part 1: Photographs',
    vietnameseTitle: 'Mô tả hình ảnh',
    section: 'listening',
    setsCount: 35,
    questionCount: 210,
    timeEst: '~5 phút / set',
    desc: 'Quan sát tranh ảnh thực tế và nghe 4 phương án mô tả (A, B, C, D). Luyện phản xạ nhận diện hành động, vị trí và ngữ cảnh trực quan.',
  },
  {
    part: 2,
    name: 'Part 2: Question - Response',
    vietnameseTitle: 'Hỏi & Đáp phản xạ',
    section: 'listening',
    setsCount: 29,
    questionCount: 1543,
    timeEst: '~12 phút / set',
    desc: 'Nghe 1 câu hỏi hoặc phát biểu và chọn 1 trong 3 câu phản hồi thích hợp nhất (A, B, C). Rèn luyện phản xạ phát âm, ngữ điệu và câu trả lời gián tiếp.',
  },
  {
    part: 3,
    name: 'Part 3: Short Conversations',
    vietnameseTitle: 'Hội thoại ngắn',
    section: 'listening',
    setsCount: 22,
    questionCount: 858,
    timeEst: '~20 phút / set',
    desc: 'Nghe các đoạn đối thoại công sở & đời sống giữa 2-3 người (3 câu hỏi/đoạn). Bắt ý chính, chi tiết sự kiện và câu hỏi suy luận ngữ cảnh.',
  },
  {
    part: 4,
    name: 'Part 4: Short Talks',
    vietnameseTitle: 'Bài nói độc thoại',
    section: 'listening',
    setsCount: 23,
    questionCount: 1407,
    timeEst: '~15 phút / set',
    desc: 'Nghe bài phát biểu, thông báo công cộng, tin tức hoặc tin nhắn thoại (3 câu hỏi/bài). Rèn luyện khả năng tóm tắt và ghi nhớ thông tin nhanh.',
  },
  {
    part: 5,
    name: 'Part 5: Incomplete Sentences',
    vietnameseTitle: 'Hoàn thành câu',
    section: 'reading',
    setsCount: 24,
    questionCount: 720,
    timeEst: '~12 phút / set',
    desc: 'Điền từ vựng hoặc dạng ngữ pháp chuẩn xác vào chỗ trống câu đơn. Tổng ôn ngữ pháp trọng tâm, từ loại, liên từ và collocations công sở.',
  },
  {
    part: 6,
    name: 'Part 6: Text Completion',
    vietnameseTitle: 'Hoàn thành đoạn văn',
    section: 'reading',
    setsCount: 24,
    questionCount: 384,
    timeEst: '~10 phút / set',
    desc: 'Đọc 4 bài văn ngắn (email, thông báo, thư ngỏ) và điền 4 vị trí trống mỗi bài. Luyện tư duy liên kết ý và chọn câu văn phù hợp mạch bài.',
  },
  {
    part: 7,
    name: 'Part 7: Reading Comprehension',
    vietnameseTitle: 'Đọc hiểu thực tế',
    section: 'reading',
    setsCount: 74,
    questionCount: 2427,
    timeEst: '~25-50 phút / set',
    desc: 'Đọc hiểu văn bản thực tế bao gồm Đoạn đơn (Single), Đoạn đôi (Double) và Đoạn ba (Triple): email thương mại, hóa đơn, báo cáo, lịch trình.',
  },
];

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
  const [testFilter, setTestFilter] = useState<'200q' | 'estudyme' | 'study4' | 'all'>('200q');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Tab 2 Practice Sets for Selected Part
  const currentPartMeta = useMemo(() => {
    return PART_DEFINITIONS.find((p) => p.part === selectedPart) || PART_DEFINITIONS[0];
  }, [selectedPart]);

  const displayedPracticeSets = useMemo(() => {
    const sets = catalog.practiceParts?.[String(selectedPart)] || [];
    if (!searchQuery.trim()) return sets;
    const q = searchQuery.toLowerCase().trim();
    return sets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        String(s.setNumber).includes(q)
    );
  }, [selectedPart, searchQuery]);

  // Total counts
  const full200Count = useMemo(() => {
    return (catalog.fullTests || []).filter((t) => t.questionCount === 200).length;
  }, []);

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

          {/* Technical Subtitle */}
          <p className="mt-2 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Phòng thi máy tính mô phỏng chuẩn ETS / IIG: 200 câu hỏi mỗi đề, cấu trúc Split-Pane 2 cột,
            Question Palette 4 trạng thái, gắn cờ Flag và bảng điểm quy đổi 10–990. Ngân hàng 231 bộ bài tập
            luyện phản xạ chuyên sâu theo 7 Part với giải thích ngữ cảnh chi tiết.
          </p>

          {/* Real Scale Ticker (Monospace Tabular Nums) */}
          <div className="mt-5 inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <span className="inline-block rounded-full w-2 h-2 bg-emerald-500" />
              <span>Kho Đề Thực Tế:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              15.175 Câu Hỏi
            </span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="font-bold text-slate-900 dark:text-white">
              28 Đề Full Test (200 Câu)
            </span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="font-bold text-slate-900 dark:text-white">
              231 Set Luyện Part 1–7
            </span>
          </div>

          {/* Micro Specifications Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-400">
            <span className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5">
              200 CÂU / ĐỀ FULL
            </span>
            <span className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5">
              120 PHÚT THI
            </span>
            <span className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5">
              THANG ĐIỂM 10–990
            </span>
            <span className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5">
              AUTOSAVE 2S
            </span>
            <span className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5">
              AUDIO CHUẨN ETS
            </span>
          </div>
        </div>

        {/* ── 2. DOCKED 2-TAB NAVIGATION BAR ── */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 sm:space-x-8 -mb-px" aria-label="Tabs">
              {/* Tab 1: ĐỀ FULL TEST */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('full_test');
                  setSearchQuery('');
                }}
                className={`py-3.5 px-2 sm:px-1 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === 'full_test'
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>ĐỀ THI FULL TEST (200 CÂU - 120 PHÚT)</span>
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                    activeTab === 'full_test'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  [{full200Count} Đề]
                </span>
              </button>

              {/* Tab 2: LUYỆN THEO 7 PART */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('practice_parts');
                  setSearchQuery('');
                }}
                className={`py-3.5 px-2 sm:px-1 inline-flex items-center gap-2 border-b-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === 'practice_parts'
                    ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>LUYỆN TẬP THEO 7 PART</span>
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-xs tabular-nums ${
                    activeTab === 'practice_parts'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  [231 Sets]
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── 3. MAIN CATALOG BODY ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* ── TAB 1: FULL TEST CATALOG ── */}
        {activeTab === 'full_test' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  Bộ lọc:
                </span>
                <button
                  type="button"
                  onClick={() => setTestFilter('200q')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === '200q'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Đề 200 câu ({full200Count})
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
                  Estudyme ETS Simulation (21)
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
                  Study4 ETS Authentic (7 200Q)
                </button>
                <button
                  type="button"
                  onClick={() => setTestFilter('all')}
                  className={`rounded-sm px-2.5 py-1 text-xs font-mono font-medium transition-colors cursor-pointer ${
                    testFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Toàn bộ kho đề ({catalog.fullTests?.length || 41})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
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

            {/* Results Counter */}
            <div className="flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
              <span>Hiển thị {displayedFullTests.length} đề thi phù hợp</span>
              <span>Thời gian chuẩn: 120 phút | 200 câu</span>
            </div>

            {/* Full Tests Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedFullTests.map((test) => (
                <div
                  key={test.id}
                  className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600"
                >
                  <div className="space-y-3">
                    {/* Header Row: Display ID + Duration */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        [{test.displayId}]
                      </span>
                      <span className="flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {test.durationMinutes} phút
                      </span>
                    </div>

                    {/* Test Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {test.title}
                    </h3>

                    {/* Specifications List */}
                    <div className="space-y-1 rounded-sm border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <div className="flex items-center justify-between">
                        <span>Quy mô đề thi:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {test.questionCount} câu hỏi
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Phân bổ phần thi:</span>
                        <span>100 LC + 100 RC</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Khảo thí barem:</span>
                        <span>Thang 10–990</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                    <Link
                      href={`/toeic/exam/${test.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2 px-2.5 text-xs font-bold transition-colors text-center"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Vào thi ngay</span>
                    </Link>

                    <Link
                      href={`/toeic/exam/${test.id}?mode=practice`}
                      className="inline-flex items-center justify-center gap-1 rounded-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-2 text-xs font-medium transition-colors text-center"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Luyện tự do</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: 7-PART PRACTICE SETS CATALOG ── */}
        {activeTab === 'practice_parts' && (
          <div className="space-y-6">
            {/* Part Switcher Bar (Part 1 to Part 7) */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1 flex items-center justify-between">
                <span>CHỌN PHẦN THI ĐỂ LUYỆN TẬP (PART 1 – 7):</span>
                <span className="font-mono tabular-nums">Tổng cộng: 231 Sets | 7.549 Câu</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                {PART_DEFINITIONS.map((p) => {
                  const isSelected = p.part === selectedPart;
                  return (
                    <button
                      key={p.part}
                      type="button"
                      onClick={() => {
                        setSelectedPart(p.part);
                        setSearchQuery('');
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-sm border text-left transition-colors cursor-pointer ${
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
                          className={`font-mono text-[10px] px-1 py-0.2 rounded-xs tabular-nums ${
                            isSelected
                              ? 'bg-slate-800 dark:bg-slate-100 text-slate-200 dark:text-slate-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {p.setsCount}s
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

            {/* Selected Part Detail Banner */}
            <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                      Part {currentPartMeta.part} ({currentPartMeta.section.toUpperCase()})
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Thời lượng ước tính: {currentPartMeta.timeEst}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {currentPartMeta.name} — {currentPartMeta.vietnameseTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                    {currentPartMeta.desc}
                  </p>
                </div>

                {/* Part Search input */}
                <div className="relative w-full lg:w-72 shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Tìm kiếm set Part ${selectedPart}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Stats ticker for this part */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                <span>
                  Danh sách: <strong className="text-slate-900 dark:text-white">{displayedPracticeSets.length}</strong> / {currentPartMeta.setsCount} bộ đề
                </span>
                <span>•</span>
                <span>
                  Tổng số câu hỏi: <strong className="text-slate-900 dark:text-white">{currentPartMeta.questionCount.toLocaleString('vi-VN')}</strong> câu
                </span>
                <span>•</span>
                <span>Chế độ: Luyện tập có giải thích chi tiết tiếng Việt</span>
              </div>
            </div>

            {/* Practice Sets Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedPracticeSets.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 transition-colors hover:border-slate-400 dark:hover:border-slate-600"
                >
                  <div className="space-y-2">
                    {/* Top row: Set Tag + Question Count */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        [SET {item.setNumber < 10 ? `0${item.setNumber}` : item.setNumber}]
                      </span>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
                        {item.questionCount} câu
                      </span>
                    </div>

                    {/* Set Title */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    {/* Metadata line */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        ~{item.durationMinutes} phút
                      </span>
                      <span>Giải thích TV</span>
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/toeic/exam/${item.id}?mode=practice`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-1.5 px-3 text-xs font-bold transition-colors text-center"
                    >
                      <span>Làm bài ngay</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {displayedPracticeSets.length === 0 && (
              <div className="rounded-sm border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 font-mono text-xs">
                Không tìm thấy set bài tập phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        )}
      </main>
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
