'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  HelpCircle,
  Headphones,
  CheckCircle2,
  XCircle,
  Grid,
  Loader2,
} from 'lucide-react';
import type {
  ToeicUnifiedQuestion,
  ToeicOptionKey,
  ToeicExamMode,
  ToeicClientQuestion,
} from '@/types/toeic';
import { ToeicAudioPlayer } from './ToeicAudioPlayer';

export function stripHtmlTags(str?: string): string {
  if (!str) return '';
  let text = str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const entityMap: Record<string, string> = {
    '&agrave;': 'à', '&aacute;': 'á', '&acirc;': 'â', '&atilde;': 'ã',
    '&egrave;': 'è', '&eacute;': 'é', '&ecirc;': 'ê',
    '&igrave;': 'ì', '&iacute;': 'í',
    '&ograve;': 'ò', '&oacute;': 'ó', '&ocirc;': 'ô', '&otilde;': 'õ',
    '&ugrave;': 'ù', '&uacute;': 'ú',
    '&yacute;': 'ý',
    '&Agrave;': 'À', '&Aacute;': 'Á', '&Acirc;': 'Â', '&Atilde;': 'Ã',
    '&Egrave;': 'È', '&Eacute;': 'É', '&Ecirc;': 'Ê',
    '&Igrave;': 'Ì', '&Iacute;': 'Í',
    '&Ograve;': 'Ò', '&Oacute;': 'Ó', '&Ocirc;': 'Ô', '&Otilde;': 'Õ',
    '&Ugrave;': 'Ù', '&Uacute;': 'Ú',
    '&Yacute;': 'Ý',
    '&rsquo;': "'", '&lsquo;': "'",
    '&ldquo;': '"', '&rdquo;': '"',
    '&mdash;': '—', '&ndash;': '–',
    '&hellip;': '...',
  };

  for (const [entity, char] of Object.entries(entityMap)) {
    text = text.replaceAll(entity, char);
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

interface ToeicSplitPaneProps {
  question: ToeicClientQuestion;
  mode?: ToeicExamMode;
  selectedOption?: ToeicOptionKey;
  isFlagged?: boolean;
  onSelectOption: (option: ToeicOptionKey) => void;
  onToggleFlag: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  totalQuestions: number;
  showExplanation?: boolean;
  onToggleExplanation?: () => void;
  onEnablePracticeMode?: () => void;
  onOpenPalette?: () => void;
  paletteStats?: { answered: number; total: number };
  className?: string;
}

export function ToeicSplitPane({
  question,
  mode = 'real',
  selectedOption,
  isFlagged = false,
  onSelectOption,
  onToggleFlag,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
  totalQuestions,
  showExplanation = false,
  onToggleExplanation,
  onEnablePracticeMode,
  onOpenPalette,
  paletteStats,
  className = '',
}: ToeicSplitPaneProps) {
  const isExamMode = mode === 'real' || mode === 'full_simulation';
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  // Keyboard shortcut listener: A/B/C/D to answer, Arrows to navigate, F to flag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'A' || key === 'B' || key === 'C' || key === 'D') {
        const matchingOption = question.options.find((opt) => opt.key === key);
        if (matchingOption) {
          e.preventDefault();
          onSelectOption(key as ToeicOptionKey);
        }
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (key === 'F') {
        e.preventDefault();
        onToggleFlag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev, onSelectOption, onToggleFlag, question.options]);

  const isReadingWithPassage =
    (question.part === 6 || question.part === 7) && Boolean(question.passage);
  const isPart5 = question.part === 5;
  const [mobileTab, setMobileTab] = useState<'passage' | 'question'>('question');

  // When question changes, reset mobile tab to 'question'
  useEffect(() => {
    setMobileTab('question');
  }, [question.id]);

  // Passage segments for reading Part 6 & 7 (handles multi-passages split by '---')
  const passageSegments = useMemo(() => {
    if (!question.passage) return [];
    return question.passage.split(/\n\s*---\s*\n/).map((p) => p.trim());
  }, [question.passage]);

  return (
    <div
      className={`flex flex-col h-[calc(100vh-48px)] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 ${className}`}
    >
      {/* Mobile Reading Segmented Tab Bar (Only Part 6 & 7 on mobile) */}
      {isReadingWithPassage && (
        <div className="lg:hidden shrink-0 flex items-center border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 gap-2 select-none">
          <button
            type="button"
            onClick={() => setMobileTab('passage')}
            className={`flex-1 py-1.5 px-3 rounded-sm font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
              mobileTab === 'passage'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border-slate-300 dark:border-slate-700 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Bài đọc {passageSegments.length > 1 ? `(${passageSegments.length} đoạn)` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('question')}
            className={`flex-1 py-1.5 px-3 rounded-sm font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
              mobileTab === 'question'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border-slate-300 dark:border-slate-700 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>✍️ Câu hỏi [{String(question.questionNumber).padStart(3, '0')}]</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
        {/* ── Left Column: Stimulus Pane (Audio / Photo / Passages) ── */}
        <section
          aria-label="Tài liệu đề thi"
          className={`${
            isPart5
              ? 'hidden lg:flex'
              : isReadingWithPassage
              ? mobileTab === 'passage'
                ? 'flex flex-col flex-1 overflow-hidden'
                : 'hidden lg:flex'
              : 'flex flex-col shrink-0 max-h-[44vh] overflow-y-auto'
          } lg:col-span-6 xl:col-span-7 lg:max-h-none lg:h-full lg:overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}
        >
          {/* Scrollable Stimulus Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin">
            {/* 1. Audio Player for Listening Parts 1-4 */}
            {question.section === 'listening' && question.audioUrl && (
              <div className="sticky top-0 z-10 pb-1">
                <ToeicAudioPlayer
                  src={question.audioUrl}
                  title={`Part ${question.part} Audio (Câu ${question.questionNumber})`}
                  mode={mode}
                  autoPlayInExamMode={true}
                />
              </div>
            )}

            {/* 2. Part 1 Photograph */}
            {question.part === 1 && question.imageUrl && (
              <div className="space-y-1.5 sm:space-y-2">
                <div className="relative group overflow-hidden rounded-sm border border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-900">
                  <div className="relative h-44 sm:h-64 md:h-80 lg:h-96 w-full">
                    <Image
                      src={question.imageUrl}
                      alt={`Photograph for Question ${question.questionNumber}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsImageZoomed(!isImageZoomed)}
                    className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-black/70 text-white shadow-none transition hover:bg-black/90 cursor-pointer"
                    title="Phóng to ảnh"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="hidden sm:block text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                  Quan sát hình ảnh và lắng nghe 4 phương án (A), (B), (C), (D) để chọn đáp án đúng.
                </p>
              </div>
            )}

            {/* 3. Part 2 Directions / Prompt */}
            {question.part === 2 && (
              <div className="hidden lg:block rounded-sm border border-slate-200 bg-slate-50/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Directions for Part 2
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  You will hear a question or statement and three responses in English. They will not be
                  printed on your screen and will be spoken only once. Select the best response (A), (B),
                  or (C).
                </p>
              </div>
            )}

            {/* 4. Part 3 & 4 Graphic / Additional Image */}
            {(question.part === 3 || question.part === 4) && question.imageUrl && (
              <div className="overflow-hidden rounded-sm border border-slate-200 bg-slate-50 p-2 shadow-none dark:border-slate-800 dark:bg-slate-900">
                <div className="relative h-44 sm:h-56 md:h-72 w-full">
                  <Image
                    src={question.imageUrl}
                    alt={`Graphic for Question ${question.questionNumber}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* 5. Part 5 Directions */}
            {question.part === 5 && (
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Part 5: Incomplete Sentences
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Một từ hoặc cụm từ bị thiếu trong mỗi câu sau. Bốn sự lựa chọn được đưa ra dưới mỗi câu.
                  Chọn từ hoặc cụm từ tốt nhất để hoàn thành câu.
                </p>
              </div>
            )}

            {/* 6. Part 6 & Part 7 Reading Passages */}
            {(question.part === 6 || question.part === 7) && question.passage && (
              <div className="flex flex-col min-h-full space-y-4">
                {passageSegments.map((segment, idx) => (
                  <article
                    key={idx}
                    className="flex-1 flex flex-col justify-between rounded-sm border border-slate-200 bg-slate-50/50 p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900/40 min-h-[380px]"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {passageSegments.length > 1
                            ? `Đoạn văn ${idx + 1}/${passageSegments.length}`
                            : 'Văn bản đọc hiểu'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          ETS Reading Stimulus
                        </span>
                      </div>
                      <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-serif text-slate-800 dark:text-slate-200">
                        {segment}
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                      <span>📄 Đọc kỹ thông tin đoạn văn trên để trả lời câu hỏi bên phải</span>
                      <span>Part {question.part}</span>
                    </div>
                  </article>
                ))}

                {/* Mobile switch to question button at bottom of passage */}
                {isReadingWithPassage && (
                  <div className="lg:hidden sticky bottom-2 flex justify-center pt-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setMobileTab('question')}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-slate-700 bg-slate-900 dark:border-slate-300 dark:bg-slate-100 px-4 py-2 font-mono text-xs font-bold text-white dark:text-slate-900 shadow-md transition hover:bg-slate-800 dark:hover:bg-white cursor-pointer active:scale-98"
                    >
                      <span>Làm câu hỏi {question.questionNumber}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Right Column: Question & Options Area ── */}
        <section
          aria-label="Khu vực câu hỏi và đáp án"
          className={`${
            isReadingWithPassage && mobileTab !== 'question'
              ? 'hidden lg:flex'
              : 'flex flex-col flex-1'
          } lg:col-span-6 xl:col-span-5 lg:h-full overflow-hidden bg-white dark:bg-slate-900`}
        >
          {/* Question Header: Number & Flag Button */}
          <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Câu [{String(question.questionNumber).padStart(3, '0')}]
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500">/ {totalQuestions}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Flag / Bookmark Button */}
              <button
                type="button"
                onClick={onToggleFlag}
                className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-xs font-medium transition cursor-pointer select-none border ${
                  isFlagged
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                title="Gắn cờ câu hỏi này để xem lại sau (Phím tắt: F)"
              >
                <Flag
                  className={`h-3 w-3 ${
                    isFlagged ? 'fill-white text-white' : 'text-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">{isFlagged ? 'Đã gắn cờ (F)' : 'Gắn cờ (F)'}</span>
                <span className="sm:hidden">{isFlagged ? 'Đã cờ' : 'Cờ (F)'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Question Prompt and Options */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin">
            {/* Mobile quick jump to reading passage */}
            {isReadingWithPassage && (
              <button
                type="button"
                onClick={() => setMobileTab('passage')}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer mb-1"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Xem lại bài đọc ({passageSegments.length > 1 ? `${passageSegments.length} đoạn` : 'văn bản'}) →</span>
              </button>
            )}

            {/* Question Prompt */}
            {question.prompt && (
              <div className="rounded-sm bg-slate-50 p-3 sm:p-3.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words">
                  {stripHtmlTags(question.prompt)}
                </p>
              </div>
            )}

            {/* Practice Mode Hint (only shown before answering to guide the user) */}
            {!isExamMode && !selectedOption && !showExplanation && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-sm bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 text-xs">💡</span>
                  <span className="text-xs text-amber-800/90 dark:text-amber-300">
                    Chế độ Luyện tập: Chọn đáp án để xem giải thích ngay
                  </span>
                </div>
                {onToggleExplanation && (
                  <button
                    type="button"
                    onClick={onToggleExplanation}
                    className="font-mono text-[11px] font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 underline cursor-pointer shrink-0 ml-2"
                  >
                    Xem trước
                  </button>
                )}
              </div>
            )}

            {/* Options List (A, B, C, D) */}
            <div className="space-y-2 sm:space-y-2.5" role="radiogroup" aria-label="Các phương án lựa chọn">
              {question.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                const isAnswered = Boolean(selectedOption);
                const shouldReveal = !isExamMode && (showExplanation || isAnswered);
                const isCorrectAnswer = shouldReveal && opt.key === question.correctAnswer;
                const isWrongSelection =
                  shouldReveal && isSelected && opt.key !== question.correctAnswer;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onSelectOption(opt.key)}
                    className={`group relative flex w-full items-center gap-2.5 sm:gap-3 rounded-sm border p-2.5 sm:p-3 text-left text-sm sm:text-base transition-colors duration-100 cursor-pointer select-none min-h-[44px] sm:min-h-[48px] ${
                      isCorrectAnswer
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium'
                        : isWrongSelection
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-100 font-medium'
                        : isSelected
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 font-normal'
                    }`}
                  >
                    {/* Badge key (A, B, C, D) */}
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold border transition-colors ${
                        isCorrectAnswer
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isWrongSelection
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : isSelected
                          ? 'border-white bg-white text-slate-900 dark:border-slate-900 dark:bg-slate-900 dark:text-white'
                          : 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {opt.key}
                    </span>

                    {/* Option Text */}
                    <span className="flex-1 leading-relaxed">
                      {opt.text || (question.part === 1 || question.part === 2 ? '(Nghe phương án)' : '')}
                    </span>

                    {/* Explanation visual marker */}
                    {isCorrectAnswer && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Đáp án đúng</span>
                      </span>
                    )}
                    {isWrongSelection && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0">
                        <XCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Sai</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Keyboard shortcut hint (hidden on mobile/touch screens) */}
            <p className="hidden md:block font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Phím tắt: <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">A</kbd>,{' '}
              <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">B</kbd>,{' '}
              <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">C</kbd>,{' '}
              <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">D</kbd> chọn đáp án |{' '}
              <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">F</kbd> gắn cờ |{' '}
              <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">←</kbd> <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">→</kbd> chuyển câu
            </p>

            {/* Quick toggle banner if in exam mode */}
            {isExamMode && selectedOption && onEnablePracticeMode && (
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-2.5 text-xs animate-in fade-in duration-100">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Đang ở chế độ Thi thử (đáp án & giải thích ẩn đến khi nộp bài).</span>
                  </div>
                  <button
                    type="button"
                    onClick={onEnablePracticeMode}
                    className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer shrink-0 transition-colors shadow-2xs"
                  >
                    <span>Bật xem giải thích ngay</span>
                    <span>💡</span>
                  </button>
                </div>
              </div>
            )}

            {/* Explanation Box in Practice Mode (Core USP Feature) */}
            {!isExamMode && onToggleExplanation && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onToggleExplanation}
                  className={`inline-flex items-center justify-between w-full rounded-sm border px-3.5 py-2 font-mono text-xs font-bold transition cursor-pointer shadow-2xs ${
                    showExplanation || selectedOption
                      ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100'
                      : 'border-amber-300 bg-amber-50/60 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 dark:text-amber-400 text-sm">💡</span>
                    <span>
                      {showExplanation || selectedOption
                        ? '▲ GIẢI THÍCH CHI TIẾT & BẢN DỊCH'
                        : '▼ XEM GIẢI THÍCH CHI TIẾT & BẢN DỊCH'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-amber-200/80 dark:bg-amber-900/60 font-bold text-amber-900 dark:text-amber-100">
                      GIẢI THÍCH ETS
                    </span>
                  </div>
                  <span className="text-[11px] font-normal text-amber-700 dark:text-amber-300">
                    {showExplanation || selectedOption ? 'Nhấn để thu gọn' : 'Xem ngay'}
                  </span>
                </button>

                {(showExplanation || selectedOption) && (
                  <div className="mt-2.5 rounded-sm border border-amber-200 bg-white p-4 text-xs leading-relaxed text-slate-800 dark:border-amber-900/60 dark:bg-slate-950/80 dark:text-slate-200 space-y-3 shadow-2xs animate-in fade-in duration-150">
                    {/* Status Banner */}
                    {selectedOption && question.correctAnswer && (
                      <div className="p-2.5 rounded-xs border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold">
                        {selectedOption === question.correctAnswer ? (
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Chính xác! Đáp án đúng là ({question.correctAnswer})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>Chưa chính xác. Bạn chọn ({selectedOption}) — Đáp án đúng: ({question.correctAnswer})</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!selectedOption && question.correctAnswer && (
                      <div className="inline-flex items-center gap-2 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xs border border-amber-200 dark:border-amber-800 w-full">
                        <HelpCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <span>Đáp án chuẩn ETS của câu này: ({question.correctAnswer})</span>
                      </div>
                    )}

                    {question.explanationVi ? (
                      <div className="space-y-1.5 pt-1">
                        <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📖 Phân tích ngữ pháp & Bản dịch tiếng Việt:</span>
                        </p>
                        <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm pl-2.5 border-l-2 border-amber-400 dark:border-amber-600">
                          {stripHtmlTags(question.explanationVi)}
                        </div>
                      </div>
                    ) : question.correctAnswer ? (
                      <p className="text-slate-500 text-xs">
                        Đáp án chuẩn ETS: <strong>({question.correctAnswer})</strong>.
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 py-2 text-amber-800 dark:text-amber-300 text-xs font-mono">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Đang tải phân tích ngữ pháp & bản dịch...</span>
                      </div>
                    )}

                    {question.transcript && question.section === 'listening' && (
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5">
                        <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🎧 Lời thoại bài nghe (Transcript):</span>
                        </p>
                        <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300 font-sans text-xs sm:text-sm pl-2.5 border-l-2 border-blue-400 dark:border-blue-600">
                          {stripHtmlTags(question.transcript)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Fixed Navigation Footer (Prev / Next / Palette) */}
      <footer className="shrink-0 border-t border-slate-200 bg-slate-50 p-2 sm:p-2.5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900 gap-2 select-none z-10">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className={`inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 font-mono text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer ${
            !hasPrev ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="Câu trước (Phím tắt: ←)"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Câu trước</span>
          <span className="sm:hidden">Trước</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-mono tabular-nums text-xs font-medium text-slate-600 dark:text-slate-400">
            {selectedOption ? `Đã chọn: (${selectedOption})` : 'Chưa chọn'}
          </span>
          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              title="Mở bảng điều hướng câu hỏi"
            >
              <Grid className="h-3.5 w-3.5 text-slate-500" />
              <span>Bảng câu hỏi</span>
              {paletteStats && (
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  ({paletteStats.answered}/{paletteStats.total})
                </span>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-1 rounded-sm bg-slate-900 px-3 sm:px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer ${
            !hasNext ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="Câu tiếp theo (Phím tắt: →)"
        >
          <span className="hidden sm:inline">Câu tiếp theo</span>
          <span className="sm:hidden">Tiếp theo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </footer>

      {/* Lightbox / Zoomed image modal */}
      {isImageZoomed && question.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-[80vh]">
            <Image
              src={question.imageUrl}
              alt="Phóng to ảnh"
              fill
              unoptimized
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="absolute top-2 right-2 rounded-sm bg-black/70 p-1.5 text-white hover:bg-black/90 cursor-pointer border border-slate-600"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
