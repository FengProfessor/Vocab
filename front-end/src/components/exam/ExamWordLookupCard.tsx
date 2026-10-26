'use client';
import { authService } from '@/features/auth/session';

import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, BookmarkPlus, Check, X, Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import {
  type ExamDictResult,
  type ExamDictSense,
  isWordSavedLocally,
  saveWordLocally,
  isMeaningSavedLocally,
  saveMeaningLocally,
} from '@/lib/exam-dict-cache';
import { toast } from 'sonner';

export interface ExamWordLookupCardProps {
  dictResult: ExamDictResult | null;
  isLoading: boolean;
  onClose: () => void;
  positionStyle: React.CSSProperties;
  placement?: 'top' | 'bottom';
  className?: string;
  parentPhrase?: string | null;
  onLookupPhrase?: (phrase: string) => void;
}

export function ExamWordLookupCard({
  dictResult,
  isLoading,
  onClose,
  positionStyle,
  placement = 'top',
  className = '',
  parentPhrase,
  onLookupPhrase,
}: ExamWordLookupCardProps) {
  const senses: ExamDictSense[] = useMemo(() => {
    if (dictResult?.meanings && dictResult.meanings.length > 0) {
      return dictResult.meanings;
    }
    if (dictResult?.definition) {
      return [
        {
          definition: dictResult.definition,
          pos: dictResult.pos,
          example: dictResult.example,
          exampleVi: dictResult.exampleVi,
        },
      ];
    }
    return [];
  }, [dictResult]);

  const [selectedMeaningIdx, setSelectedMeaningIdx] = useState<number>(0);
  const [savedMeaningIndices, setSavedMeaningIndices] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const activeSense: ExamDictSense | null = senses[selectedMeaningIdx] || senses[0] || null;
  const isSaved = savedMeaningIndices.has(selectedMeaningIdx);

  // Sync saved status locally and via global custom event
  useEffect(() => {
    if (!dictResult?.cleanWord) return;
    const targetWord = dictResult.cleanWord;

    const newSaved = new Set<number>();
    senses.forEach((s, idx) => {
      if (isMeaningSavedLocally(targetWord, s.definition)) {
        newSaved.add(idx);
      }
    });

    if (newSaved.size === 0 && isWordSavedLocally(targetWord)) {
      newSaved.add(0);
    }

    setSavedMeaningIndices(newSaved);
    setSelectedMeaningIdx(0);

    const handleWordSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ word?: string; translation?: string }>;
      if (
        customEvent.detail?.word &&
        customEvent.detail.word.toLowerCase() === targetWord.toLowerCase()
      ) {
        if (customEvent.detail.translation) {
          const trans = customEvent.detail.translation.trim().toLowerCase();
          senses.forEach((s, idx) => {
            if (s.definition.trim().toLowerCase() === trans) {
              setSavedMeaningIndices((prev) => new Set(prev).add(idx));
            }
          });
        } else {
          setSavedMeaningIndices((prev) => new Set(prev).add(selectedMeaningIdx));
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lingo_word_saved', handleWordSaved);
      return () => {
        window.removeEventListener('lingo_word_saved', handleWordSaved);
      };
    }
  }, [dictResult?.cleanWord, senses]);

  // Audio pronunciation handler (prefers native audio recording when available)
  const handlePlayAudio = async () => {
    if (!dictResult?.cleanWord || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      await playWordAudio(dictResult.cleanWord, dictResult.audioUs || dictResult.audioUk);
    } catch {
      // Ignore playback errors
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Save specific sense handler
  const handleSaveSense = async (sense: ExamDictSense, senseIdx: number) => {
    if (!dictResult?.cleanWord || isSaving) return;
    if (savedMeaningIndices.has(senseIdx)) {
      toast.info('Nghĩa này đã có trong Sổ từ SRS!');
      return;
    }

    setIsSaving(true);
    const targetWord = dictResult.cleanWord;
    const targetTranslation = sense.definition;

    try {
      // 1. Save locally for instant persistence
      saveWordLocally(targetWord, targetTranslation);
      saveMeaningLocally(targetWord, targetTranslation);
      setSavedMeaningIndices((prev) => new Set(prev).add(senseIdx));

      // 2. If user is authenticated, sync to Supabase SRS system
      const {
        data: { session },
      } = await authService.getSession();

      if (session?.user) {
        await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: targetWord,
            translation: targetTranslation,
            ipa: dictResult.ipa || '',
            pos: sense.pos || dictResult.pos || '',
          }),
        });
      }

      // 3. Broadcast custom event across the application
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('lingo_word_saved', { detail: { word: targetWord, translation: targetTranslation } })
        );
      }

      const shortDef = targetTranslation.length > 25 ? `${targetTranslation.slice(0, 25)}...` : targetTranslation;
      toast.success(`Đã lưu nghĩa "${shortDef}" vào Sổ từ SRS!`);
    } catch (err) {
      console.warn('[ExamWordLookupCard] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save to vocabulary handler (Guest + Auth SRS integration)
  const handleSaveToVocab = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dictResult?.cleanWord || isSaving) return;
    if (isSaved) {
      toast.info('Nghĩa này đã có trong Sổ từ SRS!');
      return;
    }

    const currentSense = activeSense || {
      definition: dictResult.definition,
      pos: dictResult.pos,
    };
    await handleSaveSense(currentSense, selectedMeaningIdx);
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

            {/* Photo Thumbnail */}
            {dictResult?.imageUrl && (
              <div className="relative my-2 overflow-hidden rounded-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <img
                  src={dictResult.imageUrl}
                  alt={dictResult.word}
                  className="h-28 w-full object-cover sm:h-32 transition-opacity duration-200"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                  }}
                />
              </div>
            )}

            {/* Multiple Meanings (Các nghĩa của từ) */}
            {senses.length > 1 ? (
              <div className="my-2 space-y-1.5 border-t border-b border-slate-100 dark:border-slate-800/80 py-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  <span>Các nghĩa của từ ({senses.length}):</span>
                  {savedMeaningIndices.size > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      Đã lưu {savedMeaningIndices.size}/{senses.length} nghĩa
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {senses.map((sense, idx) => {
                    const isSenseSaved = savedMeaningIndices.has(idx);
                    const isSelected = selectedMeaningIdx === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedMeaningIdx(idx)}
                        className={`flex items-start justify-between gap-1.5 p-1.5 rounded-sm border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-50/70 dark:border-indigo-600 dark:bg-indigo-950/50'
                            : 'border-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-[11px] text-slate-500">
                              {idx + 1}.
                            </span>
                            {sense.pos && (
                              <span className="text-[9px] font-semibold uppercase px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {sense.pos}
                              </span>
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {sense.definition}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeaningIdx(idx);
                            if (!isSenseSaved) {
                              void handleSaveSense(sense, idx);
                            }
                          }}
                          disabled={isSaving || isSenseSaved}
                          className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-0.5 transition ${
                            isSenseSaved
                              ? 'text-emerald-700 bg-emerald-100/70 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300 cursor-pointer'
                          }`}
                        >
                          {isSenseSaved ? (
                            <>
                              <Check className="h-2.5 w-2.5" />
                              <span>Đã lưu</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="h-2.5 w-2.5" />
                              <span>Lưu</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {activeSense?.definition || dictResult?.definition}
              </p>
            )}

            {/* Bilingual Example Sentence */}
            {dictResult?.example && (
              <div className="rounded-xs border-l-2 border-indigo-500 bg-slate-50 dark:bg-slate-800/50 py-1.5 px-2 text-xs">
                <p className="font-medium text-slate-800 dark:text-slate-200 italic">
                  &ldquo;{dictResult.example}&rdquo;
                </p>
                {dictResult.exampleVi && (
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {dictResult.exampleVi}
                  </p>
                )}
              </div>
            )}

            {/* TOEIC Exam Tip Callout Box */}
            {dictResult?.toeicTip && (
              <div className="rounded-xs border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-2 text-xs">
                <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  <Lightbulb className="h-3 w-3" />
                  <span>Mẹo TOEIC</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-950 dark:text-amber-200/90 leading-snug">
                  {dictResult.toeicTip}
                </p>
              </div>
            )}

            {/* Interactive Collocation Pills */}
            {dictResult?.phrases && dictResult.phrases.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-slate-400">
                  Cụm từ đi kèm (Collocations):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {dictResult.phrases.map((phraseItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onLookupPhrase?.(phraseItem.phrase)}
                      className="group inline-flex items-center gap-1 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 px-2 py-0.5 text-[11px] text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      title={`Tra cụm: ${phraseItem.phrase} - ${phraseItem.meaning}`}
                    >
                      <span className="font-medium">{phraseItem.phrase}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        • {phraseItem.meaning}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            {/* Parent phrase suggestion (e.g. Option text contains 2-8 words) */}
            {parentPhrase && onLookupPhrase && parentPhrase.toLowerCase() !== dictResult?.cleanWord.toLowerCase() && (
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onLookupPhrase(parentPhrase)}
                  className="group flex items-center gap-2 w-full text-left rounded-md bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 p-2 text-xs border border-indigo-200/90 dark:border-indigo-800/80 transition cursor-pointer"
                  title={`Tra cứu toàn bộ cụm từ: "${parentPhrase}"`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Gợi ý cụm từ trong câu
                    </span>
                    <span className="truncate block font-medium text-indigo-950 dark:text-indigo-100">
                      Tra cả cụm: &ldquo;{parentPhrase}&rdquo;
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Typo-tolerance suggestions (Did You Mean) */}
            {dictResult?.didYouMean && dictResult.didYouMean.length > 0 && onLookupPhrase && (
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
                  Có phải bạn muốn tìm:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dictResult.didYouMean.slice(0, 3).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => onLookupPhrase(sug)}
                      className="px-2 py-0.5 rounded-sm bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-mono text-xs border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
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
