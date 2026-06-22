'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Users, UserPlus, Crown, Activity, AlertTriangle,
  Search, Download, X, Mail, Calendar, BookOpen, Target,
  CreditCard, TrendingUp, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { authFetch } from '@/lib/auth-fetch';
import { formatVND } from '@/lib/billing';

// ─── Types (khớp /api/admin/crm) ───
type Lifecycle = 'new' | 'active' | 'at_risk' | 'churned';
type Source = 'group_owner' | 'group_member' | 'classroom' | 'teacher' | 'direct';

interface Customer {
  id: string; email: string; full_name: string | null; role: string;
  created_at: string; plan: string; rawPlan: string; planExpiresAt: string | null;
  paying: boolean; source: Source; lifecycle: Lifecycle;
  lastActive: string | null; wordCount: number; quizCount: number;
  totalPaid: number; groupId: string | null;
}
interface CrmData {
  customers: Customer[];
  funnel: { date: string; count: number }[];
  segments: {
    byPlan: Record<string, number>;
    byRole: Record<string, number>;
    byLifecycle: Record<string, number>;
    bySource: Record<string, number>;
  };
  kpis: {
    totalUsers: number; newThisWeek: number; payingUsers: number;
    activeUsers: number; churnedUsers: number; totalRevenue: number; activeGroups: number;
  };
}

// ─── Nhãn tiếng Việt ───
const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  new: 'Mới', active: 'Hoạt động', at_risk: 'Nguy cơ', churned: 'Đã rời',
};
const LIFECYCLE_STYLE: Record<Lifecycle, string> = {
  new: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  at_risk: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  churned: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};
const SOURCE_LABEL: Record<Source, string> = {
  group_owner: 'Chủ nhóm', group_member: 'TV nhóm', classroom: 'Lớp học',
  teacher: 'Giáo viên', direct: 'Trực tiếp',
};
const PLAN_STYLE: Record<string, string> = {
  free: 'bg-slate-100 text-slate-500 border-slate-200',
  pro: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  premium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '—';
const daysAgo = (s: string | null) => {
  if (!s) return '—';
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d <= 0) return 'hôm nay';
  if (d === 1) return 'hôm qua';
  return `${d} ngày trước`;
};

