import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  rateLimitUnavailableResponse,
  safeErrorResponse,
  unauthorized,
} from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';
import {
  APP_TIMEZONE,
  buildDailyActivity,
  dateKeyInTimeZone,
  resolveDisplayStreak,
} from '@/lib/gamification';
import { PRIVATE_SESSION_HEADERS, sessionErrorResponse } from '@/lib/session-response';
import { createServiceClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const READING_TOTAL_ARTICLES = 619;

type ServiceSupabase = ReturnType<typeof createServiceClient>;

interface DashboardStatsPayload {
  dailyActivity: Array<{ date: string; count: number }>;
  studyStreak: number;
  todayWords: number;
  todayNewWords: number;
  todayReviewWords: number;
  todayKey: string;
}

interface ReadingProgressPayload {
  completedCount: number;
  inProgressCount: number;
  totalReadCount: number;
  totalArticles: number;
}

interface VocabPackRow {
  user_id: string;
  pack_id: string;
  catalog_version: string;
  topic_id: string;
  topic_title: string;
  pack_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  word_count: number;
  reviewed_count: number;
  started_at: string | null;
  last_studied_at: string | null;
  completed_at: string | null;
}

interface PackWordRow {
  pack_id: string;
  word_id: string;
  position: number;
}

interface HydratedVocabPack extends VocabPackRow {
  words: PackWordRow[];
  progress: {
    reviewedCount: number;
    wordCount: number;
    percent: number;
  };
}

interface EnrolledClassroomPayload {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  joined_at: string | null;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChallengeWidgetPayload {
  activeParticipation?: {
    challenge: {
      id: string;
      name: string;
      slug: string;
      duration_days: number;
    };
    progress: {
      currentDay: number;
      totalDays: number;
      todayCompleted: boolean;
      currentStreak: number;
      totalActiveDays: number;
    };
  };
  promotedChallenge?: {
    challenge: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      duration_days: number;
      deposit_amount: number | null;
    };
  };
}

async function fetchLiteStats(
  supabase: ServiceSupabase,
  userId: string,
  now: Date,
): Promise<DashboardStatsPayload> {
  const todayKey = dateKeyInTimeZone(now);
  const fallback: DashboardStatsPayload = {
    dailyActivity: buildDailyActivity([], 30, now),
    studyStreak: 0,
    todayWords: 0,
    todayNewWords: 0,
    todayReviewWords: 0,
    todayKey,
  };

  try {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [recentRes, gamRes] = await Promise.all([
      supabase
        .from('srs_progress')
        .select('last_reviewed_at, review_count')
        .eq('user_id', userId)
        .gte('last_reviewed_at', thirtyDaysAgo)
        .not('last_reviewed_at', 'is', null),
      supabase
        .from('user_gamification')
        .select('current_streak, last_active_date')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (recentRes.error && gamRes.error) {
      console.warn('[StudentDashboard] stats query error:', recentRes.error.message, gamRes.error.message);
      return fallback;
    }

    const recentRows = recentRes.data ?? [];
    const dailyActivity = buildDailyActivity(
      recentRows.map((r) => r.last_reviewed_at as string | null),
      30,
      now,
    );
    const studyStreak = resolveDisplayStreak({
      currentStreak: gamRes.data?.current_streak,
      lastActiveDate: gamRes.data?.last_active_date,
      dailyActivity,
      now,
    });
    const todayWords = dailyActivity.find((d) => d.date === todayKey)?.count ?? 0;

    let todayNewWords = 0;
    let todayReviewWords = 0;
    for (const r of recentRows) {
      if (!r.last_reviewed_at) continue;
      const reviewedDateKey = dateKeyInTimeZone(new Date(r.last_reviewed_at as string));
      if (reviewedDateKey === todayKey) {
        if ((r.review_count ?? 0) <= 1) {
          todayNewWords++;
        } else {
          todayReviewWords++;
        }
      }
    }

    return {
      dailyActivity,
      studyStreak,
      todayWords,
      todayNewWords,
      todayReviewWords,
      todayKey,
    };
  } catch (err: unknown) {
    console.warn('[StudentDashboard] stats fallback:', err instanceof Error ? err.message : String(err));
    return fallback;
  }
}

async function fetchReadingProgress(
  supabase: ServiceSupabase,
  userId: string,
): Promise<ReadingProgressPayload> {
  const fallback: ReadingProgressPayload = {
    completedCount: 0,
    inProgressCount: 0,
    totalReadCount: 0,
    totalArticles: READING_TOTAL_ARTICLES,
  };

  try {
    const { data, error } = await supabase
      .from('user_reading_library_progress')
      .select('status')
      .eq('user_id', userId);

    if (error || !Array.isArray(data)) {
      if (error) console.warn('[StudentDashboard] reading progress error:', error.message);
      return fallback;
    }

    let completedCount = 0;
    let inProgressCount = 0;
    for (const row of data) {
      if (row.status === 'completed') completedCount++;
      else if (row.status === 'in_progress') inProgressCount++;
    }

    return {
      completedCount,
      inProgressCount,
      totalReadCount: completedCount + inProgressCount,
      totalArticles: READING_TOTAL_ARTICLES,
    };
  } catch (err: unknown) {
    console.warn('[StudentDashboard] reading progress fallback:', err instanceof Error ? err.message : String(err));
    return fallback;
  }
}

async function fetchVocabPacks(
  supabase: ServiceSupabase,
  userId: string,
): Promise<HydratedVocabPack[]> {
  try {
    const { data: packData, error: packsError } = await supabase
      .from('user_vocab_packs')
      .select(
        'user_id, pack_id, catalog_version, topic_id, topic_title, pack_index, status, word_count, reviewed_count, started_at, last_studied_at, completed_at',
      )
      .eq('user_id', userId)
      .order('last_studied_at', { ascending: false, nullsFirst: false })
      .order('pack_index', { ascending: true });

    if (packsError) {
      if (packsError.code !== '42P01' && packsError.code !== 'PGRST205') {
        console.warn('[StudentDashboard] vocab packs error:', packsError.code, packsError.message);
      }
      return [];
    }

    const packs = (packData ?? []) as VocabPackRow[];
    if (packs.length === 0) return [];

    const packIds = packs.map((pack) => pack.pack_id);
    const { data: membershipData, error: membershipError } = await supabase
      .from('user_vocab_pack_words')
      .select('pack_id, word_id, position')
      .eq('user_id', userId)
      .in('pack_id', packIds)
      .order('position', { ascending: true });

    if (membershipError) {
      console.warn('[StudentDashboard] vocab pack words error:', membershipError.message);
      return packs.map((pack) => ({
        ...pack,
        words: [],
        progress: {
          reviewedCount: pack.reviewed_count,
          wordCount: pack.word_count,
          percent: pack.word_count > 0 ? Math.round((pack.reviewed_count / pack.word_count) * 100) : 0,
        },
      }));
    }

    const wordsByPackId = new Map<string, PackWordRow[]>();
    for (const membership of (membershipData ?? []) as PackWordRow[]) {
      const list = wordsByPackId.get(membership.pack_id) ?? [];
      list.push(membership);
      wordsByPackId.set(membership.pack_id, list);
    }

    return packs.map((pack) => ({
      ...pack,
      words: wordsByPackId.get(pack.pack_id) ?? [],
      progress: {
        reviewedCount: pack.reviewed_count,
        wordCount: pack.word_count,
        percent: pack.word_count > 0 ? Math.round((pack.reviewed_count / pack.word_count) * 100) : 0,
      },
    }));
  } catch (err: unknown) {
    console.warn('[StudentDashboard] vocab packs fallback:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

async function fetchEnrolledClassrooms(
  supabase: ServiceSupabase,
  userId: string,
): Promise<EnrolledClassroomPayload[]> {
  try {
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('classroom_id, joined_at')
      .eq('student_id', userId)
      .order('joined_at', { ascending: false });

    if (enrErr) {
      console.warn('[StudentDashboard] enrollments error:', enrErr.message);
      return [];
    }
    if (!enrollments || enrollments.length === 0) return [];

    const classroomIds = enrollments.map((e) => e.classroom_id);
    const { data: classRows, error: classErr } = await supabase
      .from('classrooms')
      .select('id, name, description, invite_code, teacher_id, created_at')
      .in('id', classroomIds)
      .neq('name', '__personal__');

    if (classErr) {
      console.warn('[StudentDashboard] classrooms error:', classErr.message);
      return [];
    }

    const teacherIds = [...new Set((classRows ?? []).map((c) => c.teacher_id).filter(Boolean))];
    const { data: teacherProfiles } =
      teacherIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, email').in('id', teacherIds)
        : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };

    const teacherMap = new Map((teacherProfiles ?? []).map((t) => [t.id, t]));
    const enrMap = new Map(enrollments.map((e) => [e.classroom_id, e.joined_at]));

    return (classRows ?? []).map((cls) => {
      const teacher = teacherMap.get(cls.teacher_id);
      return {
        id: cls.id,
        name: cls.name,
        description: cls.description ?? null,
        invite_code: cls.invite_code ?? null,
        joined_at: enrMap.get(cls.id) ?? null,
        teacher: {
          id: cls.teacher_id,
          name: teacher?.full_name || 'Giáo viên',
          email: teacher?.email || '',
        },
      };
    });
  } catch (err: unknown) {
    console.warn('[StudentDashboard] classrooms fallback:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

async function fetchChallengeWidget(
  supabase: ServiceSupabase,
  userId: string,
  now: Date,
): Promise<ChallengeWidgetPayload | null> {
  try {
    const today = dateKeyInTimeZone(now, APP_TIMEZONE);
    const { data: participation, error: partError } = await supabase
      .from('challenge_participants')
      .select(
        `
        id, status, current_streak, total_active_days,
        challenge:challenges!challenge_participants_challenge_id_fkey (
          id, name, slug, duration_days, starts_at, ends_at, daily_criteria
        )
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (partError) {
      console.warn('[StudentDashboard] challenge participation error:', partError.message);
      return null;
    }

    if (participation && participation.challenge) {
      const challenge = Array.isArray(participation.challenge)
        ? participation.challenge[0]
        : participation.challenge;

      if (challenge) {
        const startDate = new Date(challenge.starts_at);
        const endDate = new Date(challenge.ends_at);
        const elapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / 86400000));
        const totalDays = Math.max(
          1,
          Math.floor((endDate.getTime() - startDate.getTime()) / 86400000),
        );
        const currentDay = Math.min(elapsed + 1, totalDays);

        const { data: todayLog } = await supabase
          .from('challenge_daily_log')
          .select('criteria_met')
          .eq('participant_id', participation.id)
          .eq('log_date', today)
          .maybeSingle();

        return {
          activeParticipation: {
            challenge: {
              id: challenge.id,
              name: challenge.name,
              slug: challenge.slug,
              duration_days: challenge.duration_days,
            },
            progress: {
              currentDay,
              totalDays,
              todayCompleted: todayLog?.criteria_met ?? false,
              currentStreak: participation.current_streak,
              totalActiveDays: participation.total_active_days,
            },
          },
        };
      }
    }

    const { data: openChallenges, error: openErr } = await supabase
      .from('challenges')
      .select('id, name, slug, description, duration_days, deposit_amount')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1);

    if (openErr) {
      console.warn('[StudentDashboard] open challenges error:', openErr.message);
      return null;
    }

    if (openChallenges && openChallenges.length > 0) {
      return {
        promotedChallenge: {
          challenge: openChallenges[0],
        },
      };
    }

    return null;
  } catch (err: unknown) {
    console.warn('[StudentDashboard] challenge widget fallback:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const denied = await assertScrapeQuota(`student-dashboard:${auth.userId}`, QUOTA.contentList);
    if (denied) return denied;

    const rawClassroomId = req.nextUrl.searchParams.get('classroomId')?.trim() || null;
    if (rawClassroomId && rawClassroomId !== '__personal__' && !UUID_REGEX.test(rawClassroomId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid classroomId' },
        { status: 400, headers: PRIVATE_SESSION_HEADERS },
      );
    }

    const supabase = createServiceClient();
    const now = new Date();

    const [stats, readingProgress, vocabPacks, classrooms, challengeWidget] = await Promise.all([
      fetchLiteStats(supabase, auth.userId, now),
      fetchReadingProgress(supabase, auth.userId),
      fetchVocabPacks(supabase, auth.userId),
      fetchEnrolledClassrooms(supabase, auth.userId),
      fetchChallengeWidget(supabase, auth.userId, now),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats,
        readingProgress,
        vocabPacks,
        classrooms,
        challengeWidget,
      },
      { headers: PRIVATE_SESSION_HEADERS },
    );
  } catch (err: unknown) {
    const sessionFailure = sessionErrorResponse(err);
    if (sessionFailure) return sessionFailure;
    const rateLimitFailure = rateLimitUnavailableResponse(err);
    if (rateLimitFailure) return rateLimitFailure;
    return safeErrorResponse(err, 'Failed to load student dashboard');
  }
}
