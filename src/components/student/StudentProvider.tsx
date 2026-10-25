'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AppSession as Session } from '@/lib/app-session-types';
import { supabase, type Profile, type UserGamification } from '@/lib/supabase';
import { effectiveCurrentStreak } from '@/lib/gamification';
import { authFetch } from '@/lib/auth-fetch';
import { authStateVersion } from '@/lib/app-auth-client';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
  WORD_SUMMARY_EVENTS,
} from '@/lib/word-summary-cache';
import {
  readLastProfileCache,
  readLastGamificationCache,
  readProfileCache,
  readGamificationCache,
  writeDashboardProfileCache,
  writeDashboardGamificationCache,
  clearDashboardSnapshotCache,
} from '@/lib/dashboard-snapshot-cache';

export type ShellProfile = Profile & {
  telegram_id?: string | null;
};

export interface WordSummaryData {
  total: number;
  newCount: number;
  reviewDueCount: number;
  dueCount: number;
  classroomId: string | null;
  levelCounts?: number[];
}

export interface StudentContextValue {
  session: Session | null;
  profile: ShellProfile | null;
  gamification: UserGamification;
  wordSummary: WordSummaryData;
  isTeacherUser: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshGamification: () => Promise<void>;
  updateWordSummary: (counts: Partial<WordSummaryData>) => void;
}

const DEFAULT_GAMIFICATION: UserGamification = {
  user_id: '',
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  daily_goal: 30,
  today_xp: 0,
  today_date: null,
};

const DEFAULT_WORD_SUMMARY: WordSummaryData = {
  total: 0,
  newCount: 0,
  reviewDueCount: 0,
  dueCount: 0,
  classroomId: null,
};

/* ═════════════════════════════════════════════════════════════════════════
 * Single-flight In-Flight Promise Cache (Deduplication across concurrent callers)
 * ═════════════════════════════════════════════════════════════════════════ */
let inFlightSession: Promise<Session | null> | null = null;
let lastSessionHadError = false;
const inFlightProfiles = new Map<string, Promise<ShellProfile | null>>();
const inFlightGamifications = new Map<string, Promise<UserGamification | null>>();
const inFlightTeacherChecks = new Map<string, Promise<boolean>>();

export function fetchSessionOnce(): Promise<Session | null> {
  if (inFlightSession) return inFlightSession;
  inFlightSession = supabase.auth
    .getSession()
    .then((res) => {
      inFlightSession = null;
      lastSessionHadError = Boolean(res.error);
      return res.data?.session ?? null;
    })
    .catch(() => {
      inFlightSession = null;
      lastSessionHadError = true;
      return null;
    });
  return inFlightSession;
}

export function fetchProfileOnce(userId: string): Promise<ShellProfile | null> {
  const version = authStateVersion();
  const requestKey = `${version}:${userId}`;
  const existing = inFlightProfiles.get(requestKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, plan, plan_expires_at, created_at')
        .eq('id', userId)
        .single();
      if (version !== authStateVersion()) return null;
      if (!error && data) {
        setStoredProfile(userId, data as ShellProfile);
        return data as ShellProfile;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightProfiles.delete(requestKey);
    }
  })();

  inFlightProfiles.set(requestKey, promise);
  return promise;
}

export function fetchGamificationOnce(userId: string): Promise<UserGamification | null> {
  const existing = inFlightGamifications.get(userId);
  if (existing) return existing;

  const version = authStateVersion();
  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (version !== authStateVersion()) return null;
      if (!error && data) {
        const normalized: UserGamification = {
          ...data,
          current_streak: effectiveCurrentStreak(data.current_streak, data.last_active_date),
        };
        setStoredGamification(userId, normalized);
        return normalized;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightGamifications.delete(userId);
    }
  })();

  inFlightGamifications.set(userId, promise);
  return promise;
}

export function fetchTeacherCheckOnce(userId: string): Promise<boolean> {
  const existing = inFlightTeacherChecks.get(userId);
  if (existing) return existing;

  const version = authStateVersion();
  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', userId)
        .neq('name', '__personal__')
        .limit(1);
      if (version !== authStateVersion()) return false;
      const isTeacher = !error && Boolean(data && data.length > 0);
      setStoredTeacher(userId, isTeacher);
      return isTeacher;
    } catch {
      return false;
    } finally {
      inFlightTeacherChecks.delete(userId);
    }
  })();

  inFlightTeacherChecks.set(userId, promise);
  return promise;
}

