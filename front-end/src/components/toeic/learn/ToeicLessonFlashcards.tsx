'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Volume2,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Layers,
  AlertTriangle,
  Award,
} from 'lucide-react';
import type { LessonFlashcard } from '@/data/toeic/theory/types';
import { getFlashcardsByLessonId, getAllFlashcards } from '@/data/toeic/theory/flashcards';
import { speakLocal } from '@/lib/study';

export interface ToeicLessonFlashcardsProps {
  lessonId: string;
  className?: string;
}

export function ToeicLessonFlashcards({ lessonId, className = '' }: ToeicLessonFlashcardsProps) {
  const [cards, setCards] = useState<LessonFlashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Load cards for this lesson
  useEffect(() => {
    let lessonCards = getFlashcardsByLessonId(lessonId);
    if (lessonCards.length === 0) {
      // Fallback: take first 4 cards from global pool
      lessonCards = getAllFlashcards().slice(0, 4);
    }
    setCards(lessonCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);

    // Hydrate mastered IDs from localStorage
    try {
      const saved = localStorage.getItem('lingo_toeic_fc_mastered');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMasteredIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore localStorage read error
    }
  }, [lessonId]);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;

  const handleSpeak = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentCard) {
      speakLocal(currentCard.term, 0.95, 'en-US');
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, totalCards]);

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleMarkMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;

    setMasteredIds(prev => {
      const next = new Set(prev);
      next.add(currentCard.id);
      try {
        localStorage.setItem('lingo_toeic_fc_mastered', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore write error
      }
      return next;
    });

    setReviewIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });

    handleNext();
  };

  const handleMarkReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;

    setReviewIds(prev => {
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });

    setMasteredIds(prev => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      try {
        localStorage.setItem('lingo_toeic_fc_mastered', JSON.stringify(Array.from(next)));
      } catch {
        // Ignore write error
      }
      return next;
    });

    handleNext();
  };

  const handleRestartDeck = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  if (!currentCard) {
    return (
      <div className="p-8 text-center font-mono text-xs text-slate-500">
        Không tìm thấy thẻ ghi nhớ cho bài học này.
      </div>
    );
  }

  // Finished Screen
  if (isFinished) {
    const masteredCount = cards.filter(c => masteredIds.has(c.id)).length;
    const reviewCount = cards.filter(c => reviewIds.has(c.id)).length;

    return (
      <div className={`rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-5 shadow-xs ${className}`}>
        <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <Award className="h-8 w-8" />
        </div>

        <div className="space-y-1">
          <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-white">
            Hoàn Thành Bộ Thẻ Ghi Nhớ Bài Học!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Bạn đã duyệt qua toàn bộ {totalCards} thuật ngữ và quy tắc trọng điểm.
          </p>
        </div>

        {/* Score metrics */}
        <div className="flex items-center justify-center gap-6 py-3 border-y border-slate-200 dark:border-slate-800 max-w-sm mx-auto font-mono text-xs">
          <div>
            <div className="text-emerald-600 font-bold text-lg">{masteredCount}</div>
            <div className="text-slate-500">Đã thuộc</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-amber-600 font-bold text-lg">{reviewCount}</div>
            <div className="text-slate-500">Cần ôn lại</div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <div className="text-blue-600 font-bold text-lg">{totalCards}</div>
            <div className="text-slate-500">Tổng số thẻ</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRestartDeck}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Ôn lại bộ thẻ</span>
          </button>
        </div>
      </div>
    );
  }

  const isCurrentMastered = masteredIds.has(currentCard.id);
  const isCurrentReview = reviewIds.has(currentCard.id);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Thẻ Ghi Nhớ Micro-Learning
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 font-bold text-[11px]">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ Thuộc: {cards.filter(c => masteredIds.has(c.id)).length}
          </span>
          <span className="text-amber-600 dark:text-amber-400">
            🔄 Cần ôn: {cards.filter(c => reviewIds.has(c.id)).length}
          </span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-label={`Thẻ ghi nhớ: ${currentCard.term}. Nhấn phím cách hoặc Enter để lật thẻ xem giải nghĩa.`}
        className="w-full min-h-[280px] sm:min-h-[320px] rounded-sm border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-all select-none shadow-xs group"
      >
        {/* Card Top Row */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentCard.partOfSpeech}
            </span>
            {isCurrentMastered && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                Đã thuộc
              </span>
            )}
            {isCurrentReview && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                Cần ôn
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeak}
              className="p-2 rounded-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 transition cursor-pointer"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <span className="font-mono text-[10px] text-slate-400">
              {isFlipped ? 'Mặt sau' : 'Mặt trước (Nhấp để lật)'}
            </span>
          </div>
        </div>

        {/* Card Center Content */}
        {!isFlipped ? (
          /* FRONT SIDE */
          <div className="my-auto py-6 text-center space-y-3">
            <h4 className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentCard.term}
            </h4>
            <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
              {currentCard.ipa}
            </p>
            <p className="text-xs text-slate-400 pt-3">
              (Nhấp vào thẻ hoặc bấm phím <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-xs font-mono text-[10px] border border-slate-300 dark:border-slate-700">Space</kbd> để xem giải nghĩa & ví dụ)
            </p>
          </div>
        ) : (
          /* BACK SIDE */
          <div className="my-auto py-4 space-y-3.5 text-left">
            <div>
              <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                Định nghĩa tiếng Việt:
              </div>
              <p className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-300">
                {currentCard.vietnamese}
              </p>
            </div>

            {currentCard.collocation && (
              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xs border border-slate-200 dark:border-slate-800">
                <span className="font-mono text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  Cụm từ thường gặp (Collocation):
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentCard.collocation}
                </span>
              </div>
            )}

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-semibold italic">&quot;{currentCard.exampleSentence}&quot;</p>
              <p className="text-slate-500 dark:text-slate-400">→ {currentCard.exampleTranslation}</p>
            </div>

            {currentCard.trapWarning && (
              <div className="flex items-start gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xs border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span><strong>Bẫy ETS:</strong> {currentCard.trapWarning}</span>
              </div>
            )}
          </div>
        )}

        {/* Card Bottom Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-2">
          {/* Prev / Next arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Thẻ trước"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="p-1.5 rounded-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Thẻ kế tiếp"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Rating Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkReview}
              className="px-3 py-1.5 rounded-xs border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
            >
              🔄 Cần ôn lại
            </button>

            <button
              type="button"
              onClick={handleMarkMastered}
              className="px-3 py-1.5 rounded-xs border border-emerald-400 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
            >
              ✓ Đã thuộc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
