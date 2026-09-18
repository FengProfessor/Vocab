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
      <div className="p-8 text-center rounded-2xl bg-muted/20 text-muted-foreground">
        <Table className="h-9 w-9 mx-auto mb-2 opacity-40 text-primary" />
        <h4 className="font-semibold text-sm text-foreground">Chưa có bảng tra cứu riêng cho bài này</h4>
        <p className="text-xs mt-1">Vui lòng tra cứu quy tắc và công thức tại tab Lý thuyết chi tiết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Table className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-semibold text-base text-foreground">Bảng tra cứu quy tắc nhanh</h3>
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
            className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-border/60 bg-background/60 text-foreground text-xs font-medium focus:outline-none focus:border-primary"
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
        className="prose prose-slate max-w-none overflow-x-auto my-4 -mx-4 sm:mx-0 px-4 sm:px-0
        [&_table]:w-full [&_table]:border-collapse [&_table]:border-b [&_table]:border-border/60
        [&_th]:border-b [&_th]:border-border/60 [&_th]:py-3 [&_th]:px-3.5 [&_th]:font-semibold [&_th]:text-xs [&_th]:text-muted-foreground [&_th]:uppercase [&_th]:tracking-wider
        [&_td]:border-t [&_td]:border-border/30 [&_td]:py-3 [&_td]:px-3.5 [&_td]:text-sm [&_td]:text-foreground/90
        [&_tr:hover]:bg-muted/30 [&_tr]:transition-colors
        [&_h2]:font-serif [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2.5 [&_h2]:text-foreground
        [&_ul]:my-1 [&_ul]:pl-4 [&_li]:my-0.5
        [&_.b-table_td:first-child]:font-semibold [&_.b-table_td:first-child]:text-foreground
      "
        dangerouslySetInnerHTML={{ __html: cheatSheetHtml }}
      />
    </div>
  );
}
