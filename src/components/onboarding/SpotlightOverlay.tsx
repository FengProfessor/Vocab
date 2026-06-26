'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import './onboarding.css';

/**
 * Full-screen overlay tối + spotlight cutout trên target element.
 * Sử dụng SVG mask để tạo lỗ sáng mượt — tương thích mọi browser.
 */
export function SpotlightOverlay() {
  const { isActive, currentStep } = useOnboarding();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  // Track target element position
  useEffect(() => {
    if (!isActive || currentStep.type !== 'spotlight' || !currentStep.targetSelector) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);

        // Scroll into view nếu cần
        if (r.top < 0 || r.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      rafRef.current = requestAnimationFrame(updateRect);
    };

    // Delay nhỏ để element kịp render
    const timer = setTimeout(() => {
      updateRect();
    }, 100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentStep]);

  if (!isActive || currentStep.type !== 'spotlight' || !rect) return null;

  const padding = 8; // padding quanh target
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
        style={{ position: 'fixed', inset: 0, zIndex: 89 }}
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            {/* Nền trắng = hiển thị overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Hình chữ nhật đen = lỗ sáng (transparent) */}
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
        {/* Overlay tối với mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#onboarding-spotlight-mask)"
        />
      </svg>

      {/* Viền phát sáng quanh spotlight */}
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius,
          zIndex: 90,
          pointerEvents: 'none',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="onboarding-pulse-glow"
      />
    </div>,
    document.body,
  );
}
