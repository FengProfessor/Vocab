'use client';

/**
 * Hub thư viện pixel rộng (~100 chỗ), không sidebar.
 * Học = popup panel (không full-page).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { PixelHubRoom } from '@/components/hub/PixelHubRoom';
import { DisplayNameEditor } from '@/components/hub/DisplayNameEditor';
import {
  HubStudyPopup,
  presenceForStudyKind,
  type HubStudyKind,
} from '@/components/hub/HubStudyPopup';
import { useRoomPresence } from '@/hooks/useRoomPresence';
import { supabase } from '@/lib/supabase';

export default function HubPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('Thư viện');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [studyKind, setStudyKind] = useState<HubStudyKind | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        setDisplayName(
          (profile?.full_name as string) || user.email?.split('@')[0] || 'Học viên',
        );

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('classroom_id, classrooms(id, name)')
          .eq('student_id', user.id)
          .limit(5);

        type EnrollRow = {
          classroom_id: string;
          classrooms: { id: string; name: string } | { id: string; name: string }[] | null;
        };

        const rows = (enrollments ?? []) as EnrollRow[];
        let picked: { id: string; name: string } | null = null;
        for (const e of rows) {
          const c = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms;
          if (c?.id) {
            picked = { id: c.id, name: c.name || 'Lớp học' };
            if (c.id !== '__personal__' && !String(c.name || '').includes('personal')) {
              break;
            }
          }
        }

        if (picked) {
          setRoomId(picked.id);
          setRoomName(picked.name);
        } else {
          setRoomId('lobby');
          setRoomName('Thư viện chung');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activityOverride = studyKind ? presenceForStudyKind(studyKind) : null;

  const { members, onlineCount, notReady, sendHeartbeat } = useRoomPresence({
    roomId,
    displayName,
    heartbeat: true,
    enabled: Boolean(roomId),
    activityOverride,
  });

  return (
    <StudentShell title="Hub" contentClassName="p-0" hideMobileNav immersive>
      <div
        className="min-h-dvh flex flex-col"
        style={{
          background:
            'radial-gradient(ellipse at top, #3d2914 0%, #1a100a 50%, #0c0806 100%)',
        }}
      >
        {/* Top bar tối giản — không sidebar */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#3d2914] shrink-0 z-40 bg-[#14100c]/95">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/student"
              className="text-[11px] text-amber-200/50 hover:text-amber-200 font-mono shrink-0"
            >
              ← Dashboard
            </Link>
            <span className="text-amber-100/20">|</span>
            <span className="text-xs font-bold text-amber-50 truncate font-mono">
              Thư viện pixel
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowNameEdit((v) => !v)}
            className="text-[11px] font-semibold text-amber-300 border border-amber-800/50 rounded px-2 py-1 bg-black/40 shrink-0"
          >
            {showNameEdit ? 'Đóng tên' : 'Đổi tên'}
          </button>
        </div>

        {(showNameEdit || !displayName) && (
          <div className="px-3 py-2 border-b border-[#3d2914] bg-[#1a120c] [&_h2]:text-amber-50 [&_p]:text-amber-100/45 [&_input]:bg-[#0c0806] [&_input]:border-amber-900/50 [&_input]:text-amber-50 [&_button]:bg-amber-400 [&_button]:text-amber-950">
            <DisplayNameEditor
              initialName={displayName}
              onSaved={(name) => {
                setDisplayName(name);
                setShowNameEdit(false);
                void sendHeartbeat();
              }}
            />
          </div>
        )}

        {/* Map full width */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-[50vh] flex items-center justify-center text-amber-200/50 font-mono text-sm">
              Đang vào thư viện…
            </div>
          ) : (
            <PixelHubRoom
              members={members}
              onlineCount={onlineCount}
              roomLabel={roomName}
              notReady={notReady}
              mapSrc="/lingo-town/library-wide.jpg"
              selfDisplayName={displayName || 'Hoc vien'}
              selfUserId={userId || 'local-guest'}
            />
          )}
        </div>

        {/* Dock học — mở popup, không navigate */}
        <div
          className="shrink-0 border-t-2 border-[#3d2914] px-2 py-2 safe-area-pb"
          style={{ background: 'linear-gradient(180deg, #1a120c, #0c0806)' }}
        >
          <p className="text-[9px] uppercase tracking-wider text-amber-500/60 font-mono text-center mb-1.5">
            Học trong thư viện (popup)
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto">
            <DockBtn emoji="🃏" label="Flashcard" onClick={() => setStudyKind('flashcard')} />
            <DockBtn emoji="🔥" label="Ôn hạn" onClick={() => setStudyKind('review')} />
            <DockBtn emoji="📐" label="Ngữ pháp" onClick={() => setStudyKind('grammar')} />
            <DockBtn emoji="✅" label="Quiz" onClick={() => setStudyKind('quiz')} />
            <DockBtn emoji="✍️" label="Gõ từ" onClick={() => setStudyKind('writing')} />
            <DockBtn emoji="✨" label="Chèn từ" onClick={() => setStudyKind('codemix')} />
            <DockBtn emoji="📖" label="Từ điển" onClick={() => setStudyKind('dictionary')} />
          </div>
        </div>

        <HubStudyPopup kind={studyKind} onClose={() => setStudyKind(null)} />
      </div>
    </StudentShell>
  );
}

function DockBtn({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 min-w-[4.5rem] px-2 py-2 rounded-md border-2 border-[#5c3d24] hover:border-amber-600/50 active:scale-95 transition-transform"
      style={{ background: 'linear-gradient(180deg, #2a1c12, #14100c)' }}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span className="text-[10px] font-medium text-amber-100/90 font-mono">{label}</span>
    </button>
  );
}
