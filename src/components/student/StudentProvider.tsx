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
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile, type UserGamification } from '@/lib/supabase';
import { effectiveCurrentStreak } from '@/lib/gamification';
import { authFetch } from '@/lib/auth-fetch';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
  WORD_SUMMARY_EVENTS,
} from '@/lib/word-summary-cache';

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
const inFlightProfiles = new Map<string, Promise<ShellProfile | null>>();
const inFlightGamifications = new Map<string, Promise<UserGamification | null>>();
const inFlightTeacherChecks = new Map<string, Promise<boolean>>();

export function fetchSessionOnce(): Promise<Session | null> {
  if (inFlightSession) return inFlightSession;
  inFlightSession = supabase.auth
    .getSession()
    .then((res) => {
      inFlightSession = null;
      return res.data?.session ?? null;
    })
    .catch(() => {
      inFlightSession = null;
      return null;
    });
  return inFlightSession;
}

export function fetchProfileOnce(userId: string): Promise<ShellProfile | null> {
  const existing = inFlightProfiles.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, plan, plan_expires_at, created_at')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setStoredProfile(userId, data as ShellProfile);
        return data as ShellProfile;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightProfiles.delete(userId);
    }
  })();

  inFlightProfiles.set(userId, promise);
  return promise;
}

export function fetchGamificationOnce(userId: string): Promise<UserGamification | null> {
  const existing = inFlightGamifications.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();
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

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id')
        .eq('teacher_id', userId)
        .neq('name', '__personal__')
        .limit(1);
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

export function fetchWordSummaryOnce(userId: string, token?: string | null): Promise<WordSummaryData | null> {
  const existing = inFlightWordSummaries.get(userId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await authFetch('/api/words?summary=1', {}, token);
      const json = await res.json();
      if (json?.success) {
        const summary: WordSummaryData = {
          total: Number(json.total ?? 0),
          newCount: Number(json.newCount ?? 0),
          reviewDueCount: Number(json.reviewDueCount ?? 0),
          dueCount: Number(json.dueCount ?? 0),
          classroomId: json.classroomId ?? null,
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
  try {
    const raw = sessionStorage.getItem(`lp:profile:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredProfile(userId: string, profile: ShellProfile): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`lp:profile:${userId}`, JSON.stringify(profile));
  } catch {}
}

export function getStoredGamification(userId: string): UserGamification | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`lp:gamification:${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredGamification(userId: string, gamification: UserGamification): void {
  if (typeof window === 'undefined') return;
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
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [gamification, setGamification] = useState<UserGamification>(DEFAULT_GAMIFICATION);
  const [wordSummary, setWordSummary] = useState<WordSummaryData>(() => {
    const cached = readLastWordSummaryCache();
    return cached
      ? {
          total: cached.total,
          newCount: cached.newCount,
          reviewDueCount: cached.reviewDueCount,
          dueCount: cached.dueCount ?? 0,
          classroomId: cached.classroomId ?? null,
        }
      : DEFAULT_WORD_SUMMARY;
  });
  const [isTeacherUser, setIsTeacherUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const fresh = await fetchProfileOnce(session.user.id);
    if (fresh) {
      setProfile(fresh);
      if (fresh.role === 'teacher') {
        setIsTeacherUser(true);
      }
    }
  }, [session]);

  const refreshGamification = useCallback(async () => {
    if (!session?.user?.id) return;
    const fresh = await fetchGamificationOnce(session.user.id);
    if (fresh) {
      setGamification(fresh);
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
      try {
        const currentSession = await fetchSessionOnce();
        if (isCancelled) return;
        setSession(currentSession);

        const userId = currentSession?.user?.id;
        if (!userId) {
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
          });
        }

        // Parallel single-flight background validation (profile + gamification + teacher + wordSummary)
        const [profData, gamData, teacherFlag, wordSum] = await Promise.all([
          fetchProfileOnce(userId),
          fetchGamificationOnce(userId),
          fetchTeacherCheckOnce(userId),
          fetchWordSummaryOnce(userId, currentSession?.access_token),
        ]);

        if (isCancelled) return;

        if (profData) {
          setProfile(profData);
          setIsTeacherUser(profData.role === 'teacher' || teacherFlag);
          setStoredProfile(userId, profData);
          setStoredTeacher(userId, profData.role === 'teacher' || teacherFlag);
        } else if (teacherFlag) {
          setIsTeacherUser(true);
        }

        // Background check referral activation milestone
        if (currentSession?.access_token && typeof window !== 'undefined') {
          try {
            if (!sessionStorage.getItem('lp_ref_checked')) {
              sessionStorage.setItem('lp_ref_checked', '1');
              void fetch('/api/referral/evaluate-activation', {
                method: 'POST',
                headers: { Authorization: `Bearer ${currentSession.access_token}` },
              }).catch(() => null);
            }
          } catch {
            // ignore
          }
        }

        if (gamData) {
          setGamification(gamData);
        }

        if (wordSum) {
          setWordSummary(wordSum);
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
      } else if (nextSession?.user) {
        setSession(nextSession);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          void fetchProfileOnce(nextSession.user.id).then((p) => {
            if (!isCancelled && p) setProfile(p);
          });
          void fetchGamificationOnce(nextSession.user.id).then((g) => {
            if (!isCancelled && g) setGamification(g);
          });
        }
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Optimistic badge event listeners (+1 on save, rollback on error, -1 on review)
  useEffect(() => {
    const onWordSaved = () => {
      setWordSummary((prev) => {
        const next = {
          ...prev,
          total: prev.total + 1,
          newCount: prev.newCount + 1,
          dueCount: prev.dueCount + 1,
        };
        if (session?.user?.id) writeWordSummaryCache(session.user.id, next);
        return next;
      });
    };

    const onWordSaveRollback = () => {
      setWordSummary((prev) => {
        const next = {
          ...prev,
          total: Math.max(0, prev.total - 1),
          newCount: Math.max(0, prev.newCount - 1),
          dueCount: Math.max(0, prev.dueCount - 1),
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
