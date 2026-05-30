'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, ChevronLeft, DollarSign, Users, TrendingUp, Clock,
  CheckCircle2, XCircle, Loader2, Search, Download, CreditCard,
  ArrowUpRight, ShoppingBag, Eye, Percent, Plus, Trash2, Copy
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'sonner';
import { formatVND } from '@/lib/billing';

// ─── Types ───
interface BillingStats {
  mrr: number;
  totalRevenue: number;
  totalOrders: number;
  paidUsers: number;
  totalUsers: number;
  conversionRate: number;
  pendingOrders: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  pro: number;
  premium: number;
}

interface Order {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  payment_method: string;
  payment_ref: string | null;
  status: string;
  note: string | null;
  coupon_code: string | null;
  period_months: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  paid_at: string | null;
  profiles?: { email: string; full_name: string } | null;
}

interface CouponRow {
  id: string;
  code: string;
  discount_pct: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', icon: <Clock className="h-3 w-3" /> },
    paid: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', icon: <CheckCircle2 className="h-3 w-3" /> },
    failed: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-500', icon: <XCircle className="h-3 w-3" /> },
    refunded: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-500', icon: <ArrowUpRight className="h-3 w-3" /> },
    expired: { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', icon: <Clock className="h-3 w-3" /> },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${c.bg} ${c.text}`}>
      {c.icon} {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    pro: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    premium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    school: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${colors[plan] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {plan}
    </span>
  );
}

// ─── Main ───
export default function BillingDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'coupons'>('orders');

  // Coupon state
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPct: 10, maxUses: 100, validUntil: '' });

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/stats', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats);
      setMonthly(data.monthlyBreakdown ?? []);
    } catch (err) {
      console.error('[Billing] Stats error:', err);
    }
  }, [getAuthHeaders]);

  // Load orders
  const loadOrders = useCallback(async (page = 1, status = '') => {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/billing/orders?${params}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders ?? []);
      setOrdersTotal(data.total ?? 0);
      setOrdersPage(page);
    } catch (err) {
      console.error('[Billing] Orders error:', err);
    }
  }, [getAuthHeaders]);

  // Load coupons
  const loadCoupons = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/coupons', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupons(data.coupons ?? []);
    } catch (err) {
      console.error('[Billing] Coupons error:', err);
    }
  }, [getAuthHeaders]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      await Promise.all([loadStats(), loadOrders(), loadCoupons()]);
      setIsLoading(false);
    };
    init();
  }, [loadStats, loadOrders, loadCoupons, router]);

  // Confirm order
  const handleConfirm = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/billing/orders/${orderId}/confirm`, {
        method: 'POST', headers, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✓ Order confirmed — Plan: ${data.plan}`);
      await Promise.all([loadStats(), loadOrders(ordersPage, statusFilter)]);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setConfirmingId(null);
    }
  };

  // Create coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/billing/coupons', {
        method: 'POST', headers,
        body: JSON.stringify({
          code: newCoupon.code,
          discountPct: newCoupon.discountPct,
          maxUses: newCoupon.maxUses || null,
          validUntil: newCoupon.validUntil || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Coupon "${data.coupon.code}" created!`);
      setShowCouponForm(false);
      setNewCoupon({ code: '', discountPct: 10, maxUses: 100, validUntil: '' });
      await loadCoupons();
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Delete coupon
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/billing/coupons?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      toast.success('Coupon deleted');
      await loadCoupons();
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Filtered orders
  const filteredOrders = searchQuery
    ? orders.filter(o =>
        o.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.includes(searchQuery)
      )
    : orders;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading billing data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur px-4 sm:px-6 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Admin
        </Link>
        <div className="flex items-center gap-2 font-bold text-primary">
          <CreditCard className="h-5 w-5" />
          Billing Dashboard
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
            {stats?.pendingOrders ?? 0} pending
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'MRR',
              value: formatVND(stats?.mrr ?? 0),
              icon: DollarSign,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10',
              sub: 'Monthly Recurring Revenue',
            },
            {
              label: 'Total Revenue',
              value: formatVND(stats?.totalRevenue ?? 0),
              icon: ShoppingBag,
              color: 'text-violet-500',
              bg: 'bg-violet-500/10',
              sub: `${stats?.totalOrders ?? 0} orders`,
            },
            {
              label: 'Paid Users',
              value: String(stats?.paidUsers ?? 0),
              icon: Users,
              color: 'text-sky-500',
              bg: 'bg-sky-500/10',
              sub: `of ${stats?.totalUsers ?? 0} total`,
            },
            {
              label: 'Conversion',
              value: `${stats?.conversionRate ?? 0}%`,
              icon: TrendingUp,
              color: 'text-amber-500',
              bg: 'bg-amber-500/10',
              sub: 'free → paid',
            },
            {
              label: 'Pending',
              value: String(stats?.pendingOrders ?? 0),
              icon: Clock,
              color: 'text-rose-500',
              bg: 'bg-rose-500/10',
              sub: 'awaiting confirmation',
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-background border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${kpi.bg} p-2 rounded-xl`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-extrabold tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        {monthly.length > 0 && (
          <div className="bg-background border rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg">Revenue Overview</h2>
                <p className="text-sm text-muted-foreground">Last 6 months performance</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500" /> Pro</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Premium</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatVND(Number(value) || 0)}
                  contentStyle={{
                    borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--background)', fontSize: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="pro" name="Pro" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="premium" name="Premium" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {(['orders', 'coupons'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'orders' ? 'Orders' : 'Coupons'}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <h2 className="font-bold">Orders</h2>
                <p className="text-sm text-muted-foreground">{ordersTotal} total orders</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 text-sm border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); loadOrders(1, e.target.value); }}
                  className="text-sm border rounded-xl bg-muted/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">User</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Plan</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Payment</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Date</th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        No orders found
                      </td>
                    </tr>
                  ) : filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold">{order.profiles?.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{order.profiles?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PlanBadge plan={order.plan} />
                        {order.period_months > 1 && (
                          <span className="text-[10px] text-muted-foreground ml-1">×{order.period_months}mo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatVND(order.amount)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground capitalize">
                        {order.payment_method?.replace('_', ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {order.status === 'pending' ? (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={confirmingId === order.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {confirmingId === order.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <CheckCircle2 className="h-3 w-3" />}
                            Confirm
                          </button>
                        ) : order.status === 'paid' ? (
                          <span className="text-xs text-emerald-500 flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3" /> Paid
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ordersTotal > 20 && (
              <div className="px-5 py-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {ordersPage} of {Math.ceil(ordersTotal / 20)}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={ordersPage <= 1}
                    onClick={() => loadOrders(ordersPage - 1, statusFilter)}
                    className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    disabled={ordersPage * 20 >= ordersTotal}
                    onClick={() => loadOrders(ordersPage + 1, statusFilter)}
                    className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-muted/50 disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-bold">Coupons</h2>
                <p className="text-sm text-muted-foreground">{coupons.length} total coupons</p>
              </div>
              <button
                onClick={() => setShowCouponForm(!showCouponForm)}
                className="flex items-center gap-1.5 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="h-4 w-4" /> New Coupon
              </button>
            </div>

            {/* Create coupon form */}
            {showCouponForm && (
              <form onSubmit={handleCreateCoupon} className="px-5 py-4 border-b bg-muted/20 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value }))}
                    placeholder="e.g. SUMMER50"
                    className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Discount %</label>
                  <input
                    type="number"
                    min={1} max={100}
                    value={newCoupon.discountPct}
                    onChange={e => setNewCoupon(c => ({ ...c, discountPct: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Max Uses</label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.maxUses}
                    onChange={e => setNewCoupon(c => ({ ...c, maxUses: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Expires</label>
                  <input
                    type="date"
                    value={newCoupon.validUntil}
                    onChange={e => setNewCoupon(c => ({ ...c, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary text-white font-semibold py-2 px-4 rounded-xl hover:bg-primary/90 transition-colors text-sm"
                >
                  Create
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Code</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Discount</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Usage</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Expires</th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        No coupons yet
                      </td>
                    </tr>
                  ) : coupons.map(c => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Percent className="h-3.5 w-3.5 text-violet-500" />
                          <span className="font-mono font-bold text-sm">{c.code}</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!'); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">
                        {c.discount_pct ? `${c.discount_pct}%` : formatVND(c.discount_amount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm">{c.used_count}</span>
                        <span className="text-muted-foreground">/{c.max_uses ?? '∞'}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {c.valid_until ? new Date(c.valid_until).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
