'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { StageProgressNav } from '@/components/speaking/foundation/StageProgressNav';
import { getSpeakingStats } from '@/data/speaking/foundation';
import { Button } from '@/components/ui/button';

export default function SpeakingFoundationHubPage() {
  const stats = getSpeakingStats();

  const stages = [
    {
      id: 'stage-0',
      href: '/student/speaking/foundation/stage-0',
      number: 'Chặng 0',
      title: 'Khai thông cơ miệng & Ngữ âm phản xạ',
      tag: 'Phát âm chuẩn',
      badge: '10 Bài học',
      description:
        'Triệt tiêu thói quen nuốt âm đuôi (-s, -z, -ed, -p, -t, -k) và phân biệt các cặp âm hay nhầm lẫn của người Việt qua video khẩu hình trực quan từ Rachel’s English.',
      highlights: [
        '10 bài học khẩu hình phân đoạn chính xác',
        'Cặp âm tối thiểu (Minimal pairs) hay nhầm',
        'Âm đuôi sống còn (-s/-z, -p/-t/-k, -ed)',
        'Quy tắc nhịp điệu và nối âm C‿V',
      ],
      icon: Volume2,
      accentColor: 'from-amber-500/15 to-orange-500/10 border-amber-500/30 text-amber-500',
      btnText: 'Vào học Chặng 0',
    },
    {
      id: 'stage-1',
      href: '/student/speaking/foundation/stage-1',
      number: 'Chặng 1',
      title: 'Kho khung câu phản xạ sống còn',
      tag: 'Không chia thì',
      badge: '28 Khung câu',
      description:
        'Học thuộc các khung câu đúc sẵn (invariant sentence frames) cho 7 tình huống sinh tồn thiết yếu. Nói trôi chảy ngay mà không cần dừng lại chia động từ.',
      highlights: [
        '28 khung câu bất biến qua 7 lĩnh vực sống còn',
        'Gọi món, mua sắm, hỏi đường, khách sạn, công sở',
        'Câu đệm (Fillers) mua thời gian suy nghĩ',
        'Mẹo nối âm và nghe chậm 0.8x bẻ tách âm',
      ],
      icon: MessageSquare,
      accentColor: 'from-blue-500/15 to-cyan-500/10 border-blue-500/30 text-blue-500',
      btnText: 'Vào học Chặng 1',
    },
    {
      id: 'stage-2',
      href: '/student/speaking/foundation/stage-2',
      number: 'Chặng 2',
      title: 'Luyện tập thế khối Lego (Slot Substitution)',
      tag: 'Phản xạ <1s',
      badge: '6 Bộ thế khối',
      description:
        'Tách rời cấu trúc câu cố định và từ vựng biến số. Luyện tập hoán đổi các khối Lego từ vựng vào khung đế để đạt tốc độ phản xạ nói tự nhiên dưới 1 giây.',
      highlights: [
        'Cơ chế đế Lego cố định + gắp lắp khối từ',
        'Đồng hồ đo phản xạ thời gian thực (<1s target)',
        'Huy hiệu "Phản xạ thần tốc" khích lệ cơ miệng',
        'Luyện tập nói câu hoàn chỉnh với SafeHarbor',
      ],
      icon: Layers,
      accentColor: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/30 text-emerald-500',
      btnText: 'Vào học Chặng 2',
    },
    {
      id: 'stage-3',
      href: '/student/speaking/foundation/stage-3',
      number: 'Chặng 3',
      title: 'Quy tắc nở câu 3 nhịp & Hội thoại vi mô',
      tag: 'Thoát nói câu cụt',
      badge: '6 Nở câu + 6 Hội thoại',
      description:
        'Nâng cấp từ câu ngắn cộc lốc sang câu 3 nhịp mượt mà (Cốt lõi -> Bối cảnh -> Cảm xúc/Lý do) và nhập vai 6 tình huống đàm thoại thực tế 4 lượt thoại.',
      highlights: [
        'Mô hình 3 nhịp thở: Cốt lõi -> Bối cảnh -> Cảm xúc',
        'Chỉ dẫn ngừng 300ms trực quan để lấy hơi',
        '6 đoạn hội thoại 4 lượt thoại chuẩn đời sống',
        'Thu âm nhập vai đối đáp từng lượt với đối tác',
      ],
      icon: Sparkles,
      accentColor: 'from-purple-500/15 to-pink-500/10 border-purple-500/30 text-purple-500',
      btnText: 'Vào học Chặng 3',
    },
  ];

  return (
    <StudentShell title="Luyện nói Nền tảng cho Người mất gốc">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Navigation Breadcrumbs */}
        <StageProgressNav showBreadcrumbs={true} />

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                CEFR A0 – A1 (False Beginners)
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Công nghệ Safe Harbor không phán xét
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Luyện nói Nền tảng cho Người mất gốc
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Phương pháp 4 chặng khoa học: từ khai thông cơ miệng qua video khẩu hình Rachel’s
              English, nạp 28 khung câu sống còn không chia thì, tự động hóa phản xạ Lego &lt;1s, đến
              nở câu 3 nhịp và đối thoại tự tin.
            </p>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-2xl font-black text-amber-400">
                  {stats.totalPhoneticLessons}
                </div>
                <div className="text-xs text-slate-300 font-medium">Bài ngữ âm & Khẩu hình</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-2xl font-black text-blue-400">
                  {stats.totalSurvivalFrames}
                </div>
                <div className="text-xs text-slate-300 font-medium">Khung câu sống còn</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-2xl font-black text-emerald-400">
                  {stats.totalLegoLessons}
                </div>
                <div className="text-xs text-slate-300 font-medium">Bộ phản xạ Lego (&lt;1s)</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-2xl font-black text-purple-400">
                  {stats.totalExpansions + stats.totalMicroDialogues}
                </div>
                <div className="text-xs text-slate-300 font-medium">Nở câu & Đối thoại vi mô</div>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology Feature Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Safe Harbor: Gỡ bỏ rào cản sợ sai
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Không bắt lỗi mạo từ vụn vặt (a, an, the) hay giới từ lướt. Đánh giá dựa trên từ khóa
              nội dung giao tiếp cốt lõi, khích lệ nói to dõng dạc.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Âm thanh đối chiếu 2 tốc độ (0.8x & 1.0x)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tốc độ 0.8x bẻ chậm nghe rõ âm đuôi mà không méo tiếng (bảo toàn cao độ). Tốc độ 1.0x
              giúp quen với nhịp điệu tự nhiên của người bản xứ.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Phản xạ khối Lego & Nở câu 3 nhịp
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Lắp ghép từ vựng vào khung bất biến giúp phản xạ dưới 1 giây. Mở rộng câu theo 3 nhịp
              thở tự nhiên giúp xóa bỏ hoàn toàn tật nói câu cộc lốc.
            </p>
          </div>
        </div>

        {/* 4 Main Stages Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Lộ trình 4 Chặng Luyện nói Nền tảng
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Học tuần tự theo từng chặng vi mô để xây dựng phản xạ cơ miệng vững chắc
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="space-y-4">
                    {/* Top Row: Tag & Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {stage.number}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {stage.badge}
                      </span>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center border bg-gradient-to-br ${stage.accentColor}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {stage.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {stage.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-5 mt-4">
                    <Link href={stage.href} className="block w-full">
                      <Button className="w-full justify-between group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <span>{stage.btnText}</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition to Advanced Speaking CTA */}
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
              <Award className="w-4 h-4" />
              Bước tiếp theo sau khi hoàn thành 4 Chặng
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Đã làm chủ ngữ âm và phản xạ khung câu? Hãy bước vào{' '}
              <strong>Luyện nói AI (MVA)</strong> với 24+ chủ đề công sở, tranh biện và đời sống.
            </p>
          </div>
          <Link href="/student/speaking" className="flex-shrink-0">
            <Button variant="outline" className="border-indigo-300 dark:border-indigo-700">
              Khám phá Luyện nói AI
            </Button>
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
