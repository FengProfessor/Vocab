import {
  apiDelete,
  apiPut,
  callDotNetRaw,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapClassroomsList } from '@/features/classroom/mappers';

function parseQueryParams(input: string): URLSearchParams {
  const qIdx = input.indexOf('?');
  return new URLSearchParams(qIdx >= 0 ? input.slice(qIdx + 1) : '');
}

function safeParseJson<T = unknown>(raw?: unknown): T | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mapStudentProgress(s: Record<string, unknown>) {
  const latestQuiz = s.latestQuiz as Record<string, unknown> | null | undefined;
  const fullName = s.fullName ? String(s.fullName) : null;
  const email = String(s.email ?? '');
  return {
    student_id: String(s.studentId ?? s.student_id ?? ''),
    email,
    full_name: fullName,
    student_name: fullName || (email ? email.split('@')[0] : 'Học sinh'),
    avatar_url: s.avatarUrl ? String(s.avatarUrl) : null,
    classroom_id: String(s.classroomId ?? s.classroom_id ?? ''),
    classroom_name: String(s.classroomName ?? s.classroom_name ?? ''),
    total_words_learned: Number(s.totalWordsLearned ?? 0),
    words_due: Number(s.wordsDue ?? 0),
    avg_ease_factor: Number(s.avgEaseFactor ?? 2.5),
    total_reviews: Number(s.totalReviews ?? 0),
    last_study_at: s.lastStudyAt ? String(s.lastStudyAt) : null,
    last_active: s.trueLastActive ? String(s.trueLastActive) : s.lastStudyAt ? String(s.lastStudyAt) : null,
    vms: Number(s.vms ?? 0),
    active_vms: Number(s.activeVms ?? 0),
    lcs: Number(s.lcs ?? 0),
    communicative_depth: Number(s.communicativeDepth ?? 0),
    cefr_level: String(s.cefrLevel || 'A1') as 'A1' | 'A2' | 'B1' | 'B2' | 'C1',
    true_last_active: s.trueLastActive ? String(s.trueLastActive) : null,
    latest_quiz: latestQuiz
      ? {
          score: Number(latestQuiz.score ?? 0),
          total_questions: Number(latestQuiz.totalQuestions ?? 0),
          quiz_type: String(latestQuiz.quizType ?? 'multiple_choice'),
          completed_at: String(latestQuiz.completedAt ?? ''),
        }
      : null,
    saved_words_count: Number(s.savedWordsCount ?? 0),
    plan: String(s.plan || 'free'),
    plan_expires_at: s.planExpiresAt ? String(s.planExpiresAt) : null,
    joined_at: s.joinedAt ? String(s.joinedAt) : undefined,
  };
}

function mapConceptState(c: Record<string, unknown>) {
  return {
    concept_id: String(c.conceptId ?? c.concept_id ?? ''),
    lemma: String(c.lemma ?? ''),
    meaning_vi: String(c.meaningVi ?? c.meaning_vi ?? ''),
    cluster: String(c.cluster ?? ''),
    stage: Number(c.stage ?? 1),
    generative_power: Number(c.generativePower ?? c.generative_power ?? 50),
    status_bucket: String(c.statusBucket ?? c.status_bucket ?? 'UNCERTAIN') as
      | 'STABLE'
      | 'FRAGILE'
      | 'MISSING'
      | 'UNCERTAIN',
    active_gap: String(c.activeGap ?? c.active_gap ?? 'UNKNOWN_CONCEPT_OR_FORM'),
    sound_recognition: Boolean(c.soundRecognition ?? c.sound_recognition),
    text_recognition: Boolean(c.textRecognition ?? c.text_recognition),
    meaning_recall: Boolean(c.meaningRecall ?? c.meaning_recall),
    form_recall: Boolean(c.formRecall ?? c.form_recall),
    chunk_use: Boolean(c.chunkUse ?? c.chunk_use),
    generative_use: Boolean(c.generativeUse ?? c.generative_use),
    uncertainty_score: Number(c.uncertaintyScore ?? c.uncertainty_score ?? 1),
    consecutive_independent_passes: Number(
      c.consecutiveIndependentPasses ?? c.consecutive_independent_passes ?? 0,
    ),
    last_probed_at: c.lastProbedAt ? String(c.lastProbedAt) : null,
    audio_url: c.audioUrl ? String(c.audioUrl) : null,
    image_url: c.imageUrl ? String(c.imageUrl) : null,
    target_chunks: Array.isArray(c.targetChunks) ? c.targetChunks.map(String) : [],
  };
}

