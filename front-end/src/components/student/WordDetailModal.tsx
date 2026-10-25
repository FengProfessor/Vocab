'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { Word, SRSProgress, RichCollocationEntry, WordFamilyEntry, DictionaryMeaning } from '@/lib/supabase';
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
  GitFork,
  Link2,
  Users,
  Sparkles,
} from 'lucide-react';
import { ExampleWithSub } from '@/components/study/ExampleWithSub';
import { parseIpa } from '@/lib/study';
import { resolveImageSrc } from '@/lib/media-url';

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

        const loadedWord = wordRes.data as WordDetail;
        setWord(loadedWord);

        // Auto-hydrate word family / meanings if missing in user's saved word
        if (!loadedWord.dictionary_data?.familyWords?.length && !loadedWord.dictionary_data?.wordFamily?.length && loadedWord.word) {
          fetch(`/api/dictionary/lookup?word=${encodeURIComponent(loadedWord.word)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((extra) => {
              if (extra && !cancelled) {
                setWord((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    dictionary_data: {
                      ...(prev.dictionary_data || {}),
                      familyWords: extra.familyWords || extra.wordFamily || prev.dictionary_data?.familyWords,
                      results: prev.dictionary_data?.results?.length ? prev.dictionary_data.results : extra.results,
                      core_senses: prev.dictionary_data?.core_senses || extra.core_senses,
                    },
                  };
                });
              }
            })
            .catch(() => {});
        }

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

  // Lấy dữ liệu nâng cao từ dictionary_data nếu có
  const dictData = word?.dictionary_data;
  const morphology = dictData?.morphology;

  const allDictMeanings: DictionaryMeaning[] = [];
  if (dictData?.core_senses && dictData.core_senses.length > 0) {
    const sortedCore = [...dictData.core_senses].sort(
      (a, b) => (a.popularity || 99) - (b.popularity || 99),
    );
    for (const cs of sortedCore) {
      allDictMeanings.push({
        definition: cs.definition_vi || cs.label_vi || cs.definition_en || '',
        label_vi: cs.label_vi,
        definition_en: cs.definition_en,
        pos: cs.pos,
        cefr: cs.cefr,
        popularity: cs.popularity,
        isPrimary: cs.popularity === 1 || allDictMeanings.length === 0,
        example: cs.example,
        example_vi: cs.example_vi,
      });
    }
  }

  if (dictData?.results) {
    for (const r of dictData.results) {
      if (r.meanings) {
        for (const m of r.meanings) {
          if (!allDictMeanings.some((x) => x.definition?.toLowerCase().trim() === m.definition?.toLowerCase().trim())) {
            allDictMeanings.push({ ...m });
          }
        }
      }
    }
  }

  if (allDictMeanings.length === 0 && dictData?.definition) {
    allDictMeanings.push({
      definition: dictData.definition,
      pos: dictData.pos,
      example: dictData.example,
      example_vi: dictData.example_vi,
      isPrimary: true,
    });
  }

  // Ensure primary meaning is sorted to index 0
  allDictMeanings.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (b.isPrimary && !a.isPrimary) return 1;
    const popA = a.popularity ?? 99;
    const popB = b.popularity ?? 99;
    return popA - popB;
  });
  if (allDictMeanings.length > 0 && !allDictMeanings.some((m) => m.isPrimary)) {
    allDictMeanings[0].isPrimary = true;
  }
  const meanings = allDictMeanings;

  const rawColls = dictData?.collocations || [];
  const meaningsColls = (dictData?.results?.flatMap(r => r.meanings?.flatMap(m => m.collocations || []) || []) || []);
  const allColls = [...rawColls, ...meaningsColls];
  const collocationsMap = new Map<string, RichCollocationEntry>();
  for (const c of allColls) {
    if (typeof c === 'string' && c.trim()) {
      if (!collocationsMap.has(c.trim().toLowerCase())) collocationsMap.set(c.trim().toLowerCase(), { phrase: c.trim() });
    } else if (c && typeof c === 'object' && c.phrase) {
      if (!collocationsMap.has(c.phrase.trim().toLowerCase())) collocationsMap.set(c.phrase.trim().toLowerCase(), c);
    }
  }
  const collocations = Array.from(collocationsMap.values());

  const rawFamily = dictData?.familyWords || dictData?.wordFamily || dictData?.word_family || [];
  const headwordLower = (word?.word || '').trim().toLowerCase();
  const parsedFamily: WordFamilyEntry[] = rawFamily.map(item => {
    if (typeof item === 'string') {
      const m = item.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/);
      if (m) {
        return { word: m[1].trim(), pos: m[2].trim(), meaning: m[3]?.trim() || undefined };
      }
      const simple = item.match(/^(.+?)\s*\(([^)]+)\)$/);
      return simple ? { word: simple[1].trim(), pos: simple[2].trim() } : { word: item.trim() };
    }
    return item;
  });
  const filteredFamily = parsedFamily.filter(f => f.word && f.word.trim().toLowerCase() !== headwordLower);
  if (morphology?.rootWord && morphology.rootWord.trim().toLowerCase() !== headwordLower) {
    const rootLower = morphology.rootWord.trim().toLowerCase();
    if (!filteredFamily.some(f => f.word.trim().toLowerCase() === rootLower)) {
      filteredFamily.unshift({
        word: morphology.rootWord.trim(),
        pos: 'từ gốc',
        meaning: morphology.rootMeaning || undefined,
      });
    }
  }
  const familyWords: WordFamilyEntry[] = filteredFamily.length > 0
    ? filteredFamily
    : parsedFamily.filter(f => f.word && (f.pos || f.meaning));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-background rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center p-2 rounded-full bg-background/80 backdrop-blur hover:bg-muted transition-colors"
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
              <div className="relative w-full h-44 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageSrc(word.image_url)}
                  referrerPolicy="no-referrer"
                  alt={word.word}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              </div>
            ) : null}

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
                  <span className="text-sm font-semibold text-muted-foreground font-mono">
                    {parseIpa(word.ipa)}
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
                    autoTranslateIfMissing
                    showSlowAudio
                    enClassName="text-sm italic text-slate-600 dark:text-slate-300 leading-relaxed"
                    viClassName="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed not-italic"
                  />
                </div>
              )}

              {meanings.length > 0 && (
                <div className="space-y-3">
                  {/* Primary / Most Common Meaning */}
                  {meanings[0] && (
                    <div className="rounded-xl p-3.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 dark:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          Nghĩa phổ biến nhất
                        </span>
                        {meanings[0].pos && (
                          <span className="text-[10px] font-black uppercase text-primary px-1.5 py-0.5 rounded bg-muted/80">
                            [{meanings[0].pos}]
                          </span>
                        )}
                        {meanings[0].cefr && (
                          <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {meanings[0].cefr}
                          </span>
                        )}
                      </div>
                      <p className="text-foreground font-bold text-base leading-snug">{meanings[0].definition}</p>
                      {meanings[0].definition_en && meanings[0].definition_en !== meanings[0].definition && (
                        <p className="text-xs text-muted-foreground italic leading-snug">{meanings[0].definition_en}</p>
                      )}
                      {meanings[0].example && (
                        <div className="pt-1.5 border-t border-amber-500/20">
                          <ExampleWithSub
                            example={meanings[0].example}
                            exampleVi={meanings[0].example_vi || (meanings[0].example?.trim() === word.example?.trim() ? word.example_vi : undefined)}
                            defaultShowVi
                            showSlowAudio
                            className="mt-1"
                            enClassName="text-xs italic text-slate-700 dark:text-slate-300"
                            viClassName="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 not-italic"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Secondary Meanings */}
                  {meanings.length > 1 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Các nghĩa khác ({meanings.length - 1})
                        </h4>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>
                      <div className="space-y-2">
                        {meanings.slice(1, 4).map((m, idx) => (
                          <div key={idx} className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm border border-border/40">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-muted-foreground min-w-[1rem]">{idx + 1}.</span>
                              {m.pos && (
                                <span className="text-[10px] font-black uppercase text-primary">
                                  [{m.pos}]
                                </span>
                              )}
                              {m.cefr && (
                                <span className="text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded">
                                  {m.cefr}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">{m.definition}</p>
                            {m.definition_en && m.definition_en !== m.definition && (
                              <p className="text-xs text-muted-foreground italic">{m.definition_en}</p>
                            )}
                            {m.example && (
                              <ExampleWithSub
                                example={m.example}
                                exampleVi={m.example_vi}
                                defaultShowVi
                                className="mt-1"
                                enClassName="text-xs italic text-slate-500 dark:text-slate-400"
                                viClassName="mt-0.5 text-xs font-medium text-slate-400 not-italic"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

            {/* Morphology / Cấu tạo từ */}
            {morphology && (morphology.rootWord || (morphology.prefixes?.length ?? 0) > 0 || (morphology.suffixes?.length ?? 0) > 0) && (
              <div className="px-6 pb-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-amber-700 dark:text-amber-400">
                    <GitFork className="h-3.5 w-3.5" />
                    <span>Cấu tạo từ (Morphology)</span>
                  </div>
                  {morphology.rootWord && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-muted-foreground">Từ gốc: </span>
                      <strong className="text-primary">{morphology.rootWord}</strong>
                      {morphology.rootMeaning && <span className="text-muted-foreground ml-1">({morphology.rootMeaning})</span>}
                    </p>
                  )}
                  {(morphology.prefixes?.length ?? 0) > 0 && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-muted-foreground">Tiền tố: </span>
                      {morphology.prefixes!.map((p, i) => (
                        <span key={i} className="mr-2 inline-block">
                          <code className="bg-white/60 dark:bg-black/40 px-1 rounded text-[10px]">{p.affix}</code> {p.meaning_vi ? `(${p.meaning_vi})` : ''}
                        </span>
                      ))}
                    </p>
                  )}
                  {(morphology.suffixes?.length ?? 0) > 0 && (
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-muted-foreground">Hậu tố: </span>
                      {morphology.suffixes!.map((s, i) => (
                        <span key={i} className="mr-2 inline-block">
                          <code className="bg-white/60 dark:bg-black/40 px-1 rounded text-[10px]">{s.affix}</code> {s.meaning_vi ? `(${s.meaning_vi})` : ''}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Collocations */}
            {collocations.length > 0 && (
              <div className="px-6 pb-4 space-y-1.5">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Collocations (Cụm từ đi kèm)
                </h4>
                <div className="space-y-1">
                  {collocations.slice(0, 4).map((col, i) => (
                    <div key={i} className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{col.phrase}</span>
                        {col.type && <span className="ml-1.5 text-[9px] uppercase font-bold text-indigo-500">[{col.type}]</span>}
                        {col.meaning_vi && <p className="text-[11px] text-muted-foreground">{col.meaning_vi}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Word Family */}
            {familyWords.length > 0 && (
              <div className="px-6 pb-4 space-y-1.5">
                <h4 className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Họ từ vựng ({familyWords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {familyWords.map((fw, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(`/dictionary?q=${encodeURIComponent(fw.word)}`);
                      }}
                      className="text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors text-left group"
                      title={`Tra từ ${fw.word}`}
                    >
                      <strong className="font-semibold group-hover:underline">{fw.word}</strong>
                      {fw.pos && <span className="text-[10px] italic opacity-80">({fw.pos})</span>}
                      {fw.meaning && <span className="text-[11px] opacity-90">: {fw.meaning}</span>}
                    </button>
                  ))}
                </div>
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
