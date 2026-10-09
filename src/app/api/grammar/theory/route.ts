import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Memory cache for all 62 grammar topics theory data
const theoryCache = new Map<string, any>();

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const topicSlug = searchParams.get('topic');

  if (!topicSlug) {
    return NextResponse.json({ success: false, error: 'topic query param is required' }, { status: 400 });
  }

  // Check cache first
  if (theoryCache.has(topicSlug)) {
    return NextResponse.json({ success: true, data: theoryCache.get(topicSlug) });
  }

  try {
    const filePath = path.join(process.cwd(), 'scripts/grammar-gen/out', `${topicSlug}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: `Topic '${topicSlug}' not found` }, { status: 404 });
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const s = raw.sections || {};

    const payload = {
      slug: raw.slug || topicSlug,
      title: raw.title || topicSlug,
      title_vi: raw.title_vi || '',
      level: raw.level || 'A1',
      order: raw.order ?? 1,
      definition: s.definition || '',
      usage: Array.isArray(s.usage) ? s.usage : [],
      formula: s.formula || { rows: [], note: '' },
      rules: Array.isArray(s.rules) ? s.rules : [],
      signals: Array.isArray(s.signals) ? s.signals : [],
      mistakes: Array.isArray(s.mistakes) ? s.mistakes : [],
      bilingual_examples: Array.isArray(s.examples)
        ? s.examples.map((ex: any) => ({
            en: ex.en,
            vi: ex.vi,
            note: ex.note || '',
            annotations: ex.annotations || [],
          }))
        : [],
      tips: s.tips || '',
      comparison: s.comparison || '',
      timeline: s.timeline || null,
    };

    theoryCache.set(topicSlug, payload);
    return NextResponse.json({ success: true, data: payload });
  } catch (err: any) {
    console.error(`[GrammarTheoryAPI] Error reading topic ${topicSlug}:`, err);
    return NextResponse.json({ success: false, error: 'Failed to load grammar theory' }, { status: 500 });
  }
}
