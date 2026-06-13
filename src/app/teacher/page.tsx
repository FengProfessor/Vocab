'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Classroom, Profile, StudentProgress } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain, Plus, Users, BookOpen, LogOut, Copy, CheckCircle2, Zap,
  Loader2, Trash2, TrendingUp, GraduationCap, ChevronRight, Clock,
  BarChart3, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth-fetch';
import { track } from '@/lib/analytics';
import WordsPanel from '@/components/teacher/WordsPanel';
import GrammarPanel from '@/components/teacher/GrammarPanel';
import AnalyticsPanel from '@/components/teacher/AnalyticsPanel';
import { StudyGuideModal, TEACHER_METHOD_KEY } from '@/components/StudyGuideModal';
import type { AnalyticsData, PendingWord, TeacherTab } from '@/components/teacher/types';

const TABS: { key: TeacherTab; label: string; icon: typeof Users }[] = [
  { key: 'students', label: 'Học sinh', icon: Users },
  { key: 'words', label: 'Từ vựng', icon: BookOpen },
  { key: 'grammar', label: 'Ngữ pháp', icon: Zap },
  { key: 'analytics', label: 'Phân tích', icon: BarChart3 },
];

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [pendingWords, setPendingWords] = useState<PendingWord[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [activeTab, setActiveTab] = useState<TeacherTab>('students');
  const [userId, setUserId] = useState<string | null>(null);
  // Modal giải thích phương pháp học cho GV — tự hiện lần đầu, mở lại qua nút "Phương pháp"
  const [showMethod, setShowMethod] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem(TEACHER_METHOD_KEY) !== '1') setShowMethod(true);
  }, []);
  const closeMethod = () => {
    localStorage.setItem(TEACHER_METHOD_KEY, '1');
    setShowMethod(false);
  };

  // Đồng bộ tab vào URL để link cũ (?class=&tab=) hoạt động và F5 giữ vị trí
  const changeTab = useCallback((tab: TeacherTab, classId?: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    if (classId) params.set('class', classId);
    window.history.replaceState({}, '', `/teacher?${params.toString()}`);
  }, []);

  const loadAnalytics = useCallback(async (classroomId: string) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await authFetch(`/api/teacher/analytics?classroomId=${classroomId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalytics(data as AnalyticsData);
    } catch (err: unknown) {
      console.error('[TeacherDashboard] analytics error:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  const loadPendingWords = useCallback(async (classroomId: string) => {
    try {
      const res = await fetch(`/api/words?classroomId=${classroomId}&status=pending`);
      const data = await res.json() as { success?: boolean; data?: PendingWord[] };
      if (data.success) setPendingWords(data.data ?? []);
    } catch { /* non-fatal */ }
  }, []);

  const loadStudents = useCallback(async (classroomId: string) => {
    try {
      const res = await authFetch(`/api/teacher/stats?classroomId=${classroomId}`);
      const data = await res.json();
      setStudents(data.students || []);
      void loadAnalytics(classroomId);
      void loadPendingWords(classroomId);
    } catch {
      toast.error('Failed to load students');
    }
  }, [loadAnalytics, loadPendingWords]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pilot_signup') === '1') {
      track('teacher_signup_completed', {
        plan: params.get('pilot') ?? undefined,
        source: params.get('source') ?? 'teacher_landing',
      });
    }
    const urlTab = params.get('tab') as TeacherTab | null;
    if (urlTab && TABS.some(t => t.key === urlTab)) setActiveTab(urlTab);
    loadData(params.get('class') ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClass) loadStudents(selectedClass.id);
  }, [selectedClass, loadStudents]);

  const loadData = async (preferClassId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    setUserId(user.id);

    try {
      const res = await authFetch('/api/teacher/stats');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof ?? ({ id: user.id } as Profile));

      const loadedClasses = (data.classrooms || []) as Classroom[];
      setClassrooms(loadedClasses);
      track('teacher_dashboard_viewed', {
        classroom_count: loadedClasses.length,
        student_count: loadedClasses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0),
      });

      if (loadedClasses.length > 0) {
        const preferred = preferClassId
          ? loadedClasses.find(c => c.id === preferClassId)
          : undefined;
        setSelectedClass(preferred ?? loadedClasses[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Teacher data load error:', err);
      toast.error('Failed to load classes: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newClassName.trim()) return;
    setIsCreating(true);
    const { data, error } = await supabase.from('classrooms').insert({
      teacher_id: profile.id,
      name: newClassName.trim(),
      description: newClassDesc.trim() || null,
    }).select().single();

    if (error) {
      console.error('Create classroom error:', error);
      toast.error(`Failed to create classroom: ${error.message}`);
    } else {
      toast.success(`Đã tạo lớp "${data.name}"!`);
      setClassrooms([{ ...data, enrollment_count: 0 }, ...classrooms]);
      track('teacher_class_created', { classroom_id: data.id, classroom_count: classrooms.length + 1 });
      setSelectedClass({ ...data, enrollment_count: 0 });
      setShowCreateModal(false);
      setNewClassName('');
      setNewClassDesc('');
    }
    setIsCreating(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Xóa lớp này? Toàn bộ dữ liệu sẽ mất.')) return;
    await supabase.from('classrooms').delete().eq('id', id);
    const updated = classrooms.filter(c => c.id !== id);
    setClassrooms(updated);
    setSelectedClass(updated[0] || null);
    toast.success('Đã xóa lớp.');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã copy mã mời!');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleWordStatus = async (wordId: string, status: 'approved' | 'rejected') => {
    setApprovingId(wordId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/words/${wordId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status }),
      });
      const json = await res.json() as { success?: boolean };
      if (!json.success) throw new Error('Failed');
      setPendingWords(prev => prev.filter(w => w.id !== wordId));
      toast.success(status === 'approved' ? '✓ Đã duyệt từ' : '✗ Đã từ chối từ');
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    } finally {
      setApprovingId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-muted/40 font-sans">
        <header className="h-14 border-b bg-background px-6 flex items-center justify-between sm:hidden">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>
        <div className="flex flex-col sm:flex-row min-h-dvh">
          <aside className="hidden sm:flex w-64 border-r bg-background flex-col p-6 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </aside>
          <main className="flex-1 p-4 lg:p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          </main>
        </div>
      </div>
    );
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
  const avgAccuracy = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.avg_quiz_accuracy || 0), 0) / students.length * 100)
    : 0;

  // Stat strip — dùng analytics.classStats khi có, fallback số liệu cơ bản
  const stats = selectedClass && analytics ? [
    { label: 'Hoạt động (7 ngày)', val: `${analytics.classStats.active_students}/${analytics.classStats.total_enrolled}`, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Từ đã học', val: analytics.classStats.total_class_words, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Độ chính xác TB', val: `${analytics.classStats.avg_accuracy}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Cần ôn hôm nay', val: analytics.classStats.words_due_today, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ] : [
    { label: 'Tổng học sinh', val: totalStudents, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Số lớp', val: classrooms.length, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'HS trong lớp', val: selectedClass?.enrollment_count || 0, icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Điểm quiz TB', val: `${avgAccuracy}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex min-h-dvh bg-muted/40 font-sans">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 flex-col border-r bg-background hidden sm:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <div className="bg-primary/10 p-1.5 rounded-lg"><Brain className="h-5 w-5" /></div>
            <span className="text-lg">LingoPro</span>
          </Link>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> Giáo viên
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lớp của tôi</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <nav className="space-y-1">
            {classrooms.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                  selectedClass?.id === cls.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{cls.name}</span>
                <span className="text-xs opacity-60">{cls.enrollment_count || 0}</span>
              </button>
            ))}
            {classrooms.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có lớp. Tạo mới!</p>
            )}
          </nav>
        </div>

        <div className="p-4 border-t space-y-1">
          <Link href="/teacher/grammar" className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
            <BookOpen className="h-4 w-4" /> Thư viện Ngữ pháp
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 h-14 border-b bg-background/80 backdrop-blur px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile class selector — sidebar bị ẩn trên mobile */}
            <select
              value={selectedClass?.id ?? ''}
              onChange={e => {
                const cls = classrooms.find(c => c.id === e.target.value);
                if (cls) setSelectedClass(cls);
              }}
              className="sm:hidden border rounded-lg px-2 py-1.5 text-sm font-semibold bg-muted/30 max-w-[160px]"
            >
              {classrooms.length === 0 && <option value="">Chưa có lớp</option>}
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="min-w-0 hidden sm:block">
              <h1 className="font-bold text-lg truncate">{selectedClass?.name || 'Bảng điều khiển'}</h1>
              {selectedClass && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Mã mời:</p>
                  <button
                    onClick={() => copyInviteCode(selectedClass.invite_code)}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md hover:bg-primary/20 transition-colors"
                  >
                    {selectedClass.invite_code}
                    {copiedCode === selectedClass.invite_code ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Giải thích cơ chế học cho GV — luôn hiện, kể cả chưa có lớp */}
            <button
              onClick={() => setShowMethod(true)}
              title="Phương pháp học của học sinh"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-semibold"
            >
              <HelpCircle className="h-4 w-4" /> <span className="hidden sm:inline">Phương pháp</span>
            </button>
            {selectedClass && (
              <>
                {/* Mobile: nút copy mã mời gọn */}
                <button
                  onClick={() => copyInviteCode(selectedClass.invite_code)}
                  className="sm:hidden flex items-center gap-1 text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1.5 rounded-lg"
                >
                  {selectedClass.invite_code}
                  {copiedCode === selectedClass.invite_code ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
                <button
                  onClick={() => handleDeleteClass(selectedClass.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                  title="Xóa lớp"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Tab bar — chỉ hiện khi có lớp được chọn */}
        {selectedClass && (
          <div className="sticky top-14 z-20 border-b bg-background/80 backdrop-blur px-2 sm:px-6">
            <nav className="flex gap-1 overflow-x-auto">
              {TABS.map(t => {
                const isPending = t.key === 'analytics' && pendingWords.length > 0;
                return (
                  <button
                    key={t.key}
                    onClick={() => changeTab(t.key, selectedClass.id)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === t.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                    {isPending && (
                      <span className="ml-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        {pendingWords.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {!selectedClass ? (
            <div className="bg-background border rounded-2xl p-12 text-center shadow-sm">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Tạo lớp học đầu tiên</h3>
              <p className="text-muted-foreground mb-6 text-sm">Lập lớp, thêm từ vựng và mời học sinh tham gia.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Tạo lớp học
              </button>
            </div>
          ) : (
            <>
              {/* Stat strip — luôn hiện trên cùng để có ngữ cảnh nhanh */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                  <div key={stat.label} className="bg-background border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold">{stat.val}</p>
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'students' && (
                <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="font-bold">Tiến độ học sinh</h2>
                    <span className="text-xs text-muted-foreground">{students.length} đã tham gia</span>
                  </div>
                  {students.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="font-semibold text-muted-foreground">Chưa có học sinh</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Chia sẻ mã mời <span className="font-mono font-bold text-primary">{selectedClass.invite_code}</span> cho học sinh.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-6 py-3 w-12">#</th>
                            <th className="px-6 py-3 min-w-[200px]">Học sinh</th>
                            <th className="px-6 py-3 text-center">CEFR</th>
                            <th className="px-6 py-3 text-center">Thành thạo (P/A)</th>
                            <th className="px-6 py-3 text-center">Tình trạng</th>
                            <th className="px-6 py-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {students.map((s, i) => {
                            const isDormant = s.last_active && (Date.now() - new Date(s.last_active).getTime() > 3 * 86_400_000);
                            const isCramming = (s.lcs || 0) < 30 && (s.avg_quiz_accuracy || 0) > 0.8 && (s.quizzes_taken || 0) > 2;
                            const isRisingStar = (s.lcs || 0) > 80 && (s.avg_quiz_accuracy || 0) > 0.8;
                            const isAtRisk = (s.vms || 0) < 30 && (s.words_reviewed || 0) > 10;
                            return (
                              <tr key={s.student_id} className="group hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">{i + 1}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-sm truncate">{s.student_name || 'Ẩn danh'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter ${
                                    s.cefr_level?.startsWith('C') ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    s.cefr_level?.startsWith('B') ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {s.cefr_level || 'A1'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm font-bold text-emerald-500">{s.active_vms || 0}%</span>
                                      <span className="text-[10px] text-muted-foreground uppercase font-medium">Active</span>
                                    </div>
                                    <div className="w-20 h-1 bg-muted rounded-full mt-1 overflow-hidden flex">
                                      <div className="h-full bg-emerald-500" style={{ width: `${s.active_vms || 0}%` }} />
                                      <div className="h-full bg-emerald-200 opacity-50" style={{ width: `${(s.vms || 0) - (s.active_vms || 0)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 opacity-70">P: {s.vms || 0}%</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center">
                                    {isDormant ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 uppercase">Ngủ đông</span>
                                    ) : isRisingStar ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 border border-emerald-200 uppercase">Ngôi sao</span>
                                    ) : isCramming ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 border border-amber-200 uppercase">Học tủ</span>
                                    ) : isAtRisk ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 uppercase">Cần giúp</span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">Bình thường</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Link href={`/teacher/student/${s.student_id}?class=${selectedClass.id}`}>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'words' && (
                <WordsPanel key={selectedClass.id} classroomId={selectedClass.id} userId={userId} />
              )}

              {activeTab === 'grammar' && (
                <GrammarPanel key={selectedClass.id} classroomId={selectedClass.id} />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPanel
                  analytics={analytics}
                  isLoading={isLoadingAnalytics}
                  pendingWords={pendingWords}
                  approvingId={approvingId}
                  onWordStatus={handleWordStatus}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Tạo lớp học mới</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tên lớp *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="vd: Luyện thi IELTS 2026"
                  required
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mô tả (tùy chọn)</label>
                <textarea
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="vd: Lớp trung cấp mục tiêu band 7.0"
                  rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal giải thích phương pháp học (Spaced Repetition) cho giáo viên */}
      <StudyGuideModal open={showMethod} onClose={closeMethod} variant="teacher" />
    </div>
  );
}
