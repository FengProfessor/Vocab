'use client';

import React, { useMemo } from 'react';
import {
  ExamInteractiveText,
  stripWatermarkChars,
  type CoreVocabularyItem,
} from '@/components/exam/ExamInteractiveText';
import type { ExamDictResult } from '@/lib/exam-dict-cache';
import type { LookupThemeVariant } from './VocabLookupProvider';

export interface FormattedSegment {
  kind: 'bold_italic' | 'bold' | 'italic' | 'code' | 'mark' | 'text';
  text: string;
  children?: FormattedSegment[];
}

const TOP_BLOCK_RE = /(`[^`\n]+?`|<mark(?:\s+[^>]*)?>[\s\S]*?<\/mark>)/gi;
const INLINE_CODE_RE = /(`[^`\n]+?`)/g;

interface InlineTokenText {
  type: 'text';
  text: string;
}

interface InlineTokenStars {
  type: 'stars';
  remaining: number;
  canOpen: boolean;
  canClose: boolean;
}

type InlineToken = InlineTokenText | InlineTokenStars;

interface EmphasisPair {
  oIdx: number;
  cIdx: number;
  style: 'bold' | 'italic';
}

function mergeSegments(rawSegments: FormattedSegment[]): FormattedSegment[] {
  const merged: FormattedSegment[] = [];
  for (const seg of rawSegments) {
    if (!seg.text) continue;
    const prev = merged[merged.length - 1];
    if (prev && prev.kind === seg.kind && !prev.children && !seg.children) {
      prev.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

function parseInlineLine(line: string): FormattedSegment[] {
  if (!line) return [];

  const tokens: InlineToken[] = [];
  let i = 0;
  let textStart = 0;

  while (i < line.length) {
    if (line[i] === '*') {
      if (i > textStart) {
        tokens.push({ type: 'text', text: line.slice(textStart, i) });
      }
      let j = i;
      while (j < line.length && line[j] === '*') {
        j++;
      }
      const prevChar = i > 0 ? line[i - 1] : '';
      const nextChar = j < line.length ? line[j] : '';
      tokens.push({
        type: 'stars',
        remaining: j - i,
        canOpen: nextChar !== '' && !/\s/.test(nextChar),
        canClose: prevChar !== '' && !/\s/.test(prevChar),
      });
      i = j;
      textStart = j;
    } else {
      i++;
    }
  }

  if (textStart < line.length) {
    tokens.push({ type: 'text', text: line.slice(textStart) });
  }

  const openers: number[] = [];
  const pairs: EmphasisPair[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    if (tok.type !== 'stars') continue;

    if (tok.canClose) {
      while (tok.remaining > 0) {
        let matchPos = -1;
        for (let k = openers.length - 1; k >= 0; k--) {
          const opener = tokens[openers[k]] as InlineTokenStars;
          if (opener.remaining > 0) {
            matchPos = k;
            break;
          }
        }
        if (matchPos === -1) break;

        const oIdx = openers[matchPos];
        const opener = tokens[oIdx] as InlineTokenStars;
        const use = opener.remaining >= 2 && tok.remaining >= 2 ? 2 : 1;
        pairs.push({
          oIdx,
          cIdx: idx,
          style: use === 2 ? 'bold' : 'italic',
        });
        opener.remaining -= use;
        tok.remaining -= use;
        openers.length = opener.remaining > 0 ? matchPos + 1 : matchPos;
      }
    }

    if (tok.canOpen && tok.remaining > 0) {
      openers.push(idx);
    }
  }

  const out: FormattedSegment[] = [];
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (tok.type !== 'text') continue;

    let hasBold = false;
    let hasItalic = false;
    for (const p of pairs) {
      if (p.oIdx < t && t < p.cIdx) {
        if (p.style === 'bold') hasBold = true;
        else hasItalic = true;
      }
    }

    const kind: FormattedSegment['kind'] =
      hasBold && hasItalic
        ? 'bold_italic'
        : hasBold
          ? 'bold'
          : hasItalic
            ? 'italic'
            : 'text';

    out.push({ kind, text: tok.text });
  }

  return mergeSegments(out);
}

function parseInlineMultiline(chunk: string): FormattedSegment[] {
  if (!chunk) return [];
  const lineParts = chunk.split(/(\n)/);
  const out: FormattedSegment[] = [];
  for (const part of lineParts) {
    if (!part) continue;
    if (part === '\n') {
      out.push({ kind: 'text', text: '\n' });
    } else {
      out.push(...parseInlineLine(part));
    }
  }
  return mergeSegments(out);
}

function parseInlineWithCode(input: string): FormattedSegment[] {
  if (!input) return [];
  const rawTokens = input.split(INLINE_CODE_RE);
  const segments: FormattedSegment[] = [];

  for (const token of rawTokens) {
    if (!token) continue;
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const inner = token.slice(1, -1);
      if (inner) segments.push({ kind: 'code', text: inner });
      continue;
    }
    segments.push(...parseInlineMultiline(token));
  }

  return mergeSegments(segments);
}

function parseBlocks(input: string): FormattedSegment[] {
  if (!input) return [];
  const rawTokens = input.split(TOP_BLOCK_RE);
  const segments: FormattedSegment[] = [];

  for (const token of rawTokens) {
    if (!token) continue;

    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const inner = token.slice(1, -1);
      if (inner) segments.push({ kind: 'code', text: inner });
      continue;
    }

    if (/^<mark(?:\s+[^>]*)?>[\s\S]*<\/mark>$/i.test(token)) {
      const inner = token.replace(/^<mark(?:\s+[^>]*)?>/i, '').replace(/<\/mark>$/i, '');
      const children = parseInlineWithCode(inner);
      const plainInner = children.map((c) => c.text).join('');
      if (plainInner) {
        segments.push({ kind: 'mark', text: plainInner, children });
      }
      continue;
    }

    segments.push(...parseInlineWithCode(token));
  }

  return mergeSegments(segments);
}

