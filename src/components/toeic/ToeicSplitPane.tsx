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

  // Passage segments for reading Part 6 & 7 (handles multi-passages split by '---')
  const passageSegments = useMemo(() => {
    if (!question.passage) return [];
    return question.passage.split(/\n\s*---\s*\n/).map((p) => p.trim());
  }, [question.passage]);

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-48px)] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 ${className}`}
    >
      {/* ── Left Column: Stimulus Pane (Audio / Photo / Passages) ── */}
      <section
        aria-label="Tài liệu đề thi"
        className="lg:col-span-6 xl:col-span-7 flex flex-col h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        {/* Pane header info */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-xs border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {question.section === 'listening' ? (
                <Headphones className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {question.section === 'listening'
                ? `Listening — Part ${question.part}`
                : `Reading — Part ${question.part}`}
            </span>
          </div>

          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {question.section === 'listening' ? 'Tài liệu nghe' : 'Đoạn văn đọc hiểu'}
          </span>
        </div>

        {/* Scrollable Stimulus Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* 1. Audio Player for Listening Parts 1-4 */}
          {question.section === 'listening' && question.audioUrl && (
            <div className="sticky top-0 z-10 pb-2">
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
            <div className="space-y-2">
              <div className="relative group overflow-hidden rounded-sm border border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-900">
                <div className="relative h-64 sm:h-80 md:h-96 w-full">
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
                  className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-black/70 text-white shadow-none transition hover:bg-black/90 cursor-pointer"
                  title="Phóng to ảnh"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-center font-mono text-xs text-slate-500 dark:text-slate-400">
                Quan sát hình ảnh và lắng nghe 4 phương án (A), (B), (C), (D) để chọn đáp án đúng.
              </p>
            </div>
          )}

          {/* 3. Part 2 Directions / Prompt */}
          {question.part === 2 && (
            <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
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
              <div className="relative h-60 sm:h-72 w-full">
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
            <div className="space-y-4">
              {passageSegments.map((segment, idx) => (
                <article
                  key={idx}
                  className="rounded-sm border border-slate-200 bg-slate-50/60 p-4 sm:p-5 shadow-none dark:border-slate-800 dark:bg-slate-900/40"
                >
                  {passageSegments.length > 1 && (
                    <div className="mb-3 inline-flex items-center rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Đoạn văn {idx + 1}
                    </div>
                  )}
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-serif text-slate-800 dark:text-slate-200">
                    {segment}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Transcript in Practice Mode (Listening only) */}
          {!isExamMode && showExplanation && question.transcript && question.section === 'listening' && (
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-800/40">
              <p className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                Lời thoại bài nghe (Transcript):
              </p>
              <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                {stripHtmlTags(question.transcript)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Right Column: Question & Options Area ── */}
      <section
        aria-label="Khu vực câu hỏi và đáp án"
        className="lg:col-span-6 xl:col-span-5 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900"
      >
        {/* Question Header: Number & Flag Button */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Câu [{String(question.questionNumber).padStart(3, '0')}]
            </span>
            <span className="text-xs text-slate-500">/ {totalQuestions}</span>
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
              <span>{isFlagged ? 'Đã gắn cờ (F)' : 'Gắn cờ (F)'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Question Prompt and Options */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* Question Prompt */}
          {question.prompt && (
            <div className="rounded-sm bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {stripHtmlTags(question.prompt)}
              </p>
            </div>
          )}

          {/* Options List (A, B, C, D) */}
          <div className="space-y-2.5" role="radiogroup" aria-label="Các phương án lựa chọn">
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
                  className={`group relative flex w-full items-center gap-3 rounded-sm border p-3 text-left text-sm sm:text-base transition-colors duration-100 cursor-pointer select-none min-h-[48px] ${
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
                      <span>Đáp án đúng</span>
                    </span>
                  )}
                  {isWrongSelection && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0">
                      <XCircle className="h-4 w-4" />
                      <span>Sai</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Keyboard shortcut hint */}
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
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

          {/* Explanation Box in Practice Mode */}
          {!isExamMode && onToggleExplanation && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onToggleExplanation}
                className="inline-flex items-center gap-1.5 rounded-sm border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              >
                <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>{showExplanation ? '▲ Ẩn giải thích' : '💡 Xem giải thích chi tiết ▼'}</span>
              </button>

              {showExplanation && (
                <div className="mt-2.5 rounded-sm border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 space-y-2.5 animate-in fade-in duration-100">
                  {/* Status Banner */}
                  {selectedOption && question.correctAnswer && (
                    <div className="flex items-center gap-2 font-mono text-xs font-bold">
                      {selectedOption === question.correctAnswer ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Chính xác! Đáp án đúng là ({question.correctAnswer})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                          <XCircle className="h-4 w-4 shrink-0" />
                          <span>Chưa chính xác. Bạn chọn ({selectedOption}) — Đáp án đúng: ({question.correctAnswer})</span>
                        </span>
                      )}
                    </div>
                  )}

                  {!selectedOption && question.correctAnswer && (
                    <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>Đáp án đúng của câu này: ({question.correctAnswer})</span>
                    </div>
                  )}

                  {question.explanationVi ? (
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Giải thích chi tiết:
                      </p>
                      <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                        {stripHtmlTags(question.explanationVi)}
                      </div>
                    </div>
                  ) : question.correctAnswer ? (
                    <p className="text-slate-500 text-xs">
                      Đáp án chuẩn ETS: <strong>({question.correctAnswer})</strong>.
                    </p>
                  ) : null}

                  {question.transcript && question.section === 'listening' && (
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                      <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Lời thoại bài nghe (Transcript):
                      </p>
                      <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300 font-sans">
                        {stripHtmlTags(question.transcript)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Navigation Footer (Prev / Next) */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-2 sm:p-2.5 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900 gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={`inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 shadow-none transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer ${
              !hasPrev ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-xs font-medium text-slate-600 dark:text-slate-400">
              {selectedOption ? `Đã chọn: (${selectedOption})` : 'Chưa chọn'}
            </span>
            {onOpenPalette && (
              <button
                type="button"
                onClick={onOpenPalette}
                className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                title="Mở bảng điều hướng câu hỏi"
              >
                <Grid className="h-3 w-3" />
                <span className="hidden sm:inline">Bảng câu hỏi</span>
                {paletteStats && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
            className={`inline-flex items-center gap-1 rounded-sm bg-slate-900 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-none transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer ${
              !hasNext ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

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
