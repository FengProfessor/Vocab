'use client';

import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import './onboarding.css';

/** Desktop sidebar / cards */
const PREVIEW_DESKTOP = [
  { emoji: '🗺️', label: 'Lộ trình' },
  { emoji: '📦', label: 'Thư viện' },
  { emoji: '✨', label: 'Cần học' },
  { emoji: '🔄', label: 'Cần ôn' },
  { emoji: '🎓', label: 'Ngữ pháp' },
  { emoji: '🔍', label: 'Tra từ' },
] as const;

/** Footer mobile thật */
const PREVIEW_MOBILE = [
  { emoji: '🏠', label: 'Home' },
  { emoji: '📚', label: 'Ôn' },
  { emoji: '🗺️', label: 'Lộ trình' },
  { emoji: '📦', label: 'Kho' },
  { emoji: '🔍', label: 'Tra từ' },
  { emoji: '☰', label: 'Menu' },
] as const;

export function WelcomeModal() {
  const { isActive, currentStep, next, skip, userName } = useOnboarding();

  if (!isActive || currentStep.id !== 'welcome') return null;

  const displayName = userName?.split(' ')[0] || 'bạn';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const PREVIEW = isMobile ? PREVIEW_MOBILE : PREVIEW_DESKTOP;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) skip();
      }}
    >
      <div
        className="relative my-auto w-full max-w-md max-h-[min(640px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-indigo-200 bg-white shadow-2xl onboarding-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-6 pb-10 pt-7 text-center">
          <div className="relative z-10">
            <div className="onboarding-mascot-bounce mb-2 inline-block">
              <Mascot mood="cheer" size="lg" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Chào {displayName}! 👋
            </h2>
            <p className="mt-1 text-sm font-bold text-indigo-100">Chào mừng đến LingoPro</p>
          </div>
        </div>

        <div className="relative -mt-5 space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-center text-sm font-semibold leading-relaxed text-slate-700">
              {isMobile ? (
                <>
                  Tour trên <span className="font-black text-indigo-600">điện thoại</span>: footer 5 tab,
                  card học/ôn, menu ☰, gắn app MH chính.
                </>
              ) : (
                <>
                  Mình chỉ ra <span className="font-black text-indigo-600">đúng các nút trên màn hình</span> và cách học mỗi ngày.
                </>
              )}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {PREVIEW.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-0.5 rounded-xl bg-slate-50 px-1 py-2"
                >
                  <span className="text-base leading-none">{item.emoji}</span>
                  <span className="text-center text-[9px] font-extrabold text-slate-500">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={next}
            className="flex h-12 w-full items-center justify-center rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 text-base font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0 sm:h-14 sm:text-lg"
          >
            Bắt đầu! 🚀
          </button>
          <button
            type="button"
            onClick={skip}
            className="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            Bỏ qua, tự khám phá →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