export default function CrmDashboard() {
  const router = useRouter();
  const [data, setData] = useState<CrmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [lifeFilter, setLifeFilter] = useState<Lifecycle | ''>('');
  const [sourceFilter, setSourceFilter] = useState<Source | ''>('');
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      const res = await authFetch('/api/admin/crm');
      if (res.status === 403) { setError('Cần quyền admin'); setIsLoading(false); return; }
      if (!res.ok) { setError('Lỗi tải dữ liệu'); setIsLoading(false); return; }
      const json = await res.json();
      if (json.success) setData(json);
      setIsLoading(false);
    };
    load();
  }, [router]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.customers.filter(c => {
      if (planFilter && c.plan !== planFilter) return false;
      if (lifeFilter && c.lifecycle !== lifeFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      if (q && !(c.email?.toLowerCase().includes(q) || c.full_name?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, query, planFilter, lifeFilter, sourceFilter]);

  const exportCsv = useCallback(() => {
    const head = ['Tên', 'Email', 'Vai trò', 'Gói', 'Nguồn', 'Vòng đời', 'Ngày ký', 'Hoạt động cuối', 'Số từ', 'Quiz', 'Đã trả (VNĐ)'];
    const rows = filtered.map(c => [
      c.full_name ?? '', c.email, c.role, c.plan, SOURCE_LABEL[c.source],
      LIFECYCLE_LABEL[c.lifecycle], fmtDate(c.created_at), fmtDate(c.lastActive),
      c.wordCount, c.quizCount, c.totalPaid,
    ]);
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-khach-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/40">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-muted/40 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="font-semibold">{error}</p>
        <Link href="/admin" className="text-sm text-primary underline">Về Admin</Link>
      </div>
    );
  }
  if (!data) return null;

  const { kpis, segments, funnel } = data;
  const kpiCards = [
    { label: 'Tổng người dùng', value: kpis.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', sub: 'đã đăng ký' },
    { label: 'Mới tuần này', value: kpis.newThisWeek, icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-500/10', sub: '7 ngày qua' },
    { label: 'Đang trả tiền', value: kpis.payingUsers, icon: Crown, color: 'text-violet-600', bg: 'bg-violet-500/10', sub: `${kpis.activeGroups} nhóm active` },
    { label: 'Đang hoạt động', value: kpis.activeUsers, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-500/10', sub: 'mới + active' },
    { label: 'Đã rời bỏ', value: kpis.churnedUsers, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-500/10', sub: '>30 ngày im' },
    { label: 'Doanh thu', value: formatVND(kpis.totalRevenue), icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-500/10', sub: 'đã thu' },
  ];

  return (
    <div className="min-h-dvh bg-muted/40 font-sans">
      <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur px-4 sm:px-6 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Admin
        </Link>
        <div className="flex items-center gap-2 font-bold text-primary">
          <Users className="h-5 w-5" /> CRM Khách hàng
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/billing" className="flex items-center gap-1.5 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors">
            <CreditCard className="h-4 w-4" /> Billing
          </Link>
          <button onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl transition-colors">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {kpiCards.map(k => (
            <div key={k.label} className="bg-background border rounded-2xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.bg}`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="text-xl font-extrabold tracking-tight">{k.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
              <div className="text-[10px] text-muted-foreground/70">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Signup chart + segments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-background border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-bold">Đăng ký theo ngày</h2>
              <span className="text-xs text-muted-foreground ml-auto">90 ngày gần nhất</span>
            </div>
            {funnel.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Chưa có dữ liệu đăng ký.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={funnel}>
                  <defs>
                    <linearGradient id="su" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip
                    formatter={(v) => [`${v} người`, 'Đăng ký']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('vi-VN')}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#su)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Segment breakdown */}
          <div className="bg-background border rounded-2xl shadow-sm p-6 space-y-5">
            <SegmentBlock title="Theo gói" entries={[
              { key: 'free', label: 'Free', n: segments.byPlan.free ?? 0, active: planFilter === 'free', on: () => setPlanFilter(planFilter === 'free' ? '' : 'free') },
              { key: 'pro', label: 'Pro', n: segments.byPlan.pro ?? 0, active: planFilter === 'pro', on: () => setPlanFilter(planFilter === 'pro' ? '' : 'pro') },
              { key: 'premium', label: 'Premium', n: segments.byPlan.premium ?? 0, active: planFilter === 'premium', on: () => setPlanFilter(planFilter === 'premium' ? '' : 'premium') },
            ]} />
            <SegmentBlock title="Vòng đời" entries={(['new', 'active', 'at_risk', 'churned'] as Lifecycle[]).map(l => ({
              key: l, label: LIFECYCLE_LABEL[l], n: segments.byLifecycle[l] ?? 0,
              active: lifeFilter === l, on: () => setLifeFilter(lifeFilter === l ? '' : l),
            }))} />
            <SegmentBlock title="Nguồn" entries={(Object.keys(SOURCE_LABEL) as Source[]).map(s => ({
              key: s, label: SOURCE_LABEL[s], n: segments.bySource[s] ?? 0,
              active: sourceFilter === s, on: () => setSourceFilter(sourceFilter === s ? '' : s),
            }))} />
          </div>
        </div>

        {/* Customer table */}
        <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="font-bold">Khách hàng</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} / {data.customers.length} người</p>
            </div>
            <div className="flex items-center gap-2">
              {(planFilter || lifeFilter || sourceFilter) && (
                <button onClick={() => { setPlanFilter(''); setLifeFilter(''); setSourceFilter(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3 w-3" /> Xóa lọc
                </button>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên / email…"
                  className="pl-8 pr-3 py-2 text-sm border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 w-56" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-semibold">Người dùng</th>
                  <th className="text-center px-3 py-3 font-semibold">Gói</th>
                  <th className="text-center px-3 py-3 font-semibold">Nguồn</th>
                  <th className="text-center px-3 py-3 font-semibold">Vòng đời</th>
                  <th className="text-right px-3 py-3 font-semibold">Ngày ký</th>
                  <th className="text-right px-3 py-3 font-semibold">Hoạt động</th>
                  <th className="text-right px-3 py-3 font-semibold">Từ</th>
                  <th className="text-right px-5 py-3 font-semibold">Đã trả</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Không có khách phù hợp.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="font-semibold">{c.full_name || 'Chưa đặt tên'}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${PLAN_STYLE[c.plan] ?? PLAN_STYLE.free}`}>{c.plan}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground">{SOURCE_LABEL[c.source]}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${LIFECYCLE_STYLE[c.lifecycle]}`}>{LIFECYCLE_LABEL[c.lifecycle]}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-muted-foreground">{fmtDate(c.created_at)}</td>
                    <td className="px-3 py-3 text-right text-xs text-muted-foreground">{daysAgo(c.lastActive)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-primary">{c.wordCount || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold">{c.totalPaid ? formatVND(c.totalPaid) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail drawer */}
      {selected && <CustomerDrawer c={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Segment list block ───
function SegmentBlock({ title, entries }: {
  title: string;
  entries: { key: string; label: string; n: number; active: boolean; on: () => void }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1">
        {entries.map(e => (
          <button key={e.key} onClick={e.on}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              e.active ? 'bg-primary/10 border-primary/30 text-primary font-semibold' : 'border-transparent hover:bg-muted/50'
            }`}>
            <span>{e.label}</span>
            <span className="font-bold tabular-nums">{e.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Detail drawer ───
function CustomerDrawer({ c, onClose }: { c: Customer; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-background h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background/90 backdrop-blur border-b px-5 py-4 flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{c.full_name || 'Chưa đặt tên'}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase border ${PLAN_STYLE[c.plan] ?? PLAN_STYLE.free}`}>{c.plan}</span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${LIFECYCLE_STYLE[c.lifecycle]}`}>{LIFECYCLE_LABEL[c.lifecycle]}</span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-muted/50 text-muted-foreground capitalize">{c.role}</span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-muted/50 text-muted-foreground">{SOURCE_LABEL[c.source]}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat icon={BookOpen} label="Số từ đã lưu" value={String(c.wordCount)} />
            <Stat icon={Target} label="Lượt quiz" value={String(c.quizCount)} />
            <Stat icon={CreditCard} label="Tổng đã trả" value={c.totalPaid ? formatVND(c.totalPaid) : '0₫'} />
            <Stat icon={Building2} label="Thuộc nhóm" value={c.groupId ? 'Có' : 'Không'} />
          </div>

          <div className="space-y-2 text-sm">
            <Row icon={Calendar} label="Ngày đăng ký" value={`${fmtDate(c.created_at)} (${daysAgo(c.created_at)})`} />
            <Row icon={Activity} label="Hoạt động cuối" value={c.lastActive ? `${fmtDate(c.lastActive)} (${daysAgo(c.lastActive)})` : 'Chưa hoạt động'} />
            <Row icon={Crown} label="Gói ghi nhận" value={c.rawPlan + (c.planExpiresAt ? ` · hết hạn ${fmtDate(c.planExpiresAt)}` : '')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3">
      <Icon className="h-4 w-4 text-muted-foreground mb-2" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium ml-auto text-right">{value}</span>
    </div>
  );
}
