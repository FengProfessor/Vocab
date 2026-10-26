
import React, { useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GrammarCardNavigatorPill {
  label: string;
  subLabel?: string;
}

export interface GrammarCardNavigatorProps {
  titles: string[];
  index: number;
  onChange: (index: number) => void;
  pills?: Array<GrammarCardNavigatorPill | string>;
  onComplete?: () => void;
  completeLabel?: string;
}

/**
 * Điều hướng từng ý / đại từ của bài học ngữ pháp.
 * - Hỗ trợ Segmented Control / Step Pills bấm 1-chạm chuyển ngôi tức thì.
 * - Hỗ trợ phím mũi tên Trái / Phải để chuyển ý / ngôi nhanh (roving tabindex WAI-ARIA).
 * - Thiết kế tối ưu không gian, zero-scroll trên Desktop.
 * - Chuẩn touch target Apple HIG và accessibility.
 */
export default function GrammarCardNavigator({
  titles,
  index,
  onChange,
  pills,
  onComplete,
  completeLabel,
}: GrammarCardNavigatorProps) {
  const total = pills ? pills.length : titles.length;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = useCallback(
    (nextIndex: number) => {
      onChange(nextIndex);
      tabRefs.current[nextIndex]?.focus();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          // Bỏ qua nếu thiết bị chặn haptic
        }
      }
    },
    [onChange]
  );

  const handlePrev = useCallback(() => {
    if (index > 0) selectTab(index - 1);
  }, [index, selectTab]);

  const handleNext = useCallback(() => {
    if (index < total - 1) {
      selectTab(index + 1);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, total, selectTab, onComplete]);

  // Phím tắt bàn phím: Mũi tên Trái / Phải / Home / End
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input/textarea/select/contentEditable
      const target = e.target as HTMLElement;
      if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index < total - 1) selectTab(index + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectTab(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        selectTab(total - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, index, selectTab, total]);

  if (total <= 1) {
    return (
      <div className="flex items-center justify-between text-xs font-sans text-muted-foreground pb-1">
        <span className="font-semibold text-foreground">{titles[0] || 'Nội dung bài học'}</span>
        <span className="px-2 py-0.5 border border-border bg-muted/30">1 ý trọng tâm</span>
      </div>
    );
  }

  // Chế độ Segmented Control / Step Pills (khi truyền pills hoặc danh sách ngắn <= 7)
  const pillList: GrammarCardNavigatorPill[] = pills
    ? pills.map((p) => (typeof p === 'string' ? { label: p } : p))
    : titles.map((t, idx) => {
        const prefix = t.split(/[(:—–]/)[0]?.trim() || '';
        const shortLabel = prefix.length > 0 && prefix.length <= 16 ? prefix : t.slice(0, 14).trim();
        return {
          label: `${idx + 1}`,
          subLabel: shortLabel || undefined,
        };
      });

  const isLastStep = index === total - 1;

  return (
    <nav
      aria-label={pills ? 'Điều hướng 7 đại từ nhân xưng' : 'Điều hướng nội dung bài học'}
      className="flex items-center gap-1 sm:gap-1.5 min-w-0 bg-muted/20 border border-border p-1 rounded-lg select-none touch-manipulation"
    >
      <button
        type="button"
        aria-label={pills ? 'Ngôi trước (Phím mũi tên Trái)' : 'Mục trước (Phím mũi tên Trái)'}
        title={pills ? 'Ngôi trước (←)' : 'Mục trước (←)'}
        disabled={index === 0}
        onClick={handlePrev}
        className={`${
          pills ? 'hidden sm:flex' : 'flex'
        } min-h-[44px] min-w-[44px] border border-border bg-card hover:bg-muted items-center justify-center disabled:opacity-30 disabled:pointer-events-none rounded-lg text-foreground transition-colors shrink-0 touch-manipulation`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        role="tablist"
        aria-label={pills ? 'Danh sách 7 đại từ' : 'Danh sách các ý bài học'}
        className="grid gap-1 sm:gap-1.5 flex-1 min-w-0"
        style={{
          gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
        }}
      >
        {pillList.map((item, pIdx) => {
          const isSelected = pIdx === index;
          const isPronounMode = pillList.length === 7 && item.label.length <= 4;
          return (
            <button
              key={pIdx}
              ref={(el) => {
                tabRefs.current[pIdx] = el;
              }}
              id={`card-nav-tab-${item.label}`}
              aria-controls={pills ? `pronoun-panel-${item.label}` : undefined}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => selectTab(pIdx)}
              className={`min-h-[42px] sm:min-h-[44px] px-1 sm:px-2 py-1 font-sans transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center rounded-lg cursor-pointer touch-manipulation min-w-0 ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs border border-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/70'
              }`}
              title={pills ? `Ngôi: ${item.label}${item.subLabel ? ` → ${item.subLabel}` : ''}` : `Ý ${item.label}${item.subLabel ? `: ${item.subLabel}` : ''}`}
            >
              <span className="text-xs sm:text-sm font-bold tracking-tight shrink-0">{item.label}</span>
              {item.subLabel && (
                <span
                  className={`text-[9px] sm:text-xs font-normal opacity-90 truncate max-w-full leading-tight inline ${
                    isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {isPronounMode ? `→${item.subLabel}` : item.subLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label={
          isLastStep && onComplete
            ? completeLabel || 'Làm bài tập thực hành'
            : pills
            ? 'Ngôi tiếp theo (Phím mũi tên Phải)'
            : 'Mục tiếp theo (Phím mũi tên Phải)'
        }
        title={
          isLastStep && onComplete
            ? completeLabel || 'Làm bài tập thực hành'
            : pills
            ? 'Ngôi tiếp theo (→)'
            : 'Mục tiếp theo (→)'
        }
        disabled={isLastStep && !onComplete}
        onClick={handleNext}
        className={`${
          pills ? 'hidden sm:flex' : 'flex'
        } min-h-[44px] ${
          isLastStep && onComplete
            ? 'px-2.5 bg-primary text-primary-foreground border-primary hover:bg-primary/90 font-sans text-[11px] font-bold uppercase tracking-wider gap-1'
            : 'min-w-[44px] bg-card hover:bg-muted text-foreground border-border'
        } border items-center justify-center disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors shrink-0 touch-manipulation`}
      >
        {isLastStep && onComplete && (
          <span className="hidden md:inline">{completeLabel || 'Luyện tập'}</span>
        )}
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
