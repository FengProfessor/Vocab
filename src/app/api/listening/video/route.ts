import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ListeningVideo, ListeningVideoIndexItem } from '@/types/listening';
import videosIndexData from '@/data/listening/videos-index.json';

const DETAILS_DIR = path.resolve(process.cwd(), 'src/data/listening/details');
const videosIndex = videosIndexData as ListeningVideoIndexItem[];

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
    const filePath = path.join(DETAILS_DIR, `${safeFilename}.json`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const videoData = JSON.parse(fileContent) as ListeningVideo;

      return NextResponse.json(
        {
          success: true,
          video: {
            ...videoData,
            exercises: videoData.exercises || {
              clozeItems: videoData.clozeItems || [],
              comprehensionQuestions: videoData.comprehensionQuestions || [],
            },
          },
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
