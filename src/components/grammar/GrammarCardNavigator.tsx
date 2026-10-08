'use client';

import React, { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GrammarCardNavigatorProps {
  titles: string[];
  index: number;
  onChange: (index: number) => void;
}

/**
 * Điều hướng từng ý của bài học ngữ pháp.
 * - Hỗ trợ phím mũi tên Trái / Phải để chuyển ý nhanh.
 * - Bố cục 1 hàng gọn gàng, tối ưu chiều cao trên thiết bị di động.
 * - Chuẩn touch target 44px và accessibility.
 */
export default function GrammarCardNavigator({ titles, index, onChange }: GrammarCardNavigatorProps) {
  const total = titles.length;

  const handlePrev = useCallback(() => {
    if (index > 0) onChange(index - 1);
  }, [index, onChange]);

  const handleNext = useCallback(() => {
    if (index < total - 1) onChange(index + 1);
  }, [index, total, onChange]);

  // Phím tắt bàn phím: Mũi tên Trái / Phải
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input/textarea/select
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  if (total <= 1) {
    return (
      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-1">
        <span className="font-semibold text-foreground">{titles[0] || 'Nội dung bài học'}</span>
        <span className="px-2 py-0.5 border border-border bg-muted/30">1 ý trọng tâm</span>
      </div>
    );
  }

  return (
    <nav
      aria-label="Điều hướng ý bài học"
      className="flex items-center gap-2 min-w-0 bg-muted/15 border border-border p-1.5 rounded-none"
    >
      <button
        type="button"
        aria-label="Ý trước (Phím mũi tên Trái)"
        title="Ý trước (←)"
        disabled={index === 0}
        onClick={handlePrev}
        className="min-h-[44px] min-w-[44px] border border-border bg-card hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none rounded-none text-foreground transition-colors shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1 relative">
        <label htmlFor="grammar-card-select" className="sr-only">
          Chọn ý bài học
        </label>
        <select
          id="grammar-card-select"
          value={index}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-h-[44px] w-full min-w-0 border border-border bg-card px-3 text-xs sm:text-sm font-medium text-foreground rounded-none truncate focus:outline-none focus:border-primary cursor-pointer transition-colors"
        >
          {titles.map((title, itemIndex) => (
            <option key={itemIndex} value={itemIndex}>
              Ý {itemIndex + 1}/{total}: {title}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        aria-label="Ý tiếp theo (Phím mũi tên Phải)"
        title="Ý tiếp theo (→)"
        disabled={index === total - 1}
        onClick={handleNext}
        className="min-h-[44px] min-w-[44px] border border-border bg-card hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none rounded-none text-foreground transition-colors shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
