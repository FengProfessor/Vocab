'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import {
  ONBOARDING_CLOSE_MENU_EVENT,
  ONBOARDING_OPEN_MENU_EVENT,
  type OnboardingStep,
} from './onboarding-steps';
import './onboarding.css';

/** Chọn element target: mobile selector → desktop; bỏ qua element ẩn. */
export function resolveOnboardingTarget(step: OnboardingStep): Element | null {
  if (step.type !== 'spotlight') return null;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const candidates: string[] = [];
  if (isMobile && step.mobileTargetSelector) candidates.push(step.mobileTargetSelector);
  if (step.targetSelector) candidates.push(step.targetSelector);
  // Fallback: thử mobile selector cả khi desktop (một số layout hybrid)
  if (!isMobile && step.mobileTargetSelector) candidates.push(step.mobileTargetSelector);

  for (const sel of candidates) {
    const nodes = document.querySelectorAll(sel);
    for (const el of Array.from(nodes)) {
      const r = el.getBoundingClientRect();
      // visible + có kích thước
      if (r.width > 0 && r.height > 0) {
        const style = window.getComputedStyle(el);
        if (style.visibility !== 'hidden' && style.display !== 'none') {
          return el;
        }
      }
    }
  }
  return null;
}

/**
 * Full-screen overlay tối + spotlight cutout trên target element.
 */
export function SpotlightOverlay() {
  const { isActive, currentStep } = useOnboarding();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const menuOpenedRef = useRef(false);

  // Mở/đóng mobile drawer khi step cần
  useEffect(() => {
    if (!isActive || currentStep.type !== 'spotlight') {
      if (menuOpenedRef.current) {
        window.dispatchEvent(new CustomEvent(ONBOARDING_CLOSE_MENU_EVENT));
        menuOpenedRef.current = false;
      }
      return;
    }

    const isMobile = window.innerWidth < 768;
    if (isMobile && currentStep.openMobileMenu) {
      window.dispatchEvent(new CustomEvent(ONBOARDING_OPEN_MENU_EVENT));
      menuOpenedRef.current = true;
    } else if (menuOpenedRef.current) {
      window.dispatchEvent(new CustomEvent(ONBOARDING_CLOSE_MENU_EVENT));
      menuOpenedRef.current = false;
    }

    return () => {
      // không đóng ngay khi unmount mid-step — chỉ khi rời step
    };
  }, [isActive, currentStep]);

  // Track target element position
  useEffect(() => {
    if (!isActive || currentStep.type !== 'spotlight') {
      setRect(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 90; // ~1.5s @ 60fps + delay mở menu

    const updateRect = () => {
      const el = resolveOnboardingTarget(currentStep);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        if (r.top < 8 || r.bottom > window.innerHeight - 8) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        attempts = 0;
      } else {
        attempts += 1;
        if (attempts > maxAttempts) {
          setRect(null);
        }
      }
      rafRef.current = requestAnimationFrame(updateRect);
    };

    // Chờ drawer/layout (grammar mobile)
    const delay = currentStep.openMobileMenu && window.innerWidth < 768 ? 280 : 100;
    const timer = setTimeout(() => {
      updateRect();
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep]);

  if (!isActive || currentStep.type !== 'spotlight' || !rect || (rect.width === 0 && rect.height === 0)) {
    return null;
  }

  const padding = 8;
  const borderRadius = 16;
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;

  return createPortal(
    <div className="onboarding-overlay onboarding-fade-in" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        style={{ position: 'fixed', inset: 0, zIndex: 110 }}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
              style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#onboarding-spotlight-mask)"
        />
      </svg>

      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius,
          zIndex: 111,
          pointerEvents: 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="onboarding-pulse-glow"
      />
    </div>,
    document.body,
  );
}
