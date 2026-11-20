'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { playWordAudio } from '@/lib/audio';
import {
  fetchExamWordDict,
  peekExamWordDict,
  type ExamDictResult,
} from '@/lib/exam-dict-cache';
import {
  useOptionalVocabLookup,
  type LookupThemeVariant,
} from '@/components/vocab/VocabLookupProvider';
import { ExamWordLookupCard } from './ExamWordLookupCard';

export interface CoreVocabularyItem {
  word: string;
  phonetic?: string;
  ipa?: string;
  pos?: string;
  viDefinition?: string;
  definition?: string;
  contextSentence?: string;
  example?: string;
  exampleVi?: string;
  audioUs?: string;
  audioUk?: string;
}

export interface ExamInteractiveTextProps {
  text?: string;
  enabled?: boolean;
  className?: string;
  wordClassName?: string;
  activeWordClassName?: string;
  as?: 'span' | 'p' | 'div';
  inheritClassName?: boolean;
  onWordClick?: (
    word: string,
    cleanWord: string,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  coreVocabulary?: CoreVocabularyItem[] | Record<string, CoreVocabularyItem | ExamDictResult>;
  themeVariant?: LookupThemeVariant;
  disableSave?: boolean;
  contextSentence?: string;
}

interface WordToken {
  id: string;
  raw: string;
  clean: string;
  isWord: boolean;
}

// Zero-width anti-scraping watermark characters injected into VNU/TOEIC/VSTEP texts
export const WATERMARK_ZW_REGEX = /[\u200B\u200C\u200D\uFEFF]/g;

export function stripWatermarkChars(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(WATERMARK_ZW_REGEX, '');
}

// Unicode-aware regex matching word sequences, non-word characters, and whitespace
export const WORD_SPLIT_REGEX =
  /([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*)|([^\p{L}\p{M}\s]+)|(\s+)/gu;

// Strict English word check: only Latin ASCII letters, apostrophes, and hyphens
export const IS_ENGLISH_WORD = /^[a-zA-Z]+(?:['’][a-zA-Z]+)*(?:-[a-zA-Z]+(?:['’][a-zA-Z]+)*)*$/;

const emptySubscribe = () => () => {};

function toCoreExamDictResult(
  item: CoreVocabularyItem | ExamDictResult,
  fallbackWord: string,
): ExamDictResult | undefined {
  if (!item) return undefined;
  const asExam = item as ExamDictResult;
  if (typeof asExam.definition === 'string' && asExam.definition.trim() && Array.isArray(asExam.synonyms)) {
    return { ...asExam, word: fallbackWord, cleanWord: asExam.cleanWord || fallbackWord.toLowerCase() };
  }
  const core = item as CoreVocabularyItem;
  const def = (core.viDefinition || core.definition || '').trim();
  if (!def) return undefined;
  const rawIpa = (core.phonetic || core.ipa || '').trim();
  const ipa = rawIpa ? `/${rawIpa.replace(/^\/+|\/+$/g, '')}/` : '';
  return {
    word: fallbackWord,
    cleanWord: (core.word || fallbackWord).trim().toLowerCase(),
    ipa,
    pos: core.pos || '',
    definition: def,
    synonyms: [],
    antonyms: [],
    ...(core.contextSentence || core.example ? { example: core.contextSentence || core.example } : {}),
    ...(core.exampleVi ? { exampleVi: core.exampleVi } : {}),
    ...(core.audioUs ? { audioUs: core.audioUs } : {}),
    ...(core.audioUk ? { audioUk: core.audioUk } : {}),
  };
}

export function ExamInteractiveText({
  text = '',
  enabled = false,
  className = '',
  wordClassName = '',
  activeWordClassName = '',
  as: Component = 'span',
  inheritClassName = false,
  onWordClick,
  coreVocabulary,
  themeVariant = 'default',
  disableSave = false,
  contextSentence,
}: ExamInteractiveTextProps) {
  const vocabLookup = useOptionalVocabLookup();

  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [dictResult, setDictResult] = useState<ExamDictResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [popoverPos, setPopoverPos] = useState<React.CSSProperties | null>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const containerRef = useRef<HTMLElement | null>(null);
  const setContainerRef = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
  }, []);
  const inFlightWordRef = useRef<string | null>(null);

  const coreMap = useMemo(() => {
    const map = new Map<string, CoreVocabularyItem | ExamDictResult>();
    if (!coreVocabulary) return map;
    if (Array.isArray(coreVocabulary)) {
      for (const item of coreVocabulary) {
        if (item?.word) {
          map.set(item.word.trim().toLowerCase(), item);
        }
      }
    } else if (typeof coreVocabulary === 'object') {
      for (const [k, item] of Object.entries(coreVocabulary)) {
        if (item) {
          map.set(k.trim().toLowerCase(), item);
        }
      }
    }
    return map;
  }, [coreVocabulary]);

  const handleClose = useCallback(() => {
    setActiveWord(null);
    setDictResult(null);
    setPopoverPos(null);
  }, []);

  // Dismiss standalone popover when text changes (e.g. Navigating between questions)
  useEffect(() => {
    if (vocabLookup) return;
    handleClose();
  }, [text, vocabLookup, handleClose]);

  // Standalone fallback listeners (0 listeners attached when VocabLookupProvider is active)
  useEffect(() => {
    if (vocabLookup || !activeWord) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleClose();
      }
    }

    function handleClickOutside(e: MouseEvent | TouchEvent | PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
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

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [vocabLookup, activeWord, handleClose]);

  const cleanText = useMemo(() => stripWatermarkChars(text), [text]);

  // Tokenize the input text while strictly preserving spaces and newlines
  // Hooks MUST execute unconditionally before any early returns to prevent React #300/#310 crashes
  const tokens = useMemo<WordToken[]>(() => {
    if (!cleanText) return [];
    const result: WordToken[] = [];
    const splitRegex = new RegExp(WORD_SPLIT_REGEX.source, WORD_SPLIT_REGEX.flags);
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = splitRegex.exec(cleanText)) !== null) {
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
  }, [cleanText]);

  const calculatePopoverPosition = useCallback((rect: DOMRect): {
    positionStyle: React.CSSProperties;
    placement: 'top' | 'bottom';
  } => {
    const rawVw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const rawVh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const viewportWidth = Number.isFinite(rawVw) && rawVw > 0 ? rawVw : 1024;
    const viewportHeight = Number.isFinite(rawVh) && rawVh > 0 ? rawVh : 768;

    const cardWidth = Math.max(0, Math.min(320, viewportWidth - 24));
    const estimatedCardHeight = 220;

    const safeLeft = Number.isFinite(rect?.left) ? rect.left : viewportWidth / 2;
    const safeWidth = Number.isFinite(rect?.width) && rect.width >= 0 ? rect.width : 0;
    const safeTop = Number.isFinite(rect?.top)
      ? Math.max(0, Math.min(viewportHeight, rect.top))
      : viewportHeight / 2;
    const safeBottom = Number.isFinite(rect?.bottom)
      ? Math.max(safeTop, Math.min(viewportHeight, rect.bottom))
      : safeTop;

    const maxLeft = Math.max(12, viewportWidth - cardWidth - 12);
    let left = safeLeft + safeWidth / 2 - cardWidth / 2;
    if (left < 12) left = 12;
    if (left > maxLeft) left = maxLeft;

    const availableAbove = Math.max(0, safeTop - 20);
    const availableBelow = Math.max(0, viewportHeight - safeBottom - 20);
    const placeTop =
      availableAbove >= estimatedCardHeight ||
      (availableAbove > availableBelow && availableAbove >= 140);

    const maxVerticalOffset = Math.max(12, viewportHeight - 152);
    const vhCap = Math.round(viewportHeight * 0.85);
    const maxAllowedHeight = Math.max(12, viewportHeight - 24);

    let positionStyle: React.CSSProperties;
    let placement: 'top' | 'bottom';

    if (placeTop) {
      const bottom = Math.max(12, Math.min(maxVerticalOffset, Math.round(viewportHeight - safeTop + 8)));
      const maxHeight = Math.min(
        vhCap,
        Math.min(maxAllowedHeight, Math.max(120, viewportHeight - bottom - 12)),
      );
      positionStyle = {
        width: `${cardWidth}px`,
        left: `${Math.round(left)}px`,
        bottom: `${bottom}px`,
        maxHeight: `${maxHeight}px`,
      };
      placement = 'top';
    } else if (availableBelow >= 140) {
      const top = Math.max(12, Math.min(maxVerticalOffset, Math.round(safeBottom + 8)));
      const maxHeight = Math.min(
        vhCap,
        Math.min(maxAllowedHeight, Math.max(120, viewportHeight - top - 12)),
      );
      positionStyle = {
        width: `${cardWidth}px`,
        left: `${Math.round(left)}px`,
        top: `${top}px`,
        maxHeight: `${maxHeight}px`,
      };
      placement = 'bottom';
    } else {
      const maxHeight = Math.min(vhCap, Math.min(maxAllowedHeight, Math.max(120, viewportHeight - 24)));
      positionStyle = {
        width: `${cardWidth}px`,
        left: `${Math.round(left)}px`,
        top: '12px',
        maxHeight: `${maxHeight}px`,
      };
      placement = 'bottom';
    }

    return {
      positionStyle,
      placement,
    };
  }, []);

  // Compute parent phrase if the entire text block is a concise phrase (2-8 words)
  const parentPhrase = useMemo(() => {
    if (!cleanText) return null;
    const trimmed = cleanText.trim().replace(/\s+/g, ' ');
    const words = trimmed.split(' ').filter((w) => /^[a-zA-Z'’-]+$/.test(w));
    if (words.length >= 2 && words.length <= 8) {
      return trimmed;
    }
    return null;
  }, [cleanText]);

  // Handle word click
  const handleWordClick = async (
    e: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>,
    token: WordToken
  ) => {
    e.stopPropagation();
    const clean = token.clean;
    if (!clean) return;

    onWordClick?.(token.raw, clean, e);

    const coreRaw = coreMap.get(clean);
    const coreEntry = coreRaw ? toCoreExamDictResult(coreRaw, token.raw) : undefined;
    const resolvedContext = contextSentence || cleanText || undefined;
    const rect = e.currentTarget.getBoundingClientRect();

    if (vocabLookup) {
      vocabLookup.openLookup({
        word: token.raw,
        anchorRect: rect,
        contextSentence: resolvedContext,
        coreEntry,
        parentPhrase,
        themeVariant,
        disableSave,
      });
      return;
    }

    const { positionStyle, placement: calculatedPlacement } = calculatePopoverPosition(rect);

    setPlacement(calculatedPlacement);
    setPopoverPos(positionStyle);
    setActiveWord(token.raw);
    inFlightWordRef.current = clean;

    // Instant audio pronunciation
    void playWordAudio(token.raw, coreEntry?.audioUs || coreEntry?.audioUk);

    if (coreEntry) {
      setDictResult(coreEntry);
      setIsLoading(false);
      return;
    }

    const syncHit = peekExamWordDict(token.raw);
    if (syncHit) {
      setDictResult(syncHit);
      setIsLoading(false);
      return;
    }

    // Fetch dictionary details
    setIsLoading(true);
    try {
      const res = await fetchExamWordDict(token.raw, { contextSentence: resolvedContext });
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
    const clean = stripWatermarkChars(phrase).trim().toLowerCase();
    if (!clean) return;

    setActiveWord(phrase);
    inFlightWordRef.current = clean;

    void playWordAudio(phrase);
    setIsLoading(true);
    try {
      const res = await fetchExamWordDict(phrase, {
        contextSentence: contextSentence || cleanText || undefined,
      });
      if (inFlightWordRef.current === clean) {
        setDictResult(res);
      }
    } finally {
      if (inFlightWordRef.current === clean) {
        setIsLoading(false);
      }
    }
  }, [contextSentence, cleanText]);

  // Handle multi-word phrase selection (Collocation / Idiom lookup on mouse up or touch end)
  const handleSelectionLookup = useCallback(() => {
    if (typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Ensure selection is anchored inside this interactive container
    if (!containerRef.current) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !containerRef.current.contains(anchorNode)) return;

    const selectedText = stripWatermarkChars(selection.toString()).trim().replace(/\s+/g, ' ');
    const wordCount = selectedText.split(' ').length;

    // Support phrases from 2 to 8 words
    if (wordCount >= 2 && wordCount <= 8 && /^[a-zA-Z\s'’-]+$/.test(selectedText)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const resolvedContext = contextSentence || cleanText || undefined;

      if (vocabLookup) {
        vocabLookup.openLookup({
          word: selectedText,
          anchorRect: rect,
          contextSentence: resolvedContext,
          parentPhrase,
          themeVariant,
          disableSave,
        });
        return;
      }

      const { positionStyle, placement: calculatedPlacement } = calculatePopoverPosition(rect);

      setPlacement(calculatedPlacement);
      setPopoverPos(positionStyle);
      setActiveWord(selectedText);
      inFlightWordRef.current = selectedText.toLowerCase();

      // Audio & lookup for the phrase
      void playWordAudio(selectedText);
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
  }, [
    vocabLookup,
    calculatePopoverPosition,
    contextSentence,
    cleanText,
    parentPhrase,
    themeVariant,
    disableSave,
  ]);

  // If not enabled or empty text, render plain text with zero overhead AFTER all hooks have executed
  if (!enabled || !text) {
    return <Component className={className}>{cleanText || text}</Component>;
  }

  const defaultWordClasses = inheritClassName
    ? 'hover:bg-indigo-500/15 underline decoration-current/35 hover:decoration-current underline-offset-3'
    : 'hover:bg-indigo-100 hover:text-indigo-950 dark:hover:bg-indigo-950/80 dark:hover:text-indigo-200 underline decoration-indigo-300/60 hover:decoration-indigo-500 underline-offset-3';

  return (
    <Component
      ref={setContainerRef}
      className={`${Component === 'span' ? 'inline' : 'block'} select-text ${cleanText.includes('\n') ? 'whitespace-pre-wrap' : ''} leading-relaxed ${className}`}
      onMouseUp={handleSelectionLookup}
      onTouchEnd={handleSelectionLookup}
    >
      {tokens.map((token) => {
        if (!token.isWord) {
          return <span key={token.id}>{token.raw}</span>;
        }

        const isCurrentlyActive = vocabLookup
          ? vocabLookup.isOpen && vocabLookup.activeWord?.toLowerCase() === token.clean
          : activeWord?.toLowerCase() === token.clean;

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
                e.stopPropagation();
                handleWordClick(e, token);
              }
            }}
            className={`exam-lookup-trigger inline-block rounded-xs px-0.5 transition-colors cursor-pointer outline-hidden select-text ${
              isCurrentlyActive
                ? (activeWordClassName || 'bg-indigo-600 text-white dark:bg-indigo-500 font-semibold')
                : (wordClassName || defaultWordClasses)
            }`}
            title="Nhấn để tra nghĩa & nghe phát âm"
          >
            {token.raw}
          </span>
        );
      })}

      {!vocabLookup && mounted && activeWord && popoverPos && typeof document !== 'undefined' &&
        createPortal(
          <ExamWordLookupCard
            key={activeWord || 'lookup-card'}
            dictResult={dictResult}
            isLoading={isLoading}
            onClose={handleClose}
            positionStyle={popoverPos}
            placement={placement}
            parentPhrase={parentPhrase}
            onLookupPhrase={handleLookupPhrase}
            themeVariant={themeVariant}
            disableSave={disableSave}
            contextSentence={contextSentence || cleanText || undefined}
          />,
          document.body
        )
      }
    </Component>
  );
}
