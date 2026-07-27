'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Crown, Flame, BookOpen, Loader2, Check, Gift, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ProMilestoneSnapshot } from '@/lib/pro-trial-milestone';
import {
  isUnderProMilestone,
  PRO_MILESTONE_DAYS,
  PRO_MILESTONE_FUNNEL_LS_KEY,
  PRO_MILESTONE_LABEL,
  shouldShowProMilestoneCard,
} from '@/lib/pro-trial-milestone';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';

const MilestonePopup = dynamic(
  () => import('@/components/gamification/MilestonePopup').then((m) => m.MilestonePopup),
  { ssr: false },
);

interface Props {
  enabled?: boolean;
  className?: string;
  onClaimed?: () => void;
  /** Parent biết streak/từ — dùng skip fetch nick đã vượt mốc */
  hintStreak?: number;
  hintWords?: number;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function readFunnelActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PRO_MILESTONE_FUNNEL_LS_KEY) === '1';
  } catch {
    return false;
  }
}

function markFunnelActive(): void {
  try {
    localStorage.setItem(PRO_MILESTONE_FUNNEL_LS_KEY, '1');
  } catch {
    /* ignore */
  }
}

function clearFunnelActive(): void {
  try {
    localStorage.removeItem(PRO_MILESTONE_FUNNEL_LS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Dashboard nhiệm vụ Pro.
 * Anti-flash: không render gì cho đến API ready + đủ điều kiện hiện.
 */
export function ProTrialMilestoneCard({
  enabled = true,
  className = '',
  onClaimed,
  hintStreak,
  hintWords,
}: Props) {
  const [state, setState] = useState<LoadState>('idle');
  const [snap, setSnap] = useState<ProMilestoneSnapshot | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [funnelActive, setFunnelActive] = useState(false);
  const [claimPopup, setClaimPopup] = useState<MilestonePopupPayload | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;

    // Nick dashboard đã chắc vượt mốc + không funnel → ẩn im lặng
    const funnel = readFunnelActive();
    if (
      typeof hintWords === 'number' &&
      typeof hintStreak === 'number' &&
      !isUnderProMilestone(hintWords, hintStreak) &&
      !funnel
    ) {
      setSnap(null);
      setFunnelActive(false);
      setState('ready');
      return;
    }

    setState('loading');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setSnap(null);
        setState('error');
        return;
      }

      const res = await fetch('/api/billing/pro-milestone', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const data = (await res.json()) as {
        success?: boolean;
        milestone?: ProMilestoneSnapshot;
        error?: string;
      };
      if (!res.ok || !data.milestone) throw new Error(data.error || 'Load failed');

      const m = data.milestone;
      setSnap(m);

      if (m.alreadyClaimed || m.effectivePlan !== 'free') {
        clearFunnelActive();
        setFunnelActive(false);
      } else if (isUnderProMilestone(m.words, m.streak)) {
        markFunnelActive();
        setFunnelActive(true);
      } else if (funnel) {
        // Đã vào funnel trước đó: giữ đến khi claim (kể cả giữa chừng / eligible)
        setFunnelActive(true);
      } else {
        // Nick cũ không funnel → dọn cờ rác nếu còn
        clearFunnelActive();
        setFunnelActive(false);
      }

      setState('ready');
    } catch (err) {
      console.warn('[ProMilestone] load failed:', err);
      setSnap(null);
      setState('error');
    }
  }, [enabled, hintWords, hintStreak]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sync LS với server enroll
  useEffect(() => {
    if (snap?.enrolled) {
      markFunnelActive();
      setFunnelActive(true);
    }
  }, [snap?.enrolled]);

  useEffect(() => {
    if (!enabled) return;
    const onRefresh = () => {
      void load();
    };
    window.addEventListener('focus', onRefresh);
    window.addEventListener('lingopro-plan-changed', onRefresh);
    return () => {
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('lingopro-plan-changed', onRefresh);
    };
  }, [enabled, load]);

  const handleClaim = async () => {
    if (!snap?.eligible || claiming) return;
    setClaiming(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Cần đăng nhập');

      const res = await fetch('/api/billing/pro-milestone', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        milestone?: ProMilestoneSnapshot;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Không nhận được quà');

      if (data.milestone) setSnap(data.milestone);
      clearFunnelActive();
      setFunnelActive(false);
      setClaimPopup({ kind: 'pro', intensity: 'epic' });
      onClaimed?.();
      window.dispatchEvent(new Event('lingopro-plan-changed'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
      void load();
    } finally {
      setClaiming(false);
    }
  };

  // Popup claim luôn mount được (card ẩn sau claim vẫn show chúc mừng)
  const claimPopupEl = (
    <MilestonePopup
      open={!!claimPopup}
      payload={claimPopup}
      onClose={() => setClaimPopup(null)}
    />
  );

  // ── Anti-flash: tuyệt đối không paint card trước ready + snap ──
  if (!enabled) return claimPopupEl;
  if (state !== 'ready' || !snap) return claimPopupEl;

  const {
    streak,
    words,
    minStreak,
    minWords,
    streakMet,
    wordsMet,
    eligible,
    alreadyClaimed,
    effectivePlan,
    enrolled,
  } = snap;

  const show = shouldShowProMilestoneCard({
    words,
    streak,
    alreadyClaimed,
    effectivePlan,
    funnelActive: funnelActive || enrolled,
    enrolled,
  });
  if (!show) return claimPopupEl;

  const streakPct = Math.min(100, Math.round((streak / minStreak) * 100));
  const wordsPct = Math.min(100, Math.round((words / minWords) * 100));

  return (
    <>
      {claimPopupEl}
      <section
        className={`overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-violet-50 shadow-md ${className}`}
        data-onboarding="pro-milestone"
        aria-label="Nhiệm vụ nhận Pro miễn phí"
      >
        <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-400/90 to-orange-400/90 px-3.5 py-3 sm:px-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            🎁
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-white drop-shadow-sm sm:text-base">
              Nhiệm vụ · Nhận Pro {PRO_MILESTONE_LABEL}
            </h3>
            <p className="text-[11px] font-bold text-white/90">
              Free Pro {PRO_MILESTONE_DAYS} ngày khi xong 2 nhiệm vụ dưới
            </p>
          </div>
          <Crown className="h-6 w-6 shrink-0 text-white/90" aria-hidden />
        </div>

        <div className="space-y-3 p-3.5 sm:p-4">
          <ul className="space-y-2">
            <TaskRow
              done={streakMet}
              icon={<Flame className={`h-4 w-4 ${streakMet ? 'text-orange-500' : 'text-slate-400'}`} />}
              title={`Streak ${minStreak} ngày liên tiếp`}
              progressLabel={`${streak}/${minStreak} ngày`}
              pct={streakPct}
              barClass="bg-orange-500"
              hint={!streakMet ? 'Học mỗi ngày để giữ lửa' : 'Đã xong!'}
              cta={!streakMet ? { href: '/flashcard', label: 'Ôn ngay' } : undefined}
            />
            <TaskRow
              done={wordsMet}
              icon={<BookOpen className={`h-4 w-4 ${wordsMet ? 'text-indigo-600' : 'text-slate-400'}`} />}
              title={`Có ít nhất ${minWords} từ trong kho`}
              progressLabel={`${words}/${minWords} từ`}
              pct={wordsPct}
              barClass="bg-indigo-600"
              hint={!wordsMet ? 'Thêm gói từ thư viện hoặc import list' : 'Đã xong!'}
              cta={!wordsMet ? { href: '/library', label: 'Thư viện' } : undefined}
            />
          </ul>

          <button
            type="button"
            onClick={() => void handleClaim()}
            disabled={!eligible || claiming}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black shadow-md transition-all sm:text-base ${
              eligible && !claiming
                ? 'cursor-pointer border-b-4 border-emerald-800 bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 active:translate-y-0.5 active:border-b-0'
                : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            {claiming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Đang nhận quà...
              </>
            ) : eligible ? (
              <>
                <Gift className="h-5 w-5" /> Nhận quà Pro {PRO_MILESTONE_LABEL}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                {!streakMet && !wordsMet
                  ? `Còn thiếu streak + từ`
                  : !streakMet
                    ? `Còn ${minStreak - streak} ngày streak`
                    : `Còn ${minWords - words} từ`}
              </>
            )}
          </button>

          {eligible && (
            <p className="text-center text-[11px] font-extrabold text-emerald-700">
              ✓ Đủ mốc — bấm nhận quà để mở Pro {PRO_MILESTONE_DAYS} ngày
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function TaskRow({
  done,
  icon,
  title,
  progressLabel,
  pct,
  barClass,
  hint,
  cta,
}: {
  done: boolean;
  icon: ReactNode;
  title: string;
  progressLabel: string;
  pct: number;
  barClass: string;
  hint: string;
  cta?: { href: string; label: string };
}) {
  return (
    <li
      className={`rounded-xl border px-3 py-2.5 ${
        done ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <span className={`text-xs font-black sm:text-sm ${done ? 'text-emerald-800' : 'text-slate-800'}`}>
              {title}
            </span>
            <span className={`text-[11px] font-bold tabular-nums ${done ? 'text-emerald-600' : 'text-slate-500'}`}>
              {progressLabel}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : barClass}`}
              style={{ width: `${Math.max(pct, done ? 100 : 0)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-slate-400">{hint}</p>
            {cta && (
              <Link
                href={cta.href}
                className="shrink-0 text-[10px] font-extrabold text-indigo-600 hover:underline"
              >
                {cta.label} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
