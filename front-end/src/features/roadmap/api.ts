/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  callDotNetRaw,
  callLocalApi,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { buildRoadmapTreeFromDto, mapTrackToDotNet } from '@/features/roadmap/mappers';

/**
 * Domain API service for Learning Roadmaps, Placement Diagnostics, Checkpoints, and Step Progress.
 */
export class RoadmapApi {
  /**
   * Retrieves the hydrated roadmap tree for the specified track via `GET /api/v1/roadmap`.
   */
  public static async getRoadmap(track?: string | null) {
    let trackParam = track ?? null;
    if (trackParam && trackParam.includes('?')) {
      const sp = new URLSearchParams(trackParam.slice(trackParam.indexOf('?') + 1));
      trackParam = sp.get('track');
    }
    const dotNetTrack = mapTrackToDotNet(trackParam);
    const { ok, body } = await callDotNetRaw<Record<string, any>>('/roadmap', {
      method: 'GET',
      params: { track: dotNetTrack },
    });
    const dto = ok ? (body?.data ?? null) : null;
    const treeData = buildRoadmapTreeFromDto(trackParam, dto);
    return withResponseCompat({
      success: true,
      data: treeData,
    });
  }

  /**
   * Retrieves placement diagnostic test questions.
   */
  public static async getPlacementTest() {
    return callServerOriginApi('/api/roadmap/placement', {
      method: 'GET',
    });
  }

  /**
   * Submits placement diagnostic results via `POST /api/v1/roadmap/placement`.
   */
  public static async submitPlacement(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/roadmap/placement',
      {
        method: 'POST',
        data: {
          track: mapTrackToDotNet(body.track),
          levelId: body.levelId || body.level || 'A1',
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: resBody?.data,
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Marks a roadmap step as completed via `POST /api/v1/roadmap/steps/complete`.
   */
  public static async completeStep(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/roadmap/steps/complete',
      {
        method: 'POST',
        data: {
          stepId: body.stepId,
          score: body.score ?? 100,
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        data: {
          xpAwarded: resBody?.data?.xpAwarded ?? 15,
          unitCompleted: false,
          levelCompleted: false,
          levelId: 'A1',
        },
        error: resBody?.message,
      },
      status,
      ok,
    );
  }

  /**
   * Loads checkpoint assessment data for a unit (`/__local_api/roadmap/checkpoint`).
   */
  public static async getCheckpoint(unitIdOrUrl: string) {
    const unit = unitIdOrUrl.includes('?')
      ? new URLSearchParams(unitIdOrUrl.slice(unitIdOrUrl.indexOf('?') + 1)).get('unit') ||
        unitIdOrUrl
      : unitIdOrUrl;
    return callLocalApi('/__local_api/roadmap/checkpoint', {
      method: 'GET',
      params: { unit },
    });
  }

  /**
   * Submits a roadmap checkpoint, mini-quiz, or level exit assessment (`/__local_api/roadmap/assessment`).
   */
  public static async submitAssessment(rawBody: unknown) {
    return callLocalApi('/__local_api/roadmap/assessment', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
