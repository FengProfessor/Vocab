'use client';

/**
 * Panel ôn tập gọn trong game — 1 cửa sổ, map vẫn thấy phía sau.
 * Không iframe full website.
 */
import { useCallback, useEffect, useState } from 'react';
import type { LingoActivity } from '@/lib/lingo-town-activities';
import { getActivity } from '@/lib/lingo-town-activities';
import { loadProgress, saveProgress } from '@/lib/lingo-town';
import { MiniStudySession } from '@/components/lingo-town/MiniStudySession';

export interface OpenActivityPayload {
  activity: LingoActivity;
  returnPath: string;
  startedAt: number;
}

interface Props {
  open: OpenActivityPayload | null;
  onClose: (result: { awardedXp: number; actTitle?: string }) => void;
}

export function InGameActivityFrame({ open, onClose }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    setCorrect(0);
    const t0 = open.startedAt;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  const handleClose = useCallback(() => {
    if (!open) {
      onClose({ awardedXp: 0 });
      return;
    }
    const secs = (Date.now() - open.startedAt) / 1000;
    // XP theo thời gian + số câu đúng (cap theo activity)
    let awardedXp = 0;
    if (secs >= 15 || correct >= 3) {
      const base = open.activity.xpReward;
      const bonus = Math.min(20, correct * 3);
      awardedXp = Math.min(base + bonus, base + 20);
      const p = loadProgress();
      saveProgress({
        ...p,
        xp: p.xp + awardedXp,
        coins: p.coins + Math.floor(awardedXp / 8),
        totalReviews: p.totalReviews + correct,
      });
    }
    onClose({ awardedXp, actTitle: open.activity.titleVi });
  }, [open, onClose, correct]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  const act = open.activity;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 md:p-6 pointer-events-none">
      {/* dim nhẹ — map/game vẫn nhìn thấy */}
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/35 pointer-events-auto cursor-default"
        onClick={handleClose}
      />

      {/* Cửa sổ ôn — partial screen */}
      <div
        className="relative pointer-events-auto w-full sm:w-[min(420px,92vw)] max-h-[min(88vh,720px)] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden border-2 border-amber-800/80 shadow-2xl"
        style={{
          background: 'linear-gradient(165deg, #4a3220 0%, #24180f 45%, #14100c 100%)',
          boxShadow: '0 25px 60px #000c, 0 0 0 1px #c4a57433, inset 0 1px 0 #e8c98a33',
        }}
      >
        {/* title bar kiểu game */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-900/70 bg-black/25 shrink-0">
          <span className="text-xl leading-none">{act.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-amber-50 truncate">{act.titleVi}</div>
            <div className="text-[10px] text-amber-100/40 font-mono">
              Panel ôn · {Math.floor(elapsed / 60)}:
              {String(elapsed % 60).padStart(2, '0')} · đúng {correct}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-400 text-amber-950 hover:bg-amber-300 shrink-0"
          >
            Xong
          </button>
        </div>

        {/* body scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <MiniStudySession kind={act.kind} onProgress={setCorrect} />
        </div>

        {/* footer tip */}
        <div className="px-3 py-2 border-t border-amber-900/50 bg-black/20 text-[10px] text-amber-100/35 shrink-0">
          Chỉ khung ôn tập — không mở full web. Esc / chạm nền / Xong để về map.
        </div>
      </div>
    </div>
  );
}

export function resolveOpenPayload(
  actId: string,
  returnPath: string
): OpenActivityPayload | null {
  const activity = getActivity(actId);
  if (!activity) return null;
  return { activity, returnPath, startedAt: Date.now() };
}
