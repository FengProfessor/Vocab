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
import {
  readWordSummaryCache,
  writeWordSummaryCache,
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
      const { count, error } = await supabase
        .from('classrooms')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', userId)
        .neq('name', '__personal__');
      const isTeacher = !error && (count ?? 0) > 0;
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

export function StudentProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ShellProfile | null>(null);
  const [gamification, setGamification] = useState<UserGamification>(DEFAULT_GAMIFICATION);
  const [wordSummary, setWordSummary] = useState<WordSummaryData>(DEFAULT_WORD_SUMMARY);
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

        // Parallel single-flight background validation
        const [profData, gamData, teacherFlag] = await Promise.all([
          fetchProfileOnce(userId),
          fetchGamificationOnce(userId),
          fetchTeacherCheckOnce(userId),
        ]);

        if (isCancelled) return;

        if (profData) {
          setProfile(profData);
          setIsTeacherUser(profData.role === 'teacher' || teacherFlag);
        } else if (teacherFlag) {
          setIsTeacherUser(true);
        }

        if (gamData) {
          setGamification(gamData);
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
