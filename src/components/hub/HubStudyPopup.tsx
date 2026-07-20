'use client';

/**
 * Popup “cắt” page ôn thật — iframe route + embed=1 (StudentShell ẩn chrome).
 * Giữ full logic flashcard/review/grammar/…, chỉ không hiện sidebar/header app.
 */
import { useEffect, useMemo, useState } from 'react';
import type { PresenceActivityKey } from '@/lib/room-presence';
import { ACTIVITY_META } from '@/lib/room-presence';

export type HubStudyKind =
  | 'flashcard'
  | 'review'
  | 'writing'
  | 'codemix'
  | 'quiz'
  | 'grammar'
  | 'dictionary';

const KIND_META: Record<
  HubStudyKind,
  {
    path: string;
    title: string;
    emoji: string;
    presence: PresenceActivityKey;
  }
> = {
  flashcard: {
    path: '/flashcard',
    title: 'Flashcard',
    emoji: '🃏',
    presence: 'flashcard',
  },
  review: {
    path: '/review',
    title: 'Ôn tập',
    emoji: '🔥',
    presence: 'review',
  },
  writing: {
    path: '/writing',
    title: 'Gõ từ',
    emoji: '✍️',
    presence: 'writing',
  },
  codemix: {
    path: '/practice/codemix',
    title: 'Chèn từ',
    emoji: '✨',
    presence: 'codemix',
  },
  quiz: {
    path: '/quiz',
    title: 'Quiz',
    emoji: '✅',
    presence: 'quiz',
  },
  grammar: {
    path: '/grammar/learn',
    title: 'Ngữ pháp',
    emoji: '📐',
    presence: 'grammar',
  },
  dictionary: {
    path: '/dictionary',
    title: 'Từ điển',
    emoji: '📖',
    presence: 'dictionary',
  },
};

interface Props {
  kind: HubStudyKind | null;
  onClose: () => void;
}

function buildEmbedUrl(path: string): string {
  const u = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  u.searchParams.set('embed', '1');
  u.searchParams.set('from', 'hub');
  return u.pathname + u.search;
}

export function HubStudyPopup({ kind, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const meta = kind ? KIND_META[kind] : null;
  const src = useMemo(() => (meta ? buildEmbedUrl(meta.path) : ''), [meta]);

  useEffect(() => {
    if (!kind) return;
    setLoading(true);
    setLoadError(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, onClose, src]);

  if (!kind || !meta) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#0c0806]/92 backdrop-blur-[2px]">
      {/* Thanh “cắt page” — giống window app */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-amber-900/70 shrink-0"
        style={{
          background: 'linear-gradient(180deg, #3d2918, #1a120c)',
          boxShadow: '0 4px 20px #0008',
        }}
      >
        <span className="text-lg">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-amber-50 truncate">
            {meta.title}
            <span className="ml-2 text-[10px] font-normal text-amber-200/40">
              page thật · embed
            </span>
          </div>
          <div className="text-[10px] text-amber-100/35 font-mono truncate">
            {meta.path}?embed=1 · Esc đóng
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const iframe = document.getElementById(
              'hub-study-iframe',
            ) as HTMLIFrameElement | null;
            if (iframe) {
              setLoading(true);
              iframe.src = src;
            }
          }}
          className="text-[11px] px-2 py-1 rounded border border-amber-800 text-amber-200/70 hover:bg-amber-900/40"
        >
          Tải lại
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-400 text-amber-950 hover:bg-amber-300"
        >
          ← Về thư viện
        </button>
      </div>

      {/* Khung page — gần full màn */}
      <div className="relative flex-1 min-h-0 bg-white">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#1a120c] text-amber-200/70 text-sm font-mono">
            <div className="h-8 w-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
            Đang mở {meta.title}…
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1a120c] text-amber-100 p-6 text-center">
            <p className="text-sm">Không tải được page. Thử tải lại hoặc mở tab mới.</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline text-sm"
            >
              Mở {meta.path} ở tab mới
            </a>
          </div>
        )}
        <iframe
          id="hub-study-iframe"
          key={src}
          title={meta.title}
          src={src}
          className="w-full h-full border-0 bg-white"
          allow="microphone; autoplay"
          onLoad={() => {
            setLoading(false);
            setLoadError(false);
          }}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
        />
      </div>
    </div>
  );
}

/** Export presence key for hub activity override */
export function presenceForStudyKind(kind: HubStudyKind): {
  key: PresenceActivityKey;
  label: string;
} {
  const m = KIND_META[kind];
  return {
    key: m.presence,
    label: ACTIVITY_META[m.presence]?.label ?? m.title,
  };
}
