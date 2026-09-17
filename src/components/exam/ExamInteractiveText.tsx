'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { playWordAudio } from '@/lib/audio';
import {
  fetchExamWordDict,
  type ExamDictResult,
} from '@/lib/exam-dict-cache';
import { ExamWordLookupCard } from './ExamWordLookupCard';

export interface ExamInteractiveTextProps {
  text?: string;
  enabled?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'div';
}

interface WordToken {
  id: string;
  raw: string;
  clean: string;
  isWord: boolean;
}

// Unicode-aware regex matching word sequences, non-word characters, and whitespace
export const WORD_SPLIT_REGEX =
  /([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+)*)|([^\p{L}\p{M}\s]+)|(\s+)/gu;

// Strict English word check: only Latin ASCII letters, apostrophes, and hyphens
export const IS_ENGLISH_WORD = /^[a-zA-Z]+(?:['’][a-zA-Z]+)*(?:-[a-zA-Z]+)*$/;

export function ExamInteractiveText({
  text = '',
  enabled = false,
  className = '',
  as: Component = 'span',
}: ExamInteractiveTextProps) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [dictResult, setDictResult] = useState<ExamDictResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popoverPos, setPopoverPos] = useState<React.CSSProperties | null>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [mounted, setMounted] = useState<boolean>(false);

  const containerRef = useRef<HTMLElement>(null);
  const inFlightWordRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    setActiveWord(null);
    setDictResult(null);
    setPopoverPos(null);
  }, []);

  // Dismiss popover when text changes (e.g. Navigating between questions)
  useEffect(() => {
    handleClose();
  }, [text, handleClose]);

  // Close on Escape, click outside, or scroll (mouse, touch & pointer events)
  useEffect(() => {
    if (!activeWord) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    function handleClickOutside(e: MouseEvent | TouchEvent | PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest('[role="dialog"]') ||
        target.closest('.exam-lookup-card') ||
        target.closest('.exam-lookup-trigger')
      ) {
        return;
      }
      handleClose();
    }

    function handleScroll(e: Event) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.('.exam-lookup-card')) {
        return;
      }
      handleClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [activeWord, handleClose]);

  // Tokenize the input text while strictly preserving spaces and newlines
  // Hooks MUST execute unconditionally before any early returns to prevent React #300/#310 crashes
  const tokens = useMemo<WordToken[]>(() => {
    if (!text) return [];
    const result: WordToken[] = [];
    WORD_SPLIT_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = WORD_SPLIT_REGEX.exec(text)) !== null) {
      const [, wordMatch, punctMatch, spaceMatch] = match;

      if (wordMatch) {
        const isEnglish = IS_ENGLISH_WORD.test(wordMatch);
        result.push({
          id: `w-${idx++}-${wordMatch.toLowerCase()}`,
          raw: wordMatch,
          clean: isEnglish ? wordMatch.replace(/[’]/g, "'").toLowerCase() : '',
          isWord: isEnglish,
        });
      } else if (punctMatch) {
        result.push({
          id: `p-${idx++}`,
          raw: punctMatch,
          clean: '',
          isWord: false,
        });
      } else if (spaceMatch) {
        result.push({
          id: `s-${idx++}`,
          raw: spaceMatch,
          clean: '',
          isWord: false,
        });
      }
    }

    return result;
  }, [text]);

  const calculatePopoverPosition = useCallback((rect: DOMRect): {
    positionStyle: React.CSSProperties;
    placement: 'top' | 'bottom';
  } => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Card dimensions
    const cardWidth = Math.min(320, viewportWidth - 24);
    const estimatedCardHeight = 220;

    // Position horizontally centered on word/selection, clamped to screen margins
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    if (left < 12) left = 12;
    if (left + cardWidth > viewportWidth - 12) {
      left = viewportWidth - cardWidth - 12;
    }

    // Determine vertical placement: prefer top if space allows; otherwise place below
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const placeTop = spaceAbove >= estimatedCardHeight + 16 || spaceAbove > spaceBelow;

    // Anchor using bottom when placing above to prevent dynamic content height overlap;
    // Anchor using top when placing below
    const positionStyle: React.CSSProperties = {
      width: `${cardWidth}px`,
      left: `${Math.round(left)}px`,
      ...(placeTop
        ? { bottom: `${Math.max(12, Math.round(viewportHeight - rect.top + 8))}px` }
        : { top: `${Math.min(viewportHeight - 160, Math.round(rect.bottom + 8))}px` }),
    };

    return {
      positionStyle,
      placement: placeTop ? 'top' : 'bottom',
    };
  }, []);

  // Compute parent phrase if the entire text block is a concise phrase (2-8 words)
  const parentPhrase = useMemo(() => {
    if (!text) return null;
    const trimmed = text.trim().replace(/\s+/g, ' ');
    const words = trimmed.split(' ').filter((w) => /^[a-zA-Z'’-]+$/.test(w));
    if (words.length >= 2 && words.length <= 8) {
      return trimmed;
    }
    return null;
  }, [text]);

  // Handle word click
  const handleWordClick = async (
    e: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>,
    token: WordToken
  ) => {
    e.stopPropagation();
    const clean = token.clean;
    if (!clean) return;

    const targetEl = e.currentTarget;
    const rect = targetEl.getBoundingClientRect();
    const { positionStyle, placement: calculatedPlacement } = calculatePopoverPosition(rect);

    setPlacement(calculatedPlacement);
    setPopoverPos(positionStyle);
    setActiveWord(token.raw);
    inFlightWordRef.current = clean;

    // Instant audio pronunciation
    playWordAudio(token.raw);

    // Fetch dictionary details
    setIsLoading(true);
    try {
      const res = await fetchExamWordDict(token.raw);
      if (inFlightWordRef.current === clean) {
        setDictResult(res);
      }
    } finally {
      if (inFlightWordRef.current === clean) {
        setIsLoading(false);
      }
    }
  };

  // Handle looking up an explicit phrase or suggested correction
  const handleLookupPhrase = useCallback(async (phrase: string) => {
    const clean = phrase.trim().toLowerCase();
    if (!clean) return;

    setActiveWord(phrase);
    inFlightWordRef.current = clean;

    playWordAudio(phrase);
    setIsLoading(true);
    try {
      const res = await fetchExamWordDict(phrase);
      if (inFlightWordRef.current === clean) {
        setDictResult(res);
      }
    } finally {
      if (inFlightWordRef.current === clean) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle multi-word phrase selection (Collocation / Idiom lookup on mouse up or touch end)
  const handleSelectionLookup = useCallback(() => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Ensure selection is anchored inside this interactive container
    if (!containerRef.current) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !containerRef.current.contains(anchorNode)) return;

    const selectedText = selection.toString().trim().replace(/\s+/g, ' ');
    const wordCount = selectedText.split(' ').length;

    // Support phrases from 2 to 8 words
    if (wordCount >= 2 && wordCount <= 8 && /^[a-zA-Z\s'’-]+$/.test(selectedText)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const { positionStyle, placement: calculatedPlacement } = calculatePopoverPosition(rect);

      setPlacement(calculatedPlacement);
      setPopoverPos(positionStyle);
      setActiveWord(selectedText);
      inFlightWordRef.current = selectedText.toLowerCase();

      // Audio & lookup for the phrase
      playWordAudio(selectedText);
      setIsLoading(true);
      fetchExamWordDict(selectedText)
        .then((res) => {
          if (inFlightWordRef.current === selectedText.toLowerCase()) {
            setDictResult(res);
          }
        })
        .finally(() => {
          if (inFlightWordRef.current === selectedText.toLowerCase()) {
            setIsLoading(false);
          }
        });
    }
  }, [calculatePopoverPosition]);

  // If not enabled or empty text, render plain text with zero overhead AFTER all hooks have executed
  if (!enabled || !text) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component
      ref={containerRef as any}
      className={`${Component === 'span' ? 'inline' : 'block'} ${text.includes('\n') ? 'whitespace-pre-wrap' : ''} leading-relaxed ${className}`}
      onMouseUp={handleSelectionLookup}
      onTouchEnd={handleSelectionLookup}
    >
      {tokens.map((token) => {
        if (!token.isWord) {
          return <span key={token.id}>{token.raw}</span>;
        }

        const isCurrentlyActive = activeWord?.toLowerCase() === token.clean;

        return (
          <span
            key={token.id}
            role="button"
            tabIndex={0}
            onClick={(e) => handleWordClick(e, token)}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleWordClick(e, token);
              }
            }}
            className={`exam-lookup-trigger inline-block rounded-xs px-0.5 transition-colors cursor-pointer outline-hidden select-text ${
              isCurrentlyActive
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 font-semibold'
                : 'hover:bg-indigo-100 hover:text-indigo-950 dark:hover:bg-indigo-950/80 dark:hover:text-indigo-200 underline decoration-indigo-300/60 hover:decoration-indigo-500 underline-offset-3'
            }`}
            title="Nhấn để tra nghĩa & nghe phát âm"
          >
            {token.raw}
          </span>
        );
      })}

      {mounted && activeWord && popoverPos && typeof document !== 'undefined' &&
        createPortal(
          <ExamWordLookupCard
            dictResult={dictResult}
            isLoading={isLoading}
            onClose={handleClose}
            positionStyle={popoverPos}
            placement={placement}
            parentPhrase={parentPhrase}
            onLookupPhrase={handleLookupPhrase}
          />,
          document.body
        )
      }
    </Component>
  );
}
