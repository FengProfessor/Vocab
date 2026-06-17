'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, ChevronLeft, Users, Copy, Crown, Loader2,
  UserMinus, LogOut, Ticket, Sparkles, CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatExpiry, getRemainingDays, PLAN_LABELS } from '@/lib/billing';
import type { Plan } from '@/lib/supabase';

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

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) { router.push('/auth'); return; }
    try {
      const res = await fetch('/api/groups/mine', { headers: { Authorization: `Bearer ${t}` } });
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
  }, [router, token]);

  useEffect(() => {
    // Prefill mã mời từ URL ?code=
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) setJoinCode(code.toUpperCase());
    load();
  }, [load]);

  const copy = (text: string, label = 'Đã copy!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { toast.error('Nhập mã nhóm'); return; }
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
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
      const t = await token();
      const res = await fetch(`/api/groups/${owned.id}/remove`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
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
      const t = await token();
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
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

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#070711]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inviteLink = owned ? `${window.location.origin}/group?code=${owned.invite_code}` : '';
  const ownedRemaining = getRemainingDays(owned?.expires_at);
  const joinedRemaining = getRemainingDays(joined?.expires_at);

  return (
    <div className="min-h-dvh bg-[#070711] text-white font-sans">
      <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-[#070711]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2 font-bold">
          <Brain className="h-5 w-5 text-primary" /> LingoPro
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 mb-1">
            <Users className="h-7 w-7 text-violet-400" /> Nhóm của tôi
          </h1>
          <p className="text-slate-400 text-sm">Chia sẻ gói Pro với nhóm bạn — mỗi ghế chỉ 39k/tháng.</p>
        </div>

        {/* OWNED GROUP */}
        {owned && (
          <section className="bg-gradient-to-br from-violet-500/15 to-purple-500/15 border border-violet-500/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Crown className="h-5 w-5 text-amber-400" /> Bạn là chủ nhóm
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                {PLAN_LABELS[owned.plan]}
              </span>
            </div>

            {/* Invite code */}
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" /> Mã mời</p>
                  <p className="font-mono font-extrabold text-2xl tracking-widest text-violet-300">{owned.invite_code}</p>
                </div>
                <button onClick={() => copy(owned.invite_code)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => copy(inviteLink, 'Đã copy link mời!')}
                className="w-full text-left text-xs text-slate-400 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 flex items-center justify-between gap-2"
              >
                <span className="truncate">{inviteLink}</span>
                <Copy className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>

            {/* Seats + expiry */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="h-4 w-4 text-violet-400" /> Ghế: <b>{owned.seats_used}/{owned.seat_limit}</b>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <CalendarClock className="h-4 w-4 text-violet-400" />
                {ownedRemaining !== null && ownedRemaining > 0
                  ? `Còn ${ownedRemaining} ngày`
                  : 'Đã hết hạn'} · {formatExpiry(owned.expires_at)}
              </span>
            </div>

            {/* Members */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400">Thành viên</p>
              {owned.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {m.full_name || m.email || 'Thành viên'}
                      {m.is_owner && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Chủ nhóm</span>}
                    </p>
                    {m.email && <p className="text-xs text-slate-500 truncate">{m.email}</p>}
                  </div>
                  {!m.is_owner && (
                    <button
                      onClick={() => handleRemove(m.user_id, m.full_name || m.email || 'thành viên')}
                      disabled={busy}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-40"
                      title="Xóa khỏi nhóm"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              <Sparkles className="h-4 w-4" /> Gia hạn / thêm ghế
            </Link>
          </section>
        )}

        {/* JOINED GROUP (member) */}
        {joined && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold">
              <Users className="h-5 w-5 text-emerald-400" /> Bạn đang trong nhóm
            </div>
            <p className="text-sm text-slate-300">
              Nhóm của <b>{joined.owner_name || 'chủ nhóm'}</b> · gói <b className="text-emerald-300">{PLAN_LABELS[joined.plan]}</b>
              {joinedRemaining !== null && joinedRemaining > 0 && <> · còn {joinedRemaining} ngày</>}
              {' '}({formatExpiry(joined.expires_at)})
            </p>
            <button
              onClick={handleLeave}
              disabled={busy}
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-40"
            >
              <LogOut className="h-4 w-4" /> Rời nhóm
            </button>
          </section>
        )}

        {/* JOIN BOX (chưa ở nhóm nào / muốn vào thêm) */}
        {!joined && (
          <section className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold">
              <Ticket className="h-5 w-5 text-violet-400" /> Vào nhóm bằng mã mời
            </div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="VD: K7P2QX"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm uppercase font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleJoin}
                disabled={busy}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vào nhóm'}
              </button>
            </div>
          </section>
        )}

        {/* CTA tạo nhóm — khi chưa sở hữu */}
        {!owned && (
          <section className="text-center bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6">
            <p className="font-bold mb-1">Muốn rủ cả nhóm bạn học chung?</p>
            <p className="text-sm text-slate-400 mb-4">Tạo Gói Nhóm — bạn trả gộp, mỗi ghế chỉ 39k/tháng.</p>
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl"
            >
              <Users className="h-4 w-4" /> Tạo Gói Nhóm
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
