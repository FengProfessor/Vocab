'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronLeft, Trophy, Plus, Users, Calendar, Banknote,
  Eye, Pencil, Loader2, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

interface ChallengeRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_days: number;
  deposit_amount: number;
  refund_pct: number;
  bonus_pro_days: number;
  daily_criteria: Record<string, number>;
  registration_opens_at: string;
  registration_closes_at: string;
  starts_at: string;
  ends_at: string;
  max_participants: number | null;
  status: string;
  created_at: string;
  participant_count?: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  open: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  open: 'Đang mở',
  active: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + '₫';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** Simple Vietnamese slug generator */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function AdminChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_days: 90,
    deposit_amount: 300000,
    refund_pct: 100,
    bonus_pro_days: 90,
    min_srs_reviews: 10,
    min_quizzes: 1,
    min_reading_sessions: 0,
    min_listening_sessions: 0,
    registration_opens_at: '',
    registration_closes_at: '',
    starts_at: '',
    ends_at: '',
    max_participants: '',
    status: 'draft' as string,
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      const res = await authFetch('/api/challenges?includeAll=1');
      const json = await res.json();
      if (json.success) {
        setChallenges(json.challenges || []);
      }
    } catch {
      toast.error('Không tải được danh sách chiến dịch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch');
      return;
    }
    setIsSaving(true);
    try {
      const res = await authFetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: slugify(form.name.trim()),
          description: form.description.trim() || null,
          duration_days: form.duration_days,
          deposit_amount: form.deposit_amount,
          refund_pct: form.refund_pct,
          bonus_pro_days: form.bonus_pro_days,
          daily_criteria: {
            min_srs_reviews: form.min_srs_reviews,
            min_quizzes: form.min_quizzes,
            min_reading_sessions: form.min_reading_sessions,
            min_listening_sessions: form.min_listening_sessions,
          },
          registration_opens_at: form.registration_opens_at || new Date().toISOString(),
          registration_closes_at: form.registration_closes_at || new Date(Date.now() + 7 * 86400000).toISOString(),
          starts_at: form.starts_at || new Date(Date.now() + 7 * 86400000).toISOString(),
          ends_at: form.ends_at || new Date(Date.now() + (7 + form.duration_days) * 86400000).toISOString(),
          max_participants: form.max_participants ? parseInt(form.max_participants) : null,
          status: form.status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Tạo chiến dịch thành công!');
        setShowCreate(false);
        loadChallenges();
      } else {
        toast.error(json.error || 'Lỗi tạo chiến dịch');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/40">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = challenges.filter(c => c.status === 'active').length;
  const totalParticipants = challenges.reduce((sum, c) => sum + (c.participant_count || 0), 0);

  return (
    <div className="min-h-dvh bg-muted/40 font-sans">
      <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur px-4 sm:px-6 flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Admin
        </Link>
        <div className="flex items-center gap-2 font-bold text-amber-700">
          <Trophy className="h-5 w-5" />
          Quản lý Chiến dịch
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="ml-auto flex items-center gap-1.5 text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" /> Tạo chiến dịch
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng chiến dịch', value: challenges.length, icon: Trophy, color: 'text-amber-600 bg-amber-50' },
            { label: 'Đang diễn ra', value: activeCount, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
            { label: 'Tổng người tham gia', value: totalParticipants, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Tổng tiền cọc', value: formatVND(challenges.reduce((s, c) => s + (c.deposit_amount * (c.participant_count || 0)), 0)), icon: Banknote, color: 'text-violet-600 bg-violet-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-background border rounded-2xl p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-background border rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-lg">Tạo chiến dịch mới</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên chiến dịch *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Thử thách 90 ngày"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="open">Mở đăng ký</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả chiến dịch..."
                rows={2}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Số ngày</label>
                <input
                  type="number"
                  value={form.duration_days}
                  onChange={e => setForm(f => ({ ...f, duration_days: parseInt(e.target.value) || 90 }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phí cam kết (VNĐ)</label>
                <input
                  type="number"
                  value={form.deposit_amount}
                  onChange={e => setForm(f => ({ ...f, deposit_amount: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">% hoàn phí</label>
                <input
                  type="number"
                  value={form.refund_pct}
                  onChange={e => setForm(f => ({ ...f, refund_pct: parseInt(e.target.value) || 100 }))}
                  min={0} max={100}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngày Pro thưởng</label>
                <input
                  type="number"
                  value={form.bonus_pro_days}
                  onChange={e => setForm(f => ({ ...f, bonus_pro_days: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Tiêu chí hằng ngày</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground">Ôn từ vựng (tối thiểu)</label>
                  <input type="number" value={form.min_srs_reviews}
                    onChange={e => setForm(f => ({ ...f, min_srs_reviews: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bài quiz (tối thiểu)</label>
                  <input type="number" value={form.min_quizzes}
                    onChange={e => setForm(f => ({ ...f, min_quizzes: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bài đọc (tối thiểu)</label>
                  <input type="number" value={form.min_reading_sessions}
                    onChange={e => setForm(f => ({ ...f, min_reading_sessions: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bài nghe (tối thiểu)</label>
                  <input type="number" value={form.min_listening_sessions}
                    onChange={e => setForm(f => ({ ...f, min_listening_sessions: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Mở đăng ký</label>
                <input type="datetime-local" value={form.registration_opens_at}
                  onChange={e => setForm(f => ({ ...f, registration_opens_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Đóng đăng ký</label>
                <input type="datetime-local" value={form.registration_closes_at}
                  onChange={e => setForm(f => ({ ...f, registration_closes_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ngày bắt đầu</label>
                <input type="datetime-local" value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ngày kết thúc</label>
                <input type="datetime-local" value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="flex items-center gap-2 bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Tạo chiến dịch
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Challenges list */}
        <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-bold">Danh sách chiến dịch</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Tên</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Thời gian</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Phí cam kết</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Người tham gia</th>
                  <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {challenges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      Chưa có chiến dịch nào. Nhấn &quot;Tạo chiến dịch&quot; để bắt đầu.
                    </td>
                  </tr>
                ) : challenges.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/challenge/${c.slug}`} className="font-semibold text-primary hover:underline">
                        {c.name}
                      </Link>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{c.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>
                        {c.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> :
                         c.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> :
                         c.status === 'cancelled' ? <XCircle className="h-3 w-3" /> :
                         <Clock className="h-3 w-3" />}
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      <div className="text-xs">{c.duration_days} ngày</div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {formatDate(c.starts_at)} → {formatDate(c.ends_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">
                      {formatVND(c.deposit_amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold">{c.participant_count || 0}</span>
                      {c.max_participants && <span className="text-muted-foreground">/{c.max_participants}</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
