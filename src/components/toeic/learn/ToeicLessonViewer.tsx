'use client';

import React from 'react';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
  Volume2,
  Check,
  Tag,
  BarChart,
} from 'lucide-react';
import type {
  TheoryLesson,
  VisualGrammarFormula,
  RealWorldExample,
} from '@/data/toeic/theory/types';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import { LazyMarkdown } from '@/components/perf/LazyMarkdown';
import { ToeicTipBox } from './ToeicTipBox';
import { ToeicTrapAlert } from './ToeicTrapAlert';
import { ToeicComparisonTable } from './ToeicComparisonTable';
import { ToeicQuickQuiz } from './ToeicQuickQuiz';
import { ToeicPracticeBridge } from './ToeicPracticeBridge';

export interface ToeicLessonViewerProps {
  lesson: TheoryLesson;
  completedCheckpoints?: Set<string>;
  onCheckpointComplete?: (id: string, isCorrect: boolean) => void;
  prevLesson?: TheoryLesson;
  nextLesson?: TheoryLesson;
  onSelectLesson?: (lessonId: string) => void;
  className?: string;
}

export function ToeicLessonViewer({
  lesson,
  onCheckpointComplete,
  prevLesson,
  nextLesson,
  onSelectLesson,
  className = '',
}: ToeicLessonViewerProps) {
  // Difficulty label helper
  const difficultyBadge = {
    starter: {
      text: 'Mục Tiêu 450–550 (Starter)',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    intermediate: {
      text: 'Mục Tiêu 600–750 (Intermediate)',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    },
    advanced: {
      text: 'Mục Tiêu 800+ (Mastery)',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    },
  }[lesson.difficulty] || {
    text: 'Chuẩn ETS',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  // Module Category name
  const moduleLabel =
    lesson.moduleId === 'grammar-foundation'
      ? 'FOUNDATION GRAMMAR · PART 5 & 6'
      : lesson.moduleId === 'listening-tactics'
      ? 'LISTENING TACTICS · PART 1 - 4'
      : 'READING MASTERY · PART 7';

  return (
    <article
      aria-label={lesson.title}
      className={`min-w-0 max-w-4xl mx-auto space-y-8 pb-16 ${className}`}
    >
      {/* ── 1. LESSON HEADER ── */}
      <header className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-4">
        {/* Module Super-title */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Bookmark className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{moduleLabel}</span>
          </div>

          <span
            className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-xs border ${difficultyBadge.className}`}
          >
            {difficultyBadge.text}
          </span>
        </div>

        {/* Lesson Titles */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {lesson.title}
          </h1>
          <p className="font-mono text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {lesson.englishTitle}
          </p>
        </div>

        {/* Metadata Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xs">
            <Layers className="h-3 w-3 text-slate-500" />
            Trọng tâm: Part {lesson.targetPart}
          </span>
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xs">
            <Clock className="h-3 w-3 text-slate-500" />
            ~{lesson.estimatedMinutes} phút học
          </span>
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xs">
            <BarChart className="h-3 w-3 text-slate-500" />
            {lesson.checkpoints.length} Checkpoints
          </span>
          {lesson.textbookSources && lesson.textbookSources.length > 0 && (
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xs">
              <BookOpen className="h-3 w-3 text-slate-500" />
              Tài liệu: {lesson.textbookSources.join(', ')}
            </span>
          )}
        </div>

        {/* Learning Objectives */}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="rounded-xs border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20 p-3 text-xs sm:text-sm space-y-1.5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Mục tiêu đầu ra của bài học:</span>
            </div>
            <ul className="space-y-1 pl-1">
              {lesson.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* ── 2. SECTIONS CONTENT ── */}
      <div className="space-y-8">
        {lesson.sections.map((section, sIdx) => (
          <section
            key={section.id || sIdx}
            className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-5"
          >
            {/* Section Header */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-[11px] font-bold">
                {section.order || sIdx + 1}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {section.title}
              </h2>
            </div>

            {/* Visual Formula (if present) */}
            {section.formula && <VisualFormulaBlock formula={section.formula} />}

            {/* Markdown Body */}
            {section.contentMarkdown && (
              <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                <LazyMarkdown>{section.contentMarkdown}</LazyMarkdown>
              </div>
            )}

            {/* Embedded Tip Box */}
            {section.tipBox && <ToeicTipBox tip={section.tipBox} />}

            {/* Embedded Trap Alert */}
            {section.trapAlert && <ToeicTrapAlert trap={section.trapAlert} />}

            {/* Embedded Comparison Table */}
            {section.comparisonTable && (
              <ToeicComparisonTable table={section.comparisonTable} />
            )}

            {/* Real-World Examples */}
            {section.examples && section.examples.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <span>Trích Dẫn Ví Dụ Đề Thi Thật ETS:</span>
                </div>

                <div className="space-y-3">
                  {section.examples.map((example, eIdx) => (
                    <RealWorldExampleCard key={eIdx} example={example} />
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {section.keyTakeaways && section.keyTakeaways.length > 0 && (
              <div className="rounded-xs border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 text-xs sm:text-sm space-y-2">
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Điểm cốt lõi cần nhớ (Key Takeaways):</span>
                </div>
                <ul className="space-y-1 pl-1">
                  {section.keyTakeaways.map((takeaway, tIdx) => (
                    <li
                      key={tIdx}
                      className="flex items-start gap-2 text-emerald-950 dark:text-emerald-200 leading-normal"
                    >
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ── 3. IN-LESSON QUICK QUIZ (CHECKPOINTS) ── */}
      {lesson.checkpoints && lesson.checkpoints.length > 0 && (
        <ToeicQuickQuiz
          checkpoints={lesson.checkpoints}
          lessonId={lesson.id}
          onCheckpointAnswer={onCheckpointComplete}
        />
      )}

      {/* ── 4. BRIDGE TO REAL PRACTICE ── */}
      {lesson.bridgeToPractice && (
        <ToeicPracticeBridge bridge={lesson.bridgeToPractice} />
      )}

      {/* ── 5. PREV / NEXT NAVIGATION FOOTER ── */}
      <nav
        aria-label="Điều hướng giữa các bài học"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800"
      >
        {prevLesson ? (
          <button
            type="button"
            onClick={() => onSelectLesson?.(prevLesson.id)}
            className="flex-1 flex items-center gap-3 p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-left cursor-pointer group shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0" />
            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                ← Bài trước
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {prevLesson.title}
              </span>
            </div>
          </button>
        ) : (
          <div className="hidden sm:block flex-1" />
        )}

        {nextLesson && (
          <button
            type="button"
            onClick={() => onSelectLesson?.(nextLesson.id)}
            className="flex-1 flex items-center justify-end gap-3 p-3 rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 transition-colors text-right cursor-pointer group shadow-xs"
          >
            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Bài tiếp theo →
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {nextLesson.title}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0" />
          </button>
        )}
      </nav>
    </article>
  );
}

// ── SUB-COMPONENT: Visual Formula Block ──
function VisualFormulaBlock({ formula }: { formula: VisualGrammarFormula }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-200 border-blue-300 dark:border-blue-800',
    emerald: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    purple: 'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-200 border-purple-300 dark:border-purple-800',
  };

  return (
    <div className="rounded-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3.5">
      {/* Pattern Banner */}
      <div className="rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-center shadow-xs">
        <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wider">
          <ExamInteractiveText text={formula.pattern} enabled={true} />
        </span>
      </div>

      {/* Elements Decomposition */}
      {formula.elements && formula.elements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {formula.elements.map((el, idx) => {
            const colorClass = el.color ? colorMap[el.color] : colorMap.blue;
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs"
              >
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs border shrink-0 ${colorClass}`}
                >
                  {el.symbol}
                </span>
                <div className="leading-tight">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {el.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {el.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      {formula.notes && (
        <p className="font-mono text-xs text-slate-600 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-800">
          * {formula.notes}
        </p>
      )}
    </div>
  );
}

// ── SUB-COMPONENT: Real-World Example Card ──
function RealWorldExampleCard({ example }: { example: RealWorldExample }) {
  return (
    <div className="rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 space-y-2 text-xs sm:text-sm">
      {/* Context Tag Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
        <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Ngữ cảnh: {example.context}
        </span>

        {example.audioUrl && (
          <div className="flex items-center gap-1 font-mono text-[11px] text-blue-600 dark:text-blue-400">
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio mẫu</span>
          </div>
        )}
      </div>

      {/* English Sentence (100% interactive with ExamInteractiveText) */}
      <div className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed text-sm sm:text-base">
        <ExamInteractiveText text={example.english} enabled={true} />
      </div>

      {/* Vietnamese Translation (plain text, never wrapped per IT-7.5) */}
      <div className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-normal italic">
        → {example.vietnamese}
      </div>

      {/* Grammatical / Structural Analysis */}
      {example.analysis && (
        <div className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xs border border-slate-200 dark:border-slate-800 leading-normal">
          <span className="font-mono font-bold text-slate-500 mr-1">Phân tích:</span>
          {example.analysis}
        </div>
      )}
    </div>
  );
}
