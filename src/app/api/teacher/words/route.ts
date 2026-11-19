import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  forbidden,
  getAuthUser,
  isValidString,
  safeErrorResponse,
  unauthorized,
} from '@/lib/api-security';
import type { DictionaryData, WordFamilyEntry } from '@/lib/supabase';
import { PRIVATE_SESSION_HEADERS } from '@/lib/session-response';
import { invalidateClassroomWordSummaryCaches } from '@/lib/ttl-cache';

const PAGE_SIZE = 500;
const MAX_WORDS = 2000;

type RawTeacherWordRow = {
  id: string;
  classroom_id: string;
  word: string;
  translation: string | null;
  ipa: string | null;
  pos: string | null;
  example: string | null;
  example_vi: string | null;
  image_url: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  created_at: string;
  fw: unknown;
  tn: string | null;
  sec: string | null;
  src: string | null;
};

function sanitizeFamilyWords(raw: unknown): WordFamilyEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: WordFamilyEntry[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') {
      const m = entry.trim().match(/^(.+?)\s*\(([^)]+)\)(?:\s*[:\-–]\s*(.+))?$/);
      if (m) {
        out.push({
          word: m[1].trim(),
          pos: m[2].trim(),
          ...(m[3]?.trim() ? { meaning: m[3].trim() } : {}),
        });
      } else if (entry.trim()) {
        out.push({ word: entry.trim() });
      }
    } else if (entry && typeof entry === 'object' && typeof (entry as WordFamilyEntry).word === 'string') {
      const e = entry as WordFamilyEntry;
      const w = e.word.trim();
      if (!w) continue;
      out.push({
        word: w,
        ...(e.pos?.trim() ? { pos: e.pos.trim() } : {}),
        ...(e.meaning?.trim() ? { meaning: e.meaning.trim() } : {}),
      });
    }
  }
  return out;
}

