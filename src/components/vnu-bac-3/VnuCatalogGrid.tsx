'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Headphones,
  CheckCircle2,
  Clock,
  Award,
  RotateCcw,
  History,
  FileEdit,
  Layers,
  Sparkles,
  Search,
  FileText,
  Mic,
  PenTool,
  Tag,
} from 'lucide-react';
import type { VnuBac3CatalogItem, VnuBac3StageId } from '@/types/vnu-bac-3';
import {
  getVnuB3ExamHistoryMap,
  getVnuB3DraftStatusMap,
  type VnuB3ExamHistorySummary,
  type VnuB3DraftStatus,
} from '@/lib/vnu-bac-3/history';
import vocabData from '@/data/vnu-bac-3/vnupress-vocabulary-240.json';
import studyGuideData from '@/data/vnu-bac-3/vnupress-study-guide.json';

interface VnuCatalogGridProps {
  catalog: VnuBac3CatalogItem[];
}

type ActiveMainTab = 'exams' | 'guide' | 'vocabulary';
type ActiveGuideSkill = 'reading' | 'listening' | 'writing' | 'speaking';

const STAGE_METADATA: Array<{
  id: VnuBac3StageId;
  shortLabel: string;
  title: string;
  subtitle: string;
  badgeColor: string;
}> = [
  {
    id: 'stage-1-diagnostic',
    shortLabel: 'Chặng 1: Minh họa (1 đề)',
    title: 'Chặng 1 — Đề minh họa & chẩn đoán',
    subtitle:
      'Đề minh họa chuẩn cấu trúc ULIS ĐHQGHN, định vị điểm nền Reading & Listening.',
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'stage-2-official-practice',
    shortLabel: 'Chặng 2: Trọng tâm (3 đề)',
    title: 'Chặng 2 — Thực hành kỹ năng trọng tâm',
    subtitle:
      'Rèn luyện chuyên sâu 4 kỹ năng Reading, Listening, Writing và Speaking theo cấu trúc Bậc 3.',
    badgeColor: 'bg-indigo-600 text-white',
  },
  {
    id: 'stage-3-b1-drills',
    shortLabel: 'Chặng 3: Thực chiến (8 đề)',
    title: 'Chặng 3 — Luyện tập thực chiến B1',
    subtitle:
      '8 bộ đề chuẩn ma trận 3 lựa chọn (A/B/C) và Đúng/Sai, rèn tốc độ làm bài 65 phút.',
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'stage-4-final-mock',
    shortLabel: 'Chặng 4: Tổng duyệt (1 đề)',
    title: 'Chặng 4 — Đề thi mẫu tổng duyệt',
    subtitle:
      'Bài thi mẫu đầy đủ 4 kỹ năng sát kỳ thi thật để tổng duyệt trước ngày thi chính thức.',
    badgeColor: 'bg-amber-600 text-white',
  },
];

