'use client';

import React from 'react';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
}

/**
 * Renders inline markdown (**bold**, *italic*, `code`) into clean React elements.
 * Converts markdown bullets to typography bullets (•) and strips any rogue unmatched
 * asterisks, guaranteeing zero raw '**' or '*' artifacts in the UI.
 */
export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (text === null || text === undefined) return null;
  const rawStr = typeof text === 'string' ? text : String(text);
  if (!rawStr.trim()) return null;

  // 1. Normalize bullet points at beginning of lines or after punctuation: "* " -> "• "
  const preprocessed = rawStr
    .replace(/(^|\n)\s*[*•]\s+/g, '$1• ')
    .replace(/\s+[*•]\s+/g, ' • ');

  // 2. Tokenize by bold-italic (***...***), bold (**...**), italic (*...*), or inline code (`...`)
  const tokens = preprocessed.split(/(\*{3}[^*\n]+?\*{3}|\*{2}[^*\n]+?\*{2}|\*[^*\n]+?\*|`[^`\n]+?`)/g);

  return (
    <span className={`whitespace-pre-line break-words ${className}`}>
      {tokens.map((token, i) => {
        if (!token) return null;

        // Bold + Italic: ***text***
        if (token.startsWith('***') && token.endsWith('***') && token.length >= 6) {
          const inner = token.slice(3, -3).replace(/\*/g, '').trim();
          return (
            <strong key={i} className="font-semibold italic text-foreground">
              {inner}
            </strong>
          );
        }

        // Bold: **text**
        if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
          const inner = token.slice(2, -2).replace(/\*/g, '').trim();
          return (
            <strong key={i} className="font-semibold text-foreground">
              {inner}
            </strong>
          );
        }

        // Italic: *text*
        if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
          const inner = token.slice(1, -1).replace(/\*/g, '').trim();
          return (
            <em key={i} className="italic text-foreground/90">
              {inner}
            </em>
          );
        }

        // Code: `code`
        if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
          return (
            <code key={i} className="font-mono text-[11px] px-1 py-0.5 bg-muted/60 border border-border/60 rounded-none">
              {token.slice(1, -1)}
            </code>
          );
        }

        // Plain text: strip any stray or unmatched asterisks completely
        const cleanPlainText = token.replace(/\*+/g, '');
        return <span key={i}>{cleanPlainText}</span>;
      })}
    </span>
  );
}
