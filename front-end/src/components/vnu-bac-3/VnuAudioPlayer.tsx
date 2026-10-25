/**
 * VNU Test Bậc 3 Audio Player with Persistent 2-Play Limiter
 * File: src/components/vnu-bac-3/VnuAudioPlayer.tsx
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Lock, Volume2, Volume1, VolumeX, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

interface VnuAudioPlayerProps {
  examId: string;
  taskId: string;
  audioUrl?: string;
  title?: string;
  mode?: 'full_simulation' | 'practice';
  maxPlays?: number; // Mặc định 2 lần theo quy chế ULIS
  onPlayLimitReached?: () => void;
}

export function VnuAudioPlayer({
  examId,
  taskId,
  audioUrl,
  title = 'Bài nghe khảo thí',
  mode = 'full_simulation',
  maxPlays = 2,
  onPlayLimitReached,
}: VnuAudioPlayerProps) {
  const isExamMode = mode === 'full_simulation';
  const storageKey = `vnu_b3_audio_${examId}_${taskId}`;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playCount, setPlayCount] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // 1. Khôi phục số lần nghe từ localStorage để chống reload F5
  useEffect(() => {
    if (!isExamMode) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const count = typeof parsed.playCount === 'number' ? parsed.playCount : 0;
        setPlayCount(count);
        // Chỉ khóa nếu đã nghe đủ maxPlays và bài nghe đã kết thúc (hoặc được đánh dấu locked)
        if (parsed.isLocked || (count >= maxPlays && parsed.completed)) {
          setIsLocked(true);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, isExamMode, maxPlays]);

  // Reset states when audioUrl changes
  useEffect(() => {
    setAudioError(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(false);
  }, [audioUrl]);

  // 2. Ghi nhận persistent số lần nghe
  const recordPlayCount = useCallback(
    (newCount: number) => {
      setPlayCount(newCount);
      if (isExamMode) {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              playCount: newCount,
              completed: false,
              isLocked: false,
              lastPlayedAt: Date.now(),
            })
          );
        } catch {
          // ignore
        }
      }
    },
    [isExamMode, storageKey]
  );

  // 3. Xử lý Play / Pause an toàn
  const handleTogglePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (audioError) {
      handleRetry();
      return;
    }

    // Chỉ chặn khi đã khóa hoàn toàn sau khi phát xong maxPlays
    if (isExamMode && isLocked) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Khi bắt đầu lượt nghe mới từ đầu (vị trí 0 hoặc đã kết thúc bài)
      if (audioRef.current.currentTime === 0 || audioRef.current.ended) {
        if (playCount >= maxPlays) {
          setIsLocked(true);
          return;
        }
        const nextCount = playCount + 1;
        recordPlayCount(nextCount);
      }

      setIsLoading(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          setAudioError(null);
        })
        .catch((err) => {
          setIsPlaying(false);
          setIsLoading(false);
          console.warn('[VnuAudioPlayer] Playback error:', err);
          setAudioError('Lỗi phát âm thanh. Vui lòng thử lại.');
        });
    }
  };

  // 4. Xử lý khi bài nghe kết thúc
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setIsLoading(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    // Chỉ khóa khi bài nghe lần thứ maxPlays đã thực sự phát xong đến hết
    if (isExamMode && playCount >= maxPlays) {
      setIsLocked(true);
      onPlayLimitReached?.();
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            playCount,
            completed: true,
            isLocked: true,
            lastPlayedAt: Date.now(),
          })
        );
      } catch {
        // ignore
      }
    }
  };

  // 5. Xử lý lỗi tải âm thanh
  const handleAudioError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    setAudioError('Lỗi tải tệp âm thanh. Vui lòng thử lại.');
  };

  const handleRetry = () => {
    setAudioError(null);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  // 6. Điều khiển âm lượng / Mute
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = muted;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVol = volume > 0 ? volume : 1;
      setIsMuted(false);
      setVolume(restoreVol);
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = restoreVol;
      }
    } else {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
    }
  };

  // 7. Tốc độ phát (Practice mode)
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm space-y-2.5">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onDurationChange={() => audioRef.current && setDuration(audioRef.current.duration)}
        onLoadStart={() => setIsLoading(true)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onError={handleAudioError}
        onEnded={handleAudioEnded}
      />

      {/* Header bar: Title, Buffering indicator, Playback Speed (practice), Play Count badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
            {title}
          </span>
          {isLoading && (
            <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Đang đệm...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Practice mode playback rate selector */}
          {!isExamMode && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-sm border border-slate-200 dark:border-slate-700">
              {([0.8, 1.0, 1.2] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-sm transition-colors ${
                    playbackRate === rate
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Tốc độ ${rate}x`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}

          {/* Counter Badge hiển thị số lần nghe */}
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-sm border font-semibold ${
              isLocked
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : playCount === 1
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            Lượt nghe: {playCount}/{maxPlays}
          </span>
        </div>
      </div>

      {/* Main Controls: Play/Pause/Retry button, Scrubber progress, and Volume slider */}
      <div className="flex items-center gap-2.5">
        {/* Play / Pause / Retry / Lock button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={isExamMode && isLocked}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold transition-all shrink-0 ${
            isLocked
              ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
              : audioError
              ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm'
              : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer shadow-sm'
          }`}
        >
          {isLocked ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Hết lượt ({maxPlays}/{maxPlays})</span>
            </>
          ) : audioError ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Phát bài nghe</span>
              <span className="sm:hidden">Phát</span>
            </>
          )}
        </button>

        {/* Progress slider & time display */}
        <div className="flex-1 flex items-center gap-2 text-xs font-mono text-slate-500 tabular-nums min-w-0">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            disabled={isExamMode} // Khóa thanh tua trong Exam Mode theo quy chế
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) audioRef.current.currentTime = val;
            }}
            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-none appearance-none accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
          />
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>

        {/* Volume & Mute control */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-sm"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="hidden sm:block w-14 sm:w-18 h-1 bg-slate-200 dark:bg-slate-700 rounded-none appearance-none accent-slate-600 dark:accent-slate-300 cursor-pointer"
            title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>

      {/* Error Fallback Banner */}
      {audioError && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-sm border border-rose-200 dark:border-rose-800">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{audioError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="font-bold underline hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer flex-shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ULIS 2-play limit lock notice */}
      {isExamMode && isLocked && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-sm border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Bài nghe đã phát đủ 2 lần theo quy chế khảo thí.</span>
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

