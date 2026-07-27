'use client';

import React from 'react';

type FormulaToken = 
  | { type: 'block'; text: string }
  | { type: 'stack'; options: string[] };

function parseFormula(text: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let currentToken = '';
  let insideBraces = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') insideBraces = true;
    if (char === '}') insideBraces = false;

    if (char === '+' && !insideBraces) {
      if (currentToken.trim()) {
        tokens.push({ type: 'block', text: currentToken.trim() });
      }
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  
  if (currentToken.trim()) {
    tokens.push({ type: 'block', text: currentToken.trim() });
  }

  return tokens.map(token => {
    if (token.type === 'block') {
      const text = token.text;
      if (text.startsWith('{') && text.endsWith('}')) {
        const inner = text.slice(1, -1);
        const options = inner.split('|').map(o => o.trim()).filter(Boolean);
        return { type: 'stack', options };
      }
    }
    return token;
  });
}

export function GrammarFormula({ code }: { code: string }) {
  const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
  
  return (
    <div className="flex flex-col gap-6 my-6 overflow-x-auto pb-4">
      {lines.map((line, i) => {
        const tokens = parseFormula(line);
        return (
          <div key={i} className="flex flex-nowrap md:flex-wrap items-center gap-3 w-max md:w-auto">
            {tokens.map((token, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300 font-black text-xl shrink-0">+</span>}
                
                {token.type === 'stack' ? (
                  <div className="flex flex-col gap-1.5 p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 shadow-sm shrink-0 min-w-[120px]">
                    {token.options.map((opt, oIdx) => (
                      <div key={oIdx} className="px-4 py-2 bg-white rounded-lg font-mono text-indigo-700 font-bold shadow-sm text-center border border-indigo-50 whitespace-nowrap">
                        {opt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-3 bg-slate-50 rounded-xl font-mono text-slate-800 font-bold border border-slate-200 shadow-sm text-center shrink-0 min-w-[48px] whitespace-nowrap">
                    {token.text}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </div>
  );
}