/**
 * Domain API service for Classrooms, Teacher Analytics, Student Enrollment, and Drill Assignments.
 */
export class ClassroomApi {
  /**
   * Lists classrooms for the authenticated student or teacher via `GET /api/v1/classrooms`.
   */
  public static async getClassrooms() {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>('/classrooms', {
      method: 'GET',
    });
    const payload = mapClassroomsList(body?.data);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Creates a new classroom via `POST /api/v1/classrooms`.
   */
  public static async createClassroom(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms',
      {
        method: 'POST',
        data: {
          name: body.name,
          description: body.description || '',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        classroom: resBody?.data,
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Updates an existing classroom via `PUT /api/v1/classrooms/{classroomId}`.
   */
  public static async updateClassroom(
    classroomId: string,
    body: { name: string; description?: string },
  ) {
    return apiPut<Record<string, unknown>>(`/classrooms/${classroomId}`, {
      name: body.name,
      description: body.description || '',
    });
  }

  /**
   * Deletes a classroom via `DELETE /api/v1/classrooms/{classroomId}`.
   */
  public static async deleteClassroom(classroomId: string): Promise<boolean> {
    return apiDelete<boolean>(`/classrooms/${classroomId}`);
  }

  /**
   * Joins a classroom by invite code via `POST /api/v1/classrooms/join`.
   */
  public static async joinClassroom(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/join',
      {
        method: 'POST',
        data: {
          inviteCode: body.inviteCode || body.invite_code || body.code || '',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        classroom: resBody?.data,
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Assigns a vocabulary drill to classroom students via `POST /api/v1/classrooms/assign-drill`.
   */
  public static async assignDrill(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<number>(
      '/classrooms/assign-drill',
      {
        method: 'POST',
        data: body,
      },
    );
    const msg = resBody?.message ?? '';
    const colonIdx = msg.indexOf(':');
    const words =
      colonIdx >= 0
        ? msg
            .slice(colonIdx + 1)
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
        : [];

    return withResponseCompat(
      {
        success: ok,
        count: typeof resBody?.data === 'number' ? resBody.data : 0,
        words,
        message: msg,
        error: ok ? undefined : msg || 'Không thể giao bài ôn tập.',
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves the leaderboard for a classroom via `GET /api/v1/classrooms/{classroomId}/leaderboard`.
   */
  public static async getLeaderboard(classroomIdOrUrl: string, options?: LegacyRequestOptions) {
    let classroomId = classroomIdOrUrl;
    let period = 'all';
    if (classroomIdOrUrl.includes('?')) {
      const sp = parseQueryParams(classroomIdOrUrl);
      period = sp.get('period') || 'all';
      const pathPart = classroomIdOrUrl.split('?')[0];
      const segments = pathPart.split('/').filter(Boolean);
      const lbIdx = segments.indexOf('leaderboard');
      if (lbIdx > 0) {
        classroomId = segments[lbIdx - 1];
      } else {
        classroomId = pathPart;
      }
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/leaderboard`,
      {
        method: 'GET',
        params: { period },
        headers: options?.headers,
        signal: options?.signal,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    return withResponseCompat(
      {
        success: ok,
        data: Array.isArray(dto.data) ? dto.data : [],
        period: String(dto.period ?? period),
        classroomName: String(dto.classroomName ?? ''),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves teacher classroom analytics via `GET /api/v1/classrooms/{classroomId}/analytics`.
   */
  public static async getTeacherAnalytics(classroomIdOrUrl: string) {
    const classroomId = classroomIdOrUrl.includes('?')
      ? parseQueryParams(classroomIdOrUrl).get('classroomId') || classroomIdOrUrl
      : classroomIdOrUrl;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/analytics`,
      {
        method: 'GET',
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const rawStats = (dto.classStats as Record<string, unknown>) || {};

    const mapSummary = (s: Record<string, unknown>) => {
      const fullName = s.fullName
        ? String(s.fullName)
        : s.student_name
          ? String(s.student_name)
          : null;
      const email = String(s.email ?? '');
      const studentName = fullName || (email ? email.split('@')[0] : 'Học sinh');
      const wordsLearned = Number(
        s.wordsReviewed ?? s.words_reviewed ?? s.wordsLearned ?? s.words_learned ?? 0,
      );
      const masteryPct = Number(s.vms ?? s.masteryPct ?? s.mastery_pct ?? 0);
      const easePct = Number(s.avgAccuracy ?? s.avg_accuracy ?? s.easePct ?? s.ease_pct ?? masteryPct);
      const lastStudyAt = s.lastActive
        ? String(s.lastActive)
        : s.last_active
          ? String(s.last_active)
          : s.lastStudyAt
            ? String(s.lastStudyAt)
            : undefined;
      const isActive7d = Boolean(s.isActive7d ?? s.is_active_7d);
      const lcs = Number(
        s.lcs ?? (isActive7d ? Math.max(masteryPct, 75) : Math.min(masteryPct, 45)),
      );

      return {
        student_id: String(s.studentId ?? s.student_id ?? ''),
        student_name: studentName,
        full_name: fullName,
        email,
        avatar_url: s.avatarUrl ? String(s.avatarUrl) : null,
        vms: masteryPct,
        avg_accuracy: easePct,
        words_reviewed: wordsLearned,
        words_learned: wordsLearned,
        words_due: Number(s.wordsDue ?? s.words_due ?? 0),
        total_reviews: Number(s.totalReviews ?? s.total_reviews ?? 0),
        mastery_pct: masteryPct,
        ease_pct: easePct,
        lcs,
        last_active: lastStudyAt,
        true_last_active: lastStudyAt,
        last_study_at: lastStudyAt ?? null,
        days_since_active:
          s.daysSinceActive !== null && s.daysSinceActive !== undefined
            ? Number(s.daysSinceActive)
            : null,
        is_active_7d: isActive7d,
      };
    };

    const rawTop = Array.isArray(dto.topStudents)
      ? (dto.topStudents as Record<string, unknown>[])
      : [];
    const rawStruggling = Array.isArray(dto.strugglingStudents)
      ? (dto.strugglingStudents as Record<string, unknown>[])
      : [];
    const rawCoverage = Array.isArray(dto.wordCoverage)
      ? (dto.wordCoverage as Record<string, unknown>[])
      : [];
    const rawDiff = Array.isArray(dto.wordDifficulty)
      ? (dto.wordDifficulty as Record<string, unknown>[])
      : [];
    const rawFeed = Array.isArray(dto.activityFeed)
      ? (dto.activityFeed as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        classStats: {
          active_students: Number(rawStats.active_students ?? rawStats.active7d ?? 0),
          total_enrolled: Number(rawStats.total_enrolled ?? rawStats.totalStudents ?? 0),
          total_class_words: Number(rawStats.total_class_words ?? rawStats.totalWords ?? 0),
          avg_accuracy: Number(rawStats.avg_accuracy ?? rawStats.avgMasteryPct ?? 0),
          words_due_today: Number(rawStats.words_due_today ?? 0),
          totalStudents: Number(rawStats.totalStudents ?? rawStats.total_enrolled ?? 0),
          active7d: Number(rawStats.active7d ?? rawStats.active_students ?? 0),
          inactive7d: Number(rawStats.inactive7d ?? 0),
          totalWords: Number(rawStats.totalWords ?? rawStats.total_class_words ?? 0),
          avgWordsLearned: Number(rawStats.avgWordsLearned ?? 0),
          totalReviews: Number(rawStats.totalReviews ?? 0),
          avgMasteryPct: Number(rawStats.avgMasteryPct ?? rawStats.avg_accuracy ?? 0),
          engagementRate: Number(rawStats.engagementRate ?? 0),
        },
        topStudents: rawTop.map(mapSummary),
        strugglingStudents: rawStruggling.map(mapSummary),
        wordCoverage: rawCoverage.map((w) => {
          const wordId = String(w.wordId ?? w.word_id ?? w.id ?? '');
          const studentsReviewed = Number(
            w.studentsReviewed ?? w.students_reviewed ?? w.studentsLearned ?? w.students_learned ?? 0,
          );
          const coveragePct = Number(w.coveragePct ?? w.coverage_pct ?? 0);
          return {
            id: wordId,
            word_id: wordId,
            word: String(w.word ?? ''),
            translation: String(w.translation ?? ''),
            pos: String(w.pos ?? ''),
            students_reviewed: studentsReviewed,
            students_learned: studentsReviewed,
            total_students: Number(w.totalStudents ?? w.total_students ?? 0),
            coverage_pct: coveragePct,
          };
        }),
        wordDifficulty: rawDiff.map((w) => {
          const avgStability = Number(w.avgStability ?? w.avg_stability ?? 0);
          const avgDifficulty = Number(w.avgDifficulty ?? w.avg_difficulty ?? 5);
          const totalReviews = Number(w.totalReviews ?? w.total_reviews ?? 0);
          const studentCount = Math.max(1, Number(w.studentCount ?? w.student_count ?? 1));
          const avgReviewsPerStudent = totalReviews / studentCount;
          const computedFailRate =
            w.failRate !== undefined || w.fail_rate !== undefined
              ? Number(w.failRate ?? w.fail_rate ?? 0)
              : avgStability > 0
                ? Math.round((Math.max(1, avgReviewsPerStudent) / avgStability) * 10) / 10
                : Math.round((avgDifficulty / 2) * 10) / 10;

          return {
            word_id: String(w.wordId ?? w.word_id ?? ''),
            word: String(w.word ?? ''),
            fail_rate: Number.isFinite(computedFailRate) ? Math.max(0.1, computedFailRate) : 1.0,
            translation: String(w.translation ?? ''),
            pos: String(w.pos ?? ''),
            ipa: String(w.ipa ?? ''),
            student_count: studentCount,
            avg_stability: avgStability,
            avg_difficulty: avgDifficulty,
            total_reviews: totalReviews,
          };
        }),
        activityFeed: rawFeed.map((a, idx) => {
          const studentName = String(a.studentName ?? a.student_name ?? 'Học sinh');
          const word = String(a.word ?? '');
          const translation = String(a.translation ?? '');
          const reviewCount = Number(a.reviewCount ?? a.review_count ?? 1);
          const intervalDays = Number(a.intervalDays ?? a.interval_days ?? 0);
          const timestamp = String(
            a.timestamp ?? a.reviewedAt ?? a.reviewed_at ?? new Date().toISOString(),
          );
          const type = (a.type ? String(a.type) : 'review') as
            | 'quiz'
            | 'review'
            | 'grammar'
            | 'reading'
            | 'toeic'
            | 'assessment';
          const detail = a.detail
            ? String(a.detail)
            : word
              ? `Đã ôn từ "${word}"${translation ? ` (${translation})` : ''} — lần #${reviewCount}${intervalDays > 0 ? `, chu kỳ ${intervalDays} ngày` : ''}`
              : `Đã ôn tập ${reviewCount} từ vựng`;

          return {
            type,
            student_id: String(a.studentId ?? a.student_id ?? `st-${idx}`),
            student_name: studentName,
            student_avatar: a.studentAvatar ? String(a.studentAvatar) : null,
            detail,
            timestamp,
            word,
            translation,
            interval_days: intervalDays,
            review_count: reviewCount,
            reviewed_at: timestamp,
          };
        }),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves teacher overview statistics via `GET /api/v1/classrooms/teacher-stats`.
   */
  public static async getTeacherStats(
    classroomIdOrUrl?: string | null,
    options?: LegacyRequestOptions,
  ) {
    const params: Record<string, unknown> = {};
    if (classroomIdOrUrl) {
      if (classroomIdOrUrl.includes('?')) {
        const sp = parseQueryParams(classroomIdOrUrl);
        const cid = sp.get('classroomId');
        if (cid) params.classroomId = cid;
      } else if (!classroomIdOrUrl.startsWith('/')) {
        params.classroomId = classroomIdOrUrl;
      }
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/teacher-stats',
      {
        method: 'GET',
        params,
        headers: options?.headers,
        signal: options?.signal,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const rawClassrooms = Array.isArray(dto.classrooms)
      ? (dto.classrooms as Record<string, unknown>[])
      : [];
    const rawStudents = Array.isArray(dto.students)
      ? (dto.students as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        classrooms: rawClassrooms.map((c) => ({
          id: String(c.id ?? ''),
          name: String(c.name ?? ''),
          description: c.description ? String(c.description) : null,
          invite_code: String(c.inviteCode ?? c.invite_code ?? ''),
          teacher_id: String(c.teacherId ?? c.teacher_id ?? ''),
          created_at: String(c.createdAt ?? c.created_at ?? ''),
          enrollment_count: Number(c.enrollmentCount ?? c.enrollment_count ?? 0),
        })),
        students: rawStudents.map(mapStudentProgress),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves detailed student telemetry for a classroom teacher via `GET /api/v1/classrooms/student-detail`.
   */
  public static async getStudentDetail(studentIdOrUrl: string, classroomId?: string) {
    let studentId = studentIdOrUrl;
    let resolvedClassroomId = classroomId || '';
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      studentId = sp.get('studentId') || '';
      resolvedClassroomId = sp.get('classroomId') || '';
    }

    const params: Record<string, unknown> = { studentId };
    if (resolvedClassroomId) params.classroomId = resolvedClassroomId;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/classrooms/student-detail',
      {
        method: 'GET',
        params,
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const rawHistory = Array.isArray(dto.history)
      ? (dto.history as Record<string, unknown>[])
      : [];
    const rawQuizzes = Array.isArray(dto.quizzes)
      ? (dto.quizzes as Record<string, unknown>[])
      : [];
    const rawSavedWords = Array.isArray(dto.savedWords)
      ? (dto.savedWords as Record<string, unknown>[])
      : [];
    const rawAssessments = Array.isArray(dto.toeicAssessments)
      ? (dto.toeicAssessments as Record<string, unknown>[])
      : [];
    const rawTimeline = Array.isArray(dto.timeline)
      ? (dto.timeline as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        current: dto.current
          ? mapStudentProgress(dto.current as Record<string, unknown>)
          : null,
        history: rawHistory.map((h) => ({
          vms: Number(h.vms ?? 0),
          lcs: Number(h.lcs ?? 0),
          total_words: Number(h.totalWords ?? 0),
          recorded_at: String(h.recordedAt ?? ''),
        })),
        quizzes: rawQuizzes.map((q) => ({
          id: String(q.id ?? ''),
          quiz_type: String(q.quizType ?? 'multiple_choice'),
          score: Number(q.score ?? 0),
          total_questions: Number(q.totalQuestions ?? 0),
          time_spent_seconds: Number(q.timeSpentSeconds ?? 0),
          details: safeParseJson(q.detailsJson),
          completed_at: String(q.completedAt ?? ''),
        })),
        savedWords: rawSavedWords.map((w) => ({
          id: String(w.id ?? ''),
          word: String(w.word ?? ''),
          translation: String(w.translation ?? ''),
          pos: w.pos ? String(w.pos) : null,
          ipa: w.ipa ? String(w.ipa) : null,
          example: w.example ? String(w.example) : null,
          created_at: String(w.createdAt ?? ''),
        })),
        toeicAssessments: rawAssessments.map((a) => ({
          id: String(a.id ?? ''),
          tier: String(a.tier ?? ''),
          target_id: String(a.targetId ?? ''),
          score: Number(a.score ?? 0),
          passed: Boolean(a.passed),
          details: safeParseJson(a.detailsJson),
          created_at: String(a.createdAt ?? ''),
        })),
        timeline: rawTimeline.map((t) => ({
          id: String(t.id ?? ''),
          type: String(t.type ?? 'srs_review'),
          timestamp: String(t.timestamp ?? ''),
          title: String(t.title ?? ''),
          subtitle: String(t.subtitle ?? ''),
          score: t.score !== null && t.score !== undefined ? Number(t.score) : undefined,
          total: t.total !== null && t.total !== undefined ? Number(t.total) : undefined,
          passed: t.passed !== null && t.passed !== undefined ? Boolean(t.passed) : undefined,
          badge: t.badge ? String(t.badge) : undefined,
          details: safeParseJson(t.detailsJson) ?? undefined,
        })),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves student error patterns for a classroom teacher via `GET /api/v1/classrooms/student-errors`.
   */
  public static async getStudentErrors(studentIdOrUrl: string, classroomId?: string) {
    let studentId = studentIdOrUrl;
    let resolvedClassroomId = classroomId || '';
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      studentId = sp.get('studentId') || '';
      resolvedClassroomId = sp.get('classroomId') || '';
    }

    const params: Record<string, unknown> = { studentId };
    if (resolvedClassroomId) params.classroomId = resolvedClassroomId;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>(
      '/classrooms/student-errors',
      {
        method: 'GET',
        params,
      },
    );

    const rows = Array.isArray(body?.data) ? body.data : [];
    return withResponseCompat(
      {
        success: ok,
        errors: rows.map((r) => ({
          word_id: String(r.wordId ?? ''),
          difficulty: Number(r.difficulty ?? 5),
          stability: Number(r.stability ?? 0),
          review_count: Number(r.reviewCount ?? 0),
          next_review_date: String(r.nextReviewDate ?? ''),
          last_reviewed_at: String(r.lastReviewedAt ?? ''),
          words: {
            id: String(r.wordId ?? ''),
            word: String(r.word ?? ''),
            translation: String(r.translation ?? ''),
            pos: String(r.pos ?? ''),
            ipa: String(r.ipa ?? ''),
            example: String(r.example ?? ''),
          },
        })),
      },
      status,
      ok,
    );
  }

  /**
   * Requests an AI coaching insight for a specific student via `POST /api/v1/classrooms/coaching-insight`.
   */
  public static async getCoachingInsight(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const { ok, status, body } = await callDotNetRaw<string>('/classrooms/coaching-insight', {
      method: 'POST',
      data: {
        studentName: String(payload.studentName ?? 'Học viên'),
        vms: Number(payload.vms ?? 0),
        lcs: Number(payload.lcs ?? 0),
        tag: String(payload.tag ?? ''),
        msg: String(payload.msg ?? ''),
      },
    });
    return withResponseCompat(
      {
        success: ok,
        suggestion: body?.data ?? '',
        error: ok ? undefined : body?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Adds a student to a classroom via `POST /api/v1/classrooms/{classroomId}/students`.
   */
  public static async addStudentToClassroom(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const classroomId = String(payload.classroomId ?? '').trim();
    const email = String(payload.email ?? '').trim();

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      `/classrooms/${encodeURIComponent(classroomId)}/students`,
      {
        method: 'POST',
        data: { classroomId, email },
      },
    );

    const st = body?.data;
    return withResponseCompat(
      {
        success: ok,
        student: st
          ? {
              id: String(st.id ?? ''),
              email: String(st.email ?? email),
              full_name: st.fullName ? String(st.fullName) : null,
              avatar_url: st.avatarUrl ? String(st.avatarUrl) : null,
            }
          : null,
        error: ok ? undefined : body?.message || 'Không thể thêm học sinh.',
      },
      status,
      ok,
    );
  }

  /**
   * Removes a student from a classroom via `DELETE /api/v1/classrooms/{classroomId}/students/{studentId}`.
   */
  public static async removeStudentFromClassroom(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const classroomId = String(payload.classroomId ?? '').trim();
    const studentId = String(payload.studentId ?? '').trim();

    const { ok, status, body } = await callDotNetRaw<boolean>(
      `/classrooms/${encodeURIComponent(classroomId)}/students/${encodeURIComponent(studentId)}`,
      {
        method: 'DELETE',
      },
    );

    return withResponseCompat(
      {
        success: ok,
        error: ok ? undefined : body?.message || 'Không thể xóa học sinh.',
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves the foundation vocabulary gap map for a learner via `GET /api/v1/speaking-foundation/vocabulary-map`.
   */
  public static async getVocabularyGapMap(learnerIdOrUrl: string) {
    const learnerId = learnerIdOrUrl.includes('?')
      ? parseQueryParams(learnerIdOrUrl).get('learner_id') ||
        parseQueryParams(learnerIdOrUrl).get('learnerId') ||
        learnerIdOrUrl
      : learnerIdOrUrl;

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/speaking-foundation/vocabulary-map',
      {
        method: 'GET',
        params: { learnerId },
      },
    );

    const dto = (body?.data || {}) as Record<string, unknown>;
    const bucketCounts = (dto.bucketCounts || {}) as Record<string, unknown>;
    const rawQueue = Array.isArray(dto.topRemediationQueue)
      ? (dto.topRemediationQueue as Record<string, unknown>[])
      : [];
    const rawConcepts = Array.isArray(dto.concepts)
      ? (dto.concepts as Record<string, unknown>[])
      : [];

    return withResponseCompat(
      {
        success: ok,
        data: ok
          ? {
              learner_id: String(dto.learnerId ?? learnerId),
              total_concepts: Number(dto.totalConcepts ?? 0),
              bucket_counts: {
                STABLE: Number(bucketCounts.stable ?? 0),
                FRAGILE: Number(bucketCounts.fragile ?? 0),
                MISSING: Number(bucketCounts.missing ?? 0),
                UNCERTAIN: Number(bucketCounts.uncertain ?? 0),
              },
              gap_breakdown: (dto.gapBreakdown as Record<string, number>) ?? {},
              top_remediation_queue: rawQueue.map(mapConceptState),
              concepts: rawConcepts.map(mapConceptState),
            }
          : null,
        error: ok ? undefined : body?.message,
      },
      status,
      ok,
    );
  }
}
