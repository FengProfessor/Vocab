'use client';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export type CelebrationIntensity = 'light' | 'strong' | 'epic';

interface Props {
  /** Set true to fire. Khi triggerKey thay đổi, sẽ fire lại. */
  trigger: boolean;
  /**
   * Khoá để cho phép trigger lại (vd: level mới, badge id mới).
   * Nếu không đổi giữa các render → chỉ fire 1 lần như trước.
   */
  triggerKey?: string | number;
  intensity?: CelebrationIntensity;
}

/**
 * Wrapper trên canvas-confetti. Hỗ trợ 3 mức:
 * - light: 1 burst 80 hạt (session done thường)
 * - strong: 3 burst (đạt daily goal)
 * - epic: 5 burst kéo dài (level up, badge mới, milestone streak)
 */
export function Celebration({ trigger, triggerKey, intensity = 'light' }: Props) {
  const lastKey = useRef<string | number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const key = triggerKey ?? 'once';
    if (lastKey.current === key) return;
    lastKey.current = key;

    if (intensity === 'epic') {
      // 5 burst dạng pháo hoa
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 } });
      const colors = ['#fbbf24', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];
      const fire = (delay: number, x: number, angle: number) => {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle,
            spread: 70,
            origin: { x, y: 0.6 },
            colors,
            startVelocity: 55,
          });
        }, delay);
      };
      fire(200, 0, 60);
      fire(400, 1, 120);
      fire(700, 0.5, 90);
      fire(1000, 0.2, 75);
    } else if (intensity === 'strong') {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 } });
      setTimeout(
        () => confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } }),
        200,
      );
      setTimeout(
        () => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } }),
        400,
      );
    } else {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [trigger, triggerKey, intensity]);

  return null;
}
