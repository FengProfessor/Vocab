'use client';

import React, { useMemo } from 'react';
import {
  ExamInteractiveText,
  stripWatermarkChars,
  type CoreVocabularyItem,
} from '@/components/exam/ExamInteractiveText';
import type { ExamDictResult } from '@/lib/exam-dict-cache';
import type { LookupThemeVariant } from './VocabLookupProvider';

export interface HighlightSpan {
  start: number;
  end: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  role?: string;
}

export interface HighlightedSegment {
  text: string;
  highlighted: boolean;
  span?: HighlightSpan;
}

export function computeHighlightSegments(
  text: string,
  highlight?: string | string[],
  spans?: HighlightSpan[],
): { segments: HighlightedSegment[]; plainSentence: string } {
  if (!text) {
    return { segments: [], plainSentence: '' };
  }

  // Offset spans mode (e.g. GrammarHighlight WordAnnotation[])
  if (spans && spans.length > 0) {
    const validSpans = spans.filter(
      (s) => s && Number.isFinite(s.start) && Number.isFinite(s.end),
    );
    const sorted = [...validSpans].sort((a, b) => a.start - b.start);
    const segments: HighlightedSegment[] = [];
    let cursor = 0;

    for (const span of sorted) {
      const start = Math.max(cursor, Math.min(span.start, text.length));
      const end = Math.max(start, Math.min(span.end, text.length));

      if (start > cursor) {
        segments.push({ text: text.slice(cursor, start), highlighted: false });
      }
      if (end > start) {
        segments.push({ text: text.slice(start, end), highlighted: true, span });
      }
      cursor = end;
    }

    if (cursor < text.length) {
      segments.push({ text: text.slice(cursor), highlighted: false });
    }

    return {
      segments,
      plainSentence: stripWatermarkChars(text),
    };
  }

  // Substring highlight mode (e.g. HighlightedSentence)
  const sanitized = stripWatermarkChars(text);
  const items = Array.isArray(highlight) ? highlight : highlight ? [highlight] : [];
  const validItems = items.map((s) => (typeof s === 'string' ? stripWatermarkChars(s).trim() : '')).filter(Boolean);
  const mdMatches = [...sanitized.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
  const allHighlights = Array.from(new Set([...validItems, ...mdMatches]));

  const cleanText = sanitized.replace(/\*\*/g, '');
  if (allHighlights.length === 0) {
    return {
      segments: [{ text: cleanText, highlighted: false }],
      plainSentence: cleanText,
    };
  }

  const sorted = [...allHighlights].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(
    `(?<![\\p{L}\\p{M}\\d]['’-])(\\b(?:${escaped})\\b|(?<=^|\\s|[.,!?;:"'()\\[\\]“”‘’—–/])(?:${escaped})(?=$|\\s|[.,!?;:"'()\\[\\]“”‘’—–/]))(?!['’-][\\p{L}\\p{M}\\d])`,
    'giu',
  );
  const parts = cleanText.split(regex);
  const lowerHighlights = new Set(allHighlights.map((h) => h.toLowerCase()));

  const segments: HighlightedSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    segments.push({
      text: part,
      highlighted: lowerHighlights.has(part.toLowerCase()),
    });
  }

  return { segments, plainSentence: cleanText };
}

export interface InteractiveHighlightedTextProps {
  text: string;
  highlight?: string | string[];
  spans?: HighlightSpan[];
  enabled?: boolean;
  as?: 'span' | 'p' | 'div';
  className?: string;
  highlightClassName?: string;
  wordClassName?: string;
  activeWordClassName?: string;
  coreVocabulary?: CoreVocabularyItem[] | Record<string, CoreVocabularyItem | ExamDictResult>;
  themeVariant?: LookupThemeVariant;
  disableSave?: boolean;
  onWordClick?: (
    word: string,
    cleanWord: string,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  contextSentence?: string;
}

/**
 * Format-preserving interactive text wrapper for substring highlights (`highlight`)
 * or character-offset annotations (`spans`).
 */
export function InteractiveHighlightedText({
  text,
  highlight,
  spans,
  enabled = true,
  as: Component = 'span',
  className = '',
  highlightClassName = 'font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-1 py-0.2 border border-primary/30 rounded-xs transition-colors',
  wordClassName = '',
  activeWordClassName = '',
  coreVocabulary,
  themeVariant,
  disableSave,
  onWordClick,
  contextSentence,
}: InteractiveHighlightedTextProps) {
  const { segments, plainSentence } = useMemo(
    () => computeHighlightSegments(text, highlight, spans),
    [text, highlight, spans],
  );

  if (!text) return null;

  const resolvedContext = contextSentence || plainSentence;

  const renderInteractive = (segText: string) => (
    <ExamInteractiveText
      text={segText}
      enabled={enabled}
      as="span"
      inheritClassName
      wordClassName={wordClassName}
      activeWordClassName={activeWordClassName}
      coreVocabulary={coreVocabulary}
      themeVariant={themeVariant}
      disableSave={disableSave}
      onWordClick={onWordClick}
      contextSentence={resolvedContext}
    />
  );

  return (
    <Component className={className}>
      {segments.map((seg, i) => {
        if (seg.highlighted) {
          const spanClass = seg.span?.className ?? `inline-block ${highlightClassName}`;
          return (
            <span
              key={i}
              className={spanClass}
              style={seg.span?.style}
              title={seg.span?.title}
            >
              {renderInteractive(seg.text)}
            </span>
          );
        }
        return <React.Fragment key={i}>{renderInteractive(seg.text)}</React.Fragment>;
      })}
    </Component>
  );
}
