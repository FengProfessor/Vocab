'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Users, UserPlus, Crown, Activity, AlertTriangle,
  Search, Download, X, Mail, Calendar, BookOpen, Target,
  CreditCard, TrendingUp, Building2, Brain, RotateCcw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { authFetch } from '@/lib/auth-fetch';
import { formatVND } from '@/lib/billing';

const CrmSignupChart = dynamic(
  () => import('@/components/charts/CrmSignupChart').then((m) => m.CrmSignupChart),
  { ssr: false, loading: () => <div className="h-[240px] animate-pulse rounded-xl bg-muted/40" /> }
);

// ─── Types (khớp /api/admin/crm) ───
type Lifecycle = 'new' | 'active' | 'at_risk' | 'churned';
type Source = 'group_owner' | 'group_member' | 'classroom' | 'teacher' | 'direct';
/** Preset lọc theo ngày ôn tập (chăm sóc) */
type ReviewFilter = '' | 'today' | 'yesterday' | '7d' | 'never' | 'due' | 'stale3';

interface Customer {
  id: string; email: string; full_name: string | null; role: string;
  created_at: string; plan: string; rawPlan: string; planExpiresAt: string | null;
  paying: boolean; source: Source; lifecycle: Lifecycle;
  lastActive: string | null;
  wordCount: number;       // từ đã lưu
  learnedCount: number;    // từ đã ôn SRS
  reviewTotal: number;     // tổng lượt ôn
  lapsesTotal: number;     // lần quên
  lastReviewedAt: string | null; // ôn SRS cuối
  dueCount: number;        // từ đang due
  quizCount: number;
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
    activeUsers: number; learners: number; churnedUsers: number;
    totalRevenue: number; activeGroups: number;
    freeHot150?: number;
    freeHot200?: number;
    reviewedToday?: number;
    withDue?: number;
    neverReviewed?: number;
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

/** YYYY-MM-DD theo giờ VN (UTC+7) — khớp ngày ôn chăm sóc */
const toVNDateKey = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

const vnTodayKey = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

/** Trừ n ngày lịch (chuỗi YYYY-MM-DD), timezone-agnostic */
const shiftDateKey = (key: string, days: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
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
  /** Free ≥150 từ — lead upsell Pro */
  const [upsellHot, setUpsellHot] = useState(false);
  /** Lọc chăm sóc theo ngày ôn SRS */
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('');
  const [reviewDate, setReviewDate] = useState(''); // YYYY-MM-DD — ôn cuối đúng ngày
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
    const today = vnTodayKey();
    const yesterday = shiftDateKey(today, -1);
    const weekStart = shiftDateKey(today, -6); // 7 ngày lịch (hôm nay + 6 trước)
    const staleBefore = shiftDateKey(today, -3); // ôn cuối ≤ 3 ngày trước

    let list = data.customers.filter(c => {
      if (planFilter && c.plan !== planFilter) return false;
      if (lifeFilter && c.lifecycle !== lifeFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      if (upsellHot && !(c.plan === 'free' && c.wordCount >= 150)) return false;

      const revKey = toVNDateKey(c.lastReviewedAt);
      if (reviewDate) {
        if (revKey !== reviewDate) return false;
      } else if (reviewFilter === 'today') {
        if (revKey !== today) return false;
      } else if (reviewFilter === 'yesterday') {
        if (revKey !== yesterday) return false;
      } else if (reviewFilter === '7d') {
        if (!revKey || revKey < weekStart || revKey > today) return false;
      } else if (reviewFilter === 'never') {
        // Có từ nhưng chưa ôn SRS lần nào
        if (c.lastReviewedAt || c.wordCount <= 0) return false;
      } else if (reviewFilter === 'due') {
        if ((c.dueCount ?? 0) <= 0) return false;
      } else if (reviewFilter === 'stale3') {
        // Đã từng ôn nhưng im ≥3 ngày — cần chăm
        if (!revKey || revKey > staleBefore) return false;
      }

      if (q && !(c.email?.toLowerCase().includes(q) || c.full_name?.toLowerCase().includes(q))) return false;
      return true;
    });

    // Upsell / ôn tập: sort hữu ích cho chăm sóc
    if (upsellHot) {
      list = [...list].sort((a, b) => b.wordCount - a.wordCount);
    } else if (reviewFilter === 'due' || reviewFilter === 'stale3') {
      list = [...list].sort((a, b) => (b.dueCount ?? 0) - (a.dueCount ?? 0));
    } else if (reviewFilter || reviewDate) {
      list = [...list].sort((a, b) => {
        const ta = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
        const tb = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [data, query, planFilter, lifeFilter, sourceFilter, upsellHot, reviewFilter, reviewDate]);

  const clearFilters = useCallback(() => {
    setPlanFilter('');
    setLifeFilter('');
    setSourceFilter('');
    setUpsellHot(false);
    setReviewFilter('');
    setReviewDate('');
  }, []);

  const exportCsv = useCallback(() => {
    const head = [
      'Tên', 'Email', 'Vai trò', 'Gói', 'Nguồn', 'Vòng đời', 'Ngày ký', 'Hoạt động cuối',
      'Ôn cuối', 'Từ due', 'Từ đã lưu', 'Từ đã ôn', 'Lượt ôn', 'Lần quên', 'Quiz', 'Đã trả (VNĐ)',
    ];
    const rows = filtered.map(c => [
      c.full_name ?? '', c.email, c.role, c.plan, SOURCE_LABEL[c.source],
      LIFECYCLE_LABEL[c.lifecycle], fmtDate(c.created_at), fmtDate(c.lastActive),
      fmtDate(c.lastReviewedAt), c.dueCount ?? 0,
      c.wordCount, c.learnedCount, c.reviewTotal, c.lapsesTotal, c.quizCount, c.totalPaid,
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
  const applyReview = (f: ReviewFilter) => {
    setReviewDate('');
    setReviewFilter((cur) => (cur === f ? '' : f));
  };
  const kpiCards = [
    { label: 'Tổng người dùng', value: kpis.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10', sub: 'đã đăng ký', onClick: undefined as (() => void) | undefined, active: false },
    { label: 'Mới tuần này', value: kpis.newThisWeek, icon: UserPlus, color: 'text-sky-600', bg: 'bg-sky-500/10', sub: '7 ngày qua', onClick: undefined as (() => void) | undefined, active: false },
    { label: 'Đang trả tiền', value: kpis.payingUsers, icon: Crown, color: 'text-violet-600', bg: 'bg-violet-500/10', sub: `${kpis.activeGroups} nhóm active`, onClick: undefined as (() => void) | undefined, active: false },
    {
      label: 'Ôn hôm nay',
      value: kpis.reviewedToday ?? 0,
      icon: RotateCcw,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      sub: 'bấm lọc chăm sóc',
      onClick: () => applyReview('today'),
      active: reviewFilter === 'today' && !reviewDate,
    },
    {
      label: 'Có từ due',
      value: kpis.withDue ?? 0,
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10',
      sub: 'cần ôn · bấm lọc',
      onClick: () => applyReview('due'),
      active: reviewFilter === 'due',
    },
    {
      label: 'Chưa từng ôn',
      value: kpis.neverReviewed ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
      sub: 'có từ · chưa SRS',
      onClick: () => applyReview('never'),
      active: reviewFilter === 'never',
    },
    {
      label: 'Free ≥150 từ',
      value: kpis.freeHot150 ?? 0,
      icon: Target,
      color: 'text-orange-600',
      bg: 'bg-orange-500/10',
      sub: `${kpis.freeHot200 ?? 0} đã ≥200 — bấm lọc`,
      onClick: () => {
        setUpsellHot(true);
        setPlanFilter('free');
        setLifeFilter('');
        setSourceFilter('');
        setReviewFilter('');
        setReviewDate('');
      },
      active: upsellHot,
    },
    { label: 'Doanh thu', value: formatVND(kpis.totalRevenue), icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-500/10', sub: 'đã thu', onClick: undefined as (() => void) | undefined, active: false },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {kpiCards.map(k => (
            <div
              key={k.label}
              role={k.onClick ? 'button' : undefined}
              tabIndex={k.onClick ? 0 : undefined}
              onClick={k.onClick}
              onKeyDown={k.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') k.onClick?.(); } : undefined}
              className={`bg-background border rounded-2xl p-4 shadow-sm ${
                k.onClick ? 'cursor-pointer transition hover:border-primary/40 hover:shadow-md' : ''
              } ${k.active ? 'ring-2 ring-primary border-primary/40' : ''}`}
            >
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
              <CrmSignupChart data={funnel} />
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
          <div className="px-5 py-4 border-b space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold">Khách hàng</h2>
                <p className="text-sm text-muted-foreground">{filtered.length} / {data.customers.length} người</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUpsellHot((v) => !v);
                    if (!upsellHot) setPlanFilter('free');
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                    upsellHot
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20'
                  }`}
                >
                  Upsell Free ≥150
                  {typeof kpis.freeHot150 === 'number' ? ` (${kpis.freeHot150})` : ''}
                </button>
                {(planFilter || lifeFilter || sourceFilter || upsellHot || reviewFilter || reviewDate) && (
                  <button onClick={clearFilters}
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

            {/* Lọc theo ngày ôn tập — chăm sóc */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mr-1">
                <Calendar className="h-3.5 w-3.5" /> Ngày ôn
              </span>
              {([
                { key: 'today' as const, label: 'Hôm nay' },
                { key: 'yesterday' as const, label: 'Hôm qua' },
                { key: '7d' as const, label: '7 ngày' },
                { key: 'stale3' as const, label: 'Im ≥3 ngày' },
                { key: 'due' as const, label: 'Có due' },
                { key: 'never' as const, label: 'Chưa ôn' },
              ]).map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => applyReview(chip.key)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    reviewFilter === chip.key && !reviewDate
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground ml-1">
                <span className="font-semibold">Đúng ngày</span>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => {
                    setReviewDate(e.target.value);
                    if (e.target.value) setReviewFilter('');
                  }}
                  className="px-2 py-1 text-sm border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
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
                  <th className="text-right px-3 py-3 font-semibold" title="Lần ôn SRS cuối (giờ VN)">Ôn cuối</th>
                  <th className="text-right px-3 py-3 font-semibold" title="Số từ đang đến hạn ôn">Due</th>
                  <th className="text-right px-3 py-3 font-semibold">Hoạt động</th>
                  <th className="text-right px-3 py-3 font-semibold" title="Từ đã lưu (added_by)">Lưu</th>
                  <th className="text-right px-3 py-3 font-semibold" title="Từ đã ôn (SRS review ≥ 1)">Học</th>
                  <th className="text-right px-3 py-3 font-semibold" title="Tổng lượt ôn SRS">Ôn</th>
                  <th className="text-right px-3 py-3 font-semibold" title="Lần quên (Again)">Quên</th>
                  <th className="text-right px-5 py-3 font-semibold">Đã trả</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr><td colSpan={12} className="px-5 py-10 text-center text-muted-foreground">Không có khách phù hợp.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    className={`hover:bg-muted/20 transition-colors cursor-pointer ${
                      c.plan === 'free' && c.wordCount >= 150 ? 'bg-orange-500/[0.04]' : ''
                    }`}>
                    <td className="px-5 py-3">
                      <div className="font-semibold">{c.full_name || 'Chưa đặt tên'}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      {c.plan === 'free' && c.wordCount >= 200 && (
                        <div className="mt-0.5 text-[10px] font-bold text-orange-600">Upsell · ≥200 từ</div>
                      )}
                      {c.plan === 'free' && c.wordCount >= 150 && c.wordCount < 200 && (
                        <div className="mt-0.5 text-[10px] font-bold text-amber-600">Upsell · ≥150 từ</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${PLAN_STYLE[c.plan] ?? PLAN_STYLE.free}`}>{c.plan}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground">{SOURCE_LABEL[c.source]}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${LIFECYCLE_STYLE[c.lifecycle]}`}>{LIFECYCLE_LABEL[c.lifecycle]}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-xs">
                      {c.lastReviewedAt ? (
                        <span className="tabular-nums text-foreground font-medium" title={c.lastReviewedAt}>
                          {daysAgo(c.lastReviewedAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {(c.dueCount ?? 0) > 0 ? (
                        <span className="font-bold tabular-nums text-indigo-600">{c.dueCount}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-muted-foreground">{daysAgo(c.lastActive)}</td>
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${
                      c.plan === 'free' && c.wordCount >= 150 ? 'text-orange-600' : 'text-muted-foreground'
                    }`}>{c.wordCount || '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-primary">{c.learnedCount || '—'}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-muted-foreground">{c.reviewTotal || '—'}</td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-rose-600/80">{c.lapsesTotal || '—'}</td>
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
            <Stat icon={Brain} label="Từ đã ôn (SRS)" value={String(c.learnedCount ?? 0)} />
            <Stat icon={RotateCcw} label="Tổng lượt ôn" value={String(c.reviewTotal ?? 0)} />
            <Stat icon={AlertTriangle} label="Lần quên" value={String(c.lapsesTotal ?? 0)} />
            <Stat icon={Activity} label="Từ đang due" value={String(c.dueCount ?? 0)} />
            <Stat icon={BookOpen} label="Từ đã lưu" value={String(c.wordCount)} />
            <Stat icon={Target} label="Lượt quiz" value={String(c.quizCount)} />
            <Stat icon={CreditCard} label="Tổng đã trả" value={c.totalPaid ? formatVND(c.totalPaid) : '0₫'} />
            <Stat icon={Building2} label="Thuộc nhóm" value={c.groupId ? 'Có' : 'Không'} />
          </div>

          <div className="space-y-2 text-sm">
            <Row icon={Calendar} label="Ngày đăng ký" value={`${fmtDate(c.created_at)} (${daysAgo(c.created_at)})`} />
            <Row icon={RotateCcw} label="Ôn SRS cuối" value={c.lastReviewedAt ? `${fmtDate(c.lastReviewedAt)} (${daysAgo(c.lastReviewedAt)})` : 'Chưa ôn'} />
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
