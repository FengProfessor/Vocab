'use client';

/**
 * Hub Sử dụng từ — 2 dạng: Đặt câu (codemix) · Luyện đọc (pack-reading)
 * URL: /practice
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';

const MODES = [
  {
    href: '/practice/verb-drill',
    emoji: '⚡',
    title: 'Quiz nhớ nhanh',
    desc: 'MCQ mix nghĩa + cloze · đúng thì lên bậc',
    ring: 'border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-50',
    badge: 'bg-amber-500',
    text: 'text-amber-950',
    sub: 'text-amber-800/80',
    arrow: 'text-amber-400',
  },
  {
    href: '/practice/codemix',
    emoji: '✨',
    title: 'Đặt câu',
    desc: 'Chọn vài từ → viết câu → xem bản tiếng Anh',
    ring: 'border-violet-200 bg-violet-50/70 hover:border-violet-400 hover:bg-violet-50',
    badge: 'bg-violet-600',
    text: 'text-violet-900',
    sub: 'text-violet-700/75',
    arrow: 'text-violet-400',
  },
  {
    href: '/practice/pack-reading',
    emoji: '📖',
    title: 'Luyện đọc',
    desc: 'Đọc đoạn có từ của bạn + trả lời câu hỏi',
    ring: 'border-teal-200 bg-teal-50/70 hover:border-teal-400 hover:bg-teal-50',
    badge: 'bg-teal-600',
    text: 'text-teal-900',
    sub: 'text-teal-700/75',
    arrow: 'text-teal-400',
  },
] as const;

export default function PracticeHubPage() {
  return (
    <StudentShell title="Sử dụng từ">
      <div className="mx-auto max-w-lg space-y-3 px-3 py-4 pb-24 sm:px-4">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-900">Sử dụng từ</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Quiz nhanh · đặt câu · đọc — ôn sâu FSRS ở «Ôn tập»
          </p>
        </div>

        <div className="grid gap-2">
          {MODES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 shadow-sm transition-all hover:shadow active:scale-[0.99] ${m.ring}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-white shadow-sm ${m.badge}`}
              >
                {m.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black ${m.text}`}>{m.title}</p>
                <p className={`mt-0.5 text-[11px] font-medium leading-snug ${m.sub}`}>
                  {m.desc}
                </p>
              </div>
              <ArrowRight className={`h-4 w-4 shrink-0 ${m.arrow}`} />
            </Link>
          ))}
        </div>
      </div>
    </StudentShell>
  );
}
