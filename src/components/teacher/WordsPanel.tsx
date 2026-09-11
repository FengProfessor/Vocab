'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { Word } from '@/lib/supabase';
import {
  Plus, Loader2, Trash2, Sparkles, BookOpen, Volume2, Download,
  Pencil, X, Check, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { speak as speakEn, parseIpa } from '@/lib/study';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type AddMode = 'single' | 'bulk';

interface WordsPanelProps {
  classroomId: string;
  userId: string | null;
}

/**
 * Vocabulary management panel — embedded in the unified teacher dashboard.
 * Supports single word add, bulk add (line-by-line), and word editing.
 */
export default function WordsPanel({ classroomId, userId }: WordsPanelProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [newWord, setNewWord] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; word: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Edit Modal State
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editTranslation, setEditTranslation] = useState('');
  const [editPos, setEditPos] = useState('');
  const [editIpa, setEditIpa] = useState('');
  const [editExample, setEditExample] = useState('');
  const [editExampleVi, setEditExampleVi] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/words?classroomId=${classroomId}`);
      const data = await res.json();
      if (data.success) setWords(data.data || []);
    } catch {
      toast.error('Không tải được danh sách từ');
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !userId) return;
    setIsSaving(true);

    const targetWord = newWord.trim();
    const loadingId = Date.now();
    const optimistic: Word & { isLoading?: boolean } = {
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
    setWords(prev => [optimistic, ...prev]);
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
        setWords(prev => prev.filter(w => w.id !== optimistic.id));
        toast.info(data.message || `"${optimistic.word}" đã có trong lớp`);
      } else {
        setWords(prev => prev.map(w => w.id === optimistic.id
          ? { ...w, id: data.wordId as string, isLoading: false }
          : w));
        toast.success(`Đã thêm "${optimistic.word}" — AI đang tự động điền nghĩa ✨`);
        setTimeout(() => { void loadWords(); }, 3000);
        setTimeout(() => { void loadWords(); }, 8000);
      }
    } catch (err: unknown) {
      setWords(prev => prev.filter(w => w.id !== optimistic.id));
      const msg = err instanceof Error ? err.message : 'Không thêm được từ';
      toast.error(msg);
    }
    setIsSaving(false);
  };

function parseBulkWords(text: string): string[] {
  const tokens = text
    .split(/[\n,;]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0 && w.length <= 100 && w.split(/\s+/).length <= 4);
  return [...new Set(tokens.map(t => t.toLowerCase()))];
}

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueWords = parseBulkWords(bulkText);

    if (uniqueWords.length === 0) {
      toast.error('Vui lòng dán ít nhất 1 từ vựng hợp lệ');
      return;
    }

    setIsSaving(true);
    let addedCount = 0;
    let existCount = 0;
    let failCount = 0;

    for (let i = 0; i < uniqueWords.length; i++) {
      const word = uniqueWords[i];
      setBulkProgress({ current: i + 1, total: uniqueWords.length, word });
      try {
        const res = await authFetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, classroomId, skipAI: true }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.alreadyExists) {
            existCount++;
          } else {
            addedCount++;
          }
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Kích hoạt AI enrichment nền cho cả lớp học mà không bị nghẽn rate-limit
    if (addedCount > 0) {
      try {
        await fetch('/api/words/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classroomId }),
        });
      } catch {
        // non-fatal
      }
    }

    setBulkProgress(null);
    setIsSaving(false);
    setBulkText('');
    toast.success(`Đã thêm ${addedCount} từ mới thành công!${existCount > 0 ? ` (${existCount} từ đã có trước)` : ''}${failCount > 0 ? ` (${failCount} lỗi)` : ''}`);
    void loadWords();
    setTimeout(() => { void loadWords(); }, 4000);
    setTimeout(() => { void loadWords(); }, 9000);
  };

  const openEditModal = (w: Word) => {
    setEditingWord(w);
    setEditTranslation(w.translation || '');
    setEditPos(w.pos || '');
    setEditIpa(w.ipa || '');
    setEditExample(w.example || '');
    setEditExampleVi(w.example_vi || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;

    setIsUpdating(true);
    try {
      const res = await authFetch('/api/words', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: editingWord.id,
          translation: editTranslation.trim(),
          pos: editPos.trim(),
          ipa: editIpa.trim(),
          example: editExample.trim(),
          example_vi: editExampleVi.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật thất bại');
      }

      setWords(prev => prev.map(w => w.id === editingWord.id ? {
        ...w,
        translation: editTranslation.trim(),
        pos: editPos.trim(),
        ipa: editIpa.trim(),
        example: editExample.trim(),
        example_vi: editExampleVi.trim(),
      } : w));

      toast.success(`Đã cập nhật nghĩa & ví dụ cho "${editingWord.word}"!`);
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
    setWords(words.filter(w => w.id !== wordId));
    try {
      const res = await fetch('/api/words', {
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
    const headers = ['word', 'translation', 'pos', 'ipa', 'example', 'example_vi', 'status'];
    const rows = words.map(w => [
      w.word,
      w.translation ?? '',
      w.pos ?? '',
      w.ipa ?? '',
      (w.example ?? '').replace(/,/g, ';'),
      (w.example_vi ?? '').replace(/,/g, ';'),
      w.status ?? 'approved',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `words-${classroomId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Xuất ${words.length} từ thành công`);
  };

  const filteredWords = words.filter(w => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !w.status || w.status === 'pending';
    return w.status === statusFilter;
  });

  const parsedBulkCount = parseBulkWords(bulkText).length;

  return (
    <div className="space-y-6">
      {/* Add word form — Single vs Bulk Toggle */}
      <div className="bg-background border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Thêm từ vựng vào lớp</h2>
              <p className="text-xs text-muted-foreground">Gemini AI tự động tra IPA, từ loại, định nghĩa và câu ví dụ song ngữ</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'single'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Thêm từng từ
            </button>
            <button
              type="button"
              onClick={() => setAddMode('bulk')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                addMode === 'bulk'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Thêm hàng loạt (Bulk)
            </button>
          </div>
        </div>

        {addMode === 'single' ? (
          <form onSubmit={handleAddWord} className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              placeholder="Nhập từ tiếng Anh (vd: ephemeral, resilient, comprehensive)..."
              className="flex-1 border rounded-xl px-4 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          <form onSubmit={handleBulkAdd} className="space-y-3">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'Dán danh sách từ vựng, mỗi từ một dòng (hoặc ngăn cách bởi dấu phẩy):\napple\nsustainability\nartificial intelligence\nmeticulous'}
              rows={4}
              className="w-full border rounded-xl p-3.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono leading-relaxed"
              disabled={isSaving}
            />

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                {bulkProgress ? (
                  <span className="text-primary font-bold flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang thêm ({bulkProgress.current}/{bulkProgress.total}): {bulkProgress.word}...
                  </span>
                ) : (
                  <span>
                    Đã phát hiện: <strong className="text-foreground">{parsedBulkCount}</strong> từ
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving || parsedBulkCount === 0}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Thêm {parsedBulkCount > 0 ? `${parsedBulkCount} từ` : 'hàng loạt'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Words list */}
      <div className="bg-background border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="font-bold">Từ vựng của lớp</h2>
            <span className="text-xs text-muted-foreground">{words.length} từ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 text-xs font-semibold">
              {([
                { key: 'all', label: 'Tất cả' },
                { key: 'pending', label: 'Chờ duyệt' },
                { key: 'approved', label: 'Đã duyệt' },
                { key: 'rejected', label: 'Từ chối' },
              ] as { key: StatusFilter; label: string }[]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === f.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                  {f.key !== 'all' && (
                    <span className="ml-1 opacity-60">
                      ({words.filter(w => f.key === 'pending' ? (!w.status || w.status === 'pending') : w.status === f.key).length})
                    </span>
                  )}
                </button>
              ))}
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
                <p className="text-sm mt-1">Thêm từ đầu tiên ở trên — AI sẽ tự động phân tích và sinh ví dụ.</p>
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
              <div key={w.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm sm:text-base text-foreground">{w.word}</p>
                    {w.pos && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">
                        {w.pos}
                      </span>
                    )}
                    {w.ipa && <span className="text-xs text-muted-foreground font-mono">{parseIpa(w.ipa)}</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground/90">{w.translation}</p>
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
                </div>

                {/* Actions: Always visible on touch, hover on desktop */}
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
                    title="Sửa định nghĩa & ví dụ"
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
          <div className="bg-background border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                <p className="text-xs text-muted-foreground font-mono">Từ gốc: &ldquo;{editingWord.word}&rdquo;</p>
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
                  onChange={e => setEditTranslation(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    onChange={e => setEditPos(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                    onChange={e => setEditIpa(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Câu ví dụ tiếng Anh
                </label>
                <textarea
                  rows={2}
                  value={editExample}
                  onChange={e => setEditExample(e.target.value)}
                  placeholder="Ví dụ minh họa ngữ cảnh sử dụng từ..."
                  className="w-full border rounded-xl p-3 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
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
                  onChange={e => setEditExampleVi(e.target.value)}
                  placeholder="Bản dịch tiếng Việt của câu ví dụ..."
                  className="w-full border rounded-xl p-3 text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
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
