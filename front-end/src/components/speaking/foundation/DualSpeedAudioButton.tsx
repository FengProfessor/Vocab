'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Snail, Rabbit, Volume2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playWordAudio, stopWordAudio } from '@/lib/audio';
import { pauseIpaVideo } from '@/components/pronunciation/InteractiveIpaVideoPlayer';

export interface DualSpeedAudioButtonProps {
  /** The target text or sentence to pronounce */
  text: string;
  /** Optional direct audio URL (e.g. curated MP3, CDN, or DB asset) */
  audioUrl?: string | null;
  /** Callback triggered when playback state changes */
  onPlayStateChange?: (isPlaying: boolean, speed: 0.8 | 1.0) => void;
  /** Optional custom container CSS classes */
  className?: string;
  /** Button sizing variant */
  size?: 'sm' | 'default' | 'lg';
  /** Whether to show descriptive text labels alongside icons */
  showLabels?: boolean;
  /** Disable button interaction */
  disabled?: boolean;
}

/**
 * DualSpeedAudioButton:
 * Interactive multi-speed audio player supporting:
 * - 0.8x slow articulatory rate (enhances final consonant and linking perception)
 * - 1.0x natural conversational rate (preserves native sentence rhythm and reductions)
 * - HTML5 Audio playback with pitch preservation (`preservesPitch = true`)
 * - Cascade fallback via `playWordAudio`
 * - Automatic pause of background IPA videos (`pauseIpaVideo()`) to prevent audio collisions
 */
export const DualSpeedAudioButton: React.FC<DualSpeedAudioButtonProps> = ({
  text,
  audioUrl,
  onPlayStateChange,
  className = '',
  size = 'sm',
  showLabels = true,
  disabled = false,
}) => {
  const [activeSpeed, setActiveSpeed] = useState<0.8 | 1.0 | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTokenRef = useRef<number>(0);

  // Stop active audio helper
  const haltPlayback = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
    stopWordAudio();
    setIsPlaying(false);
    setActiveSpeed(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      haltPlayback();
    };
  }, [haltPlayback]);

  // Handle speed selection click
  const handlePlaySpeed = async (speed: 0.8 | 1.0) => {
    if (disabled || !text) return;

    // Toggle off if currently playing at the same speed
    if (isPlaying && activeSpeed === speed) {
      haltPlayback();
      onPlayStateChange?.(false, speed);
      return;
    }

    // 1. Prevent audio collision: pause any running video demonstration
    pauseIpaVideo();
    // 2. Stop active audio from other components
    stopWordAudio();

    // Increment play token to prevent stale async resolutions
    const currentToken = ++currentTokenRef.current;

    setIsPlaying(true);
    setActiveSpeed(speed);
    onPlayStateChange?.(true, speed);

    if (audioUrl) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
        } else {
          audioRef.current.src = audioUrl;
        }

        const audio = audioRef.current;
        // Pitch preservation prevents unnatural chipmunk or robotic sound
        audio.preservesPitch = true;
        // Also set vendor-prefixed properties for compatibility
        (audio as any).mozPreservesPitch = true;
        (audio as any).webkitPreservesPitch = true;

        audio.playbackRate = speed;

        audio.onended = () => {
          if (currentTokenRef.current === currentToken) {
            setIsPlaying(false);
            setActiveSpeed(null);
            onPlayStateChange?.(false, speed);
          }
        };

        audio.onerror = async () => {
          if (currentTokenRef.current !== currentToken) return;
          // Fallback to audio cascade if URL fails to load
          try {
            await playWordAudio(text, null, speed, 'US');
          } finally {
            if (currentTokenRef.current === currentToken) {
              setIsPlaying(false);
              setActiveSpeed(null);
              onPlayStateChange?.(false, speed);
            }
          }
        };

        await audio.play();
      } catch {
        if (currentTokenRef.current !== currentToken) return;
        // Fallback to audio cascade on promise rejection
        try {
          await playWordAudio(text, null, speed, 'US');
        } finally {
          if (currentTokenRef.current === currentToken) {
            setIsPlaying(false);
            setActiveSpeed(null);
            onPlayStateChange?.(false, speed);
          }
        }
      }
    } else {
      // Direct cascade lookup (Oxford human MP3 -> Neural TTS -> Web Speech)
      try {
        await playWordAudio(text, null, speed, 'US');
      } finally {
        if (currentTokenRef.current === currentToken) {
          setIsPlaying(false);
          setActiveSpeed(null);
          onPlayStateChange?.(false, speed);
        }
      }
    }
  };

  const isSlowActive = isPlaying && activeSpeed === 0.8;
  const isNormalActive = isPlaying && activeSpeed === 1.0;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 0.8x Slow Articulatory Button */}
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled}
        onClick={() => handlePlaySpeed(0.8)}
        title="Nghe tốc độ 0.8x: Bẻ chậm để bắt trọn âm đuôi và nối âm"
        aria-label="Phát âm thanh chậm 0.8x"
        className={`flex items-center gap-1.5 transition-colors ${
          isSlowActive
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 dark:text-amber-200'
            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {isSlowActive ? (
          <Pause className="size-3.5 animate-pulse text-amber-400" />
        ) : (
          <Snail className="size-3.5 text-amber-400" />
        )}
        {showLabels && (
          <span className="text-xs font-medium">
            0.8x {isSlowActive ? 'Đang phát' : 'Chậm (âm đuôi)'}
          </span>
        )}
        {!showLabels && <span className="text-xs font-mono">0.8x</span>}
      </Button>

      {/* 1.0x Normal Conversational Button */}
      <Button
        type="button"
        size={size}
        variant="outline"
        disabled={disabled}
        onClick={() => handlePlaySpeed(1.0)}
        title="Nghe tốc độ 1.0x: Tốc độ tự nhiên chuẩn phản xạ bản ngữ"
        aria-label="Phát âm thanh chuẩn 1.0x"
        className={`flex items-center gap-1.5 transition-colors ${
          isNormalActive
            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 dark:text-indigo-200'
            : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {isNormalActive ? (
          <Pause className="size-3.5 animate-pulse text-indigo-400" />
        ) : (
          <Rabbit className="size-3.5 text-indigo-400" />
        )}
        {showLabels && (
          <span className="text-xs font-medium">
            1.0x {isNormalActive ? 'Đang phát' : 'Tự nhiên'}
          </span>
        )}
        {!showLabels && <span className="text-xs font-mono">1.0x</span>}
      </Button>
    </div>
  );
};

export default DualSpeedAudioButton;
