'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trophy, Flame, BookOpen, Loader2, Crown } from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarInitials: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  accuracy: number;
}

interface Classroom {
  id: string;
  name: string;
}

type Period = 'week' | 'month' | 'all';

function hashColor(userId: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class') ?? '';
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClass);
  const [period, setPeriod] = useState<Period>('week');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [classroomName, setClassroomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }
      setCurrentUserId(user.id);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('classroom:classrooms(id, name)')
        .eq('student_id', user.id);

      const classes: Classroom[] = [];
      for (const e of enrollments ?? []) {
        const cls = e.classroom as unknown as { id: string; name: string } | null;
        if (cls) classes.push(cls);
      }
      setClassrooms(classes);
      if (classes.length > 0 && !preselectedClass) setSelectedClassId(classes[0].id);
    };
    void init();
  }, [router]);

  useEffect(() => {
    if (!selectedClassId) return;
    void loadLeaderboard();
  }, [selectedClassId, period]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `/api/classrooms/${selectedClassId}/leaderboard?period=${period}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json() as { success: boolean; data?: LeaderboardEntry[]; classroomName?: string };
      if (data.success) {
        setEntries(data.data ?? []);
        setClassroomName(data.classroomName ?? '');
      }
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]] // 2nd | 1st | 3rd
    : top3;

  const periodLabels: Record<Period, string> = { week: 'Tuần này', month: 'Tháng này', all: 'Tất cả' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <Link href="/student" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" /> Bảng Xếp Hạng
            </h1>
            {classroomName && <p className="text-slate-400 text-xs mt-0.5">{classroomName}</p>}
          </div>
        </div>

        {/* Classroom + period selectors */}
        <div className="flex gap-2 flex-wrap">
          {classrooms.length > 1 && (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {(['week', 'month', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-xs font-bold transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Chưa có dữ liệu xếp hạng</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length >= 2 && (
              <div className="flex items-end justify-center gap-3 py-4">
                {podiumOrder.map((entry, podiumIdx) => {
                  if (!entry) return null;
                  const isFirst = entry.rank === 1;
                  const podiumHeight = isFirst ? 'h-24' : 'h-16';
                  const avatarSize = isFirst ? 'w-14 h-14 text-lg' : 'w-11 h-11 text-sm';
                  const isMe = entry.userId === currentUserId;
                  return (
                    <div key={entry.userId} className={`flex flex-col items-center gap-1 ${podiumIdx === 1 ? 'order-2' : podiumIdx === 0 ? 'order-1' : 'order-3'}`}>
                      {isFirst && <Crown className="h-5 w-5 text-amber-400 mb-0.5" />}
                      <div
                        className={`${avatarSize} rounded-2xl flex items-center justify-center font-black text-white border-2 ${isMe ? 'border-indigo-400' : 'border-white/10'} shadow-lg`}
                        style={{ backgroundColor: hashColor(entry.userId) }}
                      >
                        {entry.avatarInitials}
                      </div>
                      <p className={`text-xs font-bold text-center max-w-16 truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>{entry.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-amber-400 font-bold">{entry.xp.toLocaleString()} XP</p>
                      <div
                        className={`${podiumHeight} w-14 rounded-t-xl flex items-start justify-center pt-2`}
                        style={{ backgroundColor: entry.rank === 1 ? '#f59e0b33' : entry.rank === 2 ? '#94a3b833' : '#b45c2033' }}
                      >
                        <span className={`text-sm font-black ${entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-300' : 'text-amber-700'}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rank 4+ list */}
            {rest.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {rest.map(entry => {
                  const isMe = entry.userId === currentUserId;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${isMe ? 'bg-indigo-500/10 border-indigo-500/20' : ''}`}
                    >
                      <span className="w-6 text-center text-xs font-black text-slate-500">#{entry.rank}</span>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0"
                        style={{ backgroundColor: hashColor(entry.userId) }}
                      >
                        {entry.avatarInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                          {entry.name}{isMe && <span className="ml-1 text-[10px] text-indigo-400">(bạn)</span>}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span><BookOpen className="h-2.5 w-2.5 inline" /> {entry.wordsLearned} từ</span>
                          {entry.streak > 0 && <span><Flame className="h-2.5 w-2.5 inline text-orange-400" /> {entry.streak}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-400">{entry.xp.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-center text-[10px] text-slate-600">Cập nhật mỗi ngày</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