export function parseFormattedSegments(rawInput: string): {
  segments: FormattedSegment[];
  plainSentence: string;
} {
  const sanitized = stripWatermarkChars(rawInput);
  if (!sanitized.trim()) {
    return { segments: [], plainSentence: '' };
  }

  // Normalize markdown bullets (* / •) identical to FormattedText
  const preprocessed = sanitized
    .replace(/(^|\n)\s*[*•]\s+/g, '$1• ')
    .replace(/\s+[*•]\s+/g, ' • ');

  const segments = parseBlocks(preprocessed);
  const plainSentence = segments.map((s) => s.text).join('');
  return { segments, plainSentence };
}

export interface InteractiveFormattedTextProps {
  text?: string | null;
  enabled?: boolean;
  className?: string;
  boldAsMark?: boolean;
  markClassName?: string;
  boldClassName?: string;
  italicClassName?: string;
  codeClassName?: string;
  interactiveCode?: boolean;
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
 * Format-preserving interactive text wrapper for inline markdown (**bold**, *italic*, `code`, <mark>).
 * Preserves exact typography while enabling tap-to-lookup via ExamInteractiveText on English words.
 */
export function InteractiveFormattedText({
  text,
  enabled = true,
  className = '',
  boldAsMark = false,
  markClassName = 'bg-amber-200/70 dark:bg-amber-500/25 text-inherit px-0.5 rounded-xs',
  boldClassName = 'font-semibold text-foreground',
  italicClassName = 'italic text-foreground/90',
  codeClassName = 'font-mono text-[11px] px-1 py-0.5 bg-muted/60 border border-border/60 rounded-none',
  interactiveCode = true,
  wordClassName = '',
  activeWordClassName = '',
  coreVocabulary,
  themeVariant,
  disableSave,
  onWordClick,
  contextSentence,
}: InteractiveFormattedTextProps) {
  const rawStr = text === null || text === undefined ? '' : typeof text === 'string' ? text : String(text);

  const { segments, plainSentence } = useMemo(
    () => parseFormattedSegments(rawStr),
    [rawStr],
  );

  if (!rawStr.trim() || segments.length === 0) {
    return null;
  }

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

  const renderSegments = (segs: FormattedSegment[]): React.ReactNode =>
    segs.map((seg, i) => {
      if (seg.kind === 'bold_italic') {
        return (
          <strong key={i} className={`font-semibold italic text-foreground ${boldClassName}`}>
            {renderInteractive(seg.text)}
          </strong>
        );
      }

      if (seg.kind === 'bold') {
        if (boldAsMark) {
          return (
            <mark key={i} className={markClassName}>
              {renderInteractive(seg.text)}
            </mark>
          );
        }
        return (
          <strong key={i} className={boldClassName}>
            {renderInteractive(seg.text)}
          </strong>
        );
      }

      if (seg.kind === 'italic') {
        return (
          <em key={i} className={italicClassName}>
            {renderInteractive(seg.text)}
          </em>
        );
      }

      if (seg.kind === 'mark') {
        return (
          <mark key={i} className={markClassName}>
            {seg.children && seg.children.length > 0
              ? renderSegments(seg.children)
              : renderInteractive(seg.text)}
          </mark>
        );
      }

      if (seg.kind === 'code') {
        return (
          <code key={i} className={codeClassName}>
            {interactiveCode ? renderInteractive(seg.text) : seg.text}
          </code>
        );
      }

      return <React.Fragment key={i}>{renderInteractive(seg.text)}</React.Fragment>;
    });

  return (
    <span className={`whitespace-pre-line break-words ${className}`}>
      {renderSegments(segments)}
    </span>
  );
}
