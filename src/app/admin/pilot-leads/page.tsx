'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, Clock3, Loader2, Save, Target, Users } from 'lucide-react';
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

export default function PilotLeadsAdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<PilotLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'new').length,
    qualified: leads.filter((lead) => lead.status === 'qualified').length,
    won: leads.filter((lead) => lead.status === 'won').length,
  }), [leads]);

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
    <div className="ph-no-capture min-h-dvh bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
        <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Admin
        </Link>
        <div className="font-bold">Teacher Pilot Leads</div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Tổng lead', value: stats.total, icon: Building2 },
            { label: 'Lead mới', value: stats.new, icon: Clock3 },
            { label: 'Đủ điều kiện', value: stats.qualified, icon: Target },
            { label: 'Đã chốt', value: stats.won, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border bg-background p-5 shadow-sm">
              <Icon className="size-5 text-primary" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {leads.length === 0 ? (
            <div className="rounded-2xl border bg-background p-12 text-center text-muted-foreground">Chưa có lead trung tâm.</div>
          ) : leads.map((lead) => (
            <article key={lead.id} className="grid gap-5 rounded-2xl border bg-background p-5 shadow-sm lg:grid-cols-[1fr_0.7fr_0.8fr_auto]">
              <div>
                <p className="text-lg font-black">{lead.organization}</p>
                <p className="mt-1 font-semibold">{lead.contact_name}</p>
                <a href={`mailto:${lead.email}`} className="mt-2 block text-sm text-primary hover:underline">{lead.email}</a>
                <a href={`tel:${lead.phone}`} className="mt-1 block text-sm text-primary hover:underline">{lead.phone}</a>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Nguồn: {lead.source} · {new Date(lead.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold"><Users className="size-4 text-primary" /> {lead.teacher_count} giáo viên</div>
                <div className="flex items-center gap-2 text-sm font-bold"><Building2 className="size-4 text-primary" /> {lead.student_count} học sinh</div>
                {lead.message && <p className="text-sm leading-6 text-muted-foreground">{lead.message}</p>}
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</label>
                <select
                  value={lead.status}
                  onChange={(e) => updateLocalLead(lead.id, { status: e.target.value as PilotLeadStatus })}
                  className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm font-semibold"
                >
                  {PILOT_LEAD_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                </select>
                <textarea
                  value={lead.admin_note ?? ''}
                  onChange={(e) => updateLocalLead(lead.id, { admin_note: e.target.value })}
                  placeholder="Ghi chú cuộc gọi, nhu cầu, bước tiếp theo..."
                  className="mt-3 min-h-24 w-full resize-y rounded-xl border bg-background p-3 text-sm"
                  maxLength={1000}
                />
              </div>
              <button
                onClick={() => void saveLead(lead)}
                disabled={savingId === lead.id}
                className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {savingId === lead.id ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Lưu
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
