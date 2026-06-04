import { NextResponse } from 'next/server';
import { createServiceClient, type DictionaryData } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import pro3mData from '@/data/vocab/pro3m.json';
import pro3mPlusData from '@/data/vocab/pro3m-plus.json';

// Shape JSONB of global_dictionary.data
type GdMeaning = { pos?: string; definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] };
type GdData = { pronunciations?: { ipa?: string }[]; results?: { meanings?: GdMeaning[] }[] };

interface LessonInfo {
  cell: string;
  youtubeUrl: string;
  wordCount: number;
  words: string[];
}

interface VocabJson {
  [lessonName: string]: LessonInfo;
}

// 2 bộ data gói sẵn trong bundle → deploy được lên Vercel (KHÔNG đọc filesystem ngoài repo như tmp/)
const PACKAGES: Record<'pro3m' | 'pro3m-plus', VocabJson> = {
  'pro3m': pro3mData as unknown as VocabJson,
  'pro3m-plus': pro3mPlusData as unknown as VocabJson,
};

// Helper to get or create personal classroom
async function getOrCreatePersonalClassroom(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('classrooms')
    .select('id')
    .eq('teacher_id', userId)
    .eq('name', '__personal__')
    .single();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from('classrooms')
    .insert({
      teacher_id: userId,
      name: '__personal__',
      description: 'Personal word list',
      invite_code: `P-${userId.slice(0, 8).toUpperCase()}`,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Cannot create personal classroom: ${error.message}`);
  return created.id;
}

function getLessonCategory(name: string): string {
  const n = name.toLowerCase();
  
  if (n.startsWith('expression with') || n.includes('expression with') || n.includes('yourself')) {
    return 'Cụm từ & Thành ngữ';
  }
  if (n.startsWith('phrasal verb') || n.includes('phrasal verbs') || n.includes('phrasal verb')) {
    return 'Cụm động từ';
  }
  if (n.startsWith('unit ')) {
    return 'Từ vựng SGK (10 - 11 - 12)';
  }
  if (n.startsWith('topic ') || n.startsWith('theme ') || n.startsWith('cấp độ ')) {
    return 'Từ vựng theo chủ điểm';
  }
  if (n.startsWith('alphabetical list ')) {
    return 'Từ vựng A - Z';
  }
  
  const GroupWords = [
    'action', 'behaviour', 'age', 'agreement', 'ambition', 'anger', 'animal', 'anxiety', 'argument',
    'authority', 'beauty', 'body', 'choice', 'clothes', 'colour', 'communication', 'comparison',
    'consequence', 'country', 'description', 'efficiency', 'employment', 'enthusiasm', 'feeling',
    'food', 'travel', 'violence', 'weather'
  ];
  if (GroupWords.some(w => n.includes(w))) {
    return 'Từ vựng nhóm nghĩa';
  }
  
  return 'Ngữ pháp & Khác';
}

// Shape danh sách bài học đã phân nhóm theo category
type CategoryMap = { [cat: string]: Array<{ package: string; name: string; cell: string; youtubeUrl: string; wordCount: number }> };

// Global memory cache for categorized lessons to prevent expensive disk I/O and JSON parsing on every request.
let cachedCategories: CategoryMap | null = null;

/**
 * GET /api/import/packages
 * Returns lessons grouped by generic categories.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    if (cachedCategories) {
      return NextResponse.json({ success: true, categories: cachedCategories });
    }

    const categories: CategoryMap = {};

    const addLesson = (pkg: string, name: string, info: LessonInfo) => {
      // Bỏ qua nếu không có từ nào
      if (!info.words || info.words.length === 0) return;
      
      const cat = getLessonCategory(name);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({
        package: pkg,
        name,
        cell: info.cell,
        youtubeUrl: info.youtubeUrl,
        wordCount: info.words.length,
      });
    };

    for (const pkg of ['pro3m', 'pro3m-plus'] as const) {
      const data = PACKAGES[pkg];
      Object.keys(data).forEach(name => addLesson(pkg, name, data[name]));
    }

    // Cache the result in memory
    cachedCategories = categories;

    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('GET packages error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/import/packages
 * Body: { package: 'pro3m' | 'pro3m-plus', lessonName: string }
 * Resolves words, queries global_dictionary, and batch inserts to user words list.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const userId = auth.userId;

    const { package: pkg, lessonName } = (await req.json()) as { package?: string; lessonName?: string };
    if (!pkg || !lessonName || (pkg !== 'pro3m' && pkg !== 'pro3m-plus')) {
      return NextResponse.json({ success: false, error: 'package and lessonName are required' }, { status: 400 });
    }

    const data = PACKAGES[pkg];
    const lessonInfo = data[lessonName];

    if (!lessonInfo || !lessonInfo.words) {
      return NextResponse.json({ success: false, error: `Lesson "${lessonName}" not found in package` }, { status: 404 });
    }

    const cleanWords = lessonInfo.words
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0 && w.length < 80);

    if (cleanWords.length === 0) {
      return NextResponse.json({ success: true, imported: 0, message: 'Bài học này không có từ vựng nào.' });
    }

    const supabase = createServiceClient();
    const classroomId = await getOrCreatePersonalClassroom(supabase, userId);

    // 1. Check existing words in this user's classroom
    const { data: existingRows, error: fetchErr } = await supabase
      .from('words')
      .select('word')
      .eq('classroom_id', classroomId)
      .in('word', cleanWords);

    if (fetchErr) throw fetchErr;

    const existingSet = new Set(existingRows?.map(r => r.word.toLowerCase()) || []);
    const wordsToInsert = cleanWords.filter(w => !existingSet.has(w));

    if (wordsToInsert.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'Tất cả các từ trong bài học này đã được thêm vào trước đó rồi!',
      });
    }

    // 2. Fetch definitions and images from global_dictionary
    const { data: gdEntries, error: gdErr } = await supabase
      .from('global_dictionary')
      .select('word, data, image_url, image_source, image_confidence')
      .in('word', wordsToInsert);

    if (gdErr) throw gdErr;

    const gdMap = new Map<string, typeof gdEntries[0]>();
    if (gdEntries) {
      for (const entry of gdEntries) {
        gdMap.set(entry.word.toLowerCase(), entry);
      }
    }

    // 3. Construct rows to insert
    const rows = wordsToInsert.map(word => {
      const gdEntry = gdMap.get(word);
      if (gdEntry) {
        const gdData = (gdEntry.data ?? {}) as GdData;
        const meanings = gdData.results?.[0]?.meanings || [];
        const m = meanings[0] || {};
        
        return {
          classroom_id: classroomId,
          added_by: userId,
          word,
          translation: m.definition || '⏳ Click to enrich',
          ipa: gdData.pronunciations?.[0]?.ipa || '',
          pos: m.pos || '',
          example: m.example || '',
          image_url: gdEntry.image_url || null,
          image_source: gdEntry.image_source || 'none',
          image_confidence: gdEntry.image_confidence || null,
          synonyms: m.synonyms || [],
          antonyms: m.antonyms || [],
        };
      } else {
        // Fallback placeholder if not in cache (highly unlikely)
        return {
          classroom_id: classroomId,
          added_by: userId,
          word,
          translation: '⏳ Analyzing...',
          ipa: '',
          pos: '',
          example: '',
          image_url: null,
          image_source: 'none',
          image_confidence: null,
          synonyms: [],
          antonyms: [],
        };
      }
    });

    const { error: insertErr } = await supabase.from('words').insert(rows);
    if (insertErr) throw insertErr;

    return NextResponse.json({
      success: true,
      imported: rows.length,
      message: `Đã nhập thành công ${rows.length} từ vào danh sách tự học!`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST import package error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
