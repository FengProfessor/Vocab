'use client';

/**
 * Hub Sử dụng từ — 2 dạng: Đặt câu (codemix) · Luyện đọc (pack-reading)
 * URL: /practice
 */

import Link from 'next/link';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';

const MODES = [
  {
    href: '/practice/codemix',
    emoji: '✨',
    title: 'Đặt câu',
    desc: 'Chọn từ · viết đoạn có từ · AI nâng full English',
    ring: 'border-violet-200 from-violet-50 to-amber-50 hover:border-violet-400',
    badge: 'bg-violet-600',
    text: 'text-violet-900',
    sub: 'text-violet-700/80',
    arrow: 'text-violet-400',
  },
  {
    href: '/practice/pack-reading',
    emoji: '📖',
    title: 'Luyện đọc',
    desc: 'Yếu / đang nhớ / vững · chủ đề · cấp độ · Gen đoạn + hỏi',
    ring: 'border-teal-200 from-teal-50 to-cyan-50 hover:border-teal-400',
    badge: 'bg-teal-600',
    text: 'text-teal-900',
    sub: 'text-teal-700/80',
    arrow: 'text-teal-400',
  },
] as const;

export default function PracticeHubPage() {
  return (
    <StudentShell title="Sử dụng từ">
      <div className="mx-auto max-w-lg space-y-5 px-3 py-6 pb-24 sm:px-4">
        <div className="text-center">
          <p className="text-3xl" aria-hidden>
            ✍️
          </p>
          <h1 className="mt-2 text-xl font-black tracking-tight text-slate-900">
            Sử dụng từ
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Chọn một dạng luyện — không chờ đến hạn ôn thẻ
          </p>
        </div>

        <div className="grid gap-3">
          {MODES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${m.ring}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl text-white shadow ${m.badge}`}
              >
                {m.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-base font-black ${m.text}`}>{m.title}</p>
                <p className={`mt-0.5 text-[12px] font-semibold leading-snug ${m.sub}`}>
                  {m.desc}
                </p>
              </div>
              <ArrowRight className={`h-5 w-5 shrink-0 ${m.arrow}`} />
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-medium leading-relaxed text-slate-500">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
            <span>
              <strong className="text-slate-700">Đặt câu</strong> — bạn tự viết, AI nâng
              tiếng Anh.
            </span>
          </p>
          <p className="mt-2 flex items-start gap-2">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
            <span>
              <strong className="text-slate-700">Luyện đọc</strong> — AI viết đoạn chứa từ
              bạn chọn, rồi hỏi + điền từ.
            </span>
          </p>
        </div>
      </div>
    </StudentShell>
  );
}