export function VnuCatalogGrid({ catalog }: VnuCatalogGridProps) {
  const [historyMap, setHistoryMap] = useState<Record<string, VnuB3ExamHistorySummary>>({});
  const [draftMap, setDraftMap] = useState<Record<string, VnuB3DraftStatus>>({});
  const [activeTab, setActiveTab] = useState<ActiveMainTab>('exams');
  const [activeGuideSkill, setActiveGuideSkill] = useState<ActiveGuideSkill>('reading');
  const [selectedStage, setSelectedStage] = useState<VnuBac3StageId | 'all'>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<number | 'all' | 'signs'>('all');
  const [vocabSearch, setVocabSearch] = useState('');

  useEffect(() => {
    setHistoryMap(getVnuB3ExamHistoryMap());
    setDraftMap(getVnuB3DraftStatusMap(catalog.map((item) => item.id)));
  }, [catalog]);

  const completedExamsCount = Object.keys(historyMap).length;
  const activeDraftsCount = Object.keys(draftMap).length;
  const bestOverallScore = Object.values(historyMap).reduce(
    (max, item) => Math.max(max, item.highestScore),
    0
  );
  const passedExamsCount = Object.values(historyMap).filter((item) => item.passed).length;

  // Sort catalog by orderNumber if provided
  const sortedCatalog = useMemo(() => {
    return [...catalog].sort((a, b) => (a.orderNumber ?? 99) - (b.orderNumber ?? 99));
  }, [catalog]);

  // Filtered topics for vocabulary tab
  const filteredVocabTopics = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    return vocabData.topics
      .filter((t) => selectedTopicId === 'all' || selectedTopicId === t.topicId)
      .map((t) => ({
        ...t,
        items: (t.items || []).filter(
          (w) =>
            !q ||
            w.word.toLowerCase().includes(q) ||
            w.meaningVi.toLowerCase().includes(q) ||
            w.partOfSpeech.toLowerCase().includes(q)
        ),
      }))
      .filter((t) => t.items.length > 0);
  }, [selectedTopicId, vocabSearch]);

  const renderExamCard = (item: VnuBac3CatalogItem) => {
    const summary = historyMap[item.id];
    const draft = draftMap[item.id];
    const isDone = Boolean(summary && summary.attemptCount > 0);
    const hasDraft = Boolean(draft && (draft.answeredCount > 0 || draft.writingDraftCount > 0));

    return (
      <div
        key={item.id}
        className={`bg-white dark:bg-slate-900 border rounded-sm p-5 flex flex-col justify-between transition-all shadow-xs ${
          isDone
            ? 'border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400'
            : hasDraft
              ? 'border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {item.orderNumber && (
                <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-none">
                  #{String(item.orderNumber).padStart(2, '0')}
                </span>
              )}
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-none uppercase ${
                  item.isSampleTest
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {item.difficulty}
              </span>

              {isDone && summary && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] font-bold border rounded-none ${
                    summary.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    {summary.highestScore.toFixed(1)}/10 · {summary.passed ? 'Đạt' : 'Chưa đạt'}
                  </span>
                </span>
              )}

              {hasDraft && draft && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-300 dark:border-amber-800 rounded-none">
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    Làm dở {draft.answeredCount}/{item.totalQuestions} câu
                    {draft.writingDraftCount > 0 ? ` + ${draft.writingDraftCount}W` : ''}
                  </span>
                </span>
              )}
            </div>

            <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{item.durationMinutes} phút</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
            {item.title}
          </h3>

          {/* Source Stage & Language Focus */}
          {(item.recommendedSession || item.grammarFocus) && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] font-mono">
              {item.recommendedSession && (
                <div className="flex items-start gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                  <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{item.recommendedSession}</span>
                </div>
              )}
              {item.grammarFocus && (
                <div className="text-slate-600 dark:text-slate-400 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Trọng tâm: </span>
                  {item.grammarFocus}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {item.description}
          </p>

          {/* Sub-info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>{item.readingQuestions} Đọc</span>
            </span>
            <span className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-purple-500" />
              <span>{item.listeningQuestions} Nghe (2x)</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>4 Kỹ Năng B1</span>
            </span>
          </div>

          {/* Detailed Best Score breakdown if completed */}
          {isDone && summary && (
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>
                R: <strong>{summary.bestReadingScore10.toFixed(1)}</strong> • L:{' '}
                <strong>{summary.bestListeningScore10.toFixed(1)}</strong>
              </span>
              <span className="text-slate-400">{summary.attemptCount} lượt thi</span>
            </div>
          )}

          {/* Tags (Max 3 for Technical Minimalist layout) */}
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-none"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: 2 Chế Độ */}
        <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
          <Link
            href={`/vnu-bac-3/exam/${item.id}`}
            className="w-full text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-mono text-xs font-bold rounded-sm transition-all shadow-xs"
          >
            {hasDraft && draft?.mode === 'full_simulation'
              ? 'Tiếp tục thi'
              : isDone
                ? 'Thi lại'
                : 'Thi thử (65\')'}
          </Link>
          <Link
            href={`/vnu-bac-3/practice/${item.id}`}
            className="w-full text-center py-2 px-3 border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-xs font-bold rounded-sm transition-all"
          >
            {hasDraft && draft?.mode === 'practice'
              ? 'Tiếp tục luyện'
              : 'Luyện tập'}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Thanh thống kê lịch sử cá nhân (chỉ hiện khi có lịch sử hoặc bài làm dở) */}
      {(completedExamsCount > 0 || activeDraftsCount > 0) && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Tiến độ cá nhân:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Đã hoàn thành:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {completedExamsCount}/{catalog.length} đề
              </span>
            </div>

            {completedExamsCount > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Điểm cao nhất:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {bestOverallScore.toFixed(1)}/10.0
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Đạt chuẩn B1:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {passedExamsCount} đề
                  </span>
                </div>
              </>
            )}

            {activeDraftsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-none">
                <FileEdit className="w-3.5 h-3.5" />
                <span className="font-bold">Làm dở: {activeDraftsCount} đề</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-3 border-b border-slate-200 dark:border-slate-800 font-mono text-xs -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold rounded-sm transition-all border whitespace-nowrap shrink-0 ${
            activeTab === 'exams'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">13 bộ đề</span>
            <span className="hidden sm:inline">1. 13 bộ đề theo 4 chặng</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold rounded-sm transition-all border whitespace-nowrap shrink-0 ${
            activeTab === 'guide'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">Cẩm nang</span>
            <span className="hidden sm:inline">2. Cẩm nang chiến thuật</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocabulary')}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold rounded-sm transition-all border whitespace-nowrap shrink-0 ${
            activeTab === 'vocabulary'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>
            <span className="sm:hidden">Từ vựng &amp; Biển báo</span>
            <span className="hidden sm:inline">3. 240 từ vựng &amp; biển báo</span>
          </span>
        </button>
      </div>

      {/* TAB 1: 13 BỘ ĐỀ THEO 4 CHẶNG */}
      {activeTab === 'exams' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Stage Filter Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 font-mono text-xs -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-slate-500 font-bold shrink-0 hidden sm:inline mr-1">Lọc theo chặng:</span>
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1.5 border rounded-none font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedStage === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Tất cả (13 đề)
            </button>
            {STAGE_METADATA.map((stg) => (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSelectedStage(stg.id)}
                className={`px-3 py-1.5 border rounded-none font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedStage === stg.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {stg.shortLabel}
              </button>
            ))}
          </div>

          {/* Grouped by 4 Scientific Stages */}
          {STAGE_METADATA.filter((stg) => selectedStage === 'all' || selectedStage === stg.id).map(
            (stg) => {
              const stageExams = sortedCatalog.filter((item) => item.stageId === stg.id);
              if (stageExams.length === 0) return null;

              return (
                <div key={stg.id} className="space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 border border-slate-200 dark:border-slate-800 rounded-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {stg.title}
                      </h3>
                      <span
                        className={`font-mono text-[11px] font-bold px-2.5 py-0.5 ${stg.badgeColor}`}
                      >
                        {stageExams.length} bộ đề
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
                      {stg.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {stageExams.map((item) => renderExamCard(item))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* TAB 2: CẨM NANG CHIẾN THUẬT 4 KỸ NĂNG BẬC 3 */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Guide Header */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-blue-600 text-white">
                  Cẩm nang chiến thuật Bậc 3 (B1)
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                  {studyGuideData.bookTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Chiến thuật làm bài, phân tích bẫy đề thi, bài viết và câu trả lời mẫu chuẩn B1
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {studyGuideData.overview.purpose}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
              {studyGuideData.overview.scoringFormula.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  • {rule}
                </div>
              ))}
            </div>

            {/* 4-Skill Sub-tab Selector */}
            <div className="flex flex-wrap gap-2 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveGuideSkill('reading')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold border transition-all ${
                  activeGuideSkill === 'reading'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Đọc hiểu (25 câu)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideSkill('listening')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold border transition-all ${
                  activeGuideSkill === 'listening'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Nghe hiểu (20 câu)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideSkill('writing')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold border transition-all ${
                  activeGuideSkill === 'writing'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Viết (7 bài mẫu)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideSkill('speaking')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-bold border transition-all ${
                  activeGuideSkill === 'speaking'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Nói (8 chủ đề)</span>
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: READING GUIDE */}
          {activeGuideSkill === 'reading' && (
            <div className="space-y-6">
              {/* 4 Parts Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-4">
                <h4 className="font-mono text-sm font-extrabold text-blue-700 dark:text-blue-400">
                  Cấu trúc &amp; chiến lược 4 phần Đọc hiểu (40 phút)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyGuideData.readingGuide.partsBreakdown.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {p.part}
                      </div>
                      <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                        Định dạng: {p.format}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>Chiến lược:</strong> {p.strategy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-skills with Examples */}
              <div className="space-y-4">
                <h4 className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Kỹ năng đọc hiểu &amp; ví dụ phân tích
                </h4>
                {studyGuideData.readingGuide.subSkills.map((sk) => (
                  <div
                    key={sk.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-4"
                  >
                    <h5 className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                      {sk.title}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          Câu hỏi thường gặp:
                        </div>
                        <ul className="list-disc list-inside space-y-1 font-mono text-slate-600 dark:text-slate-400">
                          {sk.questionTypes.map((qt, i) => (
                            <li key={i}>{qt}</li>
                          ))}
                        </ul>
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300 pt-2">
                          Các bước xử lý:
                        </div>
                        <ul className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {sk.steps.map((st, i) => (
                            <li key={i}>• {st}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          Ví dụ minh họa &amp; phân tích:
                        </div>
                        <p className="text-xs italic text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed border-l-2 border-blue-500 pl-3">
                          {sk.bookExample.passage}
                        </p>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          Question: {sk.bookExample.question}
                        </div>
                        <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {sk.bookExample.options.map((opt, i) => (
                            <div key={i}>{opt}</div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-emerald-800 dark:text-emerald-300">
                          <strong>Đáp án đúng: {sk.bookExample.answer}</strong> — {sk.bookExample.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: LISTENING GUIDE */}
          {activeGuideSkill === 'listening' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-3">
                <h4 className="font-mono text-sm font-extrabold text-purple-700 dark:text-purple-400">
                  Chiến lược làm bài Nghe hiểu (25 phút • 2 lượt)
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {studyGuideData.listeningGuide.keyRules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono font-bold text-purple-600">0{i + 1}.</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                {studyGuideData.listeningGuide.parts.map((pt, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                        {pt.partTitle}
                      </h5>
                      <span className="font-mono text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold">
                        {pt.pages}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {pt.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          Câu hỏi &amp; Tapescript minh họa:
                        </div>
                        <div className="font-mono text-[11px] whitespace-pre-line text-blue-700 dark:text-blue-300">
                          {pt.example.question}
                        </div>
                        <div className="text-xs italic whitespace-pre-line text-slate-600 dark:text-slate-400 border-l-2 border-purple-500 pl-3">
                          {pt.example.transcript}
                        </div>
                      </div>
                      <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/70 space-y-2">
                        <div className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                          Phân tích đáp án &amp; bẫy đề:
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {pt.example.analysis}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: WRITING GUIDE & 7 MODEL PARAGRAPHS */}
          {activeGuideSkill === 'writing' && (
            <div className="space-y-8">
              {/* Task 1 Section */}
              <div className="space-y-4">
                <div className="p-4 bg-emerald-600 text-white rounded-sm">
                  <h4 className="font-mono text-sm font-extrabold">{studyGuideData.writingGuide.task1.title}</h4>
                  <p className="text-xs opacity-90 mt-1">{studyGuideData.writingGuide.task1.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {studyGuideData.writingGuide.task1.models.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <h5 className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                          {m.type}
                        </h5>
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                          {m.wordCount} từ
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-pre-line text-slate-700 dark:text-slate-300">
                        <strong>Đề bài:</strong>
                        {'\n'}
                        {m.prompt}
                      </div>

                      <div className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border-l-4 border-l-emerald-600 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                        <div className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          Bài mẫu chuẩn B1:
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {m.sampleText}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          Phân tích dàn ý 3 phần:
                        </div>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                          {m.structureNotes.map((sn, i) => (
                            <li key={i}>• {sn}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-mono font-bold text-[11px] text-blue-600 block mb-1">
                            Từ nối chuyển tiếp:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {m.usefulPhrases.map((ph, i) => (
                              <span
                                key={i}
                                className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {ph}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-mono font-bold text-[11px] text-emerald-600 block mb-1">
                            Từ vựng ăn điểm:
                          </span>
                          <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {m.vocabulary.map((v, i) => (
                              <li key={i}>• {v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task 2 Section */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-600 text-white rounded-sm">
                  <h4 className="font-mono text-sm font-extrabold">{studyGuideData.writingGuide.task2.title}</h4>
                  <p className="text-xs opacity-90 mt-1">{studyGuideData.writingGuide.task2.description}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {studyGuideData.writingGuide.task2.models.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-3.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <h5 className="font-mono font-bold text-sm text-blue-700 dark:text-blue-400">
                          {m.type}
                        </h5>
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                          {m.wordCount} từ
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        <strong>Đề bài:</strong> {m.prompt}
                      </div>

                      <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-blue-600 border border-blue-200 dark:border-blue-800/60 space-y-1.5">
                        <div className="font-mono text-[11px] font-bold text-blue-800 dark:text-blue-300">
                          Bài viết mẫu chuẩn B1:
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                          {m.sampleText}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="font-mono font-bold text-[11px] text-blue-600 block mb-1">
                            Cấu trúc &amp; Từ nối hữu ích:
                          </span>
                          <ul className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {m.usefulPhrases.map((ph, i) => (
                              <li key={i}>• {ph}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-mono font-bold text-[11px] text-emerald-600 block mb-1">
                            Từ vựng lưu ý trong bài:
                          </span>
                          <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                            {m.vocabulary.map((v, i) => (
                              <li key={i}>• {v}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: SPEAKING GUIDE & 8 TOPIC Q&A BANKS + CUE CARDS */}
          {activeGuideSkill === 'speaking' && (
            <div className="space-y-8">
              {/* Part 1: Social Interaction */}
              <div className="space-y-4">
                <div className="p-4 bg-amber-600 text-white rounded-sm space-y-2">
                  <h4 className="font-mono text-sm font-extrabold">{studyGuideData.speakingGuide.part1.title}</h4>
                  <ul className="space-y-1 text-xs opacity-95">
                    {studyGuideData.speakingGuide.part1.strategy.map((st, i) => (
                      <li key={i}>• {st}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {studyGuideData.speakingGuide.part1.topicQuestionBanks.map((bank, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-3"
                    >
                      <h5 className="font-mono text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {bank.topic}
                      </h5>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3 text-xs">
                        {bank.qaList.map((qa, i) => (
                          <div key={i} className="pt-2.5 first:pt-0 space-y-1">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              Q: {qa.q}
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed pl-3 border-l-2 border-amber-500">
                              <strong>Sample:</strong> {qa.a}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 2: Individual Long Turn */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 text-white dark:bg-slate-800 rounded-sm space-y-2">
                  <h4 className="font-mono text-sm font-extrabold">{studyGuideData.speakingGuide.part2.title}</h4>
                  <ul className="space-y-1 text-xs opacity-90">
                    {studyGuideData.speakingGuide.part2.strategy.map((st, i) => (
                      <li key={i}>• {st}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-5">
                  {studyGuideData.speakingGuide.part2.modelCueCards.map((card, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 space-y-4 text-xs"
                    >
                      <h5 className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400">
                        {card.topicTitle}
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            Gợi ý trên thẻ đề (Task Card):
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                            {card.prompts.map((pr, i) => (
                              <li key={i}>{pr}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="lg:col-span-2 p-3.5 bg-amber-50/40 dark:bg-amber-950/20 border-l-4 border-l-amber-600 border border-amber-200 dark:border-amber-800/60 space-y-2">
                          <div className="font-mono font-bold text-amber-800 dark:text-amber-300">
                            Bài nói mẫu độc thoại 2 phút:
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                            {card.sampleSpeech}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          Câu hỏi mở rộng &amp; gợi ý trả lời:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {card.followUpQAs.map((fq, i) => (
                            <div
                              key={i}
                              className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
                            >
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                Q: {fq.q}
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                <strong>A:</strong> {fq.a}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KHO 240 TỪ VỰNG CỐT LÕI B1 (8 CHỦ ĐỀ) & TỪ KHÓA BIỂN BÁO */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-6">
          {/* Header & Search Controls */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Kho từ vựng trọng tâm 8 chủ đề &amp; từ khóa biển báo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  240 từ vựng cốt lõi theo 8 chủ đề trọng tâm và từ khóa giải nhanh biển báo Part 1.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Topic Filter Pills */}
            <div className="flex flex-wrap gap-1.5 font-mono text-xs pt-1">
              <button
                type="button"
                onClick={() => setSelectedTopicId('all')}
                className={`px-2.5 py-1 border font-bold ${
                  selectedTopicId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Tất cả (240 từ + Biển báo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTopicId('signs')}
                className={`px-2.5 py-1 border font-bold ${
                  selectedTopicId === 'signs'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                Biển báo Reading Part 1 (24 cụm)
              </button>
              {vocabData.topics.map((t) => (
                <button
                  key={t.topicId}
                  type="button"
                  onClick={() => setSelectedTopicId(t.topicId)}
                  className={`px-2.5 py-1 border font-bold ${
                    selectedTopicId === t.topicId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {t.topicId}. {t.topicEn} ({t.topicVi})
                </button>
              ))}
            </div>
          </div>

          {/* Reading Part 1 Sign Keywords Section */}
          {(selectedTopicId === 'all' || selectedTopicId === 'signs') &&
            vocabData.signKeywordGroups && (
              <div className="space-y-4">
                <h4 className="font-mono text-sm font-extrabold text-amber-700 dark:text-amber-400">
                  Từ khóa giải nhanh biển báo Reading Part 1
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vocabData.signKeywordGroups.map((grp) => (
                    <div
                      key={grp.groupId}
                      className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-sm p-4 space-y-3"
                    >
                      <div>
                        <h5 className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {grp.titleVi}
                        </h5>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                          💡 {grp.tipVi}
                        </p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {grp.keywords.map((kw, i) => (
                          <div key={i} className="py-2 space-y-0.5">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                                {kw.phrase}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {kw.meaningVi}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              = Paraphrase đáp án:{' '}
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {kw.equivalent}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 8 Topics x 30 Words Table */}
          {selectedTopicId !== 'signs' &&
            filteredVocabTopics.map((topic) => (
              <div
                key={topic.topicId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden"
              >
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Chủ đề {topic.topicId}: {topic.topicEn} — {topic.topicVi}
                    </h4>
                    {topic.examApplication && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-sans mt-0.5">
                        <strong>Ứng dụng:</strong> {topic.examApplication}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-600 text-white">
                    {topic.items.length} từ vựng
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px bg-slate-200 dark:bg-slate-800">
                  {topic.items.map((item) => (
                    <div
                      key={item.stt}
                      className="bg-white dark:bg-slate-900 p-3 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">
                            {String(item.stt).padStart(2, '0')}.
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {item.word}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold">
                            {item.partOfSpeech}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                          {item.meaningVi}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {item.ipa}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
