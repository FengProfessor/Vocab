'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import {
  ONBOARDING_PRO_DAYS,
  ONBOARDING_PRO_LABEL,
  ONBOARDING_TOTAL_XP,
} from './onboarding-steps';
import {
  PRO_MILESTONE_MIN_STREAK,
  PRO_MILESTONE_MIN_WORDS,
} from '@/lib/pro-trial-milestone';
import { Crown, Flame, BookOpen, Check } from 'lucide-react';
import './onboarding.css';

const Celebration = dynamic(
  () => import('@/components/gamification/Celebration').then((m) => m.Celebration),
  { ssr: false },
);

/**
 * Step cuối: XP tour + tease mốc Pro (không kích hoạt Pro ngay).
 * Pro 7 ngày chỉ claim khi streak ≥ 3 + ≥ 50 từ.
 */
export function RewardModal() {
  const { isActive, currentStep, complete } = useOnboarding();
  const [xpCount, setXpCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!isActive || currentStep.id !== 'reward') return;

    const celebTimer = setTimeout(() => setShowCelebration(true), 300);

    const target = ONBOARDING_TOTAL_XP;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setXpCount(target);
        clearInterval(interval);
      } else {
        setXpCount(Math.round(current));
      }
    }, duration / steps);

    return () => {
      clearTimeout(celebTimer);
      clearInterval(interval);
    };
  }, [isActive, currentStep.id]);

  if (!isActive || currentStep.id !== 'reward') return null;

  const proFeatures = [
    'Lộ trình CEFR A2→B2 (Free: A0–A1)',
    'Ngữ pháp đầy đủ + bài tập',
    'Thư viện gói từ Pro',
    'Tra từ & lưu kho',
    'AI hỗ trợ học (quota cao hơn)',
    'Hỗ trợ ưu tiên',
  ];

  return createPortal(
    <>
      <Celebration
        trigger={showCelebration}
        triggerKey="onboarding-complete"
        intensity="epic"
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4">
        <div className="relative my-auto w-full max-w-md max-h-[min(720px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-amber-200 bg-white shadow-2xl onboarding-zoom-in">
          <div className="relative overflow-hidden rounded-t-[28px] bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 px-5 pb-9 pt-6 text-center">
            <div className="relative z-10">
              <div className="onboarding-mascot-bounce mb-1 inline-block">
                <Mascot mood="cheer" size="lg" />
              </div>
              <h2 className="text-2xl font-black text-white">Tuyệt vời! 🎉</h2>
              <p className="mt-1 text-sm font-bold text-white/90">Đã xong hướng dẫn</p>
            </div>
          </div>

          <div className="relative z-10 -mt-6 flex justify-center">
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-200 bg-white px-6 py-2.5 shadow-xl">
              <span className="text-2xl">🏅</span>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500 onboarding-shimmer">
                  +{xpCount} XP
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Thưởng tour</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 pt-4">
            {/* Tease mốc Pro — không kích hoạt ngay */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
              <p className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-indigo-500">
                Quà Pro {ONBOARDING_PRO_LABEL} · học thật mới mở
              </p>
              <p className="mb-3 text-center text-sm font-semibold text-slate-600">
                Không tặng Pro ngay sau tour. Đạt mốc dưới → nhận free Pro đúng{' '}
                {ONBOARDING_PRO_DAYS} ngày.
              </p>

              <div className="space-y-2.5">
                <MilestoneBar
                  icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
                  label="Streak"
                  current={0}
                  target={PRO_MILESTONE_MIN_STREAK}
                  unit="ngày"
                  barClass="bg-orange-500"
                />
                <MilestoneBar
                  icon={<BookOpen className="h-3.5 w-3.5 text-indigo-600" />}
                  label="Từ trong kho"
                  current={0}
                  target={PRO_MILESTONE_MIN_WORDS}
                  unit="từ"
                  barClass="bg-indigo-600"
                />
              </div>

              <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
                Tiến độ hiện trên trang Học của bạn — đủ mốc bấm nhận quà.
              </p>
            </div>

            <button
              type="button"
              onClick={complete}
              className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 text-base font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:translate-y-0.5 active:border-b-0 sm:h-14 sm:text-lg"
            >
              Bắt đầu học ngay! 🎯
            </button>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-black text-slate-500">
                <Crown className="h-3.5 w-3.5 animate-pulse text-indigo-600" /> Đặc quyền gói Pro:
              </p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-left sm:grid-cols-2">
                {proFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <span className="text-[10px] text-indigo-500">✦</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function MilestoneBar({
  icon,
  label,
  current,
  target,
  unit,
  barClass,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit: string;
  barClass: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const done = current >= target;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-slate-600">
          {icon}
          {label}
          {done && <Check className="h-3 w-3 text-emerald-600" />}
        </span>
        <span className={done ? 'text-emerald-600' : 'text-slate-500'}>
          {current}/{target} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : barClass}`}
          style={{ width: `${Math.max(pct, 4)}%`, opacity: pct === 0 ? 0.35 : 1 }}
        />
      </div>
    </div>
  );
}
