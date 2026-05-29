'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Classroom, Profile, StudentProgress } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain, Plus, Users, BookOpen, BarChart3, LogOut, Copy,
  CheckCircle2, Zap, Loader2, Trash2, TrendingUp, GraduationCap,
  ChevronRight, Star, Activity, Target, AlertTriangle, Clock,
  ThumbsUp, ThumbsDown, Inbox, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// --- Analytics types ---
interface ClassStats {
  active_students: number;
  total_enrolled: number;
  total_class_words: number;
  avg_accuracy: number;
  words_due_today: number;
}

interface StudentSummary {
  student_id: string;
  student_name: string;
  email: string;
  vms: number;
  avg_accuracy?: number; // cho struggling students (% đã round)
  words_reviewed: number;
  lcs: number;
  last_active?: string;
}

interface WordDifficulty {
  word_id: string;
  word: string;
  fail_rate: number;
}

interface WordCoverage {
  word_id: string;
  word: string;
  students_reviewed: number;
  coverage_pct: number;
}

interface ActivityItem {
  type: 'quiz' | 'review';
  student_id: string;
  student_name: string;
  detail: string;
  timestamp: string;
}

interface AnalyticsData {
  classStats: ClassStats;
  topStudents: StudentSummary[];
  strugglingStudents: StudentSummary[];
  wordCoverage: WordCoverage[];
  wordDifficulty: WordDifficulty[];
  activityFeed: ActivityItem[];
}

