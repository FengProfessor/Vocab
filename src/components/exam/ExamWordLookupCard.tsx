'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, BookmarkPlus, Check, X, Loader2, Sparkles } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import {
  type ExamDictResult,
  isWordSavedLocally,
  saveWordLocally,
} from '@/lib/exam-dict-cache';
import { toast } from 'sonner';

export interface ExamWordLookupCardProps {
  dictResult: ExamDictResult | null;
  isLoading: boolean;
  onClose: () => void;
  positionStyle: React.CSSProperties;
  placement?: 'top' | 'bottom';
  className?: string;
}

export function ExamWordLookupCard({
  dictResult,
  isLoading,
  onClose,
  positionStyle,
  placement = 'top',
  className = '',
}: ExamWordLookupCardProps) {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Sync saved status locally and via global custom event
  useEffect(() => {
    if (!dictResult?.cleanWord) return;
    setIsSaved(isWordSavedLocally(dictResult.cleanWord));

    const handleWordSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ word?: string }>;
      if (
        customEvent.detail?.word &&
        customEvent.detail.word.toLowerCase() === dictResult.cleanWord.toLowerCase()
      ) {
        setIsSaved(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lingo_word_saved', handleWordSaved);
      return () => {
        window.removeEventListener('lingo_word_saved', handleWordSaved);
      };
    }
  }, [dictResult?.cleanWord]);

  // Audio pronunciation handler
  const handlePlayAudio = async () => {
    if (!dictResult?.cleanWord || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await playWordAudio(dictResult.cleanWord);
    } catch {
      // Ignore playback errors
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Save to vocabulary handler (Guest + Auth SRS integration)
  const handleSaveToVocab = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dictResult?.cleanWord || isSaving) return;
    if (isSaved) {
      toast.info('Từ này đã có trong Sổ từ SRS!');
      return;
    }

    setIsSaving(true);
    const targetWord = dictResult.cleanWord;

    try {
      // 1. Save locally for instant persistence
      saveWordLocally(targetWord);
      setIsSaved(true);

      // 2. If user is authenticated, sync to Supabase SRS system
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: targetWord,
            translation: dictResult.definition,
            ipa: dictResult.ipa || '',
            pos: dictResult.pos || '',
          }),
        });
      }

      // 3. Broadcast custom event across the application
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lingo_word_saved', { detail: { word: targetWord } })
        );
      }

      toast.success("Đã lưu từ vựng vào Sổ từ SRS!");
    } catch (err) {
      console.warn('[ExamWordLookupCard] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Bảng tra cứu từ vựng"
      style={positionStyle}
      className={`exam-lookup-card fixed z-50 max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 shadow-xl transition-all duration-150 animate-in fade-in zoom-in-95 select-none ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Word + Tag + Audio + Close */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
            {dictResult?.word || '...'}
          </span>
          {dictResult?.pos && (
            <span className="shrink-0 rounded-xs bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
              {dictResult.pos}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={isLoading}
            className={`p-1 rounded-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isPlayingAudio ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
            }`}
            title="Nghe phát âm chuẩn (US/UK)"
            aria-label="Phát âm từ"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Đóng"
            aria-label="Đóng bảng tra từ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body: IPA + Definition */}
      <div className="py-2.5 space-y-1.5 min-h-[58px]">
        {isLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-slate-500 font-mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Đang tra từ điển...</span>
          </div>
        ) : (
          <>
            {dictResult?.ipa && (
              <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                {dictResult.ipa}
              </div>
            )}
            <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {dictResult?.definition}
            </p>

            {/* Synonyms if present */}
            {dictResult && dictResult.synonyms.length > 0 && (
              <div className="pt-1 flex items-center gap-1 flex-wrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Đồng nghĩa:</span>
                {dictResult.synonyms.map((syn, i) => (
                  <span
                    key={i}
                    className="px-1 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Action: 1-Click Save Word */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          <span>LingoPro SRS</span>
        </span>

        <button
          type="button"
          onClick={handleSaveToVocab}
          disabled={isSaving || isLoading}
          className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition shadow-2xs cursor-pointer ${
            isSaved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
          }`}
          title={isSaved ? 'Đã lưu vào Sổ từ vựng' : 'Lưu từ để ôn tập lặp lại ngắt quãng (SRS)'}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : isSaved ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đã lưu vào Sổ từ</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Lưu vào Sổ từ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
