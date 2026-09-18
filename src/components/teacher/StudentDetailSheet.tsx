'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import type { StudentProgress } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  X, ChevronUp, ChevronDown, ExternalLink, Sparkles,
  Copy, CheckCircle2, Plus, Loader2,
  ShieldCheck, BarChart3, Clock, Trophy, BookOpen, Bookmark, Target
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
  type SavedWordItem,
  type ToeicAssessmentItem,
  type TimelineItem,
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

function formatExactTimestamp(dateStr?: string | null): string {
  if (!dateStr) return 'Chưa ghi nhận';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Chưa ghi nhận';

  const now = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `${timeStr} - Hôm nay`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isYesterday) return `${timeStr} - Hôm qua`;

  const dateFormatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${timeStr} - ${dateFormatted}`;
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

type SheetTab = 'timeline' | 'saved_words' | 'quizzes' | 'analytics';

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
  const [activeTab, setActiveTab] = useState<SheetTab>('timeline');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [quizzes, setQuizzes] = useState<QuizPoint[]>([]);
  const [savedWords, setSavedWords] = useState<SavedWordItem[]>([]);
  const [toeicAssessments, setToeicAssessments] = useState<ToeicAssessmentItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
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
      setSavedWords(cached.savedWords || []);
      setToeicAssessments(cached.toeicAssessments || []);
      setTimeline(cached.timeline || []);
      return;
    }

    setHistory([]);
    setQuizzes([]);
    setSavedWords([]);
    setToeicAssessments([]);
    setTimeline([]);
    setIsLoadingDetail(true);
    try {
      const res = await authFetch(`/api/teacher/student-detail?studentId=${studentId}&classroomId=${classroomId}`);
      const json = await res.json();
      if (json.success) {
        setCachedStudentDetail(studentId, classroomId, json);
        if (currentStudentIdRef.current === studentId) {
          setHistory(json.history || []);
          setQuizzes(json.quizzes || []);
          setSavedWords(json.savedWords || []);
          setToeicAssessments(json.toeicAssessments || []);
          setTimeline(json.timeline || []);
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
      setActiveTab('timeline');
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
        <div className="w-full sm:w-[580px] sm:max-w-[580px] pointer-events-auto bg-background border-l shadow-2xl flex flex-col h-full sm:h-full max-sm:h-[90dvh] max-sm:max-h-[90dvh] pb-[env(safe-area-inset-bottom,16px)] sm:rounded-none rounded-t-3xl border-t sm:border-t-0 animate-in max-sm:slide-in-from-bottom sm:slide-in-from-right duration-200">
          
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b bg-background/95 backdrop-blur shrink-0">
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1.5 bg-muted rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                  {student.student_name?.trim()
                    ? student.student_name.trim().charAt(0).toUpperCase()
                    : student.email?.trim()
                    ? student.email.trim().charAt(0).toUpperCase()
                    : 'H'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
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

          {/* Compact AI Coaching & Zalo Messenger Banner (Prominent at top, does not displace activity data) */}
          <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-primary/5 via-violet-500/5 to-primary/5 border-b shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">
                    Gợi ý can thiệp sư phạm
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${status.color}`}>
                    <span>{status.dot}</span> {status.label}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyZaloMessage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg font-bold text-xs shadow-xs hover:bg-primary/95 active:scale-[0.98] transition-all shrink-0"
              >
                {copiedMsg ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedMsg ? 'Đã sao chép!' : 'Sao chép tin Zalo'}</span>
                <span className="hidden sm:inline text-[10px] opacity-75 font-mono">(C)</span>
              </button>
            </div>

            <div className="bg-background/80 backdrop-blur rounded-xl p-2.5 border text-xs text-foreground/90 italic flex items-center shadow-2xs">
              {isAiLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse text-xs italic">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span>Gemini AI đang soạn tin nhắn...</span>
                </div>
              ) : (
                <p className="leading-snug truncate sm:whitespace-normal line-clamp-2">
                  &ldquo;{aiSuggestion || getFallbackSuggestion()}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Sub-Tabs: Nhật ký hoạt động | Từ vựng đã lưu | Lịch sử Quiz | Biểu đồ & Can thiệp */}
          <div className="px-4 sm:px-5 border-b bg-muted/20 shrink-0">
            <nav className="flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap touch-pan-x">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap touch-manipulation ${
                  activeTab === 'timeline'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Clock className="h-4 w-4" /> Nhật ký hoạt động
                {timeline.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {timeline.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('saved_words')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap touch-manipulation ${
                  activeTab === 'saved_words'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="h-4 w-4" /> Từ vựng đã lưu
                {savedWords.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">
                    {savedWords.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap touch-manipulation ${
                  activeTab === 'quizzes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Trophy className="h-4 w-4" /> Lịch sử Quiz & Bài thi
                {quizzes.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    {quizzes.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap touch-manipulation ${
                  activeTab === 'analytics'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Biểu đồ & Năng lực
              </button>
            </nav>
          </div>

          {/* Scrollable Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

            {/* TAB 1: Nhật ký hoạt động (Chronological Timeline) */}
            {activeTab === 'timeline' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Nhật ký hoạt động gần đây</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Toàn bộ hoạt động làm quiz, nạp từ và lưu từ vựng của học sinh
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-muted font-semibold text-muted-foreground tabular-nums">
                    {timeline.length} hoạt động
                  </span>
                </div>

                {isLoadingDetail ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Đang tải nhật ký hoạt động...</span>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border rounded-2xl">
                    <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-xs sm:text-sm">Chưa có hoạt động nào được ghi nhận</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Các bài quiz, từ vựng vừa nạp hoặc các bộ từ đã học sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {timeline.map((item) => {
                      let icon = <Clock className="h-3 w-3" />;
                      let iconBg = 'bg-muted text-muted-foreground ring-2 ring-background';
                      let badgeClass = 'bg-muted text-muted-foreground border-border';

                      if (item.type === 'quiz') {
                        const isGood = (item.accuracy ?? 0) >= 0.8;
                        icon = <Trophy className="h-3 w-3" />;
                        iconBg = isGood
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-amber-500 text-white ring-4 ring-amber-100';
                        badgeClass = isGood
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (item.type === 'word_saved') {
                        icon = <Bookmark className="h-3 w-3" />;
                        iconBg = 'bg-sky-500 text-white ring-4 ring-sky-100';
                        badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
                      } else if (item.type === 'vocab_pack') {
                        icon = <BookOpen className="h-3 w-3" />;
                        iconBg = 'bg-violet-600 text-white ring-4 ring-violet-100';
                        badgeClass = 'bg-violet-50 text-violet-700 border-violet-200';
                      } else if (item.type === 'assessment') {
                        icon = <Target className="h-3 w-3" />;
                        iconBg = 'bg-indigo-600 text-white ring-4 ring-indigo-100';
                        badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      }

                      return (
                        <div key={item.id} className="relative group">
                          {/* Dot icon */}
                          <div
                            className={`absolute -left-6 top-2 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2 transition-transform group-hover:scale-110 shadow-xs ${iconBg}`}
                          >
                            {icon}
                          </div>

                          {/* Card content */}
                          <div className="p-3 rounded-xl bg-background border shadow-xs hover:border-primary/40 transition-colors space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h5 className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {item.title}
                                </h5>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                              {item.badge && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeClass}`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                              <Clock className="h-3 w-3" />
                              <span>{formatExactTimestamp(item.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Từ vựng đã lưu */}
            {activeTab === 'saved_words' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Từ vựng học sinh đã lưu</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Danh sách từ vựng do học sinh tự thu thập và lưu trữ
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold tabular-nums">
                    {savedWords.length} từ
                  </span>
                </div>

                {isLoadingDetail ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Đang tải danh sách từ đã lưu...</span>
                  </div>
                ) : savedWords.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border rounded-2xl">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-xs sm:text-sm">Chưa có từ vựng nào được lưu</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Học sinh chưa lưu từ vựng nào trong lớp này.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {savedWords.map((w) => (
                      <div
                        key={w.id}
                        className="p-3 bg-background border rounded-xl shadow-xs hover:border-primary/40 transition-colors space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-sm text-foreground">{w.word}</span>
                              {w.pos && (
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                  {w.pos}
                                </span>
                              )}
                              {w.ipa && (
                                <span className="text-muted-foreground text-xs font-mono">/{w.ipa}/</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{w.translation}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatExactTimestamp(w.created_at)}
                            </span>
                          </div>
                        </div>

                        {w.example && (
                          <div className="p-2 bg-muted/30 rounded-lg text-[11px] text-muted-foreground italic border-l-2 border-primary/40">
                            &ldquo;{w.example}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Lịch sử Quiz & Bài thi */}
            {activeTab === 'quizzes' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Lịch sử bài kiểm tra & bài thi</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Kết quả các lượt làm Quiz từ vựng, ngữ pháp và bài thi chuẩn hóa
                    </p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold tabular-nums">
                    {quizzes.length + toeicAssessments.length} bài
                  </span>
                </div>

                {isLoadingDetail ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Đang tải lịch sử quiz...</span>
                  </div>
                ) : quizzes.length === 0 && toeicAssessments.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border rounded-2xl">
                    <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="font-semibold text-xs sm:text-sm">Chưa có bài kiểm tra nào</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Khi học sinh hoàn thành các bài quiz hoặc thi thử, kết quả sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {quizzes.map((q, idx) => {
                      const acc = q.accuracy ?? (q.total_questions > 0 ? q.score / q.total_questions : 0);
                      const accPct = Math.round(acc * 100);
                      const isGood = acc >= 0.8;

                      return (
                        <div
                          key={q.id || idx}
                          className="p-3 bg-background border rounded-xl shadow-xs hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isGood
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <Trophy className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  Quiz {q.quiz_type === 'grammar' ? 'Ngữ pháp' : 'Từ vựng'}
                                </p>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  #{quizzes.length - idx}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {formatExactTimestamp(q.completed_at)}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md border ${
                                isGood
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {q.score}/{q.total_questions} ({accPct}%)
                            </span>
                            <div className="w-16 h-1 bg-muted rounded-full mt-1.5 ml-auto overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${accPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {toeicAssessments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Target className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-indigo-950 truncate">
                              Thi đánh giá: {a.track?.toUpperCase() || 'TOEIC'} ({a.target_id || 'Bài thi'})
                            </p>
                            <p className="text-[11px] text-indigo-700/80 font-mono">
                              {formatExactTimestamp(a.created_at)} {a.passed ? '• Đạt chuẩn' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                          {a.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Biểu đồ & Năng lực */}
            {activeTab === 'analytics' && (
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

                {/* Assign Drill & Struggling Words */}
                <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">Từ vựng hay sai & Giao bài Drill</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Tự động cài đặt các từ khó về hạn ôn tập hôm nay
                      </p>
                    </div>
                    <button
                      disabled={isAssigningDrill}
                      onClick={() => void handleAssignDrill()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isAssigningDrill ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Giao Drill
                    </button>
                  </div>

                  {isLoadingErrors ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Đang tải danh sách từ yếu...
                    </div>
                  ) : errorsList.length === 0 ? (
                    <div className="p-4 text-center bg-muted/20 border rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                      <p className="font-semibold text-xs">Không có từ vựng báo động</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {errorsList.slice(0, 5).map((item) => (
                        <div
                          key={item.wordId}
                          className="p-2.5 bg-background border rounded-xl shadow-2xs hover:border-primary/40 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">{item.word}</span>
                            {item.pos && <span className="text-muted-foreground ml-1 text-[10px]">({item.pos})</span>}
                            <p className="text-muted-foreground text-[11px]">{item.translation}</p>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              Khó: {Math.round((item.difficulty || 0) * 10) / 10}
                            </span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              {item.reviewCount} lần ôn
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
