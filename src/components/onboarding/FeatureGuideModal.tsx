'use client';

import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { isTourMobile, resolveHowTo } from './onboarding-steps';
import { ArrowRight, ExternalLink } from 'lucide-react';
import './onboarding.css';

/**
 * Modal hướng dẫn chi tiết (type=guide) — howTo (desktop/mobile) + «Thử ngay».
 */
export function FeatureGuideModal() {
  const { isActive, currentStep, next, skip, prev, currentStepIndex } = useOnboarding();
  const router = useRouter();

  if (!isActive || currentStep.type !== 'guide') return null;

  const howTo = resolveHowTo(currentStep);
  const cta = currentStep.ctaLabel ?? 'Thử ngay';
  const onPhone = isTourMobile();

  const goTry = () => {
    if (currentStep.route) {
      router.push(currentStep.route);
    }
    // Sang bước spotlight trên trang đó (nếu có) — next() ngay
    next();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) skip();
      }}
    >
      <div
        className="relative my-auto w-full max-w-md max-h-[min(720px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-indigo-200 bg-white shadow-2xl onboarding-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-5 pb-8 pt-6 text-center">
          <div className="onboarding-mascot-bounce mb-1 inline-block">
            <Mascot mood="thinking" size="md" />
          </div>
          <div className="text-3xl leading-none">{currentStep.emoji}</div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            {currentStep.title}
          </h2>
          <p className="mt-1 text-xs font-bold text-indigo-100 sm:text-sm">
            {currentStep.description}
          </p>
          {onPhone && (
            <p className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
              📱 Hướng dẫn trên điện thoại
            </p>
          )}
        </div>

        <div className="relative -mt-4 space-y-3 p-4 sm:p-5">
          <ol className="space-y-2">
            {howTo.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-700">
                  {line}
                </p>
              </li>
            ))}
          </ol>

          <div className="space-y-2 pt-1">
            {currentStep.route && (
              <button
                type="button"
                onClick={goTry}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 text-base font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:translate-y-0.5 active:border-b-0"
              >
                {cta} <ExternalLink className="h-4 w-4" />
              </button>
            )}
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  ← Lùi
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
              >
                Đã hiểu, tiếp <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={skip}
              className="w-full py-1.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Bỏ qua cả tour →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
