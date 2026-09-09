'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Award,
  Headphones,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Home,
  Flag,
  Filter,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Check,
  Volume2,
  ArrowUp,
  HelpCircle,
} from 'lucide-react';
import type {
  ToeicScoreResult,
  ToeicUnifiedQuestion,
  ToeicClientQuestion,
  ToeicOptionKey,
  ToeicPart,
  ToeicAccuracyRating,
} from '@/types/toeic';
import { getCefrDescriptor, getPartAccuracyRating } from '@/lib/toeic-scoring';
import { ToeicAudioPlayer } from './ToeicAudioPlayer';
import { stripHtmlTags } from './ToeicSplitPane';

export interface ToeicScoreReportViewProps {
  scoreResult: ToeicScoreResult;
  questions: (ToeicUnifiedQuestion | ToeicClientQuestion)[];
  answers: Record<number, ToeicOptionKey>;
  flagged?: Set<number>;
  testTitle?: string;
  isGuest?: boolean;
  savedToHistory?: boolean;
  onOpenGuestSaveModal?: () => void;
  onRetake?: () => void;
  onBackToHub?: () => void;
  className?: string;
}

const PART_METADATA: Record<
  ToeicPart,
  { name: string; section: 'listening' | 'reading'; desc: string }
> = {
  1: { name: 'Part 1: Photographs', section: 'listening', desc: 'Mô tả hình ảnh' },
  2: { name: 'Part 2: Question-Response', section: 'listening', desc: 'Hỏi & Đáp' },
  3: { name: 'Part 3: Short Conversations', section: 'listening', desc: 'Hội thoại ngắn' },
  4: { name: 'Part 4: Short Talks', section: 'listening', desc: 'Bài nói chuyện ngắn' },
  5: { name: 'Part 5: Incomplete Sentences', section: 'reading', desc: 'Hoàn thành câu' },
  6: { name: 'Part 6: Text Completion', section: 'reading', desc: 'Hoàn thành đoạn văn' },
  7: { name: 'Part 7: Reading Comprehension', section: 'reading', desc: 'Đọc hiểu văn bản' },
};

const PART_FEEDBACK: Record<
  ToeicPart,
  { title: string; high: string; mid: string; low: string }
> = {
  1: {
    title: 'Part 1: Photographs (Mô tả hình ảnh)',
    high: 'Phản xạ nghe tranh rất nhạy bén! Bạn nhận diện tốt chủ thể hành động và trạng thái tĩnh/động trong tranh.',
    mid: 'Khả năng quan sát tranh tương đối ổn, cần chú ý thêm bẫy về thì bị động (is being + V3) và giới từ vị trí.',
    low: 'Cần củng cố từ vựng mô tả hành động con người, đồ vật công sở và vị trí không gian để tránh bẫy Part 1.',
  },
  2: {
    title: 'Part 2: Question - Response (Hỏi & Đáp)',
    high: 'Bắt từ khóa câu hỏi Wh- và Yes/No rất tốt. Phản xạ câu trả lời gián tiếp đạt độ chính xác cao.',
    mid: 'Cần chú ý bẫy lặp từ (same-sounding words) và các câu trả lời gián tiếp bất ngờ (không theo khuôn mẫu).',
    low: 'Ưu tiên bắt từ để hỏi đầu tiên (Who, Where, When, Why, How) và tránh các phương án phát âm gần giống câu hỏi.',
  },
  3: {
    title: 'Part 3: Short Conversations (Hội thoại ngắn)',
    high: 'Kỹ năng đọc trước câu hỏi và bắt ý hội thoại xuất sắc, định vị người nói và ngữ cảnh rất nhanh.',
    mid: 'Cần cải thiện tốc độ đọc quét 3 câu hỏi trước khi băng phát để không bị động khi nghe chi tiết.',
    low: 'Luyện tập thói quen đọc lướt câu hỏi trước khi đoạn audio bắt đầu và ghi nhớ từ đồng nghĩa (paraphrase).',
  },
  4: {
    title: 'Part 4: Short Talks (Bài nói độc thoại)',
    high: 'Khả năng theo dõi mạch bài nói độc thoại tuyệt vời, hiểu sâu thông báo công cộng và tin nhắn thoại.',
    mid: 'Chú ý các câu hỏi suy luận ý định người nói và bảng biểu đi kèm để đạt điểm tối đa.',
    low: 'Tập trung bắt câu mở đầu để nắm mục đích bài nói (purpose) và ai là người phát ngôn.',
  },
  5: {
    title: 'Part 5: Incomplete Sentences (Hoàn thành câu)',
    high: 'Kiến thức ngữ pháp và từ vựng rất vững vàng, tốc độ xử lý câu đơn đạt chuẩn thời gian thi thật.',
    mid: 'Cần củng cố thêm các collocations công sở, giới từ đi kèm động từ và các dạng đảo ngữ / thể giả định.',
    low: 'Tập trung ôn tập từ loại (noun/verb/adj/adv), thì động từ cơ bản và liên từ chỉ nguyên nhân / nhượng bộ.',
  },
  6: {
    title: 'Part 6: Text Completion (Hoàn thành đoạn văn)',
    high: 'Tư duy liên kết câu và mạch văn rất mạch lạc, chọn đúng câu văn nối mạch một cách tự nhiên.',
    mid: 'Chú ý thì động từ của toàn đoạn văn và các từ nối (transition words: however, therefore, furthermore).',
    low: 'Đọc kỹ câu đứng trước và đứng sau chỗ trống để xác định mối quan hệ ngữ nghĩa trước khi chọn phương án.',
  },
  7: {
    title: 'Part 7: Reading Comprehension (Đọc hiểu văn bản)',
    high: 'Kỹ năng đọc quét (scanning & skimming) xuất sắc, đối chiếu thông tin đa đoạn chính xác.',
    mid: 'Cần tối ưu tốc độ đọc và luyện thêm các câu hỏi suy luận (inference) trong đoạn đôi / đoạn ba.',
    low: 'Luyện kỹ năng tìm từ khóa trong câu hỏi trước khi quét bài đọc để tiết kiệm thời gian.',
  },
};

