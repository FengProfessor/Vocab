'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  MessageCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Mic,
  Info,
  CheckCircle2,
  User,
  Bot,
  Wind,
  Layers,
  Award,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import { SafeHarborRecorder } from '@/components/speaking/foundation/SafeHarborRecorder';
import {
  STAGE_3_EXPANSIONS,
  STAGE_3_MICRO_DIALOGUES,
  getThreeBeatExpansions,
  getMicroDialogues,
} from '@/data/speaking/foundation';
import type {
  ThreeBeatExpansionItem,
  MicroDialogue,
  DialogueTurn,
} from '@/types/speaking-foundation';
import { Button } from '@/components/ui/button';

export default function Stage3ExpansionsPage() {
  const expansions = useMemo(() => getThreeBeatExpansions(), []);
  const dialogues = useMemo(() => getMicroDialogues(), []);

  const [activeTab, setActiveTab] = useState<'3-beat' | 'micro-dialogues'>('3-beat');
  const [activeExpansionId, setActiveExpansionId] = useState<string>(expansions[0]?.id || 'exp-cafe-rush-order');
  const [activeDialogueId, setActiveDialogueId] = useState<string>(dialogues[0]?.id || 'dialogue-fnb-order');

  const activeExpansion = useMemo(() => {
    return expansions.find((item) => item.id === activeExpansionId) || expansions[0];
  }, [expansions, activeExpansionId]);

  const activeDialogue = useMemo(() => {
    return dialogues.find((item) => item.id === activeDialogueId) || dialogues[0];
  }, [dialogues, activeDialogueId]);

  // State to track which dialogue turn is actively being recorded
  const [activeRecordingTurnIndex, setActiveRecordingTurnIndex] = useState<number | null>(null);

  return (
    <StudentShell title="Chặng 3: Quy tắc nở câu 3 nhịp & Hội thoại vi mô">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumbs & Stage Tabs */}
        <StageProgressNav currentStage="stage-3" showBreadcrumbs={true} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Chặng 3 / 3 • Đích đến tự tin
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Thoát nói câu cụt • Đối thoại sinh tồn 4 lượt
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Quy tắc nở câu 3 nhịp & Hội thoại vi mô
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Phát triển khả năng nói tự nhiên qua 3 nhịp thở (Cốt lõi - Bối cảnh - Lý do) và nhập vai các tình huống đối đáp thực tế
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/speaking/foundation/stage-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chặng 2</span>
              </Button>
            </Link>
            <Link href="/student/speaking">
              <Button size="sm" className="gap-1.5 text-xs bg-purple-600 text-white hover:bg-purple-700">
                <Award className="w-3.5 h-3.5" />
                <span>Luyện nói AI (MVA)</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Sub-tab Switcher: 3-Beat vs Micro-Dialogues */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 max-w-md">
          <button
            onClick={() => setActiveTab('3-beat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === '3-beat'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Nở câu 3 nhịp (6 Bài)</span>
          </button>

          <button
            onClick={() => setActiveTab('micro-dialogues')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'micro-dialogues'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hội thoại vi mô (6 Đoạn)</span>
          </button>
        </div>

        {/* VIEW 1: 3-BEAT SENTENCE EXPANSION */}
        {activeTab === '3-beat' && (
          <div className="space-y-6">
            {/* Expansion Item Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {expansions.map((item, idx) => {
                const isActive = item.id === activeExpansion.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveExpansionId(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all flex-shrink-0 ${
                      isActive
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-1 ring-purple-500/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold max-w-[150px] sm:max-w-[200px] truncate">
                      {item.topicVi}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active 3-Beat Flow Container */}
            <div className="rounded-3xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    {activeExpansion.topic}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeExpansion.topicVi}
                  </h2>
                </div>

                {activeExpansion.phoneticTipVi && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200/60 dark:border-amber-900/40 max-w-sm">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="leading-snug">{activeExpansion.phoneticTipVi}</span>
                  </div>
                )}
              </div>

              {/* 3 Beats Flow Graphic */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {/* Beat 1: Core Action */}
                <div className="p-4 rounded-2xl border-2 border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[11px] font-bold">
                        Nhịp 1: Cốt lõi
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Ý chính muốn nói
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {activeExpansion.beat1Core.en}
                    </div>
                    {activeExpansion.beat1Core.ipa && (
                      <div className="font-mono text-xs text-purple-600 dark:text-purple-400">
                        {activeExpansion.beat1Core.ipa}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activeExpansion.beat1Core.vi}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                    <DualSpeedAudioButton text={activeExpansion.beat1Core.en} size="sm" showLabels={false} />
                    <span className="text-[11px] text-slate-400">Nghe riêng nhịp 1</span>
                  </div>
                </div>

                {/* Pause Cue 1 (Visual breath between Beat 1 and Beat 2) */}
                <div className="hidden md:flex absolute left-[32%] top-1/2 -translate-y-1/2 z-10 -ml-3 items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white dark:border-slate-900 text-[10px] font-bold">
                  <Wind className="w-3.5 h-3.5 animate-pulse" />
                </div>

                {/* Beat 2: Context */}
                <div className="p-4 rounded-2xl border-2 border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                        Nhịp 2: Bối cảnh
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Thời gian / Nơi chốn
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {activeExpansion.beat2Context.en}
                    </div>
                    {activeExpansion.beat2Context.ipa && (
                      <div className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        {activeExpansion.beat2Context.ipa}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activeExpansion.beat2Context.vi}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-200/50 dark:border-blue-900/40 flex items-center justify-between">
                    <DualSpeedAudioButton text={activeExpansion.beat2Context.en} size="sm" showLabels={false} />
                    <span className="text-[11px] text-slate-400">Nghe riêng nhịp 2</span>
                  </div>
                </div>

                {/* Pause Cue 2 (Visual breath between Beat 2 and Beat 3) */}
                <div className="hidden md:flex absolute left-[65%] top-1/2 -translate-y-1/2 z-10 -ml-3 items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white dark:border-slate-900 text-[10px] font-bold">
                  <Wind className="w-3.5 h-3.5 animate-pulse" />
                </div>

                {/* Beat 3: Emotion / Reason */}
                <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                        Nhịp 3: Cảm xúc / Lý do
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Lý do / Lịch sự
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {activeExpansion.beat3EmotionReason.en}
                    </div>
                    {activeExpansion.beat3EmotionReason.ipa && (
                      <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                        {activeExpansion.beat3EmotionReason.ipa}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activeExpansion.beat3EmotionReason.vi}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40 flex items-center justify-between">
                    <DualSpeedAudioButton text={activeExpansion.beat3EmotionReason.en} size="sm" showLabels={false} />
                    <span className="text-[11px] text-slate-400">Nghe riêng nhịp 3</span>
                  </div>
                </div>
              </div>

              {/* Pause Cue Mobile Explainer */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Wind className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span>
                  <strong>Quy tắc ngừng thở 300ms:</strong> Giữa các dấu phẩy, dừng lại 300 mili-giây để lấy hơi nhẹ nhàng. Đừng vội nói một mạch hết hơi khiến cơ miệng bị cứng!
                </span>
              </div>

              {/* Assembled Full Sentence Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-md">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Câu nở hoàn chỉnh (Full 3-Beat Sentence)
                  </span>
                  <div className="text-lg sm:text-xl font-bold tracking-tight leading-relaxed">
                    &quot;{activeExpansion.fullSentence}&quot;
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300">
                    {activeExpansion.fullMeaningVi}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                  <span className="text-xs text-slate-400">Nghe mẫu toàn câu:</span>
                  <DualSpeedAudioButton text={activeExpansion.fullSentence} size="default" showLabels={true} />
                </div>
              </div>

              {/* Speech Recording Check for 3-Beat Sentence */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Luyện nói câu nở 3 nhịp (Safe Harbor Speech Test)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Chấm điểm từ khóa theo từng nhịp thở
                  </span>
                </div>

                <SafeHarborRecorder
                  targetSentence={activeExpansion.fullSentence}
                  coreKeywords={activeExpansion.coreKeywords}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: AUTHENTIC MICRO-DIALOGUES */}
        {activeTab === 'micro-dialogues' && (
          <div className="space-y-6">
            {/* Dialogue Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dialogues.map((d, idx) => {
                const isActive = d.id === activeDialogue.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveDialogueId(d.id);
                      setActiveRecordingTurnIndex(null);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all flex-shrink-0 ${
                      isActive
                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-1 ring-purple-500/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold max-w-[150px] sm:max-w-[200px] truncate">
                      {d.scenarioVi}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Dialogue Container */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              {/* Scenario Context Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Tình huống thực tế • {activeDialogue.scenario}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  {activeDialogue.scenarioVi}
                </h2>
                {activeDialogue.contextVi && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bối cảnh: {activeDialogue.contextVi}
                  </p>
                )}
              </div>

              {/* 4 Turns Chat Display */}
              <div className="space-y-4">
                {activeDialogue.turns.map((turn, turnIdx) => {
                  const isPartner = turn.speaker === 'Partner';
                  const isRecordingThisTurn = activeRecordingTurnIndex === turnIdx;

                  return (
                    <div
                      key={turnIdx}
                      className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${
                        isPartner
                          ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20'
                          : 'border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 ml-0 sm:ml-6'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPartner
                                ? 'bg-blue-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {isPartner ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {isPartner ? 'Đối tác bản xứ (Partner)' : 'Lượt của bạn (Learner)'}
                          </span>
                        </div>

                        {/* Audio & Action */}
                        <div className="flex items-center gap-2">
                          <DualSpeedAudioButton text={turn.textEn} size="sm" showLabels={false} />

                          {!isPartner && (
                            <Button
                              size="sm"
                              variant={isRecordingThisTurn ? 'default' : 'outline'}
                              onClick={() =>
                                setActiveRecordingTurnIndex(isRecordingThisTurn ? null : turnIdx)
                              }
                              className={`gap-1 text-xs ${
                                isRecordingThisTurn ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                              }`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>{isRecordingThisTurn ? 'Đang thu' : 'Nhập vai nói'}</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Turn Text */}
                      <div className="pl-9 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          {turn.textEn}
                        </div>
                        {turn.ipa && (
                          <div className="font-mono text-xs text-slate-400">{turn.ipa}</div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {turn.textVi}
                        </div>

                        {turn.coreKeywords && turn.coreKeywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] text-slate-400">Từ khóa trọng tâm:</span>
                            {turn.coreKeywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-purple-700 dark:text-purple-300 font-semibold"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Learner Recording Interface */}
                      {!isPartner && isRecordingThisTurn && (
                        <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-900/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                              Thu âm câu đối đáp của bạn:
                            </span>
                            <button
                              onClick={() => setActiveRecordingTurnIndex(null)}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              Đóng
                            </button>
                          </div>
                          <SafeHarborRecorder
                            targetSentence={turn.textEn}
                            coreKeywords={turn.coreKeywords}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Graduation Banner to AI Speaking */}
        <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-pink-950/40 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Chúc mừng bạn đã hoàn thành nền tảng!
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Sẵn sàng cho các cuộc đàm thoại thực tế với AI?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn đã mở khóa cơ miệng, tích lũy 28 khung câu sinh tồn, và làm chủ quy tắc nở câu 3 nhịp. Hãy bước vào hệ thống <strong>Luyện nói AI (MVA)</strong> để trò chuyện tự do với gia sư ảo qua 24+ chủ đề đời sống, công sở và luyện thi!
            </p>
          </div>

          <Link href="/student/speaking" className="flex-shrink-0">
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md">
              <span>Bắt đầu Luyện nói AI</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/student/speaking/foundation/stage-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Về Chặng 2 (Thế khối Lego)</span>
            </Button>
          </Link>

          <Link href="/student/speaking/foundation">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>Về Hub tổng quan Nền tảng</span>
            </Button>
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
