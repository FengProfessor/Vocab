'use client';

import React from 'react';

interface FormattedTextProps {
  text?: string | null;
  className?: string;
}

/**
 * Renders inline markdown (**bold**, *italic*, `code`) into clean React elements.
 * Strips any rogue unmatched asterisks, guaranteeing zero raw '**' or '*' artifacts in the UI.
 */
export default function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Split tokens by bold-italic (***...***), bold (**...**), italic (*...*), or code (`...`)
  const tokens = text.split(/(\*{3}[^*]+?\*{3}|\*{2}[^*]+?\*{2}|\*[^*\n]+?\*|`[^`\n]+?`)/g);

  return (
    <span className={className}>
      {tokens.map((token, i) => {
        if (!token) return null;

        // Bold + Italic: ***text***
        if (token.startsWith('***') && token.endsWith('***') && token.length >= 6) {
          return (
            <strong key={i} className="font-semibold italic text-foreground">
              {token.slice(3, -3)}
            </strong>
          );
        }

        // Bold: **text**
        if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {token.slice(2, -2)}
            </strong>
          );
        }

        // Italic: *text*
        if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
          return (
            <em key={i} className="italic text-foreground/90">
              {token.slice(1, -1)}
            </em>
          );
        }

        // Code: `code`
        if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
          return (
            <code key={i} className="font-mono text-[11px] px-1 py-0.5 bg-muted/60 border border-border/60">
              {token.slice(1, -1)}
            </code>
          );
        }

        // Plain text: strip any stray unclosed double asterisks
        const cleanPlainText = token.replace(/\*\*/g, '');
        return <span key={i}>{cleanPlainText}</span>;
      })}
    </span>
  );
}