/**
 * GET /api/teacher/words?classroomId=<uuid>
 * Trả về danh sách từ vựng của lớp cho giáo viên (tối đa 2000 từ) kèm họ từ tham khảo & ghi chú.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = (searchParams.get('classroomId') || '').trim();
    if (!classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: cls, error: clsErr } = await supabase
      .from('classrooms')
      .select('id, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (clsErr) throw clsErr;
    if (!cls || cls.teacher_id !== auth.userId) {
      return forbidden('Bạn không có quyền xem từ vựng của lớp này');
    }

    const allRows: RawTeacherWordRow[] = [];
    let from = 0;

    while (allRows.length < MAX_WORDS) {
      const { data: page, error } = await supabase
        .from('words')
        .select(
          'id, classroom_id, word, translation, ipa, pos, example, example_vi, image_url, synonyms, antonyms, created_at, fw:dictionary_data->familyWords, tn:dictionary_data->>teacherNote, sec:dictionary_data->>section, src:dictionary_data->>source',
        )
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      if (!page || page.length === 0) break;
      allRows.push(...(page as RawTeacherWordRow[]));
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const data = allRows.slice(0, MAX_WORDS).map((row) => ({
      id: row.id,
      classroom_id: row.classroom_id,
      word: row.word,
      translation: row.translation || '',
      ipa: row.ipa || '',
      pos: row.pos || '',
      example: row.example || '',
      example_vi: row.example_vi || null,
      image_url: row.image_url || undefined,
      synonyms: row.synonyms || [],
      antonyms: row.antonyms || [],
      created_at: row.created_at,
      familyWords: sanitizeFamilyWords(row.fw),
      teacherNote: row.tn || '',
      section: row.sec || '',
      source: row.src || '',
    }));

    return NextResponse.json(
      { success: true, data, total: data.length },
      { headers: PRIVATE_SESSION_HEADERS },
    );
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không tải được danh sách từ của lớp');
  }
}

/**
 * PATCH /api/teacher/words
 * Cập nhật nghĩa, IPA, POS, ví dụ, họ từ tham khảo và ghi chú giáo viên cho 1 từ trong lớp.
 */
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = (await req.json()) as {
      wordId?: unknown;
      word?: unknown;
      translation?: unknown;
      pos?: unknown;
      ipa?: unknown;
      example?: unknown;
      example_vi?: unknown;
      familyWords?: unknown;
      teacherNote?: unknown;
      section?: unknown;
    };

    if (!isValidString(body.wordId, 100)) {
      return NextResponse.json({ success: false, error: 'wordId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('words')
      .select('id, classroom_id, dictionary_data, classroom:classrooms(teacher_id)')
      .eq('id', body.wordId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Word not found' }, { status: 404 });
    }

    const cls = existing.classroom as { teacher_id?: string } | { teacher_id?: string }[] | null;
    const teacherId = Array.isArray(cls) ? cls[0]?.teacher_id : cls?.teacher_id;
    if (teacherId !== auth.userId) {
      return forbidden('Bạn không có quyền chỉnh sửa từ này');
    }

    const updates: Record<string, unknown> = {};
    if (body.word !== undefined) {
      if (typeof body.word !== 'string' || !body.word.trim() || body.word.length > 100) {
        return NextResponse.json({ success: false, error: 'invalid word' }, { status: 400 });
      }
      updates.word = body.word.trim();
    }
    if (body.translation !== undefined) {
      if (typeof body.translation !== 'string' || body.translation.length > 1000) {
        return NextResponse.json({ success: false, error: 'invalid translation' }, { status: 400 });
      }
      updates.translation = body.translation.trim();
    }
    if (body.pos !== undefined) {
      if (typeof body.pos !== 'string' || body.pos.length > 100) {
        return NextResponse.json({ success: false, error: 'invalid pos' }, { status: 400 });
      }
      updates.pos = body.pos.trim();
    }
    if (body.ipa !== undefined) {
      if (typeof body.ipa !== 'string' || body.ipa.length > 200) {
        return NextResponse.json({ success: false, error: 'invalid ipa' }, { status: 400 });
      }
      updates.ipa = body.ipa.trim();
    }
    if (body.example !== undefined) {
      if (typeof body.example !== 'string' || body.example.length > 2000) {
        return NextResponse.json({ success: false, error: 'invalid example' }, { status: 400 });
      }
      updates.example = body.example.trim();
    }
    if (body.example_vi !== undefined) {
      if (typeof body.example_vi !== 'string' || body.example_vi.length > 2000) {
        return NextResponse.json({ success: false, error: 'invalid example_vi' }, { status: 400 });
      }
      updates.example_vi = body.example_vi.trim();
    }

    const prevDict = ((existing.dictionary_data as DictionaryData | null) || {}) as DictionaryData;
    const nextDict: DictionaryData = {
      ...prevDict,
      source: 'teacher_import',
    };

    if (body.familyWords !== undefined) {
      const cleanedFamily = sanitizeFamilyWords(body.familyWords);
      nextDict.familyWords = cleanedFamily;
    }

    if (body.teacherNote !== undefined) {
      if (typeof body.teacherNote !== 'string' || body.teacherNote.length > 2000) {
        return NextResponse.json({ success: false, error: 'invalid teacherNote' }, { status: 400 });
      }
      const note = body.teacherNote.trim();
      if (note) {
        nextDict.teacherNote = note;
      } else {
        delete nextDict.teacherNote;
      }
    }

    if (body.section !== undefined) {
      if (typeof body.section !== 'string' || body.section.length > 250) {
        return NextResponse.json({ success: false, error: 'invalid section' }, { status: 400 });
      }
      const sec = body.section.trim();
      if (sec) {
        nextDict.section = sec;
      } else {
        delete nextDict.section;
      }
    }

    updates.dictionary_data = nextDict;

    const { error: updateErr } = await supabase
      .from('words')
      .update(updates)
      .eq('id', body.wordId);

    if (updateErr) throw updateErr;

    await invalidateClassroomWordSummaryCaches(
      supabase,
      (existing as { classroom_id?: string | null }).classroom_id,
      auth.userId,
    );

    return NextResponse.json({
      success: true,
      familyWords: nextDict.familyWords || [],
      teacherNote: nextDict.teacherNote || '',
      section: nextDict.section || '',
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể lưu chỉnh sửa từ vựng');
  }
}
