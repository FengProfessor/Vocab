import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ListeningVideo, ListeningVideoIndexItem } from '@/types/listening';
import videosIndexData from '@/data/listening/videos-index.json';
import { cacheGet, cacheSet } from '@/lib/ttl-cache';

const DETAILS_DIR = path.resolve(process.cwd(), 'src/data/listening/details');
const videosIndex = videosIndexData as ListeningVideoIndexItem[];
const VIDEO_DETAIL_TTL_MS = 30 * 60_000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = (searchParams.get('id') || '').trim().toLowerCase();

    if (!queryId) {
      return NextResponse.json({ error: 'Video ID parameter is required' }, { status: 400 });
    }

    // Determine target video file ID
    let targetFileId = queryId;

    // Check if queryId matches youtubeId in index
    const matchedIndex = videosIndex.find(
      (v) => v.id.toLowerCase() === queryId || v.youtubeId.toLowerCase() === queryId
    );

    if (matchedIndex) {
      targetFileId = matchedIndex.id.toLowerCase();
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(targetFileId);
    const cacheKey = `listening:video:${safeFilename}`;
    const cachedVideo = cacheGet<ListeningVideo>(cacheKey);
    if (cachedVideo) {
      return NextResponse.json(
        { success: true, video: cachedVideo },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        }
      );
    }

    const filePath = path.join(DETAILS_DIR, `${safeFilename}.json`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const videoData = JSON.parse(fileContent) as ListeningVideo;
      const normalizedVideo: ListeningVideo = {
        ...videoData,
        exercises: videoData.exercises || {
          clozeItems: videoData.clozeItems || [],
          comprehensionQuestions: videoData.comprehensionQuestions || [],
        },
      };
      cacheSet(cacheKey, normalizedVideo, VIDEO_DETAIL_TTL_MS);

      return NextResponse.json(
        {
          success: true,
          video: normalizedVideo,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        }
      );
    } catch {
      return NextResponse.json({ error: 'Video detail not found' }, { status: 404 });
    }
  } catch (err) {
    console.error('[API /api/listening/video] Error loading video detail:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
