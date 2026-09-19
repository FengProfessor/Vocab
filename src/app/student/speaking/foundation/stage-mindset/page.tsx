'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Volume2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Compass,
  Smile,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import {
  STAGE_MINDSET_LESSONS,
  MINDSET_PLEDGES,
} from '@/data/speaking/foundation/stage-mindset';
import { Button } from '@/components/ui/button';

export default function SpeakingFoundationStageMindsetPage() {
  const [activeLessonId, setActiveLessonId] = useState(STAGE_MINDSET_LESSONS[0].id);
  const [pledgeChecked, setPledgeChecked] = useState<Record<string, boolean>>({});

  const activeLesson =
    STAGE_MINDSET_LESSONS.find((l) => l.id === activeLessonId) || STAGE_MINDSET_LESSONS[0];

  const totalPledges = MINDSET_PLEDGES.length;
  const checkedCount = Object.values(pledgeChecked).filter(Boolean).length;
  const isPledgeComplete = checkedCount === totalPledges;

  const togglePledge = (id: string) => {
    setPledgeChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPillarIcon = (index: number) => {
    switch (index) {
      case 0:
        return AlertTriangle;
      case 1:
        return Smile;
      case 2:
        return Layers;
      case 3:
        return Sparkles;
      case 4:
        return Clock;
      case 5:
        return Compass;
      default:
        return Brain;
    }
  };

  return (
    <StudentShell title="Chặng Khởi Động: Hệ Điều Hành Tư Duy Nói">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <StageProgressNav currentStage="stage-mindset" showBreadcrumbs={true} />

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Bước Bắt Buộc Đầu Tiên (Start Here)
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                Hệ Điều Hành Tư Duy Nói (Mindset OS)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Khai Phóng Tư Duy Nói — Xóa Bỏ Nỗi Sợ Mất Gốc
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bạn không thể học nói thành công nếu mang theo tâm lý sợ sai và thói quen dịch thầm từ
              tiếng Việt. 6 mô hình tư duy dưới đây là &quot;liều vắc-xin tâm lý&quot; giúp bạn gỡ bỏ
              vết thương ngữ pháp 12 năm phổ thông và tự tin mở miệng giao tiếp.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>6 Mô hình tư duy cốt lõi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Phá vỡ vòng lặp dịch thầm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cam kết giải phóng tâm lý</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Mindset Pillars Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              Chọn Trụ Cột Tư Duy Cần Khám Phá:
            </h2>
            <span className="text-xs text-slate-400">
              Bài {activeLesson.order} / {STAGE_MINDSET_LESSONS.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {STAGE_MINDSET_LESSONS.map((lesson, idx) => {
              const Icon = getPillarIcon(idx);
              const isActive = lesson.id === activeLessonId;
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLessonId(lesson.id)}
                  className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      #0{lesson.order}
                    </span>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                  </div>
                  <div className="text-xs font-bold line-clamp-2 leading-snug">{lesson.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Lesson Content Body */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header of Active Lesson */}
          <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Trụ Cột Tư Duy #{activeLesson.order}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activeLesson.taglineVi}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {activeLesson.title}
            </h2>

            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-sm font-semibold flex items-start gap-2.5">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{activeLesson.corePrincipleVi}</span>
            </div>
          </div>

          {/* Root Psychology & Neurological Mechanism */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Giải Mã Tâm Lý & Cơ Chế Não Bộ:
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
              <p>{activeLesson.psychologyRootVi}</p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Phương pháp thực chiến: {activeLesson.actionableTechniqueVi}</span>
              </div>
            </div>
          </div>

          {/* Visual Comparison: Before vs After */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Đối Chiếu Trực Quan: Sai Lầm Cũ vs Tư Duy Mới
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Card */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{activeLesson.comparison.beforeTitle}</span>
                </div>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                  {activeLesson.comparison.beforeDescription}
                </p>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-rose-200/60 dark:border-rose-900/40 text-xs font-mono text-rose-900 dark:text-rose-200 italic">
                  {activeLesson.comparison.beforeExample}
                </div>
              </div>

              {/* After Card */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeLesson.comparison.afterTitle}</span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  {activeLesson.comparison.afterDescription}
                </p>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-mono text-emerald-900 dark:text-emerald-200 font-semibold flex items-center justify-between">
                  <span>{activeLesson.comparison.afterExample}</span>
                  {activeLesson.audioExampleSentence && (
                    <DualSpeedAudioButton
                      text={activeLesson.audioExampleSentence}
                      size="sm"
                      showLabels={false}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stalling Phrases Box if Lesson 5 */}
          {activeLesson.stallingPhrases && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Kho 6 Câu Đệm Cứu Sinh Bỏ Túi (Stalling Cushions):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLesson.stallingPhrases.map((phrase, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                        {phrase.phraseEn}
                      </span>
                      <DualSpeedAudioButton text={phrase.phraseEn} size="sm" />
                    </div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {phrase.meaningVi}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      💡 {phrase.usageNoteVi}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3 Đúc Kết Ghi Nhớ Cho Não Bộ:
            </h3>
            <ul className="space-y-2">
              {activeLesson.keyTakeaways.map((takeaway, tIdx) => (
                <li
                  key={tIdx}
                  className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mental Liberation Pledge (Bảng Cam Kết Giải Phóng Tâm Lý) */}
        <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  Bảng Cam Kết Giải Phóng Tâm Lý
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Đã tích {checkedCount}/{totalPledges} cam kết
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Hãy đọc to và tích chọn từng điều khoản dưới đây để chính thức xóa bỏ rào cản sợ sai
              trước khi bước vào luyện tập cơ miệng ở Chặng 0.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(checkedCount / totalPledges) * 100}%` }}
            />
          </div>

          {/* Pledge Items */}
          <div className="space-y-3">
            {MINDSET_PLEDGES.map((pledge, pIdx) => {
              const isChecked = !!pledgeChecked[pledge.id];
              return (
                <div
                  key={pledge.id}
                  onClick={() => togglePledge(pledge.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 pointer-events-none"
                  />
                  <div className="space-y-0.5">
                    <div
                      className={`text-sm font-bold ${
                        isChecked
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {pIdx + 1}. {pledge.titleVi}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {pledge.descriptionVi}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlocked CTA */}
          {isPledgeComplete ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 space-y-3 text-center animate-in fade-in">
              <div className="font-bold text-base flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
                <span>Chúc mừng! Bạn đã giải phóng tâm lý hoàn toàn!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                Tư duy của bạn đã sẵn sàng. Bây giờ, hãy bước vào Chặng 0 để khai thông cơ miệng qua
                các bài học video khẩu hình thực chiến.
              </p>
              <Link href="/student/speaking/foundation/stage-0" className="inline-block">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-600/25">
                  Bắt đầu Chặng 0: Khai thông cơ miệng
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Hãy tích chọn đủ 5 cam kết để mở khóa tinh thần sẵn sàng cho các chặng tiếp theo!
            </div>
          )}
        </div>

        {/* Bottom Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/student/speaking/foundation">
            <Button variant="outline" className="gap-2 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4" />
              Về Trang Tổng Quan Hub
            </Button>
          </Link>

          <Link href="/student/speaking/foundation/stage-0">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs sm:text-sm">
              Tiếp theo: Chặng 0 (Ngữ âm & Khẩu hình)
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
