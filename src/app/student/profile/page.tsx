'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain, LayoutDashboard, BookOpen, Zap, GraduationCap, Plus,
  BarChart3, Trophy, User, Pencil, LogOut, Loader2, Save, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/useGamification';
import { xpToLevel } from '@/lib/gamification';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XpBadge } from '@/components/gamification/XpBadge';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [notificationHour, setNotificationHour] = useState(8);

  const router = useRouter();
  const { data: gamification } = useGamification(profile?.id ?? null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (prof) {
        setProfile(prof as Profile);
        setFullName(prof.full_name ?? '');
        setDailyGoal(prof.daily_goal ?? 30);
        setNotificationHour(prof.notification_hour ?? 8);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Chưa đăng nhập');

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          daily_goal: dailyGoal,
          notification_hour: notificationHour,
        }),
      });

      const result = await res.json() as { success: boolean; data?: Profile; error?: string };
      if (!res.ok || !result.success) {
        throw new Error(result.error ?? 'Lưu thất bại');
      }
      if (result.data) setProfile(result.data);
      toast.success('Đã lưu thay đổi!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name ?? profile?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const level = xpToLevel(gamification.total_xp);

  return (
    <div className="flex min-h-screen w-full bg-muted/40 font-sans">
      {/* ═══ SIDEBAR ═══ */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r bg-background hidden md:flex flex-col p-6">
        <Link href="/student" className="flex items-center gap-2 font-black text-primary text-2xl mb-10">
          <Brain className="h-8 w-8" /> LingoPro
        </Link>
        <nav className="flex-1 space-y-2">
          <Link href="/student" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </Link>
          <Link href="/flashcard" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <BookOpen className="h-5 w-5" /> Flashcards
          </Link>
          <Link href="/quiz" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <Zap className="h-5 w-5" /> Mini Quiz
          </Link>
          <Link href="/writing" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <Pencil className="h-5 w-5" /> Writing Practice
          </Link>
          <Link href="/grammar/learn" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <GraduationCap className="h-5 w-5" /> Grammar
          </Link>
          <Link href="/import" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <Plus className="h-5 w-5" /> Import Words
          </Link>
          <Link href="/student/stats" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <BarChart3 className="h-5 w-5" /> Thống kê
          </Link>
          <Link href="/student/leaderboard" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition-all font-semibold">
            <Trophy className="h-5 w-5" /> Bảng xếp hạng
          </Link>
          <Link href="/student/profile" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-bold transition-all">
            <User className="h-5 w-5" /> Hồ sơ
          </Link>
        </nav>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive rounded-xl transition-all font-semibold">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/student" className="p-2 hover:bg-muted rounded-full transition-colors md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-black text-lg sm:text-xl">Hồ sơ của tôi</h1>
          </div>
          <div className="flex items-center gap-2">
            <StreakCounter streak={gamification.current_streak} lastActiveDate={gamification.last_active_date} />
            <XpBadge totalXp={gamification.total_xp} />
          </div>
        </header>

        <div className="p-6 sm:p-10 max-w-2xl mx-auto w-full space-y-8">

          {/* Avatar + tên */}
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-3xl shrink-0 shadow-lg">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">{profile?.full_name || 'Chưa đặt tên'}</h2>
              <p className="text-sm text-muted-foreground font-semibold">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="font-bold capitalize">
                  {profile?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </Badge>
                <Badge className="bg-amber-500 text-white font-bold">
                  Level {level}
                </Badge>
              </div>
            </div>
          </div>

          {/* XP + Streak summary */}
          <div className="grid grid-cols-2 gap-4">
            <XpBadge totalXp={gamification.total_xp} variant="detailed" />
            <StreakCounter
              streak={gamification.current_streak}
              lastActiveDate={gamification.last_active_date}
              variant="detailed"
            />
          </div>

          {/* Section 1: Thông tin cá nhân */}
          <section className="bg-background border rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="font-black text-lg text-foreground">Thông tin cá nhân</h3>

            <div className="space-y-2">
              <Label htmlFor="full-name" className="font-bold">Họ và tên</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={50}
                placeholder="Nhập họ và tên..."
                className="font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Email</Label>
              <Input
                value={profile?.email ?? ''}
                readOnly
                disabled
                className="font-semibold bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Vai trò</Label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-bold capitalize">
                  {profile?.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                </Badge>
              </div>
            </div>
          </section>

          {/* Section 2: Mục tiêu học tập */}
          <section className="bg-background border rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="font-black text-lg text-foreground">Mục tiêu học tập</h3>

            {/* Daily goal slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-goal" className="font-bold">Mục tiêu hàng ngày</Label>
                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {dailyGoal} phút/ngày
                </span>
              </div>
              <input
                id="daily-goal"
                type="range"
                min={5}
                max={50}
                step={5}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <span>5 phút</span>
                <span>50 phút</span>
              </div>
            </div>

            {/* Notification hour */}
            <div className="space-y-2">
              <Label htmlFor="notification-hour" className="font-bold">Giờ nhắc nhở</Label>
              <div className="relative">
                <select
                  id="notification-hour"
                  value={notificationHour}
                  onChange={(e) => setNotificationHour(Number(e.target.value))}
                  className="w-full appearance-none px-4 py-2.5 border rounded-xl bg-background font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer pr-10"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">▼</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Bạn sẽ nhận thông báo lúc {String(notificationHour).padStart(2, '0')}:00 mỗi ngày
              </p>
            </div>
          </section>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-6 text-base font-black rounded-2xl border-b-4 border-primary/80 active:translate-y-0.5 active:border-b-0"
            variant="chunky"
          >
            {isSaving ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang lưu...</>
            ) : (
              <><Save className="h-5 w-5 mr-2" /> Lưu thay đổi</>
            )}
          </Button>

          {/* Back link */}
          <div className="text-center pb-6">
            <Link href="/student" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              ← Quay lại Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
