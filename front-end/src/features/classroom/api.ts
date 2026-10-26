/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiDelete,
  apiPut,
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapClassroomsList } from '@/features/classroom/mappers';

function parseQueryParams(input: string): URLSearchParams {
  const qIdx = input.indexOf('?');
  return new URLSearchParams(qIdx >= 0 ? input.slice(qIdx + 1) : '');
}

/**
 * Domain API service for Classrooms, Teacher Analytics, Student Enrollment, and Drill Assignments.
 */
export class ClassroomApi {
  /**
   * Lists classrooms for the authenticated student or teacher via `GET /api/v1/classrooms`.
   */
  public static async getClassrooms() {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/classrooms', {
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
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>('/classrooms', {
      method: 'POST',
      data: {
        name: body.name,
        description: body.description || '',
      },
    });
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
    return apiPut<Record<string, any>>(`/classrooms/${classroomId}`, {
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
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
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
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/classrooms/assign-drill',
      {
        method: 'POST',
        data: body,
      },
    );
    return withResponseCompat(
      (resBody ?? { success: ok }) as Record<string, any>,
      status,
      ok,
    );
  }

  /**
   * Retrieves the leaderboard for a classroom.
   */
  public static async getLeaderboard(
    classroomId: string,
    options?: RequestInit & { signal?: AbortSignal | null; headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    return callServerOriginApi(`/api/classrooms/${encodeURIComponent(classroomId)}/leaderboard`, {
      method: 'GET',
      signal: options?.signal,
    });
  }

  /**
   * Retrieves teacher classroom analytics.
   */
  public static async getTeacherAnalytics(classroomIdOrUrl: string) {
    const classroomId = classroomIdOrUrl.includes('?')
      ? parseQueryParams(classroomIdOrUrl).get('classroomId') || classroomIdOrUrl
      : classroomIdOrUrl;
    return callServerOriginApi('/api/teacher/analytics', {
      method: 'GET',
      params: { classroomId },
    });
  }

  /**
   * Retrieves teacher overview statistics.
   */
  public static async getTeacherStats(
    classroomIdOrUrl?: string | null,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; signal?: AbortSignal | null; [key: string]: any },
  ) {
    const params: Record<string, unknown> = { _t: Date.now() };
    if (classroomIdOrUrl) {
      if (classroomIdOrUrl.includes('?')) {
        const sp = parseQueryParams(classroomIdOrUrl);
        const cid = sp.get('classroomId');
        if (cid) params.classroomId = cid;
      } else {
        params.classroomId = classroomIdOrUrl;
      }
    }
    return callServerOriginApi('/api/teacher/stats', {
      method: 'GET',
      params,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * Retrieves detailed student telemetry for a classroom teacher.
   */
  public static async getStudentDetail(studentIdOrUrl: string, classroomId?: string) {
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      return callServerOriginApi('/api/teacher/student-detail', {
        method: 'GET',
        params: {
          studentId: sp.get('studentId') || '',
          classroomId: sp.get('classroomId') || '',
        },
      });
    }
    return callServerOriginApi('/api/teacher/student-detail', {
      method: 'GET',
      params: { studentId: studentIdOrUrl, classroomId: classroomId || '' },
    });
  }

  /**
   * Retrieves student error patterns for a classroom teacher.
   */
  public static async getStudentErrors(studentIdOrUrl: string, classroomId?: string) {
    if (studentIdOrUrl.includes('?') && !classroomId) {
      const sp = parseQueryParams(studentIdOrUrl);
      return callServerOriginApi('/api/teacher/student-errors', {
        method: 'GET',
        params: {
          studentId: sp.get('studentId') || '',
          classroomId: sp.get('classroomId') || '',
        },
      });
    }
    return callServerOriginApi('/api/teacher/student-errors', {
      method: 'GET',
      params: { studentId: studentIdOrUrl, classroomId: classroomId || '' },
    });
  }

  /**
   * Requests an AI coaching insight for a specific student.
   */
  public static async getCoachingInsight(rawBody: unknown) {
    return callServerOriginApi('/api/teacher/coaching-insight', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Adds a student to a classroom.
   */
  public static async addStudentToClassroom(rawBody: unknown) {
    return callServerOriginApi('/api/teacher/students/add', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Removes a student from a classroom.
   */
  public static async removeStudentFromClassroom(rawBody: unknown) {
    return callServerOriginApi('/api/teacher/students/remove', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Retrieves the foundation vocabulary gap map for a learner.
   */
  public static async getVocabularyGapMap(learnerIdOrUrl: string) {
    const learnerId = learnerIdOrUrl.includes('?')
      ? parseQueryParams(learnerIdOrUrl).get('learner_id') || learnerIdOrUrl
      : learnerIdOrUrl;
    return callServerOriginApi('/api/foundation/vocabulary-map', {
      method: 'GET',
      params: { learner_id: learnerId },
    });
  }
}
