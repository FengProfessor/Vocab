'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Volume2,
  CheckCircle2,
  Radio,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  evaluateSafeHarborSpeech,
  evaluateSafeHarborSpeechDetailed,
} from '@/lib/speaking/safe-harbor-matcher';
import type {
  SafeHarborResult,
  SafeHarborEvaluationResult,
} from '@/types/speaking-foundation';
import { pauseIpaVideo } from '@/components/pronunciation/InteractiveIpaVideoPlayer';
import { stopWordAudio } from '@/lib/audio';

export interface SafeHarborRecorderProps {
  /** The target phrase or sentence the learner should enunciate */
  targetSentence: string;
  /** Explicit list of communicative content keywords, if defined by the lesson */
  coreKeywords?: string[];
  /** Callback triggered when evaluation completes */
  onResult?: (result: SafeHarborResult) => void;
  /** Callback triggered when recording starts or stops */
  onRecordingStateChange?: (isRecording: boolean) => void;
  /** Disable user interaction */
  disabled?: boolean;
  /** Custom container class */
  className?: string;
}

/**
 * SafeHarborRecorder:
 * Affective-filter free voice recorder tailored for False Beginners.
 * Features:
 * 1. Web Speech API STT integration with live interim transcription.
 * 2. MediaRecorder audio fallback with self-listening audio bar.
 * 3. Non-punitive "Self-Practice" fallback for denied mic or unsupported browsers.
 * 4. Automatic pause of background videos (`pauseIpaVideo()`) and audio clips.
 * 5. Visual token breakdown: Emerald for matched keywords, Amber for missed, Slate for forgiven words.
 */
