'use client';

import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import './onboarding.css';

/**
 * Step 0: Modal chào mừng full-screen.
 * Hiện khi onboarding active và step đầu tiên (id === 'welcome').
 */
export function WelcomeModal() {
  const { isActive, currentStep, next, skip, userName } = useOnboarding();

  if (!isActive || currentStep.id !== 'welcome') return null;

  const displayName = userName?.split(' ')[0] || 'bạn';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm onboarding-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) skip();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border-b-8 border-indigo-200 onboarding-zoom-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-8 pb-12 text-center relative">
          {/* Decorative circles */}
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute bottom-2 right-8 w-12 h-12 rounded-full bg-white/10" />
          <div className="absolute top-12 right-4 w-8 h-8 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="onboarding-mascot-bounce inline-block mb-3">
              <Mascot mood="cheer" size="lg" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Chào {displayName}! 👋
            </h2>
            <p className="text-indigo-100 font-bold mt-1 text-sm">
              Chào mừng đến với LingoPro
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-7 -mt-6 relative">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
            <p className="text-slate-700 font-semibold text-sm leading-relaxed text-center">
              Để mình hướng dẫn bạn khám phá <span className="font-black text-indigo-600">LingoPro</span> trong{' '}
              <span className="font-black text-amber-500">60 giây</span> nhé! 🚀
            </p>

            {/* Feature preview icons */}
            <div className="flex justify-center gap-3 mt-4">
              {['📚', '✨', '📖', '⚡', '🎓'].map((emoji, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={next}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-lg shadow-indigo-200 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
          >
            Bắt đầu! 🚀
          </button>

          <button
            onClick={skip}
            className="w-full mt-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-2"
          >
            Bỏ qua, tôi tự khám phá →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
