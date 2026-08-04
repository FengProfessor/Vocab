'use client';

import React from 'react';

function cleanFormulaToken(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().replace(/^\{|\}$/g, '').trim();

  const keyMap: Record<string, string> = {
    'S:S': 'S (Chủ ngữ)',
    'V:V': 'V (Động từ)',
    'O:O': 'O (Tân ngữ)',
    'V:be': 'be (am/is/are)',
    'D:bổ ngữ': 'Bổ ngữ',
    'S': 'S (Chủ ngữ)',
    'V': 'V (Động từ)',
    'O': 'O (Tân ngữ)',
    'be': 'be (am/is/are)',
  };

  if (keyMap[s]) return keyMap[s];

  if (s.includes(':')) {
    const parts = s.split(':');
    const k = parts[0].trim();
    const v = parts.slice(1).join(':').trim();
    if (k === 'S') return `S (${v || 'Chủ ngữ'})`;
    if (k === 'V') return `V (${v || 'Động từ'})`;
    if (k === 'O') return `O (${v || 'Tân ngữ'})`;
    if (k === 'D') return v || 'Bổ ngữ';
    return `${k} (${v})`;
  }

  return s;
}

function getTokenBadgeStyle(cleanText: string): string {
  if (cleanText.startsWith('S')) {
    return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border-blue-500';
  }
  if (cleanText.startsWith('V') || cleanText.startsWith('be')) {
    return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border-purple-500';
  }
  if (cleanText.startsWith('O') || cleanText.includes('Bổ ngữ')) {
    return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border-emerald-500';
  }
  return 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md border-slate-700';
}

export function GrammarFormula({ code }: { code: string }) {
  if (!code) return null;

  // Split multiple formulas if separated by newline or dot-separator '·'
  const formulas = code
    .split(/\n|·/)
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <div className="my-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-100 dark:border-indigo-800/60 shadow-lg space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
        <span>⚡ Công thức cốt lõi</span>
      </div>

      <div className="space-y-3">
        {formulas.map((formula, fIdx) => {
          // Split elements by '+'
          const parts = formula
            .split('+')
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <div
              key={fIdx}
              className="flex flex-nowrap items-center gap-2 sm:gap-3 p-3 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-indigo-100/80 dark:border-slate-800 shadow-sm overflow-x-auto whitespace-nowrap no-scrollbar"
            >
              {parts.map((part, pIdx) => {
                // If part has choices like {am|is|are} or (don't | doesn't)
                const isStack = part.includes('|');
                const options = isStack
                  ? part.replace(/^\{|\}$|\(|\)/g, '').split('|').map((o) => cleanFormulaToken(o))
                  : [cleanFormulaToken(part)];

                return (
                  <React.Fragment key={pIdx}>
                    {pIdx > 0 && (
                      <span className="text-indigo-400 dark:text-indigo-500 font-black text-base sm:text-lg shrink-0 px-0.5 select-none">
                        +
                      </span>
                    )}

                    {isStack ? (
                      <div className="flex flex-col gap-1 p-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0">
                        {options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-extrabold border text-center transition-all whitespace-nowrap shrink-0 ${getTokenBadgeStyle(opt)}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold border shadow-sm transition-all whitespace-nowrap shrink-0 ${getTokenBadgeStyle(options[0])}`}
                      >
                        {options[0]}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
