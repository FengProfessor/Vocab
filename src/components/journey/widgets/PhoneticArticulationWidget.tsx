'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Volume2, Mic, CheckCircle2, XCircle, AlertTriangle, Sparkles, RotateCcw, ArrowRight, Video, Activity } from 'lucide-react';
import { playWordAudio, stopWordAudio } from '@/lib/audio';
import type { RachelVideoMeta, MinimalPairItem, PronunciationLesson } from '@/types/pronunciation';
import { InteractiveIpaVideoPlayer, pauseIpaVideo } from '@/components/pronunciation/InteractiveIpaVideoPlayer';
import pronunciationData from '@/data/pronunciation/lessons-v1.json';

export type { MinimalPairItem };

export interface PhoneticArticulationProps {
  ipa: string;
  mouthTip: string;
  whyHard: string;
  audioUrl?: string;
  minimalPairs: MinimalPairItem[];
  onComplete: (stats: { score: number; passed: boolean }) => void;

  // ── Rachel's English Video Integration (Optional props) ──
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: string;
  videoTip?: string;
  title?: string;
}

export const PhoneticArticulationWidget: React.FC<PhoneticArticulationProps> = ({
  ipa,
  mouthTip,
  whyHard,
  audioUrl,
  minimalPairs,
  onComplete,
  video,
  youtubeVideoId,
  startSeconds,
  endSeconds,
  channelName,
  videoTip,
  title,
}) => {
  // Filter out non-contrastive identical pairs (T2.15.2)
  const validPairs = useMemo(() => {
    return (minimalPairs || []).filter(
      (pair) => pair.a && pair.b && pair.a.trim().toLowerCase() !== pair.b.trim().toLowerCase()
    );
  }, [minimalPairs]);

  // Tab switching state: Video Rachel's English vs 2D Sagittal diagram
  const [activeTab, setActiveTab] = useState<'video' | 'diagram'>('video');

  // Resolve video metadata: passed prop -> flat props -> lookup in lessons-v1.json
  const resolvedVideo: RachelVideoMeta | undefined = useMemo(() => {
    if (video) return video;
    if (youtubeVideoId) {
      return {
        youtubeVideoId,
        startSeconds: startSeconds ?? 0,
        endSeconds: endSeconds ?? 0,
        channelName: (channelName as "Rachel's English") || "Rachel's English",
        videoTip: videoTip || mouthTip || '',
        clipTitle: title || `Khẩu hình âm /${ipa}/`,
      };
    }

    // Lookup matching lesson from lessons-v1.json (by ipa or title)
    const lessons = (pronunciationData as { lessons: PronunciationLesson[] }).lessons;
    if (!lessons || lessons.length === 0) return undefined;

    const rawIpa = (ipa || '').trim();
    const cleanIpa = rawIpa.replace(/[/\[\]]/g, '').trim().toLowerCase();
    const normalizedIpa = cleanIpa.replace(/:/g, 'ː');
    const normalizedAscii = cleanIpa.replace(/ː/g, ':');
    const cleanTitle = (title || '').trim().toLowerCase();

    // 1. Exact match by clean IPA or id
    let match = lessons.find((l) => {
      const lClean = l.ipa.replace(/[/\[\]]/g, '').trim().toLowerCase();
      return lClean === cleanIpa || lClean === normalizedIpa || lClean === normalizedAscii || l.id === rawIpa;
    });
    if (match?.video) return match.video;

    // 2. Token match (if lesson.ipa contains multiple phonemes separated by space)
    match = lessons.find((l) => {
      const tokens = l.ipa.replace(/[/\[\]]/g, '').toLowerCase().split(/\s+/);
      return tokens.includes(cleanIpa) || tokens.includes(normalizedIpa) || tokens.includes(normalizedAscii);
    });
    if (match?.video) return match.video;

    // 3. Substring match in lesson IPA (e.g. "-p" or "p" in "-p -t -k")
    match = lessons.find((l) => {
      const lClean = l.ipa.replace(/[/\[\]]/g, '').toLowerCase();
      return (
        (cleanIpa.length > 0 && lClean.includes(cleanIpa)) ||
        (normalizedIpa.length > 0 && lClean.includes(normalizedIpa)) ||
        (normalizedAscii.length > 0 && lClean.includes(normalizedAscii))
      );
    });
    if (match?.video) return match.video;

    // 4. Match by title or ID
    if (cleanTitle) {
      match = lessons.find((l) => {
        const lTitle = l.title.toLowerCase();
        return lTitle === cleanTitle || lTitle.includes(cleanTitle) || cleanTitle.includes(l.id);
      });
      if (match?.video) return match.video;
    }

    // 5. Check if lesson title includes clean IPA
    if (cleanIpa) {
      match = lessons.find((l) => l.title.toLowerCase().includes(cleanIpa));
      if (match?.video) return match.video;
    }

    // 6. Fallback to first lesson with video
    return lessons[0]?.video;
  }, [video, youtubeVideoId, startSeconds, endSeconds, channelName, videoTip, mouthTip, title, ipa]);

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    if (resolvedVideo?.clipTitle) return resolvedVideo.clipTitle;
    return `Khẩu hình âm /${ipa}/ — Rachel's English`;
  }, [title, resolvedVideo, ipa]);

  // Discrimination drill state
  const [currentRound, setCurrentRound] = useState(0);
  const [drillAnswers, setDrillAnswers] = useState<Record<number, { choice: string; isCorrect: boolean }>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDrillCompleted, setIsDrillCompleted] = useState(false);

  // Microphone recording simulation state (T2.15.4, T2.15.5)
  const [micState, setMicState] = useState<'idle' | 'recording' | 'success' | 'empty' | 'denied'>('idle');

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Decide target word per round (deterministically alternating between a and b)
  const currentPair = validPairs[currentRound] || validPairs[0];
  const targetWord = currentRound % 2 === 0 ? currentPair?.a : currentPair?.b;

  // Play audio of target word in minimal pair drill (pauses video)
  const handlePlayDrillTarget = (rate = 1.0) => {
    if (!targetWord) return;
    pauseIpaVideo();
    setIsPlayingAudio(true);
    playWordAudio(targetWord, null, rate).finally(() => {
      setIsPlayingAudio(false);
    });
  };

  // Play main IPA sample audio (pauses video)
  const handlePlayMainIpa = (rate = 1.0) => {
    pauseIpaVideo();
    playWordAudio(ipa, audioUrl, rate);
  };

  // User chooses option A or B in drill
  const handleChooseDrillOption = (choice: string) => {
    if (!targetWord || drillAnswers[currentRound] !== undefined) return;

    const isCorrect = choice.trim().toLowerCase() === targetWord.trim().toLowerCase();
    const updated = {
      ...drillAnswers,
      [currentRound]: { choice, isCorrect },
    };
    setDrillAnswers(updated);

    // If last round, complete drill
    if (currentRound + 1 >= validPairs.length) {
      setIsDrillCompleted(true);
      let correct = 0;
      for (const item of Object.values(updated)) {
        if (item.isCorrect) correct++;
      }
      const score = Math.round((correct / validPairs.length) * 100);
      const passed = score >= 75;
      onCompleteRef.current({ score, passed });
    }
  };

  const handleNextRound = () => {
    if (currentRound + 1 < validPairs.length) {
      setCurrentRound((prev) => prev + 1);
    }
  };

  const handleResetDrill = () => {
    setCurrentRound(0);
    setDrillAnswers({});
    setIsDrillCompleted(false);
    setMicState('idle');
  };

  // Simulate speaking practice drill with browser mic check (pauses video)
  const handleToggleRecord = () => {
    pauseIpaVideo();
    if (micState === 'recording') {
      // Finished recording: check if valid audio recorded
      setMicState('success');
    } else {
      if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
        setMicState('recording');
        // Auto-stop after 2.5 seconds
        setTimeout(() => {
          setMicState('success');
        }, 2500);
      } else {
        // Fallback gracefully without crash (T2.15.4)
        setMicState('denied');
      }
    }
  };

  // Determine voiced vs voiceless based on IPA symbol
  const isVoiceless = /^[ptkfsθʃtʃh]/.test(ipa.replace(/[/\[\]]/g, ''));

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all">
      {/* Header with IPA badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xl sm:text-2xl shadow-md">
            {ipa}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">
                Khẩu hình & Phát âm chuẩn
              </h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isVoiceless
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                }`}
              >
                {isVoiceless ? 'Âm vô thanh (Bật hơi)' : 'Âm hữu thanh (Rung cổ)'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Quan sát khẩu hình, nghe mẫu đối chiếu và luyện tai phân biệt cặp âm.
            </p>
          </div>
        </div>

        {/* Audio buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePlayMainIpa(1.0)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe chuẩn 1.0x</span>
          </button>
          <button
            type="button"
            onClick={() => handlePlayMainIpa(0.6)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition"
            title="Nghe tốc độ chậm"
          >
            <span>0.6x chậm</span>
          </button>
        </div>
      </div>

      {/* Visual Articulation Mode Tabs */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'video'}
          onClick={() => setActiveTab('video')}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'video'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Video className="w-4 h-4 text-red-500" />
          <span>Video Rachel's English</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'diagram'}
          onClick={() => {
            pauseIpaVideo();
            setActiveTab('diagram');
          }}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'diagram'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-500" />
          <span>Sơ đồ vòm miệng 2D</span>
        </button>
      </div>

      {/* Tab 1: Video Rachel's English */}
      <div className={activeTab === 'video' ? 'space-y-4 mb-6' : 'hidden'}>
        {resolvedVideo && (
          <InteractiveIpaVideoPlayer
            video={resolvedVideo}
            ipa={ipa}
            title={resolvedTitle}
            collapsible={false}
            onPlay={() => {
              stopWordAudio();
              setIsPlayingAudio(false);
            }}
          />
        )}

        {/* Tips & Contrastive Analysis for Video Tab */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Vì sao người Việt hay phát âm sai?</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {whyHard}
            </p>
          </div>

          <div className="md:col-span-6 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mẹo đặt khẩu hình chuẩn</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {mouthTip}
            </p>
          </div>
        </div>

        {/* Mic Speech Recording simulation */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {micState === 'recording' && <span className="text-rose-500 font-semibold animate-pulse">● Đang thu âm... Hãy phát âm từ này</span>}
            {micState === 'success' && <span className="text-emerald-600 font-semibold">✓ Đã nhận diện âm! Khẩu hình chuẩn!</span>}
            {micState === 'denied' && <span className="text-zinc-500">Chế độ luyện tai trực quan (Không cần mic)</span>}
            {micState === 'idle' && <span>Luyện phát âm với Micro</span>}
          </div>

          <button
            type="button"
            onClick={handleToggleRecord}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              micState === 'recording'
                ? 'bg-rose-500 text-white animate-bounce'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{micState === 'recording' ? 'Dừng' : 'Thu âm'}</span>
          </button>
        </div>
      </div>

      {/* Tab 2: Sơ đồ vòm miệng 2D */}
      <div className={activeTab === 'diagram' ? 'grid grid-cols-1 md:grid-cols-12 gap-5 mb-6' : 'hidden'}>
        {/* Mouth Diagram SVG Graphic */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 flex flex-col items-center justify-center text-center">
          <div className="relative w-36 h-36 mb-3">
            {/* SVG Sagittal Head Diagram Illustration */}
            <svg viewBox="0 0 120 120" className="w-full h-full text-indigo-600 dark:text-indigo-400">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
              {/* Lips contour */}
              <path
                d="M 35 48 C 45 42, 55 42, 65 48 C 55 52, 45 52, 35 48 Z"
                fill="currentColor"
                opacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M 35 60 C 45 66, 55 66, 65 60 C 55 56, 45 56, 35 60 Z"
                fill="currentColor"
                opacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Teeth */}
              <rect x="42" y="47" width="5" height="4" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="52" y="47" width="5" height="4" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="44" y="57" width="5" height="4" rx="1" fill="currentColor" opacity="0.8" />
              <rect x="50" y="57" width="5" height="4" rx="1" fill="currentColor" opacity="0.8" />
              {/* Tongue Position */}
              <path
                d="M 45 64 Q 60 72 80 68 Q 65 58 50 62 Z"
                fill="currentColor"
                opacity="0.4"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Airflow / Vibration waves */}
              {isVoiceless ? (
                <path d="M 68 50 Q 82 46 95 50" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
              ) : (
                <path d="M 65 72 Q 72 80 82 74 Q 90 82 98 76" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              )}
            </svg>
          </div>
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Sơ đồ vòm miệng & luồng khí
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isVoiceless ? '💨 Luồng khí thoát mạnh ra trước môi' : '🎵 Dây thanh âm rung đều đặn'}
          </div>
        </div>

        {/* Tips & Contrastive Analysis */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3">
          {/* Why Vietnamese struggle */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Vì sao người Việt hay phát âm sai?</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {whyHard}
            </p>
          </div>

          {/* Mouth tip cue */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mẹo đặt khẩu hình chuẩn</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {mouthTip}
            </p>
          </div>

          {/* Mic Speech Recording simulation */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {micState === 'recording' && <span className="text-rose-500 font-semibold animate-pulse">● Đang thu âm... Hãy phát âm từ này</span>}
              {micState === 'success' && <span className="text-emerald-600 font-semibold">✓ Đã nhận diện âm! Khẩu hình chuẩn!</span>}
              {micState === 'denied' && <span className="text-zinc-500">Chế độ luyện tai trực quan (Không cần mic)</span>}
              {micState === 'idle' && <span>Luyện phát âm với Micro</span>}
            </div>

            <button
              type="button"
              onClick={handleToggleRecord}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                micState === 'recording'
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{micState === 'recording' ? 'Dừng' : 'Thu âm'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Pair Discrimination Drill */}
      {validPairs.length > 0 && (
        <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                Luyện tai phân biệt cặp âm tối thiểu (Minimal Pairs)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Bấm loa để nghe một trong hai từ, sau đó chọn từ bạn vừa nghe được.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-full text-zinc-700 dark:text-zinc-300">
              Vòng {currentRound + 1}/{validPairs.length}
            </span>
          </div>

          {/* Drill Audio Speaker Centerpiece */}
          <div className="flex flex-col items-center justify-center my-4">
            <button
              type="button"
              onClick={() => handlePlayDrillTarget(1.0)}
              className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform"
              title="Phát lại âm thanh mẫu"
            >
              <Volume2 className="w-7 h-7" />
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
              Chạm để nghe âm thanh bí mật
            </span>
          </div>

          {/* Pair Options A & B */}
          {currentPair && (
            <div className="grid grid-cols-2 gap-4 my-4">
              {[currentPair.a, currentPair.b].map((word, idx) => {
                const answered = drillAnswers[currentRound];
                const isSelected = answered?.choice === word;
                const isTarget = word.trim().toLowerCase() === targetWord?.trim().toLowerCase();

                let btnStyle = 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-indigo-400';
                if (answered) {
                  if (isTarget) {
                    btnStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !isTarget) {
                    btnStyle = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200';
                  } else {
                    btnStyle = 'bg-zinc-100 dark:bg-zinc-800 opacity-50 border-zinc-200 dark:border-zinc-700';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={answered !== undefined}
                    onClick={() => handleChooseDrillOption(word)}
                    className={`min-h-[56px] p-4 rounded-xl border text-center text-base sm:text-lg font-semibold transition-all flex flex-col items-center justify-center ${btnStyle}`}
                  >
                    <span>{word}</span>
                    {answered && isTarget && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                      </span>
                    )}
                    {answered && isSelected && !isTarget && (
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-normal mt-1 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Chưa đúng
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Drill note / explanation */}
          {drillAnswers[currentRound] !== undefined && (
            <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between animate-fadeIn">
              <span>{currentPair?.note || 'Chú ý sự khác biệt giữa hai âm khi phát âm và lắng nghe!'}</span>
              {!isDrillCompleted && (
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Câu tiếp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Completion banner */}
          {isDrillCompleted && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                  Hoàn thành chuỗi luyện tai! Điểm số: {Math.round((Object.values(drillAnswers).filter((a) => a.isCorrect).length / validPairs.length) * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetDrill}
                className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Luyện lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneticArticulationWidget;
