'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Headphones,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import {
  loadListeningVideoById,
  findActiveCueIndex,
  getTopicBadgeColor,
  getCefrBadgeStyle,
  getTopicDisplayName,
} from '@/lib/listening';
import {
  saveVideoWatchProgress,
} from '@/lib/listening-recommendation';
import {
  YouTubeListeningPlayer,
  type YouTubePlayerHandle,
} from '@/components/listening/YouTubeListeningPlayer';
import { ListeningControls } from '@/components/listening/ListeningControls';
import { SyncedTranscript } from '@/components/listening/SyncedTranscript';
import { useListeningShortcuts } from '@/hooks/useListeningShortcuts';
import type { SubtitleDisplayMode, ListeningVideo } from '@/types/listening';

export default function InteractiveListeningPage() {
  const params = useParams();
  const videoId = (params?.videoId as string) || '';

  // Video data state & Dynamic on-demand loading
  const [video, setVideo] = useState<ListeningVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prevVideoId, setPrevVideoId] = useState(videoId);

  // Render-phase sync for videoId changes
  if (prevVideoId !== videoId) {
    setPrevVideoId(videoId);
    setIsLoading(true);
  }

  // Focus Mode state (lazy initialized from localStorage)
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('lingo_listening_focus_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lingo_listening_focus_mode', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const handleExitFocusMode = useCallback(() => {
    setIsFocusMode(false);
    try {
      localStorage.setItem('lingo_listening_focus_mode', 'false');
    } catch {
      // Ignore
    }
  }, []);

  // Load video detail on demand
  useEffect(() => {
    let isMounted = true;

    loadListeningVideoById(videoId)
      .then((data) => {
        if (isMounted) {
          setVideo(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setVideo(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  // Player state
  const playerHandleRef = useRef<YouTubePlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState<number>(-1);
  const isPlaying = playerState === 1;

  // Listening settings
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleDisplayMode>('bilingual');
  const [isLoopingCue, setIsLoopingCue] = useState(false);
  const [loopRange, setLoopRange] = useState<{ start: number; end: number } | null>(null);

  // Throttle refs for watch progress persistence
  const lastSavedPercentRef = useRef<number>(-1);
  const lastSaveTimestampRef = useRef<number>(0);

  // Active cues list wrapped in useMemo
  const cues = useMemo(() => video?.transcript || [], [video?.transcript]);
  const activeCueIdx = findActiveCueIndex(cues, currentTime);

  // Persist watch progress to localStorage via saveVideoWatchProgress with Sticky Completion Invariant
  const persistWatchProgress = useCallback(
    (time: number, state?: number, force = false) => {
      if (!video || !video.duration || video.duration <= 0) return;

      const pct = Math.min(100, Math.max(0, Math.round((time / video.duration) * 100)));
      const now = Date.now();
      const isEnded = state === 0;
      const isCompletionEdge = pct >= 90 && lastSavedPercentRef.current < 90;
      const isThrottled = now - lastSaveTimestampRef.current >= 2000;

      if (
        force ||
        isEnded ||
        isCompletionEdge ||
        pct === 100 ||
        (pct !== lastSavedPercentRef.current && isThrottled)
      ) {
        lastSavedPercentRef.current = pct;
        lastSaveTimestampRef.current = now;

        saveVideoWatchProgress({
          videoId: video.id,
          currentTime: time,
          duration: video.duration,
          percent: pct,
          playerState: state,
          completed: isEnded || pct >= 90,
        });
      }
    },
    [video]
  );

  // Flush watch progress on unmount
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        persistWatchProgress(currentTime, undefined, true);
      }
    };
  }, [currentTime, persistWatchProgress]);

  // Time update callback from YouTubeListeningPlayer (100ms interval)
  const handleTimeUpdate = useCallback(
    (t: number) => {
      setCurrentTime(t);
      persistWatchProgress(t);
    },
    [persistWatchProgress]
  );

  // State change callback from player
  const handleStateChange = useCallback(
    (state: number) => {
      setPlayerState(state);
      // If paused (2) or ended (0), flush watch progress immediately
      if (state === 2 || state === 0) {
        persistWatchProgress(currentTime, state, true);
      }
    },
    [currentTime, persistWatchProgress]
  );

  // Seek helper
  const handleSeek = useCallback((seconds: number, playImmediate = true) => {
    playerHandleRef.current?.seekTo(seconds, playImmediate);
  }, []);

  // Play/Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      playerHandleRef.current?.pause();
    } else {
      playerHandleRef.current?.play();
    }
  }, [isPlaying]);

  // Previous Sentence logic:
  // If > 2.0s into active cue, restart current cue; else go to preceding cue
  const handlePrevSentence = useCallback(() => {
    if (!cues.length) return;
    const currentIdx = activeCueIdx >= 0 ? activeCueIdx : 0;
    const currentCue = cues[currentIdx];

    if (currentCue && currentTime - currentCue.start > 2.0) {
      handleSeek(currentCue.start, true);
    } else {
      const prevIdx = Math.max(0, currentIdx - 1);
      handleSeek(cues[prevIdx].start, true);
    }
  }, [cues, activeCueIdx, currentTime, handleSeek]);

  // Repeat current sentence
  const handleRepeatSentence = useCallback(() => {
    if (!cues.length) return;
    const currentIdx = activeCueIdx >= 0 ? activeCueIdx : 0;
    const currentCue = cues[currentIdx];
    if (currentCue) {
      handleSeek(currentCue.start, true);
    }
  }, [cues, activeCueIdx, handleSeek]);

  // Next sentence logic
  const handleNextSentence = useCallback(() => {
    if (!cues.length) return;
    const currentIdx = activeCueIdx >= 0 ? activeCueIdx : 0;
    const nextIdx = Math.min(cues.length - 1, currentIdx + 1);
    handleSeek(cues[nextIdx].start, true);
  }, [cues, activeCueIdx, handleSeek]);

  // A-B Loop toggle:
  // If looping is turned ON and no loopRange is active, bind to the currently active cue
  const handleToggleLoop = useCallback(() => {
    setIsLoopingCue((prev) => {
      const nextState = !prev;
      if (nextState) {
        if (!loopRange && activeCueIdx >= 0 && cues[activeCueIdx]) {
          const cue = cues[activeCueIdx];
          setLoopRange({ start: cue.start, end: cue.end });
        }
      } else {
        setLoopRange(null);
      }
      return nextState;
    });
  }, [loopRange, activeCueIdx, cues]);

  // Speed changer
  const handleChangePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playerHandleRef.current?.setPlaybackRate(rate);
  }, []);

  // Speed cycle: 0.75x -> 1.0x -> 1.25x -> 0.75x
  const handleCycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      let next = 1.0;
      if (prev === 0.75) next = 1.0;
      else if (prev === 1.0) next = 1.25;
      else next = 0.75;
      playerHandleRef.current?.setPlaybackRate(next);
      return next;
    });
  }, []);

  // Keyboard Shortcuts Hook integration with strict input shielding
  useListeningShortcuts({
    onTogglePlay: handleTogglePlay,
    onPrevSentence: handlePrevSentence,
    onNextSentence: handleNextSentence,
    onToggleLoop: handleToggleLoop,
    onCycleSpeed: handleCycleSpeed,
    onToggleFocusMode: handleExitFocusMode,
    isEnabled: !isLoading && !!video,
  });

  // Dedicated Esc keyboard shortcut listener to exit Focus Mode instantly
  useEffect(() => {
    if (!isFocusMode) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        handleExitFocusMode();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode, handleExitFocusMode]);

  // 1. SKELETON LOADING STATE (Avoids layout shift during on-demand dynamic detail load)
  if (isLoading) {
    return (
      <StudentShell title="Đang tải video luyện nghe..." requireAuth={false}>
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 animate-pulse">
          {/* Breadcrumb Skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-12 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          {/* Main 2-Column Skeleton */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Player + Controls + Metadata */}
            <div className="space-y-4 lg:col-span-7">
              <div className="relative aspect-video w-full rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Headphones className="h-12 w-12 text-slate-300 dark:text-slate-700 animate-bounce" />
              </div>
              <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Right Column: Synced Transcript Skeleton */}
            <div className="flex flex-col lg:col-span-5 h-[550px] sm:h-[650px] lg:h-[750px] space-y-3">
              <div className="flex-1 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/60 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl bg-white p-3.5 shadow-xs dark:bg-slate-800"
                  >
                    <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3.5 w-3/5 rounded bg-slate-100 dark:bg-slate-700/60" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StudentShell>
    );
  }

  // 2. 404 FRIENDLY STATE (Video ID not found)
  if (!video) {
    return (
      <StudentShell title="Không tìm thấy video">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <Headphones className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Không tìm thấy video luyện nghe
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Video với mã nhận diện &ldquo;{videoId}&rdquo; không tồn tại hoặc đã được chuyển sang danh mục khác.
          </p>
          <div className="mt-6">
            <Link
              href="/practice/listening"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại thư viện video</span>
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  const topicColor = getTopicBadgeColor(video.topic);
  const cefrStyle = getCefrBadgeStyle(video.cefrLevel);

  return (
    <StudentShell
      title="Luyện nghe Video"
      requireAuth={false}
      immersive={isFocusMode}
    >
      <div
        className={
          isFocusMode
            ? 'w-full max-w-[1850px] mx-auto px-3 py-2 sm:px-6 sm:py-3 transition-all duration-300'
            : 'mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 transition-all duration-300'
        }
      >
        {/* Navigation & Focus Mode Control Header */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/practice/listening"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Thư viện luyện nghe</span>
            </Link>

            {isFocusMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-black text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Chế độ tập trung
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${topicColor.bg} ${topicColor.text} ${topicColor.border}`}
            >
              {getTopicDisplayName(video.topic)}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-black ${cefrStyle.bg} ${cefrStyle.text} ${cefrStyle.border}`}
            >
              {video.cefrLevel}
            </span>

            {/* Focus Mode Toggle Button with Prominent Exit and Esc Badge */}
            <button
              type="button"
              onClick={handleToggleFocusMode}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isFocusMode
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
              title={
                isFocusMode
                  ? 'Thoát chế độ tập trung (Phím Esc)'
                  : 'Bật chế độ tập trung toàn màn hình'
              }
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Thoát tập trung</span>
                  <kbd className="inline-flex items-center justify-center rounded bg-indigo-700/90 px-1.5 py-0.5 text-[10px] font-mono text-indigo-100 shadow-inner">
                    Esc
                  </kbd>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Chế độ tập trung</span>
                  <span className="sm:hidden">Tập trung</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Grid: Left Column (Player & Controls) | Right Column (Dedicated Synced Transcript) */}
        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-12 ${
            isFocusMode ? 'lg:h-[calc(100vh-80px)]' : ''
          }`}
        >
          {/* Left Column: Video Player & Listening Controls (7 cols on lg) */}
          <div
            className={`space-y-4 lg:col-span-7 ${
              isFocusMode ? 'flex flex-col lg:h-[calc(100vh-80px)] lg:overflow-y-auto pr-1' : ''
            }`}
          >
            {/* Native YouTube Listening Player Container - Sticky on mobile viewports so user never loses sight of video */}
            <div className="sticky top-0 z-20 -mx-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent rounded-2xl">
              <YouTubeListeningPlayer
                ref={playerHandleRef}
                videoId={video.youtubeId}
                playbackRate={playbackRate}
                isLoopingCue={isLoopingCue}
                loopRange={loopRange}
                onTimeUpdate={handleTimeUpdate}
                onStateChange={handleStateChange}
              />
            </div>

            {/* Listening Playback Controls with Shortcut Badges */}
            <ListeningControls
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onPrevSentence={handlePrevSentence}
              onRepeatSentence={handleRepeatSentence}
              onNextSentence={handleNextSentence}
              isLoopingCue={isLoopingCue}
              onToggleLoop={handleToggleLoop}
              playbackRate={playbackRate}
              onChangePlaybackRate={handleChangePlaybackRate}
              subtitleMode={subtitleMode}
              onChangeSubtitleMode={setSubtitleMode}
              currentTime={currentTime}
              duration={video.duration}
            />

            {/* Video Metadata Card (Compact in Focus Mode) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <h1 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">
                {video.title}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {video.channel}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {video.durationDisplay}
                </span>
                <span>•</span>
                <span>{video.transcript.length} câu phụ đề</span>
              </div>
              {!isFocusMode && (
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {video.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: 100% Dedicated Synced Transcript Container (5 cols on lg) */}
          <div
            className={`flex flex-col lg:col-span-5 ${
              isFocusMode
                ? 'h-[calc(100vh-80px)] max-h-[calc(100vh-80px)]'
                : 'h-[550px] sm:h-[650px] lg:h-[750px]'
            }`}
          >
            <SyncedTranscript
              cues={video.transcript}
              currentTime={currentTime}
              onSeek={handleSeek}
              coreVocabulary={video.coreVocabulary}
              subtitleMode={subtitleMode}
              isLoopingCue={isLoopingCue}
              onToggleLoop={handleToggleLoop}
              loopRange={loopRange}
              onSetLoopRange={setLoopRange}
              className="h-full flex-1"
            />
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
