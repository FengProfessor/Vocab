'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type RoadmapStepView } from '@/lib/roadmap-client';
import {
  Sparkles,
  GraduationCap,
  Headphones,
  Flag,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  FileText,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NodePreviewModalProps {
  step: RoadmapStepView | null;
  open: boolean;
  onClose: () => void;
  onStart: (step: RoadmapStepView) => void;
  unitTitle?: string;
  unitIndex?: number;
  isBusy?: boolean;
}

const STEP_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  vocab: {
    label: 'Từ vựng',
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/50',
  },
  grammar: {
    label: 'Ngữ pháp',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950/50',
  },
  pronunciation: {
    label: 'Phát âm',
    icon: Headphones,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950/50',
  },
  checkpoint: {
    label: 'Checkpoint Chặng',
    icon: Flag,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/50',
  },
  reading: {
    label: 'Đọc hiểu',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  cloze: {
    label: 'Điền từ Cloze',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950/50',
  },
  arrange: {
    label: 'Sắp xếp câu',
    icon: BookOpen,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-950/50',
  },
  announcement: {
    label: 'Thông báo',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-950/50',
  },
  leaflet: {
    label: 'Tờ rơi',
    icon: BookOpen,
    color: 'text-lime-600 dark:text-lime-400',
    bg: 'bg-lime-100 dark:bg-lime-950/50',
  },
  exam: {
    label: 'Đề mini 2025',
    icon: Flag,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950/50',
  },
};

export function NodePreviewModal({
  step,
  open,
  onClose,
  onStart,
  unitTitle,
  unitIndex,
  isBusy = false,
}: NodePreviewModalProps) {
  if (!step) return null;

  const meta = STEP_META[step.type] || {
    label: step.type,
    icon: BookOpen,
    color: 'text-primary',
    bg: 'bg-primary/10',
  };
  const Icon = meta.icon;

  const estimatedMinutes = step.estimatedMinutes || (step.type === 'checkpoint' ? 15 : 12);
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';
  const isReview = step.status === 'review';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
        data-testid="node-preview-modal"
      >
        <DialogHeader className="space-y-2 text-left">
          {/* Top badges: Unit Context + Type Badge + Duration */}
          <div className="flex flex-wrap items-center gap-2">
            {unitTitle && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {unitIndex !== undefined ? `Chặng ${unitIndex}` : unitTitle}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md',
                meta.bg,
                meta.color
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />~{estimatedMinutes} phút
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground pt-1">
            {step.title}
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
            {step.type === 'checkpoint' || step.type === 'exam'
              ? 'Bài đánh giá chặng tổng hợp: Yêu cầu đạt ≥ 80% để mở khóa chặng tiếp theo.'
              : 'Bài học micro-learning kết hợp ngữ cảnh thực tế, bài tập tương tác tức thì và ghi nhớ sâu.'}
          </DialogDescription>
        </DialogHeader>

        {/* Status Indicator Banner */}
        <div className="my-2">
          {isCompleted ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  Đã hoàn thành {step.fromLibrary ? '(Đồng bộ từ kho bài tập)' : ''}
                </span>
              </div>
              {step.score !== null && step.score !== undefined && (
                <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100">
                  {step.score}%
                </span>
              )}
            </div>
          ) : isCurrent ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Target className="w-4 h-4 text-primary shrink-0" />
              <span>Tiêu điểm bài học: Bước tiếp theo cần hoàn thành</span>
            </div>
          ) : isReview ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Được mở tự do để ôn tập củng cố kiến thức</span>
            </div>
          ) : null}
        </div>

        {/* Learning Objectives (Can-do skills) */}
        {step.canDo && step.canDo.length > 0 && (
          <div className="space-y-2 rounded-xl bg-muted/40 border p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              Mục tiêu đầu ra (Can-Do)
            </h4>
            <ul className="space-y-1 text-xs text-foreground">
              {step.canDo.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topic Preview */}
        {step.topicPreview && (
          <div className="space-y-2 rounded-xl bg-muted/30 border p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Nội dung trọng tâm
            </h4>
            <p className="text-xs text-foreground leading-relaxed">
              {step.topicPreview}
            </p>
          </div>
        )}

        {/* Checkpoint Requirements Note */}
        {(step.type === 'checkpoint' || step.type === 'exam') && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-200 text-[11px]">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Nguyên tắc mở khóa:</strong> Checkpoint gồm các câu hỏi đa kỹ năng tổng hợp và ôn tập xoáy ốc. Cần đạt tối thiểu <strong>80%</strong> để ghi nhận hoàn thành.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter className="flex-row items-center justify-end gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] px-4 text-xs font-medium"
          >
            Đóng
          </Button>

          <Button
            type="button"
            variant="chunky"
            disabled={isBusy}
            onClick={() => onStart(step)}
            className="min-h-[44px] px-5 text-xs font-bold flex items-center gap-2"
          >
            {isBusy ? (
              'Đang nạp...'
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Học lại bài này
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Bắt đầu học ngay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
