'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Headphones,
  FileText,
  Pencil,
  CheckSquare,
  BookOpen,
  Clock,
  Volume2,
  BookmarkPlus,
  Check,
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
  YouTubeListeningPlayer,
  type YouTubePlayerHandle,
} from '@/components/listening/YouTubeListeningPlayer';
import { ListeningControls } from '@/components/listening/ListeningControls';
import { SyncedTranscript } from '@/components/listening/SyncedTranscript';
import { ClozeListeningExercise } from '@/components/listening/ClozeListeningExercise';
import { ComprehensionQuiz } from '@/components/listening/ComprehensionQuiz';
import { MobileSubtitleDrawer } from '@/components/listening/MobileSubtitleDrawer';
import { useListeningShortcuts } from '@/hooks/useListeningShortcuts';
import { playWordAudio } from '@/lib/audio';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import type { SubtitleDisplayMode, ListeningVideo } from '@/types/listening';

type ActiveTab = 'transcript' | 'cloze' | 'quiz' | 'vocab';

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

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('transcript');

  // Vocab saving tracking for the vocab tab
  const [savedVocabMap, setSavedVocabMap] = useState<Record<string, boolean>>({});

  // Throttle refs for watch progress persistence
  const lastSavedPercentRef = useRef<number>(-1);
  const lastSaveTimestampRef = useRef<number>(0);

  // Initialize saved words from localStorage and listen to cross-component sync
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
        if (Array.isArray(localWords)) {
          const map: Record<string, boolean> = {};
          localWords.forEach((w) => {
            map[w.toLowerCase()] = true;
          });
          setSavedVocabMap(map);
        }
      } catch {
        // Ignore
      }
    }, 0);

    function handleWordSavedEvent(e: Event) {
      const customEvt = e as CustomEvent<{ word: string }>;
      const savedWord = customEvt.detail?.word?.toLowerCase();
      if (savedWord) {
        setSavedVocabMap((prev) => ({ ...prev, [savedWord]: true }));
      }
    }

    window.addEventListener('lingo_word_saved', handleWordSavedEvent);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('lingo_word_saved', handleWordSavedEvent);
    };
  }, []);

  // Re-sync saved words when switching to the vocab tab
  useEffect(() => {
    if (activeTab === 'vocab') {
      const timer = setTimeout(() => {
        try {
          const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
          if (Array.isArray(localWords)) {
            const map: Record<string, boolean> = {};
            localWords.forEach((w) => {
              map[w.toLowerCase()] = true;
            });
            setSavedVocabMap((prev) => ({ ...prev, ...map }));
          }
        } catch {
          // Ignore
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Active cues list wrapped in useMemo
  const cues = useMemo(() => video?.transcript || [], [video?.transcript]);
  const activeCueIdx = findActiveCueIndex(cues, currentTime);

  // Persist watch progress to localStorage under 'lingo_listening_watch_${videoId}'
  const persistWatchProgress = useCallback(
    (time: number, force = false) => {
      if (!video || !video.duration || video.duration <= 0) return;

      const pct = Math.min(100, Math.max(0, Math.round((time / video.duration) * 100)));
      const now = Date.now();

      if (
        force ||
        (pct !== lastSavedPercentRef.current && now - lastSaveTimestampRef.current >= 2000) ||
        pct === 100
      ) {
        lastSavedPercentRef.current = pct;
        lastSaveTimestampRef.current = now;
        try {
          const payload = {
            percent: pct,
            currentTime: Math.round(time * 10) / 10,
            duration: Math.round(video.duration * 10) / 10,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem(`lingo_listening_watch_${video.id}`, JSON.stringify(payload));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lingo_listening_watch_updated', {
                detail: { videoId: video.id, percent: pct },
              })
            );
          }
        } catch {
          // Ignore localStorage errors
        }
      }
    },
    [video]
  );

  // Flush watch progress on unmount
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        persistWatchProgress(currentTime, true);
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
      // If paused or ended, flush watch progress immediately
      if (state === 2 || state === 0) {
        persistWatchProgress(currentTime, true);
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
    onToggleFocusMode: () => {
      if (isFocusMode) {
        setIsFocusMode(false);
        try {
          localStorage.setItem('lingo_listening_focus_mode', 'false');
        } catch {}
      }
    },
    isEnabled: !isLoading && !!video,
  });

  // Save core vocab item
  const handleSaveVocabItem = async (word: string, translation: string) => {
    const key = word.toLowerCase();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, translation }),
        });
      }

      try {
        const localWords: string[] = JSON.parse(localStorage.getItem('lingo_saved_words') || '[]');
        if (!localWords.includes(key)) {
          localWords.push(key);
          localStorage.setItem('lingo_saved_words', JSON.stringify(localWords));
        }
      } catch {}

      setSavedVocabMap((prev) => ({ ...prev, [key]: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word: key } }));
      }
    } catch {
      setSavedVocabMap((prev) => ({ ...prev, [key]: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word: key } }));
      }
    }
  };

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

            {/* Right Column: Tab Bar + Transcript Cues Skeleton */}
            <div className="flex flex-col lg:col-span-5 h-[650px] lg:h-[750px] space-y-3">
              <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
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
            ? 'w-full max-w-[1750px] mx-auto px-3 py-3 sm:px-6 sm:py-4 transition-all duration-300'
            : 'mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 pb-28 transition-all duration-300'
        }
      >
        {/* Navigation & Focus Mode Control Header */}
        <div className="mb-3.5 flex items-center justify-between gap-3">
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

            {/* Focus Mode Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFocusMode}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isFocusMode
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
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
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Thoát tập trung</span>
                  <kbd className="hidden sm:inline rounded bg-indigo-700/80 px-1 py-0.5 text-[9px] font-mono text-indigo-100">
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

        {/* Main Grid: Left Column (Player & Controls) | Right Column (Tabs Workspace) */}
        <div
          className={`grid grid-cols-1 gap-6 lg:grid-cols-12 ${
            isFocusMode ? 'min-h-[calc(100vh-90px)]' : ''
          }`}
        >
          {/* Left Column: Video Player & Listening Controls (7 cols on lg) */}
          <div
            className={`space-y-4 lg:col-span-7 ${
              isFocusMode ? 'flex flex-col justify-start' : ''
            }`}
          >
            {/* Native YouTube Listening Player */}
            <YouTubeListeningPlayer
              ref={playerHandleRef}
              videoId={video.youtubeId}
              playbackRate={playbackRate}
              isLoopingCue={isLoopingCue}
              loopRange={loopRange}
              onTimeUpdate={handleTimeUpdate}
              onStateChange={handleStateChange}
            />

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

          {/* Right Column: Multi-Tab Interactive Workspace (5 cols on lg, full viewport height in focus mode) */}
          <div
            className={`flex flex-col lg:col-span-5 ${
              isFocusMode
                ? 'h-[calc(100vh-100px)] max-h-[calc(100vh-100px)]'
                : 'h-[650px] lg:h-[750px]'
            }`}
          >
            {/* Tab Bar Header */}
            <div className="mb-3 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === 'transcript'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Phụ đề ({video.transcript.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cloze')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === 'cloze'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Điền từ ({video.clozeItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Trắc nghiệm ({video.comprehensionQuestions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vocab')}
                className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold transition-all ${
                  activeTab === 'vocab'
                    ? 'bg-white text-indigo-700 shadow-xs dark:bg-indigo-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Từ vựng trọng tâm"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tab 1: Interactive Synced Transcript */}
            {activeTab === 'transcript' && (
              <div className="flex-1 overflow-hidden">
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
                />
              </div>
            )}

            {/* Tab 2: Cloze Fill-in-the-blank Exercise */}
            {activeTab === 'cloze' && (
              <div className="flex-1 overflow-y-auto">
                <ClozeListeningExercise
                  videoId={video.id}
                  items={video.clozeItems}
                  onSeekToTimestamp={(ts) => handleSeek(ts, true)}
                />
              </div>
            )}

            {/* Tab 3: Comprehension Quiz */}
            {activeTab === 'quiz' && (
              <div className="flex-1 overflow-y-auto">
                <ComprehensionQuiz
                  videoId={video.id}
                  questions={video.comprehensionQuestions}
                  onSeekToTimestamp={(ts) => handleSeek(ts, true)}
                />
              </div>
            )}

            {/* Tab 4: Core Vocabulary List */}
            {activeTab === 'vocab' && (
              <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Từ vựng trọng tâm ({video.coreVocabulary.length} từ)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Các từ vựng cốt lõi xuất hiện trong bài giảng
                  </p>
                </div>

                <div className="space-y-2.5">
                  {video.coreVocabulary.map((vocab) => {
                    const isSaved = !!savedVocabMap[vocab.word.toLowerCase()];
                    return (
                      <div
                        key={vocab.word}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {vocab.word}
                              </h4>
                              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                {vocab.phonetic}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {vocab.viDefinition}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => playWordAudio(vocab.word)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() => handleSaveVocabItem(vocab.word, vocab.viDefinition)}
                              className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-all ${
                                isSaved
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                              title="Lưu vào sổ từ cá nhân"
                            >
                              {isSaved ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <BookmarkPlus className="h-3.5 w-3.5" />
                              )}
                              <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                            </button>
                          </div>
                        </div>

                        {vocab.contextSentence && (
                          <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs italic text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                            &ldquo;{vocab.contextSentence}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Swipeable Subtitle Drawer (< lg screens) */}
        <MobileSubtitleDrawer
          cues={video.transcript}
          activeCueIndex={activeCueIdx}
          currentTime={currentTime}
          onSeek={handleSeek}
          subtitleMode={subtitleMode}
          onChangeSubtitleMode={setSubtitleMode}
          coreVocabulary={video.coreVocabulary}
          isLoopingCue={isLoopingCue}
          onToggleLoop={handleToggleLoop}
          loopRange={loopRange}
          onSetLoopRange={setLoopRange}
        />
      </div>
    </StudentShell>
  );
}