function formatTimeSpent(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 giây';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours} giờ ${minutes} phút ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes} phút ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs} giây`;
}

type StatusFilter = 'all' | 'incorrect' | 'correct' | 'flagged';
type PartFilter = 'all' | ToeicPart;

export function ToeicScoreReportView({
  scoreResult,
  questions,
  answers,
  flagged = new Set(),
  testTitle = 'Bài thi thử TOEIC',
  isGuest = false,
  savedToHistory = false,
  onOpenGuestSaveModal,
  onRetake,
  onBackToHub,
  className = '',
}: ToeicScoreReportViewProps) {
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [partFilter, setPartFilter] = useState<PartFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<number, boolean>>({});

  const pageSize = 20;

  // CEFR details
  const cefrInfo = useMemo(() => {
    return getCefrDescriptor(scoreResult.cefrLevel);
  }, [scoreResult.cefrLevel]);

  // Overall accuracy
  const totalQuestions = questions.length;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((scoreResult.rawTotal / totalQuestions) * 100) : 0;

  // Active parts in this test session
  const activeParts = useMemo(() => {
    const parts = new Set<ToeicPart>();
    for (const q of questions) {
      if (q.part) parts.add(q.part as ToeicPart);
    }
    return Array.from(parts).sort((a, b) => a - b);
  }, [questions]);

  // A test is considered a full official exam only if it has >= 100 questions AND both Listening and Reading
  const isFullTest = useMemo(() => {
    if (questions.length < 100) return false;
    const hasListening = questions.some((q) => q.section === 'listening' || (q.part && q.part <= 4));
    const hasReading = questions.some((q) => q.section === 'reading' || (q.part && q.part >= 5));
    return hasListening && hasReading;
  }, [questions]);

  // Average time spent per question in seconds
  const avgSecondsPerQ = useMemo(() => {
    return totalQuestions > 0 ? Math.round(scoreResult.timeSpentSeconds / totalQuestions) : 0;
  }, [scoreResult.timeSpentSeconds, totalQuestions]);

  // Count metrics for review tabs
  const { correctCount, incorrectCount, flaggedCount } = useMemo(() => {
    let corr = 0;
    let incorr = 0;
    let flg = 0;

    for (const q of questions) {
      const userAns = answers[q.questionNumber];
      if (userAns === q.correctAnswer) {
        corr++;
      } else {
        incorr++;
      }
      if (flagged.has(q.questionNumber)) {
        flg++;
      }
    }

    return { correctCount: corr, incorrectCount: incorr, flaggedCount: flg };
  }, [answers, flagged, questions]);

  // Filtered questions list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const userAns = answers[q.questionNumber];
      const isCorrect = userAns === q.correctAnswer;
      const isFlagged = flagged.has(q.questionNumber);

      // Status filter
      if (statusFilter === 'correct' && !isCorrect) return false;
      if (statusFilter === 'incorrect' && isCorrect) return false;
      if (statusFilter === 'flagged' && !isFlagged) return false;

      // Part filter
      if (partFilter !== 'all' && q.part !== partFilter) return false;

      // Search query (question number or prompt text)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const numMatch = String(q.questionNumber) === query || `câu ${q.questionNumber}` === query;
        const textMatch = q.prompt?.toLowerCase().includes(query);
        const explanationMatch = q.explanationVi?.toLowerCase().includes(query);
        if (!numMatch && !textMatch && !explanationMatch) return false;
      }

      return true;
    });
  }, [answers, flagged, partFilter, questions, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const paginatedQuestions = useMemo(() => {
    if (showAllQuestions) return filteredQuestions;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredQuestions, pageSize, showAllQuestions]);

  // Scroll to review section
  const scrollToReview = () => {
    if (reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle transcript for a single question
  const toggleTranscript = (qNum: number) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  // Toggle all transcripts
  const toggleAllTranscripts = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    for (const q of filteredQuestions) {
      if (q.transcript) {
        next[q.questionNumber] = expand;
      }
    }
    setExpandedTranscripts(next);
  };

  return (
    <div className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8 ${className}`}>
      {/* ── 1. Official Score Certificate & Scaled Score Cards ── */}
      <section className="rounded-sm border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6">
          {/* Guest / Saved Status Banner */}
          {isGuest && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-sm border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Bạn đang xem kết quả với tư cách Khách
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Đăng nhập để lưu lịch sử thi vĩnh viễn, mở khóa phân tích chi tiết và đồng bộ đa thiết bị.
                  </p>
                </div>
              </div>
              {onOpenGuestSaveModal && (
                <button
                  type="button"
                  onClick={onOpenGuestSaveModal}
                  className="shrink-0 rounded-sm border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 cursor-pointer"
                >
                  Lưu kết quả bài thi
                </button>
              )}
            </div>
          )}

          {savedToHistory && (
            <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Kết quả bài thi đã được lưu thành công vào hồ sơ học tập của bạn.</span>
            </div>
          )}

          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-xs border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 mb-1.5">
                <Sparkles className="h-3 w-3 text-slate-500" />
                <span>
                  {isFullTest
                    ? 'Báo cáo kết quả bài thi TOEIC (Full Test)'
                    : `Báo cáo kết quả luyện tập TOEIC — Part ${activeParts.join(', ')}`}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {testTitle}
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {onRetake && (
                <button
                  type="button"
                  onClick={onRetake}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Làm lại bài thi</span>
                </button>
              )}

              {onBackToHub ? (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Về trang chủ TOEIC</span>
                </button>
              ) : (
                <Link href="/toeic">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-sm border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span>Về trang chủ TOEIC</span>
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* ── CONDITIONAL SCOREBOARD: FULL TEST vs PART PRACTICE ── */}
          {isFullTest ? (
            <>
              {/* 3-Column Scoreboard for Full Test: Total Scaled (990), Listening (495), Reading (495) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* Total Scaled Score */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tổng điểm quy đổi
                    </span>
                    <Trophy className="h-4 w-4 text-slate-500" />
                  </div>

                  <div className="my-3">
                    <div className="flex items-baseline gap-1">
                      <div className="font-mono text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {scoreResult.scaledTotal}
                      </div>
                      <span className="font-mono text-base font-medium text-slate-400">/ 990</span>
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-xs border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <Award className="h-3 w-3 text-slate-500" />
                      <span>CEFR Level {scoreResult.cefrLevel}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-mono tabular-nums">
                    <span>Độ chính xác: {overallAccuracy}%</span>
                    <span>{scoreResult.rawTotal}/{totalQuestions} câu đúng</span>
                  </div>
                </div>

                {/* Listening Scaled Score */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Điểm Listening
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xs border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <Headphones className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="my-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {scoreResult.scaledListening}
                      </span>
                      <span className="font-mono text-base font-medium text-slate-400">
                        / 495
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      Đúng {scoreResult.rawListening} / 100 câu nghe (Part 1 - 4)
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-slate-900 dark:bg-slate-100 rounded-xs transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((scoreResult.scaledListening / 495) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reading Scaled Score */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Điểm Reading
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xs border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="my-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {scoreResult.scaledReading}
                      </span>
                      <span className="font-mono text-base font-medium text-slate-400">
                        / 495
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      Đúng {scoreResult.rawReading} / 100 câu đọc (Part 5 - 7)
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-slate-900 dark:bg-slate-100 rounded-xs transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((scoreResult.scaledReading / 495) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CEFR Diagnostic Assessment & Recommendations Card */}
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-xs bg-slate-900 px-2 py-0.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                      CEFR {scoreResult.cefrLevel}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {cefrInfo.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Thời gian: <strong>{formatTimeSpent(scoreResult.timeSpentSeconds)}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Target className="h-3 w-3 text-slate-400" />
                      Đúng: <strong>{scoreResult.rawTotal} / {totalQuestions}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {cefrInfo.descriptionVi}
                </p>

                <div className="rounded-sm bg-white p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Định hướng bứt phá: </span>
                    <span className="text-slate-600 dark:text-slate-400">{cefrInfo.targetFeedbackVi}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 3-Column Scoreboard for Part Practice (Context-Aware) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* 1. Raw Accuracy Score Card */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Kết quả làm bài
                    </span>
                    <Target className="h-4 w-4 text-slate-500" />
                  </div>

                  <div className="my-3">
                    <div className="flex items-baseline gap-1.5">
                      <div className="font-mono text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {scoreResult.rawTotal}
                      </div>
                      <span className="font-mono text-base font-medium text-slate-400">/ {totalQuestions} câu</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-xs border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold font-mono">
                      <span>Độ chính xác: {overallAccuracy}%</span>
                      <span>•</span>
                      <span className={overallAccuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : overallAccuracy >= 60 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'}>
                        {overallAccuracy >= 80 ? 'Xuất sắc' : overallAccuracy >= 60 ? 'Khá tốt' : 'Cần luyện thêm'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center font-mono tabular-nums">
                    <span>Tỷ lệ chính xác: {overallAccuracy}%</span>
                    <span>{scoreResult.rawTotal}/{totalQuestions} câu đúng</span>
                  </div>
                </div>

                {/* 2. Time Spent & Speed */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Thời gian & Tốc độ
                    </span>
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>

                  <div className="my-3">
                    <div className="font-mono text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                      {formatTimeSpent(scoreResult.timeSpentSeconds)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono tabular-nums">
                      Tốc độ trung bình: <strong>~{avgSecondsPerQ}s</strong> / câu
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 text-xs text-slate-500 font-mono">
                    <span>Khuyến nghị Part {activeParts.join(', ')}: ~{activeParts[0] === 5 ? '30s' : activeParts[0] === 6 ? '45s' : activeParts[0] === 7 ? '60s' : '15-20s'}/câu</span>
                  </div>
                </div>

                {/* 3. Part Info */}
                <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phần thi đã luyện
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-xs border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {activeParts.every((p) => p <= 4) ? (
                        <Headphones className="h-3.5 w-3.5" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>

                  <div className="my-3">
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {activeParts.length === 1
                        ? PART_METADATA[activeParts[0]]?.name
                        : `Part ${activeParts.join(', ')}`}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      {activeParts.length === 1
                        ? PART_METADATA[activeParts[0]]?.desc
                        : 'Luyện tập kỹ năng tổng hợp'}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex justify-between">
                    <span>Tổng số câu: {totalQuestions}</span>
                    <span>Luyện tập phản xạ</span>
                  </div>
                </div>
              </div>

              {/* Part Diagnostic Feedback Card for Single Part Practice */}
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-xs bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                      Part {activeParts.join(', ')}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {activeParts.length === 1 && PART_FEEDBACK[activeParts[0]]
                        ? PART_FEEDBACK[activeParts[0]].title
                        : 'Đánh giá kỹ năng luyện tập'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Thời gian: <strong>{formatTimeSpent(scoreResult.timeSpentSeconds)}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Target className="h-3 w-3 text-slate-400" />
                      Đúng: <strong>{scoreResult.rawTotal} / {totalQuestions}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {activeParts.length === 1 && PART_FEEDBACK[activeParts[0]]
                    ? overallAccuracy >= 80
                      ? PART_FEEDBACK[activeParts[0]].high
                      : overallAccuracy >= 60
                      ? PART_FEEDBACK[activeParts[0]].mid
                      : PART_FEEDBACK[activeParts[0]].low
                    : `Bạn đã hoàn thành ${totalQuestions} câu hỏi với độ chính xác ${overallAccuracy}%. Hãy xem lại lời giải chi tiết bên dưới để củng cố các câu chưa chuẩn.`}
                </p>

                <div className="rounded-sm bg-white p-3 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Lời khuyên phòng thi: </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {overallAccuracy >= 80
                        ? 'Bạn đang có phong độ rất tốt ở phần thi này. Tiếp tục duy trì phản xạ bằng cách thử sức với các đề Full Test 200 câu.'
                        : 'Nên dành 5-10 phút xem kỹ lại phần giải thích chi tiết tiếng Việt và transcript của các câu làm sai để nắm vững bẫy đề thi.'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 2. Part-by-Part Accuracy Breakdown Chart ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isFullTest
                  ? 'Phân tích độ chính xác từng Part (Part 1 - Part 7)'
                  : `Phân tích độ chính xác — Part ${activeParts.join(', ')}`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFullTest
                ? 'Đánh giá chi tiết năng lực từng kỹ năng để phát hiện phần mạnh và phần cần bồi dưỡng'
                : 'Thống kê kết quả chi tiết của phần thi vừa hoàn thành'}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToReview}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
          >
            <span>Xem lại chi tiết từng câu</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* 7-Part Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4, 5, 6, 7] as ToeicPart[]).map((partNum) => {
            const stat = scoreResult.partStats[partNum] || {
              part: partNum,
              total: 0,
              correct: 0,
              percentage: 0,
              accuracyRating: 'low',
            };

            // Only show part if it has questions in this test session or is standard
            if (stat.total === 0 && questions.every((q) => q.part !== partNum)) {
              return null;
            }

            const meta = PART_METADATA[partNum];
            const rating = stat.accuracyRating || getPartAccuracyRating(stat.percentage);

            let badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
            let badgeText = 'Cần cải thiện';
            let barColor = 'bg-rose-500';

            if (rating === 'high') {
              badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
              badgeText = 'Xuất sắc';
              barColor = 'bg-emerald-500';
            } else if (rating === 'medium') {
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
              badgeText = 'Đạt yêu cầu';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={partNum}
                onClick={() => {
                  setPartFilter(partNum);
                  scrollToReview();
                }}
                className="group relative cursor-pointer rounded-sm border border-slate-200 bg-white p-3.5 transition hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {meta.section === 'listening' ? 'Listening' : 'Reading'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition">
                      Part {partNum}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{meta.desc}</p>
                  </div>

                  <span
                    className={`inline-flex rounded-xs border px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${badgeBg}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                      {stat.percentage}%
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {stat.correct} / {stat.total} câu
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full ${barColor} rounded-xs transition-all duration-300`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-500 font-mono opacity-0 group-hover:opacity-100 transition">
                  Lọc xem câu Part {partNum} →
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Interactive Review Mode ── */}
      <section
        ref={reviewSectionRef}
        className="rounded-sm border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900 space-y-5"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span>Chế độ Xem lại bài làm (Interactive Review Mode)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm tra chi tiết từng câu hỏi, đối chiếu lựa chọn của bạn với đáp án chuẩn và lời giải tiếng Việt
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAllTranscripts(true)}
              className="rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              Mở toàn bộ transcript
            </button>
            <button
              type="button"
              onClick={() => toggleAllTranscripts(false)}
              className="rounded-sm border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="space-y-3">
          {/* Status Tabs (All, Incorrect, Correct, Flagged) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <span>Tất cả</span>
              <span className="rounded-xs border border-slate-300 dark:border-slate-700 px-1 py-0.2 font-mono text-[10px] tabular-nums">
                {totalQuestions}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('incorrect');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'incorrect'
                  ? 'bg-rose-700 text-white dark:bg-rose-700'
                  : 'border border-rose-200 bg-rose-50/60 text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
              }`}
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Câu làm sai / Chưa làm</span>
              <span className="rounded-xs border border-rose-300 dark:border-rose-800 px-1 py-0.2 font-mono text-[10px] tabular-nums">
                {incorrectCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('correct');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'correct'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-700'
                  : 'border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Câu làm đúng</span>
              <span className="rounded-xs border border-emerald-300 dark:border-emerald-800 px-1 py-0.2 font-mono text-[10px] tabular-nums">
                {correctCount}
              </span>
            </button>

            {flaggedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('flagged');
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'flagged'
                    ? 'bg-amber-600 text-white dark:bg-amber-600'
                    : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
                }`}
              >
                <Flag className="h-3 w-3 fill-current" />
                <span>Câu gắn cờ</span>
                <span className="rounded-xs border border-amber-300 dark:border-amber-800 px-1 py-0.2 font-mono text-[10px] tabular-nums">
                  {flaggedCount}
                </span>
              </button>
            )}
          </div>

          {/* Part Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            {/* Part Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPartFilter('all');
                  setCurrentPage(1);
                }}
                className={`rounded-sm px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
                  partFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                Mọi Part
              </button>

              {([1, 2, 3, 4, 5, 6, 7] as ToeicPart[]).map((p) => {
                const countInPart = questions.filter((q) => q.part === p).length;
                if (countInPart === 0) return null;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPartFilter(p);
                      setCurrentPage(1);
                    }}
                    className={`rounded-sm px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
                      partFilter === p
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    P{p} ({countInPart})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo số câu hoặc từ khóa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-sm border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-slate-400 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <span>
            Hiển thị <strong>{filteredQuestions.length}</strong> câu hỏi
            {partFilter !== 'all' && ` thuộc Part ${partFilter}`}
            {statusFilter !== 'all' && ` (${statusFilter})`}
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAllQuestions}
              onChange={(e) => setShowAllQuestions(e.target.checked)}
              className="rounded-xs text-slate-900 focus:ring-slate-400"
            />
            <span>Hiển thị tất cả trên 1 trang</span>
          </label>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-sm border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <CheckCircle2 className="mx-auto h-6 w-6 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Không có câu hỏi nào khớp với bộ lọc.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPartFilter('all');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            paginatedQuestions.map((q) => {
              const userAns = answers[q.questionNumber];
              const isAnswered = Boolean(userAns);
              const isCorrect = isAnswered && userAns === q.correctAnswer;
              const isFlagged = flagged.has(q.questionNumber);
              const meta = PART_METADATA[q.part];
              const isListening = q.section === 'listening' || q.part <= 4;
              const isTranscriptOpen = Boolean(expandedTranscripts[q.questionNumber]);

              return (
                <article
                  key={q.id}
                  id={`review-q-${q.questionNumber}`}
                  className={`rounded-sm border p-4 sm:p-5 transition space-y-3.5 ${
                    isCorrect
                      ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                      : 'border-rose-200 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/10'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xs bg-slate-900 font-mono text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900 tabular-nums">
                        {q.questionNumber}
                      </span>

                      <span className="inline-flex rounded-xs border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {meta.name}
                      </span>

                      {isFlagged && (
                        <span className="inline-flex items-center gap-1 rounded-xs border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                          <Flag className="h-3 w-3 fill-current" /> Đã gắn cờ
                        </span>
                      )}
                    </div>

                    {/* Result Badge */}
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 rounded-xs border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đúng
                        </span>
                      ) : isAnswered ? (
                        <span className="inline-flex items-center gap-1 rounded-xs border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                          <XCircle className="h-3.5 w-3.5" /> Sai (Đã chọn {userAns})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-xs border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <HelpCircle className="h-3.5 w-3.5" /> Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stimulus 1: Image (if any) */}
                  {q.imageUrl && (
                    <div className="overflow-hidden rounded-sm border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="relative mx-auto max-h-72 max-w-md aspect-[4/3]">
                        <Image
                          src={q.imageUrl}
                          alt={`Minh họa câu ${q.questionNumber}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 450px"
                          className="rounded-xs object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {/* Stimulus 2: Audio Player (Practice mode with unlocked replay and speed) */}
                  {isListening && q.audioUrl && (
                    <div className="space-y-2">
                      <ToeicAudioPlayer
                        src={q.audioUrl}
                        title={`Audio câu ${q.questionNumber} (${meta.name})`}
                        mode="practice"
                        autoPlayInExamMode={false}
                        className="rounded-sm border border-slate-200 dark:border-slate-800"
                      />

                      {/* Transcript Toggle Button */}
                      {q.transcript && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleTranscript(q.questionNumber)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>
                              {isTranscriptOpen
                                ? 'Ẩn lời thoại (Transcript)'
                                : 'Xem lời thoại (Transcript)'}
                            </span>
                            {isTranscriptOpen ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Expanded Transcript */}
                          {isTranscriptOpen && (
                            <div className="mt-2 rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 space-y-1 animate-in fade-in-0 duration-150">
                              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                                Lời thoại gốc:
                              </span>
                              <p className="whitespace-pre-line leading-relaxed font-sans">
                                {stripHtmlTags(q.transcript)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stimulus 3: Reading Passage (Part 6 & Part 7) */}
                  {q.passage && (
                    <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <FileText className="h-3.5 w-3.5" /> Đoạn văn đọc hiểu
                      </span>
                      <div className="space-y-3 text-xs sm:text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200">
                        {q.passage.split('\n\n---\n\n').map((seg, idx) => (
                          <div
                            key={idx}
                            className="whitespace-pre-line rounded-sm bg-white p-3.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                          >
                            {seg}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Prompt */}
                  {q.prompt && (
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {q.prompt}
                    </h3>
                  )}

                  {/* Choices A, B, C, D */}
                  <div className="grid gap-1.5">
                    {q.options.map((opt) => {
                      const isSelected = userAns === opt.key;
                      const isAnswer = q.correctAnswer === opt.key;

                      let stateStyle =
                        'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
                      let badge = null;

                      if (isAnswer && isSelected) {
                        // User chose correct answer
                        stateStyle =
                          'border-emerald-500 bg-emerald-50/70 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium';
                        badge = (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Lựa chọn của bạn (Chính xác)
                          </span>
                        );
                      } else if (isAnswer) {
                        // Correct answer (user picked wrong or blank)
                        stateStyle =
                          'border-emerald-400 bg-emerald-50/50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100 font-medium';
                        badge = (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                            <Check className="h-3.5 w-3.5" /> Đáp án đúng
                          </span>
                        );
                      } else if (isSelected) {
                        // User picked wrong answer
                        stateStyle =
                          'border-rose-300 bg-rose-50/70 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100 line-through font-medium';
                        badge = (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 shrink-0 no-underline">
                            <XCircle className="h-3.5 w-3.5" /> Lựa chọn của bạn (Sai)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`rounded-sm border p-2.5 sm:p-3 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm ${stateStyle}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold ${
                                isAnswer
                                  ? 'bg-emerald-700 text-white'
                                  : isSelected
                                    ? 'bg-rose-700 text-white'
                                    : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="leading-relaxed pt-0.5">
                              {opt.text || (isListening ? `(Phương án ${opt.key})` : '')}
                            </span>
                          </div>

                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Vietnamese Grammar & Vocabulary Explanation */}
                  {q.explanationVi && (
                    <div className="rounded-sm border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60 text-xs sm:text-sm space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                        <Lightbulb className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>Giải thích chi tiết:</span>
                      </div>
                      <p className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line pl-5">
                        {stripHtmlTags(q.explanationVi)}
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!showAllQuestions && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Trang <strong>{currentPage}</strong> / {totalPages} (
              {filteredQuestions.length} câu)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  scrollToReview();
                }}
                className="rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
              >
                ← Trang trước
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 7) {
                    if (currentPage > 4) {
                      pageNum = currentPage - 4 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (6 - i);
                    }
                  }
                  if (pageNum <= 0 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        scrollToReview();
                      }}
                      className={`h-6 w-6 rounded-xs font-mono text-xs font-semibold transition cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  scrollToReview();
                }}
                className="rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
              >
                Trang sau →
              </button>
            </div>
          </div>
        )}

        {/* Back to Top */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>Lên đầu trang</span>
          </button>
        </div>
      </section>
    </div>
  );
}
