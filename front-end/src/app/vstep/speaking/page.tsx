'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { speak, silenceSpeech } from '@/lib/study';
import {
  VSTEP_SPEAKING_PART1_TOPICS,
  VSTEP_SPEAKING_PART2_SCENARIOS,
  VSTEP_SPEAKING_PART3_TOPICS,
  VSTEP_FULL_SPEAKING_EXAMS,
  VstepSpeakingPart1Topic,
  VstepSpeakingPart2Scenario,
  VstepSpeakingPart3Topic,
  VstepFullSpeakingExam,
} from '@/data/vstep/speaking';
import { SpeechRecorder } from '@/components/speaking/SpeechRecorder';

type SpeakingTab = 'part1' | 'part2' | 'part3' | 'full_exam';

export default function VstepSpeakingPage() {
  const [activeTab, setActiveTab] = useState<SpeakingTab>('part1');
  const [isNarrating, setIsNarrating] = useState(false);
  const [activeSpeechSample, setActiveSpeechSample] = useState<string | null>(null);

  // Part 1 states
  const [selectedP1Index, setSelectedP1Index] = useState(0);
  const [p1Level, setP1Level] = useState<'B1' | 'B2' | 'C1'>('B2');
  const activeP1Topic: VstepSpeakingPart1Topic = VSTEP_SPEAKING_PART1_TOPICS[selectedP1Index] || VSTEP_SPEAKING_PART1_TOPICS[0];

  // Part 2 states
  const [selectedP2Index, setSelectedP2Index] = useState(0);
  const [p2Level, setP2Level] = useState<'B2' | 'C1'>('B2');
  const activeP2Scenario: VstepSpeakingPart2Scenario = VSTEP_SPEAKING_PART2_SCENARIOS[selectedP2Index] || VSTEP_SPEAKING_PART2_SCENARIOS[0];

  // Part 3 states
  const [selectedP3Index, setSelectedP3Index] = useState(0);
  const [p3Level, setP3Level] = useState<'B2' | 'C1'>('B2');
  const activeP3Topic: VstepSpeakingPart3Topic = VSTEP_SPEAKING_PART3_TOPICS[selectedP3Index] || VSTEP_SPEAKING_PART3_TOPICS[0];

  // Full Exam Simulation states
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const activeExam: VstepFullSpeakingExam = VSTEP_FULL_SPEAKING_EXAMS[selectedExamIndex] || VSTEP_FULL_SPEAKING_EXAMS[0];
  const [examStep, setExamStep] = useState<'intro' | 'part1' | 'part2_prep' | 'part2_speak' | 'part3_prep' | 'part3_speak' | 'finished'>('intro');
  const [examTimer, setExamTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>('');

  // Stop speaking when unmounting or switching tabs
  useEffect(() => {
    return () => {
      silenceSpeech();
    };
  }, [activeTab]);

  const handleExamTimerExpired = useCallback(() => {
    setIsTimerRunning(false);
    toast.info('Hết thời gian của phần này! Đang chuyển tiếp bước tiếp theo...');
    if (examStep === 'part1') {
      setExamStep('part2_prep');
      setExamTimer(60);
      setIsTimerRunning(true);
    } else if (examStep === 'part2_prep') {
      setExamStep('part2_speak');
      setExamTimer(180);
      setIsTimerRunning(true);
    } else if (examStep === 'part2_speak') {
      setExamStep('part3_prep');
      setExamTimer(60);
      setIsTimerRunning(true);
    } else if (examStep === 'part3_prep') {
      setExamStep('part3_speak');
      setExamTimer(240);
      setIsTimerRunning(true);
    } else if (examStep === 'part3_speak') {
      setExamStep('finished');
    }
  }, [examStep]);

  // Simulation timer: mỗi tick đọc state hiện tại, không gọi side effect trong state updater.
  useEffect(() => {
    if (!isTimerRunning || examTimer <= 0) return;
    const timeout = window.setTimeout(() => {
      if (examTimer <= 1) {
        handleExamTimerExpired();
      } else {
        setExamTimer(examTimer - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [examTimer, handleExamTimerExpired, isTimerRunning]);

  const startExamSimulation = () => {
    setExamStep('part1');
    setExamTimer(180); // 3 minutes for Part 1
    setIsTimerRunning(true);
    setUserTranscript('');
    toast.success('Bắt đầu thi thử VSTEP Speaking! Part 1 bắt đầu.');
  };

  const stopExamSimulation = () => {
    setIsTimerRunning(false);
    setExamStep('intro');
    setExamTimer(0);
    silenceSpeech();
  };

  const handleNarrate = (text: string) => {
    if (isNarrating && activeSpeechSample === text) {
      silenceSpeech();
      setIsNarrating(false);
      setActiveSpeechSample(null);
    } else {
      silenceSpeech();
      setIsNarrating(true);
      setActiveSpeechSample(text);
      speak(text, 1.0);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/vstep"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
          >
            <ChevronLeft className="size-4" /> VSTEP Hub
          </Link>
          <span className="text-slate-700">/</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-amber-400 flex items-center gap-1.5">
              <Award className="size-4" /> VSTEP Speaking Lab
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              B1 • B2 • C1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/speaking"
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="size-3.5" /> AI Speaking Tutor
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('part1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'part1'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Part 1: Tương tác xã hội</span>
              <span className="text-[10px] opacity-75 font-mono">({VSTEP_SPEAKING_PART1_TOPICS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('part2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'part2'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Part 2: Thảo luận giải pháp</span>
              <span className="text-[10px] opacity-75 font-mono">({VSTEP_SPEAKING_PART2_SCENARIOS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('part3')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'part3'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Part 3: Phát triển chủ đề</span>
              <span className="text-[10px] opacity-75 font-mono">({VSTEP_SPEAKING_PART3_TOPICS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('full_exam')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'full_exam'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Clock className="size-3.5" />
              <span>Thi thử 12 phút</span>
              <span className="text-[10px] opacity-75 font-mono">({VSTEP_FULL_SPEAKING_EXAMS.length} đề)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <Layers className="size-3.5 text-amber-400" />
            <span>Chuẩn cấu trúc ĐHQGHN & Bộ GD&ĐT</span>
          </div>
        </div>

        {/* TAB 1: PART 1 SOCIAL INTERACTION */}
        {activeTab === 'part1' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Topic List (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Chủ đề Part 1 (3 phút)</span>
                <span className="text-[10px] text-amber-400 font-mono">Công thức ARE</span>
              </h3>
              <div className="space-y-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 scrollbar-thin">
                {VSTEP_SPEAKING_PART1_TOPICS.map((topic, idx) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedP1Index(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      selectedP1Index === idx
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{idx + 1}. {topic.topicName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{topic.topicVi}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Questions & Model Answers (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{activeP1Topic.topicName}</span>
                    <span className="text-xs font-normal text-slate-400">({activeP1Topic.topicVi})</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian chuẩn bị: 0s • Thời gian nói: ~3 phút cho toàn bộ phần 1 • Khung trả lời ARE: Answer - Reason - Example
                  </p>
                </div>

                {/* Level Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['B1', 'B2', 'C1'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setP1Level(lvl)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                        p1Level === lvl
                          ? lvl === 'C1' ? 'bg-purple-600 text-white' : lvl === 'B2' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Background & Examiner Criteria Card */}
              {(activeP1Topic.backgroundOverviewVi || activeP1Topic.examinerCriteriaVi) && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  {activeP1Topic.backgroundOverviewVi && (
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                        <BookOpen className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          Bối cảnh xã hội & Ý nghĩa chủ đề
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                          {activeP1Topic.backgroundOverviewVi}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeP1Topic.examinerCriteriaVi && (
                    <div className="flex items-start gap-2.5 border-t border-slate-800/80 pt-2">
                      <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                        <Lightbulb className="size-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          Tiêu chí & Hướng dẫn chấm điểm giám khảo
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                          {activeP1Topic.examinerCriteriaVi}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {activeP1Topic.questions.map((q, qIdx) => {
                  const sampleText = p1Level === 'B1' ? q.sampleB1 : p1Level === 'B2' ? q.sampleB2 : q.sampleC1;
                  const isThisNarrating = isNarrating && activeSpeechSample === sampleText;

                  return (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <span className="size-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-mono">
                              {qIdx + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>
                          <div className="text-xs text-slate-400 ml-7 mt-0.5">{q.questionVi}</div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNarrate(sampleText)}
                          className={`border-slate-800 shrink-0 text-xs ${
                            isThisNarrating ? 'bg-amber-500 text-slate-950 border-amber-500' : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isThisNarrating ? <VolumeX className="size-3.5 mr-1" /> : <Volume2 className="size-3.5 mr-1" />}
                          {isThisNarrating ? 'Dừng đọc' : `Nghe giọng mẫu ${p1Level}`}
                        </Button>
                      </div>

                      {/* Model Answer Box */}
                      <div className="ml-7 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="size-3 text-amber-400" /> Câu trả lời mẫu chuẩn {p1Level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          &ldquo;{sampleText}&rdquo;
                        </p>
                      </div>

                      {/* Key Vocabulary Chips */}
                      {q.keyVocabulary && q.keyVocabulary.length > 0 && (
                        <div className="ml-7 flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-500 font-medium">Từ khóa ăn điểm:</span>
                          {q.keyVocabulary.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 flex items-center gap-1"
                              title={`${v.ipa || ''} • ${v.collocation || ''}`}
                            >
                              <span className="font-bold text-amber-300">{v.term}</span>
                              <span className="text-slate-500">({v.meaningVi})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recording practice tool */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col items-center justify-center gap-2">
                <span className="text-xs text-slate-400">Luyện phát âm câu trả lời của bạn:</span>
                <SpeechRecorder
                  onTranscript={(transcript) => {
                    toast.success(`Đã nhận diện: "${transcript.slice(0, 50)}..."`);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PART 2 SOLUTION DISCUSSION */}
        {activeTab === 'part2' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scenario List (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Tình huống Part 2</span>
                <span className="text-[10px] text-amber-400 font-mono">Khung ICE</span>
              </h3>
              <div className="space-y-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 scrollbar-thin">
                {VSTEP_SPEAKING_PART2_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedP2Index(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      selectedP2Index === idx
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{idx + 1}. {sc.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{sc.titleVi}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Details & Model Speeches (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Situation Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Part 2: Solution Discussion (Thảo luận giải pháp)
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['B2', 'C1'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setP2Level(lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                          p2Level === lvl
                            ? lvl === 'C1' ? 'bg-purple-600 text-white' : 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-white">{activeP2Scenario.situation}</h2>
                  <p className="text-xs text-slate-400">{activeP2Scenario.situationVi}</p>
                </div>

                {/* Situation Background & Stakeholders Analysis */}
                {(activeP2Scenario.backgroundContextVi || activeP2Scenario.stakeholdersAnalysisVi) && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    {activeP2Scenario.backgroundContextVi && (
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                          <Layers className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                            Bối cảnh phân tích sâu tình huống
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                            {activeP2Scenario.backgroundContextVi}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeP2Scenario.stakeholdersAnalysisVi && (
                      <div className="flex items-start gap-2.5 border-t border-slate-850 pt-2">
                        <div className="p-1 rounded bg-purple-500/10 text-purple-400 mt-0.5 shrink-0">
                          <Lightbulb className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
                            Phân tích lợi ích các bên liên quan (Stakeholders)
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                            {activeP2Scenario.stakeholdersAnalysisVi}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3 Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {activeP2Scenario.options.map((opt) => {
                    const isRecommended = opt.id === activeP2Scenario.recommendedChoice;
                    return (
                      <div
                        key={opt.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between text-xs space-y-2 ${
                          isRecommended
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center justify-between text-slate-200">
                            <span>{opt.title}</span>
                            {isRecommended && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                                Lựa chọn tối ưu
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{opt.titleVi}</div>
                        </div>

                        <div className="space-y-1 text-[11px] pt-1">
                          <div className="text-emerald-400 font-medium">✓ Ưu điểm:</div>
                          <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[10px]">
                            {opt.pros.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                          {opt.cons && opt.cons.length > 0 && (
                            <>
                              <div className="text-red-400 font-medium pt-1">✗ Nhược điểm:</div>
                              <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[10px]">
                                {opt.cons.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ICE Formula Breakdown Card */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="size-3.5" /> Chiến thuật cấu trúc bài nói chuẩn hóa (ICE Formula)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-amber-300 font-mono">1. I - Introduction</span>
                    <p className="text-[11px] text-slate-400 mt-1">{activeP2Scenario.iceBreakdown.introduction}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-amber-300 font-mono">2. C - Compare & Counter</span>
                    <p className="text-[11px] text-slate-400 mt-1">{activeP2Scenario.iceBreakdown.comparisonAndCounter}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="font-bold text-amber-300 font-mono">3. E - End & Conclusion</span>
                    <p className="text-[11px] text-slate-400 mt-1">{activeP2Scenario.iceBreakdown.endAndConclusion}</p>
                  </div>
                </div>
              </div>

              {/* Full Model Speech */}
              {(() => {
                const speech = p2Level === 'B2' ? activeP2Scenario.sampleSpeechB2 : activeP2Scenario.sampleSpeechC1;
                const isThisNarrating = isNarrating && activeSpeechSample === speech;

                return (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-400" />
                        Bài nói mẫu hoàn chỉnh cấp độ {p2Level} (3 phút)
                      </h3>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNarrate(speech)}
                        className={`border-slate-800 text-xs ${
                          isThisNarrating ? 'bg-amber-500 text-slate-950 border-amber-500' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isThisNarrating ? <VolumeX className="size-3.5 mr-1" /> : <Volume2 className="size-3.5 mr-1" />}
                        {isThisNarrating ? 'Dừng đọc' : `Nghe toàn bộ bài nói ${p2Level}`}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {speech}
                    </div>

                    {/* Key phrases */}
                    {activeP2Scenario.usefulPhrases && activeP2Scenario.usefulPhrases.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-400">Mẫu câu chuyển ý hữu ích:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {activeP2Scenario.usefulPhrases.map((phrase, pIdx) => (
                            <span key={pIdx} className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {phrase}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 3: PART 3 TOPIC DEVELOPMENT */}
        {activeTab === 'part3' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Topic List (4 cols) */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Chủ đề Part 3</span>
                <span className="text-[10px] text-amber-400 font-mono">Mind-map 4 nhánh</span>
              </h3>
              <div className="space-y-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 scrollbar-thin">
                {VSTEP_SPEAKING_PART3_TOPICS.map((topic, idx) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedP3Index(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      selectedP3Index === idx
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{idx + 1}. {topic.topicTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{topic.topicVi}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mindmap & Speech & Follow-up (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Part 3: Topic Development & Follow-up (4-5 phút)
                  </span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['B2', 'C1'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setP3Level(lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${
                          p3Level === lvl
                            ? lvl === 'C1' ? 'bg-purple-600 text-white' : 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">{activeP3Topic.topicTitle}</h2>
                  <p className="text-xs text-slate-400">{activeP3Topic.topicVi}</p>
                </div>

                {/* Socio-Economic Context & Academic Citations */}
                {(activeP3Topic.socioEconomicContextVi || (activeP3Topic.academicCitationsVi && activeP3Topic.academicCitationsVi.length > 0)) && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    {activeP3Topic.socioEconomicContextVi && (
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded bg-blue-500/10 text-blue-400 mt-0.5 shrink-0">
                          <Layers className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                            Bối cảnh kinh tế - xã hội (Việt Nam & Toàn cầu)
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                            {activeP3Topic.socioEconomicContextVi}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeP3Topic.academicCitationsVi && activeP3Topic.academicCitationsVi.length > 0 && (
                      <div className="flex items-start gap-2.5 border-t border-slate-850 pt-2">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                          <BookOpen className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                            Dẫn chứng học thuật uy tín (UNESCO, WHO, World Bank, ILO, IPCC)
                          </span>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 mt-0.5">
                            {activeP3Topic.academicCitationsVi.map((cite, ci) => (
                              <li key={ci}>{cite}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mindmap Visualization Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-center font-bold text-sm text-amber-300 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    💡 Ý TƯỞNG TRUNG TÂM: {activeP3Topic.mindmap.centerIdea}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {activeP3Topic.mindmap.givenBranches.map((branch, bIdx) => (
                      <div key={bIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2">
                        <span className="font-mono text-amber-400 font-bold">Nhánh {bIdx + 1}:</span>
                        <span className="text-slate-200">{branch}</span>
                      </div>
                    ))}
                    <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/50 flex items-start gap-2 text-purple-200">
                      <span className="font-mono text-purple-400 font-bold">Nhánh tự phát triển:</span>
                      <span>{activeP3Topic.mindmap.customBranchPlaceholder}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Speech Card */}
              {(() => {
                const speech = p3Level === 'B2' ? activeP3Topic.sampleSpeechB2 : activeP3Topic.sampleSpeechC1;
                const isThisNarrating = isNarrating && activeSpeechSample === speech;

                return (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-400" />
                        Bài nói mẫu chuẩn cấp độ {p3Level} (4 phút)
                      </h3>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNarrate(speech)}
                        className={`border-slate-800 text-xs ${
                          isThisNarrating ? 'bg-amber-500 text-slate-950 border-amber-500' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isThisNarrating ? <VolumeX className="size-3.5 mr-1" /> : <Volume2 className="size-3.5 mr-1" />}
                        {isThisNarrating ? 'Dừng đọc' : `Nghe giọng mẫu ${p3Level}`}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {speech}
                    </div>
                  </div>
                );
              })()}

              {/* Follow-up Questions Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="size-3.5" /> 3 Câu hỏi phản biện từ giám khảo (Follow-up Questions)
                </h3>
                <div className="space-y-2.5">
                  {activeP3Topic.followUpQuestions.map((fq, fIdx) => (
                    <div key={fIdx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span className="size-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-mono text-[10px]">
                          Q{fIdx + 1}
                        </span>
                        <span>{fq.question}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-7">{fq.questionVi}</div>
                      {fq.contextNoteVi && (
                        <div className="ml-7 text-[10px] text-amber-300/90 italic bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          💡 <strong>Mục đích giám khảo:</strong> {fq.contextNoteVi}
                        </div>
                      )}
                      <div className="ml-7 pt-1 text-[11px] text-emerald-300 italic">
                        &ldquo;{fq.sampleAnswer}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FULL EXAM SIMULATION */}
        {activeTab === 'full_exam' && (
          <div className="space-y-6">
            {/* Exam Selector Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn đề thi thử:</span>
                <select
                  value={selectedExamIndex}
                  onChange={(e) => {
                    setSelectedExamIndex(Number(e.target.value));
                    stopExamSimulation();
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {VSTEP_FULL_SPEAKING_EXAMS.map((exam, eIdx) => (
                    <option key={exam.id} value={eIdx}>
                      {exam.titleVi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Tổng thời gian thi: <strong className="text-amber-400">12 phút</strong>
                </span>
                {examStep !== 'intro' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopExamSimulation}
                    className="text-xs h-8"
                  >
                    Dừng thi
                  </Button>
                )}
              </div>
            </div>

            {/* Simulation Viewport */}
            {examStep === 'intro' && (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
                <div className="size-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Clock className="size-8" />
                </div>
                <h2 className="text-lg font-bold text-white">{activeExam.titleVi}</h2>
                {activeExam.examContextVi && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed text-left">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                      Bối cảnh khảo thí & Nguồn gốc đề:
                    </span>
                    {activeExam.examContextVi}
                  </div>
                )}
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hệ thống sẽ mô phỏng phòng thi thật với đồng hồ đếm ngược tự động:
                  <br />• <strong>Part 1 (3 phút)</strong>: 3 câu hỏi giao tiếp trực tiếp không có thời gian chuẩn bị.
                  <br />• <strong>Part 2 (4 phút)</strong>: 1 phút chuẩn bị + 3 phút trình bày giải pháp.
                  <br />• <strong>Part 3 (5 phút)</strong>: 1 phút chuẩn bị + 4 phút phát triển chủ đề & câu hỏi phụ.
                </p>
                <Button
                  size="lg"
                  onClick={startExamSimulation}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8"
                >
                  <Play className="size-4 mr-2" /> Bắt đầu làm bài thi thật
                </Button>
              </div>
            )}

            {examStep !== 'intro' && examStep !== 'finished' && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                {/* Timer Ribbon */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`size-3 rounded-full ${isTimerRunning ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                    <span className="font-bold text-sm text-slate-200 uppercase">
                      {examStep === 'part1' && 'Đang làm Part 1: Tương tác xã hội'}
                      {examStep === 'part2_prep' && 'Part 2: Thời gian chuẩn bị (1 phút)'}
                      {examStep === 'part2_speak' && 'Part 2: Thời gian thí sinh nói (3 phút)'}
                      {examStep === 'part3_prep' && 'Part 3: Thời gian chuẩn bị (1 phút)'}
                      {examStep === 'part3_speak' && 'Part 3: Thời gian thí sinh nói (4 phút)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-xs text-slate-400">Thời gian còn lại:</span>
                    <span className="text-2xl font-bold text-amber-400 tracking-wider">
                      {formatTimer(examTimer)}
                    </span>
                  </div>
                </div>

                {/* Exam Content for current step */}
                {examStep === 'part1' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-white">Chủ đề: {activeExam.part1.topicName} ({activeExam.part1.topicVi})</h3>
                    <div className="space-y-3">
                      {activeExam.part1.questions.map((q, idx) => (
                        <div key={q.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm">
                          <span className="font-bold text-amber-400 mr-2">Câu {idx + 1}:</span>
                          <span>{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(examStep === 'part2_prep' || examStep === 'part2_speak') && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h3 className="font-bold text-sm text-white">Tình huống:</h3>
                      <p className="text-xs text-slate-300">{activeExam.part2.situation}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {activeExam.part2.options.map((opt, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <div className="font-bold text-amber-300">{opt.title}</div>
                          <div className="text-slate-400 mt-1">{opt.titleVi}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(examStep === 'part3_prep' || examStep === 'part3_speak') && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h3 className="font-bold text-sm text-white">Chủ đề thuyết trình: {activeExam.part3.topicTitle}</h3>
                      <div className="text-xs text-amber-300 font-bold">Ý chính: {activeExam.part3.mindmap.centerIdea}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {activeExam.part3.mindmap.givenBranches.map((b, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                          Gợi ý {i + 1}: {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Speech Recorder in simulation */}
                <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-3">
                  <SpeechRecorder
                    onTranscript={(text) => {
                      setUserTranscript((prev) => `${prev} ${text}`);
                    }}
                  />
                  {userTranscript && (
                    <div className="w-full max-w-xl p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300">
                      <strong>Nội dung bạn đã nói:</strong> {userTranscript}
                    </div>
                  )}
                </div>
              </div>
            )}

            {examStep === 'finished' && (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
                <CheckCircle2 className="size-16 text-emerald-400 mx-auto" />
                <h2 className="text-lg font-bold text-white">Hoàn thành bài thi thử VSTEP Speaking!</h2>
                <p className="text-xs text-slate-400">
                  Chúc mừng bạn đã hoàn thành bài thi thử đầy đủ 12 phút. Bạn có thể luyện lại từng Part riêng lẻ để trau dồi vốn từ vựng và ngữ điệu tự nhiên hơn.
                </p>
                <Button
                  onClick={stopExamSimulation}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Quay lại danh sách đề thi
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
