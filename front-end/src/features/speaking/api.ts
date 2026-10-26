import {
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapDiagnosticProbeDto,
  mapSpeakingFeedbackDto,
} from '@/features/speaking/mappers';
import type {
  RecordEvidenceParams,
  SpeakingDialogueParams,
} from '@/features/speaking/types';

/**
 * Domain API service for Speaking Foundation, Pronunciation & AI Speaking Dialogue.
 */
export class SpeakingApi {
  /**
   * Retrieves diagnostic speaking probes via `GET /api/v1/speaking-foundation/diagnostic/probes`.
   */
  public static async getDiagnosticProbes(options?: {
    headers?: HeadersInit | Record<string, string>;
  }) {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>(
      '/speaking-foundation/diagnostic/probes',
      {
        method: 'GET',
        headers: options?.headers,
      },
    );
    const items = Array.isArray(body?.data) ? body.data.map(mapDiagnosticProbeDto) : [];
    return withResponseCompat({ probes: items, data: items }, status, ok);
  }

  /**
   * Records lexical speaking evidence via `POST /api/v1/speaking-foundation/evidence`.
   */
  public static async recordEvidence(
    params: RecordEvidenceParams,
    options?: { headers?: HeadersInit | Record<string, string> },
  ) {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/speaking-foundation/evidence',
      {
        method: 'POST',
        data: params,
        headers: options?.headers,
      },
    );
    return withResponseCompat({ success: ok, ...(body?.data ?? {}) }, status, ok);
  }

  /**
   * Submits a learner speaking turn for AI coaching feedback via `POST /api/v1/ai-coaching/speaking/dialogue`.
   */
  public static async submitSpeakingDialogue(
    params: SpeakingDialogueParams | unknown,
    options?: { headers?: HeadersInit | Record<string, string> },
  ) {
    const payload = normalizePayloadData(params);
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/ai-coaching/speaking/dialogue',
      {
        method: 'POST',
        data: {
          lastTranscript: payload.lastTranscript || payload.transcript || '',
          history: Array.isArray(payload.history) ? payload.history : [],
        },
        headers: options?.headers,
      },
    );
    const mapped = mapSpeakingFeedbackDto(body?.data);
    return withResponseCompat(mapped, status, ok);
  }

  /**
   * Transcribes audio via Whisper STT fallback endpoint.
   */
  public static async transcribeWhisper(rawBody: unknown) {
    return callServerOriginApi('/api/speaking/stt-whisper', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
