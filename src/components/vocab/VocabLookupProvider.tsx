'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { playWordAudio } from '@/lib/audio';
import {
  fetchExamWordDict,
  peekExamWordDict,
  type ExamWordDictResult,
} from '@/lib/exam-dict-cache';
import { ExamWordLookupCard } from '@/components/exam/ExamWordLookupCard';

export type LookupThemeVariant = 'default' | 'minimalist' | 'dark';

export type LookupAnchorRect = Pick<
  DOMRect,
  'top' | 'bottom' | 'left' | 'right' | 'width' | 'height'
>;

export interface OpenLookupOptions {
  word: string;
  anchorRect: LookupAnchorRect;
  contextSentence?: string;
  coreEntry?: ExamWordDictResult;
  parentPhrase?: string | null;
  themeVariant?: LookupThemeVariant;
  disableSave?: boolean;
  onWordAction?: (word: string) => void;
  onClose?: () => void;
}

export interface VocabLookupContextValue {
  activeWord: string | null;
  isOpen: boolean;
  openLookup: (opts: OpenLookupOptions) => void;
  closeLookup: () => void;
}

interface LookupCardState {
  isOpen: boolean;
  activeWord: string | null;
  dictResult: ExamWordDictResult | null;
  isLoading: boolean;
  positionStyle: React.CSSProperties | null;
  placement: 'top' | 'bottom';
  parentPhrase: string | null;
  contextSentence?: string;
  themeVariant: LookupThemeVariant;
  disableSave: boolean;
}

const INITIAL_STATE: LookupCardState = {
  isOpen: false,
  activeWord: null,
  dictResult: null,
  isLoading: false,
  positionStyle: null,
  placement: 'top',
  parentPhrase: null,
  contextSentence: undefined,
  themeVariant: 'default',
  disableSave: false,
};

const WATERMARK_RE = /[\u200B\u200C\u200D\uFEFF]/g;

function stripWatermarks(raw: string): string {
  return raw.replace(WATERMARK_RE, '');
}

export function calculateLookupPopoverPosition(rect: LookupAnchorRect): {
  positionStyle: React.CSSProperties;
  placement: 'top' | 'bottom';
} {
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
}

const VocabLookupContext = createContext<VocabLookupContextValue | null>(null);

const emptySubscribe = () => () => {};

