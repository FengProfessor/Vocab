'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, BookmarkPlus, Check, X, Loader2, Sparkles } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import { tokenizeSentence, type WordToken } from '@/lib/listening';
import type { CoreVocabulary } from '@/types/listening';

export interface WordLookupPopoverProps {
  sentence: string;
  coreVocabulary?: CoreVocabulary[];
  onWordSelect?: (word: string) => void;
  className?: string;
  activeTokenStyle?: string;
}

interface LookupDetail {
  word: string;
  ipa: string;
  pos: string;
  definition: string;
  isCore: boolean;
  isSaved: boolean;
}

export const WordLookupPopover: React.FC<WordLookupPopoverProps> = ({
  sentence,
  coreVocabulary = [],
  onWordSelect,
  className = '',
}) => {
  const [selectedWord, setSelectedWord] = useState<LookupDetail | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<'top' | 'bottom'>('top');
  const [popoverShiftX, setPopoverShiftX] = useState<number>(0);
  const [isLoadingDict, setIsLoadingDict] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize saved words from localStorage on mount and listen to cross-component sync
  useEffect(() => {
    try {
      const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
      if (Array.isArray(localWords)) {
        const map: Record<string, boolean> = {};
        localWords.forEach((w) => {
          map[w.toLowerCase()] = true;
        });
        setSavedWordsMap(map);
      }
    } catch {
      // Ignore
    }

    function handleWordSavedEvent(e: Event) {
      const customEvt = e as CustomEvent<{ word: string }>;
      const savedWord = customEvt.detail?.word?.toLowerCase();
      if (savedWord) {
        setSavedWordsMap((prev) => ({ ...prev, [savedWord]: true }));
        setSelectedWord((prev) => {
          if (prev && prev.word.toLowerCase() === savedWord) {
            return { ...prev, isSaved: true };
          }
          return prev;
        });
      }
    }

    window.addEventListener('lingo_word_saved', handleWordSavedEvent);
    return () => {
      window.removeEventListener('lingo_word_saved', handleWordSavedEvent);
    };
  }, []);

  // Map core vocabulary words (case-insensitive) for fast retrieval
  const coreMap = useMemo(() => {
    const map = new Map<string, CoreVocabulary>();
    for (const item of coreVocabulary) {
      if (item.word) {
        map.set(item.word.trim().toLowerCase(), item);
      }
    }
    return map;
  }, [coreVocabulary]);

  // Tokenize the sentence into words and punctuation
  const tokens = useMemo(() => {
    return tokenizeSentence(sentence);
  }, [sentence]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedWord(null);
        setActiveTokenId(null);
      }
    }
    if (selectedWord) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedWord]);

  // Handle word click
  const handleWordClick = async (e: React.MouseEvent, token: WordToken) => {
    e.stopPropagation(); // Prevent parent cue container from seeking video
    const cleanWord = token.clean;
    if (!cleanWord) return;

    onWordSelect?.(cleanWord);
    setActiveTokenId(token.id);

    // Compute dynamic placement and horizontal clamp relative to scroll container & viewport
    const targetEl = e.currentTarget as HTMLElement;
    const wordRect = targetEl.getBoundingClientRect();
    const container = targetEl.closest('.overflow-y-auto') || document.documentElement;
    const containerRect = container.getBoundingClientRect();

    const spaceAbove = wordRect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - wordRect.bottom;
    // Flip below if not enough space above in the scroll container
    const isTopClipped = spaceAbove < 170 && spaceBelow > spaceAbove;
    setPopoverPlacement(isTopClipped ? 'bottom' : 'top');

    const isSm = typeof window !== 'undefined' && window.innerWidth >= 640;
    const popoverWidth = Math.min(isSm ? 320 : 288, (typeof window !== 'undefined' ? window.innerWidth : 375) - 24);
    const wordCenterX = wordRect.left + wordRect.width / 2;
    const idealLeft = wordCenterX - popoverWidth / 2;
    const idealRight = idealLeft + popoverWidth;

    // Constrain to container boundaries if inside scrollable transcript, or viewport
    const minLeft = Math.max(12, containerRect.left + 8);
    const maxRight = Math.min(
      (typeof window !== 'undefined' ? window.innerWidth : 375) - 12,
      containerRect.right - 8
    );

    let shift = 0;
    if (idealLeft < minLeft) {
      shift = minLeft - idealLeft;
    } else if (idealRight > maxRight) {
      shift = maxRight - idealRight;
    }

    const maxArrowOffset = popoverWidth / 2 - 20;
    const clampedShift = Math.max(-maxArrowOffset, Math.min(maxArrowOffset, shift));
    setPopoverShiftX(clampedShift);

    // 1. Check if word is in core vocabulary
    const matchedCore = coreMap.get(cleanWord);
    if (matchedCore) {
      setSelectedWord({
        word: matchedCore.word,
        ipa: matchedCore.phonetic || '',
        pos: '',
        definition: matchedCore.viDefinition,
        isCore: true,
        isSaved: !!savedWordsMap[matchedCore.word.toLowerCase()],
      });
      // Play pronunciation
      playWordAudio(matchedCore.word);
      return;
    }

    // 2. Fallback: Fetch definition from dictionary lookup API
    setSelectedWord({
      word: token.raw,
      ipa: '',
      pos: '',
      definition: 'Đang tải giải nghĩa...',
      isCore: false,
      isSaved: !!savedWordsMap[cleanWord],
    });
    setIsLoadingDict(true);
    playWordAudio(token.raw);

    try {
      const res = await fetch(`/api/dictionary/lookup?word=${encodeURIComponent(cleanWord)}`);
      if (res.ok) {
        const data = await res.json();
        const meanings = data?.results?.[0]?.meanings || [];
        const primaryMeaning = meanings[0];
        const viDef =
          primaryMeaning?.definition ||
          primaryMeaning?.meaning_vi ||
          data?.translation ||
          'Tra nghĩa thành công';
        const ipa = data?.pronunciations?.[0]?.ipa || '';
        const pos = primaryMeaning?.pos || '';

        setSelectedWord({
          word: token.raw,
          ipa: ipa ? `/${ipa.replace(/^\/|\/$/g, '')}/` : '',
          pos,
          definition: viDef,
          isCore: false,
          isSaved: !!savedWordsMap[cleanWord],
        });
      } else {
        // Fallback for simple display
        setSelectedWord({
          word: token.raw,
          ipa: '',
          pos: '',
          definition: 'Chưa có bản dịch chi tiết. Nhấp "Lưu vào từ vựng" để hệ thống phân tích tự động.',
          isCore: false,
          isSaved: !!savedWordsMap[cleanWord],
        });
      }
    } catch {
      setSelectedWord({
        word: token.raw,
        ipa: '',
        pos: '',
        definition: 'Từ vựng tiếng Anh giao tiếp. Nhấp "Lưu vào từ vựng" để phân tích.',
        isCore: false,
        isSaved: !!savedWordsMap[cleanWord],
      });
    } finally {
      setIsLoadingDict(false);
    }
  };

  // Handle saving word to personal vocabulary notebook
  const handleSaveToVocab = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedWord || isSaving) return;

    setIsSaving(true);
    const wordKey = selectedWord.word.toLowerCase();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await authFetch('/api/words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: selectedWord.word,
            translation: selectedWord.definition !== 'Đang tải giải nghĩa...' ? selectedWord.definition : '',
          }),
        });

        if (res.ok) {
          try {
            const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
            if (!localWords.includes(wordKey)) {
              localWords.push(wordKey);
              localStorage.setItem('lingo_saved_words', JSON.stringify(localWords));
            }
          } catch {}
          setSavedWordsMap((prev) => ({ ...prev, [wordKey]: true }));
          setSelectedWord((prev) => (prev ? { ...prev, isSaved: true } : null));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lingo_word_saved', { detail: { word: wordKey } })
            );
          }
          return;
        }
      }

      // Guest / offline fallback: persist to localStorage
      try {
        const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
        if (!localWords.includes(wordKey)) {
          localWords.push(wordKey);
          localStorage.setItem('lingo_saved_words', JSON.stringify(localWords));
        }
      } catch {
        // Ignore localStorage error
      }
      setSavedWordsMap((prev) => ({ ...prev, [wordKey]: true }));
      setSelectedWord((prev) => (prev ? { ...prev, isSaved: true } : null));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lingo_word_saved', { detail: { word: wordKey } })
        );
      }
    } catch (err) {
      console.error('Failed to save word:', err);
      setSavedWordsMap((prev) => ({ ...prev, [wordKey]: true }));
      setSelectedWord((prev) => (prev ? { ...prev, isSaved: true } : null));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lingo_word_saved', { detail: { word: wordKey } })
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <span className={`inline ${className}`}>
      {/* Tokenized interactive text */}
      {tokens.map((token) => {
        if (!token.isWord) {
          return <span key={token.id}>{token.raw}</span>;
        }

        const isCore = coreMap.has(token.clean);
        const isSaved = !!savedWordsMap[token.clean];
        const isSelected = activeTokenId === token.id;

        return (
          <span
            key={token.id}
            role="button"
            tabIndex={0}
            onClick={(e) => handleWordClick(e, token)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleWordClick(e as unknown as React.MouseEvent, token);
              }
            }}
            className={`relative inline-block cursor-pointer rounded px-0.5 transition-colors ${
              isSelected
                ? 'bg-amber-300 font-semibold text-amber-950 dark:bg-amber-500/80 dark:text-amber-950'
                : isCore
                ? 'border-b-2 border-amber-400 bg-amber-50/80 font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60'
                : isSaved
                ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'hover:bg-slate-200/80 hover:text-indigo-950 dark:hover:bg-slate-700/60 dark:hover:text-indigo-200'
            }`}
            title={isCore ? 'Từ vựng trọng tâm - Chạm để xem nghĩa' : 'Chạm để tra từ'}
          >
            {token.raw}

            {/* Inline Word Lookup Popover Card anchored to active word token */}
            {isSelected && selectedWord && (
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                  transform: `translateX(calc(-50% + ${popoverShiftX}px))`,
                }}
                className={`absolute z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 left-1/2 cursor-default font-normal not-italic normal-case tracking-normal text-left text-slate-800 dark:text-slate-200 ${
                  popoverPlacement === 'bottom' ? 'top-full mt-2' : '-top-2 -translate-y-full'
                }`}
              >
                {/* Header with Word & Close button */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                        {selectedWord.word}
                      </h4>
                      {selectedWord.isCore && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          <Sparkles className="h-3 w-3" />
                          Trọng tâm
                        </span>
                      )}
                    </div>
                    {selectedWord.ipa && (
                      <p className="mt-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {selectedWord.ipa}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => playWordAudio(selectedWord.word)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWord(null);
                        setActiveTokenId(null);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      title="Đóng"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Definition Body */}
                <div className="py-2.5">
                  {isLoadingDict ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      <span>Đang tra từ điển...</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                      {selectedWord.definition}
                    </p>
                  )}
                </div>

                {/* Quick Save Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={selectedWord.isSaved || isSaving}
                    onClick={handleSaveToVocab}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-[0.98] ${
                      selectedWord.isSaved
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : selectedWord.isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Đã lưu vào từ vựng</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        <span>Lưu vào từ vựng</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popover Arrow */}
                <div
                  style={{ left: `calc(50% - ${popoverShiftX}px)` }}
                  className={`absolute h-0 w-0 -translate-x-1/2 border-x-8 border-x-transparent ${
                    popoverPlacement === 'bottom'
                      ? '-top-2 border-b-8 border-b-white dark:border-b-slate-900'
                      : '-bottom-2 border-t-8 border-t-white dark:border-t-slate-900'
                  }`}
                />
              </div>
            )}
          </span>
        );
      })}
    </span>
  );
};
