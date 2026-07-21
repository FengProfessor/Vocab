'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import {
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_POLL_MS,
  activityFromPathname,
  type RoomPresenceMember,
} from '@/lib/room-presence';
import {
  localPresenceList,
  localPresenceSelfId,
  localPresenceUpsert,
} from '@/lib/presence-local';

/**
 * Heartbeat + poll. Fallback localStorage nếu API 503 (chưa migration).
 */
export function useRoomPresence(opts: {
  roomId: string | null;
  displayName?: string | null;
  heartbeat?: boolean;
  enabled?: boolean;
  /** Ghi đè activity (vd popup học trong hub) */
  activityOverride?: { key: string; label: string } | null;
}) {
  const {
    roomId,
    displayName,
    heartbeat = true,
    enabled = true,
    activityOverride = null,
  } = opts;
  const pathname = usePathname();
  const [members, setMembers] = useState<RoomPresenceMember[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [mode, setMode] = useState<'server' | 'local'>('server');
  const nameRef = useRef(displayName);
  nameRef.current = displayName;
  const overrideRef = useRef(activityOverride);
  overrideRef.current = activityOverride;
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      userIdRef.current = data.session?.user?.id ?? null;
    });
  }, []);

  const applyLocal = useCallback(() => {
    if (!roomId) return;
    const selfId = userIdRef.current || localPresenceSelfId();
    const list = localPresenceList(roomId, selfId);
    setMembers(list);
    setOnlineCount(list.length);
  }, [roomId]);

  const sendHeartbeat = useCallback(async () => {
    if (!roomId || !enabled || !heartbeat) return;
    const fromPath = activityFromPathname(pathname || '/');
    const ov = overrideRef.current;
    const act = ov
      ? { key: ov.key, label: ov.label }
      : fromPath;
    const name = (nameRef.current || 'Hoc vien').trim() || 'Hoc vien';
    const selfId = userIdRef.current || localPresenceSelfId();

    // luôn ghi local (fallback + multi-tab)
    localPresenceUpsert({
      roomId,
      userId: selfId,
      displayName: name.slice(0, 16),
      activityKey: act.key,
      activityLabel: act.label,
    });

    try {
      const res = await authFetch('/api/hub/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          activityKey: act.key,
          activityLabel: act.label,
          displayName: name,
        }),
      });
      const json = await res.json();
      if (json.code === 'PRESENCE_NOT_READY' || res.status === 503) {
        setNotReady(true);
        setMode('local');
        applyLocal();
        return;
      }
      if (json.success) {
        setNotReady(false);
        setMode('server');
        setError(null);
      } else if (res.status !== 401) {
        setError(json.error || 'Heartbeat failed');
        setMode('local');
        applyLocal();
      }
    } catch {
      setMode('local');
      applyLocal();
    }
  }, [roomId, enabled, heartbeat, pathname, activityOverride, applyLocal]);

  const refresh = useCallback(async () => {
    if (!roomId || !enabled) return;

    // local first paint
    if (mode === 'local' || notReady) {
      applyLocal();
    }

    try {
      const res = await authFetch(
        `/api/hub/presence?roomId=${encodeURIComponent(roomId)}`
      );
      const json = await res.json();
      if (json.meta?.notReady) {
        setNotReady(true);
        setMode('local');
        applyLocal();
        return;
      }
      if (json.success) {
        const serverMembers = (json.members as RoomPresenceMember[]) || [];
        if (serverMembers.length > 0 || !notReady) {
          setMembers(serverMembers);
          setOnlineCount(
            typeof json.onlineCount === 'number'
              ? json.onlineCount
              : serverMembers.length
          );
          setNotReady(false);
          setMode('server');
          setError(null);
          return;
        }
      }
      applyLocal();
    } catch {
      setMode('local');
      applyLocal();
    }
  }, [roomId, enabled, mode, notReady, applyLocal]);

  useEffect(() => {
    if (!roomId || !enabled || !heartbeat) return;
    const tick = () => {
      // Tab ẩn → không heartbeat (tiết kiệm Function Invocations)
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void sendHeartbeat();
    };
    tick();
    const id = window.setInterval(tick, PRESENCE_HEARTBEAT_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') void sendHeartbeat();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [roomId, enabled, heartbeat, sendHeartbeat]);

  useEffect(() => {
    if (!roomId || !enabled) return;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refresh();
    };
    tick();
    const id = window.setInterval(tick, PRESENCE_POLL_MS);
    return () => clearInterval(id);
  }, [roomId, enabled, refresh]);

  useEffect(() => {
    if (!roomId || !enabled) return;
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === roomId) applyLocal();
    };
    window.addEventListener('lingopro-presence-local', onLocal);
    window.addEventListener('storage', onLocal);
    return () => {
      window.removeEventListener('lingopro-presence-local', onLocal);
      window.removeEventListener('storage', onLocal);
    };
  }, [roomId, enabled, applyLocal]);

  useEffect(() => {
    if (!roomId || !enabled || !heartbeat) return;
    const leave = () => {
      void authFetch('/api/hub/presence', { method: 'DELETE' });
    };
    window.addEventListener('pagehide', leave);
    return () => window.removeEventListener('pagehide', leave);
  }, [roomId, enabled, heartbeat]);

  return {
    members,
    onlineCount,
    error,
    notReady,
    mode,
    refresh,
    sendHeartbeat,
  };
}
