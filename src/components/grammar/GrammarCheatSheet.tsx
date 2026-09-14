'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, Search, X } from 'lucide-react';

interface GrammarCheatSheetProps {
  cheatSheetHtml?: string | null;
  lessonTitle?: string;
}

export default function GrammarCheatSheet({ cheatSheetHtml, lessonTitle }: GrammarCheatSheetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const term = searchTerm.trim().toLowerCase();
    const rows = containerRef.current.querySelectorAll('tr');

    if (!term) {
      rows.forEach((row) => {
        (row as HTMLElement).style.display = '';
      });
      if (badgeRef.current) {
        badgeRef.current.style.display = 'none';
      }
      return;
    }

    let matches = 0;
    rows.forEach((row) => {
      const htmlRow = row as HTMLElement;
      // Never hide table header
      if (htmlRow.querySelector('th')) {
        htmlRow.style.display = '';
        return;
      }
      const text = htmlRow.textContent?.toLowerCase() || '';
      if (text.includes(term)) {
        htmlRow.style.display = '';
        matches++;
      } else {
        htmlRow.style.display = 'none';
      }
    });

    if (badgeRef.current) {
      badgeRef.current.textContent = `${matches} hàng khớp`;
      badgeRef.current.style.display = 'inline-flex';
    }
  }, [searchTerm, cheatSheetHtml]);

  if (!cheatSheetHtml) {
    return (
      <div className="p-8 text-center rounded-2xl bg-muted/30 border border-border text-muted-foreground">
        <Table className="h-9 w-9 mx-auto mb-2 opacity-40 text-primary" />
        <h4 className="font-semibold text-sm text-foreground">Chưa có bảng tra cứu riêng cho bài này</h4>
        <p className="text-xs mt-1">Vui lòng tra cứu quy tắc và công thức tại tab Lý thuyết chi tiết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Table className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Bảng tra cứu quy tắc nhanh</h3>
              <span
                ref={badgeRef}
                style={{ display: 'none' }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 items-center gap-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tra cứu tức thời công thức và cách dùng khi làm bài tập {lessonTitle ? `· ${lessonTitle}` : ''}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Lọc từ khóa / công thức..."
            className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="prose prose-slate max-w-none bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xs overflow-x-auto
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-2.5
        [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:bg-muted/60 [&_th]:font-semibold [&_th]:text-xs [&_th]:text-foreground
        [&_td]:border [&_td]:border-border/70 [&_td]:p-3 [&_td]:text-xs [&_td]:text-foreground
        [&_tr:nth-child(even)]:bg-muted/20
        [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2.5 [&_h2]:text-foreground
        [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5
        [&_.b-table_td:first-child]:font-semibold [&_.b-table_td:first-child]:text-foreground
      "
        dangerouslySetInnerHTML={{ __html: cheatSheetHtml }}
      />
    </div>
  );
}
