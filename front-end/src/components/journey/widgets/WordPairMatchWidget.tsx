'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Volume2, CheckCircle2, RotateCcw, Sparkles, Clock, Target } from 'lucide-react';
import { playWordAudio } from '@/lib/audio';

export interface WordPairItem {
  id: string;
  left: string;
  right: string;
  leftAudio?: string;
  leftImage?: string;
}

export interface WordPairMatchWidgetProps {
  pairs: WordPairItem[];
  onComplete: (stats: { correct: number; attempts: number; elapsedSeconds: number }) => void;
}

// Simple Web Audio API synthesizer for instant feedback sounds
function playChime(isSuccess: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (isSuccess) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.2); // E3
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // AudioContext blocked or unsupported in environment
  }
}

export const WordPairMatchWidget: React.FC<WordPairMatchWidgetProps> = ({ pairs, onComplete }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatched, setMismatched] = useState<{ left: string; right: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Shuffle right items once on pairs change
  const shuffledRight = useMemo(() => {
    const list = [...pairs];
    // Deterministic or pseudo-random shuffle: swap elements
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [pairs]);

  // Start timer on mount
  useEffect(() => {
    if (isCompleted) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => Math.max(0, prev + 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted]);

  // Reset game state
  const handleReset = () => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds(new Set());
    setMismatched(null);
    setAttempts(0);
    setElapsedSeconds(0);
    setIsCompleted(false);
  };

  // Process matching logic when both sides are selected
  const checkMatch = (leftId: string, rightId: string) => {
    setAttempts((prev) => prev + 1);

    if (leftId === rightId) {
      // Correct match!
      playChime(true);
      const newMatched = new Set(matchedIds);
      newMatched.add(leftId);
      setMatchedIds(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Play pronunciation of the matched word
      const item = pairs.find((p) => p.id === leftId);
      if (item) {
        playWordAudio(item.left, item.leftAudio);
      }

      // Check if all matched
      if (newMatched.size === pairs.length) {
        setIsCompleted(true);
        if (timerRef.current) clearInterval(timerRef.current);
        const totalAttempts = attempts + 1;
        const totalElapsed = Math.max(0, elapsedSeconds);
        onCompleteRef.current({
          correct: pairs.length,
          attempts: totalAttempts,
          elapsedSeconds: totalElapsed,
        });
      }
    } else {
      // Mismatch
      playChime(false);
      setMismatched({ left: leftId, right: rightId });
      setTimeout(() => {
        setMismatched(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  };

  const handleSelectLeft = (id: string) => {
    if (matchedIds.has(id) || isCompleted || mismatched) return;

    // Toggle off if same card clicked twice
    if (selectedLeft === id) {
      setSelectedLeft(null);
      return;
    }

    // Play word audio on card selection
    const item = pairs.find((p) => p.id === id);
    if (item) {
      playWordAudio(item.left, item.leftAudio);
    }

    setSelectedLeft(id);
    if (selectedRight) {
      checkMatch(id, selectedRight);
    }
  };

  const handleSelectRight = (id: string) => {
    if (matchedIds.has(id) || isCompleted || mismatched) return;

    // Toggle off if same card clicked twice
    if (selectedRight === id) {
      setSelectedRight(null);
      return;
    }

    setSelectedRight(id);
    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    }
  };

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const m = Math.floor(safeSecs / 60);
    const s = safeSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.round((matchedIds.size / pairs.length) * 100) || 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
              Nối từ vựng nhanh
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Chạm một từ tiếng Anh và nghĩa tiếng Việt tương ứng để ghép cặp.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full font-medium">
            <Target className="w-3.5 h-3.5 text-zinc-500" />
            <span>{matchedIds.size}/{pairs.length} cặp</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Làm lại từ đầu"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Completed Success Banner */}
      {isCompleted && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm sm:text-base">
                Ghép nối hoàn hảo!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Bạn đã ghép {pairs.length} cặp trong {formatTime(elapsedSeconds)} với {attempts} lượt thử. (+10 XP)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Ghép lại
          </button>
        </div>
      )}

      {/* Two columns: Left (English) & Right (Vietnamese) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Từ vựng tiếng Anh
          </div>
          {pairs.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedLeft === item.id;
            const isMismatching = mismatched?.left === item.id;

            return (
              <button
                key={`left-${item.id}`}
                type="button"
                disabled={isMatched || isCompleted}
                onClick={() => handleSelectLeft(item.id)}
                className={`group min-h-[56px] w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all duration-200 select-none ${
                  isMatched
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 opacity-60 cursor-default'
                    : isMismatching
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200 animate-shake shadow-sm'
                    : isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 text-indigo-900 dark:text-indigo-100 shadow-sm'
                    : 'bg-zinc-50/80 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.leftImage && (
                    <img
                      src={item.leftImage}
                      alt={item.left}
                      className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="font-semibold text-sm sm:text-base">
                    {item.left}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        playWordAudio(item.left, item.leftAudio);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
            Nghĩa tiếng Việt
          </div>
          {shuffledRight.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedRight === item.id;
            const isMismatching = mismatched?.right === item.id;

            return (
              <button
                key={`right-${item.id}`}
                type="button"
                disabled={isMatched || isCompleted}
                onClick={() => handleSelectRight(item.id)}
                className={`min-h-[56px] w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all duration-200 select-none ${
                  isMatched
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 opacity-60 cursor-default'
                    : isMismatching
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200 animate-shake shadow-sm'
                    : isSelected
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800 text-indigo-900 dark:text-indigo-100 shadow-sm'
                    : 'bg-zinc-50/80 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-100/70'
                }`}
              >
                <span className="text-sm sm:text-base font-medium">
                  {item.right}
                </span>

                {isMatched && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WordPairMatchWidget;