export function VocabLookupProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [state, setState] = useState<LookupCardState>(INITIAL_STATE);

  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onCloseCallbackRef = useRef<(() => void) | undefined>(undefined);
  const contextSentenceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const closeLookup = useCallback(() => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    contextSentenceRef.current = undefined;
    const cb = onCloseCallbackRef.current;
    onCloseCallbackRef.current = undefined;
    setState(INITIAL_STATE);
    cb?.();
  }, []);

  const openLookup = useCallback((opts: OpenLookupOptions) => {
    const cleanWord = stripWatermarks(opts.word).trim();
    if (!cleanWord) return;

    const cleanParentPhrase = opts.parentPhrase ? stripWatermarks(opts.parentPhrase).trim() : null;
    const cleanContext = opts.contextSentence ? stripWatermarks(opts.contextSentence).trim() : undefined;

    requestIdRef.current += 1;
    const myReqId = requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    onCloseCallbackRef.current = opts.onClose;
    contextSentenceRef.current = cleanContext;

    const { positionStyle, placement } = calculateLookupPopoverPosition(opts.anchorRect);

    opts.onWordAction?.(cleanWord);
    void playWordAudio(
      opts.coreEntry?.word || cleanWord,
      opts.coreEntry?.audioUs || opts.coreEntry?.audioUk,
    );

    if (opts.coreEntry) {
      setState({
        isOpen: true,
        activeWord: cleanWord,
        dictResult: opts.coreEntry,
        isLoading: false,
        positionStyle,
        placement,
        parentPhrase: cleanParentPhrase,
        contextSentence: cleanContext,
        themeVariant: opts.themeVariant ?? 'default',
        disableSave: Boolean(opts.disableSave),
      });
      return;
    }

    const syncHit = peekExamWordDict(cleanWord);
    if (syncHit) {
      setState({
        isOpen: true,
        activeWord: cleanWord,
        dictResult: syncHit,
        isLoading: false,
        positionStyle,
        placement,
        parentPhrase: cleanParentPhrase,
        contextSentence: cleanContext,
        themeVariant: opts.themeVariant ?? 'default',
        disableSave: Boolean(opts.disableSave),
      });
      return;
    }

    setState({
      isOpen: true,
      activeWord: cleanWord,
      dictResult: null,
      isLoading: true,
      positionStyle,
      placement,
      parentPhrase: cleanParentPhrase,
      contextSentence: cleanContext,
      themeVariant: opts.themeVariant ?? 'default',
      disableSave: Boolean(opts.disableSave),
    });

    void fetchExamWordDict(cleanWord, {
      signal: controller.signal,
      contextSentence: cleanContext,
    })
      .then((res) => {
        if (requestIdRef.current !== myReqId) return;
        setState((prev) => ({
          ...prev,
          dictResult: res,
          isLoading: false,
        }));
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
          return;
        }
        if (requestIdRef.current !== myReqId) return;
        setState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  const handleLookupPhrase = useCallback((phrase: string) => {
    const cleanPhrase = stripWatermarks(phrase).trim();
    if (!cleanPhrase) return;

    requestIdRef.current += 1;
    const myReqId = requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    void playWordAudio(cleanPhrase);

    const syncHit = peekExamWordDict(cleanPhrase);
    if (syncHit) {
      setState((prev) => ({
        ...prev,
        activeWord: cleanPhrase,
        dictResult: syncHit,
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      activeWord: cleanPhrase,
      isLoading: true,
    }));

    void fetchExamWordDict(cleanPhrase, {
      signal: controller.signal,
      contextSentence: contextSentenceRef.current,
    })
      .then((res) => {
        if (requestIdRef.current !== myReqId) return;
        setState((prev) => ({
          ...prev,
          dictResult: res,
          isLoading: false,
        }));
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError') {
          return;
        }
        if (requestIdRef.current !== myReqId) return;
        setState((prev) => ({ ...prev, isLoading: false }));
      });
  }, []);

  // O(1) Global Dismissal Listeners — attached ONLY while a lookup card is open
  useEffect(() => {
    if (!state.isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeLookup();
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
      closeLookup();
    }

    function handleScroll(e: Event) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest?.('.exam-lookup-card')) {
        return;
      }
      closeLookup();
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
  }, [state.isOpen, closeLookup]);

  const value = useMemo<VocabLookupContextValue>(
    () => ({
      activeWord: state.activeWord,
      isOpen: state.isOpen,
      openLookup,
      closeLookup,
    }),
    [state.activeWord, state.isOpen, openLookup, closeLookup],
  );

  return (
    <VocabLookupContext.Provider value={value}>
      {children}
      {mounted &&
        state.isOpen &&
        state.positionStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <ExamWordLookupCard
            key={state.activeWord || 'lookup-card'}
            dictResult={state.dictResult}
            isLoading={state.isLoading}
            onClose={closeLookup}
            positionStyle={state.positionStyle}
            placement={state.placement}
            className="z-[130]"
            parentPhrase={state.parentPhrase}
            onLookupPhrase={handleLookupPhrase}
            themeVariant={state.themeVariant}
            disableSave={state.disableSave}
            contextSentence={state.contextSentence}
          />,
          document.body,
        )}
    </VocabLookupContext.Provider>
  );
}

export function useOptionalVocabLookup(): VocabLookupContextValue | null {
  return useContext(VocabLookupContext);
}

export function useVocabLookup(): VocabLookupContextValue {
  const ctx = useContext(VocabLookupContext);
  if (!ctx) {
    throw new Error('useVocabLookup must be used within a VocabLookupProvider');
  }
  return ctx;
}
