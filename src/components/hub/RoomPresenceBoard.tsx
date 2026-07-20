'use client';

import { metaForActivity, type RoomPresenceMember } from '@/lib/room-presence';
import { cn } from '@/lib/utils';

interface Props {
  members: RoomPresenceMember[];
  onlineCount: number;
  roomLabel?: string;
  notReady?: boolean;
  className?: string;
  compact?: boolean;
}

export function RoomPresenceBoard({
  members,
  onlineCount,
  roomLabel = 'Phòng học',
  notReady,
  className,
  compact,
}: Props) {
  if (notReady) {
    return (
      <div
        className={cn(
          'rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/70',
          className
        )}
      >
        Chưa bật bảng hiện diện — chạy migration <code className="text-xs">room_presence</code>.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-muted/40">
        <div>
          <h2 className="text-sm font-semibold">{roomLabel}</h2>
          <p className="text-xs text-muted-foreground">
            Nhìn nhau học — chỉ hiện tên & hoạt động
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {onlineCount}
          </span>
          <span className="text-xs text-muted-foreground">đang học</span>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Chưa có ai khác trong phòng.
          <br />
          <span className="text-xs">Mở app học (flashcard, ngữ pháp…) sẽ hiện ở đây.</span>
        </p>
      ) : (
        <ul
          className={cn(
            'divide-y max-h-[420px] overflow-y-auto',
            compact && 'max-h-[280px]'
          )}
        >
          {members.map((m) => {
            const meta = metaForActivity(m.activityKey);
            return (
              <li
                key={m.userId}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  m.isYou && 'bg-primary/5'
                )}
              >
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border bg-muted"
                  title={m.displayName}
                >
                  {initials(m.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {m.displayName}
                    {m.isYou ? (
                      <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                        (bạn)
                      </span>
                    ) : null}
                  </div>
                  <div className={cn('text-xs truncate flex items-center gap-1', meta.color)}>
                    <span>{meta.emoji}</span>
                    <span>{m.activityLabel || meta.label}</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                  ● online
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
