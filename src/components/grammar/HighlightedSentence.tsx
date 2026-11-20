'use client';

import React from 'react';
import {
  InteractiveHighlightedText,
  type InteractiveHighlightedTextProps,
} from '@/components/vocab/InteractiveHighlightedText';
import type { LookupThemeVariant } from '@/components/vocab/VocabLookupProvider';

export interface HighlightedSentenceProps {
  text: string;
  highlight?: string | string[];
  className?: string;
  highlightClassName?: string;
  enabled?: boolean;
  themeVariant?: LookupThemeVariant;
  contextSentence?: string;
  onWordClick?: InteractiveHighlightedTextProps['onWordClick'];
  wordClassName?: string;
  activeWordClassName?: string;
  coreVocabulary?: InteractiveHighlightedTextProps['coreVocabulary'];
  disableSave?: boolean;
}

/**
 * High-performance sentence highlighter that bolds target grammar keywords and
 * wires unified tap-to-lookup (`themeVariant="minimalist"` by default):
 * - Supports single keyword or array of multiple keywords
 * - Supports explicit markdown bold (**keyword**) embedded in sentence
 * - Respects word boundaries, contractions ('s, isn't, don't), and multi-word phrases (there is, in front of)
 */
export default function HighlightedSentence({
  text,
  highlight,
  className = '',
  highlightClassName = 'font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-1 py-0.2 border border-primary/30 rounded-xs transition-colors',
  enabled = true,
  themeVariant = 'minimalist',
  contextSentence,
  onWordClick,
  wordClassName,
  activeWordClassName,
  coreVocabulary,
  disableSave,
}: HighlightedSentenceProps) {
  return (
    <InteractiveHighlightedText
      text={text}
      highlight={highlight}
      enabled={enabled}
      as="span"
      className={className}
      highlightClassName={highlightClassName}
      themeVariant={themeVariant}
      contextSentence={contextSentence}
      onWordClick={onWordClick}
      wordClassName={wordClassName}
      activeWordClassName={activeWordClassName}
      coreVocabulary={coreVocabulary}
      disableSave={disableSave}
    />
  );
}

// Named export for backwards-compatibility
export { HighlightedSentence };
