'use client';

import React, { useState, useEffect } from 'react';
import type { IpaPhoneme, UserPhonemeProgress } from '@/types/ipa';
import { playWordAudio } from '@/lib/audio';
import { savePhonemeProgress } from '@/lib/ipa-client';
import {
  Volume2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Mic,
  Repeat,
  Flame,
  Award,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveIpaVideoPlayer } from '@/components/pronunciation/InteractiveIpaVideoPlayer';
import { SpeechRecorder } from '@/components/speaking/SpeechRecorder';

export interface IpaPracticeStudioProps {
  phoneme: IpaPhoneme;
  onClose: () => void;
  onFinished?: () => void;
}

type Stage = 1 | 2 | 3 | 4 | 5;

export function IpaPracticeStudio({
  phoneme,
  onClose,
  onFinished,
}: IpaPracticeStudioProps) {
  const [currentStage, setCurrentStage] = useState<Stage>(1);

  // Stage 2: Minimal Pair Quiz State
  const [quizIndex, setQuizIndex] = useState(0);
  const [targetWord, setTargetWord] = useState<string>('');
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Stage 3: Position tab (initial | medial | final)
  const [positionTab, setPositionTab] = useState<'initial' | 'medial' | 'final'>('initial');

  // Stage 4: Speech Recorder & Comparison State
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Stage 5: Sentence shadowing
  const [sentenceIndex, setSentenceIndex] = useState(0);

  // Setup Stage 2 quiz question
  useEffect(() => {
    if (phoneme.minimalPairs.length > 0) {
      const pair = phoneme.minimalPairs[quizIndex % phoneme.minimalPairs.length];
      const target = Math.random() < 0.5 ? pair.target : pair.contrast;
      setTargetWord(target);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  }, [phoneme, quizIndex]);

  const handlePlayTargetAudio = () => {
    if (targetWord) {
      void playWordAudio(targetWord);
    }
  };

  const handleSelectQuizAnswer = (choice: string) => {
    if (isAnswered) return;
    setSelectedAnswer(choice);
    setIsAnswered(true);
    const correct = choice === targetWord;
    if (correct) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const nextQuizRound = () => {
    if (quizIndex + 1 < (phoneme.minimalPairs.length || 3)) {
      setQuizIndex((prev) => prev + 1);
    } else {
      // Completed Stage 2
      savePhonemeProgress(phoneme.id, { stagesCompleted: Math.max(2, 2), masteryPercent: 40 });
      setCurrentStage(3);
    }
  };

  // Stage 4: Native Audio Recording via MediaStream
  const startUserAudioRecording = async () => {
    try {
      setRecordedAudioUrl(null);
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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch {
      alert('Không truy cập được Micro. Vui lòng cho phép quyền truy cập Micro trên trình duyệt.');
    }
  };

  const stopUserAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const handleCompleteAll = () => {
    savePhonemeProgress(phoneme.id, {
      stagesCompleted: 5,
      masteryPercent: 100,
      stars: 3,
    });
    if (onFinished) onFinished();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Sleek Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-mono font-black text-lg flex items-center justify-center shadow-xs shrink-0">
              /{phoneme.symbol}/
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-bold">{phoneme.name}</h2>
                {phoneme.difficultyForVn === 'high' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60">
                    Hay sai
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span>Từ mẫu:</span>
                <span className="font-bold text-foreground">{phoneme.anchorWord}</span>
                <span className="font-mono text-[11px] opacity-70">{phoneme.anchorWordIpa}</span>
                <button
                  type="button"
                  onClick={() => void playWordAudio(phoneme.anchorWord)}
                  className="text-primary hover:scale-110 transition-transform p-0.5"
                  title="Nghe từ mẫu"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Minimalist Segmented Stepper */}
        <div className="flex items-center border-b bg-muted/20 px-2 py-1.5 gap-1 overflow-x-auto">
          {[
            { id: 1, label: '1. Khẩu hình' },
            { id: 2, label: '2. Luyện tai' },
            { id: 3, label: '3. Vị trí từ' },
            { id: 4, label: '4. Thu âm' },
            { id: 5, label: '5. Luyện câu' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStage(s.id as Stage)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all text-center ${
                currentStage === s.id
                  ? 'bg-background text-foreground shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* STAGE 1: ARTICULATION & RACHEL VIDEO */}
          {currentStage === 1 && (
            <div className="space-y-3">
              {/* Rachel's English Video Integration */}
              <InteractiveIpaVideoPlayer
                video={phoneme.video}
                ipa={phoneme.symbol}
                title={phoneme.name}
                defaultCollapsed={false}
                collapsible={false}
                hideHeader={true}
                cleanMode={true}
              />

              {/* Compact Articulation Guide */}
              <div className="rounded-xl bg-muted/40 p-3 border space-y-1.5 text-xs">
                <div className="flex items-start gap-1.5 text-foreground leading-relaxed">
                  <span className="font-bold text-primary shrink-0">💡 Khẩu hình:</span>
                  <span>{phoneme.mouthTip}</span>
                </div>
                {phoneme.vietnameseNote && (
                  <div className="flex items-start gap-1.5 text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">⚠️ Lưu ý:</span>
                    <span>{phoneme.vietnameseNote}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    savePhonemeProgress(phoneme.id, { stagesCompleted: 1, masteryPercent: 20 });
                    setCurrentStage(2);
                  }}
                  className="w-full sm:w-auto h-9 text-xs font-semibold"
                >
                  Nấc 2: Luyện tai phân biệt cặp âm →
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 2: MINIMAL PAIR DISCRIMINATION QUIZ */}
          {currentStage === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Nghe và chọn từ đúng:</h3>
                <p className="text-xs text-muted-foreground">
                  Phân biệt sự khác biệt giữa âm /{phoneme.symbol}/ và âm đối lập dễ nhầm lẫn.
                </p>
              </div>

              {phoneme.minimalPairs.length > 0 ? (
                <div className="p-5 rounded-xl bg-muted/30 border text-center space-y-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handlePlayTargetAudio}
                      className="w-14 h-14 rounded-full border-2 border-primary/50 bg-primary/5 hover:bg-primary/15 flex items-center justify-center transition-all hover:scale-105 shadow-xs"
                      title="Bấm để nghe âm thanh bí mật"
                    >
                      <Volume2 className="w-6 h-6 text-primary" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Bấm loa để nghe âm thanh</p>

                  <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                    {(() => {
                      const pair = phoneme.minimalPairs[quizIndex % phoneme.minimalPairs.length];
                      const options = [pair.target, pair.contrast].sort();
                      return options.map((opt) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrect = opt === targetWord;
                        let btnClass = 'border-border bg-card hover:border-primary';
                        if (isAnswered) {
                          if (isCorrect) btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold';
                          else if (isSelected) btnClass = 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300';
                        }
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectQuizAnswer(opt)}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {isAnswered && (
                    <div className="pt-1 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {phoneme.minimalPairs[quizIndex % phoneme.minimalPairs.length].note}
                      </p>
                      <Button size="sm" onClick={nextQuizRound} className="h-8 text-xs font-semibold">
                        Câu tiếp theo →
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  Âm này không có cặp tối thiểu gây nhầm lẫn lớn.
                  <div className="mt-3">
                    <Button size="sm" onClick={() => setCurrentStage(3)} className="h-8 text-xs font-semibold">
                      Qua nấc 3: Vị trí từ →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: 3 POSITIONS OF SOUND (INITIAL, MEDIAL, FINAL) */}
          {currentStage === 3 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Luyện âm /{phoneme.symbol}/ ở 3 vị trí từ</h3>
                <p className="text-xs text-muted-foreground">
                  Người Việt hay nuốt âm cuối từ. Bấm vào từ để nghe phát âm chuẩn:
                </p>
              </div>

              {/* Position Sub-tabs */}
              <div className="flex rounded-lg border p-0.5 bg-muted/40 gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPositionTab('initial')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    positionTab === 'initial' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'
                  }`}
                >
                  Đầu từ ({phoneme.initialWords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPositionTab('medial')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    positionTab === 'medial' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'
                  }`}
                >
                  Giữa từ ({phoneme.medialWords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPositionTab('final')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${
                    positionTab === 'final' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'
                  }`}
                >
                  Cuối từ ({phoneme.finalWords.length})
                </button>
              </div>

              {/* Words Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(() => {
                  const words =
                    positionTab === 'initial'
                      ? phoneme.initialWords
                      : positionTab === 'medial'
                        ? phoneme.medialWords
                        : phoneme.finalWords;

                  if (words.length === 0) {
                    return (
                      <div className="col-span-3 text-center py-4 text-xs text-muted-foreground">
                        Âm này không xuất hiện ở vị trí này.
                      </div>
                    );
                  }

                  return words.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => void playWordAudio(w)}
                      className="p-2.5 rounded-lg border bg-card hover:border-primary/60 hover:bg-muted/30 flex items-center justify-between text-left transition-all group"
                    >
                      <span className="font-bold text-xs group-hover:text-primary transition-colors">{w}</span>
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                    </button>
                  ));
                })()}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    savePhonemeProgress(phoneme.id, { stagesCompleted: 3, masteryPercent: 60 });
                    setCurrentStage(4);
                  }}
                  className="w-full sm:w-auto h-9 text-xs font-semibold"
                >
                  Tiếp tục: Nấc 4 - Thu âm đối chiếu →
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 4: VOICE RECORDING & COMPARISON */}
          {currentStage === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Thu âm giọng đọc & đối chiếu</h3>
                <p className="text-xs text-muted-foreground">
                  Phát âm từ <b>"{phoneme.anchorWord}"</b> /{phoneme.anchorWordIpa}/ và nghe lại để so sánh với cô Rachel.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black font-mono">/{phoneme.symbol}/</span>
                  <span className="text-lg font-bold">{phoneme.anchorWord}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void playWordAudio(phoneme.anchorWord)}
                    className="h-8 px-2.5 rounded-lg gap-1 text-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-primary" /> Mẫu
                  </Button>
                </div>

                {/* User Microphone Action */}
                <div className="p-3 bg-card rounded-xl border space-y-2.5 max-w-xs mx-auto shadow-xs">
                  <p className="text-xs font-medium text-muted-foreground">Giọng đọc của bạn:</p>
                  <div className="flex justify-center">
                    {!isRecordingAudio ? (
                      <Button
                        size="sm"
                        onClick={startUserAudioRecording}
                        className="rounded-lg gap-1.5 px-4 h-8 text-xs font-semibold"
                      >
                        <Mic className="w-3.5 h-3.5" /> Bắt đầu thu âm
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopUserAudioRecording}
                        className="rounded-lg gap-1.5 px-4 h-8 text-xs font-semibold animate-pulse"
                      >
                        <Mic className="w-3.5 h-3.5" /> Dừng thu âm
                      </Button>
                    )}
                  </div>

                  {/* Playback Recorded User Audio */}
                  {recordedAudioUrl && (
                    <div className="pt-2 border-t space-y-1">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Đã thu âm xong! Nghe lại:
                      </p>
                      <audio controls src={recordedAudioUrl} className="w-full h-7" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    savePhonemeProgress(phoneme.id, { stagesCompleted: 4, masteryPercent: 80 });
                    setCurrentStage(5);
                  }}
                  className="w-full sm:w-auto h-9 text-xs font-semibold"
                >
                  Tiếp tục: Nấc 5 - Luyện câu ngữ cảnh →
                </Button>
              </div>
            </div>
          )}

          {/* STAGE 5: SENTENCE CONTEXT & SHADOWING */}
          {currentStage === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Luyện câu ngữ cảnh & Shadowing</h3>
                <p className="text-xs text-muted-foreground">
                  Đặt âm /{phoneme.symbol}/ vào mạch câu giao tiếp tự nhiên:
                </p>
              </div>

              <div className="space-y-2">
                {phoneme.practiceSentences.map((s) => (
                  <div
                    key={s.sentence}
                    className="p-3 rounded-xl border bg-card hover:border-primary/50 transition-all space-y-1 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {s.sentence.split(' ').map((word, i) => {
                            const clean = word.replace(/[^a-zA-Z]/g, '');
                            const isTarget = s.targetWords.some(
                              (tw) => tw.toLowerCase() === clean.toLowerCase(),
                            );
                            return (
                              <span
                                key={i}
                                className={
                                  isTarget
                                    ? 'text-primary font-black border-b-2 border-primary/50 mr-1'
                                    : 'mr-1'
                                }
                              >
                                {word}
                              </span>
                            );
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.translationVi}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void playWordAudio(s.targetWords[0] || phoneme.anchorWord)}
                        className="h-8 w-8 rounded-lg shrink-0 text-primary hover:bg-primary/10"
                        title="Nghe từ khóa"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion Banner */}
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    Xuất sắc! Đã hoàn thành 5 bước âm /{phoneme.symbol}/
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Đã ghi nhận 100% độ thành thạo và tặng +30 XP vào hồ sơ.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleCompleteAll}
                  className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Lưu thành tích & Hoàn thành 🎉
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
