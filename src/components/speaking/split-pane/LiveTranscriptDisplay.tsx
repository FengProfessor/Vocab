'use client';

/**
 * LiveTranscriptDisplay Component
 * File: src/components/speaking/split-pane/LiveTranscriptDisplay.tsx
 *
 * Real-time Speech-to-Text Transcript Display:
 * - Clear visual distinction between live interim hypotheses (pulsing italicized text)
 *   and finalized recognized sentences (crisp solid typography).
 * - Real-time Confidence Indicator badge with 3-tier color coding:
 *   >= 85% (Emerald - High), >= 70% (Indigo - Moderate), < 70% (Amber - Low).
 * - Target keyword highlighting in real-time.
 * - Live audio activity indicator ("LIVE SPEECH" with animated pulse).
 * - Accessible empty and error states.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Radio, Sparkles, CheckCircle2 } from 'lucide-react';

export interface LiveTranscriptDisplayProps {
  /** Real-time interim transcript stream from STT */
  interimText?: string;
  /** Final finalized transcript text */
  finalText?: string;
  /** Alternative alias for finalText */
  transcript?: string;
  /** Alternative alias for interimText */
  interimTranscript?: string;
  /** Recognition confidence score (0.0 to 1.0 or 0 to 100) */
  confidence?: number;
  /** True when microphone recognition is actively listening */
  isListening?: boolean;
  /** Alternative alias for isListening */
  isRecording?: boolean;
  /** Target pedagogical keywords to highlight */
  targetKeywords?: string[];
  /** Custom placeholder message when empty */
  placeholder?: string;
  /** Additional container CSS class */
  className?: string;
}

export const LiveTranscriptDisplay: React.FC<LiveTranscriptDisplayProps> = ({
  interimText: interimTextProp,
  finalText: finalTextProp,
  transcript,
  interimTranscript,
  confidence,
  isListening: isListeningProp,
  isRecording,
  targetKeywords = [],
  placeholder,
  className = '',
}) => {
  const effectiveFinalText = (finalTextProp ?? transcript ?? '').trim();
  const effectiveInterimText = (interimTextProp ?? interimTranscript ?? '').trim();
  const isActivelyListening = Boolean(isListeningProp || isRecording);

  const hasAnyText = Boolean(effectiveFinalText || effectiveInterimText);

  // Normalize confidence percentage (0 to 100)
  const normalizedConfidence = useMemo(() => {
    if (confidence === undefined || confidence === null || isNaN(confidence)) {
      return null;
    }
    // If between 0.0 and 1.0, scale to percentage
    const pct = confidence <= 1.0 && confidence > 0 ? confidence * 100 : confidence;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [confidence]);

  // Keyword highlighting parser for finalized text
  const renderedFinalElements = useMemo(() => {
    if (!effectiveFinalText) return null;
    if (!targetKeywords || targetKeywords.length === 0) {
      return <span>{effectiveFinalText}</span>;
    }

    // Build regex to capture any target keywords safely
    const escapedKeywords = targetKeywords
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escapedKeywords.length === 0) {
      return <span>{effectiveFinalText}</span>;
    }

    const regex = new RegExp(`(\\b(?:${escapedKeywords.join('|')})\\b)`, 'gi');
    const segments = effectiveFinalText.split(regex);

    return (
      <span>
        {segments.map((segment, idx) => {
          const isKeywordMatch = targetKeywords.some(
            (k) => k.toLowerCase() === segment.toLowerCase()
          );

          if (isKeywordMatch) {
            return (
              <mark
                key={idx}
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-1 py-0.5 rounded-xs border border-emerald-500/30 select-text"
                title="Từ khóa trọng tâm bài học"
              >
                {segment}
              </mark>
            );
          }

          return <span key={idx}>{segment}</span>;
        })}
      </span>
    );
  }, [effectiveFinalText, targetKeywords]);

  return (
    <div
      role="region"
      aria-label="Bản ghi nhận diện giọng nói thời gian thực"
      aria-live="polite"
      className={cn(
        'w-full flex flex-col gap-3 p-3.5 sm:p-4 rounded-lg border border-border dark:border-slate-800 bg-card shadow-2xs transition-all duration-200',
        isActivelyListening && 'border-primary/60 ring-1 ring-primary/25',
        className
      )}
    >
      {/* 1. Header Bar: Status Indicator & Confidence Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          {isActivelyListening ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-mono font-semibold tracking-wide border border-destructive/20 animate-pulse">
              <span className="size-2 rounded-full bg-destructive shrink-0 animate-ping" />
              <span>LIVE SPEECH</span>
            </div>
          ) : (
            <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-primary" />
              Bản ghi nhận diện (STT)
            </span>
          )}
        </div>

        {/* Confidence Percentage Badge */}
        {normalizedConfidence !== null && normalizedConfidence > 0 && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors',
              normalizedConfidence >= 85
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : normalizedConfidence >= 70
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            )}
            title={`Độ tin cậy của mô hình nhận diện giọng nói: ${normalizedConfidence}%`}
          >
            <span className="text-muted-foreground font-normal">Độ tin cậy:</span>
            <span>{normalizedConfidence}%</span>
          </div>
        )}
      </div>

      {/* 2. Real-Time Transcript Display Area */}
      <div className="min-h-[72px] sm:min-h-[84px] flex items-center justify-center p-2 text-center text-sm sm:text-base leading-relaxed select-text">
        {hasAnyText ? (
          <p className="text-foreground tracking-normal">
            {renderedFinalElements}
            {effectiveFinalText && effectiveInterimText && ' '}
            {effectiveInterimText && (
              <span className="italic text-primary/80 dark:text-primary-foreground/80 font-normal animate-pulse">
                {effectiveInterimText}
              </span>
            )}
          </p>
        ) : (
          <span className="text-xs sm:text-sm text-muted-foreground italic select-none">
            {placeholder ||
              (isActivelyListening
                ? 'Đang nhận tín hiệu âm thanh... Hãy nói tiếng Anh rõ ràng.'
                : 'Chưa có bản ghi âm. Nhấn nút Micro bên dưới để bắt đầu nói.')}
          </span>
        )}
      </div>
    </div>
  );
};

export default LiveTranscriptDisplay;
