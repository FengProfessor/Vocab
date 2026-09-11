'use client';

import { useState } from 'react';
import type { StudentProgress } from '@/lib/supabase';
import {
  Users, UserPlus, Trash2, ChevronRight, AlertCircle,
  Loader2, HelpCircle, X, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';

interface StudentsPanelProps {
  classroomId: string;
  classroomName: string;
  inviteCode: string;
  students: StudentProgress[];
  onRefresh: () => void;
}

export default function StudentsPanel({
  classroomId,
  classroomName,
  inviteCode,
  students,
  onRefresh,
}: StudentsPanelProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remove confirmation modal state
  const [studentToRemove, setStudentToRemove] = useState<StudentProgress | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = studentEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/teacher/students/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          email,
          name: studentName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể thêm học sinh');
      }

      toast.success(data.message || `Đã thêm ${email} vào lớp và kích hoạt 1 năm Pro!`);
      setIsAddModalOpen(false);
      setStudentEmail('');
      setStudentName('');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi thêm học sinh';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsRemoving(true);
    try {
      const res = await authFetch('/api/teacher/students/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          studentId: studentToRemove.student_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể xóa học sinh');
      }

      toast.success(data.message || 'Đã xóa học sinh khỏi lớp');
      setStudentToRemove(null);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa học sinh';
      toast.error(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg">Danh sách học sinh</h2>
            <p className="text-xs text-muted-foreground">
              {students.length} học sinh trong lớp &bull; Tự động cấp 1 năm Pro khi thêm
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Thêm học sinh
        </button>
      </div>

      {students.length === 0 ? (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-semibold text-foreground text-base">Chưa có học sinh nào trong lớp</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Bấm nút &ldquo;Thêm học sinh&rdquo; để thêm trực tiếp bằng email (tự cấp 1 năm Pro), hoặc gửi mã mời{' '}
            <span className="font-mono font-bold text-primary">{inviteCode}</span> cho học sinh.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/20 transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Thêm học sinh đầu tiên
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5 min-w-[200px]">Học sinh</th>
                <th className="px-4 py-3.5 text-center min-w-[120px]">Gói học</th>
                <th className="px-4 py-3.5 text-center min-w-[110px]">Ngày tham gia</th>
                <th className="px-4 py-3.5 text-center w-20">CEFR</th>
                <th className="px-4 py-3.5 text-center min-w-[170px]">
                  <div className="inline-flex items-center gap-1 group relative cursor-help">
                    <span>Độ bền trí nhớ (VMS · P/A)</span>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl normal-case font-normal z-50">
                      <strong>VMS (Độ bền trí nhớ & P/A):</strong>
                      <br />&bull; <strong>Active (A):</strong> Từ chủ động, có thể vận dụng vào thực hành viết/nói.
                      <br />&bull; <strong>Passive (P):</strong> Từ thụ động, nhận biết nghĩa (&gt;15 ngày theo FSRS).
                    </div>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center min-w-[140px]">
                  <div className="inline-flex items-center gap-1 group relative cursor-help">
                    <span>Độ chăm chỉ (LCS)</span>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl normal-case font-normal z-50">
                      <strong>LCS (Learning Consistency Score):</strong>
                      <br />Độ chăm chỉ: Tỷ lệ số ngày có học từ vựng trong vòng 14 ngày qua.
                    </div>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-center min-w-[130px]">Tình trạng</th>
                <th className="px-5 py-3.5 text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s, i) => {
                const isDormant = s.last_active && Date.now() - new Date(s.last_active).getTime() > 3 * 86_400_000;
                const isCramming = (s.lcs || 0) < 30 && (s.avg_quiz_accuracy || 0) > 0.8 && (s.quizzes_taken || 0) > 2;
                const isRisingStar = (s.lcs || 0) > 80 && (s.avg_quiz_accuracy || 0) > 0.8;
                const isAtRisk = (s.vms || 0) < 30 && (s.words_reviewed || 0) > 10;

                const isPro = s.plan === 'pro' || s.plan === 'premium';

                return (
                  <tr key={s.student_id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-center">
                      <div className="w-7 h-7 mx-auto rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/teacher/student/${s.student_id}?class=${classroomId}`}
                        className="font-semibold text-sm hover:text-primary transition-colors block truncate"
                      >
                        {s.student_name || 'Học sinh'}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wide ${
                            isPro
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isPro && <ShieldCheck className="h-3 w-3" />}
                          {isPro ? 'Pro' : 'Free'}
                        </span>
                        {isPro && s.plan_expires_at && (
                          <span className="text-[10px] text-muted-foreground mt-0.5" title={`Hết hạn: ${formatDate(s.plan_expires_at)}`}>
                            Hạn: {formatDate(s.plan_expires_at)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-muted-foreground">
                      {formatDate(s.joined_at)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-tighter ${
                          s.cefr_level?.startsWith('C')
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : s.cefr_level?.startsWith('B')
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {s.cefr_level || 'A1'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-emerald-600">{s.active_vms || 0}%</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Chủ động</span>
                        </div>
                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden flex">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.active_vms || 0}%` }} />
                          <div
                            className="h-full bg-emerald-200"
                            style={{ width: `${Math.max(0, (s.vms || 0) - (s.active_vms || 0))}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Thụ động: {s.vms || 0}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-sky-600">{s.lcs || 0}%</span>
                        <div className="w-20 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${s.lcs || 0}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {s.quizzes_taken || 0} bài quiz
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isDormant ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Vắng mặt
                        </span>
                      ) : isRisingStar ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Tiến bộ nhanh
                        </span>
                      ) : isCramming ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          Học dồn
                        </span>
                      ) : isAtRisk ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          Cần củng cố
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Bình thường
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/teacher/student/${s.student_id}?class=${classroomId}`}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                          title="Xem chi tiết & chẩn đoán sư phạm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setStudentToRemove(s)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Xóa khỏi lớp"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Thêm học sinh */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => !isSubmitting && setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Thêm học sinh vào lớp</h3>
                <p className="text-xs text-muted-foreground">Lớp: {classroomName}</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 flex items-start gap-2.5 text-emerald-800">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Đặc quyền giáo viên:</strong> Học sinh sẽ được tự động tạo tài khoản (nếu chưa có) và{' '}
                <strong>tặng 1 năm gói Pro học tập không giới hạn</strong>.
              </div>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Email học sinh <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="vidu: hocsinh@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Họ và tên (không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="vidu: Nguyễn Minh Anh"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !studentEmail.trim()}
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Thêm & Tặng 1 năm Pro
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa học sinh khỏi lớp */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <div className="w-11 h-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>

            <h3 className="font-bold text-lg text-center mb-2">Xóa học sinh khỏi lớp?</h3>
            <p className="text-xs text-muted-foreground text-center leading-relaxed mb-6">
              Bạn có chắc muốn xóa <strong className="text-foreground">{studentToRemove.student_name || studentToRemove.email}</strong> khỏi lớp{' '}
              <strong className="text-foreground">{classroomName}</strong>? Học sinh sẽ không còn truy cập được từ vựng của lớp này.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                disabled={isRemoving}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border rounded-xl hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveStudent}
                disabled={isRemoving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-destructive text-destructive-foreground font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-destructive/90 transition-all disabled:opacity-50"
              >
                {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
