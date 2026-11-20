'use client';

import React from 'react';
import {
  InteractiveFormattedText,
  type InteractiveFormattedTextProps,
} from '@/components/vocab/InteractiveFormattedText';
import type { LookupThemeVariant } from '@/components/vocab/VocabLookupProvider';

/**
 * Matches Vietnamese-specific diacritic characters while intentionally excluding
 * French `é` (e.g. `café`) so English loanwords remain lookup-interactive (`IT-7.5`).
 */
export const VIETNAMESE_DIACRITICS_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export function hasVietnameseDiacritics(s?: string | null): boolean {
  return Boolean(s && VIETNAMESE_DIACRITICS_REGEX.test(s));
}

export function isTrueFalseVi(text?: string | null): boolean {
  return Boolean(text && /^(?:[A-D]\.\s*)?(Đúng|Sai)$/i.test(text.trim()));
}

/**
 * Splits a trailing parenthetical Vietnamese note (e.g. `I cut my hair (nhờ thợ).`)
 * so the English prefix can be interactive while the Vietnamese tail stays plain (`IT-7.5`).
 */
export function splitTrailingVietnameseParenthetical(
  text?: string | null,
): { main: string; viTail: string } | null {
  if (!text) return null;
  const match = text.match(/^(.*?)(\s*\([^)]+\)\.?)$/);
  if (!match) return null;
  const [, main, viTail] = match;
  if (!main.trim() || !hasVietnameseDiacritics(viTail)) return null;
  return { main, viTail };
}

export interface FormattedTextProps {
  text?: string | null;
  className?: string;
  interactive?: boolean;
  themeVariant?: LookupThemeVariant;
  contextSentence?: string;
  interactiveCode?: boolean;
  onWordClick?: InteractiveFormattedTextProps['onWordClick'];
}

/**
 * Renders inline markdown (**bold**, *italic*, `code`) into clean React elements.
 * Defaults to `interactive={false}` so Vietnamese theory/feedback callers stay
 * non-interactive (`IT-7.5`); English callers opt in via `interactive`.
 */
export default function FormattedText({
  text,
  className = '',
  interactive = false,
  themeVariant = 'minimalist',
  contextSentence,
  interactiveCode = true,
  onWordClick,
}: FormattedTextProps) {
  return (
    <InteractiveFormattedText
      text={text}
      className={className}
      enabled={interactive}
      themeVariant={themeVariant}
      contextSentence={contextSentence}
      interactiveCode={interactiveCode}
      onWordClick={onWordClick}
    />
  );
}
