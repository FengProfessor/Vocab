'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './onboarding.css';

/**
 * Tooltip hiển thị bên cạnh spotlight target.
 * Tự tính vị trí dựa vào getBoundingClientRect() + step.position.
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
  const [showXp, setShowXp] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStepIndex);

  // Track target element
  useEffect(() => {
    if (!isActive || currentStep.type !== 'spotlight' || !currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [isActive, currentStep, currentStepIndex]);

  // Reset XP animation khi đổi step
  useEffect(() => {
    if (prevStepRef.current !== currentStepIndex) {
      setShowXp(false);
      prevStepRef.current = currentStepIndex;
    }
  }, [currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStep.xpReward > 0) {
      setShowXp(true);
      setTimeout(() => {
        next();
      }, 600);
    } else {
      next();
    }
  }, [next, currentStep.xpReward]);

  if (!isActive || currentStep.type !== 'spotlight' || !targetRect) return null;

  // Tính position cho tooltip
  const pos = currentStep.position ?? 'right';
  const gap = 20;
  let style: React.CSSProperties = {};
  let animClass = '';

  switch (pos) {
    case 'right':
      style = {
        left: targetRect.right + gap,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translateY(-50%)',
      };
      animClass = 'onboarding-slide-right';
      break;
    case 'left':
      style = {
        right: window.innerWidth - targetRect.left + gap,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translateY(-50%)',
      };
      animClass = 'onboarding-slide-left';
      break;
    case 'bottom':
      style = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + gap,
        transform: 'translateX(-50%)',
      };
      animClass = 'onboarding-slide-down';
      break;
    case 'top':
      style = {
        left: targetRect.left + targetRect.width / 2,
        bottom: window.innerHeight - targetRect.top + gap,
        transform: 'translateX(-50%)',
      };
      animClass = 'onboarding-slide-up';
      break;
  }

  // Fallback cho mobile: center bottom nếu tooltip bị tràn
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    style = {
      left: '50%',
      bottom: 24,
      transform: 'translateX(-50%)',
    };
    animClass = 'onboarding-slide-up';
  }

  return createPortal(
    <div
      ref={tooltipRef}
      className={`fixed z-[92] ${animClass}`}
      style={{ ...style, maxWidth: isMobile ? 'calc(100vw - 32px)' : 380 }}
      key={currentStep.id}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 relative">
        {/* XP float animation */}
        {showXp && currentStep.xpReward > 0 && (
          <div className="absolute -top-2 right-4 onboarding-xp-float">
            <span className="text-lg font-black text-amber-500">+{currentStep.xpReward} XP</span>
          </div>
        )}

        {/* Header: emoji + title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl shrink-0">
            {currentStep.emoji}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base leading-tight">
              {currentStep.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Footer: progress + navigation */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSpotlightSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 === spotlightStepNumber
                    ? 'w-6 bg-indigo-500'
                    : i + 1 < spotlightStepNumber
                      ? 'w-2 bg-indigo-300'
                      : 'w-2 bg-slate-200'
                }`}
              />
            ))}
            <span className="text-[10px] font-bold text-slate-400 ml-2">
              {spotlightStepNumber}/{totalSpotlightSteps}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={skip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1"
            >
              Bỏ qua
            </button>
            {spotlightStepNumber > 1 && (
              <button
                onClick={prev}
                className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
            )}
            <button
              onClick={handleNext}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-1 transition-colors shadow-lg shadow-indigo-200"
            >
              Tiếp <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mascot mini ở góc */}
        <div className="absolute -bottom-3 -left-3 onboarding-mascot-bounce">
          <Mascot mood="happy" size="sm" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
