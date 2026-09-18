'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Classroom, Profile, StudentProgress } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain, Plus, Users, BookOpen, LogOut, Copy, Zap,
  Loader2, Trash2, TrendingUp, GraduationCap, ChevronDown, Check,
  AlertCircle, HelpCircle, Link2, Search, BarChart3, Settings, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth-fetch';
import { track } from '@/lib/analytics';
import WordsPanel from '@/components/teacher/WordsPanel';
import GrammarPanel from '@/components/teacher/GrammarPanel';
import AnalyticsPanel from '@/components/teacher/AnalyticsPanel';
import StudentsPanel, { getStudentStatus, type StudentFilter } from '@/components/teacher/StudentsPanel';
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<TeacherTab>('students');
  const [userId, setUserId] = useState<string | null>(null);
  const [showMethod, setShowMethod] = useState(false);

  // New UI states: Top Navigation Popovers & KPI Filter Link
  const [isClassSwitcherOpen, setIsClassSwitcherOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState<StudentFilter>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const classSwitcherRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (classSwitcherRef.current && !classSwitcherRef.current.contains(target)) {
        setIsClassSwitcherOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TEACHER_METHOD_KEY) !== '1') setShowMethod(true);
  }, []);
  const closeMethod = () => {
    localStorage.setItem(TEACHER_METHOD_KEY, '1');
    setShowMethod(false);
  };

  // Synchronize tab into URL (?class=&tab=)
  const changeTab = useCallback((tab: TeacherTab, classId?: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tab);
      if (classId) params.set('class', classId);
      window.history.replaceState({}, '', `/teacher?${params.toString()}`);
    }
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
      const data = (await res.json()) as { success?: boolean; data?: PendingWord[] };
      if (data.success) setPendingWords(data.data ?? []);
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadStudents = useCallback(
    async (classroomId: string) => {
      try {
        const res = await authFetch(`/api/teacher/stats?classroomId=${classroomId}&_t=${Date.now()}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        setStudents(data.students || []);
        void loadAnalytics(classroomId);
        void loadPendingWords(classroomId);
      } catch {
        toast.error('Không tải được danh sách học sinh');
      }
    },
    [loadAnalytics, loadPendingWords]
  );

  const loadData = useCallback(async (preferClassId?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }
    setUserId(user.id);

    try {
      const res = await authFetch(`/api/teacher/stats?_t=${Date.now()}`, {
        cache: 'no-store',
      });
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
        const preferred = preferClassId ? loadedClasses.find((c) => c.id === preferClassId) : undefined;
        setSelectedClass(preferred ?? loadedClasses[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Teacher data load error:', err);
      toast.error('Lỗi khi tải thông tin lớp: ' + msg);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pilot_signup') === '1') {
      track('teacher_signup_completed', {
        plan: params.get('pilot') ?? undefined,
        source: params.get('source') ?? 'teacher_landing',
      });
    }
    const urlTab = params.get('tab') as TeacherTab | null;
    if (urlTab && TABS.some((t) => t.key === urlTab)) setActiveTab(urlTab);
    void loadData(params.get('class') ?? undefined);
  }, [loadData]);

  useEffect(() => {
    if (selectedClass) void loadStudents(selectedClass.id);
  }, [selectedClass, loadStudents]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newClassName.trim()) return;
    setIsCreating(true);
    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        teacher_id: profile.id,
        name: newClassName.trim(),
        description: newClassDesc.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create classroom error:', error);
      toast.error(`Không thể tạo lớp: ${error.message}`);
    } else {
      toast.success(`Đã tạo lớp "${data.name}"!`);
      const newCls = { ...data, enrollment_count: 0 };
      setClassrooms([newCls, ...classrooms]);
      track('teacher_class_created', { classroom_id: data.id, classroom_count: classrooms.length + 1 });
      setSelectedClass(newCls);
      setShowCreateModal(false);
      setNewClassName('');
      setNewClassDesc('');
    }
    setIsCreating(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Xóa lớp này? Toàn bộ dữ liệu của lớp sẽ bị xóa.')) return;
    await supabase.from('classrooms').delete().eq('id', id);
    const updated = classrooms.filter((c) => c.id !== id);
    setClassrooms(updated);
    setSelectedClass(updated[0] || null);
    toast.success('Đã xóa lớp.');
  };

  const openClassSettings = () => {
    if (!selectedClass) return;
    setSettingsName(selectedClass.name);
    setSettingsDesc(selectedClass.description || '');
    setIsClassSwitcherOpen(false);
    setShowSettingsModal(true);
  };

  const handleUpdateClassSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !settingsName.trim()) return;
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({
          name: settingsName.trim(),
          description: settingsDesc.trim() || null,
        })
        .eq('id', selectedClass.id);

      if (error) throw error;

      const updatedClass: Classroom = {
        ...selectedClass,
        name: settingsName.trim(),
        description: settingsDesc.trim() || undefined,
      };

      setSelectedClass(updatedClass);
      setClassrooms((prev) => prev.map((c) => (c.id === selectedClass.id ? updatedClass : c)));
      setShowSettingsModal(false);
      toast.success('Đã cập nhật cài đặt lớp học!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật lớp học';
      toast.error(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Đã sao chép mã mời!');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const copyInviteLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lingopro.vn';
    const inviteUrl = `${origin}/student?joinClass=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    toast.success(`Đã sao chép link mời: ${inviteUrl}`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWordStatus = async (wordId: string, status: 'approved' | 'rejected') => {
    setApprovingId(wordId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/words/${wordId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (!json.success) throw new Error('Failed');
      setPendingWords((prev) => prev.filter((w) => w.id !== wordId));
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

  // Filter classrooms in breadcrumb popover
  const filteredClassrooms = useMemo(() => {
    const q = classSearchQuery.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter((c) => c.name.toLowerCase().includes(q));
  }, [classrooms, classSearchQuery]);

  // Compute 4 Actionable Pedagogical KPI Cards
  const kpiData = useMemo(() => {
    const total = students.length;
    if (total === 0) {
      return {
        activeText: '0/0',
        activePct: 0,
        avgVms: 0,
        avgActiveVms: 0,
        atRiskCount: 0,
        highLcsText: '0/0',
        highLcsPct: 0,
        avgLcs: 0,
      };
    }

    const now = Date.now();

    // 1. Sĩ số hoạt động (7 ngày qua)
    const activeCount = students.filter(
      (s) => s.last_active && now - new Date(s.last_active).getTime() <= 7 * 86_400_000
    ).length;
    const activePct = Math.round((activeCount / total) * 100);

    // 2. Độ bền trí nhớ TB lớp (VMS)
    const avgVms = Math.round(students.reduce((acc, s) => acc + (s.vms || 0), 0) / total);
    const avgActiveVms = Math.round(students.reduce((acc, s) => acc + (s.active_vms || 0), 0) / total);

    // 3. Cần can thiệp gấp (🔴 Cần củng cố - at_risk)
    const atRiskCount = students.filter((s) => {
      const st = getStudentStatus(s);
      return st.key === 'at_risk';
    }).length;

    // 4. Độ chăm chỉ (LCS > 70%)
    const highLcsCount = students.filter((s) => (s.lcs || 0) > 70).length;
    const highLcsPct = Math.round((highLcsCount / total) * 100);
    const avgLcs = Math.round(students.reduce((acc, s) => acc + (s.lcs || 0), 0) / total);

    return {
      activeText: `${activeCount}/${total}`,
      activePct,
      avgVms,
      avgActiveVms,
      atRiskCount,
      highLcsText: `${highLcsCount}/${total}`,
      highLcsPct,
      avgLcs,
    };
  }, [students]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-muted/40 font-sans">
        <header className="h-14 border-b bg-background px-6 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-muted/40 font-sans flex flex-col">
      {/* 1. Top Navigation Bar (56px) replacing the fixed 256px sidebar */}
      <header className="sticky top-0 z-40 h-14 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand & Breadcrumb Class Popover Switcher */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/teacher"
            className="flex items-center gap-2 font-bold text-primary shrink-0 hover:opacity-90 transition-opacity"
          >
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight">LingoPro</span>
          </Link>

          <span className="text-muted-foreground/30 font-light text-lg select-none">/</span>

          {/* Breadcrumb Class Popover Switcher */}
          <div className="relative" ref={classSwitcherRef}>
            <button
              onClick={() => setIsClassSwitcherOpen(!isClassSwitcherOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-muted/70 transition-colors text-xs sm:text-sm font-semibold max-w-[200px] sm:max-w-[300px]"
            >
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{selectedClass?.name || 'Chọn lớp học'}</span>
              {selectedClass && (
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground tabular-nums shrink-0">
                  {selectedClass.enrollment_count || 0}
                </span>
              )}
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                  isClassSwitcherOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Popover Dropdown */}
            {isClassSwitcherOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-background border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search input */}
                <div className="relative mb-2 px-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm lớp học..."
                    value={classSearchQuery}
                    onChange={(e) => setClassSearchQuery(e.target.value)}
                    className="w-full bg-muted/40 border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                </div>

                {/* Class List */}
                <div className="max-h-56 overflow-y-auto space-y-0.5 px-1">
                  {filteredClassrooms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có lớp phù hợp</p>
                  ) : (
                    filteredClassrooms.map((cls) => {
                      const isSelected = selectedClass?.id === cls.id;
                      return (
                        <button
                          key={cls.id}
                          onClick={() => {
                            setSelectedClass(cls);
                            setIsClassSwitcherOpen(false);
                            changeTab(activeTab, cls.id);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{cls.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              {cls.enrollment_count || 0} HS
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="my-1.5 border-t" />

                {/* Actions inside Switcher */}
                <div className="space-y-0.5 px-1 text-xs">
                  <button
                    onClick={() => {
                      setIsClassSwitcherOpen(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-primary font-semibold hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Tạo lớp mới
                  </button>

                  {selectedClass && (
                    <>
                      <button
                        onClick={openClassSettings}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5 text-primary" />
                        <span>Cài đặt lớp</span>
                      </button>

                      <button
                        onClick={() => copyInviteCode(selectedClass.invite_code)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Copy className="h-3.5 w-3.5" />
                          <span>
                            Mã mời: <strong className="font-mono">{selectedClass.invite_code}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-primary">
                          {copiedCode === selectedClass.invite_code ? 'Đã copy!' : 'Copy'}
                        </span>
                      </button>

                      <button
                        onClick={() => copyInviteLink(selectedClass.invite_code)}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Copy link mời tham gia</span>
                        </div>
                        <span className="text-[10px]">{copiedLink ? 'Đã copy!' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsClassSwitcherOpen(false);
                          void handleDeleteClass(selectedClass.id);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa lớp này
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick actions & Profile Popover */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Study guide trigger */}
          <button
            onClick={() => setShowMethod(true)}
            title="Phương pháp học FSRS & TESOL"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors text-xs font-semibold"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Phương pháp</span>
          </button>

          {/* Profile Menu Popover */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/70 transition-colors"
              title="Hồ sơ giáo viên"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <span className="text-xs font-semibold hidden md:inline truncate max-w-[130px]">
                {profile?.full_name || 'Giáo viên'}
              </span>
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground hidden md:inline transition-transform ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-background border rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b mb-1">
                  <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || 'Giáo viên'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{profile?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    <GraduationCap className="h-3 w-3" /> Giáo viên LingoPro
                  </span>
                </div>

                <div className="space-y-0.5 text-xs">
                  <Link
                    href="/teacher/grammar"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    <BookOpen className="h-4 w-4 text-violet-500" /> Thư viện Ngữ pháp
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setShowMethod(true);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium text-left"
                  >
                    <HelpCircle className="h-4 w-4 text-sky-500" /> Phương pháp (FSRS & TESOL)
                  </button>

                  <div className="my-1 border-t" />

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      void handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-semibold text-left"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sub-bar: Main Tabs Navigation (Học sinh | Từ vựng | Ngữ pháp | Phân tích) */}
      {selectedClass && (
        <div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur-md px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto scrollbar-none">
            {TABS.map((t) => {
              const isPending = t.key === 'analytics' && pendingWords.length > 0;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key, selectedClass.id)}
                  className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive
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
          </div>
        </div>
      )}

      {/* Main Content Area - Full screen width without 256px sidebar */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {!selectedClass ? (
          <div className="bg-background border rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Tạo lớp học đầu tiên</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Lập lớp, phân bổ từ vựng theo chuẩn FSRS và quản lý học sinh toàn diện.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Tạo lớp học mới
            </button>
          </div>
        ) : (
          <>
            {/* 4 Actionable Pedagogical KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Sĩ số hoạt động (7 ngày qua) */}
              <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sĩ số hoạt động
                  </span>
                  <div className="bg-sky-500/10 p-2 rounded-xl text-sky-600">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums">{kpiData.activeText}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {kpiData.activePct}% tương tác trong 7 ngày qua
                  </p>
                </div>
              </div>

              {/* Card 2: Độ bền trí nhớ TB lớp (VMS) */}
              <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Độ bền trí nhớ (VMS)
                  </span>
                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
                    <Brain className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600">
                    {kpiData.avgVms}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chủ động: {kpiData.avgActiveVms}% &bull; Thụ động: {kpiData.avgVms}%
                  </p>
                </div>
              </div>

              {/* Card 3: Cần can thiệp gấp (clickable to activate filter) */}
              <button
                onClick={() => {
                  setActiveTab('students');
                  setStudentFilter('at_risk');
                }}
                className={`text-left rounded-2xl p-4 shadow-sm space-y-2 transition-all cursor-pointer border ${
                  activeTab === 'students' && studentFilter === 'at_risk'
                    ? 'ring-2 ring-rose-500/80 bg-rose-500/10 border-rose-300'
                    : 'bg-background hover:border-rose-300 hover:bg-rose-50/20'
                }`}
                title="Bấm để lọc danh sách học sinh cần can thiệp"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    Cần can thiệp gấp
                  </span>
                  <div className="bg-rose-500/15 p-2 rounded-xl text-rose-600">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-700">
                    {kpiData.atRiskCount}
                  </p>
                  <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                    <span>Bấm để kích hoạt bộ lọc 🔴</span>
                  </p>
                </div>
              </button>

              {/* Card 4: Độ chăm chỉ (LCS > 70%) */}
              <div className="bg-background border rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Độ chăm chỉ (&gt;70%)
                  </span>
                  <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-indigo-600">
                    {kpiData.highLcsPct}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {kpiData.highLcsText} học sinh &bull; TB: {kpiData.avgLcs}%
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'students' && (
              <StudentsPanel
                classroomId={selectedClass.id}
                classroomName={selectedClass.name}
                inviteCode={selectedClass.invite_code}
                students={students}
                activeFilter={studentFilter}
                onFilterChange={setStudentFilter}
                onRefresh={() => {
                  void loadStudents(selectedClass.id);
                  void loadData(selectedClass.id);
                }}
              />
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
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="vd: Luyện thi TOEIC Cấp Tốc 2026"
                  required
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mô tả (tùy chọn)</label>
                <textarea
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="vd: Khóa học từ vựng nền tảng mục tiêu 750+"
                  rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Settings Modal */}
      {showSettingsModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => !isSavingSettings && setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Cài đặt lớp học</h3>
                <p className="text-xs text-muted-foreground">Chỉnh sửa thông tin và cấu hình lớp</p>
              </div>
            </div>
            <form onSubmit={handleUpdateClassSettings} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tên lớp học *</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="vd: Luyện thi TOEIC Cấp Tốc 2026"
                  required
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mô tả lớp (tùy chọn)</label>
                <textarea
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  placeholder="vd: Khóa học từ vựng nền tảng mục tiêu 750+"
                  rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Invite Code & Link quick copy */}
              <div className="p-3 bg-muted/40 border rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mã mời học sinh:</span>
                  <span className="font-mono font-bold text-primary">{selectedClass.invite_code}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyInviteCode(selectedClass.invite_code)}
                    className="flex-1 py-1.5 px-2 bg-background border rounded-lg hover:bg-muted font-medium flex items-center justify-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedCode === selectedClass.invite_code ? 'Đã copy!' : 'Copy mã'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyInviteLink(selectedClass.invite_code)}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium flex items-center justify-center gap-1"
                  >
                    <Link2 className="h-3 w-3" />
                    <span>{copiedLink ? 'Đã copy!' : 'Copy link mời'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings || !settingsName.trim()}
                  className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}
                </button>
              </div>

              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Xóa toàn bộ lớp học</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    void handleDeleteClass(selectedClass.id);
                  }}
                  className="text-xs text-destructive hover:underline font-semibold flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study Guide Modal */}
      <StudyGuideModal open={showMethod} onClose={closeMethod} variant="teacher" />
    </div>
  );
}
