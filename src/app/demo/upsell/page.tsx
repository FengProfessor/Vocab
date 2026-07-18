'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { UpsellModal } from '@/components/upsell/UpsellModal';
import { FREE_WORD_MONTHLY_LIMIT, type UpsellPayload, type UpsellReason } from '@/lib/upsell';

const VARIANTS: { id: string; label: string; payload: UpsellPayload }[] = [
  {
    id: 'word_near',
    label: 'Gần đủ 150/200 từ',
    payload: {
      reason: 'word_near_limit',
      used: 150,
      limit: FREE_WORD_MONTHLY_LIMIT,
      remaining: 50,
      force: true,
    },
  },
  {
    id: 'word_limit',
    label: 'Đủ 200/200 từ',
    payload: {
      reason: 'word_limit',
      used: 200,
      limit: FREE_WORD_MONTHLY_LIMIT,
      remaining: 0,
      force: true,
    },
  },
  {
    id: 'expiring',
    label: 'Pro còn 3 ngày',
    payload: {
      reason: 'plan_expiring',
      daysLeft: 3,
      expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      force: true,
    },
  },
  {
    id: 'expired',
    label: 'Pro đã hết hạn',
    payload: {
      reason: 'plan_expired',
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      force: true,
    },
  },
];

function DemoUpsellContent() {
  const [active, setActive] = useState(VARIANTS[0].id);
  const payload = useMemo(
    () => VARIANTS.find((v) => v.id === active)?.payload ?? VARIANTS[0].payload,
    [active],
  );

  return (
    <div className="min-h-dvh bg-[#faf9f5] text-[#1a1915]">
      <header className="border-b border-[#e8e6dc] bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8778]">Demo</div>
            <h1 className="text-lg font-semibold">Upsell pop-up</h1>
          </div>
          <Link href="/student" className="text-sm font-medium text-[#5e5d59] hover:text-[#1a1915]">
            ← Student
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm text-[#5e5d59]">
          Chọn biến thể — modal mở ngay (không cần login). Cũng thử deep link:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-[#8a8778]">
          {VARIANTS.map((v) => (
            <li key={v.id}>
              <code className="rounded bg-white px-1.5 py-0.5 border border-[#e8e6dc]">
                /student?upsell={v.id}
              </code>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActive(v.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                active === v.id
                  ? 'border-[#1a1915] bg-[#1a1915] text-white'
                  : 'border-[#e8e6dc] bg-white text-[#1a1915] hover:border-[#cfcabe]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-[#d4d1c4] bg-white/60 p-8 text-center text-sm text-[#8a8778]">
          Nền giả lập app — modal phía dưới / giữa màn hình.
          <div className="mt-2 font-mono text-xs">reason: {(payload.reason as UpsellReason)}</div>
        </div>
      </main>

      <UpsellModal open payload={payload} onDismiss={() => setActive(active)} />
    </div>
  );
}

export default function DemoUpsellPage() {
  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center">Loading…</div>}>
      <DemoUpsellContent />
    </Suspense>
  );
}
