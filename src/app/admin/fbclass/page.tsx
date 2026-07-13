'use client';

/**
 * /admin/fbclass — Quản lý lớp live FB trả phí (gate ADMIN_EMAILS).
 * Tạo khóa · xem roster (ai đã đóng) · danh sách CẦN KICK (khóa cũ, không mua khóa mới) kèm link FB.
 * Kick trên Facebook làm TAY (FB cấm bot) — trang chỉ cho danh sách + link chính xác.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Plus, Loader2, ExternalLink, CalendarClock,
  UserX, CheckCircle2, ChevronLeft, Link as LinkIcon, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

interface FbClassRow {
  id: string; title: string; price: number; session_count: number;
  start_date: string | null; end_date: string; fb_group_url: string | null;
  status: string; paid_count: number;
}
interface RosterMember {
  user_id: string; order_id: string; full_name: string | null;
  email: string | null; fb_profile_url: string | null; paid_at: string | null;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtVND(n: number) { return n.toLocaleString('vi-VN') + '₫'; }

export default function AdminFbClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<FbClassRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [kickList, setKickList] = useState<RosterMember[]>([]);
  const [busy, setBusy] = useState(false);

  // form tạo khóa
  const [form, setForm] = useState({ title: '', price: 50000, sessionCount: 10, startDate: '', endDate: '', fbGroupUrl: '' });
  // sửa khóa (inline)
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ title: '', price: 50000, sessionCount: 10, startDate: '', endDate: '', fbGroupUrl: '' });

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const loadClasses = useCallback(async () => {
    const t = await token();
    if (!t) { router.push('/auth'); return; }
    try {
      const res = await fetch('/api/admin/fbclass', { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (res.status === 403) { toast.error('Cần quyền admin'); router.push('/'); return; }
      if (!res.ok) throw new Error(json.error);
      setClasses(json.classes);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const loadRoster = useCallback(async (classId: string) => {
    setSelected(classId);
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch(`/api/admin/fbclass/${classId}`, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRoster(json.roster);
      setKickList(json.kickList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [token]);

  const createClass = async () => {
    if (!form.title.trim() || !form.endDate) { toast.error('Cần tên khóa + ngày kết thúc'); return; }
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch('/api/admin/fbclass', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Đã tạo khóa');
      setForm({ title: '', price: 50000, sessionCount: 10, startDate: '', endDate: '', fbGroupUrl: '' });
      await loadClasses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (classId: string, status: string) => {
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch(`/api/admin/fbclass/${classId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(status === 'ended' ? 'Đã kết thúc khóa' : 'Đã cập nhật');
      await loadClasses();
      if (selected === classId) await loadRoster(classId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const copyLink = (classId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/class/${classId}`);
    toast.success('Đã copy link đăng ký');
  };

  const openEdit = (c: FbClassRow) => {
    setEditId(editId === c.id ? null : c.id);
    setEdit({
      title: c.title, price: c.price, sessionCount: c.session_count,
      startDate: c.start_date || '', endDate: c.end_date, fbGroupUrl: c.fb_group_url || '',
    });
  };

  const saveEdit = async (classId: string) => {
    if (!edit.endDate) { toast.error('Cần ngày kết thúc'); return; }
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch(`/api/admin/fbclass/${classId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(edit),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Đã lưu thay đổi');
      setEditId(null);
      await loadClasses();
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

  return (
    <div className="min-h-dvh bg-[#070711] text-white font-sans">
      <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-[#070711]/80 backdrop-blur-xl px-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /> Back</Link>
        <div className="font-bold flex items-center gap-2"><Users className="h-5 w-5 text-violet-400" /> Lớp live Facebook</div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Tạo khóa */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-400" /> Tạo khóa mới</h2>
          <input placeholder="Tên khóa (vd: Khóa giao tiếp tháng 7)" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-slate-400">Phí cam kết (VNĐ)
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1" />
            </label>
            <label className="text-xs text-slate-400">Số buổi
              <input type="number" value={form.sessionCount} onChange={e => setForm({ ...form, sessionCount: +e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1" />
            </label>
            <label className="text-xs text-slate-400">Ngày bắt đầu
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1" />
            </label>
            <label className="text-xs text-slate-400">Ngày kết thúc (buổi cuối)
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white mt-1" />
            </label>
          </div>
          <input placeholder="Link group Facebook KÍN (https://facebook.com/groups/...)" value={form.fbGroupUrl}
            onChange={e => setForm({ ...form, fbGroupUrl: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
          <button onClick={createClass} disabled={busy}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tạo khóa
          </button>
        </section>

        {/* Danh sách khóa */}
        <section className="space-y-3">
          <h2 className="font-bold">Các khóa ({classes.length})</h2>
          {classes.length === 0 && <p className="text-slate-400 text-sm">Chưa có khóa nào.</p>}
          {classes.map(c => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{c.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    <span>{fmtVND(c.price)}</span><span>{c.session_count} buổi</span>
                    <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {fmtDate(c.start_date)}→{fmtDate(c.end_date)}</span>
                    <span className="text-violet-300 font-semibold">{c.paid_count} đã đóng</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copyLink(c.id)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Copy link đăng ký</button>
                <button onClick={() => loadRoster(c.id)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Roster / Kick</button>
                <button onClick={() => openEdit(c)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Sửa</button>
                {c.status === 'active'
                  ? <button onClick={() => setStatus(c.id, 'ended')} className="text-xs bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-3 py-1.5 rounded-lg">Kết thúc khóa</button>
                  : <button onClick={() => setStatus(c.id, 'active')} className="text-xs bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg">Mở lại</button>}
              </div>

              {/* Form sửa khóa */}
              {editId === c.id && (
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })}
                    placeholder="Tên khóa" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-400">Phí cam kết (VNĐ)
                      <input type="number" value={edit.price} onChange={e => setEdit({ ...edit, price: +e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
                    </label>
                    <label className="text-xs text-slate-400">Số buổi
                      <input type="number" value={edit.sessionCount} onChange={e => setEdit({ ...edit, sessionCount: +e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
                    </label>
                    <label className="text-xs text-slate-400">Ngày bắt đầu
                      <input type="date" value={edit.startDate} onChange={e => setEdit({ ...edit, startDate: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
                    </label>
                    <label className="text-xs text-slate-400">Ngày kết thúc
                      <input type="date" value={edit.endDate} onChange={e => setEdit({ ...edit, endDate: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white mt-1" />
                    </label>
                  </div>
                  <input value={edit.fbGroupUrl} onChange={e => setEdit({ ...edit, fbGroupUrl: e.target.value })}
                    placeholder="Link group Facebook KÍN" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c.id)} disabled={busy}
                      className="text-xs bg-primary hover:bg-primary/90 text-white font-bold px-4 py-1.5 rounded-lg disabled:opacity-50">Lưu</button>
                    <button onClick={() => setEditId(null)} className="text-xs bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-lg">Hủy</button>
                  </div>
                </div>
              )}

              {/* Roster + kick khi được chọn */}
              {selected === c.id && (
                <div className="border-t border-white/10 pt-3 space-y-4">
                  {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}

                  {/* Cần kick */}
                  {kickList.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2"><UserX className="h-4 w-4" /> CẦN KICK ({kickList.length}) — chưa mua khóa đang mở</p>
                      <div className="space-y-1.5">
                        {kickList.map(m => (
                          <div key={m.order_id} className="flex items-center justify-between bg-rose-500/10 rounded-lg px-3 py-2 text-sm">
                            <span className="truncate">{m.full_name || m.email || m.user_id.slice(0, 8)}</span>
                            {m.fb_profile_url
                              ? <a href={m.fb_profile_url} target="_blank" rel="noopener noreferrer" className="text-rose-300 hover:text-rose-200 flex items-center gap-1 text-xs shrink-0"><ExternalLink className="h-3.5 w-3.5" /> Mở FB → kick</a>
                              : <span className="text-slate-500 text-xs shrink-0">(không có link FB)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toàn bộ roster */}
                  <div>
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2"><CheckCircle2 className="h-4 w-4" /> ĐÃ ĐÓNG ({roster.length})</p>
                    {roster.length === 0 && <p className="text-slate-500 text-xs">Chưa ai đóng phí.</p>}
                    <div className="space-y-1.5">
                      {roster.map(m => (
                        <div key={m.order_id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <span className="truncate block">{m.full_name || m.email || m.user_id.slice(0, 8)}</span>
                            <span className="text-[10px] text-slate-500">{fmtDate(m.paid_at)}</span>
                          </div>
                          {m.fb_profile_url && <a href={m.fb_profile_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white shrink-0"><ExternalLink className="h-3.5 w-3.5" /></a>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
