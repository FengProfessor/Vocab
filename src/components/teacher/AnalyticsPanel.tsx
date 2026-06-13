'use client';

import { useState } from 'react';
import { Star, AlertTriangle, Activity, Target, Flame, Inbox, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { AnalyticsData, PendingWord } from './types';

interface AnalyticsPanelProps {
  analytics: AnalyticsData | null;
  isLoading: boolean;
  pendingWords: PendingWord[];
  approvingId: string | null;
  onWordStatus: (wordId: string, status: 'approved' | 'rejected') => void;
}

/**
 * Heavy analytics section — moved off the default view into its own tab
 * so the dashboard opens clean. Top/struggling students, activity feed,
 * word difficulty, coverage, and the pending-words approval queue.
 */
export default function AnalyticsPanel({
  analytics, isLoading, pendingWords, approvingId, onWordStatus,
}: AnalyticsPanelProps) {
  // Mốc thời gian cố định 1 lần để tính "x ngày trước" — tránh impure Date.now() trong render
  const [now] = useState(() => Date.now());

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-muted rounded h-4 w-3/4" />
        <div className="animate-pulse bg-muted rounded h-4 w-1/2" />
        <div className="animate-pulse bg-muted rounded h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <>
          {/* Row 1: Top Students + Needs Help */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">{s.vms}%</span>
                        {s.lcs > 70 && <span className="text-sm shrink-0" title="Streak cao">🔥</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

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
                      ? Math.floor((now - new Date(s.last_active).getTime()) / 86_400_000)
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 bg-rose-100 text-rose-700">{accuracy}%</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Row 2: Activity Feed */}
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

          {/* Row 3: Word Difficulty + Coverage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.wordDifficulty && analytics.wordDifficulty.length > 0 && (
              <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h3 className="font-bold text-sm">Từ khó nhất</h3>
                  <span className="ml-auto text-xs text-muted-foreground">fail rate cao</span>
                </div>
                <div className="p-5 space-y-2.5">
                  {analytics.wordDifficulty.map((wd, idx) => {
                    const maxRate = analytics.wordDifficulty[0]?.fail_rate || 1;
                    const pct = Math.round((wd.fail_rate / maxRate) * 100);
                    return (
                      <div key={wd.word_id} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                        <span className="text-sm font-semibold w-24 truncate shrink-0">{wd.word}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-12 text-right shrink-0">{wd.fail_rate.toFixed(1)}x</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analytics.wordCoverage.length > 0 && (
              <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" />
                  <h3 className="font-bold text-sm">Vocabulary Coverage</h3>
                  <span className="ml-auto text-xs text-muted-foreground">% học sinh đã ôn</span>
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

      {/* Pending words approval queue */}
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
                    onClick={() => onWordStatus(w.id, 'approved')}
                    disabled={approvingId === w.id}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border border-emerald-200 disabled:opacity-50"
                  >
                    {approvingId === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
                    Duyệt
                  </button>
                  <button
                    onClick={() => onWordStatus(w.id, 'rejected')}
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

      {!analytics && pendingWords.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Chưa có dữ liệu phân tích.</p>
          <p className="text-sm">Khi học sinh bắt đầu học, số liệu sẽ hiện ở đây.</p>
        </div>
      )}
    </div>
  );
}