export const SafeHarborRecorder: React.FC<SafeHarborRecorderProps> = ({
  targetSentence,
  coreKeywords,
  onResult,
  onRecordingStateChange,
  disabled = false,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [interimText, setInterimText] = useState<string>('');
  const [evaluation, setEvaluation] = useState<SafeHarborResult | null>(null);
  const [detailedEvaluation, setDetailedEvaluation] =
    useState<SafeHarborEvaluationResult | null>(null);
  const [browserSupportSTT, setBrowserSupportSTT] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [selfPracticed, setSelfPracticed] = useState<boolean>(false);

  // Recognition and media refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestSpokenRef = useRef<string>('');

  // Stop recording cleanup
  const stopAllRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    onRecordingStateChange?.(false);
  }, [onRecordingStateChange]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;
    const SpeechRecognitionClass = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setBrowserSupportSTT(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 3;

      rec.onstart = () => {
        setIsRecording(true);
        onRecordingStateChange?.(true);
        setPermissionError(null);
        setInterimText('');
        latestSpokenRef.current = '';
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            final += res[0].transcript + ' ';
          } else {
            interim += res[0].transcript + ' ';
          }
        }

        const candidate = (final || interim).trim();
        latestSpokenRef.current = candidate;
        setInterimText(candidate);

        if (final.trim()) {
          const evalRes = evaluateSafeHarborSpeech(final.trim(), targetSentence, coreKeywords);
          const detailed = evaluateSafeHarborSpeechDetailed(
            final.trim(),
            targetSentence,
            coreKeywords
          );
          setEvaluation(evalRes);
          setDetailedEvaluation(detailed);
          onResult?.(evalRes);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionError('Vui lòng cho phép quyền truy cập micro trong trình duyệt để luyện nói.');
        } else if (event.error === 'no-speech') {
          setPermissionError('Chưa nhận được âm thanh. Hãy ghé sát micro và nói to hơn nhé.');
        }
        setIsRecording(false);
        onRecordingStateChange?.(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        onRecordingStateChange?.(false);

        // Fallback: If recognition finished but final wasn't emitted while interim existed
        if (latestSpokenRef.current && !evaluation) {
          const evalRes = evaluateSafeHarborSpeech(
            latestSpokenRef.current,
            targetSentence,
            coreKeywords
          );
          const detailed = evaluateSafeHarborSpeechDetailed(
            latestSpokenRef.current,
            targetSentence,
            coreKeywords
          );
          setEvaluation(evalRes);
          setDetailedEvaluation(detailed);
          onResult?.(evalRes);
        }
      };

      recognitionRef.current = rec;
    } catch {
      setBrowserSupportSTT(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [targetSentence, coreKeywords, onResult, onRecordingStateChange, evaluation]);

  // Start Voice Capture
  const handleStartRecording = async () => {
    if (disabled) return;

    // Reset previous feedback
    setEvaluation(null);
    setDetailedEvaluation(null);
    setPermissionError(null);
    setSelfPracticed(false);
    setInterimText('');
    latestSpokenRef.current = '';

    // 1. Mutual exclusion: pause background IPA video and active audio
    pauseIpaVideo();
    stopWordAudio();

    // Start Web Speech API if supported
    if (browserSupportSTT && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed, trying MediaRecorder:', err);
      }
    }

    // Fallback: Audio recording via MediaRecorder
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        onRecordingStateChange?.(true);
      } catch (err) {
        setPermissionError('Không thể mở micro. Bạn có thể sử dụng nút Tự Đánh Giá bên dưới.');
      }
    } else {
      setPermissionError('Trình duyệt không hỗ trợ thu âm trực tiếp. Hãy dùng nút Tự Đánh Giá.');
    }
  };

  // Self-Practice Action: Always advances the student safely
  const handleSelfPracticePass = () => {
    const evalRes = evaluateSafeHarborSpeech(targetSentence, targetSentence, coreKeywords);
    const detailed = evaluateSafeHarborSpeechDetailed(targetSentence, targetSentence, coreKeywords);
    setEvaluation(evalRes);
    setDetailedEvaluation(detailed);
    setSelfPracticed(true);
    setPermissionError(null);
    onResult?.(evalRes);
  };

  return (
    <div
      className={`w-full flex flex-col items-center gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-inner ${className}`}
    >
      {/* Live Interim Transcript Display */}
      {isRecording && (
        <div className="w-full flex flex-col items-center gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-pulse">
            <Radio className="size-3.5" />
            <span>Đang lắng nghe... Hãy nói to và tự tin</span>
          </div>

          <div className="min-h-[44px] flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-sm text-indigo-200 text-center italic max-w-md">
            {interimText ? `“${interimText}”` : 'Đang nhận tín hiệu âm thanh...'}
          </div>
        </div>
      )}

      {/* Permission / Browser Guidance Alert */}
      {permissionError && (
        <div className="w-full max-w-md flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Primary Microphone Trigger Button */}
      <div className="relative flex items-center justify-center">
        {isRecording ? (
          <>
            {/* Animated Pulse Rings */}
            <span className="absolute size-24 rounded-full bg-red-500/20 animate-ping" />
            <span className="absolute size-20 rounded-full bg-red-500/30 animate-pulse" />
            <Button
              type="button"
              variant="destructive"
              onClick={stopAllRecording}
              aria-label="Dừng ghi âm và chấm điểm"
              className="relative z-10 size-16 rounded-full p-0 flex items-center justify-center bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/40 transition-transform active:scale-95"
            >
              <Square className="size-6 text-white" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={disabled}
            onClick={handleStartRecording}
            aria-label="Bắt đầu ghi âm phát âm"
            className="size-16 rounded-full p-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40 transition-transform active:scale-95 hover:scale-105"
          >
            <Mic className="size-7 text-white" />
          </Button>
        )}
      </div>

      <span className="text-xs text-slate-400 text-center font-medium">
        {isRecording
          ? 'Nhấn nút vuông đỏ khi nói xong'
          : evaluation
          ? 'Nhấn micro để luyện lại lần nữa'
          : 'Nhấn Micro và đọc to câu mẫu'}
      </span>

      {/* Self-Listening Audio Playback Bar (if MediaRecorder was used) */}
      {recordedAudioUrl && !isRecording && (
        <div className="w-full max-w-sm flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <Volume2 className="size-4 text-indigo-400 shrink-0" />
          <span className="text-[11px]">Bản thu của bạn:</span>
          <audio controls src={recordedAudioUrl} className="h-7 w-full max-w-[200px]" />
        </div>
      )}

      {/* Safe Harbor Evaluation Result Card */}
      {evaluation && (
        <div className="w-full max-w-lg flex flex-col gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg transition-all animate-fadeIn">
          {/* Header with Score & Tier Badge */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              {evaluation.tier === 'excellent' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                  <Sparkles className="size-3.5 text-emerald-400" />
                  <span>Xuất sắc (Bản ngữ hiểu 100%)</span>
                </div>
              ) : evaluation.passed ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  <span>Đạt chuẩn an toàn (Safe Harbor)</span>
                </div>
              ) : evaluation.tier === 'getting_closer' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                  <CheckCircle2 className="size-3.5 text-amber-400" />
                  <span>Rất gần rồi (Tiếp tục nhé)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold">
                  <RotateCcw className="size-3.5 text-indigo-400" />
                  <span>Thử lại nhẹ nhàng</span>
                </div>
              )}

              {selfPracticed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Tự luyện
                </span>
              )}
            </div>

            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium">
              {evaluation.score}% Chuẩn
            </span>
          </div>

          {/* Supportive Vietnamese Pedagogical Feedback */}
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {evaluation.feedbackVi}
          </p>

          {/* Visual Word-by-Word Breakdown */}
          {detailedEvaluation && detailedEvaluation.tokenFeedback.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Chi tiết từ vựng đã nhận diện:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detailedEvaluation.tokenFeedback.map((tok, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                      tok.status === 'matched'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : tok.status === 'missed'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                    }`}
                    title={
                      tok.status === 'matched'
                        ? 'Từ khóa: Nhận diện chuẩn'
                        : tok.status === 'missed'
                        ? 'Từ khóa: Cần nhấn rõ hơn'
                        : 'Từ chức năng phụ: Được miễn trừ lỗi'
                    }
                  >
                    {tok.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Retry Action */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={handleStartRecording}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
            >
              <RefreshCw className="size-3" />
              <span>Nói lại lần nữa</span>
            </Button>
          </div>
        </div>
      )}

      {/* Fallback Option: Self-Practice Button */}
      {(!browserSupportSTT || permissionError) && !evaluation && (
        <div className="w-full max-w-md flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center">
          <p className="text-xs text-slate-400">
            Trình duyệt hạn chế thu âm? Bạn vẫn có thể luyện nói to theo mẫu và tự đánh giá.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSelfPracticePass}
            className="border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-900/50 text-xs"
          >
            <CheckCircle2 className="size-3.5 mr-1.5 text-indigo-400" />
            <span>Tôi đã nói to câu này (Tự đánh giá)</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SafeHarborRecorder;