const inFlightWordSummaries = new Map<string, Promise<WordSummaryData | null>>();

export function fetchWordSummaryOnce(userId: string): Promise<WordSummaryData | null> {
  const existing = inFlightWordSummaries.get(userId);
  if (existing) return existing;

  const version = authStateVersion();
  const promise = (async () => {
    try {
      const res = await authFetch('/api/words?summary=1&classroomId=__personal__', {});
      const json = await res.json();
      if (version !== authStateVersion()) return null;
      if (json?.success) {
        const parsedLevels = Array.isArray(json.levelCounts)
          ? json.levelCounts.map((n: unknown) => Number(n) || 0)
          : undefined;
        const summary: WordSummaryData = {
          total: Number(json.total ?? 0),
          newCount: Number(json.newCount ?? 0),
          reviewDueCount: Number(json.reviewDueCount ?? 0),
          dueCount: Number(json.dueCount ?? 0),
          classroomId: json.classroomId ?? null,
          ...(parsedLevels ? { levelCounts: parsedLevels } : {}),
        };
        writeWordSummaryCache(userId, summary);
        return summary;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightWordSummaries.delete(userId);
    }
  })();

  inFlightWordSummaries.set(userId, promise);
  return promise;
}

/* ═════════════════════════════════════════════════════════════════════════
 * SWR sessionStorage Cache Utilities
 * ═════════════════════════════════════════════════════════════════════════ */
export function getStoredProfile(userId: string): ShellProfile | null {
  if (typeof window === 'undefined') return null;
  const fromCache = readProfileCache(userId);
  if (fromCache) return fromCache;
  try {
    const raw = sessionStorage.getItem(`lp:profile:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredProfile(userId: string, profile: ShellProfile): void {
  if (typeof window === 'undefined') return;
  writeDashboardProfileCache(userId, profile);
  try {
    sessionStorage.setItem(`lp:profile:${userId}`, JSON.stringify(profile));
  } catch {}
}

export function getStoredGamification(userId: string): UserGamification | null {
  if (typeof window === 'undefined') return null;
  const fromCache = readGamificationCache(userId);
  if (fromCache) return fromCache;
  try {
    const raw = sessionStorage.getItem(`lp:gamification:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredGamification(userId: string, gamification: UserGamification): void {
  if (typeof window === 'undefined') return;
  writeDashboardGamificationCache(userId, gamification);
  try {
    sessionStorage.setItem(`lp:gamification:${userId}`, JSON.stringify(gamification));
  } catch {}
}

export function getStoredTeacher(userId: string): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = sessionStorage.getItem(`lp:teacher:${userId}`);
    return val === null ? null : val === 'true';
  } catch {
    return null;
  }
}

export function setStoredTeacher(userId: string, isTeacher: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`lp:teacher:${userId}`, String(isTeacher));
  } catch {}
}

/* ═════════════════════════════════════════════════════════════════════════
 * React Context & Hook
 * ═════════════════════════════════════════════════════════════════════════ */
const StudentContext = createContext<StudentContextValue | null>(null);

export function useStudentContext() {
  return useContext(StudentContext);
}

