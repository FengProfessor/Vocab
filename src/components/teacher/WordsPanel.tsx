'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { Word, WordFamilyEntry } from '@/lib/supabase';
import {
  Plus,
  Loader2,
  Trash2,
  Sparkles,
  BookOpen,
  BookMarked,
  Volume2,
  Download,
  Pencil,
  X,
  Check,
  FileSpreadsheet,
  ClipboardPaste,
  Search,
  Users,
  StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { speak as speakEn, parseIpa } from '@/lib/study';
import {
  formatFamilyWordsForEditor,
  parseFamilyWordsFromEditor,
} from '@/lib/teacher-vocab-import';
import VocabImportPanel from '@/components/teacher/VocabImportPanel';

type AddMode = 'presets' | 'file' | 'paste' | 'single';

interface TeacherWord extends Word {
  familyWords?: WordFamilyEntry[];
  teacherNote?: string;
  section?: string;
  source?: string;
  isLoading?: boolean;
}

interface WordsPanelProps {
  classroomId: string;
  userId: string | null;
}

function escapeCsvCell(val: string): string {
  const s = val ?? '';
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Vocabulary management panel — embedded in the unified teacher dashboard.
 * Supports Word/Excel/CSV upload, pasted table import, single word AI add, and full editing.
 */
export default function WordsPanel({ classroomId, userId }: WordsPanelProps) {
  const [words, setWords] = useState<TeacherWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('presets');
  const [newWord, setNewWord] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [onlyWithFamily, setOnlyWithFamily] = useState(false);

  // Edit Modal State
  const [editingWord, setEditingWord] = useState<TeacherWord | null>(null);
  const [editTranslation, setEditTranslation] = useState('');
  const [editPos, setEditPos] = useState('');
  const [editIpa, setEditIpa] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editExampleVi, setEditExampleVi] = useState('');
  const [editFamilyText, setEditFamilyText] = useState('');
  const [editTeacherNote, setEditTeacherNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/teacher/words?classroomId=${encodeURIComponent(classroomId)}`);
      const data = (await res.json()) as { success?: boolean; data?: TeacherWord[]; error?: string };
      if (data.success) {
        setWords(data.data || []);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error('Không tải được danh sách từ');
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !userId) return;
    setIsSaving(true);

    const targetWord = newWord.trim();
    const loadingId = Date.now();
    const optimistic: TeacherWord = {
      id: `loading-${loadingId}`,
      classroom_id: classroomId,
      word: targetWord,
      translation: '⏳ Đang phân tích bằng AI...',
      ipa: '',
      pos: '',
      example: '',
      created_at: new Date().toISOString(),
      isLoading: true,
    };
    setWords((prev) => [optimistic, ...prev]);
    setNewWord('');

    try {
      const res = await authFetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: optimistic.word, classroomId }),
      });
      const data = await res.json();

      if (data.error === 'FREE_WORD_LIMIT') {
        setWords((prev) => prev.filter((w) => w.id !== optimistic.id));
        const { requestUpsell, upsellFromWordLimitError } = await import('@/lib/upsell');
        requestUpsell(upsellFromWordLimitError(data));
        toast.error(data.message || 'Đã đủ hạn mức lưu từ tháng này');
        setIsSaving(false);
        return;
      }

      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');

      if (data.alreadyExists) {
        setWords((prev) => prev.filter((w) => w.id !== optimistic.id));
        toast.info(data.message || `"${optimistic.word}" đã có trong lớp`);
      } else {
        setWords((prev) =>
          prev.map((w) =>
            w.id === optimistic.id ? { ...w, id: data.wordId as string, isLoading: false } : w,
          ),
        );
        toast.success(`Đã thêm "${optimistic.word}" — AI đang tự động điền nghĩa ✨`);
        setTimeout(() => {
          void loadWords();
        }, 3000);
        setTimeout(() => {
          void loadWords();
        }, 8000);
      }
    } catch (err: unknown) {
      setWords((prev) => prev.filter((w) => w.id !== optimistic.id));
      const msg = err instanceof Error ? err.message : 'Không thêm được từ';
      toast.error(msg);
    }
    setIsSaving(false);
  };

  const openEditModal = (w: TeacherWord) => {
    setEditingWord(w);
    setEditTranslation(w.translation || '');
    setEditPos(w.pos || '');
    setEditIpa(w.ipa || '');
    setEditExample(w.example || '');
    setEditExampleVi(w.example_vi || '');
    setEditFamilyText(formatFamilyWordsForEditor(w.familyWords));
    setEditTeacherNote(w.teacherNote || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;

    const parsedFamily = parseFamilyWordsFromEditor(editFamilyText);
    const trimmedNote = editTeacherNote.trim();

    setIsUpdating(true);
    try {
      const res = await authFetch('/api/teacher/words', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: editingWord.id,
          translation: editTranslation.trim(),
          pos: editPos.trim(),
          ipa: editIpa.trim(),
          example: editExample.trim(),
          example_vi: editExampleVi.trim(),
          familyWords: parsedFamily,
          teacherNote: trimmedNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật thất bại');
      }

      setWords((prev) =>
        prev.map((w) =>
          w.id === editingWord.id
            ? {
                ...w,
                translation: editTranslation.trim(),
                pos: editPos.trim(),
                ipa: editIpa.trim(),
                example: editExample.trim(),
                example_vi: editExampleVi.trim(),
                familyWords: parsedFamily,
                teacherNote: trimmedNote,
              }
            : w,
        ),
      );

      toast.success(`Đã cập nhật "${editingWord.word}"!`);
      setEditingWord(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu thay đổi';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (wordId: string, word: string) => {
    if (!confirm(`Xóa "${word}"? Toàn bộ tiến độ SRS của học sinh cho từ này cũng sẽ bị xóa.`)) return;
    const prev = words;
    setWords(words.filter((w) => w.id !== wordId));
    try {
      const res = await authFetch('/api/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(`Đã xóa "${word}".`);
    } catch {
      setWords(prev);
      toast.error('Không xóa được từ');
    }
  };

  const speak = (text: string) => {
    speakEn(text, 1.0);
  };

  const exportToCSV = () => {
    if (words.length === 0) return;
    const headers = [
      'word',
      'translation',
      'pos',
      'ipa',
      'example',
      'example_vi',
      'family_words',
      'teacher_note',
      'section',
    ];
    const rows = words.map((w) => [
      w.word,
      w.translation ?? '',
      w.pos ?? '',
      w.ipa ?? '',
      w.example ?? '',
      w.example_vi ?? '',
      formatFamilyWordsForEditor(w.familyWords).replace(/\n/g, ' | '),
      w.teacherNote ?? '',
      w.section ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `words-${classroomId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Xuất ${words.length} từ thành công`);
  };

  const availableSections = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    for (const w of words) {
      if (w.section && !seen.has(w.section)) {
        seen.add(w.section);
        list.push(w.section);
      }
    }
    return list;
  }, [words]);

  const activeSectionFilter =
    sectionFilter !== 'all' && availableSections.includes(sectionFilter)
      ? sectionFilter
      : 'all';

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return words.filter((w) => {
      if (activeSectionFilter !== 'all' && (w.section || '') !== activeSectionFilter) return false;
      if (onlyWithFamily && (!w.familyWords || w.familyWords.length === 0)) return false;
      if (!q) return true;
      const inWord = w.word.toLowerCase().includes(q);
      const inTrans = (w.translation || '').toLowerCase().includes(q);
      const inNote = (w.teacherNote || '').toLowerCase().includes(q);
      const inFam = (w.familyWords || []).some(
        (fw) => fw.word.toLowerCase().includes(q) || (fw.meaning || '').toLowerCase().includes(q),
      );
      return inWord || inTrans || inNote || inFam;
    });
  }, [words, searchQuery, activeSectionFilter, onlyWithFamily]);

  const existingWordKeys = useMemo(
    () => words.map((w) => w.word.trim().toLowerCase()).filter(Boolean),
    [words],
  );

  return (
    <div className="space-y-6">
      {/* Add / Import words card */}
      <div className="bg-background border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Giao từ vựng cho lớp</h2>
              <p className="text-xs text-muted-foreground">
                Chọn gói bài học lớp 11, tải file Word/Excel, dán bảng hoặc thêm từng từ — giữ nguyên 100% nghĩa giáo viên soạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold flex-wrap">
            <button
              type="button"
              onClick={() => setAddMode('presets')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'presets'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookMarked className="h-3.5 w-3.5" />
              Gói có sẵn (Lớp 11)
            </button>
            <button
              type="button"
              onClick={() => setAddMode('file')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'file'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Nhập file Word/Excel
            </button>
            <button
              type="button"
              onClick={() => setAddMode('paste')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'paste'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Dán bảng / Hàng loạt
            </button>
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'single'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm từng từ
            </button>
          </div>
        </div>

        {addMode === 'single' ? (
          <form onSubmit={handleAddWord} className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Nhập từ tiếng Anh (vd: ephemeral, resilient, comprehensive)..."
              className="flex-1 border rounded-xl px-4 py-2.5 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isSaving}
            />
            <button
              type="submit"
              disabled={isSaving || !newWord.trim()}
              className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm whitespace-nowrap active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Thêm từ
            </button>
          </form>
        ) : (
          <VocabImportPanel
            classroomId={classroomId}
            mode={addMode}
            existingWordKeys={existingWordKeys}
            onImported={() => {
              void loadWords();
            }}
          />
        )}
      </div>

      {/* Words list */}
      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="font-bold">Từ vựng của lớp</h2>
              <span className="text-xs text-muted-foreground">
                {filteredWords.length === words.length
                  ? `${words.length} từ`
                  : `${filteredWords.length}/${words.length} từ`}
              </span>
            </div>

            {words.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border rounded-lg px-3 py-1.5 hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Xuất danh sách ra file CSV"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            )}
          </div>

          {words.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm từ, nghĩa, họ từ hoặc ghi chú..."
                  className="w-full rounded-xl border bg-muted/20 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {availableSections.length > 0 && (
                <select
                  value={activeSectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="max-w-[240px] rounded-xl border bg-muted/20 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">Tất cả phần ({words.length})</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setOnlyWithFamily((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  onlyWithFamily
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Có họ từ
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            {words.length === 0 ? (
              <>
                <p className="font-semibold text-foreground">Chưa có từ nào trong lớp</p>
                <p className="text-sm mt-1">
                  Tải file Word/Excel, dán bảng từ vựng hoặc thêm từng từ ở trên.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">Không tìm thấy từ nào</p>
                <p className="text-sm mt-1">Không có từ nào khớp với bộ lọc hiện tại.</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredWords.map((w) => (
              <div
                key={w.id}
                className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm sm:text-base text-foreground">{w.word}</p>
                    {w.pos && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">
                        {w.pos}
                      </span>
                    )}
                    {w.ipa && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {parseIpa(w.ipa) || w.ipa}
                      </span>
                    )}
                    {w.section && (
                      <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-md max-w-[260px] truncate">
                        {w.section}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-foreground/90 whitespace-pre-line">
                    {w.translation}
                  </p>

                  {w.example && (
                    <div className="mt-1.5 border-l-2 border-primary/30 pl-2.5">
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        &quot;{w.example}&quot;
                      </p>
                      {w.example_vi && (
                        <p className="mt-0.5 text-xs text-muted-foreground/80 leading-relaxed">
                          {w.example_vi}
                        </p>
                      )}
                    </div>
                  )}

                  {w.familyWords && w.familyWords.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-sky-700 inline-flex items-center gap-1 mr-0.5">
                        <Users className="h-3 w-3" /> Họ từ tham khảo:
                      </span>
                      {w.familyWords.map((fw, idx) => (
                        <span
                          key={`${fw.word}-${idx}`}
                          className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md"
                        >
                          <strong className="font-semibold">{fw.word}</strong>
                          {fw.pos && <span className="ml-1 italic opacity-80">({fw.pos})</span>}
                          {fw.meaning && <span className="opacity-90">: {fw.meaning}</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {w.teacherNote && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-200/70 rounded-lg px-2.5 py-1.5">
                      <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line">{w.teacherNote}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speak(w.word)}
                    className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors touch-manipulation"
                    title="Phát âm"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(w)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation"
                    title="Sửa định nghĩa, họ từ & ghi chú"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w.id, w.word)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100 touch-manipulation"
                    title="Xóa từ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Chỉnh sửa từ vựng */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => !isUpdating && setEditingWord(null)}
              className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Chỉnh sửa từ vựng</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Từ gốc: &ldquo;{editingWord.word}&rdquo;
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Định nghĩa / Nghĩa tiếng Việt <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTranslation}
                  onChange={(e) => setEditTranslation(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isUpdating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Từ loại (POS)
                  </label>
                  <input
                    type="text"
                    placeholder="noun, verb, adj..."
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Phiên âm (IPA)
                  </label>
                  <input
                    type="text"
                    placeholder="/.../"
                    value={editIpa}
                    onChange={(e) => setEditIpa(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Họ từ tham khảo (mỗi dòng: word (pos): nghĩa)
                </label>
                <textarea
                  rows={3}
                  value={editFamilyText}
                  onChange={(e) => setEditFamilyText(e.target.value)}
                  placeholder={'Antibacterial (adj): kháng khuẩn\nBalanced (adj): cân đối, cân bằng'}
                  className="w-full border rounded-xl p-3 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Ghi chú / Cấu trúc (chỉ tham khảo)
                </label>
                <textarea
                  rows={2}
                  value={editTeacherNote}
                  onChange={(e) => setEditTeacherNote(e.target.value)}
                  placeholder="Cấu trúc, đồng nghĩa hoặc ghi chú cho học sinh..."
                  className="w-full border rounded-xl p-3 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Câu ví dụ tiếng Anh
                </label>
                <textarea
                  rows={2}
                  value={editExample}
                  onChange={(e) => setEditExample(e.target.value)}
                  placeholder="Ví dụ minh họa ngữ cảnh sử dụng từ..."
                  className="w-full border rounded-xl p-3 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Dịch nghĩa câu ví dụ (tiếng Việt)
                </label>
                <textarea
                  rows={2}
                  value={editExampleVi}
                  onChange={(e) => setEditExampleVi(e.target.value)}
                  placeholder="Bản dịch tiếng Việt của câu ví dụ..."
                  className="w-full border rounded-xl p-3 text-base sm:text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingWord(null)}
                  disabled={isUpdating}
                  className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editTranslation.trim()}
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
