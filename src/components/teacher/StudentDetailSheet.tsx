'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import type { StudentProgress } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  X, ChevronUp, ChevronDown, ExternalLink, Sparkles, MessageSquare,
  Copy, CheckCircle2, AlertCircle, Plus, Loader2,
  ShieldCheck, Zap, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { getStudentStatus } from './StudentsPanel';
import {
  getCachedStudentDetail,
  setCachedStudentDetail,
  getCachedStudentErrors,
  setCachedStudentErrors,
  getCachedAiInsight,
  setCachedAiInsight,
  prefetchStudent,
  type HistoryPoint,
  type QuizPoint,
  type StudentErrorItem,
} from './teacher-cache';

// Lazy-load heavy chart libraries inside the sheet so initial teacher page loads at lightning speed
const StudentVmsLineChart = dynamic(
  () => import('@/components/charts/StudentProgressCharts').then((m) => m.StudentVmsLineChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" /> }
);
const StudentQuizBarChart = dynamic(
  () => import('@/components/charts/StudentProgressCharts').then((m) => m.StudentQuizBarChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" /> }
);
const StudentCompetencyRadarChart = dynamic(
  () => import('@/components/charts/StudentProgressCharts').then((m) => m.StudentCompetencyRadarChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" /> }
);

interface StudentDetailSheetProps {
  student: StudentProgress | null;
  classroomId: string;
  classroomName: string;
  allStudents: StudentProgress[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback to execCommand below
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const success = document.execCommand('copy');
    document.body.removeChild(ta);
    return success;
  } catch {
    return false;
  }
}

type SheetTab = 'intervention' | 'charts' | 'errors';

export default function StudentDetailSheet({
  student,
  classroomId,
  classroomName,
  allStudents,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: StudentDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>('intervention');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [quizzes, setQuizzes] = useState<QuizPoint[]>([]);
  const [errorsList, setErrorsList] = useState<StudentErrorItem[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAssigningDrill, setIsAssigningDrill] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [, startTransition] = useTransition();

  // Active student ref to prevent async race conditions when navigating rapidly
  const currentStudentIdRef = useRef<string | undefined>(student?.student_id);
  useEffect(() => {
    currentStudentIdRef.current = student?.student_id;
  }, [student?.student_id]);

  // Pedagogical status from shared single source of truth
  const status = student ? getStudentStatus(student) : {
    key: 'normal' as const,
    dot: '⚪',
    label: 'Bình thường',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    tag: 'NORMAL',
    title: 'Tiến độ học tập ổn định',
    advice: 'Học sinh duy trì học tập bình thường.',
  };

  const getFallbackSuggestion = useCallback(() => {
    if (!student) return '';
    const firstName = student.student_name.split(' ')[0] || 'em';
    if (status.key === 'dormant') {
      return `Chào ${firstName}! Thầy thấy em đã vài ngày chưa vào ôn tập từ vựng. Mỗi ngày chỉ cần 5 phút là đủ để giữ vững chuỗi học và không bị quên từ. Cố lên nhé!`;
    }
    if (status.key === 'rising_star') {
      return `Chào ${firstName}! Kết quả học tập của em rất ấn tượng, đặc biệt là tính kỷ luật (chăm chỉ ${student.lcs}%). Tiếp tục phát huy phong độ này nhé!`;
    }
    if (status.key === 'cramming') {
      return `Chào ${firstName}! Điểm bài quiz của em rất tốt, nhưng thầy thấy em đang có xu hướng học dồn. Hãy thử chia nhỏ thời gian ra ôn mỗi ngày 5-10 phút để nhớ sâu hơn nhé.`;
    }
    if (status.key === 'at_risk') {
      return `Chào ${firstName}! Thầy thấy độ bền ghi nhớ từ vựng của em (VMS ${student.vms}%) đang hơi thấp. Em nên dành thêm chút thời gian xem lại các từ khó hay sai nhé.`;
    }
    return `Chào ${firstName}! Thầy đang theo dõi tiến độ của em. Nếu gặp khó khăn hay cần hỗ trợ thêm phần từ vựng nào thì nhắn thầy ngay nhé!`;
  }, [student, status.key]);

  // 1. Fetch AI Coaching Suggestion with Caching & Race Condition Guard
  const loadAiSuggestion = useCallback(async (currentStudent: StudentProgress) => {
    const sId = currentStudent.student_id;
    const cached = getCachedAiInsight(sId);
    if (cached) {
      setAiSuggestion(cached);
      return;
    }

    setAiSuggestion('');
    setIsAiLoading(true);
    try {
      const res = await authFetch('/api/teacher/coaching-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: currentStudent.student_name,
          vms: currentStudent.vms,
          lcs: currentStudent.lcs,
          tag: status.tag,
          msg: status.title,
          cefr: currentStudent.cefr_level || 'A1',
          activeVms: currentStudent.active_vms || 0,
          tesolFocus: true,
        }),
      });
      const json = await res.json() as { suggestion?: string };
      const suggestionText = json.suggestion || getFallbackSuggestion();
      setCachedAiInsight(sId, suggestionText);
      if (currentStudentIdRef.current === sId) {
        setAiSuggestion(suggestionText);
      }
    } catch {
      if (currentStudentIdRef.current === sId) {
        setAiSuggestion(getFallbackSuggestion());
      }
    } finally {
      if (currentStudentIdRef.current === sId) {
        setIsAiLoading(false);
      }
    }
  }, [status.tag, status.title, getFallbackSuggestion]);

  // 2. Fetch Detail & Quizzes with in-memory caching & Race Condition Guard
  const loadDetail = useCallback(async (studentId: string) => {
    const cached = getCachedStudentDetail(studentId, classroomId);
    if (cached) {
      setHistory(cached.history || []);
      setQuizzes(cached.quizzes || []);
      return;
    }

    setHistory([]);
    setQuizzes([]);
    setIsLoadingDetail(true);
    try {
      const res = await authFetch(`/api/teacher/student-detail?studentId=${studentId}&classroomId=${classroomId}`);
      const json = await res.json();
      if (json.success) {
        setCachedStudentDetail(studentId, classroomId, json);
        if (currentStudentIdRef.current === studentId) {
          setHistory(json.history || []);
          setQuizzes(json.quizzes || []);
        }
      }
    } catch (err) {
      console.error('[StudentDetailSheet] Error loading detail:', err);
    } finally {
      if (currentStudentIdRef.current === studentId) {
        setIsLoadingDetail(false);
      }
    }
  }, [classroomId]);

  // 3. Fetch Struggling Words Errors with in-memory caching & Race Condition Guard
  const loadErrors = useCallback(async (studentId: string) => {
    const cached = getCachedStudentErrors(studentId, classroomId);
    if (cached) {
      setErrorsList(cached);
      return;
    }

    setErrorsList([]);
    setIsLoadingErrors(true);
    try {
      const res = await authFetch(`/api/teacher/student-errors?studentId=${studentId}&classroomId=${classroomId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCachedStudentErrors(studentId, classroomId, json.data);
        if (currentStudentIdRef.current === studentId) {
          setErrorsList(json.data);
        }
      }
    } catch (err) {
      console.error('[StudentDetailSheet] Error loading errors:', err);
    } finally {
      if (currentStudentIdRef.current === studentId) {
        setIsLoadingErrors(false);
      }
    }
  }, [classroomId]);

  // When student changes, load data and prefetch adjacent students
  useEffect(() => {
    if (!student || !isOpen) return;

    // Fast state transition
    startTransition(() => {
      void loadDetail(student.student_id);
      void loadErrors(student.student_id);
      void loadAiSuggestion(student);
    });

    // Background prefetching for next & previous student in the list
    if (currentIndex > 0) {
      const prevStudent = allStudents[currentIndex - 1];
      if (prevStudent) void prefetchStudent(prevStudent.student_id, classroomId);
    }
    if (currentIndex < allStudents.length - 1) {
      const nextStudent = allStudents[currentIndex + 1];
      if (nextStudent) void prefetchStudent(nextStudent.student_id, classroomId);
    }
  }, [student, isOpen, classroomId, currentIndex, allStudents, loadDetail, loadErrors, loadAiSuggestion]);

  // Copy Zalo message action with robust clipboard fallback
  const handleCopyZaloMessage = useCallback(async () => {
    const text = aiSuggestion || getFallbackSuggestion();
    if (!text) return;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedMsg(true);
      toast.success('Đã copy tin nhắn Zalo vào bộ nhớ tạm!');
      setTimeout(() => setCopiedMsg(false), 2000);
    } else {
      toast.error('Không thể sao chép vào bộ nhớ tạm');
    }
  }, [aiSuggestion, getFallbackSuggestion]);

  // Assign Drill 5 Words
  const handleAssignDrill = async () => {
    if (!student) return;
    setIsAssigningDrill(true);
    try {
      const res = await authFetch('/api/teacher/assign-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.student_id, classroomId }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.count > 0) {
          toast.success(`Đã giao bài tập bổ sung cho ${json.count} từ yếu: ${json.words?.join(', ') || ''}`);
        } else {
          toast.info('Học sinh này hiện không có từ vựng yếu nào để ôn tập bổ sung.');
        }
      } else {
        toast.error('Lỗi khi giao bài tập: ' + (json.error || 'Thất bại'));
      }
    } catch {
      toast.error('Lỗi hệ thống khi giao bài tập');
    } finally {
      setIsAssigningDrill(false);
    }
  };

  // Keyboard navigation: ↓ (next), ↑ (prev), Esc (close), C (copy Zalo message)
  // Crucial: Do NOT intercept standard OS shortcuts like Ctrl+C, Cmd+C, Ctrl+K, etc.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input/textarea or editable element
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      // DO NOT intercept any modifier key combos (Ctrl+C, Cmd+C, Alt+Tab, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (currentIndex < allStudents.length - 1) {
          onNavigate(currentIndex + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        void handleCopyZaloMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, allStudents.length, onClose, onNavigate, handleCopyZaloMessage]);

  if (!isOpen || !student) return null;

  const isPro = student.plan === 'pro' || student.plan === 'premium';
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allStudents.length - 1;
  const indexDisplay = currentIndex >= 0 ? `${currentIndex + 1}/${allStudents.length}` : `1/${allStudents.length || 1}`;

  // Chart data formatting
  const formattedHistory = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    vms: h.vms,
    lcs: h.lcs,
  }));

  // Reverse quizzes for chronological left-to-right display in chart (since API returns newest first)
  const formattedQuizzes = quizzes
    .slice()
    .reverse()
    .map((q) => ({
      date: new Date(q.completed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      acc: Math.round(q.accuracy * 100),
    }));

  // Competency Radar data
  const accuracyScore = Math.round((student.avg_quiz_accuracy || 0) * 100);
  const radarData = [
    { subject: 'Trí nhớ (VMS)', score: Math.min(100, student.vms || 0), fullMark: 100 },
    { subject: 'Chăm chỉ (LCS)', score: Math.min(100, student.lcs || 0), fullMark: 100 },
    { subject: 'Độ chính xác', score: accuracyScore, fullMark: 100 },
    { subject: 'Vốn chủ động', score: Math.min(100, student.active_vms || 0), fullMark: 100 },
    { subject: 'Chiều sâu ngữ cảnh', score: Math.min(100, student.communicative_depth || 50), fullMark: 100 },
  ];

  // Projected TOEIC Score estimate based on CEFR & VMS
  const getToeicEstimate = (cefr: string) => {
    switch (cefr) {
      case 'C2': return { total: '950 - 990', listening: '495', reading: '490+' };
      case 'C1': return { total: '850 - 945', listening: '450 - 485', reading: '400 - 460' };
      case 'B2': return { total: '700 - 845', listening: '380 - 440', reading: '320 - 405' };
      case 'B1': return { total: '450 - 695', listening: '250 - 370', reading: '200 - 325' };
      case 'A2': return { total: '255 - 445', listening: '150 - 240', reading: '105 - 205' };
      default: return { total: '120 - 250', listening: '80 - 140', reading: '40 - 110' };
    }
  };
  const toeicScore = getToeicEstimate(student.cefr_level || 'A1');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop with blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Container: 580px on desktop, bottom sheet on mobile (<640px) */}
      <div
        className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10 z-50 pointer-events-none max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0"
      >
        <div className="w-full sm:w-[580px] sm:max-w-[580px] pointer-events-auto bg-background border-l shadow-2xl flex flex-col h-full sm:h-full max-sm:h-[90vh] max-sm:max-h-[90vh] sm:rounded-none rounded-t-3xl border-t sm:border-t-0 animate-in max-sm:slide-in-from-bottom sm:slide-in-from-right duration-200">
          
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b bg-background/95 backdrop-blur shrink-0">
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1.5 bg-muted rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                  {student.student_name.charAt(0)?.toUpperCase() || 'H'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg truncate">{student.student_name}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter shrink-0 ${
                        student.cefr_level?.startsWith('C')
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : student.cefr_level?.startsWith('B')
                          ? 'bg-sky-100 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {student.cefr_level || 'A1'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0 ${
                        isPro
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isPro && <ShieldCheck className="h-3 w-3" />}
                      {isPro ? 'Pro' : 'Free'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {student.email} {classroomName ? `• Lớp ${classroomName}` : ''}
                  </p>
                </div>
              </div>

              {/* Action buttons & navigation */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Stepper buttons (prev/next) */}
                <div className="flex items-center bg-muted/60 border rounded-lg p-0.5 text-xs font-mono font-semibold">
                  <button
                    disabled={!hasPrev}
                    onClick={() => onNavigate(currentIndex - 1)}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-background transition-colors"
                    title="Học sinh trước (↑ hoặc k)"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="px-1.5 text-[11px] tabular-nums text-muted-foreground">
                    {indexDisplay}
                  </span>
                  <button
                    disabled={!hasNext}
                    onClick={() => onNavigate(currentIndex + 1)}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-background transition-colors"
                    title="Học sinh tiếp theo (↓ hoặc j)"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Open full page */}
                <Link
                  href={`/teacher/student/${student.student_id}?class=${classroomId}`}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Mở toàn trang / In PDF"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  title="Đóng (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sub details: Plan expires & joined date */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t text-[11px] text-muted-foreground">
              {student.joined_at && (
                <span>
                  Gia nhập: <strong className="text-foreground">{new Date(student.joined_at).toLocaleDateString('vi-VN')}</strong>
                </span>
              )}
              {isPro && student.plan_expires_at && (
                <span>
                  Hạn Pro: <strong className="text-emerald-600">{new Date(student.plan_expires_at).toLocaleDateString('vi-VN')}</strong>
                </span>
              )}
              <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground/80 font-mono">
                <span>[↑/↓] Chuyển</span> &bull; <span>[C] Copy Zalo</span> &bull; <span>[Esc] Đóng</span>
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Can thiệp nhanh | Biểu đồ & Năng lực | Từ hay sai */}
          <div className="px-4 sm:px-5 border-b bg-muted/20 shrink-0">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('intervention')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'intervention'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="h-4 w-4" /> Can thiệp nhanh
              </button>

              <button
                onClick={() => setActiveTab('charts')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'charts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Biểu đồ & Năng lực
              </button>

              <button
                onClick={() => setActiveTab('errors')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'errors'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlertCircle className="h-4 w-4 text-rose-500" /> Từ hay sai
                {errorsList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                    {errorsList.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Scrollable Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

            {/* TAB 1: Can thiệp nhanh */}
            {activeTab === 'intervention' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Pedagogical Diagnosis Card */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm">Chẩn đoán Sư phạm (TESOL/FSRS)</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${status.color}`}>
                      <span>{status.dot}</span> {status.label}
                    </span>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border text-xs">
                    <p className="font-semibold text-foreground">{status.title}</p>
                    <p className="text-muted-foreground mt-1 leading-relaxed">{status.advice}</p>
                  </div>

                  {/* 4 Mini metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono tabular-nums">
                    <div className="border rounded-xl p-2 bg-background">
                      <span className="block text-[10px] font-sans font-medium text-muted-foreground uppercase">Trí nhớ (VMS)</span>
                      <strong className="text-emerald-600 text-sm">{student.vms}%</strong>
                    </div>
                    <div className="border rounded-xl p-2 bg-background">
                      <span className="block text-[10px] font-sans font-medium text-muted-foreground uppercase">Chủ động (A)</span>
                      <strong className="text-emerald-600 text-sm">{student.active_vms || 0}%</strong>
                    </div>
                    <div className="border rounded-xl p-2 bg-background">
                      <span className="block text-[10px] font-sans font-medium text-muted-foreground uppercase">Chăm chỉ (LCS)</span>
                      <strong className="text-sky-600 text-sm">{student.lcs}%</strong>
                    </div>
                    <div className="border rounded-xl p-2 bg-background">
                      <span className="block text-[10px] font-sans font-medium text-muted-foreground uppercase">Từ đã học</span>
                      <strong className="text-violet-600 text-sm">{student.words_reviewed || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Zalo / Messenger Template Card */}
                <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm text-primary">Tin nhắn tư vấn gửi học sinh</h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Phím tắt [C]
                    </span>
                  </div>

                  <div className="bg-background rounded-xl p-3 border text-xs min-h-[75px] flex items-center shadow-inner">
                    {isAiLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground animate-pulse text-xs italic">
                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        <span>Gemini AI đang soạn tin nhắn...</span>
                      </div>
                    ) : (
                      <p className="text-foreground/90 leading-relaxed italic whitespace-pre-wrap">
                        &ldquo;{aiSuggestion || getFallbackSuggestion()}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleCopyZaloMessage}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-[0.99] transition-all"
                  >
                    {copiedMsg ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                    {copiedMsg ? 'Đã copy vào bộ nhớ tạm!' : '1-Click Sao chép gửi Zalo (C)'}
                  </button>
                </div>

                {/* Assign Drill 5 Words */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Giao 5 từ yếu cần củng cố (Drill)</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Tự động cài đặt 5 từ có độ khó cao nhất về hạn ôn tập hôm nay theo chuẩn FSRS.
                    </p>
                  </div>
                  <button
                    disabled={isAssigningDrill}
                    onClick={() => void handleAssignDrill()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    {isAssigningDrill ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Giao Drill
                  </button>
                </div>

                {/* Top 3 Struggling Words Preview */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                      Top 3 từ vựng học sinh hay quên
                    </h4>
                    <button
                      onClick={() => setActiveTab('errors')}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Xem tất cả ({errorsList.length}) →
                    </button>
                  </div>

                  {isLoadingErrors ? (
                    <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Đang tải danh sách từ...
                    </div>
                  ) : errorsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic text-center">
                      Không có từ vựng nào gặp khó khăn nghiêm trọng!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {errorsList.slice(0, 3).map((w) => (
                        <div
                          key={w.wordId}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{w.word}</span>
                            {w.pos && <span className="text-muted-foreground ml-1.5 text-[10px]">({w.pos})</span>}
                            <p className="text-muted-foreground text-[11px] truncate">{w.translation}</p>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              Độ khó {Math.round((w.difficulty || 0) * 10) / 10}
                            </span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              {w.reviewCount} lần ôn
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Biểu đồ & Năng lực */}
            {activeTab === 'charts' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* 30-Day VMS & LCS Trend Chart */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Tiến độ trí nhớ & chuyên cần (30 ngày)</h4>
                      <p className="text-[11px] text-muted-foreground">VMS (Độ bền lưu giữ) & LCS (Chăm chỉ)</p>
                    </div>
                    <div className="flex gap-3 text-[10px] font-semibold">
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> VMS</div>
                      <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500" /> LCS</div>
                    </div>
                  </div>

                  <div className="h-[200px] w-full">
                    {isLoadingDetail ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Đang tải dữ liệu biểu đồ...
                      </div>
                    ) : formattedHistory.length > 0 ? (
                      <StudentVmsLineChart data={formattedHistory} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Chưa có lịch sử 30 ngày ghi nhận.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quiz History Bar Chart */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Lịch sử bài kiểm tra gần nhất</h4>
                      <p className="text-[11px] text-muted-foreground">Tỷ lệ chính xác (%) qua 10 bài quiz mới nhất</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      TB: {accuracyScore}%
                    </span>
                  </div>

                  <div className="h-[180px] w-full">
                    {formattedQuizzes.length > 0 ? (
                      <StudentQuizBarChart data={formattedQuizzes} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Học sinh chưa hoàn thành bài quiz nào.
                      </div>
                    )}
                  </div>
                </div>

                {/* Radar Chart & TOEIC Projection */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Biểu đồ Radar Năng lực & Ước lượng TOEIC</h4>
                    <p className="text-[11px] text-muted-foreground">Mô hình hóa năng lực theo 5 trục kỹ năng</p>
                  </div>

                  <div className="h-[220px] w-full">
                    <StudentCompetencyRadarChart data={radarData} />
                  </div>

                  {/* TOEIC Score Projection Card */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Dự phóng điểm thi TOEIC:</span>
                      <span className="text-sm font-black font-mono text-indigo-700">{toeicScore.total} điểm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-950 font-mono">
                      <div className="bg-white/80 border border-indigo-100 p-2 rounded-lg">
                        <span className="block text-[10px] font-sans text-muted-foreground">Listening ước lượng</span>
                        <strong>{toeicScore.listening}</strong>
                      </div>
                      <div className="bg-white/80 border border-indigo-100 p-2 rounded-lg">
                        <span className="block text-[10px] font-sans text-muted-foreground">Reading ước lượng</span>
                        <strong>{toeicScore.reading}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Từ hay sai */}
            {activeTab === 'errors' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Danh sách từ vựng hay sai & khó nhớ</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Xếp theo mức độ khó giảm dần theo thuật toán Spaced Repetition (FSRS)
                    </p>
                  </div>
                  <button
                    disabled={isAssigningDrill || errorsList.length === 0}
                    onClick={() => void handleAssignDrill()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isAssigningDrill ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Giao bài tập
                  </button>
                </div>

                {isLoadingErrors ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Đang tải danh sách từ yếu...</span>
                  </div>
                ) : errorsList.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border rounded-2xl">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-xs sm:text-sm">Không có từ vựng báo động</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Học sinh ghi nhớ tốt các từ đã học trong lớp.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {errorsList.map((item, idx) => (
                      <div
                        key={item.wordId || idx}
                        className="p-3 bg-background border rounded-xl shadow-sm hover:border-primary/40 transition-colors space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-sm text-foreground">{item.word}</span>
                              {item.pos && <span className="text-muted-foreground text-xs italic">({item.pos})</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.translation}</p>
                          </div>
                          <div className="text-right font-mono tabular-nums shrink-0">
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                              Khó: {Math.round((item.difficulty || 0) * 10) / 10}
                            </span>
                            <span className="block text-[10px] text-muted-foreground mt-1">
                              Ôn {item.reviewCount} lần
                            </span>
                          </div>
                        </div>

                        {item.example && (
                          <div className="p-2 bg-muted/30 rounded-lg text-[11px] text-muted-foreground italic border-l-2 border-primary/40">
                            &ldquo;{item.example}&rdquo;
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                          <span>Độ bền: <strong>{Math.round((item.stability || 0) * 10) / 10} ngày</strong></span>
                          <span>Hạn ôn: <strong>{new Date(item.nextReviewDate).toLocaleDateString('vi-VN')}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
