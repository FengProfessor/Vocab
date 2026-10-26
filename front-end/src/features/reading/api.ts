/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapDailyReadingResponse,
  mapReadingArticlesResponse,
} from '@/features/reading/mappers';

/**
 * Domain API service for Reading Library, Daily Reading, Pack Passages, and CodeMix Practice.
 */
export class ReadingApi {
  /**
   * Retrieves bilingual reading articles via `GET /api/v1/reading/articles`.
   */
  public static async getArticles(params?: Record<string, unknown> | string) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params.startsWith('/') ? '' : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params;
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/reading/articles', {
      method: 'GET',
      params: queryParams,
    });
    const payload = mapReadingArticlesResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves reading progress and bookmarks.
   */
  public static async getProgress() {
    return callServerOriginApi('/api/reading/progress', {
      method: 'GET',
    });
  }

  /**
   * Submits reading progress via `POST /api/v1/reading/daily/submit`.
   */
  public static async submitProgress(rawBody: unknown) {
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/reading/daily/submit',
      {
        method: 'POST',
        data: normalizePayloadData(rawBody),
      },
    );
    return withResponseCompat(
      {
        success: ok,
        ...(resBody ?? {}),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves the daily reading exercise via `GET /api/v1/reading/daily`.
   */
  public static async getDailyReading(params?: { recent?: number } | string) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : '';
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params as Record<string, unknown>;
    }
    const { ok, status, body } = await callDotNetRaw<Record<string, any>>('/reading/daily', {
      method: 'GET',
      params: queryParams,
    });
    const payload = mapDailyReadingResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Submits daily reading completion (`POST /api/v1/reading/daily/submit`).
   */
  public static async submitDailyReading(rawBody: unknown) {
    return ReadingApi.submitProgress(rawBody);
  }

  /**
   * Saves a word encountered in daily reading.
   */
  public static async saveDailyReadingWord(rawBody: unknown) {
    return callServerOriginApi('/api/practice/daily-reading/save-word', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a custom daily reading passage.
   */
  public static async generateDailyReading(rawBody?: unknown) {
    return callServerOriginApi('/api/practice/daily-reading/generate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a reading passage from a vocabulary pack (`/api/practice/pack-passage`).
   */
  public static async generatePackPassage(rawBody: unknown) {
    return callServerOriginApi('/api/practice/pack-passage', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Evaluates or upgrades a CodeMix sentence (`/api/practice/codemix-upgrade`).
   */
  public static async upgradeCodemix(rawBody: unknown) {
    return callServerOriginApi('/api/practice/codemix-upgrade', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Loads demo pack passage data (`/api/demo/pack-passage`).
   */
  public static async getDemoPackPassage() {
    return callServerOriginApi('/api/demo/pack-passage', {
      method: 'GET',
    });
  }

  /**
   * Generates a vocabulary mindmap (`/api/mindmap/generate`).
   */
  public static async generateMindmap(rawBody: unknown) {
    return callServerOriginApi('/api/mindmap/generate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a NotebookLM-style synthesis (`/api/mindmap/nlm`).
   */
  public static async generateMindmapNlm(rawBody: unknown) {
    return callServerOriginApi('/api/mindmap/nlm', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
