'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Lock,
  Headphones,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { ToeicExamMode } from '@/types/toeic';

export interface ToeicAudioPlayerProps {
  src?: string;
  title?: string;
  mode?: ToeicExamMode;
  autoPlayInExamMode?: boolean;
  onEnded?: () => void;
  className?: string;
}

export function ToeicAudioPlayer({
  src,
  title = 'Âm thanh bài thi',
  mode = 'real',
  autoPlayInExamMode = true,
  onEnded,
  className = '',
}: ToeicAudioPlayerProps) {
  const isExamMode = mode === 'real' || mode === 'full_simulation';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset state when audio src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasPlayedOnce(false);
    setAutoplayBlocked(false);
    setHasError(false);
    setIsLoading(Boolean(src));

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (src) {
        audioRef.current.src = src;
        audioRef.current.load();
      }
    }
  }, [src]);

  // Handle Autoplay in Exam Mode
  useEffect(() => {
    if (!src || !isExamMode || !autoPlayInExamMode || hasPlayedOnce) return;

    const playTimer = setTimeout(() => {
      if (audioRef.current && !hasPlayedOnce) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setHasPlayedOnce(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('[ToeicAudioPlayer] Autoplay prevented by browser:', err);
            setAutoplayBlocked(true);
          });
      }
    }, 400);

    return () => clearTimeout(playTimer);
  }, [src, isExamMode, autoPlayInExamMode, hasPlayedOnce]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !src) return;

    // Single-play lock check in exam mode
    if (isExamMode && hasPlayedOnce && !isPlaying) {
      // In strict ETS exam mode, cannot replay once ended
      return;
    }

    if (isPlaying) {
      if (isExamMode) {
        // Exam mode lock: cannot pause once started (simulates live listening test)
        return;
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasPlayedOnce(true);
          setAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn('[ToeicAudioPlayer] Play error:', err);
          setAutoplayBlocked(true);
        });
    }
  }, [hasPlayedOnce, isExamMode, isPlaying, src]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExamMode || !audioRef.current) return;
    const target = parseFloat(e.target.value);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSpeedChange = (rate: number) => {
    if (isExamMode || !audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleReplay = () => {
    if (isExamMode || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const val = parseFloat(e.target.value);
    audioRef.current.volume = val;
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (audioRef.current && src) {
      audioRef.current.src = src;
      audioRef.current.load();
      audioRef.current.play().catch(() => setAutoplayBlocked(true));
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!src) {
    return null;
  }

  return (
    <div
      className={`rounded-sm border border-slate-200 bg-white p-3 sm:p-3.5 shadow-none transition-all dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsLoading(false);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      {/* Top row: Title and status tags */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-xs border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
            <Headphones className="h-3.5 w-3.5" />
          </div>
          <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            {title}
          </span>
        </div>

        {/* Exam mode badge vs Practice mode badge */}
        {isExamMode ? (
          <div className="flex items-center gap-1 rounded-xs border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
            <Lock className="h-3 w-3" />
            <span>Chế độ thi: Phát 1 lần</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-xs border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
            <span>Luyện tập linh hoạt</span>
          </div>
        )}
      </div>

      {/* Browser Autoplay Blocked Notice */}
      {autoplayBlocked && (
        <div className="mb-2.5 flex items-center justify-between rounded-sm border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Trình duyệt chặn phát tự động. Vui lòng bấm phát âm thanh.</span>
          </div>
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-sm bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white shadow-none hover:bg-slate-800 cursor-pointer dark:bg-slate-100 dark:text-slate-900"
          >
            Nghe ngay
          </button>
        </div>
      )}

      {/* Audio Loading Error */}
      {hasError && (
        <div className="mb-2.5 flex items-center justify-between rounded-sm border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Không thể tải âm thanh (lỗi kết nối CDN).</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 rounded-sm bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-none hover:bg-rose-700 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Controls & Progress bar */}
      <div className="space-y-2">
        {/* Progress scrub bar */}
        <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div className="relative flex-1 flex items-center">
            {isExamMode ? (
              // Non-interactive progress in Exam Mode
              <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-slate-900 transition-all duration-200 dark:bg-slate-100"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
            ) : (
              // Interactive seek slider in Practice Mode
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-xs bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-slate-100"
              />
            )}
          </div>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Buttons and toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Main Play / Pause / Replay controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={isExamMode && hasPlayedOnce && !isPlaying}
              className={`flex h-8 w-8 items-center justify-center rounded-sm font-bold shadow-none transition cursor-pointer ${
                isPlaying
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : isExamMode && hasPlayedOnce
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
              }`}
              title={
                isExamMode && hasPlayedOnce && !isPlaying
                  ? 'Đã phát xong (khoá phát 1 lần)'
                  : isPlaying
                  ? 'Tạm dừng'
                  : 'Phát âm thanh'
              }
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </button>

            {/* Replay button in Practice Mode */}
            {!isExamMode && (
              <button
                type="button"
                onClick={handleReplay}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                title="Phát lại từ đầu"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Status indicator text */}
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {isLoading
                ? 'Đang tải âm thanh...'
                : isPlaying
                ? 'Đang phát...'
                : isExamMode && hasPlayedOnce
                ? 'Đã nghe xong'
                : 'Sẵn sàng'}
            </span>
          </div>

          {/* Speed & Volume controls */}
          <div className="flex items-center gap-2">
            {/* Speed buttons (Practice Mode only) */}
            {!isExamMode && (
              <div className="flex items-center rounded-sm border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-850">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeedChange(rate)}
                    className={`rounded-xs px-1.5 py-0.5 font-mono text-xs font-semibold transition cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}

            {/* Volume toggle */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-14 cursor-pointer appearance-none rounded-xs bg-slate-200 accent-slate-900 dark:bg-slate-700 dark:accent-slate-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
