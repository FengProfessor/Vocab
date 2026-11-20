'use client';

import React, { useMemo } from 'react';
import {
  ExamInteractiveText,
  stripWatermarkChars,
  type CoreVocabularyItem,
} from '@/components/exam/ExamInteractiveText';
import type { ExamDictResult } from '@/lib/exam-dict-cache';
import type { LookupThemeVariant } from './VocabLookupProvider';

export interface ClozeSegment {
  kind: 'text' | 'blank';
  rawToken: string;
  index: number;
  slotKey: string;
}

const CLOZE_TOKEN_RE = /(\{\{[^}]*\}\}|\{[^}]*\}|\[\w+\]|_{3,})/g;

export function splitClozeSegments(text: string): {
  segments: ClozeSegment[];
  plainContextSentence: string;
} {
  const cleanText = stripWatermarkChars(text);
  if (!cleanText) {
    return { segments: [], plainContextSentence: '' };
  }

  const segments: ClozeSegment[] = [];
  CLOZE_TOKEN_RE.lastIndex = 0;
  let lastIndex = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CLOZE_TOKEN_RE.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: 'text',
        rawToken: cleanText.slice(lastIndex, match.index),
        index: -1,
        slotKey: '',
      });
    }

    const rawToken = match[0];
    const slotKey = rawToken
      .replace(/^\{\{|\}\}$/g, '')
      .replace(/^\{|\}$/g, '')
      .replace(/^\[|\]$/g, '')
      .trim();

    segments.push({
      kind: 'blank',
      rawToken,
      index: blankIndex++,
      slotKey,
    });

    lastIndex = CLOZE_TOKEN_RE.lastIndex;
  }

  if (lastIndex < cleanText.length) {
    segments.push({
      kind: 'text',
      rawToken: cleanText.slice(lastIndex),
      index: -1,
      slotKey: '',
    });
  }

  const plainContextSentence = stripWatermarkChars(
    segments.map((s) => (s.kind === 'blank' ? '____' : s.rawToken)).join(''),
  ).trim();

  return { segments, plainContextSentence };
}

export interface InteractiveClozeTextProps {
  text: string;
  enabled?: boolean;
  as?: 'span' | 'p' | 'div';
  className?: string;
  blankClassName?: string;
  renderBlank?: (ctx: { rawToken: string; index: number; slotKey: string }) => React.ReactNode;
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
 * Interactive wrapper for cloze passages/sentences (`{{blank}}`, `{{0}}`, `{slot}`, `_____`).
 * Keeps cloze blanks/inputs isolated and non-clickable while enabling tap-to-lookup on surrounding English words.
 * Never use to wrap Vietnamese explanations (`IT-7.5`) or listening placeholders (`IT-7.8`).
 */
export function InteractiveClozeText({
  text,
  enabled = true,
  as: Component = 'span',
  className = '',
  blankClassName = 'inline-block min-w-10 border-b-2 border-slate-400 dark:border-slate-500 px-1 text-center font-mono text-xs text-slate-500 select-none',
  renderBlank,
  wordClassName = '',
  activeWordClassName = '',
  coreVocabulary,
  themeVariant,
  disableSave,
  onWordClick,
  contextSentence,
}: InteractiveClozeTextProps) {
  const { segments, plainContextSentence } = useMemo(
    () => splitClozeSegments(text),
    [text],
  );

  if (!text) return null;

  const resolvedContext = contextSentence || plainContextSentence;

  return (
    <Component className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === 'blank') {
          if (renderBlank) {
            return (
              <React.Fragment key={`blank-${seg.index}-${i}`}>
                {renderBlank({
                  rawToken: seg.rawToken,
                  index: seg.index,
                  slotKey: seg.slotKey,
                })}
              </React.Fragment>
            );
          }
          return (
            <span key={`blank-${seg.index}-${i}`} className={blankClassName}>
              {seg.rawToken.startsWith('_') ? seg.rawToken : '____'}
            </span>
          );
        }

        const cleanSegment = stripWatermarkChars(seg.rawToken);
        return (
          <ExamInteractiveText
            key={`text-${i}`}
            text={cleanSegment}
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
      })}
    </Component>
  );
}
