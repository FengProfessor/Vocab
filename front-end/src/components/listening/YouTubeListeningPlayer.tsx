'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

/**
 * YouTube IFrame API Type Declarations
 */
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

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
  destroy: () => void;
}

export interface YouTubePlayerHandle {
  seekTo: (seconds: number, playImmediate?: boolean) => void;
  play: () => void;
  pause: () => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  getInstance: () => YTPlayerInstance | null;
}

export interface YouTubeListeningPlayerProps {
  videoId: string; // YouTube Video ID (e.g. "LhytOhr5ZMA")
  onTimeUpdate?: (currentTime: number) => void;
  onPlayerReady?: (player: YTPlayerInstance) => void;
  onStateChange?: (state: number) => void;
  playbackRate?: number;
  isLoopingCue?: boolean;
  loopRange?: { start: number; end: number } | null;
  className?: string;
}

// Singleton Promise to ensure the YouTube IFrame API script is only injected once
let ytIframeApiPromise: Promise<void> | null = null;

export function loadYouTubeIFrameApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (ytIframeApiPromise) {
    return ytIframeApiPromise;
  }

  ytIframeApiPromise = new Promise<void>((resolve) => {
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
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

export const YouTubeListeningPlayer = forwardRef<YouTubePlayerHandle, YouTubeListeningPlayerProps>(
  function YouTubeListeningPlayer(
    {
      videoId,
      onTimeUpdate,
      onPlayerReady,
      onStateChange,
      playbackRate = 1.0,
      isLoopingCue = false,
      loopRange = null,
      className = '',
    },
    ref
  ) {
    const containerId = `yt-player-${videoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const playerRef = useRef<YTPlayerInstance | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [useIframeFallback, setUseIframeFallback] = useState(false);

    // High frequency mutable refs to avoid stale closure trap in 100ms interval
    const isLoopingRef = useRef(isLoopingCue);
    isLoopingRef.current = isLoopingCue;

    const loopRangeRef = useRef(loopRange);
    loopRangeRef.current = loopRange;

    const onTimeUpdateRef = useRef(onTimeUpdate);
    onTimeUpdateRef.current = onTimeUpdate;

    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    const onPlayerReadyRef = useRef(onPlayerReady);
    onPlayerReadyRef.current = onPlayerReady;

    // Polling function for 100ms sub-second updates & sentence looping
    const startPolling = useCallback(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player || typeof player.getCurrentTime !== 'function') return;

        try {
          const currentTime = player.getCurrentTime();
          onTimeUpdateRef.current?.(currentTime);

          // Sentence Looping (A-B loop) enforcement:
          // When currentTime approaches the end of the loop range, jump back to start
          if (isLoopingRef.current && loopRangeRef.current) {
            const { start, end } = loopRangeRef.current;
            if (end > start && currentTime >= end - 0.05) {
              player.seekTo(start, true);
            }
          }
        } catch {
          // ignore transient player errors
        }
      }, 100);
    }, []);

    const stopPolling = useCallback(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, []);

    // Load YouTube API
    useEffect(() => {
      let isMounted = true;
      loadYouTubeIFrameApi()
        .then(() => {
          if (isMounted) setIsApiLoaded(true);
        })
        .catch(() => {
          if (isMounted) setHasError(true);
        });

      return () => {
        isMounted = false;
        stopPolling();
      };
    }, [stopPolling]);

    // Initialize YouTube Player once API is ready
    useEffect(() => {
      if (!isApiLoaded || !window.YT || !window.YT.Player) return;

      const elementId = containerId;
      const domElem = document.getElementById(elementId);
      if (!domElem) return;

      let player: YTPlayerInstance | null = null;

      try {
        player = new window.YT.Player(elementId, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            cc_load_policy: 0,
            iv_load_policy: 3,
            fs: 1,
            disablekb: 0,
          },
          events: {
            onReady: (event) => {
              playerRef.current = event.target;
              if (playbackRate && playbackRate !== 1.0) {
                event.target.setPlaybackRate(playbackRate);
              }
              onPlayerReadyRef.current?.(event.target);
            },
            onStateChange: (event) => {
              onStateChangeRef.current?.(event.data);
              // 1 is PLAYING in YT.PlayerState
              if (event.data === 1) {
                startPolling();
              } else {
                stopPolling();
                // Send one final sync on pause/buffering
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  try {
                    onTimeUpdateRef.current?.(playerRef.current.getCurrentTime());
                  } catch {}
                }
              }
            },
            onError: () => {
              setHasError(true);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YouTube player instance:', err);
        setHasError(true);
      }

      return () => {
        stopPolling();
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }
      };
    }, [isApiLoaded, videoId, startPolling, stopPolling, playbackRate]);

    // Sync playback rate changes from props
    useEffect(() => {
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try {
          playerRef.current.setPlaybackRate(playbackRate);
        } catch {}
      }
    }, [playbackRate]);

    // Imperative handle for parent control
    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number, playImmediate = true) => {
          const player = playerRef.current;
          if (!player) return;
          try {
            player.seekTo(seconds, true);
            onTimeUpdateRef.current?.(seconds);
            if (playImmediate && player.getPlayerState() !== 1) {
              player.playVideo();
            }
          } catch (err) {
            console.error('Error seeking YouTube video:', err);
          }
        },
        play: () => {
          const player = playerRef.current;
          if (player && typeof player.playVideo === 'function') {
            try {
              player.playVideo();
            } catch {}
          }
        },
        pause: () => {
          const player = playerRef.current;
          if (player && typeof player.pauseVideo === 'function') {
            try {
              player.pauseVideo();
            } catch {}
          }
        },
        setPlaybackRate: (rate: number) => {
          const player = playerRef.current;
          if (player && typeof player.setPlaybackRate === 'function') {
            try {
              player.setPlaybackRate(rate);
            } catch {}
          }
        },
        getCurrentTime: () => {
          const player = playerRef.current;
          if (player && typeof player.getCurrentTime === 'function') {
            try {
              return player.getCurrentTime();
            } catch {}
          }
          return 0;
        },
        getPlayerState: () => {
          const player = playerRef.current;
          if (player && typeof player.getPlayerState === 'function') {
            try {
              return player.getPlayerState();
            } catch {}
          }
          return -1;
        },
        getInstance: () => playerRef.current,
      }),
      []
    );

    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-black shadow-lg ${className}`}>
        <div className="relative aspect-video w-full">
          {useIframeFallback ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
              title="YouTube Video Player"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <>
              {/* Target container for YouTube IFrame injection */}
              <div id={containerId} className="h-full w-full" />

              {/* Loading placeholder before YouTube IFrame loads */}
              {!isApiLoaded && !hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <p className="mt-3 text-xs font-medium text-slate-400">Đang tải video bài giảng...</p>
                </div>
              )}

              {/* Error fallback */}
              {hasError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/95 p-6 text-center text-white backdrop-blur-xs">
                  <p className="text-sm font-semibold text-rose-400">Không thể kết nối video YouTube trực tiếp</p>
                  <p className="mt-1.5 max-w-sm text-xs text-slate-300">
                    Video có thể giới hạn phát nhúng qua API hoặc kết nối mạng bị gián đoạn.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseIframeFallback(true);
                        setHasError(false);
                      }}
                      className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
                    >
                      Dùng trình phát nhúng dự phòng
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      <span>Mở xem trên YouTube</span>
                      <span>↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setHasError(false)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Thử lại
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
