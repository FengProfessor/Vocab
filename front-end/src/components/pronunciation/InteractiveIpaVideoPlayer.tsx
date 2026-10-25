'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Target,
  FastForward,
  Rewind,
} from 'lucide-react';
import type { RachelVideoMeta, InteractiveIpaVideoPlayerProps } from '@/types/pronunciation';
import { stopWordAudio } from '@/lib/audio';

export type { RachelVideoMeta, InteractiveIpaVideoPlayerProps };

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  getPlaybackRate: () => number;
  getAvailablePlaybackRates: () => number[];
  destroy?: () => void;
}

interface WindowWithYT {
  YT?: {
    Player: new (
      element: HTMLElement | string,
      options: {
        events?: {
          onReady?: (event: { target: YTPlayerInstance }) => void;
          onStateChange?: (event: { data: number }) => void;
          onError?: () => void;
        };
      }
    ) => YTPlayerInstance;
  };
  onYouTubeIframeAPIReady?: () => void;
}

// Singleton Promise to ensure the YouTube IFrame API script is only injected once
let ytIframeApiPromise: Promise<void> | null = null;

function loadYouTubeIFrameApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  const win = window as unknown as WindowWithYT;
  if (win.YT && win.YT.Player) {
    return Promise.resolve();
  }

  if (ytIframeApiPromise) {
    return ytIframeApiPromise;
  }

  ytIframeApiPromise = new Promise<void>((resolve) => {
    const existingCallback = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      if (typeof existingCallback === 'function') {
        existingCallback();
      }
      resolve();
    };

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return ytIframeApiPromise;
}

/**
 * Interactive IPA Video Player
 *
 * Dedicated articulation video player embedding Rachel's English General American
 * demonstration clips via privacy-enhanced YouTube domain (youtube-nocookie.com).
 *
 * Provides variable speed controls (0.5x, 0.75x, 1.0x), A-B segment looping,
 * instant replay, smooth collapsibility (<60px), and articulatory tip banner.
 */
