'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { StudentProgress } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, Brain, TrendingUp, Calendar, Target, Sparkles,
  MessageSquare, ChevronRight, Loader2, AlertCircle, BookOpen, Plus, Copy, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';

const StudentVmsLineChart = dynamic(
  () => import('@/components/charts/StudentProgressCharts').then((m) => m.StudentVmsLineChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" /> }
);
const StudentQuizBarChart = dynamic(
  () => import('@/components/charts/StudentProgressCharts').then((m) => m.StudentQuizBarChart),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" /> }
);

export default function StudentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = params.id as string;
  const classroomId = searchParams.get('class');

  type HistoryPoint = { recorded_at: string; vms: number; lcs: number };
  type QuizPoint = { completed_at: string; score: number; total_questions: number; accuracy: number };

  interface StudentErrorItem {
    wordId: string;
    word: string;
    translation: string;
    pos: string;
    example: string;
    difficulty: number;
    stability: number;
    reviewCount: number;
    lastReviewedAt: string;
    nextReviewDate: string;
  }

  const [data, setData] = useState<{
    current: StudentProgress | null;
    history: HistoryPoint[];
    quizzes: QuizPoint[];
  }>({ current: null, history: [], quizzes: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Custom states for optimizations
  const [isErrorsModalOpen, setIsErrorsModalOpen] = useState(false);
  const [errorsList, setErrorsList] = useState<StudentErrorItem[]>([]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isAssigningDrill, setIsAssigningDrill] = useState(false);

  const generateAiInsight = useCallback(async (current: StudentProgress) => {
    setIsAiLoading(true);
    try {
      const isDormant = current.last_active && (new Date().getTime() - new Date(current.last_active).getTime() > 3 * 24 * 60 * 60 * 1000);
      const isCramming = (current.lcs || 0) < 30 && (current.avg_quiz_accuracy || 0) > 0.8 && (current.quizzes_taken || 0) > 2;
      const isRisingStar = (current.lcs || 0) > 80 && (current.avg_quiz_accuracy || 0) > 0.8;
      const isAtRisk = (current.vms || 0) < 30 && (current.words_reviewed || 0) > 10;

      const tag = isDormant ? 'DORMANT' : isRisingStar ? 'RISING STAR' : isCramming ? 'CRAMMING' : isAtRisk ? 'AT RISK' : 'NORMAL';
      const msg = isDormant ? 'Vắng mặt lâu ngày' : isRisingStar ? 'Tiến bộ vượt trội' : isCramming ? 'Học dồn tập trung' : isAtRisk ? 'Đang gặp khó khăn' : 'Bình thường';

      const res = await authFetch('/api/teacher/coaching-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: current.student_name,
          vms: current.vms,
          lcs: current.lcs,
          tag,
          msg,
          cefr: current.cefr_level || 'A1',
          activeVms: current.active_vms || 0,
          tesolFocus: true,
        }),
      });
      const json = await res.json();
      setAiSuggestion(json.suggestion || '');
    } catch (err) {
      console.error('AI Insight Error:', err);
      setAiSuggestion('');
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  const loadStudentDetail = useCallback(async () => {
    try {
      const res = await authFetch(`/api/teacher/student-detail?studentId=${studentId}&classroomId=${classroomId}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);

      if (json.current) {
        void generateAiInsight(json.current);
      }
    } catch (err: unknown) {
      toast.error('Không tải được dữ liệu học sinh');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, classroomId, generateAiInsight]);

  useEffect(() => {
    if (studentId && classroomId) {
      void loadStudentDetail();
    }
  }, [studentId, classroomId, loadStudentDetail]);

  const fetchStudentErrors = useCallback(async () => {
    setIsLoadingErrors(true);
    try {
      const res = await authFetch(`/api/teacher/student-errors?studentId=${studentId}&classroomId=${classroomId}`);
      const json = await res.json();
      if (json.success) {
        setErrorsList(json.data || []);
      } else {
        toast.error('Không thể tải danh sách từ lỗi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối tải danh sách từ lỗi');
    } finally {
      setIsLoadingErrors(false);
    }
  }, [studentId, classroomId]);

  const handleAssignDrill = useCallback(async () => {
    setIsAssigningDrill(true);
    try {
      const res = await authFetch('/api/teacher/assign-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, classroomId }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.count > 0) {
          toast.success(`Đã giao bài tập bổ sung cho ${json.count} từ khó: ${json.words.join(', ')}`);
        } else {
          toast.info('Học sinh này hiện không có từ vựng yếu nào để ôn tập bổ sung.');
        }
      } else {
        toast.error('Lỗi khi giao bài tập: ' + json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi hệ thống khi giao bài tập');
    } finally {
      setIsAssigningDrill(false);
    }
  }, [studentId, classroomId]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { current, history, quizzes } = data;

  if (!current) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Không tìm thấy học sinh</h2>
        <Link href="/teacher" className="text-primary hover:underline mt-4">Quay lại Bảng điều khiển</Link>
      </div>
    );
  }

  const isDormant = current.last_active && (new Date().getTime() - new Date(current.last_active).getTime() > 3 * 24 * 60 * 60 * 1000);
  const isCramming = (current.lcs || 0) < 30 && (current.avg_quiz_accuracy || 0) > 0.8 && (current.quizzes_taken || 0) > 2;
  const isRisingStar = (current.lcs || 0) > 80 && (current.avg_quiz_accuracy || 0) > 0.8;
  const isAtRisk = (current.vms || 0) < 30 && (current.words_reviewed || 0) > 10;

  const getStatusInfo = () => {
    if (isDormant) return {
      label: 'Vắng mặt',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: Calendar,
      title: 'Học sinh ngừng hoạt động > 3 ngày',
      advice: 'Cần gửi tin nhắn nhắc nhở hoặc liên hệ trực tiếp để học sinh không bị rơi rụng kiến thức theo đường cong lãng quên Ebbinghaus.'
    };
    if (isRisingStar) return {
      label: 'Tiến bộ nhanh',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: Sparkles,
      title: 'Tiến độ học xuất sắc & đều đặn',
      advice: 'Học sinh duy trì tính kỷ luật rất tốt (LCS cao và độ chính xác > 80%). Nên khen ngợi kịp thời và có thể giao thêm từ vựng nâng cao.'
    };
    if (isCramming) return {
      label: 'Học dồn',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Loader2,
      title: 'Học sinh có dấu hiệu học dồn',
      advice: 'Điểm quiz cao nhưng tính đều đặn thấp. Học dồn chỉ giúp nhớ ngắn hạn; cần hướng dẫn học sinh phân bổ 5-10 phút mỗi ngày theo FSRS.'
    };
    if (isAtRisk) return {
      label: 'Cần củng cố',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: AlertCircle,
      title: 'Gặp khó khăn trong việc ghi nhớ',
      advice: 'Độ bền ghi nhớ (VMS) dưới 30% dù đã học nhiều từ. Nên giao bài tập củng cố (Drill) và kiểm tra lại phương pháp liên tưởng của học sinh.'
    };
    return {
      label: 'Bình thường',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Target,
      title: 'Tiến độ học tập ổn định',
      advice: 'Học sinh duy trì học tập bình thường. Khuyến khích tiếp tục giữ vững nhịp độ ôn tập hàng ngày.'
    };
  };

  const status = getStatusInfo();

  const getAISuggestion = () => {
    const firstName = current.student_name.split(' ')[0] || 'em';
    if (isDormant) return `Chào ${firstName}! Thầy thấy em đã vài ngày chưa vào ôn tập từ vựng. Mỗi ngày chỉ cần 5 phút là đủ để giữ vững chuỗi học và không bị quên từ. Cố lên nhé!`;
    if (isRisingStar) return `Chào ${firstName}! Kết quả học tập của em rất ấn tượng, đặc biệt là tính kỷ luật (chăm chỉ ${current.lcs}%). Tiếp tục phát huy phong độ này nhé!`;
    if (isCramming) return `Chào ${firstName}! Điểm bài quiz của em rất tốt, nhưng thầy thấy em đang có xu hướng học dồn. Hãy thử chia nhỏ thời gian ra ôn mỗi ngày 5-10 phút để nhớ sâu hơn nhé.`;
    if (isAtRisk) return `Chào ${firstName}! Thầy thấy độ bền ghi nhớ từ vựng của em (VMS ${current.vms}%) đang hơi thấp. Em nên dành thêm chút thời gian xem lại các từ khó hay sai nhé.`;
    return `Chào ${firstName}! Thầy đang theo dõi tiến độ của em. Nếu gặp khó khăn hay cần hỗ trợ thêm phần từ vựng nào thì nhắn thầy ngay nhé!`;
  };

  const formattedHistory = history.map(h => ({
    ...h,
    date: new Date(h.recorded_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }));

  const formattedQuizzes = quizzes.map(q => ({
    ...q,
    acc: Math.round(q.accuracy * 100),
    date: new Date(q.completed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }));

  const copyMessengerTemplate = () => {
    const text = aiSuggestion || getAISuggestion();
    navigator.clipboard.writeText(text);
    setCopiedMsg(true);
    toast.success('Đã sao chép tin nhắn vào clipboard!');
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="min-h-dvh bg-muted/40 font-sans pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b h-14 px-4 sm:px-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-xl transition-colors"
          title="Quay lại"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base sm:text-lg truncate">{current.student_name}</h1>
          <p className="text-xs text-muted-foreground truncate">{current.email}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase flex items-center gap-1.5 shrink-0 ${status.color}`}>
          <status.icon className="h-3.5 w-3.5" />
          {status.label}
        </div>
        <div className="px-2 py-0.5 rounded-md text-[10px] bg-amber-100 text-amber-700 border border-amber-200 font-black tracking-tighter shrink-0">
          {current.cefr_level || 'A1'}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-background border rounded-2xl p-6 shadow-sm border-emerald-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Độ thành thạo thực chiến (VMS)</p>
            </div>
            <p className="text-4xl font-bold flex items-baseline gap-2">
              {current.active_vms || 0}%
              <span className="text-sm font-normal text-muted-foreground">vốn từ chủ động</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">
              Thụ động: <strong className="text-foreground">{current.vms}%</strong> &bull; Chiều sâu ngữ cảnh: <strong className="text-foreground">{current.communicative_depth || 0}%</strong>
            </p>
          </div>

          <div className="bg-background border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chỉ số chăm chỉ (LCS)</p>
            </div>
            <p className="text-4xl font-bold flex items-baseline gap-2">
              {current.lcs}%
              <span className="text-sm font-normal text-muted-foreground">tính kỷ luật</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Tỷ lệ số ngày có học từ vựng trong 14 ngày qua.
            </p>
          </div>

          <div className="bg-background border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hiệu quả kiểm tra (Quiz)</p>
            </div>
            <p className="text-4xl font-bold flex items-baseline gap-2">
              {Math.round((current.avg_quiz_accuracy || 0) * 100)}%
              <span className="text-sm font-normal text-muted-foreground">chính xác</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Đã hoàn thành <strong className="text-foreground">{current.quizzes_taken}</strong> bài kiểm tra.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Charts */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-background border rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Biểu đồ phát triển năng lực</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Độ bền trí nhớ (VMS) và Độ chăm chỉ (LCS) trong 30 ngày qua</p>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> VMS (Trí nhớ)</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500" /> LCS (Chăm chỉ)</div>
                </div>
              </div>
              <div className="h-[320px] w-full">
                <StudentVmsLineChart data={formattedHistory} />
              </div>
            </div>

            <div className="bg-background border rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Lịch sử làm bài Quiz</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tỷ lệ chính xác qua các lần làm quiz gần nhất</p>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <StudentQuizBarChart data={formattedQuizzes} />
              </div>
            </div>
          </div>

          {/* AI Side Cards — Cleary Separated Pedagogical Diagnosis & Messenger Template */}
          <div className="space-y-6 print:hidden">
            {/* Card 1: Chẩn đoán Sư phạm (Pedagogical Diagnosis) */}
            <div className="bg-background border border-primary/20 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Chẩn đoán Sư phạm</h3>
                  <p className="text-[11px] text-muted-foreground">Phân tích chuyên sâu phương pháp TESOL & FSRS</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="bg-muted/40 rounded-2xl p-4 border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Tình trạng:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{status.title}</p>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 leading-relaxed space-y-1.5">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-indigo-700">Khuyến nghị cho Giáo viên:</p>
                  <p>{status.advice}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                  <div className="border rounded-xl p-2.5 bg-background">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Độ bền FSRS</span>
                    <strong className="text-emerald-600 text-sm">{current.vms}%</strong>
                  </div>
                  <div className="border rounded-xl p-2.5 bg-background">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Từ đã ôn</span>
                    <strong className="text-sky-600 text-sm">{current.words_reviewed || 0} từ</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Mẫu tin nhắn gửi học sinh (Actionable Messenger Template) */}
            <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/20 p-2 rounded-xl text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary">Mẫu tin nhắn gửi học sinh</h3>
                  <p className="text-[11px] text-muted-foreground">Gợi ý nội dung gửi qua Zalo / Messenger</p>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-4 border border-primary/15 text-sm min-h-[90px] flex items-center shadow-inner">
                {isAiLoading ? (
                  <div className="flex items-center gap-2.5 text-muted-foreground animate-pulse text-xs italic">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Gemini AI đang soạn tin nhắn phù hợp...</span>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic whitespace-pre-wrap">
                    &ldquo;{aiSuggestion || getAISuggestion()}&rdquo;
                  </p>
                )}
              </div>

              <button
                disabled={isAiLoading}
                onClick={copyMessengerTemplate}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {copiedMsg ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedMsg ? 'Đã sao chép!' : 'Sao chép gửi học sinh'}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-background border rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold mb-4">Tác vụ nhanh</h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setIsErrorsModalOpen(true);
                    void fetchStudentErrors();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted transition-colors text-xs sm:text-sm font-semibold text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-500" />
                    Xem các từ hay quên / làm sai
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted transition-colors text-xs sm:text-sm font-semibold text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-sky-500" />
                    Xuất báo cáo tiến độ (PDF)
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  disabled={isAssigningDrill}
                  onClick={() => void handleAssignDrill()}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted transition-colors text-xs sm:text-sm font-semibold disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isAssigningDrill ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Plus className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    <span>{isAssigningDrill ? 'Đang giao...' : 'Giao bài tập củng cố (Drill)'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Recent Errors Modal */}
      {isErrorsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-3xl p-6 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" />
                <h2 className="text-lg sm:text-xl font-bold">Từ vựng cần củng cố (Lỗi gần đây)</h2>
              </div>
              <button
                onClick={() => setIsErrorsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingErrors ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải danh sách từ lỗi...</p>
                </div>
              ) : errorsList.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 text-emerald-400 opacity-60 animate-pulse" />
                  <p className="font-semibold">Học sinh chưa có từ vựng yếu nào!</p>
                  <p className="text-xs mt-1">Học sinh đang hoàn thành tốt và ghi nhớ đều đặn.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Danh sách 10 từ vựng học sinh có độ ổn định ghi nhớ (stability) thấp nhất và độ khó cao nhất.
                  </p>
                  <div className="border rounded-2xl overflow-hidden divide-y">
                    {errorsList.map((err) => (
                      <div key={err.wordId} className="p-4 hover:bg-muted/10 transition-colors flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm">{err.word}</span>
                            {err.pos && (
                              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                {err.pos}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                              Độ khó: {err.difficulty}/10
                            </span>
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">
                              Độ bền: {Math.round(err.stability * 10) / 10} ngày
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-foreground/80">{err.translation}</p>
                          {err.example && (
                            <p className="text-[11px] text-muted-foreground italic mt-1 pl-2 border-l-2 border-muted-foreground/30">
                              &quot;{err.example}&quot;
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground block">
                            Đã ôn: {err.reviewCount} lần
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-1">
                            Kỳ tới: {new Date(err.nextReviewDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsErrorsModalOpen(false)}
                className="border rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Đóng
              </button>
              <button
                disabled={isAssigningDrill || errorsList.length === 0}
                onClick={async () => {
                  await handleAssignDrill();
                  setIsErrorsModalOpen(false);
                }}
                className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isAssigningDrill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Giao tất cả từ này vào Drill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print & PDF Exporting styles */}
      <style jsx global>{`
        @media print {
          body, .min-h-dvh {
            background: white !important;
            color: black !important;
          }
          header, aside, .print\\:hidden, button, .lucide {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 1.5rem !important;
          }
          .lg\\:col-span-2 {
            grid-column: span 3 / span 3 !important;
          }
          .bg-background {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
