'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface LibraryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
}

export function LibraryPagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: LibraryPaginationProps) {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-800">
      {/* Information text */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Hiển thị{' '}
        <span className="font-bold text-slate-900 dark:text-white">
          {totalItems === 0 ? 0 : startIndex + 1} - {endIndex}
        </span>{' '}
        trên tổng số <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> video
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* First Page button (desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="Trang đầu"
          title="Trang đầu"
          className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Trang trước</span>
        </button>

        {/* Numbered page buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs font-bold text-slate-400 dark:text-slate-600"
                >
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`h-9 min-w-[36px] rounded-xl px-2 text-xs font-bold transition-all active:scale-95 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <span>Trang sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page button (desktop) */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Trang cuối"
          title="Trang cuối"
          className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