interface PendingWord {
  id: string;
  word: string;
  translation?: string;
  pos?: string;
  added_by?: string;
  created_at: string;
  adder_name?: string;
}

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
  const router = useRouter();

  const loadAnalytics = useCallback(async (teacherId: string, classroomId: string) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/teacher/analytics?teacherId=${teacherId}&classroomId=${classroomId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalytics(data as AnalyticsData);
    } catch (err: unknown) {
      console.error('[TeacherDashboard] analytics error:', err);
      // Non-fatal: analytics is a bonus, don't toast
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) loadStudents(selectedClass.id);
  }, [selectedClass]);

  const loadData = async (classId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    try {
      const url = `/api/teacher/stats?teacherId=${user.id}${classId ? `&classroomId=${classId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setProfile({ id: user.id } as Profile);

      // Handle profile fetching separately or just use what we have
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);

      setClassrooms(data.classrooms || []);
      
      // Select first classroom if not already selected
      if (!classId && data.classrooms?.length > 0) {
        setSelectedClass(data.classrooms[0]);
        // Re-run to load students for the first classroom
        loadData(data.classrooms[0].id);
      } else if (classId) {
        setStudents(data.students || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Teacher data load error:', err);
      toast.error('Failed to load classes: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (classroomId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch(`/api/teacher/stats?teacherId=${user.id}&classroomId=${classroomId}`);
      const data = await res.json();
      setStudents(data.students || []);
      // Load analytics + pending words in parallel
      void loadAnalytics(user.id, classroomId);
      void loadPendingWords(classroomId);
    } catch {
      toast.error('Failed to load students');
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
      toast.success(`Classroom "${data.name}" created!`);
      setClassrooms([{ ...data, enrollment_count: 0 }, ...classrooms]);
      setSelectedClass({ ...data, enrollment_count: 0 });
      setShowCreateModal(false);
      setNewClassName('');
      setNewClassDesc('');
    }
    setIsCreating(false);
  };


  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this classroom? All data will be lost.')) return;
    await supabase.from('classrooms').delete().eq('id', id);
    const updated = classrooms.filter(c => c.id !== id);
    setClassrooms(updated);
    setSelectedClass(updated[0] || null);
    toast.success('Classroom deleted.');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const loadPendingWords = async (classroomId: string) => {
    try {
      const res = await fetch(`/api/words?classroomId=${classroomId}&status=pending`);
      const data = await res.json() as { success?: boolean; data?: PendingWord[] };
      if (data.success) setPendingWords(data.data ?? []);
    } catch {
      // non-fatal
    }
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
      <div className="min-h-screen bg-muted/40 font-sans">
        <header className="h-14 border-b bg-background px-6 flex items-center justify-between lg:hidden">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>
        <div className="flex flex-col lg:flex-row min-h-screen">
          <aside className="hidden lg:flex w-64 border-r bg-background flex-col p-6 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </aside>
          <main className="flex-1 p-4 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-[500px] w-full rounded-2xl" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-[500px] w-full rounded-2xl" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
  const avgAccuracy = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.avg_quiz_accuracy || 0), 0) / students.length * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-muted/40 font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 flex-col border-r bg-background hidden sm:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <div className="bg-primary/10 p-1.5 rounded-lg"><Brain className="h-5 w-5" /></div>
            <span className="text-lg">LingoPro</span>
          </Link>
        </div>

        {/* Profile */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> Teacher
              </p>
            </div>
          </div>
        </div>

        {/* Classes list */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Classes</p>
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
              <p className="text-xs text-muted-foreground text-center py-4">No classes yet. Create one!</p>
            )}
          </nav>
        </div>

        <div className="p-4 border-t space-y-1">
          <Link href="/teacher/grammar" className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
            <BookOpen className="h-4 w-4" /> Grammar Lessons
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 border-b bg-background/80 backdrop-blur px-6">
          <div>
            <h1 className="font-bold text-lg">{selectedClass?.name || 'Teacher Dashboard'}</h1>
            {selectedClass && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Invite code:</p>
                <button
                  onClick={() => copyInviteCode(selectedClass.invite_code)}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md hover:bg-primary/20 transition-colors"
                >
                  {selectedClass.invite_code}
                  {copiedCode === selectedClass.invite_code
                    ? <CheckCircle2 className="h-3 w-3" />
                    : <Copy className="h-3 w-3" />
                  }
                </button>
              </div>
            )}
          </div>
          {selectedClass && (
            <div className="flex gap-2">
              <Link href={`/teacher/words/${selectedClass.id}`} className="flex items-center gap-2 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl transition-colors">
                <Plus className="h-4 w-4" /> Add Words
              </Link>
              <Link href={`/teacher/grammar/${selectedClass.id}`} className="flex items-center gap-2 text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-xl transition-colors">
                <Zap className="h-4 w-4" /> Grammar
              </Link>
              <button
                onClick={() => handleDeleteClass(selectedClass.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats cards — context-aware when class selected */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedClass && analytics ? (
              <>
                {[
                  {
                    label: 'Active (7 days)',
                    val: `${analytics.classStats.active_students}/${analytics.classStats.total_enrolled}`,
                    icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10'
                  },
                  {
                    label: 'Total Words Studied',
                    val: analytics.classStats.total_class_words,
                    icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10'
                  },
                  {
                    label: 'Avg. Quiz Accuracy',
                    val: `${analytics.classStats.avg_accuracy}%`,
                    icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10'
                  },
                  {
                    label: 'Words Due Today',
                    val: analytics.classStats.words_due_today,
                    icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10'
                  },
                ].map(stat => (
                  <div key={stat.label} className="bg-background border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.val}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'Total Students', val: totalStudents, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                  { label: 'Classrooms', val: classrooms.length, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { label: 'Students in Class', val: selectedClass ? (selectedClass.enrollment_count || 0) : 0, icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Avg. Quiz Score', val: `${avgAccuracy}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map(stat => (
                  <div key={stat.label} className="bg-background border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className={`${stat.bg} p-2.5 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.val}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Student Progress Table */}
          {selectedClass ? (
            <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-bold">Student Progress — {selectedClass.name}</h2>
                <span className="text-xs text-muted-foreground">{students.length} enrolled</span>
              </div>
              {students.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-semibold text-muted-foreground">No students yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share the invite code <span className="font-mono font-bold text-primary">{selectedClass.invite_code}</span> with your students.
                  </p>
                </div>
              ) : (
                <div className="divide-y overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 w-12">#</th>
                        <th className="px-6 py-3 min-w-[200px]">Student</th>
                        <th className="px-6 py-3 text-center">CEFR</th>
                        <th className="px-6 py-3 text-center">Mastery (P/A)</th>
                        <th className="px-6 py-3 text-center">Consistency (LCS)</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {students.map((s, i) => {
                        const isDormant = s.last_active && (new Date().getTime() - new Date(s.last_active).getTime() > 3 * 24 * 60 * 60 * 1000);
                        const isCramming = (s.lcs || 0) < 30 && (s.avg_quiz_accuracy || 0) > 0.8 && (s.quizzes_taken || 0) > 2;
                        const isRisingStar = (s.lcs || 0) > 80 && (s.avg_quiz_accuracy || 0) > 0.8;
                        const isAtRisk = (s.vms || 0) < 30 && (s.words_reviewed || 0) > 10;

                        return (
                          <tr key={s.student_id} className="group hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                {i + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{s.student_name || 'Anonymous'}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                              </div>
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
                                  <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${s.active_vms || 0}%` }}
                                  />
                                  <div
                                    className="h-full bg-emerald-200 opacity-50"
                                    style={{ width: `${(s.vms || 0) - (s.active_vms || 0)}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 opacity-70">P: {s.vms || 0}%</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                {isDormant ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 uppercase">Dormant</span>
                                ) : isRisingStar ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 border border-emerald-200 uppercase">Rising Star</span>
                                ) : isCramming ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 border border-amber-200 uppercase">Cramming</span>
                                ) : isAtRisk ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200 uppercase">At Risk</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase">Normal</span>
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

          ) : (
            <div className="bg-background border rounded-2xl p-12 text-center shadow-sm">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Create your first classroom</h3>
              <p className="text-muted-foreground mb-6 text-sm">Set up a classroom, add vocabulary, and invite your students.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Classroom
              </button>
            </div>
          )}

          {/* Analytics sections — shown only when class selected and analytics loaded */}
          {selectedClass && (
            <>
              {isLoadingAnalytics ? (
                <div className="space-y-4">
                  <div className="animate-pulse bg-white/5 rounded h-4 w-3/4" />
                  <div className="animate-pulse bg-white/5 rounded h-4 w-1/2" />
                  <div className="animate-pulse bg-white/5 rounded h-4 w-2/3" />
                </div>
              ) : analytics && (
                <>
                  {/* Row 1: Top Students + Needs Help — two-column grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Students */}
                    <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <h3 className="font-bold text-sm">Top Students</h3>
                        <span className="ml-auto text-xs text-muted-foreground">by mastery</span>
                      </div>
                      {analytics.topStudents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">No data yet</div>
                      ) : (
                        <ul className="divide-y">
                          {analytics.topStudents.map((s, i) => {
                            const initials = (s.student_name || s.email || '?')
                              .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                            return (
                              <li key={s.student_id} className="flex items-center gap-3 px-5 py-3">
                                <span className="w-5 text-xs font-bold text-muted-foreground shrink-0">{i + 1}</span>
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                  <span className="text-[11px] font-bold text-emerald-600">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{s.student_name || s.email}</p>
                                  <p className="text-[10px] text-muted-foreground">{s.words_reviewed} từ đã học</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                  {s.vms}%
                                </span>
                                {s.lcs > 70 && <span className="text-sm shrink-0" title="Streak cao">🔥</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Struggling Students */}
                    <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <h3 className="font-bold text-sm">Học sinh cần chú ý</h3>
                        <span className="ml-auto text-xs text-muted-foreground">accuracy &lt; 60%</span>
                      </div>
                      {analytics.strugglingStudents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">Tất cả học sinh đang ổn</div>
                      ) : (
                        <ul className="divide-y">
                          {analytics.strugglingStudents.map(s => {
                            const daysSince = s.last_active
                              ? Math.floor((Date.now() - new Date(s.last_active).getTime()) / 86_400_000)
                              : null;
                            const initials = (s.student_name || s.email || '?')
                              .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                            const accuracy = s.avg_accuracy ?? s.vms;
                            return (
                              <li key={s.student_id} className="flex items-center gap-3 px-5 py-3">
                                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                  <span className="text-[11px] font-bold text-rose-600">{initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{s.student_name || s.email}</p>
                                  {daysSince !== null && (
                                    <p className={`text-[10px] ${daysSince > 3 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                      {daysSince === 0 ? 'Active hôm nay' : `${daysSince} ngày trước`}
                                    </p>
                                  )}
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-rose-100 text-rose-700">
                                  {accuracy}%
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Activity Feed — full width */}
                  <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b flex items-center gap-2">
                      <Activity className="h-4 w-4 text-sky-500" />
                      <h3 className="font-bold text-sm">Recent Activity</h3>
                      <span className="ml-auto text-xs text-muted-foreground">last 7 days</span>
                    </div>
                    {analytics.activityFeed.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">No recent activity</div>
                    ) : (
                      <ul className="divide-y">
                        {analytics.activityFeed.slice(0, 10).map((item, idx) => {
                          const now = Date.now();
                          const diff = now - new Date(item.timestamp).getTime();
                          const mins = Math.floor(diff / 60_000);
                          const hrs = Math.floor(diff / 3_600_000);
                          const days = Math.floor(diff / 86_400_000);
                          const timeLabel = mins < 1 ? 'vừa xong'
                            : mins < 60 ? `${mins} phút trước`
                            : hrs < 24 ? `${hrs} giờ trước`
                            : `${days} ngày trước`;
                          return (
                            <li key={idx} className="px-5 py-3 flex items-start gap-3">
                              <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${item.type === 'quiz' ? 'bg-violet-500' : 'bg-sky-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{item.student_name}</p>
                                <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">{timeLabel}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Row 3: Word Difficulty + Vocabulary Coverage — side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Word Difficulty */}
                    {analytics.wordDifficulty && analytics.wordDifficulty.length > 0 && (
                      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <h3 className="font-bold text-sm">Từ khó nhất</h3>
                          <span className="ml-auto text-xs text-muted-foreground">fail rate cao</span>
                        </div>
                        <div className="p-5 space-y-2.5">
                          {analytics.wordDifficulty.map((wd, idx) => {
                            // Normalize fail_rate thành bar width (tương đối so với max)
                            const maxRate = analytics.wordDifficulty[0]?.fail_rate || 1;
                            const pct = Math.round((wd.fail_rate / maxRate) * 100);
                            return (
                              <div key={wd.word_id} className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                                <span className="text-sm font-semibold w-24 truncate shrink-0">{wd.word}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-orange-400 transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground w-12 text-right shrink-0">
                                  {wd.fail_rate.toFixed(1)}x
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Vocabulary Coverage */}
                    {analytics.wordCoverage.length > 0 && (
                      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                          <Target className="h-4 w-4 text-violet-500" />
                          <h3 className="font-bold text-sm">Vocabulary Coverage</h3>
                          <span className="ml-auto text-xs text-muted-foreground">
                            % học sinh đã ôn
                          </span>
                        </div>
                        <div className="p-5 space-y-2.5">
                          {analytics.wordCoverage.slice(0, 10).map(wc => (
                            <div key={wc.word_id} className="flex items-center gap-3">
                              <span className="text-sm font-semibold w-24 truncate shrink-0">{wc.word}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    wc.coverage_pct >= 80 ? 'bg-emerald-500'
                                    : wc.coverage_pct >= 50 ? 'bg-amber-400'
                                    : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${wc.coverage_pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0">{wc.coverage_pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pending words section — always shown when classroom selected */}
              {pendingWords.length > 0 && (
                <div className="bg-background border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-amber-800">Từ chờ duyệt</h3>
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      {pendingWords.length}
                    </span>
                  </div>
                  <ul className="divide-y">
                    {pendingWords.map(w => (
                      <li key={w.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{w.word}
                            {w.pos && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground uppercase">{w.pos}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{w.translation || '—'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => void handleWordStatus(w.id, 'approved')}
                            disabled={approvingId === w.id}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border border-emerald-200 disabled:opacity-50"
                          >
                            {approvingId === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                            Duyệt
                          </button>
                          <button
                            onClick={() => void handleWordStatus(w.id, 'rejected')}
                            disabled={approvingId === w.id}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors border border-rose-200 disabled:opacity-50"
                          >
                            <ThumbsDown className="h-3 w-3" /> Từ chối
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create New Classroom</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Class Name *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. IELTS Preparation 2026"
                  required
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                <textarea
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="e.g. Class for intermediate students targeting band 7.0"
                  rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border rounded-xl py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
