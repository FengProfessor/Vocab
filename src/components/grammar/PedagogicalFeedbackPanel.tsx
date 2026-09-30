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
import FormattedText from './FormattedText';

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
  nextButtonLabel?: string;
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
  nextButtonLabel,
  onNextQuestion,
  onRetry,
}: PedagogicalFeedbackPanelProps) {
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

  const [activeTab, setActiveTab] = useState<'distractors' | 'core_rule' | 'context'>(() =>
    distractorList.length > 0 ? 'distractors' : 'core_rule'
  );

  React.useEffect(() => {
    setActiveTab(distractorList.length > 0 ? 'distractors' : 'core_rule');
  }, [distractorList.length]);

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
    <div className="border border-border bg-card rounded-none overflow-hidden my-5">
      {/* Top Banner Status */}
      <div
        className={`p-3.5 flex flex-wrap items-center justify-between border-b gap-2 ${
          isCorrect
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider">
          {isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{isCorrect ? 'CHÍNH XÁC' : 'CHƯA CHÍNH XÁC'}</span>
        </div>

        <div className="font-mono text-xs flex items-center gap-1.5">
          <span className="text-muted-foreground">ĐÁP ÁN ĐÚNG:</span>
          <strong className="underline underline-offset-2 px-1.5 py-0.5 bg-background border border-border">
            <FormattedText text={resolvedCorrectAnswer} />
          </strong>
        </div>
      </div>

      {/* Prominent Distractor Breakdown Alert for Incorrect Submissions */}
      {!isCorrect && selectedChoice && (
        <div className="border-b border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Vì sao đáp án bạn chọn chưa đúng: &quot;{selectedChoice}&quot;
            </span>
          </div>

          <div className="text-xs text-foreground/90 leading-relaxed font-sans pl-6">
            <FormattedText
              text={
                matchedSelectedDistractor?.whyWrong ||
                matchedSelectedDistractor?.pedagogicalReason ||
                masterExplanation ||
                `Phương án "${selectedChoice}" không phù hợp với cấu trúc ngữ pháp của câu này.`
              }
            />
          </div>

          {matchedSelectedDistractor?.trapType && (
            <div className="pl-6 pt-1">
              <span className="font-mono text-[10px] uppercase font-semibold text-rose-800 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 border border-rose-500/30">
                LỖI HAY GẶP: {matchedSelectedDistractor.trapType}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-muted/20 font-mono text-xs overflow-x-auto scrollbar-none">
        {distractorList.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('distractors')}
            className={`px-4 py-2.5 font-semibold uppercase border-r border-border flex items-center gap-1.5 transition-colors rounded-none whitespace-nowrap shrink-0 ${
              activeTab === 'distractors'
                ? 'bg-card text-primary border-b-2 border-b-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Giải thích từng đáp án ({distractorList.length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('core_rule')}
          className={`px-4 py-2.5 font-semibold uppercase border-r border-border flex items-center gap-1.5 transition-colors rounded-none whitespace-nowrap shrink-0 ${
            activeTab === 'core_rule'
              ? 'bg-card text-primary border-b-2 border-b-primary -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {distractorList.length > 0 ? 'Quy tắc cốt lõi' : 'Giải thích quy tắc'}
        </button>

        {vietnameseNote && (
          <button
            type="button"
            onClick={() => setActiveTab('context')}
            className={`px-4 py-2.5 font-semibold uppercase flex items-center gap-1.5 transition-colors rounded-none whitespace-nowrap shrink-0 ${
              activeTab === 'context'
                ? 'bg-card text-primary border-b-2 border-b-primary -mb-px'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Dịch nghĩa & Bối cảnh
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="p-4 sm:p-5 text-sm leading-relaxed text-foreground font-sans">
        {/* Tab 1: Distractor Breakdown */}
        {activeTab === 'distractors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground mb-1">
              <span>GIẢI THÍCH CHI TIẾT TỪNG PHƯƠNG ÁN:</span>
            </div>

            {distractorList.length > 0 ? (
              <div className="divide-y divide-border border border-border">
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
                      className={`p-3 text-xs flex flex-col sm:flex-row items-start justify-between gap-3 ${
                        isSelectedByLearner
                          ? 'bg-muted/30'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
                        <span
                          className={`px-2.5 py-1 font-mono font-bold rounded-none border ${
                            isThisOptionCorrect
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                              : isSelectedByLearner
                              ? 'bg-rose-500/10 border-rose-500 text-rose-800 dark:text-rose-300'
                              : 'bg-muted/40 border-border text-foreground'
                          }`}
                        >
                          {dist.option}
                        </span>

                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            isThisOptionCorrect
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {isThisOptionCorrect ? '✓ ĐÚNG' : '✕ LOẠI TRỪ'}
                        </span>
                      </div>

                      <div className="text-foreground/90 text-left flex-1 sm:pl-4 font-sans text-xs leading-relaxed">
                        <FormattedText
                          text={
                            isThisOptionCorrect
                              ? dist.pedagogicalReason || masterExplanation
                              : dist.whyWrong || dist.pedagogicalReason || 'Phương án không phù hợp với cấu trúc ngữ pháp.'
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 bg-muted/20 border border-border text-xs text-foreground/90">
                <FormattedText text={masterExplanation} />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Core Rule */}
        {activeTab === 'core_rule' && (
          <div className="space-y-3">
            {coreRule && (
              <div className="p-3 bg-muted/20 border-l-2 border-primary border-y border-r border-border font-mono text-xs text-foreground">
                <span className="text-[10px] uppercase font-bold text-primary block mb-1">
                  Công thức & Cấu trúc nền tảng:
                </span>
                <FormattedText text={coreRule} />
              </div>
            )}

            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                Quy tắc ngữ pháp:
              </span>
              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                <FormattedText text={masterExplanation} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Context & Translation */}
        {activeTab === 'context' && vietnameseNote && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
              Bản dịch và sắc thái giao tiếp:
            </span>
            <div className="text-xs sm:text-sm italic text-foreground/90 leading-relaxed bg-muted/20 p-3 border border-border">
              <FormattedText text={vietnameseNote} />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {(onNextQuestion || onRetry) && (
        <div className="flex items-center justify-end gap-2 p-3 bg-muted/20 border-t border-border">
          {onRetry && !isCorrect && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 border border-border text-foreground font-mono text-xs uppercase font-semibold rounded-none hover:bg-muted transition-colors"
            >
              Làm lại câu này
            </button>
          )}

          {onNextQuestion && (
            <button
              type="button"
              onClick={onNextQuestion}
              className="px-5 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase font-semibold rounded-none hover:bg-primary/90 transition-opacity flex items-center gap-1.5"
            >
              <span>{nextButtonLabel || 'Câu tiếp theo'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
