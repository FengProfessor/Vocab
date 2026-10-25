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
import { type RoadmapUnitView } from '@/lib/roadmap-client';
import { ArrowRight, Award, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export interface UnitBadgeModalProps {
  unit: RoadmapUnitView | null;
  open: boolean;
  onClose: () => void;
  nextUnit?: RoadmapUnitView | null;
  onContinueNext?: (nextUnit: RoadmapUnitView) => void;
}

export function UnitBadgeModal({
  unit,
  open,
  onClose,
  nextUnit,
  onContinueNext,
}: UnitBadgeModalProps) {
  if (!unit) return null;

  const badgeIcon = unit.badgeIcon || '🏅';
  const badgeName = unit.badgeName || `Huy hiệu Chặng ${unit.index}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-md p-6 text-center max-h-[90vh] overflow-y-auto"
        data-testid="unit-badge-modal"
      >
        <DialogHeader className="space-y-2 text-center">
          <div className="mx-auto my-2 relative flex items-center justify-center">
            {/* Glowing effect background */}
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-125 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-lg border-2 border-amber-200 text-4xl">
              {badgeIcon}
            </div>
          </div>

          <div className="inline-flex items-center gap-1 mx-auto text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full">
            <Award className="w-3.5 h-3.5" />
            Vinh Danh Thành Tích
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {badgeName}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground">
            Chúc mừng bạn đã xuất sắc chinh phục <strong>Chặng {unit.index}: {unit.title}</strong>!
            Bạn đã hoàn thành toàn bộ các bài học và vượt qua checkpoint đánh giá.
          </DialogDescription>
        </DialogHeader>

        {/* Mastered Skills List */}
        {unit.canDo && unit.canDo.length > 0 && (
          <div className="my-3 text-left rounded-xl bg-muted/40 border p-3.5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Năng lực đã làm chủ trong chặng
            </p>
            <ul className="space-y-1.5 text-xs text-foreground">
              {unit.canDo.map((skill, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Module Recommendation */}
        {nextUnit ? (
          <div className="my-2 text-left rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Chặng tiếp theo đang chờ bạn
              </span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />~{nextUnit.estimatedMinutes || 45} phút
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background border shadow-xs text-xl">
                {nextUnit.badgeIcon || '🎯'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-muted-foreground">
                  Chặng {nextUnit.index}
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {nextUnit.title}
                </p>
                {nextUnit.badgeName && (
                  <p className="text-xs text-muted-foreground truncate">
                    Mục tiêu: {nextUnit.badgeName}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="my-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200">
            🎉 Bạn đã hoàn thành tất cả các chặng trong cấp độ này! Hãy kiểm tra Bài thi Exit Exam hoặc tiến lên cấp tiếp theo.
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] text-xs font-semibold"
          >
            Đóng & Xem Lộ Trình
          </Button>

          {nextUnit && onContinueNext && (
            <Button
              type="button"
              variant="chunky"
              onClick={() => onContinueNext(nextUnit)}
              className="w-full sm:w-auto min-h-[44px] text-xs font-bold flex items-center justify-center gap-2"
            >
              Học tiếp Chặng {nextUnit.index}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
