'use client';

/**
 * SpeakingInteractionPane Component
 * File: src/components/speaking/split-pane/SpeakingInteractionPane.tsx
 *
 * Right pane of the Minimalist Split-Pane UI:
 * 1. Task Guidance & Context:
 *    - Explicit task instructions and questions in English
 *    - Clickable sentence starter chips to lower cognitive load
 *    - Strategic hints in Vietnamese
 * 2. Voice Capture & Real-Time Recognition:
 *    - Prominent multi-state RecordingButton with audio level modulation
 *    - Real-time LiveTranscriptDisplay with confidence badge & keyword highlighting
 * 3. Review & Post-Recording Action Controls:
 *    - Student audio take playback scrubber with duration
 *    - Reset / Re-record button
 *    - Submit / Save & Next button
 * 4. Pedagogical Feedback Display:
 *    - Score metric (font-mono tabular-nums)
 *    - Matched keywords (Emerald) and missed keywords (Amber)
 *    - Constructive feedback notes in Vietnamese
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  Send,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecordingButton, type RecordingButtonState } from './RecordingButton';
import { LiveTranscriptDisplay } from './LiveTranscriptDisplay';
import { stopWordAudio } from '@/lib/audio';
import { pauseIpaVideo } from '@/components/pronunciation/InteractiveIpaVideoPlayer';

export interface SpeakingEvaluationFeedback {
  score: number;
  passed?: boolean;
  feedbackVi?: string;
  matchedKeywords?: string[];
  missedKeywords?: string[];
  suggestedCorrectionEn?: string;
}

export interface SpeakingInteractionPaneProps {
  /** Main task prompt / directive (English) */
  taskPrompt?: string;
  instructionsEnglish?: string;
  promptQuestionEn?: string;
  contextVietnamese?: string;
  /** Target pedagogical keywords */
  targetKeywords?: string[];
  /** Suggested sentence starter chips */
  suggestedStarters?: string[];
  hintsVi?: string[];

  // Recording State & Callbacks
  isRecording?: boolean;
  isProcessing?: boolean;
  disabled?: boolean;
  recordingState?: RecordingButtonState;
  onStartRecording?: () => void | Promise<void>;
  onStopRecording?: () => void | Promise<void>;
  audioLevel?: number;

  // Real-Time STT Transcripts
  interimTranscript?: string;
  finalTranscript?: string;
  confidence?: number;

  // Recorded Audio Output
  recordedAudioUrl?: string | null;

  // Evaluation & Action Controls
  evaluation?: SpeakingEvaluationFeedback | null;
  onSubmit?: () => void | Promise<void>;
  onSaveAudio?: () => void | Promise<void>;
  onReset?: () => void;
  onRetry?: () => void;
  onNextTask?: () => void;

  className?: string;
}

