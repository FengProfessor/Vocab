'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Coffee,
  ShoppingBag,
  Compass,
  Building,
  Briefcase,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Mic,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { DualSpeedAudioButton } from '@/components/speaking/foundation/DualSpeedAudioButton';
import { SafeHarborRecorder } from '@/components/speaking/foundation/SafeHarborRecorder';
import {
  STAGE_1_SURVIVAL_FRAMES,
  getSurvivalFrames,
} from '@/data/speaking/foundation';
import type {
  SurvivalFrame,
  SurvivalDomainId,
  SurvivalFrameExemplar,
} from '@/types/speaking-foundation';
import { Button } from '@/components/ui/button';

interface DomainFilter {
  id: 'all' | SurvivalDomainId;
  label: string;
  icon: React.ElementType;
}

const DOMAINS: DomainFilter[] = [
  { id: 'all', label: 'Tất cả (28)', icon: Sparkles },
  { id: 'fnb', label: 'F&B (Gọi món)', icon: Coffee },
  { id: 'shopping', label: 'Mua sắm', icon: ShoppingBag },
  { id: 'directions', label: 'Hỏi đường', icon: Compass },
  { id: 'hotel', label: 'Khách sạn', icon: Building },
  { id: 'workplace', label: 'Công sở', icon: Briefcase },
  { id: 'emergency', label: 'Sự cố & Khẩn cấp', icon: AlertTriangle },
  { id: 'fillers', label: 'Câu đệm suy nghĩ', icon: Clock },
];

export default function Stage1SurvivalFramesPage() {
  const allFrames = useMemo(() => getSurvivalFrames(), []);
  const [selectedDomain, setSelectedDomain] = useState<'all' | SurvivalDomainId>('all');
  const [activeExemplarKey, setActiveExemplarKey] = useState<string | null>(null);

  const filteredFrames = useMemo(() => {
    if (selectedDomain === 'all') return allFrames;
    return allFrames.filter((f) => f.domain === selectedDomain);
  }, [allFrames, selectedDomain]);

  return (
    <StudentShell title="Chặng 1: Kho khung câu phản xạ sống còn">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumbs & Stage Tabs */}
        <StageProgressNav currentStage="stage-1" showBreadcrumbs={true} />

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Chặng 1 / 3
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                28 Khung câu bất biến • 7 Lĩnh vực sinh tồn
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Kho khung câu phản xạ sống còn
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Học thuộc cấu trúc đúc sẵn (pre-fabricated chunks) không chia thì, nói tự nhiên ngay trong mọi tình huống đời sống
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/student/speaking/foundation/stage-0">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chặng 0</span>
              </Button>
            </Link>
            <Link href="/student/speaking/foundation/stage-2">
              <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                <span>Sang Chặng 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DOMAINS.map((dom) => {
            const Icon = dom.icon;
            const isSelected = selectedDomain === dom.id;
            return (
              <button
                key={dom.id}
                onClick={() => setSelectedDomain(dom.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{dom.label}</span>
              </button>
            );
          })}
        </div>

        {/* Frame Cards List */}
        <div className="space-y-6">
          {filteredFrames.map((frame, frameIdx) => {
            return (
              <div
                key={frame.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Frame Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 uppercase tracking-wider">
                        Khung #{frameIdx + 1} • {frame.domainNameVi}
                      </span>
                    </div>

                    {/* Template Highlight */}
                    <div className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {frame.template.split(/(\{.*?\})/).map((part, idx) => {
                        if (part.startsWith('{') && part.endsWith('}')) {
                          return (
                            <span
                              key={idx}
                              className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                            >
                              {part}
                            </span>
                          );
                        }
                        return <span key={idx}>{part}</span>;
                      })}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                      Ý nghĩa: {frame.meaningVi}
                    </div>
                  </div>

                  {/* Phonetic Tip Badge */}
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200/60 dark:border-amber-900/40 max-w-sm">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="leading-snug">{frame.phoneticTipVi}</span>
                  </div>
                </div>

                {/* Modular Slot Options */}
                {frame.slots && frame.slots.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Các khối từ vựng có thể thay thế ({frame.slots.length} vị trí biến số):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {frame.slots.map((slot) => (
                        <div
                          key={slot.key}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center gap-1.5"
                        >
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {`{${slot.key}}`}:
                          </span>
                          <span className="text-slate-500 text-[11px]">({slot.labelVi})</span>
                          <div className="flex flex-wrap gap-1">
                            {slot.options.map((opt, optIdx) => (
                              <span
                                key={optIdx}
                                className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exemplars Interactive Practice */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Thực hành các câu mẫu hoàn chỉnh ({frame.exemplars.length} câu):
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {frame.exemplars.map((ex, exIdx) => {
                      const exemplarUniqueKey = `${frame.id}-ex-${exIdx}`;
                      const isPracticing = activeExemplarKey === exemplarUniqueKey;

                      return (
                        <div
                          key={exIdx}
                          className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                            isPracticing
                              ? 'border-blue-500/60 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                                {ex.sentence}
                              </div>
                              {ex.ipa && (
                                <div className="font-mono text-xs text-slate-400 dark:text-slate-500">
                                  {ex.ipa}
                                </div>
                              )}
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {ex.meaningVi}
                              </div>

                              {/* Keywords Pills */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] text-slate-400">Từ khóa SafeHarbor:</span>
                                {ex.coreKeywords.map((kw, kIdx) => (
                                  <span
                                    key={kIdx}
                                    className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono border border-emerald-200/50 dark:border-emerald-800/50"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Actions: Dual Speed Playback & Mic Record Toggle */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <DualSpeedAudioButton text={ex.sentence} size="sm" showLabels={true} />
                              <Button
                                size="sm"
                                variant={isPracticing ? 'default' : 'outline'}
                                onClick={() =>
                                  setActiveExemplarKey(isPracticing ? null : exemplarUniqueKey)
                                }
                                className={`gap-1.5 text-xs ${
                                  isPracticing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                                }`}
                              >
                                <Mic className="w-3.5 h-3.5" />
                                <span>{isPracticing ? 'Đang luyện' : 'Luyện nói'}</span>
                              </Button>
                            </div>
                          </div>

                          {/* Expanded SafeHarbor Speech Recorder */}
                          {isPracticing && (
                            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Hãy nói to câu trên vào micro:
                                </span>
                                <button
                                  onClick={() => setActiveExemplarKey(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  Đóng luyện nói
                                </button>
                              </div>

                              <SafeHarborRecorder
                                targetSentence={ex.sentence}
                                coreKeywords={ex.coreKeywords}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link href="/student/speaking/foundation/stage-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Về Chặng 0 (Ngữ âm & Khẩu hình)</span>
            </Button>
          </Link>

          <Link href="/student/speaking/foundation/stage-2">
            <Button size="sm" className="gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700">
              <span>Chuyển tiếp Chặng 2 (Thế khối Lego)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
