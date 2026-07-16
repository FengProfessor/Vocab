'use client';

import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { resolveOnboardingTarget } from './SpotlightOverlay';
import { resolveHowTo } from './onboarding-steps';
import { Mascot } from '@/components/gamification/Mascot';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './onboarding.css';

const PAD = 12;
const GAP = 16;
const TOOLTIP_W = 340;
/** Chiều cao bottom nav + elevated journey + safe area */
const MOBILE_NAV_RESERVE = 96;

type PosStyle = { left: number; top: number; width: number };

/**
 * Tính tọa độ fixed, clamp trong viewport — mobile: không che footer.
 */
function placeTooltip(
  target: DOMRect | null,
  preferred: 'top' | 'bottom' | 'left' | 'right',
  boxW: number,
  boxH: number,
): PosStyle {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(boxW, vw - PAD * 2);
  const isMobile = vw < 768;
  const bottomSafe = isMobile ? MOBILE_NAV_RESERVE : PAD;

  // Mobile: ưu tiên đặt TRÊN target (footer/nav) hoặc neo phía trên bottom nav
  if (isMobile) {
    if (target) {
      const nearBottom = target.bottom > vh - MOBILE_NAV_RESERVE - 24;
      let top: number;
      if (nearBottom || preferred === 'top') {
        top = target.top - GAP - boxH;
        if (top < PAD) top = PAD;
      } else {
        top = target.bottom + GAP;
        if (top + boxH > vh - bottomSafe) {
          top = Math.max(PAD, target.top - GAP - boxH);
        }
      }
      const left = Math.min(Math.max(PAD, target.left + target.width / 2 - width / 2), vw - width - PAD);
      return { left, top, width };
    }
    return {
      left: (vw - width) / 2,
      top: Math.max(PAD, vh - boxH - bottomSafe),
      width,
    };
  }

  if (!target) {
    return {
      left: (vw - width) / 2,
      top: Math.max(PAD, vh - boxH - PAD),
      width,
    };
  }

  let left = 0;
  let top = 0;

  switch (preferred) {
    case 'right':
      left = target.right + GAP;
      top = target.top + target.height / 2 - boxH / 2;
      break;
    case 'left':
      left = target.left - GAP - width;
      top = target.top + target.height / 2 - boxH / 2;
      break;
    case 'bottom':
      left = target.left + target.width / 2 - width / 2;
      top = target.bottom + GAP;
      break;
    case 'top':
      left = target.left + target.width / 2 - width / 2;
      top = target.top - GAP - boxH;
      break;
  }

  if (preferred === 'right' && left + width > vw - PAD) {
    left = target.left + target.width / 2 - width / 2;
    top = target.bottom + GAP;
  }
  if (preferred === 'left' && left < PAD) {
    left = target.left + target.width / 2 - width / 2;
    top = target.bottom + GAP;
  }
  if (top + boxH > vh - PAD) {
    const above = target.top - GAP - boxH;
    top = above >= PAD ? above : Math.max(PAD, vh - boxH - PAD);
  }
  if (top < PAD) top = PAD;

  left = Math.min(Math.max(PAD, left), vw - width - PAD);

  return { left, top, width };
}

/**
 * Tooltip spotlight — luôn nằm trong viewport, copy ngắn, không tràn.
 */
export function TutorialTooltip() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    spotlightStepNumber,
    totalSpotlightSteps,
    next,
    prev,
    skip,
  } = useOnboarding();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [pos, setPos] = useState<PosStyle>({ left: 0, top: 0, width: TOOLTIP_W });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStepIndex);

  // Tìm target
  useEffect(() => {
    if (!isActive || currentStep.type !== 'spotlight') {
      setTargetRect(null);
      setReady(false);
      return;
    }

    let cancelled = false;
    let tries = 0;
    const maxTries = 45;

    const tick = () => {
      if (cancelled) return;
      const el = resolveOnboardingTarget(currentStep);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        setReady(true);
        return;
      }
      tries += 1;
      if (tries >= maxTries) {
        setTargetRect(null);
        setReady(true); // fallback không target
        return;
      }
      requestAnimationFrame(tick);
    };

    const delay = currentStep.openMobileMenu && window.innerWidth < 768 ? 300 : 80;
    const t = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [isActive, currentStep, currentStepIndex]);

  // Đo box + clamp sau render
  useLayoutEffect(() => {
    if (!ready || !isActive || currentStep.type !== 'spotlight') return;

    const measure = () => {
      const el = tooltipRef.current;
      const boxW = TOOLTIP_W;
      const boxH = el?.offsetHeight || 220;
      setPos(placeTooltip(targetRect, currentStep.position ?? 'right', boxW, boxH));
    };

    measure();
    // remeasure sau 1 frame (font/mascot)
    const id = requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
    };
  }, [ready, targetRect, currentStep, isActive, currentStepIndex, showXp]);

  useEffect(() => {
    if (prevStepRef.current !== currentStepIndex) {
      setShowXp(false);
      setReady(false);
      prevStepRef.current = currentStepIndex;
    }
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStep.xpReward > 0) {
      setShowXp(true);
      setTimeout(() => next(), 500);
    } else {
      next();
    }
  }, [next, currentStep.xpReward]);

  if (!isActive || currentStep.type !== 'spotlight' || !ready) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[112] onboarding-fade-in"
      style={{
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxWidth: `calc(100vw - ${PAD * 2}px)`,
        maxHeight: `calc(100dvh - ${PAD * 2}px)`,
      }}
      key={currentStep.id}
      role="dialog"
      aria-label={currentStep.title}
    >
      <div className="relative flex max-h-[inherit] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
        {showXp && currentStep.xpReward > 0 && (
          <div className="pointer-events-none absolute right-3 top-2 onboarding-xp-float">
            <span className="text-sm font-black text-amber-500">+{currentStep.xpReward} XP</span>
          </div>
        )}

        <div className="mb-2 flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg">
            {currentStep.emoji}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[15px] font-black leading-tight text-slate-900">
              {currentStep.title}
            </h3>
            <p className="mt-1 text-[13px] font-medium leading-snug text-slate-600">
              {currentStep.description}
            </p>
            {(() => {
              const tips = resolveHowTo(currentStep);
              if (!tips.length) return null;
              return (
                <ol className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-0.5">
                  {tips.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[11px] font-semibold leading-snug text-slate-500"
                    >
                      <span className="shrink-0 font-black text-indigo-500">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              );
            })()}
          </div>
          <div className="shrink-0 pt-0.5">
            <Mascot mood="happy" size="sm" />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpotlightSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === spotlightStepNumber
                    ? 'w-5 bg-indigo-500'
                    : i + 1 < spotlightStepNumber
                      ? 'w-1.5 bg-indigo-300'
                      : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
            <span className="ml-1 text-[10px] font-bold text-slate-400">
              {spotlightStepNumber}/{totalSpotlightSteps}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={skip}
              className="px-2 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Bỏ qua
            </button>
            {spotlightStepNumber > 1 && (
              <button
                type="button"
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200"
                aria-label="Lùi"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex h-9 items-center gap-1 rounded-xl bg-indigo-600 px-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              Tiếp <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
