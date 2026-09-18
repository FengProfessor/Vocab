'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Layers,
  Zap,
  RotateCcw,
  Sparkles,
  Timer,
  Award,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Mic,
  Info,
  CheckCircle2,
  Shuffle,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import { SafeHarborRecorder } from '@/components/speaking/foundation/SafeHarborRecorder';
import {
  STAGE_2_LEGO_LESSONS,
  getLegoSlotLessons,
} from '@/data/speaking/foundation';
import type { LegoSlotLesson, LegoSlot, LegoBrick } from '@/types/speaking-foundation';
import { Button } from '@/components/ui/button';

export default function Stage2LegoSlotsPage() {
  const lessons = useMemo(() => getLegoSlotLessons(), []);
  const [activeLessonId, setActiveLessonId] = useState<string>(lessons[0]?.id || 'lego-fnb-ordering');

  const activeLesson = useMemo(() => {
    return lessons.find((l) => l.id === activeLessonId) || lessons[0];
  }, [lessons, activeLessonId]);

  // Selected bricks for each slot key in activeLesson
  const [selectedBricks, setSelectedBricks] = useState<Record<string, LegoBrick>>(() => {
    const initial: Record<string, LegoBrick> = {};
    if (activeLesson?.slots) {
      activeLesson.slots.forEach((s) => {
        if (s.bricks.length > 0) {
          initial[s.slotKey] = s.bricks[0];
        }
      });
    }
    return initial;
  });

  // Whenever activeLesson changes, reset selected bricks to first brick of each slot
  useEffect(() => {
    const initial: Record<string, LegoBrick> = {};
    activeLesson.slots.forEach((s) => {
      if (s.bricks.length > 0) {
        initial[s.slotKey] = s.bricks[0];
      }
    });
    setSelectedBricks(initial);
    setReflexTimeMs(null);
  }, [activeLesson]);

  // Reflex Timer State
  const [promptTime, setPromptTime] = useState<number | null>(null);
  const [reflexTimeMs, setReflexTimeMs] = useState<number | null>(null);
  const [bestReflexMs, setBestReflexMs] = useState<number | null>(null);
  const [challengeTargetBrick, setChallengeTargetBrick] = useState<string | null>(null);

  // Assembled sentence generator
  const assembledSentence = useMemo(() => {
    let result = activeLesson.baseFrame;
    activeLesson.slots.forEach((slot) => {
      const chosen = selectedBricks[slot.slotKey]?.value || `{${slot.slotKey}}`;
      result = result.replace(`{${slot.slotKey}}`, chosen);
    });
    return result;
  }, [activeLesson, selectedBricks]);

  // Assembled Vietnamese meaning
  const assembledMeaningVi = useMemo(() => {
    let result = activeLesson.meaningVi;
    activeLesson.slots.forEach((slot) => {
      const chosenMeaning = selectedBricks[slot.slotKey]?.meaningVi || `{${slot.slotKey}}`;
      result = result.replace(new RegExp(`\\{.*?\\}`), chosenMeaning);
    });
    return result;
  }, [activeLesson, selectedBricks]);

  // Core keywords for SafeHarbor
  const coreKeywords = useMemo(() => {
    const words = assembledSentence
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    return Array.from(new Set(words));
  }, [assembledSentence]);

  // Handle clicking a Lego Brick
  const handleSelectBrick = (slotKey: string, brick: LegoBrick) => {
    const now = Date.now();
    if (promptTime) {
      const elapsed = now - promptTime;
      setReflexTimeMs(elapsed);
      if (!bestReflexMs || elapsed < bestReflexMs) {
        setBestReflexMs(elapsed);
      }
      setPromptTime(null);
      setChallengeTargetBrick(null);
    }

    setSelectedBricks((prev) => ({
      ...prev,
      [slotKey]: brick,
    }));
  };

  // Start a Reflex Sprint challenge
  const handleStartReflexChallenge = () => {
    // Pick a random brick that is not currently selected
    const allAvailableBricks: { slotKey: string; brick: LegoBrick }[] = [];
    activeLesson.slots.forEach((s) => {
      s.bricks.forEach((b) => {
        if (selectedBricks[s.slotKey]?.value !== b.value) {
          allAvailableBricks.push({ slotKey: s.slotKey, brick: b });
        }
      });
    });

    if (allAvailableBricks.length === 0) {
      // Pick any
      activeLesson.slots.forEach((s) => {
        s.bricks.forEach((b) => {
          allAvailableBricks.push({ slotKey: s.slotKey, brick: b });
        });
      });
    }

    const randomPick =
      allAvailableBricks[Math.floor(Math.random() * allAvailableBricks.length)];
    if (randomPick) {
      setChallengeTargetBrick(randomPick.brick.meaningVi);
      setPromptTime(Date.now());
      setReflexTimeMs(null);
    }
  };

  // Randomize all slots
  const handleRandomize = () => {
    const randomized: Record<string, LegoBrick> = {};
    activeLesson.slots.forEach((slot) => {
      const randomIndex = Math.floor(Math.random() * slot.bricks.length);
      randomized[slot.slotKey] = slot.bricks[randomIndex];
    });
    setSelectedBricks(randomized);
  };

  return (
    <StudentShell title="Chặng 2: Luyện tập thế khối Lego (Slot Substitution)">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumbs & Stage Tabs */}
        <StageProgressNav currentStage="stage-2" showBreadcrumbs={true} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Chặng 2 / 3
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Mục tiêu phản xạ: &lt; 1000ms (1 giây)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Luyện tập thế khối Lego (Slot Substitution)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Khóa chặt khung đế ngữ pháp, hoán đổi thần tốc các khối Lego từ vựng để kích hoạt phản xạ vô thức
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/speaking/foundation/stage-1">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chặng 1</span>
              </Button>
            </Link>
            <Link href="/student/speaking/foundation/stage-3">
              <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                <span>Sang Chặng 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Lesson Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all flex-shrink-0 ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold">{lesson.title}</span>
              </button>
            );
          })}
        </div>

        {/* Reflex Sprint Challenge Banner */}
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/30 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  Thử thách phản xạ &lt;1s
                </span>
                {bestReflexMs && (
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Kỷ lục cá nhân: {bestReflexMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {challengeTargetBrick ? (
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    Hãy bấm chọn khối có nghĩa:{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400 text-base">
                      &quot;{challengeTargetBrick}&quot;
                    </strong>{' '}
                    càng nhanh càng tốt!
                  </span>
                ) : (
                  'Bấm bắt đầu để hệ thống ra đề ngẫu nhiên một nghĩa tiếng Việt. Bạn chọn khối Lego tương ứng dưới 1 giây!'
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={handleStartReflexChallenge}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{challengeTargetBrick ? 'Đổi câu đố khác' : 'Bắt đầu bấm giờ'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomize}
                className="gap-1.5 text-xs"
                title="Xáo trộn ngẫu nhiên các khối"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Xáo trộn</span>
              </Button>
            </div>
          </div>

          {/* Reflex Result Display */}
          {reflexTimeMs !== null && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">Tốc độ phản xạ vừa rồi:</span>
              <span
                className={`font-mono text-base font-extrabold px-2.5 py-0.5 rounded-lg border ${
                  reflexTimeMs < 1000
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                    : reflexTimeMs < 2000
                    ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {reflexTimeMs}ms
              </span>

              {reflexTimeMs < 1000 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  ⚡ Phản xạ thần tốc (&lt;1s) - Đạt chuẩn vô thức!
                </span>
              ) : reflexTimeMs < 2000 ? (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Tốt! Cần luyện thêm một chút để xuống dưới 1s nhé.
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  Cơ miệng cần làm quen. Hãy chọn lại nhiều lần để thành phản xạ tự nhiên!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Interactive Lego Baseplate (Đế Lego) */}
        <div className="rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-lg space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Khung đế Lego đang kích hoạt (Baseplate)
              </span>
            </div>
            {activeLesson.phoneticTipVi && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{activeLesson.phoneticTipVi}</span>
              </div>
            )}
          </div>

          {/* Large Interactive Assembled Sentence */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-relaxed">
              {activeLesson.baseFrame.split(/(\{.*?\})/).map((part, idx) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                  const key = part.slice(1, -1);
                  const selectedBrick = selectedBricks[key];
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 mx-1.5 rounded-xl bg-emerald-500 text-white font-extrabold shadow-sm border-b-2 border-emerald-700 animate-in fade-in zoom-in duration-200"
                    >
                      {selectedBrick?.icon && <span>{selectedBrick.icon}</span>}
                      <span>{selectedBrick?.value || part}</span>
                    </span>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </div>

            <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
              Nghĩa tiếng Việt: &quot;{assembledMeaningVi}&quot;
            </div>

            {/* Listen to Assembled Sentence */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <span className="text-xs text-slate-500">Nghe mẫu câu vừa lắp ghép:</span>
              <DualSpeedAudioButton text={assembledSentence} size="default" showLabels={true} />
            </div>
          </div>

          {/* Modular Lego Bricks Selection Trays */}
          <div className="space-y-6">
            {activeLesson.slots.map((slot) => {
              const currentSelected = selectedBricks[slot.slotKey];
              return (
                <div key={slot.slotKey} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Vị trí biến số: {`{${slot.slotKey}}`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({slot.slotLabelVi})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Bấm vào khối để thay thế thần tốc
                    </span>
                  </div>

                  {/* Grid of Bricks */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {slot.bricks.map((brick) => {
                      const isChosen = currentSelected?.value === brick.value;
                      return (
                        <button
                          key={brick.value}
                          onClick={() => handleSelectBrick(slot.slotKey, brick)}
                          className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between gap-2 group relative overflow-hidden ${
                            isChosen
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/40 translate-y-[-2px]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-lg">{brick.icon || '🧱'}</span>
                              {isChosen && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {brick.value}
                            </div>
                            {brick.ipa && (
                              <div className="font-mono text-[10px] text-slate-400">
                                {brick.ipa}
                              </div>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {brick.meaningVi}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Speech Practice with SafeHarbor for Assembled Sentence */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Luyện nói câu lắp ráp hoàn chỉnh (Safe Harbor Speech Test)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Tự động chấm điểm từ khóa</span>
            </div>

            <SafeHarborRecorder
              targetSentence={assembledSentence}
              coreKeywords={coreKeywords}
            />
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/student/speaking/foundation/stage-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Về Chặng 1 (Khung câu sống còn)</span>
            </Button>
          </Link>

          <Link href="/student/speaking/foundation/stage-3">
            <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
              <span>Chuyển tiếp Chặng 3 (Nở câu 3 nhịp & Hội thoại)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
