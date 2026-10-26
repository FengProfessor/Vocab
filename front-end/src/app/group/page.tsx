'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Copy,
  Crown,
  Loader2,
  UserMinus,
  LogOut,
  Ticket,
  Sparkles,
  CalendarClock,
  ShieldCheck,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatExpiry, getRemainingDays, PLAN_LABELS } from '@/lib/billing';
import type { Plan } from '@/lib/supabase';
import { StudentShell } from '@/components/student/StudentShell';

interface OwnedMember {
  user_id: string;
  joined_at: string;
  full_name: string | null;
  email: string | null;
  is_owner: boolean;
}
interface OwnedGroup {
  id: string;
  plan: Exclude<Plan, 'free'>;
  seat_limit: number;
  invite_code: string;
  expires_at: string | null;
  seats_used: number;
  members: OwnedMember[];
}
interface JoinedGroup {
  id: string;
  plan: Exclude<Plan, 'free'>;
  expires_at: string | null;
  owner_name: string | null;
}

export default function GroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [owned, setOwned] = useState<OwnedGroup | null>(null);
  const [joined, setJoined] = useState<JoinedGroup | null>(null);
  const [joinCode, setJoinCode] = useState('');

  const hasSession = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) return true;
    return Boolean(session?.user);
  }, []);

  const load = useCallback(async () => {
    const t = await hasSession();
    if (!t) {
      router.replace('/auth');
      return;
    }
    try {
      const res = await fetch('/api/groups/mine', {
        headers: { 'X-LingoPro-Request': '1' },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOwned(json.data.owned);
        setJoined(json.data.joined);
      }
    } catch (err) {
      console.error('[Group] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, hasSession]);

  useEffect(() => {
    // Prefill mã mời từ URL ?code=
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setJoinCode(code.toUpperCase());
    void load();
  }, [load]);

  const copy = (text: string, label = 'Đã sao chép!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast.error('Nhập mã nhóm');
      return;
    }
    setBusy(true);
    try {
      await hasSession();
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'X-LingoPro-Request': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Vào nhóm thành công! Bạn đã được mở khóa Pro.');
      setJoinCode('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!owned) return;
    if (!confirm(`Xóa ${name} khỏi nhóm? Họ sẽ mất quyền Pro.`)) return;
    setBusy(true);
    try {
      await hasSession();
      const res = await fetch(`/api/groups/${owned.id}/remove`, {
        method: 'POST',
        headers: { 'X-LingoPro-Request': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Đã xóa thành viên');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Rời nhóm? Bạn sẽ mất quyền Pro từ nhóm.')) return;
    setBusy(true);
    try {
      await hasSession();
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'X-LingoPro-Request': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Đã rời nhóm');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const inviteLink =
    owned && typeof window !== 'undefined'
      ? `${window.location.origin}/group?code=${owned.invite_code}`
      : '';
  const ownedRemaining = getRemainingDays(owned?.expires_at);
  const joinedRemaining = getRemainingDays(joined?.expires_at);
  const seatPercent = owned
    ? Math.min(100, Math.round((owned.seats_used / Math.max(1, owned.seat_limit)) * 100))
    : 0;

  return (
    <StudentShell title="Nhóm học tập Pro">
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
          {/* Header Banner */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl"
            />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200/70 dark:border-violet-800/60 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-2">
                  <Sparkles className="h-3.5 w-3.5" /> LingoPro Squad
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Users className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                  Nhóm học tập của tôi
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Chia sẻ đặc quyền Pro cùng nhóm bạn — tiết kiệm chi phí, nhân đôi động lực học mỗi ngày.
                </p>
              </div>
              <Link
                href="/upgrade"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 shadow-sm transition-colors shrink-0"
              >
                <Sparkles className="h-4 w-4" /> Nâng cấp / Mua thêm ghế
              </Link>
            </div>
          </section>

          {/* OWNED GROUP */}
          {owned && (
            <section className="rounded-3xl border border-violet-200/80 dark:border-violet-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/50">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      Bạn là Chủ nhóm
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Quản lý mã mời và danh sách thành viên trong gói nhóm
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-800 px-3.5 py-1 text-xs font-extrabold text-violet-700 dark:text-violet-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {PLAN_LABELS[owned.plan]}
                </span>
              </div>

              {/* Invite Ticket Box */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-violet-500" /> Mã mời thành viên
                    </p>
                    <p className="mt-1 font-mono font-black text-2xl sm:text-3xl tracking-[0.2em] text-violet-600 dark:text-violet-400">
                      {owned.invite_code}
                    </p>
                  </div>
                  <button
                    onClick={() => copy(owned.invite_code, 'Đã sao chép mã mời!')}
                    className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-violet-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Copy className="h-3.5 w-3.5 text-violet-500" /> Sao chép mã
                  </button>
                </div>

                <button
                  onClick={() => copy(inviteLink, 'Đã sao chép đường dẫn mời!')}
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-left text-xs text-slate-600 dark:text-slate-300 hover:border-violet-400 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono">{inviteLink}</span>
                  </span>
                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 shrink-0">
                    Copy link
                  </span>
                </button>
              </div>

              {/* Seat Capacity & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-violet-500" /> Số ghế đã dùng
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {owned.seats_used} / {owned.seat_limit} ghế
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all"
                      style={{ width: `${seatPercent}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4 text-indigo-500" /> Thời hạn gói nhóm
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
                      {ownedRemaining !== null && ownedRemaining > 0
                        ? `Còn ${ownedRemaining} ngày`
                        : 'Đã hết hạn'}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        ({formatExpiry(owned.expires_at)})
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Roster */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Danh sách thành viên ({owned.members.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  {owned.members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-2">
                          <span>{m.full_name || m.email || 'Thành viên'}</span>
                          {m.is_owner && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                              Chủ nhóm
                            </span>
                          )}
                        </p>
                        {m.email && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {m.email}
                          </p>
                        )}
                      </div>
                      {!m.is_owner && (
                        <button
                          onClick={() =>
                            handleRemove(m.user_id, m.full_name || m.email || 'thành viên')
                          }
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40 cursor-pointer"
                          title="Xóa khỏi nhóm"
                        >
                          <UserMinus className="h-4 w-4" />
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* JOINED GROUP (member) */}
          {joined && (
            <section className="rounded-3xl border border-emerald-200/80 dark:border-emerald-800/50 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-900 dark:text-white">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  Bạn đang là thành viên nhóm Pro
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  {PLAN_LABELS[joined.plan]}
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trưởng nhóm: <b className="text-slate-900 dark:text-white">{joined.owner_name || 'Chủ nhóm'}</b>
                {joinedRemaining !== null && joinedRemaining > 0 && (
                  <> · Còn <b>{joinedRemaining} ngày</b></>
                )}{' '}
                <span className="text-xs text-slate-400">({formatExpiry(joined.expires_at)})</span>
              </p>

              <div className="pt-1">
                <button
                  onClick={handleLeave}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Rời khỏi nhóm này
                </button>
              </div>
            </section>
          )}

          {/* JOIN BY INVITE CODE */}
          {!joined && (
            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Tham gia nhóm bằng mã mời
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nhập mã 6 ký tự từ trưởng nhóm để kích hoạt ngay quyền lợi LingoPro.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="VD: K7P2QX"
                  aria-label="Mã mời vào nhóm"
                  className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-sm uppercase font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleJoin}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 text-sm disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Kích hoạt ngay <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* CREATE SQUAD CTA */}
          {!owned && (
            <section className="rounded-3xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/70 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/20 p-6 text-center space-y-3 shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Muốn lập nhóm học chung với bạn bè?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Tạo Gói Nhóm Pro — quản lý thành viên linh hoạt, chi phí chỉ từ 39.000đ/ghế/tháng.
              </p>
              <div className="pt-1">
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold px-6 py-3 text-xs sm:text-sm transition-opacity"
                >
                  <Sparkles className="h-4 w-4 text-amber-400 dark:text-indigo-600" /> Tạo Gói Nhóm Ngay
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
    </StudentShell>
  );
}
