'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { Word, SRSProgress } from '@/lib/supabase';
import { stabilityToLevel } from '@/lib/srs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  X,
  BookOpen,
  Trash2,
  Loader2,
  Calendar,
  Repeat,
  Activity,
  ImageOff,
} from 'lucide-react';
import { ExampleWithSub } from '@/components/study/ExampleWithSub';

// Mở rộng kiểu Word để chứa các field SRS có sẵn từ join (stability, difficulty,...)
interface SRSProgressFull extends SRSProgress {
  stability?: number;
  difficulty?: number;
  last_reviewed_at?: string;
}

interface WordDetail extends Word {
  srs_progress?: SRSProgressFull[];
}

interface WordDetailModalProps {
  wordId: string | null;
  onClose: () => void;
  onDeleted?: (wordId: string) => void;
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; bar: string }> = {
  1: { bg: 'bg-rose-50', text: 'text-rose-600', bar: 'bg-rose-400' },
  2: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-400' },
  3: { bg: 'bg-sky-50', text: 'text-sky-600', bar: 'bg-sky-400' },
  4: { bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500' },
  5: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  6: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Mới học',
  2: 'Đang nhớ',
  3: 'Khá vững',
  4: 'Vững',
  5: 'Thuần thục',
  6: 'Bậc thầy',
};

function formatNextReview(iso?: string, level?: number): string {
  if (!iso) return 'Chưa có lịch';
  if (level && level >= 6) return 'Đã thành thạo';
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return 'Sẵn sàng ôn ngay';
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return 'Ôn lại: Ngày mai';
  if (days > 1) return `Ôn lại: ${days} ngày nữa`;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `Ôn lại: ${hours}h ${mins}m nữa`;
}

export function WordDetailModal({ wordId, onClose, onDeleted }: WordDetailModalProps) {
  const router = useRouter();
  const [word, setWord] = useState<WordDetail | null>(null);
  const [srs, setSrs] = useState<SRSProgressFull | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const open = wordId !== null;

  // Fetch word + srs khi wordId thay đổi
  useEffect(() => {
    if (!wordId) {
      setWord(null);
      setSrs(null);
      setImageFailed(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setImageFailed(false);

    (async () => {
      try {
        const [wordRes, sessionRes] = await Promise.all([
          supabase.from('words').select('*').eq('id', wordId).single(),
          supabase.auth.getSession(),
        ]);

        if (cancelled) return;

        if (wordRes.error || !wordRes.data) {
          toast.error('Không tải được từ. Có thể đã bị xóa.');
          onClose();
          return;
        }

        setWord(wordRes.data as WordDetail);

        const uid = sessionRes.data.session?.user.id;
        if (uid) {
          const { data: srsData } = await supabase
            .from('srs_progress')
            .select('*')
            .eq('user_id', uid)
            .eq('word_id', wordId)
            .maybeSingle();
          if (!cancelled) setSrs((srsData as SRSProgressFull) || null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('[WordDetailModal] Load error:', msg);
          toast.error('Lỗi khi tải chi tiết từ');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wordId, onClose]);

  // Đóng bằng phím Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (!word) return;
    if (!confirm(`Xóa từ "${word.word}"? Hành động này không thể hoàn tác.`)) return;

    setIsDeleting(true);
    try {
      const res = await authFetch('/api/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: word.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xóa từ');
      onDeleted?.(word.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[WordDetailModal] Delete error:', msg);
      toast.error('Không xóa được từ');
    } finally {
      setIsDeleting(false);
    }
  }, [word, onClose, onDeleted]);

  const handleReview = useCallback(() => {
    if (!word) return;
    router.push(`/review?class=${word.classroom_id}`);
  }, [router, word]);

  if (!open) return null;

  // Tính các giá trị derived
  const stability = srs?.stability ?? 0;
  const level = stabilityToLevel(stability);
  const levelColor = LEVEL_COLORS[level];
  // interval_days progress bar: max 30 ngày = 100%
  const intervalDays = srs?.interval_days ?? 0;
  const intervalPct = Math.min(100, Math.round((intervalDays / 30) * 100));
  const reviewCount = srs?.review_count ?? 0;
  const nextReviewLabel = formatNextReview(srs?.next_review_date, level);

  // Sparkline dots: số chấm = min(review_count, 5)
  const dotCount = Math.min(reviewCount, 5);
  const dots = Array.from({ length: 5 }, (_, i) => i < dotCount);

  // Lấy meanings từ dictionary_data nếu có
  const meanings = word?.dictionary_data?.results?.[0]?.meanings || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-muted transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading || !word ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Image */}
            {word.image_url && !imageFailed ? (
              <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(word.image_url)}`}
                  alt={word.word}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              </div>
            ) : (
              <div className="relative w-full h-40 overflow-hidden rounded-t-2xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                <ImageOff className="h-10 w-10" />
              </div>
            )}

            {/* Header */}
            <div className="p-6 pb-4">
              <h2 className="text-3xl font-black text-primary leading-tight break-words">
                {word.word}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {word.pos && (
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider">
                    {word.pos}
                  </Badge>
                )}
                {word.ipa && (
                  <span className="text-sm font-semibold text-muted-foreground italic">
                    {word.ipa}
                  </span>
                )}
              </div>
            </div>

            {/* Meanings */}
            <div className="px-6 pb-4 space-y-3">
              <div>
                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">
                  Nghĩa
                </h3>
                <p className="text-base font-semibold text-foreground leading-relaxed">
                  {word.translation || 'Chưa có nghĩa'}
                </p>
              </div>

              {word.example && (
                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">
                    Ví dụ
                  </h3>
                  <ExampleWithSub
                    example={word.example}
                    exampleVi={word.example_vi}
                    defaultShowVi
                    enClassName="text-sm italic text-slate-600 leading-relaxed"
                    viClassName="mt-1 text-sm font-medium text-slate-500 leading-relaxed not-italic"
                  />
                </div>
              )}

              {meanings.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">
                    Định nghĩa chi tiết
                  </h3>
                  <div className="space-y-2">
                    {meanings.slice(0, 3).map((m, idx) => (
                      <div key={idx} className="bg-white/3 rounded-lg p-3 space-y-1 text-sm">
                        {m.pos && (
                          <span className="text-[10px] font-black uppercase text-primary mr-2">
                            [{m.pos}]
                          </span>
                        )}
                        <span className="text-slate-700">{m.definition}</span>
                        {m.example && (
                          <ExampleWithSub
                            example={m.example}
                            exampleVi={m.example_vi}
                            defaultShowVi
                            className="mt-1"
                            enClassName="text-xs italic text-slate-500"
                            viClassName="mt-0.5 text-xs font-medium text-slate-400 not-italic"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SRS Progress card */}
            <div className="px-6 pb-4">
              <div className={`rounded-2xl p-4 border ${levelColor.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Tiến độ ôn tập
                  </h3>
                  <Badge className={`${levelColor.bar} text-white font-black`}>
                    Lvl {level} · {LEVEL_LABELS[level]}
                  </Badge>
                </div>

                {/* Progress bar: interval_days (max 30d = 100%) */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Khoảng cách ôn tập</span>
                    <span>{intervalDays}d / 30d</span>
                  </div>
                  <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${levelColor.bar} transition-all duration-500`}
                      style={{ width: `${intervalPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Lịch ôn</div>
                      <div className="font-bold text-slate-700 truncate">{nextReviewLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2">
                    <Repeat className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Lần ôn</div>
                      <div className="font-bold text-slate-700">{reviewCount}</div>
                    </div>
                  </div>
                </div>

                {/* Mini sparkline: dots cho 5 lần ôn gần nhất */}
                {reviewCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/60">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Lịch sử
                      </span>
                      <div className="flex items-center gap-1.5 ml-auto">
                        {dots.map((filled, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all ${
                              filled ? levelColor.bar : 'bg-white/80 border border-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Synonyms / Antonyms */}
            {(word.synonyms?.length || word.antonyms?.length) && (
              <div className="px-6 pb-4 space-y-2">
                {word.synonyms && word.synonyms.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-1">
                      Đồng nghĩa
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {word.synonyms.slice(0, 6).map((s, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms && word.antonyms.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-rose-600 mb-1">
                      Trái nghĩa
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {word.antonyms.slice(0, 6).map((s, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="px-6 pb-6 pt-2 flex gap-2 sticky bottom-0 bg-background border-t mt-2">
              <button
                onClick={handleReview}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-black shadow-md border-b-4 border-emerald-700 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all"
              >
                <BookOpen className="h-4 w-4" />
                Ôn ngay
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Xóa
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WordDetailModal;
