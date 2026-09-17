'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Gauge,
  Sparkles,
  Headphones,
  Check,
} from 'lucide-react';
import type { TheoryLesson } from '@/data/toeic/theory/types';
import { speakLocal, silenceSpeech, type SpeakLang } from '@/lib/study';

export interface ToeicAudioNarratorProps {
  lesson: TheoryLesson;
  className?: string;
}

interface AudioTrackItem {
  id: string;
  title: string;
  category: 'formula' | 'rule' | 'example' | 'trap';
  textToSpeak: string;
  lang: SpeakLang;
}

export function ToeicAudioNarrator({ lesson, className = '' }: ToeicAudioNarratorProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [selectedLang, setSelectedLang] = useState<SpeakLang>('en-US');

  // Generate playlist from lesson contents
  const playlist = useMemo<AudioTrackItem[]>(() => {
    const tracks: AudioTrackItem[] = [];

    // Track 1: Lesson Intro
    tracks.push({
      id: 'intro',
      title: `Giới thiệu bài học: ${lesson.title}`,
      category: 'rule',
      textToSpeak: `Lesson: ${lesson.englishTitle}. Target Part ${lesson.targetPart}. Objectives: ${lesson.objectives.join('. ')}`,
      lang: 'en-US',
    });

    // Formulas & Sections
    lesson.sections.forEach((sec, sIdx) => {
      // Formula if present
      if (sec.formula) {
        tracks.push({
          id: `formula-${sIdx}`,
          title: `Công thức (${sec.title}): ${sec.formula.pattern}`,
          category: 'formula',
          textToSpeak: `Key Formula: ${sec.formula.pattern}. ${sec.formula.notes || ''}`,
          lang: 'en-US',
        });
      }

      // Examples if present
      if (sec.examples && sec.examples.length > 0) {
        sec.examples.forEach((ex, eIdx) => {
          tracks.push({
            id: `ex-${sIdx}-${eIdx}`,
            title: `Ví dụ: ${ex.context}`,
            category: 'example',
            textToSpeak: ex.english,
            lang: selectedLang,
          });
        });
      }

      // Key Takeaways if present
      if (sec.keyTakeaways && sec.keyTakeaways.length > 0) {
        tracks.push({
          id: `sec-${sIdx}`,
          title: `Ghi nhớ mục ${sIdx + 1}: ${sec.title}`,
          category: 'rule',
          textToSpeak: sec.keyTakeaways.join('. '),
          lang: 'en-US',
        });
      }
    });

    return tracks;
  }, [lesson, selectedLang]);

  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  // Stop speech when component unmounts or lesson changes
  useEffect(() => {
    return () => {
      silenceSpeech();
    };
  }, [lesson.id]);

  const handlePlayCurrent = useCallback(() => {
    if (!currentTrack) return;
    silenceSpeech();
    setIsPlaying(true);
    speakLocal(currentTrack.textToSpeak, playbackRate, currentTrack.lang);

    // Watch for SpeechSynthesis end
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsPlaying(false);
          clearInterval(checkInterval);
        }
      }, 300);
    }
  }, [currentTrack, playbackRate]);

  const handlePause = useCallback(() => {
    silenceSpeech();
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlayCurrent();
    }
  };

  const handleNextTrack = () => {
    silenceSpeech();
    setIsPlaying(false);
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex((prev) => prev + 1);
    } else {
      setCurrentTrackIndex(0);
    }
  };

  const handlePrevTrack = () => {
    silenceSpeech();
    setIsPlaying(false);
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex((prev) => prev - 1);
    } else {
      setCurrentTrackIndex(playlist.length - 1);
    }
  };

  const handleSelectTrack = (idx: number) => {
    silenceSpeech();
    setIsPlaying(false);
    setCurrentTrackIndex(idx);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (isPlaying) {
      silenceSpeech();
      speakLocal(currentTrack.textToSpeak, newSpeed, currentTrack.lang);
    }
  };

  return (
    <div
      className={`rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-amber-500 text-slate-950">
                AI Audio Walkthrough
              </span>
              <span className="font-mono text-xs text-slate-300">
                Part {lesson.targetPart} · {lesson.englishTitle}
              </span>
            </div>
            <h3 className="font-mono text-sm sm:text-base font-bold text-white mt-0.5">
              Bài Giảng Âm Thanh & Luyện Phát Âm Chuẩn ETS
            </h3>
          </div>
        </div>

        {/* Speed & Accent Controls */}
        <div className="flex items-center gap-2">
          {/* Accent toggle */}
          <button
            type="button"
            onClick={() => setSelectedLang((prev) => (prev === 'en-US' ? 'en-GB' : 'en-US'))}
            className="px-2 py-1 rounded-xs border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold transition cursor-pointer"
            title="Chuyển đổi giọng Anh - Mỹ (US) / Anh - Anh (UK)"
          >
            {selectedLang === 'en-US' ? '🇺🇸 Giọng US' : '🇬🇧 Giọng UK'}
          </button>

          {/* Speed cycle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs border border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold transition cursor-pointer"
            title="Điều chỉnh tốc độ phát"
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>{playbackRate}x</span>
          </button>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Current track title & category */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Đang phát ({currentTrackIndex + 1}/{playlist.length})
              </span>
              {isPlaying && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang đọc mẫu...
                </span>
              )}
            </div>

            <p className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentTrack?.title}
            </p>

            {/* Speaking snippet preview */}
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-white dark:bg-slate-900 p-2.5 rounded-xs border border-slate-200/80 dark:border-slate-800">
              &quot;{currentTrack?.textToSpeak}&quot;
            </p>
          </div>

          {/* Playback Buttons */}
          <div className="flex items-center justify-center gap-2 shrink-0">
            {/* Prev Track */}
            <button
              type="button"
              onClick={handlePrevTrack}
              className="p-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Main Play / Pause */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`p-3 rounded-xs font-mono font-bold flex items-center justify-center transition cursor-pointer shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
              title={isPlaying ? 'Tạm dừng' : 'Nghe bài giảng'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={handleNextTrack}
              className="p-2 rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Selector Accordion */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
          <span>DANH SÁCH ĐOẠN AUDIO BÀI HỌC ({playlist.length})</span>
          <span className="text-[11px]">Nhấp để phát từng câu</span>
        </div>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {playlist.map((track, idx) => {
            const isSelected = idx === currentTrackIndex;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => {
                  handleSelectTrack(idx);
                  silenceSpeech();
                  setIsPlaying(true);
                  speakLocal(track.textToSpeak, playbackRate, track.lang);
                }}
                className={`w-full text-left p-2.5 rounded-xs flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 font-semibold text-slate-900 dark:text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-slate-400 w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="truncate">{track.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && isPlaying ? (
                    <Volume2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  ) : (
                    <Play className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
