'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home, CheckCircle2, Sparkles, Volume2, MessageSquare, Layers, Mic } from 'lucide-react';
import type { SpeakingStageId } from '@/types/speaking-foundation';

export interface StageNavInfo {
  id: SpeakingStageId;
  stageNumber: number;
  title: string;
  shortTitle: string;
  href: string;
  tag: string;
  icon: React.ElementType;
}

export const FOUNDATION_STAGES: StageNavInfo[] = [
  {
    id: 'stage-0',
    stageNumber: 0,
    title: 'Chặng 0: Khai thông cơ miệng & Ngữ âm',
    shortTitle: 'Chặng 0: Ngữ âm',
    href: '/student/speaking/foundation/stage-0',
    tag: 'Video & Cặp âm',
    icon: Volume2,
  },
  {
    id: 'stage-1',
    stageNumber: 1,
    title: 'Chặng 1: Khung câu phản xạ sống còn',
    shortTitle: 'Chặng 1: Khung câu',
    href: '/student/speaking/foundation/stage-1',
    tag: '28 Mẫu câu',
    icon: MessageSquare,
  },
  {
    id: 'stage-2',
    stageNumber: 2,
    title: 'Chặng 2: Thế khối Lego (Slot Substitution)',
    shortTitle: 'Chặng 2: Khối Lego',
    href: '/student/speaking/foundation/stage-2',
    tag: 'Phản xạ <1s',
    icon: Layers,
  },
  {
    id: 'stage-3',
    stageNumber: 3,
    title: 'Chặng 3: Nở câu 3 nhịp & Hội thoại vi mô',
    shortTitle: 'Chặng 3: Nở câu',
    href: '/student/speaking/foundation/stage-3',
    tag: 'Đàm thoại 3 nhịp',
    icon: Sparkles,
  },
];

export interface StageProgressNavProps {
  /** The currently active stage ID, or undefined if on the overview hub */
  currentStage?: SpeakingStageId;
  /** Optional completion record per stage */
  stageProgress?: Partial<
    Record<
      SpeakingStageId,
      {
        completed?: boolean;
        percent?: number;
        completedItems?: number;
        totalItems?: number;
      }
    >
  >;
  /** Optional custom CSS classes */
  className?: string;
  /** Whether to show the top breadcrumbs trail */
  showBreadcrumbs?: boolean;
}

/**
 * StageProgressNav:
 * Responsive navigation bar with hierarchical breadcrumbs and 4-stage micro-learning tabs.
 * Designed with Technical Minimalist aesthetics, mobile thumb-zone compatibility,
 * and clear active/completion states.
 */
export const StageProgressNav: React.FC<StageProgressNavProps> = ({
  currentStage,
  stageProgress = {},
  className = '',
  showBreadcrumbs = true,
}) => {
  const currentStageInfo = FOUNDATION_STAGES.find((s) => s.id === currentStage);

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {/* Breadcrumb Trail */}
      {showBreadcrumbs && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto py-1 whitespace-nowrap scrollbar-none"
        >
          <Link
            href="/student"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Home className="size-3.5" />
            <span>Học tập</span>
          </Link>

          <ChevronRight className="size-3 text-slate-600 shrink-0" />

          <Link
            href="/student/speaking/foundation"
            className={`transition-colors hover:text-slate-200 flex items-center gap-1 ${
              !currentStage ? 'text-indigo-400 font-medium' : 'text-slate-400'
            }`}
          >
            <Mic className="size-3.5 text-indigo-400" />
            <span>Luyện nói Nền tảng</span>
          </Link>

          {currentStageInfo && (
            <>
              <ChevronRight className="size-3 text-slate-600 shrink-0" />
              <span className="text-white font-medium truncate max-w-[200px] sm:max-w-none">
                {currentStageInfo.shortTitle}
              </span>
            </>
          )}
        </nav>
      )}

      {/* Stage Navigation Pills / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
        {FOUNDATION_STAGES.map((stage) => {
          const isActive = stage.id === currentStage;
          const progress = stageProgress[stage.id];
          const isCompleted = Boolean(progress?.completed);
          const percent = progress?.percent ?? (isCompleted ? 100 : 0);
          const IconComponent = stage.icon;

          return (
            <Link
              key={stage.id}
              href={stage.href}
              className={`snap-start shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-indigo-950/60 border-indigo-500/70 text-white shadow-sm shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {/* Icon / Status badge */}
              <div
                className={`size-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-inner'
                    : isCompleted
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : (
                  <IconComponent className="size-4" />
                )}
              </div>

              {/* Title & Tag */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    Chặng {stage.stageNumber}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive
                        ? 'bg-indigo-800/60 text-indigo-200 border border-indigo-700/50'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {stage.tag}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate max-w-[130px] sm:max-w-[170px]">
                  {stage.title.split(': ')[1] || stage.title}
                </span>

                {/* Micro progress indicator if available */}
                {percent > 0 && (
                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StageProgressNav;
