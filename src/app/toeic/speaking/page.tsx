'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  HelpCircle,
  Lightbulb,
  Mic,
  Calendar,
  Image as ImageIcon,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { speak, silenceSpeech } from '@/lib/study';
import {
  TOEIC_SPEAKING_TESTS,
  ToeicSpeakingExam,
  ToeicSpeakingQuestion,
} from '@/data/toeic/speaking';
import { SpeechRecorder } from '@/components/speaking/SpeechRecorder';

type ExamMode = 'practice' | 'simulation';
type SimPhase = 'idle' | 'prep' | 'speak' | 'review';

export default function ToeicSpeakingPage() {
  const currentExam: ToeicSpeakingExam = TOEIC_SPEAKING_TESTS[0];
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const activeQuestion: ToeicSpeakingQuestion = currentExam.questions[currentQIndex];

  const [examMode, setExamMode] = useState<ExamMode>('practice');
  const [modelLevel, setModelLevel] = useState<'level6' | 'level8'>('level8');
  const [isNarrating, setIsNarrating] = useState(false);

  // Simulation timer states
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [recordedTranscripts, setRecordedTranscripts] = useState<{ [qNum: number]: string }>({});

  useEffect(() => {
    return () => {
      silenceSpeech();
    };
  }, [currentQIndex, examMode]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            handlePhaseTransition();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, simPhase]);

  const handlePhaseTransition = () => {
    if (simPhase === 'prep') {
      toast.info('Hết thời gian chuẩn bị! Bắt đầu nói (Speak Now)!');
      setSimPhase('speak');
      setTimerSeconds(activeQuestion.speakTimeSeconds);
      setIsTimerRunning(true);
    } else if (simPhase === 'speak') {
      toast.success(`Đã hoàn thành câu ${activeQuestion.questionNumber}!`);
      if (currentQIndex < currentExam.questions.length - 1) {
        // Advance to next question
        const nextIdx = currentQIndex + 1;
        setCurrentQIndex(nextIdx);
        const nextQ = currentExam.questions[nextIdx];
        setSimPhase('prep');
        setTimerSeconds(nextQ.prepTimeSeconds);
        setIsTimerRunning(true);
      } else {
        setSimPhase('review');
        setIsTimerRunning(false);
        toast.success('Chúc mừng! Bạn đã hoàn thành toàn bộ 11 câu hỏi TOEIC Speaking!');
      }
    }
  };

  const startSimulation = () => {
    setExamMode('simulation');
    setCurrentQIndex(0);
    setRecordedTranscripts({});
    const firstQ = currentExam.questions[0];
    setSimPhase('prep');
    setTimerSeconds(firstQ.prepTimeSeconds);
    setIsTimerRunning(true);
    toast.success('Bắt đầu làm bài thi ETS TOEIC Speaking!');
  };

  const stopSimulation = () => {
    setIsTimerRunning(false);
    setSimPhase('idle');
    setTimerSeconds(0);
    setExamMode('practice');
    silenceSpeech();
  };

  const handleNarrate = (text: string) => {
    if (isNarrating) {
      silenceSpeech();
      setIsNarrating(false);
    } else {
      silenceSpeech();
      setIsNarrating(true);
      speak(text, 1.0);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'read_aloud':
        return { label: 'Q1-2: Read Aloud', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'describe_picture':
        return { label: 'Q3-4: Describe Picture', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'respond_questions':
        return { label: 'Q5-7: Respond Questions', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'information_schedule':
        return { label: 'Q8-10: Schedule Info', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'express_opinion':
        return { label: 'Q11: Express Opinion', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      default:
        return { label: 'Question', color: 'bg-slate-800 text-slate-300' };
    }
  };

  const activeBadge = getQuestionTypeBadge(activeQuestion.questionType);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/toeic"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
          >
            <ChevronLeft className="size-4" /> TOEIC Hub
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-indigo-400 flex items-center gap-1.5">
              <Award className="size-4" /> TOEIC Speaking Lab
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              11 Questions • Score 0 - 200
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {examMode === 'practice' ? (
            <Button
              size="sm"
              onClick={startSimulation}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 font-semibold shadow-md shadow-indigo-900/40"
            >
              <Play className="size-3.5 mr-1" /> Thi thử tính giờ (Real Exam)
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={stopSimulation}
              className="text-xs h-8 font-semibold"
            >
              <Square className="size-3.5 mr-1" /> Thoát thi thử
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Question Palette Strip */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {currentExam.questions.map((q, idx) => {
              const isCurrent = currentQIndex === idx;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    if (examMode !== 'simulation') {
                      setCurrentQIndex(idx);
                    }
                  }}
                  disabled={examMode === 'simulation'}
                  className={`size-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 scale-105'
                      : recordedTranscripts[q.questionNumber]
                      ? 'bg-emerald-950/60 border border-emerald-600/50 text-emerald-300'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {q.questionNumber}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono border font-medium ${activeBadge.color}`}>
              {activeBadge.label}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Prep: {activeQuestion.prepTimeSeconds}s • Speak: {activeQuestion.speakTimeSeconds}s
            </span>
          </div>
        </div>

        {/* SIMULATION TIMER BANNER (If in simulation mode) */}
        {examMode === 'simulation' && simPhase !== 'review' && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`size-3 rounded-full ${simPhase === 'speak' ? 'bg-red-500 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="font-bold text-sm text-white uppercase tracking-wider">
                  {simPhase === 'prep' ? '🕒 Thời gian chuẩn bị (Preparation Time)' : '🎙️ Đang ghi âm bài nói (Speak Now)'}
                </div>
                <div className="text-xs text-slate-400">
                  Câu hỏi {activeQuestion.questionNumber} / 11 • {activeQuestion.titleVi}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-slate-400 uppercase">Còn lại:</span>
              <span className={`text-3xl font-bold tracking-wider ${simPhase === 'speak' ? 'text-red-400' : 'text-amber-400'}`}>
                {formatTimer(timerSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Main Question Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Prompt & Stimulus (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">{activeQuestion.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{activeQuestion.titleVi}</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Q{activeQuestion.questionNumber}
                </span>
              </div>

              {/* Stimulus Context Area */}
              {activeQuestion.stimulusText && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-sm leading-relaxed text-slate-100 font-sans tracking-wide">
                  <div className="text-[10px] uppercase font-mono text-slate-500 font-bold mb-2">
                    Text to read aloud (Đoạn văn cần đọc to):
                  </div>
                  {activeQuestion.stimulusText}
                </div>
              )}

              {activeQuestion.imageContext && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <ImageIcon className="size-4" /> Mô tả bối cảnh bức tranh (Visual Scene Context):
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    &ldquo;{activeQuestion.imageContext.sceneDescription}&rdquo;
                  </p>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Gợi ý phân bổ chi tiết:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 mt-1">
                      {activeQuestion.imageContext.suggestedFocus.map((f, fi) => (
                        <li key={fi}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeQuestion.scheduleData && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                  <div className="border-b border-slate-800 pb-2">
                    <div className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                      <Calendar className="size-4" /> {activeQuestion.scheduleData.heading}
                    </div>
                    {activeQuestion.scheduleData.subheading && (
                      <div className="text-xs text-slate-400">{activeQuestion.scheduleData.subheading}</div>
                    )}
                  </div>
                  <div className="divide-y divide-slate-850">
                    {activeQuestion.scheduleData.entries.map((item, ii) => (
                      <div key={ii} className="py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-mono text-slate-400 shrink-0 w-36">{item.time}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{item.activity}</div>
                          {item.speakerOrLocation && (
                            <div className="text-[11px] text-slate-400">{item.speakerOrLocation}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt Text (for Q5-7, Q8-10, Q11) */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200">
                <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 block mb-1">
                  Yêu cầu trả lời:
                </span>
                <p className="font-medium text-sm text-white mb-1">{activeQuestion.promptText}</p>
                <p className="text-slate-400">{activeQuestion.promptVi}</p>
              </div>

              {/* Speech Recording Component */}
              <div className="pt-2 flex flex-col items-center gap-2">
                <SpeechRecorder
                  onTranscript={(transcript) => {
                    setRecordedTranscripts((prev) => ({
                      ...prev,
                      [activeQuestion.questionNumber]: transcript,
                    }));
                    toast.success(`Đã ghi nhận câu trả lời cho Q${activeQuestion.questionNumber}`);
                  }}
                />
                {recordedTranscripts[activeQuestion.questionNumber] && (
                  <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300">
                    <strong>Nội dung nhận diện giọng nói:</strong> &ldquo;{recordedTranscripts[activeQuestion.questionNumber]}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0 || examMode === 'simulation'}
                className="border-slate-800 text-xs"
              >
                <ChevronLeft className="size-4 mr-1" /> Câu trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQIndex((prev) => Math.min(currentExam.questions.length - 1, prev + 1))}
                disabled={currentQIndex === currentExam.questions.length - 1 || examMode === 'simulation'}
                className="border-slate-800 text-xs"
              >
                Câu tiếp theo <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Model Answers & Scoring Rubric (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Level Toggle & Sample Speech */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-indigo-400" /> Câu trả lời mẫu chuẩn ETS
                </h3>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setModelLevel('level6')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                      modelLevel === 'level6' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Level 6 (130-150)
                  </button>
                  <button
                    onClick={() => setModelLevel('level8')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                      modelLevel === 'level8' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Level 8 (180-200)
                  </button>
                </div>
              </div>

              {/* Sample text block */}
              {(() => {
                const sample = modelLevel === 'level6' ? activeQuestion.sampleAnswerLevel6 : activeQuestion.sampleAnswerLevel8;
                return (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      &ldquo;{sample}&rdquo;
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNarrate(sample)}
                        className="text-xs border-slate-800 hover:bg-slate-800 text-indigo-400 h-7"
                      >
                        {isNarrating ? <VolumeX className="size-3.5 mr-1" /> : <Volume2 className="size-3.5 mr-1" />}
                        {isNarrating ? 'Dừng đọc' : `Nghe giọng mẫu ${modelLevel}`}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rubrics & Tips */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="size-3.5" /> Tiêu chí chấm điểm & Mẹo ăn điểm
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-300">Phát âm & Ngữ điệu:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeQuestion.scoringRubricVi.pronunciationAndStress}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-300">Ngữ pháp & Từ vựng:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeQuestion.scoringRubricVi.grammarAndVocabulary}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-300">Mạch lạc & Đầy đủ ý:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeQuestion.scoringRubricVi.coherenceAndRelevance}</p>
                </div>
              </div>

              {/* Key tips list */}
              {activeQuestion.keyTipsVi && activeQuestion.keyTipsVi.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400">Chiến thuật then chốt:</span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 mt-1">
                    {activeQuestion.keyTipsVi.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key vocabulary tags */}
              {activeQuestion.keyVocabulary && activeQuestion.keyVocabulary.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400">Từ vựng ghi điểm:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeQuestion.keyVocabulary.map((v, vIdx) => (
                      <div key={vIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        <span className="font-bold text-indigo-300">{v.term}</span> {v.ipa && <span className="text-slate-500 font-mono">[{v.ipa}]</span>}: {v.meaningVi}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
