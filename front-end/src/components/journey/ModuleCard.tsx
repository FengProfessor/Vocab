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
  Trophy,
  Compass,
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
  stepTypeFilter?: string;
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
  stepTypeFilter = 'all',
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
  const [localTypeFilter, setLocalTypeFilter] = useState<string>('all');

  const effectiveTypeFilter = stepTypeFilter !== 'all' ? stepTypeFilter : localTypeFilter;

  const availableStepTypes = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of unit.steps || []) {
      counts.set(s.type, (counts.get(s.type) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
      label: STEP_META[type]?.label || type,
    }));
  }, [unit.steps]);

  const filteredSteps = React.useMemo(() => {
    const all = unit.steps || [];
    if (effectiveTypeFilter === 'all') return all;
    return all.filter((s) => s.type === effectiveTypeFilter);
  }, [unit.steps, effectiveTypeFilter]);

  const durationMinutes =
    unit.estimatedMinutes || calculateUnitDuration(unit) || 45;
  const badgeIcon = unit.badgeIcon || '🎯';
  const badgeName = unit.badgeName || `Huy hiệu Chặng ${unit.index}`;
  const stageCode = `STAGE ${String(unit.index).padStart(2, '0')}`;

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
        'group relative rounded-3xl border-2 transition-all duration-200 overflow-hidden',
        isAllCompleted
          ? 'border-emerald-300/90 dark:border-emerald-800/70 bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/20 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-sm'
          : hasCurrentStep || isCurrentUnit
          ? 'border-indigo-500 dark:border-indigo-400 bg-white dark:bg-slate-900 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.28)] ring-4 ring-indigo-500/10 dark:ring-indigo-400/15'
          : isLocked
          ? 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 opacity-85'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs',
        className
      )}
    >
      {/* Top Stage Accent Ribbon for Active or Completed Stage */}
      {(hasCurrentStep || isCurrentUnit || isAllCompleted) && (
        <div
          className={cn(
            'h-1.5 w-full',
            isAllCompleted
              ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600'
              : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500'
          )}
        />
      )}

      {/* ── STAGE CARD HEADER ── */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Left: Stage Emblem Node + Unit Header Details */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {/* Stage Achievement Emblem with Ring */}
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
                'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform select-none',
                isAllCompleted
                  ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25 cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-amber-200 dark:ring-amber-700'
                  : hasCurrentStep || isCurrentUnit
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-200 dark:ring-indigo-800'
                  : isLocked
                  ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/60 dark:border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200 dark:border-slate-700'
              )}
            >
              <span>{badgeIcon}</span>
              {/* Stage Index Pill on top-left of emblem */}
              <span
                className={cn(
                  'absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-md text-[9px] font-black tracking-tight shadow-2xs border',
                  isAllCompleted
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : hasCurrentStep || isCurrentUnit
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-white border-slate-600 dark:bg-slate-700'
                )}
              >
                S{unit.index}
              </span>
              {isAllCompleted && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              )}
            </button>

            {/* Title & Stage Framing */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border',
                    isAllCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                      : hasCurrentStep || isCurrentUnit
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  )}
                >
                  <Compass className="w-3 h-3" />
                  Chặng {unit.index} · {stageCode}
                </span>

                {/* Duration Tag */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 opacity-80" />~{durationMinutes} phút
                </span>

                {/* Status Indicator Pill */}
                {isAllCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    <Trophy className="w-3 h-3" />
                    Đã chinh phục
                  </span>
                ) : hasCurrentStep || isCurrentUnit ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-current text-amber-500" />
                    Chặng hiện tại
                  </span>
                ) : isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3" />
                    Chặng khóa
                  </span>
                ) : null}
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1 break-words">
                {unit.title}
              </h3>

              {/* Badge Name preview */}
              {unit.badgeName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Phần thưởng chặng:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {unit.badgeName}
                    </strong>
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Right: Stage Node Progress & Collapsible Toggle Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
            {/* Mini Sub-stage Step Nodes Preview */}
            {totalSteps > 0 && (
              <div
                className="hidden md:flex items-center gap-1 mr-1"
                title={`Tiến độ chặng: ${completedSteps}/${totalSteps} bước`}
              >
                {unit.steps.map((s, idx) => {
                  const done = s.status === 'completed';
                  const curr = s.status === 'current';
                  const isBoss = s.type === 'checkpoint' || s.type === 'exam';
                  return (
                    <React.Fragment key={s.id}>
                      {idx > 0 && (
                        <span
                          className={cn(
                            'w-2.5 h-0.5 rounded-full',
                            done
                              ? 'bg-emerald-500'
                              : curr
                              ? 'bg-indigo-400'
                              : 'bg-slate-200 dark:bg-slate-700'
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all',
                          done
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : curr
                            ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-500/30 scale-110'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                        )}
                      >
                        {done ? '✓' : isBoss ? '★' : idx + 1}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                {completedSteps}/{totalSteps} trạm
              </span>
              <span
                className={cn(
                  'text-sm font-black tabular-nums',
                  isAllCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : hasCurrentStep || isCurrentUnit
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-800 dark:text-slate-200'
                )}
              >
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
              className="min-h-[44px] min-w-[44px] p-2 text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* ── VISUAL STAGE PROGRESS BAR ── */}
        <div className="mt-3.5 space-y-1">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                isAllCompleted
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </div>

        {/* ── ACTIONABLE OBJECTIVES & TOPIC PREVIEW ACCORDION ── */}
        {(unit.canDo?.length || unit.topicPreview) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowObjectives(!showObjectives)}
              className="w-full text-left flex items-center justify-between gap-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors select-none cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                <Target className="w-3.5 h-3.5" />
                Mục tiêu đầu ra & Nhiệm vụ Chặng {unit.index}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {showObjectives ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
              </span>
            </button>

            {showObjectives && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-2.5 animate-in fade-in-50 duration-150">
                {unit.canDo && unit.canDo.length > 0 && (
                  <div>
                    <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Kỹ năng mở khóa sau chặng này (Can-Do):
                    </p>
                    <ul className="space-y-1 text-slate-800 dark:text-slate-200">
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
                    <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Trọng tâm kiến thức:
                    </p>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {unit.topicPreview}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CONNECTED SUB-STAGE STEP PATH (COLLAPSIBLE) ── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 sm:p-5 space-y-3.5">
          {/* Step Type Categorization Filter Tabs */}
          {stepTypeFilter === 'all' && availableStepTypes.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setLocalTypeFilter('all')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer border',
                  localTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300',
                )}
              >
                <span>Tất cả</span>
                <span className="text-[10px] opacity-80 tabular-nums">({totalSteps})</span>
              </button>
              {availableStepTypes.map((item) => {
                const isSelected = localTypeFilter === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setLocalTypeFilter(item.type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer border',
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300',
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-80 tabular-nums">({item.count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredSteps.length > 0 ? (
            <div className="relative space-y-3">
              {filteredSteps.map((step, sIdx) => {
                const originalIndex = (unit.steps || []).findIndex((s) => s.id === step.id);
                const stepNumber = originalIndex >= 0 ? originalIndex + 1 : sIdx + 1;
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
                const isBossStep = step.type === 'checkpoint' || step.type === 'exam';
                const stepDuration =
                  step.estimatedMinutes || (step.type === 'checkpoint' ? 15 : 12);
                const isLastStep = sIdx === filteredSteps.length - 1;

                return (
                  <div key={step.id} className="relative flex items-stretch gap-3">
                    {/* Vertical Stage Path Connector Spine (Desktop & Mobile) */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={cn(
                          'relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black border-2 transition-all',
                          isStepDone
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs shadow-emerald-500/20'
                            : isStepCurrent
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30 ring-4 ring-indigo-500/15'
                            : isStepLocked
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
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
                      </div>
                      {!isLastStep && (
                        <div
                          className={cn(
                            'w-0.5 flex-1 my-1 rounded-full min-h-[16px]',
                            isStepDone
                              ? 'bg-emerald-400 dark:bg-emerald-600'
                              : isStepCurrent
                              ? 'bg-gradient-to-b from-indigo-500 to-slate-200 dark:to-slate-800'
                              : 'bg-slate-200 dark:bg-slate-800'
                          )}
                        />
                      )}
                    </div>

                    {/* Step Card Body */}
                    <div
                      data-testid={`step-item-${step.id}`}
                      className={cn(
                        'group/step flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-150',
                        isStepCurrent
                          ? 'border-indigo-500/80 dark:border-indigo-400/80 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-500/10'
                          : isStepDone
                          ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-white dark:bg-slate-900/90 hover:border-emerald-300'
                          : isStepLocked
                          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-900/40 opacity-75 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200',
                        isBossStep &&
                          !isStepLocked &&
                          'bg-gradient-to-r from-rose-50/40 via-white to-amber-50/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-amber-950/20'
                      )}
                    >
                      {/* Step Meta & Title */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Bước {stepNumber}
                          </span>

                          <span
                            className={cn(
                              'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border',
                              meta.bg,
                              meta.color,
                              meta.border
                            )}
                          >
                            {meta.label}
                          </span>

                          {isBossStep && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                              <Trophy className="w-2.5 h-2.5" /> Trạm Chốt Chặng
                            </span>
                          )}

                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            <Clock className="w-2.5 h-2.5" />~{stepDuration}m
                          </span>

                          {step.wordCount && (
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              {step.wordCount} từ
                            </span>
                          )}

                          {step.score !== null && step.score !== undefined && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                              {step.score}% · Đạt
                            </span>
                          )}

                          {step.fromLibrary && (
                            <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-md">
                              Kho thư viện
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight break-words">
                          {step.title}
                        </p>

                        {step.topicPreview && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {step.topicPreview}
                          </p>
                        )}
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
                            className="min-h-[44px] px-3.5 text-xs font-bold rounded-xl text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5 touch-manipulation cursor-pointer"
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
                            className="min-h-[44px] px-4 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-md touch-manipulation cursor-pointer"
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
                            className="min-h-[44px] px-3.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 touch-manipulation cursor-pointer"
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
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground p-2">Không có bước học trong chặng này.</p>
          )}
        </div>
      )}
    </div>
  );
}
