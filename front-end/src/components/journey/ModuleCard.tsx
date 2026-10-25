'use client';

import React, { useState } from 'react';
import {
  type RoadmapStepView,
  type RoadmapUnitView,
  calculateUnitDuration,
} from '@/lib/roadmap-client';
import {
  Sparkles,
  GraduationCap,
  Headphones,
  Flag,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Play,
  RotateCcw,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface ModuleCardProps {
  unit: RoadmapUnitView;
  isCurrentUnit?: boolean;
  onStepClick: (step: RoadmapStepView, unit: RoadmapUnitView) => void;
  onViewBadge?: (unit: RoadmapUnitView) => void;
  busyStepId?: string | null;
  className?: string;
  defaultExpanded?: boolean;
}

const STEP_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  vocab: {
    label: 'Từ vựng',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-900/60',
  },
  grammar: {
    label: 'Ngữ pháp',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-900/60',
  },
  pronunciation: {
    label: 'Phát âm',
    icon: Headphones,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-900/60',
  },
  checkpoint: {
    label: 'Checkpoint',
    icon: Flag,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900/60',
  },
  reading: {
    label: 'Đọc hiểu',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-900/60',
  },
  cloze: {
    label: 'Điền từ Cloze',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-900/60',
  },
  arrange: {
    label: 'Sắp xếp câu',
    icon: BookOpen,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-900/60',
  },
  announcement: {
    label: 'Thông báo',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-900/60',
  },
  leaflet: {
    label: 'Tờ rơi',
    icon: BookOpen,
    color: 'text-lime-600 dark:text-lime-400',
    bg: 'bg-lime-50 dark:bg-lime-950/40',
    border: 'border-lime-200 dark:border-lime-900/60',
  },
  exam: {
    label: 'Đề thi Mini',
    icon: Flag,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-900/60',
  },
};

