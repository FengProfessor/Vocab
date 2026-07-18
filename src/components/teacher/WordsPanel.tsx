'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { Word } from '@/lib/supabase';
import { Plus, Loader2, Trash2, Sparkles, BookOpen, Volume2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { speak as speakEn } from '@/lib/study';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface WordsPanelProps {
  classroomId: string;
  userId: string | null;
}

/**
 * Vocabulary management panel — embedded in the unified teacher dashboard.
 * Lifts the standalone /teacher/words page logic into a self-contained component.
 */
export default function WordsPanel({ classroomId, userId }: WordsPanelProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

    const loadingId = Date.now();
    const optimistic: Word & { isLoading?: boolean } = {
      id: `loading-${loadingId}`,
      classroom_id: classroomId,
      word: newWord.trim(),
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
        // POST chỉ trả wordId; AI enrichment chạy nền → gắn id thật, refetch để lấy nghĩa/IPA
        setWords(prev => prev.map(w => w.id === optimistic.id
          ? { ...w, id: data.wordId as string, isLoading: false }
          : w));
        toast.success(`Đã thêm "${optimistic.word}" — AI đang điền nghĩa ✨`);
        setTimeout(() => { void loadWords(); }, 3000);
        setTimeout(() => { void loadWords(); }, 9000);
      }
    } catch (err: unknown) {
      setWords(prev => prev.filter(w => w.id !== optimistic.id));
      const msg = err instanceof Error ? err.message : 'Không thêm được từ';
      toast.error(msg);
    }
    setIsSaving(false);
  };

  const handleDelete = async (wordId: string, word: string) => {
    if (!confirm(`Xóa "${word}"? Toàn bộ tiến độ SRS của học sinh cũng bị xóa.`)) return;
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
    const headers = ['word', 'translation', 'pos', 'ipa', 'example', 'status'];
    const rows = words.map(w => [
      w.word,
      w.translation ?? '',
      w.pos ?? '',
      w.ipa ?? '',
      (w.example ?? '').replace(/,/g, ';'),
      w.status ?? 'approved',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
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

  return (
    <div className="space-y-6">
      {/* Add word form — 1 chạm: gõ + Enter */}
      <div className="bg-background border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">Thêm từ vựng</h2>
            <p className="text-xs text-muted-foreground">Gemini AI tự điền IPA, nghĩa và ví dụ</p>
          </div>
        </div>
        <form onSubmit={handleAddWord} className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            placeholder="Nhập từ tiếng Anh (vd: ephemeral)..."
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={isSaving}
          />
          <button
            type="submit"
            disabled={isSaving || !newWord.trim()}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Thêm
          </button>
        </form>
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
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground border rounded-lg px-3 py-1.5 hover:text-foreground hover:bg-muted/50 transition-colors"
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
                <p className="font-semibold">Chưa có từ nào</p>
                <p className="text-sm mt-1">Thêm từ đầu tiên ở trên — AI sẽ phân tích ngay.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Không có từ nào</p>
                <p className="text-sm mt-1">Không tìm thấy từ với bộ lọc này.</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredWords.map((w) => (
              <div key={w.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold">{w.word}</p>
                    {w.pos && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">
                        {w.pos}
                      </span>
                    )}
                    {w.ipa && <span className="text-xs text-muted-foreground font-mono">{w.ipa}</span>}
                  </div>
                  <p className="text-sm font-semibold text-foreground/90">{w.translation}</p>
                  {w.example && (
                    <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-primary/30 pl-2 leading-relaxed">
                      &quot;{w.example}&quot;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speak(w.word)}
                    className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w.id, w.word)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/5 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
