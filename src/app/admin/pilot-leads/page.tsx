'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  GraduationCap,
  Loader2,
  MessageSquare,
  Phone,
  RotateCcw,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PILOT_LEAD_STATUSES, type PilotLead, type PilotLeadStatus } from '@/lib/pilot-sales';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<PilotLeadStatus, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  qualified: 'Đủ điều kiện',
  won: 'Đã chốt',
  lost: 'Không chốt',
};

export type SourceFilter = 'all' | 'tiktok_khaigiang_0509' | 'teacher_landing';
export type StatusFilter = 'all' | PilotLeadStatus;

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function parseNeedConsulting(lead: PilotLead): boolean {
  if (!lead.message) return false;
  const lower = lead.message.toLowerCase();
  return (
    lower.includes('cần tư vấn') ||
    lower.includes('can tu van') ||
    lower.includes('needconsulting: true') ||
    lower.includes('needconsulting:true') ||
    lower.includes('"needconsulting": true') ||
    lower.includes('"needconsulting":true')
  );
}

export default function PilotLeadsAdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<PilotLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filter & Search states
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [onlyNeedConsulting, setOnlyNeedConsulting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  }, []);

  const loadLeads = useCallback(async () => {
    const headers = await getHeaders();
    const res = await fetch('/api/admin/pilot-leads', { headers });
    if (res.status === 403) {
      router.replace('/');
      return;
    }
    const data = await res.json() as { leads?: PilotLead[]; error?: string };
    if (!res.ok) throw new Error(data.error || 'Không thể tải lead.');
    setLeads(data.leads ?? []);
  }, [getHeaders, router]);

  useEffect(() => {
    loadLeads()
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
      .finally(() => setIsLoading(false));
  }, [loadLeads]);

  const stats = useMemo(() => {
    const total = leads.length;
    const khaigiang = leads.filter((l) => l.source === 'tiktok_khaigiang_0509').length;
    const teacher = leads.filter((l) => l.source !== 'tiktok_khaigiang_0509').length;
    const needConsulting = leads.filter(parseNeedConsulting).length;
    const newCount = leads.filter((l) => l.status === 'new').length;
    const qualified = leads.filter((l) => l.status === 'qualified').length;
    const won = leads.filter((l) => l.status === 'won').length;

    return { total, khaigiang, teacher, needConsulting, newCount, qualified, won };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Source filter
      if (sourceFilter === 'tiktok_khaigiang_0509') {
        if (lead.source !== 'tiktok_khaigiang_0509') return false;
      } else if (sourceFilter === 'teacher_landing') {
        if (lead.source === 'tiktok_khaigiang_0509') return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        if (lead.status !== statusFilter) return false;
      }

      // 3. Need consulting filter
      if (onlyNeedConsulting) {
        if (!parseNeedConsulting(lead)) return false;
      }

      // 4. Live Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const qNorm = removeVietnameseTones(q);
        const qDigits = q.replace(/\D/g, '');

        const phone = lead.phone.toLowerCase();
        const phoneDigits = lead.phone.replace(/\D/g, '');
        const phoneMatch = phone.includes(q) || (qDigits.length >= 3 && phoneDigits.includes(qDigits));

        const name = lead.contact_name.toLowerCase();
        const nameMatch = name.includes(q) || removeVietnameseTones(name).includes(qNorm);

        const org = lead.organization.toLowerCase();
        const orgMatch = org.includes(q) || removeVietnameseTones(org).includes(qNorm);

        const emailMatch = lead.email.toLowerCase().includes(q);

        const msg = (lead.message ?? '').toLowerCase();
        const msgMatch = msg.includes(q) || removeVietnameseTones(msg).includes(qNorm);

        const note = (lead.admin_note ?? '').toLowerCase();
        const noteMatch = note.includes(q) || removeVietnameseTones(note).includes(qNorm);

        if (!phoneMatch && !nameMatch && !orgMatch && !emailMatch && !msgMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    });
  }, [leads, sourceFilter, statusFilter, onlyNeedConsulting, searchQuery]);

  const hasActiveFilters = sourceFilter !== 'all' || statusFilter !== 'all' || onlyNeedConsulting || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSourceFilter('all');
    setStatusFilter('all');
    setOnlyNeedConsulting(false);
    setSearchQuery('');
  };

  const exportToCsv = () => {
    if (filteredLeads.length === 0) {
      toast.error('Không có lead nào để xuất file.');
      return;
    }

    const headers = [
      'STT',
      'Thời gian tạo',
      'Nguồn lead',
      'Họ và tên',
      'Số điện thoại',
      'Link Zalo',
      'Email',
      'Đơn vị / Phân loại',
      'Số GV',
      'Số HS',
      'Cần tư vấn',
      'Trạng thái',
      'Ghi chú admin',
      'Chi tiết nội dung',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredLeads.map((lead, idx) => {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const zaloLink = cleanPhone ? `https://zalo.me/${cleanPhone}` : '';
      const needConsulting = parseNeedConsulting(lead) ? 'CÓ (Ưu tiên)' : 'Không';
      const created = new Date(lead.created_at).toLocaleString('vi-VN');
      const statusLabel = STATUS_LABELS[lead.status] || lead.status;

      return [
        idx + 1,
        created,
        lead.source,
        lead.contact_name,
        lead.phone,
        zaloLink,
        lead.email,
        lead.organization,
        lead.teacher_count,
        lead.student_count,
        needConsulting,
        statusLabel,
        lead.admin_note ?? '',
        lead.message ?? '',
      ].map(escapeCsv).join(',');
    });

    // UTF-8 BOM (\uFEFF) ensures Vietnamese characters display perfectly in Microsoft Excel
    const bom = '\uFEFF';
    const csvContent = bom + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    link.download = `leads_${sourceFilter}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất ${filteredLeads.length} lead thành công (chuẩn UTF-8 Excel).`);
  };

  const updateLocalLead = (id: string, updates: Partial<PilotLead>) => {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...updates } : lead));
  };

  const saveLead = async (lead: PilotLead) => {
    setSavingId(lead.id);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/admin/pilot-leads', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id: lead.id, status: lead.status, adminNote: lead.admin_note }),
      });
      const data = await res.json() as { lead?: PilotLead; error?: string };
      if (!res.ok || !data.lead) throw new Error(data.error || 'Không thể cập nhật lead.');
      updateLocalLead(lead.id, data.lead);
      toast.success('Đã cập nhật lead.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-dvh items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="ph-no-capture min-h-dvh bg-muted/40 pb-12">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Admin
          </Link>
          <div className="font-bold">Quản trị Pilot & Campaign Leads</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadLeads().then(() => toast.success('Đã tải lại dữ liệu mới nhất.'))}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Tải lại danh sách"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Tải lại</span>
          </button>
          <button
            onClick={exportToCsv}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
            title="Xuất file CSV chuẩn UTF-8 BOM cho Excel"
          >
            <Download className="size-3.5" />
            <span>Xuất CSV ({filteredLeads.length})</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Tổng lead', value: stats.total, icon: Building2, color: 'text-primary' },
            { label: 'Khai Giảng 05/09', value: stats.khaigiang, icon: GraduationCap, color: 'text-emerald-600' },
            { label: 'Cần tư vấn', value: stats.needConsulting, icon: Flame, color: 'text-rose-600' },
            { label: 'Lead mới', value: stats.newCount, icon: Clock3, color: 'text-amber-600' },
            { label: 'Đã chốt', value: stats.won, icon: CheckCircle2, color: 'text-teal-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border bg-background p-4 shadow-sm">
              <Icon className={`size-5 ${color}`} />
              <p className="mt-3 text-2xl sm:text-3xl font-black">{value}</p>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          <button
            onClick={() => setSourceFilter('all')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              sourceFilter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border'
            }`}
          >
            <span>Tất cả</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceFilter === 'all' ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
              {stats.total}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter('tiktok_khaigiang_0509')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              sourceFilter === 'tiktok_khaigiang_0509'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border'
            }`}
          >
            <GraduationCap className="size-4" />
            <span>Chiến dịch Khai Giảng 05/09</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceFilter === 'tiktok_khaigiang_0509' ? 'bg-white/20' : 'bg-muted'}`}>
              {stats.khaigiang}
            </span>
          </button>
          <button
            onClick={() => setSourceFilter('teacher_landing')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              sourceFilter === 'teacher_landing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border'
            }`}
          >
            <Building2 className="size-4" />
            <span>Giáo viên / Trung tâm</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceFilter === 'teacher_landing' ? 'bg-white/20' : 'bg-muted'}`}>
              {stats.teacher}
            </span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, SĐT, tỉnh thành, trường, trình độ, ghi chú..."
              className="h-10 w-full rounded-xl border bg-muted/30 pl-10 pr-9 text-sm focus:border-primary focus:bg-background focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Xóa tìm kiếm"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-10 rounded-xl border bg-background px-3 text-sm font-semibold focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              {PILOT_LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            {/* Need consulting quick toggle */}
            <button
              onClick={() => setOnlyNeedConsulting((prev) => !prev)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition ${
                onlyNeedConsulting
                  ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              title="Lọc các học viên cần Thầy Phong tư vấn trực tiếp"
            >
              <Flame className={`size-4 ${onlyNeedConsulting ? 'text-white' : 'text-rose-500'}`} />
              <span>Chỉ hiện Cần tư vấn</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${onlyNeedConsulting ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600'}`}>
                {stats.needConsulting}
              </span>
            </button>

            {/* Clear filters if active */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="size-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
          <span>
            Hiển thị <span className="text-foreground font-bold">{filteredLeads.length}</span> / {leads.length} lead
          </span>
          {hasActiveFilters && (
            <span className="text-primary cursor-pointer hover:underline" onClick={resetFilters}>
              Xóa tất cả bộ lọc
            </span>
          )}
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {leads.length === 0 ? (
            <div className="rounded-2xl border bg-background p-12 text-center text-muted-foreground">
              Chưa có lead nào trong hệ thống.
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="rounded-2xl border bg-background p-12 text-center space-y-3">
              <p className="text-base font-bold text-foreground">Không tìm thấy lead nào phù hợp.</p>
              <p className="text-sm text-muted-foreground">Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc.</p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition shadow-sm"
              >
                <RotateCcw className="size-4" />
                <span>Đặt lại bộ lọc</span>
              </button>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const cleanPhone = lead.phone.replace(/\D/g, '');
              const zaloUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : null;
              const isNeedConsulting = parseNeedConsulting(lead);
              const isKhaiGiang = lead.source === 'tiktok_khaigiang_0509';
              const isVirtualEmail = lead.email.endsWith('@khaigiang0509.lingopro.vn');

              return (
                <article
                  key={lead.id}
                  className={`grid gap-5 rounded-2xl border bg-background p-5 shadow-sm transition lg:grid-cols-[1fr_0.85fr_0.75fr_auto] ${
                    isNeedConsulting ? 'border-rose-500/40 bg-rose-500/[0.02]' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isKhaiGiang ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <GraduationCap className="size-3" /> Khai Giảng 05/09
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          <Building2 className="size-3" /> Đối tác / Trung tâm
                        </span>
                      )}

                      {isNeedConsulting && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/40 px-2.5 py-0.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                          <Flame className="size-3 fill-rose-500" /> Cần tư vấn (Ưu tiên)
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-lg font-black text-foreground">{lead.organization}</p>
                      <p className="mt-0.5 text-base font-bold text-foreground/90">{lead.contact_name}</p>
                    </div>

                    {/* Direct Contact Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {zaloUrl && (
                        <a
                          href={zaloUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0068FF] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0055d4] transition active:scale-95"
                          title={`Mở Zalo chat với ${lead.contact_name}`}
                        >
                          <MessageSquare className="size-3.5" />
                          <span>Chat Zalo</span>
                        </a>
                      )}

                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold hover:bg-muted transition"
                        title={`Gọi điện: ${lead.phone}`}
                      >
                        <Phone className="size-3.5 text-primary" />
                        <span>{lead.phone}</span>
                      </a>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {!isVirtualEmail ? (
                        <p>
                          Email:{' '}
                          <a href={`mailto:${lead.email}`} className="text-primary hover:underline font-medium">
                            {lead.email}
                          </a>
                        </p>
                      ) : (
                        <p className="text-muted-foreground/80 italic">Đăng ký qua Zalo/SĐT (Không có email)</p>
                      )}
                      <p>
                        Nguồn: <span className="font-mono">{lead.source}</span> · {new Date(lead.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Details / Content */}
                  <div className="space-y-3">
                    {!isKhaiGiang && (
                      <div className="flex flex-wrap gap-4 text-sm font-bold">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-4 text-primary" /> {lead.teacher_count} giáo viên
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-4 text-primary" /> {lead.student_count} học sinh
                        </div>
                      </div>
                    )}

                    {lead.message && (
                      <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-foreground whitespace-pre-line">
                        {lead.message}
                      </div>
                    )}
                  </div>

                  {/* Status & Notes */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</label>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLocalLead(lead.id, { status: e.target.value as PilotLeadStatus })}
                      className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm font-semibold focus:border-primary focus:outline-none"
                    >
                      {PILOT_LEAD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={lead.admin_note ?? ''}
                      onChange={(e) => updateLocalLead(lead.id, { admin_note: e.target.value })}
                      placeholder="Ghi chú cuộc gọi, nhu cầu, phân loại..."
                      className="mt-3 min-h-24 w-full resize-y rounded-xl border bg-background p-3 text-xs leading-relaxed focus:border-primary focus:outline-none"
                      maxLength={1000}
                    />
                  </div>

                  {/* Save action */}
                  <div className="flex lg:flex-col lg:justify-end">
                    <button
                      onClick={() => void saveLead(lead)}
                      disabled={savingId === lead.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition shadow-sm w-full lg:w-auto"
                    >
                      {savingId === lead.id ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      <span>Lưu</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
