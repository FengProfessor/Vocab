'use client';
import { Lock } from 'lucide-react';
import type { EarnedBadge } from '@/lib/gamification';

interface Props {
  badges: EarnedBadge[];
  className?: string;
}

export function BadgeGrid({ badges, className = '' }: Props) {
  const earned = badges.filter((b) => b.earned);

  if (badges.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Thành tích
        </h3>
        <span className="text-xs font-black tabular-nums text-muted-foreground">
          {earned.length}<span className="opacity-60">/{badges.length}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const tooltip = b.earned
            ? `${b.description} — Đã đạt được!`
            : `🔒 ${b.description}`;
          return (
            <div
              key={b.id}
              title={tooltip}
              aria-label={tooltip}
              className={`group relative flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 transition-all duration-300 ${
                b.earned
                  ? 'border-primary/20 bg-primary/10 text-primary shadow-sm hover:scale-105 hover:shadow-md'
                  : 'border-border bg-muted/50 text-muted-foreground opacity-50 grayscale hover:opacity-80'
              }`}
            >
              <span
                className={`text-base leading-none transition-transform duration-300 ${
                  b.earned ? 'group-hover:scale-125' : ''
                }`}
              >
                {b.emoji}
              </span>
              <span className="text-[11px] font-black">{b.label}</span>
              {!b.earned && (
                <Lock
                  className="h-3 w-3 text-muted-foreground/70"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
