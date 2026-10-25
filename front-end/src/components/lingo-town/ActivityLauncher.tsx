'use client';

/**
 * Mở app LingoPro **trong game** (callback onOpen → iframe overlay).
 * Không còn navigate full-page.
 */
import {
  LINGO_ACTIVITIES,
  activitiesForZone,
  type LingoActivity,
} from '@/lib/lingo-town-activities';

export function ActivityLauncher({
  zone,
  returnPath,
  title = 'Học bằng app LingoPro',
  compact,
  onOpenInGame,
}: {
  zone?: string;
  returnPath: string;
  title?: string;
  compact?: boolean;
  /** Bắt buộc: parent mở InGameActivityFrame */
  onOpenInGame: (activity: LingoActivity) => void;
}) {
  const raw: LingoActivity[] = zone ? activitiesForZone(zone) : LINGO_ACTIVITIES;
  // Không nhúng lại chính hub (tránh iframe lồng)
  const list = raw.filter(
    (a) =>
      !a.path.includes('/demo/lingo-library') &&
      !a.path.includes('/demo/lingo-town')
  );

  if (list.length === 0) {
    return <p className="text-xs text-amber-100/40">Chưa map activity cho zone này.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-amber-200/70 uppercase tracking-wide">
        {title}
      </div>
      <p className="text-[11px] text-amber-100/40 leading-relaxed">
        Mở <strong>panel ôn gọn</strong> (1 góc màn hình) — map vẫn thấy. Không nhảy full web.
      </p>
      <ul className={compact ? 'space-y-1.5' : 'grid sm:grid-cols-2 gap-2'}>
        {list.map((act) => (
          <li key={act.id}>
            <button
              type="button"
              onClick={() => onOpenInGame(act)}
              className="w-full flex items-start gap-2 rounded-xl border border-amber-800/50 bg-black/25 hover:border-amber-500/50 hover:bg-amber-500/10 px-3 py-2 transition-colors text-left"
            >
              <span className="text-lg leading-none mt-0.5">{act.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-amber-50">
                  {act.titleVi}
                  {act.needsAuth ? (
                    <span className="ml-1 text-[9px] font-normal text-amber-100/35">login</span>
                  ) : null}
                </span>
                <span className="block text-[10px] text-amber-100/40 mt-0.5">
                  {act.blurb} · {act.minutes} · +{act.xpReward} XP
                </span>
              </span>
              <span className="text-amber-400/80 text-xs shrink-0">▶</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-amber-100/25">return: {returnPath}</p>
    </div>
  );
}
