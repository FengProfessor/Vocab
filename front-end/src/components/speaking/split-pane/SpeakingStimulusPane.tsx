'use client';

/**
 * SpeakingStimulusPane Component
 * File: src/components/speaking/split-pane/SpeakingStimulusPane.tsx
 *
 * Left pane of the Minimalist Split-Pane UI:
 * 1. Visual Stimulus:
 *    - Responsive image presentation with fallback, accessible alt text, and caption
 *    - Full-screen zoom modal with high-fidelity inspection
 *    - Bilingual title, category, and CEFR level badge
 *    - Situation context in Vietnamese and IELTS cue-card bullet points
 * 2. Reference Audio Player:
 *    - Dual-speed playback: 0.8x (slow articulatory rate) & 1.0x (natural rate)
 *    - Pitch preservation enabled (preservesPitch = true)
 *    - Timeline display with current time and duration in font-mono tabular-nums
 *    - Interactive scrubber timeline
 *    - Built-in audio collision prevention: automatically halts playback when recording starts
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  X,
  FileText,
  Sparkles,
  BookOpen,
  Info,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { stopWordAudio } from '@/lib/audio';
import { pauseIpaVideo } from '@/components/pronunciation/InteractiveIpaVideoPlayer';
import type {
  VisualStimulus,
  AudioStimulus,
} from '@/types/speaking-module';
import type { TopicVocabItem } from '@/types/speaking-topic-library';

export interface SpeakingStimulusData {
  titleEn?: string;
  titleVi?: string;
  category?: string;
  level?: string;
  situationVi?: string;
  promptQuestionEn?: string;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  sourceAttribution?: string;
  referenceAudioUrl?: string;
  durationSeconds?: number;
  slowAudioUrl?: string;
  transcript?: string;
  cueCardBullets?: string[];
  keyVocabulary?: Array<{
    term: string;
    ipa?: string;
    meaningVi: string;
    audioUrl?: string;
  }> | TopicVocabItem[];
}

export interface SpeakingStimulusPaneProps {
  /** Consolidated stimulus data object */
  stimulus?: {
    visual?: VisualStimulus;
    audio?: AudioStimulus;
  } | SpeakingStimulusData;
  /** Explicit visual stimulus prop */
  visual?: VisualStimulus;
  /** Explicit audio stimulus prop */
  audio?: AudioStimulus;
  /** English / primary title */
  titleEn?: string;
  /** Vietnamese translation title */
  titleVi?: string;
  /** General title fallback */
  title?: string;
  /** Detailed situation prompt in Vietnamese */
  situationVi?: string;
  /** Context in Vietnamese fallback */
  contextVietnamese?: string;
  /** English instructions */
  instructionsEnglish?: string;
  /** Topic category identifier or label */
  category?: string;
  /** CEFR level indicator (A1, A2, B1, B2, etc.) */
  level?: string;
  /** IELTS Part 2 Cue-card bullet items */
  cueCardBullets?: string[];
  /** Key vocabulary terms associated with stimulus */
  keyVocabulary?: Array<{
    term: string;
    ipa?: string;
    meaningVi: string;
    audioUrl?: string;
  }> | TopicVocabItem[];
  /** Flag from parent indicating mic recording is in progress; silences playback */
  isRecording?: boolean;
  /** Playback state change listener */
  onPlayStateChange?: (isPlaying: boolean, speed: 0.8 | 1.0) => void;
  /** Additional container CSS classes */
  className?: string;
}

