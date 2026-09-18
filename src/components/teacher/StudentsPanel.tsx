'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { StudentProgress } from '@/lib/supabase';
import {
  Users, UserPlus, Trash2, ChevronRight, AlertCircle,
  Loader2, HelpCircle, X, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import StudentDetailSheet from './StudentDetailSheet';
import { prefetchStudent } from './teacher-cache';

export type StudentFilter = 'all' | 'at_risk' | 'cramming' | 'dormant' | 'rising_star';
export type StudentStatusKey = 'at_risk' | 'cramming' | 'dormant' | 'rising_star' | 'normal';

export interface StudentStatusInfo {
  key: StudentStatusKey;
  dot: string;
  label: string;
  badgeClass: string;
  color: string;
  tag: string;
  title: string;
  advice: string;
}

interface StudentsPanelProps {
  classroomId: string;
  classroomName: string;
  inviteCode: string;
  students: StudentProgress[];
  onRefresh: () => void;
  activeFilter?: StudentFilter;
  onFilterChange?: (filter: StudentFilter) => void;
}

export function getStudentStatus(s: StudentProgress): StudentStatusInfo {
  const isDormant = Boolean(s.last_active && Date.now() - new Date(s.last_active).getTime() > 3 * 86_400_000);
  if (isDormant) {
    return {
      key: 'dormant',
      dot: '💤',
      label: 'Vắng mặt',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'DORMANT',
      title: 'Học sinh ngừng hoạt động > 3 ngày',
      advice: 'Cần gửi tin nhắn nhắc nhở ngay để học sinh không bị rơi rụng từ vựng theo đường cong lãng quên Ebbinghaus.',
    };
  }

  const isAtRisk = Boolean((s.vms || 0) < 30 && (s.words_reviewed || 0) > 10);
  if (isAtRisk) {
    return {
      key: 'at_risk',
      dot: '🔴',
      label: 'Cần củng cố',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      tag: 'AT RISK',
      title: 'Gặp khó khăn trong việc ghi nhớ',
      advice: 'Độ bền ghi nhớ (VMS) dưới 30% dù đã học nhiều từ. Hãy giao bài tập củng cố (Drill) các từ hay quên.',
    };
  }

  const isCramming = Boolean((s.lcs || 0) < 30 && (s.avg_quiz_accuracy || 0) > 0.8 && (s.quizzes_taken || 0) > 2);
  if (isCramming) {
    return {
      key: 'cramming',
      dot: '🟡',
      label: 'Học dồn',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      tag: 'CRAMMING',
      title: 'Học sinh có dấu hiệu học dồn',
      advice: 'Điểm quiz cao nhưng tính đều đặn thấp. Học dồn chỉ nhớ ngắn hạn; cần hướng dẫn học sinh phân bổ 5-10 phút mỗi ngày.',
    };
  }

  const isRisingStar = Boolean((s.lcs || 0) > 80 && (s.avg_quiz_accuracy || 0) > 0.8);
  if (isRisingStar) {
    return {
      key: 'rising_star',
      dot: '🟢',
      label: 'Tích cực',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tag: 'RISING STAR',
      title: 'Tiến độ học xuất sắc & đều đặn',
      advice: 'Học sinh duy trì tính kỷ luật rất tốt (LCS > 80% & điểm quiz cao). Nên khen ngợi kịp thời và mở rộng danh mục từ vựng.',
    };
  }

  return {
    key: 'normal',
    dot: '⚪',
    label: 'Bình thường',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    tag: 'NORMAL',
    title: 'Tiến độ học tập ổn định',
    advice: 'Học sinh duy trì học tập bình thường. Khuyến khích tiếp tục giữ vững nhịp độ ôn tập hàng ngày.',
  };
}

export default function StudentsPanel({
  classroomId,
  classroomName,
  inviteCode,
  students,
  onRefresh,
  activeFilter: externalFilter,
  onFilterChange: externalOnFilterChange,
}: StudentsPanelProps) {
  const [internalFilter, setInternalFilter] = useState<StudentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Add / remove student modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<StudentProgress | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const currentFilter = externalFilter !== undefined ? externalFilter : internalFilter;

  const handleFilterChange = (filter: StudentFilter) => {
    if (externalOnFilterChange) {
      externalOnFilterChange(filter);
    } else {
      setInternalFilter(filter);
    }
  };

  // Sync deep link ?student=UUID on initial load and handle browser back/forward
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const studentParam = params.get('student');
      if (studentParam && students.some((s) => s.student_id === studentParam)) {
        setSelectedStudentId(studentParam);
        setIsSheetOpen(true);
      } else if (!studentParam) {
        setIsSheetOpen(false);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [students]);

  // Update URL query param when sheet opens / closes
  const openSheetForStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
    setIsSheetOpen(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('student', studentId);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('student');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? '?' + query : ''}`);
    }
  }, []);

  // Compute category counts for filter chips
  const counts = useMemo(() => {
    const res = { all: students.length, at_risk: 0, cramming: 0, dormant: 0, rising_star: 0 };
    for (const s of students) {
      const st = getStudentStatus(s);
      if (st.key === 'at_risk') res.at_risk++;
      else if (st.key === 'cramming') res.cramming++;
      else if (st.key === 'dormant') res.dormant++;
      else if (st.key === 'rising_star') res.rising_star++;
    }
    return res;
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      // Category filter
      if (currentFilter !== 'all') {
        const st = getStudentStatus(s);
        if (st.key !== currentFilter) return false;
      }
      // Text search
      if (q) {
        const name = (s.student_name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [students, currentFilter, searchQuery]);

  // Current selected student index in filteredStudents for stepper navigation
  const currentIndex = useMemo(() => {
    if (!selectedStudentId) return -1;
    return filteredStudents.findIndex((s) => s.student_id === selectedStudentId);
  }, [selectedStudentId, filteredStudents]);

  const sheetStudents = useMemo(() => {
    return filteredStudents.length > 0 && currentIndex !== -1 ? filteredStudents : students;
  }, [filteredStudents, currentIndex, students]);

  const effectiveIndex = useMemo(() => {
    if (currentIndex !== -1) return currentIndex;
    return students.findIndex((s) => s.student_id === selectedStudentId);
  }, [currentIndex, students, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.student_id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  const handleNavigate = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < sheetStudents.length) {
        const next = sheetStudents[newIndex];
        if (next) openSheetForStudent(next.student_id);
      }
    },
    [sheetStudents, openSheetForStudent]
  );

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
      if (selectedStudentId === studentToRemove.student_id) {
        closeSheet();
      }
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa học sinh';
      toast.error(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="bg-background border rounded-2xl shadow-sm overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg">Danh sách học sinh</h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
                {filteredStudents.length} / {students.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Bấm vào học sinh để mở chẩn đoán sư phạm & can thiệp nhanh
              <span className="hidden sm:inline"> &bull; Hỗ trợ phím tắt [↑/↓/C/Esc]</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm max-sm:w-full touch-manipulation"
        >
          <UserPlus className="h-4 w-4" />
          Thêm học sinh
        </button>
      </div>

      {/* Stripe-style Segment Filter Chips & Search Bar */}
      <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              currentFilter === 'all'
                ? 'bg-background text-foreground shadow-sm border-border font-bold'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/60'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[11px] font-mono tabular-nums opacity-75">({counts.all})</span>
          </button>

          <button
            onClick={() => handleFilterChange('at_risk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              currentFilter === 'at_risk'
                ? 'bg-rose-50 text-rose-800 shadow-sm border-rose-300 font-bold'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/60'
            }`}
          >
            <span>🔴 Cần củng cố</span>
            <span className="text-[11px] font-mono tabular-nums opacity-75">({counts.at_risk})</span>
          </button>

          <button
            onClick={() => handleFilterChange('cramming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              currentFilter === 'cramming'
                ? 'bg-amber-50 text-amber-800 shadow-sm border-amber-300 font-bold'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/60'
            }`}
          >
            <span>🟡 Học dồn</span>
            <span className="text-[11px] font-mono tabular-nums opacity-75">({counts.cramming})</span>
          </button>

          <button
            onClick={() => handleFilterChange('dormant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              currentFilter === 'dormant'
                ? 'bg-rose-50 text-rose-800 shadow-sm border-rose-300 font-bold'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/60'
            }`}
          >
            <span>💤 Vắng mặt</span>
            <span className="text-[11px] font-mono tabular-nums opacity-75">({counts.dormant})</span>
          </button>

          <button
            onClick={() => handleFilterChange('rising_star')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              currentFilter === 'rising_star'
                ? 'bg-emerald-50 text-emerald-800 shadow-sm border-emerald-300 font-bold'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/60'
            }`}
          >
            <span>🟢 Tích cực</span>
            <span className="text-[11px] font-mono tabular-nums opacity-75">({counts.rising_star})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border rounded-lg pl-8 pr-8 py-1.5 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Student Data Table */}
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
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center">
          <Filter className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-sm">Không tìm thấy học sinh phù hợp với bộ lọc</p>
          <p className="text-xs text-muted-foreground mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc &ldquo;Tất cả&rdquo;.
          </p>
          <button
            onClick={() => {
              handleFilterChange('all');
              setSearchQuery('');
            }}
            className="mt-4 text-xs font-semibold text-primary hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="md:hidden divide-y divide-border/60">
            {filteredStudents.map((s) => {
              const st = getStudentStatus(s);
              const isSelected = selectedStudentId === s.student_id && isSheetOpen;

              return (
                <div
                  key={s.student_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openSheetForStudent(s.student_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openSheetForStudent(s.student_id);
                    }
                  }}
                  onMouseEnter={() => prefetchStudent(s.student_id, classroomId)}
                  onTouchStart={() => prefetchStudent(s.student_id, classroomId)}
                  className={`p-4 transition-all cursor-pointer touch-manipulation active:bg-muted/60 ${
                    isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30'
                  }`}
                >
                  {/* Top Row: Avatar initial, Name, Email, CEFR badge, Status badge with dot */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                        {s.student_name?.trim()
                          ? s.student_name.trim().charAt(0).toUpperCase()
                          : s.email?.trim()
                          ? s.email.trim().charAt(0).toUpperCase()
                          : 'H'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold text-sm truncate text-foreground">
                            {s.student_name || 'Học sinh'}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tighter shrink-0 ${
                              s.cefr_level?.startsWith('C')
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : s.cefr_level?.startsWith('B')
                                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {s.cefr_level || 'A1'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.badgeClass}`}
                      >
                        <span>{st.dot}</span>
                        <span>{st.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                    </div>
                  </div>

                  {/* Metrics Row: VMS (Active/Passive) & LCS consistency (Streak flame) */}
                  <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-2 gap-2.5">
                    {/* VMS Metric */}
                    <div className="bg-muted/30 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Trí nhớ (VMS)</span>
                        <div className="font-mono tabular-nums font-bold">
                          <span className="text-emerald-600">A {s.active_vms || 0}%</span>
                          <span className="text-muted-foreground mx-1">&bull;</span>
                          <span className="text-slate-600">P {s.vms || 0}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${s.active_vms || 0}%` }}
                        />
                        <div
                          className="h-full bg-emerald-200"
                          style={{ width: `${Math.max(0, (s.vms || 0) - (s.active_vms || 0))}%` }}
                        />
                      </div>
                    </div>

                    {/* LCS Metric */}
                    <div className="bg-muted/30 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <span>Chăm chỉ</span>
                          {(s.lcs || 0) >= 70 && <span className="text-xs">🔥</span>}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-sky-700">
                          {s.lcs || 0}% ({s.quizzes_taken || 0}q)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${s.lcs || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  {/* Column 1: # */}
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  {/* Column 2: Học sinh */}
                  <th className="px-4 py-3 min-w-[200px]">Học sinh</th>
                  {/* Column 3: CEFR */}
                  <th className="px-3 py-3 text-center w-20">CEFR</th>
                  {/* Column 4: Độ bền trí nhớ (VMS · P/A) */}
                  <th className="px-4 py-3 text-center min-w-[170px]">
                    <div className="inline-flex items-center gap-1 group relative cursor-help">
                      <span>Độ bền trí nhớ (VMS · P/A)</span>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl normal-case font-normal z-50 pointer-events-none">
                        <strong>VMS (Độ bền trí nhớ theo FSRS):</strong>
                        <br />&bull; <strong>A (Active):</strong> Từ chủ động, dùng cho viết/nói.
                        <br />&bull; <strong>P (Passive):</strong> Từ thụ động, nhận biết nghĩa (&gt;15 ngày).
                      </div>
                    </div>
                  </th>
                  {/* Column 5: Độ chăm chỉ (LCS) */}
                  <th className="px-4 py-3 text-center min-w-[140px]">
                    <div className="inline-flex items-center gap-1 group relative cursor-help">
                      <span>Độ chăm chỉ (LCS)</span>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl normal-case font-normal z-50 pointer-events-none">
                        <strong>LCS (Learning Consistency Score):</strong>
                        <br />Tỷ lệ số ngày có học từ vựng trong vòng 14 ngày qua.
                      </div>
                    </div>
                  </th>
                  {/* Column 6: Tình trạng & Thao tác */}
                  <th className="px-4 py-3 text-right min-w-[140px]">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredStudents.map((s, i) => {
                  const st = getStudentStatus(s);
                  const isSelected = selectedStudentId === s.student_id && isSheetOpen;

                  return (
                    <tr
                      key={s.student_id}
                      onClick={() => openSheetForStudent(s.student_id)}
                      onMouseEnter={() => prefetchStudent(s.student_id, classroomId)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-primary/5 border-l-4 border-l-primary font-medium'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      {/* Column 1: Index */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="w-6 h-6 mx-auto rounded-md bg-muted/80 text-muted-foreground flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {i + 1}
                        </div>
                      </td>

                      {/* Column 2: Học sinh */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {s.student_name || 'Học sinh'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: CEFR */}
                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-tighter ${
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

                      {/* Column 4: Độ bền trí nhớ (VMS · P/A) with monospaced tabular numbers */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="font-mono tabular-nums text-xs font-semibold">
                            <span className="text-emerald-600 font-bold">A {s.active_vms || 0}%</span>
                            <span className="text-muted-foreground mx-1">&bull;</span>
                            <span className="text-slate-600">P {s.vms || 0}%</span>
                          </div>
                          <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${s.active_vms || 0}%` }}
                            />
                            <div
                              className="h-full bg-emerald-200"
                              style={{ width: `${Math.max(0, (s.vms || 0) - (s.active_vms || 0))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 5: Độ chăm chỉ (LCS) with monospaced tabular numbers */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono tabular-nums text-xs font-semibold text-sky-700">
                            {s.lcs || 0}% &bull; {s.quizzes_taken || 0} bài quiz
                          </span>
                          <div className="w-20 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${s.lcs || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Linear-style Status Dots & Action */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${st.badgeClass}`}
                          >
                            <span>{st.dot}</span>
                            <span>{st.label}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Linear/Raycast Slide-Over Peek Sheet */}
      <StudentDetailSheet
        student={selectedStudent}
        classroomId={classroomId}
        classroomName={classroomName}
        allStudents={sheetStudents}
        currentIndex={effectiveIndex}
        isOpen={isSheetOpen}
        onClose={closeSheet}
        onNavigate={handleNavigate}
      />

      {/* MODAL: Thêm học sinh */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
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
                  className="w-full border rounded-xl px-4 py-2.5 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  className="w-full border rounded-xl px-4 py-2.5 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          <div className="bg-background border rounded-2xl w-full max-w-sm p-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
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
