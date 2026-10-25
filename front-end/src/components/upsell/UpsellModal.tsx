'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, Sparkles, X } from 'lucide-react';
import {
  FREE_WORD_MONTHLY_LIMIT,
  type UpsellPayload,
  type UpsellReason,
} from '@/lib/upsell';
import { formatExpiry, formatVND, PLAN_PRICES } from '@/lib/billing';

interface UpsellModalProps {
  open: boolean;
  payload: UpsellPayload | null;
  onDismiss: () => void;
}

function copyFor(payload: UpsellPayload): {
  icon: typeof Sparkles;
  badge: string;
  title: string;
  body: string;
  rows: { label: string; free: string; pro: string }[];
  cta: string;
  secondary: string;
  from: string;
} {
  const limit = payload.limit ?? FREE_WORD_MONTHLY_LIMIT;
  const used = payload.used ?? 0;
  const remaining = payload.remaining ?? Math.max(0, limit - used);

  switch (payload.reason) {
    case 'plan_expiring': {
      const d = payload.daysLeft ?? 0;
      return {
        icon: Clock3,
        badge: d <= 1 ? 'Hết hạn sớm' : 'Sắp hết hạn',
        title: d <= 1 ? 'Pro hết hạn trong hôm nay' : `Pro còn ${d} ngày`,
        body: payload.expiresAt
          ? `Hết hạn ${formatExpiry(payload.expiresAt)}. Sau đó AI về 5 lượt/ngày và lưu tối đa ${limit} từ mới/tháng.`
          : `Gia hạn để giữ AI không giới hạn và lưu từ thoải mái.`,
        rows: [
          { label: 'AI tra từ + phân tích câu', free: '5/ngày', pro: 'Không giới hạn' },
          { label: 'Lưu từ mới / tháng', free: `${limit}`, pro: 'Không giới hạn' },
        ],
        cta: 'Gia hạn Pro',
        secondary: 'Để sau',
        from: 'expiring',
      };
    }
    case 'plan_expired':
      return {
        icon: Clock3,
        badge: 'Đã hết hạn',
        title: 'Gói Pro đã hết hạn',
        body: 'Tài khoản về gói Thường. Từ đã học vẫn ôn bình thường — chỉ mất quyền unlimited.',
        rows: [
          { label: 'AI tra từ + phân tích câu', free: '5/ngày', pro: 'Không giới hạn' },
          { label: 'Lưu từ mới / tháng', free: `${limit}`, pro: 'Không giới hạn' },
          { label: 'Ngữ pháp & thống kê đầy đủ', free: '−', pro: '✓' },
        ],
        cta: 'Nâng cấp lại Pro',
        secondary: 'Tiếp tục Free',
        from: 'expired',
      };
    case 'word_limit':
      return {
        icon: BookOpen,
        badge: 'Giới hạn tháng',
        title: `Đã đủ ${limit} từ mới tháng này`,
        body: 'Tháng sau reset. Từ đã lưu vẫn ôn FSRS bình thường. Pro = lưu không giới hạn.',
        rows: [
          { label: 'Lưu từ mới / tháng', free: `${used}/${limit}`, pro: 'Không giới hạn' },
          { label: 'AI tra từ + phân tích câu', free: '5/ngày', pro: 'Không giới hạn' },
        ],
        cta: 'Nâng Pro — lưu không giới hạn',
        secondary: 'Ôn từ đã có',
        from: 'word_limit',
      };
    case 'word_near_limit':
      return {
        icon: BookOpen,
        badge: 'Gần đủ hạn mức',
        title: `Đã lưu ${used}/${limit} từ tháng này`,
        body: remaining > 0
          ? `Còn khoảng ${remaining} từ mới trong tháng. Nâng Pro để không bị gián đoạn.`
          : `Sắp chạm trần ${limit} từ. Pro lưu không giới hạn.`,
        rows: [
          { label: 'Lưu từ mới / tháng', free: `${used}/${limit}`, pro: 'Không giới hạn' },
          { label: 'AI tra từ + phân tích câu', free: '5/ngày', pro: 'Không giới hạn' },
        ],
        cta: 'Nâng Pro ngay',
        secondary: 'Để sau',
        from: 'word_near',
      };
    default:
      return {
        icon: Sparkles,
        badge: 'Pro',
        title: 'Nâng cấp LingoPro Pro',
        body: 'Mở AI và lưu từ không giới hạn.',
        rows: [],
        cta: 'Xem gói Pro',
        secondary: 'Đóng',
        from: 'upsell',
      };
  }
}

export function UpsellModal({ open, payload, onDismiss }: UpsellModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss]);

  if (!open || !payload) return null;

  const c = copyFor(payload);
  const Icon = c.icon;
  const limit = payload.limit ?? FREE_WORD_MONTHLY_LIMIT;
  const used = payload.used ?? 0;
  const showBar =
    payload.reason === 'word_limit' || payload.reason === 'word_near_limit';
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const href = `/upgrade?from=${encodeURIComponent(c.from)}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1a1915]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Đóng"
        onClick={onDismiss}
      />

      <div className="relative z-10 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-t-3xl border border-[#e8e6dc] bg-[#faf9f5] shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#eeebe3] px-5 pb-3 pt-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a1915] text-white">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8778]">
                {c.badge}
              </div>
              <h2 id="upsell-title" className="mt-0.5 text-lg font-semibold tracking-tight text-[#1a1915]">
                {c.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#8a8778] hover:bg-white hover:text-[#1a1915]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm leading-6 text-[#5e5d59]">{c.body}</p>

          {showBar && (
            <div>
              <div className="mb-1.5 flex justify-between text-[11px] font-medium text-[#8a8778]">
                <span>
                  {used} / {limit} từ mới
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e8e6dc]">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100 ? 'bg-[#b5502f]' : pct >= 75 ? 'bg-[#d39b29]' : 'bg-[#1a7f4b]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {c.rows.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-[#e8e6dc] bg-white">
              <div className="grid grid-cols-[1fr_4.5rem_5.5rem] gap-1 border-b border-[#eeebe3] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8778]">
                <span>Tính năng</span>
                <span className="text-center">Thường</span>
                <span className="text-center text-[#1a1915]">Pro</span>
              </div>
              {c.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_4.5rem_5.5rem] items-center gap-1 border-b border-[#f0eee6] px-3 py-2.5 last:border-0"
                >
                  <span className="text-[13px] text-[#3d3c38]">{row.label}</span>
                  <span className="text-center text-[11px] font-semibold text-[#8a8778]">{row.free}</span>
                  <span className="text-center text-[11px] font-semibold text-[#1a7f4b]">{row.pro}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-[11px] text-[#8a8778]">
            Pro từ {formatVND(PLAN_PRICES.pro)}/tháng · có gói năm giảm sâu
          </p>
        </div>

        <div className="space-y-2 border-t border-[#eeebe3] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            href={href}
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1915] px-4 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#2c2b26]"
          >
            {c.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-full py-2.5 text-sm font-medium text-[#5e5d59] transition hover:text-[#1a1915]"
          >
            {c.secondary}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { UpsellReason };