export const InteractiveIpaVideoPlayer: React.FC<InteractiveIpaVideoPlayerProps> = ({
  video,
  ipa,
  title,
  compact = false,
  autoPlay = false,
  initialSpeed = 1.0,
  collapsible = true,
  defaultCollapsed = false,
  onPlay,
  onPause,
  onPlayStateChange,
  keyArticulationTip,
  videoId: propVideoId,
  startSeconds: propStartSeconds,
  endSeconds: propEndSeconds,
  className = '',
  hideHeader = false,
  cleanMode = true,
}) => {
  // ── 1. Unique DOM ID for YouTube Player instance without accessing ref in render ──
  const reactId = useId();
  const iframeId = `ipa-yt-player-${reactId.replace(/[:]/g, '')}`;

  // ── 2. Resolve props: Support both structured RachelVideoMeta and flat properties ──
  const resolvedVideoId = video?.youtubeVideoId || propVideoId || '';
  const resolvedStartSeconds =
    typeof video?.startSeconds === 'number'
      ? video.startSeconds
      : typeof propStartSeconds === 'number'
        ? propStartSeconds
        : 0;
  const resolvedEndSeconds =
    typeof video?.endSeconds === 'number'
      ? video.endSeconds
      : typeof propEndSeconds === 'number'
        ? propEndSeconds
        : 0;
  const resolvedTip = video?.videoTip || video?.mouthTipSummary || keyArticulationTip || '';
  const resolvedChannelName = video?.channelName || "Rachel's English";
  const resolvedTitle =
    title ||
    video?.clipTitle ||
    (ipa ? `Khẩu hình âm /${ipa}/` : "Thị phạm khẩu hình — Rachel's English");

  // ── 3. Component State with Prop Change Synchronization ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCleanMode, setIsCleanMode] = useState<boolean>(cleanMode);
  const [currentTime, setCurrentTime] = useState<number>(resolvedStartSeconds);
  const [duration, setDuration] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(initialSpeed || 1.0);
  const [prevInitialSpeed, setPrevInitialSpeed] = useState<number | undefined>(initialSpeed);
  if (initialSpeed !== prevInitialSpeed) {
    setPrevInitialSpeed(initialSpeed);
    if (initialSpeed && [0.5, 0.75, 1.0].includes(initialSpeed)) {
      setCurrentSpeed(initialSpeed);
    }
  }

  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed || false);
  const [prevDefaultCollapsed, setPrevDefaultCollapsed] = useState<boolean | undefined>(defaultCollapsed);
  if (defaultCollapsed !== prevDefaultCollapsed) {
    setPrevDefaultCollapsed(defaultCollapsed);
    setIsCollapsed(defaultCollapsed || false);
  }

  const [hasError, setHasError] = useState<boolean>(false);

  // Time formatter helper (e.g. 75 -> 1:15)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Derive origin directly without cascading render effects
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost:3000';

  // DOM & Player References
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mutable callback refs to prevent stale closure traps in async intervals
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onPlayStateChangeRef = useRef(onPlayStateChange);
  const isLoopingRef = useRef(isLooping);

  // Synchronize callback refs outside render body (React 19 compliant)
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onPlayStateChangeRef.current = onPlayStateChange;
    isLoopingRef.current = isLooping;
  }, [onPlay, onPause, onPlayStateChange, isLooping]);

  // ── 4. Privacy-Enhanced Embed URL Construction ──
  const embedUrl = useMemo(() => {
    if (!resolvedVideoId) return '';
    const base = `https://www.youtube-nocookie.com/embed/${resolvedVideoId}`;
    const params = new URLSearchParams({
      enablejsapi: '1',
      playsinline: '1',
      rel: '0',
      controls: isCleanMode ? '0' : '1',
      iv_load_policy: isCleanMode ? '3' : '1',
      disablekb: isCleanMode ? '1' : '0',
      fs: isCleanMode ? '0' : '1',
      modestbranding: '1',
      origin,
      start: String(Math.floor(resolvedStartSeconds)),
      cc_load_policy: '1',
      cc_lang_pref: 'vi',
      hl: 'vi',
    });
    if (autoPlay) {
      params.set('autoplay', '1');
    }
    return `${base}?${params.toString()}`;
  }, [resolvedVideoId, resolvedStartSeconds, origin, autoPlay, isCleanMode]);

  const youtubeDirectWatchUrl = useMemo(() => {
    if (!resolvedVideoId) return '#';
    return `https://www.youtube.com/watch?v=${resolvedVideoId}&t=${Math.floor(resolvedStartSeconds)}s&hl=vi`;
  }, [resolvedVideoId, resolvedStartSeconds]);

  // ── 5. YouTube postMessage Command Dispatcher ──
  const sendIframeCommand = useCallback(
    (func: string, args: (string | number | boolean)[] = []) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*'
        );
      }
    },
    []
  );

  // ── 6. Continuous Loop Check ──
  const checkLoopBoundary = useCallback(
    (time: number) => {
      if (!isLoopingRef.current) return;
      if (
        resolvedEndSeconds > resolvedStartSeconds &&
        (time >= resolvedEndSeconds - 0.05 || (time > 0 && time < resolvedStartSeconds - 1))
      ) {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          try {
            playerRef.current.seekTo(resolvedStartSeconds, true);
            playerRef.current.playVideo();
          } catch {}
        }
        sendIframeCommand('seekTo', [resolvedStartSeconds, true]);
        sendIframeCommand('playVideo');
      }
    },
    [resolvedStartSeconds, resolvedEndSeconds, sendIframeCommand]
  );

  // Start / Stop Polling Interval
  const startLoopMonitoring = useCallback(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
    }
    loopIntervalRef.current = setInterval(() => {
      let cur = -1;
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          cur = playerRef.current.getCurrentTime();
        } catch {}
      }
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        try {
          const d = playerRef.current.getDuration();
          if (d > 0) {
            setDuration(d);
          }
        } catch {}
      }
      if (cur >= 0) {
        setCurrentTime(cur);
        checkLoopBoundary(cur);
      }
    }, 150);
  }, [checkLoopBoundary]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      let targetSec = 0;
      if (isLooping && resolvedEndSeconds > resolvedStartSeconds) {
        targetSec = resolvedStartSeconds + ratio * (resolvedEndSeconds - resolvedStartSeconds);
      } else {
        const maxSec = duration > 0 ? duration : Math.max(resolvedEndSeconds + 300, 600);
        targetSec = ratio * maxSec;
      }
      setCurrentTime(targetSec);
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(targetSec, true);
        } catch {}
      }
      sendIframeCommand('seekTo', [targetSec, true]);
    },
    [isLooping, resolvedStartSeconds, resolvedEndSeconds, duration, sendIframeCommand]
  );

  const stopLoopMonitoring = useCallback(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
  }, []);

  // ── 7. State Change Handler (Audio Coordination + Callbacks) ──
  const handlePlayerStateChange = useCallback(
    (state: number) => {
      // 1: PLAYING
      if (state === 1) {
        setIsPlaying(true);
        // Audio coordination: silence single word audio/TTS when articulation video starts
        stopWordAudio();
        onPlayRef.current?.();
        onPlayStateChangeRef.current?.(true);
        startLoopMonitoring();
      }
      // 2: PAUSED
      else if (state === 2) {
        setIsPlaying(false);
        onPauseRef.current?.();
        onPlayStateChangeRef.current?.(false);
        stopLoopMonitoring();
      }
      // 0: ENDED
      else if (state === 0) {
        if (isLoopingRef.current) {
          if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            try {
              playerRef.current.seekTo(resolvedStartSeconds, true);
              playerRef.current.playVideo();
            } catch {}
          }
          sendIframeCommand('seekTo', [resolvedStartSeconds, true]);
          sendIframeCommand('playVideo');
        } else {
          setIsPlaying(false);
          onPauseRef.current?.();
          onPlayStateChangeRef.current?.(false);
          stopLoopMonitoring();
        }
      }
    },
    [resolvedStartSeconds, sendIframeCommand, startLoopMonitoring, stopLoopMonitoring]
  );

  // ── 8. Initialize YouTube Player via IFrame API ──
  useEffect(() => {
    if (!resolvedVideoId) return;

    let isMounted = true;
    loadYouTubeIFrameApi()
      .then(() => {
        const win = window as unknown as WindowWithYT;
        if (!isMounted || !win.YT || !win.YT.Player) return;
        const iframeElement = iframeRef.current;
        if (!iframeElement) return;

        try {
          const ytPlayer = new win.YT.Player(iframeElement, {
            events: {
              onReady: (event: { target: YTPlayerInstance }) => {
                if (!isMounted) return;
                playerRef.current = event.target;
                try {
                  const d = event.target.getDuration?.();
                  if (d && d > 0) {
                    setDuration(d);
                  }
                } catch {}
                if (currentSpeed !== 1.0) {
                  event.target.setPlaybackRate(currentSpeed);
                }
                try {
                  const anyPlayer = event.target as unknown as {
                    loadModule?: (mod: string) => void;
                    setOption?: (mod: string, opt: string, val: unknown) => void;
                  };
                  if (typeof anyPlayer.loadModule === 'function') {
                    anyPlayer.loadModule('captions');
                  }
                  if (typeof anyPlayer.setOption === 'function') {
                    anyPlayer.setOption('captions', 'track', { languageCode: 'vi' });
                    anyPlayer.setOption('captions', 'translationLanguage', { languageCode: 'vi' });
                  }
                } catch {}
              },
              onStateChange: (event: { data: number }) => {
                if (!isMounted) return;
                handlePlayerStateChange(event.data);
              },
              onError: () => {
                if (!isMounted) return;
                setHasError(true);
              },
            },
          });
          playerRef.current = ytPlayer;
        } catch {
          // Fall back gracefully to postMessage control
        }
      })
      .catch(() => {
        // Fall back gracefully to postMessage
      });

    return () => {
      isMounted = false;
      stopLoopMonitoring();
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [resolvedVideoId, handlePlayerStateChange, stopLoopMonitoring, currentSpeed]);

  // ── 9. Listen to postMessage events from YouTube iframe ──
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === 'string'
            ? (JSON.parse(event.data) as Record<string, unknown>)
            : (event.data as Record<string, unknown>);
        if (!data) return;

        if (data.event === 'onStateChange') {
          const state = typeof data.info === 'number' ? data.info : Number(data.info);
          handlePlayerStateChange(state);
        } else if (data.event === 'infoDelivery' && data.info && typeof data.info === 'object') {
          const info = data.info as Record<string, unknown>;
          if (typeof info.playerState === 'number') {
            handlePlayerStateChange(info.playerState);
          }
          if (typeof info.currentTime === 'number') {
            checkLoopBoundary(info.currentTime);
          }
        }
      } catch {
        // Ignore non-YouTube messages
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [handlePlayerStateChange, checkLoopBoundary]);

  // ── 9.5 Listen to external pause requests (Audio Coordination) ──
  useEffect(() => {
    const handleExternalPause = () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      sendIframeCommand('pauseVideo');
      setIsPlaying(false);
      onPauseRef.current?.();
      onPlayStateChangeRef.current?.(false);
      stopLoopMonitoring();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lingopro:pause-ipa-video', handleExternalPause);
      return () => window.removeEventListener('lingopro:pause-ipa-video', handleExternalPause);
    }
  }, [sendIframeCommand, stopLoopMonitoring]);

  // ── 10. User Action Handlers ──

  // Variable Speed Selector (0.5x, 0.75x, 1.0x)
  const handleSetSpeed = useCallback(
    (rate: number) => {
      setCurrentSpeed(rate);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try {
          playerRef.current.setPlaybackRate(rate);
        } catch {}
      }
      sendIframeCommand('setPlaybackRate', [rate]);
    },
    [sendIframeCommand]
  );

  // Play / Pause Toggle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      sendIframeCommand('pauseVideo');
      setIsPlaying(false);
      onPauseRef.current?.();
      onPlayStateChangeRef.current?.(false);
      stopLoopMonitoring();
    } else {
      stopWordAudio();
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        try {
          playerRef.current.playVideo();
        } catch {}
      }
      sendIframeCommand('playVideo');
      setIsPlaying(true);
      onPlayRef.current?.();
      onPlayStateChangeRef.current?.(true);
      startLoopMonitoring();
    }
  }, [isPlaying, sendIframeCommand, startLoopMonitoring, stopLoopMonitoring]);

  // Instant Replay Clip (Jumps back to startSeconds and plays)
  const handleReplayClip = useCallback(() => {
    stopWordAudio();
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(resolvedStartSeconds, true);
        playerRef.current.playVideo();
      } catch {}
    }
    sendIframeCommand('seekTo', [resolvedStartSeconds, true]);
    sendIframeCommand('playVideo');
    setIsPlaying(true);
    onPlayRef.current?.();
    onPlayStateChangeRef.current?.(true);
    startLoopMonitoring();
  }, [resolvedStartSeconds, sendIframeCommand, startLoopMonitoring]);

  // Jump to 0:00 (Start of full lecture from the beginning)
  const handleJumpToStart = useCallback(() => {
    stopWordAudio();
    const target = 0;
    setCurrentTime(target);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(target, true);
        playerRef.current.playVideo();
      } catch {}
    }
    sendIframeCommand('seekTo', [target, true]);
    sendIframeCommand('playVideo');
    setIsPlaying(true);
    onPlayRef.current?.();
    onPlayStateChangeRef.current?.(true);
    startLoopMonitoring();
  }, [sendIframeCommand, startLoopMonitoring]);

  // Relative Skip (-15s / +15s)
  const handleSkip = useCallback(
    (delta: number) => {
      stopWordAudio();
      const maxSec = duration > 0 ? duration : Math.max(resolvedEndSeconds + 300, 600);
      let target = currentTime + delta;
      if (target < 0) target = 0;
      if (target > maxSec) target = maxSec;
      setCurrentTime(target);
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(target, true);
        } catch {}
      }
      sendIframeCommand('seekTo', [target, true]);
    },
    [currentTime, duration, resolvedEndSeconds, sendIframeCommand]
  );

  // A-B Segment Looping Toggle
  const handleToggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (next && isPlaying) {
        startLoopMonitoring();
      }
      return next;
    });
  }, [isPlaying, startLoopMonitoring]);

  // ── 11. Fallback UI when Video ID is missing ──
  if (!resolvedVideoId) {
    return (
      <div
        className={`w-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center text-zinc-600 dark:text-zinc-400 text-xs ${className}`}
      >
        <p className="font-semibold">Chưa có video thị phạm cho bài học này.</p>
      </div>
    );
  }

  // ── 12. Render Component ──
  return (
    <div
      className={`w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-300 ${
        compact ? 'p-2 sm:p-3' : 'p-3 sm:p-5'
      } ${className}`}
    >
      {/* Collapsed Sticky / Compact Bar (< 60px height) */}
      {isCollapsed ? (
        <div className="flex items-center justify-between gap-2 h-12 max-h-[52px] w-full px-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs">
              {resolvedChannelName}
            </span>
            <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
              {resolvedTitle}
            </span>
            {ipa && (
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                /{ipa}/
              </span>
            )}
            <span
              className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isPlaying
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}
              />
              {isPlaying ? 'Đang phát' : 'Đã tạm dừng'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReplayClip}
              title="Xem lại đoạn thị phạm"
              aria-label="Xem lại đoạn thị phạm"
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">Xem lại</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="min-h-[44px] min-w-[44px] px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 shadow-xs transition-all"
              aria-label="Mở rộng video bài giảng"
            >
              <span>Mở rộng</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : !hideHeader ? (
        /* Header Bar: Channel Branding, Title & Collapse Button */
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-red-600 text-white shadow-xs">
              {resolvedChannelName}
            </span>
            <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
              {resolvedTitle}
            </h4>
            {ipa && (
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                /{ipa}/
              </span>
            )}
          </div>

          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="Thu gọn video để tối ưu diện tích luyện tập"
              aria-label="Thu gọn video bài giảng"
              className="min-h-[44px] px-3 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-all shrink-0"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">Thu gọn</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Persistent Single YouTube Player Container (Preserved across collapse toggles) */}
      <div
        className={
          isCollapsed
            ? "h-0 w-0 overflow-hidden opacity-0 pointer-events-none absolute -z-50"
            : `relative aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg ${hideHeader ? 'mt-0' : 'mt-3'}`
        }
      >
        <iframe
          ref={iframeRef}
          id={iframeId}
          src={embedUrl}
          title={resolvedTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />

        {/* Error Fallback when iframe is blocked or fails */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-zinc-950/95 text-white text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="font-bold text-sm">Không thể tải khung phát video YouTube</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Trình duyệt hoặc phần mềm bảo vệ có thể đã chặn iframe. Bạn có thể mở trực tiếp bài giảng trên YouTube:
            </p>
            <a
              href={youtubeDirectWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Mở trên YouTube</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Sleek Progress Bar for Seeking */}
      {!isCollapsed && (
        <div className="mt-2 px-0.5 space-y-1">
          {(() => {
            const maxSec = duration > 0 ? duration : Math.max(resolvedEndSeconds + 300, 600);
            const progressPercent = isLooping && resolvedEndSeconds > resolvedStartSeconds
              ? Math.min(100, Math.max(0, ((currentTime - resolvedStartSeconds) / Math.max(1, resolvedEndSeconds - resolvedStartSeconds)) * 100))
              : Math.min(100, Math.max(0, (currentTime / maxSec) * 100));

            return (
              <>
                <div
                  onClick={handleSeek}
                  className="group relative h-2 w-full bg-muted rounded-full cursor-pointer overflow-hidden transition-all hover:h-2.5"
                  title="Bấm để tua video bài giảng"
                >
                  {/* Articulation Segment Marker on Full Video Timeline */}
                  {!isLooping && resolvedEndSeconds > resolvedStartSeconds && maxSec > 0 && (
                    <div
                      className="absolute top-0 bottom-0 bg-amber-400/50 dark:bg-amber-300/50 rounded-xs z-0"
                      style={{
                        left: `${(resolvedStartSeconds / maxSec) * 100}%`,
                        width: `${Math.max(1.5, ((resolvedEndSeconds - resolvedStartSeconds) / maxSec) * 100)}%`,
                      }}
                      title={`Đoạn thị phạm khẩu hình: ${formatTime(resolvedStartSeconds)} - ${formatTime(resolvedEndSeconds)}`}
                    />
                  )}
                  {/* Active Played Fill Bar */}
                  <div
                    className={`h-full ${
                      isLooping
                        ? 'bg-emerald-500'
                        : 'bg-primary'
                    } rounded-full transition-all duration-100 relative z-10`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      {formatTime(currentTime)}
                    </span>
                    <span>/</span>
                    <span>{formatTime(maxSec)}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-sans">
                      CC Vi
                    </span>
                    {isLooping && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white font-sans">
                        Lặp [A-B]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground hidden sm:inline">🎯 Khẩu hình:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                      {formatTime(resolvedStartSeconds)} - {formatTime(resolvedEndSeconds)}
                    </span>
                    <a
                      href={youtubeDirectWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 ml-1 transition-colors"
                      title="Mở trên YouTube"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Unified Compact Controls Toolbar */}
      {!isCollapsed && (
        <div className="space-y-2 mt-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
            {/* Left controls: Play/Pause, Key Segments, Loop */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Tạm dừng video' : 'Phát video bài giảng'}
                aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video bài giảng'}
                className="h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
              </button>

              <button
                type="button"
                onClick={handleReplayClip}
                title={`Tua đến giây khẩu hình (${formatTime(resolvedStartSeconds)})`}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40 transition-all flex items-center gap-1"
              >
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Khẩu hình</span>
              </button>

              <button
                type="button"
                onClick={handleJumpToStart}
                title="Tua về đầu video (0:00)"
                className="h-8 px-2 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>0:00</span>
              </button>

              <button
                type="button"
                onClick={handleToggleLoop}
                title={isLooping ? 'Tắt lặp khẩu hình' : 'Lặp đoạn khẩu hình [A-B]'}
                className={`h-8 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  isLooping
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'animate-pulse' : ''}`} />
                <span>Lặp</span>
              </button>
            </div>

            {/* Right controls: Speed presets & Clean toggle */}
            <div className="flex items-center gap-1.5">
              {/* Playback speed: 0.5x, 0.75x, 1x */}
              <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border/50">
                {[
                  { rate: 0.5, label: '0.5x' },
                  { rate: 0.75, label: '0.75x' },
                  { rate: 1.0, label: '1x' },
                ].map(({ rate, label }) => {
                  const isActive = Math.abs(currentSpeed - rate) < 0.01;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSetSpeed(rate)}
                      className={`h-7 px-2 rounded text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Clean Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsCleanMode(!isCleanMode)}
                title={isCleanMode ? 'Chế độ sạch (Ẩn thanh YouTube)' : 'Hiện thanh YouTube gốc'}
                className={`h-8 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  isCleanMode
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span className="text-[11px]">{isCleanMode ? 'Sạch' : 'Gốc'}</span>
              </button>
            </div>
          </div>

          {/* Compact 1-line Articulatory Tip (if not hideHeader) */}
          {!hideHeader && resolvedTip && (
            <div className="rounded-lg p-2.5 bg-amber-500/10 border border-amber-300/30 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2">
                <span className="font-bold mr-1">Mẹo khẩu hình:</span>
                {resolvedTip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveIpaVideoPlayer;

/**
 * Coordinate audio across the application by requesting any active IPA articulation
 * video player to pause playback. Also dispatches postMessage directly to YouTube iframes.
 */
export function pauseIpaVideo(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('lingopro:pause-ipa-video'));
  try {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube"]');
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
    });
  } catch {}
}