/** Formats seconds into MM:SS tabular numbers */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const SpeakingInteractionPane: React.FC<SpeakingInteractionPaneProps> = ({
  taskPrompt,
  instructionsEnglish,
  promptQuestionEn,
  contextVietnamese,
  targetKeywords = [],
  suggestedStarters = [],
  hintsVi = [],

  isRecording = false,
  isProcessing = false,
  disabled = false,
  recordingState,
  onStartRecording,
  onStopRecording,
  audioLevel = 0,

  interimTranscript,
  finalTranscript,
  confidence,

  recordedAudioUrl,
  evaluation,
  onSubmit,
  onSaveAudio,
  onReset,
  onRetry,
  onNextTask,

  className = '',
}) => {
  // Normalize task instructions
  const displayPrompt =
    taskPrompt ||
    promptQuestionEn ||
    instructionsEnglish ||
    'Describe what you observe or respond to the speaker in natural English.';

  // Player state for user's recorded take
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [recordedCurrentTime, setRecordedCurrentTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Setup user recorded audio take player
  useEffect(() => {
    if (!recordedAudioUrl) {
      if (recordedAudioRef.current) {
        recordedAudioRef.current.pause();
      }
      setIsPlayingRecorded(false);
      setRecordedCurrentTime(0);
      setRecordedDuration(0);
      return;
    }

    const audio = new Audio(recordedAudioUrl);
    recordedAudioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setRecordedDuration(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      setRecordedCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlayingRecorded(false);
      setRecordedCurrentTime(0);
    });

    return () => {
      try {
        audio.pause();
      } catch {}
      recordedAudioRef.current = null;
    };
  }, [recordedAudioUrl]);

  // Audio collision safeguard when user records
  useEffect(() => {
    if (isRecording && isPlayingRecorded && recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    }
  }, [isRecording, isPlayingRecorded]);

  const togglePlayRecordedAudio = async () => {
    if (!recordedAudioRef.current || !recordedAudioUrl) return;

    if (isPlayingRecorded) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      stopWordAudio();
      pauseIpaVideo();
      try {
        await recordedAudioRef.current.play();
        setIsPlayingRecorded(true);
      } catch {
        setIsPlayingRecorded(false);
      }
    }
  };

  const handleSeekRecorded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setRecordedCurrentTime(time);
    if (recordedAudioRef.current) {
      recordedAudioRef.current.currentTime = time;
    }
  };

  const handleResetOrRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (onReset) {
      onReset();
    }
  };

  const handleSubmitOrSave = async () => {
    if (onSubmit) {
      await onSubmit();
    } else if (onSaveAudio) {
      await onSaveAudio();
    }
  };

  return (
    <div className={cn('flex flex-col gap-5 text-foreground', className)}>
      {/* 1. Header & Task Directives */}
      <div className="space-y-2 border-b border-border/80 dark:border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-primary" />
            <span>Khu vực ghi âm &amp; Tương tác</span>
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Interaction Pane
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
          {displayPrompt}
        </h3>

        {contextVietnamese && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {contextVietnamese}
          </p>
        )}
      </div>

      {/* 2. Suggested Sentence Starters Chips */}
      {suggestedStarters && suggestedStarters.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Gợi ý mở đầu câu (Sentence Starters):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedStarters.map((starter, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded border border-border/80 bg-muted/30 text-xs font-mono text-foreground/90 select-text"
              >
                "{starter}..."
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Real-Time Live Transcript Display */}
      <div className="w-full">
        <LiveTranscriptDisplay
          interimText={interimTranscript}
          finalText={finalTranscript}
          confidence={confidence}
          isListening={isRecording}
          targetKeywords={targetKeywords}
        />
      </div>

      {/* 4. Central Voice Recording Trigger */}
      <div className="py-2 flex flex-col items-center justify-center">
        <RecordingButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          disabled={disabled}
          state={recordingState}
          audioLevel={audioLevel}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </div>

      {/* 5. Student Recorded Take Playback Scrubber (Post-Recording) */}
      {recordedAudioUrl && (
        <div
          role="region"
          aria-label="Nghe lại bài nói của bạn"
          className="rounded-md border border-border dark:border-slate-800 bg-muted/20 p-3 space-y-2 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              Bản ghi âm của bạn (Review Take)
            </span>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {formatTime(recordedCurrentTime)} / {formatTime(recordedDuration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayRecordedAudio}
              aria-label={isPlayingRecorded ? 'Tạm dừng nghe lại' : 'Nghe lại bài nói'}
              className="size-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center cursor-pointer touch-manipulation transition shrink-0"
            >
              {isPlayingRecorded ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={recordedDuration > 0 ? recordedDuration : 100}
              step={0.1}
              value={recordedCurrentTime}
              onChange={handleSeekRecorded}
              aria-label="Thanh trượt nghe lại bản ghi"
              className="w-full h-1.5 bg-muted rounded appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}

      {/* 6. Evaluation Result Card (When Available) */}
      {evaluation && (
        <div
          role="status"
          aria-label="Kết quả đánh giá bài nói"
          className={cn(
            'rounded-md border p-3.5 sm:p-4 space-y-3 transition-all',
            evaluation.passed !== false
              ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20'
              : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20'
          )}
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              {evaluation.passed !== false ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Kết quả đánh giá
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-sm font-bold">
              <span>Điểm:</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-mono font-bold tabular-nums',
                  evaluation.score >= 70
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                )}
              >
                {evaluation.score}/100
              </span>
            </div>
          </div>

          {evaluation.feedbackVi && (
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {evaluation.feedbackVi}
            </p>
          )}

          {/* Keywords breakdown */}
          <div className="flex flex-wrap gap-2 text-xs font-mono pt-1">
            {evaluation.matchedKeywords && evaluation.matchedKeywords.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Đã dùng:
                </span>
                {evaluation.matchedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {evaluation.missedKeywords && evaluation.missedKeywords.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠ Cần bổ sung:
                </span>
                {evaluation.missedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Action Control Footer Buttons (Re-record, Submit, Next) */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/80">
        <button
          type="button"
          onClick={handleResetOrRetry}
          disabled={isRecording || isProcessing}
          className={cn(
            'min-h-[44px] px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium border border-border bg-card',
            'hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition cursor-pointer touch-manipulation',
            (isRecording || isProcessing) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Thu âm lại</span>
        </button>

        <div className="flex items-center gap-2">
          {(onSubmit || onSaveAudio) && (
            <button
              type="button"
              onClick={handleSubmitOrSave}
              disabled={isRecording || isProcessing || (!finalTranscript && !recordedAudioUrl)}
              className={cn(
                'min-h-[44px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-primary text-primary-foreground',
                'hover:bg-primary/90 flex items-center gap-1.5 transition cursor-pointer touch-manipulation shadow-2xs',
                (isRecording || isProcessing || (!finalTranscript && !recordedAudioUrl)) &&
                  'opacity-40 cursor-not-allowed shadow-none'
              )}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Nộp bài &amp; Chấm điểm</span>
            </button>
          )}

          {onNextTask && (
            <button
              type="button"
              onClick={onNextTask}
              className="min-h-[44px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1.5 transition cursor-pointer touch-manipulation"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingInteractionPane;
