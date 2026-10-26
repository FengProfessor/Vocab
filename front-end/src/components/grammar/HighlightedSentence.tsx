
import React from 'react';

export interface HighlightedSentenceProps {
  text: string;
  highlight?: string | string[];
  className?: string;
  highlightClassName?: string;
}

/**
 * High-performance sentence highlighter that bolds target grammar keywords:
 * - Supports single keyword or array of multiple keywords
 * - Supports explicit markdown bold (**keyword**) embedded in sentence
 * - Respects word boundaries, contractions ('s, isn't, don't), and multi-word phrases (there is, in front of)
 * - Renders crisp, high-contrast, accessible typography without forced uppercase distortion
 */
export default function HighlightedSentence({
  text,
  highlight,
  className = '',
  highlightClassName = 'font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-1 py-0.2 border border-primary/30 rounded-xs transition-colors',
}: HighlightedSentenceProps) {
  if (!text) return null;

  const items = Array.isArray(highlight) ? highlight : highlight ? [highlight] : [];
  const validItems = items.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

  // Extract explicit markdown bold tokens: **word**
  const mdMatches = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
  const allHighlights = Array.from(new Set([...validItems, ...mdMatches]));

  const cleanText = text.replace(/\*\*/g, '');

  if (allHighlights.length === 0) {
    return <span className={className}>{cleanText}</span>;
  }

  // Sort longest first to avoid partial sub-word hijacking
  const sorted = allHighlights.sort((a, b) => b.length - a.length);
  const escaped = sorted.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  // Match whole words, contractions, or exact phrases
  const regex = new RegExp(`(\\b(?:${escaped})\\b|(?<=^|\\s|[.,!?;:"'()\\[\\]])(?:${escaped})(?=$|\\s|[.,!?;:"'()\\[\\]]))`, 'gi');
  const parts = cleanText.split(regex);
  const lowerHighlights = new Set(allHighlights.map((h) => h.toLowerCase()));

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (lowerHighlights.has(part.toLowerCase())) {
          return (
            <span key={i} className={`inline-block ${highlightClassName}`}>
              {part}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}

// Named export for backwards-compatibility
export { HighlightedSentence };
