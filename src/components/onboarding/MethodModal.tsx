'use client';

import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { ArrowRight } from 'lucide-react';
import './onboarding.css';

const LOOP_DESKTOP = [
  {
    n: '1',
    emoji: '🗺️',
    title: 'Lộ trình hoặc Thư viện',
    body: 'Sidebar: chọn chặng / gói từ → thêm vào kho.',
  },
  {
    n: '2',
    emoji: '✨',
    title: 'Cần học',
    body: 'Card Dashboard: xem + nghe → gõ nhớ lại.',
  },
  {
    n: '3',
    emoji: '🔄',
    title: 'Cần ôn',
    body: 'Ôn FSRS mỗi ngày — bấm đúng mức nhớ.',
  },
  {
    n: '4',
    emoji: '✍️',
    title: 'Ngữ pháp, Luyện tập & Tra từ',
    body: 'Sidebar: Ngữ pháp bài học GFM · Luyện điền từ/sửa lỗi · Tra từ điển.',
  },
] as const;

const LOOP_MOBILE = [
  {
    n: '1',
    emoji: '📱',
    title: 'Footer 5 tab',
    body: 'Home · Ôn · Lộ trình (nút giữa) · Kho · Tra từ.',
  },
  {
    n: '2',
    emoji: '✨',
    title: 'Cần học / Cần ôn',
    body: 'Trên Home: 2 card lớn — chạm để học/ôn.',
  },
  {
    n: '3',
    emoji: '🗺️',
    title: 'Lộ trình & Kho',
    body: 'Tab giữa 🗺️ · tab 📦 lấy gói từ / PDF.',
  },
  {
    n: '4',
    emoji: '☰',
    title: 'Ngữ pháp & Luyện tập trong menu',
    body: '☰ góc trái → Ngữ pháp, Sử dụng từ · gắn app MH chính.',
  },
] as const;

export function MethodModal() {
  const { isActive, currentStep, next } = useOnboarding();

  if (!isActive || currentStep.id !== 'method') return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const LOOP_STEPS = isMobile ? LOOP_MOBILE : LOOP_DESKTOP;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4">
      <div
        className="relative my-auto w-full max-w-md max-h-[min(680px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-emerald-200 bg-white shadow-2xl onboarding-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-5 pb-9 pt-6 text-center">
          <div className="onboarding-mascot-bounce mb-1 inline-block">
            <Mascot mood="thinking" size="md" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Cách học mỗi ngày
          </h2>
          <p className="mt-1 text-xs font-bold text-emerald-50">
            {isMobile ? '📱 4 bước trên điện thoại' : '4 bước — khớp nút trên app'}
          </p>
        </div>

        <div className="relative -mt-4 space-y-2.5 p-4 sm:p-5">
          {LOOP_STEPS.map((s) => (
            <div
              key={s.n}
              className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                {s.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                    {s.n}
                  </span>
                  <span className="text-sm font-black text-slate-800">{s.title}</span>
                </div>
                <p className="mt-0.5 text-[12px] font-medium leading-snug text-slate-500">{s.body}</p>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-black text-amber-800">⚠️ Khi ôn</p>
            <p className="mt-0.5 text-[11px] font-semibold leading-snug text-amber-700">
              Quên (kể cả nhớ ra sau khi xem đáp án) → bấm <b>Quên</b>, không bấm <b>Khó</b>.
            </p>
          </div>

          <button
            type="button"
            onClick={next}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 text-base font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0 cursor-pointer"
          >
            Xem từng nút trên app <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
