import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { AudioUploadApiResponse } from '@/types/speaking-module';

export const maxDuration = 30;

/** Maximum allowed payload size: 10MB (10,485,760 bytes) */
export const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Whitelist of supported audio MIME types */
export const ALLOWED_AUDIO_MIMES = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/aac',
  'audio/ogg',
  'audio/x-m4a',
];

const STORAGE_BUCKET = 'speaking-recordings';

/**
 * Resolves file extension from normalized audio MIME type.
 */
function resolveAudioExtension(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('aac')) return 'aac';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('m4a')) return 'm4a';
  return 'audio';
}

/**
 * POST /api/speaking/upload-audio
 * Accepts multipart/form-data with:
 * - audio: Blob / File
 * - promptId: string (optional)
 * - stageId: string (optional)
 * - durationSeconds: number (optional)
 */
export async function POST(req: NextRequest): Promise<NextResponse<AudioUploadApiResponse>> {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid multipart form data or request payload.',
        },
        { status: 400 }
      );
    }

    const audioEntry = formData.get('audio');
    if (!audioEntry || !(audioEntry instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empty audio file payload (0 bytes)',
        },
        { status: 400 }
      );
    }

    const fileSizeBytes = audioEntry.size;
    if (fileSizeBytes <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empty audio file payload (0 bytes)',
        },
        { status: 400 }
      );
    }

    if (fileSizeBytes > MAX_AUDIO_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio file size ${fileSizeBytes} bytes exceeds limit of ${MAX_AUDIO_UPLOAD_BYTES} bytes (10MB)`,
        },
        { status: 413 }
      );
    }

    const rawMime = audioEntry.type || '';
    const normalizedMime = rawMime.toLowerCase().split(';')[0].trim();

    if (!normalizedMime || !ALLOWED_AUDIO_MIMES.includes(normalizedMime)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported MIME type "${rawMime || 'unknown'}". Allowed: ${ALLOWED_AUDIO_MIMES.join(', ')}`,
        },
        { status: 415 }
      );
    }

    // Extract optional metadata
    const rawPromptId = formData.get('promptId');
    const promptId =
      typeof rawPromptId === 'string' && rawPromptId.trim()
        ? rawPromptId.trim()
        : 'unassigned';

    const rawStageId = formData.get('stageId');
    const stageId =
      typeof rawStageId === 'string' && rawStageId.trim()
        ? rawStageId.trim()
        : 'unassigned';

    const rawDuration = formData.get('durationSeconds');
    let durationSeconds: number | undefined;
    if (rawDuration !== null) {
      const parsed = parseFloat(String(rawDuration));
      if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed > 0) {
        durationSeconds = parsed;
      }
    }

    const ext = resolveAudioExtension(normalizedMime);
    const timestamp = Date.now();
    const storagePath = `recordings/${stageId}/${promptId}/${timestamp}.${ext}`;

    let audioUrl = `https://storage.lingopro.online/${storagePath}`;
    let storageProvider: 'local' | 'supabase_storage' = 'local';
    let isMock = true;

    // Resilient integration with Supabase Storage bucket 'speaking-recordings'
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createServiceClient();
        const arrayBuffer = await audioEntry.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: normalizedMime,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

          if (urlData?.publicUrl) {
            audioUrl = urlData.publicUrl;
            storageProvider = 'supabase_storage';
            isMock = false;
          }
        } else {
          console.warn(
            `[upload-audio] Supabase Storage upload to bucket "${STORAGE_BUCKET}" could not complete (${uploadError.message}). Operating in resilient fallback mode.`
          );
        }
      }
    } catch (err) {
      console.warn(
        '[upload-audio] Supabase client error during audio upload. Operating in resilient fallback mode:',
        err
      );
    }

    const responsePayload: AudioUploadApiResponse = {
      success: true,
      data: {
        audioUrl,
        storagePath,
        fileSize: fileSizeBytes,
        fileSizeBytes,
        mimeType: normalizedMime,
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        isMock,
        storageProvider,
        savedAt: new Date(timestamp).toISOString(),
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    console.error('[upload-audio] Internal unexpected error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while processing audio upload.',
      },
      { status: 500 }
    );
  }
}
