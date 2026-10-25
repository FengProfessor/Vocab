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
  ToeicClientQuestionCluster,
} from '@/types/toeic';
import { ToeicAudioPlayer } from './ToeicAudioPlayer';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';

export function stripHtmlTags(str?: string): string {
  if (!str) return '';
  let text = str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n\n')
    .replace(/<\/(?:td|th)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // Decimal and hex numerical HTML entities (e.g. &#8217; or &#x2019;)
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    try {
      const code = parseInt(dec, 10);
      return code >= 32 ? String.fromCharCode(code) : ' ';
    } catch {
      return ' ';
    }
  });
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      const code = parseInt(hex, 16);
      return code >= 32 ? String.fromCharCode(code) : ' ';
    } catch {
      return ' ';
    }
  });

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

  // Replace unicode non-breaking space with regular space
  text = text.replace(/\u00a0/g, ' ');

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strips HTML tags and removes redundant leading question numbers or labels
 * (e.g. "162. What is...", "Câu 162: What is...", "Question 162: What is...")
 */
export function cleanQuestionPrompt(prompt?: string): string {
  if (!prompt) return '';
  const stripped = stripHtmlTags(prompt);
  return stripped
    .replace(/^(?:(?:Câu|Question)\s*\d+[\s.:\)-]*|\d+[\s.:\)-]+)\s*/i, '')
    .trim();
}

/**
 * Strips HTML tags and removes redundant leading option keys
 * (e.g. "(A) ", "A. ", "A) ") since the UI already renders a prominent [ A ] badge.
 */
export function cleanOptionText(text?: string, optionKey?: string): string {
  if (!text) return '';
  let cleaned = stripHtmlTags(text);
  if (optionKey) {
    const keyRegex = new RegExp(`^\\s*(?:\\(${optionKey}\\)|${optionKey}[.:\\)])\\s*`, 'i');
    cleaned = cleaned.replace(keyRegex, '');
  } else {
    cleaned = cleaned.replace(/^\s*(?:\([A-Da-d]\)|[A-Da-d][.:\)])\s*/, '');
  }
  return cleaned.trim();
}

export interface ToeicSplitPaneProps {
  question: ToeicClientQuestion;
  cluster?: ToeicClientQuestionCluster | null;
  mode?: ToeicExamMode;
  selectedOption?: ToeicOptionKey;
  answers?: Record<number, ToeicOptionKey>;
  isFlagged?: boolean;
  flagged?: Set<number>;
  onSelectOption: (option: ToeicOptionKey, questionNumber?: number) => void;
  onToggleFlag: (questionNumber?: number) => void;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  totalQuestions: number;
  showExplanation?: boolean;
  onToggleExplanation?: (questionNumber?: number) => void;
  onEnablePracticeMode?: () => void;
  onOpenPalette?: () => void;
  paletteStats?: { answered: number; total: number };
  className?: string;
}

interface ClusterQuestionCardProps {
  childQ: ToeicClientQuestion;
  currentQNum: number;
  answers?: Record<number, ToeicOptionKey>;
  selectedOption?: ToeicOptionKey;
  flagged?: Set<number>;
  isFlagged?: boolean;
  isExamMode: boolean;
  showExplanation: boolean;
  onSelectOption: (option: ToeicOptionKey, questionNumber?: number) => void;
  onToggleFlag: (questionNumber?: number) => void;
  isScannedFormat: boolean;
  clusterTranscript?: string | null;
}