function StudentProviderInner({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ShellProfile | null>(() => readLastProfileCache());
  const [gamification, setGamification] = useState<UserGamification>(
    () => readLastGamificationCache() ?? DEFAULT_GAMIFICATION,
  );
  const [wordSummary, setWordSummary] = useState<WordSummaryData>(() => {
    const cached = readLastWordSummaryCache();
    return cached
      ? {
          total: cached.total,
          newCount: cached.newCount,
          reviewDueCount: cached.reviewDueCount,
          dueCount: cached.dueCount ?? 0,
          classroomId: cached.classroomId ?? null,
          levelCounts: cached.levelCounts,
        }
      : DEFAULT_WORD_SUMMARY;
  });
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(() => {
    return readLastProfileCache()?.role === 'teacher';
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !readLastProfileCache());

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const version = authStateVersion();
    const fresh = await fetchProfileOnce(session.user.id);
    if (fresh && version === authStateVersion()) {
      setProfile(fresh);
      writeDashboardProfileCache(session.user.id, fresh);
      if (fresh.role === 'teacher') {
        setIsTeacherUser(true);
      }
    }
  }, [session]);

  const refreshGamification = useCallback(async () => {
    if (!session?.user?.id) return;
    const version = authStateVersion();
    const fresh = await fetchGamificationOnce(session.user.id);
    if (fresh && version === authStateVersion()) {
      setGamification(fresh);
      writeDashboardGamificationCache(session.user.id, fresh);
    }
  }, [session]);

  const updateWordSummary = useCallback(
    (counts: Partial<WordSummaryData>) => {
      setWordSummary((prev) => {
        const next: WordSummaryData = {
          total: counts.total !== undefined ? counts.total : prev.total,
          newCount: counts.newCount !== undefined ? counts.newCount : prev.newCount,
          reviewDueCount: counts.reviewDueCount !== undefined ? counts.reviewDueCount : prev.reviewDueCount,
          dueCount: counts.dueCount !== undefined ? counts.dueCount : prev.dueCount,
          classroomId: counts.classroomId !== undefined ? counts.classroomId : prev.classroomId,
          levelCounts: counts.levelCounts !== undefined ? counts.levelCounts : prev.levelCounts,
        };
        if (session?.user?.id && (!next.classroomId || next.classroomId === '__personal__')) {
          writeWordSummaryCache(session.user.id, {
            total: next.total,
            newCount: next.newCount,
            reviewDueCount: next.reviewDueCount,
            dueCount: next.dueCount,
            classroomId: next.classroomId,
            levelCounts: next.levelCounts,
          });
        }
        return next;
      });
    },
    [session],
  );

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      const version = authStateVersion();
      try {
        const currentSession = await fetchSessionOnce();
        if (isCancelled || version !== authStateVersion()) return;
        setSession(currentSession);

        const userId = currentSession?.user?.id;
        if (!userId) {
          if (!lastSessionHadError) {
            setProfile(null);
            setGamification(DEFAULT_GAMIFICATION);
            setWordSummary(DEFAULT_WORD_SUMMARY);
            setIsTeacherUser(false);
            clearDashboardSnapshotCache();
          }
          setIsLoading(false);
          return;
        }

        // SWR: Synchronous hydration from cache first
        const cachedProfile = getStoredProfile(userId);
        if (cachedProfile) setProfile(cachedProfile);

        const cachedGamification = getStoredGamification(userId);
        if (cachedGamification) setGamification(cachedGamification);

        const cachedTeacher = getStoredTeacher(userId);
        if (cachedTeacher !== null) setIsTeacherUser(cachedTeacher);

        const cachedSummary = readWordSummaryCache(userId);
        if (cachedSummary) {
          setWordSummary({
            total: cachedSummary.total,
            newCount: cachedSummary.newCount,
            reviewDueCount: cachedSummary.reviewDueCount,
            dueCount: cachedSummary.dueCount ?? 0,
            classroomId: cachedSummary.classroomId ?? null,
            levelCounts: cachedSummary.levelCounts,
          });
        }

        // Parallel single-flight background validation (profile + gamification + teacher + wordSummary)
        const [profData, gamData, teacherFlag, wordSum] = await Promise.all([
          fetchProfileOnce(userId),
          fetchGamificationOnce(userId),
          fetchTeacherCheckOnce(userId),
          fetchWordSummaryOnce(userId),
        ]);

        if (isCancelled || version !== authStateVersion()) return;

        if (profData) {
          setProfile(profData);
          setIsTeacherUser(profData.role === 'teacher' || teacherFlag);
          setStoredProfile(userId, profData);
          writeDashboardProfileCache(userId, profData);
          setStoredTeacher(userId, profData.role === 'teacher' || teacherFlag);
        } else if (teacherFlag) {
          setIsTeacherUser(true);
        }

        // Background check referral activation milestone
        if (currentSession?.user && typeof window !== 'undefined') {
          try {
            if (!sessionStorage.getItem('lp_ref_checked')) {
              sessionStorage.setItem('lp_ref_checked', '1');
              void fetch('/api/referral/evaluate-activation', {
                method: 'POST',
                headers: { 'X-LingoPro-Request': '1' },
              }).catch(() => null);
            }
          } catch {
            // ignore
          }
        }

        if (gamData) {
          setGamification(gamData);
          setStoredGamification(userId, gamData);
          writeDashboardGamificationCache(userId, gamData);
        }

        if (wordSum) {
          setWordSummary(wordSum);
        }

        // Milestone 2: Background prefetch offline study queue & primary tab JSON snapshots during idle time.
        // Staggered sequentially after initial dashboard load settles (6s delay + 500ms spacing)
        // so 10–50 concurrent users opening the app never cause a simultaneous API request storm.
        if (typeof window !== 'undefined' && window.location) {
          const triggerPrefetch = () => {
            if (isCancelled) return;
            void (async () => {
              try {
                const { getNetworkPolicy } = await import('@/lib/offline/network-policy');
                if (!getNetworkPolicy().canPrefetchJson) return;

                const studyMod = await import('@/lib/offline/study-queue');
                await studyMod.prefetchStudyQueue(userId);
                if (isCancelled) return;

                const warmupKey = `lp:tabs_warmup_ts:${userId}`;
                const lastWarmup = Number(sessionStorage.getItem(warmupKey) || 0);
                if (Date.now() - lastWarmup < 5 * 60 * 1000) return;
                sessionStorage.setItem(warmupKey, String(Date.now()));

                const pause = () => new Promise((r) => setTimeout(r, 500));
                const snapMod = await import('@/lib/dashboard-snapshot-cache');

                if (!snapMod.readLibraryCatalogCache() && !isCancelled) {
                  await pause();
                  await authFetch('/api/import/packages')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d?.success && Array.isArray(d.routes)) {
                        snapMod.writeLibraryCatalogCache({
                          routes: d.routes,
                          microPackSize: d.microPackSize || 7,
                          catalogVersion: d.catalogVersion || '',
                        });
                      }
                    })
                    .catch(() => {});
                }

                if (!snapMod.readLastRoadmapCache('cefr', userId) && !isCancelled) {
                  await pause();
                  await authFetch('/api/roadmap?track=cefr')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d?.success && d.data && typeof d.data === 'object') {
                        const resolvedTrack = d.data.track || 'cefr';
                        snapMod.writeRoadmapCache(resolvedTrack, [d.data], userId);
                      }
                    })
                    .catch(() => {});
                }

                // Skip daily-reading warmup if already on /student (StudentDashboard fetches it directly)
                const onMainDashboard = window.location?.pathname === '/student';
                if (!onMainDashboard && !snapMod.readLastDailyReadingCache(userId) && !isCancelled) {
                  await pause();
                  await authFetch('/api/practice/daily-reading')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d?.success && Array.isArray(d.exercises)) {
                        snapMod.writeDailyReadingCache(userId, {
                          exercises: d.exercises,
                          canGenerateToday: d.canGenerateToday,
                          hasNew: d.hasNew,
                          hasUncompleted: d.hasUncompleted,
                          uncompletedExerciseId: d.uncompletedExerciseId,
                        });
                      }
                    })
                    .catch(() => {});
                }

                if (!localStorage.getItem('lingo_grammar_topic_progress') && !isCancelled) {
                  await pause();
                  await authFetch('/api/grammar/progress?view=topics')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d?.success && Array.isArray(d.data)) {
                        const map: Record<string, { score: number; completed: boolean; completedAt?: string }> = {};
                        for (const row of d.data) {
                          map[row.topic_id] = {
                            score: row.best_score,
                            completed: row.completed,
                            completedAt: row.completed_at ?? undefined,
                          };
                        }
                        localStorage.setItem('lingo_grammar_topic_progress', JSON.stringify(map));
                      }
                    })
                    .catch(() => {});
                }
              } catch {
                // silent
              }
            })();
          };
          setTimeout(() => {
            if (isCancelled) return;
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(triggerPrefetch, { timeout: 4000 });
            } else {
              triggerPrefetch();
            }
          }, 6000);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (isCancelled) return;
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setGamification(DEFAULT_GAMIFICATION);
        setWordSummary(DEFAULT_WORD_SUMMARY);
        setIsTeacherUser(false);
        clearDashboardSnapshotCache();
      } else if (nextSession?.user) {
        const nextUserId = nextSession.user.id;
        setSession(nextSession);
        if (event === 'SIGNED_IN') {
          setProfile((prev) => (prev?.id === nextUserId ? prev : getStoredProfile(nextUserId)));
          setGamification((prev) =>
            prev.user_id === nextUserId
              ? prev
              : (getStoredGamification(nextUserId) ?? DEFAULT_GAMIFICATION),
          );
          setWordSummary(() => {
            const cached = readWordSummaryCache(nextUserId);
            if (cached) {
              return {
                total: cached.total,
                newCount: cached.newCount,
                reviewDueCount: cached.reviewDueCount,
                dueCount: cached.dueCount ?? 0,
                classroomId: cached.classroomId ?? null,
                levelCounts: cached.levelCounts,
              };
            }
            return DEFAULT_WORD_SUMMARY;
          });
          setIsTeacherUser(() => {
            const cachedTeacher = getStoredTeacher(nextUserId);
            if (cachedTeacher !== null) return cachedTeacher;
            const cachedProf = getStoredProfile(nextUserId);
            return cachedProf ? cachedProf.role === 'teacher' : false;
          });
        }
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const version = authStateVersion();
          void fetchProfileOnce(nextSession.user.id).then((p) => {
            if (!isCancelled && version === authStateVersion() && p) {
              setProfile(p);
              writeDashboardProfileCache(nextSession.user.id, p);
            }
          });
          void fetchGamificationOnce(nextSession.user.id).then((g) => {
            if (!isCancelled && version === authStateVersion() && g) {
              setGamification(g);
              writeDashboardGamificationCache(nextSession.user.id, g);
            }
          });
        }
      }
    });

    const revalidate = () => { void bootstrap(); };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    window.addEventListener('lingopro-plan-changed', revalidate);

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
      window.removeEventListener('lingopro-plan-changed', revalidate);
    };
  }, []);

  // Optimistic badge event listeners (+1 on save, rollback on error, -1 on review)
  useEffect(() => {
    const onWordSaved = () => {
      setWordSummary((prev) => {
        const nextLevels = Array.isArray(prev.levelCounts) && prev.levelCounts.length === 6
          ? [prev.levelCounts[0] + 1, ...prev.levelCounts.slice(1)]
          : prev.levelCounts;
        const next = {
          ...prev,
          total: prev.total + 1,
          newCount: prev.newCount + 1,
          dueCount: prev.dueCount + 1,
          levelCounts: nextLevels,
        };
        if (session?.user?.id) writeWordSummaryCache(session.user.id, next);
        return next;
      });
    };

    const onWordSaveRollback = () => {
      setWordSummary((prev) => {
        const nextLevels = Array.isArray(prev.levelCounts) && prev.levelCounts.length === 6
          ? [Math.max(0, prev.levelCounts[0] - 1), ...prev.levelCounts.slice(1)]
          : prev.levelCounts;
        const next = {
          ...prev,
          total: Math.max(0, prev.total - 1),
          newCount: Math.max(0, prev.newCount - 1),
          dueCount: Math.max(0, prev.dueCount - 1),
          levelCounts: nextLevels,
        };
        if (session?.user?.id) writeWordSummaryCache(session.user.id, next);
        return next;
      });
    };

    const onWordReviewed = () => {
      setWordSummary((prev) => {
        const next = {
          ...prev,
          reviewDueCount: Math.max(0, prev.reviewDueCount - 1),
          dueCount: Math.max(0, prev.dueCount - 1),
        };
        if (session?.user?.id) writeWordSummaryCache(session.user.id, next);
        return next;
      });
    };

    window.addEventListener(WORD_SUMMARY_EVENTS.SAVED, onWordSaved);
    window.addEventListener(WORD_SUMMARY_EVENTS.SAVE_ROLLBACK, onWordSaveRollback);
    window.addEventListener(WORD_SUMMARY_EVENTS.REVIEWED, onWordReviewed);
    window.addEventListener('lingo_word_saved', onWordSaved);

    return () => {
      window.removeEventListener(WORD_SUMMARY_EVENTS.SAVED, onWordSaved);
      window.removeEventListener(WORD_SUMMARY_EVENTS.SAVE_ROLLBACK, onWordSaveRollback);
      window.removeEventListener(WORD_SUMMARY_EVENTS.REVIEWED, onWordReviewed);
      window.removeEventListener('lingo_word_saved', onWordSaved);
    };
  }, [session?.user?.id]);

  const value = useMemo<StudentContextValue>(
    () => ({
      session,
      profile,
      gamification,
      wordSummary,
      isTeacherUser,
      isLoading,
      refreshProfile,
      refreshGamification,
      updateWordSummary,
    }),
    [
      session,
      profile,
      gamification,
      wordSummary,
      isTeacherUser,
      isLoading,
      refreshProfile,
      refreshGamification,
      updateWordSummary,
    ],
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const existing = useContext(StudentContext);
  if (existing) {
    return <>{children}</>;
  }
  return <StudentProviderInner>{children}</StudentProviderInner>;
}
