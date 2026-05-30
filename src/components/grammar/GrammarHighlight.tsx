'use client';

import React from 'react';

export type GrammarRole =
  // Part-of-speech (POS) chuẩn — schema mới
  | 'noun'
  | 'pronoun'
  | 'verb'
  | 'auxiliary'
  | 'modal'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'determiner'
  | 'article'
  | 'interjection'
  // Backward-compat: nhãn chức năng cú pháp từ cache DB cũ
  | 'subject'
  | 'object'
  | 'other';

export interface WordAnnotation {
  word: string;
  role: GrammarRole;
  start: number;
  end: number;
}

interface GrammarHighlightProps {
  sentence: string;
  annotations: WordAnnotation[];
  loading?: boolean;
  showLegend?: boolean;
}

interface RoleConfig {
  bg: string;
  text: string;
  label: string;
  dotColor: string; // CSS color string, dùng inline style để tránh Tailwind purge
  showInLegend: boolean;
}

const ROLE_CONFIG: Record<GrammarRole, RoleConfig> = {
  // ─── POS mới ───
  noun:        { bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Danh từ',     dotColor: '#60a5fa', showInLegend: true },
  pronoun:     { bg: 'bg-sky-100',     text: 'text-sky-800',     label: 'Đại từ',      dotColor: '#38bdf8', showInLegend: true },
  verb:        { bg: 'bg-red-100',     text: 'text-red-800',     label: 'Động từ',     dotColor: '#f87171', showInLegend: true },
  auxiliary:   { bg: 'bg-rose-100',    text: 'text-rose-800',    label: 'Trợ động từ', dotColor: '#fb7185', showInLegend: true },
  modal:       { bg: 'bg-orange-100',  text: 'text-orange-800',  label: 'Khuyết thiếu', dotColor: '#fb923c', showInLegend: true },
  adjective:   { bg: 'bg-purple-100',  text: 'text-purple-800',  label: 'Tính từ',     dotColor: '#c084fc', showInLegend: true },
  adverb:      { bg: 'bg-amber-100',   text: 'text-amber-800',   label: 'Trạng từ',    dotColor: '#fbbf24', showInLegend: true },
  preposition: { bg: 'bg-teal-100',    text: 'text-teal-800',    label: 'Giới từ',     dotColor: '#2dd4bf', showInLegend: true },
  conjunction: { bg: 'bg-pink-100',    text: 'text-pink-800',    label: 'Liên từ',     dotColor: '#f472b6', showInLegend: true },
  determiner:  { bg: 'bg-indigo-100',  text: 'text-indigo-800',  label: 'Hạn định từ', dotColor: '#818cf8', showInLegend: true },
  article:     { bg: '',               text: 'text-gray-400',    label: 'Mạo từ',      dotColor: '#9ca3af', showInLegend: false },
  interjection:{ bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'Thán từ',     dotColor: '#facc15', showInLegend: true },
  // ─── Backward-compat: nhãn chức năng cú pháp cũ ───
  subject:     { bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Chủ ngữ',     dotColor: '#60a5fa', showInLegend: true },
  object:      { bg: 'bg-green-100',   text: 'text-green-800',   label: 'Tân ngữ',     dotColor: '#34d399', showInLegend: true },
  other:       { bg: '',               text: '',                 label: '',             dotColor: '',        showInLegend: false },
};

// Fallback inline styles for article (no bg, gray text)
const ROLE_INLINE_STYLE: Partial<Record<GrammarRole, React.CSSProperties>> = {
  article: { color: '#9ca3af' },
};

export default function GrammarHighlight({
  sentence,
  annotations,
  loading = false,
  showLegend = true,
}: GrammarHighlightProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  // Sort annotations by start index
  const sorted = [...annotations].sort((a, b) => a.start - b.start);

  // Build segments: interleave plain text and annotated spans
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((ann, idx) => {
    // Plain text before this annotation
    if (ann.start > cursor) {
      segments.push(
        <span key={`plain-${idx}`}>{sentence.slice(cursor, ann.start)}</span>
      );
    }

    const config = ROLE_CONFIG[ann.role];
    const hasStyle = ann.role !== 'other';

    if (hasStyle && (config.bg || config.text)) {
      const cls = [
        config.bg,
        config.text,
        'rounded',
        'px-0.5',
        'font-medium',
      ]
        .filter(Boolean)
        .join(' ');

      segments.push(
        <span
          key={`ann-${idx}`}
          className={cls}
          style={ROLE_INLINE_STYLE[ann.role]}
          title={config.label}
        >
          {sentence.slice(ann.start, ann.end)}
        </span>
      );
    } else {
      // 'other' role or no styling
      segments.push(
        <span key={`ann-${idx}`}>{sentence.slice(ann.start, ann.end)}</span>
      );
    }

    cursor = ann.end;
  });

  // Remaining plain text after last annotation
  if (cursor < sentence.length) {
    segments.push(<span key="plain-tail">{sentence.slice(cursor)}</span>);
  }

  // Determine which roles appear in legend
  const legendRoles = Array.from(
    new Set(annotations.map((a) => a.role))
  ).filter((role) => ROLE_CONFIG[role].showInLegend);

  const hasLegend = showLegend && legendRoles.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{segments}</p>

      {hasLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 opacity-70">
          {legendRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            return (
              <span key={role} className="flex items-center gap-1 text-xs">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.dotColor }}
                  aria-hidden="true"
                />
                <span className={config.text}>{config.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
