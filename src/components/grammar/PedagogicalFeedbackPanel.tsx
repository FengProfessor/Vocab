'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { UnifiedGrammarExercise, DistractorBreakdown } from '@/lib/grammar-types';

export interface DistractorExplanation {
  option: string;
  isCorrect?: boolean;
  whyWrong?: string;
  pedagogicalReason?: string;
  trapType?: string;
}

export interface DeepPedagogicalExplanationObj {
  coreRule?: string;
  correctRationale?: string;
  distractors?: DistractorExplanation[];
  vietnameseContext?: string;
}

export interface PedagogicalFeedbackPanelProps {
  exercise?: UnifiedGrammarExercise;
  isCorrect: boolean;
  selectedAnswer?: string;
  selectedOption?: string;
  correctAnswer?: string | string[];
  explanation?: string | DeepPedagogicalExplanationObj;
  distractorBreakdowns?: (DistractorBreakdown | DistractorExplanation)[];
  vietnameseContext?: string;
  onNextQuestion?: () => void;
  onRetry?: () => void;
}

export default function PedagogicalFeedbackPanel({
  exercise,
  isCorrect,
  selectedAnswer: rawSelectedAnswer,
  selectedOption: rawSelectedOption,
  correctAnswer: rawCorrectAnswer,
  explanation: rawExplanation,
  distractorBreakdowns: rawBreakdowns,
  vietnameseContext,
  onNextQuestion,
  onRetry,
}: PedagogicalFeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<'distractors' | 'core_rule' | 'context'>('distractors');

  // Resolve user's chosen option
  const selectedChoice = (rawSelectedOption || rawSelectedAnswer || '').trim();

  // Resolve correct answer string
  const resolvedCorrectAnswer = React.useMemo(() => {
    if (rawCorrectAnswer) {
      return Array.isArray(rawCorrectAnswer) ? rawCorrectAnswer.join(', ') : String(rawCorrectAnswer);
    }
    if (exercise?.correct_answer) {
      return Array.isArray(exercise.correct_answer)
        ? exercise.correct_answer.join(', ')
        : String(exercise.correct_answer);
    }
    return '';
  }, [rawCorrectAnswer, exercise]);

  // Resolve master explanation / core rule
  const { coreRule, masterExplanation, vietnameseNote, distractorList } = React.useMemo(() => {
    let rule = '';
    let master = '';
    let note = vietnameseContext || '';
    const list: DistractorExplanation[] = [];

    // Source 1: exercise.distractor_breakdowns
    if (exercise?.distractor_breakdowns && Array.isArray(exercise.distractor_breakdowns)) {
      exercise.distractor_breakdowns.forEach((db) => {
        list.push({
          option: db.option,
          isCorrect: db.isCorrect,
          pedagogicalReason: db.pedagogicalReason,
          whyWrong: db.isCorrect ? undefined : db.pedagogicalReason,
        });
      });
    }

    // Source 2: rawBreakdowns prop
    if (rawBreakdowns && Array.isArray(rawBreakdowns)) {
      rawBreakdowns.forEach((db) => {
        // Prevent duplicate options
        if (!list.some((existing) => existing.option.toLowerCase() === db.option.toLowerCase())) {
          const whyWrong = 'whyWrong' in db && typeof db.whyWrong === 'string' ? db.whyWrong : db.pedagogicalReason;
          const trapType = 'trapType' in db && typeof db.trapType === 'string' ? db.trapType : undefined;
          list.push({
            option: db.option,
            isCorrect: 'isCorrect' in db ? db.isCorrect : undefined,
            pedagogicalReason: db.pedagogicalReason,
            whyWrong,
            trapType,
          });
        }
      });
    }

    // Process explanation object or string
    if (rawExplanation && typeof rawExplanation === 'object') {
      rule = rawExplanation.coreRule || '';
      master = rawExplanation.correctRationale || '';
      note = rawExplanation.vietnameseContext || note;

      if (Array.isArray(rawExplanation.distractors)) {
        rawExplanation.distractors.forEach((d) => {
          if (!list.some((existing) => existing.option.toLowerCase() === d.option.toLowerCase())) {
            list.push(d);
          }
        });
      }
    } else if (typeof rawExplanation === 'string') {
      master = rawExplanation;
    } else if (exercise?.explanation) {
      master = exercise.explanation;
    }

    return {
      coreRule: rule,
      masterExplanation: master,
      vietnameseNote: note,
      distractorList: list,
    };
  }, [exercise, rawExplanation, rawBreakdowns, vietnameseContext]);

  // Find specific distractor breakdown for the selected incorrect answer
  const matchedSelectedDistractor = React.useMemo(() => {
    if (isCorrect || !selectedChoice) return null;

    return (
      distractorList.find((d) => {
        const opt = d.option.trim().toLowerCase();
        const sel = selectedChoice.toLowerCase();
        return opt === sel || sel.startsWith(opt) || opt.startsWith(sel);
      }) || null
    );
  }, [isCorrect, selectedChoice, distractorList]);

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-none overflow-hidden my-5">
      {/* Top Banner Status */}
      <div
        className={`p-3.5 flex flex-wrap items-center justify-between border-b gap-2 ${
          isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider">
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{isCorrect ? 'CHÍNH XÁC — ĐẠT ĐIỂM CHUYÊN ĐỀ' : 'CHƯA CHÍNH XÁC'}</span>
        </div>

        <div className="font-mono text-xs flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400">ĐÁP ÁN ĐÚNG:</span>
          <strong className="underline underline-offset-2 px-1.5 py-0.5 bg-white/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700">
            {resolvedCorrectAnswer}
          </strong>
        </div>
      </div>

      {/* Prominent Distractor Breakdown Alert for Incorrect Submissions */}
      {!isCorrect && selectedChoice && (
        <div className="border-b border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Vì sao đáp án bạn chọn chưa đúng: &quot;{selectedChoice}&quot;
            </span>
          </div>

          <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-sans pl-6">
            {matchedSelectedDistractor?.whyWrong ||
              matchedSelectedDistractor?.pedagogicalReason ||
              `Phương án "${selectedChoice}" không phù hợp với cấu trúc ngữ pháp của câu này. Xem giải thích chi tiết bên dưới.`}
          </p>

          {matchedSelectedDistractor?.trapType && (
            <div className="pl-6 pt-1">
              <span className="font-mono text-[10px] uppercase font-semibold text-rose-800 dark:text-rose-300 bg-rose-200/50 dark:bg-rose-900/40 px-2 py-0.5 border border-rose-300 dark:border-rose-800">
                LỖI HAY GẶP: {matchedSelectedDistractor.trapType}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('distractors')}
          className={`px-4 py-2.5 font-semibold uppercase border-r border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors rounded-none ${
            activeTab === 'distractors'
              ? 'bg-white dark:bg-slate-900 text-primary border-b-2 border-b-primary -mb-px'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Giải thích từng đáp án ({distractorList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('core_rule')}
          className={`px-4 py-2.5 font-semibold uppercase border-r border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors rounded-none ${
            activeTab === 'core_rule'
              ? 'bg-white dark:bg-slate-900 text-primary border-b-2 border-b-primary -mb-px'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Quy tắc cốt lõi
        </button>

        {vietnameseNote && (
          <button
            type="button"
            onClick={() => setActiveTab('context')}
            className={`px-4 py-2.5 font-semibold uppercase flex items-center gap-1.5 transition-colors rounded-none ${
              activeTab === 'context'
                ? 'bg-white dark:bg-slate-900 text-primary border-b-2 border-b-primary -mb-px'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Dịch nghĩa & Bối cảnh
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
        {/* Tab 1: Distractor Breakdown */}
        {activeTab === 'distractors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-slate-500 mb-1">
              <span>GIẢI THÍCH CHI TIẾT TỪNG PHƯƠNG ÁN:</span>
            </div>

            {distractorList.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800">
                {distractorList.map((dist, idx) => {
                  const isThisOptionCorrect =
                    dist.isCorrect !== undefined
                      ? dist.isCorrect
                      : dist.option.trim().toLowerCase() === resolvedCorrectAnswer.trim().toLowerCase();

                  const isSelectedByLearner =
                    dist.option.trim().toLowerCase() === selectedChoice.toLowerCase();

                  return (
                    <div
                      key={idx}
                      className={`p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isSelectedByLearner
                          ? 'bg-slate-50/80 dark:bg-slate-950/80'
                          : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`px-2.5 py-1 font-mono font-bold rounded-none border ${
                            isThisOptionCorrect
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                              : isSelectedByLearner
                              ? 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {dist.option}
                        </span>

                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            isThisOptionCorrect
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {isThisOptionCorrect ? '✓ ĐÚNG' : '✕ LOẠI TRỪ'}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 sm:text-right flex-1 sm:pl-4 font-sans text-xs">
                        {isThisOptionCorrect
                          ? dist.pedagogicalReason || masterExplanation
                          : dist.whyWrong || dist.pedagogicalReason || 'Phương án không phù hợp với cấu trúc ngữ pháp.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="text-slate-700 dark:text-slate-300">{masterExplanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Core Rule */}
        {activeTab === 'core_rule' && (
          <div className="space-y-3">
            {coreRule && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-l-2 border-primary border-y border-r border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100">
                <span className="text-[10px] uppercase font-bold text-primary block mb-1">
                  Công thức & Cấu trúc nền tảng:
                </span>
                {coreRule}
              </div>
            )}

            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                Giải thích nguyên lý sư phạm:
              </span>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {masterExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Context & Translation */}
        {activeTab === 'context' && vietnameseNote && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
              Bản dịch và sắc thái giao tiếp:
            </span>
            <p className="text-xs sm:text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
              {vietnameseNote}
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {(onNextQuestion || onRetry) && (
        <div className="flex items-center justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          {onRetry && !isCorrect && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase font-semibold rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Làm lại câu này
            </button>
          )}

          {onNextQuestion && (
            <button
              type="button"
              onClick={onNextQuestion}
              className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs uppercase font-semibold rounded-none hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