/** Formats seconds into MM:SS tabular numbers */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const SpeakingStimulusPane: React.FC<SpeakingStimulusPaneProps> = ({
  stimulus,
  visual: visualProp,
  audio: audioProp,
  titleEn: titleEnProp,
  titleVi: titleViProp,
  title: titleProp,
  situationVi: situationViProp,
  contextVietnamese,
  instructionsEnglish,
  category: categoryProp,
  level: levelProp,
  cueCardBullets: cueBulletsProp,
  keyVocabulary: keyVocabProp,
  isRecording = false,
  onPlayStateChange,
  className = '',
}) => {
  // Normalize visual stimulus from either prop
  const visual: VisualStimulus | undefined = useMemo(() => {
    if (visualProp) return visualProp;
    if (stimulus && 'visual' in stimulus && stimulus.visual) return stimulus.visual;
    if (stimulus && 'imageUrl' in stimulus && stimulus.imageUrl) {
      return {
        imageUrl: stimulus.imageUrl,
        imageAlt: stimulus.imageAlt || 'Visual stimulus illustration',
        caption: stimulus.caption,
        sourceAttribution: stimulus.sourceAttribution,
      };
    }
    return undefined;
  }, [visualProp, stimulus]);

  // Normalize audio stimulus
  const audio: AudioStimulus | undefined = useMemo(() => {
    if (audioProp) return audioProp;
    if (stimulus && 'audio' in stimulus && stimulus.audio) return stimulus.audio;
    if (stimulus && 'referenceAudioUrl' in stimulus && stimulus.referenceAudioUrl) {
      return {
        audioUrl: stimulus.referenceAudioUrl,
        durationSeconds: stimulus.durationSeconds,
        slowAudioUrl: stimulus.slowAudioUrl,
        transcript: stimulus.transcript,
      };
    }
    return undefined;
  }, [audioProp, stimulus]);

  // Normalize metadata text
  const displayTitleEn =
    titleEnProp ||
    titleProp ||
    (stimulus && 'titleEn' in stimulus ? stimulus.titleEn : undefined) ||
    visual?.titleEn ||
    'Visual Stimulus & Scenario';

  const displayTitleVi =
    titleViProp ||
    (stimulus && 'titleVi' in stimulus ? stimulus.titleVi : undefined) ||
    visual?.titleVi ||
    'Đề bài & Ngữ cảnh bài nói';

  const displaySituationVi =
    situationViProp ||
    contextVietnamese ||
    (stimulus && 'situationVi' in stimulus ? stimulus.situationVi : undefined) ||
    visual?.situationVi;

  const displayCategory =
    categoryProp ||
    (stimulus && 'category' in stimulus ? stimulus.category : undefined);

  const displayLevel =
    levelProp || (stimulus && 'level' in stimulus ? stimulus.level : undefined);

  const cueBullets =
    cueBulletsProp ||
    (stimulus && 'cueCardBullets' in stimulus ? stimulus.cueCardBullets : undefined) ||
    visual?.cueCardBullets;

  const keyVocab =
    keyVocabProp ||
    (stimulus && 'keyVocabulary' in stimulus ? stimulus.keyVocabulary : undefined);

  // Modal zoom state
  const [isZoomed, setIsZoomed] = useState(false);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState<0.8 | 1.0>(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(audio?.durationSeconds || 0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop reference audio immediately (Audio Collision Defense)
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayStateChange?.(false, activeSpeed);
  }, [activeSpeed, onPlayStateChange]);

  // Audio collision safeguard: Stop audio when recording begins in the right pane
  useEffect(() => {
    if (isRecording && isPlaying) {
      stopAudio();
    }
  }, [isRecording, isPlaying, stopAudio]);

  // Setup HTML5 Audio element
  useEffect(() => {
    const activeUrl =
      activeSpeed === 0.8 && audio?.slowAudioUrl
        ? audio.slowAudioUrl
        : audio?.audioUrl;

    if (!activeUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    const audioElement = new Audio(activeUrl);
    audioRef.current = audioElement;

    // Configure pitch preservation
    audioElement.preservesPitch = true;
    (audioElement as unknown as { webkitPreservesPitch: boolean }).webkitPreservesPitch = true;
    (audioElement as unknown as { mozPreservesPitch: boolean }).mozPreservesPitch = true;
    audioElement.playbackRate = activeSpeed;

    const handleLoadedMetadata = () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        setDuration(audioElement.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false, activeSpeed);
    };

    const handleError = () => {
      setAudioError('Không thể tải tệp âm thanh mẫu.');
      setIsPlaying(false);
      onPlayStateChange?.(false, activeSpeed);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      try {
        audioElement.pause();
      } catch {}
      audioRef.current = null;
    };
  }, [audio?.audioUrl, audio?.slowAudioUrl, activeSpeed, onPlayStateChange]);

  // Toggle playback
  const togglePlay = async () => {
    if (!audioRef.current || !audio?.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false, activeSpeed);
    } else {
      // Collision defense: silence active video or global audio
      stopWordAudio();
      pauseIpaVideo();

      try {
        setAudioError(null);
        await audioRef.current.play();
        setIsPlaying(true);
        onPlayStateChange?.(true, activeSpeed);
      } catch {
        setAudioError('Trình duyệt chặn phát âm thanh tự động.');
        setIsPlaying(false);
        onPlayStateChange?.(false, activeSpeed);
      }
    }
  };

  // Change playback speed
  const handleSpeedChange = (newSpeed: 0.8 | 1.0) => {
    setActiveSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Timeline scrubber
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  return (
    <div className={cn('flex flex-col gap-4 text-foreground', className)}>
      {/* 1. Header Badges & Bilingual Title */}
      <div className="space-y-1.5 border-b border-border/80 dark:border-slate-800 pb-3">
        <div className="flex items-center flex-wrap gap-2">
          {displayCategory && (
            <span className="px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              {displayCategory}
            </span>
          )}
          {displayLevel && (
            <span className="px-2 py-0.5 rounded-xs text-[11px] font-mono font-bold uppercase bg-muted text-muted-foreground border border-border">
              CEFR {displayLevel}
            </span>
          )}
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            Stimulus Pane
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          {displayTitleEn}
        </h2>
        {displayTitleVi && (
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {displayTitleVi}
          </p>
        )}
      </div>

      {/* 2. Visual Stimulus Image Container */}
      {visual?.imageUrl ? (
        <div className="relative group overflow-hidden rounded-md border border-border dark:border-slate-800 bg-muted/20 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 dark:border-slate-800/80 pb-1.5 mb-2">
            <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Hình ảnh kích thích thị giác
            </span>
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="flex items-center gap-1 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground transition px-2 py-0.5 rounded border border-border bg-card cursor-pointer touch-manipulation hover:border-primary/50"
              title="Phóng to hình ảnh đầy đủ"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Phóng to</span>
            </button>
          </div>

          <div
            className="relative w-full overflow-hidden flex justify-center cursor-zoom-in rounded-sm bg-black/5 dark:bg-black/40 min-h-[180px] max-h-[340px]"
            onClick={() => setIsZoomed(true)}
            title="Nhấp để phóng to toàn màn hình"
          >
            {/* Standard responsive img with object-contain */}
            <img
              src={visual.imageUrl}
              alt={visual.imageAlt || displayTitleEn}
              className="w-full h-auto max-h-[340px] object-contain select-none transition-transform duration-200 group-hover:scale-[1.01]"
              loading="eager"
            />
          </div>

          {(visual.caption || visual.sourceAttribution) && (
            <div className="mt-2 pt-1.5 border-t border-dashed border-border/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-muted-foreground select-none">
              <span>{visual.caption || visual.imageAlt}</span>
              {visual.sourceAttribution && (
                <span className="font-mono text-[10px] text-muted-foreground/80">
                  {visual.sourceAttribution}
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Full-screen Zoom Modal */}
      {isZoomed && visual?.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hình ảnh phóng to"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center bg-card p-3 rounded-lg border border-border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-border mb-2 select-none">
              <span className="font-mono text-xs font-semibold text-foreground">
                {visual.imageAlt || displayTitleEn}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                aria-label="Đóng phóng to"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={visual.imageUrl}
              alt={visual.imageAlt || displayTitleEn}
              className="w-full h-auto max-h-[75vh] object-contain rounded select-none"
            />
          </div>
        </div>
      )}

      {/* 3. Situation Context Box (Vietnamese Guidance) */}
      {displaySituationVi && (
        <div className="rounded-md border border-border dark:border-slate-800 bg-muted/30 p-3 sm:p-3.5 space-y-1.5 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-1.5 text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wider">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Ngữ cảnh tình huống</span>
          </div>
          <p className="text-foreground/90 whitespace-pre-wrap">{displaySituationVi}</p>
        </div>
      )}

      {/* 4. IELTS Part 2 Cue-Card Bullets (Stage 3 Monologues) */}
      {cueBullets && cueBullets.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-3 sm:p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5" />
            <span>IELTS Speaking Cue Card</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-foreground/90 pl-1">
            {cueBullets.map((bullet, idx) => (
              <li key={idx} className="leading-snug">{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Key Vocabulary Chips */}
      {keyVocab && keyVocab.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Từ vựng trọng tâm cần dùng</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keyVocab.map((item, idx) => {
              const term = item.term;
              const meaning = item.meaningVi;
              const ipa = item.ipa;

              return (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded border border-border bg-card hover:border-primary/40 transition text-xs flex items-center gap-1.5 select-none"
                  title={`${term}: ${meaning}`}
                >
                  <span className="font-semibold text-foreground">{term}</span>
                  {ipa && (
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      /{ipa}/
                    </span>
                  )}
                  <span className="text-muted-foreground">· {meaning}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Reference Audio Player (Dual-Speed: 0.8x & 1.0x with pitch preservation) */}
      {audio?.audioUrl && (
        <div
          role="region"
          aria-label="Trình phát âm thanh mẫu tham khảo"
          className="mt-2 rounded-md border border-border dark:border-slate-800 bg-card p-3 sm:p-3.5 space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span>Âm thanh tham khảo (Native Model)</span>
            </span>

            {/* Dual Speed Selector: 0.8x and 1.0x */}
            <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded border border-border text-xs font-mono">
              <button
                type="button"
                onClick={() => handleSpeedChange(0.8)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer touch-manipulation',
                  activeSpeed === 0.8
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Tốc độ chậm 0.8x (Luyện khẩu hình & phụ âm cuối)"
              >
                0.8x Chậm
              </button>
              <button
                type="button"
                onClick={() => handleSpeedChange(1.0)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer touch-manipulation',
                  activeSpeed === 1.0
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Tốc độ tự nhiên 1.0x (Ngữ điệu bản xứ)"
              >
                1.0x Chuẩn
              </button>
            </div>
          </div>

          {/* Timeline and Play Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Tạm dừng âm thanh mẫu' : 'Phát âm thanh mẫu'}
              className="size-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-2xs cursor-pointer touch-manipulation shrink-0 transition"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Timeline Progress Bar */}
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Thanh trượt phát âm thanh"
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={stopAudio}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition cursor-pointer touch-manipulation"
              title="Đặt lại đầu bài"
              aria-label="Đặt lại âm thanh về đầu"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {audioError && (
            <p className="text-[11px] text-destructive font-mono pt-1">
              {audioError}
            </p>
          )}

          {audio.transcript && (
            <div className="pt-2 border-t border-dashed border-border/70 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Transcript mẫu: </span>
              <span>"{audio.transcript}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeakingStimulusPane;
