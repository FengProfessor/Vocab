'use client';

import React from 'react';

function cleanFormulaToken(raw: string): string {
  if (!raw) return '';
  const s = raw.trim().replace(/^\{|\}$/g, '').trim();

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
    return 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800';
  }
  if (cleanText.startsWith('V') || cleanText.startsWith('be')) {
    return 'bg-indigo-50 text-indigo-800 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
  }
  if (cleanText.startsWith('O') || cleanText.includes('Bổ ngữ')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  }
  return 'bg-muted text-foreground border-border/80';
}

export function GrammarFormula({ code }: { code: string }) {
  if (!code) return null;

  // Split multiple formulas if separated by newline or dot-separator '·'
  const formulas = code
    .split(/\n|·/)
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span>Công thức cấu trúc</span>
      </div>

      <div className="space-y-2.5">
        {formulas.map((formula, fIdx) => {
          // Split elements by '+'
          const parts = formula
            .split('+')
            .map((p) => p.trim())
            .filter(Boolean);

          return (
            <div
              key={fIdx}
              className="flex flex-nowrap items-center gap-2 sm:gap-2.5 p-3 bg-muted/40 rounded-xl border border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none"
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
                      <span className="text-muted-foreground/70 font-semibold text-sm shrink-0 px-0.5 select-none">
                        +
                      </span>
                    )}

                    {isStack ? (
                      <div className="flex flex-col gap-1 p-1 bg-background rounded-lg border border-border/60 shrink-0">
                        {options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`px-3 py-1 rounded-md text-xs font-semibold border text-center transition-colors whitespace-nowrap shrink-0 ${getTokenBadgeStyle(opt)}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 ${getTokenBadgeStyle(options[0])}`}
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
