import { NextRequest, NextResponse } from 'next/server';
import { getVocabTopic } from '@/lib/vocab-stages';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = (searchParams.get('id') || '').trim().toLowerCase();

    if (!queryId) {
      return NextResponse.json(
        { error: 'Topic ID parameter is required' },
        { status: 400 }
      );
    }

    // Defend against path traversal or malicious input
    if (queryId.length > 100 || queryId.includes('/') || queryId.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid topic ID format' },
        { status: 400 }
      );
    }

    const topic = getVocabTopic(queryId);
    if (!topic) {
      return NextResponse.json(
        { error: `Topic "${queryId}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        topic,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (err) {
    console.error('[API /api/vocab/topic] Error loading topic:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
