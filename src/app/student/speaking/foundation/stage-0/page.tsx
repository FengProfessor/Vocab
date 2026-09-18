'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Volume2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Info,
  HelpCircle,
  Play,
  RotateCcw,
  Mic,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import { SafeHarborRecorder } from '@/components/speaking/foundation/SafeHarborRecorder';
import { InteractiveIpaVideoPlayer } from '@/components/pronunciation/InteractiveIpaVideoPlayer';
import {
  STAGE_0_PHONETIC_LESSONS,
  getStage0Lessons,
} from '@/data/speaking/foundation';
import type { Stage0PhoneticLesson, MinimalPair, PracticeWord } from '@/types/speaking-foundation';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả 10 bài' },
  { id: 'vowel-pairs', label: 'Cặp nguyên âm' },
  { id: 'consonant-pairs', label: 'Cặp phụ âm' },
  { id: 'ending-sounds', label: 'Âm đuôi sống còn' },
  { id: 'stress-linking', label: 'Trọng âm & Nối âm' },
] as const;

export default function Stage0PhoneticsPage() {
  const lessons = useMemo(() => getStage0Lessons(), []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLessonId, setActiveLessonId] = useState<string>(lessons[0]?.id || 'stage-0-vowel-i-contrast');
  const [selectedWordForRecording, setSelectedWordForRecording] = useState<string | null>(null);

  const filteredLessons = useMemo(() => {
    if (selectedCategory === 'all') return lessons;
    return lessons.filter((l) => l.category === selectedCategory);
  }, [lessons, selectedCategory]);

  const activeLesson = useMemo(() => {
    return lessons.find((l) => l.id === activeLessonId) || lessons[0];
  }, [lessons, activeLessonId]);

  const activeIndex = lessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  return (
    <StudentShell title="Chặng 0: Khai thông cơ miệng & Ngữ âm phản xạ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumbs & Stage Tabs */}
        <StageProgressNav currentStage="stage-0" showBreadcrumbs={true} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Chặng 0 / 3
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Bài {activeIndex + 1} / {lessons.length}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Khai thông cơ miệng & Ngữ âm phản xạ
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Phân biệt cặp âm hay nhầm lẫn và triệt tiêu thói quen nuốt âm đuôi qua video khẩu hình Rachel’s English
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/speaking/foundation/stage-1">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <span>Chuyển sang Chặng 1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lesson Horizontal Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredLessons.map((lesson) => {
            const isActive = lesson.id === activeLesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => {
                  setActiveLessonId(lesson.id);
                  setSelectedWordForRecording(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all flex-shrink-0 ${
                  isActive
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 ring-1 ring-amber-500/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  {lesson.phonemes.join(' ')}
                </span>
                <span className="text-xs font-semibold max-w-[140px] sm:max-w-[180px] truncate">
                  {lesson.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Lesson View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Column: Video Player & Articulation Details (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Lesson Title & Phonemes Header */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm sm:text-base font-extrabold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/40">
                    {activeLesson.phonemes.join(' vs ')}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                    {activeLesson.category.replace('-', ' ')}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Nguồn: {activeLesson.video.channelName}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeLesson.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeLesson.descriptionVi}
              </p>
            </div>

            {/* Rachel's English Video Player */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md">
              <InteractiveIpaVideoPlayer
                video={{
                  youtubeVideoId: activeLesson.video.youtubeVideoId,
                  startSeconds: activeLesson.video.startSeconds,
                  endSeconds: activeLesson.video.endSeconds,
                  channelName: "Rachel's English",
                  videoTip: activeLesson.video.videoTip || activeLesson.video.mouthTipSummary || activeLesson.mouthTipVi,
                  clipTitle: activeLesson.video.title,
                  mouthTipSummary: activeLesson.video.mouthTipSummary,
                }}
                ipa={activeLesson.phonemes.join(' ')}
                title={activeLesson.video.title}
                cleanMode={true}
                keyArticulationTip={activeLesson.video.mouthTipSummary || activeLesson.mouthTipVi}
                className="w-full"
              />
            </div>

            {/* Mouth Articulation Tips Callout */}
            <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Mẹo khẩu hình chuẩn (Rachel’s Articulation Tip)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-6">
                {activeLesson.mouthTipVi}
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Drills (Minimal Pairs & Practice Words) (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Minimal Pairs Section */}
            {activeLesson.minimalPairs && activeLesson.minimalPairs.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Luyện cặp âm tối thiểu (Minimal Pairs)
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    {activeLesson.minimalPairs.length} cặp
                  </span>
                </div>

                <div className="space-y-3">
                  {activeLesson.minimalPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        {/* Word A */}
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                              {pair.wordA}
                            </div>
                            <div className="font-mono text-xs text-amber-600 dark:text-amber-400">
                              {pair.ipaA}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                            <DualSpeedAudioButton text={pair.wordA} size="sm" showLabels={false} />
                            <button
                              onClick={() => setSelectedWordForRecording(pair.wordA)}
                              className={`p-1.5 rounded-md text-xs transition-colors ${
                                selectedWordForRecording === pair.wordA
                                  ? 'bg-emerald-500 text-white'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={`Luyện nói từ "${pair.wordA}"`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Word B */}
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                              {pair.wordB}
                            </div>
                            <div className="font-mono text-xs text-amber-600 dark:text-amber-400">
                              {pair.ipaB}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                            <DualSpeedAudioButton text={pair.wordB} size="sm" showLabels={false} />
                            <button
                              onClick={() => setSelectedWordForRecording(pair.wordB)}
                              className={`p-1.5 rounded-md text-xs transition-colors ${
                                selectedWordForRecording === pair.wordB
                                  ? 'bg-emerald-500 text-white'
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={`Luyện nói từ "${pair.wordB}"`}
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Distinction Note */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-md">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Đối chiếu:{' '}
                        </span>
                        {pair.distinctionVi}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Word Recording Practice Panel */}
            {selectedWordForRecording && (
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Ghi âm luyện nói: &quot;{selectedWordForRecording}&quot;
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedWordForRecording(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Đóng
                  </button>
                </div>

                <SafeHarborRecorder
                  targetSentence={selectedWordForRecording}
                  coreKeywords={[selectedWordForRecording]}
                />
              </div>
            )}

            {/* Practice Words List */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Kho từ vựng áp dụng ({activeLesson.practiceWords.length} từ)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Nghe & Nhại lại</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[360px] overflow-y-auto pr-1">
                {activeLesson.practiceWords.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.word}
                        </span>
                        <span className="font-mono text-slate-400 dark:text-slate-500">
                          {item.ipa}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">{item.meaningVi}</div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <DualSpeedAudioButton text={item.word} size="sm" showLabels={false} />
                      <button
                        onClick={() => setSelectedWordForRecording(item.word)}
                        className={`p-1.5 rounded-md transition-colors ${
                          selectedWordForRecording === item.word
                            ? 'bg-emerald-500 text-white'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={`Luyện nói từ "${item.word}"`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next / Previous Lesson Bar */}
            <div className="flex items-center justify-between gap-2 pt-2">
              {prevLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveLessonId(prevLesson.id);
                    setSelectedWordForRecording(null);
                  }}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">{prevLesson.title}</span>
                </Button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveLessonId(nextLesson.id);
                    setSelectedWordForRecording(null);
                  }}
                  className="gap-1 text-xs"
                >
                  <span className="max-w-[120px] truncate">{nextLesson.title}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Link href="/student/speaking/foundation/stage-1">
                  <Button size="sm" className="gap-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                    <span>Hoàn thành, sang Chặng 1</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