export function ModuleCard({
  unit,
  isCurrentUnit = false,
  onStepClick,
  onViewBadge,
  busyStepId = null,
  className,
  defaultExpanded,
}: ModuleCardProps) {
  // Determine completion and status
  const totalSteps = unit.steps?.length || 0;
  const completedSteps = unit.steps?.filter((s) => s.status === 'completed').length || 0;
  const progressPct =
    typeof unit.progressPct === 'number'
      ? unit.progressPct
      : totalSteps > 0
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

  const isAllCompleted = totalSteps > 0 && completedSteps === totalSteps;
  const hasCurrentStep = unit.steps?.some((s) => s.status === 'current');
  const isLocked =
    !isAllCompleted &&
    !hasCurrentStep &&
    (unit.steps?.every((s) => s.status === 'locked') ?? false);

  // By default, current unit is always expanded, locked units are collapsed, completed can be toggled
  const initialExpanded =
    defaultExpanded !== undefined
      ? defaultExpanded
      : hasCurrentStep || isCurrentUnit || (!isLocked && !isAllCompleted);

  const [expanded, setExpanded] = useState(initialExpanded);
  const [showObjectives, setShowObjectives] = useState(false);

  const durationMinutes =
    unit.estimatedMinutes || calculateUnitDuration(unit) || 45;
  const badgeIcon = unit.badgeIcon || '🎯';
  const badgeName = unit.badgeName || `Huy hiệu Chặng ${unit.index}`;

  const handleStepClick = (step: RoadmapStepView) => {
    if (step.status === 'locked') {
      toast.info('Bước này đang khóa. Vui lòng hoàn thành các bước trước đó theo lộ trình.');
      return;
    }
    onStepClick(step, unit);
  };

  return (
    <div
      data-testid={`module-card-${unit.id}`}
      className={cn(
        'group rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs',
        isAllCompleted
          ? 'border-emerald-200/90 dark:border-emerald-900/50 bg-gradient-to-b from-card to-emerald-50/20 dark:to-emerald-950/10'
          : hasCurrentStep || isCurrentUnit
          ? 'border-primary/60 dark:border-primary/50 bg-card shadow-md ring-1 ring-primary/20'
          : isLocked
          ? 'border-border/60 bg-muted/20 opacity-80'
          : 'border-border bg-card',
        className
      )}
    >
      {/* ── CARD HEADER ── */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Badge Icon + Unit Header Details */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            {/* Achievement Badge / Icon */}
            <button
              type="button"
              disabled={!isAllCompleted || !onViewBadge}
              onClick={() => isAllCompleted && onViewBadge?.(unit)}
              title={
                isAllCompleted
                  ? `Bấm để xem huy hiệu: ${badgeName}`
                  : `Huy hiệu chặng: ${badgeName}`
              }
              className={cn(
                'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform select-none',
                isAllCompleted
                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 text-white shadow-md cursor-pointer hover:scale-105 active:scale-95'
                  : hasCurrentStep || isCurrentUnit
                  ? 'bg-primary/10 border border-primary/30 text-primary'
                  : isLocked
                  ? 'bg-muted/80 text-muted-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <span>{badgeIcon}</span>
              {isAllCompleted && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
            </button>

            {/* Title & Time Framing */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chặng {unit.index}
                </span>

                {/* Duration Tag */}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-muted-foreground/80" />~{durationMinutes} phút
                </span>

                {/* Status Indicator Pill */}
                {isAllCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    Hoàn thành
                  </span>
                ) : hasCurrentStep || isCurrentUnit ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md animate-pulse">
                    <Star className="w-3 h-3 fill-current" />
                    Đang học
                  </span>
                ) : isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    Bị khóa
                  </span>
                ) : null}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight mt-0.5 break-words">
                {unit.title}
              </h3>

              {/* Badge Name preview */}
              {unit.badgeName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Huy hiệu: <strong className="text-foreground/90 font-medium">{unit.badgeName}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Progress % & Collapsible Toggle Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">
                {completedSteps}/{totalSteps} bước
              </span>
              <span className="text-sm font-extrabold tabular-nums text-foreground">
                {progressPct}%
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Thu gọn danh sách bước' : 'Mở rộng danh sách bước'}
              className="min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-foreground rounded-xl"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* ── VISUAL PROGRESS BAR ── */}
        <div className="mt-3.5 space-y-1">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                isAllCompleted
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              )}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </div>

        {/* ── ACTIONABLE OBJECTIVES & TOPIC PREVIEW ACCORDION ── */}
        {(unit.canDo?.length || unit.topicPreview) && (
          <div className="mt-3 pt-2.5 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowObjectives(!showObjectives)}
              className="w-full text-left flex items-center justify-between gap-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors select-none"
            >
              <span className="flex items-center gap-1.5 text-primary">
                <Target className="w-3.5 h-3.5" />
                Mục tiêu đầu ra & Nội dung trọng tâm
              </span>
              <span className="text-[11px] text-muted-foreground">
                {showObjectives ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
              </span>
            </button>

            {showObjectives && (
              <div className="mt-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2.5 animate-in fade-in-50 duration-150">
                {unit.canDo && unit.canDo.length > 0 && (
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Bạn sẽ làm được gì (Can-Do):</p>
                    <ul className="space-y-1 text-foreground">
                      {unit.canDo.map((skill, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {unit.topicPreview && (
                  <div>
                    <p className="font-bold text-muted-foreground mb-1">Tóm tắt nội dung trọng tâm:</p>
                    <p className="text-foreground leading-relaxed">
                      {unit.topicPreview}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STEP LIST (COLLAPSIBLE) ── */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 p-3 sm:p-4 space-y-2.5">
          {unit.steps && unit.steps.length > 0 ? (
            unit.steps.map((step, sIdx) => {
              const meta = STEP_META[step.type] || {
                label: step.type,
                icon: BookOpen,
                color: 'text-primary',
                bg: 'bg-primary/10',
                border: 'border-primary/20',
              };
              const StepIcon = meta.icon;
              const isStepDone = step.status === 'completed';
              const isStepCurrent = step.status === 'current';
              const isStepLocked = step.status === 'locked';
              const isStepReview = step.status === 'review';
              const isStepBusy = busyStepId === step.id;
              const stepDuration = step.estimatedMinutes || (step.type === 'checkpoint' ? 15 : 12);

              return (
                <div
                  key={step.id}
                  data-testid={`step-item-${step.id}`}
                  className={cn(
                    'group/step flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150',
                    isStepCurrent
                      ? 'border-primary/70 bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20'
                      : isStepDone
                      ? 'border-emerald-200/70 dark:border-emerald-900/40 bg-card hover:border-emerald-300'
                      : isStepLocked
                      ? 'border-border/40 bg-muted/30 opacity-70 cursor-not-allowed'
                      : 'border-border/70 bg-card hover:border-border'
                  )}
                >
                  {/* Left: Step Type Icon, Badges & Step Title */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base border',
                        isStepDone
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900'
                          : isStepCurrent
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : isStepLocked
                          ? 'bg-muted text-muted-foreground border-border/60'
                          : cn(meta.bg, meta.color, meta.border)
                      )}
                    >
                      {isStepDone ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isStepLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Bước {sIdx + 1}
                        </span>

                        <span
                          className={cn(
                            'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded',
                            meta.bg,
                            meta.color
                          )}
                        >
                          {meta.label}
                        </span>

                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5" />~{stepDuration}m
                        </span>

                        {step.wordCount && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {step.wordCount} từ
                          </span>
                        )}

                        {step.score !== null && step.score !== undefined && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            {step.score}% · Đạt
                          </span>
                        )}

                        {step.fromLibrary && (
                          <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded">
                            Kho thư viện
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-sm text-foreground tracking-tight break-words">
                        {step.title}
                      </p>

                      {step.topicPreview && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {step.topicPreview}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Interactive CTA Button (touch target >= 44px) */}
                  <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0">
                    {isStepDone ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isStepBusy}
                        onClick={() => handleStepClick(step)}
                        className="min-h-[44px] px-3.5 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5 touch-manipulation"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ôn lại
                      </Button>
                    ) : isStepCurrent ? (
                      <Button
                        type="button"
                        variant="chunky"
                        size="sm"
                        disabled={isStepBusy}
                        onClick={() => handleStepClick(step)}
                        className="min-h-[44px] px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md touch-manipulation"
                      >
                        {isStepBusy ? (
                          'Đang mở...'
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Học ngay
                          </>
                        )}
                      </Button>
                    ) : isStepReview ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isStepBusy}
                        onClick={() => handleStepClick(step)}
                        className="min-h-[44px] px-3.5 text-xs font-medium rounded-xl flex items-center gap-1.5 touch-manipulation"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ôn tập
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="min-h-[44px] px-3.5 text-xs font-medium text-muted-foreground/60 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Chưa mở
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground p-2">Không có bước học trong chặng này.</p>
          )}
        </div>
      )}
    </div>
  );
}