function ClusterQuestionCard({
  childQ,
  currentQNum,
  answers,
  selectedOption,
  flagged,
  isFlagged = false,
  isExamMode,
  showExplanation,
  onSelectOption,
  onToggleFlag,
  isScannedFormat,
  clusterTranscript,
}: ClusterQuestionCardProps) {
  const qNum = childQ.questionNumber;
  const childSelected =
    answers?.[qNum] ??
    (qNum === currentQNum ? selectedOption : undefined);
  const childIsFlagged =
    flagged?.has(qNum) ??
    (qNum === currentQNum ? isFlagged : false);
  const childIsAnswered = Boolean(childSelected);
  const childReveal = !isExamMode && (showExplanation || childIsAnswered);
  const isFocused = qNum === currentQNum;

  return (
    <article
      key={childQ.id || qNum}
      id={`toeic-question-${qNum}`}
      className={`rounded-sm border transition-all p-3.5 sm:p-5 space-y-3.5 ${
        isFocused
          ? 'border-blue-400 bg-white ring-1 ring-blue-500/20 dark:border-blue-600 dark:bg-slate-900/90 shadow-2xs'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-2xs'
      }`}
    >
      {/* Question Card Header (Study4 style with circular question badge) */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shadow-2xs mt-0.5">
            {qNum}
          </span>

          {childQ.prompt && !isScannedFormat ? (
            <h4 className="flex-1 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words pt-0.5">
              <ExamInteractiveText
                text={cleanQuestionPrompt(childQ.prompt)}
                enabled={childReveal}
              />
            </h4>
          ) : (
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
              {isScannedFormat
                ? 'Quan sát đề thi gốc ETS bên trái và chọn đáp án đúng:'
                : `Câu hỏi ${qNum}`}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleFlag(qNum)}
          className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-xs font-medium transition cursor-pointer select-none border shrink-0 ${
            childIsFlagged
              ? 'bg-amber-500 text-white border-amber-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Gắn cờ câu hỏi này để xem lại sau (Phím tắt: F)"
        >
          <Flag className={`h-3 w-3 ${childIsFlagged ? 'fill-white text-white' : ''}`} />
          <span className="hidden sm:inline">{childIsFlagged ? 'Đã cờ' : 'Cờ'}</span>
        </button>
      </div>

      {/* Options List */}
      {isScannedFormat ? (
        /* Format B: Scanned Booklet format (compact row [A][B][C][D]) */
        <div
          className="grid grid-cols-4 gap-2 sm:gap-2.5 pt-1"
          role="radiogroup"
          aria-label={`Đáp án câu ${qNum}`}
        >
          {(['A', 'B', 'C', 'D'] as ToeicOptionKey[]).map((key) => {
            const isSelected = childSelected === key;
            const isCorrect = childReveal && childQ.correctAnswer === key;
            const isWrong =
              childReveal && isSelected && childQ.correctAnswer !== key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectOption(key, qNum)}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-sm border transition cursor-pointer select-none min-h-[46px] ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-100 font-bold shadow-xs'
                    : isWrong
                    ? 'border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100 font-bold shadow-xs'
                    : isSelected
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs scale-[1.02]'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 font-medium'
                }`}
              >
                <span className="font-mono text-sm sm:text-base font-black tracking-tight">
                  [ {key} ]
                </span>
                {isCorrect && (
                  <span className="mt-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Đúng
                  </span>
                )}
                {isWrong && (
                  <span className="mt-0.5 font-mono text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-0.5">
                    <XCircle className="h-2.5 w-2.5" /> Sai
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Format A: Text Questions (Study4 clean radio options style) */
        <div
          className="grid grid-cols-1 gap-2 sm:gap-2.5 pt-1"
          role="radiogroup"
          aria-label={`Lựa chọn câu ${qNum}`}
        >
          {childQ.options.map((opt) => {
            const isSelected = childSelected === opt.key;
            const isCorrect = childReveal && childQ.correctAnswer === opt.key;
            const isWrong =
              childReveal && isSelected && childQ.correctAnswer !== opt.key;

            return (
              <button
                key={opt.key}
                type="button"
                onClick={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (
                    target?.closest?.('.exam-lookup-trigger') ||
                    target?.closest?.('.exam-lookup-card')
                  ) {
                    return;
                  }
                  onSelectOption(opt.key, qNum);
                }}
                className={`group relative flex w-full items-start gap-3 rounded-sm border p-2.5 sm:p-3 text-left transition-colors cursor-pointer ${
                  childReveal ? 'select-text' : 'select-none'
                } min-h-[44px] ${
                  isCorrect
                    ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium'
                    : isWrong
                    ? 'border-rose-500 bg-rose-50/60 text-rose-950 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-100 font-medium'
                    : isSelected
                    ? 'border-slate-900 bg-slate-50/80 dark:border-slate-300 dark:bg-slate-800/80 text-slate-900 dark:text-white font-medium shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 font-normal'
                }`}
              >
                {/* Round Radio Indicator (Study4 style) */}
                <span
                  className={`rounded-full w-3.5 h-3.5 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isCorrect
                      ? 'border-emerald-600 bg-white dark:bg-slate-900'
                      : isWrong
                      ? 'border-rose-600 bg-white dark:bg-slate-900'
                      : isSelected
                      ? 'border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-900'
                      : 'border-slate-300 group-hover:border-slate-500 dark:border-slate-600 dark:group-hover:border-slate-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isCorrect && (
                    <span className="rounded-full w-1.5 h-1.5 bg-emerald-600" />
                  )}
                  {isWrong && (
                    <span className="rounded-full w-1.5 h-1.5 bg-rose-600" />
                  )}
                  {isSelected && !isCorrect && !isWrong && (
                    <span className="rounded-full w-1.5 h-1.5 bg-slate-900 dark:bg-slate-100" />
                  )}
                </span>

                {/* Option Key prefix (A., B., C., D.) */}
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {opt.key}.
                </span>

                {/* Option Text with click-to-lookup vocabulary */}
                <span className="flex-1 text-xs sm:text-sm leading-relaxed break-words text-slate-800 dark:text-slate-200">
                  <ExamInteractiveText
                    text={cleanOptionText(opt.text, opt.key)}
                    enabled={childReveal}
                  />
                </span>

                {/* Visual Status Badges */}
                {isCorrect && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Đúng</span>
                  </span>
                )}
                {isWrong && (
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0">
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sai</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Practice Mode: Accordion Explanation */}
      {!isExamMode && childIsAnswered && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <details className="group/exp">
            <summary className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer list-none flex items-center justify-between p-1.5 rounded-xs hover:bg-amber-50 dark:hover:bg-amber-950/40">
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <span>Xem giải thích & bản dịch câu {qNum}</span>
              </span>
              <span className="group-open/exp:rotate-180 transition-transform text-slate-400">▼</span>
            </summary>
            <div className="mt-2 p-3 rounded-xs border border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-slate-950/80 text-xs space-y-2">
              {childQ.correctAnswer && (
                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  Đáp án đúng: ({childQ.correctAnswer})
                </p>
              )}
              {childQ.explanationVi ? (
                <div className="space-y-1">
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Phân tích ngữ pháp & bản dịch:
                  </p>
                  <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-amber-400">
                    {stripHtmlTags(childQ.explanationVi)}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 font-mono text-[11px]">
                  Đang nạp giải thích chi tiết...
                </p>
              )}
              {(childQ.transcript || clusterTranscript) && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-1">
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    🎧 Lời thoại đoạn nghe (Transcript):
                  </p>
                  <div className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300 font-sans pl-2 border-l-2 border-blue-400">
                    <ExamInteractiveText
                      text={stripHtmlTags(childQ.transcript || clusterTranscript || '')}
                      enabled={true}
                    />
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}
    </article>
  );
}

export interface ToeicBilingualPassageProps {
  passage: string;
  passageTranslationVi?: string;
  dichNghia?: string;
  part: number;
  isAnswerRevealed?: boolean;
  canRevealTranslation?: boolean;
  mode?: 'en' | 'bilingual';
  initialMode?: 'en' | 'bilingual';
  onModeChange?: (mode: 'en' | 'bilingual') => void;
  className?: string;
}

export function ToeicBilingualPassage({
  passage,
  passageTranslationVi,
  dichNghia,
  part,
  isAnswerRevealed = true,
  canRevealTranslation = true,
  mode: controlledMode,
  initialMode = 'en',
  onModeChange,
  className = '',
}: ToeicBilingualPassageProps) {
  const [internalMode, setInternalMode] = useState<'en' | 'bilingual'>(initialMode);
  const [mobileTab, setMobileTab] = useState<'en' | 'vi'>('en');

  const langMode = controlledMode !== undefined ? controlledMode : internalMode;

  const handleModeChange = (newMode: 'en' | 'bilingual') => {
    if (controlledMode === undefined) {
      setInternalMode(newMode);
    }
    onModeChange?.(newMode);
  };

  const rawTranslation = canRevealTranslation
    ? (passageTranslationVi || dichNghia || '')
    : '';
  const hasTranslation = Boolean(rawTranslation && rawTranslation.trim().length > 0);

  // Parse English passage segments (handles multi-passages separated by '---')
  const passageSegments = useMemo(() => {
    if (!passage) return [];
    const normalized = passage
      .replace(/<(?:p|div|br)[^>]*>\s*---\s*<\/(?:p|div)>/gi, '\n\n---\n\n')
      .replace(/<br\s*\/?>\s*---\s*<br\s*\/?>/gi, '\n\n---\n\n');
    return normalized
      .split(/\n\s*---\s*\n/)
      .map((p) => stripHtmlTags(p).trim())
      .filter(Boolean);
  }, [passage]);

  // Parse Vietnamese translation segments if separated by '---'
  const translationSegments = useMemo(() => {
    if (!rawTranslation) return [];
    const normalized = rawTranslation
      .replace(/<(?:p|div|br)[^>]*>\s*---\s*<\/(?:p|div)>/gi, '\n\n---\n\n')
      .replace(/<br\s*\/?>\s*---\s*<br\s*\/?>/gi, '\n\n---\n\n');
    return normalized
      .split(/\n\s*---\s*\n/)
      .map((p) => stripHtmlTags(p).trim())
      .filter(Boolean);
  }, [rawTranslation]);

  if (passageSegments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Top Bar with Bilingual Segmented Switcher when translation is available */}
      {hasTranslation && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              {passageSegments.length > 1
                ? `Văn bản đọc hiểu Part ${part} (${passageSegments.length} đoạn)`
                : `Văn bản đọc hiểu Part ${part}`}
            </span>
          </span>

          {/* Bilingual Segmented Switcher */}
          <div className="inline-flex items-center rounded-sm border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-mono select-none">
            <button
              type="button"
              onClick={() => handleModeChange('en')}
              className={`px-2.5 py-1 rounded-xs font-semibold transition cursor-pointer ${
                langMode === 'en'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇬🇧 Chỉ xem tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('bilingual')}
              className={`px-2.5 py-1 rounded-xs font-semibold transition cursor-pointer ${
                langMode === 'bilingual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇻🇳 Xem song ngữ / Bản dịch
            </button>
          </div>
        </div>
      )}

      {/* Mode A: English Only */}
      {(!hasTranslation || langMode === 'en') && (
        <div className="space-y-4">
          {passageSegments.map((segment, idx) => (
            <article
              key={idx}
              className="flex-1 flex flex-col justify-between rounded-sm border border-slate-200 bg-slate-50/50 p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900/40 min-h-[300px]"
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
                  <ExamInteractiveText text={segment} enabled={isAnswerRevealed} />
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                <span>📄 Đọc kỹ thông tin đoạn văn trên để trả lời câu hỏi</span>
                <span>Part {part}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Mode B: Bilingual (Desktop Side-by-Side >= 1024px, Mobile Tabbed < 1024px) */}
      {hasTranslation && langMode === 'bilingual' && (
        <div className="space-y-4">
          {/* Mobile switcher between English stimulus and Vietnamese translation (< 1024px) */}
          <div className="lg:hidden flex items-center justify-between rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/90 p-1 text-xs font-mono select-none">
            <button
              type="button"
              onClick={() => setMobileTab('en')}
              className={`flex-1 py-1.5 px-3 text-center rounded-xs font-semibold transition cursor-pointer ${
                mobileTab === 'en'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇬🇧 Tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('vi')}
              className={`flex-1 py-1.5 px-3 text-center rounded-xs font-semibold transition cursor-pointer ${
                mobileTab === 'vi'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🇻🇳 Bản dịch tiếng Việt
            </button>
          </div>

          {/* Responsive Dual-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
            {/* Left Column: English Stimulus with ExamInteractiveText */}
            <div className={`${mobileTab === 'en' ? 'block' : 'hidden lg:block'} space-y-3`}>
              <div className="hidden lg:flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🇬🇧</span>
                  <span>Văn bản gốc tiếng Anh</span>
                </span>
                <span className="text-[10px] text-slate-400">ETS Original</span>
              </div>

              {passageSegments.map((segment, idx) => (
                <article
                  key={idx}
                  className="rounded-sm border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-3"
                >
                  {passageSegments.length > 1 && (
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 text-slate-500 font-mono text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Đoạn {idx + 1}/{passageSegments.length}
                      </span>
                      <span className="text-[10px] text-slate-400">Stimulus</span>
                    </div>
                  )}
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    <ExamInteractiveText text={segment} enabled={isAnswerRevealed} />
                  </div>
                </article>
              ))}
            </div>

            {/* Right Column: Vietnamese Translation */}
            <div className={`${mobileTab === 'vi' ? 'block' : 'hidden lg:block'} space-y-3`}>
              <div className="hidden lg:flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🇻🇳</span>
                  <span>Bản dịch tiếng Việt</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold">
                  Song ngữ đối soát
                </span>
              </div>

              <div className="rounded-sm border border-slate-200 bg-slate-50/80 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/50 shadow-2xs border-l-2 border-l-emerald-500 dark:border-l-emerald-500 space-y-3">
                {translationSegments.length > 1 ? (
                  translationSegments.map((transSeg, idx) => (
                    <div
                      key={idx}
                      className="space-y-1.5 pb-3 last:pb-0 border-b last:border-b-0 border-slate-200/60 dark:border-slate-800/60"
                    >
                      <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                        Bản dịch đoạn {idx + 1}/{translationSegments.length}
                      </span>
                      <p className="text-xs sm:text-sm font-sans leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {transSeg}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm font-sans leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {stripHtmlTags(rawTranslation)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
            <span>📄 Đối soát song ngữ Anh - Việt để làm rõ ngữ cảnh câu hỏi</span>
            <span>Part {part}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ToeicSplitPane({
  question,
  cluster,
  mode = 'real',
  selectedOption,
  answers,
  isFlagged = false,
  flagged,
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
  const isAnswerRevealed = !isExamMode && (showExplanation || Boolean(selectedOption));
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);

  const isClusterView = Boolean(
    cluster &&
    (cluster.part === 3 || cluster.part === 4) &&
    cluster.questions &&
    cluster.questions.length > 0
  );
  const clusterQuestions: ToeicClientQuestion[] =
    isClusterView && cluster ? cluster.questions : [question];

  const isScannedFormat = Boolean(
    isClusterView &&
    cluster &&
    (cluster.clusterType === 'scanned_image' ||
      (Boolean(cluster.imageUrl) &&
        clusterQuestions.every((q) => !q.prompt || q.prompt.trim() === '')))
  );

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
        const matchingOption = question.options?.find((opt) => opt.key === key) || ['A', 'B', 'C', 'D'].includes(key);
        if (matchingOption) {
          e.preventDefault();
          onSelectOption(key as ToeicOptionKey, question.questionNumber);
        }
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (key === 'F') {
        e.preventDefault();
        onToggleFlag(question.questionNumber);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNext, hasPrev, onNext, onPrev, onSelectOption, onToggleFlag, question.options, question.questionNumber]);

  const isReadingPart = question.part === 6 || question.part === 7;
  const hasReadingPassageText = Boolean(isReadingPart && question.passage);
  const hasReadingPassageImage = Boolean(isReadingPart && question.imageUrl);
  const isReadingWithPassage = hasReadingPassageText || hasReadingPassageImage;
  const isPart5 = question.part === 5;
  const [mobileTab, setMobileTab] = useState<'passage' | 'question'>('question');
  const [passageLangMode, setPassageLangMode] = useState<'en' | 'bilingual'>('en');

  // Track previous passage to avoid resetting mobile tab to 'question' when navigating questions within the same reading passage in Part 6 & 7
  const stimulusKey = question.passage || (isReadingPart ? question.imageUrl : undefined);
  const prevPassageRef = React.useRef<string | undefined>(stimulusKey);
  useEffect(() => {
    if (isReadingWithPassage) {
      if (question.passage !== prevPassageRef.current && stimulusKey !== prevPassageRef.current) {
        prevPassageRef.current = stimulusKey;
        setMobileTab('question');
      }
    } else {
      prevPassageRef.current = undefined;
      setMobileTab('question');
    }
  }, [question.id, question.passage, stimulusKey, isReadingWithPassage]);

  // Passage segments for reading Part 6 & 7 (handles multi-passages split by '---')
  const passageSegments = useMemo(() => {
    if (!question.passage) return [];
    const normalized = question.passage
      .replace(/<(?:p|div|br)[^>]*>\s*---\s*<\/(?:p|div)>/gi, '\n\n---\n\n')
      .replace(/<br\s*\/?>\s*---\s*<br\s*\/?>/gi, '\n\n---\n\n');
    return normalized
      .split(/\n\s*---\s*\n/)
      .map((p) => stripHtmlTags(p).trim())
      .filter(Boolean);
  }, [question.passage]);

  // Check if there is an authentic visual stimulus (photo, graphic image, scanned booklet crop, or reading passage)
  const hasVisualStimulus = Boolean(
    question.part === 1
      ? Boolean(question.imageUrl)
      : isReadingPart
      ? isReadingWithPassage
      : isClusterView
      ? Boolean(cluster?.imageUrl)
      : Boolean(question.imageUrl)
  );

  // Auto-scroll the active question in a cluster into view
  useEffect(() => {
    if (isClusterView) {
      const el = document.getElementById(`toeic-question-${question.questionNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [question.questionNumber, isClusterView]);

  const renderSingleQuestionCard = (isCentered = false) => (
    <div className={`flex flex-col ${isCentered ? 'space-y-4' : 'h-full overflow-hidden'}`}>
      {/* Question Header: Number & Flag Button */}
      <div className={`shrink-0 flex items-center justify-between border-b border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 ${isCentered ? 'rounded-t-sm border' : ''}`}>
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
            onClick={() => onToggleFlag(question.questionNumber)}
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
      <div className={`${isCentered ? 'p-4 sm:p-5 bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-sm space-y-4 shadow-2xs' : 'flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin'}`}>
        {/* Mobile quick jump to reading passage */}
        {isReadingWithPassage && (
          <button
            type="button"
            onClick={() => setMobileTab('passage')}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer mb-1"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Xem lại bài đọc ({passageSegments.length > 1 ? `${passageSegments.length} đoạn` : 'tài liệu/văn bản'}) →</span>
          </button>
        )}

        {/* Question Prompt */}
        {question.prompt ? (
          <div className="rounded-sm bg-slate-50 p-3 sm:p-3.5 border border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
            <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed break-words">
              <ExamInteractiveText text={cleanQuestionPrompt(question.prompt)} enabled={isAnswerRevealed} />
            </p>
          </div>
        ) : question.part === 2 ? (
          <div className="rounded-sm bg-slate-50/70 p-3 sm:p-3.5 border border-slate-200 text-center dark:bg-slate-900/40 dark:border-slate-800">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Part 2: Lắng nghe và chọn câu trả lời tốt nhất
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Chọn một trong 3 phương án (A), (B), hoặc (C) phù hợp nhất với câu hỏi đã nghe.
            </p>
          </div>
        ) : null}

        {/* Practice Mode Hint */}
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
                onClick={() => onToggleExplanation(question.questionNumber)}
                className="font-mono text-[11px] font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 underline cursor-pointer shrink-0 ml-2"
              >
                Xem trước
              </button>
            )}
          </div>
        )}

        {/* Options List */}
        {question.part === 1 || question.part === 2 ? (
          <div
            className={`grid ${question.part === 2 || question.options.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-2 sm:gap-3`}
            role="radiogroup"
            aria-label="Các phương án lựa chọn (A, B, C, D)"
          >
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
                  className={`group relative flex flex-col items-center justify-center px-2 py-3 sm:p-4 rounded-sm border transition-all duration-100 cursor-pointer select-none min-h-[52px] sm:min-h-[58px] ${
                    isCorrectAnswer
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-100 font-bold shadow-xs'
                      : isWrongSelection
                      ? 'border-rose-500 bg-rose-50 text-rose-950 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100 font-bold shadow-xs'
                      : isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold shadow-xs scale-[1.02]'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <span className="font-mono text-base sm:text-lg font-black tracking-tight whitespace-nowrap">
                    [ {opt.key} ]
                  </span>
                  {isCorrectAnswer && (
                    <span className="mt-1 font-mono text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> Đúng
                    </span>
                  )}
                  {isWrongSelection && (
                    <span className="mt-1 font-mono text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center justify-center gap-0.5 whitespace-nowrap">
                      <XCircle className="h-3 w-3 shrink-0" /> Sai
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-2 sm:gap-2.5"
            role="radiogroup"
            aria-label="Các phương án lựa chọn"
          >
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
                  onClick={(e) => {
                    const target = e.target as HTMLElement | null;
                    if (
                      target?.closest?.('.exam-lookup-trigger') ||
                      target?.closest?.('.exam-lookup-card')
                    ) {
                      return;
                    }
                    onSelectOption(opt.key);
                  }}
                  className={`group relative flex w-full items-start gap-2.5 sm:gap-3 rounded-sm border p-2.5 sm:p-3 text-left text-xs sm:text-sm lg:text-base transition-colors duration-100 cursor-pointer ${
                    isAnswerRevealed ? 'select-text' : 'select-none'
                  } min-h-[44px] sm:min-h-[48px] ${
                    isCorrectAnswer
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100 font-medium'
                      : isWrongSelection
                      ? 'border-rose-500 bg-rose-50/60 text-rose-950 dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-100 font-medium'
                      : isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 font-normal'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold border transition-colors mt-0.5 sm:mt-0 ${
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

                  <span className="flex-1 leading-snug break-words">
                    <ExamInteractiveText
                      text={cleanOptionText(opt.text, opt.key)}
                      enabled={isAnswerRevealed}
                    />
                  </span>

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
        )}

        {/* Keyboard shortcut hint */}
        <p className="hidden md:block font-mono text-[11px] text-slate-500 dark:text-slate-400">
          Phím tắt: <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">A</kbd>,{' '}
          <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">B</kbd>,{' '}
          <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">C</kbd>,{' '}
          <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">D</kbd> chọn đáp án |{' '}
          <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">F</kbd> gắn cờ |{' '}
          <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">←</kbd> <kbd className="px-1 py-0.5 rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">→</kbd> chuyển câu
        </p>

        {/* Practice Mode Banner & Detailed Explanation */}
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

        {!isExamMode && onToggleExplanation && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onToggleExplanation(question.questionNumber)}
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
                      <p>{stripHtmlTags(question.explanationVi)}</p>
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
                      <ExamInteractiveText
                        text={stripHtmlTags(question.transcript)}
                        enabled={isAnswerRevealed}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-[calc(100dvh-48px)] w-full overflow-hidden bg-slate-100 dark:bg-slate-950 ${className}`}
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

      {/* Main Content Area: Adaptive Single-Column Canvas vs 2-Column Split-Pane */}
      {!hasVisualStimulus && isClusterView && cluster ? (
        /* ══════════════════════════════════════════════════════════════════
           Adaptive Single-Column Exam Canvas (Part 3 & 4 Pure Audio Clusters)
           Study4 / Authentic ETS Style: Full-width audio player + 3 stacked questions
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
          {/* Sticky Top Audio Player Bar */}
          <div className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-2 sm:px-6 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 z-20">
            <div className="max-w-4xl mx-auto">
              <ToeicAudioPlayer
                key={cluster.clusterId}
                src={cluster.audioUrl}
                title={`Part ${cluster.part}: ${cluster.part === 4 ? 'Bài nói' : 'Hội thoại'} câu ${cluster.startQuestionNumber} – ${cluster.endQuestionNumber}`}
                mode={mode}
                autoPlayInExamMode={true}
              />
            </div>
          </div>

          {/* Sub-header: Part Label, Question Range & Progress Indicators */}
          <div className="shrink-0 border-b border-slate-200 bg-slate-100/70 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Part {cluster.part}: {cluster.part === 4 ? 'Bài nói' : 'Hội thoại'} câu [{cluster.startQuestionNumber} – {cluster.endQuestionNumber}]
                </span>
                <span className="text-slate-400">/ {totalQuestions}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {clusterQuestions.map((q) => {
                  const isAns = Boolean(
                    answers?.[q.questionNumber] ??
                      (q.questionNumber === question.questionNumber ? selectedOption : undefined)
                  );
                  const isCur = q.questionNumber === question.questionNumber;
                  return (
                    <span
                      key={q.questionNumber}
                      className={`px-1.5 py-0.5 rounded-xs text-[11px] font-bold border transition ${
                        isAns
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                          : isCur
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                          : 'border-slate-200 text-slate-500 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {q.questionNumber}: {isAns ? '✓' : '○'}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scrollable Questions Stack (Study4 Spacious Paper Exam Layout) */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 scrollbar-thin">
            <div className="max-w-4xl mx-auto space-y-5 pb-12">
              {clusterQuestions.map((childQ) => (
                <ClusterQuestionCard
                  key={childQ.id || childQ.questionNumber}
                  childQ={childQ}
                  currentQNum={question.questionNumber}
                  answers={answers}
                  selectedOption={selectedOption}
                  flagged={flagged}
                  isFlagged={isFlagged}
                  isExamMode={isExamMode}
                  showExplanation={showExplanation}
                  onSelectOption={onSelectOption}
                  onToggleFlag={onToggleFlag}
                  isScannedFormat={isScannedFormat}
                  clusterTranscript={cluster.transcript}
                />
              ))}
            </div>
          </div>
        </div>
      ) : !hasVisualStimulus && !isClusterView ? (
        /* ══════════════════════════════════════════════════════════════════
           Adaptive Single-Column Canvas for Part 2 & Part 5
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
          {question.section === 'listening' && question.audioUrl && (
            <div className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-2 sm:px-6 shadow-2xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 z-20">
              <div className="max-w-2xl mx-auto">
                <ToeicAudioPlayer
                  key={`single-audio-${question.id}`}
                  src={question.audioUrl}
                  title={`Part ${question.part} Audio (Câu ${question.questionNumber})`}
                  mode={mode}
                  autoPlayInExamMode={true}
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 scrollbar-thin">
            <div className={`${question.part === 2 ? 'max-w-2xl' : 'max-w-3xl'} mx-auto space-y-5 pb-12`}>
              {renderSingleQuestionCard(true)}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           2-Column Split-Pane (Stimulus Left, Questions Right)
           For: Part 1 Photo, Part 3/4 Graphics/Scanned Crops, Part 6/7 Reading
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Stimulus Pane (Audio / Photo / Passages) */}
          <section
            aria-label="Tài liệu đề thi"
            className={`${
              isPart5
                ? 'hidden lg:flex'
                : isReadingWithPassage
                ? mobileTab === 'passage'
                  ? 'flex flex-col flex-1 overflow-hidden'
                  : 'hidden lg:flex'
                : 'flex flex-col shrink-0 max-h-[50vh] sm:max-h-[52vh] overflow-y-auto'
            } lg:col-span-6 xl:col-span-7 lg:max-h-none lg:h-full lg:overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`}
          >
            {/* Scrollable Stimulus Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 scrollbar-thin">
              {/* Audio player if needed */}
              {isClusterView && cluster ? (
                <div className="sticky top-0 z-20 pb-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
                  <ToeicAudioPlayer
                    key={cluster.clusterId}
                    src={cluster.audioUrl}
                    title={`Part ${cluster.part}: ${cluster.part === 4 ? 'Bài nói' : 'Hội thoại'} câu ${cluster.startQuestionNumber} – ${cluster.endQuestionNumber}`}
                    mode={mode}
                    autoPlayInExamMode={true}
                  />
                </div>
              ) : (
                question.section === 'listening' && question.audioUrl && (
                  <div className="sticky top-0 z-10 pb-1">
                    <ToeicAudioPlayer
                      key={`single-audio-${question.id}`}
                      src={question.audioUrl}
                      title={`Part ${question.part} Audio (Câu ${question.questionNumber})`}
                      mode={mode}
                      autoPlayInExamMode={true}
                    />
                  </div>
                )
              )}

              {/* Part 1 Photograph */}
              {question.part === 1 && question.imageUrl && (
                <div className="space-y-1.5 sm:space-y-2 -mx-3 sm:mx-0 -mt-1 sm:mt-0">
                  <div className="relative group overflow-hidden rounded-none sm:rounded-sm border-y sm:border border-slate-200 bg-slate-900/5 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-auto sm:h-80 md:h-88 lg:h-96">
                      <Image
                        src={question.imageUrl}
                        alt={`Photograph for Question ${question.questionNumber}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-0"
                        priority
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsImageZoomed(!isImageZoomed)}
                      className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-sm border border-slate-700 bg-black/70 text-white shadow-none transition hover:bg-black/90 cursor-pointer z-10"
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

              {/* Part 3 & 4 Cluster Stimulus: Graphic Image / Scanned Booklet Crop */}
              {isClusterView && cluster && cluster.imageUrl && (
                <div className="space-y-2">
                  <div className="relative group overflow-hidden rounded-sm border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 p-2 sm:p-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        {isScannedFormat
                          ? `Đề thi quét gốc ETS (Câu ${cluster.startQuestionNumber} – ${cluster.endQuestionNumber})`
                          : `Hình ảnh / Biểu đồ bổ trợ (Câu ${cluster.startQuestionNumber} – ${cluster.endQuestionNumber})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsImageZoomed(true)}
                        className="flex items-center gap-1 font-mono text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition px-2.5 py-1 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs font-semibold"
                        title="Phóng to hình ảnh"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Phóng to</span>
                      </button>
                    </div>

                    <div
                      className="relative w-full overflow-hidden flex justify-center cursor-zoom-in group/img"
                      onClick={() => setIsImageZoomed(true)}
                      title="Nhấp để phóng to toàn màn hình"
                    >
                      <img
                        src={cluster.imageUrl}
                        alt={`Tài liệu đề thi Part ${cluster.part} (Câu ${cluster.startQuestionNumber} – ${cluster.endQuestionNumber})`}
                        className="w-full h-auto object-contain rounded-xs select-none max-h-[75vh] lg:max-h-none transition-transform duration-200 group-hover/img:scale-[1.005]"
                        loading="eager"
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                      <span>🔍 Nhấp vào hình ảnh để phóng to toàn màn hình</span>
                      <span>ETS Part {cluster.part}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Part 6 & Part 7 Reading Image Stimulus */}
              {(question.part === 6 || question.part === 7) && question.imageUrl && (
                <div className="space-y-3">
                  <div className="relative group overflow-hidden rounded-sm border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 p-2 sm:p-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2.5">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        {question.part === 6 ? 'Part 6 — Văn bản đọc điền' : 'Part 7 — Đoạn văn đọc hiểu'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsImageZoomed(true)}
                        className="flex items-center gap-1 font-mono text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition px-2.5 py-1 rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer shadow-2xs font-semibold"
                        title="Phóng to tài liệu đọc"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Phóng to</span>
                      </button>
                    </div>

                    <div
                      className="relative w-full overflow-hidden flex justify-center cursor-zoom-in group/img"
                      onClick={() => setIsImageZoomed(true)}
                      title="Nhấp để phóng to toàn màn hình"
                    >
                      <img
                        src={question.imageUrl}
                        alt={`Tài liệu đọc Part ${question.part} (Câu ${question.questionNumber})`}
                        className="w-full h-auto object-contain rounded-xs select-none max-h-[75vh] lg:max-h-none transition-transform duration-200 group-hover/img:scale-[1.005]"
                        loading="eager"
                      />
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                      <span>🔍 Nhấp vào tài liệu để phóng to toàn màn hình</span>
                      <span>ETS Part {question.part}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Part 6 & Part 7 Text Reading Passages with Bilingual Support */}
              {(question.part === 6 || question.part === 7) && question.passage && (
                <div className="flex flex-col min-h-full space-y-4">
                  <ToeicBilingualPassage
                    passage={question.passage}
                    passageTranslationVi={question.passageTranslationVi}
                    dichNghia={question.dichNghia}
                    part={question.part}
                    isAnswerRevealed={isAnswerRevealed}
                    canRevealTranslation={!isExamMode}
                    mode={passageLangMode}
                    onModeChange={setPassageLangMode}
                  />
                </div>
              )}

              {/* Mobile switch to question button at bottom of stimulus pane */}
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
          </section>

          {/* Right Column: Question & Options Area */}
          <section
            aria-label="Khu vực câu hỏi và đáp án"
            className={`${
              isReadingWithPassage && mobileTab !== 'question'
                ? 'hidden lg:flex'
                : 'flex flex-col flex-1'
            } lg:col-span-6 xl:col-span-5 lg:h-full overflow-hidden bg-white dark:bg-slate-900`}
          >
            {isClusterView && cluster ? (
              <>
                {/* Cluster Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {cluster.part === 4 ? 'Bài nói' : 'Hội thoại'} câu [{cluster.startQuestionNumber} – {cluster.endQuestionNumber}]
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500">/ {totalQuestions}</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs">
                    {clusterQuestions.map((q) => {
                      const isAns = Boolean(
                        answers?.[q.questionNumber] ??
                          (q.questionNumber === question.questionNumber ? selectedOption : undefined)
                      );
                      const isCurrentFocus = q.questionNumber === question.questionNumber;
                      return (
                        <span
                          key={q.questionNumber}
                          className={`px-1.5 py-0.5 rounded-xs text-[11px] font-bold border transition ${
                            isAns
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                              : isCurrentFocus
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                              : 'border-slate-200 text-slate-500 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {q.questionNumber}: {isAns ? '✓' : '○'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable 3-Question Stack */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 scrollbar-thin">
                  {clusterQuestions.map((childQ) => (
                    <ClusterQuestionCard
                      key={childQ.id || childQ.questionNumber}
                      childQ={childQ}
                      currentQNum={question.questionNumber}
                      answers={answers}
                      selectedOption={selectedOption}
                      flagged={flagged}
                      isFlagged={isFlagged}
                      isExamMode={isExamMode}
                      showExplanation={showExplanation}
                      onSelectOption={onSelectOption}
                      onToggleFlag={onToggleFlag}
                      isScannedFormat={isScannedFormat}
                      clusterTranscript={cluster.transcript}
                    />
                  ))}
                </div>
              </>
            ) : (
              renderSingleQuestionCard(false)
            )}
          </section>
        </div>
      )}

      {/* Fixed Navigation Footer (Prev / Next / Palette) */}
      <footer className="shrink-0 border-t border-slate-200 bg-slate-50 p-2 sm:p-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between dark:border-slate-800 dark:bg-slate-900 gap-2 select-none z-10">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-sm border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 font-mono text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer ${
            !hasPrev ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title={isClusterView ? 'Cụm trước (Phím tắt: ←)' : 'Câu trước (Phím tắt: ←)'}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isClusterView ? 'Cụm trước' : 'Câu trước'}</span>
          <span className="sm:hidden">Trước</span>
        </button>

        <div className="flex items-center gap-2">
          {isClusterView && cluster ? (
            <span className="hidden sm:inline font-mono tabular-nums text-xs font-medium text-slate-600 dark:text-slate-400">
              Đã làm: {clusterQuestions.filter((q) => Boolean(answers?.[q.questionNumber])).length}/3
            </span>
          ) : (
            <span className="hidden sm:inline font-mono tabular-nums text-xs font-medium text-slate-600 dark:text-slate-400">
              {selectedOption ? `Đã chọn: (${selectedOption})` : 'Chưa chọn'}
            </span>
          )}
          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-sm border border-slate-300 bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
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
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-sm bg-slate-900 px-3 sm:px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer ${
            !hasNext ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title={isClusterView ? 'Cụm tiếp theo (Phím tắt: →)' : 'Câu tiếp theo (Phím tắt: →)'}
        >
          <span className="hidden sm:inline">{isClusterView ? 'Cụm tiếp theo' : 'Câu tiếp theo'}</span>
          <span className="sm:hidden">Tiếp theo</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </footer>

      {/* Lightbox / Zoomed image modal */}
      {isImageZoomed && (cluster?.imageUrl || question.imageUrl) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[92vh] w-full h-[88vh]">
            <Image
              src={cluster?.imageUrl || question.imageUrl!}
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
