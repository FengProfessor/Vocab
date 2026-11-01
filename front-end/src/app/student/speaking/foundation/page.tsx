'use client';

import React, { useState, useMemo } from 'react';
import Link from '@/shared/router/navigation';
import {
  Volume2,
  MessageSquare,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Headphones,
  Zap,
  Award,
  Brain,
  Compass,
  BookOpen,
  Bot,
  Filter,
} from 'lucide-react';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { getSpeakingStats } from '@/data/speaking/foundation';
import { Button } from '@/components/ui/button';
import { SpeakingStepLayout } from '@/components/speaking/SpeakingStepLayout';

const STAGE_CATEGORIES = [
  { id: 'all', label: 'Tất cả (5)' },
  { id: 'mindset_phonetics', label: 'Tư duy & Ngữ âm' },
  { id: 'frames_lego', label: 'Khung câu & Lego' },
  { id: 'dialogue', label: 'Nở câu & Hội thoại' },
] as const;

export default function SpeakingFoundationHubPage() {
  const stats = getSpeakingStats();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const stages = useMemo(
    () => [
      {
        id: 'stage-mindset',
        category: 'mindset_phonetics',
        href: '/student/speaking/foundation/stage-mindset',
        number: 'Khởi động',
        level: 'A0',
        title: 'Hệ điều hành Tư duy nói (Mindset OS)',
        tag: 'Bắt buộc trước tiên',
        badge: `${stats.totalMindsetLessons || 6} Bài học tư duy`,
        description:
          'Giải phẫu "vết thương ngữ pháp" 12 năm phổ thông, phá vỡ vòng lặp dịch thầm, và cài đặt 5 mô hình tư duy: Kết nối hơn hoàn hảo, Khối Lego, và Ranh giới ĐỦ.',
        highlights: [
          'Phá vỡ vòng lặp dịch thầm & tê liệt ngữ pháp',
          'Tư duy: Kết nối hơn hoàn hảo (Communication)',
          'Quy tắc Khối Lego: Nhả âm <0.3s không ghép từ',
          'Bảng cam kết giải phóng tâm lý (Pledges)',
        ],
        icon: Brain,
        emoji: '🧠',
        accentColor:
          'from-indigo-500/20 to-purple-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
        btnText: 'Vào học Khởi động Tư duy',
      },
      {
        id: 'stage-0',
        category: 'mindset_phonetics',
        href: '/student/speaking/foundation/stage-0',
        number: 'Chặng 0',
        level: 'A0',
        title: 'Khai thông cơ miệng & Ngữ âm phản xạ',
        tag: 'Phát âm chuẩn',
        badge: `${stats.totalPhoneticLessons} Bài học`,
        description:
          'Triệt tiêu thói quen nuốt âm đuôi (-s, -z, -ed, -p, -t, -k) và phân biệt các cặp âm hay nhầm lẫn của người Việt qua video khẩu hình trực quan từ Rachel’s English.',
        highlights: [
          '10 bài học khẩu hình phân đoạn chính xác',
          'Cặp âm tối thiểu (Minimal pairs) hay nhầm',
          'Âm đuôi sống còn (-s/-z, -p/-t/-k, -ed)',
          'Quy tắc nhịp điệu và nối âm C‿V',
        ],
        icon: Volume2,
        emoji: '👄',
        accentColor:
          'from-amber-500/15 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
        btnText: 'Vào học Chặng 0',
      },
      {
        id: 'stage-1',
        category: 'frames_lego',
        href: '/student/speaking/foundation/stage-1',
        number: 'Chặng 1',
        level: 'A0-A1',
        title: 'Kho khung câu phản xạ sống còn',
        tag: 'Không chia thì',
        badge: `${stats.totalSurvivalFrames} Khung câu`,
        description:
          'Học thuộc các khung câu đúc sẵn (invariant sentence frames) cho 7 tình huống sinh tồn thiết yếu. Nói trôi chảy ngay mà không cần dừng lại chia động từ.',
        highlights: [
          '28 khung câu bất biến qua 7 lĩnh vực sống còn',
          'Gọi món, mua sắm, hỏi đường, khách sạn, công sở',
          'Câu đệm (Fillers) mua thời gian suy nghĩ',
          'Mẹo nối âm và nghe chậm 0.8x bẻ tách âm',
        ],
        icon: MessageSquare,
        emoji: '💬',
        accentColor:
          'from-blue-500/15 to-cyan-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
        btnText: 'Vào học Chặng 1',
      },
      {
        id: 'stage-2',
        category: 'frames_lego',
        href: '/student/speaking/foundation/stage-2',
        number: 'Chặng 2',
        level: 'A1',
        title: 'Luyện tập thế khối Lego (Slot Substitution)',
        tag: 'Phản xạ <1s',
        badge: `${stats.totalLegoLessons} Bộ thế khối`,
        description:
          'Tách rời cấu trúc câu cố định và từ vựng biến số. Luyện tập hoán đổi các khối Lego từ vựng vào khung đế để đạt tốc độ phản xạ nói tự nhiên dưới 1 giây.',
        highlights: [
          'Cơ chế đế Lego cố định + gắp lắp khối từ',
          'Đồng hồ đo phản xạ thời gian thực (<1s target)',
          'Huy hiệu "Phản xạ tức thì" khích lệ cơ miệng',
          'Luyện tập nói câu hoàn chỉnh với SafeHarbor',
        ],
        icon: Layers,
        emoji: '🧱',
        accentColor:
          'from-emerald-500/15 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        btnText: 'Vào học Chặng 2',
      },
      {
        id: 'stage-3',
        category: 'dialogue',
        href: '/student/speaking/foundation/stage-3',
        number: 'Chặng 3',
        level: 'A1+',
        title: 'Quy tắc nở câu 3 nhịp & Hội thoại vi mô',
        tag: 'Thoát nói câu cụt',
        badge: `${stats.totalExpansions} Nở câu + ${stats.totalMicroDialogues} Hội thoại`,
        description:
          'Nâng cấp từ câu ngắn cộc lốc sang câu 3 nhịp mượt mà (Cốt lõi -> Bối cảnh -> Cảm xúc/Lý do) và nhập vai 6 tình huống đàm thoại thực tế 4 lượt thoại.',
        highlights: [
          'Mô hình 3 nhịp thở: Cốt lõi -> Bối cảnh -> Cảm xúc',
          'Chỉ dẫn ngừng 300ms trực quan để lấy hơi',
          '6 đoạn hội thoại 4 lượt thoại chuẩn đời sống',
          'Thu âm nhập vai đối đáp từng lượt với đối tác',
        ],
        icon: Sparkles,
        emoji: '✨',
        accentColor:
          'from-purple-500/15 to-pink-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
        btnText: 'Vào học Chặng 3',
      },
    ],
    [stats]
  );

  const [activeStageId, setActiveStageId] = useState<string>(stages[0].id);

  const filteredStages = useMemo(() => {
    if (selectedCategory === 'all') return stages;
    return stages.filter((s) => s.category === selectedCategory);
  }, [stages, selectedCategory]);

  const activeStage = useMemo(
    () => stages.find((s) => s.id === activeStageId) || stages[0],
    [stages, activeStageId]
  );

  const ActiveIcon = activeStage.icon;

  return (
    <SpeakingStepLayout
      currentStage="foundation"
      shellTitle="Luyện nói Nền tảng cho Người mất gốc"
      headerTitle="Khóa Nền Tảng Cho Người Mất Gốc (A0 – A1)"
      headerIcon={<Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
      headerActions={
        <>
          <Link href="/student/speaking/foundation/stage-mindset">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
            >
              <Brain className="mr-1.5 size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Khởi động Tư duy</span>
              <span className="sm:hidden">Mindset</span>
            </Button>
          </Link>
          <Link href="/student/speaking/curriculum">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
            >
              <BookOpen className="mr-1.5 size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Bước 2: 32 Bài</span>
              <span className="sm:hidden">Bước 2</span>
            </Button>
          </Link>
        </>
      }
      subHeaderSlot={<StageProgressNav showBreadcrumbs={false} />}
      contentClassName="flex flex-col md:flex-row gap-4 sm:gap-6"
    >
      {/* Left Main Panel: Studio Workspace */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        {/* Active Stage Header Bar */}
        <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{activeStage.emoji}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {activeStage.number}: {activeStage.title}
            </span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-800/50">
              {activeStage.badge}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-slate-500">Trọng tâm:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px]">
              {activeStage.tag}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50 text-[10px]">
              SafeHarbor Không Phán Xét
            </span>
          </div>
        </div>

        {/* Context & Pedagogical Objective Banner */}
        <div className="px-4 py-3 bg-indigo-50/40 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Chế độ huấn luyện:</span>
              <strong className="text-slate-900 dark:text-white">
                Luyện nói Nền tảng cho Người mất gốc
              </strong>
              <span className="text-slate-500 dark:text-slate-400">
                (Không bắt lỗi vụn vặt • Ưu tiên bật âm)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
              Mục tiêu: Phản xạ &lt; 1 giây
            </span>
          </div>

          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-amber-700 dark:text-amber-400/90">Mô tả chặng:</strong>{' '}
            {activeStage.description}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Kỹ năng bạn sẽ đạt:
            </span>
            {activeStage.highlights.map((h, hi) => (
              <span
                key={hi}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
              >
                ✓ {h}
              </span>
            ))}
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Active Stage Spotlight Card */}
          <div className="rounded-2xl border border-indigo-300 dark:border-indigo-500/40 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 dark:from-indigo-950/50 dark:via-slate-900 dark:to-purple-950/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-lg">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border bg-gradient-to-br ${activeStage.accentColor}`}
              >
                <ActiveIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-400 text-slate-950">
                    Đang chọn • {activeStage.number}
                  </span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
                    {activeStage.badge}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {activeStage.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                  {activeStage.description}
                </p>
              </div>
            </div>

            <Link href={activeStage.href} className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2 px-4 py-2.5 text-xs shadow-sm dark:shadow-md dark:shadow-indigo-950/50">
                <span>{activeStage.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* All 5 Stages Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Toàn bộ 5 Chặng Khởi Động &amp; Luyện Nói Nền Tảng
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Bấm vào từng chặng để vào bài học chi tiết
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stages.map((stage) => {
                const Icon = stage.icon;
                const isMindset = stage.id === 'stage-mindset';
                const isSelected = stage.id === activeStage.id;

                return (
                  <div
                    key={stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                    className={`group cursor-pointer relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                      isMindset ? 'md:col-span-2 ' : ''
                    }${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-slate-900/90 shadow-sm dark:shadow-md dark:shadow-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {stage.number} • {stage.tag}
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700/70">
                          {stage.badge}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border bg-gradient-to-br ${stage.accentColor}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {stage.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                        {stage.highlights.map((h, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Trình độ: {stage.level}
                      </span>
                      <Link href={stage.href}>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-8 px-3 gap-1.5"
                        >
                          <span>{stage.btnText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Methodology Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Safe Harbor: Gỡ bỏ rào cản sợ sai
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Không bắt lỗi mạo từ vụn vặt (a, an, the). Đánh giá dựa trên từ khóa nội dung cốt
                lõi, khích lệ nói to dõng dạc.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Âm thanh đối chiếu 2 tốc độ (0.8x &amp; 1.0x)
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Tốc độ 0.8x bẻ chậm nghe rõ âm đuôi mà không méo tiếng. Tốc độ 1.0x giúp quen nhịp
                điệu tự nhiên bản xứ.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Phản xạ khối Lego &amp; Nở câu 3 nhịp
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Lắp ghép từ vựng vào khung bất biến giúp phản xạ dưới 1 giây. Mở rộng câu theo 3
                nhịp thở tự nhiên.
              </p>
            </div>
          </div>

          {/* Transition to Next Steps in Speaking Roadmap */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs sm:text-sm">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tốt Nghiệp Bước 1 (Nền Tảng) — Bước Tiếp Theo Của Bạn</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Link
                href="/student/speaking/curriculum"
                className="p-3 rounded-xl border border-indigo-300 dark:border-indigo-500/30 bg-white dark:bg-slate-950/60 hover:border-indigo-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    <span>Bước 2 (Khuyên tiếp theo)</span>
                    <BookOpen className="size-3.5" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Lộ Trình 32 Bài Chuẩn Hóa
                  </h5>
                </div>
                <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <span>Vào học 32 bài</span>
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/student/speaking/topics"
                className="p-3 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-white dark:bg-slate-950/60 hover:border-amber-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                    <span>Bước 3 (Thực chiến)</span>
                    <Compass className="size-3.5" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Thư Viện 250+ Chủ Đề
                  </h5>
                </div>
                <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span>Xem 250+ chủ đề</span>
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/student/speaking"
                className="p-3 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-white dark:bg-slate-950/60 hover:border-purple-500 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1">
                    <span>Bước 4 (Đối thoại AI)</span>
                    <Bot className="size-3.5" />
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    AI Speaking Tutor
                  </h5>
                </div>
                <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                  <span>Luyện cùng AI</span>
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Đang xem:{' '}
            <strong className="text-slate-900 dark:text-slate-200">{activeStage.title}</strong>
          </div>
          <Link href={activeStage.href}>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5"
            >
              <span>{activeStage.btnText}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Right Sidebar: 5 Foundation Stages Selector */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="size-3.5" /> Chặng nền tảng ({filteredStages.length})
          </h3>
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/50 px-1.5 py-0.5 rounded">
            CEFR A0 – A1
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
          {STAGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stages Scroll List */}
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-1 scrollbar-thin">
          {filteredStages.map((stage) => {
            const isActive = activeStage.id === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`flex-1 md:flex-none text-left p-3 rounded-xl border transition-all text-xs shrink-0 w-64 md:w-full ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-600/15 border-indigo-500 text-slate-900 dark:text-white shadow-sm dark:shadow-md dark:shadow-indigo-950/50'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="font-bold truncate flex items-center gap-1.5">
                    <span>{stage.emoji}</span>
                    <span className="truncate">
                      {stage.number}: {stage.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 shrink-0">
                    {stage.level}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {stage.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Metrics Summary in Sidebar */}
        <div className="hidden md:grid grid-cols-2 gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/50 text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {stats.totalMindsetLessons || 6}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Trụ cột Tư duy</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-base font-black text-amber-600 dark:text-amber-400">
              {stats.totalPhoneticLessons}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Bài khẩu hình</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-base font-black text-blue-600 dark:text-blue-400">
              {stats.totalSurvivalFrames}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Khung câu sống còn</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/70">
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalLegoLessons}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Bộ phản xạ Lego</div>
          </div>
        </div>
      </div>
    </SpeakingStepLayout>
  );
}
