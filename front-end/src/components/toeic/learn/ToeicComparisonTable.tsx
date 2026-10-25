'use client';

import React from 'react';
import { Table, Info } from 'lucide-react';
import type { ComparisonTable } from '@/data/toeic/theory/types';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';

export interface ToeicComparisonTableProps {
  table: ComparisonTable;
  className?: string;
}

export function ToeicComparisonTable({ table, className = '' }: ToeicComparisonTableProps) {
  const { title, headers, rows, summaryNote } = table;

  return (
    <div
      aria-label={title}
      className={`rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 my-4 shadow-xs ${className}`}
    >
      {/* Table Header Bar */}
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-3.5 py-2.5">
          <Table className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {title}
          </h4>
        </div>
      )}

      {/* Responsive Table Scroll Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/80">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-3.5 py-2.5 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {rows.map((row, rIdx) => {
              const isHighlight = row.highlight;
              return (
                <tr
                  key={rIdx}
                  className={`transition-colors ${
                    isHighlight
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30'
                      : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {row.colValues.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-3.5 py-2.5 align-top leading-relaxed ${
                        cIdx === 0 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {cIdx === 0 && row.badge && (
                          <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                            {row.badge}
                          </span>
                        )}
                        <ExamInteractiveText text={cell} enabled={true} />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Note Footer */}
      {summaryNote && (
        <div className="flex items-start gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span className="leading-normal">{summaryNote}</span>
        </div>
      )}
    </div>
  );
}
