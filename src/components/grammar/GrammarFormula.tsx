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
    return 'bg-sky-500/10 text-sky-800 dark:text-sky-300';
  }
  if (cleanText.startsWith('V') || cleanText.startsWith('be')) {
    return 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300';
  }
  if (cleanText.startsWith('O') || cleanText.includes('Bổ ngữ')) {
    return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
  }
  return 'bg-muted/60 text-foreground';
}

export function GrammarFormula({ code }: { code: string }) {
  if (!code) return null;

  // Split multiple formulas if separated by newline or dot-separator '·'
  const formulas = code
    .split(/\n|·/)
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <div className="my-6 space-y-2.5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
          Công thức cấu trúc
        </span>
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
              className="flex flex-nowrap items-center gap-2 sm:gap-2.5 py-2.5 px-3 bg-muted/20 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-none"
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
                      <div className="flex flex-col gap-1 p-1 bg-muted/40 rounded-lg shrink-0">
                        {options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`px-3 py-1 rounded-md text-xs font-semibold text-center transition-colors whitespace-nowrap shrink-0 ${getTokenBadgeStyle(opt)}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${getTokenBadgeStyle(options[0])}`}
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
