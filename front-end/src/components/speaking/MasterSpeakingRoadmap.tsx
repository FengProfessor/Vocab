'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  BookOpen,
  Compass,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageSquare,
  HelpCircle,
  Flame,
  Award,
  Volume2,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpeakingRoadmapStage = 'foundation' | 'curriculum' | 'topics' | 'ai-tutor';

export interface SpeakingStageMetadata {
  id: SpeakingRoadmapStage;
  stepNumber: number;
  stepLabel: string;
  title: string;
  subtitle: string;
  cefrRange: string;
  targetAudience: string;
  coreGoal: string;
  keyFeatures: string[];
  href: string;
  badge: string;
  accent: {
    border: string;
    bg: string;
    text: string;
    ring: string;
    iconBg: string;
  };
  icon: React.ElementType;
}

export const SPEAKING_ROADMAP_STAGES: SpeakingStageMetadata[] = [
  {
    id: 'foundation',
    stepNumber: 1,
    stepLabel: 'Bước 1: Nền tảng (Đơn giản nhất)',
    title: 'Khóa Nền Tảng A0 - A1',
    subtitle: 'Chống dịch thầm & Khai thông cơ miệng',
    cefrRange: 'CEFR A0 – A1',
    targetAudience: 'Người mất gốc, sợ nói, nuốt âm đuôi, hay dịch thầm từng từ trong đầu',
    coreGoal: 'Phá vỡ rào cản sợ sai, chuẩn hóa khẩu hình, phản xạ nhả câu <1s không cần chia thì',
    keyFeatures: [
      'Khởi động Mindset OS: 6 bài gỡ bỏ "vết thương ngữ pháp"',
      'Chặng 0: Khai thông cơ miệng & 10 bài khẩu hình Rachel’s English',
      'Chặng 1: 28 Khung câu sinh tồn bất biến qua 7 lĩnh vực thiết yếu',
      'Chặng 2: Hoán đổi khối Lego (Slot Substitution) đạt phản xạ <1s',
      'Chặng 3: Quy tắc nở câu 3 nhịp & Hội thoại vi mô 4 lượt đối đáp',
    ],
    href: '/student/speaking/foundation',
    badge: 'Khuyên học đầu tiên',
    accent: {
      border: 'border-emerald-500/40 hover:border-emerald-500',
      bg: 'bg-emerald-950/20',
      text: 'text-emerald-400',
      ring: 'ring-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    icon: Zap,
  },
  {
    id: 'curriculum',
    stepNumber: 2,
    stepLabel: 'Bước 2: Chuẩn hóa (Cơ bản đến Trung cấp)',
    title: 'Lộ Trình 32 Bài Chuẩn Hóa',
    subtitle: 'Giáo trình 3 Phase từ 0 đến 6.5 IELTS',
    cefrRange: 'A1 – B2 • 0-6.5 IELTS',
    targetAudience: 'Người đã có phát âm cơ bản, cần học câu có cấu trúc và phản xạ diễn đạt mạch lạc',
    coreGoal: 'Nâng band theo lộ trình chuẩn hóa qua quy trình sư phạm 4 bước khép kín',
    keyFeatures: [
      'Phase 1 Beginner (10 bài): A1 / 0-3.0 IELTS — Giới thiệu, đời sống cá nhân',
      'Phase 2 Elementary (12 bài): A2-B1 / 3.0-5.0 IELTS — Xã hội, du lịch, công việc',
      'Phase 3 Intermediate (10 bài): B1-B2 / 5.0-6.5 IELTS — Trình bày quan điểm, lập luận',
      'Phương pháp 4 bước mỗi bài: Ngữ âm trị lỗi → Khung câu cố định → Hội thoại vi mô → SafeHarbor',
      'Chấm điểm phản xạ giọng nói nới lỏng (SafeHarbor Voice), không áp lực điểm số',
    ],
    href: '/student/speaking/curriculum',
    badge: '32 Bài học có hệ thống',
    accent: {
      border: 'border-indigo-500/40 hover:border-indigo-500',
      bg: 'bg-indigo-950/20',
      text: 'text-indigo-400',
      ring: 'ring-indigo-500/30',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
    },
    icon: BookOpen,
  },
  {
    id: 'topics',
    stepNumber: 3,
    stepLabel: 'Bước 3: Thực chiến (Mở rộng ngữ cảnh)',
    title: 'Thư Viện 250+ Chủ Đề Thực Tế',
    subtitle: 'Kho kịch bản tình huống đa dạng',
    cefrRange: 'CEFR A2 – B2',
    targetAudience: 'Người muốn tích lũy vốn từ vựng phong phú cho công sở, du lịch và đời sống',
    coreGoal: 'Làm chủ các tình huống giao tiếp đời thực với hình ảnh, từ vựng then chốt và dàn ý mẫu',
    keyFeatures: [
      'Miêu tả (Describing): Đồ vật, con người, phong cảnh, biểu đồ',
      'Sinh hoạt đời sống (Daily Situations): Khách sạn, sân bay, nhà hàng, mua sắm',
      'Kết nối xã hội (Social): Bạn bè, thói quen, cảm xúc, giải trí',
      'Công sở mở rộng (Workplace): Phỏng vấn, họp hành, báo cáo, thương thảo',
      '100% Chủ đề có ảnh trực quan, bộ từ vựng then chốt và thu âm luyện nói',
    ],
    href: '/student/speaking/topics',
    badge: '229+ Tình huống thực tế',
    accent: {
      border: 'border-amber-500/40 hover:border-amber-500',
      bg: 'bg-amber-950/20',
      text: 'text-amber-400',
      ring: 'ring-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    icon: Compass,
  },
  {
    id: 'ai-tutor',
    stepNumber: 4,
    stepLabel: 'Bước 4: Đối thoại AI (Nâng cao & Phản xạ)',
    title: 'AI Speaking Tutor & Tranh Biện',
    subtitle: 'Đàm thoại 1:1 tương tác giọng nói trực tiếp',
    cefrRange: 'CEFR B1 – C1',
    targetAudience: 'Người muốn luyện phản xạ tự nhiên không kịch bản, sửa lỗi tức thì và nâng cao khả năng biện luận',
    coreGoal: 'Tự tin đàm luận chuyên sâu, tranh biện đa góc nhìn với đối tác AI Voice thông minh',
    keyFeatures: [
      'Nhập vai đối tác thực tế (HR Manager, Đồng nghiệp, Giám khảo, Du khách)',
      'Phản hồi tức thì: Chỉ ra điểm phát âm cần nắn chỉnh và gợi ý cách diễn đạt tự nhiên hơn',
      '24+ Kịch bản nâng cao: Công sở, học thuật, tranh biện và phỏng vấn',
      'Đo lường sự lưu loát, độ tự tin và phản xạ nhả câu thời gian thực',
      'Trò chuyện tự do bằng giọng nói trực tiếp không giới hạn thời gian',
    ],
    href: '/student/speaking',
    badge: 'Đàm thoại AI 1:1',
    accent: {
      border: 'border-purple-500/40 hover:border-purple-500',
      bg: 'bg-purple-950/20',
      text: 'text-purple-400',
      ring: 'ring-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
    icon: Bot,
  },
];

export interface MasterSpeakingRoadmapProps {
  /** The current active stage ID on the page */
  currentStage?: SpeakingRoadmapStage;
  /** Whether to show compact navigation bar, full visual guide, or both */
  mode?: 'compact-nav' | 'full-guide' | 'both';
  /** Optional custom class name */
  className?: string;
}

export function MasterSpeakingRoadmap({
  currentStage,
  mode = 'compact-nav',
  className = '',
}: MasterSpeakingRoadmapProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(mode === 'full-guide');
  const [guideTab, setGuideTab] = useState<'daily' | 'weeks' | 'cushions' | 'stages' | 'diagnostic'>('daily');
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<number | null>(null);

  const diagnostics = [
    {
      id: 1,
      emoji: '🐣',
      status: 'Mất gốc, sợ sai, trong đầu luôn dịch thầm tiếng Việt',
      recommendStage: 'foundation' as SpeakingRoadmapStage,
      recommendStep: 'Chặng 1: Nền tảng A0-A1',
      description: 'Học Mindset giải phóng tâm lý, phát âm khẩu hình chuẩn và 28 khung câu đúc sẵn để nhả âm tự nhiên.',
    },
    {
      id: 2,
      emoji: '📘',
      status: 'Biết từ vựng nhưng nói ngắc ngứ, câu cộc lốc',
      recommendStage: 'curriculum' as SpeakingRoadmapStage,
      recommendStep: 'Chặng 2: 32 Bài chuẩn hóa',
      description: 'Học cách liên kết câu, áp dụng công thức Nở câu 3 nhịp và nâng band từ 0 đến 6.5 IELTS có bài bản.',
    },
    {
      id: 3,
      emoji: '🧭',
      status: 'Giao tiếp cơ bản được, muốn mở rộng tình huống thực tế',
      recommendStage: 'topics' as SpeakingRoadmapStage,
      recommendStep: 'Chặng 3: 250+ Chủ đề thực chiến',
      description: 'Làm giàu vốn từ và mẫu câu qua 4 lĩnh vực: Miêu tả, Đời sống, Kết nối xã hội, Công sở mở rộng.',
    },
    {
      id: 4,
      emoji: '🚀',
      status: 'Muốn luyện đối đáp tự do 1:1, tranh biện & phản xạ realtime',
      recommendStage: 'ai-tutor' as SpeakingRoadmapStage,
      recommendStep: 'Chặng 4: AI Speaking Tutor',
      description: 'Bật mic trò chuyện trực tiếp với AI, nhận phân tích phát âm và gợi ý cách diễn đạt tự nhiên tức thì.',
    },
  ];

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* ── COMPACT TOP NAVIGATION BAR: 4 Progressive Steps ────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 backdrop-blur-md shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Lộ Trình Luyện Nói 4 Chặng (Từ Đơn Giản Đến Nâng Cao)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  A0 ➔ C1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 hidden md:block">
                Học theo thứ tự chuẩn sư phạm: Nền móng vững chắc → Giáo trình bài bản → Thực chiến tình huống → Đàm thoại đối kháng AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/50 transition-all shrink-0"
          >
            <HelpCircle className="size-3.5" />
            <span>{isGuideOpen ? 'Thu gọn cẩm nang' : 'Xem cẩm nang học chi tiết'}</span>
            {isGuideOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {/* 4 Step Sequential Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3">
          {SPEAKING_ROADMAP_STAGES.map((stage) => {
            const isActive = stage.id === currentStage;
            const Icon = stage.icon;

            return (
              <Link
                key={stage.id}
                href={stage.href}
                className={cn(
                  'group relative flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all duration-200 text-left',
                  isActive
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                )}
              >
                {/* Step badge & Level */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    Bước {stage.stepNumber}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold truncate">
                    {stage.cefrRange.split('•')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'size-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                      stage.accent.iconBg
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={cn(
                        'text-xs font-bold truncate transition-colors',
                        isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      )}
                    >
                      {stage.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="mt-2 pt-1.5 border-t border-indigo-500/30 flex items-center justify-between text-[10px] text-indigo-300 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Đang ở chặng này
                    </span>
                    <ArrowRight className="size-3" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── EXPANDABLE FULL ROADMAP & PEDAGOGICAL STUDY MANUAL ─────────────── */}
      {isGuideOpen && (
        <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 p-4 sm:p-6 space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
          
          {/* TAB BAR NAVIGATION */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setGuideTab('daily')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                guideTab === 'daily'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Clock className="size-3.5" />
              <span>20 Phút Mỗi Ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('weeks')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                guideTab === 'weeks'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Calendar className="size-3.5" />
              <span>Lộ Trình 12 Tuần</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('cushions')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                guideTab === 'cushions'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <ShieldCheck className="size-3.5" />
              <span>6 Câu Đệm Cứu Sinh</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('stages')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                guideTab === 'stages'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Layers className="size-3.5" />
              <span>4 Chặng Chi Tiết</span>
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('diagnostic')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all',
                guideTab === 'diagnostic'
                  ? 'bg-indigo-600 text-white shadow font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              )}
            >
              <Target className="size-3.5" />
              <span>Tự Chẩn Đoán</span>
            </button>
          </div>

          {/* TAB 1: 20 PHÚT MỖI NGÀY */}
          {guideTab === 'daily' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Quy Trình 20 Phút Chuẩn Sư Phạm Mỗi Ngày
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nguyên tắc: &ldquo;Kết nối hơn hoàn hảo&rdquo; — Chia nhỏ thời gian, luyện đúng nhịp sinh học não bộ để không bị nản.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Step 1 */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      00:00 - 05:00 (5 Phút)
                    </span>
                    <Volume2 className="size-4 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    1. Khởi Động Khẩu Hình &amp; Trị Lỗi Phát Âm
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Vào <strong>Chặng 0 (Stage 0)</strong>. Quan sát Studio Khẩu Hình 2026 (Lip, Tongue, Jaw). Nắn chỉnh các âm người Việt hay nuốt hoặc phát âm sai: <code className="text-emerald-300 font-mono">/θ/</code>, <code className="text-emerald-300 font-mono">/ð/</code>, <code className="text-emerald-300 font-mono">/tʃ/</code>, <code className="text-emerald-300 font-mono">/dʒ/</code>.
                  </p>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-amber-400">💡 Thần chú âm đuôi:</strong>
                    <ul className="mt-1 space-y-0.5 text-slate-400">
                      <li>• <strong>-ed = /id/</strong>: &ldquo;Tiền Đô&rdquo; (t, d) ➔ <em>waited, needed</em></li>
                      <li>• <strong>-ed = /t/</strong>: &ldquo;Phải Kính Phục Sếp Chấn&rdquo; (p, k, f, s, ʃ, tʃ) ➔ <em>watched, laughed</em></li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      05:00 - 10:00 (5 Phút)
                    </span>
                    <Layers className="size-4 text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    2. Lắp Ghép Khối Lego Phản Xạ &lt;1s
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Vào <strong>Chặng 2 (Lego Slot Substitution)</strong>. Chọn 1 khung câu sinh tồn (ví dụ: <code className="text-indigo-300 font-mono">I&apos;d like to order a [DRINK]</code>). Lắp nhanh 5-10 danh từ khác nhau vào chỗ trống.
                  </p>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-indigo-400">🎯 Mục tiêu cốt lõi:</strong>
                    <p className="mt-1 text-slate-400">
                      Đạt tốc độ dưới 1000ms (Huy hiệu <em>Fluent</em>). <strong>KHÔNG</strong> chia thì, <strong>KHÔNG</strong> dịch nhẩm tiếng Việt, thấy ảnh/từ là bật âm tức thì.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      10:00 - 15:00 (5 Phút)
                    </span>
                    <Brain className="size-4 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    3. Kỹ Thuật Nở Câu 3 Nhịp (3-Beat Expansion)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Vào <strong>Chặng 3 (Three-Beat Expansion)</strong>. Chấm dứt thói quen trả lời cộc lốc 3 từ. Nói theo 3 cụm hơi thở có quãng nghỉ 300ms:
                  </p>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] space-y-1 font-mono">
                    <p className="text-slate-300"><strong className="text-amber-400 font-sans">Nhịp 1:</strong> I usually wake up early</p>
                    <p className="text-slate-400 text-[10px] font-sans italic text-center">— nghỉ 300ms lấy hơi —</p>
                    <p className="text-slate-300"><strong className="text-amber-400 font-sans">Nhịp 2:</strong> at around 6 AM on weekdays</p>
                    <p className="text-slate-400 text-[10px] font-sans italic text-center">— nghỉ 300ms lấy hơi —</p>
                    <p className="text-slate-300"><strong className="text-amber-400 font-sans">Nhịp 3:</strong> because I love having a quiet cup of coffee.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      15:00 - 20:00 (5 Phút)
                    </span>
                    <Flame className="size-4 text-purple-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    4. Thu Âm SafeHarbor Voice &amp; AI Tutor
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bật micro, đọc dõng dạc câu đã ghép hoặc đối thoại 4 lượt (Micro-dialogue). SafeHarbor nới lỏng lỗi mạo từ và từ đệm, chỉ đánh giá mức độ truyền tải thông điệp chính (<code className="text-purple-300 font-mono">Recall &ge; 75%</code>).
                  </p>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                    <strong className="text-purple-400">🚀 Tâm thế người học:</strong>
                    <p className="mt-1 text-slate-400">
                      Nói dứt khoát, âm lượng đủ nghe. Nếu bí từ, áp dụng ngay <em>Câu Đệm Cứu Sinh</em> để giữ nhịp, tuyệt đối không ngắt quãng im lặng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỘ TRÌNH 12 TUẦN */}
          {guideTab === 'weeks' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Lộ Trình 12 Tuần: Từ Số 0 Đến Giao Tiếp Lưu Loát &amp; 6.5 IELTS
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cam kết thực hiện 20 phút mỗi ngày. Mỗi chặng đều có tiêu chí nghiệm thu rõ ràng trước khi chuyển cấp.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Week 1-2 */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs shrink-0 self-start">
                    Tuần 1 - 2
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Khai Khẩu &amp; Gỡ Bỏ Rào Cản Tâm Lý (A0 ➔ A1)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">Chặng 1: Nền Tảng</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Nội dung:</strong> 6 bài Mindset OS xóa bỏ ám ảnh &ldquo;nói sai ngữ pháp thì bị chê&rdquo; + Stage 0 Studio (10 bài khẩu hình &amp; âm đuôi).
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Chuẩn nghiệm thu:</strong> Hết ngượng mồm, cơ miệng linh hoạt, phát âm chuẩn 44 âm IPA, bật rõ đuôi <code className="text-slate-300">/s/, /z/, /t/, /d/, /-ed/</code>.
                    </p>
                  </div>
                </div>

                {/* Week 3-4 */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs shrink-0 self-start">
                    Tuần 3 - 4
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">28 Khung Câu Sinh Tồn Bất Biến (A1)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-400">Chặng 1: Nền Tảng</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Nội dung:</strong> Stage 1 Nền tảng — Làm chủ 28 khung câu qua 7 lĩnh vực (F&amp;B, Mua sắm, Du lịch, Hỏi đường, Sinh hoạt, Công sở, Khẩn cấp).
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Chuẩn nghiệm thu:</strong> Bật câu phản xạ &lt;1s trong các tình huống thường nhật. Nhớ câu nguyên vẹn như câu thần chú bản năng.
                    </p>
                  </div>
                </div>

                {/* Week 5-6 */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs shrink-0 self-start">
                    Tuần 5 - 6
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Lắp Ráp Lego &amp; Nở Câu 3 Nhịp (A1 ➔ A2)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">Chặng 1: Nền Tảng</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Nội dung:</strong> Stage 2 (Lego Slot Substitution với 50+ slot) và Stage 3 (Three-Beat Breath Units &amp; Micro-Dialogues).
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Chuẩn nghiệm thu:</strong> Kéo dài câu nói từ 3 từ thành câu phức 15-20 từ mạch lạc, không dịch thầm trong đầu, đạt badge &ldquo;Fluent&rdquo;.
                    </p>
                  </div>
                </div>

                {/* Week 7-9 */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold text-xs shrink-0 self-start">
                    Tuần 7 - 9
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Chuẩn Hóa Theo Giáo Trình 32 Bài (A2 ➔ B1)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-400">Chặng 2: 32 Bài</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Nội dung:</strong> Phase 1 Beginner (10 bài) &amp; Phase 2 Elementary (12 bài). Quy trình 4 bước: Trị lỗi ngữ âm ➔ Khung câu chuẩn ➔ Hội thoại mẫu ➔ SafeHarbor chấm điểm.
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Chuẩn nghiệm thu:</strong> Tự tin miêu tả sự việc trong quá khứ, hiện tại, đưa ra lời khuyên, thảo luận kế hoạch công việc và du lịch (Band 4.5 - 5.0 IELTS).
                    </p>
                  </div>
                </div>

                {/* Week 10-12 */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-start gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold text-xs shrink-0 self-start">
                    Tuần 10 - 12
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Thực Chiến 250+ Chủ Đề &amp; Đàm Thoại AI 1:1 (B1 ➔ B2 / 6.5 IELTS)</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-400">Chặng 3 &amp; 4</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Nội dung:</strong> Phase 3 Intermediate (10 bài), kho 250+ Topics thực tế và thực chiến đối kháng giọng nói với AI Speaking Tutor.
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Chuẩn nghiệm thu:</strong> Trình bày quan điểm cá nhân, tranh luận đa chiều, xử lý câu hỏi bất ngờ với Câu Đệm Cứu Sinh, tự tin đàm luận 2-3 phút liên tục (Band 6.0 - 6.5+ IELTS).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 6 CÂU ĐỆM CỨU SINH */}
          {guideTab === 'cushions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      6 Câu Đệm Cứu Sinh (Stalling Cushions) &amp; Quy Tắc 3 Giây
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vũ khí bí mật của người bản xứ và thí sinh IELTS 8.0+ để không bao giờ bị đứng hình hay ngắc ngứ khi gặp câu hỏi bất ngờ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Golden 3-second Rule Banner */}
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="size-4 text-amber-400" />
                  <span>Quy Tắc 3 Giây (The 3-Second Golden Rule):</span>
                </div>
                <p className="leading-relaxed">
                  Khi người đối diện hỏi xong, nếu trong vòng <strong>3 giây</strong> não bạn chưa kịp ghép câu:
                  <br />
                  ❌ <strong>TUYỆT ĐỐI KHÔNG:</strong> Im lặng nhìn trần nhà hoặc phát âm &ldquo;ờ... à... ừm...&rdquo;.
                  <br />
                  ✅ <strong>BẬT NGAY:</strong> 1 trong 6 câu đệm cứu sinh bên dưới. Não bạn sẽ có thêm 3-5 giây để sắp xếp ý tưởng trong khi người nghe cảm thấy bạn phản xạ cực kỳ tự nhiên!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    num: '01',
                    en: "That's a really interesting question, let me think about that for a second...",
                    vi: 'Đó là một câu hỏi rất thú vị, để tôi suy nghĩ một chút...',
                    time: '3.5 giây',
                    context: 'Áp dụng cho mọi câu hỏi từ phỏng vấn, giao tiếp đời sống đến bài thi IELTS.',
                  },
                  {
                    num: '02',
                    en: "To be completely honest with you, I haven't thought much about this before, but...",
                    vi: 'Thành thật mà nói, tôi chưa từng nghĩ nhiều về điều này trước đây, nhưng...',
                    time: '4.0 giây',
                    context: 'Cứu cánh hoàn hảo khi gặp chủ đề lạ lẫm, trừu tượng hoặc chưa có sự chuẩn bị.',
                  },
                  {
                    num: '03',
                    en: "Well, looking at it from my personal perspective, the first thing that comes to mind is...",
                    vi: 'À, nhìn từ góc độ cá nhân của tôi, điều đầu tiên hiện lên trong tâm trí là...',
                    time: '4.5 giây',
                    context: 'Rất hiệu quả khi được hỏi về quan điểm cá nhân, thói quen hoặc sở thích.',
                  },
                  {
                    num: '04',
                    en: "Actually, that's something I've been reflecting on quite a bit recently...",
                    vi: 'Thực ra đó là điều mà gần đây tôi cũng suy ngẫm khá nhiều...',
                    time: '3.5 giây',
                    context: 'Tạo cảm giác sâu sắc, trưởng thành khi thảo luận về công việc hoặc xu hướng xã hội.',
                  },
                  {
                    num: '05',
                    en: "If you ask me, there are definitely two different sides to this story...",
                    vi: 'Nếu bạn hỏi tôi, thì vấn đề này chắc chắn có hai mặt khác nhau...',
                    time: '3.0 giây',
                    context: 'Mở đường hoàn hảo để phân tích mặt tích cực / tiêu cực trước khi chốt ý.',
                  },
                  {
                    num: '06',
                    en: "Could you clarify what you mean by that? Just to make sure we're on the same page.",
                    vi: 'Bạn có thể làm rõ hơn ý của bạn được không? Để tôi chắc chắn chúng ta cùng hiểu một hướng.',
                    time: '5.0 giây (Mượn thời gian đối phương)',
                    context: 'Dùng khi câu hỏi quá nhanh, chưa rõ ràng hoặc bạn cần người hỏi giải thích thêm.',
                  },
                ].map((item) => (
                  <div key={item.num} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Câu Đệm #{item.num}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        ⏱️ Câu giờ {item.time}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white font-mono leading-snug">
                      &ldquo;{item.en}&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-300 italic">
                      ➔ {item.vi}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      💡 <em>Khi nào dùng:</em> {item.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 4 CHẶNG CHI TIẾT */}
          {guideTab === 'stages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Bản Đồ 4 Chặng Luyện Nói Từ Đơn Giản Đến Nâng Cao
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Khung tham chiếu CEFR Quốc tế từ A0 đến C1
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {SPEAKING_ROADMAP_STAGES.map((stage) => {
                  const Icon = stage.icon;
                  const isCurrent = stage.id === currentStage;

                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        'p-4 sm:p-5 rounded-2xl border transition-all duration-200',
                        stage.accent.bg,
                        stage.accent.border,
                        isCurrent ? 'ring-2 ring-indigo-500/50 shadow-xl' : ''
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Left: Info & Progression */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div
                            className={cn(
                              'size-10 rounded-xl flex items-center justify-center shrink-0 shadow-md',
                              stage.accent.iconBg
                            )}
                          >
                            <Icon className="size-5" />
                          </div>

                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-white font-mono">
                                Bước {stage.stepNumber}
                              </span>
                              <h4 className="text-base font-bold text-white">
                                {stage.title}
                              </h4>
                              <span
                                className={cn(
                                  'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                                  stage.accent.text,
                                  stage.accent.border
                                )}
                              >
                                {stage.cefrRange}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                                {stage.badge}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 font-medium">
                              {stage.subtitle}
                            </p>

                            {/* Target audience & Core goal */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                                  Phù hợp nhất cho:
                                </span>
                                <span className="text-slate-200 mt-0.5 block">{stage.targetAudience}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                                  Mục tiêu đầu ra:
                                </span>
                                <span className="text-slate-200 mt-0.5 block">{stage.coreGoal}</span>
                              </div>
                            </div>

                            {/* Key features bullets */}
                            <div className="pt-1 space-y-1">
                              {stage.keyFeatures.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: CTA Button */}
                        <div className="shrink-0 self-end md:self-center">
                          <Link
                            href={stage.href}
                            className={cn(
                              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md',
                              isCurrent
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-700'
                            )}
                          >
                            <span>{isCurrent ? 'Đang học tại đây' : `Bắt đầu Bước ${stage.stepNumber}`}</span>
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: TỰ CHẨN ĐOÁN */}
          {guideTab === 'diagnostic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Target className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Tự Đánh Giá: Bạn nên bắt đầu từ chặng nào?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bấm chọn tình trạng hiện tại của bạn để nhận lộ trình gợi ý chính xác nhất, tránh học vượt cấp gây nản chí:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {diagnostics.map((diag) => {
                  const isSelected = selectedDiagnostic === diag.id;
                  return (
                    <button
                      key={diag.id}
                      type="button"
                      onClick={() => setSelectedDiagnostic(isSelected ? null : diag.id)}
                      className={cn(
                        'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-lg'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-base mb-1.5">
                          <span>{diag.emoji}</span>
                          <span className="text-xs font-bold text-slate-200 line-clamp-1">
                            Trường hợp {diag.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-snug">
                          &ldquo;{diag.status}&rdquo;
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
                        <span className="text-amber-400 font-semibold block">Gợi ý học tập:</span>
                        <strong className="text-indigo-300 block mt-0.5">{diag.recommendStep}</strong>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {diag.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}



