'use client';

import { useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { Mascot } from '@/components/gamification/Mascot';
import type { CelebrationIntensity } from '@/components/gamification/Celebration';
import {
  milestoneCopy,
  type MilestoneKind,
} from '@/lib/encouragement';

const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false },
);

export interface MilestonePopupPayload {
  kind: MilestoneKind;
  /** streak days / Lingo level */
  value?: number;
  badgeLabel?: string;
  unitTitle?: string;
  levelId?: string;
  intensity?: CelebrationIntensity;
}

interface Props {
  open: boolean;
  payload: MilestonePopupPayload | null;
  onClose: () => void;
}

const GRADIENT: Record<MilestoneKind, string> = {
  streak: 'from-orange-400 via-amber-400 to-red-400',
  level: 'from-violet-500 via-indigo-500 to-blue-500',
  badge: 'from-amber-400 via-yellow-400 to-orange-400',
  pro: 'from-indigo-500 via-violet-500 to-fuchsia-500',
  unit: 'from-emerald-400 via-teal-400 to-cyan-500',
  roadmap_level: 'from-sky-500 via-blue-500 to-indigo-600',
};

function defaultIntensity(kind: MilestoneKind): CelebrationIntensity {
  if (kind === 'level' || kind === 'roadmap_level' || kind === 'pro') return 'epic';
  if (kind === 'streak' || kind === 'badge') return 'strong';
  return 'light';
}

/**
 * Popup chúc mừng mốc (streak / level / badge / Pro / lộ trình).
 * Confetti + title + 1 lời động viên (khen nỗ lực, không khen “giỏi bẩm sinh”).
 */
export function MilestonePopup({ open, payload, onClose }: Props) {
  const titleId = useId();
  const copy = useMemo(
    () => (payload ? milestoneCopy(payload) : null),
    [payload],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !payload || !copy) return null;
  if (typeof document === 'undefined') return null;

  const intensity = payload.intensity ?? defaultIntensity(payload.kind);
  const gradient = GRADIENT[payload.kind];

  return createPortal(
    <>
      <Celebration
        trigger
        triggerKey={`${payload.kind}-${payload.value ?? ''}-${payload.badgeLabel ?? ''}-${payload.levelId ?? ''}`}
        intensity={intensity}
      />
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border-b-8 border-white/40 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 rounded-full bg-black/15 p-1.5 text-white transition hover:bg-black/25"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>

          <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} px-5 pb-10 pt-8 text-center`}>
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative z-10">
              <div className="mb-2 inline-block">
                <Mascot mood="cheer" size="lg" />
              </div>
              <p className="text-4xl leading-none drop-shadow-sm" aria-hidden>
                {copy.emoji}
              </p>
              <h2 id={titleId} className="mt-3 text-2xl font-black tracking-tight text-white">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm font-bold text-white/90">{copy.subtitle}</p>
            </div>
          </div>

          <div className="relative z-10 -mt-5 px-5">
            <div className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-3.5 shadow-lg">
              <p className="text-center text-[13px] font-semibold leading-relaxed text-slate-700">
                {copy.message}
              </p>
            </div>
          </div>

          <div className="p-5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98]"
            >
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
